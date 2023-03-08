"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class appoitment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static getAppointmentList(id) {
      return this.findAll({
        where: {
          userId: id,
        },
        order: [["id", "ASC"]],
      });
    }
    static getCompletedAppointment(id) {
      return this.findAll({
        where: {
          userId: id,
          Status: true,
        },
        order: [["id", "ASC"]],
      });
    }
    static removeAppointment(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }
    UpdateAppointment(Status) {
      return this.update({
        Status,
      });
    }
  }
  appoitment.init(
    {
      Title: DataTypes.STRING,
      userId: DataTypes.INTEGER,
      Starting: DataTypes.STRING,
      Ending: DataTypes.STRING,
      Status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      Appintment_Date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: Date.now(),
      },
    },
    {
      sequelize,
      modelName: "appointment",
    }
  );
  return appoitment;
};
