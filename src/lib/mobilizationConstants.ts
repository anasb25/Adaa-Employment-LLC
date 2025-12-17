import { MobilizationStatus, MobStatus, JobStatus } from '../types/mobilization';

export const MOBILIZATION_STATUS_OPTIONS = [
  { value: MobilizationStatus.ACTIVE, label: 'Active' },
  { value: MobilizationStatus.INACTIVE, label: 'Inactive' },
];

export const MOB_STATUS_OPTIONS = [
  { value: 'mobilized', label: 'Mobilized' },
  { value: 'demobilized', label: 'Demobilized' },
];

export const JOB_STATUS_OPTIONS = [
  { value: 'on_job', label: 'On Job' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_vacation', label: 'On Vacation' },
  { value: 'absconded', label: 'Absconded' },
];

export const MOB_STATUS_COLORS: Record<MobStatus, string> = {
  [MobStatus.MOBILIZED]: 'bg-green-100 text-green-800',
  [MobStatus.DEMOBILIZED]: 'bg-gray-100 text-gray-800',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  [JobStatus.ON_JOB]: 'bg-blue-100 text-blue-800',
  [JobStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [JobStatus.ON_VACATION]: 'bg-yellow-100 text-yellow-800',
  [JobStatus.ABSCONDED]: 'bg-purple-100 text-purple-800',
};

