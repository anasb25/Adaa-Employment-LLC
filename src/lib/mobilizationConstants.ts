import { MobStatus, JobStatus } from '../types/mobilization';

/** Job status -> Mobilization status: M = mobilized, D = demobilized */
export const JOB_STATUS_TO_MOB_STATUS: Record<JobStatus, MobStatus> = {
  [JobStatus.ACTIVE]: MobStatus.MOBILIZED,
  [JobStatus.CANCELLED]: MobStatus.DEMOBILIZED,
  [JobStatus.ABSCONDED]: MobStatus.DEMOBILIZED,
  [JobStatus.ANNUAL_LEAVE]: MobStatus.DEMOBILIZED,
  [JobStatus.ABSENT]: MobStatus.MOBILIZED,
  [JobStatus.SICK_LEAVE]: MobStatus.MOBILIZED,
  [JobStatus.CASUAL_LEAVE]: MobStatus.MOBILIZED,
  [JobStatus.URGENT_LEAVE]: MobStatus.DEMOBILIZED,
  [JobStatus.NOTICE_PERIOD]: MobStatus.MOBILIZED,
  [JobStatus.RESIGNED]: MobStatus.DEMOBILIZED,
  [JobStatus.IDLE]: MobStatus.DEMOBILIZED,
  [JobStatus.OFF]: MobStatus.MOBILIZED,
};

export function getMobStatusFromJobStatus(jobStatus: JobStatus): MobStatus {
  return JOB_STATUS_TO_MOB_STATUS[jobStatus] ?? MobStatus.DEMOBILIZED;
}

export const MOB_STATUS_OPTIONS = [
  { value: 'mobilized', label: 'Mobilized' },
  { value: 'demobilized', label: 'Demobilized' },
];

export const JOB_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'absconded', label: 'Absconded' },
  { value: 'annual_leave', label: 'Annual Leave' },
  { value: 'absent', label: 'Absent' },
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'casual_leave', label: 'Casual Leave' },
  { value: 'urgent_leave', label: 'Urgent Leave' },
  { value: 'notice_period', label: 'Notice Period' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'idle', label: 'Idle' },
  { value: 'off', label: 'Off' },
];

export const MOB_STATUS_COLORS: Record<MobStatus, string> = {
  [MobStatus.MOBILIZED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [MobStatus.DEMOBILIZED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  [JobStatus.ACTIVE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [JobStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  [JobStatus.ABSCONDED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  [JobStatus.ANNUAL_LEAVE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  [JobStatus.ABSENT]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  [JobStatus.SICK_LEAVE]: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  [JobStatus.CASUAL_LEAVE]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  [JobStatus.URGENT_LEAVE]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  [JobStatus.NOTICE_PERIOD]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  [JobStatus.RESIGNED]: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  [JobStatus.IDLE]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  [JobStatus.OFF]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

