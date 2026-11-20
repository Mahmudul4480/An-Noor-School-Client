/**
 * All public-website copy lives here. Update this file to change names,
 * pages, notices, and fees. Portal / ERP code does not read it.
 *
 * Search for "TODO" before a new session goes live.
 */

/** Flip to true only after the school confirms these figures for publication. */
export const showFees = false;

export const site = {
  name: 'An-Noor International School',
  nameBn: 'আন-নূর ইন্টারন্যাশনাল স্কুল',
  tagline: 'Committed to building a moral foundation',
  taglineBn: 'নৈতিক ভিত্তি গড়ে তুলতে প্রতিশ্রুতিবদ্ধ',
  established: 2023,
  sessionLabel: 'Admission Open 2027',
  sessionShort: '2027',
  email: 'annoorinternationalschool@gmail.com',
  /** Office line. Shown on tel: links and the WhatsApp inquiry button. */
  phone: '+880 1841-587780',
  /** E.164 for tel: links. */
  phoneTel: '+8801841587780',
  principalPhone: '+880 1841-587787',
  principalPhoneTel: '+8801841587787',
  /** Digits only, country code, no plus. Office WhatsApp. */
  whatsapp: '8801841587780',
  address: {
    line: 'Near Goni Bakery, Rahamotgonj, Chattogram',
    locality: 'Chattogram',
    country: 'Bangladesh',
    confirmed: true,
    mapUrl: 'https://maps.app.goo.gl/E6yo8dVKLoGrA6L16',
    /** Same pin as mapUrl, in a form a page can embed. */
    mapEmbed: 'https://www.google.com/maps?q=22.3485787,91.8356579&z=16&output=embed',
  },
  facebook: 'https://facebook.com/An.Noor.International.School',
  /**
   * TODO: set a preferred canonical origin (https://example.com, no trailing slash)
   * if it should differ from the address visitors are actually using.
   */
  canonicalOrigin: '',
  ogImage: '/site/og.webp',
  logo: '/site/logo.webp',
  /**
   * Painted on the school's own building sign.
   */
  curriculumLine: 'National Curriculum (English Version)',
  curriculumBlend: 'Blended with Islamic, moral and ethical values',
  bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  /** Same words without harakat, for the large calligraphic line in the home hero. */
  bismillahPlain: 'بسم الله الرحمن الرحيم',
  verse: {
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    translation: 'My Lord, increase me in knowledge.',
    source: "Qur'an 20:114",
  },
  principal: {
    name: 'Fatema Sultana Moona',
    title: 'Principal',
    photo: '/site/principal.webp',
    photoWidth: 900,
    photoHeight: 1176,
  },
  managingPartner: {
    name: 'Md. Kamruzzaman',
    title: 'Managing Partner',
    photo: '/site/managing-partner.webp',
    photoWidth: 900,
    photoHeight: 1200,
  },
};

export const nav = [
  { href: '/', label: 'Home', bn: 'হোম' },
  { href: '/about', label: 'About', bn: 'পরিচিতি' },
  { href: '/academics', label: 'Academics', bn: 'শিক্ষাক্রম' },
  { href: '/admission', label: 'Admission', bn: 'ভর্তি' },
  { href: '/facilities', label: 'Facilities', bn: 'সুবিধা' },
  { href: '/teachers', label: 'Teachers', bn: 'শিক্ষক' },
  { href: '/notices', label: 'Notices', bn: 'নোটিশ' },
  { href: '/gallery', label: 'Gallery', bn: 'গ্যালারি' },
  { href: '/contact', label: 'Contact', bn: 'যোগাযোগ' },
] as const;

export const seo = {
  home: {
    path: '/',
    title: 'An-Noor International School · Chattogram',
    description:
      'An-Noor International School in Chattogram offers English and Arabic based education, Islamic values, and modern academics from Play to Class 7, with a Hifz department. Admission Open 2027.',
  },
  about: {
    path: '/about',
    title: 'About · An-Noor International School',
    description:
      'An-Noor International School, established in 2023 in Chattogram. Principal Fatema Sultana Moona. English and Arabic based learning with Islamic values.',
  },
  academics: {
    path: '/academics',
    title: 'Academics · An-Noor International School',
    description:
      'Play, Nursery, KG, and Class 1 to 7. Islamic studies, Hifz, Arabic, and English on a national curriculum (English version).',
  },
  admission: {
    path: '/admission',
    title: 'Admission Open 2027 · An-Noor International School',
    description:
      'Admission Open 2027 at An-Noor International School, Chattogram. Inquire for Play through Class 7.',
  },
  facilities: {
    path: '/facilities',
    title: 'Facilities · An-Noor International School',
    description:
      'Classrooms, the early years room, the multipurpose hall, and the seminar hall at An-Noor International School in Rahamotgonj, Chattogram.',
  },
  teachers: {
    path: '/teachers',
    title: 'Teachers · An-Noor International School',
    description:
      'Leadership and teachers of An-Noor International School. Principal Fatema Sultana Moona.',
  },
  notices: {
    path: '/notices',
    title: 'Notices & events · An-Noor International School',
    description:
      'School notices, events, and the academic calendar for An-Noor International School. Admission Open 2027.',
  },
  gallery: {
    path: '/gallery',
    title: 'Gallery · An-Noor International School',
    description:
      'Photographs from An-Noor International School — tree planting, a vegetables display, science fair and prize giving, sports, meetings, teacher training, and classroom life.',
  },
  contact: {
    path: '/contact',
    title: 'Contact · An-Noor International School',
    description:
      'Contact An-Noor International School in Chattogram. Office +880 1841-587780. Email annoorinternationalschool@gmail.com. Near Goni Bakery, Rahamotgonj.',
  },
} as const;

