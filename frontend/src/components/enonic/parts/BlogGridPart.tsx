import { PartProps } from "@enonic/nextjs-adapter";
import { fetchRecentBlogs, resolveMediaUrl } from "@lib/enonic/blogs";
import LocalizedClientLink from "@modules/common/components/localized-client-link";

export default async function BlogGridPart({ part }: PartProps) {
  const config = (part as any)?.config || {};
  const heading = config?.heading || "From the Blog";
  const count = config?.count || 3;

  const blogs = await fetchRecentBlogs(count);

  if (!blogs.length) return null;

  return (
    <div className="content-container py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
        {blogs.map((blog, i) => {
          const blogImage = resolveMediaUrl(blog.data?.featuredImage?.mediaUrl);
          return (
            <LocalizedClientLink
              key={i}
              href={"/Blog/" + blog._name}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {blogImage && (
                <div className="w-full h-48 overflow-hidden">
                  <img src={blogImage} alt={blog.displayName} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium mb-2">{blog.displayName}</h3>
                {blog.data?.summary && (
                  <p className="text-sm text-ui-fg-subtle line-clamp-3">{blog.data.summary}</p>
                )}
              </div>
            </LocalizedClientLink>
          );
        })}
      </div>
    </div>
  );
}
