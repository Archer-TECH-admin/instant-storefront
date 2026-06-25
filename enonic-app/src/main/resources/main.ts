import * as clusterLib from '/lib/xp/cluster';
import * as contentLib from '/lib/xp/content';
import * as contextLib from '/lib/xp/context';
import * as exportLib from '/lib/xp/export';
import * as projectLib from '/lib/xp/project';
import * as taskLib from '/lib/xp/task';
import { fixBrokenPageTemplates } from './lib/fix-page-templates';

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

if (clusterLib.isLeader()) {
    initialize();
    taskLib.executeFunction({
        description: 'Fix broken page-template references',
        func: fixBrokenPageTemplates,
    });
}
