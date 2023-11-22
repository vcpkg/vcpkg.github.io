#/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]; then
    vcpkg_commit=$(cat commit.txt)
    if [ ! -e commit.txt ]; then exit 1; fi
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
