/* Проверка юзерскрипта перед коммитом/тегом.
 *
 * Смысл: номер версии должен доставать до пользователя только тот скрипт,
 * который гарантированно рабочий. Поэтому проверка двухчастная:
 *
 *   1. Статика  — метаданные, самодостаточность, синтаксис, отсутствие мусора.
 *   2. Функция  — скрипт реально выполняется в jsdom, а переключатель тем
 *                 применяет КАЖДУЮ тему и для каждой проверяется, что CSS
 *                 собрался, атрибуты встали и в CSS нет мусора.
 *
 * Именно вторая часть ловит то, что и портило версии 2.9.85–2.9.86:
 * синтаксис и метаданные были в порядке, а страница ломалась.
 *
 * Запуск:  node tools/check.mjs [--json]
 * Выход:   0 — всё в порядке, 1 — есть ошибки (блокирует коммит).
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'stepik-dark-themes.user.js');
const JSON_OUT = process.argv.includes('--json');

const errors = [];
const warnings = [];
const notes = [];

const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const note = (m) => notes.push(m);

/* ---------------------------------------------------------------- утилиты */

function git(args, fallback = '') {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (e) {
    return fallback;
  }
}

/* Сравнение semver по трём числам. Возвращает <0 / 0 / >0. */
function cmpSemver(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

const src = readFileSync(SCRIPT, 'utf8');

/* ------------------------------------------------- 1. метаданные юзерскрипта */

const metaMatch = src.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
if (!metaMatch) {
  fail('Нет блока метаданных: не найдено «// ==UserScript==» … «// ==/UserScript==»');
} else {
  const body = metaMatch[1];
  const field = (name) => {
    const m = body.match(new RegExp('^//\\s*@' + name + '\\s+(.+)$', 'm'));
    return m ? m[1].trim() : null;
  };

  /* Обязательные поля: без них скрипт либо не установится, либо не запустится
     на нужных страницах. */
  for (const f of ['name', 'namespace', 'version', 'description', 'author', 'match', 'run-at']) {
    if (!field(f)) fail('В блоке метаданных нет обязательного поля @' + f);
  }

  /* @run-at должен оставаться document-start: без него тема применяется позже
     и на живых страницах мигает светлым (это описано в коде, скрипт 2.9.x). */
  const runAt = field('run-at');
  if (runAt && runAt !== 'document-start') {
    warn('@run-at = «' + runAt + '», ожидался document-start (иначе мигание светлой темы)');
  }
  if (body.indexOf('@grant') === -1) {
    fail('Нет @grant — без него грант выбирается по умолчанию и скрипт может запросить лишние права');
  }

  /* Автообновление. Если директивы есть, они должны указывать на тот же
     репозиторий, что и @namespace, и быть одинаковыми: расхождение означает,
     что одно из них осталось от прежнего адреса и пользователи молча
     останутся на старой версии. Адрес проверяем только на вид — сетевой
     запрос в хуке был бы медленным и ронял бы коммит из-за сети. */
  const upd = field('updateURL');
  const dl = field('downloadURL');
  if (upd || dl) {
    if (!upd || !dl) fail('Задана только одна директива — нужны обе: @updateURL и @downloadURL');
    if (upd && dl && upd !== dl) fail('@updateURL и @downloadURL указывают на разные адреса');
    const url = upd || dl;
    if (!/^https:\/\/raw\.githubusercontent\.com\/[\w.-]+\/[\w.-]+\/[\w.\/-]+\.user\.js$/.test(url)) {
      fail('@updateURL выглядит не как raw-адрес GitHub: ' + url);
    }
    /* Владелец и имя репозитория в адресе должны совпадать с @namespace —
       иначе одно из двух устарело (так уже было: @namespace указывал на
       несуществующий als/stepik-dark-themes). */
    const ns = field('namespace') || '';
    const nsSlug = ns.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
    const urlSlug = (url.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+\/[^/]+)\//) || [])[1] || '';
    if (nsSlug && urlSlug && nsSlug !== urlSlug) {
      fail('Репозиторий в @namespace (' + nsSlug + ') и в @updateURL (' + urlSlug + ') разный');
    }
    note('автообновление: ' + url);
  }

  const version = field('version');
  if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
    fail('@version = «' + version + '», ожидался строгий semver вида 2.9.89');
  }

  /* Совпадение с package.json: чтобы npm-метаданные не расходились с
     устанавливаемым скриптом. */
  let pkgVersion = null;
  try {
    pkgVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version || null;
  } catch { /* package.json может отсутствовать — не ошибка */ }
  if (pkgVersion && version && pkgVersion !== version) {
    fail('Расхождение версий: @version в скрипте ' + version + ', version в package.json ' + pkgVersion);
  }

  globalThis.__version = version;
}

