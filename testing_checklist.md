# 🚀 Final QA Checklist: Lightweight Office File Editor

Use this checklist to verify the stability and performance of the extension before release.

## 1. 📂 File Loading & Resilience
- [ ] **Small Files**: Open small .docx and .xlsx files. Verify instant load.
- [ ] **Large Files**:
    - [ ] .docx > 5MB: Check for "Fidelity Warning" and scroll performance.
    - [ ] .xlsx > 10,000 rows: Verify virtualization keeps the UI responsive.
- [ ] **Corrupted Files**: Try opening a renamed .zip file or a zero-byte file.
    - [ ] *Expectation*: Graceful error message with "Open in default editor" fallback.
- [ ] **Rapid Switching**: Rapidly open and close multiple files. Ensure no "Ghost" webviews remain.

## 2. ✍️ Editing & Stability
- [ ] **Typing Lag**: Verify no lag during rapid typing in DOCX (Debounce check).
- [ ] **Grid Interaction**: Edit multiple cells in XLSX rapidly. Ensure `update` messages don't freeze the UI.
- [ ] **Undo/Redo**:
    - [ ] DOCX: Type, delete, and Ctrl+Z. Redo with Ctrl+Y.
    - [ ] XLSX: Change cell value, Ctrl+Z. Verify the value reverts.
- [ ] **Special Characters**: Type emojis or math symbols (∑, π). Verify they save correctly.

## 3. 💾 Saving & Native Integration
- [ ] **Native Save (Ctrl+S)**: Edit a file and press Ctrl+S. Verify "File saved successfully" notification.
- [ ] **Dirty State**: Change a file. Verify the "dot" appears on the tab (if implemented) or the file saves on close.
- [ ] **Re-opening Consistency**: Save a file, close the tab, and reopen. Verify all changes are preserved.
- [ ] **OneDrive/Sync**: Edit a file in a synced folder (e.g., OneDrive). Verify no "File locked" crashes.

## 4. 🔍 Find & Replace
- [ ] **Search (Ctrl+F)**:
    - [ ] DOCX: Search for a common word. Cycle through matches with arrows.
    - [ ] XLSX: Search for a value. Verify all matching cells highlight.
- [ ] **Replace**:
    - [ ] DOCX: Search, select a word, and Replace.
    - [ ] XLSX: Select a cell, type in Replace, and click Replace.

## 5. 🛠️ Developer View (XLSX)
- [ ] **JSON Toggle**: Switch to JSON view. Verify it renders valid JSON.
- [ ] **View Preservation**: Switch to JSON view and back to Grid. Ensure no data is lost.

---

## 🛑 Known Limitations (Acceptable for v1)
- [ ] Complex DOCX formatting (headers/footers/macros) will be lost on save.
- [ ] XLSX formulas and cell styles (colors/borders) are not preserved.
- [ ] Search is currently limited to the active view (not global project search).
