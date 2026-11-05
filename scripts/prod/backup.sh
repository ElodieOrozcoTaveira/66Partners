#!/usr/bin/env bash
# Sauvegarde quotidienne de la prod (lancée par cron, utilisateur deploy) :
#   - base PostgreSQL (pg_dump compressé)
#   - photos envoyées (volume 66partners_uploads_data)
# Conservation : 14 jours dans ~/backups/daily. Copie hors serveur si
# BACKUP_REMOTE est défini dans ~/.backup.env (destination rsync, par ex.
# "u123456@u123456.your-storagebox.de:66partners", clé SSH déjà autorisée).
set -euo pipefail

APP_DIR=/opt/66partners
DEST="$HOME/backups/daily"
LOG="$HOME/backups/backup.log"
KEEP_DAYS=14
STAMP=$(date +%Y%m%d-%H%M)

mkdir -p "$DEST"
exec >>"$LOG" 2>&1
echo "── $(date '+%F %T') début"

cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
. ./.env.prod
set +a
[ -f "$HOME/.backup.env" ] && . "$HOME/.backup.env"

DB_FILE="$DEST/db-$STAMP.sql.gz"
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner | gzip -9 > "$DB_FILE"
gzip -t "$DB_FILE"
TABLES=$(zcat "$DB_FILE" | grep -c '^COPY public\.' || true)
[ "$TABLES" -gt 0 ] || { echo "ERREUR : sauvegarde de la base vide"; exit 1; }

UP_FILE="$DEST/uploads-$STAMP.tar.gz"
docker run --rm -v 66partners_uploads_data:/data:ro -v "$DEST":/out alpine:3.20 \
  tar czf "/out/uploads-$STAMP.tar.gz" -C /data .
gzip -t "$UP_FILE"

echo "base : $(du -h "$DB_FILE" | cut -f1) ($TABLES tables) · photos : $(du -h "$UP_FILE" | cut -f1)"

find "$DEST" -type f \( -name 'db-*.sql.gz' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rsync -a --delete -e "ssh -p ${BACKUP_REMOTE_PORT:-23} -o BatchMode=yes" "$DEST/" "$BACKUP_REMOTE/" \
    && echo "copie hors serveur : ok" \
    || echo "ERREUR : copie hors serveur échouée"
else
  echo "copie hors serveur : non configurée (BACKUP_REMOTE)"
fi
echo "── $(date '+%F %T') fin"
