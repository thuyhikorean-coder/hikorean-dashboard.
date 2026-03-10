const CONFIG = {
    SALE_REVENUE_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFwJIH_mrYmSIpD-BcHmrYi_xHkGte5YZIdfVUjh8prRMaxVRmI7HRsUK2Cj3hGQ/pub?gid=1757451089&single=true&output=csv',
    MKT_ADS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO-aSIrwtMiGFGMpxSqRhIFo7PMA9Uebo7FBxY1rhm_jbUi2cY4Kz3XTXbwVfi7Q/pub?gid=323525620&single=true&output=csv',
    QLCL_DAILY_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQY7qRLepn6kX8qNTuJqABTf5Xm7UBm6bPs89gSAZ6_fNbFfE6ULg8Jlxab5TD3oA/pub?gid=1405301812&single=true&output=csv',
    QLCL_OUTCOME_URL: 'https://docs.google.com/spreadsheets/d/1TBDo2dCjKznOlav7FnnebEML7o7VuDq1/export?format=csv&gid=531665888',
    SALE_TRACKING_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFwJIH_mrYmSIpD-BcHmrYi_xHkGte5YZIdfVUjh8prRMaxVRmI7HRsUK2Cj3hGQ/pub?gid=11036957&single=true&output=csv',
    UPSALE_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzh_K2wpZTdnolPCRzYhVQxkq0B39c2zYRB4OLRsybc8LwAMFxsrCP98RRjbI--g/pub?gid=548776730&single=true&output=csv',
    SOCIAL_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO-aSIrwtMiGFGMpxSqRhIFo7PMA9Uebo7FBxY1rhm_jbUi2cY4Kz3XTXbwVfi7Q/pub?gid=578202755&single=true&output=csv',
    FEEDBACK_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsv4tsHlXao_Awr8Xe1RI3tzGkL11KMJga_vlXv7_y8Nz6jwbfzoaoBUTbTk63TiUYz2shPpG0cEof/pub?gid=0&single=true&output=csv'
};

let CURRENT_RAW_DATA = null;

