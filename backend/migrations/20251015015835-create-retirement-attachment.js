/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  await queryInterface.createTable('RetirementAttachments', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    retirementId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ExpenditureRetirements',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    fileName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    filePath: {
      type: Sequelize.STRING,
      allowNull: false
    },
    fileType: {
      type: Sequelize.STRING,
      allowNull: false
    },
    fileSize: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true
    },
    documentType: {
      type: Sequelize.ENUM(
        'receipt',
        'invoice',
        'delivery_note',
        'waybill',
        'payment_proof',
        'other'
      ),
      allowNull: false,
      defaultValue: 'other'
    },
    amount: {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: true,
      comment: 'Amount associated with this specific document'
    },
    uploadedBy: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    verifiedBy: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    verifiedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    verificationNotes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  });

  // Add indexes for better query performance
  // await queryInterface.addIndex('RetirementAttachments', ['retirementId']);
  // await queryInterface.addIndex('RetirementAttachments', ['documentType']);
  // await queryInterface.addIndex('RetirementAttachments', ['verified']);
},

  down: async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('RetirementAttachments');
}
};
