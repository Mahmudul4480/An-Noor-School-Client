import type { ComponentType } from 'react';
import { BadgeCheck, CircleHelp, ClipboardPen, Files, FolderOpen, MapPin, MessageCircle, Route } from 'lucide-react';
import { admission, fees, formatBdt, seo, showFees, site } from '../content';
import { Seo } from '../seo';
import { InquiryForm, WhatsAppMark } from '../components/InquiryForm';
import { AccentCard, IconBadge } from '../components/kit';
import { PageHero } from '../components/ui';

const stepIcons: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }>[] = [
  MessageCircle,
  MapPin,
  ClipboardPen,
  Files,
  BadgeCheck,
];

const stepTones = [
  { bar: 'bg-orange', wash: 'from-[#FFE7CC]', badge: 'bg-[#F7931E] text-navy-deep' },
  { bar: 'bg-sun', wash: 'from-[#FFF3C4]', badge: 'bg-sun text-navy-deep' },
  { bar: 'bg-sky', wash: 'from-[#DDF1FD]', badge: 'bg-sky text-navy-deep' },
  { bar: 'bg-leaf', wash: 'from-[#DDF3E6]', badge: 'bg-[#B7E4C7] text-navy-deep' },
  { bar: 'bg-navy', wash: 'from-[#E4E6FF]', badge: 'bg-navy text-sun' },
];

export default function AdmissionPage() {
  return (
    <>
      <Seo title={seo.admission.title} description={seo.admission.description} path={seo.admission.path} />
      <PageHero
        kicker={admission.kicker}
        title={admission.title}
        titleBn={admission.titleBn}
        lede={admission.lede}
        tone="orange"
        art="pencil"
        band
        ribbon
      />

      <section className="bg-[#f5f7fb] py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <IconBadge className="bg-navy text-sun">
                <Route size={22} aria-hidden="true" />
              </IconBadge>
              <h2 className="text-3xl font-semibold text-navy-deep">{admission.stepsTitle}</h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sun to-orange px-3 py-1.5 text-sm font-bold text-navy-deep shadow-[0_6px_14px_rgba(247,147,30,0.28)]">
              {site.sessionLabel}
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-deep/80">{admission.stepsNote}</p>
          <ol className="relative mt-8 grid gap-4 xl:grid-cols-5">
            {admission.steps.map((step, index) => {
              const Icon = stepIcons[index] ?? MessageCircle;
              const tone = stepTones[index % stepTones.length];
              return (
                <li key={step.title} className="relative flex h-full min-w-0 gap-3 xl:flex-col xl:gap-4">
                  {index < admission.steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-6 top-12 h-[calc(100%+1rem-3rem)] w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-orange to-navy/35 xl:left-1/2 xl:top-6 xl:h-[3px] xl:w-[calc(50%+1rem)] xl:translate-x-0 xl:bg-gradient-to-r"
                    />
                  )}
                  <div className="relative z-10 flex w-12 shrink-0 justify-center xl:w-full">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold shadow-[0_6px_14px_rgba(42,44,137,0.16)] ring-4 ring-[#f5f7fb] ${tone.badge}`}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <AccentCard className="min-w-0 flex-1" barClass={tone.bar} washClass={tone.wash}>
                    <IconBadge className={tone.badge}>
                      <Icon size={22} aria-hidden="true" />
                    </IconBadge>
                    <h3 className="mt-4 text-lg font-semibold text-navy-deep">{step.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{step.text}</p>
                  </AccentCard>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-[#f5f7fb] py-10">
        <div className="mx-auto grid max-w-[1200px] gap-5 px-4 sm:px-6 lg:grid-cols-2">
          <AccentCard barClass="bg-sky" washClass="from-[#E5F4FF]">
            <IconBadge className="bg-[#D3EEFC] text-navy">
              <FolderOpen size={22} aria-hidden="true" />
            </IconBadge>
            <h2 className="mt-4 text-2xl font-semibold text-navy-deep">{admission.documentsTitle}</h2>
            <p className="mt-3 text-base leading-relaxed text-navy-deep/80">{admission.documentsNote}</p>
            <ul className="mt-5 space-y-3">
              {admission.documents.map((item) => (
                <li key={item} className="flex gap-3 text-base leading-relaxed text-navy-deep">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4F0E2] text-navy">
                    <Files size={13} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </AccentCard>
          <AccentCard barClass="bg-sun" washClass="from-[#FFF4C8]">
            <IconBadge className="bg-sun text-navy-deep">
              <CircleHelp size={22} aria-hidden="true" />
            </IconBadge>
            <h2 className="mt-4 text-2xl font-semibold text-navy-deep">{admission.feesTitle}</h2>
            {showFees ? <FeeTable /> : <p className="mt-4 text-base leading-relaxed text-navy-deep/85">{admission.feesHidden}</p>}
          </AccentCard>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="overflow-hidden rounded-[28px] border border-[#075E54]/20 bg-white shadow-[0_18px_44px_rgba(20,21,63,0.12)]">
          <div className="flex items-center gap-4 bg-gradient-to-r from-[#064E48] to-[#075E54] px-6 py-5 sm:px-8">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#075E54] shadow-sm">
              <WhatsAppMark />
            </span>
            <h2 className="min-w-0 text-2xl font-semibold text-white">{admission.formTitle}</h2>
          </div>
          <div className="bg-gradient-to-br from-[#F3FBF7] to-white p-6 sm:p-8">
            <InquiryForm id="admission-inquiry" />
          </div>
        </div>
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
