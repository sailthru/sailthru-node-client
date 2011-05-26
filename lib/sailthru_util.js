(function() {
  var SailthruUtil, md5;
  md5 = require('hashlib').md5;
  exports.SailthruUtil = SailthruUtil = (function() {
    function SailthruUtil() {}
    SailthruUtil.getSignatureHash = function(params, secret) {
      return md5(SailthruUtil.getSignatureString(params, secret));
    };
    SailthruUtil.getSignatureString = function(params, secret) {
      return secret + SailthruUtil.extractParamValues(params).sort().join('');
    };
    SailthruUtil.extractParamValues = function(params) {
      var k, temp, v, values;
      values = [];
      for (k in params) {
        v = params[k];
        if (v instanceof Array) {
          temp = SailthruUtil.extractParamValues(v);
          values = values.concat(temp);
        } else if (typeof v === 'string' || typeof v === 'number') {
          values.push(v);
        } else if (typeof v === 'boolean') {
          values.push(v = v === true ? 1 : 0);
        } else {
          values = values.concat(SailthruUtil.extractParamValues(v));
        }
      }
      return values;
    };
    return SailthruUtil;
  })();
}).call(this);
