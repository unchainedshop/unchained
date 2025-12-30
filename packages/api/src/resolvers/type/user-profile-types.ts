import type { UserProfile as UserProfileType } from '@unchainedshop/core-users';

// GraphQL Date scalar expects Date objects or date-only strings (YYYY-MM-DD)
// JSON serialization converts Date to ISO strings with time component
// This resolver ensures birthday is properly formatted for the Date scalar
export const UserProfile = {
  birthday: (profile: UserProfileType) => {
    if (!profile?.birthday) return null;

    // If it's already a Date object, return it
    if (profile.birthday instanceof Date) {
      return profile.birthday;
    }

    // If it's a string (from JSON deserialization), convert to Date
    if (typeof profile.birthday === 'string') {
      return new Date(profile.birthday);
    }

    return null;
  },
};
