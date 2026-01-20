# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nano Banana Pro 图片工具箱 (Image Toolbox) - A React-based image generation toolbox with AI integration, local image management, and custom API support. The UI is primarily in Chinese.

## Development Commands

```bash
npm install    # Install dependencies
npm run dev    # Start Vite dev server
npm run build  # TypeScript compilation + Vite production build
npm run preview # Preview production build
```

Note: No linting or testing scripts are configured.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (class-based dark mode)
- Zustand for state management
- React Router DOM for routing
- IndexedDB (via `idb`) for local data persistence
- JSZip for ZIP file creation
- Marked for markdown parsing

## Architecture

### Directory Structure

```
src/
├── components/
│   ├── chat/        # Chat UI components (ChatArea, ChatInput, MessageItem)
│   ├── gallery/     # Image gallery with masonry layout
│   ├── layout/      # App shell (LeftSidebar, Headers, Layout)
│   ├── modals/      # Modal dialogs (BananaModal for prompt library)
│   └── ui/          # Reusable UI components (Modal, Toast, Lightbox, Logo)
├── pages/           # Route pages
├── services/        # API communication layer
├── store/           # Zustand store (appStore.ts)
├── types/           # TypeScript type definitions
└── utils/           # Utilities including IndexedDB operations (db.ts)
```

### Key Architectural Patterns

**State Management**: Single Zustand store (`src/store/appStore.ts`) manages:
- Theme (light/dark)
- UI state (toasts, lightbox, loading, sidebars)
- Provider/API configurations (persisted to localStorage)
- Sessions and messages (persisted to IndexedDB)
- Input state for image generation

**Data Persistence**:
- Provider configs → `localStorage` (keys: `gemini_providers`, `gemini_active_provider`)
- Sessions/messages → IndexedDB via `src/utils/db.ts`

**Routing** (defined in `src/components/Layout.tsx`):
- `/` - Home/Gallery
- `/create` - Image generation
- `/article-images` - Article illustration generator
- `/xhs-images` - Xiaohongshu (Little Red Book) image generator
- `/infographic` - Infographic generator (single-page high-density infographics with 13 style presets)
- `/prompts` - Prompt management
- `/editor` - Image editor/slicer
- `/settings` - API configuration

**Provider System**: Supports multiple API providers (Gemini/OpenAI compatible) with separate capabilities for image and text generation. Providers are configured in Settings and selected per capability.

### Path Aliases

`@/*` maps to `src/*` (configured in tsconfig.json)
