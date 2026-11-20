import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { galleryPage, galleryPhotos, seo, type GalleryEvent, type GalleryPhoto } from '../content';
import { Seo } from '../seo';
import { PageHero } from '../components/ui';

type Filter = 'all' | GalleryEvent;

export default function GalleryPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? galleryPhotos : galleryPhotos.filter((photo) => photo.event === filter)),
    [filter],
  );
  const current = active !== null ? visible[active] : undefined;

  useEffect(() => {
    if (!dialogRef.current?.open) return;
    dialogRef.current.close();
    setActive(null);
  }, [filter]);

  function open(index: number) {
    setActive(index);
    dialogRef.current?.showModal();
  }

  function step(delta: number) {
    setActive((currentIndex) => {
      if (currentIndex === null || visible.length === 0) return currentIndex;
      return (currentIndex + delta + visible.length) % visible.length;
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    touch.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (!touch.current) return;
    const dx = event.clientX - touch.current.x;
    const dy = event.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  }

  return (
    <>
      <Seo title={seo.gallery.title} description={seo.gallery.description} path={seo.gallery.path} />
      <PageHero kicker={galleryPage.kicker} title={galleryPage.title} titleBn={galleryPage.titleBn} lede={galleryPage.lede} tone="navy" art="rainbow" />
      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="toolbar" aria-label="Filter photographs">
          {galleryPage.filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                filter === item.id ? 'bg-navy text-white' : 'border border-navy/15 bg-white text-navy'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3">
          {visible.map((photo, index) => (
            <figure key={photo.id} className="site-card self-start">
              <button type="button" onClick={() => open(index)} className="block w-full text-left">
                <GalleryImage photo={photo} />
                <span className="block px-4 py-3 text-base text-navy-deep">{photo.caption}</span>
              </button>
            </figure>
          ))}
        </div>
      </section>
      <dialog
        ref={dialogRef}
        className="w-[min(960px,calc(100%-1rem))] max-w-[960px] rounded-3xl border border-navy/10 bg-white p-2 text-navy-deep backdrop:bg-navy-deep/75 sm:p-3"
        onClose={() => setActive(null)}
        onKeyDown={onKeyDown}
        aria-label={current ? current.caption : 'Photograph'}
      >
        {current && (
          <figure onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
            <div className="relative">
              <img
                src={current.src}
                alt={current.alt}
                width={current.width}
                height={current.height}
                draggable={false}
                className="max-h-[72vh] w-full rounded-2xl bg-[#eef1f6] object-contain"
              />
              <button
                type="button"
                className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy-deep/80 text-white"
                aria-label="Previous photograph"
                onClick={() => step(-1)}
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy-deep/80 text-white"
                aria-label="Next photograph"
                onClick={() => step(1)}
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
            <figcaption className="flex items-center justify-between gap-3 px-2 py-3 text-sm">
              <span>
                {current.caption}
                <span className="ml-2 text-navy-deep/60">
                  {(active ?? 0) + 1} / {visible.length}
                </span>
              </span>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-navy px-4 py-2 font-semibold text-white"
                onClick={() => dialogRef.current?.close()}
              >
                <X size={16} aria-hidden="true" />
                Close
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}

function GalleryImage({ photo }: { photo: GalleryPhoto }) {
  const portrait = photo.height > photo.width;
  return (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes="(min-width: 1024px) 33vw, (min-width: 520px) 50vw, 100vw"
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      decoding="async"
      className={`w-full object-cover object-top ${portrait ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}
    />
  );
}
