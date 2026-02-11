const { createUser } = require('../src/controllers/userController');
const { Lga, Entity, User } = require('../models');

// Mock request and response
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        res.body = null; // Default body to null
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

async function runVerification() {
    console.log('Starting Email Verification...');

    try {
        // 1. Create Regular Officer
        const officerEmail = `officer_${Date.now()}@test.com`;
        console.log(`Creating Officer: ${officerEmail}`);
        const reqOfficer = {
            body: {
                name: 'Test Officer',
                email: officerEmail,
                password: 'password123',
                role: 'officer',
            },
            user: { id: 1 }, // Mock admin user - assuming this might fail if ID 1 doesn't exist, but officer creation doesn't use assignedBy
        };
        const resOfficer = mockRes();
        await createUser(reqOfficer, resOfficer);
        console.log('Officer Creation Result:', resOfficer.statusCode, resOfficer.body);

        let adminUser = { id: 1 };
        if (resOfficer.statusCode === 201 && resOfficer.body && resOfficer.body.id) {
            adminUser = { id: resOfficer.body.id };
            console.log(`Using newly created Officer (ID: ${adminUser.id}) as Admin for subsequent requests.`);
        } else {
            console.warn('Failed to create Officer or retrieve ID. Using default ID 1 (might fail FK checks).');
            // Try to find ANY user to use
            const anyUser = await User.findOne();
            if (anyUser) {
                adminUser = { id: anyUser.id };
                console.log(`Fallback: Using existing User (ID: ${adminUser.id}) as Admin.`);
            }
        }

        // 2. Create AEO (Requires LGA)
        // Create a test LGA to ensure we have one
        const [lga] = await Lga.findOrCreate({
            where: { code: 'TEST_LGA' },
            defaults: { name: 'Test LGA', state: 'Benue', code: 'TEST_LGA' }
        });

        console.log('LGA Result:', lga ? JSON.stringify(lga.toJSON()) : 'null');

        if (lga) {
            const aeoEmail = `aeo_${Date.now()}@test.com`;
            console.log(`Creating AEO: ${aeoEmail} with LGA ID: ${lga.id}`);
            const reqAeo = {
                body: {
                    name: 'Test AEO',
                    email: aeoEmail,
                    password: 'password123',
                    role: 'area_education_officer',
                    lgaId: lga.id,
                },
                user: { id: adminUser.id },
            };
            const resAeo = mockRes();
            await createUser(reqAeo, resAeo);
            console.log('AEO Creation Result:', resAeo.statusCode, resAeo.body);
        } else {
            console.warn('Skipping AEO test: Could not create/find LGA');
        }

        // 3. Create Principal (Requires Entity)
        // Find an existing Entity or create one if needed
        const entity = await Entity.findOne();
        if (entity) {
            const principalEmail = `principal_${Date.now()}@test.com`;
            console.log(`Creating Principal: ${principalEmail} with Entity ID: ${entity.id}`);
            const reqPrincipal = {
                body: {
                    name: 'Test Principal',
                    email: principalEmail,
                    password: 'password123',
                    role: 'principal',
                    entityId: entity.id,
                },
                user: { id: adminUser.id },
            };
            const resPrincipal = mockRes();
            await createUser(reqPrincipal, resPrincipal);
            console.log('Principal Creation Result:', resPrincipal.statusCode, resPrincipal.body);
        } else {
            console.warn('Skipping Principal test: No Entity found via Entity.findOne()');
        }

        // Wait a bit for async file write (though fs.appendFile is fast)
        setTimeout(() => {
            console.log('Verification script completed. Please check backend/email.log for output.');
            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

runVerification();
