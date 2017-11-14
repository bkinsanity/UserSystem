var express = require('express');
var Router = express.Router();
var Alumni = require('../models/alumni');
var mongoose = require('mongoose');
const {ensureAuthenticated} = require('../utils/utils');
var department_list = require('../utils/department_list');
var year_list = require('../utils/year_list');

Router.get('/update', ensureAuthenticated, (req, res, next) => {
  Alumni.getOneAlumniByEmail(req.user.email, (err, oneAlumniData) => {
      if (oneAlumniData) {
        var data = oneAlumniData;
        res.render('alumni/updateOneAlumni', {data, department_list, year_list});
      } else {
        var data = Alumni.getEmptyAlumniObejct();
        data["email"] = req.user.email;
        res.render('alumni/updateOneAlumni', {data, department_list, year_list});
      }
  });
});

Router.post('/update', ensureAuthenticated, Alumni.update);

module.exports = Router;
