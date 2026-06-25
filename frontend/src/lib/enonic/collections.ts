const ENONIC_API = process.env.ENONIC_API || "http://localhost:8080/site"
const PROJECT = "hmdb"
const BRANCH = "master"

const GQL_URL = `${ENONIC_API}/${PROJECT}/${BRANCH}`

export type EnonicCollection = {
  _name: string
  displayName: string
  data: {
    description?: string
    bannerImage?: { mediaUrl?: string } | null
    featuredProducts?: string[]
  }
}

async function gql(query: string): Promise<unknown> {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store",
  })
  if (!res.ok) {
    console.error("Enonic fetch failed", res.status)
    return null
  }
  return res.json()
}

export function resolveMediaUrl(mediaUrl?: string | null): string | null {
  if (!mediaUrl) return null
  const origin = ENONIC_API.replace(/\/site\/?$/, "")
  return `${origin}${mediaUrl}`
}

const COLLECTION_FRAGMENT = `
  _name
  displayName
  ... on com_enonic_app_hmdb_Collection {
    data {
      description
      featuredProducts
      bannerImage {
        ... on media_Image {
          mediaUrl
        }
      }
    }
  }
`

export async function fetchCollections(): Promise<EnonicCollection[]> {
  const json = await gql(`{
    guillotine {
      query(contentTypes: ["com.enonic.app.hmdb:collection"]) {
        ${COLLECTION_FRAGMENT}
      }
    }
  }`) as { data?: { guillotine?: { query?: EnonicCollection[] } } } | null

  return json?.data?.guillotine?.query ?? []
}

export async function fetchCollectionByHandle(
  handle: string
): Promise<EnonicCollection | null> {
  const safe = handle.replace(/'/g, "")
  const json = await gql(`{
    guillotine {
      query(
        contentTypes: ["com.enonic.app.hmdb:collection"]
        query: "_name = '${safe}'"
        first: 1
      ) {
        ${COLLECTION_FRAGMENT}
      }
    }
  }`) as { data?: { guillotine?: { query?: EnonicCollection[] } } } | null

  return json?.data?.guillotine?.query?.[0] ?? null
}
