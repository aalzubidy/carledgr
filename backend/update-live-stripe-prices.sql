-- Update production license_tiers table with live Stripe price IDs
-- Run this on your production database after confirming the price IDs match your Stripe account

UPDATE license_tiers 
SET stripe_price_id = 'price_1RnqqXG84VtkqkFwKG5dYjlI' 
WHERE tier_name = 'starter';

UPDATE license_tiers 
SET stripe_price_id = 'price_1Rnqr3G84VtkqkFweY7BKLfP' 
WHERE tier_name = 'professional';

UPDATE license_tiers 
SET stripe_price_id = 'price_1RnqrkG84VtkqkFwDc1m5oPa' 
WHERE tier_name = 'business';

UPDATE license_tiers 
SET stripe_price_id = 'price_1RnqsjG84VtkqkFwRWdW1zfb' 
WHERE tier_name = 'enterprise';

-- Verify the updates
SELECT tier_name, display_name, monthly_price, stripe_price_id 
FROM license_tiers 
WHERE tier_name IN ('starter', 'professional', 'business', 'enterprise'); 