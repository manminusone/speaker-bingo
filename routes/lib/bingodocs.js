module.exports = (options) => {
	var config = options.config;
	var mongoose = options.mongoose;
	var Schema = mongoose.Schema;
//	bingo schemas
	var PresentationSchema = new Schema({
		ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
		uri: String,
		creationDate: { type: Date, default: Date.now },

		bingos: [ { type: Schema.Types.ObjectId, ref: 'Bingo' }],

		status: Number,
		testBingoId: { type: Schema.Types.ObjectId, ref: 'Bingo' },
		activeBingoId: { type: Schema.Types.ObjectId, ref: 'Bingo' }

	})
		Presentation = mongoose.model('Presentation', PresentationSchema);


	var BingoSchema = new Schema({
		title: String,
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
			find: function(opts,cb) {
				if (opts.ownerId)
					Presentation.find({ ownerId: opts.ownerId }).populate('bingos').exec(cb);
				else if (opts.id)
					Presentation.findById(opts.id).populate('bingos').exec(cb); 
				else if (opts.uri) 
					Presentation.findOne({ uri: opts.uri }).populate('bingos').exec(cb);
				else
					cb('Unknown call of find() method', null);
			},
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
			find: function(opts,cb) {
				if (opts.presentationId)
					Bingo.find({ presentationId: opts.presentationId }).exec(cb);
				else if (opts.id && Array.isArray(opts.id))
					Bingo.find({ _id: { $in: opts.id }}).exec(cb);
				else if (opts.id)
					Bingo.findById(opts.id).exec(cb);
				else
					cb('Unknown call of find()', null);
			},
			save: function(doc,cb) {
				if (doc.id) {
					Bingo.findById(doc.id, function(err,foundDoc) {
						console.log('-- err = ' + err + ', foundDoc = ' + foundDoc);
						if (err)
							cb(err);
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