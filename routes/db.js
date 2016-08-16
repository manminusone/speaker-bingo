
module.exports = (options) => {
	var mongoose = options.mongoose;
	var bcrypt = require('bcrypt');

	var Schema = mongoose.Schema;

	var PresentationSchema = new Schema({
		uri: String,
		createDate: { type: Date, default: Date.now },
		contactEmail: String,
		hash: String,

		testBingoId: Schema.Types.ObjectId
	}),
		Presentation = mongoose.model('Presentation', PresentationSchema);

	var BingoSchema = new Schema({
		presentationId: Schema.Types.ObjectId,
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
		presentation: {
			new: function() { return new Presentation(); },
			findById: function(id,cb) { Presentation.findById(id, cb); },
			findByUri: function(uri,passwd,cb) { Presentation.findOne({ uri: uri }, function(err,result) {
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
			findByUriNoPwd: function(uri,cb) { Presentation.findOne({ uri: uri }, cb); },
			save: function(doc,cb) { 
				if (doc._id) {
					var tmp = doc;
					delete tmp._id;
					console.log('updating');
					Presentation.update({ id: Schema.Types.ObjectId(doc._id) }, tmp, cb);
				} else  if (doc.pwd) {
					bcrypt.hash(doc.pwd,10,function(err,result) {
						if (!err && result) {
							var tmp = new Presentation({ uri: doc.uri, contactEmail: doc.contactEmail, hash: result });
							console.log('saving');
							tmp.save(cb);
						}
					})
				} else
					cb('Not enough information to save');
			}
		},
		bingo: {
			new: function() { return new Bingo(); },
			findById: function(id,cb) { Bingo.findById(id, cb); },
			findByPresentationId: function(id,cb) { Bingo.find({ presentationId: id }, cb); },
			findByIds: function(idArray,cb) { Bingo.find({ _id: { $in: idArray }}, cb); },
			save: function(doc,cb) {
				if (doc._id) {
					var tmp = doc;
					delete tmp._id;
					Bingo.update({ id: Schema.Types.ObjectId(doc._id) }, tmp, cb);
				} else {
					var tmp = new Bingo(doc);
					tmp.save(cb);
				}
			}
		}
	};
};