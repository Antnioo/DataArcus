# Microsoft's COVID-19 US Tracking Sample (test fixture)

`COVID-19 US Tracking Sample.pbit`, unchanged, from github.com/microsoft/powerbi-desktop-samples at commit
`8e99b1233173025a9ddcb5d8e5edfc119f2dfbb1`, path `powerbi-service-samples/COVID-19 US Tracking Sample.pbit`,
sha256 `714d3b00e5b02d4c0d87c73363b00829d14c77f609c49ea2c23b4f3392ea626d`. MIT licence (`LICENSE` here, from the same
commit). The same file the health benchmark pins (dataarcus-engine, business/research/health-benchmark/corpus.json).

Why it is here: the article "We Ran a Health Check on a Microsoft Power BI Sample", the blog and home pages, the short
links and the share image publish its result. `scripts/tests/model-health.mjs` runs the Health Check page on it and fails
when a published number differs from what the tool shows (16 Oct 2026: the engine moved from 84 to 85 and nothing
noticed).
