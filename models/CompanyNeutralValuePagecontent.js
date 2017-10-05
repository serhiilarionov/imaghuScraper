'use strict';
var Promise = require('bluebird');

module.exports = function(sequelize, DataTypes) {
  var CompanyNeutralValuePagecontent = sequelize.define('CompanyNeutralValuePagecontent', {
      datetime: { type: DataTypes.DATE, allowNull: false },
      itemid: { type: DataTypes.INTEGER, allowNull: false },
      new_source: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      ticker: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      keyword: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      sentiment_word: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      sentiment_value: { type: DataTypes.STRING, allowNull: true, defaultValue: null }
    },
    {
      tableName: 'company_neutral_value_pagecontent',
      timestamps: false
    },
    {
      classMethods: {

      }
    });

  CompanyNeutralValuePagecontent.addCompanyNeutralValuePagecontent = function(){
    return new Promise(function(resolve, reject){
      sequelize.query('select * from sentiment_company()')
        .then(function(res) {
          resolve(true);
        })
        .error(function(err) {
          reject(err);
        });
    });
  };
  return CompanyNeutralValuePagecontent;
};