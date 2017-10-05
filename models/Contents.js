'use strict';
var util = require('util');

module.exports = function(sequelize, DataTypes) {
  var Contents = sequelize.define('Contents', {
      itemid: { type: DataTypes.INTEGER, allowNull: false },
      pagecontent: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      checked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    },
    {
      tableName: 'contents',
      timestamps: false,
      classMethods: {
        getSearchVector: function () {
          return 'pageContentVector';
        },

        sentiment_company: function(){
          if (sequelize.options.dialect !== 'postgres') {
            console.warn('Not creating search index, must be using POSTGRES to do this');
            return;
          }

          return sequelize
            .query('CREATE OR REPLACE FUNCTION sentiment_company() RETURNS SETOF boolean AS \' ' +
            'DECLARE ' +
              'companies company; ' +
              'sentiments sentiment; ' +
              'content contents; ' +
            'datetime DATE; ' +
            'new_source TEXT; ' +
            'BEGIN ' +
              'FOR content in SELECT * FROM contents WHERE contents.checked = false limit 150 ' +
                'LOOP ' +
                  'FOR companies IN SELECT * FROM company ' +
                    'LOOP ' +
                      'IF content."pageContentVector" @@ plainto_tsquery(\'\'english\'\', companies."KEYWORD") THEN ' +
                        'FOR sentiments IN SELECT * FROM "sentiment" ' +
                          'LOOP ' +
                            'IF content."pageContentVector" @@ plainto_tsquery(\'\'english\'\', sentiments."SENTIMENT_WORD") THEN ' +
                                'SELECT into datetime, new_source items.datetime, sources.tags FROM items ' +
                                  'left join sources on items.source = sources.id ' +
                                  'WHERE items.id = content.itemid; ' +
                                'INSERT INTO "company_neutral_value_pagecontent"' +
                                  '(datetime, itemid, new_source, ticker, keyword, sentiment_word, sentiment_value) ' +
                                  'VALUES (datetime, content.itemid, new_source, companies."TICKER", ' +
                                    'companies."KEYWORD", sentiments."SENTIMENT_WORD", sentiments."SENTIMENT_VALUE"); ' +
                            'END IF; ' +
                          'END LOOP; ' +
                        'END IF; ' +
                    'END LOOP; ' +
                  'UPDATE contents SET checked = true WHERE contents.id = content.id; ' +
                'END LOOP; ' +
              'RETURN NEXT true; ' +
            'END; ' +
            '\' LANGUAGE plpgsql;')
            .error(console.warn);
        },

        addFullTextIndex: function () {
          if (sequelize.options.dialect !== 'postgres') {
            console.warn('Not creating search index, must be using POSTGRES to do this');
            return;
          }

          var Contents = this;

          var vectorName = Contents.getSearchVector();
          sequelize
            .query('ALTER TABLE "' + Contents.tableName + '" ADD COLUMN "' + vectorName + '" TSVECTOR')
            .then(function () {
              return sequelize
                .query('CREATE INDEX page_content_search_index ON "' + Contents.tableName + '" USING gin("' + vectorName + '");')
                .error(console.warn);
            })
            .then(function () {
              return sequelize
                .query('CREATE OR REPLACE FUNCTION page_content_trigger() RETURNS trigger AS $$' +
                'begin ' +
                'new."pageContentVector":=' +
                'to_tsvector(\'pg_catalog.english\', coalesce(new.pagecontent,\'\'));' +
                'return new;' +
                'end ' +
                '$$ LANGUAGE plpgsql;')
                .error(console.warn);
            })
            .then(function () {
              return sequelize
                .query('CREATE TRIGGER page_content_vector_update BEFORE INSERT OR UPDATE ON "' + Contents.tableName + '" FOR EACH ROW EXECUTE PROCEDURE page_content_trigger()')
                .error(console.warn);
            })
            .catch(console.warn);
        },

        checkForDuplicates: function (position) {

          var Contents = this;

          var query = 'SELECT contents.id, ' +
            'contents."itemid", ' +
            'contents."checked" ' +
            //'ts_rank(\'{0.1, 0.2, 0.4, 1.0}\',"pageContentVector", q) as rank ' +
            'FROM "contents", ' +
            'plainto_tsquery(\'english\', %s) q ' +
            'WHERE "pageContentVector" @@ q ' +
            'ORDER BY rank DESC;';

          var queryParams = position.pagecontent,
            positionUrl = position.positionUrl,
            location = position.location;

          queryParams = sequelize.getQueryInterface().escape(queryParams);
          positionUrl = sequelize.getQueryInterface().escape(positionUrl);
          location = sequelize.getQueryInterface().escape(location);

          query = util.format(query, queryParams, location, positionUrl);

          return sequelize.query(query, Contents);
        },
        search: function(query) {
          if(sequelize.options.dialect !== 'postgres') {
            console.log('Search is only implemented on POSTGRES database');
            return;
          }

          var Contents = this;

          query = sequelize.getQueryInterface().escape(query);
          console.log(query);

          return sequelize
            .query('SELECT * FROM "' + Contents.tableName + '" WHERE "' + Contents.getSearchVector() + '" @@ plainto_tsquery(\'english\', ' + query + ')', Contents);
        }
      }
    });
  return Contents;
};
