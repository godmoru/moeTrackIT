const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminUser = await queryInterface.sequelize.query(
      "SELECT id FROM \"Users\" WHERE email = 'admin@edu.be.gov.ng' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const adminId = adminUser[0] ? adminUser[0].id : 1;

    const categories = [
      {
        reference: 'CAT-202501-0001',
        cat_name: 'Personnel Costs',
        description: 'Salaries, wages, and benefits for employees',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0002',
        cat_name: 'Office Supplies',
        description: 'Office stationery and supplies',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0003',
        cat_name: 'Travel & Transportation',
        description: 'Local and international travel expenses',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0004',
        cat_name: 'Training & Development',
        description: 'Staff training and capacity building',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0005',
        cat_name: 'Maintenance',
        description: 'Equipment and facility maintenance',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0006',
        cat_name: 'Utilities',
        description: 'Electricity, water, internet, and other utilities',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0007',
        cat_name: 'Capital Expenditure',
        description: 'Purchase of fixed assets and equipment',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0008',
        cat_name: 'Consultancy Services',
        description: 'Professional and consultancy services',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0009',
        cat_name: 'Grants & Contributions',
        description: 'Grants and contributions to other organizations',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reference: 'CAT-202501-0010',
        cat_name: 'Other Expenses',
        description: 'Miscellaneous expenses not covered by other categories',
        status: 'active',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('ExpenditureCategories', categories, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ExpenditureCategories', null, {});
  }
};
