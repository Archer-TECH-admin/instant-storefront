import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate, { CrossSellItem } from "@modules/products/templates"
import ProductPreview from "@modules/products/components/product-preview"
import { HttpTypes } from "@medusajs/types"
import { fetchPromotions, showOn } from "@lib/enonic/promotions"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | Medusa Store`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Medusa Store`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

async function fetchProductsByHandles(
  handles: string[],
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> {
  const results = await Promise.all(
    handles.map((h) =>
      listProducts({ countryCode, queryParams: { handle: h } }).then(
        (r) => r.response.products[0] ?? null
      )
    )
  )
  return results.filter((p): p is HttpTypes.StoreProduct => p !== null)
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const selectedVariantId = searchParams.v_id

  const [region, pricedProduct, promotions] = await Promise.all([
    getRegion(params.countryCode),
    listProducts({
      countryCode: params.countryCode,
      queryParams: { handle: params.handle },
    }).then(({ response }) => response.products[0]),
    fetchPromotions(params.handle),
  ])

  if (!region) {
    notFound()
  }

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  const showUpsell =
    promotions.upsellProducts.length > 0 && showOn(promotions.upsellPlacement, "pdp")
  const showCrossSell =
    promotions.crossSellProducts.length > 0 &&
    showOn(promotions.crossSellPlacement, "pdp")

  const [upsellData, crossSellRaw] = await Promise.all([
    showUpsell
      ? fetchProductsByHandles(promotions.upsellProducts, params.countryCode)
      : Promise.resolve([]),
    showCrossSell
      ? fetchProductsByHandles(promotions.crossSellProducts, params.countryCode)
      : Promise.resolve([]),
  ])

  const crossSellData: CrossSellItem[] = crossSellRaw.map((p) => ({
    id: p.id!,
    title: p.title!,
    thumbnail: p.thumbnail ?? null,
    handle: p.handle!,
  }))

  return (
    <>
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images ?? []}
        crossSellProducts={crossSellData}
      />

      {upsellData.length > 0 && (
        <section className="content-container py-12 border-t border-ui-border-base">
          <h2 className="text-2xl-semi mb-8">You might also like</h2>
          <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-8">
            {upsellData.map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} />
              </li>
            ))}
          </ul>
        </section>
      )}

    </>
  )
}
