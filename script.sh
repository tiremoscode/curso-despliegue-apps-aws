#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="curso-iac-cli-tg"
TEMPLATE_FILE="template.yml"

aws cloudformation validate-template \
  --template-body "file://${TEMPLATE_FILE}"

aws cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_FILE}"