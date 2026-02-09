# vcpkg website

## Requirements:
- Docker

## Build the website
To regenerate the website, run `scripts/rebuild.sh` from within the docker container defined by `.devcontainer/Dockerfile`:

```
docker build .devcontainer -t "vcpkg-io"
docker run --rm -it --mount "type=bind,source=.,target=/dst" "vcpkg-io" bash dst/scripts/rebuild.sh
```

The `rebuild.sh` script can be modified to build a specific commit in this repository. Alternatively, use `updateAndRebuild.sh` to use the current commit on https://github.com/microsoft/vcpkg 's master branch.

## Start website
Run:
```
docker run -it --mount type=bind,source=.,target=/dst "vcpkg-io" /bin/sh -c "cd /dst; npm ci"
docker run -p 8080:8080 -it --rm --mount type=bind,src=.,target=/dst vcpkg-io /bin/sh -c "cd /dst; npm start"
```

## Contributor Guidelines

We welcome contributions! To help maintain clarity and quality, please follow these guidelines:

- For visual or UI changes, you must include before and after screenshots in your pull request. This helps reviewers quickly understand the impact of your changes.
- If your PR claims to fix a bug, clearly describe:
  - What the bug was
  - How to reproduce it
  - Include screenshots or screen recordings that show the issue occurring, followed by the fix in action (where applicable).
- Keep commits focused and meaningful — avoid bundling unrelated changes in the same PR.
