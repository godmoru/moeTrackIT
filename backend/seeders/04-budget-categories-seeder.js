import { v4 as uuidv4 } from 'uuid';

export default {
  async up(queryInterface, Sequelize) {
    const categories = [
      {
        id: uuidv4(),
        name: 'Personnel Costs',
        code: 'PC',
        description: 'Salaries, wages, and benefits for employees',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Office Supplies',
        code: 'OS',
        description: 'Office stationery and supplies',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Travel & Transportation',
        code: 'TT',
        description: 'Local and international travel expenses',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Training & Development',
        code: 'TD',
        description: 'Staff training and capacity building',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Maintenance',
        code: 'MT',
        description: 'Equipment and facility maintenance',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Utilities',
        code: 'UT',
        description: 'Electricity, water, internet, and other utilities',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Capital Expenditure',
        code: 'CAPEX',
        description: 'Purchase of fixed assets and equipment',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Consultancy Services',
        code: 'CS',
        description: 'Professional and consultancy services',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Grants & Contributions',
        code: 'GC',
        description: 'Grants and contributions to other organizations',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Other Expenses',
        code: 'OE',
        description: 'Miscellaneous expenses not covered by other categories',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('BudgetCategories', categories, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('BudgetCategories', null, {});
  }
};
