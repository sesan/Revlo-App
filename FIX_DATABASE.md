# Fix Database Errors - Run This First! 🚨

## The Problem
Your app is trying to access database columns that don't exist yet. This causes errors on the Home page, Signup, and everywhere else.

## The Solution (Takes 2 Minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your Verse project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query**
2. Copy ALL the contents from `migration-complete.sql`
3. Paste into the SQL editor
4. Click **Run** button (or press Cmd/Ctrl + Enter)

### Step 3: Verify Success
You should see a success message like:
```
status: "Migration completed successfully! You can now use all features."
highlights_updated: X
notes_updated: X
profiles_updated: X
```

### Step 4: Restart Your App
```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

## What This Migration Does
✅ Adds translation support to highlights and notes
✅ Adds tags support to highlights
✅ Adds preferred translation to user profiles
✅ Creates indexes for fast queries
✅ Backfills existing data with default values

## After Migration
Everything should work:
- ✅ Home page loads without errors
- ✅ Signup creates accounts properly
- ✅ Translation switcher works
- ✅ Highlights show tags
- ✅ Notes page displays highlights
- ✅ All features enabled

## Still Having Issues?
If you get errors after running the migration:
1. Check the Supabase SQL Editor for error messages
2. Make sure you copied the ENTIRE migration file
3. Try refreshing your browser (Cmd/Ctrl + R)
4. Clear browser cache if needed

---

**IMPORTANT:** You only need to run this migration ONCE. Don't run it multiple times.
