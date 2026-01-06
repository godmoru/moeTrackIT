/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  await queryInterface.createTable('ExpenditureRetirements', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    expenditureId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Expenditures',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      unique: true // One retirement per expenditure
    },
    retirementNumber: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    retirementDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    status: {
      type: Sequelize.ENUM(
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'completed'
      ),
      defaultValue: 'draft'
    },
    amountRetired: {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false
    },
    balanceUnretired: {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    purpose: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    remarks: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    rejectionReason: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    reviewedBy: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    reviewedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    approvedBy: {
      type: Sequelize.UUID,
      allowNull: true,
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
      allowNull: true,
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

  // Add indexes for better query performance
  // await queryInterface.addIndex('ExpenditureRetirements', ['retirementNumber'], { unique: true });
  // await queryInterface.addIndex('ExpenditureRetirements', ['expenditureId'], { unique: true });
  // await queryInterface.addIndex('ExpenditureRetirements', ['status']);
},

  down: async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('ExpenditureRetirements');
}
};
