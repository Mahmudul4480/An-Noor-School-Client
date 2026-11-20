import { facilities, seo } from '../content';
import { Seo } from '../seo';
import { FacilityIconCard, FacilityPhotoCard } from '../components/FacilityCards';
import { PageHero, SectionHeading } from '../components/ui';

export default function FacilitiesPage() {
  return (
    <>
      <Seo title={seo.facilities.title} description={seo.facilities.description} path={seo.facilities.path} />
      <PageHero kicker={facilities.kicker} title={facilities.title} titleBn={facilities.titleBn} lede={facilities.lede} tone="sky" art="cloud" />
      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 py-14 sm:px-6 md:grid-cols-2">
        {facilities.spots.map((item) => (
          <div key={item.id} className="h-full">
            <FacilityPhotoCard item={item} />
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
        <SectionHeading kicker="Campus" title={facilities.namedTitle} text={facilities.namedText} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.named.map((item) => (
            <div key={item.id} className="h-full">
              <FacilityIconCard item={item} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
