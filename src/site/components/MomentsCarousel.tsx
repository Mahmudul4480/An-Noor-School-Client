import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { moments } from '../content';

export function MomentsCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const photo = moments[index];
  const count = moments.length;

  useEffect(() => {
    if (paused || reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, reduce, count]);

  function go(next: number) {
    setIndex((next + count) % count);
  }

  return (
    <div
      className="grid items-center gap-6 lg:grid-cols-[1.4fr_0.8fr]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="rotate-[-1deg] rounded-[28px] bg-white p-3 shadow-[0_12px_0_0_#5CB8F5] sm:p-4">
        <div className="relative overflow-hidden rounded-[20px] bg-sky/20">
          <AnimatePresence mode="wait">
            <motion.img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              className="aspect-[16/10] w-full object-cover"
              loading="lazy"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
          </AnimatePresence>
        </div>
        <p className="px-2 py-3 text-center text-sm font-semibold text-navy-deep">{photo.caption}</p>
      </div>
      <div>
        <p className="font-arabic text-3xl text-navy" lang="ar" dir="rtl">
          نور
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/75">
          These are the school’s own gatherings — colleagues, sports day, Pitha Utshob — not library pictures.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white"
            aria-label="Previous photograph"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white"
            aria-label="Next photograph"
          >
            <ChevronRight size={18} />
          </button>
          <div className="ml-2 flex gap-1.5" role="tablist" aria-label="Photographs">
            {moments.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={itemIndex === index}
                aria-label={item.caption}
                onClick={() => setIndex(itemIndex)}
                className={`h-2.5 rounded-full transition ${
                  itemIndex === index ? 'w-6 bg-gold' : 'w-2.5 bg-navy/25'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
