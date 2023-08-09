#/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]
then
    vcpkg_commit=247662ef304453c72acd6b520fa7ff7656e7347c
    git init ../vcpkg
    git -C ../vcpkg fetch --depth 1 https://github.com/Microsoft/vcpkg $vcpkg_commit
    git -C ../vcpkg checkout FETCH_HEAD
fi

npm ci
rm -rf ../en
node generatePages.js
node generateDocs.js
node validateLinks.js
node generateGitHubStars.js ../vcpkg $1
node generatePackages.js ../vcpkg

