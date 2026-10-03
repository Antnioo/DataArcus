#!/usr/bin/env bash
# Finding 001: reproduce the two text-and-file claims about Microsoft's powerbi-authoring plugin
# without Power BI Desktop (any Linux or macOS machine with git, Node 20+ and python3).
#   1. What the plugin's own text says about Arabic, right to left, Hijri and Ramadan.
#   2. Its starter theme (base.json) against its own validator (powerbi-report-author 0.4.0).
# Run 2026-10-03 on Linux: 107 files; the only right-to-left line is about a bar chart's
# value axis; the validator: "failed", 6 errors, all PBIR_THEME_VISUAL_PROP_UNKNOWN on cardVisual.
# Public, MIT-licensed sources only. Nothing here touches a real model or report.
set -euo pipefail

PLUGIN_COMMIT=ec8d7ec   # "Release v0.3.18 from internal repo", 2026-09-24, github.com/microsoft/skills-for-fabric
CLI_VERSION=0.4.0       # @microsoft/powerbi-report-authoring-cli, published 2026-09-22 on npm (MIT)
WORK=$(mktemp -d)
cd "$WORK"

git clone -q https://github.com/microsoft/skills-for-fabric.git sff
git -C sff checkout -q "$PLUGIN_COMMIT"
P=sff/plugins/powerbi-authoring
grep '"version"' "$P/.claude-plugin/plugin.json" 2>/dev/null || find "$P" -name plugin.json -exec grep '"version"' {} \;

echo "== 1. Files in the plugin, and every mention of Arabic / right to left / Hijri / Ramadan / Umm al-Qura"
find "$P" -type f | wc -l
grep -rniE "arabic|right-to-left|right to left|\brtl\b|hijri|ramadan|umm al" "$P" || true
echo "== Layout rules written for a left-to-right reader"
grep -rniE "top-left carries|left anchor" "$P" || true

echo "== 2. The starter theme against the validator"
mkdir cli && cd cli && npm init -y >/dev/null
npm i -s "@microsoft/powerbi-report-authoring-cli@$CLI_VERSION"
npx powerbi-report-author scaffold --offline --name Repro out >/dev/null
python3 - <<'EOF'
import json, os
R = 'out/Repro.Report'
os.makedirs(R + '/StaticResources/RegisteredResources', exist_ok=True)
t = json.load(open('../sff/plugins/powerbi-authoring/skills/powerbi-report-cli/references/design/assets/base.json'))
fn = 'SkillBaseDefaults.json'
t['name'] = fn  # the theme's name must equal its file name (the validator checks it); nothing else changed
json.dump(t, open(R + '/StaticResources/RegisteredResources/' + fn, 'w'), indent=2)
r = json.load(open(R + '/definition/report.json'))
r['themeCollection']['customTheme'] = {"name": fn, "reportVersionAtImport": r['themeCollection']['baseTheme']['reportVersionAtImport'], "type": "RegisteredResources"}
r['resourcePackages'].append({"name": "RegisteredResources", "type": "RegisteredResources", "items": [{"name": fn, "path": fn, "type": "CustomTheme"}]})
json.dump(r, open(R + '/definition/report.json', 'w'), indent=2)
EOF
npx powerbi-report-author validate out/Repro.Report --pretty || true
echo "(The empty scaffold alone validates with 0 errors: the six come from the theme.)"
