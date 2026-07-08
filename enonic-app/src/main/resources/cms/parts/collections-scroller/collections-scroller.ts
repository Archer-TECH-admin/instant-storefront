import { getComponent } from '/lib/xp/portal';
import type { Response } from '@enonic-types/core';

export function GET(): Response {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = getComponent() as any;
    const heading = part?.config?.heading || 'Collections';
    const count = part?.config?.count || 3;
    return {
        body: `<div style="padding:1rem;background:#f8f9fa;border:1px dashed #ccc;border-radius:4px;font-family:sans-serif;font-size:14px">
            <strong style="display:block;margin-bottom:6px;color:#333">&#128083; Collections Scroller</strong>
            <div style="color:#555">Heading: <em>${heading}</em> &mdash; showing ${count} collections</div>
        </div>`,
        contentType: 'text/html',
    };
}
