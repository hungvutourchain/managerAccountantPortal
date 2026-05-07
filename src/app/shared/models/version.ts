import { Change } from './change';

export interface Version {
  _id: string;
  objectType: string;
  objectId: string;
  version: number;
  changes: Change[];
  timestamp: Date;
  updatedBy: string;
}