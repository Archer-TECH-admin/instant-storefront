const ENONIC_API = process.env.ENONIC_API || "http://localhost:8080/site"
const PROJECT = "hmdb"
const BRANCH = "master"

const GQL_URL = `${ENONIC_API}/${PROJECT}/${BRANCH}`

export type EnonicBlog = {
  _name: string
  displayName: string
  data: {
    subtitle?: string
    publishedDate?: string
    summary?: string
    body?: { processedHtml?: string }
    featuredImage?: { mediaUrl?: string } | null
    author?: { displayName: string } | null
    tags?: string[]
  }
}

export function resolveMediaUrl(mediaUrl?: string | null): string | null {
  if (!mediaUrl) return null
  const origin = GQL_URL.replace(/\/site\/.*$/, "")
  return `${origin}${mediaUrl}`
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

const BLOG_FRAGMENT = `
  _name
  displayName
  ... on com_enonic_app_hmdb_Blog {
    data {
      subtitle
      publishedDate
      summary
      body { processedHtml }
      featuredImage {
        ... on media_Image {
          mediaUrl
        }
      }
      author { displayName }
      tags
    }
  }
`

export async function fetchRecentBlogs(count = 3): Promise<EnonicBlog[]> {
  const json = await gql(`{
    guillotine {
      query(
        contentTypes: ["com.enonic.app.hmdb:blog"]
        sort: "data.publishedDate DESC"
        first: ${count}
      ) {
        ${BLOG_FRAGMENT}
      }
    }
  }`) as { data?: { guillotine?: { query?: EnonicBlog[] } } } | null

  return json?.data?.guillotine?.query ?? []
}

export async function fetchBlogs(): Promise<EnonicBlog[]> {
  const json = await gql(`{
    guillotine {
      query(contentTypes: ["com.enonic.app.hmdb:blog"]) {
        ${BLOG_FRAGMENT}
      }
    }
  }`) as { data?: { guillotine?: { query?: EnonicBlog[] } } } | null

  return json?.data?.guillotine?.query ?? []
}

export async function fetchBlogBySlug(slug: string): Promise<EnonicBlog | null> {
  const safe = slug.replace(/'/g, "")
  const json = await gql(`{
    guillotine {
      query(
        contentTypes: ["com.enonic.app.hmdb:blog"]
        query: "_name = '${safe}'"
        first: 1
      ) {
        ${BLOG_FRAGMENT}
      }
    }
  }`) as { data?: { guillotine?: { query?: EnonicBlog[] } } } | null

  return json?.data?.guillotine?.query?.[0] ?? null
}
