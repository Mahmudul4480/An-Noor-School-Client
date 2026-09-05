import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Bell,
  BarChart3,
  CreditCard,
  User,
  Star,
  CreditCard as IdIcon,
  Loader2,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchStudentsForGuardian } from '../lib/students';
import { fetchInvoices } from '../lib/invoices';
import { fetchAccounts } from '../lib/ledger';
import { initiateOnlinePayment, isPaymentGatewayConfigured, simulateOnlinePayment } from '../lib/payments';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import type { LedgerAccount, Student, StudentInvoice } from '../types';

export const GuardianDashboard = () => {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [invoices, setInvoices] = React.useState<StudentInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [payingId, setPayingId] = React.useState<string | null>(null);
  const [payMessage, setPayMessage] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [receiptInvoice, setReceiptInvoice] = React.useState<StudentInvoice | null>(null);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);

  React.useEffect(() => {
    const mobile = localStorage.getItem('guardianMobile') ?? '';
    fetchStudentsForGuardian(mobile)
      .then((data) => setStudents(data))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    fetchAccounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  const student = students[selectedIndex];

  React.useEffect(() => {
    if (!student) {
      setInvoices([]);
      return;
    }
    fetchInvoices({ studentId: student.studentId }).then(setInvoices);
  }, [student?.studentId]);

  const dailyUpdates = [
    { subject: "Arabic Linguistics", note: "Participated well in oral recitation. Needs to focus on script handwriting.", rating: 85, time: "10:30 AM" },
    { subject: "Mathematics", note: "Completed long division exercise with 90% accuracy. Excellent progress.", rating: 92, time: "12:15 PM" },
    { subject: "Quran Hifz", note: "Surah Al-Mulk (Ayat 1-5) memorized perfectly. MashaAllah.", rating: 98, time: "01:30 PM" }
  ];

  const analysis = [
    { subject: "English", strength: 92, status: "Excellent" },
    { subject: "Mathematics", strength: 88, status: "Strong" },
    { subject: "Islamic Studies", strength: 95, status: "Superior" },
    { subject: "Science", strength: 72, status: "Needs Focus" },
    { subject: "Arabic", strength: 85, status: "Improving" }
  ];

  const notifications = [
    ...invoices
      .filter((invoice) => invoice.status === 'overdue')
      .slice(0, 1)
      .map((invoice) => ({
        from: 'Accounts',
        msg: `${invoice.lineItems[0]?.label ?? 'Fee'} overdue. Please pay by ${invoice.dueDate}.`,
        type: 'warning' as const,
        time: 'Due',
      })),
    ...invoices
      .filter((invoice) => invoice.status === 'paid' && invoice.receiptNumber)
      .slice(0, 1)
      .map((invoice) => ({
        from: 'Accounts',
        msg: `Payment receipt ${invoice.receiptNumber} generated for ${invoice.invoiceNumber}.`,
        type: 'success' as const,
        time: 'Paid',
      })),
    { from: "Principal", msg: "Winter vacation starts from Dec 24th. School reopens on Jan 2nd.", type: "info" as const, time: "5h ago" },
  ];

  const handlePayNow = async (invoice: StudentInvoice) => {
    setPayingId(invoice.id);
    setPayMessage('');
    try {
      if (isPaymentGatewayConfigured()) {
        const result = await initiateOnlinePayment(invoice);
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
      }

      await simulateOnlinePayment(invoice);
      setPayMessage('Payment recorded. Receipt is ready to download.');
      const refreshed = await fetchInvoices({ studentId: student!.studentId });
      setInvoices(refreshed);
      const paid = refreshed.find((item) => item.id === invoice.id);
      if (paid) setReceiptInvoice(paid);
    } catch (err) {
      setPayMessage(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-school-blue mb-4" />
          <p className="text-xs font-black text-school-muted uppercase tracking-widest">Loading student profile...</p>
        </div>
      ) : !student ? (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-school-border">
          <p className="text-sm font-bold text-school-muted">No student linked to this guardian account yet.</p>
          <p className="text-[10px] text-school-muted mt-2">Admission approve হলে ID card এখানে দেখা যাবে।</p>
        </div>
      ) : (
      <>
      {students.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {students.map((s, idx) => (
            <button
              key={s.studentId}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border',
                idx === selectedIndex ? 'bg-school-blue text-white border-school-blue' : 'bg-white text-school-muted border-school-border',
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Profile & Analysis */}
        <div className="lg:col-span-1 space-y-6">
          {/* 1. Student Profile */}
          <div className="bg-school-blue text-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/20 border-2 border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all duration-500" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 border-4 border-school-gold/40 bg-white/10 mb-6 overflow-hidden shrink-0" style={{ height: 77 }}>
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center"><User size={20} /></div>
                )}
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-2 leading-tight">{student.name}</h2>
              <div className="space-y-1 text-[10px] opacity-80 font-black uppercase tracking-widest">
                <p className="bg-white/10 py-1 px-3 rounded-full mb-1">ID: <span className="text-school-gold">{student.studentId}</span></p>
                <p>{student.class}{student.section ? ` • ${student.section}` : ''}</p>
                {student.roll && <p>Roll No: {student.roll}</p>}
              </div>
              
              {student.idCardIssuedAt && (
                <div className="mt-4 p-3 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <IdIcon size={14} className="text-school-gold" /> ID Card Issued
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10 w-full">
                <div className="flex justify-between items-center text-[10px] font-black uppercase mb-2">
                  <span className="opacity-60">Monthly Attendance</span>
                  <span className="text-school-gold">94%</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '94%' }}
                    className="bg-school-gold h-full rounded-full" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Analysis: Strength & Weakness */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
            <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
              <BarChart3 size={16} className="text-school-gold" />
              Monthly Performance
            </h3>
            <div className="space-y-5">
              {analysis.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center text-[10px] uppercase font-black mb-2 tracking-tighter">
                    <span className="text-school-blue">{item.subject}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md",
                      item.strength > 90 ? "bg-emerald-50 text-emerald-600" : item.strength > 80 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                    )}>{item.status}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.strength}%` }}
                      viewport={{ once: true }}
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        item.strength > 90 ? "bg-emerald-400" : item.strength > 80 ? "bg-school-blue" : "bg-school-gold"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Daily Updates & Fees */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3. Daily Updates Feed */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-school-blue uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={16} className="text-school-gold" />
                Daily Activity Feed
              </h3>
              <span className="text-[10px] font-black bg-slate-50 text-school-muted px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-inner">26 Apr, 2024</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {dailyUpdates.map((update, idx) => (
                <div key={idx} className="relative pl-8 border-l border-slate-100 pb-2">
                  <div className="absolute left-0 top-0 -ml-2 w-4 h-4 rounded-full bg-white border-4 border-school-gold shadow-sm z-10" />
                  <div className="flex justify-between items-start mb-2 group">
                    <h4 className="text-sm font-black text-school-blue uppercase tracking-tight group-hover:text-school-gold transition-colors">{update.subject}</h4>
                    <span className="text-[10px] font-bold text-school-muted flex items-center gap-1">
                       <Star size={10} className="text-school-gold" /> {update.time}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all shadow-sm">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium mb-5">{update.note}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase text-school-muted tracking-widest">Progress:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className={cn("w-3 h-3 rounded-full", star * 20 <= update.rating ? "bg-school-gold shadow-lg shadow-amber-500/20" : "bg-slate-200")} />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-school-blue ml-auto bg-white px-3 py-1 rounded-full shadow-sm">{update.rating}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Fees Module */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
            <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
              <CreditCard size={16} className="text-school-gold" />
              Detailed Dues & Payments
            </h3>
            {payMessage && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs font-bold text-school-blue">{payMessage}</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                    <th className="pb-4">Invoice</th>
                    <th className="pb-4">Description</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-school-muted font-medium">
                        No invoices yet. Monthly tuition auto-generate হলে এখানে দেখাবে।
                      </td>
                    </tr>
                  ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-5 font-black text-school-gold uppercase">{invoice.invoiceNumber}</td>
                      <td className="py-5 text-slate-500 font-medium">{invoice.lineItems.map((item) => item.label).join(', ')}</td>
                      <td className="py-5 font-black text-school-blue">৳ {invoice.totalAmount.toLocaleString('en-BD')}</td>
                      <td className="py-5">
                        <span className={cn(
                          "px-3 py-1.5 rounded-xl font-black uppercase text-[8px] tracking-widest shadow-sm",
                          invoice.status === 'paid' ? "bg-emerald-50 text-emerald-600" : invoice.status === 'overdue' ? "bg-red-50 text-red-500" : "bg-amber-50 text-school-gold"
                        )}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' ? (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={payingId === invoice.id}
                            onClick={() => handlePayNow(invoice)}
                            className="px-5 py-2.5 bg-school-gold text-school-blue rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-school-blue hover:text-white transition-all disabled:opacity-60"
                          >
                            {payingId === invoice.id ? 'Processing...' : 'Pay Now'}
                          </motion.button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setReceiptInvoice(invoice)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100"
                          >
                            <FileText size={14} /> Download Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications */}
        <div className="lg:col-span-1 space-y-6">
          {/* 5. Notifications */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
            <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8 flex items-center gap-2">
              <Bell size={16} className="text-school-gold" />
              Office Alerts
            </h3>
            <div className="space-y-5">
              {notifications.map((n, idx) => (
                <div key={idx} className={cn(
                  "p-6 rounded-[2rem] border-l-[6px] relative shadow-sm hover:translate-x-1 transition-transform",
                  n.type === 'warning' ? "bg-red-50/50 border-red-500" : n.type === 'success' ? "bg-emerald-50/50 border-emerald-500" : "bg-blue-50/50 border-school-blue"
                )}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-school-blue px-2 py-1 bg-white rounded-lg shadow-sm">{n.from} Office</span>
                    <span className="text-[9px] font-bold text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-[11px] font-semibold leading-relaxed text-slate-600 line-clamp-3">"{n.msg}"</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-slate-50 text-school-blue text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-inner">
              Alert Archives
            </button>
          </div>

          {/* School Admission Banner */}
          <div className="bg-school-gold rounded-[2.5rem] p-8 shadow-xl shadow-amber-500/20 border-2 border-white/20 text-school-blue overflow-hidden relative group">
             <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-700" />
             <h3 className="text-xl font-black uppercase leading-none mb-4 relative z-10">ADMISSION<br/>IS OPEN 2025</h3>
             <p className="text-[10px] font-bold leading-relaxed mb-6 opacity-75 relative z-10">Join the lead in Quranic & Modern Education system.</p>
             <button className="w-full py-4 bg-school-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 hover:scale-[1.02] transition-transform relative z-10">
               Apply Online
             </button>
          </div>
        </div>
      </div>
      </>
      )}

      {receiptInvoice && (
        <InvoiceReceiptModal
          invoice={receiptInvoice}
          account={accounts.find((account) => account.id === receiptInvoice.paymentAccountId)}
          guardianName={student?.guardianName}
          onClose={() => setReceiptInvoice(null)}
        />
      )}
    </motion.div>
  );
};
