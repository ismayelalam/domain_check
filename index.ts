import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('output/progress.db');

db.exec(`
CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    last_index INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO progress (id, last_index)
VALUES (1, 0);


CREATE TABLE IF NOT EXISTS available_domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    error TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

function getLastIndex() {
  const row = db.prepare('SELECT last_index FROM progress WHERE id = 1').get();

  return row?.last_index;
}

function saveLastIndex(index: number) {
  db.prepare('UPDATE progress SET last_index = ? WHERE id = 1').run(index);
}

// Available domains
function saveAvailableDomain(domain: string) {
  db.prepare(
    `
      INSERT OR IGNORE INTO available_domains (domain)
      VALUES (?)
    `
  ).run(domain);
}

// Errors
function saveError(domain: string, error: string) {
  db.prepare(
    `
      INSERT INTO errors (domain, error)
      VALUES (?, ?)
    `
  ).run(domain, error);
}

await db.exec(`
CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    last_index INTEGER NOT NULL
);

INSERT OR IGNORE INTO progress (id, last_index)
VALUES (1, 0);
`);

async function fastCheck(domain: string) {
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`);
    return res.status === 404;
  } catch (e) {
    throw e;
  }
}

function generate4LetterArray() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const result = [];

  for (let a = 0; a < 26; a++) {
    for (let b = 0; b < 26; b++) {
      for (let c = 0; c < 26; c++) {
        result.push(`za${chars[a]}${chars[b]}${chars[c]}.com`);
      }
    }
  }

  return result;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function findAvailableDomainsFast() {
  const queue = generate4LetterArray();

  const startIndex = getLastIndex() as number;

  console.log(`Resuming from index ${startIndex}`);

  for (let i: number = startIndex; i < (queue?.length || 0); i++) {
    const domain = queue[i];

    try {
      const isAvailable = await fastCheck(domain);

      if (isAvailable) {
        console.log('✅', domain);
        saveAvailableDomain(domain);
      } else {
        console.clear();
        console.log(`Checked ${i + 1}/${queue.length}`);
        console.log(domain);
      }
    } catch (e: any) {
      saveError(domain, `${e}`);
    }

    // Save progress after every domain
    saveLastIndex(i + 1);

    sleep(1000);
  }

  console.log('Done');

  // Reset checkpoint when finished (optional)
  saveLastIndex(0);

  db.close();
}

findAvailableDomainsFast();
