const mongoose = require('mongoose');

const historySchema = mongoose.Schema({
    date: {type: Date, required: true},
    description: {type: String, required: true },
},{
    versionKey: false
});

module.exports = mongoose.model('History', historySchema);