{md5} = require('hashlib')

exports.SailthruUtil = class SailthruUtil
    @getSignatureHash: (params, secret) ->
        return md5(SailthruUtil.getSignatureString params, secret)

    @getSignatureString: (params, secret) ->
        return secret + SailthruUtil.extractParamValues(params).sort().join('')

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
 
