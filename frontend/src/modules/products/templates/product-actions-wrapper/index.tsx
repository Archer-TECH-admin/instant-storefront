import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"
import { CrossSellItem } from "@modules/products/templates"

export default async function ProductActionsWrapper({
  id,
  region,
  crossSellProducts,
}: {
  id: string
  region: HttpTypes.StoreRegion
  crossSellProducts?: CrossSellItem[]
}) {
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
  }).then(({ response }) => response.products[0])

  if (!product) {
    return null
  }

  return <ProductActions product={product} region={region} crossSellProducts={crossSellProducts} />
}