/* ------------------------------------------------- 2. самодостаточность */

/* Юзерскрипт с @grant none — это один файл, который копируют в редактор
   Tampermonkey. Любой require/import сделает его нерабочим при установке. */
if (/^\s*(const|let|var)\s+[\w{},\s]*=\s*require\s*\(/m.test(src)) {
  fail('Найден require() — юзерскрипт должен быть самодостаточным (один файл, @grant none)');
}
if (/^\s*import\s+[\w{*]/m.test(src) || /^\s*export\s+(default|const|function)/m.test(src)) {
  fail('Найдены import/export — юзерскрипт должен быть самодостаточным (один файл, @grant none)');
}
if (/\bdebugger\b/.test(src)) {
  fail('Остался debugger — скрипт встанет у пользователя с открытыми DevTools');
}
const debugLogs = src.match(/console\.(log|debug)\s*\(/g);
if (debugLogs) {
  warn('Найдено console.log/debug (' + debugLogs.length + ') — в релизной версии лучше убрать');
}

/* IIFE должен быть закрыт: незакрытая скобка ломает парсинг всего файла, но
   node --check это уже поймает — здесь ловим именно «файл не самодостаточен». */
if (!/\}\)\(\);\s*$/.test(src.trim())) {
  fail('Файл не заканчивается на «})();» — похоже, IIFE не закрыт или добавлен код после него');
}

/* ------------------------------------------------- 3. синтаксис */

try {
  execFileSync(process.execPath, ['--check', SCRIPT], { stdio: ['ignore', 'pipe', 'pipe'] });
  note('node --check: синтаксис в порядке');
} catch (e) {
  const out = (e.stderr ? e.stderr.toString() : '') + (e.stdout ? e.stdout.toString() : '');
  fail('Синтаксическая ошибка (node --check):\n' + out.trim());
}

/* --- 3a. У каждого color-mix() есть запасной вариант того же свойства.
   color-mix() поддержан с марта 2023 (Chrome 111, Safari 16.2, Firefox 113).
   В более старом браузере декларация отбрасывается на разборе, и если
   запасной нет, элемент остаётся со светлым фоном сайта — то есть ровно та
   поломка, которую гейт мимо себя пропустить не должен. */
{
  const lines = src.split('\n');
  const ruleStart = (from) => {
    for (let i = from; i >= 0; i--) if (/[{]\s*$/.test(lines[i])) return i;
    return -1;
  };
  const ruleEnd = (from) => {
    for (let i = from; i < lines.length; i++) if (/^\s*}\s*$/.test(lines[i])) return i;
    return lines.length - 1;
  };
  let cm = 0;
  let bare = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('color-mix(')) continue;
    cm++;
    const prop = (lines[i].trim().match(/^[-a-z]+\s*:/) || [''])[0].replace(/\s*:$/, '');
    if (!prop) continue;
    const a = ruleStart(i), b = ruleEnd(i);
    let ok = false;
    for (let j = a + 1; j <= b; j++) {
      if (j === i) continue;
      const t = lines[j].trim();
      if (t.startsWith(prop + ':') && !t.includes('color-mix(')) { ok = true; break; }
    }
    if (!ok) {
      bare++;
      fail('color-mix() без запасного значения: ' + lines[i].trim().slice(0, 70) +
        ' — в браузерах старше 2023 года декларация отбросится, фон останется светлым');
    }
  }
  if (cm && !bare) note('color-mix: все ' + cm + ' вхождений имеют запасное значение');
}

/* --- 3b. Проход по DOM не должен крутиться на фиксированном интервале.
   skFixInlineColors обходит шесть областей контента селекторами
   [style*="color"] — это проверка атрибута у каждого узла поддерева. На
   постоянном интервале это десятки полных сканов страницы в минуту впустую. */
{
  const iv = src.match(/setInterval\s*\(([\s\S]{0,400}?)\}\s*,|setInterval\s*\(([\s\S]{0,400}?)\)\s*[,;]/g) || [];
  let bad = 0;
  for (const call of iv) if (/skFix/.test(call)) bad++;
  if (bad) {
    fail('Проход по DOM назначен через setInterval (' + bad + ') — нужен нарастающий интервал, иначе скан страницы идёт впустую');
  } else if (src.includes('skPollDelay')) {
    note('проход по DOM: интервал нарастает, а не крутится постоянно');
  }
}

