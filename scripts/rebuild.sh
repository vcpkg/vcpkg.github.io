#/bin/bash

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]
then
    vcpkg_commit=bd5ea16b97e91cb620fed0e10b7d9b3a8a943a52
    git init ../vcpkg
    git -C ../vcpkg fetch --depth 1 https://github.com/Microsoft/vcpkg $vcpkg_commit
    git -C ../vcpkg checkout FETCH_HEAD
fi
npm install
node generateDocs.js .. ../vcpkg/docs
