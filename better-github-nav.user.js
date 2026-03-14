// ==UserScript==
// @name         Better GitHub Navigation
// @name:zh-CN   更好的 GitHub 导航栏
// @namespace    https://github.com/ImXiangYu/better-github-nav
// @version      0.1.50
// @description  Bring Dashboard, Trending, Explore, Collections, and Stars closer on desktop and narrow screens, and keep your most-used repositories pinned where they are easiest to reach.
// @description:zh-CN 在桌面端和窄屏场景下，把 Dashboard、Trending、Explore、Collections、Stars 放到更顺手的位置，并把你最常用的仓库固定在最容易到达的地方。
// @author       Ayubass
// @license      MIT
// @match        https://github.com/*
// @icon         https://github.githubassets.com/pinned-octocat.svg
// @updateURL    https://raw.githubusercontent.com/ImXiangYu/better-github-nav/main/better-github-nav.user.js
// @downloadURL  https://raw.githubusercontent.com/ImXiangYu/better-github-nav/main/better-github-nav.user.js
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
  // src/constants.js
  var SCRIPT_VERSION = "0.1.50";
  var CUSTOM_BUTTON_CLASS = "custom-gh-nav-btn";
  var CUSTOM_BUTTON_ACTIVE_CLASS = "custom-gh-nav-btn-active";
  var CUSTOM_BUTTON_COMPACT_CLASS = "custom-gh-nav-btn-compact";
  var QUICK_LINK_MARK_ATTR = "data-better-gh-nav-quick-link";
  var QUICK_LINK_HOST_MARK_ATTR = "data-better-gh-nav-quick-link-host";
  var QUICK_LINK_LAST_MARK_ATTR = "data-better-gh-nav-quick-link-last";
  var RESPONSIVE_TOGGLE_MARK_ATTR = "data-better-gh-nav-overflow-toggle";
  var CONFIG_STORAGE_KEY = "better-gh-nav-config-v1";
  var TOP_REPOSITORIES_PIN_STORAGE_KEY = "better-gh-nav-top-repositories-pins-v1";
  var UI_LANG_STORAGE_KEY = "better-gh-nav-ui-lang-v1";
  var THEME_ATTR = "data-better-github-nav-theme";
  var THEME_SOURCE_ATTR = "data-better-github-nav-theme-source";
  var SETTINGS_OVERLAY_ID = "custom-gh-nav-settings-overlay";
  var SETTINGS_PANEL_ID = "custom-gh-nav-settings-panel";
  var SETTINGS_MESSAGE_ID = "custom-gh-nav-settings-message";
  var DEFAULT_LINK_KEYS = ["dashboard", "explore", "trending", "collections", "stars"];
  var PRESET_LINKS = [
    { key: "dashboard", text: "Dashboard", path: "/dashboard", getHref: () => "/dashboard" },
    { key: "explore", text: "Explore", path: "/explore", getHref: () => "/explore" },
    { key: "trending", text: "Trending", path: "/trending", getHref: () => "/trending" },
    { key: "collections", text: "Collections", path: "/collections", getHref: () => "/collections" },
    { key: "stars", text: "Stars", path: "/stars", getHref: (username) => username ? `/${username}?tab=stars` : "/stars" }
  ];
  var PRESET_LINK_SHORTCUTS = {
    dashboard: "g d",
    explore: "g e",
    trending: "g t",
    collections: "g c",
    stars: "g s"
  };
  var I18N = {
    zh: {
      menuOpenSettings: "Better GitHub Nav: 打开设置面板",
      menuResetSettings: "Better GitHub Nav: 重置快捷链接配置",
      menuLangZh: "Better GitHub Nav: 界面语言 -> 中文",
      menuLangEn: "Better GitHub Nav: 界面语言 -> English",
      menuLangAuto: "Better GitHub Nav: 界面语言 -> 自动（跟随页面）",
      menuThemeLight: "Better GitHub Nav: 主题 -> 亮色",
      menuThemeDark: "Better GitHub Nav: 主题 -> 暗色",
      menuThemeAuto: "Better GitHub Nav: 主题 -> 自动（跟随 GitHub）",
      resetConfirm: "确认重置快捷链接配置为默认值吗？",
      panelTitle: "Better GitHub Nav 设置",
      panelDesc: "勾选决定显示项，拖动整行（或右侧手柄）调整显示顺序。",
      resetDefault: "恢复默认",
      cancel: "取消",
      saveAndRefresh: "保存并刷新",
      restoredPendingSave: "已恢复默认，点击保存后生效。",
      atLeastOneLink: "至少保留 1 个快捷链接。",
      openQuickLinksMenu: "展开快捷链接",
      closeQuickLinksMenu: "收起快捷链接",
      quickLinksMenu: "快捷链接",
      dragHandleTitle: "拖动调整顺序",
      dragRowTitle: "拖动整行调整顺序",
      pinTopRepository: "置顶仓库：{repo}",
      unpinTopRepository: "取消置顶仓库：{repo}"
    },
    en: {
      menuOpenSettings: "Better GitHub Nav: Open Settings Panel",
      menuResetSettings: "Better GitHub Nav: Reset Quick Link Config",
      menuLangZh: "Better GitHub Nav: UI Language -> 中文",
      menuLangEn: "Better GitHub Nav: UI Language -> English",
      menuLangAuto: "Better GitHub Nav: UI Language -> Auto (Follow Page)",
      menuThemeLight: "Better GitHub Nav: Theme -> Light",
      menuThemeDark: "Better GitHub Nav: Theme -> Dark",
      menuThemeAuto: "Better GitHub Nav: Theme -> Auto (Follow GitHub)",
      resetConfirm: "Reset quick-link config to defaults?",
      panelTitle: "Better GitHub Nav Settings",
      panelDesc: "Select visible links and drag the row (or handle) to reorder.",
      resetDefault: "Reset to Default",
      cancel: "Cancel",
      saveAndRefresh: "Save and Refresh",
      restoredPendingSave: "Defaults restored. Click save to apply.",
      atLeastOneLink: "Keep at least 1 quick link.",
      openQuickLinksMenu: "Show quick links",
      closeQuickLinksMenu: "Hide quick links",
      quickLinksMenu: "Quick links",
      dragHandleTitle: "Drag to reorder",
      dragRowTitle: "Drag row to reorder",
      pinTopRepository: "Pin repository: {repo}",
      unpinTopRepository: "Unpin repository: {repo}"
    }
  };

  // src/config.js
  function sanitizeThemePreference(themePreference) {
    return themePreference === "light" || themePreference === "dark" ? themePreference : "auto";
  }
  function sanitizeKeys(keys) {
    const validSet = new Set(DEFAULT_LINK_KEYS);
    const seen = /* @__PURE__ */ new Set();
    const result = [];
    keys.forEach((key) => {
      if (validSet.has(key) && !seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    });
    return result;
  }
  function sanitizeConfig(rawConfig) {
    const enabledKeys = sanitizeKeys(Array.isArray(rawConfig?.enabledKeys) ? rawConfig.enabledKeys : DEFAULT_LINK_KEYS);
    const orderKeysRaw = sanitizeKeys(Array.isArray(rawConfig?.orderKeys) ? rawConfig.orderKeys : DEFAULT_LINK_KEYS);
    const orderSet = new Set(orderKeysRaw);
    const orderKeys = [
      ...orderKeysRaw,
      ...DEFAULT_LINK_KEYS.filter((key) => !orderSet.has(key))
    ];
    const themePreference = sanitizeThemePreference(rawConfig?.themePreference);
    return {
      enabledKeys: enabledKeys.length ? enabledKeys : DEFAULT_LINK_KEYS.slice(),
      orderKeys: orderKeys.length ? orderKeys : DEFAULT_LINK_KEYS.slice(),
      themePreference
    };
  }
  function loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!raw) return sanitizeConfig({});
      return sanitizeConfig(JSON.parse(raw));
    } catch (e) {
      return sanitizeConfig({});
    }
  }
  function saveConfig(config) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitizeConfig(config)));
  }
  function updateConfig(partialConfig) {
    const currentConfig = loadConfig();
    saveConfig({
      ...currentConfig,
      ...partialConfig
    });
  }
  function getConfiguredLinks(username) {
    const config = loadConfig();
    const presetMap = new Map(
      PRESET_LINKS.map((link) => [link.key, {
        ...link,
        id: `custom-gh-btn-${link.key}`,
        href: link.getHref(username)
      }])
    );
    return config.orderKeys.filter((key) => config.enabledKeys.includes(key)).map((key) => presetMap.get(key)).filter(Boolean);
  }
  function getDisplayNameByKey(key) {
    const link = PRESET_LINKS.find((item) => item.key === key);
    return link ? link.text : key;
  }

  // src/i18n.js
  var uiLang = detectUiLang();
  function t(key, vars = {}) {
    const dict = I18N[uiLang] || I18N.en;
    const fallback = I18N.en;
    const template = dict[key] || fallback[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, varName) => String(vars[varName] ?? ""));
  }
  function detectUiLang() {
    try {
      const preferredLang = (localStorage.getItem(UI_LANG_STORAGE_KEY) || "").toLowerCase();
      if (preferredLang === "zh" || preferredLang === "en") return preferredLang;
    } catch (e) {
    }
    const autoLang = (document.documentElement.lang || navigator.language || "").toLowerCase();
    return autoLang.startsWith("zh") ? "zh" : "en";
  }
  function setUiLangPreference(lang) {
    try {
      if (lang === "zh" || lang === "en") {
        localStorage.setItem(UI_LANG_STORAGE_KEY, lang);
      } else {
        localStorage.removeItem(UI_LANG_STORAGE_KEY);
      }
    } catch (e) {
    }
    uiLang = detectUiLang();
  }

  // src/styles.js
  function ensureStyles() {
    if (document.getElementById("custom-gh-nav-style")) return;
    const style = document.createElement("style");
    style.id = "custom-gh-nav-style";
    style.textContent = `
        :root {
            --bgn-color-scheme: light;
            --bgn-fg-default: #1f2328;
            --bgn-fg-muted: #656d76;
            --bgn-fg-on-emphasis: #ffffff;
            --bgn-border-default: #d1d9e0;
            --bgn-border-muted: #d8dee4;
            --bgn-surface-default: #ffffff;
            --bgn-surface-subtle: #f6f8fa;
            --bgn-surface-hover: rgba(177, 186, 196, 0.12);
            --bgn-surface-active: rgba(177, 186, 196, 0.18);
            --bgn-accent-fg: #0969da;
            --bgn-accent-subtle: rgba(9, 105, 218, 0.08);
            --bgn-btn-bg: #f6f8fa;
            --bgn-btn-hover-bg: #f3f4f6;
            --bgn-btn-primary-bg: #1f883d;
            --bgn-btn-primary-hover-bg: #1a7f37;
            --bgn-btn-primary-text: #ffffff;
            --bgn-attention-fg: #9a6700;
            --bgn-tooltip-bg: #1f2328;
            --bgn-tooltip-kbd-bg: rgba(110, 118, 129, 0.4);
            --bgn-overlay-backdrop: rgba(0, 0, 0, 0.45);
            --bgn-shadow-medium: 0 8px 24px rgba(0, 0, 0, 0.2);
            --bgn-shadow-large: 0 16px 32px rgba(0, 0, 0, 0.16);
            --bgn-shadow-panel: 0 16px 40px rgba(0, 0, 0, 0.25);
        }
        :root[${THEME_SOURCE_ATTR}="auto"][${THEME_ATTR}="light"] {
            --bgn-color-scheme: light;
            --bgn-fg-default: var(--color-fg-default, #1f2328);
            --bgn-fg-muted: var(--color-fg-muted, #656d76);
            --bgn-fg-on-emphasis: var(--color-fg-on-emphasis, #ffffff);
            --bgn-border-default: var(--color-border-default, #d1d9e0);
            --bgn-border-muted: var(--color-border-muted, #d8dee4);
            --bgn-surface-default: var(--color-canvas-default, #ffffff);
            --bgn-surface-subtle: var(--color-canvas-subtle, #f6f8fa);
            --bgn-surface-hover: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
            --bgn-surface-active: var(--color-neutral-muted, rgba(177, 186, 196, 0.18));
            --bgn-accent-fg: var(--color-accent-fg, #0969da);
            --bgn-accent-subtle: var(--color-accent-subtle, rgba(9, 105, 218, 0.08));
            --bgn-btn-bg: var(--color-btn-bg, #f6f8fa);
            --bgn-btn-hover-bg: var(--color-btn-hover-bg, #f3f4f6);
            --bgn-btn-primary-bg: var(--color-btn-primary-bg, #1f883d);
            --bgn-btn-primary-hover-bg: var(--color-btn-primary-hover-bg, #1a7f37);
            --bgn-btn-primary-text: var(--color-btn-primary-text, #ffffff);
            --bgn-attention-fg: var(--color-attention-fg, #9a6700);
            --bgn-tooltip-bg: var(--color-neutral-emphasis-plus, #1f2328);
            --bgn-tooltip-kbd-bg: rgba(110, 118, 129, 0.4);
            --bgn-overlay-backdrop: rgba(0, 0, 0, 0.45);
            --bgn-shadow-medium: var(--color-shadow-medium, 0 8px 24px rgba(0, 0, 0, 0.2));
            --bgn-shadow-large: var(--color-shadow-large, 0 16px 32px rgba(0, 0, 0, 0.16));
            --bgn-shadow-panel: 0 16px 40px rgba(0, 0, 0, 0.25);
        }
        :root[${THEME_SOURCE_ATTR}="auto"][${THEME_ATTR}="dark"] {
            --bgn-color-scheme: dark;
            --bgn-fg-default: var(--color-fg-default, #e6edf3);
            --bgn-fg-muted: var(--color-fg-muted, #8b949e);
            --bgn-fg-on-emphasis: var(--color-fg-on-emphasis, #ffffff);
            --bgn-border-default: var(--color-border-default, #30363d);
            --bgn-border-muted: var(--color-border-muted, #30363d);
            --bgn-surface-default: var(--color-canvas-default, #0d1117);
            --bgn-surface-subtle: var(--color-canvas-subtle, #161b22);
            --bgn-surface-hover: var(--color-neutral-muted, rgba(110, 118, 129, 0.22));
            --bgn-surface-active: var(--color-neutral-muted, rgba(110, 118, 129, 0.32));
            --bgn-accent-fg: var(--color-accent-fg, #58a6ff);
            --bgn-accent-subtle: var(--color-accent-subtle, rgba(56, 139, 253, 0.18));
            --bgn-btn-bg: var(--color-btn-bg, #212830);
            --bgn-btn-hover-bg: var(--color-btn-hover-bg, #30363d);
            --bgn-btn-primary-bg: var(--color-btn-primary-bg, #238636);
            --bgn-btn-primary-hover-bg: var(--color-btn-primary-hover-bg, #2ea043);
            --bgn-btn-primary-text: var(--color-btn-primary-text, #ffffff);
            --bgn-attention-fg: var(--color-attention-fg, #d29922);
            --bgn-tooltip-bg: var(--color-neutral-emphasis-plus, #21262d);
            --bgn-tooltip-kbd-bg: rgba(139, 148, 158, 0.35);
            --bgn-overlay-backdrop: rgba(1, 4, 9, 0.72);
            --bgn-shadow-medium: var(--color-shadow-medium, 0 8px 24px rgba(1, 4, 9, 0.45));
            --bgn-shadow-large: var(--color-shadow-large, 0 16px 32px rgba(1, 4, 9, 0.5));
            --bgn-shadow-panel: 0 18px 42px rgba(1, 4, 9, 0.6);
        }
        :root[${THEME_SOURCE_ATTR}="custom"][${THEME_ATTR}="light"] {
            --bgn-color-scheme: light;
            --bgn-fg-default: #1f2328;
            --bgn-fg-muted: #656d76;
            --bgn-fg-on-emphasis: #ffffff;
            --bgn-border-default: #d1d9e0;
            --bgn-border-muted: #d8dee4;
            --bgn-surface-default: #ffffff;
            --bgn-surface-subtle: #f6f8fa;
            --bgn-surface-hover: rgba(177, 186, 196, 0.12);
            --bgn-surface-active: rgba(177, 186, 196, 0.18);
            --bgn-accent-fg: #0969da;
            --bgn-accent-subtle: rgba(9, 105, 218, 0.08);
            --bgn-btn-bg: #f6f8fa;
            --bgn-btn-hover-bg: #f3f4f6;
            --bgn-btn-primary-bg: #1f883d;
            --bgn-btn-primary-hover-bg: #1a7f37;
            --bgn-btn-primary-text: #ffffff;
            --bgn-attention-fg: #9a6700;
            --bgn-tooltip-bg: #1f2328;
            --bgn-tooltip-kbd-bg: rgba(110, 118, 129, 0.4);
            --bgn-overlay-backdrop: rgba(0, 0, 0, 0.45);
            --bgn-shadow-medium: 0 8px 24px rgba(0, 0, 0, 0.2);
            --bgn-shadow-large: 0 16px 32px rgba(0, 0, 0, 0.16);
            --bgn-shadow-panel: 0 16px 40px rgba(0, 0, 0, 0.25);
        }
        :root[${THEME_SOURCE_ATTR}="custom"][${THEME_ATTR}="dark"] {
            --bgn-color-scheme: dark;
            --bgn-fg-default: #e6edf3;
            --bgn-fg-muted: #8b949e;
            --bgn-fg-on-emphasis: #ffffff;
            --bgn-border-default: #30363d;
            --bgn-border-muted: #30363d;
            --bgn-surface-default: #0d1117;
            --bgn-surface-subtle: #161b22;
            --bgn-surface-hover: rgba(110, 118, 129, 0.22);
            --bgn-surface-active: rgba(110, 118, 129, 0.32);
            --bgn-accent-fg: #58a6ff;
            --bgn-accent-subtle: rgba(56, 139, 253, 0.18);
            --bgn-btn-bg: #212830;
            --bgn-btn-hover-bg: #30363d;
            --bgn-btn-primary-bg: #238636;
            --bgn-btn-primary-hover-bg: #2ea043;
            --bgn-btn-primary-text: #ffffff;
            --bgn-attention-fg: #d29922;
            --bgn-tooltip-bg: #21262d;
            --bgn-tooltip-kbd-bg: rgba(139, 148, 158, 0.35);
            --bgn-overlay-backdrop: rgba(1, 4, 9, 0.72);
            --bgn-shadow-medium: 0 8px 24px rgba(1, 4, 9, 0.45);
            --bgn-shadow-large: 0 16px 32px rgba(1, 4, 9, 0.5);
            --bgn-shadow-panel: 0 18px 42px rgba(1, 4, 9, 0.6);
        }
        a.${CUSTOM_BUTTON_CLASS} {
            border-radius: 6px;
            padding-inline: 8px;
            text-decoration: none;
        }
        a.${CUSTOM_BUTTON_CLASS}.${CUSTOM_BUTTON_COMPACT_CLASS} {
            padding-inline: 4px;
        }
        a.${CUSTOM_BUTTON_CLASS},
        a.${CUSTOM_BUTTON_CLASS} span {
            font-weight: 600;
        }
        a.${CUSTOM_BUTTON_CLASS},
        a.${CUSTOM_BUTTON_CLASS} * {
            cursor: pointer;
        }
        header [${QUICK_LINK_LAST_MARK_ATTR}="1"]::after,
        header [${QUICK_LINK_LAST_MARK_ATTR}="1"] > a::after,
        header a[${QUICK_LINK_MARK_ATTR}="1"][${QUICK_LINK_LAST_MARK_ATTR}="1"]::after {
            content: none !important;
            display: none !important;
        }
        a.${CUSTOM_BUTTON_CLASS}:hover {
            background-color: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
            text-decoration: none;
        }
        a.${CUSTOM_BUTTON_CLASS}.${CUSTOM_BUTTON_ACTIVE_CLASS} {
            background-color: var(--color-neutral-muted, rgba(177, 186, 196, 0.18));
            font-weight: 600;
        }
        .custom-gh-nav-overflow-host {
            position: relative;
            display: inline-flex;
            align-items: center;
            list-style: none;
        }
        .custom-gh-nav-overflow-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            min-width: 28px;
            min-height: 28px;
            padding: 0;
            border: 1px solid var(--bgn-border-default);
            border-radius: 6px;
            background: var(--bgn-surface-subtle);
            color: var(--bgn-fg-default);
            color-scheme: var(--bgn-color-scheme);
            font: inherit;
            font-weight: 600;
            line-height: 1;
            cursor: pointer;
        }
        .custom-gh-nav-overflow-toggle:hover,
        .custom-gh-nav-overflow-toggle[aria-expanded="true"] {
            background-color: var(--bgn-surface-hover);
        }
        .custom-gh-nav-overflow-toggle:focus-visible {
            outline: 2px solid var(--bgn-accent-fg);
            outline-offset: 1px;
        }
        .custom-gh-nav-overflow-toggle-icon {
            flex: 0 0 auto;
            transition: transform 120ms ease;
        }
        .custom-gh-nav-overflow-toggle[aria-expanded="true"] .custom-gh-nav-overflow-toggle-icon {
            transform: rotate(180deg);
        }
        .custom-gh-nav-overflow-menu {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 2147483646;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 220px;
            max-width: min(280px, calc(100vw - 16px));
            padding: 6px;
            border: 1px solid var(--bgn-border-default);
            border-radius: 12px;
            background: var(--bgn-surface-default);
            color: var(--bgn-fg-default);
            color-scheme: var(--bgn-color-scheme);
            box-shadow: var(--bgn-shadow-large);
            box-sizing: border-box;
        }
        .custom-gh-nav-overflow-menu[hidden] {
            display: none !important;
        }
        .custom-gh-nav-overflow-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 32px;
            padding: 6px 10px;
            border-radius: 8px;
            color: var(--bgn-fg-default);
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
        }
        .custom-gh-nav-overflow-link:hover {
            background: var(--bgn-surface-hover);
            text-decoration: none;
        }
        .custom-gh-nav-overflow-link[aria-current="page"] {
            color: var(--bgn-accent-fg);
            background: var(--bgn-accent-subtle);
        }
        .custom-gh-nav-overflow-link-text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .custom-gh-nav-overflow-link-kbd {
            flex: 0 0 auto;
            margin: 0;
            padding: 2px 6px;
            border: none !important;
            border-radius: 999px;
            background: var(--bgn-surface-active) !important;
            color: var(--bgn-fg-muted);
            box-shadow: none !important;
            font: inherit;
            font-size: 11px;
            line-height: 1.2;
            text-transform: uppercase;
        }
        .custom-gh-nav-tooltip {
            position: fixed;
            z-index: 2147483647;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            max-width: min(320px, calc(100vw - 16px));
            background: var(--bgn-tooltip-bg);
            color: var(--bgn-fg-on-emphasis);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 400;
            line-height: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
            pointer-events: none;
            box-sizing: border-box;
            box-shadow: var(--bgn-shadow-medium);
            border: 1px solid var(--bgn-border-default);
            text-decoration: none;
        }
        .custom-gh-nav-tooltip[hidden] {
            display: none !important;
        }
        .custom-gh-nav-tooltip-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-decoration: none;
        }
        .custom-gh-nav-tooltip-hint-container {
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
            margin-left: 4px;
            text-decoration: none;
        }
        .custom-gh-nav-tooltip-kbd {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
            font: inherit;
            color: inherit;
            background: transparent !important;
            text-decoration: none !important;
        }
        .custom-gh-nav-tooltip-chord {
            display: inline-block;
            vertical-align: middle;
            padding: 0 4px;
            border-radius: 4px;
            background: var(--bgn-tooltip-kbd-bg);
            color: #ffffff;
            font-size: 11px;
            font-weight: 400;
            line-height: 18px;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
            text-transform: uppercase;
            box-sizing: border-box;
            border: none !important;
            box-shadow: none !important;
            text-decoration: none !important;
        }
        #${SETTINGS_OVERLAY_ID} {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            background: var(--bgn-overlay-backdrop);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            box-sizing: border-box;
        }
        #${SETTINGS_PANEL_ID} {
            width: min(560px, 100%);
            max-height: min(80vh, 720px);
            overflow: auto;
            background: var(--bgn-surface-default);
            color: var(--bgn-fg-default);
            border: 1px solid var(--bgn-border-default);
            border-radius: 10px;
            color-scheme: var(--bgn-color-scheme);
            box-shadow: var(--bgn-shadow-panel);
            padding: 16px;
            box-sizing: border-box;
        }
        .custom-gh-nav-settings-title {
            margin: 0 0 8px;
            font-size: 16px;
            line-height: 1.4;
        }
        .custom-gh-nav-settings-desc {
            margin: 0 0 12px;
            color: var(--bgn-fg-muted);
            font-size: 13px;
        }
        .custom-gh-nav-settings-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .custom-gh-nav-settings-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border: 1px solid var(--bgn-border-muted);
            border-radius: 8px;
            padding: 8px 10px;
            background: var(--bgn-surface-subtle);
            cursor: grab;
        }
        .custom-gh-nav-settings-row:active {
            cursor: grabbing;
        }
        .custom-gh-nav-settings-row-left {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            user-select: none;
            font-size: 13px;
        }
        .custom-gh-nav-settings-row-left input {
            cursor: pointer;
        }
        .custom-gh-nav-settings-row-actions {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .custom-gh-nav-settings-drag-handle {
            border: 1px solid var(--bgn-border-default);
            background: var(--bgn-btn-bg);
            color: var(--bgn-fg-muted);
            border-radius: 6px;
            width: 32px;
            height: 26px;
            line-height: 1;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            pointer-events: none;
        }
        .custom-gh-nav-settings-row-dragging {
            opacity: 0.55;
        }
        .custom-gh-nav-settings-row-drag-over {
            border-color: var(--bgn-accent-fg);
            background: var(--bgn-accent-subtle);
        }
        .custom-gh-nav-settings-btn {
            border: 1px solid var(--bgn-border-default);
            background: var(--bgn-btn-bg);
            color: var(--bgn-fg-default);
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
        }
        .custom-gh-nav-settings-btn:hover {
            background: var(--bgn-btn-hover-bg);
        }
        .custom-gh-nav-settings-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }
        .custom-gh-nav-settings-btn-primary {
            background: var(--bgn-btn-primary-bg);
            border-color: var(--bgn-btn-primary-bg);
            color: var(--bgn-btn-primary-text);
        }
        .custom-gh-nav-settings-btn-primary:hover {
            background: var(--bgn-btn-primary-hover-bg);
        }
        .custom-gh-nav-settings-footer {
            margin-top: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
        .custom-gh-nav-settings-message {
            min-height: 20px;
            margin-top: 8px;
            color: var(--bgn-attention-fg);
            font-size: 12px;
        }
        .custom-gh-top-repos-row {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
        }
        .custom-gh-top-repos-link {
            flex: 1 1 auto;
            min-width: 0;
        }
        .custom-gh-top-repos-pin {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 20px;
            height: 20px;
            border: none;
            border-radius: 6px;
            padding: 0;
            background: transparent;
            color: var(--color-fg-muted, #656d76);
            cursor: pointer;
            opacity: 0.75;
        }
        .custom-gh-top-repos-pin-icon {
            width: 12px;
            height: 12px;
            overflow: visible;
        }
        .custom-gh-top-repos-pin:hover {
            background: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
            color: var(--color-fg-default, #1f2328);
            opacity: 1;
        }
        .custom-gh-top-repos-pin:focus-visible {
            outline: 2px solid var(--color-accent-fg, #0969da);
            outline-offset: 1px;
        }
        .custom-gh-top-repos-pin.${CUSTOM_BUTTON_ACTIVE_CLASS},
        .custom-gh-top-repos-pin-active {
            color: var(--color-accent-fg, #0969da);
            background: var(--color-accent-subtle, rgba(9, 105, 218, 0.08));
            opacity: 1;
        }
        .custom-gh-top-repos-divider {
            list-style: none;
            height: 1px;
            margin: 6px 0;
            background: var(--color-border-muted, rgba(208, 215, 222, 0.8));
        }
    `;
    document.head.appendChild(style);
  }
  function setActiveStyle(aTag, active, compact = false) {
    aTag.classList.add(CUSTOM_BUTTON_CLASS);
    if (compact) {
      aTag.classList.add(CUSTOM_BUTTON_COMPACT_CLASS);
    } else {
      aTag.classList.remove(CUSTOM_BUTTON_COMPACT_CLASS);
    }
    if (active) {
      aTag.setAttribute("aria-current", "page");
      aTag.classList.add(CUSTOM_BUTTON_ACTIVE_CLASS);
    } else {
      aTag.removeAttribute("aria-current");
      aTag.classList.remove(CUSTOM_BUTTON_ACTIVE_CLASS);
    }
  }

  // src/navigation.js
  var lastHotkeyConflictSignature = "";
  var hotkeyTooltipNode = null;
  var hotkeyTooltipTextNode = null;
  var hotkeyTooltipHintNode = null;
  var hotkeyTooltipAnchor = null;
  var hotkeyTooltipGlobalBound = false;
  var hotkeyTooltipBoundAnchors = /* @__PURE__ */ new WeakSet();
  var responsiveQuickLinksState = null;
  var responsiveQuickLinksGlobalBound = false;
  function normalizePath(href) {
    try {
      const url = new URL(href, location.origin);
      const path = url.pathname.replace(/\/+$/, "");
      return path || "/";
    } catch (e) {
      return "";
    }
  }
  function isCurrentPage(linkPath) {
    const currentPath = location.pathname.replace(/\/+$/, "") || "/";
    if (linkPath === "/dashboard") return currentPath === "/" || currentPath === "/dashboard";
    if (currentPath === linkPath) return true;
    if (linkPath !== "/" && currentPath.startsWith(`${linkPath}/`)) return true;
    return location.search.includes("tab=stars") && linkPath === normalizePath("/stars");
  }
  function setLinkText(aTag, text) {
    aTag.removeAttribute("aria-describedby");
    aTag.setAttribute("aria-label", text);
    const icons = aTag.querySelectorAll("svg");
    icons.forEach((icon) => icon.remove());
    const innerSpan = aTag.querySelector("span");
    if (innerSpan) {
      innerSpan.textContent = text;
    } else {
      aTag.textContent = text;
    }
  }
  function ensureAnchor(node, isLiParent) {
    let aTag = isLiParent ? node.querySelector("a") : node.tagName.toLowerCase() === "a" ? node : node.querySelector("a");
    if (aTag) return aTag;
    const fallbackText = (node.textContent || "").trim();
    const fallbackHref = !isLiParent && node.getAttribute && node.getAttribute("href") ? node.getAttribute("href") : `${location.pathname}${location.search}`;
    const classSource = isLiParent ? node.querySelector('[class*="contextCrumb"], [class*="Breadcrumbs-Item"]') : node;
    const spanTemplate = document.querySelector(
      'header a[class*="contextCrumb"] span[class*="contextCrumbLast"]'
    );
    const spanSource = isLiParent ? node.querySelector("span") : node.querySelector("span");
    aTag = document.createElement("a");
    if (classSource && classSource.className) {
      aTag.className = classSource.className.split(/\s+/).filter((cls) => cls && !cls.includes("contextCrumbStatic")).join(" ");
    }
    if (spanSource && spanSource.className) {
      const innerSpan = document.createElement("span");
      innerSpan.className = spanTemplate && spanTemplate.className ? spanTemplate.className : spanSource.className;
      if (fallbackText) innerSpan.textContent = fallbackText;
      aTag.appendChild(innerSpan);
    }
    if (!aTag.getAttribute("href") && fallbackHref) {
      aTag.setAttribute("href", fallbackHref);
    }
    if (!aTag.textContent.trim() && fallbackText) {
      const innerSpan = aTag.querySelector("span");
      if (innerSpan) {
        innerSpan.textContent = fallbackText;
      } else {
        aTag.textContent = fallbackText;
      }
    }
    if (isLiParent) {
      node.textContent = "";
      node.appendChild(aTag);
    } else {
      node.replaceChildren(aTag);
    }
    return aTag;
  }
  function getAnchorHostNode(anchor) {
    if (!anchor || !anchor.parentNode) return anchor;
    return anchor.parentNode.tagName.toLowerCase() === "li" ? anchor.parentNode : anchor;
  }
  function cleanupQuickLinksForContainer(renderParent, keepNode) {
    const quickAnchors = Array.from(
      document.querySelectorAll(
        'header a[id^="custom-gh-btn-"], header a[' + QUICK_LINK_MARK_ATTR + '="1"]'
      )
    );
    quickAnchors.forEach((anchor) => {
      const host = getAnchorHostNode(anchor);
      if (!host || !host.parentNode) return;
      if (host === keepNode) return;
      if (host.parentNode !== renderParent) {
        host.remove();
        return;
      }
      host.remove();
    });
  }
  function insertNodeAfter(parent, node, referenceNode) {
    if (!parent || !node || !referenceNode || referenceNode.parentNode !== parent) return;
    let insertionReference = referenceNode;
    while (insertionReference.nextSibling && insertionReference.nextSibling.nodeType === Node.TEXT_NODE) {
      const textContent = insertionReference.nextSibling.textContent || "";
      if (textContent.trim()) break;
      insertionReference = insertionReference.nextSibling;
    }
    if (isBreadcrumbSeparatorNode(insertionReference.nextSibling)) {
      insertionReference = insertionReference.nextSibling;
    }
    const nextSibling = insertionReference.nextSibling;
    if (node.parentNode === parent && node.previousSibling === insertionReference) return;
    if (nextSibling === node) return;
    parent.insertBefore(node, nextSibling);
  }
  function isBreadcrumbSeparatorNode(node) {
    if (!node) return false;
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || "").trim() === "/";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const text = (node.textContent || "").replace(/\s+/g, "");
    if (text === "/") return true;
    const className = typeof node.className === "string" ? node.className : "";
    return /breadcrumb|separator|divider/i.test(className) && text === "/";
  }
  function stripBreadcrumbSeparatorsFromHost(hostNode) {
    if (!hostNode || hostNode.nodeType !== Node.ELEMENT_NODE) return;
    const anchor = hostNode.tagName.toLowerCase() === "a" ? hostNode : hostNode.querySelector("a");
    Array.from(hostNode.childNodes).forEach((child) => {
      if (child === anchor) return;
      if (child.nodeType === Node.TEXT_NODE && isBreadcrumbSeparatorNode(child)) {
        child.remove();
      }
    });
    Array.from(hostNode.querySelectorAll("*")).forEach((node) => {
      if (anchor && anchor.contains(node)) return;
      if (isBreadcrumbSeparatorNode(node)) {
        node.remove();
      }
    });
  }
  function setQuickLinkHostMark(hostNode, enabled) {
    if (!hostNode || hostNode.nodeType !== Node.ELEMENT_NODE) return;
    if (enabled) {
      hostNode.setAttribute(QUICK_LINK_HOST_MARK_ATTR, "1");
    } else {
      hostNode.removeAttribute(QUICK_LINK_HOST_MARK_ATTR);
    }
  }
  function setQuickLinkLastMark(hostNode, enabled) {
    if (!hostNode || hostNode.nodeType !== Node.ELEMENT_NODE) return;
    const anchor = hostNode.tagName.toLowerCase() === "a" ? hostNode : hostNode.querySelector("a");
    if (enabled) {
      hostNode.setAttribute(QUICK_LINK_LAST_MARK_ATTR, "1");
      if (anchor && anchor.getAttribute(QUICK_LINK_MARK_ATTR) === "1") {
        anchor.setAttribute(QUICK_LINK_LAST_MARK_ATTR, "1");
      }
      return;
    }
    hostNode.removeAttribute(QUICK_LINK_LAST_MARK_ATTR);
    if (anchor) {
      anchor.removeAttribute(QUICK_LINK_LAST_MARK_ATTR);
    }
  }
  function createOverflowChevronIcon() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "currentColor");
    svg.classList.add("custom-gh-nav-overflow-toggle-icon");
    const path = document.createElementNS(ns, "path");
    path.setAttribute(
      "d",
      "m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"
    );
    svg.appendChild(path);
    return svg;
  }
  function createOverflowMenuLink(linkInfo) {
    const link = document.createElement("a");
    link.className = "custom-gh-nav-overflow-link";
    link.href = linkInfo.href;
    link.setAttribute("aria-label", linkInfo.text);
    const text = document.createElement("span");
    text.className = "custom-gh-nav-overflow-link-text";
    text.textContent = linkInfo.text;
    link.appendChild(text);
    const hotkey = normalizeHotkeyValue(PRESET_LINK_SHORTCUTS[linkInfo.key]);
    if (hotkey) {
      const hint = document.createElement("kbd");
      hint.className = "custom-gh-nav-overflow-link-kbd";
      hint.textContent = hotkey.toUpperCase();
      hint.setAttribute("aria-hidden", "true");
      link.appendChild(hint);
    }
    if (isCurrentPage(linkInfo.path)) {
      link.setAttribute("aria-current", "page");
    }
    return link;
  }
  function updateResponsiveQuickLinksToggle(state) {
    const label = state.menuOpen ? t("closeQuickLinksMenu") : t("openQuickLinksMenu");
    state.toggleButton.title = label;
    state.toggleButton.setAttribute("aria-label", label);
    state.toggleButton.setAttribute("aria-expanded", state.menuOpen ? "true" : "false");
  }
  function positionResponsiveQuickLinksMenu(state) {
    const viewportPadding = 8;
    const anchorRect = state.toggleButton.getBoundingClientRect();
    state.menuNode.style.left = `${viewportPadding}px`;
    state.menuNode.style.top = `${Math.round(anchorRect.bottom + viewportPadding)}px`;
    const menuRect = state.menuNode.getBoundingClientRect();
    const maxLeft = Math.max(viewportPadding, window.innerWidth - menuRect.width - viewportPadding);
    const preferredLeft = anchorRect.right - menuRect.width;
    const fallbackLeft = anchorRect.left;
    const unclampedLeft = preferredLeft >= viewportPadding ? preferredLeft : fallbackLeft;
    const left = Math.min(maxLeft, Math.max(viewportPadding, unclampedLeft));
    let top = anchorRect.bottom + viewportPadding;
    const fitsBelow = top + menuRect.height <= window.innerHeight - viewportPadding;
    const fitsAbove = anchorRect.top - viewportPadding - menuRect.height >= viewportPadding;
    if (!fitsBelow && fitsAbove) {
      top = anchorRect.top - viewportPadding - menuRect.height;
    } else if (!fitsBelow) {
      top = Math.max(
        viewportPadding,
        window.innerHeight - menuRect.height - viewportPadding
      );
    }
    state.menuNode.style.left = `${Math.round(left)}px`;
    state.menuNode.style.top = `${Math.round(top)}px`;
  }
  function closeResponsiveQuickLinksMenu() {
    const state = responsiveQuickLinksState;
    if (!state || !state.menuOpen) return;
    hideHotkeyTooltip();
    state.menuOpen = false;
    state.menuNode.hidden = true;
    state.menuNode.style.visibility = "";
    updateResponsiveQuickLinksToggle(state);
  }
  function toggleResponsiveQuickLinksMenu() {
    const state = responsiveQuickLinksState;
    if (!state || !state.isCollapsed) return;
    hideHotkeyTooltip();
    state.menuOpen = !state.menuOpen;
    state.menuNode.hidden = !state.menuOpen;
    if (state.menuOpen) {
      state.menuNode.style.visibility = "hidden";
      positionResponsiveQuickLinksMenu(state);
      state.menuNode.style.visibility = "";
    }
    updateResponsiveQuickLinksToggle(state);
  }
  function restoreResponsiveInlineNodes(state) {
    if (!state.inlineItems.length) return;
    let insertAfter = state.referenceNode;
    state.inlineItems.forEach((item) => {
      insertNodeAfter(state.renderParent, item.hostNode, insertAfter);
      insertAfter = item.hostNode;
    });
    insertNodeAfter(state.renderParent, state.toggleHostNode, insertAfter);
  }
  function collapseResponsiveInlineNodes(state) {
    state.inlineItems.forEach((item) => {
      if (item.hostNode.parentNode) {
        item.hostNode.remove();
      }
    });
    insertNodeAfter(state.renderParent, state.toggleHostNode, state.referenceNode);
  }
  function needsResponsiveQuickLinksCollapse(state) {
    const measureContainer = state.measureContainer;
    const baselineRect = state.referenceNode.getBoundingClientRect();
    const containerRect = measureContainer.getBoundingClientRect();
    const containerRight = Math.min(containerRect.right, window.innerWidth - 8);
    const wrapped = state.inlineItems.some((item) => {
      if (!item.hostNode.isConnected) return false;
      const rect = item.hostNode.getBoundingClientRect();
      if (rect.width <= 0 && rect.height <= 0) return false;
      return Math.abs(rect.top - baselineRect.top) > 4;
    });
    const overflowing = state.inlineItems.some((item) => {
      if (!item.hostNode.isConnected) return false;
      const rect = item.hostNode.getBoundingClientRect();
      if (rect.width <= 0 && rect.height <= 0) return false;
      return rect.right > containerRight;
    });
    const scrollOverflow = measureContainer.scrollWidth > measureContainer.clientWidth + 1 || state.renderParent.scrollWidth > state.renderParent.clientWidth + 1;
    return wrapped || overflowing || scrollOverflow;
  }
  function syncResponsiveQuickLinksState(state) {
    if (!state) return;
    if (!state.renderParent.isConnected || !state.referenceNode.isConnected) {
      destroyResponsiveQuickLinks();
      return;
    }
    hideHotkeyTooltip();
    closeResponsiveQuickLinksMenu();
    restoreResponsiveInlineNodes(state);
    state.toggleHostNode.hidden = true;
    const shouldCollapse = needsResponsiveQuickLinksCollapse(state);
    if (shouldCollapse) {
      collapseResponsiveInlineNodes(state);
      state.isCollapsed = true;
      state.toggleHostNode.hidden = false;
    } else {
      state.isCollapsed = false;
    }
    updateResponsiveQuickLinksToggle(state);
  }
  function scheduleResponsiveQuickLinksSync() {
    const state = responsiveQuickLinksState;
    if (!state || state.syncQueued) return;
    state.syncQueued = true;
    requestAnimationFrame(() => {
      const latestState = responsiveQuickLinksState;
      if (!latestState) return;
      latestState.syncQueued = false;
      syncResponsiveQuickLinksState(latestState);
    });
  }
  function destroyResponsiveQuickLinks() {
    closeResponsiveQuickLinksMenu();
    if (responsiveQuickLinksState?.resizeObserver) {
      responsiveQuickLinksState.resizeObserver.disconnect();
    }
    if (responsiveQuickLinksState?.toggleHostNode?.isConnected) {
      responsiveQuickLinksState.toggleHostNode.remove();
    }
    responsiveQuickLinksState = null;
  }
  function bindResponsiveQuickLinksGlobalHandlers() {
    if (responsiveQuickLinksGlobalBound) return;
    responsiveQuickLinksGlobalBound = true;
    window.addEventListener("resize", () => {
      closeResponsiveQuickLinksMenu();
      scheduleResponsiveQuickLinksSync();
    }, { passive: true });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeResponsiveQuickLinksMenu();
      }
    }, true);
    document.addEventListener("pointerdown", (event) => {
      const state = responsiveQuickLinksState;
      if (!state || !state.menuOpen) return;
      const target = event.target;
      if (target && state.toggleHostNode.contains(target)) return;
      closeResponsiveQuickLinksMenu();
    }, true);
    document.addEventListener("scroll", () => {
      closeResponsiveQuickLinksMenu();
    }, true);
  }
  function setupResponsiveQuickLinks({
    renderParent,
    referenceNode,
    inlineItems
  }) {
    destroyResponsiveQuickLinks();
    if (!inlineItems.length) return;
    bindResponsiveQuickLinksGlobalHandlers();
    const hostTagName = inlineItems[0]?.hostNode?.tagName?.toLowerCase() || "div";
    const toggleHostNode = document.createElement(hostTagName === "li" ? "li" : "div");
    toggleHostNode.className = "custom-gh-nav-overflow-host";
    toggleHostNode.setAttribute(RESPONSIVE_TOGGLE_MARK_ATTR, "1");
    toggleHostNode.hidden = true;
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "custom-gh-nav-overflow-toggle";
    toggleButton.setAttribute("aria-haspopup", "true");
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.appendChild(createOverflowChevronIcon());
    const menuNode = document.createElement("nav");
    menuNode.id = "custom-gh-nav-overflow-menu";
    menuNode.className = "custom-gh-nav-overflow-menu";
    menuNode.setAttribute("aria-label", t("quickLinksMenu"));
    menuNode.hidden = true;
    toggleButton.setAttribute("aria-controls", menuNode.id);
    inlineItems.forEach((item) => {
      menuNode.appendChild(createOverflowMenuLink(item.linkInfo));
    });
    toggleButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleResponsiveQuickLinksMenu();
    });
    menuNode.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      closeResponsiveQuickLinksMenu();
    });
    toggleHostNode.appendChild(toggleButton);
    toggleHostNode.appendChild(menuNode);
    insertNodeAfter(renderParent, toggleHostNode, inlineItems[inlineItems.length - 1].hostNode || referenceNode);
    const state = {
      inlineItems,
      isCollapsed: false,
      measureContainer: renderParent.closest("nav") || renderParent,
      menuNode,
      menuOpen: false,
      referenceNode,
      renderParent,
      resizeObserver: null,
      syncQueued: false,
      toggleButton,
      toggleHostNode,
      toggleLabelNode: null
    };
    if (typeof ResizeObserver === "function") {
      state.resizeObserver = new ResizeObserver(() => {
        scheduleResponsiveQuickLinksSync();
      });
      state.resizeObserver.observe(renderParent);
      if (state.measureContainer !== renderParent) {
        state.resizeObserver.observe(state.measureContainer);
      }
    }
    responsiveQuickLinksState = state;
    syncResponsiveQuickLinksState(state);
  }
  function normalizeHotkeyValue(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }
  function createChordNode(chord) {
    const chordNode = document.createElement("span");
    chordNode.className = "custom-gh-nav-tooltip-chord";
    chordNode.setAttribute("data-kbd-chord", "true");
    chordNode.textContent = chord.toUpperCase();
    return chordNode;
  }
  function ensureHotkeyTooltipNode() {
    const existing = document.getElementById("custom-gh-nav-hotkey-tooltip");
    if (existing) {
      hotkeyTooltipNode = existing;
      hotkeyTooltipTextNode = existing.querySelector(".custom-gh-nav-tooltip-text");
      hotkeyTooltipHintNode = existing.querySelector(".custom-gh-nav-tooltip-kbd");
      return existing;
    }
    const tooltip = document.createElement("span");
    tooltip.id = "custom-gh-nav-hotkey-tooltip";
    tooltip.className = "custom-gh-nav-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.hidden = true;
    const textNode = document.createElement("span");
    textNode.className = "custom-gh-nav-tooltip-text";
    tooltip.appendChild(textNode);
    const hintContainer = document.createElement("span");
    hintContainer.className = "custom-gh-nav-tooltip-hint-container";
    hintContainer.setAttribute("aria-hidden", "true");
    const kbdNode = document.createElement("kbd");
    kbdNode.className = "custom-gh-nav-tooltip-kbd";
    hintContainer.appendChild(kbdNode);
    tooltip.appendChild(hintContainer);
    document.body.appendChild(tooltip);
    hotkeyTooltipNode = tooltip;
    hotkeyTooltipTextNode = textNode;
    hotkeyTooltipHintNode = kbdNode;
    return tooltip;
  }
  function hideHotkeyTooltip() {
    const tooltip = hotkeyTooltipNode || document.getElementById("custom-gh-nav-hotkey-tooltip");
    if (!tooltip) return;
    tooltip.hidden = true;
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.removeAttribute("data-direction");
    if (hotkeyTooltipAnchor) {
      hotkeyTooltipAnchor.removeAttribute("aria-describedby");
    }
    hotkeyTooltipAnchor = null;
  }
  function positionHotkeyTooltip(tooltip, anchor) {
    const spacing = 8;
    const rect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    let top = rect.bottom + spacing;
    let direction = "s";
    if (top + tooltipRect.height > window.innerHeight - spacing && rect.top - spacing - tooltipRect.height >= spacing) {
      top = rect.top - spacing - tooltipRect.height;
      direction = "n";
    }
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    if (left + tooltipRect.width > window.innerWidth - spacing) {
      left = window.innerWidth - tooltipRect.width - spacing;
    }
    if (left < spacing) {
      left = spacing;
    }
    tooltip.style.top = `${Math.round(top)}px`;
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.setAttribute("data-direction", direction);
  }
  function showHotkeyTooltip(anchor) {
    const hotkey = normalizeHotkeyValue(anchor.getAttribute("data-hotkey"));
    if (!hotkey) return;
    const tooltip = ensureHotkeyTooltipNode();
    const label = String(anchor.getAttribute("aria-label") || anchor.textContent || "").replace(/\s+/g, " ").trim();
    if (hotkeyTooltipTextNode) {
      hotkeyTooltipTextNode.textContent = label;
    }
    if (hotkeyTooltipHintNode) {
      hotkeyTooltipHintNode.textContent = "";
      const chords = hotkey.split(" ").filter(Boolean);
      chords.forEach((chord) => {
        hotkeyTooltipHintNode.appendChild(createChordNode(chord));
      });
    }
    tooltip.hidden = false;
    tooltip.setAttribute("aria-hidden", "false");
    positionHotkeyTooltip(tooltip, anchor);
    if (hotkeyTooltipAnchor && hotkeyTooltipAnchor !== anchor) {
      hotkeyTooltipAnchor.removeAttribute("aria-describedby");
    }
    hotkeyTooltipAnchor = anchor;
    anchor.setAttribute("aria-describedby", tooltip.id);
  }
  function bindHotkeyTooltipHandlers(anchor) {
    if (hotkeyTooltipBoundAnchors.has(anchor)) return;
    hotkeyTooltipBoundAnchors.add(anchor);
    anchor.addEventListener("mouseenter", () => showHotkeyTooltip(anchor));
    anchor.addEventListener("mouseleave", hideHotkeyTooltip);
    anchor.addEventListener("focus", () => showHotkeyTooltip(anchor));
    anchor.addEventListener("blur", hideHotkeyTooltip);
    anchor.addEventListener("mousedown", hideHotkeyTooltip);
  }
  function bindHotkeyTooltipGlobalHandlers() {
    if (hotkeyTooltipGlobalBound) return;
    hotkeyTooltipGlobalBound = true;
    window.addEventListener("resize", hideHotkeyTooltip, { passive: true });
    document.addEventListener("scroll", hideHotkeyTooltip, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hideHotkeyTooltip();
    }, true);
    document.addEventListener("pointerdown", (event) => {
      const tooltip = hotkeyTooltipNode || document.getElementById("custom-gh-nav-hotkey-tooltip");
      if (!tooltip || tooltip.hidden) return;
      const target = event.target;
      if (target && hotkeyTooltipAnchor && hotkeyTooltipAnchor.contains(target)) return;
      if (target && tooltip.contains(target)) return;
      hideHotkeyTooltip();
    }, true);
  }
  function applyLinkShortcut(aTag, linkInfo) {
    aTag.removeAttribute("data-hotkey");
    aTag.removeAttribute("aria-keyshortcuts");
    aTag.removeAttribute("title");
    aTag.removeAttribute("aria-describedby");
    const hotkey = normalizeHotkeyValue(PRESET_LINK_SHORTCUTS[linkInfo.key]);
    if (!hotkey) return "";
    aTag.setAttribute("data-hotkey", hotkey);
    aTag.setAttribute("aria-keyshortcuts", hotkey);
    bindHotkeyTooltipGlobalHandlers();
    bindHotkeyTooltipHandlers(aTag);
    return hotkey;
  }
  function describeHotkeyTarget(node) {
    if (!node) return "";
    const label = String(node.getAttribute("aria-label") || node.textContent || "").replace(/\s+/g, " ").trim();
    if (label) return label;
    const href = node.getAttribute("href");
    if (href) return href;
    return node.tagName.toLowerCase();
  }
  function reportHotkeyConflicts(customAnchors) {
    const customSet = new Set(customAnchors.filter(Boolean));
    const customByHotkey = /* @__PURE__ */ new Map();
    customAnchors.forEach((anchor) => {
      const hotkey = normalizeHotkeyValue(anchor.getAttribute("data-hotkey"));
      if (!hotkey) return;
      const labels = customByHotkey.get(hotkey) || [];
      labels.push(describeHotkeyTarget(anchor));
      customByHotkey.set(hotkey, labels);
    });
    const conflictLines = [];
    customByHotkey.forEach((labels, hotkey) => {
      const uniqueLabels = Array.from(new Set(labels.filter(Boolean)));
      if (uniqueLabels.length > 1) {
        conflictLines.push(`${hotkey} -> ${uniqueLabels.join(" / ")}`);
      }
    });
    const nativeByHotkey = /* @__PURE__ */ new Map();
    const nativeHotkeyNodes = Array.from(
      document.querySelectorAll("a[data-hotkey], button[data-hotkey], summary[data-hotkey]")
    );
    nativeHotkeyNodes.forEach((node) => {
      if (customSet.has(node)) return;
      if (node.closest('[hidden], [aria-hidden="true"]')) return;
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return;
      const hotkey = normalizeHotkeyValue(node.getAttribute("data-hotkey"));
      if (!hotkey) return;
      if (!customByHotkey.has(hotkey)) return;
      const labels = nativeByHotkey.get(hotkey) || [];
      labels.push(describeHotkeyTarget(node));
      nativeByHotkey.set(hotkey, labels);
    });
    customByHotkey.forEach((labels, hotkey) => {
      const nativeLabels = nativeByHotkey.get(hotkey);
      if (!nativeLabels || !nativeLabels.length) return;
      const customLabel = Array.from(new Set(labels.filter(Boolean))).join(" / ");
      const nativeLabel = Array.from(new Set(nativeLabels.filter(Boolean))).slice(0, 2).join(" / ");
      conflictLines.push(`${hotkey} -> ${customLabel} <-> ${nativeLabel}`);
    });
    const uniqueConflictLines = Array.from(new Set(conflictLines));
    if (!uniqueConflictLines.length) {
      lastHotkeyConflictSignature = "";
      return;
    }
    const signature = uniqueConflictLines.join("|");
    if (signature === lastHotkeyConflictSignature) return;
    lastHotkeyConflictSignature = signature;
    console.warn(
      `[Better GitHub Navigation] 检测到快捷键冲突：${uniqueConflictLines.join("; ")}`
    );
  }
  function addCustomButtons() {
    destroyResponsiveQuickLinks();
    const userLoginMeta = document.querySelector('meta[name="user-login"]');
    const username = userLoginMeta ? userLoginMeta.getAttribute("content") : "";
    const navPresetLinks = getConfiguredLinks(username);
    if (!navPresetLinks.length) return;
    const primaryLink = navPresetLinks[0];
    const extraLinks = navPresetLinks.slice(1);
    const fixedPages = /* @__PURE__ */ new Set(["/dashboard", "/trending", "/explore", "/collections"]);
    const shortcutPaths = new Set(PRESET_LINKS.map((link) => link.path));
    const compactPages = /* @__PURE__ */ new Set(["/issues", "/pulls", "/repositories"]);
    const isOnPresetPage = Array.from(fixedPages).some((path) => isCurrentPage(path));
    const shouldUseCompactButtons = Array.from(compactPages).some((path) => isCurrentPage(path));
    let targetNode = null;
    let targetSource = "";
    if (isOnPresetPage) {
      targetNode = document.querySelector(
        'header nav a[href="/dashboard"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav a[href="/trending"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav a[href="/explore"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"])'
      );
      if (targetNode) targetSource = "preset-nav";
      if (!targetNode) {
        targetNode = document.querySelector(
          'header nav a[id^="custom-gh-btn-"], header nav a[' + QUICK_LINK_MARK_ATTR + '="1"]'
        );
        if (targetNode) targetSource = "preset-quick";
      }
    } else {
      const breadcrumbNodes = Array.from(document.querySelectorAll(
        'header nav[aria-label*="breadcrumb" i] a[href^="/"], header a[class*="contextCrumb"][href^="/"], header a[class*="Breadcrumbs-Item"][href^="/"]'
      )).filter((link) => {
        if (link.id && link.id.startsWith("custom-gh-btn-")) return false;
        if (link.getAttribute(QUICK_LINK_MARK_ATTR) === "1") return false;
        const href = normalizePath(link.getAttribute("href") || "");
        if (!href || href === "/") return false;
        if (shortcutPaths.has(href)) return false;
        return true;
      });
      if (breadcrumbNodes.length) {
        targetNode = breadcrumbNodes[breadcrumbNodes.length - 1];
        targetSource = "breadcrumb";
      }
    }
    if (!targetNode) {
      targetNode = document.querySelector(
        'header nav a[aria-current="page"]:not([id^="custom-gh-btn-"]), header nav a[data-active="true"]:not([id^="custom-gh-btn-"]), header nav [aria-current="page"]:not(a), header nav [data-active="true"]:not(a)'
      );
      if (targetNode) targetSource = "current-nav";
    }
    if (!targetNode) {
      const navLinks = document.querySelectorAll(
        'header a:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"])'
      );
      for (const link of navLinks) {
        const text = link.textContent.trim().toLowerCase();
        const href = link.getAttribute("href");
        if (text === "dashboard" || href === "/dashboard") {
          targetNode = link;
          targetSource = "legacy-dashboard";
          break;
        }
      }
    }
    if (!targetNode) {
      const currentPath = location.pathname.replace(/\/+$/, "") || "/";
      const globalNavCandidates = Array.from(
        document.querySelectorAll(
          'header nav[aria-label*="global" i] a[href^="/"], header nav[aria-label*="header" i] a[href^="/"], header nav a[href="/pulls"], header nav a[href="/issues"], header nav a[href="/repositories"], header nav a[href="/codespaces"], header nav a[href="/marketplace"], header nav a[href="/explore"]'
        )
      ).filter((link) => {
        const href = normalizePath(link.getAttribute("href") || "");
        if (!href || href === "/") return false;
        if (link.id && link.id.startsWith("custom-gh-btn-")) return false;
        if (link.getAttribute(QUICK_LINK_MARK_ATTR) === "1") return false;
        return true;
      });
      if (globalNavCandidates.length) {
        targetNode = globalNavCandidates.find((link) => {
          const href = normalizePath(link.getAttribute("href") || "");
          return href === currentPath;
        }) || globalNavCandidates[globalNavCandidates.length - 1];
        if (targetNode) targetSource = "global-nav";
      }
    }
    if (!targetNode) {
      const currentTextNode = document.querySelector(
        'header nav [aria-current="page"]:not(a), header nav [data-active="true"]:not(a)'
      );
      if (currentTextNode) {
        targetNode = currentTextNode;
        targetSource = "current-text";
      }
    }
    if (!targetNode) {
      const contextCrumbTextNodes = document.querySelectorAll(
        'header span[class*="contextCrumbStatic"], header span[class*="contextCrumb"][class*="Breadcrumbs-Item"], header .prc-Breadcrumbs-Item-jcraJ'
      );
      if (contextCrumbTextNodes.length) {
        targetNode = contextCrumbTextNodes[contextCrumbTextNodes.length - 1];
        targetSource = "crumb-text";
      }
    }
    let templateNode = targetNode;
    if (targetNode) {
      const localNav = targetNode.closest("nav, ul, ol");
      const localAnchors = localNav ? localNav.querySelectorAll(
        'a[href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"])'
      ) : [];
      if (localAnchors.length) {
        templateNode = localAnchors[localAnchors.length - 1];
      } else {
        const nativeNavAnchors = document.querySelectorAll(
          'header nav[aria-label*="breadcrumb" i] a[href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header a[class*="contextCrumb"][href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header a[class*="Breadcrumbs-Item"][href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav[aria-label*="global" i] a[href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav[aria-label*="header" i] a[href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav a[href="/pulls"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav a[href="/issues"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav a[href="/repositories"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav a[href="/codespaces"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav a[href="/marketplace"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), header nav a[href="/explore"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"])'
        );
        if (nativeNavAnchors.length) {
          templateNode = nativeNavAnchors[nativeNavAnchors.length - 1];
        }
      }
    }
    if (targetNode) {
      const isTargetLiParent = targetNode.parentNode.tagName.toLowerCase() === "li";
      const insertAnchorNode = isTargetLiParent ? targetNode.parentNode : targetNode;
      const isTemplateLiParent = templateNode.parentNode.tagName.toLowerCase() === "li";
      const cloneTemplateNode = isTemplateLiParent ? templateNode.parentNode : templateNode;
      const targetHasAnchor = isTargetLiParent ? Boolean(insertAnchorNode.querySelector("a")) : insertAnchorNode.tagName.toLowerCase() === "a" || Boolean(insertAnchorNode.querySelector("a"));
      const shouldForceCreateAnchor = !targetHasAnchor && Boolean(targetNode.closest("header nav"));
      const anchorTag = targetHasAnchor || shouldForceCreateAnchor ? ensureAnchor(insertAnchorNode, isTargetLiParent) : null;
      cleanupQuickLinksForContainer(insertAnchorNode.parentNode, insertAnchorNode);
      const hasShortcutActive = navPresetLinks.some((link) => isCurrentPage(link.path));
      const renderedQuickAnchors = [];
      const renderedQuickItems = [];
      const quickHostNodes = [];
      if (isOnPresetPage && anchorTag && primaryLink) {
        setQuickLinkHostMark(insertAnchorNode, true);
        anchorTag.id = primaryLink.id;
        anchorTag.setAttribute(QUICK_LINK_MARK_ATTR, "1");
        anchorTag.href = primaryLink.href;
        setLinkText(anchorTag, primaryLink.text);
        applyLinkShortcut(anchorTag, primaryLink);
        renderedQuickAnchors.push(anchorTag);
        quickHostNodes.push(insertAnchorNode);
        setActiveStyle(anchorTag, isCurrentPage(primaryLink.path), shouldUseCompactButtons);
      } else {
        const wasQuickAnchor = Boolean(anchorTag) && (anchorTag.id && anchorTag.id.startsWith("custom-gh-btn-") || anchorTag.getAttribute(QUICK_LINK_MARK_ATTR) === "1");
        if (anchorTag && anchorTag.id && anchorTag.id.startsWith("custom-gh-btn-")) {
          anchorTag.removeAttribute("id");
        }
        if (anchorTag) {
          anchorTag.removeAttribute(QUICK_LINK_MARK_ATTR);
        }
        setQuickLinkHostMark(insertAnchorNode, false);
        setQuickLinkLastMark(insertAnchorNode, false);
        if (anchorTag && wasQuickAnchor) {
          anchorTag.removeAttribute("data-hotkey");
          anchorTag.removeAttribute("aria-keyshortcuts");
        }
        if (anchorTag) {
          setActiveStyle(anchorTag, !hasShortcutActive, shouldUseCompactButtons);
        }
      }
      let insertAfterNode = insertAnchorNode;
      const linksToRender = isOnPresetPage ? extraLinks : navPresetLinks;
      linksToRender.forEach((linkInfo) => {
        const newNode = cloneTemplateNode.cloneNode(true);
        const aTag = ensureAnchor(newNode, isTemplateLiParent);
        setQuickLinkHostMark(newNode, true);
        aTag.id = linkInfo.id;
        aTag.setAttribute(QUICK_LINK_MARK_ATTR, "1");
        aTag.href = linkInfo.href;
        setLinkText(aTag, linkInfo.text);
        applyLinkShortcut(aTag, linkInfo);
        renderedQuickAnchors.push(aTag);
        quickHostNodes.push(newNode);
        setActiveStyle(aTag, isCurrentPage(linkInfo.path), shouldUseCompactButtons);
        insertNodeAfter(insertAfterNode.parentNode, newNode, insertAfterNode);
        insertAfterNode = newNode;
        renderedQuickItems.push({
          anchor: aTag,
          hostNode: newNode,
          linkInfo
        });
      });
      quickHostNodes.forEach((node) => setQuickLinkLastMark(node, false));
      const lastQuickHostNode = quickHostNodes[quickHostNodes.length - 1];
      if (lastQuickHostNode) {
        setQuickLinkLastMark(lastQuickHostNode, true);
        stripBreadcrumbSeparatorsFromHost(lastQuickHostNode);
      }
      setupResponsiveQuickLinks({
        inlineItems: renderedQuickItems,
        referenceNode: insertAnchorNode,
        renderParent: insertAnchorNode.parentNode
      });
      reportHotkeyConflicts(renderedQuickAnchors.filter((anchor) => anchor.isConnected));
    }
  }

  // src/theme.js
  var themeSyncBound = false;
  var systemThemeQuery = null;
  function detectGitHubTheme() {
    const root = document.documentElement;
    const colorMode = String(root.getAttribute("data-color-mode") || "").toLowerCase();
    if (colorMode === "light" || colorMode === "dark") {
      return colorMode;
    }
    const rootStyle = getComputedStyle(root);
    const colorScheme = String(rootStyle.colorScheme || "").toLowerCase();
    if (colorScheme.includes("dark")) return "dark";
    if (colorScheme.includes("light")) return "light";
    if (!systemThemeQuery && typeof window.matchMedia === "function") {
      systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    }
    return systemThemeQuery?.matches ? "dark" : "light";
  }
  function resolveThemePreference(preference = loadConfig().themePreference) {
    const safePreference = sanitizeThemePreference(preference);
    return safePreference === "auto" ? detectGitHubTheme() : safePreference;
  }
  function syncThemePreference() {
    const preference = sanitizeThemePreference(loadConfig().themePreference);
    const appliedTheme = resolveThemePreference(preference);
    document.documentElement.setAttribute(THEME_ATTR, appliedTheme);
    document.documentElement.setAttribute(THEME_SOURCE_ATTR, preference === "auto" ? "auto" : "custom");
    return appliedTheme;
  }
  function setThemePreference(preference) {
    updateConfig({ themePreference: preference });
    return syncThemePreference();
  }
  function bindThemePreferenceSync() {
    if (themeSyncBound) return;
    themeSyncBound = true;
    syncThemePreference();
    if (!systemThemeQuery && typeof window.matchMedia === "function") {
      systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    }
    if (systemThemeQuery?.addEventListener) {
      systemThemeQuery.addEventListener("change", syncThemePreference);
    } else if (systemThemeQuery?.addListener) {
      systemThemeQuery.addListener(syncThemePreference);
    }
    const observer2 = new MutationObserver((mutations) => {
      const shouldSync = mutations.some((mutation) => mutation.type === "attributes" && (mutation.attributeName === "data-color-mode" || mutation.attributeName === "data-dark-theme" || mutation.attributeName === "data-light-theme"));
      if (shouldSync) {
        syncThemePreference();
      }
    });
    observer2.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-mode", "data-dark-theme", "data-light-theme"]
    });
  }

  // src/settings-panel.js
  var settingsEscHandler = null;
  function closeConfigPanel() {
    const overlay = document.getElementById(SETTINGS_OVERLAY_ID);
    if (overlay) overlay.remove();
    if (settingsEscHandler) {
      document.removeEventListener("keydown", settingsEscHandler);
      settingsEscHandler = null;
    }
  }
  function createPanelState(config) {
    const safeConfig = sanitizeConfig(config);
    return {
      order: safeConfig.orderKeys.slice(),
      enabledSet: new Set(safeConfig.enabledKeys)
    };
  }
  function reorderKeys(state, draggedKey, targetKey, placeAfter = false) {
    const fromIndex = state.order.indexOf(draggedKey);
    const targetIndex = state.order.indexOf(targetKey);
    if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return false;
    const [movedKey] = state.order.splice(fromIndex, 1);
    let insertIndex = targetIndex + (placeAfter ? 1 : 0);
    if (fromIndex < targetIndex) {
      insertIndex -= 1;
    }
    state.order.splice(insertIndex, 0, movedKey);
    return true;
  }
  function clearDragClasses(listEl) {
    const rows = listEl.querySelectorAll(".custom-gh-nav-settings-row");
    rows.forEach((row) => {
      row.classList.remove("custom-gh-nav-settings-row-dragging");
      row.classList.remove("custom-gh-nav-settings-row-drag-over");
    });
  }
  function renderPanelRows(listEl, state) {
    listEl.replaceChildren();
    state.order.forEach((key) => {
      const row = document.createElement("div");
      row.className = "custom-gh-nav-settings-row";
      row.draggable = true;
      row.title = t("dragRowTitle");
      row.dataset.rowKey = key;
      const left = document.createElement("label");
      left.className = "custom-gh-nav-settings-row-left";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.enabledSet.has(key);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          state.enabledSet.add(key);
        } else {
          state.enabledSet.delete(key);
        }
      });
      const text = document.createElement("span");
      text.textContent = `${getDisplayNameByKey(key)} (${key})`;
      left.appendChild(checkbox);
      left.appendChild(text);
      const actions = document.createElement("div");
      actions.className = "custom-gh-nav-settings-row-actions";
      const dragHandle = document.createElement("span");
      dragHandle.className = "custom-gh-nav-settings-drag-handle";
      dragHandle.textContent = "≡";
      dragHandle.title = t("dragHandleTitle");
      dragHandle.setAttribute("aria-hidden", "true");
      row.addEventListener("dragstart", (event) => {
        row.classList.add("custom-gh-nav-settings-row-dragging");
        listEl.dataset.dragKey = key;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", key);
        }
      });
      row.addEventListener("dragend", () => {
        delete listEl.dataset.dragKey;
        clearDragClasses(listEl);
      });
      row.addEventListener("dragover", (event) => {
        event.preventDefault();
        row.classList.add("custom-gh-nav-settings-row-drag-over");
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "move";
        }
      });
      row.addEventListener("dragleave", () => {
        row.classList.remove("custom-gh-nav-settings-row-drag-over");
      });
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        row.classList.remove("custom-gh-nav-settings-row-drag-over");
        const draggedKey = event.dataTransfer && event.dataTransfer.getData("text/plain") || listEl.dataset.dragKey || "";
        if (!draggedKey || draggedKey === key) return;
        const rect = row.getBoundingClientRect();
        const placeAfter = event.clientY > rect.top + rect.height / 2;
        if (reorderKeys(state, draggedKey, key, placeAfter)) {
          renderPanelRows(listEl, state);
        }
      });
      actions.appendChild(dragHandle);
      row.appendChild(left);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
  }
  function openConfigPanel() {
    closeConfigPanel();
    ensureStyles();
    const state = createPanelState(loadConfig());
    const overlay = document.createElement("div");
    overlay.id = SETTINGS_OVERLAY_ID;
    const panel = document.createElement("div");
    panel.id = SETTINGS_PANEL_ID;
    const title = document.createElement("h3");
    title.className = "custom-gh-nav-settings-title";
    title.textContent = t("panelTitle");
    const desc = document.createElement("p");
    desc.className = "custom-gh-nav-settings-desc";
    desc.textContent = t("panelDesc");
    const list = document.createElement("div");
    list.className = "custom-gh-nav-settings-list";
    renderPanelRows(list, state);
    const message = document.createElement("div");
    message.id = SETTINGS_MESSAGE_ID;
    message.className = "custom-gh-nav-settings-message";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    const footer = document.createElement("div");
    footer.className = "custom-gh-nav-settings-footer";
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "custom-gh-nav-settings-btn";
    resetBtn.textContent = t("resetDefault");
    resetBtn.addEventListener("click", () => {
      state.order = DEFAULT_LINK_KEYS.slice();
      state.enabledSet = new Set(DEFAULT_LINK_KEYS);
      renderPanelRows(list, state);
      message.textContent = t("restoredPendingSave");
    });
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "custom-gh-nav-settings-btn";
    cancelBtn.textContent = t("cancel");
    cancelBtn.addEventListener("click", closeConfigPanel);
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "custom-gh-nav-settings-btn custom-gh-nav-settings-btn-primary";
    saveBtn.textContent = t("saveAndRefresh");
    saveBtn.addEventListener("click", () => {
      const enabledKeys = state.order.filter((key) => state.enabledSet.has(key));
      if (!enabledKeys.length) {
        message.textContent = t("atLeastOneLink");
        return;
      }
      updateConfig({
        enabledKeys,
        orderKeys: state.order.slice()
      });
      closeConfigPanel();
      location.reload();
    });
    footer.appendChild(resetBtn);
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    panel.appendChild(title);
    panel.appendChild(desc);
    panel.appendChild(list);
    panel.appendChild(message);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeConfigPanel();
    });
    settingsEscHandler = (event) => {
      if (event.key === "Escape") closeConfigPanel();
    };
    document.addEventListener("keydown", settingsEscHandler);
    document.body.appendChild(overlay);
  }
  function registerConfigMenu() {
    if (typeof GM_registerMenuCommand !== "function") return;
    GM_registerMenuCommand(t("menuOpenSettings"), openConfigPanel);
    GM_registerMenuCommand(t("menuResetSettings"), () => {
      const shouldReset = confirm(t("resetConfirm"));
      if (!shouldReset) return;
      updateConfig({
        enabledKeys: DEFAULT_LINK_KEYS,
        orderKeys: DEFAULT_LINK_KEYS
      });
      closeConfigPanel();
      location.reload();
    });
    GM_registerMenuCommand(t("menuLangZh"), () => {
      setUiLangPreference("zh");
      closeConfigPanel();
      location.reload();
    });
    GM_registerMenuCommand(t("menuLangEn"), () => {
      setUiLangPreference("en");
      closeConfigPanel();
      location.reload();
    });
    GM_registerMenuCommand(t("menuLangAuto"), () => {
      setUiLangPreference("auto");
      closeConfigPanel();
      location.reload();
    });
    GM_registerMenuCommand(t("menuThemeLight"), () => {
      setThemePreference("light");
      closeConfigPanel();
    });
    GM_registerMenuCommand(t("menuThemeDark"), () => {
      setThemePreference("dark");
      closeConfigPanel();
    });
    GM_registerMenuCommand(t("menuThemeAuto"), () => {
      setThemePreference("auto");
      closeConfigPanel();
    });
  }

  // src/top-repositories.js
  var TOP_REPOSITORIES_HEADING_TEXT = "top repositories";
  var TOP_REPOSITORIES_BUTTON_CLASS = "custom-gh-top-repos-pin";
  var TOP_REPOSITORIES_BUTTON_ACTIVE_CLASS = "custom-gh-top-repos-pin-active";
  var TOP_REPOSITORIES_BUTTON_ICON_CLASS = "custom-gh-top-repos-pin-icon";
  var TOP_REPOSITORIES_DIVIDER_CLASS = "custom-gh-top-repos-divider";
  var TOP_REPOSITORIES_ROW_CLASS = "custom-gh-top-repos-row";
  var TOP_REPOSITORIES_LINK_CLASS = "custom-gh-top-repos-link";
  var TOP_REPOSITORIES_SHOW_MORE_PREFIXES = ["show more", "show less"];
  var SVG_NS = "http://www.w3.org/2000/svg";
  var RESERVED_FIRST_SEGMENTS = /* @__PURE__ */ new Set([
    "about",
    "account",
    "apps",
    "codespaces",
    "collections",
    "dashboard",
    "explore",
    "marketplace",
    "new",
    "notifications",
    "organizations",
    "orgs",
    "pulls",
    "repositories",
    "search",
    "sessions",
    "settings",
    "signup",
    "site",
    "sponsors",
    "stars",
    "topics",
    "trending",
    "users"
  ]);
  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function normalizeRepoKey(repoKey) {
    return normalizeText(repoKey).replace(/\s+/g, "");
  }
  function parseRepoInfoFromHref(href) {
    try {
      const url = new URL(href, location.origin);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length !== 2) return null;
      const owner = decodeURIComponent(segments[0] || "");
      const repo = decodeURIComponent(segments[1] || "");
      if (!owner || !repo) return null;
      if (RESERVED_FIRST_SEGMENTS.has(owner.toLowerCase())) return null;
      return {
        key: normalizeRepoKey(`${owner}/${repo}`),
        label: `${owner}/${repo}`
      };
    } catch (error) {
      return null;
    }
  }
  function getNodeDepth(node) {
    let depth = 0;
    let current = node;
    while (current && current.parentElement) {
      depth += 1;
      current = current.parentElement;
    }
    return depth;
  }
  function getDirectRepoRows(container) {
    if (!container) return [];
    const rowsByNode = /* @__PURE__ */ new Map();
    const anchors = Array.from(container.querySelectorAll('a[href^="/"]'));
    anchors.forEach((anchor) => {
      let rowNode = anchor;
      while (rowNode.parentElement && rowNode.parentElement !== container) {
        rowNode = rowNode.parentElement;
      }
      if (!rowNode.parentElement || rowNode.parentElement !== container) return;
      const repoInfo = parseRepoInfoFromHref(anchor.getAttribute("href") || "");
      if (!repoInfo) return;
      const existing = rowsByNode.get(rowNode);
      if (!existing) {
        rowsByNode.set(rowNode, {
          node: rowNode,
          anchor,
          repoKey: repoInfo.key,
          repoLabel: repoInfo.label
        });
        return;
      }
      if (anchor.textContent.trim().length > existing.anchor.textContent.trim().length) {
        existing.anchor = anchor;
        existing.repoKey = repoInfo.key;
        existing.repoLabel = repoInfo.label;
      }
    });
    return Array.from(rowsByNode.values());
  }
  function getTopRepositoriesHeading() {
    const candidates = Array.from(
      document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"], summary, span, strong')
    );
    return candidates.find((node) => normalizeText(node.textContent) === TOP_REPOSITORIES_HEADING_TEXT) || null;
  }
  function findTopRepositoriesList() {
    const heading = getTopRepositoriesHeading();
    if (!heading) return null;
    const roots = [];
    const sectionRoot = heading.closest("section, aside");
    if (sectionRoot) roots.push(sectionRoot);
    if (heading.parentElement && !roots.includes(heading.parentElement)) {
      roots.push(heading.parentElement);
    }
    for (const root of roots) {
      const semanticCandidates = [
        ...root.matches("ul, ol, nav") ? [root] : [],
        ...Array.from(root.querySelectorAll("ul, ol, nav"))
      ];
      let bestSemanticMatch = null;
      semanticCandidates.forEach((candidate) => {
        const items = getDirectRepoRows(candidate);
        if (!items.length) return;
        const score = items.length * 1e3 + (items.length === candidate.children.length ? 100 : 0) + getNodeDepth(candidate);
        if (!bestSemanticMatch || score > bestSemanticMatch.score) {
          bestSemanticMatch = { container: candidate, items, score };
        }
      });
      if (bestSemanticMatch) {
        return { container: bestSemanticMatch.container, items: bestSemanticMatch.items };
      }
      const genericCandidates = [
        ...root.matches("div") ? [root] : [],
        ...Array.from(root.querySelectorAll("div"))
      ];
      let bestMatch = null;
      genericCandidates.forEach((candidate) => {
        const items = getDirectRepoRows(candidate);
        if (!items.length) return;
        const score = items.length * 1e3 + (items.length === candidate.children.length ? 100 : 0) + getNodeDepth(candidate);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { container: candidate, items, score };
        }
      });
      if (bestMatch) {
        return { container: bestMatch.container, items: bestMatch.items };
      }
    }
    return null;
  }
  function sanitizePinnedRepositories(rawValue) {
    if (!Array.isArray(rawValue)) return [];
    const seen = /* @__PURE__ */ new Set();
    const result = [];
    rawValue.forEach((item) => {
      const repoKey = normalizeRepoKey(item);
      if (!repoKey || seen.has(repoKey)) return;
      seen.add(repoKey);
      result.push(repoKey);
    });
    return result;
  }
  function loadPinnedRepositories() {
    try {
      const raw = localStorage.getItem(TOP_REPOSITORIES_PIN_STORAGE_KEY);
      if (!raw) return [];
      return sanitizePinnedRepositories(JSON.parse(raw));
    } catch (error) {
      return [];
    }
  }
  function savePinnedRepositories(repoKeys) {
    const pinnedRepositories = sanitizePinnedRepositories(repoKeys);
    try {
      localStorage.setItem(TOP_REPOSITORIES_PIN_STORAGE_KEY, JSON.stringify(pinnedRepositories));
    } catch (error) {
    }
  }
  function togglePinnedRepository(repoKey) {
    const normalizedRepoKey = normalizeRepoKey(repoKey);
    if (!normalizedRepoKey) return;
    const pinnedSet = new Set(loadPinnedRepositories());
    if (pinnedSet.has(normalizedRepoKey)) {
      pinnedSet.delete(normalizedRepoKey);
    } else {
      pinnedSet.add(normalizedRepoKey);
    }
    savePinnedRepositories(Array.from(pinnedSet));
  }
  function createDividerElement(container) {
    const tagName = container.tagName.toLowerCase();
    const divider = document.createElement(tagName === "ul" || tagName === "ol" ? "li" : "div");
    divider.className = TOP_REPOSITORIES_DIVIDER_CLASS;
    divider.setAttribute("aria-hidden", "true");
    return divider;
  }
  function ensureRowNodeIsWrappable(item, container) {
    if (item.node.tagName.toLowerCase() !== "a") return item;
    const wrapperTag = container.tagName.toLowerCase() === "ul" || container.tagName.toLowerCase() === "ol" ? "li" : "div";
    const wrapper = document.createElement(wrapperTag);
    wrapper.className = TOP_REPOSITORIES_ROW_CLASS;
    item.node.replaceWith(wrapper);
    wrapper.appendChild(item.node);
    item.node = wrapper;
    return item;
  }
  function createSvgElement(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
    return node;
  }
  function createPinIcon(isPinned) {
    const svg = createSvgElement("svg", {
      viewBox: "0 0 16 16",
      "aria-hidden": "true",
      class: TOP_REPOSITORIES_BUTTON_ICON_CLASS
    });
    const head = createSvgElement("circle", {
      cx: "10",
      cy: "4",
      r: "1.9",
      fill: isPinned ? "currentColor" : "none",
      stroke: "currentColor",
      "stroke-width": "1.2"
    });
    const body = createSvgElement("rect", {
      x: "6.8",
      y: "5.4",
      width: "5.1",
      height: "2.5",
      rx: "0.8",
      fill: isPinned ? "currentColor" : "none",
      stroke: "currentColor",
      "stroke-width": "1.2",
      transform: "rotate(32 9.35 6.65)"
    });
    const needle = createSvgElement("path", {
      d: "M8.5 8.9 4.3 13.1",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.2",
      "stroke-linecap": "round"
    });
    svg.appendChild(head);
    svg.appendChild(body);
    svg.appendChild(needle);
    return svg;
  }
  function getPrimaryContentNode(item) {
    let current = item.anchor;
    while (current.parentElement && current.parentElement !== item.node) {
      if (current.parentElement.children.length !== 1) break;
      current = current.parentElement;
    }
    return current;
  }
  function renderPinButtons(container, items, pinnedSet) {
    items.forEach((item) => {
      ensureRowNodeIsWrappable(item, container);
      item.node.classList.add(TOP_REPOSITORIES_ROW_CLASS);
      getPrimaryContentNode(item).classList.add(TOP_REPOSITORIES_LINK_CLASS);
      item.node.querySelectorAll(`.${TOP_REPOSITORIES_BUTTON_CLASS}`).forEach((button) => button.remove());
      const isPinned = pinnedSet.has(item.repoKey);
      const pinButton = document.createElement("button");
      pinButton.type = "button";
      pinButton.className = TOP_REPOSITORIES_BUTTON_CLASS;
      pinButton.appendChild(createPinIcon(isPinned));
      pinButton.setAttribute("aria-pressed", isPinned ? "true" : "false");
      pinButton.title = isPinned ? t("unpinTopRepository", { repo: item.repoLabel }) : t("pinTopRepository", { repo: item.repoLabel });
      pinButton.setAttribute("aria-label", pinButton.title);
      if (isPinned) {
        pinButton.classList.add(TOP_REPOSITORIES_BUTTON_ACTIVE_CLASS);
      }
      pinButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        togglePinnedRepository(item.repoKey);
        enhanceTopRepositories();
      });
      item.node.appendChild(pinButton);
    });
  }
  function reorderRows(container, items, pinnedSet) {
    const pinnedItems = items.filter((item) => pinnedSet.has(item.repoKey));
    const regularItems = items.filter((item) => !pinnedSet.has(item.repoKey));
    container.querySelectorAll(`:scope > .${TOP_REPOSITORIES_DIVIDER_CLASS}`).forEach((node) => node.remove());
    const children = Array.from(container.children);
    const repoNodes = new Set(items.map((item) => item.node));
    const firstRepoIndex = children.findIndex((child) => repoNodes.has(child));
    const beforeRepoChildren = firstRepoIndex < 0 ? [] : children.slice(0, firstRepoIndex).filter((child) => !repoNodes.has(child));
    const afterRepoChildren = firstRepoIndex < 0 ? children.filter((child) => !repoNodes.has(child)) : children.slice(firstRepoIndex).filter((child) => !repoNodes.has(child));
    const orderedNodes = [
      ...pinnedItems.map((item) => item.node),
      ...pinnedItems.length && regularItems.length ? [createDividerElement(container)] : [],
      ...regularItems.map((item) => item.node)
    ];
    const fragment = document.createDocumentFragment();
    beforeRepoChildren.forEach((node) => fragment.appendChild(node));
    orderedNodes.forEach((node) => fragment.appendChild(node));
    afterRepoChildren.forEach((node) => fragment.appendChild(node));
    container.replaceChildren(fragment);
  }
  function isDashboardHomePage() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    return path === "/" || path === "/dashboard";
  }
  function hasTopRepositoriesHeading() {
    return Boolean(getTopRepositoriesHeading());
  }
  function needsTopRepositoriesEnhancement() {
    if (!isDashboardHomePage()) return false;
    const listMatch = findTopRepositoriesList();
    if (!listMatch || !listMatch.items.length) return false;
    return listMatch.items.some((item) => !item.node.querySelector(`.${TOP_REPOSITORIES_BUTTON_CLASS}`));
  }
  function isTopRepositoriesToggleTarget(target) {
    if (!(target instanceof Element)) return false;
    const heading = getTopRepositoriesHeading();
    if (!heading) return false;
    const root = heading.closest("section, aside") || heading.parentElement;
    if (!root) return false;
    const trigger = target.closest('button, a, summary, [role="button"]');
    if (!trigger || !root.contains(trigger)) return false;
    const expanded = trigger.getAttribute("aria-expanded");
    if (expanded === "true" || expanded === "false") return true;
    const text = normalizeText(trigger.textContent);
    return TOP_REPOSITORIES_SHOW_MORE_PREFIXES.some((prefix) => text.startsWith(prefix));
  }
  function enhanceTopRepositories() {
    if (!isDashboardHomePage()) return;
    const listMatch = findTopRepositoriesList();
    if (!listMatch || !listMatch.items.length) return;
    const pinnedSet = new Set(loadPinnedRepositories());
    renderPinButtons(listMatch.container, listMatch.items, pinnedSet);
    reorderRows(listMatch.container, listMatch.items, pinnedSet);
  }

  // src/main.js
  var renderQueued = false;
  function applyEnhancements() {
    syncThemePreference();
    ensureStyles();
    addCustomButtons();
    enhanceTopRepositories();
  }
  function scheduleEnhancements() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      applyEnhancements();
    });
  }
  console.info(`[Better GitHub Navigation] loaded v${SCRIPT_VERSION}`);
  window.__betterGithubNavVersion = SCRIPT_VERSION;
  window.__openBetterGithubNavSettings = openConfigPanel;
  bindThemePreferenceSync();
  registerConfigMenu();
  scheduleEnhancements();
  document.addEventListener("turbo:load", scheduleEnhancements);
  document.addEventListener("pjax:end", scheduleEnhancements);
  document.addEventListener("click", (event) => {
    if (!isTopRepositoriesToggleTarget(event.target)) return;
    setTimeout(scheduleEnhancements, 0);
  });
  var observer = new MutationObserver(() => {
    const hasHeader = Boolean(document.querySelector("header"));
    const hasCustomNavUi = Boolean(document.querySelector(
      '[id^="custom-gh-btn-"], [' + QUICK_LINK_MARK_ATTR + '="1"], [' + RESPONSIVE_TOGGLE_MARK_ATTR + '="1"]:not([hidden])'
    ));
    const missingNavButtons = hasHeader && !hasCustomNavUi;
    const missingTopRepoPins = isDashboardHomePage() && hasTopRepositoriesHeading() && needsTopRepositoriesEnhancement();
    if (missingNavButtons || missingTopRepoPins) scheduleEnhancements();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
