(function() {
  var SailthruClient, SailthruClientBadUrl, testCase;

  SailthruClient = require('../lib/sailthru').createSailthruClient('abcd12345', '1324qwerty');

  SailthruClientBadUrl = require('../lib/sailthru').createSailthruClient('abcd12345', '1324qwerty', 'http://foo');

  SailthruClient.disableLogging();

  SailthruClientBadUrl.disableLogging();

  testCase = require('nodeunit').testCase;

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
    var callback1, callback2, connectErrMsg, finished, params1, params2;
    test.expect(2);
    connectErrMsg = 'getaddrinfo ENOENT';
    finished = 0;
    params1 = 'foo@bar.com';
    callback1 = function(err, res) {
      test.ok(err !== null, "err exists: " + err);
      if (finished) {
        test.done();
      }
      return finished++;
    };
    SailthruClientBadUrl.getEmail(params1, callback1);
    params2 = 'foo@bar.com';
    callback2 = function(err, res) {
      test.notEqual(err, connectErrMsg);
      if (finished) {
        test.done();
      }
      return finished++;
    };
    return SailthruClient.getEmail(params2, callback2);
  };

}).call(this);
