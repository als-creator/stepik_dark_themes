/* Выпуск версии: поднять номер, проверить, закоммитить, пометить тегом.
 *
 *   node tools/release.mjs patch "осветлить текст на схемах"
 *   node tools/release.mjs "исправить контраст в комментариях"   (patch по умолчанию)
 *   node tools/release.mjs minor "добавлена тема Oblivion+"
 *
 *   --all   включить незакоммиченные правки без вопроса (для скриптов)
 *   --yes   то же, плюс не спрашивать ничего вовсе
 *
 * Порядок именно такой: сначала версия и проверка, и только потом коммит с
 * тегом. Поэтому «сломанная» версия не может ни закоммитироваться, ни
 * получить тег, а тег всегда указывает на рабочий скрипт — по нему версию
 * можно переустановить (git checkout v2.9.89).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'stepik-dark-themes.user.js');
const PKG = join(ROOT, 'package.json');

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m',
  green: '\x1b[32m', yellow: '\x1b[33m', bold: '\x1b[1m',
};

const rawArgs = process.argv.slice(2);
/* Флаги смотрим до фильтрации — иначе проверка «передан ли --all» всегда
   даёт false, потому что сам флаг уже вырезан. */
const ASSUME_YES = rawArgs.includes('--yes');
const ASSUME_ALL = rawArgs.includes('--all') || ASSUME_YES;
const argv = rawArgs.filter((a) => a !== '--yes' && a !== '--all');
const kinds = ['patch', 'minor', 'major'];
const kind = argv.find((a) => kinds.includes(a)) || 'patch';
const message = argv.filter((a) => !kinds.includes(a) && !/^\d+\.\d+\.\d+$/.test(a)).join(' ').trim();

