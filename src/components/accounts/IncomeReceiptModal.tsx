import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Download, Loader2, ArrowLeft } from 'lucide-react';
import {
  getSchoolName,
  getSchoolAddress,
  buildIncomeReceipt,
  printIncomeReceipt,
  downloadIncomeReceiptPdf,
  formatCurrency,
  formatReceiptDate,
} from '../../lib/receipts';
import { ReceiptLogo } from '../ReceiptLogo';
import type { IncomeEntry, LedgerAccount } from '../../types';

interface IncomeReceiptModalProps {
  entry: IncomeEntry;
  account?: LedgerAccount;
  onClose: () => void;
}

export function IncomeReceiptModal({ entry, account, onClose }: IncomeReceiptModalProps) {
  const receipt = buildIncomeReceipt(entry, account);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadIncomeReceiptPdf(receipt);
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
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Money Receipt</h3>
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
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-90 mt-3">Money Receipt</p>
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
                  <p>
                    <span className="block text-[10px] uppercase text-school-muted font-bold">Received Date</span>
                    {formatReceiptDate(receipt.entryDate)}
                  </p>
                  <p>
                    <span className="block text-[10px] uppercase text-school-muted font-bold">Category</span>
                    {receipt.category}
                  </p>
                  <p>
                    <span className="block text-[10px] uppercase text-school-muted font-bold">Received From</span>
                    {receipt.source}
                  </p>
                  <p>
                    <span className="block text-[10px] uppercase text-school-muted font-bold">Payment Method</span>
                    {receipt.paymentMethod}
                  </p>
                  {receipt.reference && (
                    <p>
                      <span className="block text-[10px] uppercase text-school-muted font-bold">Deposit Slip / Txn</span>
                      {receipt.reference}
                    </p>
                  )}
                  <p>
                    <span className="block text-[10px] uppercase text-school-muted font-bold">Approved By</span>
                    {receipt.approvedBy}
                  </p>
                  <p className="col-span-2">
                    <span className="block text-[10px] uppercase text-school-muted font-bold">Deposited In Account</span>
                    {receipt.accountName}
                  </p>
                  {receipt.note && (
                    <p className="col-span-2">
                      <span className="block text-[10px] uppercase text-school-muted font-bold">Note</span>
                      {receipt.note}
                    </p>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-[#26338B] text-white text-[10px] uppercase tracking-wider">
                        <th className="p-3 text-left font-black">Particulars</th>
                        <th className="p-3 text-right font-black">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 font-bold">{receipt.description}</td>
                        <td className="p-3 text-right">{formatCurrency(receipt.amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-right p-4 rounded-xl border-2 border-[#F8A41C] bg-gradient-to-r from-amber-50 to-white">
                  <p className="text-lg font-black text-[#26338B]">Total Received: {formatCurrency(receipt.amount)}</p>
                </div>

                <div className="p-3 bg-amber-50 border-l-4 border-[#F8A41C] rounded-r-xl text-[11px] font-bold text-amber-900">
                  Received with thanks and approved by the Principal. This money receipt is valid for school records.
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 pb-2">
                  <div className="border-t border-slate-300 pt-2 text-center text-[10px] font-bold uppercase tracking-widest text-school-muted">
                    Payer Signature
                  </div>
                  <div className="border-t border-slate-300 pt-2 text-center text-[10px] font-bold uppercase tracking-widest text-school-muted">
                    Accounts Signature
                  </div>
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
                onClick={() => printIncomeReceipt(receipt)}
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