export type Stat = {
  id: string;
  label: string;
  bn: string;
  value: number | null;
  /** TODO text shown when value is null. */
  pending: string;
};

export const stats: Stat[] = [
  { id: 'estd', label: 'Established', bn: 'প্রতিষ্ঠা', value: 2023, pending: '' },
  { id: 'classes', label: 'Classes, Play to 7', bn: 'শ্রেণি', value: 10, pending: '' },
  { id: 'sections', label: 'Named early-years sections', bn: 'শাখা', value: 6, pending: '' },
  {
    id: 'learners',
    label: 'Learners enrolled',
    bn: 'শিক্ষার্থী',
    // TODO: replace with the confirmed enrolment figure. Do not invent a student count.
    value: null,
    pending: 'To be published',
  },
];

export type Program = {
  id: string;
  title: string;
  titleAr: string;
  titleBn: string;
  text: string;
};

export const programs: Program[] = [
  {
    id: 'islamic',
    title: 'Islamic studies',
    titleAr: 'الدراسات الإسلامية',
    titleBn: 'ইসলামিক স্টাডিজ',
    text: 'Worship, character, and adab sit beside the rest of the school day — the moral foundation the crest already names.',
  },
  {
    id: 'hifz',
    title: 'Hifz',
    titleAr: 'حفظ',
    titleBn: 'হিফজ',
    text: 'A Hifz department for children who are memorising the Qur’an, alongside their classes rather than apart from school.',
  },
  {
    id: 'arabic',
    title: 'Arabic',
    titleAr: 'العربية',
    titleBn: 'আরবি',
    text: 'Arabic, so recitation can grow into reading — at the pace each class can hold, from the early years upward.',
  },
  {
    id: 'english',
    title: 'English',
    titleAr: 'الإنجليزية',
    titleBn: 'ইংরেজি',
    text: 'English is both a subject and the language of the national curriculum here: reading, writing, and clear speech.',
  },
];

export type DepartmentNews = {
  id: string;
  /** A programme id: 'islamic' | 'hifz' | 'arabic' | 'english'. */
  department: string;
  date: string;
  title: string;
  body: string;
  photo?: { src: string; alt: string; width: number; height: number };
  /** Featured items also show on the home page. */
  featured?: boolean;
};

/**
 * TODO: add real department news supplied by the school.
 * Never invent a story, a name or a result.
 * The owner gave consent on 20 Nov 2026 to publish the school photographs of children on this site.
 */
export const departmentNews: DepartmentNews[] = [];

export const departmentsPage = {
  kicker: 'Department',
  intro: 'News, achievements and updates from this department are collected on this page.',
  updatesTitle: 'Department updates',
  updatesTitleBn: 'বিভাগের খবর',
  updatesEmpty: 'Updates from this department will appear here when the school publishes them. Nothing is listed until then.',
  othersTitle: 'Other departments',
  cardCta: 'Open department',
  featuredTitle: 'Featured news',
  featuredTitleBn: 'বিশেষ খবর',
  featuredEmpty: 'Featured news from the departments will appear here when the school publishes it — an achievement, a milestone, a story worth sharing.',
};

export type ClassBand = {
  id: string;
  name: string;
  stage: string;
  sections: string[];
  text: string;
};

export const classes: ClassBand[] = [
  {
    id: 'play',
    name: 'Play',
    stage: 'Early years',
    sections: ['Rawdah', 'Nabat'],
    text: 'The first step in. Children settle through play, routine, and the sounds of Arabic and English, with plenty of care around them.',
  },
  {
    id: 'nursery',
    name: 'Nursery',
    stage: 'Early years',
    sections: ['Alwan', 'Qamar'],
    text: 'Stories, colours, early letters and numbers, and short surahs — still a gentle day, with school habits beginning to hold.',
  },
  {
    id: 'kg',
    name: 'KG',
    stage: 'Early years',
    sections: ['Marwa', 'Taqwa'],
    text: 'Readiness for Class 1: more confidence in speaking and early reading, and a full school-day rhythm.',
  },
  {
    id: 'c1',
    name: 'Class 1',
    stage: 'Primary',
    sections: [],
    text: 'The primary years begin. The national curriculum in the English version, with Islamic studies, Arabic, and Hifz beside it.',
  },
  {
    id: 'c2',
    name: 'Class 2',
    stage: 'Primary',
    sections: [],
    text: 'Reading and number work deepen, and the habits of a primary classroom take root.',
  },
  {
    id: 'c3',
    name: 'Class 3',
    stage: 'Primary',
    sections: [],
    text: 'A fuller primary day — subjects widen, and children are expected to work with more independence.',
  },
  {
    id: 'c4',
    name: 'Class 4',
    stage: 'Primary',
    sections: [],
    text: 'Stronger writing, clearer reasoning, and steady Qur’an and Arabic practice through the week.',
  },
  {
    id: 'c5',
    name: 'Class 5',
    stage: 'Primary',
    sections: [],
    text: 'The upper primary year before Class 6, with more demand in both the curriculum and character.',
  },
  {
    id: 'c6',
    name: 'Class 6',
    stage: 'Primary',
    sections: [],
    text: 'The same blend continues — national curriculum, English version, with Islamic studies, Arabic, and Hifz.',
  },
  {
    // TODO: confirm the Class 7 description with the school.
    id: 'c7',
    name: 'Class 7',
    stage: 'Primary',
    sections: [],
    text: 'The senior class of the school. The same blend — national curriculum, English version, with Islamic studies, Arabic, and Hifz.',
  },
];

