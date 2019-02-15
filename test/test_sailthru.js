(function() {
  var mock = require('mock-require');
  mock('fs', {
    statSync: function() { return {size: 2}; },
    fstatSync: function() { return {size: 1024}; },
    open: function(a,b,cb) { cb(); },
    read: function(a,b,c,d,e,cb) { cb(null, null, b); },
    close: function() {}
  });

  var SailthruClient = require('../lib/sailthru').createSailthruClient('abcd12345', '1324qwerty'),
    SailthruClientBadUrl = require('../lib/sailthru').createSailthruClient('abcd12345', '1324qwerty', 'http://foo'),
    nock = require('nock');

  SailthruClient.disableLogging();
  SailthruClientBadUrl.disableLogging();

  exports.setUp = function(cb) {
    nock.disableNetConnect();
    cb();
  };

  exports.tearDown = function(cb) {
    cb();
  };

  exports.receiveOptoutPost = function(test) {
    var params1, params2, params3, params4, params5, params6, params7, real1, real2, real3, real4, real5, real6, real7;
    test.expect(7);
    params1 = {
      action: 'optout',
      email: 'foo@bar.com',
      sig: '89b9fce5296ce2920dad46ed3467001d'
    };
    real1 = SailthruClient.receiveOptoutPost(params1);
    test.ok(real1);

    params2 = {
      action: 'optout',
      email: 'foo@bar.com'
    };
    real2 = SailthruClient.receiveOptoutPost(params2);
    test.ok(!real2);

    params3 = {
      action: 'optout',
      sig: '9577f7aae68bc22b4e4d0709b1f2afa8'
    };
    real3 = SailthruClient.receiveOptoutPost(params3);
    test.ok(!real3);

    params4 = {
      email: 'foo@bar.com',
      sig: '37b11fcea15a1ff5e21b7c8467e93015'
    };
    real4 = SailthruClient.receiveOptoutPost(params4);
    test.ok(!real4);

    params5 = {
      action: 'baz',
      email: 'foo@bar.com',
      sig: '28916f39794b7d8e6c927a1e94d99f93'
    };
    real5 = SailthruClient.receiveOptoutPost(params5);
    test.ok(!real5);

    params6 = {
      action: 'optout',
      email: 'foo@bar.com',
      sig: '110993c3e8786cb4ebdd509ea6115fea'
    };
    real6 = SailthruClient.receiveOptoutPost(params6);
    test.ok(!real6);

    params7 = undefined;
    real7 = SailthruClient.receiveOptoutPost(params7);
    test.ok(!real7);

    return test.done();
  };

  exports.connection = function(test) {
    nock('https://api.sailthru.com')
      .get(/^\/list/).reply(404, {errormsg: 'Not Found'});

    var callback1, callback2, connectErrMsg, finished, params1, params2;

    test.expect(3);
    finished = 0;

    // Since bad url http://foo is not mocked, expected Nock Net connect error
    params1 = 'foo@bar.com';
    callback1 = function(err, res) {
      test.equal(err.name, 'NetConnectNotAllowedError');
      if (finished) {
        test.done();
      }
      return finished++;
    };
    SailthruClientBadUrl.getLists(callback1);

    // Using real URL
    params2 = 'foo@bar.com';
    callback2 = function(err, res) {
      test.equal(err.statusCode, 404);
      test.equal(err.errormsg, 'Not Found');
      if (finished) {
        test.done();
      }
      return finished++;
    };
    SailthruClient.getLists(callback2);
  };

  var verifyPortProtocolLeadsToExpectedHTTPCall = function(api_url, expected_url, test) {
    var SailthruClientLocal = require('../lib/sailthru').createSailthruClient('abcd12345', '1324qwerty', api_url);
    SailthruClientLocal.disableLogging();
    nock(expected_url).get(/^\/list/).reply(200, {});
    test.expect(1);
    SailthruClientLocal.getLists(function(err, res) {
      test.equal(err, undefined);
      test.done();
    });
  };

  exports.noUrlShouldDefaultToSailthruProduction = function(test) {
    // no URL at all should use https://api.sailthru.com
    verifyPortProtocolLeadsToExpectedHTTPCall(undefined, 'https://api.sailthru.com', test);
  };

  exports.portAndProtocolOptionsNoPortNoProtocol = function(test) {
    // no port and no protocol should use https://api.sailthru.com
    verifyPortProtocolLeadsToExpectedHTTPCall('api.sailthru.com', 'https://api.sailthru.com', test);
  };

  exports.portAndProtocolOptionsNoPortHttpProtocol = function(test) {
    // no port and http protocol should use http://api.sailthru.com
    verifyPortProtocolLeadsToExpectedHTTPCall('http://api.sailthru.com', 'http://api.sailthru.com', test);
  };

  exports.portAndProtocolOptionsOverridePortHttpProtocol = function(test) {
    // non-standard port and http protocol should use http://api.sailthru.com:<port>
    verifyPortProtocolLeadsToExpectedHTTPCall('http://api.sailthru.com:8080', 'http://api.sailthru.com:8080', test);
  };

  exports.portAndProtocolOptionsNoPortHttpsProtocol = function(test) {
    // no port and https protocol should use https://api.sailthru.com
    verifyPortProtocolLeadsToExpectedHTTPCall('https://api.sailthru.com', 'https://api.sailthru.com', test);
  };

  exports.portAndProtocolOptionsOverridePortHttpsProtocol = function(test) {
    // non-standard port and https protocol should use https://api.sailthru.com:<port>
    verifyPortProtocolLeadsToExpectedHTTPCall('https://api.sailthru.com:4343', 'https://api.sailthru.com:4343', test);
  };

  exports.portAndProtocolOptionsPortWithoutProtocol = function(test) {
    // API client does not support specifying port without protocol, so expect Error
    test.throws(function() {
        require('../lib/sailthru').createSailthruClient('abcd12345', '1324qwerty', 'api.sailthru.com:80');
    }, Error);
    test.done();
  };

  exports.portAndProtocolOptionsInvalidProtocol = function(test) {
    // API client does not support protocols other than HTTP and HTTPS
    test.throws(function() {
        require('../lib/sailthru').createSailthruClient('abcd12345', '1324qwerty', 'ftp://api.sailthru.com');
    }, Error);
    test.done();
  };

  exports.getUserBySidWithEmail = function(test) {
    nock('https://api.sailthru.com')
      .get(/^\/user/)
      .query(function(q) {
        var data = JSON.parse(q.json);
        return data.id == 'email@test.com';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.getUserBySid('email@test.com', callback);
  };

  exports.getUserBySidWithSid = function(test) {
    nock('https://api.sailthru.com')
      .get(/^\/user/)
      .query(function(q) {
        var data = JSON.parse(q.json);
        return data.id == '57e54ddc83ba8895008b4567';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.getUserBySid('57e54ddc83ba8895008b4567', callback);
  };

  exports.getUserByKeyWithEmailAndNoFields = function(test) {
    nock('https://api.sailthru.com')
      .get(/^\/user/)
      .query(function(q) {
        var data = JSON.parse(q.json);
        return data.id == 'test@example.com' && data.key == 'email';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.getUserByKey('test@example.com', 'email', callback);
  };

  exports.getUserByKeyWithEmailAndFields = function(test) {
    nock('https://api.sailthru.com')
      .get(/^\/user/)
      .query(function(q) {
        var data = JSON.parse(q.json);
        return data.id == 'test@example.com' && data.key == 'email'
          && data.fields.lists == 1;
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.getUserByKey('test@example.com', 'email', {lists: 1}, callback);
  };

  exports.statsBlast = function(test) {
    nock('https://api.sailthru.com')
      .get(/^\/stats/)
      .query(function(q) {
        var data = JSON.parse(q.json);
        return data.stat == 'blast';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.statsBlast({}, callback);
  };

  exports.statsList = function(test) {
    nock('https://api.sailthru.com')
      .get(/^\/stats/)
      .query(function(q) {
        var data = JSON.parse(q.json);
        return data.stat == 'list';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.statsList({}, callback);
  };

  exports.saveTemplate = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/template/, function(q) {
        var data = JSON.parse(q.json);
        return data.template == 'example';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.saveTemplate('example', callback);
  };

  exports.saveTemplateFromRevision = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/template/, function(q) {
        var data = JSON.parse(q.json);
        return data.template == 'example' && data.revision == 1234;
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.saveTemplateFromRevision('example', 1234, callback);
  };

  exports.unscheduleBlast = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/blast/, function(q) {
        var data = JSON.parse(q.json);
        return data.blast_id == 1234 && data.schedule_time == '' && data.status == 'draft';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.unscheduleBlast(1234, callback);
  };

  exports.pauseBlast = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/blast/, function(q) {
        var data = JSON.parse(q.json);
        return data.blast_id == 1234 && data.paused == true;
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.pauseBlast(1234, callback);
  };

  exports.pauseBlast = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/blast/, function(q) {
        var data = JSON.parse(q.json);
        return data.blast_id == 1234 && data.paused == false;
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.resumeBlast(1234, callback);
  };

  exports.cancelBlast = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/blast/, function(q) {
        var data = JSON.parse(q.json);
        return data.blast_id == 1234 && data.status == 'sent';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    SailthruClient.cancelBlast(1234, callback);
  };

  exports.processJobNormalCall = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/job/, function(q) {
        var data = JSON.parse(q.json);
        return data.job === 'import' && data.list === 'abc';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    var options = {
      list: 'abc'
    };
    SailthruClient.processJob('import', options, callback);
  };

  exports.processJobWithReportEmail = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/job/, function(q) {
        var data = JSON.parse(q.json);
        return data.job === 'import' && data.list === 'abc' && data.report_email === 'report@example.com';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    var options = {
      list: 'abc'
    };
    SailthruClient.processJob('import', options, 'report@example.com', callback);
  };

  exports.processJobWithReportEmailAndPostback = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/job/, function(q) {
        var data = JSON.parse(q.json);
        return data.job === 'import' && data.list === 'abc' && data.report_email === 'report@example.com'
          && data.postback_url === 'http://example.com/post.php';
      }).reply(200, {/* don't care about response */});

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    var options = {
      list: 'abc'
    };
    SailthruClient.processJob('import', options, 'report@example.com', 'http://example.com/post.php', callback);
  };

  exports.processJobWithFile = function(test) {
    nock(/.*sailthru.com.*/)
      .post(/.*/, function(q) {
        return q.match(/new_users.csv/);
      }).reply(200, 'success');

    test.expect(1);

    var callback = function(err, res) {
      test.equal(err, undefined);
      test.done();
    };
    var options = {
      list: 'abc',
      file: 'tmp/new_users.csv'
    };
    SailthruClient.processJob('import', options, 'report@example.com', 'http://example.com/post.php', ['file'], callback);
  };

  exports.getLastRateLimitInfoSingleCase = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/send/).reply(200, {ok: true}, {'X-Rate-Limit-Limit': 1234, 'X-Rate-Limit-Remaining': 1230, 'X-Rate-Limit-Reset': 1459382280});

    test.expect(4);
    SailthruClient.apiPost('send', {email: 'abc@example.com', 'template': 'my template'}, function(err, response) {
      test.ok(!err);
      test.deepEqual(response, {ok: true});

      var rateLimitInfo = SailthruClient.getLastRateLimitInfo('send', 'POST');
      test.deepEqual(rateLimitInfo, {
        limit: 1234,
        remaining: 1230,
        reset: 1459382280
      });

      // Trying to get Rate Limit info for a call that was never made should return 'undefined'
      rateLimitInfo = SailthruClient.getLastRateLimitInfo('send', 'GET');
      test.strictEqual(rateLimitInfo, undefined);

      test.done();
    });
  };

  exports.getLastRateLimitInfoMultiCase = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/send/).reply(200, {ok: true}, {'X-Rate-Limit-Limit': 1234, 'X-Rate-Limit-Remaining': 1230, 'X-Rate-Limit-Reset': 1459382280})
      .get(/^\/send/).reply(200, {ok: true}, {'X-Rate-Limit-Limit': 18000, 'X-Rate-Limit-Remaining': 17999, 'X-Rate-Limit-Reset': 1459382280});

    test.expect(4);
    SailthruClient.apiPost('send', {email: 'abc@example.com', 'template': 'my template'}, function(err, response) {
      test.ok(!err);
      test.deepEqual(response, {ok: true});

      var rateLimitInfo = SailthruClient.getLastRateLimitInfo('send', 'POST');
      test.deepEqual(rateLimitInfo, {
        limit: 1234,
        remaining: 1230,
        reset: 1459382280
      });

      SailthruClient.apiGet('send', {send_id: 'blah'}, function(err, response) {
        rateLimitInfo = SailthruClient.getLastRateLimitInfo('send', 'GET');
        test.deepEqual(rateLimitInfo, {
          limit: 18000,
          remaining: 17999,
          reset: 1459382280
        });

        test.done();
      });
    });
  };

  exports.getLastRateLimitInfoMultiCase = function(test) {
    nock('https://api.sailthru.com')
      .post(/^\/send/).reply(200, {ok: true}, {'X-Rate-Limit-Limit': 1234, 'X-Rate-Limit-Remaining': 1230, 'X-Rate-Limit-Reset': 1459382280})
      .post(/^\/user/).reply(200, {ok: true}, {'X-Rate-Limit-Limit': 2400, 'X-Rate-Limit-Remaining': 2399, 'X-Rate-Limit-Reset': 1459382280});

    test.expect(4);
    SailthruClient.apiPost('send', {email: 'abc@example.com', 'template': 'my template'}, function(err, response) {
      test.ok(!err);
      test.deepEqual(response, {ok: true});

      var rateLimitInfo = SailthruClient.getLastRateLimitInfo('send', 'POST');
      test.deepEqual(rateLimitInfo, {
        limit: 1234,
        remaining: 1230,
        reset: 1459382280
      });

      SailthruClient.apiPost('user', {id: 'blah@example.com'}, function(err, response) {
        rateLimitInfo = SailthruClient.getLastRateLimitInfo('user', 'post');
        test.deepEqual(rateLimitInfo, {
          limit: 2400,
          remaining: 2399,
          reset: 1459382280
        });

        test.done();
      });
    });
  };

}).call(this);
