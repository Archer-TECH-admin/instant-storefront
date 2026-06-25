import { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchBlogs, fetchBlogBySlug } from "@lib/enonic/blogs"
import { listRegions } from "@lib/data/regions"

type Props = {
  params: Promise<{ slug: string; countryCode: string }>
}

export async function generateStaticParams() {
  const [blogs, regions] = await Promise.all([
    fetchBlogs(),
    listRegions(),
  ])

  const countryCodes = regions
    .flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
    .filter(Boolean) as string[]

  return countryCodes.flatMap((countryCode) =>
    blogs
      .filter((b) => b._name)
      .map((b) => ({ countryCode, slug: b._name }))
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const blog = await fetchBlogBySlug(slug)
  if (!blog) return {}
  return {
    title: `${blog.displayName} | Blog`,
    description: blog.data?.summary ?? blog.data?.subtitle ?? blog.displayName,
  }
}

export default async function BlogPostPage(props: Props) {
  const { slug } = await props.params
  const blog = await fetchBlogBySlug(slug)

  if (!blog) {
    notFound()
  }

  const { data } = blog

  return (
    <div className="content-container py-12">
      <article className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl-semi mb-3">{blog.displayName}</h1>
          {data?.subtitle && (
            <p className="text-xl-regular text-ui-fg-subtle italic mb-4">
              {data.subtitle}
            </p>
          )}
          <div className="flex items-center gap-4 text-small-regular text-ui-fg-muted">
            {data?.author?.displayName && (
              <span>By {data.author.displayName}</span>
            )}
            {data?.publishedDate && (
              <time dateTime={data.publishedDate}>
                {new Date(data.publishedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
          </div>
          {data?.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-ui-bg-subtle text-small-regular rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {data?.summary && (
          <div className="border-l-4 border-ui-border-base pl-4 mb-8">
            <p className="text-base-regular text-ui-fg-subtle">{data.summary}</p>
          </div>
        )}

        {data?.body?.processedHtml && (
          <div
            className="prose prose-ui max-w-none"
            dangerouslySetInnerHTML={{ __html: data.body.processedHtml }}
          />
        )}
      </article>
    </div>
  )
}
