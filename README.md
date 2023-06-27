# vcpkg website

## Requirements:
- Docker
- Node, npm

## Build the website
To regenerate the website, run `scripts/rebuild.sh` from within the docker container defined by `.devcontainer/Dockerfile`:
```
docker build .devcontainer -t "vcpkg-io"
docker run -it --mount type=bind,source=<working directory>,target=/dst "vcpkg-io" bash dst/scripts/rebuild.sh
```
The commit of https://github.com/Microsoft/vcpkg used is defined within the `rebuild.sh` script.

## Start website
Run:
```
npm install
npm start
```
