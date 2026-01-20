# 年会抽奖静态站点

本仓库提供一个纯静态（可 GitHub Pages）抽奖网站，包含四种舞台风格：

- **舞台 A：3D 旋转环 / 旋转木马**（`/stages/ring.html`）
- **舞台 B：老虎机卷轴**（`/stages/slots.html`）
- **舞台 C：翻牌墙**（`/stages/flip.html`）
- **舞台 D：星云轨道（自定义风格）**（`/stages/nebula.html`）

## 功能特性

- 纯前端、无需后端
- 支持 `.xlsx` / `.csv` 导入（自动识别姓名/工号列）
- 支持奖项配置、可重复/不可重复、撤销、导出结果
- 随机数源为 `crypto.getRandomValues`（不使用 `Math.random`）
- 数据默认存储在浏览器本地 LocalStorage
- 纯前端实现 `.xlsx` 解析逻辑，无外部网络请求，可离线运行

## 本地使用

1. 启动静态服务器（任选其一）：

```bash
python3 -m http.server 8080
# 或
npx serve .
```

2. 浏览器打开 `http://localhost:8080/index.html`。

> 如果直接打开 `file://`，部分浏览器会限制模块加载，推荐使用本地静态服务器。
> `.xlsx` 解析使用浏览器原生 `DecompressionStream`，建议使用最新版 Chrome/Edge/Firefox。

## GitHub Pages 发布

1. 进入 **Settings → Pages**。
2. Source 选择 **Deploy from a branch**。
3. Branch 选择 `main`（或当前分支）与 `/ (root)`。
4. 保存后即可访问：`https://<your-org-or-user>.github.io/<repo>/`。

## 目录结构

```
.
├─ index.html
├─ stages/
│  ├─ ring.html
│  ├─ slots.html
│  ├─ flip.html
│  └─ nebula.html
├─ assets/
│  ├─ css/
│  │  ├─ base.css
│  │  └─ stages.css
│  └─ js/
│     ├─ app.js
│     ├─ modules/
│     │  ├─ crypto.js
│     │  ├─ lottery.js
│     │  ├─ parser.js
│     │  └─ storage.js
│     └─ stages/
│        ├─ ring.js
│        ├─ slots.js
│        ├─ flip.js
│        └─ nebula.js
└─ vendor/（预留目录，可放置额外离线依赖）
```

## 第三方库

本项目未使用 CDN 与外部依赖，保持离线可用。如需引入额外库请放入 `vendor/`。
