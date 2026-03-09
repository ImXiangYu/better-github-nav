import { TOP_REPOSITORIES_PIN_STORAGE_KEY } from './constants.js';
import { t } from './i18n.js';

const TOP_REPOSITORIES_HEADING_TEXT = 'top repositories';
const TOP_REPOSITORIES_BUTTON_CLASS = 'custom-gh-top-repos-pin';
const TOP_REPOSITORIES_BUTTON_ACTIVE_CLASS = 'custom-gh-top-repos-pin-active';
const TOP_REPOSITORIES_BUTTON_ICON_CLASS = 'custom-gh-top-repos-pin-icon';
const TOP_REPOSITORIES_DIVIDER_CLASS = 'custom-gh-top-repos-divider';
const TOP_REPOSITORIES_ROW_CLASS = 'custom-gh-top-repos-row';
const TOP_REPOSITORIES_LINK_CLASS = 'custom-gh-top-repos-link';
const TOP_REPOSITORIES_SHOW_MORE_PREFIXES = ['show more', 'show less'];
const SVG_NS = 'http://www.w3.org/2000/svg';
const RESERVED_FIRST_SEGMENTS = new Set([
    'about',
    'account',
    'apps',
    'codespaces',
    'collections',
    'dashboard',
    'explore',
    'marketplace',
    'new',
    'notifications',
    'organizations',
    'orgs',
    'pulls',
    'repositories',
    'search',
    'sessions',
    'settings',
    'signup',
    'site',
    'sponsors',
    'stars',
    'topics',
    'trending',
    'users'
]);

function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeRepoKey(repoKey) {
    return normalizeText(repoKey).replace(/\s+/g, '');
}

