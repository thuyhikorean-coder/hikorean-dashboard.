const fs = require('fs');
const text = fs.readFileSync('real_sale.csv', 'utf8');

function parseCSV(text) {
    if (!text) return [];
    const rows = [];
    let row = [];
    let col = "";
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i+1];
        if (inQuote) {
            if (char === '"' && nextChar === '"') { col += '"'; i++; }
            else if (char === '"') { inQuote = false; }
            else { col += char; }
        } else {
            if (char === '"') { inQuote = true; }
            else if (char === ',') { row.push(col.trim()); col = ""; }
            else if (char === '\n' || char === '\r') {
                row.push(col.trim()); col = "";
                if (row.length > 1) rows.push(row);
                row = [];
                if (char === '\r' && nextChar === '\n') i++;
            }
            else { col += char; }
        }
    }
    if (col || row.length > 0) { row.push(col.trim()); if (row.length > 1) rows.push(row); }
    return rows;
}

const rowsSale = parseCSV(text);
rowsSale.forEach(row => {
    if(row[0] && row[0].endsWith('/06/2026')) {
        let day = parseInt(row[0].split('/')[0]);
        if(day >= 10 && day <= 16) {
            let saleName = row[3]?.trim();
            if(saleName === 'Khánh Linh') {
                console.log(row[0], row[8], row[9]);
            }
        }
    }
});
