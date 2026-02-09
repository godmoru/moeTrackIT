
const { Sequelize } = require('sequelize');
const config = require('./config/config.json')['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: false,
});

async function check() {
    try {
        const [results] = await sequelize.query("SELECT * FROM \"IncomeSources\"");
        console.log("Income Sources:", results.map(r => `${r.name} (${r.code})`));

        const [params] = await sequelize.query("SELECT * FROM \"IncomeSourceParameters\"");
        console.log("Parameters Keys:", params.map(p => p.key));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

check();
