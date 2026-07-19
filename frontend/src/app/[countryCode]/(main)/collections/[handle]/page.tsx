import { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchContent } from "@enonic/nextjs-adapter/server"
import { FetchContentResult, validateData } from "@enonic/nextjs-adapter"
import MainView from "@enonic/nextjs-adapter/views/MainView"
import "../../../../../components/_mappings"
import { fetchCollections } from "@lib/enonic/collections"
import { listRegions } from "@lib/data/regions"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const [collections, regions] = await Promise.all([
    fetchCollections(),
                                                   listRegions(),
  ])
  const countryCodes = regions
  .flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
  .filter(Boolean) as string[]
  return countryCodes.flatMap((countryCode) =>
  collections
  .filter((c) => c._name)
  .map((c) => ({ countryCode, handle: c._name }))
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle, countryCode } = await props.params
  const { common } = await fetchContent({
    locale: countryCode,
    contentPath: ["home", "collections", handle],
  })
  if (!common?.get) return {}
  return {
    title: `${common.get.displayName} | Collections`,
  }
}

export default async function CollectionPage(props: Props) {
  const { handle, countryCode } = await props.params
  const data: FetchContentResult = await fetchContent({
    locale: countryCode,
    contentPath: ["home", "collections", handle],
  })
  if (!data?.common?.get) {
    notFound()
  }
  validateData(data)
  return <MainView {...data} />
}
