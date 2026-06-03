-- Add unique constraint on user_profiles.user_id
-- Required for ON CONFLICT (user_id) upsert in updateProfile
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
