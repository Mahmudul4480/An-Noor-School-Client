import { useMemo, useRef, useState } from 'react';
import { campusPhoto, galleryPage, moments, photoPlaceholders, seo, type Photo, type PhotoPlaceholder } from '../content';
import { Seo } from '../seo';
import { PageHero, PlaceholderCard } from '../components/ui';

type Filter = 'all' | 'campus' | 'people' | 'celebration' | 'needed';

const photos: Photo[] = [campusPhoto, ...moments];

export default function GalleryPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [active, setActive] = useState<Photo | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visiblePhotos = useMemo(
    () => (filter === 'all' || filter === 'needed' ? (filter === 'needed' ? [] : photos) : photos.filter((photo) => photo.category === filter)),
    [filter],
  );
  const visiblePlaceholders = filter === 'all' || filter === 'needed' ? photoPlaceholders : [];

  function open(photo: Photo) {
    setActive(photo);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <Seo title={seo.gallery.title} description={seo.gallery.description} path={seo.gallery.path} />
      <PageHero kicker={galleryPage.kicker} title={galleryPage.title} titleBn={galleryPage.titleBn} lede={galleryPage.lede} />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Filter photographs">
          {galleryPage.filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id as Filter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === item.id ? 'bg-navy text-gold' : 'bg-cream text-navy ring-1 ring-navy/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => open(photo)}
              className="overflow-hidden rounded-[1.6rem] bg-navy-deep text-left shadow-lg ring-1 ring-navy/10"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <span className="block px-4 py-3 text-sm text-cream">{photo.caption}</span>
            </button>
          ))}
          {visiblePlaceholders.map((item) => (
            <div key={item.id}>
              <PlaceholderTile item={item} />
            </div>
          ))}
        </div>
      </section>
      <dialog
        ref={dialogRef}
        className="w-[min(960px,calc(100%-2rem))] rounded-3xl bg-navy-deep p-3 text-white backdrop:bg-navy-deep/70"
        onClose={() => setActive(null)}
      >
        {active && (
          <figure>
            <img src={active.src} alt={active.alt} width={active.width} height={active.height} className="max-h-[75vh] w-full rounded-2xl object-contain" />
            <figcaption className="flex items-center justify-between gap-4 px-2 py-3 text-sm">
              <span>{active.caption}</span>
              <button type="button" className="rounded-full bg-gold px-4 py-2 font-semibold text-navy-deep" onClick={() => dialogRef.current?.close()}>
                Close
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}

function PlaceholderTile({ item }: { item: PhotoPlaceholder }) {
  return <PlaceholderCard title={item.title} caption={item.caption} />;
}
