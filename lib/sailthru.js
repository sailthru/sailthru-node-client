(function() {
  var LOGGING, SailthruClient, SailthruRequest, SailthruUtil, USER_AGENT, http, https, log, log2, querystring, rest, url, _ref;
  var __slice = Array.prototype.slice;
  http = require('http');
  https = require('https');
  url = require('url');
  querystring = require('querystring');
  rest = require('restler');
  /*
  API client version
  */
  exports.VERSION = '1.0.2';
  /*
  LOGGING Flag
  */
  LOGGING = true;
  USER_AGENT = 'Sailthru API Node/JavaScript Client';
  _ref = require('./sailthru_util'), SailthruUtil = _ref.SailthruUtil, log = _ref.log;
  /*
  helper logging function
  */
  log2 = function(string) {
    if (LOGGING === true) {
      return log(string);
    }
  };
  /*
  Private class to make HTTP request
  */
  SailthruRequest = (function() {
    var valid_methods;
    function SailthruRequest() {}
    valid_methods = ['GET', 'POST', 'DELETE'];
    SailthruRequest.prototype._http_request = function(uri, data, method, callback, binary_data_params) {
      var http_protocol, options, parse_uri, query_string, req;
      if (binary_data_params == null) {
        binary_data_params = [];
      }
      parse_uri = url.parse(uri);
      options = {
        host: parse_uri.host,
        port: parse_uri.protocol === 'https:' ? 443 : 80,
        path: parse_uri.pathname,
        method: method,
        query: data,
        headers: {
          'User-Agent': USER_AGENT,
          Host: parse_uri.host
        }
      };
      http_protocol = options.port === 443 ? https : http;
      query_string = querystring.stringify(data);
      switch (method) {
        case 'GET':
        case 'DELETE':
          options.path += '?' + query_string;
          break;
        case 'POST':
          options.headers['Content-Length'] = query_string.length;
          options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          break;
        default:
          rerurn(false);
      }
      log2(method + ' Request');
      req = http_protocol.request(options, function(res) {
        var body, statusCode;
        body = '';
        res.setEncoding('utf8');
        statusCode = res.statusCode;
        log2('Status Code: ' + res.statusCode);
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
            return callback(json_response, json_err);
          }
        });
      });
      req.end();
      if (method === 'POST') {
        return req.write(url.format({
          query: options.query
        }).replace('?', ''), 'utf8');
      }
    };
    SailthruRequest.prototype._api_request = function(uri, data, request_method, callback, binary_data_params) {
      if (binary_data_params == null) {
        binary_data_params = [];
      }
      return this._http_request(uri, data, request_method, callback, binary_data_params);
    };
    return SailthruRequest;
  })();
  SailthruClient = (function() {
    /*
        By default enable logging
        */    SailthruClient.logging = true;
    function SailthruClient(api_key, api_secret, api_url) {
      this.api_key = api_key;
      this.api_secret = api_secret;
      this.api_url = api_url != null ? api_url : false;
      if (this.api_url === false) {
        this.api_url = 'https://api.sailthru.com';
      }
      this.request = new SailthruRequest;
    }
    /*
        prepare JSON payload
        */
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
    /*
        Unified function for making request to API request
        Doesn't handle multipart request 
        */
    SailthruClient.prototype._apiRequest = function(action, data, method, callback) {
      var json_payload, _url;
      _url = url.parse(this.api_url);
      json_payload = this._json_payload(data);
      return this.request._api_request(_url.href + action, json_payload, method, callback);
    };
    SailthruClient.prototype.enableLogging = function() {
      LOGGING = true;
    };
    SailthruClient.prototype.disableLogging = function() {
      LOGGING = false;
    };
    /*
        GET call
        */
    SailthruClient.prototype.apiGet = function(action, data, callback) {
      return this._apiRequest(action, data, 'GET', callback);
    };
    /*
        POST call
        */
    SailthruClient.prototype.apiPost = function(action, data, callback, binary_data_params) {
      if (binary_data_params == null) {
        binary_data_params = [];
      }
      if (binary_data_params.length > 0) {
        return this.apiPostMultiPart(action, data, callback, binary_data_params);
      } else {
        return this._apiRequest(action, data, 'POST', callback);
      }
    };
    /*
        POST call with Multipart
        */
    SailthruClient.prototype.apiPostMultiPart = function(action, data, callback, binary_data_params) {
      var binary_data, json_payload, param, value, _i, _len, _url;
      if (binary_data_params == null) {
        binary_data_params = [];
      }
      binary_data = {};
      for (_i = 0, _len = binary_data_params.length; _i < _len; _i++) {
        param = binary_data_params[_i];
        binary_data[param] = rest.file(data[param]);
        delete data[param];
      }
      _url = url.parse(this.api_url);
      json_payload = this._json_payload(data);
      for (param in binary_data) {
        value = binary_data[param];
        json_payload[param] = value;
      }
      log2(_url.href + action);
      log2('MultiPart Request');
      log2('JSON Payload: ' + JSON.stringify(json_payload));
      return rest.post(_url.href + action, {
        multipart: true,
        'User-Agent': USER_AGENT,
        data: json_payload
      }).on('complete', function(data) {
        return callback(data);
      });
    };
    /*
        DELETE call
        */
    SailthruClient.prototype.apiDelete = function(action, data, callback) {
      return this._apiRequest(action, data, 'DELETE', callback);
    };
    /*
        options mixin
        */
    SailthruClient.prototype._getOptions = function(options) {
      if (options !== null) {
        return options;
      } else {
        return {};
      }
    };
    SailthruClient.prototype.getEmail = function(email, callback) {
      return this.apiGet('email', {
        email: email
      }, callback);
    };
    SailthruClient.prototype.setEmail = function(email, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.email = email;
      return this.apiPost('email', data, callback);
    };
    SailthruClient.prototype.send = function(template, email, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.template = template;
      data.email = email;
      return this.apiPost('send', data, callback);
    };
    SailthruClient.prototype.multiSend = function(template, emails, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.template = template;
      data.email = emails instanceof Array ? emails.join(',') : emails;
      return this.apiPost('send', data, callback);
    };
    SailthruClient.prototype.getSend = function(send_id, callback) {
      return this.apiGet('send', {
        send_id: send_id
      }, callback);
    };
    SailthruClient.prototype.cancelSend = function(sendId, callback) {
      var data;
      data = {
        send_id: sendId
      };
      return this.apiDelete('send', data, callback);
    };
    SailthruClient.prototype.getBlast = function(blastId, callback) {
      var data;
      data = {
        blast_id: blastId
      };
      return this.apiGet('blast', data, callback);
    };
    SailthruClient.prototype.deleteBlast = function(blastId, callback) {
      var data;
      data = {
        blast_id: blastId
      };
      return this.apiDelete('blast', data, callback);
    };
    SailthruClient.prototype.cancelBlast = function(blastId, callback) {
      var data;
      data = {
        blast_id: blastId,
        schedule_time: ''
      };
      return this.apiPost('blast', data, callback);
    };
    SailthruClient.prototype.updateBlast = function(blastId, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.blast_id = blastId;
      return this.apiPost('blast', data, callback);
    };
    SailthruClient.prototype.scheduleBlastFromBlast = function(blastId, scheduleTime, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.blast_id = blastId;
      data.schedule_time = scheduleTime;
      return this.apiPost('blast', data, callback);
    };
    SailthruClient.prototype.scheduleBlastFromTemplate = function(blastId, template, list, scheduleTime, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.blast_id = blastId;
      data.copy_template = template;
      data.list = list;
      data.schedule_time = scheduleTime;
      return this.apiPost('blast', data, callback);
    };
    SailthruClient.prototype.scheduleBlast = function(name, list, scheduleTime, fromName, fromEmail, subject, contentHtml, contentText, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.name = name;
      data.list = list;
      data.schedule_time = scheduleTime;
      data.from_name = fromName;
      data.from_emai = fromEmail;
      data.subject = subject;
      data.content_html = contentHtml;
      data.content_text = contentText;
      return this.apiPost('blast', data, callback);
    };
    SailthruClient.prototype.getTemplates = function(callback) {
      return this.apiGet('template', {}, callback);
    };
    SailthruClient.prototype.getTemplate = function(template, callback) {
      var data;
      data = {
        template: template
      };
      return this.apiGet('template', data, callback);
    };
    SailthruClient.prototype.getTemplateFromRevision = function(revisionId, callback) {
      var data;
      data = {
        revision: revisionId
      };
      return this.apiGet('template', data, callback);
    };
    SailthruClient.prototype.saveTemplate = function(template, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.template = template;
      return this.apiPost('template', data, callback);
    };
    SailthruClient.prototype.saveTemplateFromRevision = function(template, revisionId, callback) {
      var options;
      options = {
        revision: revisionId
      };
      return this.saveTemplate(template, callback, options);
    };
    SailthruClient.prototype.deleteTemplate = function(template, callback) {
      return this.apiDelete('template', {
        template: template
      }, callback);
    };
    SailthruClient.prototype.getLists = function(callback) {
      var data;
      data = {
        list: ''
      };
      return this.apiGet('list', data, callback);
    };
    SailthruClient.prototype.deleteList = function(list, callback) {
      var data;
      data = {
        list: list
      };
      return this.apiDelete('list', data, callback);
    };
    SailthruClient.prototype.importContacts = function(email, password, callback, includeNames) {
      var data;
      if (includeNames == null) {
        includeNames = true;
      }
      data = {
        email: email,
        password: password
      };
      if (includeNames === true) {
        data.names = 1;
      }
      return this.apiPost('contacts', data, callback);
    };
    SailthruClient.prototype.pushContent = function(title, url, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.title = title;
      data.url = url;
      if (data.tags && data.tags instanceof Array) {
        data.tags = data.tags.join(',');
      }
      return this.apiPost('content', data, callback);
    };
    SailthruClient.prototype.getAlert = function(email, callback) {
      var data;
      data = {
        email: email
      };
      return this.apiGet('alert', data, callback);
    };
    SailthruClient.prototype.saveAlert = function(email, type, template, callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.email = email;
      data.type = type;
      data.template = template;
      data.when = data.when && type === 'weekly' || type === 'daily' ? data.when : delete data.when;
      return this.apiPost('alert', data, callback);
    };
    SailthruClient.prototype.deleteAler = function(email, alertId, callback) {
      var data;
      data = {
        email: email,
        alert_id: alertId
      };
      return this.apiDelete('alert', data, callback);
    };
    SailthruClient.prototype.purchase = function(email, items, callback, options) {
      var data;
      data = this._getOptions(options);
      data.email = email;
      data.items = items;
      return this.apiPost('purchase', data, callback);
    };
    SailthruClient.prototype.stats = function(data, callback) {
      return this.apiGet('stats', data, callback);
    };
    SailthruClient.prototype.statsList = function(callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.stat = 'blast';
      return this.stats(data, callback);
    };
    SailthruClient.prototype.statsBlast = function(callback, options) {
      var data;
      if (options == null) {
        options = null;
      }
      data = this._getOptions(options);
      data.stat = 'blast';
      return this.stats(data, callback);
    };
    SailthruClient.prototype.getHorizon = function(email, callback, hidOnly) {
      var data;
      if (hidOnly == null) {
        hidOnly = false;
      }
      data = {
        email: email
      };
      if (hidOnly === true) {
        data.hid_only = 1;
      }
      return this.apiGet('horizon', data, callback);
    };
    SailthruClient.prototype.setHorizon = function(email, callback, tags) {
      var data;
      if (tags == null) {
        tags = null;
      }
      data = {
        email: email
      };
      if (tags !== null) {
        data.tags = tags instanceof Array ? tags.join(',') : tags;
      }
      return this.apiPost('horizon', data, callback);
    };
    SailthruClient.prototype.getJobStatus = function(jobId, callback) {
      return this.apiGet('job', {
        'job_id': job_id
      }, callback);
    };
    SailthruClient.prototype.processJob = function(job, callback, options, report_email, postback_url, binary_data_params) {
      var data;
      if (options == null) {
        options = null;
      }
      if (report_email == null) {
        report_email = false;
      }
      if (postback_url == null) {
        postback_url = false;
      }
      if (binary_data_params == null) {
        binary_data_params = Array;
      }
      data = this._getOptions(options);
      data['job'] = job;
      if (report_email !== false) {
        data['report_email'] = report_email;
      }
      if (postback_url !== false) {
        data['postback_url'] = postback_url;
      }
      return this.apiPost('job', data, callback, binary_data_params);
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
  exports.createClient = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(SailthruClient, args, function() {});
  };
}).call(this);
