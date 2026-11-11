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
  sessionLabel: 'Admission Open 2026–27',
  sessionShort: '2026–27',
  email: 'annoorinternationalschool@gmail.com',
  /**
   * TODO: confirm the official phone and WhatsApp before publishing a number.
   * Leave both empty to show "Call: coming soon" and to send inquiries by email.
   * The campus photograph shows numbers on the building sign — do not copy them
   * here until the school confirms which line is current.
   */
  phone: '',
  /** Digits only, country code, no plus. Example: "8801XXXXXXXXX". */
  whatsapp: '',
  address: {
    line: 'Near Goni Bakery, Rahamotgonj, Chattogram',
    locality: 'Chattogram',
    country: 'Bangladesh',
    /**
     * TODO: confirm the exact campus address and map pin.
     * "Near Goni Bakery, Rahamotgonj" was supplied as unconfirmed.
     */
    confirmed: false,
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
      'An-Noor International School in Chattogram offers English and Arabic based education, Islamic values, and modern academics from Play to Class 7, with a Hifz department. Admission is open for 2026–27.',
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
      'Play, Nursery, KG, and Class 1 to 6. Islamic studies, Hifz, Arabic, and English on a national curriculum (English version).',
  },
  admission: {
    path: '/admission',
    title: 'Admission 2026–27 · An-Noor International School',
    description:
      'Admission is open for session 2026–27 at An-Noor International School, Chattogram. Inquire for Play through Class 7.',
  },
  facilities: {
    path: '/facilities',
    title: 'Facilities · An-Noor International School',
    description:
      'The An-Noor campus in Rahamotgonj, Chattogram — the school building, classrooms, and outdoor ground.',
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
      'School notices, events, and the academic calendar for An-Noor International School. Admission is open for 2026–27.',
  },
  gallery: {
    path: '/gallery',
    title: 'Gallery · An-Noor International School',
    description:
      'Photographs of An-Noor International School — the campus, colleagues, sports day, and school celebrations.',
  },
  contact: {
    path: '/contact',
    title: 'Contact · An-Noor International School',
    description:
      'Write to An-Noor International School in Chattogram. Email annoorinternationalschool@gmail.com.',
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
 * Never invent a story, a name or a result. A child's photograph or name needs parental consent first.
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
 * TODO: parental consent is required before publishing any new photograph of a child.
 * The pictures already on this site stay; do not add further images of children until the school confirms consent.
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
  admissionKicker: 'Session 2026–27',
  admissionTitle: 'Admission is open',
  admissionText:
    'Families may inquire now for Play through Class 7. The form below opens an email to the school — or WhatsApp, once a number is confirmed. It is not stored on this website.',
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
      year: '2026–27',
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
  lede: 'Nine classes. Six named sections in the early years. Islamic studies, Hifz, Arabic, and English running with the national curriculum.',
  bannerTitle: 'As the school writes it on the building',
  classesTitle: 'Classes and sections',
  classesText: 'Play, Nursery, and KG each have two sections. Class 1 to Class 7 are listed as single classes.',
  // TODO: add the weekly subject grid and any Hifz timetable the school wants families to see.
  syllabusNote: 'A weekly subject grid, and the shape of the Hifz timetable, will be published when the school provides them.',
};

export const admission = {
  kicker: 'Admission',
  title: 'Session 2026–27 is open',
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
    'The fee schedule will be published on this page after the school confirms the figures for session 2026–27. Until then, ask the office — the inquiry form reaches them directly.',
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

export const facilities = {
  kicker: 'Facilities',
  title: 'A campus you can already see',
  titleBn: 'ক্যাম্পাস',
  lede: 'The building, a school room dressed for a celebration, and the outdoor ground. Spaces we have not photographed yet are marked, not invented.',
  real: [
    {
      title: 'The building',
      text: 'A cream-coloured school building in Rahamotgonj, Chattogram, with the name and the curriculum line across the front.',
      photo: photos.building,
    },
    {
      title: 'School rooms',
      text: 'Rooms that hold both lessons and the school’s own celebrations — here, Pitha Utshob.',
      photo: { src: photos.pitha.src, alt: photos.pitha.alt, width: photos.pitha.width, height: photos.pitha.height },
    },
    {
      title: 'The ground',
      text: 'An outdoor ground used for gatherings such as the annual sports day.',
      photo: { src: photos.sports.src, alt: photos.sports.alt, width: photos.sports.width, height: photos.sports.height },
    },
    {
      title: 'The office',
      text: 'Where families will meet the office — shown here with the Principal and colleagues.',
      photo: { src: photos.office.src, alt: photos.office.alt, width: photos.office.width, height: photos.office.height },
    },
  ],
  awaitingTitle: 'Still to photograph',
  awaitingText: 'These belong in the school’s life. We will not pretend a stock photo is the room.',
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
  lede: 'Admission for 2026–27 is the notice we can publish today. Further notices, events, and calendar dates wait on the school.',
  notices: [
    {
      id: 'admission-2026',
      title: 'Admission open for session 2026–27',
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
  calendarNote: 'Term dates, exams, and holidays for session 2026–27 will be published here by the school. The months below are only a frame.',
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

export const galleryPage = {
  kicker: 'Gallery',
  title: 'The school, in its own pictures',
  titleBn: 'ছবি',
  lede: 'Every photograph on this page was taken at An-Noor. Where a picture does not exist yet, you will see a pattern — and the name of the photograph we still need.',
  filters: [
    { id: 'all', label: 'All' },
    { id: 'campus', label: 'Campus' },
    { id: 'people', label: 'People' },
    { id: 'celebration', label: 'Celebrations' },
    { id: 'needed', label: 'Needed' },
  ],
};

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
  lede: 'Email reaches the office today. The phone line and the map pin will be added when the school confirms them.',
  // TODO: confirm office hours and publish them. Do not guess a timetable.
  hoursTitle: 'Office hours',
  hoursNote: 'Office hours will be listed here once the school confirms them.',
  mapTitle: 'Map',
  mapNote: 'An embedded map will appear here when the campus pin is confirmed. Until then, please do not navigate from a guess.',
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
