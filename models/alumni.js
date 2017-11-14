var mongoose = require('mongoose');

// Definition of Alumni schema
var AlumniSchema = mongoose.Schema({
  email: {type: String},
  chinese_name: {type: String},
	english_name: {type: String},
	gender: {type: String},
  place: {type: String},
  graduate_year: {type: String},
  phone_number: {type: String},
  department: {type: String}
});

var genEmptyAlumniObejct = function() {
  return {
    email: "",
    chinese_name: "",
    english_name: "",
    gender: "",
    place: "",
    graduate_year: "",
    phone_number: "",
    department: ""
  };
}

var Alumni = module.exports = mongoose.model('Alumni', AlumniSchema);
module.exports = {
    getEmptyAlumniObejct: function() {
      return genEmptyAlumniObejct();
    },
    getOneAlumniByEmail: function(email, callback) {
      Alumni.findOne({email}, callback);
    },
    all: function(req, res) {
        // Generating Pagination
        var perPage = 40
            , page = req.param('page') > 0 ? req.param('page') : 0
            , department = req.param('department')
            , graduate_year = req.param('graduate_year');

        if (typeof page === 'string')
            page = parseInt(page);

        var searchOption = {};
        if( department !== undefined && department.length > 0)
            searchOption.department = department;

        if( graduate_year !== undefined && graduate_year.length > 0)
            searchOption.graduate_year = graduate_year;

        res.locals.createPagination = function (pages, page) {
            var url = require('url')
            , qs = require('querystring')
            , params = qs.parse(url.parse(req.url).query)
            , str = ''

            params.page = 0
            var clas = "active";
            str += '<li class="'+clas+'"><a href="?'+qs.stringify(params)+'">第一頁</a></li>';
            params.page = page == 0 ? 0 : page - 1;
            str += '<li class="'+clas+'"><a href="?'+qs.stringify(params)+'">上一頁</a></li>';
            params.page = page == pages - 1 ? pages - 1 : page + 1;
            str += '<li class="'+clas+'"><a href="?'+qs.stringify(params)+'">下一頁</a></li>';
            params.page = pages;
            str += '<li class="'+clas+'"><a href="?'+qs.stringify(params)+'">最後一頁</a></li>'
            return str
        }

        Alumni
            .find(searchOption)
            //.select('email')
            .limit(perPage)
            .skip(perPage * page)
            .sort({email: 'asc'})
            .exec(function (err, alumnis) {
                Alumni.count().exec(function (err, count) {
                    res.render('alumni/viewAllAlumni', {
                        alumnis: alumnis
                        , page: page
                        , pages: count / perPage
                    })
                })
            })
    },
    viewOne: function(req, res) {
        Alumni.find({_id: req.params.id}, (err, alumni) => {
            if (err)
							res.render('error', {error: 'Error to view this alumni data :('});
            else {
              if (alumni.length > 0) {
                var department_list = require('../utils/department_list');
                var year_list = require('../utils/year_list');
                res.render('alumni/viewOneAlumni', {alumni: alumni[0], department_list, year_list});
              } else
                res.redirect('/alumni');
            }
        });
    },
    createForm: function(req, res) {
      if (req.user.isSuperUser) {
        var department_list = require('../utils/department_list');
        var year_list = require('../utils/year_list');
        res.render('alumni/createOneAlumni', {department_list, year_list});
      } else
        res.redirect('/alumni');
    },
		update: function(req, res) {
      // Form Validator
      req.checkBody('english_name', 'English name field is required').notEmpty();
      req.checkBody('chinese_name', 'Chinese name field is required').notEmpty();
      req.checkBody('gender', 'Gender field is not valid').notEmpty();
      req.checkBody('email', 'Email field is required').notEmpty();
      req.checkBody('place', 'Place field is required').notEmpty();
      req.checkBody('graduate_year', 'Graduate year field is required').notEmpty();
      req.checkBody('department', 'Department field is required').notEmpty();
      req.checkBody('phone_number', 'Phone number field is required').notEmpty();

      // Check Errors
      var errors = req.validationErrors();
      if (errors) {
        const department_list = require('../utils/department_list');
        const year_list = require('../utils/year_list');
        var data = genEmptyAlumniObejct();
        data["email"] = req.user.email;
        res.locals.user = req.user;
        res.render('alumni/updateOneAlumni', {errors, data, year_list, department_list, title: 'update'});
      } else {
			  Alumni.find({email: req.user.email}, function(err, alumni) {
					var newAlumni = {english_name: req.body.english_name,
						chinese_name: req.body.chinese_name,
						gender: req.body.gender,
						email: req.body.email,
            place: req.body.place,
						graduate_year: req.body.graduate_year,
						phone_number: req.body.phone_number,
						department: req.body.department
					};
					if (alumni.length > 0) {
						console.log("updating alumni database...");
						Alumni.findOneAndUpdate({email: req.user.email}, newAlumni, function(err, alumni) {
              console.log(alumni);
		          res.redirect('/alumni');
		        });
					} else {
						console.log("creating an alumni record...");
		        Alumni.create(newAlumni, function(err, alumni) {
		          if(err)
								res.render('error', { error: 'Error creating your alumni :('})
		            // reload collection
		          res.redirect('/alumni');
		        });
					}
				})
      }
		},
    create: function(req, res) {
        console.log("creating...");
        Alumni.create({ english_name: req.body.english_name,
								chinese_name: req.body.chinese_name,
								gender: req.body.gender,
                email: req.body.email,
                place: req.body.place,
                graduate_year: req.body.graduate_year,
                phone_number: req.body.phone_number,
                department: req.body.department }, function(err, alumni){
            if(err)
							res.render('error', { error: 'Error creating your alumni :('})
            // reload collection
            res.redirect('/alumni');
        });
    },
    destroy: function(req, res){
        var id = req.params.id;

        Alumni.findByIdAndRemove(id, function(err, alumni){
            if(err) res.render('error', { error: 'Error deleting alumni'});
            res.redirect('/alumni');
        });
    },
    edit: function(req, res) {
        Alumni.findOneAndUpdate({ _id: req.params.id },
               {english_name: req.body.english_name,
								chinese_name: req.body.chinese_name,
								gender: req.body.gender,
                email: req.body.email,
                place: req.body.place,
                graduate_year: req.body.graduate_year,
                phone_number: req.body.phone_number,
                department: req.body.department
            }, function(err, alumni) {
                console.log(alumni)
            res.redirect('/alumni');
        });
    },
};
