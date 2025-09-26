export const detectLanguageSimplified = (text: string): 'en' | 'de' => {
  // Regular expressions for detecting German-specific characters
  const germanRegex = /[äöüß]/i;

  // List of common German words or patterns (you can expand this list)
  const germanWords = [
    'der',
    'die',
    'das',
    'und',
    'nicht',
    'mit',
    'auf',
    'für',
  ];

  // If German-specific characters are present, it's likely German
  if (germanRegex.test(text)) {
    return 'de';
  }

  // Check if text contains German words (case-insensitive)
  const lowerText = text.toLowerCase();
  for (const word of germanWords) {
    if (lowerText.includes(word)) {
      return 'de';
    }
  }

  // Default to English if no German-specific patterns are found
  return 'en';
};
