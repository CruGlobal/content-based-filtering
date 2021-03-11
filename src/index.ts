import { BigQuery } from '@google-cloud/bigquery';
import { rollbar } from '../config/rollbar';

export async function handler() {
  try {
    console.log('starting now...');
    const client = new BigQuery();
  } catch (error) {
    console.error(error);
    await rollbar.error(error.message, error);
  }
}
