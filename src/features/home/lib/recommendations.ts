export interface VerseRecommendation {
  ref: string;
  book: string;
  chapter: string;
  verse: number;
  text: string;
  reason: string;
}

// Curated verse collections organized by topic and purpose
const VERSE_COLLECTIONS = {
  // Purpose-based collections
  exploring_jesus: [
    { ref: 'John 1:1', book: 'John', chapter: '1', verse: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.', reason: 'Introduces who Jesus is' },
    { ref: 'John 14:6', book: 'John', chapter: '14', verse: 6, text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.', reason: 'Jesus\' claim about himself' },
    { ref: 'John 3:16', book: 'John', chapter: '3', verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', reason: 'God\'s love through Jesus' },
    { ref: 'Matthew 16:15-16', book: 'Matthew', chapter: '16', verse: 15, text: 'He saith unto them, But whom say ye that I am? And Simon Peter answered and said, Thou art the Christ, the Son of the living God.', reason: 'Peter\'s confession of Jesus' },
    { ref: 'Colossians 1:15', book: 'Colossians', chapter: '1', verse: 15, text: 'Who is the image of the invisible God, the firstborn of every creature.', reason: 'Jesus\' divine nature' },
    { ref: 'Hebrews 1:3', book: 'Hebrews', chapter: '1', verse: 3, text: 'Who being the brightness of his glory, and the express image of his person, and upholding all things by the word of his power.', reason: 'Jesus\' glory and power' },
    { ref: 'Mark 10:45', book: 'Mark', chapter: '10', verse: 45, text: 'For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many.', reason: 'Jesus\' mission' },
    { ref: 'Luke 19:10', book: 'Luke', chapter: '19', verse: 10, text: 'For the Son of man is come to seek and to save that which was lost.', reason: "Jesus came to save" },
    { ref: 'John 10:11', book: 'John', chapter: '10', verse: 11, text: 'I am the good shepherd: the good shepherd giveth his life for the sheep.', reason: "Jesus as shepherd" },
    { ref: 'Matthew 11:28-29', book: 'Matthew', chapter: '11', verse: 28, text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me.', reason: 'Jesus\' invitation to rest' },
  ],

  building_habit: [
    { ref: 'Psalm 119:11', book: 'Psalms', chapter: '119', verse: 11, text: 'Thy word have I hid in mine heart, that I might not sin against thee.', reason: 'The power of memorizing Scripture' },
    { ref: 'Joshua 1:8', book: 'Joshua', chapter: '1', verse: 8, text: 'This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night.', reason: 'Daily meditation brings success' },
    { ref: 'Psalm 1:2', book: 'Psalms', chapter: '1', verse: 2, text: 'But his delight is in the law of the Lord; and in his law doth he meditate day and night.', reason: 'Delight in daily reading' },
    { ref: 'Deuteronomy 6:6-7', book: 'Deuteronomy', chapter: '6', verse: 6, text: 'And these words, which I command thee this day, shall be in thine heart: And thou shalt teach them diligently.', reason: 'Keep God\'s word in your heart' },
    { ref: 'Colossians 3:16', book: 'Colossians', chapter: '3', verse: 16, text: 'Let the word of Christ dwell in you richly in all wisdom.', reason: 'Let Scripture live in you' },
    { ref: 'James 1:22', book: 'James', chapter: '1', verse: 22, text: 'But be ye doers of the word, and not hearers only, deceiving your own selves.', reason: 'Act on what you read' },
    { ref: '2 Timothy 3:16', book: '2 Timothy', chapter: '3', verse: 16, text: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.', reason: 'Why Scripture matters' },
    { ref: 'Hebrews 4:12', book: 'Hebrews', chapter: '4', verse: 12, text: 'For the word of God is quick, and powerful, and sharper than any twoedged sword.', reason: 'The power of God\'s word' },
    { ref: 'Psalm 119:105', book: 'Psalms', chapter: '119', verse: 105, text: 'Thy word is a lamp unto my feet, and a light unto my path.', reason: 'Scripture guides your steps' },
    { ref: '1 Peter 2:2', book: '1 Peter', chapter: '2', verse: 2, text: 'As newborn babes, desire the sincere milk of the word, that ye may grow thereby.', reason: 'Grow through the word' },
  ],

  difficult_times: [
    { ref: 'Psalm 23:4', book: 'Psalms', chapter: '23', verse: 4, text: 'Yea, though I walk through the valley of death, I will fear no evil: for thou art with me.', reason: 'God\'s presence in dark times' },
    { ref: 'Isaiah 41:10', book: 'Isaiah', chapter: '41', verse: 10, text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.', reason: 'God promises strength' },
    { ref: '2 Corinthians 12:9', book: '2 Corinthians', chapter: '12', verse: 9, text: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness.', reason: 'Grace in weakness' },
    { ref: 'Romans 8:28', book: 'Romans', chapter: '8', verse: 28, text: 'And we know that all things work together for good to them that love God.', reason: 'God works in all circumstances' },
    { ref: 'Psalm 34:18', book: 'Psalms', chapter: '34', verse: 18, text: 'The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.', reason: 'God is close to the brokenhearted' },
    { ref: 'Matthew 5:4', book: 'Matthew', chapter: '5', verse: 4, text: 'Blessed are they that mourn: for they shall be comforted.', reason: 'Promise of comfort' },
    { ref: 'Psalm 147:3', book: 'Psalms', chapter: '147', verse: 3, text: 'He healeth the broken in heart, and bindeth up their wounds.', reason: 'God heals hearts' },
    { ref: 'John 16:33', book: 'John', chapter: '16', verse: 33, text: 'In the world ye shall have tribulation: but be of good cheer; I have overcome the world.', reason: 'Jesus has overcome' },
    { ref: 'Psalm 46:1', book: 'Psalms', chapter: '46', verse: 1, text: 'God is our refuge and strength, a very present help in trouble.', reason: 'God is always present' },
    { ref: 'Isaiah 43:2', book: 'Isaiah', chapter: '43', verse: 2, text: 'When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee.', reason: 'God walks through trials with you' },
  ],

  deeper_faith: [
    { ref: 'Proverbs 3:5-6', book: 'Proverbs', chapter: '3', verse: 5, text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.', reason: 'Deep trust in God' },
    { ref: 'Hebrews 11:1', book: 'Hebrews', chapter: '11', verse: 1, text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', reason: 'Definition of faith' },
    { ref: 'Romans 12:2', book: 'Romans', chapter: '12', verse: 2, text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind.', reason: 'Transformation through renewal' },
    { ref: 'James 1:2-4', book: 'James', chapter: '1', verse: 2, text: 'My brethren, count it all joy when ye fall into divers temptations; Knowing this, that the trying of your faith worketh patience.', reason: 'Trials strengthen faith' },
    { ref: 'Ephesians 3:17-19', book: 'Ephesians', chapter: '3', verse: 17, text: 'That Christ may dwell in your hearts by faith; that ye, being rooted and grounded in love, May be able to comprehend...', reason: 'Rooted in love' },
    { ref: 'Colossians 2:6-7', book: 'Colossians', chapter: '2', verse: 6, text: 'As ye have therefore received Christ Jesus the Lord, so walk ye in him: Rooted and built up in him.', reason: 'Growing in Christ' },
    { ref: '2 Peter 1:5-7', book: '2 Peter', chapter: '1', verse: 5, text: 'And beside this, giving all diligence, add to your faith virtue; and to virtue knowledge.', reason: 'Growing in spiritual qualities' },
    { ref: 'Philippians 3:10', book: 'Philippians', chapter: '3', verse: 10, text: 'That I may know him, and the power of his resurrection, and the fellowship of his sufferings.', reason: 'Knowing Christ deeply' },
    { ref: 'John 15:4-5', book: 'John', chapter: '15', verse: 4, text: 'Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine.', reason: 'Abiding in Christ' },
    { ref: 'Matthew 7:24-25', book: 'Matthew', chapter: '7', verse: 24, text: 'Therefore whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man, which built his house upon a rock.', reason: 'Building on a solid foundation' },
  ],

  serious_study: [
    { ref: '2 Timothy 2:15', book: '2 Timothy', chapter: '2', verse: 15, text: 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.', reason: 'The call to study Scripture' },
    { ref: 'Acts 17:11', book: 'Acts', chapter: '17', verse: 11, text: 'These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily.', reason: 'Daily searching of Scripture' },
    { ref: 'Psalm 119:18', book: 'Psalms', chapter: '119', verse: 18, text: 'Open thou mine eyes, that I may behold wondrous things out of thy law.', reason: 'Prayer for understanding' },
    { ref: 'Proverbs 2:3-5', book: 'Proverbs', chapter: '2', verse: 3, text: 'Yea, if thou criest after knowledge, and liftest up thy voice for understanding; Then shalt thou understand the fear of the Lord.', reason: 'Seeking wisdom diligently' },
    { ref: 'Ezra 7:10', book: 'Ezra', chapter: '7', verse: 10, text: 'For Ezra had prepared his heart to seek the law of the Lord, and to do it, and to teach in Israel statutes and judgments.', reason: 'Ezra\'s example of study' },
    { ref: '1 Corinthians 2:13', book: '1 Corinthians', chapter: '2', verse: 13, text: 'Which things also we speak, not in the words which man\'s wisdom teacheth, but which the Holy Ghost teacheth.', reason: 'Spirit-led understanding' },
    { ref: 'Luke 24:27', book: 'Luke', chapter: '24', verse: 27, text: 'And beginning at Moses and all the prophets, he expounded unto them in all the scriptures the things concerning himself.', reason: 'Jesus teaching Scripture' },
    { ref: 'John 5:39', book: 'John', chapter: '5', verse: 39, text: 'Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me.', reason: 'Searching for Jesus in Scripture' },
  ],

  // Interest-based collections
  prayer: [
    { ref: 'Matthew 6:9-13', book: 'Matthew', chapter: '6', verse: 9, text: 'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.', reason: 'The Lord\'s Prayer model' },
    { ref: 'Philippians 4:6', book: 'Philippians', chapter: '4', verse: 6, text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.', reason: 'Pray with thanksgiving' },
    { ref: '1 Thessalonians 5:17', book: '1 Thessalonians', chapter: '5', verse: 17, text: 'Pray without ceasing.', reason: 'Continuous prayer life' },
    { ref: 'James 5:16', book: 'James', chapter: '5', verse: 16, text: 'The effectual fervent prayer of a righteous man availeth much.', reason: 'Power of prayer' },
    { ref: 'Luke 11:9', book: 'Luke', chapter: '11', verse: 9, text: 'And I say unto you, Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.', reason: 'Persistence in prayer' },
    { ref: '1 John 5:14', book: '1 John', chapter: '5', verse: 14, text: 'And this is the confidence that we have in him, that, if we ask any thing according to his will, he heareth us.', reason: 'Confidence in prayer' },
    { ref: 'Matthew 21:22', book: 'Matthew', chapter: '21', verse: 22, text: 'And all things, whatsoever ye shall ask in prayer, believing, ye shall receive.', reason: 'Prayer with faith' },
    { ref: 'Psalm 145:18', book: 'Psalms', chapter: '145', verse: 18, text: 'The Lord is nigh unto all them that call upon him, to all that call upon him in truth.', reason: 'God is near when we pray' },
  ],

  peace_comfort: [
    { ref: 'Philippians 4:7', book: 'Philippians', chapter: '4', verse: 7, text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.', reason: 'God\'s supernatural peace' },
    { ref: 'John 14:27', book: 'John', chapter: '14', verse: 27, text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.', reason: 'Jesus gives lasting peace' },
    { ref: 'Isaiah 26:3', book: 'Isaiah', chapter: '26', verse: 3, text: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee.', reason: 'Peace through focus on God' },
    { ref: 'Psalm 29:11', book: 'Psalms', chapter: '29', verse: 11, text: 'The Lord will give strength unto his people; the Lord will bless his people with peace.', reason: 'God blesses with peace' },
    { ref: 'Romans 15:13', book: 'Romans', chapter: '15', verse: 13, text: 'Now the God of hope fill you with all joy and peace in believing.', reason: 'Joy and peace through belief' },
    { ref: '2 Thessalonians 3:16', book: '2 Thessalonians', chapter: '3', verse: 16, text: 'Now the Lord of peace himself give you peace always by all means.', reason: 'Peace in all circumstances' },
    { ref: 'Psalm 119:165', book: 'Psalms', chapter: '119', verse: 165, text: 'Great peace have they which love thy law: and nothing shall offend them.', reason: 'Peace through loving God\'s word' },
    { ref: 'Colossians 3:15', book: 'Colossians', chapter: '3', verse: 15, text: 'And let the peace of God rule in your hearts, to the which also ye are called in one body.', reason: 'Let peace rule your heart' },
  ],

  purpose: [
    { ref: 'Jeremiah 29:11', book: 'Jeremiah', chapter: '29', verse: 11, text: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.', reason: 'God has plans for you' },
    { ref: 'Ephesians 2:10', book: 'Ephesians', chapter: '2', verse: 10, text: 'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.', reason: 'Created with purpose' },
    { ref: 'Proverbs 19:21', book: 'Proverbs', chapter: '19', verse: 21, text: 'There are many devices in a man\'s heart; nevertheless the counsel of the Lord, that shall stand.', reason: 'God\'s plan prevails' },
    { ref: 'Romans 8:29', book: 'Romans', chapter: '8', verse: 29, text: 'For whom he did foreknow, he also did predestinate to be conformed to the image of his Son.', reason: 'Called to be like Christ' },
    { ref: '1 Peter 2:9', book: '1 Peter', chapter: '2', verse: 9, text: 'But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people.', reason: 'Your identity in Christ' },
    { ref: 'Colossians 1:16', book: 'Colossians', chapter: '1', verse: 16, text: 'For by him were all things created, that are in heaven, and that are in earth, visible and invisible...all things were created by him, and for him.', reason: 'Created for Christ' },
    { ref: 'Psalm 139:16', book: 'Psalms', chapter: '139', verse: 16, text: 'Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written.', reason: 'God planned your days' },
    { ref: '2 Timothy 1:9', book: '2 Timothy', chapter: '1', verse: 9, text: 'Who hath saved us, and called us with an holy calling, not according to our works, but according to his own purpose and grace.', reason: 'Called with holy purpose' },
  ],

  love_family: [
    { ref: '1 Corinthians 13:4-7', book: '1 Corinthians', chapter: '13', verse: 4, text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.', reason: 'Definition of true love' },
    { ref: '1 John 4:8', book: '1 John', chapter: '4', verse: 8, text: 'He that loveth not knoweth not God; for God is love.', reason: 'God\'s nature is love' },
    { ref: 'John 13:34', book: 'John', chapter: '13', verse: 34, text: 'A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another.', reason: 'Command to love' },
    { ref: 'Ephesians 4:2', book: 'Ephesians', chapter: '4', verse: 2, text: 'With all lowliness and meekness, with longsuffering, forbearing one another in love.', reason: 'Patient, humble love' },
    { ref: '1 John 4:19', book: '1 John', chapter: '4', verse: 19, text: 'We love him, because he first loved us.', reason: 'Love flows from God' },
    { ref: 'Proverbs 17:17', book: 'Proverbs', chapter: '17', verse: 17, text: 'A friend loveth at all times, and a brother is born for adversity.', reason: 'Faithful friendship' },
    { ref: 'Colossians 3:14', book: 'Colossians', chapter: '3', verse: 14, text: 'And above all these things put on charity, which is the bond of perfectness.', reason: 'Love binds everything' },
    { ref: 'Romans 12:10', book: 'Romans', chapter: '12', verse: 10, text: 'Be kindly affectioned one to another with brotherly love; in honour preferring one another.', reason: 'Honor others in love' },
  ],

  overcoming_fear: [
    { ref: '2 Timothy 1:7', book: '2 Timothy', chapter: '1', verse: 7, text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', reason: 'God gives power, not fear' },
    { ref: 'Joshua 1:9', book: 'Joshua', chapter: '1', verse: 9, text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed.', reason: 'God commands courage' },
    { ref: 'Psalm 27:1', book: 'Psalms', chapter: '27', verse: 1, text: 'The Lord is my light and my salvation; whom shall I fear? The Lord is the strength of my life; of whom shall I be afraid?', reason: 'No reason to fear with God' },
    { ref: 'Isaiah 43:1', book: 'Isaiah', chapter: '43', verse: 1, text: 'Fear not: for I have redeemed thee, I have called thee by thy name; thou art mine.', reason: 'You belong to God' },
    { ref: '1 John 4:18', book: '1 John', chapter: '4', verse: 18, text: 'There is no fear in love; but perfect love casteth out fear.', reason: 'Love conquers fear' },
    { ref: 'Psalm 56:3', book: 'Psalms', chapter: '56', verse: 3, text: 'What time I am afraid, I will trust in thee.', reason: 'Trust when afraid' },
    { ref: 'Deuteronomy 31:6', book: 'Deuteronomy', chapter: '31', verse: 6, text: 'Be strong and of a good courage, fear not, nor be afraid of them: for the Lord thy God, he it is that doth go with thee.', reason: 'God goes with you' },
    { ref: 'Proverbs 29:25', book: 'Proverbs', chapter: '29', verse: 25, text: 'The fear of man bringeth a snare: but whoso putteth his trust in the Lord shall be safe.', reason: 'Trust brings safety' },
  ],
};

/**
 * Get personalized verse recommendations based on onboarding answers
 */
export function getPersonalizedRecommendations(context: {
  purpose: string;
  experience: string;
  interests: string[];
  currentPlan?: string;
}): VerseRecommendation[] {
  const { purpose, interests } = context;

  // Map purpose to collection key
  const purposeMap: Record<string, keyof typeof VERSE_COLLECTIONS> = {
    'I\'m exploring who Jesus is': 'exploring_jesus',
    'I want to build a daily reading habit': 'building_habit',
    'I\'m going through something difficult': 'difficult_times',
    'I want to go deeper in my faith': 'deeper_faith',
    'I\'m studying the Bible seriously': 'serious_study',
  };

  // Map interests to collection keys
  const interestMap: Record<string, keyof typeof VERSE_COLLECTIONS> = {
    'Who is Jesus?': 'exploring_jesus',
    'Prayer': 'prayer',
    'Peace & Comfort': 'peace_comfort',
    'God\'s Purpose': 'purpose',
    'Love & Family': 'love_family',
    'Overcoming Fear': 'overcoming_fear',
  };

  const recommendations: VerseRecommendation[] = [];

  // Get 2 verses from primary interest
  const primaryInterest = interests[0];
  const interestKey = interestMap[primaryInterest];
  if (interestKey && VERSE_COLLECTIONS[interestKey]) {
    const verses = VERSE_COLLECTIONS[interestKey];
    // Pick first 2 verses from the collection
    recommendations.push(...verses.slice(0, 2));
  }

  // Get 1 verse from purpose
  const purposeKey = purposeMap[purpose];
  if (purposeKey && VERSE_COLLECTIONS[purposeKey]) {
    const verses = VERSE_COLLECTIONS[purposeKey];
    // Pick a verse that's not already in recommendations
    const newVerse = verses.find(v => !recommendations.some(r => r.ref === v.ref));
    if (newVerse) {
      recommendations.push(newVerse);
    }
  }

  // If we still don't have 3, add from secondary interest
  if (recommendations.length < 3 && interests.length > 1) {
    const secondaryInterest = interests[1];
    const secondaryKey = interestMap[secondaryInterest];
    if (secondaryKey && VERSE_COLLECTIONS[secondaryKey]) {
      const verses = VERSE_COLLECTIONS[secondaryKey];
      const newVerse = verses.find(v => !recommendations.some(r => r.ref === v.ref));
      if (newVerse) {
        recommendations.push(newVerse);
      }
    }
  }

  // Return up to 3 recommendations
  return recommendations.slice(0, 3);
}
