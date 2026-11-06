'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const indexes = await queryInterface.showIndex('Referrals');
    for (const index of indexes) {
      const codeOnly = index.fields.length === 1 &&
        (index.fields[0].attribute === 'codigo' || index.fields[0].name === 'codigo');
      if (index.unique && codeOnly) {
        await queryInterface.removeIndex('Referrals', index.name);
      }
    }
    await queryInterface.changeColumn('Referrals', 'referidoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Usuarios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down (queryInterface, Sequelize) {
    const rows = await queryInterface.sequelize.query(
      'SELECT codigo, COUNT(*) AS total FROM `Referrals` GROUP BY codigo HAVING COUNT(*) > 1 OR SUM(referidoId IS NULL) > 0',
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (rows.length) {
      throw new Error('No se puede revertir: existen códigos reutilizados o referidos pendientes.');
    }
    await queryInterface.changeColumn('Referrals', 'referidoId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Usuarios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    await queryInterface.addIndex('Referrals', ['codigo'], {
      unique: true,
      name: 'referrals_codigo_unique',
    });
  }
};
