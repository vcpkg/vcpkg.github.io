#/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
repo_url=https://github.com/Microsoft/vcpkg
(git ls-remote $repo_url | head -n1 | awk '{ print $1 }') > commit.txt

