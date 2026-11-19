import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { departmentNews, departmentsPage, programs } from '../content';
import { Seo } from '../seo';
import { DeptIcon } from '../components/DeptIcon';
import { HoverCard } from '../components/kit';
import { ImageReveal, SplitText } from '../components/motion';
import { PageHero, Reveal } from '../components/ui';
import type { SiteTone } from '../components/kit';
import type { ArtName } from '../art';

const look: Record<string, { tone: SiteTone; art: ArtName; wash: string; border: string }> = {
  islamic: { tone: 'sun', art: 'crescent', wash: 'from-[#FFF3C4]', border: 'border-sun' },
  hifz: { tone: 'leaf', art: 'quran', wash: 'from-[#DDF3E6]', border: 'border-leaf' },
  arabic: { tone: 'sky', art: 'book', wash: 'from-[#DCEFFD]', border: 'border-sky' },
  english: { tone: 'orange', art: 'pencil', wash: 'from-[#FFE6C7]', border: 'border-orange' },
};

export default function DepartmentPage() {
  const { id = '' } = useParams();
  const program = programs.find((item) => item.id === id);
  if (!program) return <Navigate to="/" replace />;

  const style = look[program.id] ?? look.english;
  const news = departmentNews.filter((item) => item.department === program.id);
  const others = programs.filter((item) => item.id !== program.id);

  return (
    <>
      <Seo
        title={`${program.title} department · An-Noor International School`}
        description={program.text}
        path={`/departments/${program.id}`}
      />
      <PageHero
        kicker={departmentsPage.kicker}
        title={program.title}
        titleBn={program.titleBn}
        lede={program.text}
        tone={style.tone}
        art={style.art}
      />

      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <Reveal>
          <div className={`flex flex-wrap items-center gap-5 rounded-[28px] border-2 bg-gradient-to-br to-white p-6 shadow-[0_10px_26px_rgba(42,44,137,0.10)] sm:p-8 ${style.border} ${style.wash}`}>
            <DeptIcon id={program.id} />
            <div className="min-w-0 flex-1">
              <p lang="ar" dir="rtl" className="font-bismillah text-3xl text-navy sm:text-4xl">
                {program.titleAr}
              </p>
              <p className="mt-1 max-w-2xl text-base leading-relaxed text-navy-deep/80">{departmentsPage.intro}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-gradient-to-b from-[#E9EBFF] to-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="text-3xl font-semibold text-navy-deep sm:text-4xl">
            <SplitText text={departmentsPage.updatesTitle} />
          </h2>
          <p lang="bn" className="font-bn mt-1 text-lg font-semibold text-navy">
            {departmentsPage.updatesTitleBn}
          </p>
          {news.length === 0 ? (
            <div className="mt-6 rounded-[24px] border-2 border-dashed border-navy/30 bg-gradient-to-br from-white to-[#FFF6D6] p-6 text-base leading-relaxed text-navy-deep/80">
              {departmentsPage.updatesEmpty}
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {news.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-[24px] border border-navy/15 bg-white shadow-[0_10px_26px_rgba(42,44,137,0.10)]">
                  {item.photo && (
                    <ImageReveal>
                      <img
                        src={item.photo.src}
                        alt={item.photo.alt}
                        width={item.photo.width}
                        height={item.photo.height}
                        className="aspect-[16/10] w-full object-cover"
                        loading="lazy"
                      />
                    </ImageReveal>
                  )}
                  <div className="p-5">
                    <p className="inline-flex rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-navy-deep">{item.date}</p>
                    <h3 className="mt-2 text-xl text-navy">{item.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-navy-deep/80">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-semibold text-navy-deep sm:text-3xl">{departmentsPage.othersTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {others.map((item) => {
            const other = look[item.id] ?? look.english;
            return (
              <Link key={item.id} to={`/departments/${item.id}`} className="block h-full rounded-[24px]">
                <HoverCard className={`flex h-full items-center gap-4 rounded-[24px] border-2 bg-gradient-to-br to-white p-4 ${other.border} ${other.wash}`}>
                  <DeptIcon id={item.id} small />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-navy-deep">{item.title}</span>
                    <span lang="bn" className="font-bn block text-sm font-semibold text-navy">
                      {item.titleBn}
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-navy" aria-hidden="true" />
                </HoverCard>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
