(function() {
  var SailthruClient, SailthruUtil, http, https, querystring, url;
  url = require('url');
  querystring = require('querystring');
  http = require('http');
  https = require('https');
  url = require('url');
  SailthruUtil = require('./sailthru_util');
  module.exports = SailthruClient = (function() {
    function SailthruClient(api_key, api_secret, api_url) {
      this.api_key = api_key;
      this.api_secret = api_secret;
      this.api_url = api_url != null ? api_url : false;
    }
    SailthruClient.prototype.http_request = function(uri, data, method) {
      if (method == null) {
        method = 'POST';
      }
      data = flatten_nested_hash(data, false);
      switch (method) {
        case 'POST':
          return true;
        case 'GET':
          return true;
        case 'DELETE':
          return true;
        default:
          return false;
      }
    };
    SailthruClient.prototype.http_request_get = function(request_query, method) {
      var options;
      if (method == null) {
        method = 'GET';
      }
      return options = {
        host: request_query.hostname,
        port: 80,
        path: request_query.path + request
      };
    };
    return SailthruClient;
  })();
}).call(this);
