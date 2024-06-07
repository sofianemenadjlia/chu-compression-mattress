const mongoose = require('mongoose');

const matelasSchema = mongoose.Schema({
    id: {type: Number, required: true},
    etat: {type: String, required: true },
    occupation:{type: Date, required: true},
    remarque_matelas: {type: String, required: false },
    is_locked: {type: Boolean, required: true},
    data : [{
        nip: {type: Number, required: true},
        date_scanner: {type: Date, required: true},
        date_mep: {type: Date, required: true},
        nombre_seances: {type: String, required: true},
        date_ftr: {type: Date, required: true},
        remarque: {type: String, required: false},
        statut: {type: String, required: true}
    }]
},{
    versionKey: false
});

module.exports = mongoose.model('Matelas', matelasSchema);