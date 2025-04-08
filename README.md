# Content Based Filtering

**Cru.org Recommendations**

Queries BigQuery for recommendations that need to be pushed to S3

## How it works

1. Triggered by a webhook when the recommendations engine has finished and has updated recommendations in BigQuery.
2. Loads `lockfile.json` from S3 if it exists. `lockfile.json` is a JS object/map where keys are article URIs and values are a hash of the response JSON currently stored in S3 containing data for that article's recommendations.
3. Sends contents of `lockfile.json` to BigQuery as an array of structs for it to diff against the current recommendations table.
4. Queries recommendations table from BigQuery to generate a JSON for each page and returns only changed rows.
5. Receives rows from BigQuery corresponding to S3 records that need to be created, updated, or deleted.
6. Sends requests to S3 in parallel to push or delete objects as needed.
7. Stores updated `lockfile.json`.

## Project setup

### Setting up Node

First, make sure that you have a suitable version of Node.js. This project uses node v20.17.0. To check your node version, run `node --version`. If you don't have node v20.17.0 installed or a suitable version, the recommended way to install it is with [asdf](https://asdf-vm.com/), a development tool version manager.

```bash
# Install asdf and the node plugin
brew install asdf
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git

# Integrate it with your shell
# ZSH shell integration is shown here, but for installation instructions for other shells, go to https://asdf-vm.com/guide/getting-started.html#_3-install-asdf
echo -e "\n. $(brew --prefix asdf)/libexec/asdf.sh" >> ${ZDOTDIR:-~}/.zshrc

# IMPORTANT: Close that terminal tab/window and open another one to apply the changes to your shell configuration file

# Install the version of node defined in this project's .tool-versions file
asdf install nodejs

# Check that the node version is now 20.17.0
node --version
```

### Running the local server

1. Copy `.env` to `.env.development` and fill in missing environment variables
2. Run `yarn` to install dependencies
3. Run `yarn start` to run function locally using an environment of `development` (configured in start script in `package.json`)
4. Use `assume-role -e staging -n content-based-filtering -- yarn start` (https://github.com/CruGlobal/ecs_config#assume-role) to run with AWS staging secrets locally

```

```
