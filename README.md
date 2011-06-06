sailthru-node-client
====================

A simple client library to remotely access the `Sailthru REST API` as per [http://docs.sailthru.com/api](http://docs.sailthru.com/api)

Installation
------------

### npm install sailthru-client

Examples
--------

### Initialization

    var apiKey = '******',
        apiSecret = '*****',
        sailthru = require('sailthru-client').createSailthruClient(apiKey, apiSecret);

### [send](http://docs.sailthru.com/api/send)

    //send
    var template = 'my-template',
        email = 'praj@sailthru.com',
        options = {
            'vars': {
                'name': 'Prajwal Tuladhar',
                'address': 'Queens, NY'
            },
            'options': {
                'test': 1,
                'replyto': 'praj@infynyxx.com'
            }
        };
    sailthru.send(template, email, function(response, err) {
        if (err) {
            console.log("Status Code: " + err.statusCode);
            console.log("Error Code: " + err.error);
            console.log("Error Message: " + err.errormsg);
        } else {
            //process output
        }
    }, options);

    //multi-send
    var emails = ['praj@sailthru.com', 'ian@sailthru.com', 'will@sailthru.com'],
        template = 'multi-template',
        options = {
            'options': {
                'test': 1
            }
        };
    sailthru.multiSend(template, emails, function(response, err) {
        if (err) {
            //Process error
        } else {
            //process JSON output
        }
    }, options);
