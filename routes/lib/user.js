module.exports = (options) => {
	var bcrypt = require('bcrypt');
	var md5 = require('md5');

	var config = options.config;
	var mongoose = options.mongoose;

	var Schema = mongoose.Schema;

//	user schema

	var UserSchema = new Schema({
		email: String,
		hash: String,
		creationDate: { type: Date, default: Date.now },
		loginDate: Date,
		isValidated: { type: Boolean, default: false },
		isActive: { type: Boolean, default: false },
		isAdmin: { type: Boolean, default: false },
		presentations: [ { type: Schema.Types.ObjectId, ref: 'Presentation' }]
	}),
		User = mongoose.model('User',UserSchema);

//	activation code
	var ActivationCodeSchema = new Schema({
		user: { type: Schema.Types.ObjectId, ref: 'User' },
		sentDate: { type: Date, default: Date.now },
		hash: String,
		claimed: { type: Boolean, default: false },
		claimDate: Date
	}),
		ActivationCode = mongoose.model('ActivationCode',ActivationCodeSchema);



	return {
		new: function() { return new User(); },
		isAuthenticated: function(req,res,next) { if (! req.session.userId) { res.redirect('/login'); } else { next(); } },

		find: function(opts, cb) {
			if (opts.email && opts.pwd) {
				User.findOne({ email: opts.email }).populate( { path: 'presentations', 'populate': { 'path': 'bingos' } }).exec(function(err,result) {
					var errorDoc = "User not found";
					if (result) {
						bcrypt.compare(opts.pwd,result.hash, function(err,res) {
							if (res)
								cb(null, result);
							else
								cb(errorDoc, null);
						});
					} else 
						cb(errorDoc, null);
					}
				);
			} else if (opts.id) {
				User.findById(opts.id).populate({ path: 'presentations', 'populate': { 'path': 'bingos' } }).exec(cb);
			} else if (opts.email) {
				User.findOne({ email: opts.email }).populate({ path: 'presentations', 'populate': { 'path': 'bingos' } }).exec(cb);
			} else
				cb("Unknown call of find() method", null);
		},
		save: function(doc,cb) {
			if (doc._id) {
				var tmp = doc;
				delete tmp._id;
				User.update({ id: Schema.Types.ObjectId(doc._id) }, tmp, cb);
			} else if (doc.pwd) {
				bcrypt.hash(doc.pwd, 10, function(err,result) {
					if (!err && result) {
						var tmp = new User( { email: doc.email, hash: result });
						tmp.save(cb);
					}
				})
			} else
				cb({ error: 'Not enough information to save '});
		},
		activation: {
			new: function(userObject) { var millis = new Date().getMilliseconds(); return new ActivationCode({ user: userObject._id, hash: md5(userObject.email + ' '+millis.toString()) }); },
			activate: function(hash,cb) {
				ActivationCode.findOne({ hash: hash }).populate('user').exec(function(err,doc) {
					console.log(JSON.stringify(doc));
					if (doc) {
						if (doc.claimed)
							cb('Account is already activated', doc);
						else {
							doc.user.isValidated = true;
							doc.user.isActive = true;
							doc.claimed = true;
							doc.claimDate = new Date();
							doc.user.save(function(err) { doc.save(cb); });
						}
					} else{
						cb('Activation code not found', null);
					}
				});
			},
			clean: function() {
				var q = ActivationCode.find().remove({ sentDate: { $lt: new Date(Date.now() - 1000 * 86400) } }); // expires in 1 day
				q.exec();
			}
		}
	}
};