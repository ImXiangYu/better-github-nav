import {
    CUSTOM_BUTTON_ACTIVE_CLASS,
    CUSTOM_BUTTON_CLASS,
    CUSTOM_BUTTON_COMPACT_CLASS,
    QUICK_LINK_HOST_MARK_ATTR,
    QUICK_LINK_MARK_ATTR,
    THEME_ATTR,
    THEME_SOURCE_ATTR,
    SETTINGS_OVERLAY_ID,
    SETTINGS_PANEL_ID
} from './constants.js';

export function ensureStyles() {
    if (document.getElementById('custom-gh-nav-style')) return;
    const style = document.createElement('style');
    style.id = 'custom-gh-nav-style';
    style.textContent = `
        :root {
            --bgn-color-scheme: light;
            --bgn-fg-default: #1f2328;
            --bgn-fg-muted: #656d76;
            --bgn-fg-on-emphasis: #ffffff;
            --bgn-border-default: #d1d9e0;
            --bgn-border-muted: #d8dee4;
            --bgn-surface-default: #ffffff;
            --bgn-surface-subtle: #f6f8fa;
            --bgn-surface-hover: rgba(177, 186, 196, 0.12);
            --bgn-surface-active: rgba(177, 186, 196, 0.18);
            --bgn-accent-fg: #0969da;
            --bgn-accent-subtle: rgba(9, 105, 218, 0.08);
            --bgn-btn-bg: #f6f8fa;
            --bgn-btn-hover-bg: #f3f4f6;
            --bgn-btn-primary-bg: #1f883d;
            --bgn-btn-primary-hover-bg: #1a7f37;
            --bgn-btn-primary-text: #ffffff;
            --bgn-attention-fg: #9a6700;
            --bgn-tooltip-bg: #1f2328;
            --bgn-tooltip-kbd-bg: rgba(110, 118, 129, 0.4);
            --bgn-overlay-backdrop: rgba(0, 0, 0, 0.45);
            --bgn-shadow-medium: 0 8px 24px rgba(0, 0, 0, 0.2);
            --bgn-shadow-large: 0 16px 32px rgba(0, 0, 0, 0.16);
            --bgn-shadow-panel: 0 16px 40px rgba(0, 0, 0, 0.25);
        }
        :root[${THEME_SOURCE_ATTR}="auto"][${THEME_ATTR}="light"] {
            --bgn-color-scheme: light;
            --bgn-fg-default: var(--color-fg-default, #1f2328);
            --bgn-fg-muted: var(--color-fg-muted, #656d76);
            --bgn-fg-on-emphasis: var(--color-fg-on-emphasis, #ffffff);
            --bgn-border-default: var(--color-border-default, #d1d9e0);
            --bgn-border-muted: var(--color-border-muted, #d8dee4);
            --bgn-surface-default: var(--color-canvas-default, #ffffff);
            --bgn-surface-subtle: var(--color-canvas-subtle, #f6f8fa);
            --bgn-surface-hover: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
            --bgn-surface-active: var(--color-neutral-muted, rgba(177, 186, 196, 0.18));
            --bgn-accent-fg: var(--color-accent-fg, #0969da);
            --bgn-accent-subtle: var(--color-accent-subtle, rgba(9, 105, 218, 0.08));
            --bgn-btn-bg: var(--color-btn-bg, #f6f8fa);
            --bgn-btn-hover-bg: var(--color-btn-hover-bg, #f3f4f6);
            --bgn-btn-primary-bg: var(--color-btn-primary-bg, #1f883d);
            --bgn-btn-primary-hover-bg: var(--color-btn-primary-hover-bg, #1a7f37);
            --bgn-btn-primary-text: var(--color-btn-primary-text, #ffffff);
            --bgn-attention-fg: var(--color-attention-fg, #9a6700);
            --bgn-tooltip-bg: var(--color-neutral-emphasis-plus, #1f2328);
            --bgn-tooltip-kbd-bg: rgba(110, 118, 129, 0.4);
            --bgn-overlay-backdrop: rgba(0, 0, 0, 0.45);
            --bgn-shadow-medium: var(--color-shadow-medium, 0 8px 24px rgba(0, 0, 0, 0.2));
            --bgn-shadow-large: var(--color-shadow-large, 0 16px 32px rgba(0, 0, 0, 0.16));
            --bgn-shadow-panel: 0 16px 40px rgba(0, 0, 0, 0.25);
        }
        :root[${THEME_SOURCE_ATTR}="auto"][${THEME_ATTR}="dark"] {
            --bgn-color-scheme: dark;
            --bgn-fg-default: var(--color-fg-default, #e6edf3);
            --bgn-fg-muted: var(--color-fg-muted, #8b949e);
            --bgn-fg-on-emphasis: var(--color-fg-on-emphasis, #ffffff);
            --bgn-border-default: var(--color-border-default, #30363d);
            --bgn-border-muted: var(--color-border-muted, #30363d);
            --bgn-surface-default: var(--color-canvas-default, #0d1117);
            --bgn-surface-subtle: var(--color-canvas-subtle, #161b22);
            --bgn-surface-hover: var(--color-neutral-muted, rgba(110, 118, 129, 0.22));
            --bgn-surface-active: var(--color-neutral-muted, rgba(110, 118, 129, 0.32));
            --bgn-accent-fg: var(--color-accent-fg, #58a6ff);
            --bgn-accent-subtle: var(--color-accent-subtle, rgba(56, 139, 253, 0.18));
            --bgn-btn-bg: var(--color-btn-bg, #212830);
            --bgn-btn-hover-bg: var(--color-btn-hover-bg, #30363d);
            --bgn-btn-primary-bg: var(--color-btn-primary-bg, #238636);
            --bgn-btn-primary-hover-bg: var(--color-btn-primary-hover-bg, #2ea043);
            --bgn-btn-primary-text: var(--color-btn-primary-text, #ffffff);
            --bgn-attention-fg: var(--color-attention-fg, #d29922);
            --bgn-tooltip-bg: var(--color-neutral-emphasis-plus, #21262d);
            --bgn-tooltip-kbd-bg: rgba(139, 148, 158, 0.35);
            --bgn-overlay-backdrop: rgba(1, 4, 9, 0.72);
            --bgn-shadow-medium: var(--color-shadow-medium, 0 8px 24px rgba(1, 4, 9, 0.45));
            --bgn-shadow-large: var(--color-shadow-large, 0 16px 32px rgba(1, 4, 9, 0.5));
            --bgn-shadow-panel: 0 18px 42px rgba(1, 4, 9, 0.6);
        }
        :root[${THEME_SOURCE_ATTR}="custom"][${THEME_ATTR}="light"] {
            --bgn-color-scheme: light;
            --bgn-fg-default: #1f2328;
            --bgn-fg-muted: #656d76;
            --bgn-fg-on-emphasis: #ffffff;
            --bgn-border-default: #d1d9e0;
            --bgn-border-muted: #d8dee4;
            --bgn-surface-default: #ffffff;
            --bgn-surface-subtle: #f6f8fa;
            --bgn-surface-hover: rgba(177, 186, 196, 0.12);
            --bgn-surface-active: rgba(177, 186, 196, 0.18);
            --bgn-accent-fg: #0969da;
            --bgn-accent-subtle: rgba(9, 105, 218, 0.08);
            --bgn-btn-bg: #f6f8fa;
            --bgn-btn-hover-bg: #f3f4f6;
            --bgn-btn-primary-bg: #1f883d;
            --bgn-btn-primary-hover-bg: #1a7f37;
            --bgn-btn-primary-text: #ffffff;
            --bgn-attention-fg: #9a6700;
            --bgn-tooltip-bg: #1f2328;
            --bgn-tooltip-kbd-bg: rgba(110, 118, 129, 0.4);
            --bgn-overlay-backdrop: rgba(0, 0, 0, 0.45);
            --bgn-shadow-medium: 0 8px 24px rgba(0, 0, 0, 0.2);
            --bgn-shadow-large: 0 16px 32px rgba(0, 0, 0, 0.16);
            --bgn-shadow-panel: 0 16px 40px rgba(0, 0, 0, 0.25);
        }
        :root[${THEME_SOURCE_ATTR}="custom"][${THEME_ATTR}="dark"] {
            --bgn-color-scheme: dark;
            --bgn-fg-default: #e6edf3;
            --bgn-fg-muted: #8b949e;
            --bgn-fg-on-emphasis: #ffffff;
            --bgn-border-default: #30363d;
            --bgn-border-muted: #30363d;
            --bgn-surface-default: #0d1117;
            --bgn-surface-subtle: #161b22;
            --bgn-surface-hover: rgba(110, 118, 129, 0.22);
            --bgn-surface-active: rgba(110, 118, 129, 0.32);
            --bgn-accent-fg: #58a6ff;
            --bgn-accent-subtle: rgba(56, 139, 253, 0.18);
            --bgn-btn-bg: #212830;
            --bgn-btn-hover-bg: #30363d;
            --bgn-btn-primary-bg: #238636;
            --bgn-btn-primary-hover-bg: #2ea043;
            --bgn-btn-primary-text: #ffffff;
            --bgn-attention-fg: #d29922;
            --bgn-tooltip-bg: #21262d;
            --bgn-tooltip-kbd-bg: rgba(139, 148, 158, 0.35);
            --bgn-overlay-backdrop: rgba(1, 4, 9, 0.72);
            --bgn-shadow-medium: 0 8px 24px rgba(1, 4, 9, 0.45);
            --bgn-shadow-large: 0 16px 32px rgba(1, 4, 9, 0.5);
            --bgn-shadow-panel: 0 18px 42px rgba(1, 4, 9, 0.6);
        }
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
        header [${QUICK_LINK_HOST_MARK_ATTR}="1"]::before,
        header [${QUICK_LINK_HOST_MARK_ATTR}="1"]::after,
        header [${QUICK_LINK_HOST_MARK_ATTR}="1"] > a::before,
        header [${QUICK_LINK_HOST_MARK_ATTR}="1"] > a::after,
        header a[${QUICK_LINK_MARK_ATTR}="1"]::before,
        header a[${QUICK_LINK_MARK_ATTR}="1"]::after {
            content: none !important;
            display: none !important;
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
            border: 1px solid var(--bgn-border-default);
            border-radius: 6px;
            background: var(--bgn-surface-subtle);
            color: var(--bgn-fg-default);
            color-scheme: var(--bgn-color-scheme);
            font: inherit;
            font-weight: 600;
            line-height: 1;
            cursor: pointer;
        }
        .custom-gh-nav-overflow-toggle:hover,
        .custom-gh-nav-overflow-toggle[aria-expanded="true"] {
            background-color: var(--bgn-surface-hover);
        }
        .custom-gh-nav-overflow-toggle:focus-visible {
            outline: 2px solid var(--bgn-accent-fg);
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
            border: 1px solid var(--bgn-border-default);
            border-radius: 12px;
            background: var(--bgn-surface-default);
            color: var(--bgn-fg-default);
            color-scheme: var(--bgn-color-scheme);
            box-shadow: var(--bgn-shadow-large);
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
            color: var(--bgn-fg-default);
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
        }
        .custom-gh-nav-overflow-link:hover {
            background: var(--bgn-surface-hover);
            text-decoration: none;
        }
        .custom-gh-nav-overflow-link[aria-current="page"] {
            color: var(--bgn-accent-fg);
            background: var(--bgn-accent-subtle);
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
            background: var(--bgn-surface-active) !important;
            color: var(--bgn-fg-muted);
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
            background: var(--bgn-tooltip-bg);
            color: var(--bgn-fg-on-emphasis);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 400;
            line-height: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
            pointer-events: none;
            box-sizing: border-box;
            box-shadow: var(--bgn-shadow-medium);
            border: 1px solid var(--bgn-border-default);
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
            background: var(--bgn-tooltip-kbd-bg);
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
            background: var(--bgn-overlay-backdrop);
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
            background: var(--bgn-surface-default);
            color: var(--bgn-fg-default);
            border: 1px solid var(--bgn-border-default);
            border-radius: 10px;
            color-scheme: var(--bgn-color-scheme);
            box-shadow: var(--bgn-shadow-panel);
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
            color: var(--bgn-fg-muted);
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
            border: 1px solid var(--bgn-border-muted);
            border-radius: 8px;
            padding: 8px 10px;
            background: var(--bgn-surface-subtle);
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
            border: 1px solid var(--bgn-border-default);
            background: var(--bgn-btn-bg);
            color: var(--bgn-fg-muted);
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
            border-color: var(--bgn-accent-fg);
            background: var(--bgn-accent-subtle);
        }
        .custom-gh-nav-settings-btn {
            border: 1px solid var(--bgn-border-default);
            background: var(--bgn-btn-bg);
            color: var(--bgn-fg-default);
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
        }
        .custom-gh-nav-settings-btn:hover {
            background: var(--bgn-btn-hover-bg);
        }
        .custom-gh-nav-settings-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }
        .custom-gh-nav-settings-btn-primary {
            background: var(--bgn-btn-primary-bg);
            border-color: var(--bgn-btn-primary-bg);
            color: var(--bgn-btn-primary-text);
        }
        .custom-gh-nav-settings-btn-primary:hover {
            background: var(--bgn-btn-primary-hover-bg);
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
            color: var(--bgn-attention-fg);
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
