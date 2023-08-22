#/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]; then
    vcpkg_commit=d5b03c125afee1d9cef38f4cfa77e229400fb48a
    filename="commit.txt"
    if [ -f "$filename" ]; then
        content=$(cat commit.txt)
        if [ $vcpkg_commit != $content ]; then
            vcpkg_commit=$content
        fi
    fi
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

