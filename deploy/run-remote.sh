#!/usr/bin/env bash
# Runs the deploy on the EC2 host through SSM and prints its output.
# Used by .github/workflows/deploy.yml; also works from a developer PC after
# `aws login` (Git Bash on Windows is fine):
#
#   bash deploy/run-remote.sh backend|frontend
#
# Expects the release archive to be in s3://asiapharmsg-db-backups/config/
# already (the workflow uploads it; by hand: git archive + aws s3 cp).
set -euo pipefail

APP="${1:?usage: run-remote.sh backend|frontend}"
INSTANCE_ID="${INSTANCE_ID:-i-093d28f858148abf7}"
REGION="${AWS_REGION:-ap-southeast-1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SCRIPT_B64=$(base64 -w0 "$HERE/server-deploy.sh")
PARAMS=$(printf '{"commands":["echo %s | base64 -d > /tmp/server-deploy.sh && bash /tmp/server-deploy.sh %s"],"executionTimeout":["2400"]}' "$SCRIPT_B64" "$APP")

CMD_ID=$(aws ssm send-command \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --document-name AWS-RunShellScript \
  --comment "deploy $APP ${GITHUB_SHA:-manual}" \
  --parameters "$PARAMS" \
  --query Command.CommandId --output text)
echo "SSM command $CMD_ID started for $APP; waiting (frontend builds take several minutes)"

STATUS=Pending
for _ in $(seq 1 300); do
  STATUS=$(aws ssm get-command-invocation --region "$REGION" \
    --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
    --query Status --output text 2>/dev/null || echo Pending)
  case "$STATUS" in
    Pending|InProgress|Delayed) sleep 10 ;;
    *) break ;;
  esac
done

aws ssm get-command-invocation --region "$REGION" \
  --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
  --query StandardOutputContent --output text
ERR=$(aws ssm get-command-invocation --region "$REGION" \
  --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
  --query StandardErrorContent --output text)
if [ -n "$ERR" ] && [ "$ERR" != "None" ]; then
  echo "--- stderr ---"
  echo "$ERR"
fi
echo "deploy status: $STATUS"
[ "$STATUS" = "Success" ]
