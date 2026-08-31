// Assignment order types
export const ROUND_ROBIN = 'round_robin';
export const BALANCED = 'balanced';

// Assignment priority types
export const EARLIEST_CREATED = 'earliest_created';
export const LONGEST_WAITING = 'longest_waiting';

// Default values for fair distribution
export const DEFAULT_FAIR_DISTRIBUTION_LIMIT = 100;
export const DEFAULT_FAIR_DISTRIBUTION_WINDOW = 3600;

// A cap below one conversation would block every agent, so the backend rejects it too
export const MIN_FAIR_DISTRIBUTION_LIMIT = 1;
export const MAX_FAIR_DISTRIBUTION_LIMIT = 100000;

// Default age threshold for excluding stale unassigned conversations (7 days)
export const DEFAULT_EXCLUDE_OLDER_THAN_HOURS = 168;

// Options groupings
export const OPTIONS = {
  ORDER: [ROUND_ROBIN, BALANCED],
  PRIORITY: [EARLIEST_CREATED, LONGEST_WAITING],
};
