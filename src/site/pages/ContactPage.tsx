import { Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { contactPage, seo, site } from '../content';
import { Seo } from '../seo';
import { InquiryForm } from '../components/InquiryForm';
import { CreamCard, PageHero } from '../components/ui';

export default function ContactPage() {
  return (
    <>
      <Seo title={seo.contact.title} description={seo.contact.description} path={seo.contact.path} />
      <PageHero kicker={contactPage.kicker} title={contactPage.title} titleBn={contactPage.titleBn} lede={contactPage.lede} tone="navy" art="planet" />
      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CreamCard>
            <h2 className="text-lg font-semibold text-navy-deep">School office</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 text-navy" size={18} aria-hidden="true" />
                <span>
                  <span className="block font-medium text-navy-deep">{site.address.line}</span>
                  {!site.address.confirmed && (
                    <span className="mt-1 block text-xs text-ink/60">Exact address and pin are not confirmed yet.</span>
                  )}
                </span>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 text-navy" size={18} aria-hidden="true" />
                <a className="font-medium text-navy underline-offset-4 hover:underline" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 text-navy" size={18} aria-hidden="true" />
                <span>
                  <a className="block font-medium text-navy underline-offset-4 hover:underline" href={`tel:${site.phoneTel}`}>
                    Office {site.phone}
                  </a>
                  <a className="mt-1 block font-medium text-navy underline-offset-4 hover:underline" href={`tel:${site.principalPhoneTel}`}>
                    Principal {site.principalPhone}
                  </a>
                  <a
                    className="mt-2 inline-flex min-h-11 items-center font-semibold text-navy underline-offset-4 hover:underline"
                    href={`https://wa.me/${site.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp the office
                  </a>
                </span>
              </li>
            </ul>
            <a
              href={site.facebook}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy"
            >
              <Facebook size={16} aria-hidden="true" />
              Facebook
            </a>
          </CreamCard>
          <CreamCard>
            <h2 className="text-lg font-semibold text-navy-deep">{contactPage.hoursTitle}</h2>
            <p className="mt-3 text-base leading-relaxed text-navy-deep/85">{contactPage.hoursNote}</p>
            <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{contactPage.schoolDaysNote}</p>
          </CreamCard>
          <div className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-navy-deep to-navy-soft p-6 text-white shadow-lg">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(254,237,175,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(254,237,175,0.25) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="relative">
              <h2 className="text-lg font-semibold">{contactPage.mapTitle}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/85">{site.address.line}</p>
              <a
                href={site.address.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-sun px-4 py-2 text-sm font-semibold text-navy-deep"
              >
                Open in Google Maps
              </a>
            </div>
            <iframe
              title="Map of An-Noor International School"
              src={site.address.mapEmbed}
              className="mt-4 h-56 w-full rounded-2xl border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
        <CreamCard>
          <h2 className="text-2xl font-semibold text-navy-deep">Inquiry</h2>
          <div className="mt-4">
            <InquiryForm id="contact-inquiry" />
          </div>
        </CreamCard>
      </section>
    </>
  );
}
