'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  // Create MDAs table
  await queryInterface.createTable('Mdas', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    code: {
      type: Sequelize.STRING(10),
      allowNull: false,
      unique: true,
    },
    type: {
      type: Sequelize.ENUM('ministry', 'department', 'agency'),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    email: {
      type: Sequelize.STRING,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: Sequelize.STRING(20),
    },
    address: {
      type: Sequelize.TEXT,
    },
    website: {
      type: Sequelize.STRING,
    },
    logo_url: {
      type: Sequelize.STRING,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    parent_ministry_id: {
      type: Sequelize.UUID,
      references: {
        model: 'Mdas',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    deleted_at: {
      type: Sequelize.DATE,
    },
  });

  // Create Users table
  await queryInterface.createTable('Users', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    first_name: {
      type: Sequelize.STRING,
    },
    last_name: {
      type: Sequelize.STRING,
    },
    phone: {
      type: Sequelize.STRING(20),
    },
    role: {
      type: Sequelize.ENUM('admin', 'account_officer', 'permanent_secretary', 'auditor'),
      allowNull: false,
      defaultValue: 'account_officer',
    },
    mda_id: {
      type: Sequelize.UUID,
      references: {
        model: 'Mdas',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    last_login_at: {
      type: Sequelize.DATE,
    },
    reset_password_token: {
      type: Sequelize.STRING,
    },
    reset_password_expires: {
      type: Sequelize.DATE,
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    deleted_at: {
      type: Sequelize.DATE,
    },
  });

  // Create other tables...
  // (Add other table creation code here)
},

  down: async (queryInterface, Sequelize) => {
  await queryInterface.dropAllTables();
}
};
