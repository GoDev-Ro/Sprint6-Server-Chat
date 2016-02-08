var Promise = require('promise'),
    Message = require('../models/message'),
    XSS = require('xss-filters'),
    moment = require('moment'),
    participants = require('./participants'),
    _ = require('underscore');

var validateItem = function(item) {
    var allowedProperties = ['participant', 'body'],
        i;

    if (!item || typeof item !== 'object') {
        throw new Error('Message to add must be an object');
    }

    if (!item.hasOwnProperty('body') || !item.body.length) {
        throw new Error('Property "body" must be a string');
    }

    if (!item.hasOwnProperty('participant') || !item.participant.length) {
        throw new Error('Property "participant" must be a string');
    }

    for (i in item) {
        if (item.hasOwnProperty(i) && allowedProperties.indexOf(i) === -1) {
            delete item[i];
        } else {
            item[i] = XSS.inHTMLData(item[i]);
        }
    }
};

var fromDb = function(item) {
    item = JSON.parse(JSON.stringify(item));

    item.id = item._id;
    delete item.__v;
    delete item._id;

    
    item.date = moment(parseInt(item.date)).format('YYYY-MM-DD HH:mm:ss');
    item.participant = item.participant ? participants.fromDb(item.participant) : null;

    return item;
};

module.exports = {
    getAll: function() {
        return new Promise(function(resolve, reject) {
            try {
                Message.find().populate('participant').sort({date: 'desc'}).exec(function(err, data) {
                    if (err) {
                        throw err;
                    } else {
                        resolve(_.map(data, fromDb));
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

                Message.create(item, function(err, transaction) {
                    if (err) {
                        throw err
                    } else {
                        resolve(fromDb(transaction));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    flush: function() {
        return new Promise(function(resolve, reject) {
            try {
                Message.remove({}, function(err, numRemoved) {
                    if (numRemoved) {
                        resolve();
                    } else {
                        throw new Error('Coult not flush');
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
};
