// ==UserScript==
// @name         Better GitHub Navigation
// @name:zh-CN   更好的 GitHub 导航栏
// @namespace    https://github.com/ImXiangYu/better-github-nav
// @version      0.1.20
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
    const SCRIPT_VERSION = '0.1.20';
    const CUSTOM_BUTTON_CLASS = 'custom-gh-nav-btn';
    const CUSTOM_BUTTON_ACTIVE_CLASS = 'custom-gh-nav-btn-active';
    const CUSTOM_BUTTON_COMPACT_CLASS = 'custom-gh-nav-btn-compact';
    const CONFIG_STORAGE_KEY = 'better-gh-nav-config-v1';
    const DEFAULT_LINK_KEYS = ['dashboard', 'explore', 'trending', 'collections', 'stars'];
    const PRESET_LINKS = [
        { key: 'dashboard', text: 'Dashboard', path: '/dashboard', getHref: () => '/dashboard' },
        { key: 'explore', text: 'Explore', path: '/explore', getHref: () => '/explore' },
        { key: 'trending', text: 'Trending', path: '/trending', getHref: () => '/trending' },
        { key: 'collections', text: 'Collections', path: '/collections', getHref: () => '/collections' },
        { key: 'stars', text: 'Stars', path: '/stars', getHref: username => (username ? `/${username}?tab=stars` : '/stars') }
    ];

    function parseCsvToKeys(input) {
        return (input || '')
            .split(',')
            .map(x => x.trim().toLowerCase())
            .filter(Boolean);
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
            ...orderKeysRaw.filter(key => enabledKeys.includes(key)),
            ...enabledKeys.filter(key => !orderSet.has(key))
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

    function registerConfigMenu() {
        if (typeof GM_registerMenuCommand !== 'function') return;
        GM_registerMenuCommand('Better GitHub Nav: 配置快捷链接', () => {
            const config = loadConfig();
            const options = PRESET_LINKS.map(link => `${link.key}(${link.text})`).join(', ');
            const enabledInput = prompt(
                `输入要显示的链接 key（逗号分隔）\n可选: ${options}`,
                config.enabledKeys.join(',')
            );
            if (enabledInput === null) return;
            const enabledKeys = sanitizeKeys(parseCsvToKeys(enabledInput));
            if (!enabledKeys.length) {
                alert('至少保留 1 个快捷链接。');
                return;
            }

            const orderInput = prompt(
                `输入显示顺序 key（逗号分隔，只需写已启用项）\n当前启用: ${enabledKeys.join(',')}`,
                config.orderKeys.filter(key => enabledKeys.includes(key)).join(',')
            );
            if (orderInput === null) return;
            const orderKeys = sanitizeKeys(parseCsvToKeys(orderInput));

            saveConfig({ enabledKeys, orderKeys });
            alert('配置已保存，页面将刷新生效。');
            location.reload();
        });

        GM_registerMenuCommand('Better GitHub Nav: 重置快捷链接配置', () => {
            localStorage.removeItem(CONFIG_STORAGE_KEY);
            alert('已重置为默认配置，页面将刷新生效。');
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
