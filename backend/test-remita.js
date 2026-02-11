const { sequelize, User, Entity, Payment, Assessment, IncomeSource } = require('./models');
const paymentController = require('./src/controllers/paymentController');
const remitaService = require('./src/services/remitaService');

// Mock Remita Service
remitaService.initializePayment = async (data) => {
    console.log('🤖 Mock Remita Init:', data);
    return {
        rrr: '123456789012',
        status: '025',
        statusMessage: 'Payment Reference Generated',
        orderId: data.orderId
    };
};

remitaService.verifyPayment = async (rrr) => {
    console.log('🤖 Mock Remita Verify:', rrr);
    return {
        status: '00',
        message: 'Approved',
        rrr: rrr,
        amount: 5000,
        orderId: 'ORDER-' + rrr,
        transactionTime: new Date().toISOString(),
        raw: { status: '00', message: 'Approved' }
    };
};

// Mock Request/Response
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
    return res;
};

const mockReq = (user, body = {}, params = {}) => ({
    user,
    body,
    params
});

async function testRemitaFlow() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();

        // 1. Get a Principal User
        const principal = await User.findOne({
            where: { role: 'principal' },
            include: [{ model: Entity, as: 'entity' }]
        });

        if (!principal) {
            console.log('⚠️ No principal found. Skipping test.');
            return;
        }

        console.log(`👨‍🏫 Testing as Principal: ${principal.email}`);

        // 2. Find an assessment for this principal's entity
        const assessment = await Assessment.findOne({
            where: { entityId: principal.entityId },
            include: [{ model: Entity, as: 'entity' }]
        });

        if (!assessment) {
            console.log('⚠️ No assessment found for principal. Creating one...');
            // TODO: Create dummy assessment if needed, or skip
            return;
        }

        // 3. Initialize Payment
        console.log('\n🚀 Initializing Remita Payment...');
        const initReq = mockReq(principal, {
            assessmentId: assessment.id,
            amount: 5000,
            email: principal.email,
            name: principal.name
        });
        const initRes = mockRes();

        await paymentController.initializeRemitaPayment(initReq, initRes);

        if (initRes.statusCode !== 200) {
            console.error('❌ Init failed:', initRes.body);
            return;
        }

        const { paymentId, rrr, orderId } = initRes.body;
        console.log(`✅ Init Success! PaymentID: ${paymentId}, RRR: ${rrr}`);

        // 4. Verify Payment
        console.log(`\n🔍 Verifying Payment (RRR: ${rrr})...`);

        const verifyReq = mockReq(principal, {}, { rrr });
        const verifyRes = mockRes();

        await paymentController.verifyRemitaPayment(verifyReq, verifyRes);

        if (verifyRes.statusCode !== 200) {
            console.error('❌ Verify failed:', verifyRes.body);
        } else {
            console.log('✅ Verify Success:', verifyRes.body);
        }

        // 5. Check DB Status
        const payment = await Payment.findByPk(paymentId);
        console.log(`\n📄 Final Payment Status in DB: ${payment.status} (Method: ${payment.method})`);

        if (payment.status === 'confirmed' && payment.method === 'remita') {
            console.log('🎉 SUCCESS: Full Remita Flow Verified');
        } else {
            console.log('❌ FAILURE: Payment status mismatch');
        }

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await sequelize.close();
    }
}

testRemitaFlow();
