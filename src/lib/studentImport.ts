import * as XLSX from 'xlsx';
import type { ParsedStudentRow, Student } from '../types';

type StudentField = keyof Omit<
  Student,
  'status' | 'admissionId' | 'inactiveReason' | 'photoUrl' | 'idCardIssuedAt' | 'academicYear' | 'dob' | 'gender' | 'fatherName'
>;

const COLUMN_ALIASES: Record<StudentField, string[]> = {
  studentId: ['studentid', 'student id', 'id', 'student_id', 'ans id', 'student code'],
  name: ['name', 'student name', 'full name', 'studentname', 'student'],
  class: ['class', 'grade', 'class name', 'classname'],
  section: ['section', 'sec', 'group'],
  roll: ['roll', 'roll no', 'roll number', 'rollno'],
  guardianName: ['guardianname', 'guardian name', 'parent name', 'parent'],
  guardianContact: ['guardiancontact', 'guardian contact', 'phone', 'mobile', 'contact', 'guardian phone'],
  guardianEmail: ['guardianemail', 'guardian email', 'email', 'parent email'],
};

const TEMPLATE_HEADERS = [
  'Student ID',
  'Name',
  'Class',
  'Section',
  'Roll',
  'Guardian Name',
  'Guardian Contact',
  'Guardian Email',
];

const SAMPLE_ROWS = [
  ['ANS-2024-001', 'Omar Ahmed', 'Grade 4', 'Sapphire', '05', 'Ahmedullah', '01712345678', 'ahmed@example.com'],
  ['ANS-2024-002', 'Sarah Khan', 'Grade 4', 'Sapphire', '06', 'Karim Khan', '01911223344', 'karim@example.com'],
];

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function mapHeaders(headers: string[]): Partial<Record<StudentField, number>> {
  const mapping: Partial<Record<StudentField, number>> = {};

  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (!normalized) return;

    (Object.entries(COLUMN_ALIASES) as [StudentField, string[]][]).forEach(([field, aliases]) => {
      if (mapping[field] !== undefined) return;
      if (aliases.includes(normalized)) {
        mapping[field] = index;
      }
    });
  });

  return mapping;
}

function parseRow(row: unknown[], rowNumber: number, mapping: Partial<Record<StudentField, number>>): ParsedStudentRow {
  const errors: string[] = [];
  const getValue = (field: StudentField) => {
    const index = mapping[field];
    if (index === undefined) return '';
    return normalizeCell(row[index]);
  };

  const studentId = getValue('studentId');
  const name = getValue('name');
  const studentClass = getValue('class');
  const guardianContact = getValue('guardianContact');

  if (!mapping.studentId) errors.push('Student ID column not found in file.');
  if (!mapping.name) errors.push('Name column not found in file.');
  if (!mapping.class) errors.push('Class column not found in file.');
  if (!mapping.guardianContact) errors.push('Guardian Contact column not found in file.');

  if (!studentId) errors.push('Student ID is required.');
  if (!name) errors.push('Name is required.');
  if (!studentClass) errors.push('Class is required.');
  if (!guardianContact) errors.push('Guardian Contact is required.');

  if (errors.length > 0) {
    return { rowNumber, student: null, errors };
  }

  const student: Student = {
    studentId,
    name,
    class: studentClass,
    section: getValue('section') || undefined,
    roll: getValue('roll') || undefined,
    guardianName: getValue('guardianName') || undefined,
    guardianContact,
    guardianEmail: getValue('guardianEmail') || undefined,
    status: 'Setup Needed',
  };

  return { rowNumber, student, errors: [] };
}

function sheetToRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  }) as unknown[][];
}

export async function parseStudentSpreadsheet(file: File): Promise<ParsedStudentRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error('The uploaded file has no worksheet.');
  }

  const rows = sheetToRows(sheet);
  if (rows.length === 0) {
    throw new Error('The uploaded file is empty.');
  }

  const headerRow = rows[0].map((cell) => normalizeCell(cell));
  const mapping = mapHeaders(headerRow);

  const requiredFields: StudentField[] = ['studentId', 'name', 'class', 'guardianContact'];
  const missingColumns = requiredFields.filter((field) => mapping[field] === undefined);

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required columns: ${missingColumns.join(', ')}. Download the template and match the headers.`,
    );
  }

  const dataRows = rows.slice(1).filter((row) => row.some((cell) => normalizeCell(cell)));

  if (dataRows.length === 0) {
    throw new Error('No student rows found below the header row.');
  }

  return dataRows.map((row, index) => parseRow(row, index + 2, mapping));
}

export function downloadStudentTemplate(format: 'csv' | 'xlsx') {
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...SAMPLE_ROWS]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  if (format === 'csv') {
    XLSX.writeFile(workbook, 'an-noor-student-template.csv', { bookType: 'csv' });
    return;
  }

  XLSX.writeFile(workbook, 'an-noor-student-template.xlsx');
}

export const ACCEPTED_STUDENT_FILE_TYPES = '.csv,.xlsx,.xls';

export const STUDENT_TEMPLATE_COLUMNS = TEMPLATE_HEADERS;
