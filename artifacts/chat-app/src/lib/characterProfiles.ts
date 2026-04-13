interface CharacterProfile {
  dateOfBirth?: string;
  gender?: string;
  language?: string;
  height?: string;
  weight?: string;
  ethnicity?: string;
  horoscope?: string;
  jobTitle?: string;
}

const profiles: Record<string, CharacterProfile> = {
  isabella: {
    dateOfBirth: "March 15, 2000",
    gender: "Female",
    language: "Spanish, English",
    height: "5'5\" (165 cm)",
    weight: "125 lbs (57 kg)",
    ethnicity: "Latina / Hispanic",
    horoscope: "Pisces ♓",
    jobTitle: "Marketing Coordinator",
  },
};

export function getCharacterProfile(slug: string): CharacterProfile {
  return profiles[slug] ?? {};
}
