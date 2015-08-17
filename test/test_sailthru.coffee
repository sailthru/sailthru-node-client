SailthruClient  = require('../lib/sailthru').createSailthruClient('abcd12345','1324qwerty')
SailthruClientBadUrl  = require('../lib/sailthru').createSailthruClient('abcd12345','1324qwerty', 'http://foo')
SailthruClient.disableLogging();
SailthruClientBadUrl.disableLogging();
{testCase}  = require 'nodeunit'

exports.receiveOptoutPost = (test) ->
    test.expect 7

    # Valid params
    params1 =
        action: 'optout'
        email: 'foo@bar.com'
        sig: '89b9fce5296ce2920dad46ed3467001d'
    real1 = SailthruClient.receiveOptoutPost params1
    test.ok real1

    # Missing sig
    params2 =
        action: 'optout'
        email: 'foo@bar.com'
    real2 = SailthruClient.receiveOptoutPost params2
    test.ok not real2

    # Missing email
    params3 =
        action: 'optout'
        sig: '9577f7aae68bc22b4e4d0709b1f2afa8'
    real3 = SailthruClient.receiveOptoutPost params3
    test.ok not real3

    # Missing action
    params4 =
        email: 'foo@bar.com'
        sig: '37b11fcea15a1ff5e21b7c8467e93015'
    real4 = SailthruClient.receiveOptoutPost params4
    test.ok not real4

    # Non 'optout' action
    params5 =
        action: 'baz'
        email: 'foo@bar.com'
        sig: '28916f39794b7d8e6c927a1e94d99f93'
    real5 = SailthruClient.receiveOptoutPost params5
    test.ok not real5

    # Wrong signature
    params6 =
        action: 'optout'
        email: 'foo@bar.com'
        sig: '110993c3e8786cb4ebdd509ea6115fea'
    real6 = SailthruClient.receiveOptoutPost params6
    test.ok not real6

    # No Params
    params7 = undefined
    real7 = SailthruClient.receiveOptoutPost params7
    test.ok not real7

    test.done()

exports.connection = (test) ->
    test.expect 2

    connectErrMsg = 'getaddrinfo ENOENT'
    finished = 0

    # Connection Error
    params1 = 'foo@bar.com'
    callback1 = (err, res) ->
        test.ok err != null, "err exists: " + err
        if finished
            test.done()
        finished++

    SailthruClientBadUrl.getEmail params1, callback1

    # Valid (Default) Connection
    params2 = 'foo@bar.com'
    callback2 = (err, res) ->
        test.notEqual err, connectErrMsg
        if finished
            test.done()
        finished++

    SailthruClient.getEmail params2, callback2
