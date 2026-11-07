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
      <section className="mx-auto max-w-[1200px] space-y-4 px-4 py-14 sm:px-6">
        {noticesPage.notices.map((notice) => (
          <HoverCard key={notice.id} className="site-card">
            <div className="border-l-4 border-sun p-6 sm:p-8">
            <p className="text-sm font-semibold text-navy">{notice.date}</p>
            <h2 className="mt-2 text-2xl text-navy-deep">{notice.title}</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-deep/85">{notice.body}</p>
            {notice.href && (
              <Link to={notice.href} className="mt-4 inline-flex min-h-11 items-center gap-2 text-base font-semibold text-navy">
                Admission details <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
            </div>
          </HoverCard>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <CreamCard>
          <h2 className="text-2xl font-semibold text-navy-deep">{noticesPage.eventsTitle}</h2>
          <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{noticesPage.eventsNote}</p>
        </CreamCard>
        <div>
          <h2 className="text-2xl font-semibold text-navy-deep">{noticesPage.calendarTitle}</h2>
          <p className="mt-3 text-base leading-relaxed text-navy-deep/80">{noticesPage.calendarNote}</p>
          <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {noticesPage.months.map((month, index) => (
              <li key={month}>
                <HoverCard className="site-card px-4 py-4">
                <p className="text-sm font-semibold text-navy">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <p className="mt-1 font-semibold text-navy-deep">{month}</p>
                <p className="mt-1 text-sm text-navy-deep/70">Dates to be published</p>
                </HoverCard>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
