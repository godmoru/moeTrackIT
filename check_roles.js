const { Role } = require('./backend/models');

async function checkRoles() {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'slug', 'isSystem'],
      order: [['slug', 'ASC'], ['id', 'ASC']]
    });
    
    console.log('--- Current Roles ---');
    roles.forEach(r => {
      console.log(`ID: ${r.id} | Slug: ${r.slug.padEnd(20)} | Name: ${r.name}`);
    });
    
    const slugs = roles.map(r => r.slug);
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n--- Duplicate Slugs Found ---');
      [...new Set(duplicates)].forEach(slug => {
        const count = slugs.filter(s => s === slug).length;
        console.log(`Slug: ${slug} | Count: ${count}`);
      });
    } else {
      console.log('\nNo duplicate slugs found in the Roles table.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking roles:', err);
    process.exit(1);
  }
}

checkRoles();
