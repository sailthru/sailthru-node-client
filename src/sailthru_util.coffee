crypto  = require 'crypto'
{log}   = require 'util'
{VERSION} = require './sailthru'

exports.SailthruUtil = class SailthruUtil
    @getSignatureHash: (params, secret) ->
        return SailthruUtil.md5(SailthruUtil.getSignatureString params, secret)

    @getSignatureString: (params, secret) ->
        return secret + SailthruUtil.extractParamValues(params).sort().join('')

    @md5: (data) ->
        md5 = crypto.createHash('md5')
        md5.update data, 'utf8'
        return md5.digest 'hex'

    @extractParamValues: (params) ->
        values = []
        for k,v of params
            #console.log v
            if v instanceof Array
                temp = SailthruUtil.extractParamValues(v)
                values = values.concat temp
            else if typeof v is 'string' || typeof v is 'number'
                values.push v
            else if typeof v is 'boolean'
                values.push v = if v is true then 1 else 0
            else
                values = values.concat(SailthruUtil.extractParamValues(v))
        return values

exports.log = (string) ->
    return log 'sailthru-client ' + VERSION + ' - ' + string
