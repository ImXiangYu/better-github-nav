// ==UserScript==
// @name         Better GitHub Navigation
// @name:zh-CN   更好的 GitHub 导航栏
// @namespace    https://github.com/ImXiangYu/better-github-nav
// @version      0.1.0
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

    function addCustomButtons() {
        // 防止重复添加，检查第一个自定义按钮是否存在
        if (document.getElementById('custom-gh-btn-trending')) return;

        // 获取当前登录的用户名，用来动态生成 Stars 页面的专属链接
        const userLoginMeta = document.querySelector('meta[name="user-login"]');
        const username = userLoginMeta ? userLoginMeta.getAttribute('content') : '';
        const starsUrl = username ? `/${username}?tab=stars` : '/stars';

        // 定义需要批量添加的按钮列表
        const customLinks = [
            { id: 'custom-gh-btn-trending', text: 'Trending', href: '/trending' },
            { id: 'custom-gh-btn-explore', text: 'Explore', href: '/explore' },
            { id: 'custom-gh-btn-collections', text: 'Collections', href: '/collections' },
            { id: 'custom-gh-btn-stars', text: 'Stars', href: starsUrl }
        ];

        // 寻找 Dashboard 作为挂载点
        const navLinks = document.querySelectorAll('header a');
        let targetNode = null;

        for (let link of navLinks) {
            const text = link.textContent.trim().toLowerCase();
            const href = link.getAttribute('href');
            if (text === 'dashboard' || href === '/dashboard') {
                targetNode = link;
                break;
            }
        }

        if (targetNode) {
            // 判断父元素是不是 <li>，如果是的话需要连带 <li> 一起克隆以保证布局不乱
            const isLiParent = targetNode.parentNode.tagName.toLowerCase() === 'li';
            const cloneTarget = isLiParent ? targetNode.parentNode : targetNode;
            
            // 设定插入的锚点，随着循环不断向后移动，保证按钮顺序正确
            let insertAfterNode = cloneTarget;

            customLinks.forEach(linkInfo => {
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

                // 将新按钮插入到锚点之后，并更新锚点
                insertAfterNode.parentNode.insertBefore(newNode, insertAfterNode.nextSibling);
                insertAfterNode = newNode; 
            });
        }
    }

    // 1. 页面初次加载时执行
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