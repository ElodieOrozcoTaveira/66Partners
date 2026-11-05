#!/usr/bin/env bash
# Nettoyage hebdomadaire (cron) : anciennes images et cache de construction
# Docker de plus de 7 jours. Les images des conteneurs en marche ne sont
# jamais supprimées ; celles des 7 derniers jours restent pour un retour arrière.
set -euo pipefail
exec >>"$HOME/backups/prune.log" 2>&1
echo "── $(date '+%F %T')"
docker image prune -a -f --filter "until=168h" | tail -1
docker builder prune -f --filter "until=168h" | tail -1
df -h / | tail -1
