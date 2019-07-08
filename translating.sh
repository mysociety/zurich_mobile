#!/bin/bash
# Usage: ./translating.sh [path/to/fixmystreet/repo]

set -e

FIXMYSTREET_REPO=${1:-"../fixmystreet"}

$FIXMYSTREET_REPO/bin/cron-wrapper ./bin/gettext-extract
./bin/gettext-merge
"$FIXMYSTREET_REPO/commonlib/bin/gettext-makemo" ZurichMobileApp
$FIXMYSTREET_REPO/bin/cron-wrapper perl -I"$FIXMYSTREET_REPO/commonlib/perllib" -I"$FIXMYSTREET_REPO/local"  bin/localise_templates

cp compiled/*.html www/templates
cp compiled/*.js www/js
