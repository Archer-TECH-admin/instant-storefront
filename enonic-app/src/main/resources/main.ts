import * as clusterLib from '/lib/xp/cluster';
import * as contentLib from '/lib/xp/content';
import * as contextLib from '/lib/xp/context';
import * as exportLib from '/lib/xp/export';
import * as projectLib from '/lib/xp/project';
import * as taskLib from '/lib/xp/task';
import { fixBrokenPageTemplates } from './lib/fix-page-templates';
import { ensureProductPageTemplate } from './lib/ensure-product-page-template';
import { ensureLandingPageTemplate } from './lib/ensure-landing-page-template';
import { ensureHomeTemplate } from './lib/ensure-home-template';

interface ProjectData {
    id: string;
    displayName: string;
    description: string;
    language: string;
    publicRead: boolean;
}

const projectData: ProjectData = {
    id: 'hmdb',
    displayName: 'Headless Movie DB',
    description: 'Site enabled version of the Movie DB',
    language: 'en',
    publicRead: true
};

function runInContext<T>(callback: () => T): T | undefined {
    let result: T | undefined;
    try {
        result = contextLib.run({
            user: {
                login: 'su',
                idProvider: 'system'
            },
            repository: 'com.enonic.cms.' + projectData.id,
            branch: 'draft'
        }, callback);
    } catch (e) {
        log.info('Error: ' + (e as Error).message);
    }

    return result;
}

function createProject() {
    return projectLib.create(projectData);
}

function getProject() {
    return projectLib.get({
        id: projectData.id
    });
}

function createContent(): void {
    const importResult = exportLib.importNodes({
        source: resolve('/import'),
        targetNodePath: '/content',
        xslt: resolve('/import/replace_app.xsl'),
        xsltParams: {
            applicationId: app.name,
            projectName: projectData.id
        },
        versionAttributes: {
            'content.import': {
                user: contextLib.get().authInfo.user.key,
                optime: new Date().toISOString()
            },
            'vacuum.skip': {}
        },
        includeNodeIds: true
    });
    if (importResult.importErrors.length > 0) {
        log.warning('Errors:');
        importResult.importErrors.forEach(element => log.warning(element.message));
        log.info('-------------------');
    }
}

function publishRoot(): void {
    const result = contentLib.publish({
        keys: ['/hmdb'],
        includeDependencies: true
    });
    if (result.failedContents.length > 0) {
        log.warning('Could not publish imported content. failed=' + JSON.stringify(result.failedContents));
    } else {
        log.info('Published ' + result.pushedContents.length + ' content items.');
    }
}

function initProject(): void {
    runInContext(() => {
        const project = createProject();

        if (project) {
            log.info('Project "' + projectData.id + '" successfully created');
            createContent();
            publishRoot();
        } else {
            log.error('Project "' + projectData.id + '" creation failed');
        }
    });
}

function initialize(): void {
    runInContext(() => {
        const project = getProject();
        if (!project) {
            taskLib.executeFunction({
                description: 'Importing content',
                func: initProject
            });
        } else {
            log.debug(`Project ${project.id} exists, skipping import`);
        }
    });
}

function ensureCommerceApp(): void {
    try {
        contextLib.run(
            { user: { login: 'su', idProvider: 'system' } },
            () => {
                const project = projectLib.get({ id: projectData.id });
                if (!project) return;

                const existing = project.siteConfig ?? [];
                if (existing.some((c) => c.applicationKey === 'com.enonic.app.instantcommerce')) {
                    log.info('[ensure-commerce-app] already on hmdb project, skipping');
                    return;
                }

                projectLib.modify({
                    id: projectData.id,
                    editor: (p) => {
                        p.siteConfig = (p.siteConfig ?? []).concat([
                            { applicationKey: 'com.enonic.app.instantcommerce' },
                        ]);
                        return p;
                    },
                });
                log.info('[ensure-commerce-app] added com.enonic.app.instantcommerce to hmdb project');
            }
        );
    } catch (e) {
        log.error('[ensure-commerce-app] failed: ' + (e as Error).message);
    }
}

if (clusterLib.isLeader()) {
    initialize();
    taskLib.executeFunction({
        description: 'Fix broken page-template references',
        func: fixBrokenPageTemplates,
    });
    taskLib.executeFunction({
        description: 'Ensure product-page template',
        func: ensureProductPageTemplate,
    });
    taskLib.executeFunction({
        description: 'Ensure landing-page template',
        func: ensureLandingPageTemplate,
    });
    taskLib.executeFunction({
        description: 'Ensure home template',
        func: ensureHomeTemplate,
    });
    taskLib.executeFunction({
        description: 'Ensure instantcommerce app on hmdb project',
        func: ensureCommerceApp,
    });
    taskLib.executeFunction({
        description: 'Delete corrupted site-settings node',
        func: () => {
            try {
                const nodeLib = require('/lib/xp/node');
                for (const branch of ['draft', 'master']) {
                    const conn = nodeLib.connect({
                        repoId: 'com.enonic.cms.hmdb',
                        branch,
                        user: { login: 'su', idProvider: 'system' },
                        principals: ['role:system.admin'],
                    });
                    conn.delete('/content/home/site-settings');
                    log.info('[cleanup] deleted site-settings from ' + branch);
                }
            } catch (e) {
                log.info('[cleanup] site-settings not found or already deleted');
            }
        },
    });
}
