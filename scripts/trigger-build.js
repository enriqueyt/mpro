const shell = require('shelljs');
const path  = require('path');
const got   = require('got');

console.log('Fetching git commit hash...');

const gitRepositoryInfo = shell.exec('git rev-parse HEAD', {
  cwd: path.join(__dirname, '..')
});

if (gitRepositoryInfo.code !== 0) {
  console.error('Error getting repository information');

  process.exit(-1);
}

const gitCommitHash = gitRepositoryInfo.stdout.trim();

console.log('Git commit: ', gitCommitHash);

got.post('https://api.travis-ci.org/repo/Nanielito%2Fdocker-mpro/requests', {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Travis-API-Version': '3',
    'Authorization': `token ${process.env.TRAVIS_TOKEN}`
  },
  body: JSON.stringify({
    request: {
      message: `Trigger build at ${gitCommitHash}`,
      branch: process.argv[2]
    }
  })
})
.then(function () {
  console.log('Build was triggered');
})
.catch(function (err) {
  console.error(err);

  process.exit(-1);
});