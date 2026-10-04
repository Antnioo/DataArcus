#!/usr/bin/env bash
# Finding 004: Microsoft's validator names the tooltip value Power BI Desktop silently ignored.
# A one-page project with a column chart whose report-page tooltip type is 'ReportPage' (what our export wrote
# before 2026-10-01), validated with Microsoft's CLI; then the same file with 'Canvas'.
# Run 2026-10-04 on Linux: 'ReportPage' -> PBIR_FORMATTING_ENUM_INVALID "Invalid enum value "ReportPage" for
# "visualTooltip.type" (valid: Default, Canvas)"; 'Canvas' -> no such error.
# The stub chart binds no field, so both runs also report PBIR_QUERY_STATE_MISSING: that one is expected here.
# Needs Node 20+. No Power BI, no account, nothing sent anywhere but npm.
set -euo pipefail
CLI_VERSION=0.4.0   # @microsoft/powerbi-report-authoring-cli, published 2026-09-22 (MIT)
WORK=$(mktemp -d); cd "$WORK"
npm init -y >/dev/null && npm i -s "@microsoft/powerbi-report-authoring-cli@$CLI_VERSION"
npx powerbi-report-author scaffold --offline --name Tip tt >/dev/null
P=$(ls -d tt/Tip.Report/definition/pages/*/); mkdir -p "$P/visuals/v1"
write() { cat > "$P/visuals/v1/visual.json" <<JSON
{
  "\$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json",
  "name": "v1",
  "position": { "x": 40, "y": 40, "z": 0, "width": 600, "height": 400, "tabOrder": 0 },
  "visual": { "visualType": "columnChart", "visualContainerObjects": { "visualTooltip": [ { "properties": {
    "show": { "expr": { "Literal": { "Value": "true" } } },
    "type": { "expr": { "Literal": { "Value": "'$1'" } } } } } ] } }
}
JSON
}
show() { { npx powerbi-report-author validate tt/Tip.Report || true; } | node -e "const d=JSON.parse(require('fs').readFileSync(0)).data; console.log('result:', d.result, '| errors:', d.errorCount); for (const [k,v] of Object.entries(d.diagnostics)) for (const i of v.items) console.log(' ', k, '->', i.message.split(': /')[0])"; }
echo "== type 'ReportPage'"; write ReportPage; show
echo "== type 'Canvas'";     write Canvas;     show
