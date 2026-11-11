import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Word-by-word text entrance: each word rises, un-blurs and fades in.
 * Splits on spaces only, so Bangla conjuncts and matras are never broken or clipped.
 */
export function SplitText({
  text,
  className = '',
  delay = 0,
  stagger = 0.07,
  immediate = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Play on mount (hero) instead of when scrolled into view. */
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;
  const words = text.split(' ');
  const trigger = immediate
    ? { animate: 'show' }
    : { whileInView: 'show', viewport: { once: true, margin: '-40px' } };
  return (
    <motion.span
      className={className}
      initial="hide"
      {...trigger}
      variants={{ hide: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {words.map((word, index) => (
        <span key={`${index}-${word}`}>
          <motion.span
            className="inline-block will-change-transform"
            variants={{
              hide: { opacity: 0, y: '0.55em', filter: 'blur(8px)' },
              show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease } },
            }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </motion.span>
  );
}

/** Curtain reveal for photographs: the frame wipes open while the picture settles from a slight zoom. */
export function ImageReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1, ease }}
    >
      <motion.div
        initial={{ scale: 1.18 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 1.4, ease }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Slow parallax drift for a full-width photograph as the page scrolls past it. */
export function ParallaxPhoto({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={reduce ? undefined : { y, scale }}>{children}</motion.div>
    </div>
  );
}

/** Thin brand-coloured bar at the top of the window that fills as the page is read. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r from-sun via-orange to-leaf"
      style={{ scaleX }}
    />
  );
}
