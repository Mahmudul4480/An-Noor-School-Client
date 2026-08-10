export const CLASS_OPTIONS = [
  'Play',
  'Nursery',
  'KG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
] as const;

export const GENDER_OPTIONS = ['Male', 'Female'] as const;

export type SchoolClass = (typeof CLASS_OPTIONS)[number];
export type Gender = (typeof GENDER_OPTIONS)[number];
