# Verse - Bible Study App

## **Project Overview**
**Verse** is a next-generation Bible study app built as a React web application. It's designed to provide an immersive, personalized Bible reading and study experience with journaling, note-taking, and highlighting capabilities.

---

## **Tech Stack**

### Frontend
- **React 19** with TypeScript
- **React Router** for navigation
- **Vite** as build tool
- **Tailwind CSS v4** for styling
- **Lucide React** for icons
- **Motion** (Framer Motion) for animations
- **date-fns** for date handling

### Backend & Services
- **Supabase** for:
  - Authentication (user management)
  - PostgreSQL database
  - Row-Level Security (RLS) policies
- **Google Gemini AI** for AI-powered features
- **Better-SQLite3** for local data

---

## **Architecture & Code Structure**

```
src/
├── App.tsx              # Main app with routing & auth guards
├── main.tsx             # Entry point
├── index.css            # Global styles & theme
├── components/
│   ├── BottomNav.tsx        # Mobile navigation bar
│   └── JournalSheet.tsx     # Journal entry interface
├── hooks/
│   └── useLockBodyScroll.ts # Prevent scroll on mobile modals
├── lib/
│   ├── AuthContext.tsx          # Authentication state management
│   ├── TranslationContext.tsx   # Translation state management
│   ├── ThemeContext.tsx         # Font style (serif/sans) management
│   ├── translations.ts          # Translation definitions & metadata
│   ├── bibleApi.ts              # Bible API abstraction layer
│   ├── supabase.ts              # Supabase client configuration
│   └── data.ts                  # Data utilities
└── pages/
    ├── Login.tsx            # Login screen
    ├── Signup.tsx           # Registration screen
    ├── Onboarding.tsx       # User onboarding flow
    ├── OnboardingResult.tsx # Onboarding completion
    ├── Home.tsx             # Dashboard/Home screen
    ├── Bible.tsx            # Bible reading interface
    ├── Journal.tsx          # Journal entries
    └── Notes.tsx            # Notes management
```

---

## **Key Features**

### 1. **Authentication & User Management**
- Email-based signup/login via Supabase Auth
- Protected routes with automatic redirection
- User profile with full name and onboarding status
- Profile management with avatar initials

### 2. **Onboarding**
- First-time user experience
- Personalized reading plan setup
- Collects user preferences stored in `onboarding_answers` (JSONB)

### 3. **Home Dashboard** (`Home.tsx`)
- Personalized greeting (Good morning/afternoon/evening)
- **Streak tracking** - Counts consecutive days of Bible study activity
- **Today's Reading Card** - Shows current reading plan and progress
- Recent notes preview with quick navigation
- Progress bar showing plan completion

