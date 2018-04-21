#!/bin/bash

EXECUTION_PATH=$(cd `dirname $0` && pwd)

function main() {    
  VERSION=$(bash $EXECUTION_PATH/appVersion.sh --version)
  
  echo "Creating build/$VERSION directory..."
  mkdir -p build/$VERSION

  echo "Copying source files into build/$VERSION directory..."
  cp -r config src package.json build/$VERSION

  echo "Starting minify process..."
  find build/$VERSION/src \( -name '*.js' -o -name 'www' \) -exec bash -c 'echo $1; node_modules/uglify-js/bin/uglifyjs $1 -mc -o $1' - '{}' \;
  
  echo "Creating zip file..."
  cd build
  tar -czf "$VERSION.tgz" $VERSION

  exit 0
}

main
