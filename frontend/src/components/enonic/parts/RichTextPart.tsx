import { APP_NAME, PartData } from "@enonic/nextjs-adapter";

export const RICH_TEXT_PART_NAME = `${APP_NAME}:rich-text`;

export interface RichTextData {
  part: PartData;
}

export default function RichTextPart({ part }: RichTextData) {
  const config = part?.config as any;
  const body: string = config?.body || "";

  if (!body) return null;

  return (
    <div className="content-container py-12">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
