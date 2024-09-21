#!/usr/bin/env fish
# SPDX-License-Identifier: AGPL-3.0-only

set oldversion (cat package.json | jq -r .version)
set newversion (git cliff --bumped-version | cut -c 2-)

if [ "$argv" != "" ]
    set newversion "$argv"
end

echo "$oldversion -> $newversion"

git cliff --bump -o CHANGELOG.md
sed -i "s/$oldversion/$newversion/" package.json
git add CHANGELOG.md package.json
git commit -m "chore(release): v$newversion"
git tag v$newversion
git tag -f latest
read -P "> Push and release changes?"
git push
git push --tags origin v$newversion
git push --tags --force origin latest

# changelog for discord (via webhook)
git cliff -l \
    | sed 's/# Changelog//' \
    | sed 's/## \[/# \[/' \
    | gh release create v$newversion -F -

# changelog for github
git cliff -l \
    | sed 's/# Changelog/## Changelog/' \
    | rg -v '## \[' \
    | gh release edit v$newversion -F -
