var express         = require('express');
var app             = express();
var bodyParser      = require('body-parser');
var port            = process.env.PORT || 8081;
var router          = express.Router();
var participants    = require('./stores/participants');
var messages        = require('./stores/messages');
var mongoose        = require('mongoose');

mongoose.connect('mongodb://localhost/sprint6-chat');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cache-Control', 'no-cache');

    next();
});

router.get('/', function(req, res) {
    res.json({ message: 'API works, but this endpoint does nothing' });
});

router.route('/participants')
    .options(function(req, res) {
        res.header('Access-Control-Allow-Methods', 'GET, POST').send();
    })
    .get(function(req, res) {
        participants.getAll(3600).then(
            function(result) {
                res.json(result);
            },
            function(error) {
                res.status(500).json({
                    error: error.message
                });
            }
        );
    })
    .post(function(req, res) {
        participants.add(req.body).then(
            function(item) {
                res.status(201).json(item);
            },
            function(error) {
                res.status(409).json({
                    error: error.message
                });
            }
        );
    });

router.route('/messages/:participant')
    .options(function(req, res) {
        res.header('Access-Control-Allow-Methods', 'GET, POST').send();
    })
    .get(function(req, res) {
        var fail = function (err) {
            res.status(500).json({
                error: err.message
            });
        };
        
        participants.get(req.params.participant).then(
            function () {
                messages.getAll().then(
                    function (result) {
                        res.json(result);
                    },
                    fail
                );
            },
            fail
        );
    })
    .post(function(req, res) {
        var fail = function(error) {
            res.status(409).json({
                error: error.message.indexOf('Cast to ObjectID failed') ? 'Invalid participant ID' : error.message
            });
        };

        participants.get(req.params.participant).then(
            function() {
                req.body.participant = req.params.participant;

                messages.add(req.body).then(
                    function(item) {
                        res.status(201).json(item);
                    },
                    fail
                );
            },
            fail
        );
    });

router.route('/messages')
    .options(function(req, res) {
        res.header('Access-Control-Allow-Methods', 'DELETE').send();
    })
    .delete(function(req, res) {
        messages.flush().then(
            function() {
                res.status(204).send();
            },
            function(error) {
                res.status(409).json({
                    error: error.message
                });
            }
        );
    });

app.use('/api', router);
app.listen(port);

console.log('Listening on port ' + port);
