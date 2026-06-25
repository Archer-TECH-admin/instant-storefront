import { fetchCollections } from "@lib/enonic/collections"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function EditorialCollectionsPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const collections = await fetchCollections()

  if (!region) {
    return <div className="content-container py-12">Region not found.</div>
  }

  return (
    <div className="content-container py-12">
      <h1 className="text-2xl-semi mb-8">Editorial Collections</h1>
      <div className="flex flex-col gap-y-16">
        {collections.map((collection, idx) => {
          const handles = (collection.data?.featuredProducts || []).filter(Boolean)
          return (
            <CollectionBlock
              key={idx}
              displayName={collection.displayName}
              description={collection.data?.description}
              handles={handles}
              countryCode={params.countryCode}
              regionId={region.id}
            />
          )
        })}
      </div>
    </div>
  )
}

async function CollectionBlock({
  displayName,
  description,
  handles,
  countryCode,
  regionId,
}: {
  displayName: string
  description?: string
  handles: string[]
  countryCode: string
  regionId: string
}) {
  if (!handles.length) {
    return null
  }

  const { response } = await listProducts({
    countryCode,
    queryParams: { handle: handles } as never,
  })

  const products = response.products

  return (
    <section>
      <h2 className="text-xl-semi mb-2">{displayName}</h2>
      {description && <p className="text-base-regular text-ui-fg-subtle mb-6">{description}</p>}
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
                  alt={product.title || ""}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <p className="text-base-regular mt-2">{product.title}</p>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
