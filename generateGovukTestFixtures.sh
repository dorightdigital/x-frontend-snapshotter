#!/bin/sh

set -e

VERSION=$1

rm -Rf target
mkdir target
cd target 
wget https://github.com/alphagov/govuk-frontend/archive/v${VERSION}.tar.gz
tar -xzpf v${VERSION}.tar.gz
cd govuk-frontend-${VERSION}
../../unpackZipAndRender.js $PWD
cd ../processed
echo $VERSION > VERSION.txt
tar -czpf ../test-fixtures-${VERSION}.tar.gz ./*