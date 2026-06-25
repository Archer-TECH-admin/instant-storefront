import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { fetchCollections, fetchCollectionByHandle } from "@lib/enonic/collections"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
}

export async function generateStaticParams() {
  const [collections, regions] = await Promise.all([
    fetchCollections(),
    listRegions(),
  ])

  const countryCodes = regions
    .flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
    .filter(Boolean) as string[]

  return countryCodes.flatMap((countryCode) =>
    collections
      .filter((c) => c._name)
      .map((c) => ({ countryCode, handle: c._name }))
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const collection = await fetchCollectionByHandle(handle)
  if (!collection) return {}
  return {
    title: `${collection.displayName} | Collections`,
    description: collection.data?.description ?? collection.displayName,
  }
}

export default async function EditorialCollectionPage(props: Props) {
  const { handle, countryCode } = await props.params
  const [collection, region] = await Promise.all([
    fetchCollectionByHandle(handle),
    getRegion(countryCode),
  ])

  if (!collection || !region) {
    notFound()
  }

  const handles = (collection.data?.featuredProducts ?? []).filter(Boolean)

  const products =
    handles.length > 0
      ? await listProducts({
          countryCode,
          queryParams: { handle: handles } as never,
        }).then(({ response }) => response.products)
      : []

  return (
    <div className="content-container py-12">
      <div className="mb-10">
        <h1 className="text-2xl-semi mb-3">{collection.displayName}</h1>
        {collection.data?.description && (
          <p className="text-base-regular text-ui-fg-subtle max-w-2xl">
            {collection.data.description}
          </p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 small:grid-cols-3 gap-6">
          {products.map((product) => (
            <LocalizedClientLink
              key={product.id}
              href={`/products/${product.handle}`}
              className="group"
            >
              <div className="aspect-square w-full overflow-hidden bg-ui-bg-subtle relative rounded-large">
                {product.thumbnail && (
                  <Image
                    src={product.thumbnail}
                    alt={product.title ?? ""}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <p className="text-base-regular mt-2">{product.title}</p>
            </LocalizedClientLink>
          ))}
        </div>
      ) : (
        <p className="text-ui-fg-muted text-base-regular">
          No products in this collection yet.
        </p>
      )}
    </div>
  )
}
