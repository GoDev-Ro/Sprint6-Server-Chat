var Promise = require('promise'),
    Participant = require('../models/participant'),
    XSS = require('xss-filters'),
    moment = require('moment'),
    _ = require('underscore');

var validateItem = function(item) {
    var allowedProperties = ['fb_id', 'first_name', 'last_name'],
        i;

    if (!item || typeof item !== 'object') {
        throw new Error('Participant to add must be an object');
    }

    if (!item.hasOwnProperty('first_name') || !item.first_name.length) {
        throw new Error('Property "first_name" must be a string');
    }
    
    if (!item.hasOwnProperty('last_name') || !item.last_name.length) {
        throw new Error('Property "last_name" must be a string');
    }

    for (i in item) {
        if (item.hasOwnProperty(i) && allowedProperties.indexOf(i) === -1) {
            delete item[i];
        } else {
            item[i] = XSS.inHTMLData(item[i]);
        }
    }
};

var fromDb = function(item, keep_id) {
    item = JSON.parse(JSON.stringify(item));

    if (keep_id) {
        item.id = item._id;
    }
    
    delete item.__v;
    delete item._id;
    delete item.last_active;

    return item;
};

module.exports = {
    getAll: function(lastActiveInSeconds) {
        return new Promise(function(resolve, reject) {
            try {
                Participant.find({
                    last_active: {
                        $gt: moment().subtract(lastActiveInSeconds, 'second').toDate()
                    }
                }).sort({date: 'desc'}).exec(function(err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(_.map(data, function(item) {
                            return fromDb(item, false);
                        }));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    add: function(item) {
        return new Promise(function(resolve, reject) {
            try {
                validateItem(item);

                Participant.create(item, function(err, transaction) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(fromDb(transaction, true));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    get: function(id) {
        return new Promise(function(resolve, reject) {
            try {
                Participant.findOne({
                    _id: id
                }).exec(function(err, data) {
                    if (err) {
                        reject(err.message.indexOf('Cast to ObjectId failed') > -1 ? new Error('Invalid Participant ID') : err);
                    } else {
                        resolve(fromDb(data));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    touch: function(id) {
        return new Promise(function(resolve, reject) {
            try {
                Participant.update({_id: id}, {$set: {last_active: Date.now()}}, {multi: false}, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    fromDb: fromDb
};
