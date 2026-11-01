import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Facebook, Mail, MapPin, Menu, X } from 'lucide-react';
import { nav, phoneDisplay, site } from '../content';
import { JoyLink, Wave } from './kit';

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
    <div className="bg-navy text-white">
      <p className="sr-only">{items.join('. ')}</p>
      <div className="overflow-hidden" aria-hidden="true">
        <div className="site-marquee flex w-max py-2 text-[12px] font-medium tracking-wide">
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
      className={`sticky top-0 z-40 border-b-4 border-sun bg-cream text-navy-deep ${
        scrolled ? 'shadow-[0_10px_0_0_rgba(42,44,137,0.08)]' : ''
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img
            src={site.logo}
            alt={site.name}
            width={720}
            height={720}
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
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
                `min-h-11 text-[13px] font-bold transition hover:text-orange ${isActive ? 'text-orange' : 'text-navy'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-4">
          <JoyLink
            to="/admission"
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-orange px-3 py-2 text-xs font-bold text-navy-deep shadow-[0_4px_0_0_#2A2C89] sm:px-4 sm:text-sm"
          >
            Admission <span lang="bn" className="font-bn font-semibold">/ ভর্তি</span>
          </JoyLink>
          <JoyLink
            to="/login"
            className="hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border-2 border-navy px-4 py-2 text-sm font-bold text-navy sm:inline-flex"
          >
            Portal Login
          </JoyLink>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-navy text-navy xl:hidden"
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
    <footer className="relative mt-8 overflow-hidden bg-navy-deep text-white">
      <Wave fill="#14153F" flip flowers className="bg-cream" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <img src={site.logo} alt="" width={720} height={720} className="h-20 w-20 object-contain" />
          <p className="mt-4 text-lg font-semibold text-white">{site.name}</p>
          <p lang="bn" className="font-bn text-sm text-cream/80">
            {site.nameBn}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/75">{site.tagline}</p>
          <p lang="bn" className="font-bn mt-1 text-sm text-cream/70">
            {site.taglineBn}
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Visit</h2>
          <ul className="mt-4 space-y-3 text-sm text-cream/85">
            <li className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <span>
                {site.address.line}
                {!site.address.confirmed && (
                  <span className="mt-1 block text-xs text-cream/60">Exact pin to be confirmed</span>
                )}
              </span>
            </li>
            <li className="flex gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <a className="hover:text-gold" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
            <li>{phoneDisplay()}</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Explore</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link className="text-cream/85 hover:text-gold" to={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className="text-cream/85 hover:text-gold" to="/login">
                Portal Login
              </Link>
            </li>
          </ul>
          <a
            href={site.facebook}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-gold"
            target="_blank"
            rel="noreferrer"
          >
            <Facebook size={16} aria-hidden="true" />
            Facebook
          </a>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-4 py-4 text-center text-xs text-cream/60 sm:px-6">
        © {year} {site.name}. All rights reserved. Estd. {site.established}.
      </div>
    </footer>
  );
}
