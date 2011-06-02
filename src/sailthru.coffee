http = require 'http'
https = require 'https'
url = require 'url'
{log} = require 'util'
querystring = require 'querystring'

{SailthruUtil} = require './sailthru_util'

exports.SailthruClient = class SailthruClient
    valid_methods = ['GET', 'POST', 'DELETE']

    constructor: (@api_key, @api_secret, @api_url=false) ->
        @api_url = 'https://api.sailthru.com' if @api_url is false

    _http_request: (uri, data, method, callback) ->
        parse_uri = url.parse uri
        options =
            host: parse_uri.host
            port: if parse_uri.protocol is 'https:' then 443 else 80
            path: parse_uri.pathname
            method: method
            query: data
            headers:
                'User-Agent': 'Sailthru API Node Client'
                Host: parse_uri.host

        http_protocol = if options.port is 443 then https else http

        switch method
            when 'GET', 'DELETE'
                query_string = '?' + querystring.stringify data
                options.path += query_string
            
            when 'POST'
                string_json_data = JSON.stringify data
                options.headers['Content-Length'] = string_json_data.length
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded'

            else
                # handle error
                rerurn false
            
        body = ''

        req = http_protocol.request options, (res) ->
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
                        errmsg: json_response.errmsg

                    callback json_response, json_err

        req.write url.format({query: options.query}).replace('?', ''), 'utf8' if method is 'POST'

        req.end()
        
        
    _api_request: (action, data, request_method, callback) ->

        params = {}
        params.api_key = @api_key
        params.format = 'json'
        params.json = @_json_payload data
        
        payload =
            api_key: @api_key
            sig: SailthruUtil.getSignatureHash params, @api_secret
            format: 'json'
            json: @_json_payload data

        _url = url.parse @api_url
        
        return @_http_request _url.href + "" + action, payload, request_method, callback

    _json_payload: (data) ->
        JSON.stringify data

# Public API for creating *SailthruClient*
exports.createSailthruClient = (args...) ->
    new SailthruClient args...

