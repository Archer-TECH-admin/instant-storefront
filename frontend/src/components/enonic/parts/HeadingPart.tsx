import { PartProps } from "@enonic/nextjs-adapter";

export default function HeadingPart({ part }: PartProps) {
  const config = (part as any)?.config || {};
  const heading: string = config?.heading || "";

  if (!heading) return null;

  return (
    <div className="content-container py-6">
      <h2 className="text-3xl font-bold">{heading}</h2>
    </div>
  );
}
