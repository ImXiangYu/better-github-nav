# Better GitHub Navigation

## 中文说明
`better-github-nav` 是一个 Tampermonkey 用户脚本，用于在 GitHub 顶部导航中补齐常用入口，减少来回跳转。

### 基本作用
- 在顶部导航中加入：`Dashboard`、`Trending`、`Explore`、`Collections`、`Stars`
- 自动识别当前页面并高亮对应按钮
- 在仓库页按更直观顺序展示：`用户名 / 仓库名 / 快捷入口...`
- 兼容 GitHub 的 Turbo/PJAX 跳转，切页后按钮不会丢失

### 安装
1. 安装浏览器扩展：Tampermonkey
2. 打开并安装脚本：
   `https://raw.githubusercontent.com/ImXiangYu/better-github-nav/main/better-github-nav.user.js`

### 适用范围
- 匹配：`https://github.com/*`

## English
`better-github-nav` is a Tampermonkey userscript that adds common shortcuts to GitHub's top navigation, so you can move around faster.

### What It Does
- Adds `Dashboard`, `Trending`, `Explore`, `Collections`, and `Stars` to the top nav
- Highlights the active item based on the current page
- Keeps a natural order on repository pages: `owner / repo / shortcuts...`
- Works with GitHub Turbo/PJAX navigation so buttons persist after page transitions

### Installation
1. Install the Tampermonkey browser extension
2. Install the script from:
   `https://raw.githubusercontent.com/ImXiangYu/better-github-nav/main/better-github-nav.user.js`

### Scope
- Match pattern: `https://github.com/*`
