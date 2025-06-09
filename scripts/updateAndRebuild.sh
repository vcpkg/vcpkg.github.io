#!/bin/bash

set -e

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
git ls-remote https://github.com/microsoft/vcpkg master | sed -nE 's/^([0-9a-f]+)\t[^\n]*$/\1/p' > commit.txt
./rebuild.sh
