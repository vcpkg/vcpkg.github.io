#/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]
then
    vcpkg_commit=1271068e139c1fc30bae405c0bca0e379e155bd2
    git init ../vcpkg
    git -C ../vcpkg fetch --depth 1 https://github.com/Microsoft/vcpkg $vcpkg_commit
    git -C ../vcpkg checkout FETCH_HEAD
fi

githubToken=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
npm ci
rm -rf ../en
node generatePages.js
node generateDocs.js
node validateLinks.js
node generateGitHubStars.js ../vcpkg $1 $githubToken
node generatePackages.js ../vcpkg

read -p "Press enter to continue"
