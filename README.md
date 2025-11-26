# Gemini 3 Pro - AI 绘图工作台 (Web Client)

![License](https://img.shields.io/badge/license-MIT-green)![Version](https://img.shields.io/badge/version-1.0.0-blue)![Status](https://img.shields.io/badge/status-Active-success)

**Gemini 3 Pro** 是一个基于 Web 的轻量级、高性能 AI 绘图客户端。它专为 Google Gemini 多模态模型（如 `gemini-2.0-flash-exp`）设计，提供了一个无需后端、纯前端运行的专业工作台。

除了基础的对话和绘图功能外，它还内置了**本地图片切片工厂**、**表情包制作模式**以及**并发任务管理**，所有数据均存储在本地浏览器中。

> 🚀 **在线演示**: [点击这里查看 Demo](#) (建议替换为您部署在 GitHub Pages 的链接)

---

## ✨ 核心特性

### 🎨 专业的绘图体验
*   **并发生成**：支持多会话同时进行，后台处理生成任务，无需等待。
*   **多模态输入**：支持上传多张参考图（Reference Images），完美适配 Gemini 的多模态理解能力。
*   **精细控制**：
    *   支持 1K / 2K / 4K 分辨率预设。
    *   内置 10+ 种常用长宽比（21:9, 16:9, 1:1, 9:16 等）。
*   **即时预览**：生成的图片支持灯箱预览、一键下载原图。

### ✂️ 独家功能：图片切片工厂 (Slicer Tool)
不再需要 Photoshop，直接在浏览器中完成素材处理：
*   **九宫格/自定义切片**：内置横向/纵向辅助线，拖拽即可调整切割位置。
*   **智能补全**：支持 1:1 强制补全（不论原图比例，自动填充背景色）。
*   **一键打包**：自动将切割后的图片打包为 ZIP 下载。
*   **表情包制作流**：配合“制作表情包”快捷指令，生成后直接切片，工作流一气呵成。

### 🛡️ 隐私与安全
*   **纯前端运行**：没有中间服务器，API 请求直接从您的浏览器发送至 Google。
*   **本地存储**：所有对话记录、API Key 配置均通过 IndexedDB 和 LocalStorage 存储在您的设备上。
*   **API 管理**：支持自定义 API Host（便于反代用户）和多渠道轮询。

### 📱 响应式设计
*   完美适配桌面端与移动端。
*   移动端支持侧边栏手势、触摸优化。

---

## 📸 界面概览

### 🖥️ 桌面端工作台
<img width="2390" height="1684" alt="image" src="https://github.com/user-attachments/assets/76fa7155-8a49-4c65-8499-552bbeb95870" />
<img width="3840" height="1916" alt="image" src="https://github.com/user-attachments/assets/1c94e65e-d5c0-49be-8695-a92c6da76947" />

<img width="2390" height="1684" alt="image" src="https://github.com/user-attachments/assets/ce2d2da6-05e7-4f8d-b4e9-807ff74e55ad" />

### 📱 移动端与切片工具
<img width="646" height="1398" alt="image" src="https://github.com/user-attachments/assets/2ae8509a-5ffa-49ef-9160-0bf7926529d6" />
<img width="646" height="1398" alt="image" src="https://github.com/user-attachments/assets/baf8934a-3e52-483f-8d9b-84bfabbff04a" />
<img width="646" height="1398" alt="image" src="https://github.com/user-attachments/assets/83ffe7c6-9230-49f0-9093-714b70790462" />

<img width="3840" height="1916" alt="image" src="https://github.com/user-attachments/assets/c2324834-58b4-42da-8070-1f5d4e3ec133" />

---

## 🚀 快速开始

本项目是一个单文件（或纯静态）应用，无需复杂的构建工具（如 Webpack/Vite），开箱即用。

### 方法 1：直接运行
1.  克隆本项目或下载 ZIP 包。
2.  直接双击打开 `index.html` 文件。
3.  点击右上角 **设置** 图标，输入您的 Google API Key。

### 方法 2：部署到 GitHub Pages (推荐)
1.  Fork 本仓库。
2.  进入仓库 `Settings` -> `Pages`。
3.  将 `Branch` 设置为 `main`，点击保存。
4.  一分钟后，您即可通过 `https://您的用户名.github.io/仓库名` 访问。

### 方法 3：本地开发
如果您想二次开发：
```bash
# 克隆仓库
git clone https://github.com/your-username/gemini-3-pro.git

# 进入目录
cd gemini-3-pro

# 使用 VS Code Live Server 或 Python 启动简易服务器
python -m http.server 8000
```

---

## ⚙️ 配置说明

点击界面右上角的 **设置 (⚙️)** 图标进入配置面板：

| 配置项 | 说明 | 默认值 |
| :--- | :--- | :--- |
| **渠道名称** | 用于区分不同的 Key | 官方 API |
| **API Base URL** | 接口地址 | `https://generativelanguage.googleapis.com` |
| **API Key** | Google AI Studio 获取的 Key | (空) |
| **Model** | 使用的模型名称 | `gemini-2.0-flash-exp` |

> **提示**: 如果您处于无法直接访问 Google API 的网络环境，请将 `API Base URL` 修改为您的反向代理地址（例如 Cloudflare Worker 地址）。

---

## 🛠️ 技术栈

*   **Core**: HTML5, CSS3 (Variables, Flex/Grid), Vanilla JavaScript (ES6+)
*   **Storage**: IndexedDB (对话历史), LocalStorage (配置)
*   **Libraries**: 
    *   `JSZip` (CDN 引入，用于图片打包下载)
    *   无其他第三方 UI 框架依赖

---

## 🛣️以此为基础的后续计划 (Roadmap)

- [ ] **PWA 支持**：支持安装到桌面/手机主屏幕。
- [ ] **提示词优化器**：内置 prompt 润色功能。
- [ ] **参数预设库**：保存常用的绘图参数组合。
- [ ] **更多模型支持**：适配 Claude 或 OpenAI 绘图接口。

---

## 🤝 贡献指南

非常欢迎通过 Pull Requests 或 Issues 提交您的建议！

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

## ⚠️ 免责声明

本项目仅作为 API 调用客户端，不提供任何 AI 模型服务。
*   请确保您使用的 API Key 符合 Google Generative AI 的使用条款。
*   请勿利用本项目生成违反法律法规的内容。
