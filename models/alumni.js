var mongoose = require('mongoose');
   // Todo = mongoose.model('Todo');

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
        console.log('we are in Alumni.all')
        Alumni.find({}, function(err, alumnis){
            if(err) res.render('error', { error: 'Could not fetch items from database :('});
            console.log('in the callback');
           // console.log(todos);
            res.render('alumnis', { alumnis: alumnis });
        });
    },
    viewOne: function(req, res){
        Alumni.find({ _id: req.params.id }, function(err, alumni){
            console.log("viewOne");
            res.render('alumni', { alumni: alumni[0] })
        });
    },
    create: function(req, res){
        var todoContent = req.body.content;
        // create todo
        Alumni.create({ content: todoContent }, function(err, alumni){
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
    }

};