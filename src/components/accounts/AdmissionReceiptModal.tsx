import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, CreditCard, Download, Loader2, ArrowLeft } from 'lucide-react';
import {
  getSchoolName,
  getSchoolAddress,
  buildAdmissionReceipt,
  printAdmissionReceipt,
  downloadAdmissionReceiptPdf,
  formatCurrency,
  formatReceiptDate,
} from '../../lib/receipts';
import { ReceiptLogo } from '../ReceiptLogo';
import type { Admission, LedgerAccount } from '../../types';

interface AdmissionReceiptModalProps {
  admission: Admission;
  account?: LedgerAccount;
  onClose: () => void;
}

export function AdmissionReceiptModal({ admission, account, onClose }: AdmissionReceiptModalProps) {
  const receipt = buildAdmissionReceipt(admission, account);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadAdmissionReceiptPdf(receipt);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-school-border flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-school-blue shrink-0"
              title="Back to Admissions"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Admission Receipt</h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
                {receipt.receiptNumber} • {formatReceiptDate(receipt.issuedAt)}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-school-muted shrink-0">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="rounded-2xl border-[3px] border-[#26338B] overflow-hidden shadow-lg">
              <div className="bg-gradient-to-br from-[#26338B] to-[#1a2560] text-white text-center px-6 py-5 border-b-4 border-[#F8A41C]">
                <ReceiptLogo />
                <h4 className="text-base font-black uppercase tracking-wide">{getSchoolName()}</h4>
                <p className="text-xs font-bold text-[#F8A41C] mt-1">{getSchoolAddress()}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-90 mt-3">Admission Fee Receipt</p>
              </div>

              <div className="flex justify-between gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs">
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-school-muted font-bold">Receipt No</span>
                  <span className="font-black text-[#F8A41C]">{receipt.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-widest text-school-muted font-bold">Date</span>
                  <span className="font-black text-[#F8A41C]">{formatReceiptDate(receipt.issuedAt)}</span>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs text-[#26338B]">
                <div className="grid grid-cols-2 gap-3">
                  <p><span className="block text-[10px] uppercase text-school-muted font-bold">Form Serial</span>{receipt.formSerial}</p>
                  <p><span className="block text-[10px] uppercase text-school-muted font-bold">Academic Year</span>{receipt.academicYear}</p>
                  <p><span className="block text-[10px] uppercase text-school-muted font-bold">Student</span>{receipt.studentName}</p>
                  <p>
                    <span className="block text-[10px] uppercase text-school-muted font-bold">Class</span>
                    {receipt.classApplied}{receipt.section ? ` (${receipt.section})` : ''}
                  </p>
                  <p><span className="block text-[10px] uppercase text-school-muted font-bold">Guardian</span>{receipt.guardianName}</p>
                  <p><span className="block text-[10px] uppercase text-school-muted font-bold">Contact</span>{receipt.guardianContact}</p>
                  <p className="col-span-2">
                    <span className="block text-[10px] uppercase text-school-muted font-bold">Received In Account</span>
                    {receipt.accountName}
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-[#26338B] text-white text-[10px] uppercase tracking-wider">
                        <th className="p-3 text-left font-black">Fee Item</th>
                        <th className="p-3 text-right font-black">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receipt.feeItems.map((item) => (
                        <tr key={item.key} className="even:bg-slate-50">
                          <td className="p-3 font-bold">{item.label}</td>
                          <td className="p-3 text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-right space-y-1 p-4 rounded-xl border-2 border-[#F8A41C] bg-gradient-to-r from-amber-50 to-white">
                  <p className="text-[10px] text-school-muted uppercase font-bold">Gross: {formatCurrency(receipt.grossTotal)}</p>
                  {receipt.totalDiscount > 0 && (() => {
                    const overall = receipt.discounts.find((d) => d.itemKey === 'overall');
                    return (
                      <p className="text-[10px] text-red-500 uppercase font-bold">
                        Concession: − {formatCurrency(receipt.totalDiscount)}
                        {overall?.reason ? ` (${overall.reason})` : ''}
                      </p>
                    );
                  })()}
                  <p className="text-lg font-black text-[#26338B]">Grand Total: {formatCurrency(receipt.grandTotal)}</p>
                </div>

                <div className="p-3 bg-amber-50 border-l-4 border-[#F8A41C] rounded-r-xl text-[11px] font-bold text-amber-900">
                  {receipt.statusNote}
                </div>
              </div>

              <div className="bg-[#26338B] text-white text-center py-3 text-[10px] uppercase tracking-widest font-bold">
                Thank you — {getSchoolName()}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-school-border flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="px-5 py-3 bg-[#26338B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => printAdmissionReceipt(receipt)}
              className="px-5 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Printer size={14} /> Print Receipt
            </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface IdCardModalProps {
  admission: Admission;
  onClose: () => void;
}

export function IdCardModal({ admission, onClose }: IdCardModalProps) {
  const printCard = () => {
    const photo = admission.studentPhotoUrl ?? '';
    const html = `<!DOCTYPE html><html><head><title>ID Card ${admission.studentId}</title>
      <style>
        body { font-family: Arial, sans-serif; display:flex; justify-content:center; padding:24px; }
        .card { width:340px; border:3px solid #1e3a8a; border-radius:16px; overflow:hidden; }
        .head { background:#1e3a8a; color:#fff; padding:12px; text-align:center; }
        .body { display:flex; gap:12px; padding:16px; }
        .photo { width:60px; height:72px; border:2px solid #fbbf24; border-radius:4px; object-fit:cover; background:#f1f5f9; flex-shrink:0; }
        .info { font-size:12px; color:#1e3a8a; }
        .info h2 { margin:0 0 8px; font-size:16px; }
        .foot { background:#f8fafc; padding:10px 16px; font-size:10px; color:#64748b; text-align:center; }
      </style></head><body>
      <div class="card">
        <div class="head"><strong>An-Noor International School</strong><br/>Student ID Card</div>
        <div class="body">
          ${photo ? `<img class="photo" src="${photo}" />` : '<div class="photo"></div>'}
          <div class="info">
            <h2>${admission.studentName}</h2>
            <p><strong>ID:</strong> ${admission.studentId ?? '—'}</p>
            <p><strong>Class:</strong> ${admission.classApplied}${admission.section ? ` (${admission.section})` : ''}</p>
            <p><strong>Guardian:</strong> ${admission.guardianName}</p>
            <p><strong>Session:</strong> ${admission.academicYear}</p>
          </div>
        </div>
        <div class="foot">Issued after admission approval • Valid for ${admission.academicYear} session</div>
      </div>
      <script>window.onload=()=>window.print()</script>
      </body></html>`;
    const win = window.open('', '_blank', 'width=420,height=560');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6 border-b border-school-border flex items-center justify-between">
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight flex items-center gap-2">
              <CreditCard size={18} /> Student ID Card
            </h3>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-school-muted">
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <div className="border-4 border-school-blue rounded-2xl overflow-hidden">
              <div className="bg-school-blue text-white p-4 text-center">
                <p className="text-xs font-black uppercase tracking-widest">An-Noor International School</p>
                <p className="text-[10px] opacity-80 mt-1">Student Identity Card</p>
              </div>
              <div className="p-4 flex gap-4">
                {admission.studentPhotoUrl ? (
                  <img
                    src={admission.studentPhotoUrl}
                    alt={admission.studentName}
                    className="w-16 border-2 border-school-gold object-cover shrink-0"
                    style={{ height: 77 }}
                  />
                ) : (
                  <div className="w-16 bg-slate-100 border-2 border-school-gold shrink-0" style={{ height: 77 }} />
                )}
                <div className="text-[11px] space-y-1 font-bold text-school-blue">
                  <p className="text-sm font-black uppercase">{admission.studentName}</p>
                  <p>ID: {admission.studentId}</p>
                  <p>Class: {admission.classApplied}{admission.section ? ` (${admission.section})` : ''}</p>
                  <p>Guardian: {admission.guardianName}</p>
                  <p>Session: {admission.academicYear}</p>
                </div>
              </div>
            </div>

            {admission.guardianLoginMobile && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px]">
                <p className="font-black text-emerald-700 uppercase tracking-widest mb-2">Guardian Portal Login</p>
                <p><strong>Mobile:</strong> {admission.guardianLoginMobile}</p>
                {admission.guardianTempPassword && (
                  <p><strong>Password:</strong> {admission.guardianTempPassword}</p>
                )}
                {!admission.guardianTempPassword && (
                  <p className="text-emerald-600">Existing guardian account linked. Use previous password.</p>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-school-border flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest">
              Close
            </button>
            <button type="button" onClick={printCard} className="px-5 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Printer size={14} /> Print ID Card
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
