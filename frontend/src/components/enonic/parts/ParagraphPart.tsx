import { PartProps } from "@enonic/nextjs-adapter";

export default function ParagraphPart({ part }: PartProps) {
  const config = (part as any)?.config || {};
  const text: string = config?.text || "";

  if (!text) return null;

  return (
    <div className="content-container py-8">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
}
