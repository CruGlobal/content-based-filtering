# Content Based Filtering

**Cru.org Recommendations**

Queries BigQuery for recommendations that need to be pushed to S3.

## How it works

1. Triggered by a webhook (or the 10-minute schedule) when the recommendations engine has finished and has updated recommendations in BigQuery.
2. Loads `lockfile.json` from S3 if it exists. `lockfile.json` is a JS object/map where keys are article URIs and values are a hash of the response JSON currently stored in S3 containing data for that article's recommendations.
3. Sends contents of `lockfile.json` to BigQuery as an array of structs for it to diff against the current recommendations table.
4. Queries the recommendations table to generate a JSON for each page and returns only changed rows.
5. Receives rows from BigQuery corresponding to S3 records that need to be created, updated, or deleted.
6. Sends requests to S3 in parallel to push or delete objects as needed.
7. Stores the updated `lockfile.json`.

## Build & deploy

This app uses the [Cru Lambda template](https://github.com/CruGlobal/cru-app-lambda-template) build/deploy pattern. Code is bundled with [esbuild](https://esbuild.github.io/) into `dist/handler.js` and packaged into a container image via the `Dockerfile`. Builds and deploys are managed by [`build-deploy-lambda.yml`](.github/workflows/build-deploy-lambda.yml): pushes to `main` or `staging` build an ECR image and trigger a Lambda deploy through the [cru-deploy](https://github.com/CruGlobal/cru-deploy/actions) repo. The underlying Terraform lives in [cru-terraform](https://github.com/CruGlobal/cru-terraform).

## Required environment

These are populated at runtime by the [secrets-lambda-extension](https://github.com/CruGlobal/secrets-lambda-extension) from the app's AWS Secrets Manager entries (managed in [cru-terraform](https://github.com/CruGlobal/cru-terraform)):

| Variable | Description |
|---|---|
| `S3_BUCKET_NAME` | Destination bucket for the per-article recommendation JSON and the `lockfile.json`. |
| `BIGQUERY_TABLE_NAME` | Fully-qualified BigQuery table to read recommendations from. |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Full JSON contents of the Google service account key used by `@google-cloud/bigquery`. The `BigQuery` client receives it via the `credentials` option — no keyfile is written to disk. |

The Datadog Lambda extension (also baked into the image) covers logs, traces, and error reporting; there is no Rollbar wiring.

## Local development

```bash
asdf install nodejs    # picks up the version in .tool-versions (24.15.0)
npm install
npm run typecheck
npm test               # vitest smoke test
npm run build          # produces dist/handler.js
```

The handler can't be exercised end-to-end locally without real BigQuery + S3 credentials, so iteration is generally faster via `npm run typecheck` + a `staging` push.
