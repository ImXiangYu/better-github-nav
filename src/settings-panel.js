import {
    CONFIG_STORAGE_KEY,
    DEFAULT_LINK_KEYS,
    SETTINGS_MESSAGE_ID,
    SETTINGS_OVERLAY_ID,
    SETTINGS_PANEL_ID
} from './constants.js';
import { getDisplayNameByKey, loadConfig, sanitizeConfig, saveConfig } from './config.js';
import { t, setUiLangPreference } from './i18n.js';
import { ensureStyles } from './styles.js';

let settingsEscHandler = null;

export function closeConfigPanel() {
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

export function openConfigPanel() {
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

export function registerConfigMenu() {
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
