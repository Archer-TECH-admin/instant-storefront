import { PartProps } from "@enonic/nextjs-adapter";
import { listProducts } from "@lib/data/products";
import React from "react";

interface ProductDisplayConfig {
  heading?: string;
  product1?: string;
  product2?: string;
  product3?: string;
  product1Layout?: string;
  product2Layout?: string;
  product3Layout?: string;
}

export default async function ProductShowcase({ part }: PartProps) {
  const config = ((part as any)?.config as ProductDisplayConfig) || {};
  const heading: string = config.heading || "";
  const handles: string[] = [
    config.product1,
    config.product2,
    config.product3,
  ].filter(Boolean) as string[];

  if (!handles.length) return null;

  const { response } = await listProducts({
    countryCode: "dk",
    queryParams: { handle: handles } as never,
  });

  const products = response.products;
  if (!products.length) return null;

  const selectedLayout = (v: any): string =>
    typeof v === "string" ? v : (v?._selected as string) ?? "text-left";

  const layouts = [
    selectedLayout(config.product1Layout),
    selectedLayout(config.product2Layout),
    selectedLayout(config.product3Layout),
  ];

  return React.createElement(
    "div",
    { className: "content-container py-12 flex flex-col gap-16" },
    heading && React.createElement("h2", { className: "text-4xl font-bold" }, heading),
    ...products.map((product, index) => {
      const isTextRight = layouts[index] === "text-right";
      return React.createElement(
        "div",
        {
          key: product.id,
          className: `flex flex-col small:flex-row items-center gap-8 ${
            isTextRight ? "small:flex-row-reverse" : ""
          }`,
        },
        React.createElement(
          "div",
          { className: "flex-1 flex flex-col gap-4" },
          React.createElement(
            "h2",
            { className: "text-3xl font-bold" },
            product.title
          ),
          product.description &&
          React.createElement(
            "p",
            { className: "text-ui-fg-subtle text-base leading-relaxed" },
            product.description
          ),
          React.createElement(
            "a",
            {
              href: `/dk/products/${product.handle}`,
              className:
              "inline-block bg-ui-fg-base text-white px-6 py-3 rounded-lg w-fit hover:opacity-90 transition-opacity",
            },
            "View Product"
          )
        ),
        React.createElement(
          "div",
          {
            className:
            "flex-1 aspect-square w-full max-w-sm overflow-hidden rounded-large bg-ui-bg-subtle",
          },
          product.thumbnail &&
          React.createElement("img", {
            src: product.thumbnail,
            alt: product.title || "",
            className: "w-full h-full object-cover",
          })
        )
      );
    })
  );
}
