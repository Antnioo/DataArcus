# Microsoft's PBIR JSON schemas, bundled for check_report (offline)

Copied unchanged from `github.com/microsoft/json-schemas` (MIT, `LICENSE` here), commit
`af7b264bdf3d49b646ceea1b349c5f0b64d2ef51` (2026-10-15, "Publish SU09 report schemas"), folders `fabric/item/report/definition`,
`fabric/item/report/definitionProperties`, `fabric/pbip/pbipProperties`, `fabric/gitIntegration/platformProperties`
(their schema files; the CHANGELOG/README files and `definition/definitionStructure`, a description of the folder, are
left out). The same files Microsoft serves at `https://developer.microsoft.com/json-schemas/fabric/...` (checked
2026-10-05 on `page/2.0.0`: the same JSON). `check_report` reads them from here and opens no network connection.

History: `8db0a644e856e3941ebc127618d095a8ef7a7727` (2026-10-04) until U1 (2026-10-19), which added the SU09
versions: visualConfiguration 2.8.0, visualContainer 2.13.0 (the version Desktop 2.158 saves), visualContainerMobileState
2.8.0; Microsoft's CHANGELOG: identity updates only, "retaining the schema structure" of 2.7.0 / 2.12.0 / 2.7.0.

Not bundled: the report theme schema (`reportThemeSchema-*.json`, on raw.githubusercontent.com) and any version
newer than this copy (none published on 2026-10-19 for the October 2026 update): such files are listed under
`notChecked`. To update: copy the folders again from a newer commit and change the commit above and `SCHEMA_COMMIT`
in `mcp/lib/check-report.mjs`.
