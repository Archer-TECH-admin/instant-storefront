const ENONIC_API = process.env.ENONIC_API || "http://localhost:8080/site"
const PROJECT = "hmdb"
const BRANCH = "master"

export type Promotions = {
  upsellProducts: string[]
  upsellPlacement: string[]
  crossSellProducts: string[]
  crossSellPlacement: string[]
}

function empty(): Promotions {
  return { upsellProducts: [], upsellPlacement: [], crossSellProducts: [], crossSellPlacement: [] }
}

function toArray(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string")
  if (typeof v === "string") return [v]
  return []
}

export async function fetchPromotions(productHandle: string): Promise<Promotions> {
  const query = `{
    guillotine {
      query(
        contentTypes: ["com.enonic.app.hmdb:product-promotions"]
        query: "data.relatedProduct = '${productHandle}'"
        first: 1
      ) {
        dataAsJson
      }
    }
  }`

  try {
    const res = await fetch(`${ENONIC_API}/${PROJECT}/${BRANCH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
    })

    if (!res.ok) return empty()

    const json = await res.json()
    const raw = json?.data?.guillotine?.query?.[0]?.dataAsJson
    if (!raw) return empty()

    const data: Record<string, unknown> = typeof raw === "string" ? JSON.parse(raw) : raw

    return {
      upsellProducts: toArray(data?.upsellProducts),
      upsellPlacement: toArray((data?.upsellPlacement as Record<string, unknown> | undefined)?._selected),
      crossSellProducts: toArray(data?.crossSellProducts),
      crossSellPlacement: toArray((data?.crossSellPlacement as Record<string, unknown> | undefined)?._selected),
    }
  } catch {
    return empty()
  }
}

export function showOn(placement: string[], page: "pdp" | "cart"): boolean {
  return placement.length === 0 || placement.includes(page)
}
