import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { fetchLandingPage } from "@lib/enonic/landing-page"
import { fetchCollections, resolveMediaUrl as resolveCollectionImg } from "@lib/enonic/collections"
import { fetchRecentBlogs, resolveMediaUrl as resolveBlogImg } from "@lib/enonic/blogs"
import FeaturedProducts from "@modules/home/components/featured-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to our store.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const [region, { collections }, landingPage, enonicCollections, recentBlogs] =
    await Promise.all([
      getRegion(countryCode),
      listCollections({ fields: "id, handle, title" }),
      fetchLandingPage(),
      fetchCollections(),
      fetchRecentBlogs(3),
    ])

  if (!region) return null

  const featuredCollections = enonicCollections.slice(0, 3)

  return (
    <>
      {/* ── Hero ── */}
      {landingPage?.data ? (
        <EnonicHero
          headline={landingPage.data.heroHeadline}
          subtext={landingPage.data.heroSubtext}
          ctaLabel={landingPage.data.ctaLabel}
          ctaUrl={landingPage.data.ctaUrl}
        />
      ) : (
        <DefaultHero />
      )}

      {/* ── Landing Page body ── */}
      {landingPage?.data?.body?.processedHtml && (
        <div className="content-container py-12">
          <div
            className="prose max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: landingPage.data.body.processedHtml }}
          />
        </div>
      )}

      {/* ── Collections side-scroller (Enonic) ── */}
      {featuredCollections.length > 0 && (
        <section className="py-12 border-t border-ui-border-base">
          <div className="content-container mb-6">
            <h2 className="text-2xl-semi">Collections</h2>
          </div>
          <div className="overflow-x-auto pl-6 small:pl-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))]">
            <div className="flex gap-5 pb-2 w-max pr-6">
              {featuredCollections.map((col) => {
                const imgSrc = resolveCollectionImg(col.data?.bannerImage?.mediaUrl)
                return (
                  <Link
                    key={col._name}
                    href={`/${countryCode}/collections/${col._name}`}
                    className="group flex-shrink-0 w-72 rounded-large overflow-hidden border border-ui-border-base bg-ui-bg-subtle hover:border-ui-border-strong transition-colors"
                  >
                    <div className="relative h-44 w-full bg-ui-bg-base">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={col.displayName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-ui-fg-muted text-small-regular">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-base-semi">{col.displayName}</p>
                      {col.data?.description && (
                        <p className="text-small-regular text-ui-fg-subtle mt-1 line-clamp-2">
                          {col.data.description}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog grid (Enonic) ── */}
      {recentBlogs.length > 0 && (
        <section className="py-12 border-t border-ui-border-base">
          <div className="content-container">
            <h2 className="text-2xl-semi mb-6">From the Blog</h2>
            <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
              {recentBlogs.map((post) => {
                const imgSrc = resolveBlogImg(post.data?.featuredImage?.mediaUrl)
                const dateStr = post.data?.publishedDate
                  ? new Date(post.data.publishedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : null
                return (
                  <Link
                    key={post._name}
                    href={`/${countryCode}/Blog/${post._name}`}
                    className="group rounded-large overflow-hidden border border-ui-border-base bg-ui-bg-subtle hover:border-ui-border-strong transition-colors"
                  >
                    <div className="relative h-48 w-full bg-ui-bg-base">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={post.displayName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-ui-fg-muted text-small-regular">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {dateStr && (
                        <p className="text-small-regular text-ui-fg-muted mb-1">{dateStr}</p>
                      )}
                      <p className="text-base-semi line-clamp-2">{post.displayName}</p>
                      {(post.data?.subtitle || post.data?.summary) && (
                        <p className="text-small-regular text-ui-fg-subtle mt-1 line-clamp-2">
                          {post.data.subtitle ?? post.data.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Medusa product highlights (unchanged) ── */}
      {collections && collections.length > 0 && (
        <div className="py-12">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      )}
    </>
  )
}

function EnonicHero({
  headline,
  subtext,
  ctaLabel,
  ctaUrl,
}: {
  headline?: string
  subtext?: string
  ctaLabel?: string
  ctaUrl?: string
}) {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        {headline && (
          <h1 className="text-3xl leading-10 text-ui-fg-base font-normal">
            {headline}
          </h1>
        )}
        {subtext && (
          <p className="text-xl leading-8 text-ui-fg-subtle font-normal max-w-2xl">
            {subtext}
          </p>
        )}
        {ctaLabel && ctaUrl && (
          <CtaButton label={ctaLabel} url={ctaUrl} />
        )}
      </div>
    </div>
  )
}

function CtaButton({ label, url }: { label: string; url: string }) {
  const className =
    "inline-flex items-center justify-center px-6 py-3 border border-ui-border-base bg-ui-bg-base text-ui-fg-base text-sm font-medium rounded-rounded hover:bg-ui-bg-base-hover transition-colors"

  if (/^https?:\/\//.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    )
  }

  const internalHref = url.startsWith("/") ? url : `/${url}`
  return (
    <LocalizedClientLink href={internalHref} className={className}>
      {label}
    </LocalizedClientLink>
  )
}

function DefaultHero() {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <h1 className="text-3xl leading-10 text-ui-fg-base font-normal">
          Welcome to our store
        </h1>
        <p className="text-xl leading-8 text-ui-fg-subtle font-normal">
          Discover our latest collections
        </p>
      </div>
    </div>
  )
}
