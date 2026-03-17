'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const mdaId = '00000000-0000-0000-0000-000000000001';

    // 1. Create a Budget for 2025
    await queryInterface.bulkInsert('Budgets', [{
      title: '2025 Approved Budget - Ministry of Education',
      fiscalYear: 2025,
      totalAmount: 5000000000.00,
      status: 'approved',
      description: 'Benue State Ministry of Education 2025 Fiscal Year Budget',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      createdBy: 1,
      createdAt: now,
      updatedAt: now
    }]);

    // Fetch the budget ID
    const [budgets] = await queryInterface.sequelize.query(
      `SELECT id FROM "Budgets" WHERE title = '2025 Approved Budget - Ministry of Education' LIMIT 1`
    );
    const bId = budgets[0].id;

    // 2. Create Budget Line Items
    const lineItems = [
      {
        budgetId: bId,
        code: '21010101',
        name: 'Salaries and Wages',
        amount: 2000000000.00,
        balance: 2000000000.00,
        category: 'personnel',
        fiscalYear: 2025,
        quarter: 'Q1',
        description: 'Monthly salaries for ministry headquarters staff',
        mdaId: mdaId,
        createdAt: now,
        updatedAt: now
      },
      {
        budgetId: bId,
        code: '22020101',
        name: 'Local Travel and Transport',
        amount: 50000000.00,
        balance: 50000000.00,
        category: 'overhead',
        fiscalYear: 2025,
        quarter: 'Q1',
        description: 'Local travel within state for school inspections',
        mdaId: mdaId,
        createdAt: now,
        updatedAt: now
      },
      {
        budgetId: bId,
        code: '22020301',
        name: 'Office Stationery and computer consumables',
        amount: 25000000.00,
        balance: 25000000.00,
        category: 'overhead',
        fiscalYear: 2025,
        quarter: 'Q1',
        description: 'Procurement of office supplies and printing materials',
        mdaId: mdaId,
        createdAt: now,
        updatedAt: now
      },
      {
        budgetId: bId,
        code: '23010101',
        name: 'Construction of New School Blocks',
        amount: 1500000000.00,
        balance: 1500000000.00,
        category: 'capital',
        fiscalYear: 2025,
        quarter: 'Q1',
        description: 'New school blocks across the state',
        mdaId: mdaId,
        createdAt: now,
        updatedAt: now
      },
      {
        budgetId: bId,
        code: '23010102',
        name: 'Renovation of Government Secondary Schools',
        amount: 800000000.00,
        balance: 800000000.00,
        category: 'capital',
        fiscalYear: 2025,
        quarter: 'Q1',
        description: 'Phase 1 renovation targeting top schools',
        mdaId: mdaId,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('BudgetLineItems', lineItems);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BudgetLineItems', null, {});
    await queryInterface.bulkDelete('Budgets', null, {});
  }
};
