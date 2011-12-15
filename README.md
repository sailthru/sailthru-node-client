sailthru-node-client
====================

A simple client library to remotely access the `Sailthru REST API` as per [http://docs.sailthru.com/api](http://docs.sailthru.com/api)

By default, it will make request in `JSON` format.

Installation
------------

### npm install sailthru-client

Examples
--------

### Initialization

    var apiKey = '******',
        apiSecret = '*****',
        sailthru = require('sailthru-client').createSailthruClient(apiKey, apiSecret);

### Enable / Disable LOgging

    sailthru.enableLogging();
    sailthru.disableLogging();

### Making POST Request
    var data = {
        email: 'praj@infynyxx.com',
        lists: {
            'list-a': 1
        }
    };
    sailthru.apiPost('email', data, function(response, err) {
        if (!err) {
            console.log(response);        
        } else {
            console.log('Error!');
            console.log(err);'
        }
    });

### Making POST Request with multipart (Eg: Job API call with import type)
    // Making import /job API POST call
    // MUltipart call
    var data = {
        job: 'import',
        list: 'test-list',
        file: './emails.txt'
    };
    var multipart_params = ['file']; // this is required to mark file as a multipart upload item'
    sailthru.apiPost('job', data, function(response, err) {
       console.log(response);
    }, multipart_params);


### Making GET Request
    // Making /send API GET call
    var send_id = 'TE8EZ3-LmosnAgAA';
    sailthru.apiGet('send', {send_id: send_id}, function(response, err) {
        console.log(response);        
    });

### Making DELETE Request
    // /send API DELETE call
    var send_id = 'TE8EZ3-LmosnAgAA';
    sailthru.apiDelete('send', {send_id: send_id}, function(response, err) {
        console.log(response);
    });

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
