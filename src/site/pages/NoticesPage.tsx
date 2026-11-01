import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { noticesPage, seo } from '../content';
import { Seo } from '../seo';
import { HoverCard } from '../components/kit';
import { CreamCard, PageHero } from '../components/ui';

export default function NoticesPage() {
  return (
    <>
      <Seo title={seo.notices.title} description={seo.notices.description} path={seo.notices.path} />
      <PageHero tone="coral" art="balloon"
        kicker={noticesPage.kicker}
        title={noticesPage.title}
        titleBn={noticesPage.titleBn}
        lede={noticesPage.lede}
      />
      <section className="mx-auto max-w-6xl space-y-4 px-4 py-14 sm:px-6">
        {noticesPage.notices.map((notice) => (
          <HoverCard key={notice.id} className="rounded-[1.8rem] bg-gradient-to-br from-navy-deep to-navy p-6 text-white shadow-lg sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{notice.date}</p>
            <h2 className="mt-2 text-2xl font-semibold">{notice.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">{notice.body}</p>
            {notice.href && (
              <Link to={notice.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold">
                Admission details <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </HoverCard>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <CreamCard>
          <h2 className="text-2xl font-semibold text-navy-deep">{noticesPage.eventsTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">{noticesPage.eventsNote}</p>
        </CreamCard>
        <div>
          <h2 className="text-2xl font-semibold text-navy-deep">{noticesPage.calendarTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">{noticesPage.calendarNote}</p>
          <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {noticesPage.months.map((month, index) => (
              <li key={month}>
                <HoverCard className="rounded-2xl bg-gradient-to-br from-[#fffaf0] to-cream px-3 py-4 ring-1 ring-navy/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy/50">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <p className="mt-1 font-semibold text-navy-deep">{month}</p>
                <p className="mt-1 text-xs text-ink/55">Dates to be published</p>
                </HoverCard>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
