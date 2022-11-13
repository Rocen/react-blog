#!/usr/bin/env sh

set -e

npm run docs:build

cd docs/.vuepress/dist

git init
git add -A
git commit -m 'auto deploy'

git push -f git@github.com:Rocen/react-blog.git master:gh-pages

cd -