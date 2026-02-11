const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/v1'; // Using port 5001 to bypass stale server
const PASSWORD = 'Test@1234';

async function verifyRestrictions(role, email) {
    console.log(`\n🕵️‍♀️ Testing restrictions for role: ${role} (${email})`);

    let token;
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password: PASSWORD
        });
        token = res.data.token;
        console.log('✅ Login successful');
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return;
    }

    const api = axios.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    // 1. Dashboard Expenditure Summary
    try {
        const res = await api.get('/dashboard/expenditure-summary');
        const stats = res.data.data.stats;

        if (stats.totalAmount === 0 && stats.totalCount === 0) {
            console.log('✅ Dashboard Summary is ZEROED (Success)');
        } else {
            console.error('❌ Dashboard Summary shows data:', stats);
        }
    } catch (error) {
        console.error('❌ Failed to fetch dashboard summary:', error.response?.data || error.message);
    }

    // 2. Expenditure List
    try {
        const res = await api.get('/expenditures');
        const items = res.data.items || res.data.data?.items; // adjusting for potential structure

        if (Array.isArray(items) && items.length === 0) {
            console.log('✅ Expenditure List is EMPTY (Success)');
        } else {
            console.error('❌ Expenditure List shows data:', items ? items.length : res.data);
        }
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log('✅ Expenditure List access DENIED (403) (Success - Valid Restriction)');
        } else {
            console.error('❌ Failed to fetch expenditure list:', error.response?.data || error.message);
        }
    }

    // 3. Expenditure Stats (Controller check)
    try {
        await api.get('/expenditures/stats');
        console.error('❌ Expenditure Stats access ALLOWED (Fail) - Expected 403');
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log('✅ Expenditure Stats access DENIED (403) (Success)');
        } else {
            console.error('❌ Unexpected error fetching stats:', error.response?.status || error.message);
        }
    }
}

async function run() {
    await verifyRestrictions('Principal', 'principal-test@example.com');
    await verifyRestrictions('AEO', 'aeo-test@example.com');
}

run();
