import * as contentLib from '/lib/xp/content';
import * as contextLib from '/lib/xp/context';
import * as nodeLib from '/lib/xp/node';

const REPO = 'com.enonic.cms.hmdb';
const APP = 'com.enonic.app.hmdb';
const APP_DASHED = 'com-enonic-app-hmdb';
const SUPPORTS = `${APP}:product-page`;
const PAGE_DESCRIPTOR = `${APP}:product`;
const PART_DESCRIPTOR = `${APP}:product-detail`;
const TEMPLATE_QUERY = `type = 'portal:page-template' AND data.supports = '${SUPPORTS}'`;

function runAs<T>(branch: 'draft' | 'master', fn: () => T): T {
    return contextLib.run(
        { user: { login: 'su', idProvider: 'system' }, repository: REPO, branch },
        fn,
    );
}

function connectNode(branch: 'draft' | 'master') {
    return nodeLib.connect({
        repoId: REPO,
        branch,
        user: { login: 'su', idProvider: 'system' },
        principals: ['role:system.admin'],
    });
}

export function ensureProductPageTemplate(): void {
    log.info('[ensure-product-page-template] checking…');

    // Check master first — only skip if template is already published there
    const onMaster = runAs('master', () =>
        contentLib.query({ query: TEMPLATE_QUERY, count: 1 }),
    );
    if (onMaster.total > 0) {
        log.info('[ensure-product-page-template] template already published on master, skipping');
        return;
    }

    // Not on master — check if it exists on draft (created but never published)
    const onDraft = runAs('draft', () =>
        contentLib.query({ query: TEMPLATE_QUERY, count: 1 }),
    );

    const draftConn = connectNode('draft');

    let nodePath: string;

    if (onDraft.total > 0) {
        // Exists on draft, just needs a push — also re-set components in case they weren't saved
        const hit = onDraft.hits[0];
        nodePath = '/content' + hit._path;
        log.info(`[ensure-product-page-template] found on draft only, will push: ${hit._path}`);

        draftConn.modify({
            key: hit._id,
            editor: (node) => {
                (node as unknown as Record<string, unknown>)['components'] = buildComponents();
                return node;
            },
        });
    } else {
        // Create fresh
        const folderResult = runAs('draft', () =>
            contentLib.query({ query: "type = 'portal:template-folder'", count: 1 }),
        );
        if (folderResult.total === 0) {
            log.warning('[ensure-product-page-template] no template folder found, skipping');
            return;
        }
        const folderPath = folderResult.hits[0]._path;
        log.info(`[ensure-product-page-template] using template folder: ${folderPath}`);

        const created = runAs('draft', () =>
            contentLib.create({
                parentPath: folderPath,
                name: 'product-page',
                displayName: 'Product Page',
                contentType: 'portal:page-template',
                data: { supports: SUPPORTS } as unknown as Parameters<typeof contentLib.create>[0]['data'],
            }),
        );
        if (!created) {
            log.error('[ensure-product-page-template] contentLib.create returned null');
            return;
        }
        nodePath = '/content' + created._path;
        log.info(`[ensure-product-page-template] created template node: ${created._path}`);

        draftConn.modify({
            key: created._id,
            editor: (node) => {
                (node as unknown as Record<string, unknown>)['components'] = buildComponents();
                return node;
            },
        });
        log.info('[ensure-product-page-template] components set on draft');
    }

    // Push to master
    const pushResult = draftConn.push({
        keys: [nodePath],
        target: 'master',
        resolve: true,
    });
    const ok = (pushResult.success || []).length;
    const ko = (pushResult.failed || []).length;
    log.info(`[ensure-product-page-template] pushed to master: success=${ok} failed=${ko}`);

    log.info('[ensure-product-page-template] done');
}

function buildComponents(): unknown[] {
    return [
        {
            type: 'page',
            path: '/',
            page: {
                descriptor: PAGE_DESCRIPTOR,
                customized: false,
                config: { [APP_DASHED]: { product: {} } },
            },
        },
        {
            type: 'part',
            path: '/main/0',
            part: { descriptor: PART_DESCRIPTOR },
        },
    ];
}
