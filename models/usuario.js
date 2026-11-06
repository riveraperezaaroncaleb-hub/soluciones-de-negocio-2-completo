'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Usuario.hasMany(models.Appointment, {
        foreignKey: 'usuarioId',
        as: 'appointments',
      });
      Usuario.hasMany(models.Subscription, {
        foreignKey: 'usuarioId',
        as: 'subscriptions',
      });
      Usuario.hasMany(models.Referral, {
        foreignKey: 'referidorId',
        as: 'referralsHechos',
      });
      Usuario.hasMany(models.Referral, {
        foreignKey: 'referidoId',
        as: 'referralsRecibidos',
      });
      Usuario.hasMany(models.Barbershop, {
        foreignKey: 'ownerId',
        as: 'barbershops',
      });
    }
  }
  Usuario.init({
    nombre: DataTypes.STRING,
    edad: DataTypes.INTEGER,
    telefono: {
      type: DataTypes.STRING,
      unique: true,
    },
    passwordHash: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Usuario',
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
  });
  return Usuario;
};