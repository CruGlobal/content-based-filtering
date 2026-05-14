export interface Recommendation {
  uri: string
  payload?: string
  payloadHash?: string
  operation: OperationEnum
}

export enum OperationEnum {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export interface Lockfile {
  [uri: string]: Recommendation['payloadHash']
}
