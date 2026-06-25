import { assetUrl } from '/lib/enonic/asset';
import { render } from '/lib/thymeleaf';
import { get, getOutboundDependencies } from '/lib/xp/content';
import { getContent, imageUrl } from '/lib/xp/portal';
import type { Content, Response } from '@enonic-types/core';

function pickImageId(content: Content): string | null {
    const refs = getOutboundDependencies({ key: content._id });
    if (!refs || refs.length === 0) {
        return null;
    }
    for (let i = 0; i < refs.length; i++) {
        const item = get({ key: refs[i] });
        if (item && item.type === 'media:image') {
            return item._id;
        }
    }
    return null;
}

export function GET(): Response {
    const content = getContent();
    const imageId = pickImageId(content);
    const view = resolve('preview.html');
    const model = {
        cssUrl: assetUrl({ path: 'styles.css' }),
        displayName: content.displayName || null,
        imageUrl: imageId ? imageUrl({ id: imageId, scale: 'width(500)' }) : null
    };
    return {
        body: render(view, model)
    };
}