export const values = [
  { ar: 'إيمان', en: 'Iman', bn: 'ঈমান' },
  { ar: 'أدب', en: 'Adab', bn: 'আদব' },
  { ar: 'علم', en: 'Ilm', bn: 'ইলম' },
  { ar: 'أمانة', en: 'Amanah', bn: 'আমানত' },
  { ar: 'إخلاص', en: 'Ikhlas', bn: 'ইখলাস' },
  { ar: 'صبر', en: 'Sabr', bn: 'সবর' },
  { ar: 'شكر', en: 'Shukr', bn: 'শুকর' },
  { ar: 'تقوى', en: 'Taqwa', bn: 'তাকওয়া' },
  { ar: 'صدق', en: 'Sidq', bn: 'সিদক' },
  { ar: 'خدمة', en: 'Khidmah', bn: 'খেদমত' },
];

export type Photo = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  category: 'campus' | 'people' | 'celebration';
};

/**
 * The owner gave consent on 20 Nov 2026 to publish these photographs of children.
 */
export const photos = {
  hero: {
    src: '/site/hero.webp',
    alt: 'The cream-coloured building of An-Noor International School, with palm leaves in the foreground and the school name on a blue sign.',
    width: 1920,
    height: 1072,
  },
  building: {
    src: '/site/building.webp',
    alt: 'Street view of An-Noor International School behind a patterned boundary wall.',
    width: 1600,
    height: 893,
  },
  office: {
    id: 'office',
    src: '/site/gallery-office.webp',
    alt: 'Principal Fatema Sultana Moona with colleagues in the school office, holding a crest, in front of a blue mural of stars and a crescent.',
    caption: 'The Principal with colleagues in the school office.',
    width: 1280,
    height: 960,
    category: 'people' as const,
  },
  celebration: {
    id: 'celebration',
    src: '/site/gallery-celebration.webp',
    alt: 'A large group of women teachers seated and standing with gift boxes, in a room decorated with paper fans and a graduation cap.',
    caption: 'A teachers’ celebration at school.',
    width: 1500,
    height: 1125,
    category: 'celebration' as const,
  },
  gathering: {
    id: 'gathering',
    src: '/site/gallery-gathering.webp',
    alt: 'Women and two children seated together on a green campus lawn in front of a tall hedge.',
    caption: 'A gathering on the campus green.',
    width: 1400,
    height: 788,
    category: 'people' as const,
  },
  sports: {
    id: 'sports',
    src: '/site/gallery-sports.webp',
    alt: 'Staff and guests posed on the outdoor ground in front of an An-Noor International School annual sports banner.',
    caption: 'Annual sports day on the school ground.',
    width: 1600,
    height: 1067,
    category: 'celebration' as const,
  },
  pitha: {
    id: 'pitha',
    src: '/site/gallery-pitha.webp',
    alt: 'Teachers seated in a bright classroom beneath paper fans and a colourful Pitha Utshob display.',
    caption: 'Pitha Utshob in a school room.',
    width: 1500,
    height: 1125,
    category: 'celebration' as const,
  },
};

export type HeroSlide = {
  id: string;
  src: string;
  srcSet?: string;
  alt: string;
  width: number;
  height: number;
  objectPosition: string;
  /** Short name for the slide controls. */
  label: string;
};

/** First slide is the clean full-facade building shot. The others load after the page. */
export const heroSlides: HeroSlide[] = [
  {
    id: 'building',
    src: photos.hero.src,
    srcSet: '/site/hero-800.webp 960w, /site/hero.webp 1920w',
    alt: photos.hero.alt,
    width: photos.hero.width,
    height: photos.hero.height,
    objectPosition: 'center center',
    label: 'School building',
  },
  {
    id: 'classroom',
    src: '/site/photos/hero-classroom-colorful.webp',
    srcSet: '/site/photos/sm/hero-classroom-colorful.webp 960w, /site/photos/hero-classroom-colorful.webp 1920w',
    alt: 'Children in green and white uniforms sit on yellow and red chairs with their hands raised, in a classroom with drawings on the walls.',
    width: 1920,
    height: 1080,
    objectPosition: 'center 36%',
    label: 'Classroom',
  },
  {
    id: 'dua',
    src: '/site/photos/hero-dua-quran-session.webp',
    srcSet: '/site/photos/sm/hero-dua-quran-session.webp 960w, /site/photos/hero-dua-quran-session.webp 1920w',
    alt: 'A man in a grey tunic and white cap kneels on a blue carpet with his hands raised, while girls in white sit along the wall.',
    width: 1920,
    height: 1080,
    objectPosition: 'center 58%',
    label: 'A gathering on the carpet',
  },
];

export const moments: Photo[] = [
  photos.office,
  photos.sports,
  photos.pitha,
  photos.celebration,
  photos.gathering,
];

export type PlaceholderKind = 'lesson' | 'hifz' | 'play' | 'arabic';

export type PhotoPlaceholder = {
  id: string;
  kind: 'placeholder';
  variant: PlaceholderKind;
  title: string;
  caption: string;
  /** Named photograph the school still needs to supply. */
  needed: string;
  category: 'needed';
};

/**
 * Not shown on the site. Classroom and Hifz photographs are published.
 * The owner gave consent on 20 Nov 2026 for the photographs of children on this site.
 */
