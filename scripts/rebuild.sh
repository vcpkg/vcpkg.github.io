#/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]
then
    vcpkg_commit=881c1b04a40f258b23880f9ef3ba89b6ed5c8ecf
    git init ../vcpkg
    git -C ../vcpkg fetch --depth 1 https://github.com/Microsoft/vcpkg $vcpkg_commit
    git -C ../vcpkg checkout FETCH_HEAD
fi
npm ci
rm -rf ../en
node generatePages.js
node generateDocs.js ../vcpkg/docs
node validateLinks.js
