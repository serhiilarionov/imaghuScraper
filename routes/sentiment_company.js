var express = require('express');
var db = require('../models/index');
var router = express.Router();


router.get('/', function(req, res, next) {
  db.CompanyNeutralValuePagecontent.addCompanyNeutralValuePagecontent()
    .then(function(response) {
      if(response)
        res.status(200).send();
    })
    .catch(function (err) {
      console.log(err);
    });
});
module.exports = router;