document.addEventListener('DOMContentLoaded', () => {
    console.clear();
    console.log("HIKOREAN DASHBOARD starting...");

    const selector = document.getElementById('monthSelector');
    if (selector) {
        selector.addEventListener('change', () => {
            if (CURRENT_RAW_DATA) {
                processAllData(CURRENT_RAW_DATA);
                initDashboard();
            }
        });
    }

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
    CURRENT_RAW_DATA = data;

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

function isFromTargetMonth(dateStr) {
    if (!dateStr) return false;
    const selector = document.getElementById('monthSelector');
    const selectedValue = selector ? selector.value : "03-2026"; // Default
    const [m, y] = selectedValue.split('-');

    // Checks for YYYY-MM, DD-MM-YYYY, or DD/MM/YYYY
    return dateStr.includes(`${y}-${m}`) || dateStr.includes(`${m}-${y}`) || dateStr.includes(`${m}/${y}`);
}

function standardizeDate(dateStr) {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length >= 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
}

function processAllData(data) {
    // Structural Safety Check - Ensure all categories exist
    if (!window.DASHBOARD_DATA) window.DASHBOARD_DATA = {};
    const d = DASHBOARD_DATA;
    if (!d.summary) d.summary = {};
    if (!d.summary.revenueGoal || d.summary.revenueGoal === 0) d.summary.revenueGoal = 394000000;
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
    const rowsFeedback = parseCSV(data.FEEDBACK_URL);

    // Xử lý dữ liệu Feedback Thật từ Google Sheet
    d.feedbacks = [];
    if (rowsFeedback.length > 1) {
        rowsFeedback.slice(1).forEach(row => {
            // Cột A: Thời gian, B: Tên, C: Lớp, D: Giáo viên, J (index 9): Điểm TB
            if (row.length >= 10 && row[0]) {
                const dateRaw = row[0];
                const dateObj = new Date(dateRaw);
                const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('vi-VN') : dateRaw.split(' ')[0] || dateRaw;

                d.feedbacks.push({
                    date: dateStr,
                    name: row[1] || 'Ẩn danh',
                    class: row[2] || '---',
                    teacher: row[3] || '---',
                    overall: parseFloat(row[9] || 0)
                });
            }
        });
    }

    // 1. FINANCIAL (Sale Performance)
    let totalRev = 0;
    let totalNewRev = 0;
    let totalUpRev = 0;
    let totalMktAdsRev = 0;

    if (rowsSale.length > 1) {
        let revBySale = {}, revByCourse = {}, comboCount = {}, orderCount = {}, dailyMap = {}, newCount = {}, upCount = {};
        rowsSale.slice(1).forEach(row => {
            if (!isFromTargetMonth(row[0])) return;
            const status = row[9]?.toUpperCase();
            if (status === 'DONE' || status === 'DEPOSIT') {
                const amount = parseMoney(row[8]);
                const saleName = row[3]?.trim() || 'N/A';
                const source = row[4]?.trim().toUpperCase() || '';
                const type = row[5]?.toUpperCase() || '';
                const isCombo = row[7]?.toUpperCase() === 'YES';

                totalRev += amount;
                revBySale[saleName] = (revBySale[saleName] || 0) + amount;
                orderCount[saleName] = (orderCount[saleName] || 0) + 1;

                const isMktAdsRe = source.includes('MKT-ADS') || source.includes('RE-MARKETING');

                if (isMktAdsRe) {
                    totalMktAdsRev += amount;
                }

                if ((type.includes('MỚI') || type.includes('NEW')) && isMktAdsRe) {
                    newCount[saleName] = (newCount[saleName] || 0) + 1;
                    totalNewRev += amount;
                } else if (type.includes('CŨ') || type.includes('UPSELL') || type.includes('UP')) {
                    upCount[saleName] = (upCount[saleName] || 0) + 1;
                    totalUpRev += amount;
                }

                if (isCombo) comboCount[saleName] = (comboCount[saleName] || 0) + 1;

                const cName = row[6]?.split('-')[0]?.trim() || 'Khác';
                revByCourse[cName] = (revByCourse[cName] || 0) + amount;
                if (row[0]) {
                    const stdDate = standardizeDate(row[0]);
                    if (stdDate.length >= 10) {
                        const dKey = stdDate.substring(5, 10);
                        dailyMap[dKey] = (dailyMap[dKey] || 0) + amount;
                    }
                }
            }
        });

        const todayObj = new Date();
        const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
        const dd = String(todayObj.getDate()).padStart(2, '0');
        let latestDateKey = `${mm}-${dd}`;

        let todayRevBySale = {};
        rowsSale.slice(1).forEach(row => {
            if (!isFromTargetMonth(row[0])) return;
            const status = row[9]?.toUpperCase();
            if (status === 'DONE' || status === 'DEPOSIT') {
                const stdDate = standardizeDate(row[0]);
                if (stdDate.length >= 10 && stdDate.substring(5, 10) === latestDateKey) {
                    const saleName = row[3]?.trim() || 'N/A';
                    todayRevBySale[saleName] = (todayRevBySale[saleName] || 0) + parseMoney(row[8]);
                }
            }
        });
        DASHBOARD_DATA.summary.totalRevenue = totalRev;
        DASHBOARD_DATA.summary.totalNewRevenue = totalNewRev;
        DASHBOARD_DATA.summary.totalUpRevenue = totalUpRev;
        DASHBOARD_DATA.summary.totalOtherRevenue = totalRev - totalNewRev - totalUpRev;
        DASHBOARD_DATA.summary.totalMktAdsRevenue = totalMktAdsRev;
        DASHBOARD_DATA.financial.dailyRevenue = Object.entries(dailyMap).map(([date, value]) => ({ date, value })).sort();
        DASHBOARD_DATA.financial.revenueBySale = revBySale;
        DASHBOARD_DATA.financial.revenueByCourse = revByCourse;

        // Calculate Combo Rates & Sprint Progress
        let saleStats = {};
        let totalNewCount = 0;
        let totalUpCount = 0;

        Object.keys(revBySale).forEach(name => {
            totalNewCount += newCount[name] || 0;
            totalUpCount += upCount[name] || 0;
            saleStats[name] = {
                rev: revBySale[name],
                comboRate: orderCount[name] > 0 ? ((comboCount[name] || 0) / orderCount[name] * 100).toFixed(0) : 0,
                newCount: newCount[name] || 0,
                upCount: upCount[name] || 0,
                todayRev: todayRevBySale[name] || 0
            };
        });
        DASHBOARD_DATA.financial.saleStats = saleStats;
        DASHBOARD_DATA.financial.latestDate = latestDateKey;

        // Calculate Global Upsell Rate based on target of 65% for BSC
        const totalEligibleUpsellLeads = 53; // Hardcoded from user context ("Tháng 3 chị count ra 53 người dưới 2 triệu")
        DASHBOARD_DATA.summary.upsellRate = totalEligibleUpsellLeads > 0 ? ((totalUpCount / totalEligibleUpsellLeads) * 100).toFixed(1) : 0;

    }

    // 2. CUSTOMER
    if (rowsMkt.length > 1) {
        let mktCost = 0, mktLeads = 0, mktData = 0;
        rowsMkt.slice(1).forEach(row => {
            if (!isFromTargetMonth(row[0])) return;
            if (row[1]) mktCost += parseMoney(row[1]);
            if (row[4]) mktData += (parseInt(row[4].replace(/[^0-9]/g, '')) || 0);
            if (row[5]) mktLeads += (parseInt(row[5].replace(/[^0-9]/g, '')) || 0);
        });
        DASHBOARD_DATA.summary.mktCost = mktCost;

        // Fix: MKT Cost Ratio is strictly against MKT-ADS revenue sum, not just any NEW revenue
        const currentMktNewRev = DASHBOARD_DATA.summary.totalNewRevenue || 0;
        DASHBOARD_DATA.summary.mktCostRatio = currentMktNewRev > 0 ? ((mktCost / currentMktNewRev) * 100).toFixed(1) : 0;

        const doneCount = rowsSale.filter(r => {
            if (!isFromTargetMonth(r[0])) return false;
            const status = r[9]?.toUpperCase();
            const source = r[4]?.trim().toUpperCase() || '';
            const type = r[5]?.toUpperCase() || '';
            const isNew = type.includes('MỚI') || type.includes('NEW');
            const isMktTarget = source === 'MKT-ADS' || source.includes('REMIND') || source.includes('RE-MARKETING');
            return isMktTarget && (status === 'DONE' || status === 'DEPOSIT');
        }).length;
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
            if (!isFromTargetMonth(row[0])) return;
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
            if (!isFromTargetMonth(row[0])) return;
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
        let totalCsat = 0;
        let csatCount = 0;
        let totalPass = 0;
        let passCount = 0;

        rowsQlclO.slice(1).forEach(row => {
            if (!isFromTargetMonth(row[3])) return; // Ngày Kết khoá
            if (row[0]) {
                const pass = row[7] || '0%'; // Tỷ Lệ Đạt Chuẩn
                const csat = row[8] || '0'; // Điểm CSAT

                finishedClasses.push({
                    id: row[0],
                    teacher: row[1] || '---',
                    date: row[3] || '---',
                    students: row[4] || '0', // Tổng sĩ số
                    passRate: pass,
                    csat: csat,
                    attendance: row[9] || '0%' // Tỉ lệ chuyên cần
                });

                let valCsat = parseFloat(csat.replace(',', '.'));
                if (valCsat > 0) { totalCsat += valCsat; csatCount++; }

                let valPass = parseFloat(pass.replace('%', '').replace(',', '.'));
                if (valPass > 0) { totalPass += valPass; passCount++; }
            }
        });
        DASHBOARD_DATA.process.finishedClasses = finishedClasses;
        DASHBOARD_DATA.growth.avgSatisfaction = csatCount > 0 ? (totalCsat / csatCount).toFixed(1) : parseFloat(localStorage.getItem('backup_csat') || '0');
        DASHBOARD_DATA.growth.avgPassRate = passCount > 0 ? (totalPass / passCount).toFixed(1) : 0;
        if (csatCount > 0) localStorage.setItem('backup_csat', DASHBOARD_DATA.growth.avgSatisfaction);
    }

    if (rowsSocial.length > 1) {
        let ytLatest = 0;
        let fbLatest = 0;
        let hitVideos = 0;

        rowsSocial.slice(1).forEach(r => {
            if (!isFromTargetMonth(r[0])) return; // CHỈ LẤY THÁNG ĐƯỢC CHỌN

            const platform = r[1]?.toUpperCase() || '';
            let rawStr = r[2] ? r[2].toString().replace(/\\./g, '') : '0';
            const followers = parseFloat(rawStr) || 0;
            const views1k = parseInt(r[3]) || 0;

            if (platform.includes('FACEBOOK') || platform.includes('FANPAGE')) {
                fbLatest += followers;
            } else if (platform.includes('YOUTUBE') || platform.includes('YT')) {
                ytLatest += followers;
            }
            hitVideos += views1k;
        });

        DASHBOARD_DATA.growth.totalFollowers = fbLatest + ytLatest;
        DASHBOARD_DATA.growth.fbFollowers = fbLatest;
        DASHBOARD_DATA.growth.ytFollowers = ytLatest;
        DASHBOARD_DATA.growth.hitVideos = hitVideos;
    }

    if (rowsUp.length > 1) {
        let pot = 0;
        let upsellList = [];
        let upsellByClass = {};

        rowsUp.slice(1).forEach(r => {
            if (!isFromTargetMonth(r[3])) return; // Ngày kết khóa
            const val = parseMoney(r[7]); // Total Remain Amount
            const className = r[1]?.trim();
            pot += val;
            if (val > 0 && upsellList.length < 5) {
                upsellList.push({ name: r[4], class: className, amount: val }); 
            }

            if (className) {
                if (!upsellByClass[className]) {
                    upsellByClass[className] = { total: 0, up: 0 };
                }
                upsellByClass[className].total++;
                const result = r[11]?.toUpperCase() || '';
                if (result.includes('LÊN LỚP') || result.includes('THÀNH CÔNG')) {
                    upsellByClass[className].up++;
                }
            }
        });
        DASHBOARD_DATA.summary.upsellPotential = pot;
        DASHBOARD_DATA.customer.upsellList = upsellList;
        DASHBOARD_DATA.process.upsellByClass = upsellByClass;
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

    d.okrs[1].krs[1].current = d.growth.avgPassRate;
    d.okrs[1].krs[1].progress = Math.min(100, Math.round((d.growth.avgPassRate / 90) * 100));

    d.okrs[1].krs[2].current = d.process.avgAttendance;
    d.okrs[1].krs[2].progress = Math.min(100, Math.round((d.process.avgAttendance / 90) * 100));
}

function initDashboard() {
    const d = DASHBOARD_DATA;

    const revEl = document.getElementById('overallRevenue');
    if (revEl) revEl.textContent = formatCurrency(d.summary.totalRevenue);

    const goalEl = document.getElementById('monthlyGoal');
    if (goalEl) goalEl.textContent = formatCurrency(d.summary.revenueGoal);

    const newRevEl = document.getElementById('newRevenue');
    if (newRevEl) newRevEl.textContent = formatCurrency(d.summary.totalNewRevenue || 0);

    const upRevEl = document.getElementById('upRevenue');
    if (upRevEl) upRevEl.textContent = formatCurrency(d.summary.totalUpRevenue || 0);

    const otherRevEl = document.getElementById('otherRevenue');
    if (otherRevEl) otherRevEl.textContent = formatCurrency(d.summary.totalOtherRevenue || 0);

    const updateEl = document.getElementById('lastUpdate');
    if (updateEl) updateEl.textContent = `Sync: ${new Date().toLocaleTimeString('vi-VN')}`;

    // Sprint Banner countdown
    const sprintDate = new Date("2026-03-21T00:00:00+07:00");
    const today = new Date();
    const daysLeft = Math.max(0, Math.floor((sprintDate - today) / (1000 * 60 * 60 * 24)));
    const dlEl = document.getElementById('daysLeft');
    const bannerEl = document.getElementById('sprintBanner');
    const selector = document.getElementById('monthSelector');
    if (selector && selector.value === '03-2026') {
        if (bannerEl) bannerEl.style.display = 'flex';
        if (dlEl) dlEl.textContent = daysLeft;
    } else {
        if (bannerEl) bannerEl.style.display = 'none';
    }

    renderOKRs();
    renderBSCTable();
    renderFunnel();
    renderFinishedClasses();
    renderSalesList();
    renderEngagementList();
    renderCourseList();
    renderRaceCards();
    renderStudentFeedback();
    initCharts();
}

function renderStudentFeedback() {
    const tbody = document.getElementById('student-feedback-list');
    if (!tbody) return;

    // Ưu tiên lấy dữ liệu thật từ Google Sheet (đã xử lý trong processAllData), gọi là Real
    let realFeedbacks = (DASHBOARD_DATA.feedbacks && DASHBOARD_DATA.feedbacks.length > 0) ? DASHBOARD_DATA.feedbacks : [];

    // Nếu không có dữ liệu thật (chưa thêm FEEDBACK_URL), thì tạm lấy từ LocalStorage
    let mockFeedbacks = JSON.parse(localStorage.getItem('hikorean_feedbacks') || '[]');

    // Gộp chung 2 dữ liệu: dữ liệu Real làm gốc + dữ liệu LocalStorage bù vào nếu Sheet chưa cập nhật kịp
    let allFeedbacks = [...realFeedbacks];

    // Nếu chưa có file Google Sheet, sử dụng mockFeedbacks hoàn toàn
    if (realFeedbacks.length === 0) {
        allFeedbacks = [...mockFeedbacks];
    }

    // Aggregate by class
    let classMap = {};
    allFeedbacks.forEach(f => {
        let cls = f.class || 'Lớp Khác';
        if (!classMap[cls]) {
            classMap[cls] = {
                teacher: f.teacher || '---',
                count5: 0,
                count4: 0,
                countOther: 0,
                totalScores: 0,
                reviewCount: 0,
                recentDate: f.date
            };
        }

        let avg = parseFloat(f.overall);
        if (avg >= 4.5) {
            classMap[cls].count5++;
        } else if (avg >= 3.5) {
            classMap[cls].count4++;
        } else {
            classMap[cls].countOther++;
        }

        classMap[cls].totalScores += avg;
        classMap[cls].reviewCount++;
    });

    let classesArr = Object.keys(classMap).map(k => ({ id: k, ...classMap[k] }));

    // Sort by most recently reviewed classes first
    classesArr.reverse();

    if (classesArr.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:var(--text-muted); font-style:italic; padding: 20px;">
                    Chưa có lớp nào thực hiện khảo sát.
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    classesArr.slice(0, 5).forEach(c => {
        let avgScore = (c.totalScores / c.reviewCount).toFixed(1);
        let color = avgScore >= 4.5 ? 'var(--primary)' : (avgScore >= 3.5 ? 'var(--warning)' : 'var(--danger)');
        html += `
            <tr>
                <td><span class="badge badge-growth">${c.id}</span></td>
                <td>${c.teacher}</td>
                <td style="font-weight:bold; color:var(--primary); text-align:center;">${c.count5}</td>
                <td style="font-weight:bold; color:var(--warning); text-align:center;">${c.count4}</td>
                <td style="color:${color}; font-weight:bold; text-align:center;">${avgScore} <i class='bx bxs-star'></i></td>
                <td style="text-align:center;">${c.reviewCount} HV</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}


function renderOKRs() {
    const list = document.getElementById('okr-list');
    if (!list) return;
    list.innerHTML = DASHBOARD_DATA.okrs.map(okr => `
        <div class="okr-item-v2" style="margin-bottom:28px;">
            <div style="font-weight:700; font-size:0.85rem; color:var(--primary); margin-bottom:12px;">${okr.objective}</div>
            ${okr.krs.map(kr => `
                <div style="margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:6px;">
                        <span>${kr.name}</span>
                        <span style="font-weight:700">${kr.current} / ${kr.target} ${kr.unit}</span>
                    </div>
                    <div class="progress-container" style="height:8px;"><div class="progress-fill" style="width:${kr.progress}%"></div></div>
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
        { kpi: 'Tỉ suất MKT/DT (Ads)', actual: `${d.summary.mktCostRatio}%`, target: `< ${d.summary.mktTarget}%`, status: d.summary.mktCostRatio <= d.summary.mktTarget ? 'process' : 'finance' },
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
        { label: 'SĐT (Leads) / Mục tiêu 265', val: `${f.totalLeads} / 265`, color: 'rgba(242,201,76,0.2)' },
        { label: 'Đơn đã chốt', val: f.totalOrders, color: 'rgba(242,201,76,0.5)' }
    ];
    container.innerHTML = steps.map(s => `
        <div style="background:${s.color}; padding:8px; border-radius:6px; text-align:center; border:1px solid rgba(255,255,255,0.05); margin-bottom:5px;">
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight: 500;">${s.label}</div>
            <div style="font-size:1.1rem; font-weight:800; color:var(--primary)">${s.val}</div>
        </div>
    `).join('');

    // Dynamic Meta Chips (Report Progress & Upsell Rate)
    const chipUp = document.getElementById('reportProgress');
    if (chipUp) chipUp.textContent = `92%`; // Binding this to QLCL later if needed

    const chipRef = document.getElementById('upsellRate');
    if (chipRef) chipRef.textContent = `${DASHBOARD_DATA.summary.upsellRate || 0}%`;

    // New MKT Chips
    const mktFB = document.getElementById('mktFB');
    if (mktFB) mktFB.textContent = `${DASHBOARD_DATA.growth.fbFollowers || 0} / 1000`;

    const mktYT = document.getElementById('mktYT');
    if (mktYT) mktYT.textContent = `${DASHBOARD_DATA.growth.ytFollowers || 0} / 500`;

    const mktViews = document.getElementById('mktViews');
    if (mktViews) mktViews.textContent = `${DASHBOARD_DATA.growth.hitVideos || 0}`;

    const mktCostNew = document.getElementById('mktCostRatioNew');
    if (mktCostNew) mktCostNew.textContent = `${DASHBOARD_DATA.summary.mktCostRatio}%`;
}

function renderFinishedClasses() {
    const tbody = document.getElementById('compliance-table');
    if (!tbody) return;
    const classes = DASHBOARD_DATA.process.finishedClasses || [];
    const upsellByClass = DASHBOARD_DATA.process.upsellByClass || {};

    tbody.innerHTML = classes.map(c => {
        let upInfo = upsellByClass[c.id];
        let upRate = '0%';
        if (upInfo && upInfo.total > 0) {
            upRate = Math.round((upInfo.up / upInfo.total) * 100) + '%';
        }
        return `
        <tr>
            <td style="font-weight:700;">
                <div style="display:flex; align-items:center; gap:8px;">
                    ${c.id}
                    <button onclick="copyFeedbackLink('${c.id}', '${c.teacher}')" title="Copy Link Feedback" style="background:var(--primary-glow); border:none; color:var(--primary); cursor:pointer; padding:4px 6px; border-radius:4px; font-size:1.1rem; display:flex; align-items:center;"><i class='bx bx-copy'></i></button>
                </div>
            </td>
            <td style="text-align:center;">${c.students}</td>
            <td style="text-align:center; font-weight:700; color:var(--warning);">${upRate}</td>
            <td style="color:var(--danger); font-weight:700;">${c.passRate}</td>
            <td style="font-weight:700; color:var(--info); text-align:right;">${c.attendance}</td>
        </tr>
    `}).join('');
}

// Global copy logic for Feedback Link
window.copyFeedbackLink = function (classId, teacher) {
    const baseUrl = window.location.href.split('?')[0].replace(/index\.html|v5\.html/, '');
    const url = `${baseUrl}student-feedback.html?class=${encodeURIComponent(classId)}&teacher=${encodeURIComponent(teacher)}`;
    navigator.clipboard.writeText(url).then(() => {
        alert(`Đã Copy link Khảo sát dành riêng cho lớp ${classId} để gửi vào Zalo!\\nLink:\\n${url}`);
    }).catch(err => {
        console.error('Copy failed', err);
        prompt("Copy bằng tay link Khảo sát sau:", url);
    });
};

function renderSalesList() {
    const tbody = document.getElementById('sales-detail-list');
    if (!tbody) return;
    const stats = DASHBOARD_DATA.financial.saleStats || {};
    const sorted = Object.entries(stats).sort((a, b) => b[1].rev - a[1].rev);

    tbody.innerHTML = sorted.map(([name, s]) => `
        <tr>
            <td style="font-weight:600;">${name}</td>
            <td style="font-weight:700; color:var(--danger);">${(s.rev / 1000000).toFixed(1)}M</td>
            <td style="text-align:right;"><span class="badge ${s.newCount >= 26 ? 'badge-process' : 'badge-danger'}">${s.newCount}/26</span></td>
            <td style="text-align:right;"><span class="badge ${s.upCount >= 17 ? 'badge-process' : 'badge-danger'}">${s.upCount}/17</span></td>
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

function renderRaceCards() {
    const container = document.getElementById('race-container');
    if (!container) return;

    // Specifically target the 2 core warriors defined by the user
    const targets = ['Khánh Linh', 'Hồng Thơm'];
    const goalPerSale = 197000000;
    const dailyTarget = 9800000;
    const stats = DASHBOARD_DATA.financial.saleStats || {};

    let dateText = 'nay';
    if (DASHBOARD_DATA.financial.latestDate) {
        let rawDate = DASHBOARD_DATA.financial.latestDate;

        // Handle YYYY-MM-DD or MM-DD (from substring 5,10)
        if (rawDate.includes('-')) {
            let parts = rawDate.split('-');
            if (parts.length === 2) {
                // MM-DD -> DD/MM
                dateText = `${parseInt(parts[1])}/${parseInt(parts[0])}`;
            } else if (parts.length >= 3) {
                // YYYY-MM-DD -> DD/MM
                dateText = `${parseInt(parts[2])}/${parseInt(parts[1])}`;
            }
        }
        // Handle DD/MM/YYYY
        else if (rawDate.includes('/')) {
            let parts = rawDate.split('/');
            if (parts.length >= 2) {
                dateText = `${parseInt(parts[0])}/${parseInt(parts[1])}`;
            }
        } else {
            dateText = rawDate;
        }
    }

    let html = '';
    targets.forEach(name => {
        let s = stats[name] || { rev: 0, todayRev: 0 };

        let sprintProgress = Math.min(100, Math.round((s.rev / goalPerSale) * 100));
        let dailyProgress = Math.min(100, Math.round((s.todayRev / dailyTarget) * 100));

        let dailyColor = dailyProgress >= 100 ? 'var(--process)' : (dailyProgress >= 50 ? 'var(--warning)' : 'var(--danger)');
        let sprintColor = sprintProgress >= 100 ? 'var(--process)' : 'var(--primary)';

        let isWinner = dailyProgress >= 100;
        let badgeHTML = isWinner ? `<span style="color: #FFD700; margin-left:5px; font-size:1rem; text-shadow: 0 0 5px rgba(255,215,0,0.5);" class="bx-tada">🏆 HOÀN THÀNH</span>` : '';

        // Fire confetti!
        if (isWinner && window.confetti) {
            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#00FF7F', '#00BFFF', '#FF1493'],
                    zIndex: 9999
                });
            }, 800 + (Math.random() * 500)); // slight random delay if both hit it
        }

        html += `
            <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05); ${isWinner ? 'box-shadow: 0 0 15px rgba(255, 215, 0, 0.2); border-color: rgba(255, 215, 0, 0.4);' : ''}">
                <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                    <span style="font-weight: 800; color: var(--text-main); font-size: 0.9rem; display: flex; align-items: center;"><i class='bx bxs-user-rectangle' style="margin-right: 5px;"></i> ${name} ${badgeHTML}</span>
                    <span style="font-weight: 700; color: var(--accent); font-size: 0.85rem;">${(s.rev / 1000000).toFixed(1)} / 197M</span>
                </div>
                
                <!-- Daily Mini Tracker -->
                <div style="margin-bottom: 8px;">
                    <div style="display:flex; justify-content:space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 3px;">
                        <span>Doanh thu ngày ${dateText}: <strong style="color:${dailyColor}">${(s.todayRev / 1000000).toFixed(1)}M</strong> / 9.8M</span>
                        <span>${dailyProgress}%</span>
                    </div>
                    <div class="progress-container" style="height: 6px; margin: 0; background: rgba(0,0,0,0.1);">
                        <div class="progress-fill" style="width: ${dailyProgress}%; background: ${dailyColor}; box-shadow: 0 0 5px ${dailyColor};"></div>
                    </div>
                </div>

                <!-- Sprint Goal Tracker -->
                <div>
                    <div style="display:flex; justify-content:space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 3px;">
                        <span>Tổng kết 20 ngày: </span>
                        <span style="font-weight: 700; color: ${sprintColor}">${sprintProgress}%</span>
                    </div>
                    <div class="progress-container" style="height: 6px; margin: 0; background: rgba(0,0,0,0.1);">
                        <div class="progress-fill" style="width: ${sprintProgress}%; background: ${sprintColor}; box-shadow: 0 0 5px ${sprintColor};"></div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
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

function formatCurrency(n) {
    return (parseFloat(n) || 0).toLocaleString('vi-VN') + ' đ';
}
