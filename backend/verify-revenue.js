const { sequelize, User, Entity, Payment, Assessment, IncomeSource } = require('./models');
const reportController = require('./src/controllers/reportController');

// Mock Response object
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    res.setHeader = (key, value) => {
        return res;
    };
    res.send = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

// Mock Request object
const mockReq = (user, query = {}, params = {}) => ({
    user,
    query,
    params
});

async function runVerification() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // 1. Fetch a real principal user to test with, or rely on a known ID if possible.
        // Better to fetch one from DB.
        const principalUser = await User.findOne({
            where: { role: 'principal' },
            include: [{ model: Entity, as: 'entity' }]
        });

        if (!principalUser) {
            console.log('⚠️ No principal user found. Skipping principal verification.');
        } else {
            console.log(`\n👨‍🏫 Testing as Principal: ${principalUser.email} (Entity ID: ${principalUser.entityId})`);

            const req = mockReq(principalUser);
            const res = mockRes();

            await reportController.summary(req, res);

            if (res.body) {
                console.log('📊 Summary Report Result:');
                console.log(`   Total Collected: ${res.body.totalCollected}`);
                // Verification: The total collected should match only payments for this entity.
                // Let's verify manually by querying DB
                const actualTotal = await Payment.sum('amountPaid', {
                    include: [{
                        model: Assessment,
                        as: 'assessment',
                        where: { entityId: principalUser.entityId }
                    }]
                });

                console.log(`   Expected Total (DB Query): ${actualTotal || 0}`);

                if (Number(res.body.totalCollected) === Number(actualTotal || 0)) {
                    console.log('✅ SUCCESS: Principal sees correct limited revenue.');
                } else {
                    console.log('❌ FAILURE: Principal sees mismatched revenue.');
                }
            } else {
                console.log('❌ Failed to get summary response');
            }
        }

        // 2. Fetch an AEO user
        const aeoUser = await User.findOne({
            where: { role: 'area_education_officer' },
            include: ['assignedLgas'] // Assuming association exists, or use userLga table manually if needed
        });

        if (!aeoUser) {
            console.log('\n⚠️ No AEO user found via standard query. Checking manually...');
            // Only if previous `include` fails or returns nothing, we might need to check how LGAs are assigned.
            // models/index.js didn't show loaded models, checking earlier files might help.
        } else {
            // Re-fetch with LGAs if necessary logic logic...
            // For now let's hope `assignedLgaIds` property logic in `scope.js` works (it uses `user.assignedLgaIds` which might be populated by middleware or prior login logic).
            // In `scope.js`, it checks `user.assignedLgaIds`. Typically this is populated during login (AuthController).
            // Since we are mocking `req.user`, we must populate `assignedLgaIds` manually if we want to test that path.

            // Let's fetch UserLga for this user
            const { UserLga } = require('./models');
            if (UserLga) {
                const lgaRecords = await UserLga.findAll({ where: { userId: aeoUser.id } });
                const assignedLgaIds = lgaRecords.map(r => r.lgaId);
                aeoUser.assignedLgaIds = assignedLgaIds;

                console.log(`\n👮 Testing as AEO: ${aeoUser.email} (Assigned LGAs: ${assignedLgaIds.join(', ')})`);

                const req = mockReq(aeoUser);
                const res = mockRes();

                await reportController.summary(req, res);

                if (res.body) {
                    console.log('📊 Summary Report Result:');
                    console.log(`   Total Collected: ${res.body.totalCollected}`);

                    // Verify against DB
                    const actualTotal = await Payment.sum('amountPaid', {
                        include: [{
                            model: Assessment,
                            as: 'assessment',
                            include: [{
                                model: Entity,
                                as: 'entity',
                                where: { lgaId: assignedLgaIds }
                            }]
                        }]
                    });

                    console.log(`   Expected Total (DB Query): ${actualTotal || 0}`);

                    if (Number(res.body.totalCollected) === Number(actualTotal || 0)) {
                        console.log('✅ SUCCESS: AEO sees correct limited revenue.');
                    } else {
                        console.log('❌ FAILURE: AEO sees mismatched revenue.');
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Verification failed with error:', error);
    } finally {
        await sequelize.close();
    }
}

runVerification();
