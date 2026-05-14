import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'

import type { Lockfile, Recommendation } from './types.js'

const Bucket = process.env.S3_BUCKET_NAME
if (!Bucket) {
  throw new Error('S3_BUCKET_NAME env var was not set')
}
const lockfileKey = 'lockfile.json'

const s3 = new S3Client({ region: 'us-east-1' })

export async function putRecommendation(recommendation: Recommendation): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key: `${recommendation.uri}.json`,
      Body: recommendation.payload,
      ACL: 'public-read',
    }),
  )
}

export async function deleteRecommendation(recommendation: Recommendation): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket,
      Key: `${recommendation.uri}.json`,
    }),
  )
}

export async function loadLockfile(): Promise<Lockfile> {
  console.info('Loading lockfile...')
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket,
        Key: lockfileKey,
      }),
    )
    const lockfileString = (await response.Body?.transformToString()) ?? ''
    const lockfile = lockfileString ? (JSON.parse(lockfileString) as Lockfile) : {}
    console.info('Lockfile loaded.')
    return lockfile
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      console.info("Lockfile doesn't exist. Skipping...")
      return {}
    }
    throw error
  }
}

export async function saveLockfile(lockfile: Lockfile): Promise<void> {
  console.info('Saving lockfile...')
  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key: lockfileKey,
      Body: JSON.stringify(lockfile),
    }),
  )
  console.info('Lockfile saved.')
}
