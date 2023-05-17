#!/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
repo_url=https://github.com/Microsoft/vcpkg
vcpkg_commit=$(git ls-remote $repo_url | head -n1 | awk '{ print $1 }')
filename="commit.txt"
if [ ! -f "$filename" ]
then
    # create file with default value
    echo "0" > "$filename"
    echo "File created with default value: $filename"
fi

content=$(cat commit.txt)

if [ $vcpkg_commit != $content ]
then
    git init ../vcpkg
    git -C ../vcpkg fetch --depth 1 https://github.com/Microsoft/vcpkg $vcpkg_commit
    git -C ../vcpkg checkout FETCH_HEAD
    echo $vcpkg_commit > commit.txt
fi

