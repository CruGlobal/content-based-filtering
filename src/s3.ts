import { Lockfile, Recommendation } from './types';

export const putRecommendation = (recommendation: Recommendation) => {
  console.log('Put', recommendation);
};
export const deleteRecommendation = (recommendation: Recommendation) => {
  console.log('Delete', recommendation);
};
export const loadLockfile = (): Lockfile => {
  console.log('Loading lockfile...');
  console.log('Lockfile loaded.');
  return { 'page-url': 1, 'page-2-url': 2 };
};
export const saveLockfile = (lockfile: Lockfile) => {
  console.info('Saving lockfile...');
  console.log(lockfile);
  console.info('Lockfile saved.');
};
