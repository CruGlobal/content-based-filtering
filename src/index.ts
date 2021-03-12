import { BigQuery } from '@google-cloud/bigquery';
import { rollbar } from '../config/rollbar';
import { query } from './query';
import { Lockfile, OperationEnum, Recommendation } from './types';
import {
  deleteRecommendation,
  loadLockfile,
  putRecommendation,
  saveLockfile,
} from './s3';

export async function handler() {
  try {
    console.info('Starting now...');

    const lockfile: Lockfile = await loadLockfile();

    let putRecordCount = 0;
    let deletedRecordCount = 0;

    console.info('Running changed recommendations query on BigQuery...');
    const bigQuery = new BigQuery();
    const stream: AsyncIterable<Recommendation> = bigQuery.createQueryStream({
      query,
      parameterMode: 'NAMED',
      params: {
        lockfile: Object.entries(lockfile).map(([uri, payloadHash]) => ({
          uri,
          payloadHash,
        })),
      },
      // @ts-ignore package typings aren't complete
      types: { lockfile: [{ uri: 'string', payloadHash: 'string' }] },
    });

    for await (const recommendation of stream) {
      switch (recommendation.operation) {
        case OperationEnum.Create:
        case OperationEnum.Update:
          await putRecommendation(recommendation);
          lockfile[recommendation.uri] = recommendation.payloadHash;
          putRecordCount++;
          break;
        case OperationEnum.Delete:
          await deleteRecommendation(recommendation);
          delete lockfile[recommendation.uri];
          deletedRecordCount++;
          break;
        default:
          rollbar.error('Unexpected operation value', recommendation);
          break;
      }
    }
    console.info('All rows retrieved.');
    console.info(`${putRecordCount} recommendations pushed to S3.`);
    console.info(`${deletedRecordCount} recommendations deleted from S3.`);
    if (putRecordCount > 0 || deletedRecordCount > 0) {
      await saveLockfile(lockfile);
    }
    console.info('Done.');
  } catch (error) {
    console.error(error);
    await rollbar.error(error.message, error);
  }
}
