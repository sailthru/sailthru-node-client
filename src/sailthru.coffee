http = require 'http'
https = require 'https'
url = require 'url'
querystring = require 'querystring'
rest = require 'restler'

###
API client version
###
exports.VERSION = '1.0.5'

###
LOGGING Flag
###
LOGGING = true

USER_AGENT = 'Sailthru API Node/JavaScript Client'

{SailthruUtil, log} = require './sailthru_util'

###
helper logging function
###
log2 = (string) ->
    log string if LOGGING is true

###
Private class to make HTTP request
###
class SailthruRequest
    valid_methods = ['GET', 'POST', 'DELETE']

    _http_request: (uri, data, method, callback, binary_data_params = []) ->
        parse_uri = url.parse uri
        options =
            host: parse_uri.host
            port: if parse_uri.protocol is 'https:' then 443 else 80
            path: parse_uri.pathname
            method: method
            query: data
            headers:
                'User-Agent': USER_AGENT
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
            
        log2 method + ' Request'
            
        req = http_protocol.request options, (res) ->
            body = ''
            res.setEncoding 'utf8'
            statusCode = res.statusCode
            log2 'Status Code: ' + res.statusCode
            res.on 'data', (chunk) ->
                body += chunk
            res.on 'end', ->
                try
                    json_response = JSON.parse body
                    if statusCode is 200
                        callback json_response
                    else
                        json_err =
                            statusCode: statusCode
                            error: json_response.error
                            errormsg: json_response.errormsg

                    callback json_response, json_err
                catch error
                    json_err =
                        statusCode: 0,
                        error: 0,
                        errormsg: error.message
                    callback error.message, json_err
        req.on 'error', (err) ->
            callback err.message, err
        req.end()
        req.write url.format({query: options.query}).replace('?', ''), 'utf8' if method is 'POST'

    _api_request: (uri, data, request_method, callback, binary_data_params = []) ->
        return @_http_request uri, data, request_method, callback, binary_data_params

