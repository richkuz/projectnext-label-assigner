Useful GraphQL queries to use with the GraphiQL app to query GitHub next proejcts.


Query 20 projects and details about 20 items in each

```graphql
{
  viewer {
    id
    login
    organization(login: "elastic") {
      projectsNext(first: 20) {
        edges {
          node {
            title
            description
            fields(first: 10) {
              edges {
                node {
                  name
                }
              }
            }
            items(first: 10) {
              edges {
                node {
                  id
                  title
                  content {
                    ... on Issue {
                      title
                    }
                    ... on PullRequest {
                      title
                    }
                  }
                  fieldValues(first: 10) {
                    edges {
                      node {
                        id
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

Find a project ID by number:

```
{
  viewer {
    id
    login
    organization(login: "elastic") {
      projectNext(number: 526) {
        id
      }
    }
  }
}
```
