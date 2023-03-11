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
    static getAppointmentList(id, today) {
      return this.findAll({
        where: {
          userId: id,
          Appointment_Date: today,
        },
        order: [["Starting", "ASC"]],
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
    static getTime(Starting, userId) {
      return this.findAll({
        where: {
          Starting,
          userId,
        },
      });
    }
    static getEndTime(Ending, userId) {
      return this.findAll({
        where: {
          Ending,
          userId,
        },
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
    UpdateTitle(Title, id) {
      return this.update({
        Title,
        where: {
          id,
        },
      });
    }
  }
  appoitment.init(
    {
      Title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: DataTypes.INTEGER,
      Starting: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      Ending: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      Status: DataTypes.BOOLEAN,
      Appointment_Date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "appoitment",
    }
  );
  return appoitment;
};
