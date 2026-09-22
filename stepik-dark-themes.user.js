// ==UserScript==
// @name         Stepik Dark Themes — фирменная ночная + Catppuccin, Kate & Tango
// @namespace    https://github.com/als/stepik-dark-themes
// @version      2.9.3
// @description  Тёмные темы для stepik.org. Скрипт принудительно включает штатную ночную тему Stepik (body[data-theme="night"]) и перекрашивает её дизайн-токены (--theme-color-*): фирменная Stepik Night (по умолчанию), Stepik Night Deep, Catppuccin (Mocha/Macchiato/Frappe), Kate (Breeze Dark/Oblivion), Linux.org.ru (Tango). Без «универсальной сетки», поэтому иконки, бейджи, прогресс-бары и плеер не ломаются. Плавающий переключатель тем, выбор запоминается.
// @author       als
// @match        https://stepik.org/*
// @match        https://www.stepik.org/*
// @match        https://*.stepik.org/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /* ============================================================
   *  Вспомогательные функции цвета
   * ============================================================ */

  function rgba(hex, a) {
    const h = String(hex || '#888888').replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function hexOf(c) {
    if (c && c[0] === '#') return c;
    return '#888888';
  }

  /* ============================================================
   *  Палитры
   *
   *  Две формы темы:
   *   - «фирменные» (stepik-night, stepik-night-deep) — готовый
   *     словарь tokens: точные значения ночных токенов stepik.org;
   *   - «палитровые» (catppuccin/kate/linuxorg) — семантические поля `sem`,
   *     из которых при генерации собираются те же токены.
   *  Общие переменные --sk-* нужны для точечных заплаток и UI
   *  переключателя (они не трогают страницу, только читаются нами).
   * ============================================================ */

  const THEMES = {

    /* ------------------------------------------------ Фирменная */
    'stepik-night': {
      name: 'Stepik Night (фирменная)',
      source: 'официальная ночная тема stepik.org',
      desc: 'Точные фирменные токены ночной темы Stepik',
      swatches: ['#141525', '#EEEEF0', '#56A4FF'],
      sk: {
        bg: '#141525', bgAlt: '#1F1F2F', panel: '#282B41', panel2: '#353547',
        surface2: '#282B41',
        border: '#3F3F3F', border2: '#535366',
        fg: '#EEEEF0', fg2: '#AFAEC4', fg3: '#8E8EA3', fgMuted: '#66667A',
        accent: '#66CC66', accentDark: '#288B28',
        accent2: '#7888EE', accent2Dark: '#5B6EE2',
        blue: '#56A4FF', blueDark: '#4485ED',
        danger: '#FF7A65', dangerDark: '#ED4E4E',
        warning: '#FFD481', warningDark: '#F1A53C',
        success: '#83D683',
        onSurface: '#141525', selection: '#2E3140',
        codeBg: '#0C0D16', codeGutter: '#1F1F2F', codeFg: '#E8E9F0',
        codeComment: '#6E7084', codeKeyword: '#98A0E8', codeString: '#8FDC8F',
        codeNumber: '#FFB86C', codeFunction: '#79C0FF', codeType: '#FFD481',
        codeOperator: '#56A4FF', codeLineno: '#535366', codeCursor: '#F2F2F7',
      },
      tokens: {
        '--theme-color-fg-primary': '#EEEEF0',
        '--theme-color-fg-secondary': '#AFAEC4',
        '--theme-color-fg-tertiary': '#8E8EA3',
        '--theme-color-fg-additional': '#FBFBFB',
        '--theme-color-fg-oncolorbg': '#141525',
        '--theme-color-fg-onsurface-primary': '#141525',
        '--theme-color-fg-onsurface-secondary-0d6': 'rgba(20, 21, 37, 0.6)',
        '--theme-color-fg-onsurface-additional-0d75': 'rgba(20, 21, 37, 0.75)',
        '--theme-color-fg-onsurface-accent': '#66CC66',
        '--theme-color-fg-onsurface-action': '#56A4FF',
        '--theme-color-bg-canvas': '#141525',
        '--theme-color-bg-level-00': '#1F1F2F',
        '--theme-color-bg-level-01': '#353547',
        '--theme-color-bg-level-02': '#535366',
        '--theme-color-bg-level-03': '#66667A',
        '--theme-color-bg-level-04': '#8E8EA3',
        '--theme-color-bg-note-error': 'rgba(255, 122, 101, 0.12)',
        '--theme-color-bg-note-warning': 'rgba(255, 212, 129, 0.12)',
        '--theme-color-bg-note-success': 'rgba(131, 214, 131, 0.12)',
        '--theme-color-bg-note-info': 'rgba(152, 160, 232, 0.12)',
        '--theme-color-bg-note-info2': 'rgba(86, 164, 255, 0.12)',
        '--theme-color-bg-accent-0d12': 'rgba(131, 214, 131, 0.12)',
        '--theme-color-bg-accent-0d38': 'rgba(131, 214, 131, 0.38)',
        '--theme-color-bg-alert': '#73134A',
        '--theme-color-bg-surface': '#282B41',
        '--theme-color-bg-surface-level-01': '#FBFBFB',
        '--theme-color-bg-surface2': '#EEEEF0',
        '--theme-color-bg-surface2-level-01': '#333333',
        '--theme-color-bg-surface2-level-02': '#D3D2E9',
        '--theme-color-bg-surface2-level-03': '#8E8EA3',
        '--theme-color-bg-separator': '#3F3F3F',
        '--theme-color-base-neutral-600': '#8E8EA3',
        '--theme-color-base-neutral-800': '#D3D2E9',
        '--theme-color-base-accent-00': '#1E2B2D',
        '--theme-color-base-accent-1': '#83D683',
        '--theme-color-base-accent-2': '#66CC66',
        '--theme-color-base-accent-3': '#288B28',
        '--theme-color-base-accent2-00': '#24263C',
        '--theme-color-base-accent2-1': '#98A0E8',
        '--theme-color-base-accent2-2': '#7888EE',
        '--theme-color-base-accent2-3': '#5B6EE2',
        '--theme-color-base-action-0': '#56A4FF',
        '--theme-color-base-action-1': '#56A4FF',
        '--theme-color-base-action-2': '#4485ED',
        '--theme-color-base-action-3': '#1466C6',
        '--theme-color-base-action-00': '#1C263F',
        '--theme-color-base-danger-1': '#FF7A65',
        '--theme-color-base-danger-2': '#ED4E4E',
        '--theme-color-base-warning-1': '#FFD481',
        '--theme-color-base-warning-2': '#F1A53C',
        '--theme-color-base-success-1': '#83D683',
        '--theme-color-base-success-2': '#66CC66',
        '--menu-background': 'var(--sk-panel)',
        '--menu-border': '1px solid var(--sk-border)',
        '--menu-box-shadow': '0 1px 5px 3px rgba(0, 0, 0, 0.45)',
        '--menu-item-color': 'var(--sk-fg-2)',
        '--menu-item-hover-color': 'var(--sk-fg)',
        '--menu-item-active-color': 'var(--sk-accent)',
        '--menu-item-background': 'none',
        '--menu-item-hover-background': 'var(--sk-panel-2)',
        '--menu-item-active-background': 'var(--sk-panel-2)',
        '--menu-item-divider-color': 'var(--sk-border)',
        '--menu-item-disabled-color': 'var(--sk-fg-muted)',
        '--custom-scrollbar-background': 'var(--sk-bg)',
        '--custom-scrollbar-thumb-color': 'var(--sk-border)',
        '--custom-scrollbar-thumb-hover-color': 'var(--sk-border-2)',
        '--custom-scrollbar-thumb-active-color': 'var(--sk-fg-muted)',
        '--progress-background': 'var(--sk-bg-alt)',
        '--progress-bar': 'var(--sk-accent)',
        '--pulsar-color': 'var(--sk-accent)',
        '--rating-stars-active-color': 'var(--sk-warning)',
        '--rating-stars-neutral-color': 'var(--sk-border)',
        '--focus-outline-color': 'rgba(100, 200, 255, 0.35)',
        '--stepik-loader-icon-bg-color': 'var(--sk-surface-2)',
        '--stepik-loader-icon-color': 'var(--sk-fg)',
        '--stepik-loader-text-color': 'var(--sk-fg-2)',
        '--form-radio-background-color': 'var(--sk-blue-dark)',
        '--feature-tariff-badge-bg': 'var(--sk-accent-2-tint)',
        '--feature-tariff-badge-fg': 'var(--sk-accent-2)',
        '--feature-tariff-badge-hem': 'var(--sk-accent-2-dark)',
        '--feature-tariff-badge-active-bg': 'var(--sk-accent-2)',
        '--feature-tariff-badge-active-fg': 'var(--sk-on-surface)',
        '--feature-tariff-badge-active-hem': 'var(--sk-accent-2-dark)'
      }
    },

    /* ---------------------------------------- Фирменная глубокое */
    'stepik-night-deep': {
      name: 'Stepik Night Deep',
      source: 'официальная ночная тема stepik.org (тёмный вариант)',
      desc: 'Фирменные цвета, канвас темнее и выше контраст',
      swatches: ['#0C0D17', '#F2F2F7', '#5DA3FF'],
      sk: {
        bg: '#0C0D17', bgAlt: '#151621', panel: '#1E1F2C', panel2: '#2C2D40',
        surface2: '#1E1F2C',
        border: '#34354C', border2: '#424359',
        fg: '#F2F2F7', fg2: '#C0C1D5', fg3: '#9B9CB4', fgMuted: '#8A8BA3',
        accent: '#6FCF6F', accentDark: '#2A9A2A',
        accent2: '#808EF4', accent2Dark: '#6173EA',
        blue: '#5DA3FF', blueDark: '#4C8CEF',
        danger: '#FF8070', dangerDark: '#F05858',
        warning: '#FFD98C', warningDark: '#F5AF4A',
        success: '#8FDC8F',
        onSurface: '#1A1B28', selection: '#33354B',
        codeBg: '#07080F', codeGutter: '#151621', codeFg: '#EEEEF4',
        codeComment: '#76778F', codeKeyword: '#A5ACF3', codeString: '#94E7A0',
        codeNumber: '#FFBE7A', codeFunction: '#85C6FF', codeType: '#FFDD99',
        codeOperator: '#6CB0FF', codeLineno: '#424359', codeCursor: '#F7F7FB',
      },
      tokens: {
        '--theme-color-fg-primary': '#F2F2F7',
        '--theme-color-fg-secondary': '#C0C1D5',
        '--theme-color-fg-tertiary': '#9B9CB4',
        '--theme-color-fg-additional': '#C6C7DB',
        '--theme-color-fg-oncolorbg': '#1A1B28',
        '--theme-color-fg-onsurface-primary': '#F2F2F7',
        '--theme-color-fg-onsurface-secondary-0d6': 'rgba(242, 242, 247, 0.6)',
        '--theme-color-fg-onsurface-additional-0d75': 'rgba(242, 242, 247, 0.75)',
        '--theme-color-fg-onsurface-accent': '#6FCF6F',
        '--theme-color-fg-onsurface-action': '#6CB0FF',
        '--theme-color-bg-canvas': '#0C0D17',
        '--theme-color-bg-level-00': '#151621',
        '--theme-color-bg-level-01': '#1E1F2C',
        '--theme-color-bg-level-02': '#2C2D40',
        '--theme-color-bg-level-03': '#3B3C54',
        '--theme-color-bg-level-04': '#70718C',
        '--theme-color-bg-note-error': 'rgba(255, 128, 112, 0.12)',
        '--theme-color-bg-note-warning': 'rgba(255, 217, 140, 0.12)',
        '--theme-color-bg-note-success': 'rgba(143, 220, 143, 0.12)',
        '--theme-color-bg-note-info': 'rgba(159, 167, 240, 0.12)',
        '--theme-color-bg-note-info2': 'rgba(109, 176, 255, 0.12)',
        '--theme-color-bg-accent-0d12': 'rgba(143, 220, 143, 0.12)',
        '--theme-color-bg-accent-0d38': 'rgba(143, 220, 143, 0.38)',
        '--theme-color-bg-alert': '#7A1952',
        '--theme-color-bg-surface': '#1A1B28',
        '--theme-color-bg-surface-level-01': '#1A1B28',
        '--theme-color-bg-surface2': '#23243A',
        '--theme-color-bg-surface2-level-01': '#2C2D40',
        '--theme-color-bg-surface2-level-02': '#3B3C54',
        '--theme-color-bg-surface2-level-03': '#70718C',
        '--theme-color-bg-separator': '#34354C',
        '--theme-color-base-neutral-600': '#8A8BA3',
        '--theme-color-base-neutral-800': '#BFC0D4',
        '--theme-color-base-accent-00': '#12201F',
        '--theme-color-base-accent-1': '#8FDC8F',
        '--theme-color-base-accent-2': '#6FCF6F',
        '--theme-color-base-accent-3': '#2A9A2A',
        '--theme-color-base-accent2-00': '#23263C',
        '--theme-color-base-accent2-1': '#9FA7F0',
        '--theme-color-base-accent2-2': '#808EF4',
        '--theme-color-base-accent2-3': '#6173EA',
        '--theme-color-base-action-0': '#6CB0FF',
        '--theme-color-base-action-1': '#5DA3FF',
        '--theme-color-base-action-2': '#4C8CEF',
        '--theme-color-base-action-3': '#1A70D6',
        '--theme-color-base-action-00': '#131E35',
        '--theme-color-base-danger-1': '#FF8070',
        '--theme-color-base-danger-2': '#F05858',
        '--theme-color-base-warning-1': '#FFD98C',
        '--theme-color-base-warning-2': '#F5AF4A',
        '--theme-color-base-success-1': '#8FDC8F',
        '--theme-color-base-success-2': '#6FCF6F',
        '--menu-background': 'var(--sk-panel)',
        '--menu-border': '1px solid var(--sk-border)',
        '--menu-box-shadow': '0 1px 5px 3px rgba(0, 0, 0, 0.5)',
        '--menu-item-color': 'var(--sk-fg-2)',
        '--menu-item-hover-color': 'var(--sk-fg)',
        '--menu-item-active-color': 'var(--sk-accent)',
        '--menu-item-background': 'none',
        '--menu-item-hover-background': 'var(--sk-panel-2)',
        '--menu-item-active-background': 'var(--sk-panel-2)',
        '--menu-item-divider-color': 'var(--sk-border)',
        '--menu-item-disabled-color': 'var(--sk-fg-muted)',
        '--custom-scrollbar-background': 'var(--sk-bg)',
        '--custom-scrollbar-thumb-color': 'var(--sk-border)',
        '--custom-scrollbar-thumb-hover-color': 'var(--sk-border-2)',
        '--custom-scrollbar-thumb-active-color': 'var(--sk-fg-muted)',
        '--progress-background': 'var(--sk-bg-alt)',
        '--progress-bar': 'var(--sk-accent)',
        '--pulsar-color': 'var(--sk-accent)',
        '--rating-stars-active-color': 'var(--sk-warning)',
        '--rating-stars-neutral-color': 'var(--sk-border)',
        '--focus-outline-color': 'rgba(100, 200, 255, 0.35)',
        '--stepik-loader-icon-bg-color': 'var(--sk-surface-2)',
        '--stepik-loader-icon-color': 'var(--sk-fg)',
        '--stepik-loader-text-color': 'var(--sk-fg-2)',
        '--form-radio-background-color': 'var(--sk-blue-dark)',
        '--feature-tariff-badge-bg': 'var(--sk-accent-2-tint)',
        '--feature-tariff-badge-fg': 'var(--sk-accent-2)',
        '--feature-tariff-badge-hem': 'var(--sk-accent-2-dark)',
        '--feature-tariff-badge-active-bg': 'var(--sk-accent-2)',
        '--feature-tariff-badge-active-fg': 'var(--sk-on-surface)',
        '--feature-tariff-badge-active-hem': 'var(--sk-accent-2-dark)'
      }
    },

    /* --------------------------------------------- Catppuccin */
    'catppuccin-mocha': {
      name: 'Catppuccin Mocha',
      source: 'Catppuccin (тёмная серия)',
      desc: 'Тёплый тёмный, основной вариант Catppuccin',
      swatches: ['#1e1e2e', '#cba6f7', '#a6e3a1'],
      sem: {
        bg: '#1e1e2e', bgAlt: '#181825', panel: '#181825', panel2: '#313244',
        border: '#45475a', border2: '#585b70',
        fg: '#cdd6f4', fg2: '#bac2de', fg3: '#a6adc8', fgMuted: '#7f849c', ink: '#11111b',
        accent: '#a6e3a1', accentBright: '#a6e3a1', accentDark: '#94e2d5',
        accent2: '#cba6f7', accent2Bright: '#cba6f7', accent2Dark: '#b4befe',
        blue: '#89b4fa', blueBright: '#89b4fa', blueDark: '#74c7ec', blueDeep: '#5b8ff4',
        danger: '#f38ba8', dangerDark: '#eba0ac', warning: '#f9e2af', warningDark: '#fab387',
        success: '#a6e3a1', successDark: '#94e2d5',
        surface: '#1b1b2a', surface2: '#26263a', separator: '#45475a', selection: '#585b70',
        codeBg: '#11111b', codeGutter: '#181825', codeFg: '#cdd6f4',
        codeComment: '#6c7086', codeKeyword: '#f5c2e7', codeString: '#a6e3a1',
        codeNumber: '#fab387', codeFunction: '#89b4fa', codeType: '#f9e2af',
        codeOperator: '#94e2d5', codeLineno: '#585b70', codeCursor: '#f5e0dc'
      }
    },

    'catppuccin-macchiato': {
      name: 'Catppuccin Macchiato',
      source: 'Catppuccin (тёмная серия)',
      desc: 'Чуть холоднее и светлее Mocha',
      swatches: ['#24273a', '#c6a0f6', '#a6da95'],
      sem: {
        bg: '#24273a', bgAlt: '#1e2030', panel: '#1e2030', panel2: '#363a4f',
        border: '#494d64', border2: '#5b6078',
        fg: '#cad3f5', fg2: '#b8c0e0', fg3: '#a5adcb', fgMuted: '#8087a2', ink: '#181926',
        accent: '#a6da95', accentBright: '#a6da95', accentDark: '#8bd5ca',
        accent2: '#c6a0f6', accent2Bright: '#c6a0f6', accent2Dark: '#b7bdf8',
        blue: '#8aadf4', blueBright: '#8aadf4', blueDark: '#7dc4e4', blueDeep: '#5c8df0',
        danger: '#ed8796', dangerDark: '#ee99a0', warning: '#eed49f', warningDark: '#f5a97f',
        success: '#a6da95', successDark: '#8bd5ca',
        surface: '#1f2133', surface2: '#2c3044', separator: '#494d64', selection: '#5b6078',
        codeBg: '#181926', codeGutter: '#1e2030', codeFg: '#cad3f5',
        codeComment: '#6e738d', codeKeyword: '#f5bde6', codeString: '#a6da95',
        codeNumber: '#f5a97f', codeFunction: '#8aadf4', codeType: '#eed49f',
        codeOperator: '#8bd5ca', codeLineno: '#5b6078', codeCursor: '#f4dbd6'
      }
    },

    'catppuccin-frappe': {
      name: 'Catppuccin Frappe',
      source: 'Catppuccin (тёмная серия)',
      desc: 'Тёмный с лёгким «задымлённым» оттенком',
      swatches: ['#303446', '#ca9ee6', '#a6d189'],
      sem: {
        bg: '#303446', bgAlt: '#292c3c', panel: '#292c3c', panel2: '#414559',
        border: '#51576d', border2: '#626880',
        fg: '#c6d0f5', fg2: '#b5bfe2', fg3: '#a5adce', fgMuted: '#8c91b4', ink: '#232634',
        accent: '#a6d189', accentBright: '#a6d189', accentDark: '#81c8be',
        accent2: '#ca9ee6', accent2Bright: '#ca9ee6', accent2Dark: '#babbf1',
        blue: '#8caaee', blueBright: '#8caaee', blueDark: '#85c1dc', blueDeep: '#5f8ae9',
        danger: '#e78284', dangerDark: '#ea999c', warning: '#e5c890', warningDark: '#ef9f76',
        success: '#a6d189', successDark: '#81c8be',
        surface: '#2b2f41', surface2: '#383d52', separator: '#51576d', selection: '#626880',
        codeBg: '#232634', codeGutter: '#292c3c', codeFg: '#c6d0f5',
        codeComment: '#737994', codeKeyword: '#f4b8e4', codeString: '#a6d189',
        codeNumber: '#ef9f76', codeFunction: '#8caaee', codeType: '#e5c890',
        codeOperator: '#81c8be', codeLineno: '#626880', codeCursor: '#f2d5cf'
      }
    },

    /* --------------------------------------------------- Kate */
    'kate-breeze-dark': {
      name: 'Kate Breeze Dark',
      source: 'редактор Kate (KSyntaxHighlighting)',
      desc: 'Официальная тёмная тема Kate/KDE, акцент #3daee9',
      swatches: ['#232629', '#56bdf4', '#27ae60'],
      sem: {
        bg: '#232629', bgAlt: '#202225', panel: '#2a2e32', panel2: '#31363b',
        border: '#3f4347', border2: '#4a5057',
        fg: '#cfcfc2', fg2: '#a5a6a8', fg3: '#7a7c7d', fgMuted: '#8b8e90', ink: '#181a1c',
        accent: '#27ae60', accentBright: '#3ecf6f', accentDark: '#1e8f4e',
        accent2: '#9b59b6', accent2Bright: '#c39bd3', accent2Dark: '#7d3d99',
        blue: '#3daee9', blueBright: '#56bdf4', blueDark: '#2980b9', blueDeep: '#1a5e8a',
        danger: '#da4453', dangerDark: '#e74c5a', warning: '#fdbc4b', warningDark: '#f67400',
        success: '#27ae60', successDark: '#1e8f4e',
        surface: '#26292c', surface2: '#2f3338', separator: '#3f4347', selection: '#2d5c76',
        codeBg: '#232629', codeGutter: '#31363b', codeFg: '#cfcfc2',
        codeComment: '#7a7c7d', codeKeyword: '#efc9a0', codeString: '#f44f4f',
        codeNumber: '#f67400', codeFunction: '#8e44ad', codeType: '#2980b9',
        codeOperator: '#3f8058', codeLineno: '#7a7c7d', codeCursor: '#3daee9'
      }
    },

    'kate-oblivion': {
      name: 'Kate Oblivion',
      source: 'редактор Kate (адаптация GtkSourceView)',
      desc: 'Классическая тёмная схема Oblivion, жёлто-зелёная',
      swatches: ['#201f1f', '#87b5e0', '#edd400'],
      sem: {
        bg: '#201f1f', bgAlt: '#1a1919', panel: '#2e3436', panel2: '#302f2f',
        border: '#3c3a3a', border2: '#4c4a4a',
        fg: '#d3d7c1', fg2: '#eeeeec', fg3: '#a9b2a0', fgMuted: '#8f8f86', ink: '#141414',
        accent: '#8ae234', accentBright: '#a4f14a', accentDark: '#4e9a06',
        accent2: '#ad7fa8', accent2Bright: '#d0a9cb', accent2Dark: '#8e5f8f',
        blue: '#729fcf', blueBright: '#87b5e0', blueDark: '#508ed8', blueDeep: '#3465a4',
        danger: '#e85848', dangerDark: '#f15b4a', warning: '#fce94f', warningDark: '#ce5c00',
        success: '#4e9a06', successDark: '#3a7804',
        surface: '#242424', surface2: '#303434', separator: '#3c3a3a', selection: '#184880',
        codeBg: '#201f1f', codeGutter: '#302f2f', codeFg: '#d3d7c1',
        codeComment: '#4e9a06', codeKeyword: '#ffffff', codeString: '#edd400',
        codeNumber: '#fce94f', codeFunction: '#729fcf', codeType: '#508ed8',
        codeOperator: '#eeeeec', codeLineno: '#e0dedb', codeCursor: '#ffffff'
      }
    },

    /* --------------------------------------------- Linux.org.ru */
    /* Палитра Tango (Tango Desktop Project), которую использует
     * linux.org.ru: графитовая подложка #2e3436, лаймовый акцент
     * #8ae234 (signature-user-color) и небесно-синие ссылки #729fcf.
     * Цвета синтаксиса — тёмная схема LOR (One Dark). */
    'linuxorg': {
      name: 'Linux.org.ru (Tango)',
      source: 'linux.org.ru, тёмная тема (палитра Tango)',
      desc: 'Графит Tango: лаймовый и небесно-синий акценты, тёплый текст',
      swatches: ['#2e3436', '#8ae234', '#729fcf'],
      sem: {
        bg: '#2e3436', bgAlt: '#262b2c', panel: '#262b2c', panel2: '#3a4143',
        border: '#555753', border2: '#6b6f6b',
        fg: '#d3d7cf', fg2: '#babdb6', fg3: '#9fa29c', fgMuted: '#7d807b', ink: '#171b1c',
        accent: '#8ae234', accentBright: '#9be94f', accentDark: '#4e9a06',
        accent2: '#ad7fa8', accent2Bright: '#c9a0c4', accent2Dark: '#75507b',
        blue: '#729fcf', blueBright: '#8bb8e8', blueDark: '#3465a4', blueDeep: '#204a87',
        danger: '#ef2929', dangerDark: '#cc0000', warning: '#fcaf3e', warningDark: '#f57900',
        success: '#8ae234', successDark: '#4e9a06',
        surface: '#2a3031', surface2: '#343b3d', separator: '#555753', selection: '#3465a4',
        codeBg: '#232829', codeGutter: '#2e3436', codeFg: '#babdb6',
        codeComment: '#5c6370', codeKeyword: '#c678dd', codeString: '#98c379',
        codeNumber: '#d19a66', codeFunction: '#61aeee', codeType: '#e6c07b',
        codeOperator: '#56b6c2', codeLineno: '#5c6370', codeCursor: '#abb2bf'
      }
    }
  };

  /* ============================================================
   *  Сборка токенов
   * ============================================================ */

  /* Из семантических полей палитры (catppuccin/kate) собираем
   * словарь токенов --theme-color-*, эквивалентный фирменному. */
  function buildTokens(s) {
    return {
      '--theme-color-fg-primary': s.fg,
      '--theme-color-fg-secondary': s.fg2,
      '--theme-color-fg-tertiary': s.fg3,
      '--theme-color-fg-additional': s.fg2,
      '--theme-color-fg-oncolorbg': s.ink,
      '--theme-color-fg-onsurface-primary': s.fg,
      '--theme-color-fg-onsurface-secondary-0d6': rgba(hexOf(s.fg), 0.6),
      '--theme-color-fg-onsurface-additional-0d75': rgba(hexOf(s.fg), 0.75),
      '--theme-color-fg-onsurface-accent': s.accentBright,
      '--theme-color-fg-onsurface-action': s.blueBright,
      '--theme-color-bg-canvas': s.bg,
      '--theme-color-bg-level-00': s.bgAlt,
      '--theme-color-bg-level-01': s.panel,
      '--theme-color-bg-level-02': s.border,
      '--theme-color-bg-level-03': s.border2,
      '--theme-color-bg-level-04': s.fgMuted,
      '--theme-color-bg-note-error': rgba(hexOf(s.danger), 0.12),
      '--theme-color-bg-note-warning': rgba(hexOf(s.warning), 0.12),
      '--theme-color-bg-note-success': rgba(hexOf(s.success), 0.12),
      '--theme-color-bg-note-info': rgba(hexOf(s.accent2Bright), 0.12),
      '--theme-color-bg-note-info2': rgba(hexOf(s.blueBright), 0.12),
      '--theme-color-bg-accent-0d12': rgba(hexOf(s.accentBright), 0.12),
      '--theme-color-bg-accent-0d38': rgba(hexOf(s.accentBright), 0.38),
      '--theme-color-bg-alert': '#73134A',
      '--theme-color-bg-surface': s.surface,
      '--theme-color-bg-surface-level-01': s.surface,
      '--theme-color-bg-surface2': s.surface2,
      '--theme-color-bg-surface2-level-01': s.border,
      '--theme-color-bg-surface2-level-02': s.border2,
      '--theme-color-bg-surface2-level-03': s.fgMuted,
      '--theme-color-bg-separator': s.separator,
      '--theme-color-base-neutral-600': s.fgMuted,
      '--theme-color-base-neutral-800': s.fg3,
      '--theme-color-base-accent-00': rgba(hexOf(s.accentBright), 0.14),
      '--theme-color-base-accent-1': s.accentBright,
      '--theme-color-base-accent-2': s.accent,
      '--theme-color-base-accent-3': s.accentDark,
      '--theme-color-base-accent2-00': rgba(hexOf(s.accent2Bright), 0.14),
      '--theme-color-base-accent2-1': s.accent2Bright,
      '--theme-color-base-accent2-2': s.accent2,
      '--theme-color-base-accent2-3': s.accent2Dark,
      '--theme-color-base-action-0': s.blueBright,
      '--theme-color-base-action-1': s.blue,
      '--theme-color-base-action-2': s.blueDark,
      '--theme-color-base-action-3': s.blueDeep,
      '--theme-color-base-action-00': rgba(hexOf(s.blueBright), 0.14),
      '--theme-color-base-danger-1': s.danger,
      '--theme-color-base-danger-2': s.dangerDark,
      '--theme-color-base-warning-1': s.warning,
      '--theme-color-base-warning-2': s.warningDark,
      '--theme-color-base-success-1': s.success,
      '--theme-color-base-success-2': s.successDark,
      '--menu-background': 'var(--sk-panel)',
      '--menu-border': '1px solid var(--sk-border)',
      '--menu-box-shadow': '0 1px 5px 3px rgba(0, 0, 0, 0.45)',
      '--menu-item-color': 'var(--sk-fg-2)',
      '--menu-item-hover-color': 'var(--sk-fg)',
      '--menu-item-active-color': 'var(--sk-accent)',
      '--menu-item-background': 'none',
      '--menu-item-hover-background': 'var(--sk-panel-2)',
      '--menu-item-active-background': 'var(--sk-panel-2)',
      '--menu-item-divider-color': 'var(--sk-border)',
      '--menu-item-disabled-color': 'var(--sk-fg-muted)',
      '--custom-scrollbar-background': 'var(--sk-bg)',
      '--custom-scrollbar-thumb-color': 'var(--sk-border)',
      '--custom-scrollbar-thumb-hover-color': 'var(--sk-border-2)',
      '--custom-scrollbar-thumb-active-color': 'var(--sk-fg-muted)',
      '--progress-background': 'var(--sk-bg-alt)',
      '--progress-bar': 'var(--sk-accent)',
      '--progress-indeterminate-color-1': 'rgba(36, 96, 36, 0.5)',
      '--progress-indeterminate-color-2': 'rgba(233, 249, 233, 0.5)',
      '--pulsar-color': 'var(--sk-accent)',
      '--rating-stars-active-color': 'var(--sk-warning)',
      '--rating-stars-neutral-color': 'var(--sk-border)',
      '--focus-outline-color': 'rgba(100, 200, 255, 0.35)',
      '--stepik-loader-icon-bg-color': 'var(--sk-surface-2)',
      '--stepik-loader-icon-color': 'var(--sk-fg)',
      '--stepik-loader-text-color': 'var(--sk-fg-2)',
      '--form-radio-background-color': 'var(--sk-blue-dark)',
      '--feature-tariff-badge-bg': 'var(--sk-accent-2-tint)',
      '--feature-tariff-badge-fg': 'var(--sk-accent-2)',
      '--feature-tariff-badge-hem': 'var(--sk-accent-2-dark)',
      '--feature-tariff-badge-active-bg': 'var(--sk-accent-2)',
      '--feature-tariff-badge-active-fg': 'var(--sk-on-surface)',
      '--feature-tariff-badge-active-hem': 'var(--sk-accent-2-dark)'
    };
  }

  function themeTokens(t) {
    if (t.tokens) return t.tokens;
    if (t.sem) return buildTokens(t.sem);
    return {};
  }

  /* Полный словарь --sk-* для темы (patches + UI). Для семантических
   * тем sk собираем из sem автоматически. */
  function themeSk(t) {
    if (t.sk) return t.sk;
    const s = t.sem;
    return {
      bg: s.bg, bgAlt: s.bgAlt, panel: s.panel, panel2: s.panel2,
      surface2: s.surface2,
      border: s.border, border2: s.border2,
      fg: s.fg, fg2: s.fg2, fg3: s.fg3, fgMuted: s.fgMuted,
      accent: s.accent, accentDark: s.accentDark,
      accent2: s.accent2, accent2Dark: s.accent2Dark,
      blue: s.blue, blueDark: s.blueDark,
      danger: s.danger, dangerDark: s.dangerDark,
      warning: s.warning, warningDark: s.warningDark,
      success: s.success,
      onSurface: s.ink, selection: s.selection,
      codeBg: s.codeBg, codeGutter: s.codeGutter, codeFg: s.codeFg,
      codeComment: s.codeComment, codeKeyword: s.codeKeyword, codeString: s.codeString,
      codeNumber: s.codeNumber, codeFunction: s.codeFunction, codeType: s.codeType,
      codeOperator: s.codeOperator, codeLineno: s.codeLineno, codeCursor: s.codeCursor
    };
  }

  function tokenLines(map) {
    return Object.keys(map)
      .map((k) => `  ${k}:${map[k]} !important;`)
      .join('\n');
  }

  /* ============================================================
   *  Генерация CSS темы
   * ============================================================ */

  function skCss(id, t) {
    const s = themeSk(t);
    return `html[data-sk-theme="${id}"] {
  color-scheme: dark;
  background-color: var(--sk-bg);
  --sk-bg:${s.bg}; --sk-bg-alt:${s.bgAlt}; --sk-panel:${s.panel}; --sk-panel-2:${s.panel2};
  --sk-surface-2:${s.surface2};
  --sk-border:${s.border}; --sk-border-2:${s.border2};
  --sk-fg:${s.fg}; --sk-fg-2:${s.fg2}; --sk-fg-3:${s.fg3}; --sk-fg-muted:${s.fgMuted};
  --sk-accent:${s.accent}; --sk-accent-dark:${s.accentDark};
  --sk-accent-2:${s.accent2}; --sk-accent-2-dark:${s.accent2Dark}; --sk-accent-2-tint:${rgba(hexOf(s.accent2), 0.14)};
  --sk-blue:${s.blue}; --sk-blue-dark:${s.blueDark};
  --sk-danger:${s.danger}; --sk-danger-dark:${s.dangerDark};
  --sk-warning:${s.warning}; --sk-warning-dark:${s.warningDark}; --sk-success:${s.success};
  --sk-on-surface:${s.onSurface}; --sk-selection:${s.selection};
  --sk-code-bg:${s.codeBg}; --sk-code-gutter:${s.codeGutter}; --sk-code-fg:${s.codeFg};
  --sk-code-comment:${s.codeComment}; --sk-code-keyword:${s.codeKeyword}; --sk-code-string:${s.codeString};
  --sk-code-number:${s.codeNumber}; --sk-code-function:${s.codeFunction}; --sk-code-type:${s.codeType};
  --sk-code-operator:${s.codeOperator}; --sk-code-lineno:${s.codeLineno}; --sk-code-cursor:${s.codeCursor};
  --sk-code-selection:${rgba(hexOf(s.selection), 0.55)};
${tokenLines(themeTokens(t))}
}
html[data-sk-theme="${id}"] body[data-theme="night"] {
${tokenLines(themeTokens(t))}
}`;
  }

  /* ============================================================
   *  Точечные заплатки.
   *
   *  Только для того, что Stepik красит хардкодом НЕ через токены
   *  (меню, скроллбары, редактор кода, логотипы, marco-layout).
   *  УНИВЕРСАЛЬНОЙ СЕТКИ НЕТ: фон и цвет каждого элемента берет
   *  штатная ночная тема Stepik, а не мы.
   * ============================================================ */

  const SK = 'html[data-sk-theme]';

  function coreCss() {
    return `
/* ================= ОСНОВА ================= */
${SK} body {
  background-color: var(--sk-bg) !important;
  color: var(--sk-fg) !important;
  color-scheme: dark !important;
}
${SK} ::selection { background: var(--sk-selection); color: var(--sk-fg) !important; }
${SK} input, ${SK} textarea, ${SK} select { caret-color: var(--sk-fg) !important; }
${SK} input[type="checkbox"], ${SK} input[type="radio"] {
  accent-color: var(--sk-accent) !important;
}
/* скелетоны загрузки (сток: белый #fff → серый #ddd градиент) */
${SK} [data-skeleton] {
  --skeleton-color-1: var(--sk-panel-2) !important;
  --skeleton-color-2: var(--sk-border) !important;
}

/* ================= ВЫПАДАЮЩИЕ МЕНЮ / РУБРИКАТОР / ПОИСК =================
   Stepik красит их хардкодом --menu-background:#fff; ночная тема
   лечится отдельными классами (_dark), но чтобы работало всегда,
   форсируем переменные меню прямо здесь. */
${SK} .static-menu, ${SK} .drop-down__body, ${SK} .drop-down__animation-layer,
${SK} .drop-down__inner, ${SK} .menu:not(.nav-menu), ${SK} .rubricator-plane,
${SK} .rubricator-dropdown__body, ${SK} .navbar__search-form_mobile {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
  --menu-background: var(--sk-panel) !important;
  --menu-border: 1px solid var(--sk-border) !important;
  --menu-box-shadow: 0 1px 5px 3px rgba(0, 0, 0, 0.45) !important;
  --menu-item-color: var(--sk-fg-2) !important;
  --menu-item-hover-color: var(--sk-fg) !important;
  --menu-item-active-color: var(--sk-accent) !important;
  --menu-item-background: none !important;
  --menu-item-hover-background: var(--sk-panel-2) !important;
  --menu-item-active-background: var(--sk-panel-2) !important;
  --menu-item-divider-color: var(--sk-border) !important;
  --menu-item-disabled-color: var(--sk-fg-muted) !important;
}
${SK} .nav-menu {
  background-color: var(--sk-surface-2) !important;
  color: var(--sk-fg-2) !important;
  --custom-scrollbar-background: var(--sk-bg) !important;
  --custom-scrollbar-thumb-color: var(--sk-border) !important;
}
/* активный пункт левого меню: сток задаёт --menu-item-selected-color
   из «тёмно-зелёного» --theme-color-base-accent-3 (#288b28), который на
   тёмной панели тусклый — поднимаем до яркого фирменного акцента */
${SK} .nav-menu,
${SK} .learn-nav__menu,
${SK} .teach-nav__menu {
  --menu-item-color: var(--sk-fg-2) !important;
  --menu-item-hover-color: var(--sk-fg) !important;
  --menu-item-active-color: var(--sk-accent) !important;
  --menu-item-selected-color: var(--sk-accent) !important;
  --menu-item-selected-hover-color: var(--sk-accent) !important;
  --menu-item-selected-active-color: var(--sk-accent) !important;
  --menu-item-selected-background: var(--sk-panel-2) !important;
  --menu-item-active-background: var(--sk-panel-2) !important;
  --menu-item-hover-background: var(--sk-panel-2) !important;
}

/* ================= СТРОКА ПОИСКА НА ГЛАВНОЙ / КАТАЛОГ =================
   .catalog__search-form в стоке — светлая плашка #f3f4f6 с белым полем
   ввода; красим как карточки: тёмная панель вокруг, поле и селекты
   на уровень глубже, светлый текст. */
${SK} .catalog__search-form {
  background-color: var(--sk-panel) !important;
}
/* поле поиска каталога: сток — белое #fff; правило общее, потому что на
   страницах разделов (/catalog/1) контейнер уже не .catalog__search-form */
${SK} input.search-form__input {
  background-color: var(--sk-bg-alt) !important;
  border-color: var(--sk-border) !important;
  color: var(--sk-fg) !important;
}
${SK} input.search-form__input::placeholder {
  color: var(--sk-fg-3) !important;
}
${SK} input.search-form__input:focus {
  background-color: var(--sk-bg-alt) !important;
  border-color: var(--sk-accent) !important;
}
${SK} .catalog__search-form .select-box button.select-box__toggle-btn,
${SK} .catalog__search-form .select-box .select-box__autowidth-measurer {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
}
${SK} .catalog__search-form .search-form__reset {
  color: var(--sk-fg-3) !important;
}
${SK} .catalog__search-form .search-form__reset:focus,
${SK} .catalog__search-form button.st-button_style_none.search-form__reset:hover {
  color: var(--sk-fg) !important;
}

/* ================= САЙДБАР ФИЛЬТРОВ КАТАЛОГА (/catalog/search) =================
   Сток хардкодит светлые цвета: заголовки фильтров #535366, подписи
   чекбоксов #222, подписи «От/До» #5E5E5E, тире #000, поля цены белые
   (#fff), пресеты светло-голубые, тумблеры #ddd/#fff. На тёмном фоне
   подписи сливались с фоном, а поля и тумблеры светились белым. */
${SK} .search-form-filter__title {
  color: var(--sk-fg-2) !important;
}
${SK} .form-checkbox {
  color: var(--sk-fg-2) !important;
}
${SK} .search-form-filter__range-item .the-form-field__caption,
${SK} .search-form-filter__range-sep {
  color: var(--sk-fg-3) !important;
}
${SK} .search-form-filter .st-input-wrapper {
  background-color: var(--sk-panel) !important;
  border-color: var(--sk-border) !important;
  color: var(--sk-fg) !important;
}
${SK} .search-form-filter .st-input-wrapper .st-input {
  color: var(--sk-fg) !important;
}
${SK} .search-form-filter .st-input-wrapper .st-input::placeholder {
  color: var(--sk-fg-3) !important;
}
${SK} .search-form-filter__range-presets-btn:not(.st-button_style_none) {
  background-color: var(--sk-panel-2) !important;
  border-color: transparent !important;
  color: var(--sk-blue) !important;
}
${SK} .search-form-filter__range-presets-btn:not(.st-button_style_none)[data-active] {
  background-color: var(--sk-accent) !important;
  border-color: var(--sk-accent) !important;
  color: var(--sk-on-surface) !important;
}
${SK} .search-form-filter .ui-toggler__toggle input + label {
  background-color: var(--sk-panel-2) !important;
}
${SK} .search-form-filter .ui-toggler__toggle input + label::before {
  background-color: var(--sk-panel-2) !important;
}
${SK} .search-form-filter .ui-toggler__toggle input + label::after {
  background-color: var(--sk-fg-2) !important;
}
${SK} .search-form-filter .ui-toggler__toggle input:checked + label::before {
  background-color: var(--sk-blue) !important;
}
${SK} .search-form-filter__toggler {
  --search-form-filter-arrow-normal-color: var(--sk-fg-3) !important;
  --search-form-filter-arrow-expanded-color: var(--sk-fg-2) !important;
  --search-form-filter-arrow-hover-color: var(--sk-fg) !important;
}
/* прочие поля ввода Stepik (сток — белые #fff), кроме строки поиска.
   Фон «чуть светлее» панели (panel-2), чтобы поле отличалось от канвы,
   и контур-кольцо вокруг поля (стоковые рамки нулевой ширины) */
${SK} .st-input-wrapper:not(.st-input-wrapper_type_search) {
  background-color: var(--sk-panel-2) !important;
  border-color: var(--sk-border) !important;
  color: var(--sk-fg) !important;
  box-shadow: 0 0 0 1px var(--sk-border) !important;
}
${SK} .st-input-wrapper:not(.st-input-wrapper_type_search) .st-input {
  color: var(--sk-fg) !important;
}

/* ================= СОЗДАНИЕ КУРСА (/teach/courses/new) =================
   Сток: поле «название курса» белое (#fafafa, тёмный текст), ссылки в
   описании — тёмные #222 («сделать курс платным», «Creative Commons»);
   на тёмной панели ссылки сливаются с фоном. */
${SK} .new-course-form__input {
  background-color: var(--sk-panel) !important;
  border-color: var(--sk-border) !important;
  color: var(--sk-fg) !important;
}
${SK} .new-course-form__input::placeholder {
  color: var(--sk-fg-3) !important;
}
${SK} .new-course-form__desc a {
  color: var(--sk-fg-2) !important;
  --link-color: var(--sk-fg-2) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-hover-line-color: var(--sk-accent) !important;
}
/* подписи полей форм: стоковые тёмные #222/#5E5E5E на тёмном фоне */
${SK} .the-form-field__caption {
  color: var(--sk-fg-2) !important;
}
${SK} .new-course-form__note {
  color: var(--sk-fg-3) !important;
}
/* подписи-подсказки форм преподавания (/teach/lessons и др.): сток красит
   тёмным #222/#5E5E5E — «Максимум 64 символа», «Для отправки платёжных
   документов» и т.п.; осветляем текстом темы */
${SK} .new-lesson-form__note,
${SK} .the-form-field__footnote {
  color: var(--sk-fg-2) !important;
}
/* боковые панели разделов «Моё обучение»/«Преподавание»/страницы курса:
   сток рисует прямоугольники во всю высоту колонки — скругляем как
   карточки (12px). .course-nav — левое меню страницы курса (/course/…
   /syllabus), раньше оставалось квадратным. */
${SK} .nav-menu,
${SK} .teachlearn__course-nav,
${SK} .learn-nav {
  border-radius: 12px !important;
}
${SK} .nav-menu.teach-nav,
${SK} .nav-menu.learn-nav,
${SK} .teachlearn__course-nav,
${SK} .learn-nav,
${SK} .nav-links-block {
  overflow: hidden !important;
}
/* ВНУТРЕННИЙ список пунктов боковой панели (.nav-menu__menu) лежит в уже
   скруглённой панели, но сам нарисован прямоугольной рамкой 1px (#3f3f3f)
   с тенью — внутри круглой панели торчат квадратные «уголки». Скругляем
   его так же и убираем рамку/тень: панель выглядит цельной карточкой. */
${SK} .nav-menu .nav-menu__menu {
  border-radius: 12px !important;
  overflow: hidden !important;
  border-color: transparent !important;
  box-shadow: none !important;
  /* наш общий блок меню (.menu:not(.nav-menu)) навешивает рамку и тень —
     для вложенного списка сайдбара они лишние, дают «квадратную» рамку */
  --menu-border: none !important;
  --menu-border-radius: 12px !important;
  --menu-box-shadow: none !important;
  --menu-background: transparent !important;
}
/* .course-nav — скроллируемое меню: сохраняем вертикальную прокрутку,
   скругляя только рамку (overflow-x: hidden уже клипует углы по радиусу) */
${SK} .nav-menu.course-nav {
  border-radius: 12px !important;
  overflow: hidden auto !important;
}

/* ================= РУБРИКАТОР КАТАЛОГА (дропдаун «Каталог» в шапке) =====
   Списки категорий нарисованы прямоугольными рамками (radius 0 / низ 4px),
   а области прокрутки оставляют белые «прорези» скроллбаров (#fff/#e6e9ed).
   Скругляем рамки как карточки, гасим скроллбары и не даём длинным
   названиям вылезать за границы. */
${SK} .rubricator-meta-category__course-lists,
${SK} .rubricator-subjects__menu {
  border-radius: 12px !important;
  overflow: hidden !important;
  /* стоковая тень меню (0 1px 5px 3px rgba(0,0,0,.45)) на тёмном фоне
     рисует тёмный ореол и «уголки» у скруглённых списков */
  box-shadow: none !important;
  border-color: transparent !important;
}
/* кнопка «Каталог» в раскрытом состоянии: сток берёт фон
   --theme-color-bg-surface2-level-02 и текст --theme-color-fg-onsurface-primary
   (#141525) — тёмным по тёмному; разводим пару */
${SK} .rubricator-dropdown__toggler,
${SK} [data-expanded] .rubricator-dropdown__toggler {
  --rubricator-toggler-color: var(--sk-fg-2) !important;
  --rubricator-toggler-bg-color: transparent !important;
}
${SK} [data-expanded] .rubricator-dropdown__toggler,
${SK} .rubricator-dropdown__toggler:hover,
${SK} .rubricator-dropdown__toggler[data-expanded] {
  --rubricator-toggler-color: var(--sk-fg) !important;
  --rubricator-toggler-bg-color: var(--sk-panel-2) !important;
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg) !important;
}
${SK} [data-expanded] .rubricator-dropdown__toggler .svg-icon,
${SK} .rubricator-dropdown__toggler:hover .svg-icon {
  color: var(--sk-fg) !important;
}
${SK} .rubricator-plane__subjects,
${SK} .rubricator-meta-categories__content,
${SK} .rubricator-meta-category__content {
  --custom-scrollbar-background: transparent !important;
  --custom-scrollbar-thumb-color: var(--sk-border-2) !important;
  --custom-scrollbar-thumb-hover-color: var(--sk-accent) !important;
  --custom-scrollbar-thumb-active-color: var(--sk-accent) !important;
}
${SK} .rubricator-meta-category__link,
${SK} .rubricator-meta-category__category {
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

/* ================= БЕЙДЖИ КУРСОВ =================
   «Черновик» в стоке — светло-серая плашка #999 с белым текстом;
   градиентные бейджи (basic/paid/private) — светло-градиентные. Гасим
   фон в панель, оставляя цветной текст, чтобы бейдж читался на карточке. */
${SK} .course-badge {
  --course-badge-default-bgi: none !important;
  --course-badge-default-bg: var(--sk-panel-2) !important;
  --course-badge-draft-bg: var(--sk-panel-2) !important;
  --course-badge-draft-bgi: none !important;
  --course-badge-draft-fg: var(--sk-fg-2) !important;
}

/* ================= АВАТАРЫ / РЕЙТИНГ В ПРОФИЛЕ =================
   Цифра оценки на аватаре в стоке тёмная (#141525) поверх тёмной плашки —
   не видна; аватары с прозрачным фоном сливаются с канвасом и нуждаются
   в тонкой контрастной рамке. */
${SK} .profile__rating,
${SK} .profile__rating .rating-badge__average,
${SK} .profile__rating .rating-badge__count,
${SK} .profile__rating .rating-badge__icon {
  --rating-badge-color: var(--sk-fg) !important;
  --rating-badge-count-color: var(--sk-fg-2) !important;
  --rating-badge-icon-color: var(--sk-warning) !important;
  color: var(--sk-fg) !important;
}
/* рамку рисуем тенью: не раздувает layout и повторяет border-radius */
${SK} .profile__avatar,
${SK} .profile-avatar,
${SK} .profile-summary__avatar,
${SK} .navbar__profile-img,
${SK} .comment__avatar,
${SK} .comments-user-badge__avatar,
${SK} .course-author__avatar,
${SK} .user-avatar,
${SK} .avatar {
  box-shadow: 0 0 0 1px var(--sk-border-2) !important;
}
/* обёртка .user-avatar сама по себе квадратная (border-radius:0), поэтому
   круглая рамка-тень выглядела как квадратное поле вокруг аватара.
   Скругляем обёртку и ссылку — тень повторяет круг, как у картинки. */
${SK} .user-avatar,
${SK} .user-avatar__link {
  border-radius: 50% !important;
}

/* ================= ТУЛТИПЫ / ПОПОВЕРЫ ================= */
${SK} .ember-tooltip, ${SK} .ember-popover:not(.ember-popover_dark),
${SK} .ui-tooltip, ${SK} .popper {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
  --arrow-color: var(--sk-panel) !important;
}
${SK} [data-tooltip]::after {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg) !important;
}

/* ================= СКРОЛЛБАРЫ ================= */
${SK} .custom-scrollbar {
  --custom-scrollbar-background: var(--sk-bg) !important;
  --custom-scrollbar-thumb-color: var(--sk-border) !important;
  --custom-scrollbar-thumb-hover-color: var(--sk-border-2) !important;
  --custom-scrollbar-thumb-active-color: var(--sk-fg-muted) !important;
}
${SK} ::-webkit-scrollbar { width: 10px; height: 10px; }
${SK} ::-webkit-scrollbar-track { background: var(--sk-bg); }
${SK} ::-webkit-scrollbar-thumb { background: var(--sk-border); border-radius: 5px; }
${SK} ::-webkit-scrollbar-thumb:hover { background: var(--sk-border-2); }
${SK} ::-webkit-scrollbar-corner { background: var(--sk-bg); }

/* ================= ШАПКА / ПОДВАЛ / ЛОАДЕР ================= */
/* фон шапки; background-image:none нужен, чтобы убрать чёрный градиент
   body[data-fullscreen][data-fullscreen-header-overlay] .main-header,
   который иначе рисуется поверх панели */
${SK} .main-header, ${SK} .navbar {
  background-color: var(--sk-panel) !important;
  background-image: none !important;
  border-color: var(--sk-border) !important;
}
/* кнопки в правом верхнем углу шапки: сердечко «В избранное» и счётчик
   стрика/прогресса. Стоковая ночная тема берёт фон #333
   (--theme-color-bg-surface2-level-01), а иконку/цифру — из
   --theme-color-fg-onsurface-primary (#141525), т.е. тёмным по тёмному.
   Разводим пару: фон — панель, иконка и текст — светлые. */
${SK} .navbar__wishlist-btn,
${SK} .learn-last-activity-dropdown__toggler {
  --wishlist-btn-bg-color: var(--sk-panel-2) !important;
  --wishlist-icon-color: var(--sk-fg) !important;
  --last-activity-toggler-bg-color: var(--sk-panel-2) !important;
  --last-activity-toggler-btn-color: var(--sk-fg) !important;
  --last-activity-toggler-counter-color: var(--sk-fg) !important;
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg) !important;
  border-color: transparent !important;
}
${SK} .navbar__wishlist-btn:hover,
${SK} .learn-last-activity-dropdown__toggler:hover,
${SK} .navbar__wishlist-btn:focus-visible,
${SK} .learn-last-activity-dropdown__toggler:focus-visible {
  --wishlist-btn-bg-color: var(--sk-border-2) !important;
  --wishlist-icon-color: var(--sk-fg) !important;
  --last-activity-toggler-bg-color: var(--sk-border-2) !important;
  --last-activity-toggler-btn-color: var(--sk-fg) !important;
  --last-activity-toggler-counter-color: var(--sk-fg) !important;
  background-color: var(--sk-border-2) !important;
  color: var(--sk-fg) !important;
}
${SK} .navbar__wishlist-btn .svg-icon,
${SK} .learn-last-activity-dropdown__toggler .svg-icon,
${SK} .learn-last-activity-dropdown__icon {
  color: var(--sk-fg) !important;
}
/* подвал: сток красит фон хардкодом (#f6f6f6 у modern-варианта, тёмные
   ссылки #222), поэтому перекрываем фон и все тексты внутри */
${SK} .page-footer, ${SK} .page_footer, ${SK} .page-footer-modern,
${SK} footer:not([class*="lesson"]) {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg-2) !important;
  border-color: var(--sk-border) !important;
}
${SK} .page-footer__years,
${SK} .page-footer__col.page-footer__counters.page-footer__list,
${SK} .page-footer__list a, ${SK} .page-footer__email a,
${SK} .page-footer__CC-note a, ${SK} .page-footer__terms a,
${SK} .page-footer__lang .btn-link:not(.st-button_style_none) {
  color: var(--sk-fg-2) !important;
  --link-color: var(--sk-fg-2) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-hover-line-color: var(--sk-accent) !important;
  --link-active-color: var(--sk-accent) !important;
  --link-active-line-color: var(--sk-accent) !important;
  --link-disabled-color: var(--sk-fg-muted) !important;
  --external-link-icon-color: var(--sk-fg-2) !important;
  --link-line-color: currentColor !important;
}
${SK} .page-footer__social-link {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg-2) !important;
}
/* иконки соцсетей и магазинов приложений: сток гасит их фильтром
   (contrast(0) grayscale(1) opacity(.4) у соцсетей и grayscale(1) у
   бейджей) — на тёмном подвале они выглядят бесцветными серыми
   кляксами. Монохромным соцсетям возвращаем контраст инверсией,
   брендовым бейджам — родные цвета */
${SK} .page-footer__social-link img {
  filter: grayscale(1) invert(1) brightness(1.5) !important;
  opacity: 1 !important;
}
${SK} .page-footer__social-link:hover img {
  filter: grayscale(1) invert(1) brightness(1) !important;
}
${SK} .page-footer__mobapp-link img {
  filter: none !important;
  opacity: 1 !important;
}
${SK} .stepik-loader__message { color: var(--sk-fg-2) !important; }

/* ================= ОСНОВНОЙ МАКЕТ =================
   Белые «поля» по краям центрированного макета рисуются box-shadow
   через --marco-layout-outer-color (#fcfcfc) — делаем тёмными. */
${SK} .marco-layout {
  --marco-layout-outer-color: var(--sk-bg) !important;
  --marco-layout-nav-bg: var(--sk-bg-alt) !important;
}

/* ================= КАРТОЧКИ КУРСОВ (каталог · главная · карусель) =================
   Официальная ночная тема Stepik карточки НЕ перекрашивает — всё белое
   и пастельное там хардкод (белая подложка .catalog-rich-card::before,
   белые .catalog-block-*__about-card, пастельные фоны .course-list-card,
   тёмный заголовок --link-color:#222, светлые разделители).
   Ниже: тёмная панель «карусели с главной», распространённая на все
   карточки скрипта. ЦВЕТ ТЕКСТА карточек НЕ форсируем — остаётся
   фирменный. Исключение — только заголовок .course-card__title, у него
   стоковый цвет #222 на тёмной панели не читается. */
${SK} .course-card, ${SK} .course-list-card, ${SK} .unit-card,
${SK} .item-tile, ${SK} .specialization-card,
${SK} .catalog-block-promo-courses__about-card,
${SK} .catalog-block-specializations__about-card {
  background-color: var(--sk-panel) !important;
  background-image: none !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35) !important;
}
${SK} .course-card:hover, ${SK} .course-list-card:hover,
${SK} .unit-card:hover, ${SK} .item-tile:hover,
${SK} .catalog-block-promo-courses__about-card:hover,
${SK} .catalog-block-specializations__about-card:hover {
  background-color: var(--sk-panel-2) !important;
}
/* rich-/about-карточки: белая подложка лежит в ::before */
${SK} .catalog-rich-card::before, ${SK} .about-card::before {
  background-color: var(--sk-panel) !important;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.4) !important;
}
${SK} .catalog-rich-card:hover::before, ${SK} .about-card:hover::before {
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.55) !important;
}
/* пастельные «фирменные» фоны лент курсов на главной */
${SK} .course-list-cards:not([data-list-type]) > .course-list-card,
${SK} .course-list-cards[data-list-type="grid"] > .course-list-card:first-child,
${SK} .course-list-cards[data-list-type="tags"] > .course-list-card,
${SK} .course-list-card[data-view="tag"] {
  background-color: var(--sk-panel) !important;
  background-image: none !important;
}
${SK} .course-list-cards[data-list-type="tags"] > .course-list-card:hover,
${SK} .course-list-card[data-view="tag"]:hover {
  background-color: var(--sk-panel-2) !important;
}
/* декоративные ::before-подложки */
${SK} .course-list-card::before, ${SK} .about-card::before,
${SK} .course-card::before { display: none !important; }
/* заголовок карточки: стоковые --link-*:#222 невидимы на тёмной панели */
${SK} .course-card__title {
  --link-color: var(--sk-fg) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-hover-line-color: var(--sk-accent) !important;
  --link-active-color: var(--sk-fg) !important;
  --link-active-line-color: var(--sk-fg) !important;
  --link-disabled-color: var(--sk-fg-muted) !important;
  --external-link-icon-color: var(--sk-fg) !important;
}
/* разделитель в карточке режима «поиск»: сток рисует линию во всю ширину
   карточки (::after 820×1px) при border-radius:16px и overflow:visible —
   на тёмном фоне она торчит за скруглённые углы, поэтому убираем */
${SK} .course-card[data-view="search-item"]::after {
  display: none !important;
}
/* в списке результатов каталога сток обнуляет верхний отступ ПЕРВОЙ
   карточке (.catalog-course-cards[data-list-type=search-results]
   …>.course-cards__item:first-child>.course-card{padding-top:0}): верхняя
   карточка курса ниже остальных, а иконка «в избранное»
   (margin:-2px 0 0 16px) вылезает за верхнюю границу карточки; возвращаем
   одинаковый отступ, чтобы карточки были одной высоты */
${SK} .catalog-course-cards[data-list-type="search-results"] .catalog-course-cards__cards > .course-cards__item:first-child > .course-card {
  padding-top: 24px !important;
}
/* авторы в карточках: стоковые #999/#222 и тёмные ссылки не читаются;
   цвет текста карточки не трогаем, правим только блок авторов */
${SK} .course-card__authors, ${SK} .course-card__author {
  color: var(--sk-fg-2) !important;
}
${SK} .course-card__authors a, ${SK} .course-card__author a {
  color: var(--sk-fg-2) !important;
  --link-color: var(--sk-fg-2) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-hover-line-color: var(--sk-accent) !important;
}
/* заголовок и счётчик ленты курсов (.course-list-card): стоковый индиго
   #3e50cb на тёмной панели не читается — осветляем фирменным акцентом */
${SK} .course-list-card__title,
${SK} .course-list-card__courses {
  color: var(--sk-accent-2) !important;
  --link-color: var(--sk-accent-2) !important;
  --link-hover-color: var(--sk-fg) !important;
  --link-hover-line-color: var(--sk-accent) !important;
}
/* карточка автора в каталоге (.user-card лежит на .catalog-rich-card::before):
   стоковый чёрный заголовок #000 на тёмной панели не виден */
${SK} .user-card__title {
  color: var(--sk-fg) !important;
}
${SK} .user-card__widget {
  color: var(--sk-fg-3) !important;
}
/* кнопка «хочу пройти» на карточке курса: сток — белый круг
   (background:#f6f6f6, border:2px solid #fff, серая иконка), на тёмном
   фоне светится белым */
${SK} button.course-card__bookmark:not(.st-button_style_none) {
  background-color: var(--sk-panel-2) !important;
  border-color: var(--sk-panel) !important;
  color: var(--sk-fg-2) !important;
}
${SK} button.course-card__bookmark:not(.st-button_style_none):hover,
${SK} button.course-card__bookmark:not(.st-button_style_none):focus {
  background-color: var(--sk-panel) !important;
  border-color: var(--sk-accent) !important;
  color: var(--sk-accent) !important;
}
${SK} button.course-card__bookmark:not(.st-button_style_none):active {
  background-color: var(--sk-bg-alt) !important;
}
${SK} .course-card[data-view="small"] button.course-card__bookmark:not(.st-button_style_none):hover,
${SK} .course-card[data-view="search-item"] button.course-card__bookmark:not(.st-button_style_none):hover {
  background-color: var(--sk-panel) !important;
}
${SK} button.course-card__bookmark:not(.st-button_style_none)[data-is-added],
${SK} button.course-card__bookmark.is-wishlist-added:not(.st-button_style_none) {
  --static-color: var(--sk-accent) !important;
  color: var(--sk-accent) !important;
}
/* обложка-заглушка курса (course_cover.png, почти белая #F2F2F2) */
${SK} img.course-card__cover[src*="course_cover"],
${SK} .item-tile__cover-img[src*="course_cover"] {
  filter: invert(1) !important;
}
/* карточка курса в режиме «список» (промо/каталог, data-view="search-item"):
   сток даёт padding:24px 0 — обложка и цена/«Вы записаны» прижаты к самым
   краям карточки и выглядят обрезанными. Возвращаем горизонтальные отступы;
   обложка отходит от угла, поэтому делаем ей ровное скругление. */
${SK} .course-card[data-view="search-item"] {
  padding-left: 20px !important;
  padding-right: 20px !important;
}
${SK} .course-card[data-view="search-item"] .course-card__cover {
  border-radius: 10px !important;
}
/* кнопка-меню карточки: светлый hover из стока */
${SK} button.course-card__menu-toggle-btn:not(.st-button_style_none):hover,
${SK} button.course-card__menu-toggle-btn:not(.st-button_style_none):focus,
${SK} button.course-card__menu-toggle-btn:not(.st-button_style_none)[data-active] {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg) !important;
}

/* плитки «Моё обучение» (/learn/courses, .item-tile.learn-course-tile):
   сток даёт padding:20px 0 без скругления и рамки — при нашей тёмной
   панели обложка и иконки прижаты к самым краям и выглядят обрезанными.
   Добавляем отступы со всех сторон, скругление, рамку и зазор между
   карточками. */
${SK} .learn-course-tile {
  padding: 16px !important;
  border: 1px solid var(--sk-border) !important;
  border-radius: 12px !important;
  margin-bottom: 8px !important;
}

/* скелетоны загрузки ([data-skeleton]): стоковый шиммер почти белый
   (#eee/#ddd) — при загрузке списков и обложек курсов «мигает» белым
   (в т.ч. иконки курсов в /learn/courses). Красим в панель темы. */
${SK} [data-skeleton] {
  --skeleton-color-1: var(--sk-bg-alt) !important;
  --skeleton-color-2: var(--sk-panel) !important;
}

/* логотипы организаций («Размещают курсы на Stepik»): сток делает их
   серыми (grayscale) — тёмные надписи логотипов на тёмном фоне не видно.
   Инвертируем, сохраняя серость. */
${SK} .catalog-block-organizations__list img,
${SK} .catalog-block-organizations__list a[data-name="bfu"] img {
  filter: grayscale(1) invert(1) brightness(1.05) !important;
  opacity: 0.92 !important;
}

/* светлые кнопки .white / .button__bg_white: сток — белая заливка с серым
   текстом, на тёмном фоне светятся белым («Загрузить ещё» и др.) */
${SK} button:not(.st-button_style_none).white,
${SK} .button:not(.st-button_style_none).white {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
}
${SK} button:not(.st-button_style_none).white:hover,
${SK} button:not(.st-button_style_none).white:focus,
${SK} button:not(.st-button_style_none).white.is-hovered,
${SK} button:not(.st-button_style_none).white.is-focused,
${SK} .button:not(.st-button_style_none).white:hover,
${SK} .button:not(.st-button_style_none).white:focus {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border-2) !important;
}
${SK} button:not(.st-button_style_none).white:active,
${SK} button:not(.st-button_style_none).white.is-active,
${SK} .button:not(.st-button_style_none).white:active,
${SK} .button:not(.st-button_style_none).white.is-active {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border-2) !important;
}
${SK} button:not(.st-button_style_none).white[disabled],
${SK} button:not(.st-button_style_none).white[aria-disabled="true"],
${SK} button:not(.st-button_style_none).white.disabled,
${SK} .button:not(.st-button_style_none).white[disabled],
${SK} .button:not(.st-button_style_none).white[aria-disabled="true"],
${SK} .button:not(.st-button_style_none).white.disabled {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg-muted) !important;
  border-color: var(--sk-border) !important;
}
/* заблокированные кнопки: сток заливает их светло-зелёным #aad6aa с белым
   текстом — на тёмном фоне это самое светлое пятно на странице (например,
   «Отправить на проверку» при пустом ответе) */
${SK} button:not(.st-button_style_none):not(.white)[disabled],
${SK} button:not(.st-button_style_none):not(.white)[aria-disabled="true"],
${SK} button:not(.st-button_style_none):not(.white).disabled,
${SK} .button:not(.st-button_style_none):not(.white)[disabled],
${SK} .button:not(.st-button_style_none):not(.white)[aria-disabled="true"],
${SK} .button:not(.st-button_style_none):not(.white).disabled {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg-muted) !important;
  border-color: var(--sk-border) !important;
}
${SK} button:not(.st-button_style_none).is-outlined[disabled],
${SK} button:not(.st-button_style_none).is-outlined[aria-disabled="true"],
${SK} .button:not(.st-button_style_none).is-outlined[disabled],
${SK} .button:not(.st-button_style_none).is-outlined[aria-disabled="true"] {
  background-color: transparent !important;
  color: var(--sk-fg-muted) !important;
  border-color: var(--sk-border) !important;
}

/* ================= ПРОМО-СТРАНИЦА КУРСА =================
   Специализации (.course-promo__head[data-is-specialization]) в стоке
   получают светлый градиент #F4F5FD→#E9F2FF с тёмным текстом #222, а
   описание и блок инструктора — тёмные хардкоды. На тёмной теме шапка
   светится белым, текст не читается. */
${SK} .course-promo__head {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg) !important;
}
${SK} .course-promo__head[data-is-specialization] {
  background: linear-gradient(92.32deg, var(--sk-panel) 47.03%, var(--sk-bg-alt) 100.95%) !important;
}
${SK} .course-promo__head a,
${SK} .course-promo__description a {
  --link-color: var(--sk-blue) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-active-color: var(--sk-accent) !important;
  color: var(--sk-blue) !important;
}
/* блок инструктора под шапкой: сток #222 на тёмном фоне */
${SK} .course-promo__instructor,
${SK} .course-promo__instructor a,
${SK} .author-widget__name,
${SK} .author-widget__short-bio,
${SK} .author-widget__details pre,
${SK} .shortened-text pre {
  color: var(--sk-fg) !important;
}
/* светлые плашки промо: «Сертификат» и «В программу входят» (#f3f4f6) */
${SK} .course-promo__certificate-section,
${SK} .course-promo__course-includes-aside,
${SK} .course-promo-includes {
  background-color: var(--sk-panel) !important;
}
/* «липкая» нижняя панель с ценой (сток #fff) */
${SK} .course-promo__bottom {
  background-color: var(--sk-panel) !important;
  box-shadow: 0 -1em 2em rgba(0, 0, 0, 0.4) !important;
}
/* отзывы на промо (.course-review-card): сток даёт автору и заголовку
   ссылку #222, а дате — серый #777; на тёмном канвасе они сливаются */
${SK} .course-review-card__author,
${SK} .course-review-card__title {
  --link-color: var(--sk-fg) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-active-color: var(--sk-accent) !important;
  --link-line-color: transparent !important;
  --link-hover-line-color: var(--sk-accent) !important;
  --link-active-line-color: var(--sk-accent) !important;
  --external-link-icon-color: var(--sk-fg) !important;
}
${SK} .course-review-card__date {
  color: var(--sk-fg-3) !important;
}
/* зачёркнутая «старая» цена в карточках/промо: стоковый индиго #3e50cb
   на тёмной панели почти не виден (контраст ~2:1) */
${SK} .display-price__price_regular,
${SK} .display-price__price_regular .format-price {
  color: var(--sk-fg-3) !important;
}
/* Оглавление курса (.toc-syllabus-section) на промо и программе: сток
   рисует секции прямоугольниками с радиусом 0 — скругляем как карточки;
   полоса прогресса секции упирается в левый край, поэтому обрезаем по
   радиусу, чтобы уголок не торчал */
${SK} .toc-syllabus-section {
  border-radius: 12px !important;
  overflow: hidden !important;
}

/* ================= УВЕДОМЛЕНИЯ (/notifications) =================
   Панель фильтров сток заливает светло-серым #f6f6f6 с тёмным текстом
   #5e5e5e и радиусом 4/0 — на тёмной странице светится белой плашкой. */
${SK} .notifications__filters {
  background-color: var(--sk-panel) !important;
  border-radius: 12px !important;
  color: var(--sk-fg-2) !important;
}
${SK} .notifications__filter,
${SK} .notifications__filter .select-box__toggle-btn {
  color: var(--sk-fg-2) !important;
}

/* ================= ВКЛАДКИ / ТАБЫ =================
   Стоковые табы — светлая плашка и тёмный текст (.st-tabs: #666/#000,
   .tab база #222, актив #288b28, ссылки --link-color:#1466c6);
   ночная тема их не перекрашивает. */
${SK} .tab {
  color: var(--sk-fg) !important;
  --link-color: var(--sk-fg-2) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-hover-line-color: var(--sk-accent) !important;
}
${SK} .tab__item.active a, ${SK} .tab__item.active button,
${SK} .tab__item[data-active] a, ${SK} .tab__item[data-active] button {
  color: var(--sk-accent) !important;
}
${SK} .tab__item.active a::before, ${SK} .tab__item.active button::before,
${SK} .tab__item[data-active] a::before, ${SK} .tab__item[data-active] button::before {
  background: var(--sk-accent) !important;
}
${SK} .tab__item.active a .tab__item-counter::before,
${SK} .tab__item.active button .tab__item-counter::before,
${SK} .tab__item[data-active] a .tab__item-counter::before,
${SK} .tab__item[data-active] button .tab__item-counter::before {
  color: var(--sk-accent) !important;
}
${SK} .tab__item:not(.active):not([data-active]), ${SK} .tab[data-disabled] .tab__item:not(.active):not([data-active]) {
  color: var(--sk-fg-3) !important;
}
${SK} .tab--border {
  background-image: linear-gradient(0deg, var(--sk-border), var(--sk-border)) !important;
}
/* классические табы-плашки (белый фон и тёмный текст из стока) */
${SK} .st-tabs, ${SK} .light-tabs__header {
  background: var(--sk-panel) !important;
  border-bottom-color: var(--sk-border) !important;
}
${SK} .st-tabs__link, ${SK} .st-tabs__link.active,
${SK} .light-tabs__switch, ${SK} .light-tabs__switch.active {
  background: var(--sk-panel) !important;
  border-color: var(--sk-border) !important;
  color: var(--sk-fg-2) !important;
}
${SK} .st-tabs__link:hover, ${SK} .st-tabs__link.active:hover,
${SK} .light-tabs__switch:hover, ${SK} .light-tabs__switch.light-tabs__switch_active:hover {
  color: var(--sk-fg) !important;
}
${SK} .st-tabs__link.active, ${SK} .light-tabs__switch.active,
${SK} .light-tabs__switch.light-tabs__switch_active {
  border-top-color: var(--sk-accent) !important;
  color: var(--sk-fg) !important;
}
${SK} .st-tabs__counter { color: var(--sk-fg-muted) !important; }
/* содержимое табов в рамке (.light-tabs__content_with_border «График
   активности» и др.): сток даёт radius 6px — выравниваем со
   скруглением карточек (12px), чтобы плашки не выглядели квадратными */
${SK} .light-tabs__content_with_border {
  border-radius: 12px !important;
}

/* ================= ЗАГОЛОВКИ =================
   Сток красит все h1..h6 глобально в #222, а заголовки блоков главной
   (.catalog-block__title и пр.) этот цвет наследуют; ночная тема
   заголовки не трогает, поэтому на тёмном фоне они тёмные. Осветляем. */
${SK} h1, ${SK} h2, ${SK} h3, ${SK} h4, ${SK} h5, ${SK} h6 {
  color: var(--sk-fg) !important;
}
${SK} .catalog-block__title, ${SK} .promo-block__title,
${SK} .dashboard-tiles__section-title,
${SK} .catalog-block-full-course-lists__tabpanel-title {
  color: var(--sk-fg) !important;
}
/* фирменный индиго-заголовок тегов каталога: стоковый #3e50cb на тёмной
   панели нечитаем — осветляем, сохраняя фирменную синеву */
${SK} .catalog-block-simple-course-lists__tags-title {
  color: var(--sk-blue) !important;
}

/* ================= СТРАНИЦА КУРСА / ПРОГРАММА =================
   Тёмные хардкоды курса (заголовки уроков #000, разделы программы #222,
   ссылки описания #222) на тёмном фоне не читаются — осветляем. */
${SK} .lesson-widget__title-text, ${SK} .lesson-widget__comment-text,
${SK} .future-lesson-widget__title-link,
${SK} .toc-syllabus-section__title,
${SK} .toc-syllabus-section__continue-timer {
  color: var(--sk-fg) !important;
}
${SK} .future-lesson-widget__author-link {
  color: var(--sk-fg-2) !important;
}
${SK} .course-promo__description a {
  --link-color: var(--sk-blue) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-hover-line-color: var(--sk-accent) !important;
}

/* ================= СОДЕРЖАНИЕ КУРСА / TOC =================
   Сток красит плашки разделов (.toc-syllabus-section) и заголовки
   уроков (.toc-component .toggle__title) в белый #fff с рамкой #ccc,
   а кнопки статусов — в светло-серое #eaecf0 с тёмным текстом;
   ночная тема это не трогает. Красим плашки в тёмную панель. */
${SK} .toc-syllabus-section,
${SK} .toc-component .toggle__title {
  background-color: var(--sk-panel) !important;
  border-color: var(--sk-border) !important;
}
${SK} .toc-syllabus-section__status-message {
  color: var(--sk-blue) !important;
}
${SK} .toc-syllabus-section__status-btn:not(.st-button_style_none),
${SK} .toc-syllabus-section__status-btn:not(.st-button_style_none)[aria-disabled="true"] {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
}
${SK} .toc-syllabus-section__status-btn:not(.st-button_style_none) .svg-icon,
${SK} .toc-syllabus-section__status-btn:not(.st-button_style_none)[aria-disabled="true"] .svg-icon {
  color: var(--sk-fg-3) !important;
}
/* кнопка «экзамен сдан» — сток красит в светло-голубой #E9EBFA */
${SK} .toc-syllabus-section__exam-finished-btn:not(.st-button_style_none),
${SK} .toc-syllabus-section__exam-finished-btn:not(.st-button_style_none)[aria-disabled="true"] {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
}
${SK} .toc-syllabus-section__exam-finished-btn:not(.st-button_style_none) .svg-icon,
${SK} .toc-syllabus-section__exam-finished-btn:not(.st-button_style_none)[aria-disabled="true"] .svg-icon {
  color: var(--sk-fg-3) !important;
}
/* полосы прогресса в содержании (сток #eee) и всплывающая плашка
   дедлайнов (сток #999) */
${SK} .toc-component .toc__progress-bar,
${SK} .toc-syllabus-section__progress-bar {
  background-color: var(--sk-panel-2) !important;
}
${SK} .toc-component .toggle__section-deadlines {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg) !important;
}
${SK} .toc-component .toggle__section-deadlines:after {
  border-left-color: var(--sk-panel-2) !important;
}
${SK} .toc-syllabus-section__time-info time:hover {
  color: var(--sk-fg) !important;
}
/* <meter> (полоса прогресса под названием курса): сток рисует трек белым
   (--meter-background:#fff) — на тёмном фоне выглядит второй светлой
   линией. Красим трек и заливку токенами темы. */
${SK} meter,
${SK} meter[value="0"] {
  --meter-background: var(--sk-bg-alt) !important;
  --meter-background-empty: var(--sk-bg-alt) !important;
  --meter-color: var(--sk-accent) !important;
}
/* миниатюра-заглушка урока (сток — светлый SVG #eee/#ccc, на тёмной
   панели светится белым квадратом): гасим яркость картинки */
${SK} .lesson-widget__cover-image {
  background-color: var(--sk-bg-alt) !important;
  filter: grayscale(1) brightness(0.3) !important;
}
/* заголовки содержания в новом интерфейсе (не цвет карточки курса) */
${SK} .toc-promo-lesson__title {
  color: var(--sk-fg) !important;
}
/* кружки прогресса (.progress-pie): сток рисует их тёмно-зелёным #54ad54
   (цвет и заливка идут от currentColor) — на тёмных панелях и на странице
   сертификата они выглядят «погасшими». Берём фирменный акцент. */
${SK} .progress-pie,
${SK} .course-card__widget[data-type="enrolled-progress"] > i {
  color: var(--sk-accent) !important;
}

/* ================= УРОК / КВИЗ ================= */
${SK} .lesson-modern, ${SK} .lesson-modern__main, ${SK} .lesson-modern__top-panel,
${SK} .lesson, ${SK} .lesson__player, ${SK} .lesson-editor, ${SK} .lesson-editor__player,
${SK} .lesson__footer, ${SK} .lesson__mode, ${SK} .lesson-sidebar,
${SK} .lesson-sidebar__menu, ${SK} .lesson-toc, ${SK} .lesson__step-title,
${SK} .attempt-wrapper, ${SK} .attempt-wrapper__content, ${SK} .attempt-wrapper-review,
${SK} .quiz-layout, ${SK} .quiz-layout-head {
  background-color: var(--sk-bg) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
}
/* пины «закреплённых шагов» в верхней панели плеера: значки типов шагов
   сток рисует rgba(0,0,0,.5) — на тёмном топбаре почти не видны */
${SK} .step-pin-icon__icon {
  color: var(--sk-fg-2) !important;
}
${SK} .m-step-pin:hover .step-pin-icon__icon {
  color: var(--sk-accent) !important;
}
/* замочки недоступных уроков в сайдбаре (сток #5e5e5e) */
${SK} .lesson-sidebar__lock-icon {
  color: var(--sk-fg-2) !important;
}
/* Блок решения после проверки ответа: сток заливает .submission-show
   белым (#fff) и заголовок решения пишет тёмным #222; на тёмной странице
   «верх поля с решением» светится белой плашкой. Кнопку «Пройти заново»
   (.attempt-wrapper-button.white) сток тоже делает белой. */
${SK} .submission-show,
${SK} .submission-show[data-theme="default"] {
  background-color: var(--sk-panel) !important;
  border-color: var(--sk-border) !important;
}
${SK} .submission-show__title-text,
${SK} .submission-show__title-code-lang {
  color: var(--sk-fg) !important;
}
${SK} .attempt-wrapper-button.white {
  background-color: var(--sk-panel-2) !important;
  border-color: var(--sk-border) !important;
  color: var(--sk-fg) !important;
}
${SK} .attempt-wrapper-button.white:hover,
${SK} .attempt-wrapper-button.white:focus {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg) !important;
}
/* Варианты ответа (радио/чекбоксы): сток рисует белый кружок/квадрат
   (background:#fff, border:#ccc), а после проверки инпуты становятся
   disabled и сток принудительно заливает их светло-серым #eee — светлые
   кружки слепят и «галочка выбора» на них теряется. Красим в панель,
   а сам маркер выделения — акцентом темы, чтобы выбранный вариант было
   отчётливо видно. */
${SK} .s-radio .s-radio__border,
${SK} .s-checkbox .s-checkbox__border {
  background-color: var(--sk-panel-2) !important;
  border-color: var(--sk-border-2) !important;
}
${SK} .s-radio:hover .s-radio__border,
${SK} .s-radio .s-radio__input:focus + .s-radio__border,
${SK} .s-radio .s-radio__input:checked + .s-radio__border,
${SK} .s-checkbox .s-checkbox__input:checked + .s-checkbox__border {
  border-color: var(--sk-accent) !important;
}
${SK} .s-radio .s-radio__input:disabled + .s-radio__border,
${SK} .s-checkbox .s-checkbox__input:disabled + .s-checkbox__border {
  background-color: var(--sk-bg-alt) !important;
  border-color: var(--sk-border-2) !important;
}
${SK} .s-radio .s-radio__input:disabled:checked + .s-radio__border,
${SK} .s-checkbox .s-checkbox__input:disabled:checked + .s-checkbox__border {
  border-color: var(--sk-accent) !important;
}
${SK} .s-radio .s-radio__input:checked + .s-radio__border .s-radio__circle {
  background-color: var(--sk-accent) !important;
}
${SK} .s-checkbox .s-checkbox__input:checked + .s-checkbox__border .s-checkbox__circle {
  border-top-color: var(--sk-accent) !important;
  border-left-color: var(--sk-accent) !important;
}
/* текст вариантов ответа ДО отправки решения: сток красит его тёмным
   #5e5e5e (в состоянии нет ответа варианты видны до проверки) — на тёмном
   фоне шрифт не читается, осветляем текстом темы. */
${SK} label.s-radio,
${SK} .s-radio__label,
${SK} .choice-quiz-show__option {
  color: var(--sk-fg) !important;
}
/* Задание «сопоставить» (matching): сток рисует карточки пунктов и целей
   белыми (.dnd-quiz__item { background:#fff; border-color:#a5a5a5;
   border-radius:3px }) — на тёмной странице это белые прямоугольники, на
   которых светлый текст не читается. Карточки — в панель, рамка тёмная,
   углы как у карточек; буквенные метки (A/B/C), «ручку» перетаскивания и
   служебные кнопки окрашиваем серым текста темы (сток — #222/#a5a5a5),
   а «соединённую» пару (сток — ярко-зелёная #85d685) — в акцент. */
${SK} .dnd-quiz__item {
  background-color: var(--sk-panel) !important;
  border-color: var(--sk-border) !important;
  border-radius: 12px !important;
}
${SK} .matching-quiz__item::before {
  color: var(--sk-fg-3) !important;
}
${SK} .dnd-quiz__item-handle,
${SK} .dnd-quiz__item-btn {
  color: var(--sk-fg-muted) !important;
}
${SK} .dnd-quiz__item:not(.animated) .dnd-quiz__item-handle:hover,
${SK} .dnd-quiz__item-btn:focus,
${SK} .dnd-quiz__item-btn:hover {
  color: var(--sk-fg) !important;
}
${SK} .matching-quiz__item[data-drag-added] {
  background-color: var(--sk-accent) !important;
  border-color: transparent !important;
  color: var(--sk-fg) !important;
}
/* левый сайдбар урока: сток даёт панели #222 (нейтрально-серый, «дефолтный»
   на фоне синевато-графитового канваса) и заметно контрастирует с полем
   шага; красим в палитровый --sk-bg-alt и гасим «жёлоб» скроллбара */
${SK} .lesson-sidebar__wrapper {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg) !important;
}
${SK} .lesson-sidebar__wrapper .custom-scrollbar,
${SK} .lesson-sidebar__content.custom-scrollbar {
  --custom-scrollbar-background: transparent !important;
  --custom-scrollbar-thumb-color: var(--sk-border-2) !important;
  --custom-scrollbar-thumb-hover-color: var(--sk-accent) !important;
  --custom-scrollbar-thumb-active-color: var(--sk-accent) !important;
}
/* нижняя панель управления уроком под списком шагов (шестерёнка и
   «развернуть»): сток заливает её нейтрально-серым #222, кнопки — тем же
   #222 с серым текстом #A5A5A5; выравниваем с фоном сайдбара выше */
${SK} .lesson-controls,
${SK} .lesson-controls__item,
${SK} .lesson-controls button,
${SK} .lesson-controls .button_style_secondary {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg-2) !important;
  border-color: transparent !important;
}
${SK} .lesson-controls button:hover,
${SK} .lesson-controls button:focus,
${SK} .lesson-controls .button_style_secondary:hover,
${SK} .lesson-controls .button_style_secondary:focus {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg) !important;
}
${SK} .lesson-controls .svg-icon {
  color: var(--sk-fg-2) !important;
}
/* CKEditor («Развёрнутый ответ»): стоковая светлая кожа — панель
   инструментов #f8f8f8, нижняя панель и область ввода #fff. Перекрашиваем
   саму кожу и (скриптом ниже) документ внутри iframe. */
${SK} .cke_inner,
${SK} .cke_top,
${SK} .cke_bottom,
${SK} .cke_toolbox,
${SK} .cke_toolbar,
${SK} .cke_toolgroup,
${SK} .cke_combo,
${SK} .cke_combo_text,
${SK} .cke_combo_open,
${SK} .cke_path,
${SK} .cke_path_item {
  background-color: var(--sk-panel) !important;
  background-image: none !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
  text-shadow: none !important;
}
${SK} .cke_top, ${SK} .cke_bottom {
  border-color: var(--sk-border) !important;
}
${SK} .cke_button,
${SK} .cke_button_icon,
${SK} .cke_combo_arrow {
  filter: invert(1) brightness(1.7) !important;
}
${SK} .cke_button:hover,
${SK} .cke_button:focus,
${SK} .cke_button.cke_button_on,
${SK} .cke_button.cke_button_off:hover,
${SK} .cke_combo:hover,
${SK} .cke_combo.cke_combo_on {
  background-color: var(--sk-panel-2) !important;
  background-image: none !important;
}
${SK} .cke_button__bold_icon, ${SK} .cke_button__italic_icon,
${SK} .cke_button__underline_icon, ${SK} .cke_button__strike_icon,
${SK} .cke_button__subscript_icon, ${SK} .cke_button__superscript_icon,
${SK} .cke_button__numberedlist_icon, ${SK} .cke_button__bulletedlist_icon,
${SK} .cke_button__outdent_icon, ${SK} .cke_button__indent_icon,
${SK} .cke_button__blockquote_icon, ${SK} .cke_button__link_icon,
${SK} .cke_button__unlink_icon, ${SK} .cke_button__image_icon,
${SK} .cke_button__table_icon, ${SK} .cke_button__code_icon,
${SK} .cke_button__undo_icon, ${SK} .cke_button__redo_icon,
${SK} .cke_button__horizontalrule_icon, ${SK} .cke_button__specialchar_icon,
${SK} .cke_button__smiley_icon {
  filter: invert(1) brightness(1.7) !important;
}
${SK} .cke_wysiwyg_frame,
${SK} .cke_wysiwyg_div {
  background-color: var(--sk-panel) !important;
}
${SK} .rich-text-editor > [role="application"] {
  border-color: var(--sk-border) !important;
}

/* ================= ПОДВАЛ УРОКА / ОБСУЖДЕНИЯ =================
   Сток красит блок обсуждений под шагом в светло-серый #f3f4f6,
   поле ввода комментария в белый, а код в комментариях в #fff;
   ночная тема не трогает. Красим блок в тёмный фон уровня шага. */
${SK} .lesson__discussions-wrapper,
${SK} .lesson-modern .lesson__discussions-wrapper {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg) !important;
}
${SK} .comments-input__editor {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
}
${SK} .comments-comment__viewer.rich-text-viewer code,
${SK} .comment-widget__comment.rich-text-viewer code {
  background-color: var(--sk-code-bg) !important;
  color: var(--sk-code-fg) !important;
}
/* имя автора комментария — стоковая тёмная ссылка #222; счётчик лайков и
   пометка «ответ преподавателя» — серые #777 на тёмном фоне */
${SK} .comments-user-badge__name,
${SK} .comments-user-badge__name.link-secondary {
  color: var(--sk-fg) !important;
  --link-color: var(--sk-fg) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-active-color: var(--sk-accent) !important;
}
${SK} .ui-like__count {
  --ui-like-count-color: var(--sk-fg-3) !important;
}
${SK} .comments-card__staff-replied {
  color: var(--sk-fg-3) !important;
}

/* ============ ТЕКСТ УРОКА / ОПИСАНИЯ (rich-text) ============
   .rich-text-viewer и .step-text-wrapper хардкодят цвет светлой темы
   (#222 / #000), а их таблицы — белый фон (#fff / #f9f9f9). Ночная
   тема Stepik перекрашивает только фон контейнера, поэтому текст шага,
   описания курса и комментарии сливаются с тёмным канвасом, а таблицы
   с курсами светят белым. */
${SK} .rich-text-viewer:not(.free-answer__rich-text-viewer),
${SK} .html-content,
${SK} .step-text-wrapper {
  color: var(--sk-fg) !important;
}
${SK} .rich-text-viewer h1, ${SK} .rich-text-viewer h2, ${SK} .rich-text-viewer h3,
${SK} .rich-text-viewer h4, ${SK} .rich-text-viewer h5, ${SK} .rich-text-viewer h6 {
  color: var(--sk-fg) !important;
}
${SK} .rich-text-viewer blockquote {
  color: var(--sk-fg-2) !important;
  border-left-color: var(--sk-border-2) !important;
}
${SK} .rich-text-viewer a, ${SK} .step-text-wrapper a { color: var(--sk-blue) !important; }
${SK} .rich-text-viewer a:hover, ${SK} .step-text-wrapper a:hover { color: var(--sk-blue-dark) !important; }
${SK} .rich-text-viewer code, ${SK} .step-text-wrapper code {
  background-color: var(--sk-code-bg) !important;
  color: var(--sk-code-fg) !important;
  border-color: var(--sk-border) !important;
}
/* highlight.js в уроках подсвечивает код светлой темой: ключевые слова
   #000088, строки #008800, числа #006666, встроенные #660066, комментарии
   #880000 — тёмным по тёмному, код в блоках не читается. Переводим классы
   .hljs-* на палитровые токены (по аналогии с CodeMirror ниже). */
${SK} .hljs-subst { color: var(--sk-code-fg) !important; }
${SK} .hljs-comment, ${SK} .hljs-quote {
  color: var(--sk-code-comment) !important;
  font-style: italic;
}
${SK} .hljs-keyword, ${SK} .hljs-selector-tag, ${SK} .hljs-doctag,
${SK} .hljs-meta-keyword { color: var(--sk-code-keyword) !important; }
${SK} .hljs-number, ${SK} .hljs-literal, ${SK} .hljs-symbol,
${SK} .hljs-bullet { color: var(--sk-code-number) !important; }
${SK} .hljs-string, ${SK} .hljs-regexp, ${SK} .hljs-addition,
${SK} .hljs-meta-string { color: var(--sk-code-string) !important; }
${SK} .hljs-built_in, ${SK} .hljs-title, ${SK} .hljs-section,
${SK} .hljs-name, ${SK} .hljs-function .hljs-title {
  color: var(--sk-code-function) !important;
}
${SK} .hljs-type, ${SK} .hljs-class .hljs-title, ${SK} .hljs-attr,
${SK} .hljs-attribute, ${SK} .hljs-variable, ${SK} .hljs-template-variable,
${SK} .hljs-meta, ${SK} .hljs-tag, ${SK} .hljs-selector-id,
${SK} .hljs-selector-class, ${SK} .hljs-property {
  color: var(--sk-code-type) !important;
}
${SK} .hljs-operator, ${SK} .hljs-punctuation, ${SK} .hljs-selector-attr,
${SK} .hljs-selector-pseudo, ${SK} .hljs-link {
  color: var(--sk-code-operator) !important;
}
${SK} .hljs-deletion { color: var(--sk-danger) !important; }
${SK} .hljs-emphasis { font-style: italic; }
${SK} .hljs-strong { font-weight: 700; }
/* фон блока кода в стоке почти чёрный (#0C0D16) и на тёмном канвасе
   выглядит провалом — поднимаем блоки до поверхности, инлайн-«чипы»
   оставляем как есть */
${SK} .rich-text-viewer pre code,
${SK} .step-text-wrapper pre code,
${SK} .html-content pre code {
  background-color: var(--sk-bg-alt) !important;
}
${SK} .rich-text-viewer table {
  background-color: var(--sk-panel) !important;
  border-color: var(--sk-border) !important;
}
${SK} .rich-text-viewer table tr:nth-of-type(even) { background-color: var(--sk-bg-alt) !important; }
${SK} .rich-text-viewer table thead, ${SK} .rich-text-viewer table tfoot { background-color: var(--sk-panel) !important; }
${SK} .rich-text-viewer table th, ${SK} .rich-text-viewer table td {
  color: var(--sk-fg) !important;
  border-color: var(--sk-border) !important;
}
${SK} .rich-text-viewer picture.progressive-picture[data-lqip-loader]::before {
  background-color: var(--sk-panel) !important;
}

/* «Оставить отзыв» (button-link) и ссылка «принципы сообщества»:
   сток задаёт --link-color:#222 из светлой темы — на тёмном фоне
   текст не виден. */
${SK} button:not(.st-button_style_none).lesson__review-button {
  --link-color: var(--sk-fg-2);
  --link-line-color: currentColor;
  --link-hover-color: var(--sk-fg);
  --link-hover-line-color: currentColor;
  --link-active-color: var(--sk-fg);
  --link-active-line-color: currentColor;
  --link-disabled-color: var(--sk-fg-muted);
  --external-link-icon-color: var(--sk-fg-2);
  color: var(--sk-fg-2) !important;
}
${SK} .discussions__community-rules a {
  --link-color: var(--sk-blue);
  --link-line-color: currentColor;
  --link-hover-color: var(--sk-blue-dark);
  --link-hover-line-color: currentColor;
  --link-active-color: var(--sk-blue-dark);
  --link-active-line-color: currentColor;
  --link-disabled-color: var(--sk-fg-muted);
  --external-link-icon-color: var(--sk-blue);
}
/* «вторичные» ссылки .link-secondary: сток задаёт --link-color:#222 из
   светлой темы — на тёмном фоне ФИО получателя на странице сертификата и
   прочие такие ссылки выглядят почти чёрными. */
${SK} .link-secondary {
  --link-color: var(--sk-fg) !important;
  --link-line-color: var(--sk-border-2) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-hover-line-color: var(--sk-accent) !important;
  --link-active-color: var(--sk-accent) !important;
  --link-active-line-color: var(--sk-accent) !important;
  --link-disabled-color: var(--sk-fg-muted) !important;
  --external-link-icon-color: var(--sk-fg-2) !important;
  color: var(--sk-fg) !important;
}

/* ================= ТАБЛИЦЫ ================= */
${SK} .st-table, ${SK} .st-table__row, ${SK} .st-table__header,
${SK} .st-table__cell { border-color: var(--sk-border) !important; color: var(--sk-fg) !important; }
${SK} .st-table__header { background-color: var(--sk-panel) !important; }
${SK} .st-table__row:nth-child(odd) { background-color: var(--sk-bg-alt) !important; }

/* ================= РЕДАКТОР КОДА (CodeMirror) =================
   У CodeMirror нет собственной тёмной темы в Stepik — красим сами. */
${SK} .CodeMirror, ${SK} .code-editor, ${SK} .editor-with-runner,
${SK} .split-view__right, ${SK} .split-view__actions-panel,
${SK} .code-runner, ${SK} .code-runner__hints,
${SK} .html-quiz__code-editor .CodeMirror {
  background-color: var(--sk-code-bg) !important;
  color: var(--sk-code-fg) !important;
}
${SK} .CodeMirror-gutters { background-color: var(--sk-code-gutter) !important; border-right-color: var(--sk-border) !important; }
${SK} .CodeMirror-linenumber { color: var(--sk-code-lineno) !important; }
${SK} .CodeMirror-cursor { border-left-color: var(--sk-code-cursor) !important; }
${SK} .CodeMirror-selected, ${SK} .CodeMirror-line::selection,
${SK} .CodeMirror-line > span::selection { background: var(--sk-code-selection) !important; }
${SK} .CodeMirror-activeline-background { background: var(--sk-panel-2) !important; }
${SK} .cm-keyword { color: var(--sk-code-keyword) !important; }
${SK} .cm-string, ${SK} .cm-string-2 { color: var(--sk-code-string) !important; }
${SK} .cm-comment { color: var(--sk-code-comment) !important; font-style: italic; }
${SK} .cm-number, ${SK} .cm-atom { color: var(--sk-code-number) !important; }
${SK} .cm-def, ${SK} .cm-variable-2 { color: var(--sk-code-function) !important; }
${SK} .cm-type, ${SK} .cm-variable-3 { color: var(--sk-code-type) !important; }
${SK} .cm-operator { color: var(--sk-code-operator) !important; }
${SK} .cm-property, ${SK} .cm-tag { color: var(--sk-code-fg) !important; }
${SK} .cm-attribute { color: var(--sk-code-type) !important; }
${SK} .cm-meta { color: var(--sk-code-comment) !important; }
${SK} .code-editor-tabs__tab { background-color: var(--sk-code-gutter) !important; color: var(--sk-fg-2) !important; border-color: var(--sk-border) !important; }
${SK} .code-editor-tabs__tab.active { background-color: var(--sk-code-bg) !important; color: var(--sk-fg) !important; }

/* ================= ТОСТЫ ================= */
${SK} .toast-panel[data-theme="success"] { background-color: var(--sk-success) !important; color: var(--sk-on-surface) !important; }
${SK} .toast-panel[data-theme="danger"] { background-color: var(--sk-danger) !important; color: var(--sk-on-surface) !important; }
${SK} .toast-panel[data-theme="info-normal"] { background-color: var(--sk-blue) !important; color: var(--sk-on-surface) !important; }
${SK} .toast-panel[data-theme="info-accent"] { background-color: var(--sk-danger) !important; color: var(--sk-on-surface) !important; }

/* ================= reCAPTCHA («защита от спама») =================
   Значок в левом/правом нижнем углу — белая плашка Google внутри
   кросс-доменного iframe; стилизовать изнутри нельзя, поэтому
   инвертируем контейнер с компенсацией оттенка (белое → тёмное,
   синий логотип остаётся синим). */
${SK} .grecaptcha-badge {
  filter: invert(1) hue-rotate(180deg) !important;
}

/* ================= ВИДЕО =================
   Плеер video.js сам по себе тёмный, но Stepik-скин красит нижнюю панель
   управления .vjs-control-bar в #eee с чёрными иконками — внизу окна плеера
   висит белая полоса. Красим панелью и светлыми иконками. */
${SK} .video-player__container, ${SK} .video-player { background-color: var(--sk-bg) !important; }
${SK} .vjs-control-bar {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg-2) !important;
}
${SK} .vjs-control-bar .vjs-button,
${SK} .vjs-control-bar .vjs-icon-placeholder {
  color: var(--sk-fg) !important;
}
${SK} .vjs-control-bar .vjs-button:hover,
${SK} .vjs-control-bar .vjs-button:hover .vjs-icon-placeholder {
  color: var(--sk-accent) !important;
}
${SK} .vjs-play-progress,
${SK} .vjs-volume-level {
  background-color: var(--sk-accent) !important;
}
${SK} .vjs-load-progress {
  background-color: var(--sk-accent-dark) !important;
}

/* ================= ЛОГОТИПЫ =================
   Логотип в шапке (topbar_logo.svg) уже белый: вордмарк + иконка с тёмной
   внутренней «S». Фильтр brightness(0) invert(1) заливал её сплошным белым —
   «S» пропадала («белая без картинки»). Шапку не трогаем вообще.
   Футерный логотип (sk_horizontal_ru.svg) тёмно-серый (#404C4F), поэтому
   инвертируем по яркости: контур сохраняется, тёмные части светлеют. */
${SK} .navbar__logo, ${SK} .navbar__logo img, ${SK} .navbar__logo svg,
${SK} svg:has(use[*|href*="topbar_logo"]),
${SK} .mobile-banner__logo {
  filter: none !important;
}
${SK} .page-footer img[src*="logo"],
${SK} .page-footer img[src*="sk_horizontal"],
${SK} .page-footer img[src*="sk_vertical"] {
  filter: invert(1) !important;
}

/* ================= ПРОФИЛЬ / НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ =================
   Сток красит светлые панели настроек профиля хардкодом (#F6F6F6, #fff),
   заголовок профиля - чёрным текстом #000, разделители - светло-серым
   #d8d8d8. Ночная тема Stepik их не трогает, поэтому перекрываем. */
${SK} .profile-header {
  color: var(--sk-fg) !important;
}
${SK} .profile_list-element {
  border-bottom-color: var(--sk-border) !important;
}
${SK} .user-edit .horizontal-scroll-menu-widget__link {
  background: var(--sk-panel) !important;
  color: var(--sk-fg-2) !important;
  border-color: var(--sk-border) !important;
}
${SK} .user-edit .horizontal-scroll-menu-widget__link:hover,
${SK} .user-edit .horizontal-scroll-menu-widget__link:focus {
  background: var(--sk-panel-2) !important;
  color: var(--sk-fg) !important;
}
${SK} .user-edit__image-field {
  background-color: var(--sk-panel) !important;
  border: 1px solid var(--sk-border) !important;
  border-radius: 12px !important;
  /* сток .user-edit__page-wrapper .col-xs-12{padding-left:0} убирает отступ
     слева — аватар липнет к краю панели и выглядит обрезанным; возвращаем */
  padding: 16px !important;
}
/* превью аватара: было 128px и впритык к краю — делаем крупнее и с отступом */
${SK} .user-edit__image-field-pic[data-is-avatar] {
  width: 160px !important;
  height: 160px !important;
  max-width: 160px !important;
  max-height: 160px !important;
  border-radius: 20px !important;
}
/* поля ввода/списки без обёртки .st-input-wrapper (например,
   /edit-profile/info): сток — белые .st-input/.st-select; фон чуть
   светлее панели и контур-кольцо (см. также .st-input-wrapper) */
${SK} input.st-input, ${SK} textarea.st-input,
${SK} select.st-select, ${SK} .st-select {
  background-color: var(--sk-panel-2) !important;
  border-color: var(--sk-border) !important;
  color: var(--sk-fg) !important;
  box-shadow: 0 0 0 1px var(--sk-border) !important;
}
${SK} input.st-input:focus, ${SK} textarea.st-input:focus,
${SK} select.st-select:focus, ${SK} .st-select:focus {
  background-color: var(--sk-panel-2) !important;
  border-color: var(--sk-accent) !important;
  box-shadow: 0 0 0 1px var(--sk-accent) !important;
}
${SK} input.st-input::placeholder, ${SK} textarea.st-input::placeholder {
  color: var(--sk-fg-3) !important;
}
/* чекбоксы: сток рисует белый квадрат .s-checkbox__border (#fff) */
${SK} .s-checkbox .s-checkbox__border {
  background-color: var(--sk-panel-2) !important;
  border-color: var(--sk-border) !important;
}
${SK} .s-checkbox:hover .s-checkbox__border,
${SK} .s-checkbox .s-checkbox__input:focus + .s-checkbox__border {
  border-color: var(--sk-accent) !important;
}
${SK} .s-checkbox .s-checkbox__label {
  color: var(--sk-fg-2) !important;
}
/* чекбоксы-заголовки строк форм без внутреннего span.s-checkbox__label
   (например, подписи «Приватность» и «Программа бета‑тестирования» в
   редактировании профиля): сток #5e5e5e — осветляем как остальные подписи */
${SK} label.s-checkbox {
  color: var(--sk-fg-2) !important;
}
/* левое меню настроек: сток — белая плашка и тёмный текст #222
   (активный пункт «Редактировать профиль» не читался на тёмном фоне).
   Оформляем карточкой: панель + рамка со всех сторон + скругление 12px
   (сток давал только тонкие линии сверху/снизу), активный пункт — пилюля */
${SK} .user-edit-menu__links {
  background-color: var(--sk-panel) !important;
  border: 1px solid var(--sk-border) !important;
  border-radius: 12px !important;
  padding: 4px 2px !important;
}
${SK} .user-edit-menu__links a {
  --link-color: var(--sk-fg-2) !important;
  --link-hover-color: var(--sk-accent) !important;
  --link-active-color: var(--sk-fg) !important;
  --link-line-color: transparent !important;
  color: var(--sk-fg-2) !important;
  border-radius: 8px !important;
  padding: 8px 12px !important;
}
${SK} .user-edit-menu__links a.active {
  --link-color: var(--sk-fg) !important;
  color: var(--sk-fg) !important;
  background-color: var(--sk-bg-alt) !important;
}
/* из-за увеличенных отступов пунктов меню (padding: 8px 12px) колонка
   меню становится шире 25%, и на flex-контейнере с flex-wrap: wrap форма
   «уезжает» под меню (меню оказывается сверху страницы). На десктопе
   фиксируем двухколоночную сетку без переноса: колонка меню схлопывается
   до ширины своего контента (~247px), форма остаётся справа */
@media (min-width: 768px) {
  ${SK} .user-edit > .flex-row {
    flex-wrap: nowrap !important;
  }
}
/* разделитель секций настроек (#f3f4f6) */
${SK} .user-edit__settings-divider {
  border-top-color: var(--sk-border) !important;
}
/* подписи форм раздела редактирования профиля (сток #5e5e5e): «Ваше имя»,
   «Фамилия», «Язык», «Аватарка», «Обложка», строки соцсетей и т.п. */
${SK} .user-edit__page-wrapper label.st-size-normal,
${SK} .user-edit__social-base-url {
  color: var(--sk-fg-2) !important;
}
/* иконки соцсетей в форме (.profile-social-icon): сток — брендовые
   логотипы, у многих (github, skype, website) тёмный/чёрный знак — на
   тёмной панели не виден; контраст-инверсия как у соцсетей подвала */
${SK} .profile-social-icon {
  filter: grayscale(1) invert(1) brightness(1.5) !important;
}
/* кнопки «Загрузить»/«Убрать» (btn-link) в полях аватара/обложки: сток —
   тонкие синие ссылки без фона, на тёмном сливаются; оформляем как основную
   кнопку «Сохранить изменения» — заливка, рамка, скругление 4px, отступы.
   Активные — заливка акцентом темы (как заглавная зелёная кнопка), disabled
   (обложка у обычных пользователей) — панель-2 с рамкой и светлым текстом.
   Селектор disabled с контекстом button.btn-link, чтобы перебить общее
   правило кнопок [disabled] (html[data-sk-theme] button:not(...)[disabled]) */
${SK} .user-edit__image-field .btn-link {
  border: 1px solid transparent !important;
  border-radius: 4px !important;
  padding: 8px 16px !important;
  background-color: var(--sk-accent) !important;
  color: var(--sk-on-surface) !important;
}
${SK} .user-edit__image-field .btn-link:not(:disabled):hover,
${SK} .user-edit__image-field .btn-link:not(:disabled):focus {
  background-color: var(--sk-accent-dark) !important;
  color: #fff !important;
}
${SK} .user-edit__image-field button.btn-link:disabled {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg-2) !important;
  border-color: var(--sk-border) !important;
}
${SK} .user-financial-details-form .the-form-field__char-counter {
  background: var(--sk-panel) !important;
}
${SK} .user-revenue__table thead {
  background-color: var(--sk-bg-alt) !important;
}
${SK} .user-revenue__table th,
${SK} .user-revenue__beneficiary-revenue-item > span:first-child {
  color: var(--sk-fg-2) !important;
}
/* бейдж «отчёт» (#F6F6F6) и заблокированные поля формы (#fff) */
${SK} .user-revenue__report[data-type-badge] {
  background-color: var(--sk-panel) !important;
  color: var(--sk-fg-2) !important;
}
/* заблокированные поля реквизитов (#fff): фон панель-2, а текст значения
   (например, «Контактный email») — светлый fg-2, чтобы введённое было
   читаемо («тёмный на тёмном»), но поле выглядело неактивным */
${SK} .user-financial-details-form .the-form-field input.st-input[disabled] {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg-2) !important;
  border-color: var(--sk-border) !important;
}
/* тёмные подписи профиля: счётчики и их цифры, вкладка «Профиль»,
   «Присоединился»/«5 лет назад», активность, сертификаты (сток #777/#222) */
${SK} .profile__counters,
${SK} .profile__links,
${SK} .profile__link,
${SK} .profile__text,
${SK} .profile__counter,
${SK} .profile__counter time,
${SK} .profile__counters .svg-icon,
${SK} .last-activity-stats__desc,
${SK} .activity-graph .activity-graph__info,
${SK} .cert-widget .cert-widget__details {
  color: var(--sk-fg-3) !important;
}
/* «Присоединился …» и подпись соцсети (.profile__text/.profile__link):
   чуть светлее основного блока подписей, чтобы не сливались с канвасом */
${SK} .profile__text,
${SK} .profile__link {
  color: var(--sk-fg-2) !important;
}
/* ссылки-соцсети в профиле (.profile__link, «О себе»): сток навешивает
   filter:grayscale(1) на ЦВЕТНЫЕ брендовые иконки (github и т.п.) —
   выглядят бесцветными; снимаем фильтр, ссылку подсвечиваем акцентом */
${SK} .profile__link {
  filter: none !important;
}
${SK} .profile__link:hover {
  color: var(--sk-accent) !important;
}
/* иконка у соц-ссылки профиля: многие бренды (github и т.п.) — тёмный/
   чёрный логотип, на тёмном фоне не контрастный; тот же контраст-фильтр,
   что и у соцсетей в подвале */
${SK} .profile__link img {
  filter: grayscale(1) invert(1) brightness(1.5) !important;
}
${SK} .profile__link:hover img {
  filter: grayscale(1) invert(1) brightness(1) !important;
}
${SK} .profile__counters li > b {
  color: var(--sk-fg) !important;
}
/* график активности (cal-heatmap): непройденные дни — светло-серые
   #ededed (q0/q1), на тёмной панели светятся белым; гасим в палитровый
   фон, оставляя градацию «пройденных» дней зелёной */
${SK} .activity-graph .cal-heatmap-container .graph-rect,
${SK} .activity-graph .cal-heatmap-container .q0,
${SK} .activity-graph .cal-heatmap-container .q1,
${SK} .activity-graph .cal-heatmap-container .graph-legend rect {
  fill: var(--sk-bg-alt) !important;
  background-color: var(--sk-bg-alt) !important;
}
/* градация «пройденных» дней: раньше ступени строились от базового
   акцента (#66CC66) вплоть до него самого — квадратики выходили
   светлыми и «слепили» на тёмной панели. Теперь лестница собрана из
   тёмного акцента (--sk-accent-dark): от приглушённого к насыщенному
   тёмно-зелёному, максимальный уровень — сам accent-dark, без светлых
   --sk-success/акцента. Для браузеров без color-mix остаётся первая
   (сплошная) пара значений. */
${SK} .activity-graph .cal-heatmap-container .q2 {
  fill: var(--sk-accent-dark) !important;
  background-color: var(--sk-accent-dark) !important;
  fill: color-mix(in srgb, var(--sk-accent-dark) 40%, transparent) !important;
  background-color: color-mix(in srgb, var(--sk-accent-dark) 40%, transparent) !important;
}
${SK} .activity-graph .cal-heatmap-container .q3 {
  fill: var(--sk-accent-dark) !important;
  background-color: var(--sk-accent-dark) !important;
  fill: color-mix(in srgb, var(--sk-accent-dark) 65%, transparent) !important;
  background-color: color-mix(in srgb, var(--sk-accent-dark) 65%, transparent) !important;
}
${SK} .activity-graph .cal-heatmap-container .q4 {
  fill: var(--sk-accent-dark) !important;
  background-color: var(--sk-accent-dark) !important;
  fill: color-mix(in srgb, var(--sk-accent-dark) 88%, transparent) !important;
  background-color: color-mix(in srgb, var(--sk-accent-dark) 88%, transparent) !important;
}
${SK} .activity-graph .cal-heatmap-container .q5 {
  fill: var(--sk-accent-dark) !important;
  background-color: var(--sk-accent-dark) !important;
}
/* плашка «Скрыт» в списке сертификатов (сток — светло-серый #b7b7b7) */
${SK} .cert-widget__badge {
  background-color: var(--sk-bg-alt) !important;
  color: var(--sk-fg-2) !important;
  border: 1px solid var(--sk-border) !important;
}
/* сертификаты в профиле (.cert-widget) — сток рисует их строками списка
   без рамки и скругления; оформляем каждую запись карточкой как прочие
   блоки (панель + рамка + радиус 12px) */
${SK} .cert-widget {
  background-color: var(--sk-panel) !important;
  border: 1px solid var(--sk-border) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
}
${SK} .cert-widget .cert-widget__clickable {
  color: var(--sk-fg) !important;
  --link-color: var(--sk-fg) !important;
  --link-hover-color: var(--sk-accent) !important;
}
/* описание в шапке профиля/преподавания: контент из редактора с
   инлайн-цветом (например, color:#1d1d1f) — на тёмной панели не читается
   (ФИО, «ТОП КУРСОВ», «Платные курсы», названия курсов) */
${SK} .show-more__content,
${SK} .show-more__content *:not(a),
${SK} .profile__header-details [style*="color"]:not(a) {
  color: var(--sk-fg) !important;
}
${SK} .profile__nav[data-type="sidebar"] a,
${SK} .profile__nav[data-type="sidebar"] a.active {
  --link-color: var(--sk-fg-2) !important;
  --link-hover-color: var(--sk-fg) !important;
  --link-active-color: var(--sk-fg) !important;
  --link-line-color: transparent !important;
  --link-hover-line-color: var(--sk-fg) !important;
  --link-active-line-color: var(--sk-fg) !important;
  color: var(--sk-fg-2) !important;
}
${SK} .profile__nav[data-type="sidebar"] a.active {
  color: var(--sk-fg) !important;
}
/* рейтинг пользователей /leaders: сток красит саму таблицу белым (#fff) и
   чередует строки со светло-серой #f9f9f9, а номера мест, очки и имена
   (в овальных капсулах .leaders-list-item__user-avatar) — тёмными #222.
   Таблица — в панель с чередованием строк, весь тёмный текст — текстом темы. */
${SK} table.leaders-list {
  background-color: var(--sk-panel) !important;
}
${SK} table.leaders-list tr.leaders-list-item:nth-child(odd) {
  background-color: var(--sk-panel) !important;
}
${SK} table.leaders-list tr.leaders-list-item:nth-child(even) {
  background-color: var(--sk-panel-2) !important;
}
${SK} .leaders-list-item__rank-num,
${SK} .leaders-stat,
${SK} .leaders-list-item__user-avatar {
  color: var(--sk-fg) !important;
}
${SK} .leaders-list-item__user-avatar .user-avatar__name,
${SK} .leaders-list-item__user-avatar .user-avatar__link {
  color: var(--sk-fg) !important;
}

/* ================= МОЁ ОБУЧЕНИЕ (/learn) =================
   Карточка «N дней без перерыва» несёт собственный data-theme=light и
   светлый фон #fcfcfc (плюс градиент у активной), «избранный курс» —
   светлый градиент #f4f5fd→#e9f2ff, разделитель секций — лавандовый
   #E9EBFA, кнопка прокрутки карусели — полупрозрачно-белая. */
${SK} .learn-last-activity-card,
${SK} .learn-last-activity-card[data-theme="light"] {
  --last-activity-card-color: var(--sk-fg) !important;
  --last-activity-card-bg-color: var(--sk-panel) !important;
  --last-activity-card-border-color: var(--sk-border) !important;
  --last-activity-card-icon-neutral: var(--sk-fg-3) !important;
  background-color: var(--sk-panel) !important;
  background-image: none !important;
  border-color: var(--sk-border) !important;
  color: var(--sk-fg) !important;
}
${SK} .learn-last-activity,
${SK} .learn-last-activity-card {
  --skeleton-color-1: var(--sk-panel-2) !important;
  --skeleton-color-2: var(--sk-border) !important;
}
${SK} .learn-last-activity-card__title,
${SK} .learn-last-activity-card__desc,
${SK} .learn-last-activity-card__tip,
${SK} .learn-last-activity-card__timer,
${SK} .learn-last-activity-card__timer .time-left,
${SK} .learn-last-activity-card__stat,
${SK} .learn-last-activity-card__stat-item,
${SK} .learn-last-activity-card__stat-item b {
  color: var(--sk-fg) !important;
}
${SK} .learn-last-activity-pin__caption {
  color: var(--sk-fg-2) !important;
}
/* «дни стрика» в попапе прогресса: в стоке пройденный день — зелёный
   (#6c6) с галочкой, будущий — светло-серый, сегодняшний — зелёная
   рамка; перекрасив все в одну панель, мы теряли градацию */
${SK} .learn-last-activity-pin .learn-last-activity-pin__streak {
  background-color: var(--sk-panel-2) !important;
}
${SK} .learn-last-activity-pin[data-is-solved] .learn-last-activity-pin__streak {
  background-color: var(--sk-accent) !important;
}
${SK} .learn-last-activity-pin[data-is-solved] .learn-last-activity-pin__streak::after {
  background-color: var(--sk-bg) !important;
}
${SK} .learn-last-activity-pin[data-is-future] .learn-last-activity-pin__streak {
  background-color: var(--sk-bg-alt) !important;
  border: 1px solid var(--sk-border-2) !important;
}
${SK} .learn-last-activity-pin[data-is-future] .learn-last-activity-pin__caption {
  color: var(--sk-fg-muted) !important;
}
${SK} .learn-last-activity-pin[data-is-today] .learn-last-activity-pin__streak {
  background-color: transparent !important;
  border: 2px solid var(--sk-accent) !important;
}
${SK} .learn-last-activity-pin[data-is-current]:not([data-is-today]) .learn-last-activity-pin__caption {
  border-bottom-color: var(--sk-fg-2) !important;
}
/* второй вариант «пинов» (неделя в профиле) */
${SK} .learn-last-activity__pin[data-current] {
  border-color: var(--sk-accent-2) !important;
  color: var(--sk-accent-2) !important;
}
${SK} .learn-last-activity__pin[data-quizzes-solved]:not([data-quizzes-solved="0"]) {
  background-color: var(--sk-bg-alt) !important;
}
/* индиго-цифры стрика (#6c7bdf / #3e50cb) — осветляем под акценты */
${SK} .learn-last-activity__days-streak {
  color: var(--sk-blue) !important;
}
${SK} .learn-last-activity__days-streak b {
  color: var(--sk-accent-2) !important;
}
${SK} .learn-featured-course-card,
${SK} .learn-featured-course-card[data-state="done"] {
  background-color: var(--sk-panel) !important;
  background-image: none !important;
}
${SK} .learn-index__section-divider {
  background-color: var(--sk-border) !important;
}
${SK} .horizontal-scroller__scroll-btn {
  background-color: var(--sk-panel-2) !important;
  color: var(--sk-fg-2) !important;
}
${SK} .horizontal-scroller__scroll-btn:active {
  background-color: var(--sk-border) !important;
}
`;
  }

  function buildCss(themeId) {
    const t = THEMES[themeId];
    if (!t) return '';
    return coreCss() + '\n' + skCss(themeId, t);
  }

  /* ============================================================
   *  Хранилище предпочтений
   * ============================================================ */

  const STORE = 'sk-dark-theme';

  function getStored() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }
  function setStored(v) {
    try { if (v) localStorage.setItem(STORE, v); else localStorage.removeItem(STORE); } catch (e) { /* noop */ }
  }

  /* ============================================================
   *  Применение темы
   * ============================================================ */

  let styleEl = null;
  function getStyleEl() {
    if (styleEl && styleEl.parentNode) return styleEl;
    const el = document.createElement('style');
    el.id = 'sk-dark-theme-style';
    el.setAttribute('data-sk-generated', '');
    const head = document.head || document.documentElement;
    head.appendChild(el);
    styleEl = el;
    return el;
  }

  function setBodyNight() {
    if (document.body) document.body.setAttribute('data-theme', 'night');
  }

  function applyTheme(themeId, silent) {
    const active = themeId && THEMES[themeId];
    const root = document.documentElement;

    if (active) {
      root.setAttribute('data-sk-theme', themeId);
      setBodyNight();
      getStyleEl().textContent = buildCss(themeId);
    } else {
      root.removeAttribute('data-sk-theme');
      if (document.body) document.body.removeAttribute('data-theme');
      if (styleEl && styleEl.parentNode) styleEl.textContent = '';
    }

    if (!silent) setStored(active ? themeId : '');
    const btn = document.getElementById('sk-dark-theme-toggle');
    if (btn) btn.title = active ? `Тема: ${THEMES[themeId].name} — клик для смены` : 'Тема: выключена — клик для смены';
    updatePicker(active ? themeId : null);
  }

  function currentTheme() {
    const stored = getStored();
    return stored && THEMES[stored] ? stored : null;
  }

  /* ============================================================
   *  Интерфейс переключателя
   * ============================================================ */

  const PICKER_CSS = `
#sk-dark-theme-toggle {
  position: fixed; right: 18px; bottom: 18px; z-index: 2147483645;
  width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: var(--sk-panel-2, #313244) !important; color: var(--sk-fg-2, #bac2de) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,.45); font-size: 20px; line-height: 1;
  transition: transform .15s ease, box-shadow .15s ease;
}
#sk-dark-theme-toggle:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,.55); }
#sk-dark-theme-toggle svg { width: 24px; height: 24px; fill: currentColor; }
#sk-dark-theme-panel {
  position: fixed; right: 18px; bottom: 74px; z-index: 2147483646;
  width: 300px; max-width: calc(100vw - 32px); max-height: min(80vh, 560px); overflow-y: auto;
  background: var(--sk-panel, #181825) !important; color: var(--sk-fg, #cdd6f4) !important;
  border: 1px solid var(--sk-border, #45475a) !important; border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,.5);
  padding: 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  box-sizing: border-box;
}
#sk-dark-theme-panel h3 { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: var(--sk-fg, #cdd6f4) !important; }
#sk-dark-theme-panel .sk-sub { margin: 0 0 12px; font-size: 12px; color: var(--sk-fg-muted, #6c7086) !important; }
#sk-dark-theme-panel button.sk-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 10px; margin: 2px 0; border: 1px solid transparent; border-radius: 8px;
  background: transparent !important; color: var(--sk-fg, #cdd6f4) !important; cursor: pointer;
  text-align: left; font-size: 13.5px; font-family: inherit;
}
#sk-dark-theme-panel button.sk-item:hover { background: var(--sk-panel-2, #313244) !important; }
#sk-dark-theme-panel button.sk-item.active { border-color: var(--sk-accent, #a6e3a1) !important; background: var(--sk-panel-2, #313244) !important; }
#sk-dark-theme-panel .sk-item .sk-dots { display: flex; gap: 4px; flex: 0 0 auto; }
#sk-dark-theme-panel .sk-item .sk-dots i { width: 14px; height: 14px; border-radius: 50%; display: block; border: 1px solid rgba(255,255,255,.25); }
#sk-dark-theme-panel .sk-item .sk-txt { display: flex; flex-direction: column; min-width: 0; }
#sk-dark-theme-panel .sk-item .sk-name { font-weight: 600; line-height: 1.25; }
#sk-dark-theme-panel .sk-item .sk-about { font-size: 11px; color: var(--sk-fg-3, #a6adc8) !important; line-height: 1.3; }
#sk-dark-theme-panel .sk-sep { height: 1px; background: var(--sk-border, #45475a) !important; margin: 8px 0; }
#sk-dark-theme-panel .sk-off { justify-content: center; color: var(--sk-fg-2, #bac2de) !important; font-weight: 600; }
`;

  function pickerHtml() {
    let items = '';
    Object.keys(THEMES).forEach((id) => {
      const t = THEMES[id];
      const dots = t.swatches.map((c) => `<i style="background:${c}"></i>`).join('');
      items += `<button class="sk-item" data-sk-theme-id="${id}" type="button">
        <span class="sk-dots">${dots}</span>
        <span class="sk-txt"><span class="sk-name">${t.name}</span>
        <span class="sk-about">${t.desc}</span></span>
      </button>`;
    });
    return `<h3>Темы Stepik</h3>
      <p class="sk-sub">Фирменная · Catppuccin · Kate · Tango LOR — нажмите для применения</p>
      <button class="sk-item sk-off" data-sk-theme-id="" type="button">Светлая тема (выключить)</button>
      <div class="sk-sep"></div>
      ${items}`;
  }

  function updatePicker(activeId) {
    const panel = document.getElementById('sk-dark-theme-panel');
    if (!panel) return;
    panel.querySelectorAll('.sk-item').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-sk-theme-id') === (activeId || ''));
    });
  }

  function ensurePicker() {
    if (document.getElementById('sk-dark-theme-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'sk-dark-theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Тема оформления');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
    const panel = document.createElement('div');
    panel.id = 'sk-dark-theme-panel';
    panel.style.display = 'none';
    panel.innerHTML = pickerHtml();

    btn.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    panel.addEventListener('click', (e) => {
      const item = e.target.closest('.sk-item');
      if (!item) return;
      const id = item.getAttribute('data-sk-theme-id');
      applyTheme(id || null);
      panel.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#sk-dark-theme-toggle') && !e.target.closest('#sk-dark-theme-panel')) {
        panel.style.display = 'none';
      }
    });

    const ps = document.createElement('style');
    ps.id = 'sk-dark-theme-picker-css';
    ps.textContent = PICKER_CSS;

    const mount = () => {
      const head = document.head || document.documentElement;
      if (!document.getElementById('sk-dark-theme-picker-css')) head.appendChild(ps);
      (document.body || document.documentElement).appendChild(btn);
      (document.body || document.documentElement).appendChild(panel);
    };
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  }

  /* ============================================================
   *  Запуск
   * ============================================================ */

  /* CKEditor рисует область ввода в отдельном iframe, куда наш <style> не
   * достаёт, а переменные темы там не определены — переносим конкретные
   * цвета и подкрашиваем документ внутри фрейма. */
  function skFixEditors() {
    const cs = getComputedStyle(document.documentElement);
    const get = (n, d) => (cs.getPropertyValue(n) || '').trim() || d;
    const panel = get('--sk-panel', '#282b41');
    const fg = get('--sk-fg', '#EEEEF0');
    const blue = get('--sk-blue', '#56A4FF');
    const codeBg = get('--sk-code-bg', '#1F1F2F');
    const codeFg = get('--sk-code-fg', '#E6E6E6');
    const border = get('--sk-border', '#3F3F3F');
    const css = 'html,body{background:' + panel + ' !important;color:' + fg + ' !important;}'
      + 'body{margin:0 !important;padding:8px !important;}'
      + 'a{color:' + blue + ' !important;}'
      + 'code,pre,kbd,tt{background:' + codeBg + ' !important;color:' + codeFg + ' !important;border-color:' + border + ' !important;}'
      + 'blockquote,hr{border-color:' + border + ' !important;}'
      + 'table,td,th{border-color:' + border + ' !important;}';
    let frames;
    try { frames = document.querySelectorAll('iframe.cke_wysiwyg_frame'); } catch (e) { return; }
    for (let i = 0; i < frames.length; i++) {
      let doc = null;
      try { doc = frames[i].contentDocument; } catch (e) { continue; }
      if (!doc || !doc.head) continue;
      let st = doc.getElementById('sk-cke-style');
      if (!st) {
        st = doc.createElement('style');
        st.id = 'sk-cke-style';
        doc.head.appendChild(st);
      }
      if (st.textContent !== css) st.textContent = css;
    }
  }

  /* Текст урока/описания из редактора часто несёт инлайновый цвет светлой
   * темы (style="color:#25282d" и т.п.) — статикой его не перебить. Находим
   * такие узлы и, если цвет действительно тёмный, поднимаем до --sk-fg
   * (яркие авторские акценты вроде синих заголовков не трогаем). */
  function skLum(v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  function skFixInlineColors() {
    let nodes;
    try {
      nodes = document.querySelectorAll('.html-content [style*="color"], .step-text-wrapper [style*="color"], .rich-text-viewer [style*="color"], .show-more__content [style*="color"], .course-promo__description [style*="color"], .profile__header-details [style*="color"]');
    } catch (e) { return; }
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (el.getAttribute('data-sk-inline-fixed') === '1') continue;
      let raw = '';
      try { raw = el.getAttribute('style') || ''; } catch (e) { continue; }
      if (!/color\s*:/i.test(raw)) continue;
      const m = getComputedStyle(el).color.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const p = m[1].split(',').map(Number);
        const lum = 0.2126 * skLum(p[0]) + 0.7152 * skLum(p[1]) + 0.0722 * skLum(p[2]);
        if (lum < 0.13) {
          try { el.style.setProperty('color', 'var(--sk-fg)', 'important'); } catch (e) {}
        }
      }
      el.setAttribute('data-sk-inline-fixed', '1');
    }
  }

  function init() {
    applyTheme(currentTheme(), true);
    ensurePicker();
  }

  /* Применяем тему сразу в момент document-start, чтобы не было
   * «вспышки» светлой страницы: body появится позже — его атрибут
   * data-theme=night доставит MutationObserver ниже. */
  const initialTheme = currentTheme();
  if (initialTheme) {
    try {
      document.documentElement.setAttribute('data-sk-theme', initialTheme);
      getStyleEl().textContent = buildCss(initialTheme);
    } catch (e) { /* noop */ }
    /* CKEditor и инлайновые цвета появляются асинхронно — догоняем */
    try { skFixEditors(); skFixInlineColors(); } catch (e) { /* noop */ }
    /* В юзерскрипте штатный setInterval держим только там, где есть DOM
     * (в тестовом Node-харнессе querySelectorAll отсутствует — иначе
     * таймер не даёт процессу завершиться). */
    if (typeof document.querySelectorAll === 'function') {
      try {
        setInterval(() => { try { skFixEditors(); skFixInlineColors(); } catch (e) { /* noop */ } }, 1500);
      } catch (e) { /* noop */ }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Если Stepik сам управляет body[data-theme] — не даём сбросить */
  if (window.MutationObserver) {
    try {
      const mo = new MutationObserver(() => {
        const t = currentTheme();
        if (t && document.body && document.body.getAttribute('data-theme') !== 'night') {
          document.body.setAttribute('data-theme', 'night');
        }
        if (t && document.documentElement.getAttribute('data-sk-theme') !== t) {
          document.documentElement.setAttribute('data-sk-theme', t);
        }
      });
      mo.observe(document.documentElement, { childList: true, attributes: true, attributeFilter: ['data-theme'] });
    } catch (e) { /* noop */ }
  }
})();