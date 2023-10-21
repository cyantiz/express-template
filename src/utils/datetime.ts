import moment from 'moment';

import config from '../config';

type UTCOffsets =
  | 'UTC-01:00'
  | 'UTC-02:00'
  | 'UTC-03:00'
  | 'UTC-04:00'
  | 'UTC-05:00'
  | 'UTC-06:00'
  | 'UTC-07:00'
  | 'UTC-08:00'
  | 'UTC-09:00'
  | 'UTC-10:00'
  | 'UTC-11:00'
  | 'UTC-12:00'
  | 'UTC+0:00'
  | 'UTC+01:00'
  | 'UTC+02:00'
  | 'UTC+03:00'
  | 'UTC+04:00'
  | 'UTC+05:00'
  | 'UTC+06:00'
  | 'UTC+07:00'
  | 'UTC+08:00'
  | 'UTC+09:00'
  | 'UTC+10:00'
  | 'UTC+11:00'
  | 'UTC+12:00';

export function isYesterdayOrBefore(date: Date | string, timezone: number) {
  const yesterday = moment().utc().add(timezone, 'h').subtract(1, 'day');

  return moment(date).add(timezone, 'h').isSameOrBefore(yesterday, 'day');
}
export function getFirstAndLastDayOfYear(year: number): {firstDay: Date; lastDay: Date} {
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);

  return {firstDay, lastDay};
}
export function getFirstAndLastDayOfMonthYear(
  month: number,
  year: number,
): {firstDayOfMonth: Date; lastDayOfMonth: Date} {
  const date = new Date();

  const firstDayOfMonth =
    month && year
      ? new Date(year, month - 1, 1)
      : new Date(date.getFullYear(), date.getMonth() - 1, 1);

  const lastDayOfMonth =
    month && year ? new Date(year, month, 0) : new Date(date.getFullYear(), date.getMonth(), 0);

  return {firstDayOfMonth, lastDayOfMonth};
}

export function getNumberOfDaysBetweenTwoDates(startDay: Date, endDay: Date): number {
  return 1 + Math.round((endDay.getTime() - startDay.getTime()) / (24 * 3600 * 1000));
}

export function setUTCOffset(date: Date, utcOffset: UTCOffsets): Date {
  const utc = utcOffset.split(/([+-:]\d+)/g);

  return new Date(date.getTime() + Number(utc[1]) * 3600 * 1000);
}

export function momentByTimezone(date?: Date): moment.Moment {
  const timezone = config.timezone;

  if (date) return moment(date).utcOffset(timezone);

  return moment().utcOffset(timezone);
}

export function isWeekend(date: Date): boolean {
  return momentByTimezone(date).day() === 6 || momentByTimezone(date).day() === 0;
}
