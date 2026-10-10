/**
 * Command-palette ranking.
 *
 * cmdk's default scorer treats a query as a subsequence, so "merge" matches
 * most English descriptions and the list stays in catalog order. The first
 * row is then whatever tool was registered first, which is why Enter opened
 * the wrong page. This ranker only accepts a real word or synonym, and the
 * palette renders that order so the best match is the selected row.
 */

export interface PaletteSearchable {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  category: string;
}

const WORD = /[a-z0-9]+/g;

function words(value: string): string[] {
  return value.toLowerCase().match(WORD) ?? [];
}

function scoreToken(tool: PaletteSearchable, token: string): number {
  const name = tool.name.toLowerCase();
  const nameWords = words(name);
  if (name === token) return 1000;
  if (name.startsWith(token)) return 920;
  if (nameWords.some((word) => word === token)) return 860;
  if (token.length >= 2 && nameWords.some((word) => word.startsWith(token))) return 740;

  const keywords = tool.keywords.flatMap((keyword) => [keyword.toLowerCase(), ...words(keyword)]);
  if (keywords.some((keyword) => keyword === token)) return 640;
  if (token.length >= 3 && keywords.some((keyword) => keyword.startsWith(token))) return 560;

  const categoryWords = words(tool.category);
  if (categoryWords.some((word) => word === token)) return 480;
  if (token.length >= 3 && categoryWords.some((word) => word.startsWith(token))) return 420;

  const descriptionWords = words(tool.description);
  if (descriptionWords.some((word) => word === token)) return 240;
  if (token.length >= 4 && descriptionWords.some((word) => word.startsWith(token))) return 180;
  return 0;
}

/** 0 hides the tool. A non-empty query must match every word. */
export function scorePaletteQuery(tool: PaletteSearchable, query: string): number {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 1;
  let total = 0;
  for (const token of tokens) {
    const score = scoreToken(tool, token);
    if (score === 0) return 0;
    total += score;
  }
  return total;
}

export function rankPaletteTools<T extends PaletteSearchable>(tools: T[], query: string): T[] {
  const trimmed = query.trim();
  if (!trimmed) return tools;
  return tools
    .map((tool, index) => ({ tool, index, score: scorePaletteQuery(tool, trimmed) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((row) => row.tool);
}
