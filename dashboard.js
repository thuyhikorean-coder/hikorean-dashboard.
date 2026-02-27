const CONFIG = {
    SALE_REVENUE_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFwJIH_mrYmSIpD-BcHmrYi_xHkGte5YZIdfVUjh8prRMaxVRmI7HRsUK2Cj3hGQ/pub?gid=1757451089&single=true&output=csv',
    MKT_ADS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO-aSIrwtMiGFGMpxSqRhIFo7PMA9Uebo7FBxY1rhm_jbUi2cY4Kz3XTXbwVfi7Q/pub?gid=323525620&single=true&output=csv',
    QLCL_DAILY_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQY7qRLepn6kX8qNTuJqABTf5Xm7UBm6bPs89gSAZ6_fNbFfE6ULg8Jlxab5TD3oA/pub?gid=1405301812&single=true&output=csv',
    QLCL_OUTCOME_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQY7qRLepn6kX8qNTuJqABTf5Xm7UBm6bPs89gSAZ6_fNbFfE6ULg8Jlxab5TD3oA/pub?gid=531665888&single=true&output=csv',
    SALE_TRACKING_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFwJIH_mrYmSIpD-BcHmrYi_xHkGte5YZIdfVUjh8prRMaxVRmI7HRsUK2Cj3hGQ/pub?gid=11036957&single=true&output=csv',
    UPSALE_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzh_K2wpZTdnolPCRzYhVQxkq0B39c2zYRB4OLRsybc8LwAMFxsrCP98RRjbI--g/pub?gid=548776730&single=true&output=csv',
    SOCIAL_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO-aSIrwtMiGFGMpxSqRhIFo7PMA9Uebo7FBxY1rhm_jbUi2cY4Kz3XTXbwVfi7Q/pub?gid=578202755&single=true&output=csv'
};

document.addEventListener('DOMContentLoaded', () => {
    console.clear();
    console.log("HIKOREAN DASHBOARD V1.2 starting...");
    fetchRealTimeData();
});

async function fetchRealTimeData() {
    console.log("Sync started...");
    const data = {};
    const fetchPromises = Object.entries(CONFIG).map(async ([key, url]) => {
        try {
            const response = await fetch(url + '&cb=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            data[key] = await response.text();
            console.log(`Synced ${key} successfully.`);
        } catch (e) {
            console.error(`Failed to sync ${key}:`, e);
            data[key] = '';
        }
    });

    await Promise.all(fetchPromises);
    console.log("All sync promises finished.");

    try {
        processAllData(data);
        initDashboard();
    } catch (err) {
        console.error("Critical error in data processing:", err);
        document.getElementById('lastUpdate').innerHTML = `<span style="color:red">Error: ${err.message}</span>`;
    }
}

function parseMoney(val) {
    if (!val) return 0;
    let clean = val.toString().trim().replace(/[^0-9,.]/g, '');
    if (clean.includes('.') && clean.includes(',')) return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(clean.replace(/[.,]/g, (m, i, s) => (i === s.lastIndexOf(m) && s.length - i <= 3) ? '.' : '')) || 0;
}

function parseCSV(csvText) {
    if (!csvText) return [];
    const lines = csvText.replace(/\r/g, '').split('\n');
    return lines.map(line => {
        const result = [];
        let cur = '', inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
            else cur += char;
        }
        result.push(cur.trim());
        return result;
    }).filter(row => row.length >= 2);
}

