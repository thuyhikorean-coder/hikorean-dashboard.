window.DASHBOARD_DATA = {
    updateDate: "Đang cập nhật...",
    month: "Tháng 5, 2026",

    summary: {
        totalRevenue: 0,
        revenueGoal: 300000000,
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
        avgPassRate: 0,
        totalFollowers: 0,
        fbFollowers: 0,
        ytFollowers: 0,
        zaloFollowers: 0,
        congDongMembers: 0,
        teacherStats: []
    },

    okrs: [
        {
            id: 'O1',
            objective: 'Tăng trưởng Doanh thu & Tối ưu Chi phí',
            krs: [
                { name: 'Doanh thu tháng (Mục tiêu: 300tr)', current: 0, target: 300, unit: 'Tr', progress: 0 },
                { name: 'Tối ưu MKT/DT (Mục tiêu: 12%)', current: 0, target: 12, unit: '%', progress: 0 }
            ]
        },
        {
            id: 'O2',
            objective: 'Chất lượng Đào tạo & Vận hành',
            krs: [
                { name: 'Chất lượng GV (CSAT > 4.5)', current: 0, target: 4.5, unit: 'đ', progress: 0 },
                { name: 'HV Đạt chuẩn (> 90%)', current: 0, target: 90, unit: '%', progress: 0 },
                { name: 'Tỉ lệ chuyên cần (> 80%)', current: 0, target: 80, unit: '%', progress: 0 }
            ]
        }
    ],

    salesKPI: {
        individuals: [
            { name: 'Thơm', current: 35000000, type: 'full-time' },
            { name: 'Khánh Linh', current: 40000000, type: 'full-time' }
        ],
        teamCurrent: 75000000,
        teamTarget: 75000000
    }
};


