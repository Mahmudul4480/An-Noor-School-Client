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
] as const;

/** Sections per class. Classes not listed here have no sections. */
export const CLASS_SECTIONS: Record<string, readonly string[]> = {
  Play: ['Rawdah', 'Nabat'],
  Nursery: ['Alwan', 'Qamar'],
  KG: ['Marwa', 'Taqwa'],
};

export function sectionsForClass(className: string | undefined): readonly string[] {
  return (className && CLASS_SECTIONS[className]) || [];
}

export const GENDER_OPTIONS = ['Male', 'Female'] as const;

export type SchoolClass = (typeof CLASS_OPTIONS)[number];
export type Gender = (typeof GENDER_OPTIONS)[number];
