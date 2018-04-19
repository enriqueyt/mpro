#!/bin/bash

OPTS=`getopt -o hv --long help,version -n 'parse-options' -- "$@"`
eval set -- "$OPTS"

COMMANDS=(              \
    "$0 -v | --version" \
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

if [[ $# = 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  -h | --help)
    usage; exit 0 ;;
  -v | --version)
    getAppVersion; exit 0 ;;
  *)
    usage; exit 1 ;;
esac