function parseRepoInfoFromHref(href) {
    try {
        const url = new URL(href, location.origin);
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length !== 2) return null;

        const owner = decodeURIComponent(segments[0] || '');
        const repo = decodeURIComponent(segments[1] || '');
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

    const rowsByNode = new Map();
    const anchors = Array.from(container.querySelectorAll('a[href^="/"]'));
    anchors.forEach(anchor => {
        let rowNode = anchor;
        while (rowNode.parentElement && rowNode.parentElement !== container) {
            rowNode = rowNode.parentElement;
        }
        if (!rowNode.parentElement || rowNode.parentElement !== container) return;

        const repoInfo = parseRepoInfoFromHref(anchor.getAttribute('href') || '');
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

    return candidates.find(node => normalizeText(node.textContent) === TOP_REPOSITORIES_HEADING_TEXT) || null;
}

function findTopRepositoriesList() {
    const heading = getTopRepositoriesHeading();
    if (!heading) return null;

    const roots = [];
    const sectionRoot = heading.closest('section, aside');
    if (sectionRoot) roots.push(sectionRoot);
    if (heading.parentElement && !roots.includes(heading.parentElement)) {
        roots.push(heading.parentElement);
    }

    for (const root of roots) {
        const semanticCandidates = [
            ...(root.matches('ul, ol, nav') ? [root] : []),
            ...Array.from(root.querySelectorAll('ul, ol, nav'))
        ];
        let bestSemanticMatch = null;
        semanticCandidates.forEach(candidate => {
            const items = getDirectRepoRows(candidate);
            if (!items.length) return;

            const score = (items.length * 1000)
                + (items.length === candidate.children.length ? 100 : 0)
                + getNodeDepth(candidate);

            if (!bestSemanticMatch || score > bestSemanticMatch.score) {
                bestSemanticMatch = { container: candidate, items, score };
            }
        });
        if (bestSemanticMatch) {
            return { container: bestSemanticMatch.container, items: bestSemanticMatch.items };
        }

        const genericCandidates = [
            ...(root.matches('div') ? [root] : []),
            ...Array.from(root.querySelectorAll('div'))
        ];
        let bestMatch = null;
        genericCandidates.forEach(candidate => {
            const items = getDirectRepoRows(candidate);
            if (!items.length) return;

            const score = (items.length * 1000)
                + (items.length === candidate.children.length ? 100 : 0)
                + getNodeDepth(candidate);

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

    const seen = new Set();
    const result = [];
    rawValue.forEach(item => {
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
        // ignore storage write failures and keep the current session functional
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
    const divider = document.createElement(tagName === 'ul' || tagName === 'ol' ? 'li' : 'div');
    divider.className = TOP_REPOSITORIES_DIVIDER_CLASS;
    divider.setAttribute('aria-hidden', 'true');
    return divider;
}

function ensureRowNodeIsWrappable(item, container) {
    if (item.node.tagName.toLowerCase() !== 'a') return item;

    const wrapperTag = container.tagName.toLowerCase() === 'ul' || container.tagName.toLowerCase() === 'ol'
        ? 'li'
        : 'div';
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
    const svg = createSvgElement('svg', {
        viewBox: '0 0 16 16',
        'aria-hidden': 'true',
        class: TOP_REPOSITORIES_BUTTON_ICON_CLASS
    });

    const head = createSvgElement('circle', {
        cx: '10',
        cy: '4',
        r: '1.9',
        fill: isPinned ? 'currentColor' : 'none',
        stroke: 'currentColor',
        'stroke-width': '1.2'
    });
    const body = createSvgElement('rect', {
        x: '6.8',
        y: '5.4',
        width: '5.1',
        height: '2.5',
        rx: '0.8',
        fill: isPinned ? 'currentColor' : 'none',
        stroke: 'currentColor',
        'stroke-width': '1.2',
        transform: 'rotate(32 9.35 6.65)'
    });
    const needle = createSvgElement('path', {
        d: 'M8.5 8.9 4.3 13.1',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.2',
        'stroke-linecap': 'round'
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
    items.forEach(item => {
        ensureRowNodeIsWrappable(item, container);
        item.node.classList.add(TOP_REPOSITORIES_ROW_CLASS);
        getPrimaryContentNode(item).classList.add(TOP_REPOSITORIES_LINK_CLASS);

        item.node.querySelectorAll(`.${TOP_REPOSITORIES_BUTTON_CLASS}`).forEach(button => button.remove());

        const isPinned = pinnedSet.has(item.repoKey);
        const pinButton = document.createElement('button');
        pinButton.type = 'button';
        pinButton.className = TOP_REPOSITORIES_BUTTON_CLASS;
        pinButton.appendChild(createPinIcon(isPinned));
        pinButton.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
        pinButton.title = isPinned
            ? t('unpinTopRepository', { repo: item.repoLabel })
            : t('pinTopRepository', { repo: item.repoLabel });
        pinButton.setAttribute('aria-label', pinButton.title);
        if (isPinned) {
            pinButton.classList.add(TOP_REPOSITORIES_BUTTON_ACTIVE_CLASS);
        }
        pinButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            togglePinnedRepository(item.repoKey);
            enhanceTopRepositories();
        });

        item.node.appendChild(pinButton);
    });
}

function reorderRows(container, items, pinnedSet) {
    const pinnedItems = items.filter(item => pinnedSet.has(item.repoKey));
    const regularItems = items.filter(item => !pinnedSet.has(item.repoKey));

    container.querySelectorAll(`:scope > .${TOP_REPOSITORIES_DIVIDER_CLASS}`).forEach(node => node.remove());

    const children = Array.from(container.children);
    const repoNodes = new Set(items.map(item => item.node));
    const firstRepoIndex = children.findIndex(child => repoNodes.has(child));
    const beforeRepoChildren = firstRepoIndex < 0
        ? []
        : children.slice(0, firstRepoIndex).filter(child => !repoNodes.has(child));
    const afterRepoChildren = firstRepoIndex < 0
        ? children.filter(child => !repoNodes.has(child))
        : children.slice(firstRepoIndex).filter(child => !repoNodes.has(child));
    const orderedNodes = [
        ...pinnedItems.map(item => item.node),
        ...(pinnedItems.length && regularItems.length ? [createDividerElement(container)] : []),
        ...regularItems.map(item => item.node)
    ];

    const fragment = document.createDocumentFragment();
    beforeRepoChildren.forEach(node => fragment.appendChild(node));
    orderedNodes.forEach(node => fragment.appendChild(node));
    afterRepoChildren.forEach(node => fragment.appendChild(node));
    container.replaceChildren(fragment);
}

export function isDashboardHomePage() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    return path === '/' || path === '/dashboard';
}

export function hasTopRepositoriesHeading() {
    return Boolean(getTopRepositoriesHeading());
}

export function needsTopRepositoriesEnhancement() {
    if (!isDashboardHomePage()) return false;

    const listMatch = findTopRepositoriesList();
    if (!listMatch || !listMatch.items.length) return false;

    return listMatch.items.some(item => !item.node.querySelector(`.${TOP_REPOSITORIES_BUTTON_CLASS}`));
}

export function isTopRepositoriesToggleTarget(target) {
    if (!(target instanceof Element)) return false;

    const heading = getTopRepositoriesHeading();
    if (!heading) return false;

    const root = heading.closest('section, aside') || heading.parentElement;
    if (!root) return false;

    const trigger = target.closest('button, a, summary, [role="button"]');
    if (!trigger || !root.contains(trigger)) return false;

    const expanded = trigger.getAttribute('aria-expanded');
    if (expanded === 'true' || expanded === 'false') return true;

    const text = normalizeText(trigger.textContent);
    return TOP_REPOSITORIES_SHOW_MORE_PREFIXES.some(prefix => text.startsWith(prefix));
}

export function enhanceTopRepositories() {
    if (!isDashboardHomePage()) return;

    const listMatch = findTopRepositoriesList();
    if (!listMatch || !listMatch.items.length) return;

    const pinnedSet = new Set(loadPinnedRepositories());
    renderPinButtons(listMatch.container, listMatch.items, pinnedSet);
    reorderRows(listMatch.container, listMatch.items, pinnedSet);
}
