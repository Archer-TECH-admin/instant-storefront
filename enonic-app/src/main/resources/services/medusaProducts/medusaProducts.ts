import httpClient from "/lib/http-client"

type MedusaProduct = {
  id: string
  title: string
  handle: string
  thumbnail?: string
  description?: string
}

const BACKEND_URL = "http://localhost:9000"
const PUBLISHABLE_KEY = "pk_c238bc08b8c027a19f13b73b02577c278007b5b294d1cc94942f31e86abf6c17"

export function GET(request: {
  params: { query?: string; start?: string; count?: string; ids?: string[] }
}) {
  const query = request.params.query || ""
  const start = parseInt(request.params.start || "0", 10)
  const count = parseInt(request.params.count || "10", 10)

  try {
    const url = `${BACKEND_URL}/store/products?limit=${count}&offset=${start}` +
      (query ? `&q=${encodeURIComponent(query)}` : "")

    const response = httpClient.request({
      url,
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      contentType: "application/json",
    })

    if (response.status !== 200) {
      throw new Error(`Medusa returned status ${response.status}`)
    }

    const data = JSON.parse(response.body as string)
    const products: MedusaProduct[] = data.products || []

    const hits = products.map((p) => ({
      id: p.handle,
      displayName: p.title,
      description: p.description || "",
      iconUrl: p.thumbnail || undefined,
    }))

    return {
      status: 200,
      body: JSON.stringify({
        hits,
        count: hits.length,
        total: data.count || hits.length,
      }),
      contentType: "application/json",
    }
  } catch (e) {
    return {
      status: 500,
      body: JSON.stringify({ error: String(e) }),
      contentType: "application/json",
    }
  }
}
