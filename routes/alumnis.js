var mongoose = require('mongoose');
var express = require('express');

var Alumni = require('../models/alumni');
var Router = express.Router();

Router.get('/', Alumni.all);
Router.get('/:id', Alumni.viewOne);
Router.post('/create', Alumni.create);
Router.post('/destroy/:id', Alumni.destroy);
Router.post('/edit/:id', Alumni.edit);
module.exports = Router;