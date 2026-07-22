import { draftMode } from "next/headers"
import { fetchCollections } from "@lib/enonic/collections"

const ENONIC_API = process.env.ENONIC_API || "http://localhost:8080/site"
const PROJECT = "hmdb"
const API_TOKEN = process.env.ENONIC_API_TOKEN || ""

export type MenuLink = { label: string; url?: string; children?: { label: string; url: string }[] }
export type FooterLink = { label: string; url: string }

export type SiteSettings = {
  storeName: string
  shippingLabel: string
  menuLinks: MenuLink[]
  footerBrand: string
  footerCopyright: string
  footerColumnHeading: string
  footerLinks: FooterLink[]
}

const DEFAULTS: SiteSettings = {
  storeName: "Medusa Store",
  shippingLabel: "Shipping to:",
  menuLinks: [
    { label: "All Products", url: "/products" },
    { label: "Account", url: "/account" },
    { label: "Cart", url: "/cart" },
  ],
  footerBrand: "Medusa Store",
  footerCopyright: "Medusa Store. All rights reserved.",
  footerColumnHeading: "Medusa",
  footerLinks: [
    { label: "GitHub", url: "https://github.com/medusajs" },
    { label: "Documentation", url: "https://docs.medusajs.com" },
    { label: "Source code", url: "https://github.com/medusajs/dtc-starter" },
  ],
}

// Parse the site-settings part config out of a HOME page's pageAsJson blob.
function parsePartConfig(pageAsJson: string): Partial<SiteSettings> | null {
  try {
    const page = JSON.parse(pageAsJson)
    const regions: Record<string, { components?: unknown[] }> = page?.regions ?? {}
    for (const region of Object.values(regions)) {
      for (const comp of region.components ?? []) {
        const c = comp as Record<string, unknown>
        if (c.type !== "part") continue
        const part = c.part as Record<string, unknown> | undefined
        if (!part) continue
        if (part.descriptor !== "com.enonic.app.hmdb:site-settings") continue
        const config = part.config as Record<string, unknown> | undefined
        const ns = config?.["com-enonic-app-hmdb"] as Record<string, unknown> | undefined
        const cfg = ns?.["site-settings"] as Record<string, unknown> | undefined
        if (!cfg) continue
        return {
          storeName: cfg.storeName as string | undefined,
          shippingLabel: cfg.shippingLabel as string | undefined,
          menuLinks: cfg.menuLinks as MenuLink[] | undefined,
          footerBrand: cfg.footerBrand as string | undefined,
          footerCopyright: cfg.footerCopyright as string | undefined,
          footerColumnHeading: cfg.footerColumnHeading as string | undefined,
          footerLinks: cfg.footerLinks as FooterLink[] | undefined,
        } as Partial<SiteSettings>
      }
    }
  } catch {
    // ignore parse errors
  }
  return null
}

function toIdArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean) as string[]
  return [String(value)]
}

async function resolveContentLinks(
  ids: string[],
  branch: string
): Promise<{ id: string; label: string; url: string }[]> {
  if (ids.length === 0) return []
  const url = `${ENONIC_API}/${PROJECT}/${branch}`
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (branch === "draft" && API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`

  const idsQuery = ids.map((id, i) => `p${i}: get(key: "${id}") { displayName _path }`).join("\n")
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: `{ guillotine { ${idsQuery} } }` }),
    cache: "no-store",
  })
  if (!res.ok) return []
  const json = await res.json()
  const guillotine = json?.data?.guillotine ?? {}

  return ids
    .map((id, i) => {
      const hit = guillotine[`p${i}`]
      if (!hit?._path) return null
      const urlPath = "/" + hit._path.split("/").filter(Boolean).slice(1).join("/")
      return { id, label: hit.displayName as string, url: urlPath }
    })
    .filter((h): h is { id: string; label: string; url: string } => h !== null)
}

async function fetchCmsMenuLinks(branch: string): Promise<MenuLink[]> {
  try {
    const url = `${ENONIC_API}/${PROJECT}/${branch}`
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (branch === "draft" && API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`

    const xRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: `{ guillotine { get(key: "/home") { xAsJson } } }` }),
      cache: "no-store",
    })
    if (!xRes.ok) return []
    const xJson = await xRes.json()
    const xAsJson = xJson?.data?.guillotine?.get?.xAsJson
    const menuData = xAsJson?.["com-enonic-app-hmdb"]?.menu?.menuiteam
    const items: {
      menuname?: string
      page?: string
      showAllCollections?: boolean
      customCollections?: string | string[]
    }[] = Array.isArray(menuData) ? menuData : menuData ? [menuData] : []
    if (items.length === 0) return []

    const pageIds = items.map((i) => i.page).filter(Boolean) as string[]
    const pageLinks = await resolveContentLinks(pageIds, branch)
    const pageLinkById = new Map(pageLinks.map((l) => [l.id, l]))

    const customIds = items.flatMap((i) => toIdArray(i.customCollections))
    const customLinks = customIds.length ? await resolveContentLinks(customIds, branch) : []
    const customLinkById = new Map(customLinks.map((l) => [l.id, l]))

    const needsAllCollections = items.some((i) => i.showAllCollections)
    const allCollections = needsAllCollections ? await fetchCollections() : []

    return items
      .map((item): MenuLink | null => {
        if (item.showAllCollections) {
          return {
            label: item.menuname || "Collections",
            children: allCollections.map((c) => ({
              label: c.displayName,
              url: `/collections/${c._name}`,
            })),
          }
        }
        const customIds2 = toIdArray(item.customCollections)
        if (customIds2.length > 0) {
          return {
            label: item.menuname || "Collections",
            children: customIds2
              .map((id) => customLinkById.get(id))
              .filter((l): l is { id: string; label: string; url: string } => !!l)
              .map((l) => ({ label: l.label, url: l.url })),
          }
        }
        if (item.page) {
          const link = pageLinkById.get(item.page)
          if (!link || !item.menuname) return null
          return { label: item.menuname, url: link.url }
        }
        return null
      })
      .filter((l): l is MenuLink => l !== null)
  } catch {
    return []
  }
}

