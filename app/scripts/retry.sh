#!/bin/bash
set -o nounset -o pipefail -o errexit

[[ $# -le 1 ]] && { echo "Usage $0 <retry_number> <command>"; }

retries="${1:-}"
shift

count=0
until "$@"; do
    exit=$?
    wait=$((2 ** count))
    count=$((count + 1))
    if [ "$count" -lt "$retries" ]; then
        echo "Retry $count/$retries exited $exit, retrying in $wait seconds ..."
        sleep $wait
    else
        echo "Retry $count/$retries exited $exit, no more retries left."
        exit $exit
    fi
done