### 4. **Bible Reading** (`Bible.tsx`)
- Full Bible navigation (66 books)
- Chapter-by-chapter reading
- **Multiple Bible Translations**:
  - WEB (World English Bible) - Modern English
  - KJV (King James Version) - Traditional English
  - YLT (Young's Literal Translation) - Word-for-word literal
  - Almeida (Portuguese) - João Ferreira de Almeida
  - Translation selector in header
  - Preference saved to localStorage and Supabase
  - Translation-specific highlights and notes
- **Text highlighting** with multiple colors:
  - Yellow, Blue, Green, Pink, Red
  - Mobile-optimized text selection with long-press
  - Persistent highlights saved to database
  - Translation-aware (highlights tied to specific translations)
- **Note-taking** on verses
- **Voice notes** (microphone integration)
- **Journaling frameworks**:
  - HEAR (Highlight, Explain, Apply, Respond)
  - SOAP (Scripture, Observation, Application, Prayer)
  - Free-form
- Bookmarking verses
- Adjustable text size
- Chapter navigation (prev/next)
- Book/chapter selector with search

### 5. **Notes System**
- Categorized by type: note, highlight, journal, voice, bookmark
- Tagged notes with custom tags
- Linked to specific Bible passages (book, chapter, verse)
- Full CRUD operations
- Search and filter functionality

### 6. **Journal Entries**
- Structured journaling with frameworks (HEAR, SOAP, free)
- Four fields per entry (framework-dependent)
- Linked to specific Bible passages
- Timestamp tracking

---

## **Database Schema** (Supabase PostgreSQL)

### Tables:
1. **`profiles`** - User profile data
   - Links to Supabase auth.users
   - Onboarding completion status
   - Current reading plan and day tracking
   - `preferred_translation` - User's default Bible translation

2. **`passages`** - Bible text storage
   - Book, chapter, verse structure
   - Full verse text
   - Translation support (default: KJV)
   - Seeded with sample verses

3. **`highlights`** - Text highlighting
   - Word range (start/end indices)
   - Color coding
   - User-specific
   - `translation` - Bible translation code (web, kjv, ylt, almeida)
   - `show_in_all_translations` - Boolean flag for cross-translation display
   - `book`, `chapter`, `verse` - Passage reference fields

4. **`notes`** - General notes
   - Multiple types (note, highlight, journal, voice, bookmark)
   - Framework support (HEAR, SOAP, free)
   - Tags array
   - Linked to passages
   - `translation` - Bible translation code
   - `show_in_all_translations` - Boolean flag for cross-translation display

5. **`journal_entries`** - Currently stored as notes with type='journal'
   - Journal entries are saved to the `notes` table
   - Contains formatted content from journaling frameworks

### Security:
- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Passages are publicly readable
- Policies enforce user_id matching

### Database Migrations:
**Translation Support Migration** - Required for Bible translations feature:
```sql
-- Add translation columns
ALTER TABLE highlights
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false;

ALTER TABLE notes
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_translation TEXT DEFAULT 'web';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_highlights_translation
ON highlights(user_id, book, chapter, translation);

CREATE INDEX IF NOT EXISTS idx_notes_translation
ON notes(user_id, passage_id, translation);

-- Backfill existing data
UPDATE highlights SET translation = 'web' WHERE translation IS NULL;
UPDATE notes SET translation = 'web' WHERE translation IS NULL;
UPDATE profiles SET preferred_translation = 'web' WHERE preferred_translation IS NULL;
```

---

## **Translation System**

### Architecture:
- **`src/lib/translations.ts`** - Translation definitions and metadata
- **`src/lib/bibleApi.ts`** - API abstraction layer for fetching Bible passages
- **`src/lib/TranslationContext.tsx`** - Global state management with localStorage + Supabase sync

### Supported Translations:
Currently uses **bible-api.com** for all translations (free, no API key required):
- **WEB** (World English Bible) - Modern English, Public Domain
- **KJV** (King James Version) - Traditional English, Public Domain
- **YLT** (Young's Literal Translation) - Literal word-for-word, Public Domain
- **Almeida** - Portuguese Bible, Public Domain

### Future Expansion:
To add copyrighted translations (NIV, ESV, NASB), you'll need:
1. Register for API keys from services like **API.Bible** or **ESV API**
2. Add authentication headers to API requests
3. Update `bibleApi.ts` to route translations to appropriate API sources
4. Handle licensing requirements and copyright notices

### Translation Filtering:
- Highlights and notes are **translation-specific** by default
- `show_in_all_translations` flag allows content to appear across all translations
- User's preferred translation is saved in `profiles.preferred_translation`
- localStorage caches the translation choice for instant loading

---

## **Design System**

### Color Scheme (Minimal/Clean):
- Background: White with subtle grays (#F9F9F9)
- Primary text: Near-black (#111111)
- Accent: "Gold" (actually black/dark gray with subtle variations)
- Error: Red (#FF3B30)
- Warning: Orange (#FF9500)

### Typography:
- **Font**: Inter (Google Fonts)
- Bold, tight letter-spacing for headings
- Clean, readable body text at 16px base

### Components:
- Rounded corners (16-20px)
- Subtle borders and shadows
- Hover states with scale and color transitions
- Mobile-first responsive design

---

## **Key User Flows**

1. **New User**:
   - Signup → Onboarding → Set reading plan → Home dashboard

2. **Daily Reading**:
   - Home → Click "Today's Reading" → Bible reader → Highlight/Note → Save

3. **Journaling**:
   - Bible reader → Select text → Journal icon → Choose framework → Fill fields → Submit

4. **Note Management**:
   - Home → "View all notes" → Filter/search → View/edit specific note

---

## **Notable Implementation Details**

- **Mobile-optimized text selection**: Custom long-press detection for highlighting on touch devices
- **Streak calculation**: Checks daily activity across notes/highlights/journal
- **Protected routing**: Automatic redirect to onboarding if incomplete
- **Floating navigation**: Hides near bottom of page
- **Body scroll locking**: Prevents background scroll when modals open on mobile
- **Toast notifications**: Temporary feedback for user actions
- **Real-time updates**: Supabase subscriptions for auth state changes
- **Translation system**:
  - Context-based state management with localStorage persistence
  - Automatic Supabase sync for authenticated users
  - Translation-specific content filtering (highlights/notes)
  - API abstraction layer supporting multiple Bible API sources
  - Fallback payload system for flexible database insertion

---

## **Environment Variables**
```
GEMINI_API_KEY          # For AI features
APP_URL                 # Application URL
VITE_SUPABASE_URL       # Supabase project URL
VITE_SUPABASE_ANON_KEY  # Supabase public API key
```

---

## **Development Commands**
```bash
npm install              # Install dependencies
npm run dev             # Start dev server (port 3000)
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Type check with TypeScript
npm run clean           # Remove dist folder
```

## **Database Setup**

### Initial Setup:
1. Create a new project in Supabase
2. Run the schema from `supabase.sql` in the SQL Editor
3. Run the translation migration from `migration-final.sql`
4. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Migration Files:
- **`supabase.sql`** - Base schema with all tables and RLS policies
- **`migration-final.sql`** - Translation support (adds translation columns)
- **`migration.sql`** - Alternative migration (includes journal_entries table)

---

This is a well-structured, modern Bible study application with a strong focus on user experience, personalization, and mobile-first design. The codebase follows React best practices with TypeScript, context-based state management, and clean component separation.
