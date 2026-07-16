import type { PageProps } from "@enonic/nextjs-adapter";
import RegionsView from "@enonic/nextjs-adapter/views/Region";

export default function LandingPage(props: PageProps) {
  const { page, common, meta } = props;

  // When the page has no parts yet, page.regions === {}.
  // RegionsView returns null when regions[name] is undefined,
  // which means no data-portal-region div is rendered and
  // Content Studio has no drop target. Provide an explicit
  // empty region so the drop zone always appears in edit mode.
  const regions =
    !page?.regions || !Object.keys(page.regions).length
      ? { main: { name: "main", components: [] } }
      : page.regions;

  return (
    <RegionsView
      {...props}
      page={{ ...page, regions }}
      name="main"
      common={common}
      meta={meta}
    />
  );
}
