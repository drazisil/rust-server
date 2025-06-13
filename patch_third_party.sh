#!/usr/bin/env bash
# Apply local patches to third-party submodules for bcrypt and crypt_blowfish integration
# Usage: ./patch_third_party.sh

set -e

# Clean and reset submodules before patching
cd third_party/crypt_blowfish && git reset --hard HEAD && git clean -fd && cd - > /dev/null
cd third_party/libbcrypt && git reset --hard HEAD && git clean -fd && cd - > /dev/null

# Ensure submodules are initialized
if [ ! -d third_party/crypt_blowfish ] || [ ! -d third_party/libbcrypt ]; then
  echo "Initializing submodules..."
  git submodule update --init --recursive
fi

# Clean and reset submodules before patching
cd third_party/crypt_blowfish && git reset --hard HEAD && git clean -fd && cd - > /dev/null
cd third_party/libbcrypt && git reset --hard HEAD && git clean -fd && cd - > /dev/null

# Apply patch to crypt_blowfish
if [ -f crypt_blowfish_local.patch ]; then
  echo "Applying crypt_blowfish_local.patch..."
  cd third_party/crypt_blowfish
  git apply ../../crypt_blowfish_local.patch
  cd - > /dev/null
else
  echo "crypt_blowfish_local.patch not found!"
  exit 1
fi

# Apply patch to libbcrypt
if [ -f libbcrypt_local.patch ]; then
  echo "Applying libbcrypt_local.patch..."
  cd third_party/libbcrypt
  git apply ../../libbcrypt_local.patch
  cd - > /dev/null
else
  echo "libbcrypt_local.patch not found!"
  exit 1
fi

echo "Patches applied successfully."
