import type { Domain, Question } from "./types";

let cache: Promise<Question[]> | null = null;

export function loadQuestionBank(): Promise<Question[]> {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}data/questions.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load question bank (${res.status})`);
        return res.json() as Promise<Question[]>;
      })
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

export function domainsFromBank(bank: Question[]): Domain[] {
  const map = new Map<number, Domain>();
  for (const q of bank) {
    if (!map.has(q.domain.number)) map.set(q.domain.number, q.domain);
  }
  return [...map.values()].sort((a, b) => a.number - b.number);
}
