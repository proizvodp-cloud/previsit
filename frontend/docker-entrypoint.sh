#!/bin/sh
set -e

# Fix SWC binary for Alpine (musl libc)
# The npm install in Dockerfile doesn't install platform-specific optional packages properly.
# We download the correct binary directly.

SWC_DIR="/app/node_modules/@next/swc-linux-x64-musl"
NEXT_VERSION=$(node -e "console.log(require('/app/node_modules/next/package.json').version)")

if [ ! -f "$SWC_DIR/next-swc.linux-x64-musl.node" ]; then
  echo "Installing @next/swc-linux-x64-musl@${NEXT_VERSION}..."
  mkdir -p "$SWC_DIR"
  cd /tmp
  wget -q "https://registry.npmjs.org/@next/swc-linux-x64-musl/-/swc-linux-x64-musl-${NEXT_VERSION}.tgz" -O swc-musl.tgz
  tar xzf swc-musl.tgz
  cp package/next-swc.linux-x64-musl.node "$SWC_DIR/"
  cp package/package.json "$SWC_DIR/"
  rm -rf /tmp/swc-musl.tgz /tmp/package
  echo "SWC binary installed OK"
else
  echo "SWC binary already present"
fi

cd /app
exec "$@"
