#!/bin/sh
# Einen Test im echten Renderer fahren: unter Sperre, nice, Zeitlimit - und bei "RENDERER TOT" (Exit 4, Speicher-Kill durch
# einen anderen Browser im Container, siehe ladezeit-preload.js) bis zu 2 Mal nach einer Pause wiederholen.
# Aufruf (im Arbeitsordner mit real.html, ladezeit-preload.js, start-hilfe.js):
#   BB_LOCK=/tmp/bb-testlock-<agent> [BB_LIMIT=1800] sh <repo>/tools/test/lauf.sh <name|pfad> [weitere Argumente]
# Umgebungsvariablen des Tests (BUDGET_SCHREIBEN, GEGENPROBE, HANDY ...) einfach davorschreiben.
HIER=$(cd "$(dirname "$0")" && pwd); REPO=$(cd "$HIER/../.." && pwd)
T=$1; shift
case "$T" in */*) F=$T;; *) F=$REPO/src/tests/$T.js;; esac
LOCK=${BB_LOCK:-/tmp/bb-testlock}; LIM=${BB_LIMIT:-1800}
i=0
while :; do
  S=$(date +%s)
  flock "$LOCK" nice -n 10 timeout "$LIM" node -r "$PWD/ladezeit-preload.js" "$F" "$PWD/real.html" "$@"
  rc=$?
  echo "[lauf] $T rc=$rc $(( $(date +%s)-S )) s"
  [ $rc -ne 4 ] && exit $rc
  i=$((i+1)); [ $i -ge 3 ] && exit 4
  echo "[lauf] Renderer tot - warte 60 s und wiederhole ($i/2)"; sleep 60
done
