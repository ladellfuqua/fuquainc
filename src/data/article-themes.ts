export const articleThemeNames = [
  'Work and Leadership',
  'Culture and Technology',
  'Identity and Belonging',
  'Personal Reflections',
] as const;

const notes: Record<(typeof articleThemeNames)[number], string> = {
  'Work and Leadership': 'How people lead, build teams and find meaning in the work itself.',
  'Culture and Technology': 'How technology reshapes what we do, and what it asks of us.',
  'Identity and Belonging': 'Being seen and included — race, access, power, and who gets to belong.',
  'Personal Reflections': 'Shorter, more personal notes and observations from along the way.',
};

export const articleThemes = articleThemeNames.map((name) => ({ name, note: notes[name] }));
export const writingIntro = 'On work, technology and culture — and how they shape our everyday lives.';
