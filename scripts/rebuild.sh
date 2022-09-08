#/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]
then
    vcpkg_commit=a291bcad8093f9f17988fe66543aefd674812f0e
    git init ../vcpkg
    git -C ../vcpkg fetch --depth 1 https://github.com/Microsoft/vcpkg $vcpkg_commit
    git -C ../vcpkg checkout FETCH_HEAD
fi
npm ci
rm -rf ../en
node generatePages.js
node generateDocs.js ../vcpkg/docs
node validateLinks.js
