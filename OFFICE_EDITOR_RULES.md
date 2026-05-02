# 📜 Office Editor Project Rules & Checklist

These rules MUST be followed during every update. Do NOT remove any feature unless explicitly requested by the USER.

## 1. Mandatory Toolbar Features (The "Core 15")
Never remove these buttons or their functionality:
1.  **Undo / Redo**: Must use Quill History module.
2.  **Text Styles**: Title (32px), Heading (H1), Sub Heading (H2), Normal (14px).
3.  **Font Family**: Arial, Sans-Serif, Serif, Monospace.
4.  **Font Size**: 12px, 14px, 16px, 20px, 24px, 32px.
5.  **Bold / Italic / Underline**: The "Big Three" formatting tools.
6.  **Text Color**: 🎨 picker using hex values.
7.  **Highlight Color**: 🖍️ picker using hex values.
8.  **Page Background**: 📄 picker changing `quill.root.style.backgroundColor`.
9.  **Lists**: Bullet points and Numbered lists.
10. **Alignment**: Left, Center, Right, and Justify.
11. **Insert Link**: 🔗 tool with URL prompt.
12. **Insert Image**: 🖼️ tool with file picker and base64 embedding.
13. **Find & Replace**: 🔍 tool with persistent search bar.
14. **Handshake Logic**: Reliable `ready`/`init` message loop.
15. **Theme Bridge**: Syncing with VS Code `--vscode-*` CSS variables.

## 2. Interface Requirements
*   **Locked Toolbar**: Always `position: fixed` at the top.
*   **No Overlap**: Editor container must have `top: 38px` (or 40px) offset.
*   **Breathing Room**: `.ql-editor` must have at least `50px` top padding and `80px` side padding.
*   **Icons**: Use high-fidelity SVGs or professional emojis as agreed.

## 3. Code Standards
*   **History Integrity**: All formatting must use `quill.format(..., 'user')` to ensure Undo/Redo works.
*   **CSP Compliance**: Use nonces and `webview.cspSource`.
*   **No Deletions**: Adding a feature does NOT mean removing an old one.
*   **XLSX Consistency**: The Excel editor should follow the same layout stability rules.

---
**Note to Assistant**: Check this file BEFORE every `write_to_file` call.