async function fetchCmsFooterConfig(branch: string): Promise<Partial<SiteSettings>> {
  try {
    const url = `${ENONIC_API}/${PROJECT}/${branch}`
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (branch === "draft" && API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: `{ guillotine { get(key: "/home") { xAsJson } } }` }),
      cache: "no-store",
    })
    if (!res.ok) return {}
    const json = await res.json()
    const xAsJson = json?.data?.guillotine?.get?.xAsJson
    const cfg = xAsJson?.["com-enonic-app-hmdb"]?.["footer-config"] as
      | {
          footerCopyright?: string
          footerColumnHeading?: string
          footerLinks?: FooterLink | FooterLink[]
        }
      | undefined
    if (!cfg) return {}

    const footerLinks = Array.isArray(cfg.footerLinks)
      ? cfg.footerLinks
      : cfg.footerLinks
      ? [cfg.footerLinks]
      : undefined

    return {
      footerCopyright: cfg.footerCopyright || undefined,
      footerColumnHeading: cfg.footerColumnHeading || undefined,
      footerLinks: footerLinks?.length ? footerLinks : undefined,
    }
  } catch {
    return {}
  }
}

async function fetchFromPartConfig(branch: string): Promise<SiteSettings | null> {
  try {
    const url = `${ENONIC_API}/${PROJECT}/${branch}`
    const query = `{
      guillotine {
        get(key: "/home") {
          pageAsJson
        }
      }
    }`
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const json = await res.json()
    const pageAsJson: string | undefined = json?.data?.guillotine?.get?.pageAsJson
    if (!pageAsJson) return null

    const partial = parsePartConfig(pageAsJson)
    if (!partial) return null

    return {
      storeName: partial.storeName || DEFAULTS.storeName,
      shippingLabel: partial.shippingLabel || DEFAULTS.shippingLabel,
      menuLinks: partial.menuLinks?.length ? partial.menuLinks : DEFAULTS.menuLinks,
      footerBrand: partial.footerBrand || DEFAULTS.footerBrand,
      footerCopyright: partial.footerCopyright || DEFAULTS.footerCopyright,
      footerColumnHeading: partial.footerColumnHeading || DEFAULTS.footerColumnHeading,
      footerLinks: partial.footerLinks?.length ? partial.footerLinks : DEFAULTS.footerLinks,
    }
  } catch {
    return null
  }
}

async function fetchRootDisplayName(branch: string): Promise<string | null> {
  try {
    const url = `${ENONIC_API}/${PROJECT}/${branch}`
    const query = `{
      guillotine {
        get(key: "/home") {
          displayName
        }
      }
    }`
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (branch === "draft" && API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data?.guillotine?.get?.displayName || null
  } catch {
    return null
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { isEnabled: isDraft } = await draftMode()
  const branch = isDraft ? "draft" : "master"

  const [base, rootDisplayName, cmsMenuLinks, cmsFooterConfig] = await Promise.all([
    fetchFromPartConfig(branch).then((fromPart) => fromPart ?? DEFAULTS),
    fetchRootDisplayName(branch),
    fetchCmsMenuLinks(branch),
    fetchCmsFooterConfig(branch),
  ])

  return {
    ...base,
    ...cmsFooterConfig,
    storeName: rootDisplayName || base.storeName,
    footerBrand: rootDisplayName || base.footerBrand,
    menuLinks: [...base.menuLinks, ...cmsMenuLinks],
  }
}