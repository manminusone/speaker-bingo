module.exports = (options) => {

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
		uris: [ { type: Schema.Types.ObjectId, ref: 'Presentation' }]
	}),
		User = mongoose.model('User',UserSchema);

//	activation code
	var ActivationCodeSchema = new Schema({
		userId: { type: Schema.Types.ObjectId, ref: 'User' },
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
				User.findOne({ email: opts.email }, function(err,result) {
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
				User.findById(id,cb);
			} else if (opts.email) {
				User.findOne({ email: opts.email }, cb);
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
			new: function(userObject) { var millis = new Date().getMilliseconds(); return new ActivationCode({ userId: userObject._id, hash: md5(userObject.email + ' '+millis.toString()) }); },
			activate: function(hash,cb) {
				ActivationCode.findOne({ hash: hash }, function(err,doc) {
					if (doc) {
						if (doc.claimed)
							cb('Account is already activated', doc);
						else {
							doc.claimed = true;
							doc.claimDate = new Date();
							doc.save(function(err) { cb(err); })
						}
					}
				});
			},
			clean: function() {
				var q = ActivationCode.find().remove({ sentDate: { $lt: new Date(Date.now() - 1000 * 14 * 86400) } });
				q.exec();
			}
		}
	}
};