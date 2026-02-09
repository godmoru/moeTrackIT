
const { Sequelize } = require('sequelize');
const config = require('./config/config.json')['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: false,
});

async function check() {
    try {
        const [results] = await sequelize.query(`
      SELECT s.name, p.key, p.label, p.required 
      FROM "IncomeSourceParameters" p
      JOIN "IncomeSources" s ON p."incomeSourceId" = s.id
      ORDER BY s.name, p.key
    `);
        console.table(results);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

check();
