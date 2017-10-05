var Q = require('q')
, FeedParser = require('feedparser')
, es = require('event-stream')
, request = require('request')
, express = require('express')
, moment = require('moment')
, db = require('../models/index')
, router = express.Router()
, Promise = require('bluebird')
, async = require('async');



router.get('/', function(req, res, next) {
  var IsJsonString = function(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };
  var ReadRss = function (source) {
    var deferred = Q.defer();
    var result = [];
    var Entities = require('html-entities').AllHtmlEntities;
    var entities = new Entities();
    var url = entities.decode(source.params);
    if(IsJsonString(url))
      url = JSON.parse(url).url.replace(/\\/g, "");

    request(url, {jar: true})
      .on('error', function (error) {
        deferred.reject({id: source.id, error: error.message});
      })
      .pipe(es.through(function (data) {
        this.emit('data', data);
        this.setMaxListeners(20);
      }))
      .pipe(new FeedParser())
      .on('error', function (error) {
        deferred.reject({id: source.id, error: error.message});
      })
      .on('readable', function () {
        var stream = this, item;

        while (item = stream.read()) {
          var date = moment(item.date).format('D MM YYYY, h:mm:ss');
          if(source.lastupdate == null)
            source.lastupdate = 0;
          var lastupdate = moment(source.lastupdate).format('D MM YYYY, h:mm:ss');

          if(lastupdate.valueOf() < date.valueOf()) {
            result.push(item);
          }
        }

      })
      .on('end', function () {
        deferred.resolve(result);
      });
    return deferred.promise;

  };

  var getDate = function (date) {
    var month = date.getMonth() + 1;
    if (month < 10)
      month = '0' + month;
    var day = date.getDate();
    if (day < 10)
      day = '0' + day;
    return date.getFullYear() + "-" + month + "-" + day + " "
    + date.getHours() + ":" + date.getMinutes();
  };

  db.Sources.getSources().then(function (sources) {
    var portions = [];
    while (sources[0].length > 0) {
      portions.push(sources[0].splice(0, 10));
    }
    async.eachSeries(portions, function (portion, cb) {
      var portionPromises = [];
      portion.forEach(function (source) {
        async.waterfall([
          function (cb) {
            ReadRss(source).then(function (results) {
              var items = [];
              results.forEach(function (result) {
                var date = getDate(result.date);
                var now = getDate(new Date());
                items.push({
                  datetime: date,
                  title: result.title,
                  content: result.description,
                  icon: result.meta.favicon,
                  unread: true,
                  starred: false,
                  source: source.id,
                  uid: result.guid,
                  link: result.link,
                  updatetime: now,
                  author: result.author
                });
              });
              var promises = [];

              items.forEach(function (item) {
                promises.push(new Promise(function (resolve, reject) {
                  db.Items.findOrCreate({
                    where: {
                      uid: item.uid,
                      link: item.link
                    },
                    defaults: item
                  })
                    .then(function (item) {
                      var date = getDate(item[0].dataValues.datetime);
                      db.Sources.update({lastextract: date},
                        {
                          where: {
                            id: item[0].dataValues.source
                          }
                        })
                        .catch(function (err) {
                          console.error(err)
                        });
                    })
                    .catch(function (err) {
                      var error = "";
                      if(err.errors == undefined) {
                        error = err.message;
                      }
                      else {
                        err.errors.forEach(function (e) {
                          error += e.message + "\n";
                        });
                      }
                      db.Sources.update({error: error},
                        {
                          where: {
                            id: source.id
                          }
                        })
                        .catch(function (err) {
                          console.error(err)
                        });
                    });
                }));
              });
              Promise.all(promises)
                .catch(function (err) {
                  console.error(err);
                });
            })
              .catch(function (err) {
                db.Sources.update({error: err.error},
                  {
                    where: {
                      id: err.id
                    }
                  })
                  .catch(function (err) {
                    console.error(err);
                  });
              })
          }
        ], function (err) {
          if (err) {
            console.error(err);
          }
        });
      });
      Promise.all(portionPromises)
        .then(function (res) {
          return cb();
        })
        .catch(function (err) {
          return cb(err);
        });
    }, function (err) {
      if (err) {
        console.error(err);
      }
    });
    return res.status(200).send();
  });
});
module.exports = router;