/* --- 3c. Ни один объявленный токен --sk-* не должен оставаться без дела.
   Мёртвый токен означает поломку того же рода, что и забытое запасное
   значение у color-mix(): палитра и тема тщательно подобраны, а разметка на
   них не ссылается — и расхождение видно только глазами, уже на живой
   странице. Именно так вышло с выделением текста: все восемь тем держали
   свой selection, --sk-selection и --sk-code-selection выдавались в CSS,
   а ::selection и .cm-selectionBackground были зашиты на rgba(120,160,255,0.35),
   то есть одинаковой во всех темах. */
{
  const declared = new Set();
  for (const m of src.matchAll(/(--sk-[a-z0-9-]+)\s*:\s*\$\{/g)) declared.add(m[1]);
  const used = new Set();
  for (const m of src.matchAll(/var\(\s*(--sk-[a-z0-9-]+)/g)) used.add(m[1]);
  const dead = [...declared].filter((t) => !used.has(t));
  if (dead.length) {
    fail('Объявлено, но не используется ни разу: ' + dead.join(', ') +
      ' — либо разметка не ссылается, либо токен лишний и должен быть убран');
  } else {
    note('токены --sk-*: все ' + declared.size + ' используются, мёртвых нет');
  }
}

/* ------------------------------------------------- 4. версия против тегов */

/* Каждая версия должна быть выше последней помеченной: тег — это то, по чему
   версию можно переустановить, поэтому откат нумерации ломает историю. */
const latestTag = git(['tag', '--list', 'v*', '--sort=-v:refname']).split('\n')[0] || '';
const scriptChanged =
  git(['diff', '--name-only', '--cached']).split('\n').includes('stepik-dark-themes.user.js') ||
  git(['diff', '--name-only']).split('\n').includes('stepik-dark-themes.user.js') ||
  !latestTag;

if (latestTag && scriptChanged) {
  const cur = globalThis.__version;
  const prev = latestTag.replace(/^v/, '');
  if (cur && cmpSemver(cur, prev) <= 0) {
    fail('Версия ' + cur + ' не выше последнего тега ' + latestTag +
         ' — новую версию нельзя выпустить под уже занятым номером');
  } else {
    note('Версия ' + cur + ' выше тега ' + latestTag);
  }
} else if (!latestTag) {
  note('Тегов нет — история версий пока не размечена (node tools/tag-history.mjs)');
}

/* ------------------------------------------------- 5. функциональная проверка */

let JSDOM;
try {
  ({ JSDOM } = await import('jsdom'));
} catch {
  fail('Не найден jsdom — функциональную часть проверить нельзя. Выполните: npm install');
}

const report = { themes: [], pages: [] };

if (JSDOM) {
  /* Страницы-фикстуры. Подобраны по тем местам, которые уже ломались:
     комментарии/DraftEditor (2.9.85–2.9.86), квиз, каталог, текст урока,
     уведомления. Скрипт навешивает обработчики на эти узлы, поэтому смоук
     проходит по ним всем. */
  const PAGES = {
    'текст урока': '<div class="step-text-wrapper"><p style="color:#25282d">Урок</p>' +
      '<span style="background-color:#fff">выделение</span></div>',
    'комментарии': '<div class="comments-card"><div class="public-DraftEditor-content" ' +
      'contenteditable="true"><p>черновик</p></div>' +
      '<button class="comments-card__footer-button">Ответить</button></div>',
    'квиз': '<div class="quiz"><div class="quiz__answers">' +
      '<button class="quiz__answer">Вариант</button></div></div>',
    'каталог': '<div class="catalog"><div class="course-card"></div>' +
      '<div class="learn-last-activity-card" data-theme="light">Карточка</div></div>',
    'уведомления': '<div class="notifications"><button class="btn btn-primary">' +
      'Пометить все как прочитанные</button></div>',
  };

  /* Мусор в CSS, который означает сломанную сборку темы: undefined вместо цвета
     означает, что в палитре не хватает поля. */
  const GARBAGE = /undefined|NaN|\[object Object\]/;

  for (const [pageName, body] of Object.entries(PAGES)) {
    const dom = new JSDOM(
      '<!doctype html><html><head></head><body>' + body + '</body></html>',
      { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://stepik.org/course/1/lesson/1' }
    );
    const { window } = dom;
    const windowErrors = [];
    window.addEventListener('error', (e) => windowErrors.push(e.error?.stack || e.message));

    /* Скрипт вешает init на DOMContentLoaded, поэтому ждём готовности
     документа, иначе переключатель ещё не смонтирован. */
    await new Promise((resolve) => {
      if (window.document.readyState === 'complete') return resolve();
      window.addEventListener('load', resolve);
      setTimeout(resolve, 3000);
    });

    let threw = null;
    try {
      window.eval(src);
    } catch (e) {
      threw = e.message;
    }
    await new Promise((r) => setTimeout(r, 120));

    if (threw) fail('[' + pageName + '] скрипт упал при запуске: ' + threw);

    const doc = window.document;
    const panel = doc.getElementById('sk-dark-theme-panel');
    if (!panel) {
      fail('[' + pageName + '] переключатель тем не смонтирован — скрипт отработал, но пикера нет');
      report.pages.push({ page: pageName, ok: false });
      window.close();
      continue;
    }

    const items = [...panel.querySelectorAll('.sk-item')];
    const ids = items.map((b) => b.getAttribute('data-sk-theme-id'));
    if (!ids.includes('')) {
      fail('[' + pageName + '] в пикере нет пункта «выключить тему»');
    }

    for (const id of ids) {
      const item = items.find((b) => b.getAttribute('data-sk-theme-id') === id);
      item.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

      const rootAttr = doc.documentElement.getAttribute('data-sk-theme');
      const bodyAttr = doc.body.getAttribute('data-theme');
      /* Стиль создаётся лениво — при первом применении темы, поэтому ищем
         заново на каждой итерации, а не держим ссылку. */
      const styleEl = doc.getElementById('sk-dark-theme-style');
      const css = styleEl ? styleEl.textContent : '';
      const garbage = GARBAGE.exec(css);

      const entry = { page: pageName, theme: id || '(off)', cssLen: css.length, ok: true };
      const bad = (m) => { entry.ok = false; fail('[' + pageName + '] тема ' + (id || '(off)') + ': ' + m); };

      if (id) {
        if (rootAttr !== id) bad('не выставился html[data-sk-theme] (получено «' + rootAttr + '»)');
        if (bodyAttr !== 'night') bad('не выставился body[data-theme=night] (получено «' + bodyAttr + '»)');
        if (!styleEl) bad('не создан <style id="sk-dark-theme-style">');
        else if (css.length < 1000) bad('CSS почти пуст (' + css.length + ' байт) — тема не применилась');
        if (garbage) bad('в CSS попал мусор «' + garbage[0] + '»');
      } else {
        if (rootAttr !== null) bad('пункт «выключить» не снял html[data-sk-theme]');
        if (bodyAttr !== null) bad('пункт «выключить» не снял body[data-theme]');
        if (css !== '') bad('пункт «выключить» не очистил CSS');
      }
      report.themes.push(entry);
    }

    if (windowErrors.length) {
      windowErrors.slice(0, 3).forEach((e) =>
        fail('[' + pageName + '] ошибка в окне: ' + String(e).split('\n')[0]));
    }
    report.pages.push({ page: pageName, ok: true, themes: ids.length - 1 });
    window.close();
  }

  const applied = report.themes.filter((t) => t.ok).length;
  note('функциональная проверка: ' + applied + '/' + report.themes.length + ' применений тем, страниц ' + report.pages.length);
}

/* ------------------------------------------------- итог */

const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
console.log('\n  Проверка ' + pad('stepik-dark-themes.user.js', 30) + '@' + (globalThis.__version || '?') + '\n');
notes.forEach((n) => console.log('  ok    ' + n));
warnings.forEach((w) => console.log('  warn  ' + w));
errors.forEach((e) => console.log('  FAIL  ' + e));
console.log('');

if (JSON_OUT) {
  writeFileSyncSafe(join(ROOT, 'check-report.json'), JSON.stringify({ errors, warnings, notes, report }, null, 2));
}

if (errors.length) {
  console.log('  ИТОГ: ' + errors.length + ' ошибок(и) — версия не готова к выпуску\n');
  process.exit(1);
}
console.log('  ИТОГ: скрипт работоспособен, можно выпускать версию\n');
process.exit(0);

function writeFileSyncSafe(p, data) {
  try {
    import('node:fs').then((fs) => fs.writeFileSync(p, data));
  } catch { /* отчёт не критичен */ }
}