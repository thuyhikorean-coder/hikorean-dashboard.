window.DASHBOARD_DATA = {
    updateDate: "Đang cập nhật...",
    month: "Tháng 4, 2026",

    summary: {
        totalRevenue: 0,
        revenueGoal: 480000000,
        mktCost: 0,
        mktTarget: 12,
        mktCostRatio: 0,
        teacherCost: 0,
        teacherTarget: 25,
        teacherCostRatio: 0,
        upsellPotential: 0,
        refundRate: 0
    },

    financial: {
        dailyRevenue: [],
        revenueBySale: {},
        revenueByCourse: {},
        revenueBySource: {}
    },

    customer: {
        funnel: {
            totalData: 0,
            totalLeads: 0,
            totalOrders: 0,
            conversionRate: 0
        },
        sources: {}
    },

    process: {
        trackingCompliance: [],
        activeClasses: 0,
        avgAttendance: 0
    },

    growth: {
        avgSatisfaction: 0,
        totalFollowers: 0,
        teacherStats: []
    },

    okrs: [
        {
            id: 'F',
            objective: 'Tài chính (Finance)',
            krs: [
                { name: 'Doanh thu thuần', current: 0, target: 480, unit: 'Tr', progress: 0 },
                { name: 'Tỉ suất MKT/DT', current: 0, target: 12, unit: '%', progress: 0 }
            ]
        },
        {
            id: 'C',
            objective: 'Khách hàng (Customer)',
            krs: [
                { name: 'Tỉ lệ chốt đơn', current: 0, target: 10, unit: '%', progress: 0 },
                { name: 'Tỉ lệ Upsell/Ref', current: 0, target: 65, unit: '%', progress: 0 }
            ]
        },
        {
            id: 'P',
            objective: 'Vận hành (Internal Process)',
            krs: [
                { name: 'Tỉ suất GV/DT', current: 0, target: 25, unit: '%', progress: 0 },
                { name: 'Tỉ lệ chuyên cần', current: 0, target: 80, unit: '%', progress: 0 }
            ]
        },
        {
            id: 'G',
            objective: 'Học tập & Phát triển',
            krs: [
                { name: 'Điểm CSAT (HV)', current: 0, target: 4.5, unit: 'đ', progress: 0 },
                { name: 'Tỉ lệ Đạt chuẩn', current: 0, target: 90, unit: '%', progress: 0 }
            ]
        }
    ]
};


