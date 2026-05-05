const fs = require('fs');
const parseMoney = (val) => {
    if (!val) return 0;
    let clean = val.toString().trim().replace(/[^0-9,.]/g, '');
    if (clean.includes('.') && clean.includes(',')) return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(clean.replace(/[.,]/g, (m, i, s) => (i === s.lastIndexOf(m) && s.length - i <= 3) ? '.' : '')) || 0;
};

const standardizeDate = (dateStr) => {
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
};

console.log("Date: ", standardizeDate("30/05/2026"));
console.log("Money: ", parseMoney("4.900.000"));

let val = "05";
console.log("Pad: ", val.padStart(2, '0'));
