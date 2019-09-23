
### Run

```bash
docker-compose up --build
```

### Demo

Hit http://localhost:4000/ for the GraphQL playground and enter a query. For example:

```graphql
query {
  author(id: "ck0wn0wlw000101p1plo1bm2k") {
    name
  }
}
```

It should result in something like:

```json
{
  "data": {
    "author": {
      "name": "J.R.R Tolkien"
    }
  }
}
```