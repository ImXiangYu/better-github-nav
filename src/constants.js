export const SCRIPT_VERSION = __SCRIPT_VERSION__;

export const CUSTOM_BUTTON_CLASS = 'custom-gh-nav-btn';
export const CUSTOM_BUTTON_ACTIVE_CLASS = 'custom-gh-nav-btn-active';
export const CUSTOM_BUTTON_COMPACT_CLASS = 'custom-gh-nav-btn-compact';
export const QUICK_LINK_MARK_ATTR = 'data-better-gh-nav-quick-link';
export const QUICK_LINK_HOST_MARK_ATTR = 'data-better-gh-nav-quick-link-host';
export const QUICK_LINK_LAST_MARK_ATTR = 'data-better-gh-nav-quick-link-last';
export const RESPONSIVE_TOGGLE_MARK_ATTR = 'data-better-gh-nav-overflow-toggle';
export const CONFIG_STORAGE_KEY = 'better-gh-nav-config-v1';
export const TOP_REPOSITORIES_PIN_STORAGE_KEY = 'better-gh-nav-top-repositories-pins-v1';
export const UI_LANG_STORAGE_KEY = 'better-gh-nav-ui-lang-v1';
export const THEME_ATTR = 'data-better-github-nav-theme';
export const THEME_SOURCE_ATTR = 'data-better-github-nav-theme-source';
export const SETTINGS_OVERLAY_ID = 'custom-gh-nav-settings-overlay';
export const SETTINGS_PANEL_ID = 'custom-gh-nav-settings-panel';
export const SETTINGS_MESSAGE_ID = 'custom-gh-nav-settings-message';
export const DEFAULT_LINK_KEYS = ['dashboard', 'explore', 'trending', 'collections', 'stars'];

export const PRESET_LINKS = [
    { key: 'dashboard', text: 'Dashboard', path: '/dashboard', getHref: () => '/dashboard' },
    { key: 'explore', text: 'Explore', path: '/explore', getHref: () => '/explore' },
    { key: 'trending', text: 'Trending', path: '/trending', getHref: () => '/trending' },
    { key: 'collections', text: 'Collections', path: '/collections', getHref: () => '/collections' },
    { key: 'stars', text: 'Stars', path: '/stars', getHref: username => (username ? `/${username}?tab=stars` : '/stars') }
];

export const PRESET_LINK_SHORTCUTS = {
    dashboard: 'g d',
    explore: 'g e',
    trending: 'g t',
    collections: 'g c',
    stars: 'g s'
};

export const I18N = {
    zh: {
        menuOpenSettings: 'Better GitHub Nav: 打开设置面板',
        menuResetSettings: 'Better GitHub Nav: 重置快捷链接配置',
        menuLangZh: 'Better GitHub Nav: 界面语言 -> 中文',
        menuLangEn: 'Better GitHub Nav: 界面语言 -> English',
        menuLangAuto: 'Better GitHub Nav: 界面语言 -> 自动（跟随浏览器）',
        menuThemeLight: 'Better GitHub Nav: 主题 -> 亮色',
        menuThemeDark: 'Better GitHub Nav: 主题 -> 暗色',
        menuThemeAuto: 'Better GitHub Nav: 主题 -> 自动（跟随 GitHub）',
        resetConfirm: '确认重置快捷链接配置为默认值吗？',
        panelTitle: 'Better GitHub Nav 设置',
        panelDesc: '勾选决定显示项，拖动整行（或右侧手柄）调整显示顺序。',
        resetDefault: '恢复默认',
        cancel: '取消',
        saveAndRefresh: '保存并刷新',
        restoredPendingSave: '已恢复默认，点击保存后生效。',
        atLeastOneLink: '至少保留 1 个快捷链接。',
        openQuickLinksMenu: '展开快捷链接',
        closeQuickLinksMenu: '收起快捷链接',
        quickLinksMenu: '快捷链接',
        dragHandleTitle: '拖动调整顺序',
        dragRowTitle: '拖动整行调整顺序',
        pinTopRepository: '置顶仓库：{repo}',
        unpinTopRepository: '取消置顶仓库：{repo}'
    },
    en: {
        menuOpenSettings: 'Better GitHub Nav: Open Settings Panel',
        menuResetSettings: 'Better GitHub Nav: Reset Quick Link Config',
        menuLangZh: 'Better GitHub Nav: UI Language -> 中文',
        menuLangEn: 'Better GitHub Nav: UI Language -> English',
        menuLangAuto: 'Better GitHub Nav: UI Language -> Auto (Follow Browser)',
        menuThemeLight: 'Better GitHub Nav: Theme -> Light',
        menuThemeDark: 'Better GitHub Nav: Theme -> Dark',
        menuThemeAuto: 'Better GitHub Nav: Theme -> Auto (Follow GitHub)',
        resetConfirm: 'Reset quick-link config to defaults?',
        panelTitle: 'Better GitHub Nav Settings',
        panelDesc: 'Select visible links and drag the row (or handle) to reorder.',
        resetDefault: 'Reset to Default',
        cancel: 'Cancel',
        saveAndRefresh: 'Save and Refresh',
        restoredPendingSave: 'Defaults restored. Click save to apply.',
        atLeastOneLink: 'Keep at least 1 quick link.',
        openQuickLinksMenu: 'Show quick links',
        closeQuickLinksMenu: 'Hide quick links',
        quickLinksMenu: 'Quick links',
        dragHandleTitle: 'Drag to reorder',
        dragRowTitle: 'Drag row to reorder',
        pinTopRepository: 'Pin repository: {repo}',
        unpinTopRepository: 'Unpin repository: {repo}'
    }
};
