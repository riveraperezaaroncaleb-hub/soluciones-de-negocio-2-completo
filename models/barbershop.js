'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Barbershop extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Barbershop.belongsTo(models.Usuario, {
        foreignKey: 'ownerId',
        as: 'owner',
      });
      Barbershop.hasMany(models.Service, {
        foreignKey: 'barbershopId',
        as: 'services',
      });
      Barbershop.hasMany(models.Subscription, {
        foreignKey: 'barbershopId',
        as: 'subscriptions',
      });
      Barbershop.hasMany(models.Referral, {
        foreignKey: 'barbershopId',
        as: 'referrals',
      });
    }
  }
  Barbershop.init({
    nombre: DataTypes.STRING,
    direccion: DataTypes.STRING,
    telefono: DataTypes.STRING,
    ownerId: DataTypes.INTEGER,
    horarios: DataTypes.JSON,
  }, {
    sequelize,
    modelName: 'Barbershop',
  });
  return Barbershop;
};