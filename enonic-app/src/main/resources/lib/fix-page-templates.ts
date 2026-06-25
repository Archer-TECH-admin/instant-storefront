import * as contentLib from '/lib/xp/content';
import * as contextLib from '/lib/xp/context';
import * as nodeLib from '/lib/xp/node';

const REPO = 'com.enonic.cms.hmdb';
const CONTENT_PATHS = [
    '/home/collection',
    '/home/collections',
    '/home/t-shirt',
] as const;

// contentLib.modify() only works in draft; publish propagates to master.
function adminCtxDraft<T>(fn: () => T): T {
    return contextLib.run(
        { user: { login: 'su', idProvider: 'system' }, repository: REPO, branch: 'draft' },
        fn,
    );
}

export function fixBrokenPageTemplates(): void {
    log.info('[fix-page-templates] clearing broken pageTemplate references…');

    adminCtxDraft(() => {
        // Step 1 — clear the null page-template reference on each content item.
        for (const path of CONTENT_PATHS) {
            const before = contentLib.get({ key: path });
            if (!before) {
                log.warning(`[fix-page-templates] not found in draft: "${path}"`);
                continue;
            }

            const result = contentLib.modify({
                key: path,
                requireValid: false,
                editor: (c) => {
                    // Setting page to null tells XP's content service to remove
                    // the stored page component (including any null template ref).
                    // Cast required because the TS type marks page as optional
                    // non-nullable; null is valid at the Java layer.
                    (c as Record<string, unknown>)['page'] = null;
                    return c;
                },
            });

            if (result) {
                log.info(`[fix-page-templates] draft: cleared page on "${path}"`);
            } else {
                log.warning(`[fix-page-templates] draft: modify returned null for "${path}"`);
            }
        }

        // Step 2 — push the three nodes from draft to master via the node API
        // so that master is also fixed.  nodeLib.push() bypasses the content
        // workflow gate that would otherwise block an IN_PROGRESS content.
        const draftRepo = nodeLib.connect({
            repoId: REPO,
            branch: 'draft',
            user: { login: 'su', idProvider: 'system' },
            principals: ['role:system.admin'],
        });
        const pushResult = draftRepo.push({
            keys: CONTENT_PATHS.slice().map((p) => '/content' + p),
            target: 'master',
            resolve: false,
        });
        const ok = (pushResult.success || []).length;
        const ko = (pushResult.failed || []).length;
        log.info(`[fix-page-templates] pushed to master: success=${ok} failed=${ko}`);
    });

    log.info('[fix-page-templates] done');
}
