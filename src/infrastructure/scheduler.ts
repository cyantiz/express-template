import cron from 'node-cron';

export interface ScheduleOptions {
  scheduled: boolean;

  timezone: string;

  recoverMissedExecutions?: boolean;
}

export function schedule(
  job: () => Promise<any>,
  cronExpression: string,
  options?: ScheduleOptions,
): void {
  cron.schedule(cronExpression, async () => await job(), options);
}
