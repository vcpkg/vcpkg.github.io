#/bin/bash

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]
then
    vcpkg_commit=440075a9fccf52cab386521967e4f074acd1bd34
    git init ../vcpkg
    git -C ../vcpkg fetch --depth 1 https://github.com/Microsoft/vcpkg $vcpkg_commit
    git -C ../vcpkg checkout FETCH_HEAD
fi
npm install
node generatePages.js
node generateDocs.js ../vcpkg/docs
