# Nano Banana Pro 图片工具箱

> 基于 Nano Banana Pro 的图片工具箱，提供各种方便快捷的生图工具，以及本地化图片管理，用户可自定义 API 管理。

## ✨ 亮点介绍

| 功能 | 描述 |
|------|------|
| 📝 文章配图 | 上传文章后，一键生成高质量文章配图，提供 9 个精选模板 |
| 📕 XHS 配图 | 上传文字后，一键生成精美的小红书配图，提供 9 个精选模板 |
| 📊 信息图 | 将内容整理成单页高密度信息图，提供 13 种精选风格模板 |
| 💡 提示词管理 | 拉取网络热门提示词，支持收藏与一键应用 |

## 📋 功能列表

- **普通生成图片** - 输入提示词快速出图
- **文章配图** - 面向文章内容的一键配图生成
- **XHS 配图** - 面向小红书内容的一键配图生成
- **信息图** - 将内容整理成单页高密度信息图，支持 13 种精选风格
- **提示词管理** - 热门提示词拉取、收藏与一键应用
- **图片编辑** - 局部编辑功能（TODO），目前提供切片功能，可一键制作表情包
- **作品管理** - 本地化管理生成作品
- **API 设置** - 自定义 API 管理与切换

## 🛠️ 开发相关

### 技术栈

React 18 + TypeScript + Vite + Tailwind CSS + Zustand

### 开发步骤

```bash
npm install    # 安装依赖
npm run dev    # 启动开发
```

### 发布流程

```bash
npm run build  # 构建产物，部署 dist 目录即可
```

## 🙏 鸣谢

- [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills) - 文章配图、XHS 配图创意
- [Tansuo2021/gemini-3-pro-image-preview](https://github.com/Tansuo2021/gemini-3-pro-image-preview) - 基础项目架构
