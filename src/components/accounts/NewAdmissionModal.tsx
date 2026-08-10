import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, Tag, FileWarning } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  DEFAULT_FEE_ITEMS,
  computeTotals,
  createAdmission,
  fetchFeeStructure,
  uploadScannedForm,
  uploadStudentPhoto,
  uploadBirthRegDocument,
  validateDiscount,
} from '../../lib/admissions';
import { getFirebaseOperationErrorMessage } from '../../lib/auth';
import { prepareStampPhoto, STAMP_PHOTO } from '../../lib/imageUtils';
import { fetchAccounts } from '../../lib/ledger';
import { CLASS_OPTIONS, GENDER_OPTIONS } from '../../lib/schoolConstants';
import type { Admission, AdmissionDiscount, FeeItemKey, FeeStructureItem, LedgerAccount } from '../../types';

const DISCOUNT_REASON_PRESETS = [
  'Sibling Discount',
  "Teacher's Child",
  'Staff Discount',
  'Merit Scholarship',
  'Financial Hardship',
  'Other',
];

interface NewAdmissionModalProps {
  onClose: () => void;
  onCreated: (admission: Admission) => void;
}

export function NewAdmissionModal({ onClose, onCreated }: NewAdmissionModalProps) {
  const [feeItems, setFeeItems] = React.useState<FeeStructureItem[]>(DEFAULT_FEE_ITEMS);
  const [discounts, setDiscounts] = React.useState<Record<FeeItemKey, { amount: string; reason: string }>>(
    {} as Record<FeeItemKey, { amount: string; reason: string }>,
  );
  const [form, setForm] = React.useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    gender: '',
    classApplied: '',
    section: '',
    birthRegNo: '',
    guardianName: '',
    guardianContact: '',
    guardianEmail: '',
    address: '',
    academicYear: String(new Date().getFullYear()),
  });
  const [file, setFile] = React.useState<File | null>(null);
  const [birthRegFile, setBirthRegFile] = React.useState<File | null>(null);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = React.useState(false);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [receivedInAccountId, setReceivedInAccountId] = React.useState('');
  const [error, setError] = React.useState('');
  const [warning, setWarning] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingStructure, setLoadingStructure] = React.useState(true);

  React.useEffect(() => {
    Promise.all([fetchFeeStructure(), fetchAccounts()])
      .then(([structure, accountData]) => {
        setFeeItems(structure.items);
        setAccounts(accountData);
        setReceivedInAccountId(accountData[0]?.id ?? '');
      })
      .finally(() => setLoadingStructure(false));
  }, []);

  const activeDiscounts: AdmissionDiscount[] = (
    Object.entries(discounts) as [FeeItemKey, { amount: string; reason: string }][]
  )
    .map(([key, value]) => ({
      itemKey: key,
      amount: parseFloat(value.amount) || 0,
      reason: value.reason,
    }))
    .filter((discount) => discount.amount > 0);

  const totals = computeTotals(feeItems, activeDiscounts);

  const handlePhotoSelect = async (selected: File | null) => {
    if (!selected) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    setPhotoProcessing(true);
    setError('');
    try {
      const stampFile = await prepareStampPhoto(selected);
      setPhotoFile(stampFile);
      setPhotoPreview(URL.createObjectURL(stampFile));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo process করতে সমস্যা হয়েছে।');
      setPhotoFile(null);
      setPhotoPreview(null);
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleDiscountChange = (key: FeeItemKey, field: 'amount' | 'reason', value: string) => {
    setDiscounts((prev) => ({
      ...prev,
      [key]: { amount: prev[key]?.amount ?? '', reason: prev[key]?.reason ?? '', [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarning('');

    if (!form.studentName || !form.classApplied || !form.gender || !form.guardianName || !form.guardianContact) {
      setError('Student Name, Class, Gender, Guardian Name ও Guardian Contact আবশ্যক।');
      return;
    }

    if (!receivedInAccountId) {
      setError('Admission fee কোন account-এ জমা হয়েছে সেটা select করুন।');
      return;
    }

    for (const discount of activeDiscounts) {
      const validationError = validateDiscount(discount.itemKey, discount.amount, feeItems);
      if (validationError) {
        setError(validationError);
        return;
      }
      if (!discount.reason.trim()) {
        setError('Discount দিলে reason/note লেখা আবশ্যক।');
        return;
      }
    }

    setSubmitting(true);
    try {
      let scannedFormUrl: string | undefined;
      let scannedFormName: string | undefined;
      let birthRegDocUrl: string | undefined;
      let birthRegDocName: string | undefined;

      let studentPhotoUrl: string | undefined;
      const tempId = `TEMP-${Date.now()}`;

      if (birthRegFile) {
        try {
          const uploaded = await uploadBirthRegDocument(birthRegFile, tempId);
          birthRegDocUrl = uploaded.url;
          birthRegDocName = uploaded.name;
        } catch (uploadErr) {
          setWarning(getFirebaseOperationErrorMessage(uploadErr) + ' Birth Reg document upload skipped.');
        }
      }

      if (photoFile) {
        try {
          studentPhotoUrl = await uploadStudentPhoto(photoFile, tempId);
        } catch (uploadErr) {
          setWarning(getFirebaseOperationErrorMessage(uploadErr) + ' Photo upload skipped.');
        }
      }

      if (file) {
        try {
          const uploaded = await uploadScannedForm(file, `TEMP-${Date.now()}`);
          scannedFormUrl = uploaded.url;
          scannedFormName = uploaded.name;
        } catch (uploadErr) {
          setWarning(
            getFirebaseOperationErrorMessage(uploadErr) +
              ' Admission will be saved without the scanned form.',
          );
        }
      }

      const admission = await createAdmission({
        ...form,
        birthRegNo: form.birthRegNo || undefined,
        feeItems,
        discounts: activeDiscounts,
        scannedFormUrl,
        scannedFormName,
        birthRegDocUrl,
        birthRegDocName,
        studentPhotoUrl,
        receivedInAccountId,
      });

      onCreated(admission);
      onClose();
    } catch (err) {
      setError(getFirebaseOperationErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
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
          className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-school-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">New Admission</h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
                Physical form data entry → Fee breakdown → Department approval
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-school-muted">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Student Info */}
            <section className="space-y-4">
              <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">Student Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="Student Name *" value={form.studentName} onChange={(v) => setForm({ ...form, studentName: v })} />
                <FormInput label="Father's Name" value={form.fatherName} onChange={(v) => setForm({ ...form, fatherName: v })} />
                <FormInput label="Mother's Name" value={form.motherName} onChange={(v) => setForm({ ...form, motherName: v })} />
                <FormInput label="Date of Birth" type="date" value={form.dob} onChange={(v) => setForm({ ...form, dob: v })} />
                <FormSelect
                  label="Gender *"
                  value={form.gender}
                  onChange={(v) => setForm({ ...form, gender: v })}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender..."
                  required
                />
                <FormSelect
                  label="Class Applied *"
                  value={form.classApplied}
                  onChange={(v) => setForm({ ...form, classApplied: v })}
                  options={CLASS_OPTIONS}
                  placeholder="Select class..."
                  required
                />
                <FormInput label="Section" value={form.section} onChange={(v) => setForm({ ...form, section: v })} placeholder="e.g. Sapphire" />
                <FormInput label="Academic Year *" value={form.academicYear} onChange={(v) => setForm({ ...form, academicYear: v })} />
              </div>
            </section>

            {/* Birth Registration */}
            <section className="space-y-3">
              <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">Birth Registration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Birth Reg. No."
                  value={form.birthRegNo}
                  onChange={(v) => setForm({ ...form, birthRegNo: v })}
                  placeholder="e.g. 19801234567890123"
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                    Birth Reg. Certificate Upload
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <Upload size={16} className="text-school-blue shrink-0" />
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setBirthRegFile(e.target.files?.[0] ?? null)}
                      className="text-xs font-medium text-school-blue w-full"
                    />
                  </div>
                  {birthRegFile && (
                    <p className="text-[9px] font-bold text-emerald-600 truncate">{birthRegFile.name}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Guardian Info */}
            <section className="space-y-4">
              <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">Guardian Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="Guardian Name *" value={form.guardianName} onChange={(v) => setForm({ ...form, guardianName: v })} />
                <FormInput label="Guardian Contact *" value={form.guardianContact} onChange={(v) => setForm({ ...form, guardianContact: v })} />
                <FormInput label="Guardian Email" value={form.guardianEmail} onChange={(v) => setForm({ ...form, guardianEmail: v })} />
                <div className="md:col-span-3">
                  <FormInput label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                </div>
              </div>
            </section>

            {/* Student photo — stamp size for ID card */}
            <section className="space-y-3">
              <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">
                Student Photo (Stamp Size) *
              </h4>
              <div className="flex items-start gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className="relative bg-white border-2 border-dashed border-school-gold/60 overflow-hidden"
                    style={{ width: 64, height: 77 }}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Stamp preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-school-muted uppercase text-center px-1">
                        25×30mm
                      </div>
                    )}
                    {photoProcessing && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-school-blue" />
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-black text-school-gold uppercase tracking-widest">
                    ID Card Preview
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={photoProcessing}
                    onChange={(e) => handlePhotoSelect(e.target.files?.[0] ?? null)}
                    className="text-xs font-medium text-school-blue w-full"
                  />
                  <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-2 leading-relaxed">
                    Stamp size photo ({STAMP_PHOTO.label}) — white background, face center, ID card-এর মতো ছোট
                  </p>
                  <p className="text-[9px] text-school-muted font-medium mt-1">
                    Upload করলে auto crop/resize হবে 25×30mm (5:6) ratio-তে
                  </p>
                </div>
              </div>
            </section>

            {/* Payment account */}
            <section className="space-y-3">
              <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">Admission Fee Deposit Account *</h4>
              <select
                value={receivedInAccountId}
                onChange={(e) => setReceivedInAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                required
              >
                <option value="">Select account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type.toUpperCase()})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">
                Admission fee ৳ {totals.grandTotal.toLocaleString()} এই account-এ record হবে
              </p>
            </section>

            {/* Scanned form upload */}
            <section className="space-y-3">
              <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">Scanned Physical Form</h4>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-white border border-school-border flex items-center justify-center text-school-blue">
                  <Upload size={20} />
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="text-xs font-medium text-school-blue"
                  />
                  <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
                    Scan/photo of the filled physical admission form (optional but recommended)
                  </p>
                </div>
              </div>
            </section>

            {/* Fee Breakdown + Discount */}
            <section className="space-y-3">
              <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">
                Fee Breakdown & Concession/Discount
              </h4>
              {loadingStructure ? (
                <div className="py-8 text-center text-school-muted text-xs font-bold uppercase">
                  Loading fee structure...
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-school-muted font-black bg-slate-50 uppercase tracking-widest">
                        <th className="p-3">Fee Item</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-right">Discount</th>
                        <th className="p-3">Discount Note / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {feeItems.map((item) => (
                        <tr key={item.key}>
                          <td className="p-3 font-black text-school-blue uppercase">
                            {item.label}
                            {!item.discountable && (
                              <span className="ml-2 text-[8px] font-black text-red-400 uppercase">No Discount</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold text-school-blue">
                            ৳ {item.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min={0}
                              max={item.amount}
                              disabled={!item.discountable}
                              value={discounts[item.key]?.amount ?? ''}
                              onChange={(e) => handleDiscountChange(item.key, 'amount', e.target.value)}
                              placeholder="0"
                              className={cn(
                                'w-24 text-right px-3 py-1.5 rounded-lg border text-xs font-bold outline-none',
                                item.discountable
                                  ? 'bg-white border-slate-200 focus:ring-2 ring-school-gold/30'
                                  : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed',
                              )}
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              disabled={!item.discountable}
                              list="discount-reason-presets"
                              value={discounts[item.key]?.reason ?? ''}
                              onChange={(e) => handleDiscountChange(item.key, 'reason', e.target.value)}
                              placeholder={item.discountable ? 'e.g. Sibling Discount' : '—'}
                              className={cn(
                                'w-full px-3 py-1.5 rounded-lg border text-xs font-medium outline-none',
                                item.discountable
                                  ? 'bg-white border-slate-200 focus:ring-2 ring-school-gold/30'
                                  : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed',
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <datalist id="discount-reason-presets">
                    {DISCOUNT_REASON_PRESETS.map((preset) => (
                      <option key={preset} value={preset} />
                    ))}
                  </datalist>
                </div>
              )}

              <div className="flex flex-wrap gap-4 justify-end pt-2">
                <TotalCard label="Gross Total" value={totals.grossTotal} />
                <TotalCard label="Total Discount" value={totals.totalDiscount} accent="text-red-500" />
                <TotalCard label="Grand Total" value={totals.grandTotal} accent="text-emerald-600" emphasize />
              </div>
            </section>

            {warning && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2">
                <FileWarning size={16} className="text-amber-500 mt-0.5" />
                <p className="text-xs font-bold text-amber-700">{warning}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2">
                <FileWarning size={16} className="text-red-500 mt-0.5" />
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}
          </form>

          <div className="p-6 border-t border-school-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-school-blue hover:text-white transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Tag size={14} /> Submit for Approval
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20 text-school-blue"
      >
        <option value="">{placeholder ?? 'Select...'}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
      />
    </div>
  );
}

function TotalCard({
  label,
  value,
  accent = 'text-school-blue',
  emphasize = false,
}: {
  label: string;
  value: number;
  accent?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-6 py-4 rounded-2xl border text-right',
        emphasize ? 'bg-school-blue/5 border-school-blue/20' : 'bg-slate-50 border-slate-100',
      )}
    >
      <p className="text-[9px] font-black text-school-muted uppercase tracking-widest mb-1">{label}</p>
      <p className={cn('text-lg font-black', accent)}>৳ {value.toLocaleString()}</p>
    </div>
  );
}
