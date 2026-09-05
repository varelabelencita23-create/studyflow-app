import { WeekDay } from '@/types';

export const WEEK_DAYS: { key: WeekDay; label: string; shortLabel: string }[] = [
  { key: 'mon', label: 'Lunes', shortLabel: 'L' },
  { key: 'tue', label: 'Martes', shortLabel: 'M' },
  { key: 'wed', label: 'Miércoles', shortLabel: 'X' },
  { key: 'thu', label: 'Jueves', shortLabel: 'J' },
  { key: 'fri', label: 'Viernes', shortLabel: 'V' },
  { key: 'sat', label: 'Sábado', shortLabel: 'S' },
  { key: 'sun', label: 'Domingo', shortLabel: 'D' },
];

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the ISO date (yyyy-mm-dd) of the Monday of the week containing `date`. */
export function getWeekStartISO(date: Date = new Date()): string {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  return toISODate(monday);
}

/** Index (0=mon..6=sun) of today within the week, matching WEEK_DAYS order. */
export function getTodayWeekDayIndex(date: Date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function getTodayWeekDayKey(date: Date = new Date()): WeekDay {
  return WEEK_DAYS[getTodayWeekDayIndex(date)].key;
}

export function formatWeekRangeLabel(weekStartISO: string): string {
  const [year, month, day] = weekStartISO.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];

  if (startMonth === endMonth) {
    return `Semana del ${start.getDate()} al ${end.getDate()} de ${endMonth}`;
  }
  return `Semana del ${start.getDate()} de ${startMonth} al ${end.getDate()} de ${endMonth}`;
}
