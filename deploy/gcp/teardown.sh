#!/usr/bin/env bash
# Full teardown of the GCP-hosted Cognee stack after the hackathon.
# Deletes the entire project (VM, static IP, VPC/firewall rules, disks) and
# stops all billing. This is IRREVERSIBLE — everything in the project,
# including any patient data remembered on the deployed Cognee instance, is
# permanently destroyed. There is no soft-delete/undo beyond GCP's ~30-day
# project-recovery window (see `gcloud projects undelete`, not guaranteed).
#
# Usage:
#   deploy/gcp/teardown.sh              # dry run: show what would be deleted
#   deploy/gcp/teardown.sh --stop-only  # just stop the VM (keeps billing paused, nothing deleted)
#   deploy/gcp/teardown.sh --confirm    # actually delete the project

set -euo pipefail

PROJECT_ID="anamnesis-hackathon"
ZONE="us-central1-a"
INSTANCE="anamnesis-cognee-host"

if [[ "${1:-}" == "--stop-only" ]]; then
  echo "Stopping $INSTANCE in $PROJECT_ID (compute billing pauses, disk + static IP remain)..."
  gcloud compute instances stop "$INSTANCE" --zone="$ZONE" --project="$PROJECT_ID"
  echo "Stopped. Restart with:"
  echo "  gcloud compute instances start $INSTANCE --zone=$ZONE --project=$PROJECT_ID"
  exit 0
fi

if [[ "${1:-}" != "--confirm" ]]; then
  cat <<EOF
DRY RUN — nothing was deleted.

This would permanently delete GCP project '$PROJECT_ID', including:
  - VM '$INSTANCE' (zone $ZONE) and its disk
  - The reserved static IP (anamnesis-ip)
  - The dedicated VPC/network (anamnesis-net) and firewall rules
  - Everything the deployed Cognee instance ever remembered

To just pause billing without deleting anything, run:
  $0 --stop-only

To actually delete the project, run:
  $0 --confirm
EOF
  exit 0
fi

echo "About to permanently delete GCP project: $PROJECT_ID"
read -r -p "Type the project id to confirm: " typed
if [[ "$typed" != "$PROJECT_ID" ]]; then
  echo "Input did not match '$PROJECT_ID'. Aborting, nothing deleted."
  exit 1
fi

gcloud projects delete "$PROJECT_ID"
