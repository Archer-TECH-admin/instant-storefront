const ENONIC_API = process.env.ENONIC_API || "http://localhost:8080/site"
const PROJECT = "hmdb"
const BRANCH = "master"

export type EnonicLandingPage = {
  displayName: string
  data: {
    heroHeadline?: string
    heroSubtext?: string
    heroImage?: { mediaUrl?: string } | null
    ctaLabel?: string
    ctaUrl?: string
    body?: { processedHtml?: string }
  }
}

export function resolveMediaUrl(mediaUrl?: string | null): string | null {
  if (!mediaUrl) return null
  const origin = (process.env.ENONIC_API || "http://localhost:8080/site").replace(/\/site\/?$/, "")
  return `${origin}${mediaUrl}`
}

export async function fetchLandingPage(): Promise<EnonicLandingPage | null> {
  const query = `{
    guillotine {
      query(contentTypes: ["com.enonic.app.hmdb:landing-page"], first: 1) {
        displayName
        ... on com_enonic_app_hmdb_LandingPage {
          data {
            heroHeadline
            heroSubtext
            heroImage {
              ... on media_Image {
                mediaUrl
              }
            }
            ctaLabel
            ctaUrl
            body { processedHtml }
          }
        }
      }
    }
  }`

  const res = await fetch(`${ENONIC_API}/${PROJECT}/${BRANCH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store",
  })

  if (!res.ok) {
    console.error("Enonic landing page fetch failed", res.status)
    return null
  }

  const json = await res.json()
  return json?.data?.guillotine?.query?.[0] ?? null
}
