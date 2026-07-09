import * as contentLib from '/lib/xp/content';
import * as contextLib from '/lib/xp/context';
import * as nodeLib from '/lib/xp/node';

const REPO = 'com.enonic.cms.hmdb';
const CONTENT_TYPE = 'com.enonic.app.hmdb:site-settings';
const HOME_PAGE_DESCRIPTOR = 'com.enonic.app.hmdb:home';
const SETTINGS_PART_DESCRIPTOR = 'com.enonic.app.hmdb:site-settings';

const INITIAL_CONFIG = {
    storeName: 'Instant Commerce',
    shippingLabel: 'Shipping to:',
    menuLinks: [
        { label: 'Home', url: '/' },
        { label: 'Store', url: '/store' },
        { label: 'Account', url: '/account' },
        { label: 'Cart', url: '/cart' },
    ],
    footerBrand: 'Instant Commerce',
    footerCopyright: 'Instant Commerce. All rights reserved.',
    footerColumnHeading: 'Enonic',
    footerLinks: [
        { label: 'Enonic.com', url: 'https://enonic.com' },
        { label: 'Documentation', url: 'https://developer.enonic.com' },
        { label: 'Market', url: 'https://market.enonic.com' },
    ],
};

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

function ensureNextxpInSiteConfig(): void {
    try {
        // nextxp reads its per-site config from the portal:site content's siteConfig,
        // NOT from projectLib. We need to modify the content directly.
        const siteResult = runAs('draft', () =>
            contentLib.query({ query: "type = 'portal:site'", count: 1 }),
        );
        if (!siteResult || siteResult.total === 0) return;

        const site = siteResult.hits[0] as unknown as {
            _id: string;
            data: { siteConfig?: Array<{ applicationKey: string; config: Record<string, unknown> }> };
        };
        const existingApps = site.data?.siteConfig ?? [];
        if (existingApps.some((c) => c.applicationKey === 'com.enonic.app.nextxp')) {
            log.info('[ensure-site-settings] nextxp already in portal:site siteConfig');
            return;
        }

        runAs('draft', () => {
            contentLib.modify({
                key: site._id,
                editor: (content) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const s = content as unknown as any;
                    s.data = s.data || {};
                    s.data.siteConfig = (s.data.siteConfig || []).concat([{
                        applicationKey: 'com.enonic.app.nextxp',
                        config: {},
                    }]);
                    return content;
                },
            });
        });

        // Push to master so nextxp sees the config in live mode too
        const siteNodePath = '/content' + siteResult.hits[0]._path;
        connectNode('draft').push({ keys: [siteNodePath], target: 'master', resolve: false });
        log.info('[ensure-site-settings] added nextxp to portal:site siteConfig');
    } catch (e) {
        log.error('[ensure-site-settings] ensureNextxpInSiteConfig failed: ' + (e as Error).message);
    }
}

function ensureHomePageWithPart(): void {
    try {
        const homeSite = runAs('draft', () =>
            contentLib.query({ query: "type = 'portal:site'", count: 1 }),
        );
        if (!homeSite || homeSite.total === 0) {
            log.error('[ensure-site-settings] portal:site not found');
            return;
        }

        const siteId = homeSite.hits[0]._id;
        const siteNodePath = '/content' + homeSite.hits[0]._path;

        // Check if the home page descriptor is already applied with the correct part
        // Use Guillotine pageAsJson to verify the part descriptor is set (not null)
        let alreadyCorrect = false;
        try {
            const checkResult = runAs('master', () =>
                contentLib.query({ query: "type = 'portal:site'", count: 1 }),
            );
            if (checkResult && checkResult.total > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const site = checkResult.hits[0] as any;
                const firstComp = site?.page?.regions?.main?.components?.[0];
                if (firstComp?.descriptor === SETTINGS_PART_DESCRIPTOR) {
                    log.info('[ensure-site-settings] home page already configured, skipping');
                    alreadyCorrect = true;
                }
            }
        } catch (_) { /* ignore */ }
        if (alreadyCorrect) return;

        const draftConn = connectNode('draft');

        // Apply the home page descriptor with the site-settings part in the main region.
        // PartComponent in XP: descriptor and config are TOP-LEVEL on the component (not nested
        // under a 'part' sub-object — that is the Guillotine response shape, not the write shape).
        runAs('draft', () => {
            contentLib.modify({
                key: siteId,
                editor: (content) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (content as unknown as Record<string, unknown>)['page'] = {
                        descriptor: HOME_PAGE_DESCRIPTOR,
                        config: {},
                        regions: {
                            main: {
                                name: 'main',
                                components: [
                                    {
                                        type: 'part',
                                        path: '/main/0',
                                        descriptor: SETTINGS_PART_DESCRIPTOR,
                                        config: {
                                            'com-enonic-app-hmdb': {
                                                'site-settings': INITIAL_CONFIG,
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    };
                    return content;
                },
            });
        });

        // Publish HOME to master so the live site sees the updated page
        const pushResult = draftConn.push({
            keys: [siteNodePath],
            target: 'master',
            resolve: false,
        });
        const ok = (pushResult.success || []).length;
        log.info('[ensure-site-settings] home page set with site-settings part, pushed: success=' + ok);
    } catch (e) {
        log.error('[ensure-site-settings] ensureHomePageWithPart failed: ' + (e as Error).message);
    }
}

function ensureSiteSettingsContent(): void {
    const siteResult = runAs('draft', () =>
        contentLib.query({ query: "type = 'portal:site'", count: 1 }),
    );
    if (!siteResult || siteResult.total === 0) return;

    const siteNodePath = '/content' + siteResult.hits[0]._path;
    const targetNodePath = siteNodePath + '/site-settings';

    const draftConn = connectNode('draft');
    const masterConn = connectNode('master');

    const masterNode = masterConn.get(targetNodePath) as unknown as Record<string, unknown> | null;
    if (masterNode && masterNode['_nodeType'] === 'content') {
        log.info('[ensure-site-settings] content item already on master, skipping');
        return;
    }

    if (masterNode) {
        masterConn.delete(targetNodePath);
    }

    const draftNode = draftConn.get(targetNodePath) as unknown as Record<string, unknown> | null;
    if (!draftNode || draftNode['_nodeType'] !== 'content') {
        if (draftNode) draftConn.delete(targetNodePath);

        draftConn.create({
            _name: 'site-settings',
            _parentPath: siteNodePath,
            _nodeType: 'content',
            type: CONTENT_TYPE,
            displayName: 'Site Settings',
            language: 'en',
            valid: true,
            data: INITIAL_CONFIG,
        });
    }

    const pushResult = draftConn.push({ keys: [targetNodePath], target: 'master', resolve: true });
    const ok = (pushResult.success || []).length;
    log.info('[ensure-site-settings] content item pushed: success=' + ok);
}

export function ensureSiteSettings(): void {
    log.info('[ensure-site-settings] checking…');
    ensureNextxpInSiteConfig();
    ensureSiteSettingsContent();
    ensureHomePageWithPart();
}
