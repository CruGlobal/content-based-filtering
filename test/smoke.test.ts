import { describe, expect, it } from 'vitest'

describe('handler module', () => {
  it('exports an async handler function', async () => {
    // Set required env vars before the module loads — index.ts pulls them
    // in transitively at top-level via s3.ts/query.ts.
    process.env.S3_BUCKET_NAME ??= 'test-bucket'
    process.env.BIGQUERY_TABLE_NAME ??= 'test-table'

    const mod = await import('../src/index.js')
    expect(typeof mod.handler).toBe('function')
  })
})
