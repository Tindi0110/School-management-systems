export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No data to export");
        return;
    }

    // Helper to flatten nested objects (e.g., { user: { name: 'John' } } -> { user_name: 'John' })
    const flattenObject = (obj: any, prefix = ''): any => {
        return Object.keys(obj).reduce((acc: any, k: string) => {
            const pre = prefix.length ? prefix + '_' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    };

    const flattenedData = data.map(item => flattenObject(item));

    // Get all unique keys as headers
    const headers = Array.from(new Set(flattenedData.flatMap(item => Object.keys(item))));

    const rows = flattenedData.map(obj => {
        return headers.map(header => {
            const val = obj[header];
            if (val === null || val === undefined) return '';
            const stringVal = String(val);
            // Escape quotes and wrap in quotes for CSV safety
            return `"${stringVal.replace(/"/g, '""')}"`;
        }).join(',');
    });

    const csvContent = "\ufeff" + headers.join(',') + "\n" + rows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

