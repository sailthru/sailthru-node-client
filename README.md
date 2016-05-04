sailthru-node-client
====================

For installation instructions, documentation, and examples please visit:
<http://getstarted.sailthru.com/new-for-developers-overview/api-client-library/node-js-npm>

A simple client library to remotely access the `Sailthru REST API` as per <http://getstarted.sailthru.com/new-for-developers-overview/api/api-overview/>

By default, it will make request in `JSON` format. `XML` format is not supported.

Installation
------------

```
npm install sailthru-client --save
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

### Enable / Disable Logging

``` js
sailthru.enableLogging();
sailthru.disableLogging();
```

### Making POST Request

``` js
var data = {
    email: 'foo@example.com',
    lists: {
        'list-a': 1
    }
};
sailthru.apiPost('email', data, function(err, response) {
    if (!err) {
        console.log(response);
    } else {
        console.log('Error!');
        console.log(err);
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
sailthru.apiPost('job', data, multipart_params, function(err, response) {
   console.log(response);
});
```


### Making GET Request
``` js
// Making /send API GET call
var send_id = 'TE8EZ3-LmosnAgAA';
sailthru.apiGet('send', {send_id: send_id}, function(err, response) {
    console.log(response);
});
```

### Making DELETE Request
``` js
// /send API DELETE call
var send_id = 'TE8EZ3-LmosnAgAA';
sailthru.apiDelete('send', {send_id: send_id}, function(err, response) {
    console.log(response);
});
```

### [send](http://getstarted.sailthru.com/api/send)

``` js
//send
var template = 'my-template',
    email = 'foo@example.com',
    options = {
        'vars': {
            'name': 'Foo Bar',
            'address': 'Queens, NY'
        },
        'options': {
            'test': 1,
            'replyto': 'bar@example.com'
        }
    };
sailthru.send(template, email, options, function(err, response) {
    if (err) {
        console.log("Status Code: " + err.statusCode);
        console.log("Error Code: " + err.error);
        console.log("Error Message: " + err.errormsg);
    } else {
        //process output
    }
});

//multi-send
var emails = ['blah@example.com', 'foo@example.com', 'bar@example.com'],
    template = 'multi-template',
    options = {
        'options': {
            'test': 1
        }
    };
sailthru.multiSend(template, emails, options, function(err, response) {
    if (err) {
        //Process error
    } else {
        //process JSON output
    }
});
```

### Rate Limit Information

The library allows inspection of the 'X-Rate-Limit-*' headers returned by the Sailthru API. The `getLastRateLimitInfo(action, method)` function allows you to retrieve the last known rate limit information for the given action / method combination. It must follow an API call. For example, if you do a `/send POST`, you can follow up with a call to `getLastRateLimitInfo('send', 'POST')` as shown below:

``` js
// make API call as normal
sailthru.apiPost('send', {'template': 'my template', 'email': 'foo@example.com'}, function(err, response) {
    if (!err) {
        console.log(response);
    } else {
        console.log('Error!');
        console.log(err);
    }
});

// check rate limit information
var rateLimitInfo = sailthru.getLastRateLimitInfo('send', 'POST');
```

The return type will be `undefined` if there is no rate limit information for the given action / method combination (e.g. if you have not yet made a request to that endpoint). Otherwise, it will be an object in the following format:

``` js
{
    limit: 1234, // <Number representing the limit of requests/minute for this action / method combination>
    remaining: 1230, // <Number representing how many requests remain in the current minute>
    reset: 1459381680 // <Number representing the UNIX epoch timestamp of when the next minute starts, and when the rate limit resets>
}
```

Development
-----------

```
npm install -g grunt-cli
npm install # to install dependencies locally
grunt # for running tests
```
