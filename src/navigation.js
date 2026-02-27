import { PRESET_LINKS, PRESET_LINK_SHORTCUTS, QUICK_LINK_MARK_ATTR } from './constants.js';
import { getConfiguredLinks } from './config.js';
import { setActiveStyle } from './styles.js';

let lastHotkeyConflictSignature = '';
let hotkeyTooltipNode = null;
let hotkeyTooltipTextNode = null;
let hotkeyTooltipHintNode = null;
let hotkeyTooltipAnchor = null;
let hotkeyTooltipGlobalBound = false;
const hotkeyTooltipBoundAnchors = new WeakSet();

export function normalizePath(href) {
    try {
        const url = new URL(href, location.origin);
        const path = url.pathname.replace(/\/+$/, '');
        return path || '/';
    } catch (e) {
        return '';
    }
}

export function isCurrentPage(linkPath) {
    const currentPath = location.pathname.replace(/\/+$/, '') || '/';
    if (linkPath === '/dashboard') return currentPath === '/' || currentPath === '/dashboard';
    if (currentPath === linkPath) return true;
    if (linkPath !== '/' && currentPath.startsWith(`${linkPath}/`)) return true;

    // Stars 页面常见为 /<username>?tab=stars
    return location.search.includes('tab=stars') && linkPath === normalizePath('/stars');
}

export function setLinkText(aTag, text) {
    aTag.removeAttribute('aria-describedby');
    aTag.setAttribute('aria-label', text);

    const innerSpan = aTag.querySelector('span');
    if (innerSpan) {
        innerSpan.textContent = text;
    } else {
        aTag.textContent = text;
    }
}

