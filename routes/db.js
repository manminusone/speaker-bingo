
module.exports = (options) => {
	var mongoose = options.mongoose;
	var bcrypt = require('bcrypt');

	var Schema = mongoose.Schema;

//	user schema

	var UserSchema = new Schema({
		email: String,
		hash: String,
		creationDate: { type: Date, default: Date.now },
		loginDate: Date,
		isValidated: { type: Boolean, default: false },
		isActive: { type: Boolean, default: false },
		isAdmin: { type: Boolean, default: false }
	}),
		User = mongoose.mode('User',UserSchema);

//	bingo schemas
	var PresentationSchema = new Schema({
		ownerId: Schema.Types.ObjectId,
		uri: String,
		createDate: { type: Date, default: Date.now },
		contactEmail: String,
		bingos: [ { type: Schema.Types.ObjectId, ref: 'Bingo' }],

		testBingoId: Schema.Types.ObjectId
	}),
		Presentation = mongoose.model('Presentation', PresentationSchema);

	var BingoSchema = new Schema({
		presentationId: { type: Schema.Types.ObjectId, ref: 'Presentation' },
		title: String,
		createDate: { type: Date, default: Date.now },
		choices: [String]
	}),
		Bingo = mongoose.model('Bingo',BingoSchema);

	var CardSchema = new Schema({
		bingoID: Schema.Types.ObjectId,
		choices: [String]
	}),
		Card = mongoose.model('Card',CardSchema);

	return {
		user: {
			new: function() { return new User(); },
			findById: function(id,cb) { User.findById(id, cb); },
			findByEmail: function(email,cb) { User.findOne({ email: email }, cb); },
			find: function(email,passwd,cb) { User.findOne({ email: email }, function(err,result) {
				var errorDoc = { error: "User not found" };
				if (result) {
					bcrypt.compare(passwd,result.hash, function(err,res) {
						if (res)
							cb(result);
						else
							cb(errorDoc);
					});
				} else 
				cb(errorDoc);
			}); },
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
			}
		}
		presentation: {
			new: function() { return new Presentation(); },
			findByOwnerId: function(id,cb) { Presentation.findById(id).populate('bingos').exec(cb); },
			findById: function(id,cb) { Presentation.findById(id).populate('bingos').exec(cb); },
			findByUri: function(uri,passwd,cb) { Presentation.findOne({ uri: uri }).populate('bingos').exec(function(err,result) {
				var errorDoc = { error: "Presentation not found" };
				if (result)
					bcrypt.compare(passwd, result.hash, function(err,res) {
						if (res) 
							cb(result);
						else
							cb(errorDoc);
					});
				else
					cb(errorDoc);
			}); },
			findByUriNoPwd: function(uri,cb) { Presentation.findOne({ uri: uri }).populate('bingos').exec(cb); },
			save: function(doc,cb) { 
				if (doc._id) {
					var tmp = doc;
					delete tmp._id;
					Presentation.update({ id: Schema.Types.ObjectId(doc._id) }, tmp, cb);
				} else  if (doc.pwd) {
					bcrypt.hash(doc.pwd,10,function(err,result) {
						if (!err && result) {
							var tmp = new Presentation({ uri: doc.uri, contactEmail: doc.contactEmail, hash: result });
							tmp.save(cb);
						}
					})
				} else
					cb({ error: 'Not enough information to save' });
			}
		},
		bingo: {
			new: function() { return new Bingo(); },
			findById: function(id,cb) { console.log('-- id = ' + id); Bingo.findById(id, cb); },
			findByPresentationId: function(id,cb) { Bingo.find({ presentationId: id }, cb); },
			findByIds: function(idArray,cb) { Bingo.find({ _id: { $in: idArray }}, cb); },
			save: function(doc,cb) {
				if (doc.id) {
					Bingo.findById(doc.id, function(err,foundDoc) {
						console.log('-- err = ' + err + ', foundDoc = ' + foundDoc);
						if (err)
							cb({ error: err });
						else {
							if (doc.title) foundDoc.title = doc.title;
							if (doc.choices) foundDoc.choices = doc.choices;
							foundDoc.save(cb);
						}
					});
				} else {
					var tmp = new Bingo(doc);
					tmp.save(cb);
				}
			}
		}
	};
};