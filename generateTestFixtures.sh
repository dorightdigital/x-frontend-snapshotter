#!/bin/sh

set -e

BASE=$PWD
DEPENDENCY=$1
VERSION=$2
COMPONENTPATH=$3

rm -Rf target
mkdir target
cd target 

mkdir -p "${DEPENDENCY}/${VERSION}"
cd "${DEPENDENCY}/${VERSION}"
wget https://github.com/${DEPENDENCY}/archive/v${VERSION}.tar.gz
tar -xzpf v${VERSION}.tar.gz --strip-components 1

${BASE}/src/process.js $PWD $COMPONENTPATH
cd ../../../processed
echo $VERSION > VERSION.txt
tar -czpf ../test-fixtures-${DEPENDENCY//\//-}-${VERSION}.tar.gz ./*
