const { graphql } = require("@octokit/graphql");
const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch')

const _ = require('lodash');

class ProjectActions {

    async removeItemFromProject(octokit, context, projectNumber) {
        const { itemType, itemNumber, itemId } = context;

        if (!projectNumber) {
            throw new Error(`projectNumber is required.`);
        }

        if (!itemId) {
            throw new Error(`itemId is required.`);
        }

        const projectId = await this.findProjectId(octokit, context, projectNumber);
        if (!projectId) {
            throw new Error(`Error removing item from project: projectNumber ${projectNumber} not found`);
        }

        console.log(`Removing ${itemType} number ${itemNumber}, ID ${itemId} from project [${projectNumber}], owner "${context.owner}"`);
        await this.removeItem(octokit, projectId, itemId);
    }

    async removeItem(octokit, projectId, itemId) {
        try {
            console.log("TODO: Removing items is broken. There's no API to find an item by its origin issue ID.");
            return;
            /*
            const mutation = `
                mutation removeItem($projectId: String!, $itemId: ID!) {
                    deleteProjectNextItem(
                        input: {
                          projectId: $projectId
                          itemId: $itemId
                        }
                      ) {
                        deletedItemId
                      }
                }`
            const params = {projectId: projectId, itemId: itemId};
            console.log(`Delete item mutation:\n${mutation}`);
            console.log(`Params: ${JSON.stringify(params)}`);
            // Octokit will throw an error if GraphQL returns any error messages
            const response = await octokit(mutation, params);
            console.log(`Remove item response:\n${JSON.stringify(response)}`);
            return 'TODO';
            */
        } catch (error) {
            throw new Error(`Error creating item for item ID [${itemId}] in project ${projectId}: ${error.message}`);
        }
    }

    async addItemToProject(octokit, context, projectNumber) {
        const { itemType, itemNumber, itemId } = context;

        if (!projectNumber) {
            throw new Error(`projectNumber is required.`);
        }

        if (!itemId) {
            throw new Error(`itemId is required.`);
        }

        const projectId = await this.findProjectId(octokit, context, projectNumber);
        if (!projectId) {
            throw new Error(`Error adding item to project: projectNumber ${projectNumber} not found`);
        }

        console.log(`Creating a new item for ${itemType} number ${itemNumber}, ID ${itemId} in project [${projectNumber}], owner "${context.owner}"`);
        await this.createItem(octokit, projectId, itemId);
    }

    async findProjectId(octokit, context, projectNumber) {
        try {
            const query = `query findProjectId($owner: String!, $projectNumber: Int!) {
                organization(login: $owner) {
                    projectNext(number: $projectNumber) {
                        id
                    }
                }
            }`;
            const params = { owner: context.owner, projectNumber: projectNumber };
            console.log(`Query for project ID:\n${query}`);
            console.log(`Params: ${JSON.stringify(params)}`);
            const response = await octokit(query, params);
            console.log(`Response from query for project ID:\n${JSON.stringify(response, null, 2)}`);
            return _.get(response, 'organization.projectNext.id');
        } catch (error) {
            throw new Error(`Error querying project ID for project number ${projectNumber}: ${error.message} \n error.request: ${JSON.stringify(error.request)}`);
        }
    }

    async createItem(octokit, projectId, contentId) {
        try {
            const mutation = `
                mutation createItem($projectId: String!, $contentId: String!) {
                    addProjectNextItem(input: {projectId: $projectId contentId: $contentId}) {
                        projectNextItem {
                            id
                        }
                    }
                }`;
            console.log(`Create item mutation:\n${mutation}`);
            // Octokit will throw an error if GraphQL returns any error messages
            const response = await octokit(mutation, {projectId: projectId, contentId: contentId});
            console.log(`Create item response:\n${JSON.stringify(response)}`);
            return _.get(response, 'addProjectNextItem.projectNextItem.id');
        } catch (error) {
            throw new Error(`Error creating item for item ID [${contentId}] in project ${projectId}: ${error.message}`);
        }
    }

    normalizedGithubContext(githubContext) {
        const { repository, label, action, issue, pull_request } = githubContext.payload;
        const context = {
            owner: repository && repository.owner && repository.owner.login,
            repo: repository && repository.name,
            label: label && label.name,
            action: action,
        }

        if (githubContext.eventName == "issues") {
            context.itemType = 'Issue';
            context.itemNumber = issue && issue.number;
            context.itemId = issue && issue.node_id;
        }
        else if (githubContext.eventName == "pull_request") {
            context.itemType = 'Pull request';
            context.itemNumber = pull_request && pull_request.number;
            context.itemId = pull_request && pull_request.node_id;
        }
        return context;
    }

    getConfigs() {
        return JSON.parse(core.getInput('config')) || [];
    }

    async run() {
        console.log('Running');

        const baseUrl = process.env.GRAPHQL_API_BASE || 'https://api.github.com'
        const headers = {
            // Supply the feature flag as a header.
            'GraphQL-Features': 'projects_next_graphql',
            Authorization: `Bearer ${process.env.PAT_TOKEN || process.env.GITHUB_TOKEN}`
        }

        const octokit = graphql.defaults({
            baseUrl,
            headers,
        });

        try {
            const configs = this.getConfigs();
            console.log(`Using config: ${JSON.stringify(configs)}`);
            const context = this.normalizedGithubContext(github.context);
            console.log(`Context: ${JSON.stringify(context)}`);
            if (context.action === "labeled") {
                for (const config of configs) {
                    if (context.label === config.label) {
                        await this.addItemToProject(octokit, context, config.projectNumber);
                    }
                };

            } else if (context.action == "unlabeled") {
                for (const config of configs) {
                    if (context.label === config.label) {
                        await this.removeItemFromProject(octokit, context, config.projectNumber);
                    }
                };
            }
        } catch (error) {
            const ghContext = JSON.stringify(github.context, undefined, 2);
            core.setFailed(`Project label assigner action failed with error: ${error.message}\n Event context:\n\n${ghContext}`);
        }
    }
}

module.exports = ProjectActions;
