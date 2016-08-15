
module.exports = (options) => {
	var mongoose = options.mongoose;
	console.log(mongoose);
	var bcrypt = require('bcrypt');

	var Schema = mongoose.Schema;

	var PresentationSchema = new Schema({
		uri: String,
		createDate: { type: Date, default: Date.now },
		contactEmail: String,
		hash: String
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
		newPresentation: function(thisUri,thisEmail,thisPwd) {
			bcrypt.hash(thisPwd, 10, function(err, hash) {
				if (!err) {
					var p = new Presentation({ uri: thisUri, contactEmail: thisEmail, hash: hash });
					p.save();
					return p;
				} else {
					return null;
				}
			});
		},
		newBingo: function(presId) {
			var foo = new Bingo({ presentationId: presId });
			return foo;
		},
		findPresentation: function(thisId,thisPwd,cb) {
			var errDoc = { error: 'Document not found '};

			var pCallback = function(err,doc) {
				console.log('- findOne: err = ' + err  + ', doc = ' + doc);
				if (! err) {
					console.log('-- checking bcrypt');
					bcrypt.compare(thisPwd,doc.hash,function(err,res) {
						if (res)
							cb(doc);
						else
							cb(errDoc);
					});
				} else
					cb(errDoc);
			};

			Presentation.findOne({ uri: thisId }, pCallback);
		},
		findBingos: function(presId, cb) {
			Bingo.find({ presentationId: presId }, function(err,docs) {
				cb(docs);
			});
		},
		saveBingo: function(doc,cb) {
			var docid = doc._id;
			Bingo.findByIdAndUpdate(docid,  { presentationId: doc.presentationId, title: doc.title, createDate: doc.createDate, choices: doc.choices }, cb);
		}
	};
};