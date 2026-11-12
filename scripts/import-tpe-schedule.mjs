import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = resolve(process.argv[2] ?? `${root}/tmp/taoyuan-flight-feed.csv`);
const capturedAt = process.argv[3] ?? '2026-11-11T10:51:07+08:00';
const output = `${root}/src/data/schedules/tpe-2026-11-11.json`;

function parseCsv(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(value); value = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(value); value = '';
      if (row.some(cell => cell.length)) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value.length || row.length) { row.push(value); rows.push(row); }
  const [header, ...records] = rows;
  return records.map(cells => Object.fromEntries(header.map((name, index) => [name, (cells[index] ?? '').trim()])));
}

const source = await readFile(input, 'utf8');
const records = parseCsv(source);
if (!records.length) throw new Error('The official flight feed is empty.');
const flights = records.map(record => ({
  terminal: record['航廈'],
  kind: record['種類'] === 'A' ? 'arrival' : 'departure',
  airlineCode: record['航空公司代碼'],
  airlineNameZh: record['航空公司中文'],
  number: record['班次'],
  gate: record['機門'],
  date: record['表訂日期'],
  scheduledTime: record['表訂時間'],
  expectedDate: record['預計日期'],
  expectedTime: record['預計時間'],
  airport: record['往來地點'],
  airportEnglish: record['往來地點英文'],
  airportChinese: record['往來地點中文'],
  status: record['航班狀態'],
  aircraftModel: record['機型'],
  otherStops: record['其他航點'],
  baggageCarousel: record['行李轉盤'],
  checkInCounter: record['報到櫃台'],
  commentZh: record['航班動態中文'],
  commentEn: record['航班動態英文'],
}));

const dates = [...new Set(flights.map(flight => flight.date))];
if (dates.length !== 1 || dates[0] !== '2026-11-11') {
  throw new Error(`Expected a single 2026-11-11 snapshot, got: ${dates.join(', ')}`);
}
const carriers = Object.fromEntries([...new Map(flights.map(flight => [flight.airlineCode, flight.airlineNameZh])).entries()].sort(([a], [b]) => a.localeCompare(b)));
const snapshot = {
  title: 'Taoyuan International Airport real-time flights',
  provider: 'Taoyuan International Airport Corporation Ltd.',
  source: 'https://data.gov.tw/en/datasets/26194',
  resource: 'https://odp.taoyuan-airport.com/dataset/2023081816?format=csv',
  license: 'Open Government Data License, version 1.0',
  snapshotDate: dates[0],
  capturedAt,
  rowCount: flights.length,
  carriers,
  flights,
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot)}\n`, 'utf8');
console.log(`Saved ${flights.length} flights and ${Object.keys(carriers).length} carriers to ${output}`);
