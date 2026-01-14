#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${BILLING_DEPLOY_KEY:-}" ]]; then
  exit 0
fi

BILLING_REPO="${BILLING_REPO:-git@github.com:Einstore/Billing.git}"
BILLING_REF="${BILLING_REF:-}"
BILLING_DIR="${BILLING_DIR:-../Billing}"

mkdir -p ~/.ssh
echo "$BILLING_DEPLOY_KEY" > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
ssh-keyscan github.com >> ~/.ssh/known_hosts

mkdir -p "$(dirname "$BILLING_DIR")"
rm -rf "$BILLING_DIR"

if [[ -n "$BILLING_REF" ]]; then
  git clone --depth 1 --branch "$BILLING_REF" "$BILLING_REPO" "$BILLING_DIR"
else
  git clone --depth 1 "$BILLING_REPO" "$BILLING_DIR"
fi
