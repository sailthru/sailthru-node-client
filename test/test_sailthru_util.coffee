{SailthruUtil}         =      require '../lib/sailthru_util'
{testCase}      = require 'nodeunit'
{exec, spawn} = require 'child_process'

exports.testExtractParams = (test) ->
    test.expect 4

    expected1 = [1, 2, 3]
    real1 = SailthruUtil.extractParamValues expected1
    test.deepEqual real1, expected1

    expected2 = ['unix', 'linux', 'windows']
    params2 =
        os1: 'unix'
        os2: 'linux'
        os3: 'windows'

    real2 = SailthruUtil.extractParamValues params2
    test.deepEqual real2, expected2

    expected3 = ['unix', 'linux', 'windows', 'apache', 'nginx', 'IIS', 'apache', 'nginx']
    params3 =
        os: ['unix', 'linux', 'windows']
        linux:
            server: ['apache', 'nginx']
        windows:
            server: ['IIS', 'apache', 'nginx']
    real3 = SailthruUtil.extractParamValues params3
    test.deepEqual real3, expected3

    expected4 = ['unix', 'linux', 1, 0]
    params4 =
        os: ['unix', 'linux']
        vals:
            type1: true
            type2: false
    real4 = SailthruUtil.extractParamValues params4
    test.deepEqual real4, expected4

    test.done()

exports.testGetSignatureString = (test) ->
    test.expect 4
    secret = '12534sbgsd'

    expected1 = secret + 123
    params1 = [1, 2, 3]
    real1 = SailthruUtil.getSignatureString params1, secret
    test.equal real1, expected1

    expected2 = secret + ['unix', 'linux', 'windows'].sort().join('')
    params2 =
        os1: 'unix'
        os2: 'linux'
        os3: 'windows'

    real2 = SailthruUtil.getSignatureString params2, secret
    test.equal real2, expected2

    expected3 = secret + ['unix', 'linux', 'windows', 'apache', 'nginx', 'IIS', 'apache', 'nginx'].sort().join('')
    params3 =
        os: ['unix', 'linux', 'windows']
        linux:
            server: ['apache', 'nginx']
        windows:
            server: ['IIS', 'apache', 'nginx']
    real3 = SailthruUtil.getSignatureString params3, secret
    test.equal real3, expected3

    expected4 = secret + ['unix', 'linux', 1, 0].sort().join('')
    params4 =
        os: ['unix', 'linux']
        vals:
            type1: true
            type2: false
    real4 = SailthruUtil.getSignatureString params4, secret
    test.equal real4, expected4

    test.done()


exports.testGetSignatureHash = (test) ->
    test.expect 1
    secret = '1246helloMan'
    expected1 = SailthruUtil.md5(secret + ['sailthru', 1, 2].sort().join(''))
    params1 =
        a: ['sailthru', 1, 2]
    real1 = SailthruUtil.getSignatureHash params1, secret
    test.equal real1, expected1

    test.done()

exports.testMd5 = (test) ->
    test.expect 1
    data1 = 'simple_text'
    hash1 = SailthruUtil.md5 data1
    cmd1 = "python -c 'import hashlib; print hashlib.md5(\"" + data1 + "\").hexdigest()'"
    
    exec1 = exec cmd1, (error, stdout, stderr) ->
        test.equal stdout.trim(), hash1
        #test.done()
    
    data2 = "नमस्ते विश्व"
    hash2 = SailthruUtil.md5 data2

    cmd2 = "python -c 'import hashlib; print hashlib.md5(\"" + data2 + "\").hexdigest()'"
    
    exec2 = exec cmd2, (error, stdout, stderr) ->
        test.equal stdout.trim(), hash2
    
    exec2.on 'exit', (code) ->
        test.done()


