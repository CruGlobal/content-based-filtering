'use strict'

module.exports = () => {
  // Use dotenv to load local development overrides
  require('dotenv').config()
  return {
    // keys defined here get added to the lambda functions environments
    ENVIRONMENT: process.env.ENVIRONMENT || 'development',
    PROJECT_NAME: process.env.PROJECT_NAME || 'content-based-filtering',
    ROLLBAR_ACCESS_TOKEN: process.env.ROLLBAR_ACCESS_TOKEN || 'secret',
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'keyfile.json',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
    BIGQUERY_TABLE_NAME: process.env.BIGQUERY_TABLE_NAME || ''
  }
}
