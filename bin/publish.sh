#!/usr/bin/env sh
#
#  Copyright 2021 Artificial Intelligence Redefined <dev+cogment@ai-r.com>
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#
#

set -xe

BRANCH="${BRANCH:-${CI_COMMIT_BRANCH}}"

git remote add upstream https://github.com/cogment/cogment-js-sdk.git

git remote -v

git checkout "${BRANCH}"

git pull upstream "${BRANCH}"

git status

git push git@gitlab.com:ai-r/cogment-js-sdk.git "${BRANCH}"

git fetch upstream --tags
git push git@gitlab.com:ai-r/cogment-js-sdk.git --tags