export const photoPlaceholders: PhotoPlaceholder[] = [
  {
    id: 'need-lesson',
    kind: 'placeholder',
    variant: 'lesson',
    title: 'A lesson in progress',
    caption: 'Photograph needed — children learning in a classroom.',
    // TODO: photograph of a lesson in progress, with students.
    needed: 'Classroom lesson with students',
    category: 'needed',
  },
  {
    id: 'need-hifz',
    kind: 'placeholder',
    variant: 'hifz',
    title: 'Hifz',
    caption: 'Photograph needed — the Hifz circle.',
    // TODO: photograph of the Hifz department.
    needed: 'Hifz department',
    category: 'needed',
  },
  {
    id: 'need-play',
    kind: 'placeholder',
    variant: 'play',
    title: 'Play',
    caption: 'Photograph needed — the early-years play area.',
    // TODO: photograph of the Play / early-years play zone.
    needed: 'Early-years play zone',
    category: 'needed',
  },
  {
    id: 'need-arabic',
    kind: 'placeholder',
    variant: 'arabic',
    title: 'Arabic',
    caption: 'Photograph needed — an Arabic lesson.',
    // TODO: photograph of an Arabic lesson.
    needed: 'Arabic lesson',
    category: 'needed',
  },
];

export const home = {
  kicker: 'Chattogram · Estd. 2023',
  lede: 'An English and Arabic school for children from Play to Class 7, where Islamic character and the national curriculum share the same day — including a Hifz department.',
  primaryCta: 'Admission',
  primaryCtaBn: 'ভর্তি',
  secondaryCta: 'The school',
  programsKicker: 'What the day holds',
  programsKickerBn: 'পাঠ',
  programsTitle: 'Four strands, one school day',
  programsText:
    'Islamic studies, Hifz, Arabic, and English are not extras pasted on at the end. They are how An-Noor describes its education, next to the national curriculum in the English version.',
  pathKicker: 'A child’s path',
  pathKickerBn: 'পথ',
  pathTitle: 'From the first classroom to Class 7',
  pathText:
    'Three early-years classes, each with two named sections, then Class 1 through Class 7. The names below are the school’s own.',
  // TODO: publish a per-class subject list and age guide when the school provides them.
  pathFootnote: 'A subject list and age guide for each class will be added when the school provides them.',
  campusKicker: 'Facilities',
  campusTitle: 'Rooms at the school',
  campusText:
    'Classrooms, the early years room, the multipurpose hall, the seminar hall, and the Hifz program.',
  campusCta: 'All facilities',
  pathGalleryTitle: 'School life in pictures',
  pathGalleryTitleBn: 'ছবিতে স্কুল',
  pathGalleryCta: 'Open the gallery',
  valuesKicker: 'What we hold',
  valuesTitle: 'The character the crest is for',
  momentsKicker: 'Moments',
  momentsKickerBn: 'মুহূর্ত',
  momentsTitle: 'Life already happening here',
  principalKicker: 'From the Principal’s office',
  principalTitle: 'Fatema Sultana Moona',
  // TODO: replace with Fatema Sultana Moona's own message. Do not present drafted sentences as her quotation.
  principalNote:
    'A message in the Principal’s own words will be published here. The portrait is hers; the sentences should be too.',
  admissionKicker: 'Admission Open 2027',
  admissionTitle: 'Admission is open',
  admissionText:
    'Families may inquire now for Play through Class 7. The form below opens WhatsApp to the office. It is not stored on this website.',
};

/**
 * TODO: replace with the school's real daily timetable. These rows are placeholders, not a published schedule.
 */
export const dayAtSchool = {
  kicker: 'A day at An-Noor',
  kickerBn: 'একদিন আন-নূরে',
  title: 'How a school day might feel',
  note: 'The office has not confirmed the timetable. Nothing below is a bell time.',
  steps: [
    { label: 'Arrival', text: 'To be confirmed: how children are welcomed in.' },
    { label: 'Learning', text: 'To be confirmed: lessons, Arabic, and Islamic studies.' },
    { label: 'Salah & rest', text: 'To be confirmed: prayer, snack, and a break.' },
    { label: 'Home time', text: 'To be confirmed: how the day closes.' },
  ],
};

export const about = {
  kicker: 'The school',
  title: 'A young school with an old intention',
  titleBn: 'নৈতিক ভিত্তির স্কুল',
  lede: 'An-Noor International School was established in 2023 in Chattogram. The crest says the aim in one line: committed to building a moral foundation.',
  storyTitle: 'What we can say today',
  story: [
    'The school teaches in an English and Arabic frame, with Islamic values and modern academics together, and a Hifz department as part of the house — not a separate address.',
    'Across the building itself the school writes its curriculum in plain words: National Curriculum (English Version), blended with Islamic, moral and ethical values.',
  ],
  // TODO: replace with the school's own history, written by the people who founded it.
  historyTitle: 'History',
  historyNote:
    'The story of how An-Noor began — the first rooms, the first children, the reasons the founders gave — will be written here by the school. Established 2023 is what we can date with confidence.',
  // TODO: replace with the school's confirmed mission statement.
  missionTitle: 'Mission',
  missionNote: 'The school’s own mission statement will be placed here once it is confirmed.',
  // TODO: replace with the school's confirmed vision statement.
  visionTitle: 'Vision',
  visionNote: 'The school’s own vision statement will be placed here once it is confirmed.',
  leadershipTitle: 'Leadership',
  leadershipText: 'Two names the school has asked us to carry. Biographies will lengthen when they are written by the people themselves.',
  // TODO: add Md. Kamruzzaman's short biography when the school provides it.
  partnerNote: 'A short biography will be added when the school provides it.',
};

