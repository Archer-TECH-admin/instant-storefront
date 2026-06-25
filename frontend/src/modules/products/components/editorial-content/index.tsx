import { fetchMovies } from "@lib/enonic/movies"

const EditorialContent = async () => {
  const movies = await fetchMovies()
  const featured = movies[0]

  if (!featured) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-2 border-t pt-6 mt-6">
      <span className="text-small-regular text-ui-fg-muted uppercase">
        Editorial
      </span>
      <h3 className="text-base-semi">{featured.displayName}</h3>
      {featured.data?.subtitle && (
        <p className="text-base-regular italic">{featured.data.subtitle}</p>
      )}
      {featured.data?.abstract && (
        <p className="text-small-regular text-ui-fg-subtle">
          {featured.data.abstract}
        </p>
      )}
    </div>
  )
}

export default EditorialContent