class SailthruClient
    ###
    By default enable logging
    ###
    @logging = true

    constructor: (@api_key, @api_secret, @api_url = false) ->
        @api_url = 'https://api.sailthru.com' if @api_url is false
        @request = new SailthruRequest

    
    ###
    prepare JSON payload
    ###
    _json_payload: (data) ->
        payload =
            api_key: @api_key
            format: 'json'
            json: JSON.stringify data

        payload.sig = SailthruUtil.getSignatureHash payload, @api_secret
        return payload

    ###
    Unified function for making request to API request
    Doesn't handle multipart request 
    ###
    _apiRequest: (action, data, method, callback) ->
        _url = url.parse @api_url
        json_payload = @_json_payload data
        return @request._api_request _url.href + action, json_payload, method, callback

    enableLogging: ->
        LOGGING = true
        return

    disableLogging: ->
        LOGGING = false
        return

    # Native API methods: GET< DELETE and POST

    ###
    GET call
    ###
    apiGet: (action, data, callback) ->
        @_apiRequest action, data, 'GET', callback

    ###
    POST call
    ###
    apiPost: (action, data, callback, binary_data_params = []) ->
        if binary_data_params.length > 0 then @apiPostMultiPart action, data, callback, binary_data_params else @_apiRequest action, data, 'POST', callback

    ###
    POST call with Multipart
    ###
    apiPostMultiPart: (action, data, callback, binary_data_params = []) ->
        binary_data = {}
        for param in binary_data_params
            binary_data[param] = rest.file data[param]
            delete data[param]
        _url = url.parse @api_url
        json_payload = @_json_payload data

        (json_payload[param] = value for param, value of binary_data)

        log2 _url.href + action
        log2 'MultiPart Request'
        log2 'JSON Payload: ' + JSON.stringify json_payload

        rest.post(_url.href + action, {
            multipart: true,
            'User-Agent': USER_AGENT,
            data: json_payload
        }).on 'complete', (data) ->
            callback data

    ###
    DELETE call
    ###
    apiDelete: (action, data, callback) ->
        @_apiRequest action, data, 'DELETE', callback

    ###
    options mixin
    ###
    _getOptions: (options) ->
        return if options isnt null then options else {}

    # Email API Call
    getEmail: (email, callback) ->
        @apiGet 'email', {email: email}, callback

    setEmail: (email, callback, options = null) ->
        data = @_getOptions options
        data.email = email
        @apiPost 'email', data, callback

    # Send API Call
    send: (template, email, callback, options = null) ->
        data = @_getOptions options
        data.template = template
        data.email = email
        @apiPost 'send', data, callback

    multiSend: (template, emails, callback, options = null) ->
        data = @_getOptions options
        data.template = template
        data.email = if emails instanceof Array then emails.join(',') else emails
        @apiPost 'send', data, callback

    getSend: (send_id, callback) ->
        @apiGet 'send', {send_id: send_id}, callback

    cancelSend: (sendId, callback) ->
        data =
            send_id: sendId
        @apiDelete 'send', data, callback

    # Blast API Call
    getBlast: (blastId, callback) ->
        data =
            blast_id: blastId
        @apiGet 'blast', data, callback

    deleteBlast: (blastId, callback) ->
        data =
            blast_id: blastId
        @apiDelete 'blast', data, callback

    cancelBlast: (blastId, callback) ->
        data =
            blast_id: blastId
            schedule_time: ''
        @apiPost 'blast', data, callback

    updateBlast: (blastId, callback, options = null) ->
        data = @_getOptions options
        data.blast_id = blastId
        @apiPost 'blast', data, callback

    scheduleBlastFromBlast: (blastId, scheduleTime, callback, options = null) ->
        data = @_getOptions options
        data.blast_id = blastId
        data.schedule_time = scheduleTime
        @apiPost 'blast', data, callback

    scheduleBlastFromTemplate: (blastId, template, list, scheduleTime, callback, options = null) ->
        data = @_getOptions options
        data.blast_id = blastId
        data.copy_template = template
        data.list = list
        data.schedule_time = scheduleTime
        
        @apiPost 'blast', data, callback

    scheduleBlast: (name, list, scheduleTime, fromName, fromEmail, subject, contentHtml, contentText, callback, options = null) ->
        data = @_getOptions options
        data.name = name
        data.list = list
        data.schedule_time = scheduleTime
        data.from_name = fromName
        data.from_emai = fromEmail
        data.subject = subject
        data.content_html = contentHtml
        data.content_text = contentText
        
        @apiPost 'blast', data, callback

    # Template API Call
    getTemplates: (callback) ->
        @apiGet 'template', {}, callback

    getTemplate: (template, callback) ->
        data =
            template: template
        @apiGet 'template', data, callback

    getTemplateFromRevision: (revisionId, callback) ->
        data =
            revision: revisionId
        @apiGet 'template', data, callback

    saveTemplate: (template, callback, options = null) ->
        data = @_getOptions options
        data.template = template
        @apiPost 'template', data, callback

    saveTemplateFromRevision: (template, revisionId, callback) ->
        options =
            revision: revisionId
        @saveTemplate template, callback, options

    deleteTemplate: (template, callback) ->
        @apiDelete 'template', {template: template}, callback

    
    # List API Call
    getLists: (callback) ->
        data =
            list: ''
        @apiGet 'list', data, callback

    deleteList: (list, callback) ->
        data =
            list: list
        @apiDelete 'list', data, callback

    # Contacts API Call
    importContacts: (email, password, callback, includeNames = true) ->
        data =
            email: email
            password: password
        data.names = 1 if includeNames is true

        @apiPost 'contacts', data, callback

    # Content API Call
    pushContent: (title, url, callback, options = null) ->
        data = @_getOptions options
        data.title = title
        data.url = url
        data.tags = data.tags.join(',') if data.tags and data.tags instanceof Array
        @apiPost 'content', data, callback

    # Alert API Call
    getAlert: (email, callback) ->
        data =
            email: email
        @apiGet 'alert', data, callback

    saveAlert: (email, type, template, callback, options = null) ->
        data = @_getOptions options
        data.email = email
        data.type = type
        data.template = template
        data.when = if data.when and type is 'weekly' or type is 'daily' then data.when else delete data.when
        @apiPost 'alert', data, callback

    deleteAler: (email, alertId, callback) ->
        data =
            email: email
            alert_id: alertId
        @apiDelete 'alert', data, callback

    # purchase API Call
    purchase: (email, items, callback, options) ->
        data = @_getOptions options
        data.email = email
        data.items = items
        @apiPost 'purchase', data, callback

    # stats API Call
    stats: (data, callback) ->
        @apiGet 'stats', data, callback

    statsList: (callback, options = null) ->
        data = @_getOptions options
        data.stat = 'blast'
        @stats data, callback

    statsBlast: (callback, options = null) ->
        data = @_getOptions options
        data.stat = 'blast'
        @stats data, callback

    # horizon API Call
    getHorizon: (email, callback, hidOnly = false) ->
        data =
            email: email
        data.hid_only = 1 if hidOnly is true
        @apiGet 'horizon', data, callback

    setHorizon: (email, callback, tags = null) ->
        data =
            email: email
        if tags isnt null
            data.tags = if tags instanceof Array then tags.join ',' else tags
        @apiPost 'horizon', data, callback

    # Job API Call
    getJobStatus: (jobId, callback) ->
        @apiGet 'job', {'job_id': job_id}, callback

    processJob: (job, callback, options = null, report_email = false, postback_url = false, binary_data_params = Array) ->
        data = @_getOptions options
        data['job'] = job
        data['report_email'] = report_email if report_email isnt false
        data['postback_url'] = postback_url if postback_url isnt false
        @apiPost 'job', data, callback, binary_data_params

    # Postback API Methods
    receiveOptoutPost: (params) ->
        if typeof params is 'undefined'
            return false
        for param in ['action','email','sig']
            if typeof params[param] is 'undefined'
                return false
        if params['action'] isnt 'optout'
            return false
        sig = params['sig']
        delete params['sig']
        if sig isnt SailthruUtil.getSignatureHash params, @api_secret
            return false
        else return true

# Public API for creating *SailthruClient*
exports.createSailthruClient = (args...) ->
    new SailthruClient args...

exports.createClient = (args...) ->
    new SailthruClient args...

