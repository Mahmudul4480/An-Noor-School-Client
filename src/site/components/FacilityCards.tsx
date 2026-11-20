import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Cctv, Library, Shapes } from 'lucide-react';
import type { FacilitySpot } from '../content';
import { HoverCard } from './kit';

const namedIcons: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  play: Shapes,
  cctv: Cctv,
  library: Library,
};

const namedWash: Record<string, string> = {
  play: 'bg-sun/50 text-navy-deep',
  cctv: 'bg-[#E4E7FF] text-navy',
  library: 'bg-[#DDF3E6] text-navy',
};

export function FacilityPhotoCard({
  item,
  linked = false,
  heading = 'h2',
}: {
  item: FacilitySpot;
  linked?: boolean;
  heading?: 'h2' | 'h3';
}) {
  const photo = item.photo;
  if (!photo) return <></>;
  const Title = heading;
  const card = (
    <HoverCard className="site-card h-full">
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: photo.objectPosition ?? 'center' }}
        className="aspect-[16/10] w-full object-cover"
      />
      <div className="p-5 sm:p-6">
        <Title className="text-xl font-semibold text-navy-deep">{item.title}</Title>
        <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{item.text}</p>
      </div>
    </HoverCard>
  );
  if (!linked) return card;
  return (
    <Link to="/facilities" className="block h-full rounded-[20px] focus-visible:outline-offset-4">
      {card}
    </Link>
  );
}

export function FacilityIconCard({ item }: { item: FacilitySpot }) {
  const Icon = namedIcons[item.id] ?? Shapes;
  const wash = namedWash[item.id] ?? namedWash.play;
  return (
    <HoverCard className="site-card flex h-full flex-col p-6">
      <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${wash}`}>
        <Icon size={26} aria-hidden />
      </span>
      <h3 className="mt-4 text-xl font-semibold text-navy-deep">{item.title}</h3>
      <p className="mt-2 text-base leading-relaxed text-navy-deep/85">{item.text}</p>
    </HoverCard>
  );
}
