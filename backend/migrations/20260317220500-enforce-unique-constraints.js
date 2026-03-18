'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add unique constraint to Roles.slug if not exists
    // Using raw query to be safe with existing data check (though we just cleaned it)
    await queryInterface.sequelize.query(`
      ALTER TABLE "Roles" DROP CONSTRAINT IF EXISTS "Roles_slug_key";
      ALTER TABLE "Roles" ADD CONSTRAINT "Roles_slug_key" UNIQUE (slug);
    `);

    // Add unique constraint to Permissions.code if not exists
    await queryInterface.sequelize.query(`
      ALTER TABLE "Permissions" DROP CONSTRAINT IF EXISTS "Permissions_code_key";
      ALTER TABLE "Permissions" ADD CONSTRAINT "Permissions_code_key" UNIQUE (code);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Roles" DROP CONSTRAINT IF EXISTS "Roles_slug_key";
      ALTER TABLE "Permissions" DROP CONSTRAINT IF EXISTS "Permissions_code_key";
    `);
  }
};
