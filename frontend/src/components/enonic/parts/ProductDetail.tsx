import { PartProps } from '@enonic/nextjs-adapter';
import { notFound } from 'next/navigation';
import { listProducts } from '@lib/data/products';
import { getRegion } from '@lib/data/regions';
import ProductTemplate from '@modules/products/templates';

export default async function ProductDetail({ common, meta }: PartProps) {
    const dataAsJson = common?.get?.dataAsJson as Record<string, string> | undefined;
    const handle = dataAsJson?.medusaHandle;

    if (!handle) {
        notFound();
    }

    const countryCode = meta.locale;
    const [region, { response }] = await Promise.all([
        getRegion(countryCode),
        listProducts({ countryCode, queryParams: { handle } }),
    ]);

    const product = response.products[0];

    if (!region || !product) {
        notFound();
    }

    return (
        <ProductTemplate
            product={product}
            region={region}
            countryCode={countryCode}
            images={product.images ?? []}
        />
    );
}
