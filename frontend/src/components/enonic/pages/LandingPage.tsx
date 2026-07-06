import { PageProps } from "@enonic/nextjs-adapter";
import RegionsView from "@enonic/nextjs-adapter/views/Region";

export default function LandingPage({ page, common, meta }: PageProps) {
  const content = (common?.get as any);
  const data = content?.dataAsJson || {};
  const imageUrl = content?.data?.heroImage?.mediaUrl
    ? "http://localhost:8080" + content.data.heroImage.mediaUrl
    : null;

  return (
    <div>
      <div
        className="relative w-full h-[500px] flex items-center justify-center"
        style={imageUrl ? { backgroundImage: "url(" + imageUrl + ")", backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "#1a1a1a" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-8 max-w-3xl">
          {data.heroHeadline && (
            <h1 className="text-5xl font-bold mb-4">{data.heroHeadline}</h1>
          )}
          {data.heroSubtext && (
            <p className="text-xl mb-8 opacity-90">{data.heroSubtext}</p>
          )}
          {data.ctaLabel && data.ctaUrl && (
            <a
              href={"/dk/" + data.ctaUrl}
              className="bg-white text-black px-8 py-3 rounded-lg inline-block font-medium hover:bg-gray-100"
            >
              {data.ctaLabel}
            </a>
          )}
        </div>
      </div>
      {data.body && (
        <div className="content-container py-12">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.body }} />
        </div>
      )}
      <RegionsView page={page} common={common} meta={meta} />
    </div>
  );
}