export type JourneyMilestone = {
  no: string;
  year: string;
  title: string;
  text: string;
  /** True until the school replaces this card with its own account. */
  placeholder: boolean;
};

/**
 * Our Journey cards. A quiet vertical list. Copy below is not a finished history.
 *
 * TODO: owner — replace every card marked placeholder with the real year and story.
 * Keep `no` as 01, 02, 03… so the stack stays numbered. Add or remove cards freely.
 */
export const journey = {
  kicker: 'Our Journey',
  kickerBn: 'আমাদের পথচলা',
  title: 'Our Journey',
  lede: 'A place for the school’s own milestones. Cards marked “to be written” are waiting for dates and stories from the people who were there.',
  milestones: [
    {
      no: '01',
      year: '2023',
      title: 'The school is established',
      text: 'An-Noor International School opens in Chattogram, with the crest’s promise: committed to building a moral foundation.',
      placeholder: false,
    },
    {
      no: '02',
      year: '—',
      title: 'The first classrooms',
      // TODO: owner — year, and what the first term actually looked like.
      text: 'To be written by the school: the first rooms, the first children, and the first teachers.',
      placeholder: true,
    },
    {
      no: '03',
      year: '—',
      title: 'Hifz finds its place',
      // TODO: owner — when the Hifz department began, and how it sits beside the classes.
      text: 'To be written by the school: when memorisation joined the school day.',
      placeholder: true,
    },
    {
      no: '04',
      year: '—',
      title: 'A day the school remembers',
      // TODO: owner — a real gathering (sports day, Pitha Utshob, or another) with its date.
      text: 'To be written by the school: one celebration or first, with the date it happened.',
      placeholder: true,
    },
    {
      no: '05',
      year: '2027',
      title: 'Admission is open',
      text: 'Families can inquire now for Play through Class 7. The next chapter is the one they will write with the school.',
      placeholder: false,
    },
  ] as JourneyMilestone[],
};

export const academics = {
  kicker: 'Academics',
  title: 'Play to Class 7, in English and Arabic',
  titleBn: 'প্লে থেকে সপ্তম শ্রেণি',
  lede: 'Play, Nursery, KG, and Class 1 to 7. Six named sections in the early years. Islamic studies, Hifz, Arabic, and English running with the national curriculum.',
  bannerTitle: 'As the school writes it on the building',
  classesTitle: 'Classes and sections',
  classesText: 'Play, Nursery, and KG each have two sections. Class 1 to Class 7 are listed as single classes.',
  // TODO: add the weekly subject grid and any Hifz timetable the school wants families to see.
  syllabusNote: 'A weekly subject grid, and the shape of the Hifz timetable, will be published when the school provides them.',
};

export const admission = {
  kicker: 'Admission',
  title: 'Admission Open 2027',
  titleBn: 'ভর্তি চলছে',
  lede: 'Inquire for a place from Play through Class 7. The office confirms the next step — a visit, a form, the papers they actually need.',
  // TODO: replace these steps with the office's exact admission procedure.
  stepsTitle: 'How to begin',
  stepsNote: 'An outline so families know where to start. The office’s exact procedure replaces this when they confirm it.',
  steps: [
    { title: 'Inquire', text: 'Send the form on this page, or come to the campus. Tell us the class you have in mind.' },
    { title: 'Visit', text: 'See the building and meet the office. Bring the child if you can.' },
    { title: 'Form', text: 'Collect the admission form from the office and complete it with the guardian’s details.' },
    { title: 'Papers', text: 'Bring the documents the office asks for. The list below is a draft, not a final demand.' },
    { title: 'Confirmation', text: 'The school confirms whether a place is offered, and what happens next.' },
  ],
  // TODO: replace with the office's official document checklist.
  documentsTitle: 'Documents to prepare',
  documentsNote:
    'A draft so families can start gathering papers. The office will confirm the final list. Do not treat a missing paper here as a reason you cannot inquire.',
  documents: [
    'Child’s birth certificate',
    'Recent passport-size photographs of the child',
    'Guardian’s national identity card',
    'Previous school’s report or transfer paper, if the child has already been to school',
  ],
  feesTitle: 'Fees',
  feesHidden:
    'The fee schedule will be published on this page after the school confirms the figures. Until then, ask the office — the inquiry form reaches them directly.',
  feesVisibleNote: 'Figures published at the school’s confirmation. Ask the office before you pay anyone.',
  formTitle: 'Send an inquiry',
  formText: 'Nothing is saved on this website. Submitting opens WhatsApp if a school number is set, otherwise your email app, with the message already written.',
};

export type FeeRow = {
  item: string;
  amount: number;
  applies: string;
};

export const fees: FeeRow[] = [
  { item: 'Admission form', amount: 300, applies: 'Once, when the form is collected' },
  { item: 'Admission fee', amount: 10_000, applies: 'All classes' },
  { item: 'Monthly tuition', amount: 4_500, applies: 'Play to Class 5' },
  { item: 'Monthly tuition', amount: 5_000, applies: 'Class 6' },
  { item: 'Digital fee', amount: 1_000, applies: 'As charged by the office' },
  { item: 'Extra-curricular', amount: 1_000, applies: 'As charged by the office' },
  { item: 'Photocopy', amount: 1_000, applies: 'As charged by the office' },
];

export type FacilityPhoto = {
  src: string;
  /** Smaller candidate for the card. The full file stays available. */
  srcSet?: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position so faces stay in the frame. */
  objectPosition?: string;
};

