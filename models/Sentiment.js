'use strict';
module.exports = function(sequelize, DataTypes) {
  var Sentiment = sequelize.define('Sentiment', {
      SENTIMENT_WORD: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      SENTIMENT_VALUE: { type: DataTypes.STRING, allowNull: true, defaultValue: null }
    },
    {
      tableName: 'sentiment',
      timestamps: false
    },
    {
      classMethods: {}
    });
  return Sentiment;
};