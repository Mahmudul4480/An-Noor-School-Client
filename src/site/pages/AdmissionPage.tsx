import { admission, fees, formatBdt, seo, showFees } from '../content';
import { Seo } from '../seo';
import { InquiryForm } from '../components/InquiryForm';
import { CreamCard, PageHero, Ribbon } from '../components/ui';

export default function AdmissionPage() {
  return (
    <>
      <Seo title={seo.admission.title} description={seo.admission.description} path={seo.admission.path} />
      <PageHero kicker={admission.kicker} title={admission.title} titleBn={admission.titleBn} lede={admission.lede} tone="orange" art="pencil" />

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold text-navy-deep">{admission.stepsTitle}</h2>
          <Ribbon>Session 2026–27</Ribbon>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">{admission.stepsNote}</p>
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {admission.steps.map((step, index) => (
            <li key={step.title} className="rounded-3xl bg-gradient-to-br from-[#fffaf0] to-cream p-6 ring-1 ring-navy/10">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold">
                {index + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-navy-deep">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 sm:px-6 lg:grid-cols-2">
        <CreamCard>
          <h2 className="text-2xl font-semibold text-navy-deep">{admission.documentsTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">{admission.documentsNote}</p>
          <ul className="mt-5 space-y-3">
            {admission.documents.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-crest" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </CreamCard>
        <CreamCard>
          <h2 className="text-2xl font-semibold text-navy-deep">{admission.feesTitle}</h2>
          {showFees ? <FeeTable /> : <p className="mt-4 text-sm leading-relaxed text-ink/75">{admission.feesHidden}</p>}
        </CreamCard>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <CreamCard>
          <h2 className="text-2xl font-semibold text-navy-deep">{admission.formTitle}</h2>
          <div className="mt-4">
            <InquiryForm id="admission-inquiry" />
          </div>
        </CreamCard>
      </section>
    </>
  );
}

function FeeTable() {
  return (
    <div className="mt-4 overflow-x-auto">
      <p className="mb-3 text-sm text-ink/70">{admission.feesVisibleNote}</p>
      <table className="w-full min-w-[28rem] text-left text-sm">
        <caption className="sr-only">School fees</caption>
        <thead>
          <tr className="border-b border-navy/15 text-xs uppercase tracking-wider text-navy/70">
            <th className="py-2 pr-3 font-semibold">Item</th>
            <th className="py-2 pr-3 font-semibold">Amount</th>
            <th className="py-2 font-semibold">Applies to</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((row) => (
            <tr key={`${row.item}-${row.amount}-${row.applies}`} className="border-b border-navy/10">
              <th className="py-3 pr-3 font-medium text-navy-deep">{row.item}</th>
              <td className="py-3 pr-3 font-semibold text-navy">{formatBdt(row.amount)}</td>
              <td className="py-3 text-ink/75">{row.applies}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
