import { PartProps } from '@enonic/nextjs-adapter';
import { notFound } from 'next/navigation';
import { listProducts } from '@lib/data/products';
import { getRegion } from '@lib/data/regions';
import ProductTemplate, { CrossSellItem } from '@modules/products/templates';
import ProductPreview from '@modules/products/components/product-preview';
import { fetchPromotions, showOn } from '@lib/enonic/promotions';
import { HttpTypes } from '@medusajs/types';

async function fetchProductsByHandles(
    handles: string[],
    countryCode: string,
): Promise<HttpTypes.StoreProduct[]> {
    const results = await Promise.all(
        handles.map((h) =>
            listProducts({ countryCode, queryParams: { handle: h } }).then(
                (r) => r.response.products[0] ?? null,
            ),
        ),
    );
    return results.filter((p): p is HttpTypes.StoreProduct => p !== null);
}

export default async function ProductDetail({ common, meta }: PartProps) {
    const dataAsJson = common?.get?.dataAsJson as Record<string, string> | undefined;
    const handle = dataAsJson?.medusaHandle;

    if (!handle) {
        notFound();
    }

    const countryCode = meta.locale;
    const [region, { response }, promotions] = await Promise.all([
        getRegion(countryCode),
        listProducts({ countryCode, queryParams: { handle } }),
        fetchPromotions(handle),
    ]);

    const product = response.products[0];

    if (!region || !product) {
        notFound();
    }

    const showUpsell =
        promotions.upsellProducts.length > 0 && showOn(promotions.upsellPlacement, 'pdp');
    const showCrossSell =
        promotions.crossSellProducts.length > 0 && showOn(promotions.crossSellPlacement, 'pdp');

    const [upsellData, crossSellRaw] = await Promise.all([
        showUpsell ? fetchProductsByHandles(promotions.upsellProducts, countryCode) : Promise.resolve([]),
        showCrossSell
            ? fetchProductsByHandles(promotions.crossSellProducts, countryCode)
            : Promise.resolve([]),
    ]);

    const crossSellData: CrossSellItem[] = crossSellRaw.map((p) => ({
        id: p.id!,
        title: p.title!,
        thumbnail: p.thumbnail ?? null,
        handle: p.handle!,
    }));

    return (
        <>
            <ProductTemplate
                product={product}
                region={region}
                countryCode={countryCode}
                images={product.images ?? []}
                crossSellProducts={crossSellData}
            />

            {upsellData.length > 0 && (
                <section className="content-container py-12 border-t border-ui-border-base">
                    <h2 className="text-2xl-semi mb-8">You might also like</h2>
                    <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-8">
                        {upsellData.map((p) => (
                            <li key={p.id}>
                                <ProductPreview product={p} region={region} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </>
    );
}
