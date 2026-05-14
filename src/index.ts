import { BigQuery } from '@google-cloud/bigquery'

import { query } from './query.js'
import {
  deleteRecommendation,
  loadLockfile,
  putRecommendation,
  saveLockfile,
} from './s3.js'
import { type Lockfile, OperationEnum, type Recommendation } from './types.js'

interface HandlerResult {
  statusCode: number
  body: string
}

let cachedBigQuery: BigQuery | undefined
function bigQueryClient(): BigQuery {
  if (cachedBigQuery) return cachedBigQuery
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  if (!raw) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON env var was not set')
  }
  const credentials = JSON.parse(raw) as { project_id?: string } & Record<string, unknown>
  cachedBigQuery = new BigQuery({
    credentials,
    projectId: credentials.project_id,
  })
  return cachedBigQuery
}

export async function handler(): Promise<HandlerResult | void> {
  try {
    console.info('Starting now...')

    const lockfile: Lockfile = await loadLockfile()

    console.info('Running changed recommendations query on BigQuery...')
    const stream: AsyncIterable<Recommendation> = bigQueryClient().createQueryStream({
      query,
      parameterMode: 'NAMED',
      params: {
        lockfile: Object.entries(lockfile).map(([uri, payloadHash]) => ({
          uri,
          payloadHash,
        })),
      },
      types: { lockfile: [{ uri: 'string', payloadHash: 'string' }] },
    })

    let putRecordCount = 0
    let deletedRecordCount = 0

    const sendRecommendationToS3 = async (recommendation: Recommendation) => {
      switch (recommendation.operation) {
        case OperationEnum.Create:
        case OperationEnum.Update:
          await putRecommendation(recommendation)
          lockfile[recommendation.uri] = recommendation.payloadHash
          putRecordCount++
          break
        case OperationEnum.Delete:
          await deleteRecommendation(recommendation)
          delete lockfile[recommendation.uri]
          deletedRecordCount++
          break
        default:
          console.error('Unexpected operation value', recommendation)
          break
      }

      const s3RecordsUpdated = putRecordCount + deletedRecordCount
      if (s3RecordsUpdated % 100 === 0) {
        console.info(`${s3RecordsUpdated} S3 records updated`)
      }
    }

    const recommendations: Promise<void>[] = []
    for await (const recommendation of stream) {
      recommendations.push(sendRecommendationToS3(recommendation))
    }
    console.info(`${recommendations.length} rows retrieved.`)

    await Promise.all(recommendations)

    console.info(`${putRecordCount} recommendations pushed to S3.`)
    console.info(`${deletedRecordCount} recommendations deleted from S3.`)
    if (putRecordCount + deletedRecordCount !== recommendations.length) {
      console.warn('Mismatch between rows retrieved and S3 objects modified')
    }
    if (putRecordCount > 0 || deletedRecordCount > 0) {
      await saveLockfile(lockfile)
    }
    console.info('Done.')

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Successfully copied records from BigQuery to S3',
          results: {
            rowsRetrieved: recommendations.length,
            recordsPushed: putRecordCount,
            recordsDeleted: deletedRecordCount,
          },
        },
        null,
        2,
      ),
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}
