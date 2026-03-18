const { Permission } = require('./backend/models');

async function checkPermissions() {
  try {
    const perms = await Permission.findAll({
      attributes: ['id', 'name', 'code', 'module'],
      order: [['code', 'ASC'], ['id', 'ASC']]
    });
    
    console.log('--- Current Permissions ---');
    perms.forEach(p => {
      console.log(`ID: ${p.id} | Code: ${p.code.padEnd(25)} | Name: ${p.name}`);
    });
    
    const codes = perms.map(p => p.code);
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n--- Duplicate Codes Found ---');
      [...new Set(duplicates)].forEach(code => {
        const count = codes.filter(c => c === code).length;
        console.log(`Code: ${code} | Count: ${count}`);
      });
    } else {
      console.log('\nNo duplicate codes found in the Permissions table.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking permissions:', err);
    process.exit(1);
  }
}

checkPermissions();
