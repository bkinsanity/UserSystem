var mongoose = require('mongoose');
var express = require('express');
const {ensureAuthenticated} = require('../utils/utils');

var Alumni = require('../models/alumni');
var Router = express.Router();

Router.get('/', ensureAuthenticated, Alumni.all);
Router.get('/:id', ensureAuthenticated, Alumni.viewOne);
Router.get('/create/alumni', ensureAuthenticated, Alumni.createForm);
Router.post('/create', ensureAuthenticated, Alumni.create);
Router.post('/destroy/:id', ensureAuthenticated, Alumni.destroy);
Router.post('/edit/:id', ensureAuthenticated, Alumni.edit);
module.exports = Router;