import { Model } from 'sequelize';

export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  class BudgetVersion extends Model {
    static associate(models) {
      // Relationship with Budget
      BudgetVersion.belongsTo(models.Budget, {
        foreignKey: 'budgetId',
        as: 'budget',
        onDelete: 'CASCADE', // Delete versions when budget is deleted
        onUpdate: 'CASCADE'
      });

      // Relationship with User who created this version
      BudgetVersion.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      // Relationship with User who submitted this version
      BudgetVersion.belongsTo(models.User, {
        foreignKey: 'submittedBy',
        as: 'submitter',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });

      // Relationship with User who approved this version
      BudgetVersion.belongsTo(models.User, {
        foreignKey: 'approvedBy',
        as: 'approver',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });

      // Relationship with User who rejected this version
      BudgetVersion.belongsTo(models.User, {
        foreignKey: 'rejectedBy',
        as: 'rejector',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }

    // Class method to create a new version from an existing budget
    static async createVersion(budget, userId, options = {}) {
      const transaction = options.transaction || await sequelize.transaction();
      
      try {
        // Get the latest version number
        const latestVersion = await this.findOne({
          where: { budgetId: budget.id },
          order: [['version', 'DESC']],
          transaction,
        });

        const versionNumber = latestVersion ? latestVersion.version + 1 : 1;

        // Create the version record
        const version = await this.create(
          {
            budgetId: budget.id,
            version: versionNumber,
            status: 'draft',
            isCurrent: false, // Will be set to true after successful save
            createdBy: userId,
          },
          { transaction }
        );

        if (!options.transaction) {
          await transaction.commit();
        }
        
        return version;
      } catch (error) {
        if (!options.transaction) {
          await transaction.rollback();
        }
        throw error;
      }
    }
  }

  BudgetVersion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'draft',
          'submitted',
          'under_review',
          'approved',
          'rejected',
          'archived'
        ),
        defaultValue: 'draft',
        allowNull: false,
      },
      isCurrent: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      changes: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Track changes from previous version',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      budgetId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'budgets',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      submittedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      rejectedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the version was submitted for approval'
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the version was approved'
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the version was rejected'
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for rejection if applicable'
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'BudgetVersion',
      tableName: 'budget_versions',
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['budget_id'] },
        { fields: ['version'] },
        { fields: ['status'] },
        { fields: ['is_current'] },
        { fields: ['created_by'] },
        { fields: ['submitted_by'] },
        { fields: ['approved_by'] }
      ],
    }
  );

  // Add a hook to ensure only one current version per budget
  BudgetVersion.beforeSave(async (version, options) => {
    if (version.isCurrent) {
      // Find and update any other current versions for this budget
      await BudgetVersion.update(
        { isCurrent: false },
        {
          where: {
            budgetId: version.budgetId,
            id: { [sequelize.Sequelize.Op.ne]: version.id },
            isCurrent: true,
          },
          transaction: options.transaction,
        }
      );
    }
  });

  return BudgetVersion;
};