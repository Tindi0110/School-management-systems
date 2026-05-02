/**
 * exportUtils.ts
 * Shared utility for CSV export and clean print across all modules.
 */

// ─── CSV Export ────────────────────────────────────────────────────────────

export interface CsvColumn {
    label: string;
    key: string;
    format?: (val: any, row: any) => string;
}

/**
 * Downloads a CSV file from an array of objects.
 * @param filename  e.g. 'students_export'  (.csv added automatically)
 * @param columns   Column definitions with headers and data keys
 * @param rows      Array of data objects
 */
export const downloadCSV = (filename: string, columns: CsvColumn[], rows: any[]): void => {
    const escape = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return /[",\n\r]/.test(str) ? `"${str}"` : str;
    };

    const header = columns.map(c => escape(c.label)).join(',');
    const body = rows.map(row =>
        columns.map(c => {
            const raw = c.format ? c.format(row[c.key], row) : row[c.key];
            return escape(raw);
        }).join(',')
    ).join('\r\n');

    const csv = `${header}\r\n${body}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ─── Print Table Builder ───────────────────────────────────────────────────

/**
 * Builds a clean HTML table string from columns + rows.
 * Used with printHTML() to produce consistent print output across modules.
 */
export const buildPrintTable = (columns: CsvColumn[], rows: any[]): string => {
    const headers = columns.map(c => `<th>${c.label}</th>`).join('');
    const body = rows.map((row, i) => {
        const cells = columns.map(c => {
            const val = c.format ? c.format(row[c.key], row) : (row[c.key] ?? '—');
            return `<td>${val}</td>`;
        }).join('');
        return `<tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
};

// ─── Print Section ─────────────────────────────────────────────────────────

/**
 * Opens a focused print window showing only the specified DOM element.
 * Handles wide/scrollable tables by rendering the full content without clipping.
 * @param title     Document title shown in print header
 * @param elementId ID of the DOM element to print
 */
export const printSection = (title: string, elementId: string): void => {
    const el = document.getElementById(elementId);
    if (!el) {
        console.warn(`printSection: element #${elementId} not found`);
        window.print();
        return;
    }

    const content = el.outerHTML;
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) {
        alert('Please allow pop-ups to print this document.');
        return;
    }

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11px;
            color: #1a1a2e;
            background: #fff;
            padding: 16px;
        }

        .print-header {
            text-align: center;
            margin-bottom: 16px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1e3c72;
        }
        .print-header h1 {
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #1e3c72;
        }
        .print-header p {
            font-size: 10px;
            color: #666;
            margin-top: 4px;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: auto;
            word-break: break-word;
        }
        th {
            background: #1e3c72 !important;
            color: #fff !important;
            padding: 6px 8px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        td {
            padding: 5px 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10px;
            vertical-align: middle;
        }
        tr:nth-child(even) td {
            background: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        tr:hover td { background: transparent; }

        /* Badges / pills */
        .badge, span[class*="badge"] {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 9999px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
        }

        /* Cards / stat boxes */
        .print-stats {
            display: flex;
            gap: 12px;
            margin-bottom: 14px;
            flex-wrap: wrap;
        }
        .print-stat {
            flex: 1;
            min-width: 100px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px 12px;
        }
        .print-stat-label { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #6b7280; }
        .print-stat-value { font-size: 18px; font-weight: 900; color: #1e3c72; }

        /* Remove interactive elements */
        button, input, select, .no-print, [data-no-print] { display: none !important; }

        /* Overflow: show full content, no scroll */
        .table-wrapper, [class*="table-wrapper"],
        .overflow-auto, .overflow-x-auto, .overflow-y-auto,
        [class*="overflow"] {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
        }

        /* Page breaks */
        @page {
            size: A4 landscape;
            margin: 12mm 10mm;
        }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { page-break-inside: avoid; }
        table { page-break-inside: auto; }

        .print-footer {
            margin-top: 16px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 9px;
            color: #9ca3af;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>${title}</h1>
        <p>Printed on ${new Date().toLocaleString()}</p>
    </div>
    ${content}
    <div class="print-footer">
        <span>School Management System</span>
        <span>Page <span class="pageNumber"></span></span>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.close();
            }, 400);
        };
    </script>
</body>
</html>`);
    win.document.close();
};

/**
 * Prints an HTML string directly (for modals/broadsheets where no DOM id exists).
 */
export const printHTML = (title: string, htmlContent: string): void => {
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) { alert('Please allow pop-ups to print this document.'); return; }

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; padding: 16px; }
        .print-header { text-align: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #1e3c72; }
        .print-header h1 { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #1e3c72; }
        .print-header p { font-size: 10px; color: #666; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; table-layout: auto; word-break: break-word; }
        th { background: #1e3c72 !important; color: #fff !important; padding: 6px 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; vertical-align: middle; }
        tr:nth-child(even) td { background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        button, input, select, .no-print { display: none !important; }
        .table-wrapper, .overflow-auto, .overflow-x-auto, .overflow-y-auto, [class*="overflow"] { overflow: visible !important; max-height: none !important; height: auto !important; }
        @page { size: A4 landscape; margin: 12mm 10mm; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        .print-footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>${title}</h1>
        <p>Printed on ${new Date().toLocaleString()}</p>
    </div>
    ${htmlContent}
    <div class="print-footer">
        <span>School Management System</span>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print();window.close();},400);};<\/script>
</body>
</html>`);
    win.document.close();
};
