export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No data to export");
        return;
    }

    // specific logic to flatten objects can be added here if needed
    // for now, simple key-value extraction
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => {
        return Object.values(obj).map(val => {
            if (typeof val === 'string') {
                // Escape quotes and wrap in quotes
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(',');
    }).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
