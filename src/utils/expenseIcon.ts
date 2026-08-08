type IconResult = { icon: string; color?: string };

const keywordMap: { keywords: string[]; icon: string }[] = [
  { keywords: ['food', 'dinner', 'lunch', 'breakfast', 'restaurant', 'cafe', 'pizza', 'burger'], icon: 'silverware-fork-knife' },
  { keywords: ['uber', 'ola', 'taxi', 'bus', 'train', 'metro', 'flight', 'fuel', 'petrol', 'diesel'], icon: 'car' },
  { keywords: ['grocery', 'supermarket', 'mart', 'vegetables'], icon: 'basket' },
  { keywords: ['movie', 'netflix', 'concert', 'game'], icon: 'movie' },
  { keywords: ['rent', 'electricity', 'wifi', 'water', 'gas'], icon: 'home-analytics' },
];

export function getExpenseIcon(description: string): IconResult {
  const text = (description || '').toLowerCase();
  for (const entry of keywordMap) {
    if (entry.keywords.some((k) => text.includes(k))) {
      return { icon: entry.icon };
    }
  }
  return { icon: 'receipt' };
}