function processAllData(data) {
    // Structural Safety Check - Ensure all categories exist
    if (!window.DASHBOARD_DATA) window.DASHBOARD_DATA = {};
    const d = DASHBOARD_DATA;
    if (!d.summary) d.summary = {};
    if (!d.summary.revenueGoal || d.summary.revenueGoal === 0) d.summary.revenueGoal = 285160000;
    if (!d.summary.mktTarget) d.summary.mktTarget = 12;
    if (!d.financial) d.financial = {};
    if (!d.customer) d.customer = {};
    if (!d.process) d.process = {};
    if (!d.growth) d.growth = {};
    if (!d.okrs) d.okrs = [];

    const rowsSale = parseCSV(data.SALE_REVENUE_URL);
    const rowsMkt = parseCSV(data.MKT_ADS_URL);
    const rowsQlclD = parseCSV(data.QLCL_DAILY_URL);
    const rowsQlclO = parseCSV(data.QLCL_OUTCOME_URL);
    const rowsTrack = parseCSV(data.SALE_TRACKING_URL);
    const rowsUp = parseCSV(data.UPSALE_URL);
    const rowsSocial = parseCSV(data.SOCIAL_URL);

    // 1. FINANCIAL (Sale Performance)
    let totalRev = 0;
    if (rowsSale.length > 1) {
        let revBySale = {}, revByCourse = {}, comboCount = {}, orderCount = {}, dailyMap = {};
        rowsSale.slice(1).forEach(row => {
            const status = row[9]?.toUpperCase();
            if (status === 'DONE' || status === 'DEPOSIT') {
                const amount = parseMoney(row[8]);
                const saleName = row[3]?.trim() || 'N/A';
                const isCombo = row[7]?.toUpperCase() === 'YES';

                totalRev += amount;
                revBySale[saleName] = (revBySale[saleName] || 0) + amount;
                orderCount[saleName] = (orderCount[saleName] || 0) + 1;
                if (isCombo) comboCount[saleName] = (comboCount[saleName] || 0) + 1;

                const cName = row[6]?.split('-')[0]?.trim() || 'Khác';
                revByCourse[cName] = (revByCourse[cName] || 0) + amount;
                if (row[0]) dailyMap[row[0].substring(5, 10)] = (dailyMap[row[0].substring(5, 10)] || 0) + amount;
            }
        });
        DASHBOARD_DATA.summary.totalRevenue = totalRev;
        DASHBOARD_DATA.financial.dailyRevenue = Object.entries(dailyMap).map(([date, value]) => ({ date, value })).sort();
        DASHBOARD_DATA.financial.revenueBySale = revBySale;
        DASHBOARD_DATA.financial.revenueByCourse = revByCourse;

        // Calculate Combo Rates
        let saleStats = {};
        Object.keys(revBySale).forEach(name => {
            saleStats[name] = {
                rev: revBySale[name],
                comboRate: orderCount[name] > 0 ? ((comboCount[name] || 0) / orderCount[name] * 100).toFixed(0) : 0
            };
        });
        DASHBOARD_DATA.financial.saleStats = saleStats;
    }

    // 2. CUSTOMER
    if (rowsMkt.length > 1) {
        let mktCost = 0, mktLeads = 0, mktData = 0;
        rowsMkt.slice(1).forEach(row => {
            if (row[1]) mktCost += parseMoney(row[1]);
            if (row[4]) mktData += (parseInt(row[4].replace(/[^0-9]/g, '')) || 0);
            if (row[5]) mktLeads += (parseInt(row[5].replace(/[^0-9]/g, '')) || 0);
        });
        DASHBOARD_DATA.summary.mktCost = mktCost;
        // Fix: Use DASHBOARD_DATA reference instead of local totalRev which might be undefined if logic changes
        const currentRev = DASHBOARD_DATA.summary.totalRevenue;
        DASHBOARD_DATA.summary.mktCostRatio = currentRev > 0 ? ((mktCost / currentRev) * 100).toFixed(1) : 0;

        const doneCount = rowsSale.filter(r => r[9]?.toUpperCase() === 'DONE').length;
        DASHBOARD_DATA.customer.funnel = {
            totalData: mktData,
            totalLeads: mktLeads,
            totalOrders: doneCount,
            conversionRate: mktData > 0 ? ((doneCount / mktData) * 100).toFixed(1) : 0
        };
    }

    // 3. PROCESS (Ongoing & Sale Tracking)
    if (rowsTrack.length > 1) {
        let engagement = {};
        rowsTrack.slice(1).forEach(row => {
            const name = row[1]?.trim();
            if (!name) return;
            const interaction = parseInt(row[3]) || 0;
            const deepLeads = parseInt(row[4]) || 0;
            if (!engagement[name]) engagement[name] = { interaction: 0, deepLeads: 0 };
            engagement[name].interaction += interaction;
            engagement[name].deepLeads += deepLeads;
        });
        DASHBOARD_DATA.process.saleEngagement = engagement;
    }

    if (rowsQlclD.length > 1) {
        let teacherFee = 0, totalAtt = 0, classCount = 0;
        rowsQlclD.slice(1).forEach(row => {
            if (row[11]) teacherFee += parseMoney(row[11]);
            const att = parseFloat(row[5]?.toString().replace(',', '.')) || 0;
            if (att > 0) { totalAtt += att; classCount++; }
        });
        DASHBOARD_DATA.summary.teacherCost = teacherFee;
        const currentRev = DASHBOARD_DATA.summary.totalRevenue;
        DASHBOARD_DATA.summary.teacherCostRatio = currentRev > 0 ? ((teacherFee / currentRev) * 100).toFixed(1) : 0;
        DASHBOARD_DATA.process.avgAttendance = classCount > 0 ? (totalAtt / classCount).toFixed(1) : 0;
    }

    // 4. QUALITY & OUTCOMES
    if (rowsQlclO.length > 1) {
        let finishedClasses = [];
        rowsQlclO.slice(1).forEach(row => {
            if (row[0]) {
                finishedClasses.push({
                    id: row[0],
                    teacher: row[1] || '---',
                    date: row[2] || '---',
                    students: row[3] || '0',
                    passRate: row[5] || '0%',
                    csat: row[6] || '0',
                    attendance: row[7] || '0%'
                });
            }
        });
        DASHBOARD_DATA.process.finishedClasses = finishedClasses;
    }

    if (rowsSocial.length > 1) {
        let f = 0; rowsSocial.slice(1).forEach(r => { if (r[2]) f += parseMoney(r[2]); });
        DASHBOARD_DATA.growth.totalFollowers = f;
    }

    if (rowsUp.length > 1) {
        let pot = 0;
        let upsellList = [];
        rowsUp.slice(1).forEach(r => {
            const val = parseMoney(r[5]);
            pot += val;
            if (val > 0 && upsellList.length < 5) {
                upsellList.push({ name: r[3], class: r[1], amount: val });
            }
        });
        DASHBOARD_DATA.summary.upsellPotential = pot;
        DASHBOARD_DATA.customer.upsellList = upsellList;
    }

    // Update OKRs logic
    d.okrs[0].krs[0].current = (d.summary.totalRevenue / 1000000).toFixed(0);
    d.okrs[0].krs[0].target = (d.summary.revenueGoal / 1000000).toFixed(0);
    d.okrs[0].krs[0].progress = Math.min(100, Math.round((d.summary.totalRevenue / d.summary.revenueGoal) * 100));

    d.okrs[0].krs[1].current = d.summary.mktCostRatio;
    d.okrs[0].krs[1].target = d.summary.mktTarget;
    // For MKT ratio, progress is inverse: if ratio <= target, it's 100%
    d.okrs[0].krs[1].progress = d.summary.mktCostRatio <= d.summary.mktTarget ? 100 : Math.max(0, Math.round(100 - (d.summary.mktCostRatio - d.summary.mktTarget) * 5));

    // OKR O2: Quality & Operations
    d.okrs[1].krs[0].current = d.growth.avgSatisfaction;
    d.okrs[1].krs[0].progress = Math.min(100, Math.round((d.growth.avgSatisfaction / 4.5) * 100));

    d.okrs[1].krs[1].current = d.process.avgAttendance;
    d.okrs[1].krs[1].progress = Math.min(100, d.process.avgAttendance);
}

