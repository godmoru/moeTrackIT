
const { Sequelize } = require('sequelize');
const config = require('./config/config.json')['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: false,
});

async function fix() {
    const t = await sequelize.transaction();
    try {
        // 1. Update Workshop Fee (WKF -> WF)
        const [wfUpdated] = await sequelize.query(`
      UPDATE "IncomeSources" 
      SET code = 'WF', name = 'Workshop Fee', recurrence = 'termly', "updatedAt" = NOW()
      WHERE code = 'WKF'
    `, { transaction: t });
        console.log(`Updated Workshop Fee: ${wfUpdated.rowCount || 0} rows`);

        // 2. Update IT Infrastructure (ITIF -> ITI) - Fixing typo 'Infrastruture' too
        const [itiUpdated] = await sequelize.query(`
      UPDATE "IncomeSources" 
      SET code = 'ITI', name = 'IT Infrastructure', recurrence = 'termly', "updatedAt" = NOW()
      WHERE code = 'ITIF'
    `, { transaction: t });
        console.log(`Updated IT Infrastructure: ${itiUpdated.rowCount || 0} rows`);

        // 3. Ensure Sport Levy is correct (SL)
        const [slUpdated] = await sequelize.query(`
        UPDATE "IncomeSources"
        SET code = 'SL', name = 'Sport Levy', recurrence = 'termly', "updatedAt" = NOW()
        WHERE code = 'SL'
    `, { transaction: t });
        // This might already be correct from previous steps, but good to be safe.

        await t.commit();
        console.log("Successfully updated Income Source codes.");
    } catch (error) {
        await t.rollback();
        console.error('Error updating codes:', error);
    } finally {
        await sequelize.close();
    }
}

fix();
