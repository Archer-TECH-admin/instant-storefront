const ENONIC_API = process.env.ENONIC_API || "http://localhost:8080/site"
const PROJECT = "hmdb"
const BRANCH = "master"

export type EnonicMovie = {
  displayName: string
  data: {
    subtitle?: string
    abstract?: string
    release?: string
    director?: { displayName: string } | null
  }
}

export async function fetchMovies(): Promise<EnonicMovie[]> {
  const query = `{
    guillotine {
      query(contentTypes: ["com.enonic.app.hmdb:movie"]) {
        displayName
        ... on com_enonic_app_hmdb_Movie {
          data {
            subtitle
            abstract
            release
            director { displayName }
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
    console.error("Enonic fetch failed", res.status)
    return []
  }

  const json = await res.json()
  return json?.data?.guillotine?.query ?? []
}
