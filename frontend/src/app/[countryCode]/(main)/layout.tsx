import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { draftMode } from "next/headers"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  // In Content Studio preview mode, render Nav + Footer (they use Enonic data
  // and show the effect of site-settings changes) but skip the cart/customer
  // Medusa calls which are irrelevant in the CS context.
  const { isEnabled: isDraftMode } = await draftMode()
  if (isDraftMode) {
    return (
      <>
        <Nav />
        {props.children}
        <Footer />
      </>
    )
  }

  const customer = await retrieveCustomer()
  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  return (
    <>
      <Nav />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <Footer />
    </>
  )
}
