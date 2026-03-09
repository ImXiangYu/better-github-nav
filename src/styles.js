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
        .custom-gh-nav-overflow-host {
            position: relative;
            display: inline-flex;
            align-items: center;
            list-style: none;
        }
        .custom-gh-nav-overflow-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            min-width: 28px;
            min-height: 28px;
            padding: 0;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: var(--color-fg-default, #1f2328);
            font: inherit;
            font-weight: 600;
            line-height: 1;
            cursor: pointer;
        }
        .custom-gh-nav-overflow-toggle:hover,
        .custom-gh-nav-overflow-toggle[aria-expanded="true"] {
            background-color: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
        }
        .custom-gh-nav-overflow-toggle:focus-visible {
            outline: 2px solid var(--color-accent-fg, #0969da);
            outline-offset: 1px;
        }
        .custom-gh-nav-overflow-toggle-icon {
            flex: 0 0 auto;
            transition: transform 120ms ease;
        }
        .custom-gh-nav-overflow-toggle[aria-expanded="true"] .custom-gh-nav-overflow-toggle-icon {
            transform: rotate(180deg);
        }
        .custom-gh-nav-overflow-menu {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 2147483646;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 220px;
            max-width: min(280px, calc(100vw - 16px));
            padding: 6px;
            border: 1px solid var(--color-border-default, #d1d9e0);
            border-radius: 12px;
            background: var(--color-canvas-default, #fff);
            box-shadow: var(--color-shadow-large, 0 16px 32px rgba(0, 0, 0, 0.16));
            box-sizing: border-box;
        }
        .custom-gh-nav-overflow-menu[hidden] {
            display: none !important;
        }
        .custom-gh-nav-overflow-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 32px;
            padding: 6px 10px;
            border-radius: 8px;
            color: var(--color-fg-default, #1f2328);
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
        }
        .custom-gh-nav-overflow-link:hover {
            background: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
            text-decoration: none;
        }
        .custom-gh-nav-overflow-link[aria-current="page"] {
            color: var(--color-accent-fg, #0969da);
            background: var(--color-accent-subtle, rgba(9, 105, 218, 0.08));
        }
        .custom-gh-nav-overflow-link-text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .custom-gh-nav-overflow-link-kbd {
            flex: 0 0 auto;
            margin: 0;
            padding: 2px 6px;
            border: none !important;
            border-radius: 999px;
            background: var(--color-neutral-muted, rgba(177, 186, 196, 0.18)) !important;
            color: var(--color-fg-muted, #656d76);
            box-shadow: none !important;
            font: inherit;
            font-size: 11px;
            line-height: 1.2;
            text-transform: uppercase;
        }
        .custom-gh-nav-tooltip {
            position: fixed;
            z-index: 2147483647;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            max-width: min(320px, calc(100vw - 16px));
            background: var(--color-neutral-emphasis-plus, #1f2328);
            color: var(--color-fg-on-emphasis, #ffffff);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 400;
            line-height: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
            pointer-events: none;
            box-sizing: border-box;
            box-shadow: var(--color-shadow-medium, 0 8px 24px rgba(0,0,0,0.2));
            border: 1px solid var(--color-border-default, transparent);
            text-decoration: none;
        }
        .custom-gh-nav-tooltip[hidden] {
            display: none !important;
        }
        .custom-gh-nav-tooltip-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-decoration: none;
        }
        .custom-gh-nav-tooltip-hint-container {
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
            margin-left: 4px;
            text-decoration: none;
        }
        .custom-gh-nav-tooltip-kbd {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
            font: inherit;
            color: inherit;
            background: transparent !important;
            text-decoration: none !important;
        }
        .custom-gh-nav-tooltip-chord {
            display: inline-block;
            vertical-align: middle;
            padding: 0 4px;
            border-radius: 4px;
            background: rgba(110, 118, 129, 0.4);
            color: #ffffff;
            font-size: 11px;
            font-weight: 400;
            line-height: 18px;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
            text-transform: uppercase;
            box-sizing: border-box;
            border: none !important;
            box-shadow: none !important;
            text-decoration: none !important;
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
        .custom-gh-top-repos-row {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
        }
        .custom-gh-top-repos-link {
            flex: 1 1 auto;
            min-width: 0;
        }
        .custom-gh-top-repos-pin {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 20px;
            height: 20px;
            border: none;
            border-radius: 6px;
            padding: 0;
            background: transparent;
            color: var(--color-fg-muted, #656d76);
            cursor: pointer;
            opacity: 0.75;
        }
        .custom-gh-top-repos-pin-icon {
            width: 12px;
            height: 12px;
            overflow: visible;
        }
        .custom-gh-top-repos-pin:hover {
            background: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
            color: var(--color-fg-default, #1f2328);
            opacity: 1;
        }
        .custom-gh-top-repos-pin:focus-visible {
            outline: 2px solid var(--color-accent-fg, #0969da);
            outline-offset: 1px;
        }
        .custom-gh-top-repos-pin.${CUSTOM_BUTTON_ACTIVE_CLASS},
        .custom-gh-top-repos-pin-active {
            color: var(--color-accent-fg, #0969da);
            background: var(--color-accent-subtle, rgba(9, 105, 218, 0.08));
            opacity: 1;
        }
        .custom-gh-top-repos-divider {
            list-style: none;
            height: 1px;
            margin: 6px 0;
            background: var(--color-border-muted, rgba(208, 215, 222, 0.8));
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
