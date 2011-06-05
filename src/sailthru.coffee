http = require 'http'
https = require 'https'
url = require 'url'
{log} = require 'util'
querystring = require 'querystring'

{SailthruUtil} = require './sailthru_util'

class SailthruRequest
    valid_methods = ['GET', 'POST', 'DELETE']

    _http_request: (uri, data, method, callback) ->
        parse_uri = url.parse uri
        options =
            host: parse_uri.host
            port: if parse_uri.protocol is 'https:' then 443 else 80
            path: parse_uri.pathname
            method: method
            query: data
            headers:
                'User-Agent': 'Sailthru API Node/Javascript Client'
                Host: parse_uri.host

        http_protocol = if options.port is 443 then https else http

        query_string = querystring.stringify data

        switch method
            when 'GET', 'DELETE'
                options.path += '?' + query_string
            
            when 'POST'
                options.headers['Content-Length'] = query_string.length
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded'

            else
                # handle error
                rerurn false
            
        log method + ' Request'
        req = http_protocol.request options, (res) ->
            body = ''
            res.setEncoding 'utf8'
            statusCode = res.statusCode
            log 'Status Code: ' + res.statusCode
            res.on 'data', (chunk) ->
                body += chunk
            res.on 'end', ->
                json_response = JSON.parse body
                if statusCode is 200
                    callback json_response
                else
                    json_err =
                        statusCode: statusCode
                        error: json_response.error
                        errormsg: json_response.errormsg

                    callback json_response, json_err

        req.end()
        req.write url.format({query: options.query}).replace('?', ''), 'utf8' if method is 'POST'
        
    _api_request: (uri, data, request_method, callback) ->
        return @_http_request uri, data, request_method, callback

exports.SailthruClient = class SailthruClient
    constructor: (@api_key, @api_secret, @api_url = false) ->
        @api_url = 'https://api.sailthru.com' if @api_url is false
        @request = new SailthruRequest

    _json_payload: (data) ->
        payload =
            api_key: @api_key
            format: 'json'
            json: JSON.stringify data

        payload.sig = SailthruUtil.getSignatureHash payload, @api_secret
        return payload

    _apiRequest: (action, data, method, callback) ->
        _url = url.parse @api_url
        json_payload = @_json_payload data
        return @request._api_request _url.href + action, json_payload, method, callback

    apiGet: (action, data, callback) ->
        @_apiRequest action, data, 'GET', callback

    apiPost: (action, data, callback) ->
        @_apiRequest action, data, 'POST', callback

    apiDelete: (action, data, callback) ->
        @_apiRequest action, data, 'DELETE', callback

    _getOptions: (options) ->
        return if options isnt null then options else {}

    getEmail: (email, callback) ->
        @apiGet 'email', {email: email}, callback

    setEmail: (email, callback, options = null) ->
        data = @_getOptions options
        data.email = email
        @apiPost 'email', data, callback

    send: (template_name, email, vars = {}, options = {}, schedule_time = null, callback) ->
        data =
            template: template_name
            email: email

        data.vars = vars if vars.length > 0
        data.options = options if options.length > 0
        data.schedule_time = schedule_time if schedule_time isnt null

        @apiPost 'send', data, callback

    getSend: (send_id, callback) ->
        @apiGet 'send', {send_id: send_id}, callback

    cancelSend: (sendId, callback) ->
        data =
            send_id: sendId
        @apiDelete 'send', data, callback


# Public API for creating *SailthruClient*
exports.createSailthruClient = (args...) ->
    new SailthruClient args...

