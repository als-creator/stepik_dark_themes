/* Размечаем тегами уже выпущенные версии.
 *
 *   node tools/tag-history.mjs --dry-run   только показать, что будет
 *   node tools/tag-history.mjs
 *
 * Зачем: до этого тегов в репозитории не было ни одного, хотя версий — больше
 * девяноста. Значит «версию 2.9.62» нельзя было ни найти, ни переустановить,
 * и откатиться на рабочую можно было только глазами по `git log`. Тег
 * делает каждую версию адресуемой: git checkout v2.9.62 — и в руках
 * работоспособный скрипт.
 *
 * Нумерация в истории местами шла рывками (2.9.60 → 2.9.73, а однажды даже
 * назад: 2.9.86 → 2.9.80), поэтому тег ставится на ПЕРВОЕ появление каждого
 * номера, а не на «последний перед следующим». Дыры в нумерации трогать не
 * будем: переписывать прошлое ради ровного счёта — значит испортить его.
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = 'stepik-dark-themes.user.js';
const DRY = process.argv.includes('--dry-run');

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', red: '\x1b[31m', bold: '\x1b[1m' };

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/* Коммиты по файлу скрипта, от старых к новым. */
const raw = git(['log', '--reverse', '--format=%H', '--', SCRIPT]).split('\n').filter(Boolean);
const existing = new Set(git(['tag', '--list', 'v*']).split('\n').filter(Boolean));

const plan = [];
const seen = new Set();
let regressions = [];

for (const sha of raw) {
  let ver = null;
  try {
    const body = git(['show', sha + ':' + SCRIPT]).slice(0, 4000);
    const m = body.match(/^\/\/\s*@version\s+(\d+\.\d+\.\d+)\s*$/m);
    ver = m ? m[1] : null;
  } catch {
    continue; /* версия файла в этом коммите недоступна */
  }
  if (!ver || seen.has(ver)) continue;
  seen.add(ver);
  const tag = 'v' + ver;
  if (existing.has(tag)) continue;
  plan.push({ sha, tag, ver, subject: git(['log', '-1', '--format=%s', sha]) });
}

/* Отдельно показываем места, где номер ушёл назад — это признак отката. */
const ordered = raw.map((sha) => {
  try {
    const m = git(['show', sha + ':' + SCRIPT]).slice(0, 4000).match(/^\/\/\s*@version\s+(\d+\.\d+\.\d+)\s*$/m);
    return m ? { sha, ver: m[1] } : null;
  } catch { return null; }
}).filter(Boolean);
for (let i = 1; i < ordered.length; i++) {
  const [a, b, c] = ordered[i - 1].ver.split('.').map(Number);
  const [d, e, f] = ordered[i].ver.split('.').map(Number);
  if (d * 1e6 + e * 1e3 + f < a * 1e6 + b * 1e3 + c) {
    regressions.push(ordered[i - 1].ver + ' → ' + ordered[i].ver);
  }
}

console.log(`\n  Версий найдено: ${seen.size}, уже помечено: ${existing.size}, к добавлению: ${plan.length}\n`);

if (regressions.length) {
  console.log('  ' + C.yellow + 'Номер уходил назад (история откатов): ' + regressions.join(', ') + C.reset);
  console.log('  ' + C.dim + 'Тег ставим на первое появление номера; дыры в нумерации оставляем как есть.' + C.reset + '\n');
}

if (!plan.length) {
  console.log('  ' + C.dim + 'Помечать нечего.' + C.reset + '\n');
  process.exit(0);
}

if (DRY) {
  plan.forEach((p) => console.log('  ' + C.dim + p.sha.slice(0, 7) + '  ' + p.tag.padEnd(10) + p.subject.slice(0, 70) + C.reset));
  console.log('\n  ' + C.dim + 'Это сухой прогон. Убрать --dry-run, чтобы расставить теги.' + C.reset + '\n');
  process.exit(0);
}

let done = 0;
for (const p of plan) {
  try {
    git(['tag', '-a', p.tag, '-m', 'bump ' + p.ver + ': ' + p.subject.replace(/^bump\s*[\d.]+\s*:?\s*/, ''), p.sha]);
    done++;
  } catch (e) {
    console.log('  ' + C.red + 'не удалось: ' + p.tag + ' — ' + String(e.stderr || e.message).trim().split('\n')[0] + C.reset);
  }
}

console.log('  ' + C.green + '✓' + C.reset + ' расставлено тегов: ' + C.bold + done + C.reset);
console.log('  ' + C.dim + 'Теперь любая прошлая версия доступна: git checkout v2.9.62' + C.reset);
console.log('  ' + C.dim + 'Отправить теги на сервер: git push --tags' + C.reset + '\n');