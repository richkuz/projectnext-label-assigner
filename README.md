# GitHub ProjectNext issue assigner action

This action operates on the new [GitHub Projects (beta)](https://docs.github.com/en/issues/trying-out-the-new-projects-experience/about-projects). The API refers to these new projects as ProjectNext, or project tables.

This action does not work on legacy GitHub projects.

This action:
  - Assigns an issue or pull request to a project when a specified label is applied
  - Removes an issue or pull request from a project when a specified label is removed

You can provide multiple label to project mappings as the action input.

## Inputs

See `examples/projectnext-workflow.yml`

### GitHub Token

Specify a secret GitHub API token with access to read/write issues, PRs, and project cards for the target project and repo.

The `GITHUB_TOKEN` secret is available by default on all action environments. This token has sufficient permissions to add and remove cards from any projects within the issue or PR's own repository.

Or generate an API token with additional privileges under https://github.com/settings/tokens. Store the secret in the workflow repository's secrets as `PAT_TOKEN` and it will take precedence over the `GITHUB_TOKEN` when the action runs. See `https://github.com/$ORG/$REPO/settings/secrets/actions`.


## Example usage

In order to use this action, create a workflow configuration file (e.g. `projectnext-workflow.yml`) in your repository's `.github/workflows` directory. *Note that you need to have GitHub Actions enabled for your repository in order for this to work!*

### A workflow configuration for assigning issues to projects

See `examples/table-workflow.yml`

## Development

To make changes to this action's source code, fork this repository and make any edits you need.

Rebuild the `dist/index.js` file to include all packages by running:
```
npm run build
```

If you are pushing many changes to your own fork and testing iteratively, you'll want to re-push the release tags so that your test projects can run actions with your new code.
```
git tag -d vX.y.z
git tag -a -m "vX.y.z" vX.y.z
git push --force origin master --tags  # BE CAREFUL!
```

GitHub's [GraphQL Explorer](https://docs.github.com/en/graphql/overview/explorer) helps when debugging queries.

### Testing

#### Unit testing
```
npm test
```
