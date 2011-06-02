(function() {
  var SailthruClient, SailthruRequest, SailthruUtil, http, https, log, querystring, url;
  var __slice = Array.prototype.slice;
  http = require('http');
  https = require('https');
  url = require('url');
  log = require('util').log;
  querystring = require('querystring');
  SailthruUtil = require('./sailthru_util').SailthruUtil;
  SailthruRequest = (function() {
    var valid_methods;
    function SailthruRequest() {}
    valid_methods = ['GET', 'POST', 'DELETE'];
    SailthruRequest.prototype._http_request = function(uri, data, method, callback) {
      var http_protocol, options, parse_uri, query_string, req, string_json_data;
      parse_uri = url.parse(uri);
      options = {
        host: parse_uri.host,
        port: parse_uri.protocol === 'https:' ? 443 : 80,
        path: parse_uri.pathname,
        method: method,
        query: data,
        headers: {
          'User-Agent': 'Sailthru API Node/Javascript Client',
          Host: parse_uri.host
        }
      };
      http_protocol = options.port === 443 ? https : http;
      switch (method) {
        case 'GET':
        case 'DELETE':
          query_string = '?' + querystring.stringify(data);
          options.path += query_string;
          break;
        case 'POST':
          string_json_data = JSON.stringify(data);
          options.headers['Content-Length'] = string_json_data.length;
          options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          break;
        default:
          rerurn(false);
      }
      log(method + ' Request');
      req = http_protocol.request(options, function(res) {
        var body, statusCode;
        body = '';
        res.setEncoding('utf8');
        statusCode = res.statusCode;
        log('Status Code: ' + res.statusCode);
        res.on('data', function(chunk) {
          return body += chunk;
        });
        return res.on('end', function() {
          var json_err, json_response;
          json_response = JSON.parse(body);
          if (statusCode === 200) {
            log(json_response);
            return callback(json_response);
          } else {
            json_err = {
              statusCode: statusCode,
              error: json_response.error,
              errmsg: json_response.errmsg
            };
            return callback(json_response, json_err);
          }
        });
      });
      if (method === 'POST') {
        req.write(url.format({
          query: options.query
        }).replace('?', ''), 'utf8');
      }
      return req.end();
    };
    SailthruRequest.prototype._api_request = function(uri, data, request_method, callback) {
      return this._http_request(uri, data, request_method, callback);
    };
    return SailthruRequest;
  })();
  exports.SailthruClient = SailthruClient = (function() {
    function SailthruClient(api_key, api_secret, api_url) {
      this.api_key = api_key;
      this.api_secret = api_secret;
      this.api_url = api_url != null ? api_url : false;
      if (this.api_url === false) {
        this.api_url = 'https://api.sailthru.com';
      }
      this.request = new SailthruRequest;
    }
    SailthruClient.prototype._json_payload = function(data) {
      var payload;
      payload = {
        api_key: this.api_key,
        format: 'json',
        json: JSON.stringify(data)
      };
      payload.sig = SailthruUtil.getSignatureHash(payload, this.api_secret);
      return payload;
    };
    SailthruClient.prototype._apiRequest = function(action, data, method, callback) {
      var json_payload, _url;
      _url = url.parse(this.api_url);
      json_payload = this._json_payload(data);
      return this.request._api_request(_url.href + action, json_payload, method, callback);
    };
    SailthruClient.prototype.apiGet = function(action, data, callback) {
      return this._apiRequest(action, data, 'GET', callback);
    };
    SailthruClient.prototype.apiPost = function(action, data) {
      return this.reuest._api_request(action, data, 'POST', callback);
    };
    SailthruClient.prototype.apiDelete = function(action, data) {
      return this.reuest._api_request(action, data, 'DELETE', callback);
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
