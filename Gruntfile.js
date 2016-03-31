'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.initConfig({
        nodeunit: {
            all: ['test/test_*.js']
        }
    });

    grunt.registerTask('default', [
        'nodeunit'
    ]);

};