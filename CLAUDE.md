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
│   ├── AuthContext.tsx      # Authentication state management
│   ├── supabase.ts          # Supabase client configuration
│   └── data.ts              # Data utilities
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
- **Text highlighting** with multiple colors:
  - Yellow, Blue, Green, Pink, Red
  - Mobile-optimized text selection with long-press
  - Persistent highlights saved to database
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

2. **`passages`** - Bible text storage
   - Book, chapter, verse structure
   - Full verse text
   - Translation support (default: KJV)
   - Seeded with sample verses

3. **`highlights`** - Text highlighting
   - Word range (start/end indices)
   - Color coding
   - User-specific

4. **`notes`** - General notes
   - Multiple types (note, highlight, journal, voice, bookmark)
   - Framework support (HEAR, SOAP, free)
   - Tags array
   - Linked to passages

5. **`journal_entries`** - Structured journal entries
   - Framework type
   - Four customizable fields
   - Linked to passages

### Security:
- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Passages are publicly readable
- Policies enforce user_id matching

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

---

This is a well-structured, modern Bible study application with a strong focus on user experience, personalization, and mobile-first design. The codebase follows React best practices with TypeScript, context-based state management, and clean component separation.
