'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createRequire } = require('node:module');
const path = require('node:path');

// Resolve from the clean installation, not the checkout containing this script.
const installedRequire = createRequire(path.join(process.cwd(), 'package.json'));
const sailthru = installedRequire('sailthru-client');
assert.equal(typeof sailthru.createSailthruClient, 'function');

const user = { id: 'smoke@example.com' };
const response = { ok: true };

const server = http.createServer(function (request, reply) {
  assert.equal(request.method, 'POST');
  assert.equal(request.url, '/user');

  let body = '';
  request.setEncoding('utf8');
  request.on('data', function (chunk) {
    body += chunk;
  });
  request.on('end', function () {
    const params = new URLSearchParams(body);
    assert.equal(params.get('api_key'), 'smoke-key');
    assert.deepEqual(JSON.parse(params.get('json')), user);
    assert.match(params.get('sig'), /^[a-f0-9]{32}$/);

    reply.writeHead(200, { 'Content-Type': 'application/json' });
    reply.end(JSON.stringify(response));
  });
});

server.listen(0, '127.0.0.1', function () {
  const client = sailthru.createSailthruClient('smoke-key', 'smoke-secret', {
    apiUrl: 'http://127.0.0.1:' + server.address().port
  });

  // Default logging must stay enabled: disabling it hid the Node 23+ defect.
  assert.equal(client.request.logging, true);
  client.apiPost('user', user, function (error, result) {
    assert.ifError(error);
    assert.deepEqual(result, response);
    server.close();
    console.log('Packaged client loaded and completed an API request with logging enabled.');
  });
});
