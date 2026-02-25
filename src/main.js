import { SCRIPT_VERSION } from './constants.js';
import { addCustomButtons } from './navigation.js';
import { openConfigPanel, registerConfigMenu } from './settings-panel.js';
import { ensureStyles } from './styles.js';

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
