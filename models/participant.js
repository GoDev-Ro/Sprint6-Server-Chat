var mongoose = require('mongoose');

module.exports = mongoose.model('Participant', new mongoose.Schema({
    fb_id: String,
    first_name: String,
    last_name: String,
    last_active: {type: Date, default: Date.now}
}));
