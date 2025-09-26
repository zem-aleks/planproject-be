import cld from 'cld';

export const detectLanguage = async (
  content: string,
): Promise<string | null> => {
  try {
    const detectLanguage = await cld.detect(content, {
      isHTML: false,
      bestEffort: true,
    });
    const language = detectLanguage.languages.find((l) => l.percent >= 75);
    return language?.code || null;
  } catch (error) {
    console.warn(
      `detectLanguage: Failed to detect language for content "${content}"`,
    );
    return null;
  }
};
