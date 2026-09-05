import React from 'react';
import type { DirectorBriefing, DirectorMoneyRow } from '../../types';

const NAVY = '#26338B';
const GOLD = '#F8A41C';
const GREEN = '#C6EFCE';
const RED = '#FFC7CE';
const SAGE = '#C4D79B';
const ORANGE = '#F79646';
const YELLOW = '#FFD54A';
const SKY = '#95B3D7';
const SKY_SOFT = '#B8D0EA';
const BORDER = '#1a1a1a';

const pageStyle: React.CSSProperties = {
  width: 1100,
  minHeight: 760,
  background: '#ffffff',
  color: '#111827',
  fontFamily: 'Arial, Helvetica, sans-serif',
  border: `1px solid ${NAVY}`,
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const cell: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: '5px 6px',
  fontSize: 11,
  verticalAlign: 'middle',
};

function intCell(value: number, emptyIfZero = false): string {
  if (emptyIfZero && value === 0) return '';
  return value.toLocaleString('en-BD');
}

function money(value: number, emptyIfZero = false): string {
  if (emptyIfZero && value === 0) return '';
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SheetHeader({
  schoolName,
  schoolAddress,
  logo,
  subtitle,
  subtitleBg,
  subtitleColor,
  snapshot,
}: {
  schoolName: string;
  schoolAddress: string;
  logo: string | null;
  subtitle: string;
  subtitleBg: string;
  subtitleColor: string;
  snapshot: string;
}) {
  return (
    <div>
      <div
        style={{
          background: NAVY,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 16px',
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt=""
            width={52}
            height={52}
            style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${GOLD}`, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: `2px solid ${GOLD}`,
              background: '#1b2566',
            }}
          />
        )}
        <div style={{ flex: 1, textAlign: 'center', paddingRight: 52 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.4 }}>{schoolName}</div>
          <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.85, marginTop: 2 }}>{schoolAddress}</div>
        </div>
      </div>
      <div
        style={{
          background: subtitleBg,
          color: subtitleColor,
          textAlign: 'center',
          fontWeight: 800,
          fontSize: 15,
          padding: '7px 12px',
          borderTop: `2px solid ${GOLD}`,
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          textAlign: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: NAVY,
          padding: '4px 12px 8px',
          background: '#f8fafc',
        }}
      >
        Instant snapshot · {snapshot}
      </div>
    </div>
  );
}

function CollectionSheet({ briefing, logo }: { briefing: DirectorBriefing; logo: string | null }) {
  const totals = briefing.classRows.reduce(
    (acc, row) => ({
      students: acc.students + row.totalStudents,
      neu: acc.neu + row.newStudents,
      left: acc.left + row.leftStudents,
      tuition: acc.tuition + row.tuitionCollected,
      tuitionDue: acc.tuitionDue + row.tuitionDues,
      exam: acc.exam + row.examCollected,
      examDue: acc.examDue + row.examDues,
    }),
    { students: 0, neu: 0, left: 0, tuition: 0, tuitionDue: 0, exam: 0, examDue: 0 },
  );

  const head: React.CSSProperties = {
    ...cell,
    background: NAVY,
    color: '#fff',
    fontWeight: 800,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 1.25,
  };

  return (
    <div data-director-page="collection" style={pageStyle}>
      <SheetHeader
        schoolName={briefing.schoolName}
        schoolAddress={briefing.schoolAddress}
        logo={logo}
        subtitle={briefing.collectionTitle}
        subtitleBg={NAVY}
        subtitleColor="#fff"
        snapshot={briefing.generatedAtLabel}
      />
      <div style={{ padding: '8px 10px 12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...head, width: 108 }}>Class</th>
              <th style={head}>Total Number Of Student</th>
              <th style={head}>New Student</th>
              <th style={{ ...head, width: 92 }}>Class Shifted</th>
              <th style={head}>Total Left Student</th>
              <th style={head}>Tuition Fee Collected</th>
              <th style={head}>Tuition Fee Dues</th>
              <th style={head}>Total Exam Fee Collected</th>
              <th style={head}>Total Exam Fee Dues</th>
              <th style={{ ...head, width: 168 }}>Previous Month Student Payment Dues</th>
            </tr>
          </thead>
          <tbody>
            {briefing.classRows.map((row) => (
              <tr key={row.className}>
                <td style={{ ...cell, fontWeight: 800 }}>{row.displayName}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{intCell(row.totalStudents, true)}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{intCell(row.newStudents, true)}</td>
                <td style={{ ...cell, textAlign: 'center', fontSize: 10 }}>{row.classShifted}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{intCell(row.leftStudents, true)}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{intCell(row.tuitionCollected, true)}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{intCell(row.tuitionDues, true)}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{intCell(row.examCollected, true)}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{intCell(row.examDues, true)}</td>
                <td style={{ ...cell, fontSize: 10 }}>{row.previousDuesNote}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...cell, fontWeight: 800, textAlign: 'center' }}>Total</td>
              <td style={{ ...cell, textAlign: 'center', fontWeight: 800, background: GREEN }}>{intCell(totals.students)}</td>
              <td style={{ ...cell, textAlign: 'center', fontWeight: 800, background: GREEN }}>{intCell(totals.neu)}</td>
              <td style={cell} />
              <td style={{ ...cell, textAlign: 'center', fontWeight: 800, background: RED }}>{intCell(totals.left)}</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 800, background: GREEN }}>{intCell(totals.tuition)}</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 800 }}>{intCell(totals.tuitionDue)}</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 800, background: GREEN }}>{intCell(totals.exam)}</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 800 }}>{intCell(totals.examDue)}</td>
              <td style={cell} />
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.7 }}>
            <div>Total Academic Student = {briefing.academicStudents}</div>
            <div>Total Hifz Department Student = {briefing.hifzStudents}</div>
          </div>
          <div
            style={{
              border: `1px solid ${BORDER}`,
              padding: '8px 18px',
              fontWeight: 800,
              fontSize: 14,
              minWidth: 110,
              textAlign: 'center',
            }}
          >
            {briefing.snapshotDate}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoneyCells({
  row,
  hideSl,
}: {
  row: DirectorMoneyRow;
  hideSl?: boolean;
}) {
  const empty = row.isEmpty;
  return (
    <>
      {!hideSl && <td style={{ ...cell, textAlign: 'center' }}>{row.sl}</td>}
      <td style={{ ...cell, textAlign: 'center', fontSize: 10 }}>{row.voucherNo}</td>
      <td style={{ ...cell, fontWeight: empty ? 400 : 700 }}>{row.label}</td>
      <td style={{ ...cell, textAlign: 'center' }}>{row.folio}</td>
      <td style={{ ...cell, textAlign: 'right' }}>{empty ? '' : money(row.cash, true)}</td>
      <td style={{ ...cell, textAlign: 'right' }}>{empty ? '' : money(row.bank, true)}</td>
      <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{empty ? '' : money(row.total, true)}</td>
    </>
  );
}

function IncomeSheet({ briefing, logo }: { briefing: DirectorBriefing; logo: string | null }) {
  const headL: React.CSSProperties = { ...cell, background: SAGE, fontWeight: 800, fontSize: 10, textAlign: 'center' };
  const headR: React.CSSProperties = { ...cell, background: ORANGE, fontWeight: 800, fontSize: 10, textAlign: 'center' };

  return (
    <div data-director-page="income" style={pageStyle}>
      <SheetHeader
        schoolName={briefing.schoolName}
        schoolAddress={briefing.schoolAddress}
        logo={logo}
        subtitle={briefing.incomeTitle}
        subtitleBg={YELLOW}
        subtitleColor="#111827"
        snapshot={briefing.generatedAtLabel}
      />
      <div style={{ padding: '8px 10px 10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th colSpan={7} style={{ ...headL, fontSize: 12 }}>
                Debit · Received
              </th>
              <th colSpan={6} style={{ ...headR, fontSize: 12 }}>
                Credit · Expenses
              </th>
            </tr>
            <tr>
              <th style={{ ...headL, width: 36 }}>SL</th>
              <th style={{ ...headL, width: 70 }}>Vr. No.</th>
              <th style={headL}>RECEIVED</th>
              <th style={{ ...headL, width: 48 }}>Folio</th>
              <th style={{ ...headL, width: 78 }}>CASH</th>
              <th style={{ ...headL, width: 78 }}>BANK</th>
              <th style={{ ...headL, width: 82 }}>TOTAL</th>
              <th style={{ ...headR, width: 70 }}>Vr. No.</th>
              <th style={headR}>EXPENSES</th>
              <th style={{ ...headR, width: 48 }}>Folio</th>
              <th style={{ ...headR, width: 78 }}>CASH</th>
              <th style={{ ...headR, width: 78 }}>BANK</th>
              <th style={{ ...headR, width: 82 }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {briefing.receivedRows.map((row, index) => (
              <tr key={`r-${index}`}>
                <MoneyCells row={row} />
                <MoneyCells row={briefing.expenseRows[index] ?? { ...row, sl: '', label: '', isEmpty: true }} hideSl />
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ ...cell, background: YELLOW, fontWeight: 800 }}>
                Today&apos;s Received =
              </td>
              <td style={{ ...cell, background: YELLOW, textAlign: 'right', fontWeight: 800 }}>
                {money(briefing.todayReceived.cash)}
              </td>
              <td style={{ ...cell, background: YELLOW, textAlign: 'right', fontWeight: 800 }}>
                {money(briefing.todayReceived.bank)}
              </td>
              <td style={{ ...cell, background: YELLOW, textAlign: 'right', fontWeight: 800 }}>
                {money(briefing.todayReceived.total)}
              </td>
              <td colSpan={3} style={{ ...cell, background: SKY, fontWeight: 800 }}>
                Today&apos;s Expenses =
              </td>
              <td style={{ ...cell, background: SKY, textAlign: 'right', fontWeight: 800 }}>
                {money(briefing.todayExpenses.cash)}
              </td>
              <td style={{ ...cell, background: SKY, textAlign: 'right', fontWeight: 800 }}>
                {money(briefing.todayExpenses.bank)}
              </td>
              <td style={{ ...cell, background: SKY, textAlign: 'right', fontWeight: 800 }}>
                {money(briefing.todayExpenses.total)}
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td style={{ ...cell, background: YELLOW, fontWeight: 800, width: '38%' }}>TOTAL RECEIVED =</td>
              <td style={{ ...cell, background: YELLOW, textAlign: 'right', fontWeight: 800 }}>{money(briefing.totalReceived.cash)}</td>
              <td style={{ ...cell, background: YELLOW, textAlign: 'right', fontWeight: 800 }}>{money(briefing.totalReceived.bank)}</td>
              <td style={{ ...cell, background: YELLOW, textAlign: 'right', fontWeight: 800 }}>{money(briefing.totalReceived.total)}</td>
              <td style={{ ...cell, background: ORANGE, fontWeight: 800, textAlign: 'center', width: 70 }}>Debit</td>
              <td style={{ ...cell, background: ORANGE, fontWeight: 800, textAlign: 'right' }}>{money(briefing.debitTotal)}</td>
            </tr>
            <tr>
              <td style={{ ...cell, background: SKY, fontWeight: 800 }}>TOTAL EXPENSES =</td>
              <td style={{ ...cell, background: SKY, textAlign: 'right', fontWeight: 800 }}>{money(briefing.totalExpenses.cash)}</td>
              <td style={{ ...cell, background: SKY, textAlign: 'right', fontWeight: 800 }}>{money(briefing.totalExpenses.bank)}</td>
              <td style={{ ...cell, background: SKY, textAlign: 'right', fontWeight: 800 }}>{money(briefing.totalExpenses.total)}</td>
              <td style={{ ...cell, background: ORANGE, fontWeight: 800, textAlign: 'center' }}>Credit</td>
              <td style={{ ...cell, background: ORANGE, fontWeight: 800, textAlign: 'right' }}>{money(briefing.creditTotal)}</td>
            </tr>
            <tr>
              <td style={{ ...cell, background: SKY_SOFT, fontWeight: 800 }}>BALANCE C/D =</td>
              <td style={{ ...cell, background: SKY_SOFT, textAlign: 'right', fontWeight: 800 }}>{money(briefing.balanceCd.cash)}</td>
              <td style={{ ...cell, background: SKY_SOFT, textAlign: 'right', fontWeight: 800 }}>{money(briefing.balanceCd.bank)}</td>
              <td style={{ ...cell, background: SKY_SOFT, textAlign: 'right', fontWeight: 800 }}>{money(briefing.balanceCd.total)}</td>
              <td colSpan={2} style={cell} />
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, marginTop: 28, padding: '0 24px' }}>
          <div style={{ flex: 1, borderTop: `1px solid ${BORDER}`, paddingTop: 6, textAlign: 'center', fontSize: 11, fontWeight: 800 }}>
            Director&apos;s Signature
          </div>
          <div style={{ flex: 1, borderTop: `1px solid ${BORDER}`, paddingTop: 6, textAlign: 'center', fontSize: 11, fontWeight: 800 }}>
            Principal&apos;s Signature
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ color: '#c0392b', fontWeight: 800, fontSize: 12, textDecoration: 'underline', marginBottom: 6 }}>
            Bank Statement Of Accounts Till Today: {briefing.snapshotDate}
          </div>
          <table style={{ borderCollapse: 'collapse', minWidth: 360 }}>
            <tbody>
              {briefing.bankLines.length === 0 ? (
                <tr>
                  <td style={{ ...cell, fontWeight: 700 }}>No bank / mobile account</td>
                  <td style={{ ...cell, textAlign: 'right' }}>0.00 tk</td>
                </tr>
              ) : (
                briefing.bankLines.map((line) => (
                  <tr key={line.name}>
                    <td style={{ ...cell, fontWeight: 700 }}>{line.name}</td>
                    <td style={{ ...cell, textAlign: 'right', fontWeight: 800 }}>
                      {money(line.balance)} tk
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DirectorReportSheets({
  briefing,
  logo,
}: {
  briefing: DirectorBriefing;
  logo: string | null;
}) {
  return (
    <div data-director-pack style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      <CollectionSheet briefing={briefing} logo={logo} />
      <IncomeSheet briefing={briefing} logo={logo} />
    </div>
  );
}
