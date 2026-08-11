import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Download,
  Search,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Pencil,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { ParsedStudentRow, Student } from '../types';
import { CLASS_OPTIONS, GENDER_OPTIONS } from '../lib/schoolConstants';
import {
  ACCEPTED_STUDENT_FILE_TYPES,
  downloadStudentTemplate,
  parseStudentSpreadsheet,
} from '../lib/studentImport';
import { fetchStudents, filterStudents, importStudents, updateStudent } from '../lib/students';

export function StudentManagement() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [previewRows, setPreviewRows] = React.useState<ParsedStudentRow[]>([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '',
    class: '',
    section: '',
    roll: '',
    guardianName: '',
    guardianContact: '',
    guardianEmail: '',
    dob: '',
    gender: '',
    fatherName: '',
    academicYear: '',
    correctionReason: '',
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadStudents = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const visibleStudents = filterStudents(students, searchTerm);
  const validPreviewRows = previewRows.filter((row) => row.student);
  const invalidPreviewRows = previewRows.filter((row) => !row.student);

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const rows = await parseStudentSpreadsheet(file);
      setPreviewRows(rows);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the uploaded file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    const rowsToImport = validPreviewRows
      .map((row) => row.student)
      .filter((student): student is Student => Boolean(student));

    if (rowsToImport.length === 0) {
      setError('No valid student rows to import.');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const result = await importStudents(rowsToImport);
      await loadStudents();
      setShowPreview(false);
      setPreviewRows([]);
      setSuccess(
        `${result.imported} new student${result.imported === 1 ? '' : 's'} imported` +
          (result.updated > 0 ? `, ${result.updated} updated.` : '.'),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      class: student.class,
      section: student.section ?? '',
      roll: student.roll ?? '',
      guardianName: student.guardianName ?? '',
      guardianContact: student.guardianContact,
      guardianEmail: student.guardianEmail ?? '',
      dob: student.dob ?? '',
      gender: student.gender ?? '',
      fatherName: student.fatherName ?? '',
      academicYear: student.academicYear ?? '',
      correctionReason: '',
    });
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editForm.correctionReason.trim()) {
      setError('Correction reason লিখুন — কোন তথ্য ভুল ছিল তা উল্লেখ করুন।');
      return;
    }
    setSavingEdit(true);
    setError('');
    setSuccess('');
    try {
      await updateStudent({
        studentId: editingStudent.studentId,
        name: editForm.name,
        class: editForm.class,
        section: editForm.section || undefined,
        roll: editForm.roll || undefined,
        guardianName: editForm.guardianName || undefined,
        guardianContact: editForm.guardianContact,
        guardianEmail: editForm.guardianEmail || undefined,
        dob: editForm.dob || undefined,
        gender: editForm.gender || undefined,
        fatherName: editForm.fatherName || undefined,
        academicYear: editForm.academicYear || undefined,
        correctionReason: editForm.correctionReason,
        correctedBy: 'Accounts Department',
      });
      setEditingStudent(null);
      setSuccess('Student information corrected successfully.');
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">
              Student Management
            </h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              Admission Ops & Bulk Import
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-school-muted" size={14} />
              <input
                type="text"
                placeholder="Search ID/Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
              />
            </div>
            <button
              type="button"
              onClick={() => downloadStudentTemplate('csv')}
              className="px-4 py-2.5 bg-slate-50 text-school-blue border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Download size={14} /> CSV Template
            </button>
            <button
              type="button"
              onClick={() => downloadStudentTemplate('xlsx')}
              className="px-4 py-2.5 bg-slate-50 text-school-blue border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet size={14} /> Excel Template
            </button>
            <button className="px-6 py-2.5 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-2">
              <Plus size={14} /> New Admission
            </button>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
          className={cn(
            'rounded-[2rem] border-2 border-dashed p-8 text-center transition-all',
            dragActive
              ? 'border-school-gold bg-amber-50/50'
              : 'border-slate-200 bg-slate-50/50 hover:border-school-blue/30',
          )}
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white border border-school-border flex items-center justify-center text-school-blue mb-4 shadow-sm">
            {uploading ? <Loader2 size={28} className="animate-spin" /> : <Upload size={28} />}
          </div>
          <h4 className="text-sm font-black text-school-blue uppercase tracking-tight mb-2">
            Upload CSV or Excel
          </h4>
          <p className="text-xs text-school-muted font-medium mb-4 max-w-lg mx-auto">
            Student ID, Name, Class, Guardian Contact — এই columnগুলো থাকতে হবে। Section, Roll,
            Guardian Name, Guardian Email optional।
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_STUDENT_FILE_TYPES}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-colors disabled:opacity-60"
          >
            Choose File (.csv, .xlsx, .xls)
          </button>
        </div>

        {(error || success) && (
          <div
            className={cn(
              'mt-6 p-4 rounded-2xl border text-xs font-bold',
              error
                ? 'bg-red-50 border-red-100 text-red-600'
                : 'bg-emerald-50 border-emerald-100 text-emerald-700',
            )}
          >
            {error || success}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">
              Registered Students
            </h4>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              {visibleStudents.length} record{visibleStudents.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
            <p className="text-xs font-black text-school-muted uppercase tracking-widest">
              Loading students...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                  <th className="pb-4">Student ID</th>
                  <th className="pb-4">Class</th>
                  <th className="pb-4">Section</th>
                  <th className="pb-4">Guardian Contact</th>
                  <th className="pb-4">Dashboard Status</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-school-muted font-medium">
                      No students found. Upload a CSV or Excel file to get started.
                    </td>
                  </tr>
                ) : (
                  visibleStudents.map((student) => (
                    <tr key={student.studentId} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-5">
                        <p className="font-black text-school-blue">{student.studentId}</p>
                        <p className="text-[9px] font-bold text-school-muted uppercase">{student.name}</p>
                      </td>
                      <td className="py-5 font-black text-school-blue uppercase">{student.class}</td>
                      <td className="py-5 text-slate-500 font-medium">{student.section || '—'}</td>
                      <td className="py-5 text-slate-500 font-medium">{student.guardianContact}</td>
                      <td className="py-5">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter',
                            student.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-500'
                              : 'bg-amber-50 text-school-gold',
                          )}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex justify-end gap-2 text-school-blue">
                          <button
                            type="button"
                            onClick={() => openEdit(student)}
                            className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            title="Edit / Correct Info"
                          >
                            <Pencil size={14} className="text-school-blue" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-school-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">
                    Import Preview
                  </h3>
                  <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
                    {validPreviewRows.length} valid • {invalidPreviewRows.length} invalid
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-school-muted"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {invalidPreviewRows.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-school-gold" />
                      <p className="text-[10px] font-black text-school-blue uppercase tracking-widest">
                        Rows with errors
                      </p>
                    </div>
                    <div className="space-y-2">
                      {invalidPreviewRows.slice(0, 5).map((row) => (
                        <p key={row.rowNumber} className="text-xs text-amber-800">
                          Row {row.rowNumber}: {row.errors.join(' ')}
                        </p>
                      ))}
                      {invalidPreviewRows.length > 5 && (
                        <p className="text-xs text-amber-700 font-bold">
                          + {invalidPreviewRows.length - 5} more invalid rows
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                        <th className="pb-3">Row</th>
                        <th className="pb-3">Student ID</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Class</th>
                        <th className="pb-3">Guardian Contact</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {previewRows.map((row) => (
                        <tr key={row.rowNumber}>
                          <td className="py-3 font-black text-school-muted">{row.rowNumber}</td>
                          <td className="py-3 font-black text-school-blue">
                            {row.student?.studentId || '—'}
                          </td>
                          <td className="py-3">{row.student?.name || '—'}</td>
                          <td className="py-3">{row.student?.class || '—'}</td>
                          <td className="py-3">{row.student?.guardianContact || '—'}</td>
                          <td className="py-3">
                            {row.student ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-black uppercase text-[9px]">
                                <CheckCircle2 size={12} /> Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-500 font-black uppercase text-[9px]">
                                <AlertTriangle size={12} /> Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-school-border flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || validPreviewRows.length === 0}
                  onClick={handleImport}
                  className="px-6 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-school-blue hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Importing...
                    </>
                  ) : (
                    <>Import {validPreviewRows.length} Students</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-school-border flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Correct Student Info</h3>
                  <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
                    {editingStudent.studentId}
                  </p>
                </div>
                <button type="button" onClick={() => setEditingStudent(null)} className="p-2 rounded-xl hover:bg-slate-100 text-school-muted">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Student Name *" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                  <Field label="Class *" value={editForm.class} onChange={(v) => setEditForm({ ...editForm, class: v })} selectOptions={[...CLASS_OPTIONS]} />
                  <Field label="Section" value={editForm.section} onChange={(v) => setEditForm({ ...editForm, section: v })} />
                  <Field label="Roll" value={editForm.roll} onChange={(v) => setEditForm({ ...editForm, roll: v })} />
                  <Field label="Guardian Name" value={editForm.guardianName} onChange={(v) => setEditForm({ ...editForm, guardianName: v })} />
                  <Field label="Guardian Contact *" value={editForm.guardianContact} onChange={(v) => setEditForm({ ...editForm, guardianContact: v })} />
                  <Field label="Guardian Email" value={editForm.guardianEmail} onChange={(v) => setEditForm({ ...editForm, guardianEmail: v })} />
                  <Field label="Father Name" value={editForm.fatherName} onChange={(v) => setEditForm({ ...editForm, fatherName: v })} />
                  <Field label="Date of Birth" value={editForm.dob} onChange={(v) => setEditForm({ ...editForm, dob: v })} type="date" />
                  <Field label="Gender" value={editForm.gender} onChange={(v) => setEditForm({ ...editForm, gender: v })} selectOptions={[...GENDER_OPTIONS]} />
                  <Field label="Academic Year" value={editForm.academicYear} onChange={(v) => setEditForm({ ...editForm, academicYear: v })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Correction Reason *</label>
                  <textarea
                    value={editForm.correctionReason}
                    onChange={(e) => setEditForm({ ...editForm, correctionReason: e.target.value })}
                    placeholder="যেমন: Class ভুল entry হয়েছিল, Guardian mobile number update..."
                    className="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none min-h-[80px]"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingStudent(null)} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingEdit} className="px-6 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center gap-2">
                    {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                    Save Correction
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  selectOptions,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  selectOptions?: string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">{label}</label>
      {selectOptions ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
        >
          <option value="">Select...</option>
          {selectOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
        />
      )}
    </div>
  );
}
