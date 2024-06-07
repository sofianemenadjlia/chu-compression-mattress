const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const business = require('moment-business');
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const Matelas = require('./models/matelas');
const History = require('./models/history');


const app = express();

mongoose.connect('mongodb+srv://CHUD:chud@cluster0-kaduj.mongodb.net/test?retryWrites=true&w=majority' , { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log('\x1b[32m', '\n[INFO] Successfully connected to MongoDB Atlas!');
        console.log('\x1b[37m', "");
        //schedule update status task
        updateStatusRoutine();
        var updateStatus = schedule.scheduleJob('* 0 * * *', updateStatusRoutine);  //every day at midnight
    })
    .catch((error) => {
        console.log('\x1b[31m', '\n[ERROR] Unable to connect to MongoDB Atlas!');
        console.error(error);
    });

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(bodyParser.json());

/**
 * This function transforms a string into a date object which is used by mongoDB.
 * If the string is invalid, it returns today's date object.
 *
 * @param {*} date - the string which represents the date to format
 */
function format_date(date) {
    var submitted_date = moment(date); //YYYY/MM/DD format
    if (!submitted_date.isValid()) { //invalid query, set the date to today
        submitted_date = moment();
    }
    return submitted_date.toDate(); //date used by mongoDB
}

/**
 * Adds a new mattress to the database.
 */
