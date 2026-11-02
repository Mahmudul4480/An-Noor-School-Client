import { Facebook, Mail, MapPin } from 'lucide-react';
import { contactPage, phoneDisplay, seo, site } from '../content';
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
                <a className="break-all font-medium text-navy underline-offset-4 hover:underline" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </li>
              <li>
                <p className="font-medium text-navy-deep">{phoneDisplay()}</p>
                {!site.phone.trim() && <p className="mt-1 text-xs text-ink/60">{contactPage.phoneNote}</p>}
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
          </CreamCard>
          <div className="site-card p-6">
            <h2 className="text-lg font-semibold text-navy-deep">{contactPage.mapTitle}</h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-navy-deep/85">{contactPage.mapNote}</p>
            <p className="mt-4 text-base font-semibold text-navy">{site.address.line}</p>
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
