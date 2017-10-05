'use strict';
module.exports = function(sequelize, DataTypes) {
  var Tags = sequelize.define('Tags', {
      tag: { type: DataTypes.TEXT, allowNull: false },
      color: { type: DataTypes.STRING, allowNull: false }
    },
    {
      tableName: 'tags',
      timestamps: false
    },
    {
      classMethods: {}
    });
  return Tags;
};