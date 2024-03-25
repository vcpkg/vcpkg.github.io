# vcpkg website

## Requirements:
- Docker

## Build the website
To regenerate the website, run `scripts/rebuild.sh` from within the docker container defined by `.devcontainer/Dockerfile`:

```
docker build .devcontainer -t "vcpkg-io"
docker run -it --mount type=bind,source=.,target=/dst "vcpkg-io" bash dst/scripts/rebuild.sh
```

The `rebuild.sh` script can be modified to build a specific commit in this repository.

## Start website
Run:
```
docker run -it --mount type=bind,source=.,target=/dst "vcpkg-io" /bin/sh -c "cd /dst; npm ci"
docker run -p 8080:8080 -it --rm --mount type=bind,src=.,target=/dst vcpkg-io /bin/sh -c "cd /dst; npm start"
```
