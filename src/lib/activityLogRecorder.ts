import type { RecordActivityInput } from '@/types/activityLog';

type ActivityRecorder = (input: RecordActivityInput) => void;

let recorder: ActivityRecorder | null = null;

/** Registers the active activity log writer (set by ActivityLogProvider). */
export function setActivityLogRecorder(nextRecorder: ActivityRecorder | null): void {
  recorder = nextRecorder;
}

/** Appends an activity log entry when a recorder is registered. */
export function recordActivity(input: RecordActivityInput): void {
  recorder?.(input);
}
