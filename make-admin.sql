-- Make yourself admin in the database
-- Run this in Neon SQL Editor after deployment

-- Replace 'YOUR_EMAIL_HERE' with your actual email
UPDATE users 
SET is_admin = true 
WHERE email = 'kevensavard1992@gmail.com';

-- Verify it worked (should show 1 row with is_admin = true)
SELECT id, email, first_name, last_name, is_admin, credits, subscription_tier
FROM users 
WHERE email = 'kevensavard1992@gmail.com';

