// refactored to resolve scoping issue and remove superfluous variables
(function () {
  // removed VERSION declaration as it was unused.
  var crypto = require("crypto"),
    SailthruUtil = function () {}; // initialized as an object

  // adding methods to the object so that it's effectively a class
  SailthruUtil.getSignatureHash = function (params, secret) {
    return SailthruUtil.md5(SailthruUtil.getSignatureString(params, secret));
  };

  SailthruUtil.getSignatureString = function (params, secret) {
    return secret + SailthruUtil.extractParamValues(params).sort().join("");
  };

  SailthruUtil.md5 = function (data) {
    var md5;
    md5 = crypto.createHash("md5");
    md5.update(data, "utf8");
    return md5.digest("hex");
  };

  SailthruUtil.extractParamValues = function (params) {
    var k, temp, v, values;
    values = [];
    for (k in params) {
      v = params[k];
      if (v instanceof Array) {
        temp = SailthruUtil.extractParamValues(v);
        values = values.concat(temp);
      } else if (typeof v === "string" || typeof v === "number") {
        values.push(v);
      } else if (typeof v === "boolean") {
        values.push((v = v === true ? 1 : 0));
      } else {
        values = values.concat(SailthruUtil.extractParamValues(v));
      }
    }
    return values;
  };

  // export an instance of the class
  exports.SailthruUtil = SailthruUtil();

  // export a log function
  exports.log = function (string) {
    return console.log(
      new Date().toLocaleString(),
      "sailthru-client - " + string
    );
  };
}).call(this);
