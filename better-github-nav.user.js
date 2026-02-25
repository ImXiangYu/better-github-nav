// ==UserScript==
// @name         Better GitHub Navigation
// @name:zh-CN   更好的 GitHub 导航栏
// @namespace    https://github.com/ImXiangYu/better-github-nav
// @version      0.1.24
// @description  Add quick access to Dashboard, Trending, Explore, Collections, and Stars from GitHub's top navigation.
// @description:zh-CN 在 GitHub 顶部导航中加入 Dashboard、Trending、Explore、Collections、Stars 快捷入口，常用页面一键直达。
// @author       Ayubass
// @license      MIT
// @match        https://github.com/*
// @icon         https://github.githubassets.com/pinned-octocat.svg
// @updateURL    https://raw.githubusercontent.com/ImXiangYu/better-github-nav/main/better-github-nav.user.js
// @downloadURL  https://raw.githubusercontent.com/ImXiangYu/better-github-nav/main/better-github-nav.user.js
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';
    const SCRIPT_VERSION = '0.1.24';
    const CUSTOM_BUTTON_CLASS = 'custom-gh-nav-btn';
    const CUSTOM_BUTTON_ACTIVE_CLASS = 'custom-gh-nav-btn-active';
    const CUSTOM_BUTTON_COMPACT_CLASS = 'custom-gh-nav-btn-compact';
    const CONFIG_STORAGE_KEY = 'better-gh-nav-config-v1';
    const UI_LANG_STORAGE_KEY = 'better-gh-nav-ui-lang-v1';
    const SETTINGS_OVERLAY_ID = 'custom-gh-nav-settings-overlay';
    const SETTINGS_PANEL_ID = 'custom-gh-nav-settings-panel';
    const SETTINGS_MESSAGE_ID = 'custom-gh-nav-settings-message';
    const DEFAULT_LINK_KEYS = ['dashboard', 'explore', 'trending', 'collections', 'stars'];
    const PRESET_LINKS = [
        { key: 'dashboard', text: 'Dashboard', path: '/dashboard', getHref: () => '/dashboard' },
        { key: 'explore', text: 'Explore', path: '/explore', getHref: () => '/explore' },
        { key: 'trending', text: 'Trending', path: '/trending', getHref: () => '/trending' },
        { key: 'collections', text: 'Collections', path: '/collections', getHref: () => '/collections' },
        { key: 'stars', text: 'Stars', path: '/stars', getHref: username => (username ? `/${username}?tab=stars` : '/stars') }
    ];
    const I18N = {
        zh: {
            menuOpenSettings: 'Better GitHub Nav: 打开设置面板',
            menuResetSettings: 'Better GitHub Nav: 重置快捷链接配置',
            menuLangZh: 'Better GitHub Nav: 界面语言 -> 中文',
            menuLangEn: 'Better GitHub Nav: 界面语言 -> English',
            menuLangAuto: 'Better GitHub Nav: 界面语言 -> 自动（跟随页面）',
            resetConfirm: '确认重置快捷链接配置为默认值吗？',
            panelTitle: 'Better GitHub Nav 设置',
            panelDesc: '勾选决定显示项，拖动整行（或右侧手柄）调整显示顺序。',
            resetDefault: '恢复默认',
            cancel: '取消',
            saveAndRefresh: '保存并刷新',
            restoredPendingSave: '已恢复默认，点击保存后生效。',
            atLeastOneLink: '至少保留 1 个快捷链接。',
            dragHandleTitle: '拖动调整顺序',
            dragRowTitle: '拖动整行调整顺序'
        },
        en: {
            menuOpenSettings: 'Better GitHub Nav: Open Settings Panel',
            menuResetSettings: 'Better GitHub Nav: Reset Quick Link Config',
            menuLangZh: 'Better GitHub Nav: UI Language -> 中文',
            menuLangEn: 'Better GitHub Nav: UI Language -> English',
            menuLangAuto: 'Better GitHub Nav: UI Language -> Auto (Follow Page)',
            resetConfirm: 'Reset quick-link config to defaults?',
            panelTitle: 'Better GitHub Nav Settings',
            panelDesc: 'Select visible links and drag the row (or handle) to reorder.',
            resetDefault: 'Reset to Default',
            cancel: 'Cancel',
            saveAndRefresh: 'Save and Refresh',
            restoredPendingSave: 'Defaults restored. Click save to apply.',
            atLeastOneLink: 'Keep at least 1 quick link.',
            dragHandleTitle: 'Drag to reorder',
            dragRowTitle: 'Drag row to reorder'
        }
    };
    let settingsEscHandler = null;
    let uiLang = detectUiLang();

    function t(key, vars = {}) {
        const dict = I18N[uiLang] || I18N.en;
        const fallback = I18N.en;
        const template = dict[key] || fallback[key] || key;
        return template.replace(/\{(\w+)\}/g, (_, varName) => String(vars[varName] ?? ''));
    }

    function detectUiLang() {
        try {
            const preferredLang = (localStorage.getItem(UI_LANG_STORAGE_KEY) || '').toLowerCase();
            if (preferredLang === 'zh' || preferredLang === 'en') return preferredLang;
        } catch (e) {
            // ignore storage read failure and fallback to auto detection
        }

        const autoLang = (document.documentElement.lang || navigator.language || '').toLowerCase();
        return autoLang.startsWith('zh') ? 'zh' : 'en';
    }

    function setUiLangPreference(lang) {
        try {
            if (lang === 'zh' || lang === 'en') {
                localStorage.setItem(UI_LANG_STORAGE_KEY, lang);
            } else {
                localStorage.removeItem(UI_LANG_STORAGE_KEY);
            }
        } catch (e) {
            // ignore storage write failure; auto detection still works
        }
        uiLang = detectUiLang();
    }

    function sanitizeKeys(keys) {
        const validSet = new Set(DEFAULT_LINK_KEYS);
        const seen = new Set();
        const result = [];
        keys.forEach(key => {
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
            ...DEFAULT_LINK_KEYS.filter(key => !orderSet.has(key))
        ];
        return {
            enabledKeys: enabledKeys.length ? enabledKeys : DEFAULT_LINK_KEYS.slice(),
            orderKeys: orderKeys.length ? orderKeys : DEFAULT_LINK_KEYS.slice()
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

    function getConfiguredLinks(username) {
        const config = loadConfig();
        const presetMap = new Map(
            PRESET_LINKS.map(link => [link.key, {
                ...link,
                id: `custom-gh-btn-${link.key}`,
                href: link.getHref(username)
            }])
        );
        return config.orderKeys
            .filter(key => config.enabledKeys.includes(key))
            .map(key => presetMap.get(key))
            .filter(Boolean);
    }

    function getDisplayNameByKey(key) {
        const link = PRESET_LINKS.find(item => item.key === key);
        return link ? link.text : key;
    }

    function closeConfigPanel() {
        const overlay = document.getElementById(SETTINGS_OVERLAY_ID);
        if (overlay) overlay.remove();
        if (settingsEscHandler) {
            document.removeEventListener('keydown', settingsEscHandler);
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
        const rows = listEl.querySelectorAll('.custom-gh-nav-settings-row');
        rows.forEach(row => {
            row.classList.remove('custom-gh-nav-settings-row-dragging');
            row.classList.remove('custom-gh-nav-settings-row-drag-over');
        });
    }

    function renderPanelRows(listEl, state) {
        listEl.replaceChildren();
        state.order.forEach(key => {
            const row = document.createElement('div');
            row.className = 'custom-gh-nav-settings-row';
            row.draggable = true;
            row.title = t('dragRowTitle');
            row.dataset.rowKey = key;

            const left = document.createElement('label');
            left.className = 'custom-gh-nav-settings-row-left';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = state.enabledSet.has(key);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    state.enabledSet.add(key);
                } else {
                    state.enabledSet.delete(key);
                }
            });

            const text = document.createElement('span');
            text.textContent = `${getDisplayNameByKey(key)} (${key})`;

            left.appendChild(checkbox);
            left.appendChild(text);

            const actions = document.createElement('div');
            actions.className = 'custom-gh-nav-settings-row-actions';

            const dragHandle = document.createElement('span');
            dragHandle.className = 'custom-gh-nav-settings-drag-handle';
            dragHandle.textContent = '≡';
            dragHandle.title = t('dragHandleTitle');
            dragHandle.setAttribute('aria-hidden', 'true');

            row.addEventListener('dragstart', event => {
                row.classList.add('custom-gh-nav-settings-row-dragging');
                listEl.dataset.dragKey = key;
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', key);
                }
            });
            row.addEventListener('dragend', () => {
                delete listEl.dataset.dragKey;
                clearDragClasses(listEl);
            });

            row.addEventListener('dragover', event => {
                event.preventDefault();
                row.classList.add('custom-gh-nav-settings-row-drag-over');
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'move';
                }
            });
            row.addEventListener('dragleave', () => {
                row.classList.remove('custom-gh-nav-settings-row-drag-over');
            });
            row.addEventListener('drop', event => {
                event.preventDefault();
                row.classList.remove('custom-gh-nav-settings-row-drag-over');

                const draggedKey = (event.dataTransfer && event.dataTransfer.getData('text/plain'))
                    || listEl.dataset.dragKey
                    || '';
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
        const overlay = document.createElement('div');
        overlay.id = SETTINGS_OVERLAY_ID;

        const panel = document.createElement('div');
        panel.id = SETTINGS_PANEL_ID;

        const title = document.createElement('h3');
        title.className = 'custom-gh-nav-settings-title';
        title.textContent = t('panelTitle');

        const desc = document.createElement('p');
        desc.className = 'custom-gh-nav-settings-desc';
        desc.textContent = t('panelDesc');

        const list = document.createElement('div');
        list.className = 'custom-gh-nav-settings-list';
        renderPanelRows(list, state);

        const message = document.createElement('div');
        message.id = SETTINGS_MESSAGE_ID;
        message.className = 'custom-gh-nav-settings-message';
        message.setAttribute('role', 'status');
        message.setAttribute('aria-live', 'polite');

        const footer = document.createElement('div');
        footer.className = 'custom-gh-nav-settings-footer';

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'custom-gh-nav-settings-btn';
        resetBtn.textContent = t('resetDefault');
        resetBtn.addEventListener('click', () => {
            state.order = DEFAULT_LINK_KEYS.slice();
            state.enabledSet = new Set(DEFAULT_LINK_KEYS);
            renderPanelRows(list, state);
            message.textContent = t('restoredPendingSave');
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'custom-gh-nav-settings-btn';
        cancelBtn.textContent = t('cancel');
        cancelBtn.addEventListener('click', closeConfigPanel);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'custom-gh-nav-settings-btn custom-gh-nav-settings-btn-primary';
        saveBtn.textContent = t('saveAndRefresh');
        saveBtn.addEventListener('click', () => {
            const enabledKeys = state.order.filter(key => state.enabledSet.has(key));
            if (!enabledKeys.length) {
                message.textContent = t('atLeastOneLink');
                return;
            }
            saveConfig({
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

        overlay.addEventListener('click', event => {
            if (event.target === overlay) closeConfigPanel();
        });

        settingsEscHandler = event => {
            if (event.key === 'Escape') closeConfigPanel();
        };
        document.addEventListener('keydown', settingsEscHandler);

        document.body.appendChild(overlay);
    }

    function registerConfigMenu() {
        if (typeof GM_registerMenuCommand !== 'function') return;
        GM_registerMenuCommand(t('menuOpenSettings'), openConfigPanel);

        GM_registerMenuCommand(t('menuResetSettings'), () => {
            const shouldReset = confirm(t('resetConfirm'));
            if (!shouldReset) return;
            localStorage.removeItem(CONFIG_STORAGE_KEY);
            closeConfigPanel();
            location.reload();
        });

        GM_registerMenuCommand(t('menuLangZh'), () => {
            setUiLangPreference('zh');
            closeConfigPanel();
            location.reload();
        });

        GM_registerMenuCommand(t('menuLangEn'), () => {
            setUiLangPreference('en');
            closeConfigPanel();
            location.reload();
        });

        GM_registerMenuCommand(t('menuLangAuto'), () => {
            setUiLangPreference('auto');
            closeConfigPanel();
            location.reload();
        });
    }

    function normalizePath(href) {
        try {
            const url = new URL(href, location.origin);
            const path = url.pathname.replace(/\/+$/, '');
            return path || '/';
        } catch (e) {
            return '';
        }
    }

    function isCurrentPage(linkPath) {
        const currentPath = location.pathname.replace(/\/+$/, '') || '/';
        if (linkPath === '/dashboard') return currentPath === '/' || currentPath === '/dashboard';
        if (currentPath === linkPath) return true;
        if (linkPath !== '/' && currentPath.startsWith(`${linkPath}/`)) return true;

        // Stars 页面常见为 /<username>?tab=stars
        return location.search.includes('tab=stars') && linkPath === normalizePath('/stars');
    }

    function ensureStyles() {
        if (document.getElementById('custom-gh-nav-style')) return;
        const style = document.createElement('style');
        style.id = 'custom-gh-nav-style';
        style.textContent = `
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
            a.${CUSTOM_BUTTON_CLASS}:hover {
                background-color: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
                text-decoration: none;
            }
            a.${CUSTOM_BUTTON_CLASS}.${CUSTOM_BUTTON_ACTIVE_CLASS} {
                background-color: var(--color-neutral-muted, rgba(177, 186, 196, 0.18));
                font-weight: 600;
            }
            #${SETTINGS_OVERLAY_ID} {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                background: rgba(0, 0, 0, 0.45);
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
                background: var(--color-canvas-default, #fff);
                color: var(--color-fg-default, #1f2328);
                border: 1px solid var(--color-border-default, #d1d9e0);
                border-radius: 10px;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
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
                color: var(--color-fg-muted, #656d76);
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
                border: 1px solid var(--color-border-muted, #d8dee4);
                border-radius: 8px;
                padding: 8px 10px;
                background: var(--color-canvas-subtle, #f6f8fa);
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
                border: 1px solid var(--color-border-default, #d1d9e0);
                background: var(--color-btn-bg, #f6f8fa);
                color: var(--color-fg-muted, #656d76);
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
                border-color: var(--color-accent-fg, #0969da);
                background: var(--color-accent-subtle, #ddf4ff);
            }
            .custom-gh-nav-settings-btn {
                border: 1px solid var(--color-border-default, #d1d9e0);
                background: var(--color-btn-bg, #f6f8fa);
                color: var(--color-fg-default, #1f2328);
                border-radius: 6px;
                padding: 4px 10px;
                font-size: 12px;
                cursor: pointer;
            }
            .custom-gh-nav-settings-btn:hover {
                background: var(--color-btn-hover-bg, #f3f4f6);
            }
            .custom-gh-nav-settings-btn:disabled {
                opacity: 0.45;
                cursor: not-allowed;
            }
            .custom-gh-nav-settings-btn-primary {
                background: var(--color-btn-primary-bg, #1f883d);
                border-color: var(--color-btn-primary-bg, #1f883d);
                color: var(--color-btn-primary-text, #fff);
            }
            .custom-gh-nav-settings-btn-primary:hover {
                background: var(--color-btn-primary-hover-bg, #1a7f37);
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
                color: var(--color-attention-fg, #9a6700);
                font-size: 12px;
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
            aTag.setAttribute('aria-current', 'page');
            aTag.classList.add(CUSTOM_BUTTON_ACTIVE_CLASS);
        } else {
            aTag.removeAttribute('aria-current');
            aTag.classList.remove(CUSTOM_BUTTON_ACTIVE_CLASS);
        }
    }

    function setLinkText(aTag, text) {
        const innerSpan = aTag.querySelector('span');
        if (innerSpan) {
            innerSpan.textContent = text;
        } else {
            aTag.textContent = text;
        }
    }

    function ensureAnchor(node, isLiParent) {
        let aTag = isLiParent ? node.querySelector('a') : (node.tagName.toLowerCase() === 'a' ? node : node.querySelector('a'));
        if (aTag) return aTag;

        const fallbackText = (node.textContent || '').trim();
        const fallbackHref = (!isLiParent && node.getAttribute && node.getAttribute('href'))
            ? node.getAttribute('href')
            : `${location.pathname}${location.search}`;
        const classSource = isLiParent
            ? node.querySelector('[class*="contextCrumb"], [class*="Breadcrumbs-Item"]')
            : node;
        const spanTemplate = document.querySelector(
            'header a[class*="contextCrumb"] span[class*="contextCrumbLast"]'
        );
        const spanSource = isLiParent ? node.querySelector('span') : node.querySelector('span');

        aTag = document.createElement('a');
        if (classSource && classSource.className) {
            aTag.className = classSource.className
                .split(/\s+/)
                .filter(cls => cls && !cls.includes('contextCrumbStatic'))
                .join(' ');
        }
        if (spanSource && spanSource.className) {
            const innerSpan = document.createElement('span');
            innerSpan.className = spanTemplate && spanTemplate.className
                ? spanTemplate.className
                : spanSource.className;
            if (fallbackText) innerSpan.textContent = fallbackText;
            aTag.appendChild(innerSpan);
        }
        if (!aTag.getAttribute('href') && fallbackHref) {
            aTag.setAttribute('href', fallbackHref);
        }
        if (!aTag.textContent.trim() && fallbackText) {
            const innerSpan = aTag.querySelector('span');
            if (innerSpan) {
                innerSpan.textContent = fallbackText;
            } else {
                aTag.textContent = fallbackText;
            }
        }

        if (isLiParent) {
            node.textContent = '';
            node.appendChild(aTag);
        } else {
            node.replaceChildren(aTag);
        }
        return aTag;
    }

    function addCustomButtons() {
        // 获取当前登录的用户名，用来动态生成 Stars 页面的专属链接
        const userLoginMeta = document.querySelector('meta[name="user-login"]');
        const username = userLoginMeta ? userLoginMeta.getAttribute('content') : '';
        const navPresetLinks = getConfiguredLinks(username);
        if (!navPresetLinks.length) return;
        const primaryLink = navPresetLinks[0];
        const extraLinks = navPresetLinks.slice(1);
        const fixedPages = new Set(['/dashboard', '/trending', '/explore', '/collections']);
        const compactPages = new Set(['/issues', '/pulls', '/repositories']);

        const isOnPresetPage = Array.from(fixedPages).some(path => isCurrentPage(path));
        const shouldUseCompactButtons = Array.from(compactPages).some(path => isCurrentPage(path));

        // 预设页面优先主导航；其他页面优先 breadcrumb/context crumb 的最后一项（如仓库名）
        let targetNode = null;
        if (isOnPresetPage) {
            targetNode = document.querySelector(
                'header a[href="/dashboard"], header a[href="/trending"], header a[href="/explore"]'
            );
        } else {
            const breadcrumbNodes = document.querySelectorAll(
                'header nav[aria-label*="breadcrumb" i] a[href^="/"], ' +
                'header a[class*="contextCrumb"][href^="/"], ' +
                'header a[class*="Breadcrumbs-Item"][href^="/"]'
            );
            if (breadcrumbNodes.length) {
                targetNode = breadcrumbNodes[breadcrumbNodes.length - 1];
            }
        }

        // 全局导航中优先使用当前页项，避免误选最后一个导航按钮导致当前页无高亮
        if (!targetNode) {
            targetNode = document.querySelector(
                'header nav a[aria-current="page"]:not([id^="custom-gh-btn-"]), ' +
                'header nav a[data-active="true"]:not([id^="custom-gh-btn-"]), ' +
                'header nav [aria-current="page"]:not(a), ' +
                'header nav [data-active="true"]:not(a)'
            );
        }

        // 兼容兜底：若未找到主导航，再尝试旧规则
        if (!targetNode) {
            const navLinks = document.querySelectorAll('header a');
            for (let link of navLinks) {
                const text = link.textContent.trim().toLowerCase();
                const href = link.getAttribute('href');
                if (text === 'dashboard' || href === '/dashboard') {
                    targetNode = link;
                    break;
                }
            }
        }

        // 通用兜底：在有全局导航的页面（如 /pulls /issues /repositories）优先按当前路径匹配
        if (!targetNode) {
            const currentPath = location.pathname.replace(/\/+$/, '') || '/';
            const globalNavCandidates = Array.from(
                document.querySelectorAll(
                    'header nav[aria-label*="global" i] a[href^="/"], ' +
                    'header nav[aria-label*="header" i] a[href^="/"], ' +
                    'header nav a[href="/pulls"], ' +
                    'header nav a[href="/issues"], ' +
                    'header nav a[href="/repositories"], ' +
                    'header nav a[href="/codespaces"], ' +
                    'header nav a[href="/marketplace"], ' +
                    'header nav a[href="/explore"]'
                )
            ).filter(link => {
                const href = normalizePath(link.getAttribute('href') || '');
                if (!href || href === '/') return false;
                if (link.id && link.id.startsWith('custom-gh-btn-')) return false;
                return true;
            });
            if (globalNavCandidates.length) {
                targetNode = globalNavCandidates.find(link => {
                    const href = normalizePath(link.getAttribute('href') || '');
                    return href === currentPath;
                }) || globalNavCandidates[globalNavCandidates.length - 1];
            }
        }

        // 文本型当前项兜底：部分页面当前导航项是不可点击文本（非 a）
        if (!targetNode) {
            const currentTextNode = document.querySelector(
                'header nav [aria-current="page"]:not(a), ' +
                'header nav [data-active="true"]:not(a)'
            );
            if (currentTextNode) {
                targetNode = currentTextNode;
            }
        }

        // context crumb 文本项兜底：如 Issues/PRs 页为 span 而非 a
        if (!targetNode) {
            const contextCrumbTextNodes = document.querySelectorAll(
                'header span[class*="contextCrumbStatic"], ' +
                'header span[class*="contextCrumb"][class*="Breadcrumbs-Item"], ' +
                'header .prc-Breadcrumbs-Item-jcraJ'
            );
            if (contextCrumbTextNodes.length) {
                targetNode = contextCrumbTextNodes[contextCrumbTextNodes.length - 1];
            }
        }

        // 样式模板优先使用同容器内可点击链接，避免从纯文本节点克隆导致样式不一致
        let templateNode = targetNode;
        if (targetNode) {
            const localNav = targetNode.closest('nav, ul, ol');
            const localAnchors = localNav
                ? localNav.querySelectorAll('a[href^="/"]:not([id^="custom-gh-btn-"])')
                : [];

            if (localAnchors.length) {
                templateNode = localAnchors[localAnchors.length - 1];
            } else {
                const nativeNavAnchors = document.querySelectorAll(
                    'header nav[aria-label*="breadcrumb" i] a[href^="/"]:not([id^="custom-gh-btn-"]), ' +
                    'header a[class*="contextCrumb"][href^="/"]:not([id^="custom-gh-btn-"]), ' +
                    'header a[class*="Breadcrumbs-Item"][href^="/"]:not([id^="custom-gh-btn-"]), ' +
                    'header nav[aria-label*="global" i] a[href^="/"]:not([id^="custom-gh-btn-"]), ' +
                    'header nav[aria-label*="header" i] a[href^="/"]:not([id^="custom-gh-btn-"]), ' +
                    'header nav a[href="/pulls"]:not([id^="custom-gh-btn-"]), ' +
                    'header nav a[href="/issues"]:not([id^="custom-gh-btn-"]), ' +
                    'header nav a[href="/repositories"]:not([id^="custom-gh-btn-"]), ' +
                    'header nav a[href="/codespaces"]:not([id^="custom-gh-btn-"]), ' +
                    'header nav a[href="/marketplace"]:not([id^="custom-gh-btn-"]), ' +
                    'header nav a[href="/explore"]:not([id^="custom-gh-btn-"])'
                );
                if (nativeNavAnchors.length) {
                    templateNode = nativeNavAnchors[nativeNavAnchors.length - 1];
                }
            }
        }

        if (targetNode) {
            // targetNode 用于决定插入位置，templateNode 用于克隆样式
            const isTargetLiParent = targetNode.parentNode.tagName.toLowerCase() === 'li';
            const insertAnchorNode = isTargetLiParent ? targetNode.parentNode : targetNode;
            const isTemplateLiParent = templateNode.parentNode.tagName.toLowerCase() === 'li';
            const cloneTemplateNode = isTemplateLiParent ? templateNode.parentNode : templateNode;
            const targetHasAnchor = isTargetLiParent
                ? Boolean(insertAnchorNode.querySelector('a'))
                : insertAnchorNode.tagName.toLowerCase() === 'a' || Boolean(insertAnchorNode.querySelector('a'));
            const shouldForceCreateAnchor = !targetHasAnchor && Boolean(targetNode.closest('header nav'));
            const anchorTag = (targetHasAnchor || shouldForceCreateAnchor)
                ? ensureAnchor(insertAnchorNode, isTargetLiParent)
                : null;
            const hasShortcutActive = navPresetLinks.some(link => isCurrentPage(link.path));

            if (isOnPresetPage && anchorTag && primaryLink) {
                // 预设页面：首个按钮替换为当前配置顺序中的第一个
                anchorTag.id = primaryLink.id;
                anchorTag.href = primaryLink.href;
                setLinkText(anchorTag, primaryLink.text);
                setActiveStyle(anchorTag, isCurrentPage(primaryLink.path), shouldUseCompactButtons);
            } else {
                // 其他页面：保留原生当前按钮，仅做高亮
                if (anchorTag && anchorTag.id && anchorTag.id.startsWith('custom-gh-btn-')) {
                    anchorTag.removeAttribute('id');
                }
                // 若快捷按钮已有命中（如 Stars 页），则避免双高亮
                if (anchorTag) {
                    setActiveStyle(anchorTag, !hasShortcutActive, shouldUseCompactButtons);
                }
            }
            
            // 设定插入的锚点，随着循环不断向后移动，保证按钮顺序正确
            let insertAfterNode = insertAnchorNode;
            const linksToRender = isOnPresetPage ? extraLinks : navPresetLinks;

            linksToRender.forEach(linkInfo => {
                const existing = document.getElementById(linkInfo.id);
                if (existing) {
                    existing.href = linkInfo.href;
                    setLinkText(existing, linkInfo.text);
                    setActiveStyle(existing, isCurrentPage(linkInfo.path), shouldUseCompactButtons);
                    return;
                }

                const newNode = cloneTemplateNode.cloneNode(true);
                const aTag = ensureAnchor(newNode, isTemplateLiParent);
                
                aTag.id = linkInfo.id;
                aTag.href = linkInfo.href;
                setLinkText(aTag, linkInfo.text);

                setActiveStyle(aTag, isCurrentPage(linkInfo.path), shouldUseCompactButtons);

                // 将新按钮插入到锚点之后，并更新锚点
                insertAfterNode.parentNode.insertBefore(newNode, insertAfterNode.nextSibling);
                insertAfterNode = newNode; 
            });
        }
    }

    // 1. 页面初次加载时执行
    console.info(`[Better GitHub Navigation] loaded v${SCRIPT_VERSION}`);
    window.__betterGithubNavVersion = SCRIPT_VERSION;
    window.__openBetterGithubNavSettings = openConfigPanel;
    registerConfigMenu();
    ensureStyles();
    addCustomButtons();

    // 2. 监听 GitHub 的 Turbo/PJAX 页面跳转事件，防止切换页面后按钮消失
    document.addEventListener('turbo:load', addCustomButtons);
    document.addEventListener('pjax:end', addCustomButtons);

    // 3. 终极备用方案：使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
        if (!document.querySelector('[id^="custom-gh-btn-"]') && document.querySelector('header')) {
            addCustomButtons();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
