import { THEME_ATTR, THEME_SOURCE_ATTR } from './constants.js';
import { loadConfig, sanitizeThemePreference, updateConfig } from './config.js';

let themeSyncBound = false;
let systemThemeQuery = null;

function detectGitHubTheme() {
    const root = document.documentElement;
    const colorMode = String(root.getAttribute('data-color-mode') || '').toLowerCase();
    if (colorMode === 'light' || colorMode === 'dark') {
        return colorMode;
    }

    const rootStyle = getComputedStyle(root);
    const colorScheme = String(rootStyle.colorScheme || '').toLowerCase();
    if (colorScheme.includes('dark')) return 'dark';
    if (colorScheme.includes('light')) return 'light';

    if (!systemThemeQuery && typeof window.matchMedia === 'function') {
        systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }
    return systemThemeQuery?.matches ? 'dark' : 'light';
}

export function resolveThemePreference(preference = loadConfig().themePreference) {
    const safePreference = sanitizeThemePreference(preference);
    return safePreference === 'auto' ? detectGitHubTheme() : safePreference;
}

export function syncThemePreference() {
    const preference = sanitizeThemePreference(loadConfig().themePreference);
    const appliedTheme = resolveThemePreference(preference);
    document.documentElement.setAttribute(THEME_ATTR, appliedTheme);
    document.documentElement.setAttribute(THEME_SOURCE_ATTR, preference === 'auto' ? 'auto' : 'custom');
    return appliedTheme;
}

export function setThemePreference(preference) {
    updateConfig({ themePreference: preference });
    return syncThemePreference();
}

export function bindThemePreferenceSync() {
    if (themeSyncBound) return;
    themeSyncBound = true;

    syncThemePreference();

    if (!systemThemeQuery && typeof window.matchMedia === 'function') {
        systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }
    if (systemThemeQuery?.addEventListener) {
        systemThemeQuery.addEventListener('change', syncThemePreference);
    } else if (systemThemeQuery?.addListener) {
        systemThemeQuery.addListener(syncThemePreference);
    }

    const observer = new MutationObserver(mutations => {
        const shouldSync = mutations.some(mutation => (
            mutation.type === 'attributes'
            && (
                mutation.attributeName === 'data-color-mode'
                || mutation.attributeName === 'data-dark-theme'
                || mutation.attributeName === 'data-light-theme'
            )
        ));
        if (shouldSync) {
            syncThemePreference();
        }
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-color-mode', 'data-dark-theme', 'data-light-theme']
    });
}
