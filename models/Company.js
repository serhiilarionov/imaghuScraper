'use strict';
module.exports = function(sequelize, DataTypes) {
  var Company = sequelize.define('Company', {
      TICKER: { type: DataTypes.STRING, allowNull: true, defaultValue: null},
      KEYWORD: { type: DataTypes.STRING, allowNull: true, defaultValue: null}
    },
    {
      tableName: 'company',
      timestamps: false
    },
    {
      classMethods: {}
    });
  return Company;
};