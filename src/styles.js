import {
    CUSTOM_BUTTON_ACTIVE_CLASS,
    CUSTOM_BUTTON_CLASS,
    CUSTOM_BUTTON_COMPACT_CLASS,
    SETTINGS_OVERLAY_ID,
    SETTINGS_PANEL_ID
} from './constants.js';

export function ensureStyles() {
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
        .custom-gh-nav-tooltip {
            position: fixed;
            z-index: 2147483647;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            max-width: min(320px, calc(100vw - 16px));
            background: var(--color-neutral-emphasis-plus, #1f2328);
            color: var(--color-fg-on-emphasis, #ffffff);
            border-radius: 6px;
            box-shadow: 0 8px 24px rgba(16, 22, 26, 0.24), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.2;
            pointer-events: none;
            box-sizing: border-box;
        }
        .custom-gh-nav-tooltip[hidden] {
            display: none !important;
        }
        .custom-gh-nav-tooltip::before {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            background: inherit;
            transform: rotate(45deg);
            left: calc(50% - 4px);
        }
        .custom-gh-nav-tooltip[data-direction='s']::before {
            top: -4px;
        }
        .custom-gh-nav-tooltip[data-direction='n']::before {
            bottom: -4px;
        }
        .custom-gh-nav-tooltip-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .custom-gh-nav-tooltip-hint-container {
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
        }
        .custom-gh-nav-tooltip-kbd {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin: 0;
            padding: 0;
            border: 0;
            font: inherit;
            color: inherit;
            background: transparent;
        }
        .custom-gh-nav-tooltip-chord {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 16px;
            height: 16px;
            padding: 0 5px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.14);
            color: var(--color-fg-on-emphasis, #ffffff);
            font-size: 11px;
            font-weight: 700;
            line-height: 1;
            text-transform: uppercase;
            box-sizing: border-box;
            letter-spacing: 0.01em;
        }
        #${SETTINGS_OVERLAY_ID} {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            background: rgba(0, 0, 0, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            box-sizing: border-box;
        }
        #${SETTINGS_PANEL_ID} {
            width: min(560px, 100%);
            max-height: min(80vh, 720px);
            overflow: auto;
            background: var(--color-canvas-default, #fff);
            color: var(--color-fg-default, #1f2328);
            border: 1px solid var(--color-border-default, #d1d9e0);
            border-radius: 10px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
            padding: 16px;
            box-sizing: border-box;
        }
        .custom-gh-nav-settings-title {
            margin: 0 0 8px;
            font-size: 16px;
            line-height: 1.4;
        }
        .custom-gh-nav-settings-desc {
            margin: 0 0 12px;
            color: var(--color-fg-muted, #656d76);
            font-size: 13px;
        }
        .custom-gh-nav-settings-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .custom-gh-nav-settings-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border: 1px solid var(--color-border-muted, #d8dee4);
            border-radius: 8px;
            padding: 8px 10px;
            background: var(--color-canvas-subtle, #f6f8fa);
            cursor: grab;
        }
        .custom-gh-nav-settings-row:active {
            cursor: grabbing;
        }
        .custom-gh-nav-settings-row-left {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            user-select: none;
            font-size: 13px;
        }
        .custom-gh-nav-settings-row-left input {
            cursor: pointer;
        }
        .custom-gh-nav-settings-row-actions {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .custom-gh-nav-settings-drag-handle {
            border: 1px solid var(--color-border-default, #d1d9e0);
            background: var(--color-btn-bg, #f6f8fa);
            color: var(--color-fg-muted, #656d76);
            border-radius: 6px;
            width: 32px;
            height: 26px;
            line-height: 1;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            pointer-events: none;
        }
        .custom-gh-nav-settings-row-dragging {
            opacity: 0.55;
        }
        .custom-gh-nav-settings-row-drag-over {
            border-color: var(--color-accent-fg, #0969da);
            background: var(--color-accent-subtle, #ddf4ff);
        }
        .custom-gh-nav-settings-btn {
            border: 1px solid var(--color-border-default, #d1d9e0);
            background: var(--color-btn-bg, #f6f8fa);
            color: var(--color-fg-default, #1f2328);
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
        }
        .custom-gh-nav-settings-btn:hover {
            background: var(--color-btn-hover-bg, #f3f4f6);
        }
        .custom-gh-nav-settings-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }
        .custom-gh-nav-settings-btn-primary {
            background: var(--color-btn-primary-bg, #1f883d);
            border-color: var(--color-btn-primary-bg, #1f883d);
            color: var(--color-btn-primary-text, #fff);
        }
        .custom-gh-nav-settings-btn-primary:hover {
            background: var(--color-btn-primary-hover-bg, #1a7f37);
        }
        .custom-gh-nav-settings-footer {
            margin-top: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
        .custom-gh-nav-settings-message {
            min-height: 20px;
            margin-top: 8px;
            color: var(--color-attention-fg, #9a6700);
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);
}

export function setActiveStyle(aTag, active, compact = false) {
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
