# The chuggy docs as an image: docs/, README.md and llms.txt at /docs.
#
# chuggy-fabric builds it at each commit to main that changes the docs. The
# chug.gy pod copies /docs out of it with an init container running
# `cp -R /docs/. <dir>/`; nothing else in the image is used.
FROM docker.io/library/busybox:1.38.0@sha256:a46257e06c82ad85242d0d38077d0a52d9896389ca60a1a59d3463db586e5fa4

COPY docs /docs/docs
COPY README.md llms.txt /docs/
RUN test -f /docs/docs/index.md && test -f /docs/README.md && test -f /docs/llms.txt \
 && chmod -R a+rX /docs

USER 65532:65532