app.post('/api/', (req, res, next) => {

    const matelas = new Matelas({
        id: req.body.id,
        etat: req.body.etat,
        occupation: req.body.occupation,
        remarque_matelas: req.body.remarque_matelas,
        is_locked: req.body.is_locked,
        data: []
    });

    Matelas.find({
        id: req.body.id
    }).limit(1).then(
        (mattress) => {
            if (getMattressFromCursor(mattress) == null) {
                matelas.save().then(
                    () => {
                        res.status(201).json({
                            success: true
                        });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                );
            } else {
                res.status(200).json({
                    success: false
                });
            }
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Retrieves all the database's mattresses.
 */
app.get('/api/', (req, res, next) => {
    Matelas.find().then(
        (matelas) => {
            res.status(200).json(matelas);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Deletes a mattress from the database whose ID is given.
 */
app.delete('/api/', (req, res, next) => {
    Matelas.deleteOne({
        _id: req.body._id
    }).then(
        () => {
            res.status(200).json({
                message: 'Deleted!'
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Deletes a reservation from a mattress whose ID is given.
 */
app.delete('/api/deleteReservation', (req, res, next) => {
    Matelas.update(
        { _id: req.body._idMattress},
        { $pull: { "data" : { _id: req.body._idReservation } }},
        { multi: true }
    ).then(
        () => {
            res.status(200).json({
                message: 'Deleted!'
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Adds number_of_days business days to the given date and returns the result as a date object.
 *
 * @param {*} date - the date from which it adds business days
 * @param {*} number_of_days - the number of business days to add
 */
function addGap(date, number_of_days) {
    var result = moment(date);
    business.addWeekDays(result, number_of_days);
    return result.toDate();
}

/**
 * Substracts number_of_days business days to the given date and returns the result as a date object.
 *
 * @param {*} date - the date from which it substracts business days
 * @param {*} number_of_days - the number of business days to substract
 */
function substractGap(date, number_of_days) {
    var result = moment(date);
    business.subtractWeekDays(result, number_of_days);
    return result.toDate();
}

/**
 * This function computes the insertion position of a new booking which starts at start_date
 * and ends at end_date in the data array of a given mattress.
 * It returns -1 if there isn't any place for the new booking.
 *
 * @param {*} mattress - the mattress to book
 * @param {*} start_date - the start date of the booking
 * @param {*} end_date - the end date of the booking
 */
function findPlace(mattress, start_date, end_date) {
    var length = mattress.data.length;

    if (length == 0) {
        return 0;
    }

    for (i = 0; i < length; i++) {
        if (i == 0 && end_date < substractGap(mattress.data[i].date_scanner, 5)) {
            return 0;
        } else if (i == length - 1 && start_date > addGap(mattress.data[i].date_ftr, 5)) {
            return length;
        }
        if (i != length - 1 && start_date > addGap(mattress.data[i].date_ftr, 5) && end_date < substractGap(mattress.data[i + 1].date_scanner, 5)) {
            return i + 1;
        }
    }
    return -1;
}

/**
 * Computes an array containing all the mattresses which can contain the booking starting at start_date
 * and ending at end_date.
 *
 * @param {*} mattressList - a cursor over mattresses
 * @param {*} start_date - the start date of the booking
 * @param {*} end_date - the end date of the booking
 */
function computeFree(mattressList, start_date, end_date) {
    var null_date = new Date(0);
    var result = [];
    var index = 0;
    mattressList.forEach(function (mattress) {
        if (mattress.occupation.getTime() == null_date.getTime() || findPlace(mattress, start_date, end_date) != -1) {
            result[index] = mattress;
            index++;
        }
    });
    return result;
}

/**
 * Returns the available mattresses for the booking starting at start_date and ending at end_date.
 * Those mattresses aren't HS nor locked.
 */
app.post('/api/search_free', (req, res, next) => {
    var start_date = format_date(req.body.start_date);
    var end_date = format_date(req.body.end_date);

    Matelas.find({
        $and: [{
            etat: {
                $ne: "HS"
            }
        }, {
            is_locked: {
                $eq: false
            }
        }]
    }).then(
        (matelas) => {
            res.status(200).json(computeFree(matelas, start_date, end_date));
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Returns a mattress from the database whose ID is given.
 */
app.get('/api/search_one', (req, res, next) => {
    Matelas.find({
        id: req.body.id
    }).then(
        (matelas) => {
            res.status(200).json(matelas);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Retrieves all the mattresses wich contains current treatments.
 */
app.get('/api/currentReservation', (req, res, next) => {
    Matelas.find({
        'data.statut': "En cours"
    }).then(
        (matelas) => {
            res.status(200).json(matelas);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Returns the mattress contained by a cursor or null if the cursor is empty.
 * WARNING : If the cursor contains several mattresses, it returns the last one !
 *
 * @param {*} cursor - a cursor over ONE mattress
 */
function getMattressFromCursor(cursor) {
    var result = null;
    cursor.forEach(function (mattress) {
        result = mattress;
    })
    return result;
}

/**
 * Returns the maximum between the mattress' occupation date and the submitted date.
 *
 * @param {*} cursor - a cursor over ONE mattress
 * @param {*} date - the submitted date
 */
function computeOccupation(cursor, date) {
    var submitted_date = format_date(date);
    var current_occupation = getMattressFromCursor(cursor).occupation;
    if (submitted_date > current_occupation) {
        return submitted_date;
    }
    return current_occupation;
}

/**
 * Reserves a mattress given all the booking information.
 *
 * @param {*} mattress_id - the mattress' ID
 * @param {*} occupation_date - the mattress' new occupation date
 * @param {*} position - the insertion position of the new booking
 * @param {*} nip - the patient's NIP
 * @param {*} scanner_date - the scanner date
 * @param {*} mep_date - the MEP date
 * @param {*} session_info - the information about the sessions
 * @param {*} ftr_date - the FTR date
 * @param {*} remark - some remarks about the booking
 * @param {*} status - the status of the booking
 */
function bookMattress(mattress_id, occupation_date, position, nip, scanner_date, mep_date, session_info, ftr_date, remark, status) {
    Matelas.findOneAndUpdate(
        {"id": mattress_id},
        {$set:
            {
                occupation: occupation_date
            },
        $push: {
            data: {
                $each: [{
                    nip: nip,
                    date_scanner: format_date(scanner_date),
                    date_mep: format_date(mep_date),
                    nombre_seances: session_info,
                    date_ftr: format_date(ftr_date),
                    remarque: remark,
                    statut: status
                }],
                $position: position
            }
        }
    },
    ).then().catch(
        (error) => {
            console.log(error)
        }
    )
}

/**
 * Attempts to book a mattress given its ID, sends "success : true" on success.
 * If the mattress is locked or if it can't receive the new booking anymore, the mattress isn't booked and "success : false" is send.
 */
app.post('/api/book_mattress', (req, res, next) => {
    Matelas.find({
        id: req.body.id
    }).then(
        (matelas) => {
            var position = findPlace(getMattressFromCursor(matelas), format_date(req.body.data.date_scanner), format_date(req.body.data.date_ftr));
            if(getMattressFromCursor(matelas).is_locked || position == -1){
                res.status(200).json({
                    success: false
                });
            } else {
                var status = format_date(req.body.data.date_scanner) > moment().toDate() ? "Traitement à venir" : "En cours";
                bookMattress(req.body.id, computeOccupation(matelas, req.body.data.date_ftr),
                    findPlace(getMattressFromCursor(matelas), format_date(req.body.data.date_scanner), format_date(req.body.data.date_ftr)),
                    req.body.data.nip, req.body.data.date_scanner, req.body.data.date_mep, req.body.data.nombre_seances, req.body.data.date_ftr, req.body.data.remarque, status);

                res.status(200).json({
                    success: true
                });
            }
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Checks if a mattress is available given its ID (i.e it isn't locked and it can still receive the booking starting at start_date and ending at end_date).
 */
app.post('/api/check_available', (req, res, next) => {
    Matelas.find({ id: req.body.id}).then(
        (matelas) => {
            var position = findPlace(getMattressFromCursor(matelas), format_date(req.body.start_date), format_date(req.body.end_date));
            if(getMattressFromCursor(matelas).is_locked || position == -1){
                res.status(200).json({
                    available : false
                });
            } else {
                res.status(200).json({
                    available : true
                });
            }
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Locks a mattress given its ID.
 */
app.post('/api/lock_mattress', (req, res, next) => {
    Matelas.findOneAndUpdate({
        "id": req.body.id
    }, {
        $set: {
            is_locked: true
        }
    }).then(
        res.status(200).json({
            message: 'Mattress locked!'
        })
    ).catch(
        (error) => {
            console.log(error)
        }
    )
});

/**
 * Unlocks a mattress given its ID.
 */
app.post('/api/unlock_mattress', (req, res, next) => {
    Matelas.findOneAndUpdate({
        "id": req.body.id
    }, {
        $set: {
            is_locked: false
        }
    }).then(
        res.status(200).json({
            message: 'Mattress unlocked!'
        })
    ).catch(
        (error) => {
            console.log(error)
        }
    )
});

/**
 * Computes the difference (in days) between "start_date" and the end of the booking whose position is position - 1.
 * If there isn't a previous booking or if its end date is in the past, returns the number of days between today and "start_date".
 *
 * @param {*} mattress - a mattress which can contain the new booking
 * @param {*} position - the insertion position of the new booking
 * @param {*} start_date - the start date of the booking
 */
function computeHoleBeforeBooking(mattress, position, start_date){
    var today = moment().startOf('day');
    var length = mattress.data.length;

    if(length == 0){
        return -1;  //free (should not happen)
    }

    if(position == 0){
        return start_date.diff(today, 'days') - 1;
    }

    return (mattress.data[position-1].date_ftr.getTime() < today.toDate().getTime()) ? start_date.diff(today, 'days') - 1 : start_date.diff(moment(mattress.data[position-1].date_ftr), 'days') - 1;
}

/**
 * Returns the number of days between "end_date" and the start of the booking whose position equals position.
 * If there isn't a booking after the new booking, returns 1000000.
 *
 * @param {*} mattress - a mattress which can contain the new booking
 * @param {*} position - the insertion position of the new booking
 * @param {*} end_date - the end date of the booking
 */
function computeHoleAfterBooking(mattress, position, end_date){
    var length = mattress.data.length;

    if(length == 0){
        return -1;  //free (should not happen)
    }

    if(position == length){
        return 1000000;
    }

    return moment(mattress.data[position].date_scanner).diff(end_date, 'days') - 1;
}

/**
 * Returns the type of a time interval according to these codes :
 * 1 -> small non-fillable gap
 * 2 -> big non-fillable gap
 * 3 -> fillable gap
 *
 * @param {*} hole_duration - the length of the time interval
 */
function getHoleType(hole_duration){
    var fillableGap = 31;
    var smallGap = 14;

    if(hole_duration <= smallGap){
        return 1;
    }

    if(hole_duration < fillableGap){
        return 2;
    }

    return 3;
}

/**
 * Returns a structure containing the following fields :
 * "hole_before_booking" : the difference (in days) between "start_date" and the end of the booking whose position is position - 1 (previous booking)
 * "hole_after_booking" : the number of days between "end_date" and the start of the booking whose position equals position (next booking)
 * "priority" : the mattress' booking priority
 *
 * The lower the priority is, the more suited a mattress is to receive the new booking.
 * Priority follows theses rules :
 * 1 -> create the smallest non-fillable gaps
 * 2 -> allow future bookings (avoid    big non-fillable gap as far as possible)
 * 3 -> use completely free mattresses only if necessary
 *
 * @param {*} mattress - a mattress which can contain the new booking
 * @param {*} position - the insertion position of the new booking
 * @param {*} start_date - the start date of the booking
 * @param {*} end_date - the end date of the booking
 */
function computeDurations(mattress, position, start_date, end_date){
    var durations = {
        "hole_before_booking" : -1,
        "hole_after_booking" : -1,
        "priority" : Infinity
    };

    durations["hole_before_booking"] = computeHoleBeforeBooking(mattress, position, start_date);
    durations["hole_after_booking"] = computeHoleAfterBooking(mattress, position, end_date);

    var hole_before_booking_type = getHoleType(durations["hole_before_booking"]);
    var hole_after_booking_type = getHoleType(durations["hole_after_booking"]);


    if(hole_before_booking_type == 1 && hole_after_booking_type == 1){
        durations["priority"] = 1;
    }

    else if(hole_before_booking_type == 3 && hole_after_booking_type == 3){
        durations["priority"] = 2;
    }

    else if((hole_before_booking_type == 1 && hole_after_booking_type == 2) || (hole_before_booking_type == 2 && hole_after_booking_type == 1)){
        durations["priority"] = 3;
    }

    else if(hole_before_booking_type == 1 && hole_after_booking_type == 3){
        durations["priority"] = 4;
    }

    else if(hole_before_booking_type == 3 && hole_after_booking_type == 1){
        durations["priority"] = 5;
    }

    else if(hole_before_booking_type == 2 && hole_after_booking_type == 3){
        durations["priority"] = 6;
    }

    else if(hole_before_booking_type == 3 && hole_after_booking_type == 2){
        durations["priority"] = 7;
    }

    //durations["priority"] = 8 -> free mattresses not handled here;

    else if(hole_before_booking_type == 2 && hole_after_booking_type == 2){
        durations["priority"] = 9;
    }

    return durations;
}

/**
 * Returns the ID of the most suited mattress to receive the new booking.
 *
 * @param {*} mattressList - a cursor over mattresses
 * @param {*} start_date - the start date of the booking
 * @param {*} end_date - the end date of the booking
 */
function findBest(mattressList, start_date, end_date){
    var null_date = new Date(0);
    var result = null;
    var minimum = {
        "hole_before_booking" : Infinity,
        "hole_after_booking" : Infinity,
        "priority" : Infinity
    };

    var current_value = {};

    mattressList.forEach(function(mattress){
        var position = findPlace(mattress, start_date, end_date);
        if(position != -1){
            if(mattress.occupation.getTime() == null_date.getTime()){   //computes free mattresses values
                current_value["hole_before_booking"] = Infinity;
                current_value["hole_after_booking"] = Infinity;
                current_value["priority"] = 8;
            }
            else{
                current_value = computeDurations(mattress, position, moment(start_date), moment(end_date));
            }

            if(current_value["priority"] < minimum["priority"]){
                minimum = {...current_value};
                result = mattress.id;
            }

            else if(current_value["priority"] == minimum["priority"]){  //same priority, selects the smallest non-fillable gaps

                if((current_value["priority"] == 1 || current_value["priority"] == 2 || current_value["priority"] == 3 || current_value["priority"] == 9) &&
                current_value["hole_before_booking"] + current_value["hole_after_booking"] < minimum["hole_before_booking"] + minimum["hole_after_booking"]){
                    minimum = {...current_value};
                    result = mattress.id;
                }

                else if((current_value["priority"] == 4 || current_value["priority"] == 6) &&
                current_value["hole_before_booking"] < minimum["hole_before_booking"]){ //the gaps before the new booking are not fillable
                    minimum = {...current_value};
                    result = mattress.id;
                }

                else if((current_value["priority"] == 5 || current_value["priority"] == 7) &&
                current_value["hole_after_booking"] < minimum["hole_after_booking"]){   //the gaps after the new booking are not fillable
                    minimum = {...current_value};
                    result = mattress.id;
                }
            }
        }
    });
    return result;
}

/**
 * Attempts to find the best suited mattress to receive the requested booking, sends "found_id : mattress_id" on success.
 * If no mattress can be found, "found_id : null" is send.
 */
app.post('/api/automatic_booking', (req, res, next) => {
    Matelas.find({$and : [{etat: {$ne: "HS"}} , {is_locked: {$eq: false}}]}).then(
        (matelas) => {
            res.status(200).json({
                found_id : findBest(matelas, format_date(req.body.start_date), format_date(req.body.end_date))
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
            console.log(error);
        }
    );
});

//History section

/**
 * Adds an entry to the history.
 */
app.post('/api/addToHistory', (req, res, next) => {
    const history = new History({
        date: req.body.date,
        description: req.body.description,
    });

    history.save().then(
        () => {
            res.status(201).json({
                message: 'History updated ! '
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Returns history.
 */
app.get('/api/getHistory', (req, res, next) => {
    History.find().then(
        (history) => {
            res.status(200).json(history);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Deletes all history.
 */
app.delete('/api/deleteHistory', (req, res, next) => {

    History.deleteMany({}).then(
        () => {
            res.status(200).json({
                message: 'Hitsory deleted!'
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Modifies a mattress.
 */
app.put('/api/modifyMattress', (req, res, next) => {
    Matelas.updateOne(
        { _id: req.body._id },
        {
            $set: { id: req.body.id, etat: req.body.etat,occupation: req.body.occupation,  remarque_matelas: req.body.remarque_matelas },
        }
        ).then(
        () => {
            res.status(201).json({
                message: 'Mattress updated successfully!',
                success: true
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

/**
 * Modifies a reservation.
 */
app.put('/api/modifyReservation', (req, res, next) => {
    Matelas.updateOne(
        { _id: req.body.mattress_id, "data._id": req.body.reservation_id },
        { $set: { "data.$.nip": req.body.nip, "data.$.date_scanner": req.body.scanner_date, "data.$.date_mep": req.body.mep_date, "data.$.nombre_seances": req.body.session_nb ,"data.$.date_ftr": req.body.ftr_date, "data.$.remarque": req.body.remark } }
    ).then(
        () => {
            res.status(201).json({
                message: 'Reservation updated successfully!',
                success: true
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});


//update status routine


/**
 * Sets the mattress' occupation to the given date.
 *
 * @param {*} mattress_id - the mattress' ID
 * @param {*} new_occupation - the new occupation date
 */
function setOccupation(mattress_id, new_occupation){
    Matelas.findOneAndUpdate(
        {"id": mattress_id},
        {$set:
            {
                occupation: new_occupation
            },
        }
    ).then().catch(
        (error) => {
            console.error(error)
        }
    )
}

/**
 * Changes the status of the booking whose position in the mattress' bookings array is given.
 * The mattress' ID is given in order to find it in the database.
 *
 * @param {*} mattress_id - the mattress which contain the booking to update
 * @param {*} position - the position of the booking
 * @param {*} new_status - the new status of the booking to modify
 */
function updateBookingsStatus(mattress_id, position, new_status){
    var field_string = "data." + position + ".statut";
    var update = { "$set": {} };
    update["$set"][field_string] = new_status;

    Matelas.findOneAndUpdate(
        {"id": mattress_id}, update
    ).then().catch(
        (error) => {
            console.error(error)
        }
    )
}

/**
 * Checks and updates all mattresses' bookings status if necessary. The bookings status are meant to be accurate in order to
 * tell if a booking is in the past or in the present or in the future.
 * This function updates the inaccurate booking statuses.
 */
function updateStatusRoutine(){
    var today = moment().toDate();
    var today_midnight = moment().startOf('day').toDate();
    Matelas.find().then(
        (mattresses) => {
            mattresses.forEach(function (mattress) {
                var length = mattress.data.length;
                for(i = 0; i < length; i++){
                    if(i == length - 1 && mattress.data[i].statut.localeCompare("Traitement terminé") == 0 && today_midnight > addGap(mattress.data[i].date_ftr, 5)){    //there isn't any scheduled treatments
                        setOccupation(mattress.id, moment(0).toDate());
                    }
                    else if(mattress.data[i].statut.localeCompare("En cours") == 0 && today > mattress.data[i].date_ftr){
                        //The current booking status is set to "Traitement terminé".
                        updateBookingsStatus(mattress.id, i, "Traitement terminé");
                    }
                    else if(mattress.data[i].statut.localeCompare("Traitement à venir") == 0 && today >= mattress.data[i].date_scanner && today <= mattress.data[i].date_ftr){
                        //The current booking status is set to "En cours".
                        updateBookingsStatus(mattress.id, i, "En cours");
                    }
                    else if(mattress.data[i].statut.localeCompare("Traitement à venir") == 0 && today > mattress.data[i].date_ftr){
                        //The current booking status is set to "Traitement terminé".
                        updateBookingsStatus(mattress.id, i, "Traitement terminé");
                    }
                }
            })
        }
    ).catch(
        (error) => {
            console.error(error);
        }
    );
}


module.exports = app;