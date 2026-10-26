// Discover every stable release line from the existing CI minimum.
const metadataUrl = 'https://nodejs.org/dist/index.json';
const compare = (a, b) => a.localeCompare(b, 'en', {numeric: true});

module.exports = async function discover({core, fetch = globalThis.fetch}) {
  const response = await fetch(metadataUrl, {
    headers: {'User-Agent': 'sailthru-ci-runtime-matrix'},
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`Runtime metadata request failed: ${response.status}`);
  const releases = await response.json();
  const versions = releases
    .filter(release => /^v\d+\.\d+\.\d+$/.test(release.version))
    .map(release => release.version.slice(1).split('.')[0])
    .filter(version => Number(version) >= 18);

  const matrix = [...new Set(versions)].sort(compare);
  if (!matrix.includes('18') || matrix.length > 256) {
    throw new Error('Runtime matrix is incomplete or exceeds the GitHub Actions limit');
  }
  core.info(`Testing node release lines: ${matrix.join(', ')}`);
  core.setOutput('versions', JSON.stringify(matrix));
};
