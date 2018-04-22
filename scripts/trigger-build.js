const shell = require('shelljs');
const path  = require('path');
const got   = require('got');

console.log('Fetching git commit hash...');

let gitRepositoryInfo = shell.exec('git rev-parse HEAD; git rev-parse --abbrev-ref HEAD', {
  cwd: path.join(__dirname, '..')
});

if (gitRepositoryInfo.code !== 0) {
  console.error('Error getting repository information');

  process.exit(-1);
}

gitRepositoryInfo = gitRepositoryInfo.stdout.trim().split('\n');

const gitCommitHash = gitRepositoryInfo[0];
const gitBranch     = gitRepositoryInfo[1];

console.log('Git commit', gitCommitHash, 'on branch', gitBranch);

got.post('https://api.travis-ci.org/repo/Nanielito%2Fdocker-mpro/requests', {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Travis-API-Version': '3',
    'Authorization': `token ${process.env.TRAVIS_TOKEN}`
  },
  body: JSON.stringify({
    request: {
      message: `Trigger build at ${gitCommitHash} on ${gitBranch}`,
      branch: 'master'
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