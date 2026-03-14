import {
    QUICK_LINK_MARK_ATTR,
    RESPONSIVE_TOGGLE_MARK_ATTR,
    SCRIPT_VERSION
} from './constants.js';
import { addCustomButtons } from './navigation.js';
import { openConfigPanel, registerConfigMenu } from './settings-panel.js';
import { ensureStyles } from './styles.js';
import {
    enhanceTopRepositories,
    hasTopRepositoriesHeading,
    isDashboardHomePage,
    isTopRepositoriesToggleTarget,
    needsTopRepositoriesEnhancement
} from './top-repositories.js';
import { bindThemePreferenceSync, syncThemePreference } from './theme.js';

let renderQueued = false;

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

// 1. 页面初次加载时执行
console.info(`[Better GitHub Navigation] loaded v${SCRIPT_VERSION}`);
window.__betterGithubNavVersion = SCRIPT_VERSION;
window.__openBetterGithubNavSettings = openConfigPanel;
bindThemePreferenceSync();
registerConfigMenu();
scheduleEnhancements();

// 2. 监听 GitHub 的 Turbo/PJAX 页面跳转事件，防止切换页面后按钮消失
document.addEventListener('turbo:load', scheduleEnhancements);
document.addEventListener('pjax:end', scheduleEnhancements);
document.addEventListener('click', event => {
    if (!isTopRepositoriesToggleTarget(event.target)) return;
    setTimeout(scheduleEnhancements, 0);
});

// 3. 终极备用方案：使用 MutationObserver 监听 DOM 变化
const observer = new MutationObserver(() => {
    const hasHeader = Boolean(document.querySelector('header'));
    const hasCustomNavUi = Boolean(document.querySelector(
        '[id^="custom-gh-btn-"], [' + QUICK_LINK_MARK_ATTR + '="1"], [' + RESPONSIVE_TOGGLE_MARK_ATTR + '="1"]:not([hidden])'
    ));
    const missingNavButtons = hasHeader && !hasCustomNavUi;
    const missingTopRepoPins = isDashboardHomePage() && hasTopRepositoriesHeading()
        && needsTopRepositoriesEnhancement();
    if (missingNavButtons || missingTopRepoPins) scheduleEnhancements();
});
observer.observe(document.body, { childList: true, subtree: true });
