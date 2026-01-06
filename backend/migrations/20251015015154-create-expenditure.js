/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Expenditures', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    budgetLineItemId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'BudgetLineItems',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    mdaId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Mdas',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    amount: {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    referenceNumber: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected'),
      defaultValue: 'draft'
    },
    approvedBy: {
      type: Sequelize.UUID,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    approvedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    rejectionReason: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    paymentVoucherNumber: {
      type: Sequelize.STRING,
      allowNull: true
    },
    paymentVoucherDate: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    paymentVoucherAmount: {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: true
    },
    paymentVoucherDescription: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    paymentDate: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    beneficiaryName: {
      type: Sequelize.STRING,
      allowNull: true
    },
    beneficiaryAccountNumber: {
      type: Sequelize.STRING,
      allowNull: true
    },
    beneficiaryBank: {
      type: Sequelize.STRING,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    updatedBy: {
      type: Sequelize.UUID,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });
},

  down: async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Expenditures');
}
};
