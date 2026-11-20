import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { nav, phoneDisplay, site } from '../content';
import { FacebookButton, JoyLink, SocialMarks, Wave } from './kit';
import { ScrollProgress } from './motion';

export function SiteLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="site-shell min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-deep"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <Ticker />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Ticker() {
  const reduce = useReducedMotion();
  const items = [
    site.sessionLabel,
    phoneDisplay(),
    site.email,
    site.address.line,
    'English & Arabic based education',
    'Hifz department',
  ];
  if (reduce) {
    return (
      <div className="bg-gradient-to-r from-sun via-[#FFD95A] to-sun text-navy-deep">
        <p className="truncate px-4 py-2 text-center text-sm font-semibold whitespace-nowrap">
          {site.sessionLabel} · {phoneDisplay()}
        </p>
      </div>
    );
  }
  const line = `${items.join('   ·   ')}   ·   ${items.join('   ·   ')}   ·   `;
  return (
    <div className="bg-gradient-to-r from-sun via-[#FFD95A] to-sun text-navy-deep">
      <p className="sr-only">{items.join('. ')}</p>
      <div className="overflow-hidden" aria-hidden="true">
        <div className="site-marquee flex w-max py-2 text-sm font-semibold">
          <span className="px-6">{line}</span>
          <span className="site-marquee-copy px-6">{line}</span>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-navy/10 bg-white text-navy-deep ${
        scrolled ? 'shadow-[0_1px_0_rgba(42,44,137,0.04)]' : ''
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img
            src={site.logo}
            alt={site.name}
            width={720}
            height={720}
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
          />
          <span className="hidden min-[1680px]:block">
            <span className="block text-sm font-semibold leading-tight">{site.name}</span>
            <span lang="bn" className="font-bn block text-xs text-navy/70">
              {site.nameBn}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-x-3 xl:flex" aria-label="Primary">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `relative inline-flex min-h-11 items-center text-sm font-medium text-navy transition hover:text-navy ${
                  isActive
                    ? 'font-semibold after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:rounded-full after:bg-orange'
                    : ''
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-4">
          <JoyLink
            to="/admission"
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-orange px-4 py-2 text-sm font-semibold text-navy-deep"
          >
            Admission <span lang="bn" className="font-bn font-semibold">/ ভর্তি</span>
          </JoyLink>
          <JoyLink
            to="/login"
            className="hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy sm:inline-flex"
          >
            Portal Login
          </JoyLink>
          <FacebookButton href={site.facebook} label="An-Noor International School on Facebook" className="hidden sm:inline-flex" />
          <SocialMarks className="hidden sm:inline-flex" />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-navy/20 text-navy xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-navy/10 bg-white px-4 py-3 shadow-[0_12px_32px_rgba(20,21,63,0.08)] xl:hidden"
          >
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      `flex min-h-11 items-baseline justify-between rounded-2xl px-3 py-3 ${
                        isActive ? 'bg-navy/5 font-semibold text-navy' : 'text-navy-deep'
                      }`
                    }
                  >
                    <span className="font-medium">{item.label}</span>
                    <span lang="bn" className="font-bn text-sm text-navy/70">
                      {item.bn}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="mt-3 flex min-h-11 items-center justify-center rounded-full border border-navy/15 px-4 py-3 text-sm font-semibold text-navy"
            >
              Portal Login
            </Link>
            <div className="mt-3 flex items-center gap-2 px-1 pb-1 sm:hidden">
              <FacebookButton href={site.facebook} label="An-Noor International School on Facebook" />
              <SocialMarks />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-8 overflow-hidden bg-navy-deep text-white">
      <Wave fill="#14153F" flip className="bg-[#f5f7fb]" />
      <div className="relative mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] md:gap-12">
        <div>
          <div className="flex items-center gap-4">
            <img
              src={site.logo}
              alt=""
              width={720}
              height={720}
              className="h-16 w-16 shrink-0 rounded-2xl bg-white object-contain p-1"
            />
            <div>
              <p className="text-lg font-bold leading-tight text-white">{site.name}</p>
              <p lang="bn" className="font-bn mt-0.5 text-sm text-white/80">
                {site.nameBn}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/80">{site.tagline}</p>
          <p lang="bn" className="font-bn mt-1 max-w-sm text-sm leading-relaxed text-white/70">
            {site.taglineBn}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <FacebookButton href={site.facebook} label="An-Noor International School on Facebook" />
            <SocialMarks />
            <a
              href={site.facebook}
              className="text-sm font-semibold text-white hover:text-gold"
              target="_blank"
              rel="noreferrer"
            >
              Follow us on Facebook
            </a>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Visit</p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
            <li className="grid grid-cols-[20px_1fr] gap-3">
              <MapPin size={18} className="mt-0.5 text-gold" aria-hidden="true" />
              <span>
                <a className="hover:text-gold" href={site.address.mapUrl} target="_blank" rel="noreferrer">
                  {site.address.line}
                </a>
              </span>
            </li>
            <li className="grid grid-cols-[20px_1fr] gap-3">
              <Mail size={18} className="mt-0.5 text-gold" aria-hidden="true" />
              <a className="break-all hover:text-gold" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
            <li className="grid grid-cols-[20px_1fr] gap-3">
              <Phone size={18} className="mt-0.5 text-gold" aria-hidden="true" />
              <span>
                <a className="block hover:text-gold" href={`tel:${site.phoneTel}`}>
                  Office {site.phone}
                </a>
                <a className="mt-1 block hover:text-gold" href={`tel:${site.principalPhoneTel}`}>
                  Principal {site.principalPhone}
                </a>
              </span>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Explore</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link className="text-white/85 hover:text-gold" to={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className="text-white/85 hover:text-gold" to="/login">
                Portal Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-4 py-4 text-center text-xs text-white/60 sm:px-6">
        © {year} {site.name}. All rights reserved. Estd. {site.established}.
      </div>
    </footer>
  );
}
