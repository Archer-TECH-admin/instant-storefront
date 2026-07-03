import { PageProps } from '@enonic/nextjs-adapter';
import RegionsView from '@enonic/nextjs-adapter/views/Region';

export default function ProductPage({ page, common, meta }: PageProps) {
    return <RegionsView page={page} common={common} meta={meta} />;
}
