-- fix_broken_profiles.sql
-- Removes incomplete profiles created by failed signup flow

DELETE FROM profiles
WHERE email IS NULL AND full_name IS NULL;

SELECT id, email, full_name, onboarding_complete
FROM profiles
ORDER BY id;
