-- seed_passages_dev.sql
-- Optional local/dev seed passages. Safe to run multiple times.

INSERT INTO passages (id, book, chapter, verse, text) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John', 1, 1, 'In the beginning was the Word, and the Word was with God, and the Word was God.'),
  ('11111111-1111-1111-1111-111111111112', 'John', 1, 2, 'The same was in the beginning with God.'),
  ('11111111-1111-1111-1111-111111111113', 'John', 1, 3, 'All things were made by him; and without him was not any thing made that was made.'),
  ('11111111-1111-1111-1111-111111111114', 'John', 1, 4, 'In him was life; and the life was the light of men.'),
  ('11111111-1111-1111-1111-111111111115', 'John', 1, 5, 'And the light shineth in darkness; and the darkness comprehended it not.'),
  ('11111111-1111-1111-1111-111111111116', 'John', 1, 14, 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.'),
  ('11111111-1111-1111-1111-111111111117', 'John', 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'),
  ('11111111-1111-1111-1111-111111111118', 'Psalm', 23, 1, 'The Lord is my shepherd; I shall not want.'),
  ('11111111-1111-1111-1111-111111111119', 'Psalm', 23, 2, 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.'),
  ('11111111-1111-1111-1111-11111111111a', 'Psalm', 23, 3, 'He restoreth my soul: he leadeth me in the paths of righteousness for his name''s sake.'),
  ('11111111-1111-1111-1111-11111111111b', 'Psalm', 23, 4, 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.'),
  ('11111111-1111-1111-1111-11111111111c', 'Matthew', 6, 9, 'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.'),
  ('11111111-1111-1111-1111-11111111111d', 'Matthew', 6, 10, 'Thy kingdom come. Thy will be done in earth, as it is in heaven.'),
  ('11111111-1111-1111-1111-11111111111e', 'Matthew', 6, 11, 'Give us this day our daily bread.'),
  ('11111111-1111-1111-1111-11111111111f', 'Matthew', 6, 12, 'And forgive us our debts, as we forgive our debtors.'),
  ('11111111-1111-1111-1111-111111111120', 'Matthew', 6, 13, 'And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.'),
  ('11111111-1111-1111-1111-111111111121', 'Romans', 8, 1, 'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.'),
  ('11111111-1111-1111-1111-111111111122', '1 Corinthians', 13, 4, 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,'),
  ('11111111-1111-1111-1111-111111111123', '1 Corinthians', 13, 5, 'Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;'),
  ('11111111-1111-1111-1111-111111111124', '1 Corinthians', 13, 6, 'Rejoiceth not in iniquity, but rejoiceth in the truth;'),
  ('11111111-1111-1111-1111-111111111125', '1 Corinthians', 13, 7, 'Beareth all things, believeth all things, hopeth all things, endureth all things.'),
  ('11111111-1111-1111-1111-111111111126', 'Isaiah', 41, 10, 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.'),
  ('11111111-1111-1111-1111-111111111127', 'Jeremiah', 29, 11, 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.'),
  ('11111111-1111-1111-1111-111111111128', 'Philippians', 4, 6, 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.'),
  ('11111111-1111-1111-1111-111111111129', 'Philippians', 4, 7, 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.'),
  ('11111111-1111-1111-1111-11111111112a', 'Psalm', 46, 1, 'God is our refuge and strength, a very present help in trouble.'),
  ('11111111-1111-1111-1111-11111111112b', 'Psalm', 46, 10, 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.')
ON CONFLICT (id) DO NOTHING;
