import { TabulatorFull as Tabulator } from 'tabulator-tables';
// @ts-ignore
import 'tabulator-tables/dist/css/tabulator.min.css';
import { XlsxMessage, XlsxData } from '../../shared/types';

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

let table: any;
let currentData: XlsxData;
let currentSheetIndex = 0;
let isJsonView = false;
let updateTimeout: any;

function debounce(fn: Function, delay: number) {
    return (...args: any[]) => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => fn(...args), delay);
    };
}

// Handshake Logic: Keep sending 'ready' until 'init' is received
let isInitialized = false;
const handshakeInterval = setInterval(() => {
    if (!isInitialized) {
        vscode.postMessage({ type: 'ready' });
    } else {
        clearInterval(handshakeInterval);
    }
}, 500);

window.addEventListener('message', event => {
    const message: XlsxMessage = event.data;
    switch (message.type) {
        case 'init':
            if (!isInitialized && message.data) {
                isInitialized = true;
                clearInterval(handshakeInterval);
                currentData = message.data;
                initGrid();
                renderTabs();
            }
            break;
        case 'error':
            showError(message.message || 'Unknown error occurred');
            break;
    }

    if ((message as any).type === 'request-save') {
        vscode.postMessage({
            type: 'save',
            data: currentData
        } as XlsxMessage);
    }
});

function showError(message: string) {
    const container = document.getElementById('grid-container');
    if (container) {
        container.innerHTML = `<div style="padding: 20px; color: #f44336; background: #ffebee; border: 1px solid #f44336; border-radius: 4px; margin: 20px;">
            <h3>Error Loading Spreadsheet</h3>
            <p>${message}</p>
        </div>`;
    }
}

function initGrid() {
    const container = document.getElementById('grid-container');
    if (!container) return;

    const sheet = currentData.sheets[currentSheetIndex];
    
    // Tabulator prefers objects, but we have AOA (Array of Arrays)
    // Convert AOA to objects with column keys '0', '1', '2'...
    const tableData = sheet.data.map((row, rowIndex) => {
        const rowObj: any = { _id: rowIndex };
        row.forEach((cell, colIndex) => {
            rowObj[colIndex.toString()] = cell;
        });
        return rowObj;
    });

    // Find max columns
    const maxCols = Math.max(...sheet.data.map(r => r.length), 26);
    const columns: any[] = [{ title: "#", field: "_id", width: 40, headerSort: false, frozen: true }];
    
    for (let i = 0; i < maxCols; i++) {
        columns.push({
            title: String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : ''),
            field: i.toString(),
            editor: "input",
            headerSort: false,
            width: 100
        });
    }

    if (table) {
        table.destroy();
    }

    table = new Tabulator(container, {
        data: tableData,
        columns: columns,
        layout: "fitDataFill",
        height: "100%",
        renderVertical: "virtual",
        movableColumns: true,
        index: "_id",
    });

    // Font Size Logic
    document.getElementById('font-size-select')?.addEventListener('change', (e) => {
        const size = (e.target as HTMLSelectElement).value;
        const grid = document.getElementById('grid-container');
        if (grid) grid.style.fontSize = size;
        table.redraw(); // Recalculate cell heights
    });

    table.on("cellEdited", debounce((cell: any) => {
        const rowData = cell.getRow().getData();
        const rowIndex = rowData._id;
        const colField = cell.getField();
        const colIndex = parseInt(colField);

        // Update central data
        if (!currentData.sheets[currentSheetIndex].data[rowIndex]) {
            currentData.sheets[currentSheetIndex].data[rowIndex] = [];
        }
        currentData.sheets[currentSheetIndex].data[rowIndex][colIndex] = cell.getValue();

        vscode.postMessage({
            type: 'update',
            data: currentData
        } as XlsxMessage);
    }, 800));
}

function renderTabs() {
    const tabsContainer = document.getElementById('sheet-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';
    currentData.sheets.forEach((sheet, index) => {
        const btn = document.createElement('button');
        btn.innerText = sheet.name;
        btn.className = index === currentSheetIndex ? 'tab-btn active' : 'tab-btn';
        btn.onclick = () => {
            currentSheetIndex = index;
            initGrid();
            renderTabs();
        };
        tabsContainer.appendChild(btn);
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.innerText = isJsonView ? 'Show Grid' : 'Show JSON';
    toggleBtn.className = 'tab-btn toggle-btn';
    toggleBtn.onclick = () => {
        isJsonView = !isJsonView;
        const grid = document.getElementById('grid-container');
        const json = document.getElementById('json-view');
        if (grid && json) {
            grid.style.display = isJsonView ? 'none' : 'block';
            json.style.display = isJsonView ? 'block' : 'none';
            if (isJsonView) {
                json.innerText = JSON.stringify(currentData, null, 2);
            }
        }
        renderTabs();
    };
    tabsContainer.appendChild(toggleBtn);

    const saveBtn = document.createElement('button');
    saveBtn.innerText = 'Save XLSX';
    saveBtn.className = 'tab-btn save-btn';
    saveBtn.onclick = () => {
        vscode.postMessage({
            type: 'save',
            data: currentData
        } as XlsxMessage);
    };
    tabsContainer.appendChild(saveBtn);
}

// Search Functionality
document.getElementById('find-next')?.addEventListener('click', () => {
    const term = (document.getElementById('find-input') as HTMLInputElement).value;
    if (table && term) {
        // Tabulator filter is a bit different than Handsontable search
        // For simplicity, we filter the rows to show only matches
        table.setFilter((data: any) => {
            return Object.values(data).some(val => 
                String(val).toLowerCase().includes(term.toLowerCase())
            );
        });
    }
});

document.getElementById('undo-btn')?.addEventListener('click', () => table.undo());
document.getElementById('redo-btn')?.addEventListener('click', () => table.redo());
document.getElementById('find-btn')?.addEventListener('click', () => {
    const bar = document.getElementById('search-bar');
    if (bar) {
        bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
        if (bar.style.display === 'flex') document.getElementById('find-input')?.focus();
    }
});

document.getElementById('find-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const term = (e.target as HTMLInputElement).value;
        if (table && term) {
            // In Tabulator, Enter just re-triggers filter for now
            // To properly 'jump' to next, we would need to track current row index
            table.setFilter((data: any) => {
                return Object.values(data).some(val => 
                    String(val).toLowerCase().includes(term.toLowerCase())
                );
            });
        }
    }
});

document.getElementById('close-search')?.addEventListener('click', () => {
    const bar = document.getElementById('search-bar');
    if (bar) bar.style.display = 'none';
    table?.clearFilter();
});

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        vscode.postMessage({ type: 'request-save' });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const bar = document.getElementById('search-bar');
        if (bar) {
            bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
            if (bar.style.display === 'flex') document.getElementById('find-input')?.focus();
        }
    }
});

document.getElementById('replace-btn')?.addEventListener('click', () => {
    const replaceValue = (document.getElementById('replace-input') as HTMLInputElement).value;
    const selectedCells = table.getSelectedCells(); // Tabulator selection is complex, for v1 we simplify
    // Basic replace on selected rows for now
    const selectedRows = table.getSelectedRows();
    selectedRows.forEach((row: any) => {
        // Update first editable column for simplicity in replace demo
        row.update({"1": replaceValue});
    });
});


