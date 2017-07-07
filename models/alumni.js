var mongoose = require('mongoose');

var AlumniSchema = mongoose.Schema({
	content: {
		type: String,
	}, 
    email: {
        type: String,
    },
    name: {
        type: String,
    },
    graduate_year: {
        type: String,
    },
    phone_number: {
        type: String,
    },
    department: {
        type: String,
    }
});

var Alumni = module.exports = mongoose.model('Alumni', AlumniSchema);

module.exports = {
    all: function(req, res){
        console.log('we are in Alumni.all');  
        var perPage = 40
            , page = req.param('page') > 0 ? req.param('page') : 0;

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
            .find()
            //.select('email')
            .limit(perPage)
            .skip(perPage * page)
            .sort({email: 'asc'})
            .exec(function (err, alumnis) {
                Alumni.count().exec(function (err, count) {
                    res.render('alumnis', {
                        alumnis: alumnis
                        , page: page
                        , pages: count / perPage
                    })
                })
            })
    },
    viewOne: function(req, res){
        Alumni.find({ _id: req.params.id }, function(err, alumni){
            console.log("viewOne");
            res.render('alumni', { alumni: alumni[0] })
        });
    },
    createForm: function(req, res){
        console.log("creating...");
        res.render('createAlumni');
    },
    create: function(req, res){
        console.log("creating...");
        var todoContent = req.body.content;
        // create todo
        Alumni.create({ name: req.body.name,
                email: req.body.email,
                graduate_year: req.body.graduate_year,
                phone_number: req.body.phone_number,
                department: req.body.department }, function(err, alumni){
            if(err) res.render('error', { error: 'Error creating your alumni :('})
            // reload collection
            res.redirect('/alumnis');
        });
    },
    destroy: function(req, res){
        var id = req.params.id;

        Alumni.findByIdAndRemove(id, function(err, alumni){
            if(err) res.render('error', { error: 'Error deleting alumni'});
            res.redirect('/alumnis');
        });
    },
    edit: function(req, res){
        Alumni.findOneAndUpdate({ _id: req.params.id }, 
               {name: req.body.name,
                email: req.body.email,
                graduate_year: req.body.graduate_year,
                phone_number: req.body.phone_number,
                department: req.body.department,
            }, function(err, alumni) {
                console.log(alumni)
            res.redirect('/alumnis');
        });
    },
};