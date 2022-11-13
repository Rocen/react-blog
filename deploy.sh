#!/usr/bin/env sh

set -e

npm run build

cd docs/.vuepress/dist

git init
git add -A
git commit -m 'auto deploy'

git push -f git@github.com:Rocen/react-blog.git master:gh-pages

cd -