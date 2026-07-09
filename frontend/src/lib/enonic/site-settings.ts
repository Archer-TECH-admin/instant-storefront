import { draftMode } from "next/headers"

const ENONIC_API = process.env.ENONIC_API || "http://localhost:8080/site"
const PROJECT = "hmdb"
const API_TOKEN = process.env.ENONIC_API_TOKEN || ""

export type MenuLink = { label: string; url: string }
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
    { label: "Home", url: "/" },
    { label: "Store", url: "/store" },
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

async function fetchFromContentItem(branch: string): Promise<SiteSettings | null> {
  try {
    const url = `${ENONIC_API}/${PROJECT}/${branch}`
    const query = `{
      guillotine {
        query(contentTypes: ["com.enonic.app.hmdb:site-settings"], first: 1) {
          ... on com_enonic_app_hmdb_SiteSettings {
            data {
              storeName
              shippingLabel
              menuLinks { label url }
              footerBrand
              footerCopyright
              footerColumnHeading
              footerLinks { label url }
            }
          }
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
    const raw = json?.data?.guillotine?.query?.[0]?.data
    if (!raw) return null

    return {
      storeName: raw.storeName || DEFAULTS.storeName,
      shippingLabel: raw.shippingLabel || DEFAULTS.shippingLabel,
      menuLinks: raw.menuLinks?.length ? (raw.menuLinks as MenuLink[]) : DEFAULTS.menuLinks,
      footerBrand: raw.footerBrand || DEFAULTS.footerBrand,
      footerCopyright: raw.footerCopyright || DEFAULTS.footerCopyright,
      footerColumnHeading: raw.footerColumnHeading || DEFAULTS.footerColumnHeading,
      footerLinks: raw.footerLinks?.length ? (raw.footerLinks as FooterLink[]) : DEFAULTS.footerLinks,
    }
  } catch {
    return null
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { isEnabled: isDraft } = await draftMode()
  const branch = isDraft ? "draft" : "master"

  // Primary: HOME page's site-settings part config (edited via CS page editor)
  // Fallback: standalone site-settings content item
  const fromPart = await fetchFromPartConfig(branch)
  if (fromPart) return fromPart

  const fromContent = await fetchFromContentItem(branch)
  return fromContent ?? DEFAULTS
}
