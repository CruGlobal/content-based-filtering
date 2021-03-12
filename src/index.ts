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

    console.info('Connecting to BigQuery...');
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
      // @ts-ignore package typings are wrong
      types: { lockfile: [{ uri: 'string', payloadHash: 'INT64' }] },
    });

    for await (const recommendation of stream) {
      switch (recommendation.operation) {
        case OperationEnum.Create:
        case OperationEnum.Update:
          await putRecommendation(recommendation);
          lockfile[recommendation.uri] = recommendation.payloadHash;
          break;
        case OperationEnum.Delete:
          await deleteRecommendation(recommendation);
          delete lockfile[recommendation.uri];
          break;
        default:
          rollbar.error('Unexpected operation value', recommendation);
          break;
      }
    }
    console.info('All rows retrieved.');
    await saveLockfile(lockfile);
    console.info('Done.');
  } catch (error) {
    console.error(error);
    await rollbar.error(error.message, error);
  }
}
