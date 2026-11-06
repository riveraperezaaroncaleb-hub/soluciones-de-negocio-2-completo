'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Subscription.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario',
      });
      Subscription.belongsTo(models.Barbershop, {
        foreignKey: 'barbershopId',
        as: 'barbershop',
      });
    }
  }
  Subscription.init({
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    barbershopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fechaInicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fechaFin: DataTypes.DATEONLY,
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'activa',
      validate: { isIn: [['activa', 'cancelada', 'vencida', 'pendiente']] },
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
  }, {
    sequelize,
    modelName: 'Subscription',
  });
  return Subscription;
};