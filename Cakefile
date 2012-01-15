#require.paths.unshift "#{__dirname}/node_modules"

{spawn, exec} = require 'child_process'
{print} = require 'util'

build = (watch, callback) ->
    if typeof watch is 'function'
        callback = watch
        watch = false
    options = ['-c', '-o', 'lib', 'src']
    options.unshift '-w' if watch

    coffee = spawn 'coffee', options
    coffee.stdout.on 'data', (data) ->
        print data.toString()
    coffee.stderr.on 'data', (data) ->
        print data.toString()
    coffee.on 'exit', (status) ->
        callback?() if status is 0

task 'build', 'Compile CoffeScript source files', ->
    build()

task 'watch', 'Recompile CoffeScript when source files are modified', ->
    build true

task 'test', 'Run the test suite', ->
    build ->
        #require.paths.unshift __dirname + '/lib'
        {reporters} = require 'nodeunit'
        process.chdir __dirname
        reporters.default.run ['test']
