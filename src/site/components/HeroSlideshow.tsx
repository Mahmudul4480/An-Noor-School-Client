import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { photos } from '../content';

const slides = [
  photos.hero,
  { src: photos.sports.src, alt: photos.sports.alt, width: photos.sports.width, height: photos.sports.height },
  { src: photos.pitha.src, alt: photos.pitha.alt, width: photos.pitha.width, height: photos.pitha.height },
  { src: photos.office.src, alt: photos.office.alt, width: photos.office.width, height: photos.office.height },
  { src: photos.celebration.src, alt: photos.celebration.alt, width: photos.celebration.width, height: photos.celebration.height },
  { src: photos.gathering.src, alt: photos.gathering.alt, width: photos.gathering.width, height: photos.gathering.height },
];

export function HeroSlideshow() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [reduce, count]);

  const active = slides[reduce ? 0 : index];

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="sync">
        <motion.img
          key={active.src}
          src={active.src}
          alt={active.alt}
          width={active.width}
          height={active.height}
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      <div className="absolute right-5 top-24 z-[1] flex gap-2 md:right-8 md:top-28" aria-hidden={reduce ? true : undefined}>
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show photograph ${slideIndex + 1}`}
            aria-current={slideIndex === (reduce ? 0 : index)}
            onClick={() => setIndex(slideIndex)}
            className={`h-1.5 rounded-full transition-all ${
              slideIndex === (reduce ? 0 : index) ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