/* Сравнение semver по трём числам: <0 / 0 / >0. */
function cmpSemver(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

if (!message) {
  console.error(`
  ${C.red}Нужно описание изменения.${C.reset}

    node tools/release.mjs patch "осветлить текст на схемах"
    node tools/release.mjs minor "добавлена новая тема"
`);
  process.exit(2);
}

const git = (args, opts = {}) => {
  try {
    return execFileSync('git', args, {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts,
    }).trim();
  } catch (e) {
    if (opts.throwOnError) throw e;
    return null;
  }
};

/* ------------------------------------------------------------- новая версия */

const src = readFileSync(SCRIPT, 'utf8');
const m = src.match(/^\/\/\s*@version\s+(\d+)\.(\d+)\.(\d+)\s*$/m);
if (!m) {
  console.error('  ' + C.red + 'Не найден @version в скрипте — номер поднимать нечем.' + C.reset);
  process.exit(1);
}
const [_, maj, min, pat] = m.map(Number);

/* Явный номер версии: node tools/release.mjs 2.9.89 "описание".
 * Нужен не для красоты. История этого проекта переписывалась, и версия в
 * репозитории уехала вниз (2.9.91 → 2.9.88), а у пользователей в браузере
 * остался 2.9.91. Обычный patch дал бы 2.9.89 — МЕНЬШЕ установленной, и
 * Tampermonkey с @updateURL просто не поставил бы обновление, молча
 * оставив старую версию навсегда. Поэтому номер можно задать руками, но
 * проверка снизу всё равно не даст уйти ниже последнего тега. */
const explicit = argv.find((a) => /^\d+\.\d+\.\d+$/.test(a));
const auto = {
  major: `${maj + 1}.0.0`,
  minor: `${maj}.${min + 1}.0`,
  patch: `${maj}.${min}.${pat + 1}`,
}[kind];
const version = String(explicit || auto);
const wasExplicit = Boolean(explicit);

const latestTag = (git(['tag', '--list', 'v*', '--sort=-v:refname']) || '').split('\n')[0];
if (latestTag === 'v' + version) {
  console.error('  ' + C.red + `Тег v${version} уже существует.` + C.reset);
  process.exit(1);
}
if (latestTag && cmpSemver(version, latestTag.replace(/^v/, '')) <= 0) {
  console.error(`
  ${C.red}Версия ${version} не выше последнего тега ${latestTag}.${C.reset}
  Менеджер скриптов обновляет только когда версия ВЫШЕ установленной,
  поэтому релиз с меньшим номером пользователям не доедет.
`);
  process.exit(1);
}

/* Незакоммиченные правки — это обычно и есть то, что выпускаем: в этом
   проекте каждая версия — это правка скрипта плюс её номер одним коммитом.
   Поэтому спрашиваем, а не запрещаем: молча утащить в релиз чужое нельзя. */
const dirty = git(['status', '--porcelain']);
if (dirty && !ASSUME_ALL) {
  console.error(`
  ${C.yellow}В рабочем дереве есть незакоммиченные правки:${C.reset}

${dirty.split('\n').map((l) => '    ' + l).join('\n')}

  ${C.dim}Они попадут в коммит версии (обычно это и нужно).${C.reset}
  ${C.dim}Только если это не то — прервитесь (Ctrl-C) и разберитесь с ними сначала.${C.reset}
`);
  if (!process.stdin.isTTY) {
    console.error(`  ${C.red}Неинтерактивный режим — перезапустите с --all, если правки нужно включить.${C.reset}\n`);
    process.exit(1);
  }
  const rl = (await import('node:readline')).createInterface({ input: process.stdin, output: process.stdout });
  const ans = (await rl.question(`  ${C.bold}Включить их в релиз? [Y/n]${C.reset} `)).trim().toLowerCase();
  rl.close();
  if (ans && ans !== 'y' && ans !== 'д' && ans !== 'yes') {
    console.error('  ' + C.red + 'Отменено.' + C.reset);
    process.exit(1);
  }
}

console.log(`
  ${C.bold}${version}${C.reset}  ${C.dim}(было ${maj}.${min}.${pat}${wasExplicit ? ', номер задан явно' : ''})${C.reset}
  ${C.dim}${message}${C.reset}
`);

/* ------------------------------------------------- 1. поднимаем номер везде */

/* Только строка @version — остальное содержимое скрипта не трогаем. */
writeFileSync(SCRIPT, src.replace(/^(\/\/\s*@version\s+)\S+(\s*)$/m, `$1${version}$2`));

const pkg = JSON.parse(readFileSync(PKG, 'utf8'));
pkg.version = version;
writeFileSync(PKG, JSON.stringify(pkg, null, 2) + '\n');

/* ------------------------------------------------- 2. проверяем до коммита */

console.log('  ' + C.dim + 'проверка…' + C.reset);
let check;
try {
  check = execFileSync(process.execPath, [join(ROOT, 'tools', 'check.mjs')], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(check.split('\n').filter((l) => l.trim()).map((l) => '    ' + l).join('\n'));
} catch (e) {
  const out = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
  console.error(out);
  console.error(`
  ${C.red}Версия ${version} не прошла проверку — номер уже поднят в файлах,${C.reset}
  ${C.red}но ничего не закоммичено.${C.reset} Исправьте скрипт и запустите проверку снова:
  ${C.dim}  node tools/check.mjs${C.reset}
  ${C.red}Откатить номер:${C.reset} git checkout -- stepik-dark-themes.user.js package.json
`);
  process.exit(1);
}

/* ------------------------------------------------- 3. коммит и тег */

const title = `bump ${version}: ${message}`;

/* В релиз идёт скрипт и package.json плюс всё, что уже было изменено
   (правки README, новые файлы) — иначе номер версии окажется в коммите
   без той правки, ради которой его подняли. */
git(['add', '-A'], { throwOnError: true });

try {
  git(['commit', '-m', title], { throwOnError: true });
} catch (e) {
  console.error('  ' + C.red + 'Коммит не прошёл:' + C.reset);
  console.error((e.stderr || e.stdout || e).toString());
  process.exit(1);
}

git(['tag', '-a', 'v' + version, '-m', title], { throwOnError: true });

console.log(`
  ${C.green}✓${C.reset} версия ${C.bold}${version}${C.reset} закоммичена и помечена тегом ${C.bold}v${version}${C.reset}
  ${C.dim}переустановить эту версию: git checkout v${version}${C.reset}

  Осталось запушить:
    git push && git push --tags
`);

const ahead = git(['rev-list', '--count', '@{u}..HEAD']);
if (ahead) {
  console.log(`  ${C.yellow}Впереди origin/main коммитов: ${ahead}${C.reset}\n`);
}