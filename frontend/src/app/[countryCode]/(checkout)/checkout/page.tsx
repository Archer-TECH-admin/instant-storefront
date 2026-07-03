import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import ProductPreview from "@modules/products/components/product-preview"
import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchPromotions, showOn } from "@lib/enonic/promotions"

export const metadata: Metadata = {
  title: "Checkout",
}

type Props = {
  params: Promise<{ countryCode: string }>
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

export default async function Checkout({ params }: Props) {
  const { countryCode } = await params
  const [cart, customer, region] = await Promise.all([
    retrieveCart(),
    retrieveCustomer(),
    getRegion(countryCode),
  ])

  if (!cart) {
    return notFound()
  }

  const productHandles = Array.from(
    new Set(
      (cart.items ?? [])
        .map((item) => item.product?.handle)
        .filter((h): h is string => !!h)
    )
  )

  const allPromotions = await Promise.all(productHandles.map(fetchPromotions))

  const upsellHandles = Array.from(
    new Set(
      allPromotions.flatMap((p) =>
        showOn(p.upsellPlacement, "checkout") ? p.upsellProducts : []
      )
    )
  )

  const crossSellHandles = Array.from(
    new Set(
      allPromotions.flatMap((p) =>
        showOn(p.crossSellPlacement, "checkout") ? p.crossSellProducts : []
      )
    )
  )

  const [upsellData, crossSellData] = await Promise.all([
    upsellHandles.length > 0
      ? fetchProductsByHandles(upsellHandles, countryCode)
      : Promise.resolve([]),
    crossSellHandles.length > 0
      ? fetchProductsByHandles(crossSellHandles, countryCode)
      : Promise.resolve([]),
  ])

  return (
    <>
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
        <CheckoutSummary cart={cart} />
      </div>

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
