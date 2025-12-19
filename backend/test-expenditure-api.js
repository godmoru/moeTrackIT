/**
 * Quick Backend Test Script
 * Tests the expenditure tracking API endpoints
 * 
 * Usage: node test-expenditure-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';

// Test data
const testData = {
    user: {
        email: 'admin@example.com',
        password: 'password123'
    },
    lineItem: {
        code: 'TEST-001',
        name: 'Test Budget Line Item',
        description: 'Test line item for API verification',
        budgetId: 1, // Update with actual budget ID
        mdaId: '00000000-0000-0000-0000-000000000001', // Update with actual MDA ID
        category: 'overhead',
        amount: 1000000,
        fiscalYear: 2025,
        quarter: 'Q1'
    },
    expenditure: {
        budgetLineItemId: null, // Will be set after creating line item
        mdaId: '00000000-0000-0000-0000-000000000001',
        amount: 50000,
        description: 'Test expenditure for API verification',
        beneficiaryName: 'Test Vendor',
        beneficiaryAccountNumber: '1234567890',
        beneficiaryBank: 'Test Bank'
    }
};

// Helper function to make authenticated requests
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(config => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

async function runTests() {
    console.log('🧪 Starting Expenditure Tracking API Tests\n');

    try {
        // Test 1: Authentication
        console.log('1️⃣  Testing Authentication...');
        try {
            const authResponse = await axios.post(`${BASE_URL}/auth/login`, testData.user);
            authToken = authResponse.data.token;
            console.log('✅ Authentication successful\n');
        } catch (error) {
            console.log('⚠️  Authentication failed (expected if user doesn\'t exist)\n');
        }

        // Test 2: Create Budget Line Item
        console.log('2️⃣  Testing Budget Line Item Creation...');
        try {
            const lineItemResponse = await api.post('/line-items', testData.lineItem);
            const lineItem = lineItemResponse.data.data.lineItem;
            testData.expenditure.budgetLineItemId = lineItem.id;
            console.log(`✅ Line item created: ${lineItem.code} (ID: ${lineItem.id})`);
            console.log(`   Amount: ${lineItem.amount}, Balance: ${lineItem.balance}\n`);
        } catch (error) {
            console.log(`❌ Line item creation failed: ${error.response?.data?.message || error.message}\n`);
        }

        // Test 3: Get Line Item Utilization
        if (testData.expenditure.budgetLineItemId) {
            console.log('3️⃣  Testing Line Item Utilization Stats...');
            try {
                const statsResponse = await api.get(`/line-items/${testData.expenditure.budgetLineItemId}/utilization`);
                const stats = statsResponse.data.data.stats;
                console.log(`✅ Utilization: ${stats.utilizationPercentage.toFixed(2)}%`);
                console.log(`   Warning Status: ${stats.warningStatus.level}\n`);
            } catch (error) {
                console.log(`❌ Utilization stats failed: ${error.response?.data?.message || error.message}\n`);
            }
        }

        // Test 4: Create Expenditure
        if (testData.expenditure.budgetLineItemId) {
            console.log('4️⃣  Testing Expenditure Creation...');
            try {
                const expResponse = await api.post('/expenditures', testData.expenditure);
                const expenditure = expResponse.data.data.expenditure;
                console.log(`✅ Expenditure created: ${expenditure.referenceNumber}`);
                console.log(`   Amount: ${expenditure.amount}, Status: ${expenditure.status}\n`);

                // Test 5: Submit Expenditure
                console.log('5️⃣  Testing Expenditure Submission...');
                try {
                    const submitResponse = await api.post(`/expenditures/${expenditure.id}/submit`);
                    console.log(`✅ Expenditure submitted for approval\n`);

                    // Test 6: Approve Expenditure
                    console.log('6️⃣  Testing Expenditure Approval...');
                    try {
                        const approveResponse = await api.post(`/expenditures/${expenditure.id}/approve`);
                        console.log(`✅ Expenditure approved\n`);

                        // Test 7: Check Updated Balance
                        console.log('7️⃣  Testing Balance Update...');
                        const updatedStatsResponse = await api.get(`/line-items/${testData.expenditure.budgetLineItemId}/utilization`);
                        const updatedStats = updatedStatsResponse.data.data.stats;
                        console.log(`✅ Updated Balance: ${updatedStats.balance}`);
                        console.log(`   Updated Utilization: ${updatedStats.utilizationPercentage.toFixed(2)}%\n`);
                    } catch (error) {
                        console.log(`❌ Expenditure approval failed: ${error.response?.data?.message || error.message}\n`);
                    }
                } catch (error) {
                    console.log(`❌ Expenditure submission failed: ${error.response?.data?.message || error.message}\n`);
                }
            } catch (error) {
                console.log(`❌ Expenditure creation failed: ${error.response?.data?.message || error.message}\n`);
            }
        }

        // Test 8: Dashboard Data
        console.log('8️⃣  Testing Dashboard Endpoints...');
        try {
            const dashboardResponse = await api.get('/dashboard/budget-overview');
            console.log(`✅ Dashboard data retrieved successfully\n`);
        } catch (error) {
            console.log(`❌ Dashboard failed: ${error.response?.data?.message || error.message}\n`);
        }

        // Test 9: Early Warnings
        console.log('9️⃣  Testing Early Warning System...');
        try {
            const warningsResponse = await api.get('/dashboard/early-warnings');
            const warnings = warningsResponse.data.data.warnings;
            console.log(`✅ Early warnings retrieved: ${warnings.length} warnings found\n`);
        } catch (error) {
            console.log(`❌ Early warnings failed: ${error.response?.data?.message || error.message}\n`);
        }

        console.log('✨ Test suite completed!\n');
        console.log('📝 Note: Some tests may fail if:');
        console.log('   - Database is not migrated');
        console.log('   - Test user doesn\'t exist');
        console.log('   - Budget/MDA IDs need to be updated');
        console.log('   - Server is not running on port 3000\n');

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

// Run tests
runTests();