export type FacilitySpot = {
  id: string;
  title: string;
  text: string;
  photo?: FacilityPhoto;
};

const facilitySrc = (file: string, small = 800) => ({
  src: `/site/photos/${file}.webp`,
  srcSet: `/site/photos/sm/${file}.webp ${small}w, /site/photos/${file}.webp ${file.startsWith('hero-') ? 1920 : 1200}w`,
});

export const facilities = {
  kicker: 'Facilities',
  title: 'A campus you can already see',
  titleBn: 'ক্যাম্পাস',
  lede: 'Photographs of the classrooms, the early years room, the multipurpose hall, and the seminar hall. Hifz, the play area, CCTV, and the library are named here; a picture is shown only where we have one.',
  spots: [
    {
      id: 'building',
      title: 'The building',
      text: 'A cream-coloured school building in Rahamotgonj, Chattogram, with the name and the curriculum line across the front.',
      photo: {
        src: photos.building.src,
        alt: photos.building.alt,
        width: photos.building.width,
        height: photos.building.height,
        objectPosition: 'center center',
      },
    },
    {
      id: 'classrooms',
      title: 'Classrooms',
      text: 'Classrooms with desks for lessons.',
      photo: {
        ...facilitySrc('facilities-classroom-yellow-desks'),
        alt: 'Children writing at yellow desks in a classroom, with a teacher standing beside them.',
        width: 1200,
        height: 800,
        objectPosition: 'center 22%',
      },
    },
    {
      id: 'early-years',
      title: 'Early years',
      text: 'The early years room.',
      photo: {
        ...facilitySrc('facilities-colorful-classroom'),
        alt: 'Young children in green and white uniforms sit on yellow and red chairs with their hands raised, in a classroom with drawings on the walls.',
        width: 1200,
        height: 800,
        objectPosition: 'center 32%',
      },
    },
    {
      id: 'hall',
      title: 'Multipurpose hall',
      text: 'The multipurpose hall.',
      photo: {
        ...facilitySrc('facilities-multipurpose-hall'),
        alt: 'A large room with people seated on a blue carpet and a person standing at the front.',
        width: 1200,
        height: 800,
        objectPosition: 'center 42%',
      },
    },
    {
      id: 'seminar',
      title: 'Seminar hall',
      text: 'Used for seminars and teacher training.',
      photo: {
        ...facilitySrc('facilities-seminar-hall'),
        alt: 'A man speaking from a podium to women seated at red desks, in a room with a screen and wall displays.',
        width: 1200,
        height: 800,
        objectPosition: 'center 28%',
      },
    },
    {
      id: 'hifz',
      title: 'Hifz program',
      text: 'A Hifz program, alongside the classes.',
      photo: {
        src: '/site/photos/hero-dua-quran-session.webp',
        srcSet: '/site/photos/sm/hero-dua-quran-session.webp 960w, /site/photos/hero-dua-quran-session.webp 1920w',
        alt: 'A man in a grey tunic and white cap kneels on a blue carpet with his hands raised, while girls in white sit along the wall.',
        width: 1920,
        height: 1080,
        objectPosition: 'center center',
      },
    },
  ] as FacilitySpot[],
  namedTitle: 'Also on campus',
  namedText: 'Named here without a photograph.',
  named: [
    { id: 'play', title: 'Safe Play Zone', text: 'A play area at the school.' },
    { id: 'cctv', title: 'CCTV', text: 'CCTV on campus.' },
    { id: 'library', title: 'Library', text: 'A school library.' },
  ] as FacilitySpot[],
};

export const teachersPage = {
  kicker: 'Teachers',
  title: 'The people children will know',
  titleBn: 'শিক্ষকমণ্ডলী',
  lede: 'The Principal is named. The wider faculty directory is not ready to publish — the photographs below are real gatherings, without invented names.',
  // TODO: publish the faculty directory (name, role, class or subject, photograph) when the school provides it.
  directoryTitle: 'Faculty directory',
  directoryNote:
    'Names, subjects, and class teachers will be listed here when the school provides the directory. Until then, no name on this page is guessed.',
  galleryTitle: 'Together',
};

export type Notice = {
  id: string;
  title: string;
  date: string;
  body: string;
  href?: string;
};

