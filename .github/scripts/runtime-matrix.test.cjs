const {test} = require('node:test');
const assert = require('node:assert/strict');
const discover = require('./runtime-matrix.cjs');

async function resolve(releases) {
  let output;
  await discover({
    core: {info() {}, setOutput(name, value) {
      assert.equal(name, 'versions');
      output = JSON.parse(value);
    }},
    fetch: async () => ({ok: true, json: async () => releases})
  });
  return output;
}

test('includes intermediate and future stable releases, excludes prereleases and duplicates', async () => {
  const releases = [
    ...Array.from({length: 17}, (_, index) => ({version: `v${index + 16}.0.0`})),
    {version: 'v30.2.1'}, {version: 'v33.0.0-rc.1'}
  ];
  assert.deepEqual(await resolve(releases), Array.from({length: 15}, (_, index) => String(index + 18)));
});

test('fails rather than quietly running an empty or incomplete matrix', async () => {
  await assert.rejects(resolve([]));
  await assert.rejects(resolve([{version: 'v30.0.0'}]));
  await assert.rejects(resolve(null));
});

test('metadata HTTP, JSON and network failures fail discovery without emitting a matrix', async () => {
  const core = {info() {}, setOutput() {assert.fail('Must not emit a fallback matrix');}};
  await assert.rejects(discover({core, fetch: async () => ({ok: false, status: 503})}), /503/);
  await assert.rejects(discover({core, fetch: async () => ({
    ok: true, json: async () => {throw new SyntaxError('Invalid JSON');}
  })}), /Invalid JSON/);
  await assert.rejects(discover({core, fetch: async () => {throw new Error('Network failure');}}), /Network failure/);
});
