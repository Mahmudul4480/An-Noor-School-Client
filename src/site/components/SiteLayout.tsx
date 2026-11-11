import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { nav, phoneDisplay, site } from '../content';
import { FacebookButton, JoyLink, Wave } from './kit';
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
  const items = [
    site.sessionLabel,
    phoneDisplay(),
    site.email,
    site.address.line,
    'English & Arabic based education',
    'Hifz department',
  ];
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
      className={`sticky top-0 z-40 border-b border-sun/50 bg-gradient-to-r from-navy-deep via-navy to-navy-deep text-white ${
        scrolled ? 'shadow-[0_12px_28px_rgba(20,21,63,0.32)]' : ''
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img
            src={site.logo}
            alt={site.name}
            width={720}
            height={720}
            className="h-14 w-14 rounded-2xl bg-white object-contain p-1 shadow-[0_6px_16px_rgba(0,0,0,0.25)] sm:h-16 sm:w-16"
          />
          <span className="hidden min-[1680px]:block">
            <span className="block text-sm font-semibold leading-tight">{site.name}</span>
            <span lang="bn" className="font-bn block text-xs text-white/75">
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
                `inline-flex min-h-11 items-center text-sm font-semibold transition hover:text-sun ${isActive ? 'text-sun' : 'text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-4">
          <JoyLink
            to="/admission"
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-orange px-4 py-2 text-sm font-bold text-navy-deep shadow-[0_8px_18px_rgba(42,44,137,0.12)]"
          >
            Admission <span lang="bn" className="font-bn font-semibold">/ ভর্তি</span>
          </JoyLink>
          <JoyLink
            to="/login"
            className="hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-white/45 px-4 py-2 text-sm font-bold text-white sm:inline-flex"
          >
            Portal Login
          </JoyLink>
          <FacebookButton href={site.facebook} label="An-Noor International School on Facebook" className="hidden sm:inline-flex" />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/80 text-white xl:hidden"
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
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-white/10 bg-navy-deep px-4 py-4 shadow-2xl xl:hidden"
          >
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      `flex items-baseline justify-between rounded-2xl px-3 py-3 ${
                        isActive ? 'bg-white/10 text-gold' : 'text-white'
                      }`
                    }
                  >
                    <span className="font-medium">{item.label}</span>
                    <span lang="bn" className="font-bn text-sm text-cream/80">
                      {item.bn}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="mt-3 flex items-center justify-center rounded-full border border-gold/60 px-4 py-3 text-sm font-semibold text-gold"
            >
              Portal Login
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-8 overflow-hidden bg-gradient-to-b from-navy-deep to-[#0C0D2B] text-white">
      <Wave fill="#14153F" flip flowers className="bg-cream" />
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
          <div className="mt-5 flex items-center gap-3">
            <FacebookButton href={site.facebook} label="An-Noor International School on Facebook" />
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
                {site.address.line}
                {!site.address.confirmed && (
                  <span className="mt-1 block text-xs text-white/60">Exact pin to be confirmed</span>
                )}
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
              <span>{phoneDisplay()}</span>
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
