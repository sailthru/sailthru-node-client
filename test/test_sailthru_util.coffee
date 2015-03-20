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
    test.expect 2
    data1 = 'simple_text'
    hash1 = SailthruUtil.md5 data1
    expected_hash1_value = 'b7f6e77dceccceaedc3756be73fa5d63'
    test.equal hash1, expected_hash1_value, "md5 hash for text: '#{data1}'"

    data2 = "नमस्ते विश्व"
    hash2 = SailthruUtil.md5 data2
    expected_has2_value = 'a76a7baf44b70ec7b2ab63a71fb0ce8c'

    test.equal hash2, expected_has2_value

    test.done()
