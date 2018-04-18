#!/bin/bash

function getAppVersion() {
  PACKAGE_VERSION=$(cat package.json \
    | grep version \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/[",\t ]//g')

  echo $PACKAGE_VERSION
}

function main() {  
  VERSION=$(getAppVersion)
  
  echo "Creating build/$VERSION directory..."
  mkdir -p build/$VERSION

  echo "Copying source files into build/$VERSION directory..."
  cp -r config src package.json build/$VERSION

  echo "Starting minify process..."
  find build/$VERSION/src \( -name '*.js' -o -name 'www' \) -exec bash -c 'echo $1; node_modules/uglify-js/bin/uglifyjs $1 -mc -o $1' - '{}' \;
  
  echo "Creating zip file..."
  cd build
  zip -r "$VERSION.zip" $VERSION

  exit 0
}

main
