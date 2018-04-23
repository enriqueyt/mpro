#!/bin/bash

OPTS=`getopt -o hvp:rsnR: --long help,version,put:,release,snapshot,next,README: -n 'parse-options' -- "$@"`
eval set -- "$OPTS"

COMMANDS=(                                                               \
    "$0 -v | --version      Gets package current version"                \
    "$0 -p | --put VERSION  Sets package version"                        \
    "$0 -r | --release      Updates package version to release"          \
    "$0 -s | --snapshot     Updates package version to snapshot"         \
    "$0 -n | --next         Updates package to next development version" \
    "$0 -R | --README       Sets package version on README file"         \
)

function usage() {
  printf '%s\n\t' "Usage:" "${COMMANDS[@]}"
}

function getAppVersion() {
  PACKAGE_VERSION=$(cat package.json \
    | grep version \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/[",\t ]//g')

  echo $PACKAGE_VERSION
}

function setAppVersion() {
  VERSION=$1

  if [ -z "$VERSION" ]; then
    echo "VERSION must be non empty value"
    exit 1
  else
    npm version --no-git-tag-version $VERSION
  fi
}

function setAppReleaseVersion() {
  npm version --no-git-tag-version patch
}

function setAppSnapshotVersion() {
  npm version --no-git-tag-version prerelease
}

function setNextDevelopmentPhaseVersion() {
  VERSION=""

  setAppReleaseVersion

  VERSION=$(getAppVersion)

  setAppVersion "$VERSION-SNAPSHOT.0"
}

function setAppVersionOnReadme() {
  VERSION=$1

  sed -i -e "s#\(^v\)\(.*\)#\1$VERSION#g" README.md
}

if [[ $# = 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  -h | --help)
    usage; exit 0 ;;
  -v | --version)
    getAppVersion; exit 0 ;;
  -p | --put)
    setAppVersion $2; exit 0 ;;
  -r | --release)
    setAppReleaseVersion; exit 0 ;;
  -s | --snapshot)
    setAppSnapshotVersion; exit 0 ;;
  -n | --next)
    setNextDevelopmentPhaseVersion; exit 0 ;;
  -R | --README)
    setAppVersionOnReadme $2; exit 0 ;;
  *)
    usage; exit 1 ;;
esac