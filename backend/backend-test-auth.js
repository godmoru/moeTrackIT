const { User, sequelize } = require('./src/models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
    try {
        const user = await User.findOne({ where: { email: 'superadmin@moekm.be.gov.ng' }});
        if (!user) {
             console.log("No superadmin found");
             return;
        }
        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });
        
        const axios = require('axios');
        const res = await axios.post('http://localhost:5000/api/v1/payments/remita/initialize', {
            assessmentId: 1, // Will likely 404 but we might see where it errors
            amount: 1000,
            email: 'test@example.com',
            name: 'Test Payer',
            phone: '08012345678'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(res.data);
    } catch (e) {
        if (e.response) {
            console.error("HTTP ERROR", e.response.status, e.response.data);
        } else {
             console.error("OTHER ERROR", e);
        }
    } finally {
        await sequelize.close();
    }
}
run();
