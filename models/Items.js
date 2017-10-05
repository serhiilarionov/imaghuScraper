'use strict';
var Promise = require('bluebird');

module.exports = function(sequelize, DataTypes) {
  var Items = sequelize.define('Items', {
      datetime: { type: DataTypes.DATE, allowNull: false },
      title: { type: DataTypes.TEXT, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      thumbnail: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      icon: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      unread: { type: DataTypes.BOOLEAN, allowNull: false },
      starred: { type: DataTypes.BOOLEAN, allowNull: false },
      source: { type: DataTypes.INTEGER, allowNull: false },
      uid: { type: DataTypes.STRING, allowNull: false },
      link: { type: DataTypes.TEXT, allowNull: false },
      updatetime: { type: DataTypes.DATE, allowNull: false },
      author: { type: DataTypes.STRING, allowNull: true, defaultValue: null }
    },
    {
      tableName: 'items',
      timestamps: false
    },
    {
      classMethods: {}
    });

  Items.getItems = function(){
    return new Promise(function(resolve, reject){
      sequelize.query('SELECT "id", "link" FROM "items" where unread = true')
        .then(function(data) {
          resolve(data);
        })
        .catch(function(err) {
          reject(err);
        });
    });
  };
  return Items;
};