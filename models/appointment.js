'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Appointment.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario',
      });
      Appointment.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service',
      });
    }
  }
  Appointment.init({
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fechaHora: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: { isDate: true },
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pendiente',
      validate: { isIn: [['pendiente', 'confirmada', 'completada', 'cancelada']] },
    },
    notas: DataTypes.TEXT,
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'Appointment',
  });
  return Appointment;
};