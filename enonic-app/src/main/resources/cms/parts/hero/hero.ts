import { getComponent } from '/lib/xp/portal';
import type { Response } from '@enonic-types/core';

export function GET(): Response {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = getComponent() as any;
    const headline = part?.config?.headline || '(no headline)';
    const subtext = part?.config?.subtext || '';
    return {
        body: `<div style="padding:2rem;background:#1a1a1a;color:#fff;font-family:sans-serif;font-size:14px;min-height:120px;display:flex;flex-direction:column;justify-content:center">
            <strong style="display:block;margin-bottom:6px;font-size:18px">&#127775; Hero</strong>
            <div style="opacity:0.9;font-size:16px">${headline}</div>
            ${subtext ? `<div style="opacity:0.7;margin-top:4px">${subtext}</div>` : ''}
        </div>`,
        contentType: 'text/html',
    };
}
