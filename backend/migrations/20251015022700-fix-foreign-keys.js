/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  // This migration is not needed for MySQL as the foreign key is already set up correctly
  // in the create-user migration
},

  down: async (queryInterface, Sequelize) => {
  // No need to reverse this migration
}
};
