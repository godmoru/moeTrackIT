/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Attachments', {
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
        'approval',
        'invoice',
        'receipt',
        'payment_voucher',
        'delivery_note',
        'other'
      ),
      allowNull: false,
      defaultValue: 'other'
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
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Attachments');
};
