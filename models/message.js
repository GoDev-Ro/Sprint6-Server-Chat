var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

module.exports = mongoose.model('Message', new Schema({
    participant: {type: Schema.Types.ObjectId, ref: 'Participant', required: true},
    body: String,
    date: {type: String, default: Date.now}
}));
