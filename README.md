sailthru-node-client
====================

For installation instructions, documentation, and examples please visit:
[http://getstarted.sailthru.com/developers/api-libraries/node](http://getstarted.sailthru.com/developers/api-libraries/node)

A simple client library to remotely access the `Sailthru REST API` as per [http://getstarted.sailthru.com/developers/api](http://getstarted.sailthru.com/developers/api)


By default, it will make request in `JSON` format. `XML` format is not supported.

Development
-----------

```
npm install # to install dependencies locally
npm install -g coffee-script # to install coffee-script
cake test # for running tests
cake build # for building and generating JavaScript source
cake watch # for watching file changes
```

Installation
------------

```
npm install sailthru-client
```

Examples
--------

### Initialization

``` js
var apiKey = '******',
    apiSecret = '*****',
    sailthru = require('sailthru-client').createSailthruClient(apiKey, apiSecret);
```

### Getting version

``` js
var version = require('sailthru-client').VERSION;
```

### Enable / Disable LOgging

``` js
sailthru.enableLogging();
sailthru.disableLogging();
```

### Making POST Request

``` js
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
```

### Making POST Request with multipart (Eg: Job API call with import type)

``` js
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
```


### Making GET Request
``` js
// Making /send API GET call
var send_id = 'TE8EZ3-LmosnAgAA';
sailthru.apiGet('send', {send_id: send_id}, function(response, err) {
    console.log(response);        
});
```

### Making DELETE Request
``` js
// /send API DELETE call
var send_id = 'TE8EZ3-LmosnAgAA';
sailthru.apiDelete('send', {send_id: send_id}, function(response, err) {
    console.log(response);
});
```

### [send](http://getstarted.sailthru.com/api/send)

``` js
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
```
