# 🧠 Project Context & Development History

This file is a "Brain Dump" for the AI assistant to understand the history and current state of the Office Editor extension.

## 🛠️ Current Architecture
- **Language**: TypeScript + Webpack.
- **DOCX Engine**: Quill.js (Custom Toolbar).
- **XLSX Engine**: Tabulator.js + SheetJS.
- **Conversion Services**: Mammoth (Read DOCX), html-to-docx (Write DOCX).

## 🏆 Critical Fixes & Decisions (The "Don't Break" List)
1.  **Handshake Protocol**: Fixed "Black Screen" issues by using a `ready`/`init` message loop between the Provider and the WebView.
2.  **History Module**: Quill's `history` module must be accessed via `quill.getModule('history')`. `history.clear()` is called 200ms after init to prevent the initial load from being undone.
3.  **Layout Stability**: Toolbar is `position: fixed` to prevent disappearing during scroll. Editor container has `top: 41px` offset and internal padding for spacing.
4.  **CSS Attributors**: Registered `Size`, `Font`, `Align`, `Color`, and `Background` style attributors in Quill to ensure all formatting is CSS-based (compatible with DOCX conversion).
5.  **Page Background**: Custom feature added to change the entire editor's `backgroundColor`.
6.  **Find & Replace**: Custom logic using Quill's `deleteText`/`insertText` to avoid breaking HTML tags during replacement.

## 📜 Active Rules
Refer to `OFFICE_EDITOR_RULES.md` for the mandatory toolbar checklist.

## 🎯 Next Steps (Status: Marketplace Ready)
- The extension is ready for VSIX packaging.
- Metadata in `package.json` is updated for publisher `shubham-prajapati`.
- `README.md` is complete with feature highlights.

---
**Note to AI**: Read this file and `OFFICE_EDITOR_RULES.md` to immediately understand the project state.
