import { APP_NAME, PartProps } from "@enonic/nextjs-adapter";

const ENONIC_ORIGIN = (process.env.ENONIC_API || "http://localhost:8080/site").replace(/\/site\/?$/, "");

export default async function HeroPart({ part, common, meta }: PartProps) {
  const config = (part as any)?.config || {};
  const headline: string = config?.headline || "";
  const subtext: string = config?.subtext || "";
  const ctaLabel: string = config?.ctaLabel || "";
  const ctaUrl: string = config?.ctaUrl || "";
  const imageId: string | null = config?.image || null;

  let imageUrl: string | null = null;

  if (imageId) {
    try {
      const res = await fetch("http://localhost:8080/site/hmdb/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `{ guillotine { get(key: "${imageId}") { ... on media_Image { mediaUrl } } } }`
        }),
        cache: "no-store",
      });
      const json = await res.json();
      const mediaUrl = json?.data?.guillotine?.get?.mediaUrl;
      if (mediaUrl) imageUrl = ENONIC_ORIGIN + mediaUrl;
    } catch (e) {
      console.error("Failed to fetch hero image", e);
    }
  }

  return (
    <div
      className="relative w-full h-screen flex items-center justify-center"
      style={
        imageUrl
          ? { backgroundImage: "url(" + imageUrl + ")", backgroundSize: "cover", backgroundPosition: "center" }
          : { backgroundColor: "#1a1a1a" }
      }
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center text-white px-8 max-w-3xl">
        {headline && <h1 className="text-5xl font-bold mb-4">{headline}</h1>}
        {subtext && <p className="text-xl mb-8 opacity-90">{subtext}</p>}
        {ctaLabel && ctaUrl && (
          <a
            href={"/dk/" + ctaUrl}
            className="bg-white text-black px-8 py-3 rounded-lg inline-block font-medium hover:bg-gray-100"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </div>
  );
}
