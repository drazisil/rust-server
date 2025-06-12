# Contributing to Oxide

Thank you for your interest in contributing to Oxide!

## Submodule Patch Management

This project uses patched third-party submodules (`crypt_blowfish` and `libbcrypt`) for portable bcrypt support. Local changes to these submodules may show up as dirty in `git status` or `git diff`.

### Hiding Submodule Changes in Git Status and Diff

To avoid seeing local changes to submodules in your parent repository's status and diff, you can configure git to ignore dirty submodules:

```zsh
git config --global diff.ignoreSubmodules dirty
```

This will hide submodule changes from `git status` and `git diff` in the parent repository. (You will still see changes if you `cd` into the submodule and run `git status` there.)

> **Note:** This is a local git config setting and is not shared with other users automatically. Each developer should run this command once on their machine.

### Keeping Submodules Clean

If you need to reset submodules to a clean state (for example, if patching fails), run:

```zsh
cd third_party/crypt_blowfish && git reset --hard HEAD && git clean -fd && cd -
cd third_party/libbcrypt && git reset --hard HEAD && git clean -fd && cd -
```

## Running the Patch Script

Before building, the `patch_third_party.sh` script will automatically reset, clean, and patch the submodules. You do not need to run it manually unless you want to re-apply patches after a manual submodule reset.

## Questions?

If you have any questions about submodule management or contributing, please open an issue or ask in the project discussions.
