#!/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e commit.txt ]; then exit 1; fi
vcpkg_commit=$(cat commit.txt)
if [ ! -e ../vcpkg ]; then
    git init ../vcpkg
fi

git -C ../vcpkg fetch https://github.com/microsoft/vcpkg $vcpkg_commit
git -C ../vcpkg switch -d FETCH_HEAD

npm ci
rm -rf ../en
node generateDocs.js
node generatePackages.js ../vcpkg
node generateDetailedPages.js ../vcpkg
node validateLinks.js
