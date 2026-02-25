import {
    CONFIG_STORAGE_KEY,
    DEFAULT_LINK_KEYS,
    PRESET_LINKS
} from './constants.js';

export function sanitizeKeys(keys) {
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

export function sanitizeConfig(rawConfig) {
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

export function loadConfig() {
    try {
        const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (!raw) return sanitizeConfig({});
        return sanitizeConfig(JSON.parse(raw));
    } catch (e) {
        return sanitizeConfig({});
    }
}

export function saveConfig(config) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitizeConfig(config)));
}

export function getConfiguredLinks(username) {
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

export function getDisplayNameByKey(key) {
    const link = PRESET_LINKS.find(item => item.key === key);
    return link ? link.text : key;
}
