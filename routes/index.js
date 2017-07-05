var express = require('express');
var router = express.Router();
const {ensureAuthenticated} = require('../utils/utils');

/* GET home page. */
router.get('/', ensureAuthenticated, (req, res, next) => {
  res.render('index', {title: 'Members'});
});

module.exports = router;