export const noticesPage = {
  kicker: 'Notices & events',
  title: 'What families need to know',
  titleBn: 'নোটিশ ও ইভেন্ট',
  lede: 'Admission Open 2027 is the notice we can publish today. Further notices, events, and calendar dates wait on the school.',
  notices: [
    {
      id: 'admission-2026',
      title: 'Admission Open 2027',
      date: 'Current',
      body: 'Families may inquire for Play through Class 7. Use the inquiry form, or write to the school email. The office confirms documents and, once approved for the website, fees.',
      href: '/admission',
    },
  ] as Notice[],
  // TODO: add real notices (exams, holidays, parent meetings) supplied by the school. Do not invent dates.
  eventsTitle: 'Events',
  eventsNote: 'Dated events will appear here when the school publishes them. Nothing is listed until then.',
  // TODO: replace this shell with the school's academic calendar — terms, exams, holidays.
  calendarTitle: 'Academic calendar',
  calendarNote: 'Coming soon. Term dates, exams, and holidays will be published here when the school provides them.',
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

export type GalleryEvent =
  | 'tree'
  | 'vegetables'
  | 'science'
  | 'sports'
  | 'parents'
  | 'training'
  | 'classroom'
  | 'school';

export type GalleryPhoto = {
  id: string;
  src: string;
  srcSet?: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  event: GalleryEvent;
};

const galleryFile = (
  id: string,
  file: string,
  width: number,
  height: number,
  event: GalleryEvent,
  alt: string,
  caption: string,
  small = 640,
): GalleryPhoto => ({
  id,
  src: `/site/photos/${file}.webp`,
  srcSet: `/site/photos/sm/${file}.webp ${small}w, /site/photos/${file}.webp ${width}w`,
  alt,
  caption,
  width,
  height,
  event,
});

export const galleryPage = {
  kicker: 'Gallery',
  title: 'The school, in its own pictures',
  titleBn: 'ছবি',
  lede: 'Photographs from the school: tree planting, the vegetables display, science fair and prize giving, sports, a parent-teacher meeting, teacher training, and classroom life.',
  filters: [
    { id: 'all', label: 'All' },
    { id: 'tree', label: 'Tree Planting' },
    { id: 'vegetables', label: 'Vegetables Display 2024' },
    { id: 'science', label: 'Science Fair & Prize Giving' },
    { id: 'sports', label: 'Sports' },
    { id: 'parents', label: 'Parent-Teacher Meeting' },
    { id: 'training', label: 'Teacher Training' },
    { id: 'classroom', label: 'Classroom life' },
    { id: 'school', label: 'School life' },
  ] as { id: 'all' | GalleryEvent; label: string }[],
};

export const galleryPhotos: GalleryPhoto[] = [
  galleryFile('tree-01', 'gallery-tree-planting-01', 1200, 900, 'tree', 'Children and a teacher around a tray of small plants, one child holding a watering can.', 'Tree planting'),
  galleryFile('tree-02', 'gallery-tree-planting-02', 1200, 900, 'tree', 'Children leaning over a planter of soil and seedlings.', 'Tree planting'),
  galleryFile('tree-03', 'gallery-tree-planting-03', 1200, 900, 'tree', 'Girls in white uniforms and a teacher standing beside a small decorated tree.', 'Tree planting'),
  galleryFile('tree-04', 'gallery-tree-planting-04', 1200, 900, 'tree', 'Children and teachers posing with paper leaves and potted plants.', 'Tree planting'),
  galleryFile('tree-05', 'gallery-tree-planting-05', 1200, 900, 'tree', 'Boys in white shirts and a teacher behind trays of seedlings.', 'Tree planting'),
  galleryFile('tree-06', 'gallery-tree-planting-06', 1200, 900, 'tree', 'A teacher and three boys beside an easel of potted plants and a school sign.', 'Tree planting'),
  galleryFile('tree-07', 'gallery-tree-planting-07', 1200, 900, 'tree', 'Children holding seedlings, seated with a teacher.', 'Tree planting'),
  galleryFile('tree-08', 'gallery-tree-planting-08', 1200, 900, 'tree', 'A teacher seated beside two drawings of trees on easels.', 'Tree planting'),
  galleryFile('tree-09', 'gallery-tree-planting-09', 1200, 900, 'tree', 'Children standing in a wide circle in a hall.', 'Tree planting'),
  galleryFile('veg-01', 'gallery-veg-display-01', 1200, 900, 'vegetables', 'Baskets of vegetables with handwritten labels on a table, and writing on the wall behind.', 'Vegetables display'),
  galleryFile('veg-02', 'gallery-veg-display-02', 1200, 900, 'vegetables', 'Cucumber, carrots, cauliflower, tomato, and other vegetables on a tray with paper labels.', 'Vegetables display'),
  galleryFile('veg-03', 'gallery-veg-display-03', 1200, 900, 'vegetables', 'Children wearing paper vegetable hats and holding a sign that reads Vegetables.', 'Vegetables display'),
  galleryFile('veg-04', 'gallery-veg-display-04', 1200, 900, 'vegetables', 'Children in paper vegetable hats standing behind a table of vegetables.', 'Vegetables display'),
  galleryFile('veg-05', 'gallery-veg-display-05', 1200, 900, 'vegetables', 'Boys in white shirts behind trays of labelled vegetables.', 'Vegetables display'),
  galleryFile('veg-06', 'gallery-veg-display-06', 1200, 900, 'vegetables', 'A teacher and children wearing paper vegetable hats, with a Vegetables sign on the wall.', 'Vegetables display'),
  galleryFile('science-01', 'gallery-science-fair-01', 1200, 900, 'science', 'Students and teachers behind tables of science models, holding certificates, under a Science Fair banner.', 'Science fair'),
  galleryFile('science-02', 'gallery-science-fair-02', 1200, 900, 'science', 'Students posed in rows in front of a Science Fair display of models.', 'Science fair'),
  galleryFile('science-03', 'gallery-science-fair-03', 1200, 900, 'science', 'Students and a teacher with solar-system models under a Science Fair banner.', 'Science fair'),
  galleryFile('science-04', 'gallery-science-fair-04', 1200, 1600, 'science', 'Students holding certificates in front of a tall Science Fair frame.', 'Science fair'),
  galleryFile('prize-01', 'gallery-prize-giving-01', 1200, 1600, 'science', 'Students and teachers holding certificates under a Science Fair frame.', 'Prize giving'),
  galleryFile('prize-02', 'gallery-prize-giving-02', 1200, 1600, 'science', 'Three women holding a certificate under a Science Fair frame.', 'Prize giving'),
  galleryFile('prize-03', 'gallery-prize-giving-03', 1200, 1600, 'science', 'Students and a teacher holding certificates under a Science Fair frame.', 'Prize giving'),
  galleryFile('sports-01', 'gallery-sports-01', 1200, 900, 'sports', 'Children in blue football kits and medals, posed in two rows on a green pitch at night.', 'Sports'),
  galleryFile('sports-02', 'gallery-sports-02', 1200, 900, 'sports', 'Children in orange football kits and medals, with a trophy, posed on a green pitch at night.', 'Sports'),
  galleryFile('sports-trophies', 'facilities-sports-trophies', 1200, 800, 'sports', 'Gold trophies and medals on a table, with a fenced green pitch behind them.', 'Trophies and medals', 800),
  {
    id: photos.sports.id,
    src: photos.sports.src,
    alt: photos.sports.alt,
    caption: photos.sports.caption,
    width: photos.sports.width,
    height: photos.sports.height,
    event: 'sports',
  },
  galleryFile('ptm-01', 'gallery-parent-teacher-meeting-01', 1200, 900, 'parents', 'Women standing in a line in a decorated classroom.', 'Parent-teacher meeting'),
  galleryFile('ptm-02', 'gallery-parent-teacher-meeting-02', 1200, 900, 'parents', 'A woman speaking at a podium beside a banner that reads Parent-Teacher Meeting.', 'Parent-teacher meeting'),
  galleryFile('training-01', 'gallery-teacher-training-01', 1200, 900, 'training', 'Women and a man posed in front of a whiteboard in a training room.', 'Teacher training'),
  galleryFile('training-02', 'gallery-teacher-training-02', 1200, 900, 'training', 'A man speaking from a podium to women seated at red desks.', 'Teacher training'),
  galleryFile('class-01', 'gallery-classroom-01', 1200, 900, 'classroom', 'Young children in green and white uniforms sitting on small colourful chairs.', 'Classroom life'),
  galleryFile('class-02', 'gallery-classroom-02', 1200, 900, 'classroom', 'Children writing at yellow desks, with a teacher beside them.', 'Classroom life'),
  galleryFile('class-dua', 'gallery-dua-session-01', 1200, 900, 'classroom', 'Children sitting on a blue carpet with hands raised, adults seated along the wall.', 'Classroom life'),
  {
    id: 'campus',
    src: photos.building.src,
    alt: photos.building.alt,
    caption: 'The campus from the street.',
    width: photos.building.width,
    height: photos.building.height,
    event: 'school',
  },
  {
    id: photos.office.id,
    src: photos.office.src,
    alt: photos.office.alt,
    caption: photos.office.caption,
    width: photos.office.width,
    height: photos.office.height,
    event: 'school',
  },
  {
    id: photos.celebration.id,
    src: photos.celebration.src,
    alt: photos.celebration.alt,
    caption: photos.celebration.caption,
    width: photos.celebration.width,
    height: photos.celebration.height,
    event: 'school',
  },
  {
    id: photos.gathering.id,
    src: photos.gathering.src,
    alt: photos.gathering.alt,
    caption: photos.gathering.caption,
    width: photos.gathering.width,
    height: photos.gathering.height,
    event: 'school',
  },
  {
    id: photos.pitha.id,
    src: photos.pitha.src,
    alt: photos.pitha.alt,
    caption: photos.pitha.caption,
    width: photos.pitha.width,
    height: photos.pitha.height,
    event: 'school',
  },
];

export const campusPhoto: Photo = {
  id: 'campus',
  src: photos.building.src,
  alt: photos.building.alt,
  caption: 'The campus from the street.',
  width: photos.building.width,
  height: photos.building.height,
  category: 'campus',
};

export const contactPage = {
  kicker: 'Contact',
  title: 'Write to the school',
  titleBn: 'যোগাযোগ',
  lede: 'Call the office, write by email, or open the map. The school is near Goni Bakery, Rahamotgonj, Chattogram.',
  hoursTitle: 'Office hours',
  hoursNote: 'The office is open 8:00 am–2:30 pm, Saturday–Thursday.',
  schoolDaysNote: 'School days are Sunday–Thursday.',
  mapTitle: 'Map',
  mapNote: 'The pin opens the campus on Google Maps.',
  phoneLabel: 'Call: coming soon',
  phoneNote: 'The office number will be shown here after the school confirms it.',
};

export type InquiryInput = {
  guardian: string;
  child: string;
  className: string;
  phone: string;
  message: string;
};

export function classChoices(): string[] {
  return classes.flatMap((item) =>
    item.sections.length ? item.sections.map((section) => `${item.name} — ${section}`) : [item.name],
  );
}

export function formatBdt(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`;
}

/** Opens WhatsApp when site.whatsapp is set; otherwise a mailto to the school. */
export function inquiryUrl(input: InquiryInput): { href: string; mode: 'whatsapp' | 'email' } {
  const lines = [
    `Admission inquiry — ${site.name}`,
    `Session: ${site.sessionLabel}`,
    `Guardian: ${input.guardian}`,
    `Child: ${input.child || '—'}`,
    `Class of interest: ${input.className}`,
    `Phone: ${input.phone}`,
    '',
    input.message.trim() || '(No extra message)',
  ];
  const text = lines.join('\n');
  if (site.whatsapp) {
    return {
      href: `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`,
      mode: 'whatsapp',
    };
  }
  const subject = encodeURIComponent(`Admission inquiry — ${input.guardian}`);
  return {
    href: `mailto:${site.email}?subject=${subject}&body=${encodeURIComponent(text)}`,
    mode: 'email',
  };
}

export function phoneDisplay(): string {
  return site.phone.trim() ? site.phone.trim() : contactPage.phoneLabel;
}
