// School name search normalization — ported from Next.js app
export function normalizeSearchQuery(query: string): string[] {
  let cleaned = query.toLowerCase().trim().replace(/\s+/g, ' ');
  const commonWords = ['negeri', 'swasta', 'muhammadiyah', 'islam', 'kristen', 'katolik', 'budha', 'hindu'];
  const variations: string[] = [cleaned];

  const abbreviationPattern = /\b(sd|smp|sma|smk)n\s*(\d+)(?:\s+(.+))?/i;
  const abbreviationMatch = cleaned.match(abbreviationPattern);

  if (abbreviationMatch) {
    const level = abbreviationMatch[1].toUpperCase();
    const number = abbreviationMatch[2];
    const rest = abbreviationMatch[3] || '';
    if (rest) {
      variations.push(`${level} negeri ${number} ${rest}`);
      variations.push(`${level}negeri ${number} ${rest}`);
      variations.push(`${level} negeri${number} ${rest}`);
      variations.push(`${level}N ${number} ${rest}`);
      variations.push(`${level}N${number} ${rest}`);
    } else {
      variations.push(`${level} negeri ${number}`);
      variations.push(`${level}negeri ${number}`);
      variations.push(`${level} negeri${number}`);
      variations.push(`${level}N ${number}`);
      variations.push(`${level}N${number}`);
    }
    variations.push(`${level} ${number}${rest ? ' ' + rest : ''}`);
    cleaned = `${level.toLowerCase()} ${number}${rest ? ' ' + rest : ''}`;
  }

  const schoolPattern1 = /\b(sd|smp|sma|smk)\s+(\d+)(?:\s+(.+))?/i;
  const schoolPattern2 = /\b(sd|smp|sma|smk)\s+(negeri|swasta)\s+(\d+)/i;
  const match1 = cleaned.match(schoolPattern1);
  const match2 = cleaned.match(schoolPattern2);

  if (match2) {
    const level = match2[1].toUpperCase();
    const type = match2[2];
    const number = match2[3];
    variations.push(`${level} ${type} ${number}`);
    variations.push(`${level}${type} ${number}`);
    variations.push(`${level} ${type}${number}`);
  } else if (match1 && !abbreviationMatch) {
    const level = match1[1].toUpperCase();
    const number = match1[2];
    const rest = match1[3] || '';
    commonWords.forEach((word) => {
      if (rest) {
        variations.push(`${level} ${word} ${number} ${rest}`);
        variations.push(`${level} ${word}${number} ${rest}`);
        variations.push(`${level}${word} ${number} ${rest}`);
      } else {
        variations.push(`${level} ${word} ${number}`);
        variations.push(`${level} ${word}${number}`);
        variations.push(`${level}${word} ${number}`);
      }
    });
    if (rest) {
      variations.push(`${level}${number} ${rest}`);
      variations.push(`${level} ${number} ${rest}`);
    } else {
      variations.push(`${level}${number}`);
      variations.push(`${level} ${number}`);
    }
  }

  const locationWords = cleaned.split(' ').filter(
    (w) => w.length > 3 && !['negeri', 'swasta', 'smpn', 'sdn', 'sman', 'smkn'].includes(w) && !/^\d+$/.test(w)
  );
  if (locationWords.length > 0) {
    locationWords.forEach((loc) => variations.push(loc));
  }

  return [...new Set(variations)];
}

export function buildSmartSearchConditions(query: string): { clause: string; params: any[] } {
  const variations = normalizeSearchQuery(query);
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  for (const variant of variations) {
    conditions.push(`name ILIKE $${idx}`);
    params.push(`%${variant}%`);
    idx++;
  }

  const cleaned = query.toLowerCase().trim();
  conditions.push(`district ILIKE $${idx}`);
  params.push(`%${cleaned}%`);
  idx++;
  conditions.push(`village ILIKE $${idx}`);
  params.push(`%${cleaned}%`);
  idx++;
  conditions.push(`address ILIKE $${idx}`);
  params.push(`%${cleaned}%`);
  idx++;

  const words = cleaned.split(' ').filter((w) => w.length >= 2);
  if (words.length > 1) {
    for (const word of words) {
      if (!['di', 'ke', 'dan', 'atau', 'yang'].includes(word)) {
        conditions.push(`name ILIKE $${idx}`);
        params.push(`%${word}%`);
        idx++;
      }
    }
  }

  return { clause: conditions.join(' OR '), params };
}
