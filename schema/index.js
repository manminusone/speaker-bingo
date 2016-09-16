var mongoose = require('mongoose');
var Schema = mongoose.Schema;

exports.UserSchema = new Schema({
	email: { type: String, lowercase: true },
	hash: String,
	prop: {},
	presentation: [ { type: Schema.Types.ObjectId, ref: 'Presentation' }],
	audit: [ { type: Schema.Types.ObjectId, ref: 'Audit' }]
});
exports.PresentationSchema = new Schema({
	uri: String,
	bingo: [ { type: Schema.Types.ObjectId, ref: 'Bingo' }],
	prop: {},
	audit: [ { type: Schema.Types.ObjectId, ref: 'Audit' }]
});
exports.BingoSchema = new Schema({
	title: String,
	choices: [ String ],
	prop: {},
	audit: [ { type: Schema.Types.ObjectId, ref: 'Audit' }]
});
exports.AuditSchema = new Schema({
	key: String,
	value: String
});