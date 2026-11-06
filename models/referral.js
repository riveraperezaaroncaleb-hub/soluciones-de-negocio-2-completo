'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Referral extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Referral.belongsTo(models.Usuario, {
        foreignKey: 'referidorId',
        as: 'referidor',
      });
      Referral.belongsTo(models.Usuario, {
        foreignKey: 'referidoId',
        as: 'referido',
      });
      Referral.belongsTo(models.Barbershop, {
        foreignKey: 'barbershopId',
        as: 'barbershop',
      });
    }
  }
  Referral.init({
    referidorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    referidoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    barbershopId: DataTypes.INTEGER,
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pendiente',
      validate: { isIn: [['pendiente', 'aceptada', 'completada', 'rechazada']] },
    },
    recompensa: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 },
    },
  }, {
    sequelize,
    modelName: 'Referral',
  });
  return Referral;
};