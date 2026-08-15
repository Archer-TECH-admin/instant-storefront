import { draftMode } from "next/headers"
import { cookies } from "next/headers"

const ENONIC_API = process.env.ENONIC_API || "http://localhost:8080/site"
const PROJECT = "hmdb"

export type EnonicCollection = {
  _name: string
  displayName: string
  data: {
    description?: string
    bannerImage?: { mediaUrl?: string } | null
    featuredProducts?: string[]
  }
}

async function getBranchAndHeaders(): Promise<{ branch: string; headers: Record<string, string> }> {
  try {
    const { isEnabled: isDraft } = await draftMode()
    const branch = isDraft ? "draft" : "master"
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (branch === "draft") {
      const cookieStore = await cookies()
      headers["Cookie"] = cookieStore.toString()
    }
    return { branch, headers }
  } catch {
    // No request context available (e.g. called from generateStaticParams at build time)
    return { branch: "master", headers: { "Content-Type": "application/json" } }
  }
}

async function gql(query: string): Promise<unknown> {
  const { branch, headers } = await getBranchAndHeaders()
  const url = `${ENONIC_API}/${PROJECT}/${branch}`
  const res = await fetch(url, {
    method: "POST",
    headers,
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

export async function fetchCollectionsByIds(ids: string[]): Promise<EnonicCollection[]> {
  if (ids.length === 0) return []
  const idsQuery = ids.map((id) => `_id = '${id}'`).join(' OR ')
  const json = await gql(`{
    guillotine {
      query(
        contentTypes: ["com.enonic.app.hmdb:collection"]
        query: "${idsQuery}"
        first: ${ids.length}
      ) {
        _id
        ${COLLECTION_FRAGMENT}
      }
    }
  }`) as { data?: { guillotine?: { query?: (EnonicCollection & { _id: string })[] } } } | null
  const results = json?.data?.guillotine?.query ?? []
  const byId = new Map(results.map((r) => [r._id, r]))
  return ids.map((id) => byId.get(id)).filter((c): c is EnonicCollection & { _id: string } => !!c)
}