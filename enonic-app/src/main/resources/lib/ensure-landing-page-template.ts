import * as contentLib from '/lib/xp/content';
import * as contextLib from '/lib/xp/context';
import * as nodeLib from '/lib/xp/node';

const REPO = 'com.enonic.cms.hmdb';
const APP = 'com.enonic.app.hmdb';
const APP_DASHED = 'com-enonic-app-hmdb';
const SUPPORTS = `${APP}:landing-page`;
const PAGE_DESCRIPTOR = `${APP}:landing`;
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

export function ensureLandingPageTemplate(): void {
    log.info('[ensure-landing-page-template] checking…');

    // Always ensure components are correct — don't skip even if template already exists
    const onDraft = runAs('draft', () =>
        contentLib.query({ query: TEMPLATE_QUERY, count: 1 }),
    );

    const draftConn = connectNode('draft');
    let nodePath: string;

    if (onDraft.total > 0) {
        const hit = onDraft.hits[0];
        nodePath = '/content' + hit._path;
        log.info(`[ensure-landing-page-template] found on draft, re-applying components: ${hit._path}`);

        draftConn.modify({
            key: hit._id,
            editor: (node) => {
                (node as unknown as Record<string, unknown>)['components'] = buildComponents();
                return node;
            },
        });
    } else {
        const folderResult = runAs('draft', () =>
            contentLib.query({ query: "type = 'portal:template-folder'", count: 1 }),
        );
        if (folderResult.total === 0) {
            log.warning('[ensure-landing-page-template] no template folder found, skipping');
            return;
        }
        const folderPath = folderResult.hits[0]._path;

        const created = runAs('draft', () =>
            contentLib.create({
                parentPath: folderPath,
                name: 'landing-page',
                displayName: 'Landing Page',
                contentType: 'portal:page-template',
                data: { supports: SUPPORTS } as unknown as Parameters<typeof contentLib.create>[0]['data'],
            }),
        );
        if (!created) {
            log.error('[ensure-landing-page-template] contentLib.create returned null');
            return;
        }
        nodePath = '/content' + created._path;
        log.info(`[ensure-landing-page-template] created: ${created._path}`);

        draftConn.modify({
            key: created._id,
            editor: (node) => {
                (node as unknown as Record<string, unknown>)['components'] = buildComponents();
                return node;
            },
        });
    }

    const draftConn2 = connectNode('draft');
    const pushResult = draftConn2.push({
        keys: [nodePath],
        target: 'master',
        resolve: true,
    });
    const ok = (pushResult.success || []).length;
    const ko = (pushResult.failed || []).length;
    log.info(`[ensure-landing-page-template] pushed: success=${ok} failed=${ko}`);
}

function buildComponents(): unknown[] {
    return [
        {
            type: 'page',
            path: '/',
            page: {
                descriptor: PAGE_DESCRIPTOR,
                customized: false,
                config: { [APP_DASHED]: { landing: {} } },
            },
        },
    ];
}
