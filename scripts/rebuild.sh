#/bin/bash

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -e ../vcpkg ]
then
    vcpkg_commit=8dddc6c899ce6fdbeab38b525a31e7f23cb2d5bb
    git init ../vcpkg
    git -C ../vcpkg fetch --depth 1 https://github.com/Microsoft/vcpkg $vcpkg_commit
    git -C ../vcpkg checkout FETCH_HEAD
fi
npm install
pwsh generateDocs.ps1 -destDir .. -sourceDir ../vcpkg/docs
