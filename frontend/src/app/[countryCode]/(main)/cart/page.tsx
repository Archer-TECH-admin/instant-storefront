import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import CartTemplate from "@modules/cart/templates"
import ProductPreview from "@modules/products/components/product-preview"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCartPromotions } from "@lib/enonic/cart-promotions"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function Cart({ params }: Props) {
  const { countryCode } = await params

  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const [customer, region, { upsellData, crossSellData }] = await Promise.all([
    retrieveCustomer(),
    getRegion(countryCode),
    getCartPromotions(cart, countryCode),
  ])

  return (
    <>
      <CartTemplate cart={cart} customer={customer} />

      {(upsellData.length > 0 || crossSellData.length > 0) && region && (
        <div className="content-container pb-12">
          {upsellData.length > 0 && (
            <section className="border-t border-ui-border-base pt-8 mb-8">
              <h2 className="text-2xl-semi mb-6">Upgrade your order</h2>
              <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-8">
                {upsellData.map((product) => (
                  <li key={product.id}>
                    <ProductPreview product={product} region={region} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {crossSellData.length > 0 && (
            <section className="border-t border-ui-border-base pt-8">
              <h2 className="text-2xl-semi mb-6">You may also need</h2>
              <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-8">
                {crossSellData.map((product) => (
                  <li key={product.id}>
                    <ProductPreview product={product} region={region} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  )
}
