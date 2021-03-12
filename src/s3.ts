import AWS from 'aws-sdk';
import { Lockfile, Recommendation } from './types';

const Bucket = process.env.S3_BUCKET_NAME;
if (!Bucket) {
  throw new Error('S3_BUCKET_NAME was not set');
}
const lockfileKey = 'lockfile.json';

AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

export const putRecommendation = (recommendation: Recommendation) => {
  return s3
    .putObject({
      Bucket,
      Key: `${recommendation.uri}.json`,
      Body: recommendation.payload,
    })
    .promise();
};
export const deleteRecommendation = (recommendation: Recommendation) => {
  return s3
    .deleteObject({
      Bucket,
      Key: `${recommendation.uri}.json`,
    })
    .promise();
};
export const loadLockfile = async (): Promise<Lockfile> => {
  console.log('Loading lockfile...');
  const lockfile = (
    await s3
      .getObject({
        Bucket,
        Key: lockfileKey,
      })
      .promise()
  ).Body;
  console.log('Lockfile loaded.');
  return (lockfile as Lockfile) ?? {};
};
export const saveLockfile = async (lockfile: Lockfile) => {
  console.info('Saving lockfile...');
  await s3
    .putObject({
      Bucket,
      Key: lockfileKey,
      Body: JSON.stringify(lockfile),
    })
    .promise();
  console.info('Lockfile saved.');
};
