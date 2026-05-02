# Changelog

All notable changes to the **Office Editor (Docx, Xlsx)** extension will be documented in this file.

## [1.0.0] - 2026-05-02

### 🎉 Initial Release

#### Word (.docx) Editor
- Rich text editing powered by Quill.js
- Full formatting toolbar: Bold, Italic, Underline
- Text styles: Title, Heading, Sub Heading, Normal
- Font family support: Sans-Serif, Serif, Monospace
- Font size control: 12px, 14px, 16px, 20px
- Text color and highlight color pickers
- Page background color customization
- Bullet and numbered list support
- Text alignment: Left, Center, Right, Justify
- Insert hyperlinks with URL prompt
- Insert and resize images (base64 embedding)
- Find & Replace with persistent search bar
- Full Undo/Redo support via Quill History module

#### Excel (.xlsx) Editor
- High-performance grid editing powered by Tabulator.js
- Multi-sheet support with tab navigation
- Cell editing with automatic save
- Search functionality across spreadsheet data
- JSON data view toggle for developers
- Handles 10,000+ rows with virtualization

#### General
- Native VS Code theme integration (light/dark/high-contrast)
- Strict Content Security Policy (CSP) compliance
- 100% local processing — no external server calls
- DOMPurify sanitization for security
- Reliable handshake protocol for WebView initialization
- Native Ctrl+S save support
