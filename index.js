import { writeFile, appendFile } from 'fs/promises';

async function fastCheck(domain) {
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`);
    return res.status === 404;
  } catch (e) {
    throw Error(e);
  }
}

function generate4LetterArray() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const result = [];

  for (let a = 0; a < 26; a++) {
    for (let b = 0; b < 26; b++) {
      for (let c = 0; c < 26; c++) {
        for (let d = 0; d < 26; d++) {
          for (let e = 0; e < 26; e++) {
            result.push(
              chars[a] + chars[b] + chars[c] + chars[d] + chars[e] + '.com'
            );
          }
        }
      }
    }
  }

  return result;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function findAvailableDomainsFast() {
  const queue = generate4LetterArray();
  const fileName = 'output/available-domains.txt';
  const errFile = 'output/error-domains.txt';

  // create/clear file first
  await writeFile(fileName, '', 'utf-8');
  await writeFile(errFile, '', 'utf-8');

  for (const domain of queue) {
    try {
      const isAvailable = await fastCheck(domain);

      if (isAvailable) {
        console.log('✅', domain);

        // 🔥 WRITE IMMEDIATELY WHEN FOUND
        await appendFile(fileName, domain + '\n');
      } else {
        console.clear();
        console.count('domain checked');
        console.log(domain);
      }
    } catch (e) {
      await appendFile(errFile, domain + ': ' + e + '\n');
    }

    // rate limit
    await sleep(1000);
  }

  console.log('📁 Done saving available domains');
}

findAvailableDomainsFast();
