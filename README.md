# Content Based Filtering

**Cru.org Recommendations**

Queries BigQuery for recommendations that need to be pushed to S3

## How it works

1. Should be triggered by a webhook when the recommendations engine has finished and updated recommendations in BigQuery
2. Loads `lockfile.json` from S3 if it exists. `lockfile.json` is a JS object/map where keys are article URIs and values are a hash of the response JSON currently stored in S3 containing data for that article's recommendations.
3. Sends contents of `lockfile.json` to BigQuery as an array of structs for it to diff against the current recommendations table.
4. Receives rows from BigQuery corresponding to S3 records that need to be created, updated, or deleted.
5. Sends requests to S3 in parallel to push or delete objects as needed.
6. Stores updated lockfile .
   recommendations table from BigQuery to generate a JSON file for each

## Project setup

1. Copy `.env` to `.env.development` and fill in missing environment variables
2. Run `yarn` to install dependencies
3. Run `yarn start` to run function locally using a `stage` of `development` (configured in start script in `package.json`)
4. Use `assume-role -e staging -n fancy-api -- yarn start` (https://github.com/CruGlobal/ecs_config#assume-role) to run with AWS secrets locally
