# Microsoft's PBIR JSON schemas, bundled for check_report (offline)

Copied unchanged from `github.com/microsoft/json-schemas` (MIT, `LICENSE` here), commit
`8db0a644e856e3941ebc127618d095a8ef7a7727` (2026-10-04), folders `fabric/item/report/definition`,
`fabric/item/report/definitionProperties`, `fabric/pbip/pbipProperties`, `fabric/gitIntegration/platformProperties`.
The same files Microsoft serves at `https://developer.microsoft.com/json-schemas/fabric/...` (checked 2026-10-05 on
`page/2.0.0`: the same JSON). `check_report` reads them from here and opens no network connection.

Not bundled: the report theme schema (`reportThemeSchema-*.json`, on raw.githubusercontent.com) and any version
newer than this copy (Desktop 2.158 saves visualContainer 2.13.0, not published there on 2026-10-04): such files
are listed under `notChecked`. To update: copy the folders again from a newer commit and change the commit above.
