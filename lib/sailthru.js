(function() {
  var SailthruClient, SailthruUtil, http, https, log, querystring, url;
  var __slice = Array.prototype.slice;
  http = require('http');
  https = require('https');
  url = require('url');
  log = require('util').log;
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
    SailthruClient.prototype._http_request = function(uri, data, method, callback) {
      var body, http_protocol, options, parse_uri, query_string, req;
      parse_uri = url.parse(uri);
      options = {
        host: parse_uri.host,
        port: parse_uri.protocol === 'https:' ? 443 : 80,
        path: parse_uri.pathname,
        method: method,
        query: data,
        headers: {
          'User-Agent': 'Sailthru API Node Client',
          Host: parse_uri.host
        }
      };
      http_protocol = options.port === 443 ? https : http;
      switch (method) {
        case 'GET':
        case 'DELETE':
          query_string = '?' + querystring.stringify(data);
          options.path += query_string;
          req = http_protocol.request(options, function(res) {
            var body, statusCode;
            res.setEncoding('utf8');
            statusCode = res.statusCode;
            log('StatusCode: ' + statusCode);
            body = '';
            res.on('data', function(chunk) {
              return body += chunk;
            });
            return res.on('end', function() {
              var json_err, json_response;
              json_response = JSON.parse(body);
              if (statusCode === 200) {
                return callback(json_response);
              } else {
                json_err = {
                  statusCode: statusCode,
                  error: json_response.error,
                  errormsg: json_response.errormsg
                };
                return callback(body, json_err);
              }
            });
          });
          return req.end();
        case 'POST':
          options.headers['Content-Length'] = JSON.stringify(data).length;
          options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          body = '';
          req = http_protocol.request(options, function(res) {
            res.setEncoding('utf8');
            log('StatusCode: ' + res.statusCode);
            res.on('data', function(chunk) {
              return body += chunk;
            });
            return res.on('end', function() {
              var json_error, json_response;
              json_response = JSON.parse(body);
              if (res.statusCode === 200) {
                return callback(json_response);
              } else {
                json_error = {
                  statusCode: res.statusCode,
                  error: json_response.error,
                  errmsg: json_response.errmsg
                };
                return callback(json_response, json_error);
              }
            });
          });
          req.write(url.format({
            query: options.query
          }).replace('?', ''), 'utf8');
          return req.end();
        default:
          return false;
      }
    };
    SailthruClient.prototype._api_request = function(action, data, request_method, callback) {
      var params, payload, _url;
      params = {};
      params.api_key = this.api_key;
      params.format = 'json';
      params.json = this._json_payload(data);
      payload = {
        api_key: this.api_key,
        sig: SailthruUtil.getSignatureHash(params, this.api_secret),
        format: 'json',
        json: this._json_payload(data)
      };
      _url = url.parse(this.api_url);
      return this._http_request(_url.href + "" + action, payload, request_method, callback);
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
