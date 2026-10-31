import { useEffect } from 'react';
import { site } from './content';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function Seo({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  useEffect(() => {
    document.title = title;
    const origin = site.canonicalOrigin || window.location.origin;
    const url = `${origin}${path}`;
    const image = `${origin}${site.ogImage}`;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:locale', 'en_US');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;

    const scriptId = 'site-jsonld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const data: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'School',
      name: site.name,
      alternateName: site.nameBn,
      description,
      url,
      image,
      email: site.email,
      foundingDate: String(site.established),
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address.line,
        addressLocality: site.address.locality,
        addressCountry: 'BD',
      },
      sameAs: [site.facebook],
    };
    if (site.phone.trim()) data.telephone = site.phone.trim();
    script.textContent = JSON.stringify(data);
  }, [title, description, path]);

  return null;
}
