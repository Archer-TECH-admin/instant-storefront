import { getContent } from '/lib/xp/portal';
import type { Response } from '@enonic-types/core';

export function GET(): Response {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = getContent() as any;
    const handle = content?.data?.medusaHandle || '(not set)';
    const heading = content?.data?.heading || '';
    return {
        body: `<div style="padding:1rem;background:#f8f9fa;border:1px dashed #ccc;border-radius:4px;font-family:sans-serif;font-size:14px">
            <strong style="display:block;margin-bottom:6px;color:#333">&#128722; Product Detail</strong>
            <div style="color:#555">Handle: <code style="background:#e9ecef;padding:2px 6px;border-radius:3px">${handle}</code></div>
            ${heading ? `<div style="color:#555;margin-top:4px">Heading: <em>${heading}</em></div>` : ''}
        </div>`,
        contentType: 'text/html',
    };
}
