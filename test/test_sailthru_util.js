(function() {
  var SailthruUtil, exec, ref, spawn, testCase;

  SailthruUtil = require('../lib/sailthru_util').SailthruUtil;

  testCase = require('nodeunit').testCase;

  ref = require('child_process'), exec = ref.exec, spawn = ref.spawn;

  exports.testExtractParams = function(test) {
    var expected1, expected2, expected3, expected4, params2, params3, params4, real1, real2, real3, real4;
    test.expect(4);
    expected1 = [1, 2, 3];
    real1 = SailthruUtil.extractParamValues(expected1);
    test.deepEqual(real1, expected1);
    expected2 = ['unix', 'linux', 'windows'];
    params2 = {
      os1: 'unix',
      os2: 'linux',
      os3: 'windows'
    };
    real2 = SailthruUtil.extractParamValues(params2);
    test.deepEqual(real2, expected2);
    expected3 = ['unix', 'linux', 'windows', 'apache', 'nginx', 'IIS', 'apache', 'nginx'];
    params3 = {
      os: ['unix', 'linux', 'windows'],
      linux: {
        server: ['apache', 'nginx']
      },
      windows: {
        server: ['IIS', 'apache', 'nginx']
      }
    };
    real3 = SailthruUtil.extractParamValues(params3);
    test.deepEqual(real3, expected3);
    expected4 = ['unix', 'linux', 1, 0];
    params4 = {
      os: ['unix', 'linux'],
      vals: {
        type1: true,
        type2: false
      }
    };
    real4 = SailthruUtil.extractParamValues(params4);
    test.deepEqual(real4, expected4);
    return test.done();
  };

  exports.testGetSignatureString = function(test) {
    var expected1, expected2, expected3, expected4, params1, params2, params3, params4, real1, real2, real3, real4, secret;
    test.expect(4);
    secret = '12534sbgsd';
    expected1 = secret + 123;
    params1 = [1, 2, 3];
    real1 = SailthruUtil.getSignatureString(params1, secret);
    test.equal(real1, expected1);
    expected2 = secret + ['unix', 'linux', 'windows'].sort().join('');
    params2 = {
      os1: 'unix',
      os2: 'linux',
      os3: 'windows'
    };
    real2 = SailthruUtil.getSignatureString(params2, secret);
    test.equal(real2, expected2);
    expected3 = secret + ['unix', 'linux', 'windows', 'apache', 'nginx', 'IIS', 'apache', 'nginx'].sort().join('');
    params3 = {
      os: ['unix', 'linux', 'windows'],
      linux: {
        server: ['apache', 'nginx']
      },
      windows: {
        server: ['IIS', 'apache', 'nginx']
      }
    };
    real3 = SailthruUtil.getSignatureString(params3, secret);
    test.equal(real3, expected3);
    expected4 = secret + ['unix', 'linux', 1, 0].sort().join('');
    params4 = {
      os: ['unix', 'linux'],
      vals: {
        type1: true,
        type2: false
      }
    };
    real4 = SailthruUtil.getSignatureString(params4, secret);
    test.equal(real4, expected4);
    return test.done();
  };

  exports.testGetSignatureHash = function(test) {
    var expected1, params1, real1, secret;
    test.expect(1);
    secret = '1246helloMan';
    expected1 = SailthruUtil.md5(secret + ['sailthru', 1, 2].sort().join(''));
    params1 = {
      a: ['sailthru', 1, 2]
    };
    real1 = SailthruUtil.getSignatureHash(params1, secret);
    test.equal(real1, expected1);
    return test.done();
  };

  exports.testMd5 = function(test) {
    var data1, data2, expected_has2_value, expected_hash1_value, hash1, hash2;
    test.expect(2);
    data1 = 'simple_text';
    hash1 = SailthruUtil.md5(data1);
    expected_hash1_value = 'b7f6e77dceccceaedc3756be73fa5d63';
    test.equal(hash1, expected_hash1_value, "md5 hash for text: '" + data1 + "'");
    data2 = "नमस्ते विश्व";
    hash2 = SailthruUtil.md5(data2);
    expected_has2_value = 'a76a7baf44b70ec7b2ab63a71fb0ce8c';
    test.equal(hash2, expected_has2_value);
    return test.done();
  };

}).call(this);
