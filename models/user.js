var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost/nodeauth');

var db = mongoose.connection;

// Definition of User schema
var UserSchema = mongoose.Schema({
	username: {type: String},
	email: {type: String},
	password: {type: String},
	resetPasswordToken: {type: String},
  resetPasswordExpires: {type: Date},
	verifyEmailToken: {type: String},
	verifyEmailExpires: {type: Date},
	isSuperUser: {type: Boolean},
	isActive: {type: Boolean}
});

var User = module.exports = mongoose.model('User', UserSchema);
module.exports.getUserById = function(id, callback) {
	User.findById(id, callback);
};
module.exports.getUserByVerifyEmailToken = function(verifyEmailToken, callback) {
	User.findOne({verifyEmailToken}, callback);
};
module.exports.getUserByUsername = function(username, callback) {
	User.findOne({username}, callback);
};
module.exports.getUserByEmail = function(email, callback) {
	User.findOne({email}, callback);
};
module.exports.comparePassword = function(candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
  	callback(null, isMatch);
	});
};
module.exports.createUser = function(newUser, callback) {
	db.collection('users').find({username: newUser.username}).count().then((count) => {
		if (count > 0) {
			callback("User name exists, please choose a new one");
		} else {
			bcrypt.genSalt(10, (err, salt) => {
    		bcrypt.hash(newUser.password, salt, (err, hash) => {
   				newUser.password = hash;
   				newUser.save(callback);
    		});
			});
		}
	}, (err) => {
		console.log('Unable to fetch users', err);
	});
}
