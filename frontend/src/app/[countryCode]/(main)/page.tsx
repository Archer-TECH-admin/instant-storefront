import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { fetchLandingPage, resolveMediaUrl as resolveHeroImg } from "@lib/enonic/landing-page"
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


