'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Service.belongsTo(models.Barbershop, {
        foreignKey: 'barbershopId',
        as: 'barbershop',
      });
      Service.hasMany(models.Appointment, {
        foreignKey: 'serviceId',
        as: 'appointments',
      });
    }
  }
  Service.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: DataTypes.TEXT,
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    duracionMinutos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    barbershopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};