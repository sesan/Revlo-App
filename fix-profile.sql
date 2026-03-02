-- ========================================
-- Fix Existing Broken Profiles
-- Run this if you have profiles with null email/name
-- ========================================

-- Delete profiles that have null email and full_name
-- (These are incomplete profiles from failed signups)
DELETE FROM profiles
WHERE email IS NULL AND full_name IS NULL;

-- Show remaining profiles
SELECT id, email, full_name, onboarding_complete
FROM profiles
ORDER BY id;

-- Success message
SELECT 'Broken profiles cleaned up!' as status;
