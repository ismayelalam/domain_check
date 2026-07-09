import { writeFile } from 'fs/promises';

async function fastCheck(domain: string) {
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`);
    return res.status === 404;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export function generate4LetterArray(): string[] {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const result: string[] = [];

  for (let a = 0; a < 26; a++) {
    for (let b = 0; b < 26; b++) {
      for (let c = 0; c < 26; c++) {
        for (let d = 0; d < 26; d++) {
          result.push(chars[a] + chars[b] + chars[c] + chars[d] + '.com');
        }
      }
    }
  }

  return result;
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function findAvailableDomainsFast() {
  const queue = generate4LetterArray();
  const available: string[] = [];

  for (const domain of queue) {
    try {
      const isAvailable = await fastCheck(domain);

      if (isAvailable) {
        available.push(domain);
        console.log('✅', domain);
      } else {
        console.clear();
        console.count('not available');
        console.log(domain);
      }
    } catch {
      console.log('fail');
    }

    // RATE LIMIT: 1 request per second
    await sleep(1000);
  }

  await writeFile('available-domains.txt', available.join('\n'), 'utf-8');

  console.log('📁 Saved:', available.length, 'domains');

  return available;
}

console.log(findAvailableDomainsFast());
