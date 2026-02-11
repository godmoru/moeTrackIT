const { sequelize, User } = require('./models');

// Mock Request/Response
const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.body = {};
    res.status = function (code) {
        this.statusCode = code;
        return this;
    };
    res.json = function (data) {
        this.body = data;
        return this;
    };
    return res;
};

const mockReq = (user, query = {}, params = {}) => ({
    user,
    query,
    params
});

async function testExpenditureRestrictions() {
    try {
        console.log('🔄 Connecting to database...');

        // Dynamic import for ESM controllers
        const dashboardController = await import('./src/controllers/v1/dashboard.controller.js');
        const expenditureController = await import('./src/controllers/v1/expenditure.controller.js');

        if (!sequelize) {
            console.error('Sequelize not loaded');
            return;
        }

        const principal = await User.findOne({ where: { role: 'principal' } });
        if (!principal) {
            console.log('⚠️ No principal found. Skipping test.');
            return;
        }
        console.log(`👨‍🏫 Testing as Principal: ${principal.email}`);

        // 2. Test Dashboard Summary
        console.log('\n📊 Testing Dashboard Expenditure Summary...');
        let req = mockReq(principal);
        let res = mockRes();

        try {
            await dashboardController.getExpenditureSummary(req, res);

            let stats = res.body.data && res.body.data.stats;

            if (stats && stats.totalAmount === 0 && stats.totalCount === 0) {
                console.log('✅ Dashboard Summary Hidden (Zeroed out)');
            } else {
                console.error('❌ Dashboard Summary NOT Hidden:', JSON.stringify(res.body, null, 2));
            }
        } catch (e) {
            console.error('Error testing dashboard:', e);
        }

        // 3. Test Get All Expenditures
        console.log('\n📋 Testing Get All Expenditures...');
        res = mockRes();
        try {
            await expenditureController.getAllExpenditures(req, res);

            if (res.body.items && Array.isArray(res.body.items) && res.body.items.length === 0 && res.body.total === 0) {
                console.log('✅ Expenditure List Hidden (Empty Array)');
            } else {
                console.error('❌ Expenditure List NOT Hidden:', JSON.stringify(res.body, null, 2));
            }
        } catch (e) {
            console.error('Error testing list:', e);
        }

        // 4. Test Get Expenditure Stats
        console.log('\n📈 Testing Get Expenditure Stats...');
        res = mockRes();

        if (expenditureController.getExpenditureStats) {
            try {
                await expenditureController.getExpenditureStats(req, res);

                if (res.statusCode === 403) {
                    console.log('✅ Expenditure Stats Access Denied (403)');
                } else {
                    console.error('❌ Expenditure Stats Access Allowed:', res.statusCode);
                }
            } catch (e) {
                console.error('Error testing stats:', e);
            }
        } else {
            console.log('⚠️ getExpenditureStats not found in controller exports');
        }

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        process.exit(0);
    }
}

testExpenditureRestrictions();