function initDashboard() {
    const d = DASHBOARD_DATA;
    const revEl = document.getElementById('overallRevenue');
    if (revEl) revEl.textContent = formatCurrency(d.summary.totalRevenue);

    const goalEl = document.getElementById('monthlyGoal');
    if (goalEl) goalEl.textContent = formatCurrency(d.summary.revenueGoal);

    const updateEl = document.getElementById('lastUpdate');
    if (updateEl) updateEl.textContent = `Sync: ${new Date().toLocaleTimeString('vi-VN')}`;

    renderOKRs();
    renderBSCTable();
    renderFunnel();
    renderFinishedClasses();
    renderSalesList();
    renderEngagementList();
    renderCourseList();
    initCharts();
}

function renderOKRs() {
    const list = document.getElementById('okr-list');
    if (!list) return;
    list.innerHTML = DASHBOARD_DATA.okrs.map(okr => `
        <div class="okr-item-v2">
            <div style="font-weight:700; font-size:0.8rem; color:var(--primary); margin-bottom:8px;">${okr.objective}</div>
            ${okr.krs.map(kr => `
                <div style="margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
                        <span>${kr.name}</span>
                        <span style="font-weight:700">${kr.current} / ${kr.target} ${kr.unit}</span>
                    </div>
                    <div class="progress-container"><div class="progress-fill" style="width:${kr.progress}%"></div></div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function renderBSCTable() {
    const d = DASHBOARD_DATA;
    const tbody = document.getElementById('summary-metrics');
    if (!tbody) return;
    const items = [
        { kpi: 'Doanh thu thuần', actual: formatCurrency(d.summary.totalRevenue), target: formatCurrency(d.summary.revenueGoal), status: d.summary.totalRevenue >= d.summary.revenueGoal ? 'process' : 'finance' },
        { kpi: 'Tỉ suất MKT/DT', actual: `${d.summary.mktCostRatio}%`, target: `< ${d.summary.mktTarget}%`, status: d.summary.mktCostRatio <= d.summary.mktTarget ? 'process' : 'finance' },
        { kpi: 'Tỉ suất GV/DT', actual: `${d.summary.teacherCostRatio}%`, target: '20-25%', status: 'process' },
        { kpi: 'HV Đạt chuẩn (>7đ)', actual: `${d.growth.avgPassRate}%`, target: '> 90%', status: d.growth.avgPassRate >= 90 ? 'process' : 'finance' },
        { kpi: 'Chuyên cần (Đi học)', actual: `${d.process.avgAttendance}%`, target: '> 90%', status: d.process.avgAttendance >= 90 ? 'process' : 'process' },
        { kpi: 'Điểm CSAT', actual: d.growth.avgSatisfaction, target: '> 4.5', status: 'growth' },
        { kpi: 'Chốt đơn (Lead)', actual: `${d.customer.funnel.conversionRate}%`, target: '> 10%', status: 'process' }
    ];
    tbody.innerHTML = items.map(i => `
        <tr>
            <td>${i.kpi}</td>
            <td style="font-weight:700">${i.actual}</td>
            <td style="color:var(--text-muted)">${i.target}</td>
            <td><span class="badge badge-${i.status}">${i.actual !== '0' && i.actual !== '0%' ? 'Updated' : 'Waiting'}</span></td>
        </tr>
    `).join('');
}

function renderFunnel() {
    const f = DASHBOARD_DATA.customer.funnel;
    const container = document.getElementById('funnel-container');
    if (!container) return;
    const steps = [
        { label: 'Data', val: f.totalData, color: 'rgba(242,201,76,0.1)' },
        { label: 'SĐT (Leads)', val: f.totalLeads, color: 'rgba(242,201,76,0.2)' },
        { label: 'Đơn hàng (Orders)', val: f.totalOrders, color: 'rgba(242,201,76,0.5)' }
    ];
    container.innerHTML = steps.map(s => `
        <div style="background:${s.color}; padding:8px; border-radius:6px; text-align:center; border:1px solid rgba(255,255,255,0.05); margin-bottom:5px;">
            <div style="font-size:0.7rem; color:var(--text-muted)">${s.label}</div>
            <div style="font-size:1rem; font-weight:800; color:var(--primary)">${s.val}</div>
        </div>
    `).join('');

    const chipUp = document.getElementById('upsellPotential');
    if (chipUp) chipUp.textContent = formatCurrency(DASHBOARD_DATA.summary.upsellPotential);
    const chipRef = document.getElementById('refundRate');
    if (chipRef) chipRef.textContent = `${DASHBOARD_DATA.summary.refundRate}%`;
}

function renderFinishedClasses() {
    const tbody = document.getElementById('compliance-table');
    if (!tbody) return;
    const classes = DASHBOARD_DATA.process.finishedClasses || [];
    tbody.innerHTML = classes.slice(0, 5).map(c => `
        <tr>
            <td style="font-weight:700;">${c.id}</td>
            <td style="text-align:center;">${c.students}</td>
            <td style="color:var(--danger); font-weight:700;">${c.passRate}</td>
            <td style="font-weight:700; color:var(--info); text-align:right;">${c.attendance}</td>
        </tr>
    `).join('');
}

function renderSalesList() {
    const tbody = document.getElementById('sales-detail-list');
    if (!tbody) return;
    const stats = DASHBOARD_DATA.financial.saleStats || {};
    const sorted = Object.entries(stats).sort((a, b) => b[1].rev - a[1].rev);

    tbody.innerHTML = sorted.map(([name, s]) => `
        <tr>
            <td style="font-weight:600;">${name}</td>
            <td style="font-weight:700; color:var(--danger);">${(s.rev / 1000000).toFixed(1)}M</td>
            <td style="text-align:right;"><span class="badge badge-process">${s.comboRate}%</span></td>
        </tr>
    `).join('');
}

function renderEngagementList() {
    const tbody = document.getElementById('sales-engagement-list');
    if (!tbody) return;
    const engagement = DASHBOARD_DATA.process.saleEngagement || {};

    tbody.innerHTML = Object.entries(engagement).map(([name, e]) => `
        <tr>
            <td style="font-weight:600;">${name}</td>
            <td style="text-align:center; font-weight:700;">${e.interaction}</td>
            <td style="text-align:right; font-weight:700; color:var(--warning);">${e.deepLeads}</td>
        </tr>
    `).join('');
}

function renderCourseList() {
    const container = document.getElementById('course-list');
    if (!container) return;
    const courseData = DASHBOARD_DATA.financial.revenueByCourse || {};
    const sorted = Object.entries(courseData).sort((a, b) => b[1] - a[1]);

    container.innerHTML = sorted.slice(0, 3).map(([name, val]) => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:0.8rem;">
            <span style="font-weight:600; color:var(--text-main)">${name}</span>
            <span style="font-weight:700; color:var(--info)">${(val / 1000000).toFixed(1)}M</span>
        </div>
    `).join('');
}

let charts = {};
function initCharts() {
    const d = DASHBOARD_DATA;
    const create = (id, type, labels, data, color) => {
        if (charts[id]) charts[id].destroy();
        const ctx = document.getElementById(id);
        if (!ctx || !labels.length) return;

        const isLine = type === 'line';
        let background = color;

        if (isLine) {
            const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 250);
            gradient.addColorStop(0, color + '44');
            gradient.addColorStop(1, color + '00');
            background = gradient;
        }

        charts[id] = new Chart(ctx, {
            type,
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: background,
                    borderColor: color,
                    borderWidth: isLine ? 3 : 1,
                    pointBackgroundColor: color,
                    pointRadius: isLine ? 4 : 0,
                    tension: 0.45,
                    fill: isLine
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: type === 'doughnut', position: 'bottom' },
                    tooltip: {
                        backgroundColor: '#4E342E',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#F2C94C',
                        borderWidth: 1
                    }
                },
                scales: type !== 'doughnut' ? {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(121, 85, 72, 0.05)' },
                        ticks: { color: '#8D6E63', font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8D6E63', font: { size: 10 } }
                    }
                } : {}
            }
        });
    };

    create('revenueTrendChart', 'line', d.financial.dailyRevenue.map(v => v.date), d.financial.dailyRevenue.map(v => v.value), '#C62828');

    create('courseRevenueChart', 'doughnut', Object.keys(d.financial.revenueByCourse), Object.values(d.financial.revenueByCourse),
        ['#1565C0', '#C62828', '#1976D2', '#D32F2F']);

    create('salesRevenueChart', 'bar', Object.keys(d.financial.revenueBySale), Object.values(d.financial.revenueBySale), '#1565C0');
}

function formatCurrency(n) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n); }
