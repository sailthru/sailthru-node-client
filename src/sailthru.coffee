url = require 'url'
querystring = require 'querystring'
http = require 'http'
https = require 'https'
url = require 'url'

SailthruUtil = require './sailthru_util'

module.exports = class SailthruClient
    constructor: (@api_key, @api_secret, @api_url=false) ->

    http_request: (uri, data, method = 'POST') ->
        data = flatten_nested_hash data, false

        switch method
            when 'POST'
                true

            when 'GET'
                true

            when 'DELETE'
                true

            else
                return false

    http_request_get: (request_query, method='GET') ->
        options = 
            host: request_query.hostname
            port: 80
            path: request_query.path + request

