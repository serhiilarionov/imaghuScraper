'use strict';
var Promise = require('bluebird');

module.exports = function(sequelize, DataTypes) {
  var Sources = sequelize.define('Sources', {
      title: { type: DataTypes.TEXT, allowNull: false },
      tags: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      spout: { type: DataTypes.TEXT, allowNull: false },
      params: { type: DataTypes.TEXT, allowNull: false },
      error: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      lastextract: { type: DataTypes.DATE, allowNull: true, defaultValue: null }
    },
    {
      tableName: 'sources',
      timestamps: false
    },
    {
      classMethods: {

      }
    });

  Sources.getSources = function(){
    return new Promise(function(resolve, reject){
      sequelize.query('SELECT "id", "params", "lastextract" FROM "sources"')
        .then(function(data) {
          resolve(data);
        })
        .catch(function(err) {
          reject(err);
        });
    });
  };
  return Sources;
};