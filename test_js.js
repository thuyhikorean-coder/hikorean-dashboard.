const fs = require('fs');
const text = fs.readFileSync('real_sale.csv', 'utf8');

function parseMoney(val) {
    if (!val) return 0;
    let clean = val.toString().trim().replace(/[^0-9,.]/g, '');
    if (clean.includes('.') && clean.includes(',')) return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(clean.replace(/[.,]/g, (m, i, s) => (i === s.lastIndexOf(m) && s.length - i <= 3) ? '.' : '')) || 0;
}

function standardizeDate(dateStr) {
    if (!dateStr) return '';
    const cleanDate = dateStr.toString().split(' ')[0];
    if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts.length >= 3) {
            let y = parts[2];
            if (y.length > 4) y = y.substring(0, 4);
            return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    return cleanDate;
}

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
let dailyRevMap = {};
rowsSale.slice(1).forEach(row => {
    // We assume all rows are from selected month (06-2026) for testing
    const status = row[9]?.toUpperCase();
    if (status === 'DONE' || status === 'DEPOSIT') {
        const stdDate = standardizeDate(row[0]);
        const amount = parseMoney(row[8]);
        const saleName = row[3]?.trim() || 'N/A';
        
        if (stdDate.length >= 10) {
            const dKey = stdDate.substring(5, 10);
            if (!dailyRevMap[saleName]) dailyRevMap[saleName] = {};
            dailyRevMap[saleName][dKey] = (dailyRevMap[saleName][dKey] || 0) + amount;
        }
    }
});

let thomRev = 0;
let khanhLinhRev = 0;
let thuyRev = 0;
const monthPrefix = '06';

if (dailyRevMap['Hồng Thơm']) {
    Object.keys(dailyRevMap['Hồng Thơm']).forEach(dateKey => {
        if (dateKey >= `${monthPrefix}-10` && dateKey <= `${monthPrefix}-16`) {
            thomRev += dailyRevMap['Hồng Thơm'][dateKey];
        }
    });
}
if (dailyRevMap['Khánh Linh']) {
    Object.keys(dailyRevMap['Khánh Linh']).forEach(dateKey => {
        if (dateKey >= `${monthPrefix}-10` && dateKey <= `${monthPrefix}-16`) {
            khanhLinhRev += dailyRevMap['Khánh Linh'][dateKey];
        }
    });
}
if (dailyRevMap['Thu Thủy']) {
    Object.keys(dailyRevMap['Thu Thủy']).forEach(dateKey => {
        if (dateKey >= `${monthPrefix}-10` && dateKey <= `${monthPrefix}-16`) {
            thuyRev += dailyRevMap['Thu Thủy'][dateKey];
        }
    });
}

console.log('Thơm:', thomRev);
console.log('Khánh Linh:', khanhLinhRev);
console.log('Thu Thủy:', thuyRev);
