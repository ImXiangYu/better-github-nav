// ==UserScript==
// @name         Better GitHub Navigation
// @name:zh-CN   更好的 GitHub 导航栏
// @namespace    https://github.com/ImXiangYu/better-github-nav
// @version      0.1.4
// @description  Add Trending, Explore, Collections and Stars buttons to the GitHub top navigation bar.
// @description:zh-CN 在 GitHub 顶部导航栏无缝添加 Trending, Explore, Collections 和 Stars 快捷按钮。
// @author       Ayubass
// @match        https://github.com/*
// @icon         https://github.githubassets.com/pinned-octocat.svg
// @updateURL    https://raw.githubusercontent.com/ImXiangYu/better-github-nav/main/better-github-nav.user.js
// @downloadURL  https://raw.githubusercontent.com/ImXiangYu/better-github-nav/main/better-github-nav.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const SCRIPT_VERSION = '0.1.4';
    const CUSTOM_BUTTON_CLASS = 'custom-gh-nav-btn';
    const CUSTOM_BUTTON_ACTIVE_CLASS = 'custom-gh-nav-btn-active';

    function normalizePath(href) {
        try {
            const url = new URL(href, location.origin);
            const path = url.pathname.replace(/\/+$/, '');
            return path || '/';
        } catch (e) {
            return '';
        }
    }

    function isCurrentPage(linkPath) {
        const currentPath = location.pathname.replace(/\/+$/, '') || '/';
        if (linkPath === '/dashboard') return currentPath === '/' || currentPath === '/dashboard';
        if (currentPath === linkPath) return true;
        if (linkPath !== '/' && currentPath.startsWith(`${linkPath}/`)) return true;

        // Stars 页面常见为 /<username>?tab=stars
        return location.search.includes('tab=stars') && linkPath === normalizePath('/stars');
    }

    function ensureStyles() {
        if (document.getElementById('custom-gh-nav-style')) return;
        const style = document.createElement('style');
        style.id = 'custom-gh-nav-style';
        style.textContent = `
            a.${CUSTOM_BUTTON_CLASS} {
                border-radius: 6px;
                padding-inline: 8px;
                text-decoration: none;
            }
            a.${CUSTOM_BUTTON_CLASS}:hover {
                background-color: var(--color-neutral-muted, rgba(177, 186, 196, 0.12));
                text-decoration: none;
            }
            a.${CUSTOM_BUTTON_CLASS}.${CUSTOM_BUTTON_ACTIVE_CLASS} {
                background-color: var(--color-neutral-muted, rgba(177, 186, 196, 0.18));
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }

    function setActiveStyle(aTag, active) {
        aTag.classList.add(CUSTOM_BUTTON_CLASS);
        if (active) {
            aTag.setAttribute('aria-current', 'page');
            aTag.classList.add(CUSTOM_BUTTON_ACTIVE_CLASS);
        } else {
            aTag.removeAttribute('aria-current');
            aTag.classList.remove(CUSTOM_BUTTON_ACTIVE_CLASS);
        }
    }

    function addCustomButtons() {
        // 获取当前登录的用户名，用来动态生成 Stars 页面的专属链接
        const userLoginMeta = document.querySelector('meta[name="user-login"]');
        const username = userLoginMeta ? userLoginMeta.getAttribute('content') : '';
        const starsUrl = username ? `/${username}?tab=stars` : '/stars';

        // 固定导航顺序：Dashboard / Trending / Explore / Collections / Stars
        const dashboardLink = { id: 'custom-gh-btn-dashboard', text: 'Dashboard', href: '/dashboard', path: '/dashboard' };
        const customLinks = [
            { id: 'custom-gh-btn-trending', text: 'Trending', href: '/trending', path: '/trending' },
            { id: 'custom-gh-btn-explore', text: 'Explore', href: '/explore', path: '/explore' },
            { id: 'custom-gh-btn-collections', text: 'Collections', href: '/collections', path: '/collections' },
            { id: 'custom-gh-btn-stars', text: 'Stars', href: starsUrl, path: normalizePath(starsUrl) }
        ];

        // 先按稳定 href 寻找顶栏锚点，避免依赖会变化的文案与 aria-label
        let targetNode = document.querySelector(
            'header a[href="/dashboard"], header a[href="/trending"], header a[href="/explore"]'
        );

        // 兼容兜底：若未找到主导航，再尝试旧规则
        if (!targetNode) {
            const navLinks = document.querySelectorAll('header a');
            for (let link of navLinks) {
                const text = link.textContent.trim().toLowerCase();
                const href = link.getAttribute('href');
                if (text === 'dashboard' || href === '/dashboard') {
                    targetNode = link;
                    break;
                }
            }
        }

        if (targetNode) {
            // 判断父元素是不是 <li>，如果是的话需要连带 <li> 一起克隆以保证布局不乱
            const isLiParent = targetNode.parentNode.tagName.toLowerCase() === 'li';
            const cloneTarget = isLiParent ? targetNode.parentNode : targetNode;
            const dashboardTag = isLiParent ? cloneTarget.querySelector('a') : cloneTarget;

            // 将首个锚点统一改成 Dashboard，保证五个按钮顺序稳定
            dashboardTag.id = dashboardLink.id;
            dashboardTag.href = dashboardLink.href;
            const dashboardInnerSpan = dashboardTag.querySelector('span');
            if (dashboardInnerSpan) {
                dashboardInnerSpan.textContent = dashboardLink.text;
            } else {
                dashboardTag.textContent = dashboardLink.text;
            }
            setActiveStyle(dashboardTag, isCurrentPage(dashboardLink.path));
            
            // 设定插入的锚点，随着循环不断向后移动，保证按钮顺序正确
            let insertAfterNode = cloneTarget;

            customLinks.forEach(linkInfo => {
                const existing = document.getElementById(linkInfo.id);
                if (existing) {
                    existing.href = linkInfo.href;
                    setActiveStyle(existing, isCurrentPage(linkInfo.path));
                    return;
                }

                const newNode = cloneTarget.cloneNode(true);
                const aTag = isLiParent ? newNode.querySelector('a') : newNode;
                
                aTag.id = linkInfo.id;
                aTag.href = linkInfo.href;

                // 替换文本内容（兼容内部有 span 标签的情况）
                const innerSpan = aTag.querySelector('span');
                if (innerSpan) {
                    innerSpan.textContent = linkInfo.text;
                } else {
                    aTag.textContent = linkInfo.text;
                }

                setActiveStyle(aTag, isCurrentPage(linkInfo.path));

                // 将新按钮插入到锚点之后，并更新锚点
                insertAfterNode.parentNode.insertBefore(newNode, insertAfterNode.nextSibling);
                insertAfterNode = newNode; 
            });
        }
    }

    // 1. 页面初次加载时执行
    console.info(`[Better GitHub Navigation] loaded v${SCRIPT_VERSION}`);
    window.__betterGithubNavVersion = SCRIPT_VERSION;
    ensureStyles();
    addCustomButtons();

    // 2. 监听 GitHub 的 Turbo/PJAX 页面跳转事件，防止切换页面后按钮消失
    document.addEventListener('turbo:load', addCustomButtons);
    document.addEventListener('pjax:end', addCustomButtons);

    // 3. 终极备用方案：使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
        if (!document.getElementById('custom-gh-btn-trending') && document.querySelector('header')) {
            addCustomButtons();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
