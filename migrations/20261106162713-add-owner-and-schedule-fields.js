'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Usuarios', 'telefono', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addIndex('Usuarios', ['telefono'], {
      unique: true,
      name: 'usuarios_telefono_unique',
    });
    await queryInterface.addColumn('Usuarios', 'passwordHash', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Barbershops', 'ownerId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Usuarios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('Barbershops', 'horarios', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Barbershops', 'horarios');
    await queryInterface.removeColumn('Barbershops', 'ownerId');
    await queryInterface.removeColumn('Usuarios', 'passwordHash');
    await queryInterface.removeIndex('Usuarios', 'usuarios_telefono_unique');
    await queryInterface.removeColumn('Usuarios', 'telefono');
  }
};
