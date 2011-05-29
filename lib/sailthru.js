(function() {
  var SailthruClient, SailthruUtil, http, https, querystring, url;
  var __slice = Array.prototype.slice;
  http = require('http');
  https = require('https');
  url = require('url');
  querystring = require('querystring');
  SailthruUtil = require('./sailthru_util').SailthruUtil;
  exports.SailthruClient = SailthruClient = (function() {
    var valid_methods;
    valid_methods = ['GET', 'POST', 'DELETE'];
    function SailthruClient(api_key, api_secret, api_url) {
      this.api_key = api_key;
      this.api_secret = api_secret;
      this.api_url = api_url != null ? api_url : false;
      if (this.api_url === false) {
        this.api_url = 'https://api.sailthru.com';
      }
    }
    SailthruClient.prototype._http_request = function(uri, data, method) {
      var http_protocol, options, parse_uri, query_string, req;
      if (method == null) {
        method = 'GET';
      }
      parse_uri = url.parse(uri);
      options = {
        host: parse_uri.host,
        port: parse_uri.protocol === 'https:' ? 443 : 80,
        path: parse_uri.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Sailthru API Node Client'
        }
      };
      http_protocol = options.port === 443 ? https : http;
      switch (method) {
        case 'GET':
        case 'DELETE':
          query_string = '?' + querystring.stringify(data);
          options.path += query_string;
          req = http_protocol.request(options, function(res) {
            return res.on('data', function(chunk) {
              return process.stdout.write(chunk);
            });
          });
          return req.end();
        case 'POST':
          options.headers['Content-Length'] = JSON.stringify(data);
          req = http.request(options, function(res) {
            res.body = '';
            res.on('data', function(chunk) {
              return res.body += chunk;
            });
            return res.on('end', function() {
              return console.log('ending...');
            });
          });
          return req.end();
        default:
          return false;
      }
    };
    SailthruClient.prototype._api_request = function(action, data, request_method) {
      var params, payload, _url;
      if (request_method == null) {
        request_method = 'GET';
      }
      params = {};
      params.api_key = this.api_key;
      params.format = 'json';
      params.json = this._json_payload(data);
      payload = {
        api_key: this.api_key,
        sig: SailthruUtil.getSignatureHash(params, this.secret),
        format: 'json',
        json: this._json_payload(data)
      };
      _url = url.parse(this.api_url);
      return this._http_request(_url.href + "" + action, payload, request_method);
    };
    SailthruClient.prototype._json_payload = function(data) {
      return JSON.stringify(data);
    };
    return SailthruClient;
  })();
  exports.createSailthruClient = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(SailthruClient, args, function() {});
  };
}).call(this);
