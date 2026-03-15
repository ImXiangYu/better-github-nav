import { I18N, UI_LANG_STORAGE_KEY } from './constants.js';

let uiLang = detectUiLang();

function detectAutoUiLang() {
    const browserLocales = [
        ...(Array.isArray(navigator.languages) ? navigator.languages : []),
        navigator.language
    ]
        .map(locale => String(locale || '').toLowerCase())
        .filter(Boolean);

    if (browserLocales.some(locale => locale.startsWith('zh'))) return 'zh';
    if (browserLocales.some(locale => locale.startsWith('en'))) return 'en';

    const pageLang = (document.documentElement.lang || '').toLowerCase();
    return pageLang.startsWith('zh') ? 'zh' : 'en';
}

export function t(key, vars = {}) {
    const dict = I18N[uiLang] || I18N.en;
    const fallback = I18N.en;
    const template = dict[key] || fallback[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, varName) => String(vars[varName] ?? ''));
}

export function detectUiLang() {
    try {
        const preferredLang = (localStorage.getItem(UI_LANG_STORAGE_KEY) || '').toLowerCase();
        if (preferredLang === 'zh' || preferredLang === 'en') return preferredLang;
    } catch (e) {
        // ignore storage read failure and fallback to auto detection
    }

    return detectAutoUiLang();
}

export function setUiLangPreference(lang) {
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
