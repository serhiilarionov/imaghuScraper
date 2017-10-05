var Promise = require('bluebird')
, express = require('express')
, router = express.Router()
, cheerio = require("cheerio")
, request = require('request').defaults({maxRedirects:20})
, db = require('../models/index')
, async = require('async');


router.get('/', function(req, res, next) {
  db.Items.getItems().then(function (items) {
    var portions = [];
    while (items[0].length > 0) {
      portions.push(items[0].splice(0, 10));
    }
    async.eachSeries(portions, function (portion, cb) {
      var portionPromises = [];
      portion.forEach(function (item) {
        portionPromises.push(
          new Promise(function (resolve, reject) {
            var d = request.get(item.link, {}, function (err, res, body) {
              if(err) {
                db.Items.destroy({
                  where: {
                    link: item.link
                  }
                }).success(function() {
                  console.log(item.link);
                })
              }
              if (body == undefined)
                console.error(err);
              else {
                var $ = cheerio.load(body, {
                  normalizeWhitespace: true
                });
                var content = "";
                var description = $('meta[name="description"]').attr("content");
                if (description == undefined)  description = "";
                var keywords = $('meta[name="keywords"]').attr("content");
                if (keywords == undefined)  keywords = "";
                var bodyText = $('body');
                var scripts = bodyText.find('script');
                scripts.remove();
                bodyText = bodyText.text();
                content = description + " " + keywords + " " + bodyText;

                var contents = {};
                contents.itemid = item.id;
                contents.pagecontent = content;

                db.Contents.findOrCreate({
                  where: {
                    itemid: item.id
                  },
                  defaults: contents
                })
                  .then(function (item) {
                    db.Items.update({unread: false},
                      {
                        where: {
                          id: item[0].dataValues.itemid
                        }
                      })
                      .then(function (res) {
                        console.log(res);
                        resolve();
                      })
                      .catch(function (err) {
                        console.error(err)
                      });
                  })
                  .catch(function (err) {
                    console.error(err);
                  });
              }
            }).setMaxListeners(20);
          })
        )
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
    res.status(200).send();
  });
});

module.exports = router;