export function ensureAnchor(node, isLiParent) {
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

function getAnchorHostNode(anchor) {
    if (!anchor || !anchor.parentNode) return anchor;
    return anchor.parentNode.tagName.toLowerCase() === 'li' ? anchor.parentNode : anchor;
}

function cleanupQuickLinksForContainer(renderParent, keepNode) {
    const quickAnchors = Array.from(
        document.querySelectorAll(
            'header a[id^="custom-gh-btn-"], header a[' + QUICK_LINK_MARK_ATTR + '="1"]'
        )
    );

    quickAnchors.forEach(anchor => {
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

function normalizeHotkeyValue(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function createChordNode(chord) {
    const chordNode = document.createElement('span');
    chordNode.className = 'custom-gh-nav-tooltip-chord';
    chordNode.setAttribute('data-kbd-chord', 'true');
    chordNode.textContent = chord.toUpperCase();
    return chordNode;
}

function ensureHotkeyTooltipNode() {
    const existing = document.getElementById('custom-gh-nav-hotkey-tooltip');
    if (existing) {
        hotkeyTooltipNode = existing;
        hotkeyTooltipTextNode = existing.querySelector('.custom-gh-nav-tooltip-text');
        hotkeyTooltipHintNode = existing.querySelector('.custom-gh-nav-tooltip-kbd');
        return existing;
    }

    const tooltip = document.createElement('span');
    tooltip.id = 'custom-gh-nav-hotkey-tooltip';
    tooltip.className = 'custom-gh-nav-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.hidden = true;

    const textNode = document.createElement('span');
    textNode.className = 'custom-gh-nav-tooltip-text';
    tooltip.appendChild(textNode);

    const hintContainer = document.createElement('span');
    hintContainer.className = 'custom-gh-nav-tooltip-hint-container';
    hintContainer.setAttribute('aria-hidden', 'true');

    const kbdNode = document.createElement('kbd');
    kbdNode.className = 'custom-gh-nav-tooltip-kbd';
    hintContainer.appendChild(kbdNode);
    tooltip.appendChild(hintContainer);

    document.body.appendChild(tooltip);
    hotkeyTooltipNode = tooltip;
    hotkeyTooltipTextNode = textNode;
    hotkeyTooltipHintNode = kbdNode;
    return tooltip;
}

function hideHotkeyTooltip() {
    const tooltip = hotkeyTooltipNode || document.getElementById('custom-gh-nav-hotkey-tooltip');
    if (!tooltip) return;

    tooltip.hidden = true;
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.removeAttribute('data-direction');

    if (hotkeyTooltipAnchor) {
        hotkeyTooltipAnchor.removeAttribute('aria-describedby');
    }
    hotkeyTooltipAnchor = null;
}

function positionHotkeyTooltip(tooltip, anchor) {
    const spacing = 8;
    const rect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = rect.bottom + spacing;
    let direction = 's';
    if (top + tooltipRect.height > window.innerHeight - spacing && rect.top - spacing - tooltipRect.height >= spacing) {
        top = rect.top - spacing - tooltipRect.height;
        direction = 'n';
    }

    let left = rect.left + ((rect.width - tooltipRect.width) / 2);
    if (left + tooltipRect.width > window.innerWidth - spacing) {
        left = window.innerWidth - tooltipRect.width - spacing;
    }
    if (left < spacing) {
        left = spacing;
    }

    tooltip.style.top = `${Math.round(top)}px`;
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.setAttribute('data-direction', direction);
}

function showHotkeyTooltip(anchor) {
    const hotkey = normalizeHotkeyValue(anchor.getAttribute('data-hotkey'));
    if (!hotkey) return;

    const tooltip = ensureHotkeyTooltipNode();
    const label = String(anchor.getAttribute('aria-label') || anchor.textContent || '').replace(/\s+/g, ' ').trim();

    if (hotkeyTooltipTextNode) {
        hotkeyTooltipTextNode.textContent = label;
    }

    if (hotkeyTooltipHintNode) {
        hotkeyTooltipHintNode.textContent = '';
        const chords = hotkey.split(' ').filter(Boolean);
        chords.forEach(chord => {
            hotkeyTooltipHintNode.appendChild(createChordNode(chord));
        });
    }

    tooltip.hidden = false;
    tooltip.setAttribute('aria-hidden', 'false');
    positionHotkeyTooltip(tooltip, anchor);

    if (hotkeyTooltipAnchor && hotkeyTooltipAnchor !== anchor) {
        hotkeyTooltipAnchor.removeAttribute('aria-describedby');
    }
    hotkeyTooltipAnchor = anchor;
    anchor.setAttribute('aria-describedby', tooltip.id);
}

function bindHotkeyTooltipHandlers(anchor) {
    if (hotkeyTooltipBoundAnchors.has(anchor)) return;
    hotkeyTooltipBoundAnchors.add(anchor);

    anchor.addEventListener('mouseenter', () => showHotkeyTooltip(anchor));
    anchor.addEventListener('mouseleave', hideHotkeyTooltip);
    anchor.addEventListener('focus', () => showHotkeyTooltip(anchor));
    anchor.addEventListener('blur', hideHotkeyTooltip);
    anchor.addEventListener('mousedown', hideHotkeyTooltip);
}

function bindHotkeyTooltipGlobalHandlers() {
    if (hotkeyTooltipGlobalBound) return;
    hotkeyTooltipGlobalBound = true;

    window.addEventListener('resize', hideHotkeyTooltip, { passive: true });
    document.addEventListener('scroll', hideHotkeyTooltip, true);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') hideHotkeyTooltip();
    }, true);
    document.addEventListener('pointerdown', event => {
        const tooltip = hotkeyTooltipNode || document.getElementById('custom-gh-nav-hotkey-tooltip');
        if (!tooltip || tooltip.hidden) return;

        const target = event.target;
        if (target && hotkeyTooltipAnchor && hotkeyTooltipAnchor.contains(target)) return;
        if (target && tooltip.contains(target)) return;
        hideHotkeyTooltip();
    }, true);
}

function applyLinkShortcut(aTag, linkInfo) {
    aTag.removeAttribute('data-hotkey');
    aTag.removeAttribute('aria-keyshortcuts');
    aTag.removeAttribute('title');
    aTag.removeAttribute('aria-describedby');

    const hotkey = normalizeHotkeyValue(PRESET_LINK_SHORTCUTS[linkInfo.key]);
    if (!hotkey) return '';

    aTag.setAttribute('data-hotkey', hotkey);
    aTag.setAttribute('aria-keyshortcuts', hotkey);
    bindHotkeyTooltipGlobalHandlers();
    bindHotkeyTooltipHandlers(aTag);
    return hotkey;
}

function describeHotkeyTarget(node) {
    if (!node) return '';

    const label = String(node.getAttribute('aria-label') || node.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
    if (label) return label;

    const href = node.getAttribute('href');
    if (href) return href;

    return node.tagName.toLowerCase();
}

function reportHotkeyConflicts(customAnchors) {
    const customSet = new Set(customAnchors.filter(Boolean));
    const customByHotkey = new Map();

    customAnchors.forEach(anchor => {
        const hotkey = normalizeHotkeyValue(anchor.getAttribute('data-hotkey'));
        if (!hotkey) return;
        const labels = customByHotkey.get(hotkey) || [];
        labels.push(describeHotkeyTarget(anchor));
        customByHotkey.set(hotkey, labels);
    });

    const conflictLines = [];

    customByHotkey.forEach((labels, hotkey) => {
        const uniqueLabels = Array.from(new Set(labels.filter(Boolean)));
        if (uniqueLabels.length > 1) {
            conflictLines.push(`${hotkey} -> ${uniqueLabels.join(' / ')}`);
        }
    });

    const nativeByHotkey = new Map();
    const nativeHotkeyNodes = Array.from(
        document.querySelectorAll('a[data-hotkey], button[data-hotkey], summary[data-hotkey]')
    );
    nativeHotkeyNodes.forEach(node => {
        if (customSet.has(node)) return;
        if (node.closest('[hidden], [aria-hidden="true"]')) return;

        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        const hotkey = normalizeHotkeyValue(node.getAttribute('data-hotkey'));
        if (!hotkey) return;
        if (!customByHotkey.has(hotkey)) return;

        const labels = nativeByHotkey.get(hotkey) || [];
        labels.push(describeHotkeyTarget(node));
        nativeByHotkey.set(hotkey, labels);
    });

    customByHotkey.forEach((labels, hotkey) => {
        const nativeLabels = nativeByHotkey.get(hotkey);
        if (!nativeLabels || !nativeLabels.length) return;

        const customLabel = Array.from(new Set(labels.filter(Boolean))).join(' / ');
        const nativeLabel = Array.from(new Set(nativeLabels.filter(Boolean))).slice(0, 2).join(' / ');
        conflictLines.push(`${hotkey} -> ${customLabel} <-> ${nativeLabel}`);
    });

    const uniqueConflictLines = Array.from(new Set(conflictLines));
    if (!uniqueConflictLines.length) {
        lastHotkeyConflictSignature = '';
        return;
    }

    const signature = uniqueConflictLines.join('|');
    if (signature === lastHotkeyConflictSignature) return;
    lastHotkeyConflictSignature = signature;

    console.warn(
        `[Better GitHub Navigation] 检测到快捷键冲突：${uniqueConflictLines.join('; ')}`
    );
}

export function addCustomButtons() {
    // 获取当前登录的用户名，用来动态生成 Stars 页面的专属链接
    const userLoginMeta = document.querySelector('meta[name="user-login"]');
    const username = userLoginMeta ? userLoginMeta.getAttribute('content') : '';
    const navPresetLinks = getConfiguredLinks(username);
    if (!navPresetLinks.length) return;
    const primaryLink = navPresetLinks[0];
    const extraLinks = navPresetLinks.slice(1);
    const fixedPages = new Set(['/dashboard', '/trending', '/explore', '/collections']);
    const shortcutPaths = new Set(PRESET_LINKS.map(link => link.path));
    const compactPages = new Set(['/issues', '/pulls', '/repositories']);

    const isOnPresetPage = Array.from(fixedPages).some(path => isCurrentPage(path));
    const shouldUseCompactButtons = Array.from(compactPages).some(path => isCurrentPage(path));

    // 预设页面优先主导航；其他页面优先 breadcrumb/context crumb 的最后一项（如仓库名）
    let targetNode = null;
    let targetSource = '';
    if (isOnPresetPage) {
        targetNode = document.querySelector(
            'header nav a[href="/dashboard"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
            'header nav a[href="/trending"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
            'header nav a[href="/explore"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"])'
        );
        if (targetNode) targetSource = 'preset-nav';
        if (!targetNode) {
            targetNode = document.querySelector(
                'header nav a[id^="custom-gh-btn-"], header nav a[' + QUICK_LINK_MARK_ATTR + '="1"]'
            );
            if (targetNode) targetSource = 'preset-quick';
        }
    } else {
        const breadcrumbNodes = Array.from(document.querySelectorAll(
            'header nav[aria-label*="breadcrumb" i] a[href^="/"], ' +
            'header a[class*="contextCrumb"][href^="/"], ' +
            'header a[class*="Breadcrumbs-Item"][href^="/"]'
        )).filter(link => {
            if (link.id && link.id.startsWith('custom-gh-btn-')) return false;
            if (link.getAttribute(QUICK_LINK_MARK_ATTR) === '1') return false;
            const href = normalizePath(link.getAttribute('href') || '');
            if (!href || href === '/') return false;
            if (shortcutPaths.has(href)) return false;
            return true;
        });
        if (breadcrumbNodes.length) {
            targetNode = breadcrumbNodes[breadcrumbNodes.length - 1];
            targetSource = 'breadcrumb';
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
        if (targetNode) targetSource = 'current-nav';
    }

    // 兼容兜底：若未找到主导航，再尝试旧规则
    if (!targetNode) {
        const navLinks = document.querySelectorAll(
            'header a:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"])'
        );
        for (const link of navLinks) {
            const text = link.textContent.trim().toLowerCase();
            const href = link.getAttribute('href');
            if (text === 'dashboard' || href === '/dashboard') {
                targetNode = link;
                targetSource = 'legacy-dashboard';
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
            if (link.getAttribute(QUICK_LINK_MARK_ATTR) === '1') return false;
            return true;
        });
        if (globalNavCandidates.length) {
            targetNode = globalNavCandidates.find(link => {
                const href = normalizePath(link.getAttribute('href') || '');
                return href === currentPath;
            }) || globalNavCandidates[globalNavCandidates.length - 1];
            if (targetNode) targetSource = 'global-nav';
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
            targetSource = 'current-text';
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
            targetSource = 'crumb-text';
        }
    }

    // 样式模板优先使用同容器内可点击链接，避免从纯文本节点克隆导致样式不一致
    let templateNode = targetNode;
    if (targetNode) {
        const localNav = targetNode.closest('nav, ul, ol');
        const localAnchors = localNav
            ? localNav.querySelectorAll(
                'a[href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"])'
            )
            : [];

        if (localAnchors.length) {
            templateNode = localAnchors[localAnchors.length - 1];
        } else {
            const nativeNavAnchors = document.querySelectorAll(
                'header nav[aria-label*="breadcrumb" i] a[href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header a[class*="contextCrumb"][href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header a[class*="Breadcrumbs-Item"][href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header nav[aria-label*="global" i] a[href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header nav[aria-label*="header" i] a[href^="/"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header nav a[href="/pulls"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header nav a[href="/issues"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header nav a[href="/repositories"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header nav a[href="/codespaces"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header nav a[href="/marketplace"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"]), ' +
                'header nav a[href="/explore"]:not([id^="custom-gh-btn-"]):not([' + QUICK_LINK_MARK_ATTR + '="1"])'
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
        cleanupQuickLinksForContainer(insertAnchorNode.parentNode, insertAnchorNode);

        const hasShortcutActive = navPresetLinks.some(link => isCurrentPage(link.path));
        const renderedQuickAnchors = [];

        if (isOnPresetPage && anchorTag && primaryLink) {
            // 预设页面：首个按钮替换为当前配置顺序中的第一个
            anchorTag.id = primaryLink.id;
            anchorTag.setAttribute(QUICK_LINK_MARK_ATTR, '1');
            anchorTag.href = primaryLink.href;
            setLinkText(anchorTag, primaryLink.text);
            applyLinkShortcut(anchorTag, primaryLink);
            renderedQuickAnchors.push(anchorTag);
            setActiveStyle(anchorTag, isCurrentPage(primaryLink.path), shouldUseCompactButtons);
        } else {
            // 其他页面：保留原生当前按钮，仅做高亮
            const wasQuickAnchor = Boolean(anchorTag) && (
                (anchorTag.id && anchorTag.id.startsWith('custom-gh-btn-')) ||
                anchorTag.getAttribute(QUICK_LINK_MARK_ATTR) === '1'
            );
            if (anchorTag && anchorTag.id && anchorTag.id.startsWith('custom-gh-btn-')) {
                anchorTag.removeAttribute('id');
            }
            if (anchorTag) {
                anchorTag.removeAttribute(QUICK_LINK_MARK_ATTR);
            }
            if (anchorTag && wasQuickAnchor) {
                anchorTag.removeAttribute('data-hotkey');
                anchorTag.removeAttribute('aria-keyshortcuts');
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
            const newNode = cloneTemplateNode.cloneNode(true);
            const aTag = ensureAnchor(newNode, isTemplateLiParent);

            aTag.id = linkInfo.id;
            aTag.setAttribute(QUICK_LINK_MARK_ATTR, '1');
            aTag.href = linkInfo.href;
            setLinkText(aTag, linkInfo.text);
            applyLinkShortcut(aTag, linkInfo);
            renderedQuickAnchors.push(aTag);

            setActiveStyle(aTag, isCurrentPage(linkInfo.path), shouldUseCompactButtons);

            // 将新按钮插入到锚点之后，并更新锚点
            insertAfterNode.parentNode.insertBefore(newNode, insertAfterNode.nextSibling);
            insertAfterNode = newNode;
        });

        reportHotkeyConflicts(renderedQuickAnchors);
    }
}
