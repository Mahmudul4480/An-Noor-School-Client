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

export interface ClassSectionOption {
  /** Display + stored label, e.g. "Play – Rawdah" or "Class 1" */
  label: string;
  className: string;
  section: string;
}

export const CLASS_SECTION_SEPARATOR = ' – ';

export function classSectionLabel(className?: string, section?: string): string {
  if (!className) return '';
  return section ? `${className}${CLASS_SECTION_SEPARATOR}${section}` : className;
}

/** Splits "Play – Rawdah" back into class + section (plain class names pass through). */
export function parseClassSection(label: string): { className: string; section: string } {
  const [className, section = ''] = label.split(CLASS_SECTION_SEPARATOR);
  return { className: className.trim(), section: section.trim() };
}

/** Play – Rawdah, Play – Nabat, Nursery – Alwan, …, Class 1 … Class 6 */
export const CLASS_SECTION_OPTIONS: ClassSectionOption[] = CLASS_OPTIONS.flatMap((className) => {
  const sections = sectionsForClass(className);
  return sections.length
    ? sections.map((section) => ({ label: classSectionLabel(className, section), className, section }))
    : [{ label: className, className, section: '' }];
});
