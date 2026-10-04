/* Выпуск версии: поднять номер, проверить, закоммитить, пометить тегом.
 *
 *   node tools/release.mjs patch "осветлить текст на схемах"
 *   node tools/release.mjs "исправить контраст в комментариях"   (patch по умолчанию)
 *   node tools/release.mjs minor "добавлена тема Oblivion+"
 *
 * Порядок именно такой: сначала версия и проверка, и только потом коммит с
 * тегом. Поэтому «сломанная» версия не может ни закоммитироваться, ни
 * получить тег, а тег всегда указывает на рабочий скрипт — по нему версию
 * можно переустановить (git checkout v2.9.92).
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

const argv = process.argv.slice(2).filter((a) => a !== '--yes');
const kinds = ['patch', 'minor', 'major'];
const kind = argv.find((a) => kinds.includes(a)) || 'patch';
const message = argv.filter((a) => !kinds.includes(a)).join(' ').trim();

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
const next = {
  major: `${maj + 1}.0.0`,
  minor: `${maj}.${min + 1}.0`,
  patch: `${maj}.${min}.${pat + 1}`,
}[kind];
const version = String(next);

const latestTag = (git(['tag', '--list', 'v*', '--sort=-v:refname']) || '').split('\n')[0];
if (latestTag === 'v' + version) {
  console.error('  ' + C.red + `Тег v${version} уже существует.` + C.reset);
  process.exit(1);
}

const dirty = git(['status', '--porcelain']);
if (dirty) {
  console.error(`
  ${C.red}Рабочее дерево не чистое.${C.reset} Закоммить текущие изменения или отменить их (${C.dim}git stash${C.reset}),
  иначе они попадут в релиз случайно:

${dirty.split('\n').map((l) => '    ' + l).join('\n')}
`);
  process.exit(1);
}

console.log(`
  ${C.bold}${version}${C.reset}  ${C.dim}(было ${maj}.${min}.${pat})${C.reset}
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

git(['add', 'stepik-dark-themes.user.js', 'package.json'], { throwOnError: true });

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