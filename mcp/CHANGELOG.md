# Changelog: DataArcus for Power BI (the MCP)

What changed in each version, newest first. Each version given to testers also has a release record (the file's size
and SHA-256), sent with the download. The version is written once, by the build, into `mcp/package.json` and the
package's manifest; this file says what is in it.

## [Unreleased]: 0.3.1
- **What a test run in Power BI Desktop found:** the Arabic twin now turns a chart's legend and a visual's shadow only into
  positions Power BI has (a legend at the top right went to a "top left" Power BI does not know, and Microsoft's
  validator refused it); a position Power BI does not list is kept and named in the plan. On a page with a filter
  rail beside a row of two charts, the whole row now ends at the rail's bottom, so no chart is drawn over the table
  under it, and the check before writing now refuses a plan where two charts overlap. The single-focus page with no
  KPI cards keeps its chart at the top beside the filters, with no empty band above it. On a model with no measures,
  an Arabic report's counts and sums are named in Arabic («عدد ...», «مجموع ...») from the field names you approve,
  and the plan lists each one for your approval. The tool reference describes flip cards, status icons, the metric
  switcher and the gallery charts with their limits.
- **Going back to 0.3.0:** if 0.3.1 does not suit you, download `dataarcus-0.3.0.mcpb` from its release (v0.3.0)
  on https://github.com/Antnioo/dataarcus-releases/releases and check its SHA-256 before you install it: it must be
  `aa23ace80d6777df5dcf47a0847ae8b96783034b2e1e0466625cae579704f9cb`. In Claude Desktop, uninstall 0.3.1 (Settings >
  Extensions > DataArcus for Power BI > Uninstall), then double-click the 0.3.0 file and choose Install. Your reports
  stay where they were written.
- **Bars and columns are never too thick:** where the number of categories is known (a chart kept to its top N, days,
  months, quarters, a field of two or a few known values), a bar or column is at most 36 thick on a 1280 x 720 page
  (45 at 1920 x 1080), so three bars or columns no longer fill the chart; the space between them grows evenly, on the
  phone layout too, and the approval page's preview and the Theme Generator draw them that thick. The values and the
  value axis are unchanged: equal values still draw equal bars. The count can also come from the model: create_report
  and plan_layout take the same counts suggest_fields does (columnStats: distinct counts read in Power BI Desktop, never a
  value), and the sample project gives its own. create_report's answer lists each chart made thinner, in English and
  Arabic. Where the count is not known, Power BI's own look stays.
- **The Arabic Reset button keeps its icon:** in the Arabic twin and the English and Arabic copy, a Reset filters
  button whose Arabic text is longer now takes the width it needs from the dropdown slicers beside it (or, with no
  slicer beside it, its text takes the largest size at which the text and the icon both fit), so it looks like the
  English one. Only where nothing gives room is the icon left out, and the plan says so.
- **Safer picks on a model DataArcus has not seen before:** suggest_fields no longer puts a column with one value,
  a column of mostly unique values (invoice numbers, free text) or a column of map coordinates on a chart's axis, in a
  slicer or as a table's group; a month name gives way to a year-month axis when the dates span more than one year;
  and of a gross and a net amount, the net one is the headline number. Each choice is explained in the answer (why).
  The counts it uses are passed by the AI app from Power BI Desktop (columnStats: counts only, never values); without
  them the answer says only the name rules were used.
- **A trend over several years is no longer added up by month name:** when a model's own calendar runs over more than
  one year (CALENDAR from one year to a later one), the report's trend is by year and month (Year Month), in time
  order, instead of by the month name, which put the same month of every year in one point. This happens without any
  counts, from the calendar's definition alone, and the answer says so (why).
- **The Health Check works offline once the page has loaded:** the analysis is loaded with the page, so a file
  dropped after the connection is gone still gets its score. Nothing is sent anywhere, as before.
- **An Arabic plan's approval page is all Arabic:** the theme's, the Gulf calendar's (its inputs too), the twin's, the
  copy's and the report's approval pages show their headings, rows, values and file lines in Arabic only; names of
  models, tables, fields and files stay as they are, inside «». Still in English: the measured rules' findings under
  "Worth a look", and the explanations of the optional parts (flip cards, status icons, the DAX functions, the metric
  switcher, the gallery, replaced custom visuals).
- **No English titles slip into an Arabic report:** when a title of an Arabic report would be written in English
  because a field in it has no Arabic name yet, the plan now gets no approval number until each such field has an
  Arabic name you approved, or you chose to keep it in English on purpose. The plan names the fields and both choices.
- **Fix scripts written all or none:** when the Health Check writes the fix scripts you approved and one of them can't
  be written (a full disk), the others are removed again too, the answer says it as an error, and your approval stays
  usable once the cause is fixed. A file that was there before is never removed, and your earlier answers file is kept.
- **No page out of reach in the English and Arabic report:** when a page has no free place at the top for its language
  button, both that page and its other-language page now stay in the page tabs, so a reader can always reach each; the
  plan and the approval page say which pages.
- **One verdict on the same report:** a text box or dropdown slicer a little lower than Microsoft's validator likes is
  no longer called something that "can break the report": Power BI Desktop was measured to draw them, so the check
  now says the part may not look as meant and to look at it in Desktop. The check that runs when a report is written
  now says the same, in the same words, so it never says "0 problems" while the report check says otherwise.
- **A dark mode with a light palette is said, not dropped:** when a theme gets a full palette with a light page and
  mode "dark" (or the other way round), the palette's colours are kept as given and the plan, the answer and the
  approval page now say that the mode was not used, and how to get it.
- **Long answers capped:** a plain text answer longer than 40,000 characters is now cut like every other answer, and
  says it was cut.
- **The weekly Microsoft watch reads every comment:** on an issue with more than 100 comments it now reads them all
  before deciding what is new, so it never repeats a finding it already reported.
- **The Arabic twin matches the English report more closely:** text boxes keep the panel they have on the English
  pages. A table that starts with a text column keeps its total row word: it is written as create_report writes its
  Arabic tables, «الإجمالي» on the total row through a report measure the plan names. A chart on a whole-number axis
  runs right to left as create_report's does, and a phone card title wraps its Arabic text by the same rule as
  create_report. A visual's shadow cast to one side (bottom right, say) is cast to the other side on the Arabic page;
  a shadow at the bottom, top or centre stays. Also: the website's glass preview draws its table clear with banded rows, a plan from a theme with
  see-through visuals now says the new report is glass, the preview of an Arabic plan turns its time charts, a filter
  slot higher than wide never puts a slicer below its bottom (what does not fit is named), and the bullet bar says
  when a measure's target in the model is an expression.
- **Calmer text on 1920 x 1080 pages:** the theme's text now grows x 1.25 from the 1280 x 720 sizes, not x 1.5: body
  text 12.5 (was 15), visual titles 15 (was 18), KPI values 35 (was 42); 1280 x 720 pages are unchanged. This holds for
  every new theme from the Theme Generator, generate_theme, plan_layout and create_report, and for a design you saved
  on the website when you download its theme again. A redesign and the Arabic twin keep the original report's sizes.
  A theme made by DataArcus 0.3.0 for 1920 x 1080 and used with create_report takes the new sizes on its pages (the
  answer says so). On a details page with filters at the side, the chart beside a short filter panel now ends with the
  panel and the rows under it move up, which closes the empty band that was left under the filters there.
- **The website's layout preview shows what the download writes:** on the Theme Generator page with the Power BI
  project download, the layout preview draws page 1 as the project places it (the filter panel as high as its slicers
  and Reset, the chart under it taking its column), not the layout's slots before that; a line under it says when they
  differ. The MCP writes each new glass page picture faster (the same pixels).
- **No option dropped without a word:** `consistentText`, `keepPositions`, `titles` and `restyle` work on a redesign
  only. Given with a native copy of custom visuals or a new report, they were ignored, so a native copy asked "with
  consistent text" kept each visual's own fonts. Now the plan says so and names the way: write the native copy, then
  redesign it with `consistentText`. The Gulf calendar's script never relates a column or date table whose name holds
  a tab or a line break (it says to rename it), and a consistent copy never writes a font name holding one.
- **Clearer plans and approval pages:** when DataArcus adds a slicer to fill the design's empty slots, create_report
  now takes either the slicers you asked for or the full list the plan showed: the same approved report either way. When
  a write is refused because its inputs differ from the approved plan, the answer names what differs and what to pass.
  The approval page now starts with one plain line (for example "1 new report: 4 pages, next to your model, in the
  folder "Sales"", with the folder's full path), the counts of files, visuals, bookmarks and phone layouts folded under
  it. Plainer words where you decide: why a chart is a bar chart (no pixel widths), the cards that show a message when
  a chart has no data (meant: no longer listed as "worth a look"), a date column whose type the model's files don't say,
  a redesign's text changes ("visual titles: size set to 12pt"), a custom visual's own settings, every item worth a look
  listed in full, and the working folder named by its path.
- **The app's own approval prompt:** for an Arabic plan it is in Arabic with the English under each line, it names
  the report by the name it will really get, and each script is counted by its kind. An approved Arabic text now
  reaches a button whose English text has spaces around it, and the plan says where each language button is written.
- **A redesign that cleans up evenly:** the rows of a redesigned page now sit 16 apart and 16 from the page's edges
  on a 1280 x 720 page, a spacing that grows with the page's height (24 on a 1920 x 1080 page), so two rows never
  touch. Text boxes, shapes, images and custom visuals still stay where they are: the rows keep the same spacing from
  them, and the plan says when one of them keeps a row from the page's margin. A redesign of a copy
  keeps the copy's own name: "Gulf Retail Review native" becomes "Gulf Retail native redesigned", never the name the
  original's redesign gets; a long name that is already another report's gets a number.
- **One text set for a report you built by hand:** check_report now says where visuals mix fonts or sizes ("visual
  titles: 7 at 14pt, 2 at 11pt"), page by page. A redesign with `consistentText` makes them one: each visual's own font,
  size, bold and italic is removed so the theme governs, and the theme gets the font and size most of your visuals
  already show (or keeps its own). The layout stays yours (`keepPositions` leaves every visual where it is); text boxes,
  shapes, buttons, groups and custom visuals are not touched. The plan lists every setting removed before you approve.
- **The text set is drawn as planned:** the theme now carries the text set per visual type (titles, axes, labels,
  table text), where Power BI Desktop applies it, instead of only as text classes, which Desktop left at its own
  default sizes. A visual's own colour, background, alignment and wrap are never touched; only its font, size, bold
  and italic go. A report saved by an older Power BI Desktop (its definition.pbir names no schema) can be redesigned;
  any other file without one is refused with why and how to fix it (open and save once in Desktop).
- **A glass look for your reports:** a new card look, "Glass", in the Theme Generator (Chart style, Card look) and in
  generate_theme (`chart.look: "glass"`). Power BI has no blur behind a visual, so the look is made of what Power BI
  has: see-through cards (the visual's background with transparency), a thin light border, a soft shadow, and a soft
  page picture DataArcus draws from your theme's own colours (no photo), which the report gets behind every page.
  Text stays readable: the cards are made less see-through until text and labels stand 4.5:1 and colour 1 3:1 over the
  picture's darkest and lightest parts, and the numbers are shown. The website's preview draws what Power BI draws.
  Tables and matrices in the glass look have no fill of their own: no solid rows, headers or totals, the picture
  shows through every cell, and a banded table's every other row is a faint tint; the grid lines stay as visible as
  on solid cards. On a dark page the cards' shadow is stronger, so it shows.
- **Glass by default:** new reports and themes now start in the glass look: the Theme Generator opens on it,
  generate_theme gives it, and every new report planned with plan_layout and written by create_report has it, with
  the soft page picture behind every page. Pages you place yourself (create_report's `pages`) take the theme you give,
  see-through cards included, but no DataArcus page picture (your own picture if you give one). It is used only where every text stays readable: with colours where it can't (a pale brand colour, say), the
  report or theme is plain and the plan says why. The plain look is one choice away ("Plain" in the Theme Generator,
  `chart.look: "auto"` or `"plain"` for the tools). A report you already have keeps its own look: a redesign, the
  Arabic twin and the copy in English and Arabic don't change it.
- **The Arabic twin is identical to its English report, glass included:** in the twin, the copy in both languages and
  the bilingual report, each Arabic page sits on its English page's soft picture mirrored left to right, with the same
  see-through cards, tables and colours. The approval page and the Theme Generator's preview now draw a glass report as
  it is written: the soft picture behind each page and the see-through cards. A glass theme made on its own carries
  its soft picture as the page background, for reports DataArcus does not write; whether Power BI Desktop draws a
  theme's page picture is still to be measured.
- **Try DataArcus without a model of your own:** ask "show me what DataArcus can do" and DataArcus offers a made-up
  Gulf retail project (a model with 18 months of made-up sales, a date table and an empty report). After you approve it,
  it is written to a new folder in your working folder, never over anything; open it in Power BI Desktop and click
  Refresh. The answer then suggests four next steps on it: a first report, the same report in English and Arabic, the
  Gulf calendar, and "is it ready for Arabic?". Every name and number in it is made up.
- **Is your report ready for Arabic?** check_report with `lens: "arabic"` reads any report, whoever built it, and says
  page by page what goes wrong when it is read in Arabic (layout and Tab order from the left, left-aligned or mixed
  Arabic text, English titles and month names, charts and tables that read left to right, slicers, page navigation).
  A short summary comes first; each finding names its fix: the DataArcus request that does it through your approval,
  the Power BI setting to change, or plainly that Power BI has no setting for it. It only reads; nothing is changed.
- **One report in English and Arabic, straight from the plan:** plan_layout and create_report take `languages: "en+ar"`
  (off by default) and write one report with the English pages and, after them, each page's Arabic page, built the same
  way as the English-Arabic copy of a report: mirrored, language buttons on every page, slicer pairs kept in sync, the
  other language's pages hidden in the tabs. You approve the Arabic texts and field names in the plan.
- **See the Arabic pages before you approve them:** the approval page of an Arabic twin now draws its Arabic pages as
  they will be written (mirrored, with the Arabic titles you approved), and for one report with both languages each
  English page beside its Arabic page, with the language buttons: up to 12 pages (or 12 page pairs; the rest are
  counted), tooltip pages not drawn. A title that won't fit its box is marked to check. When the pages can't be
  drawn, the approval page says so; every page is still listed in the plan.
- **The English-Arabic copy (one report with a language button):** the language buttons now always show their text, in
  the theme's text colour, even with a theme that draws every visual as a white card; the Arabic pages move through the
  keyboard right to left; an Arabic title that needs more room is widened into free space, and what can't fit is said;
  the Arabic pages' title and subtitle are no longer drawn as bordered cards; button slicers (pills) are now kept in
  sync with their Arabic copy too. A table column of a per-item measure is named in Arabic for what one row shows, not
  as an average.
- **A matrix keeps its row headers on the left:** Power BI has no right-to-left setting for it, and the plan and the
  approval page now say so plainly. The matrix is otherwise unchanged while its right-to-left options are tried in
  Power BI Desktop.
- **One set of right-to-left rules for charts:** an Arabic report written from scratch and an Arabic copy of an English
  report now turn their bar, column, line and combo charts round with the same shared rules, so both give the same
  chart. A column or line chart over month names no longer carries an axis setting Power BI ignores; how it looks does
  not change.
- **The checker, page by page:** check_report judges each page of an English and Arabic report in its own language, so
  the English pages are no longer flagged for right-to-left rules. Approved long Arabic texts are no longer called
  suspicious because of their length. It also says when a table or matrix shows fewer rows than it could, and how to
  fix it (a smaller text, word wrap off).
- **Fixes only through approval:** the assistant is told never to edit a report's or a model's files itself; for a
  DataArcus report the checker names, for each finding, the DataArcus request that fixes it through a plan you approve.
  A test lists every place DataArcus writes a file and fails if a new one appears.
- **Safety:** DataArcus screens the names in a model or a folder for instructions by patterns: a name that asks the AI
  to call a tool, claims you already approved, points outside your working folder or asks for your data's values is
  now flagged, look-alike letters included. The screen is a heuristic and can miss an instruction worded another way;
  DataArcus itself treats every name as data, and whatever an AI app does with a name, nothing is written before you
  approve the plan. Ordinary names such as "Execute Time" are no longer hidden from the assistant.
- A page filter on a column whose type a hand-edited model gives as an internal name is refused with the right reason.
- **Working folders as people name them:** folders with Arabic names, spaces or long paths, and a working folder
  reached through a link, now work; the tests run on macOS too. Setup notes for Claude Code, VS Code and Cursor on
  Windows, macOS and Linux (DataArcus writes Power BI projects on any of them; open them in Power BI Desktop on
  Windows, or deploy the project to Fabric).
- **One Arabic word for each idea:** reports, the approval page, the health checks and the website now use the same
  Arabic term for each Power BI and DataArcus idea («الفلاتر», «مقسم», «تلميح», «المرئيات», «لوحة معلومات», «تواريخ
  رمضان», «جدول التاريخ»), and write the name DataArcus in Latin letters. A check keeps it so.
- **A DAX function library, off unless you ask for it:** four DAX user-defined functions (a small trend line, a bar
  against a target, a KPI card picture in your theme's colours, a chart title that names the leader) and the measures
  that use them, in one script you apply yourself in TMDL view. The first thing the plan, the approval page and the
  script say, in your language: applying it raises your model's compatibility level to 1702, and that cannot be undone.
- **DataArcus as a plugin next to Microsoft's Power BI plugin** (for Claude Code and GitHub Copilot CLI): a folder
  ready to become its own public repo, with a skill that says which of the two does what (Arabic and right-to-left
  work, Gulf dates, the health check and approved writes stay with DataArcus; editing an existing report, screenshots,
  publishing and model changes go to Microsoft's). It installs the released DataArcus extension. Not published yet.
- **The Health Check** (check_model_health and the website) also flags Arabic percentage measures (the ٪ sign and
  نسبة) that are not formatted as a percent.
- **Website:** the Power BI Model Health Check can download a score card to share (a picture with the score, the
  model's size and the top 5 findings, names optional, drawn in your browser), and the PL-300 and DP-600 practice exams
  link each exam area under 70% to its section of Microsoft's study guide.
- **Website article: "Is your Power BI report ready for Arabic?"** in English and Arabic: what reads wrong when a
  report built in English, or by hand, is read in Arabic, in 19 kinds, each with a small picture and its fix, what the
  Arabic twin can and cannot do today, and how to run the check with check_report's Arabic lens.
- **The Gulf calendar says what it knows.** Sharjah's government weekend (Friday to Sunday since 2022) is a weekend
  option on the Calendar Generator and in add_gulf_calendar; the UAE and Saudi Arabia quick setups keep each country's
  weekend before its change; the pages say the announced dates are the UAE's, that Oman announced 11 of them a day
  later, that the working-day flag knows no holidays, and that the relative offsets move on with each refresh.
- **The Gulf calendar never gives a date column a second date table:** when a date column you ask add_gulf_calendar to
  relate already belongs to your model's date table (Sales[Date] to Calendar[Date]), the script relates the Gulf calendar
  to that date table instead, so your measures follow its Hijri and Ramadan columns through your own calendar. Where that
  can't be done, the relationship is added inactive and the plan shows how a measure uses it (USERELATIONSHIP). The plan
  and the approval page say which and why, in English and Arabic, and the step by hand names your date table, not your
  sales table, when you relate it yourself.
- **A write that fails half-way never removes another program's file:** DataArcus checks a file's content against what
  it wrote before it cleans up, even when another program put a file of the same size in the same place.
- **check_report says what it checked:** it no longer says a report "opens in Power BI Desktop" or "is not broken"; it
  says what it found, which checks ran, and that Power BI Desktop itself was not opened.
- **The Arabic twin writes exactly what you approved:** the twin's plan (and the copy with both languages) now
  builds every file before your go, and after it those same files are written byte for byte; if the twin built
  again would come out any different, nothing is written and the plan is made again. The plan and the approval page
  also say in one line what stays English or unmirrored in your report (texts from your model, a matrix's months,
  custom visuals and the like).
- **Every write is exactly what you approved, names included:** a native copy of a report's custom visuals and a
  redesign now keep every file they will write from the plan and write those same files after your go; a fix script,
  a calendar script or a theme file is written under the name the plan showed, and if that name is taken by then,
  nothing is written and you are asked to plan again; the health check and the Gulf calendar read your model once more
  right before writing.
- **Safer reading:** the report reader no longer takes a saved filter value for a Top N count, never reads a theme or
  any report file through a linked folder, and checks report, table and measure names for hidden instructions in the
  Arabic twin's plan, the DAX functions' plan and the Arabic check, like every other answer.
- **Arabic numbers and units in more places:** the DAX function library's KPI card and story title say thousands,
  millions and billions in Arabic; a native copy's split charts title their axes in the page's language and each says
  its unit in its title; the native copy and the redesign of a report without a .platform file get their own.
- **Report numbers and slots:** a quarter chart's labels keep a whole-number measure's own format (no more
  "8.0Kkg"); a slicer slot too narrow for its slicers leaves out the Reset button (and then slicers), said in the
  answer, instead of writing slicers Power BI cannot draw.
- **The approval page in Arabic says it all in Arabic:** what each plan writes (the English line under it), the Arabic
  twin's options and counted headings, and a plan with no approved Arabic text says so; the app's own approval prompt
  names any check not run before writing; Power BI's base theme is listed as a theme.
- **The Arabic twin, finer:** a bookmark group's name gets its Arabic; a long Arabic title in the phone header gets
  a size that fits on one line; a button with no room for its icon and its Arabic text drops the icon instead of being
  cut; the slicers kept in sync are numbered by their place on the page; an alt text that repeats its title is listed
  once, under the title.
- **check_report, more exact:** it counts a tooltip bar chart's rows by the row height measured in Power BI Desktop,
  no longer flags the Tab order DataArcus itself writes beside a tall visual, and the check before a write names each item
  worth a look by its place on the page.
- **Reading reports, steadier:** reading a .pbit no longer loads the whole file into memory, a field on Power BI's
  automatic date hierarchy is read as its date column, and a report without its own theme shows its base theme's colours.
- **Plans explain themselves more exactly:** a format script already in the folder is shown as already there
  instead of as a new file, the Ramadan note names the Hijri-year column you confirmed, an English right-to-left
  table's total row is called "Total", and the English-and-Arabic plan says what stays English.
- **Arabic and Sharjah calendars, finished:** an Arabic calendar from the Calendar Generator or add_gulf_calendar
  gets Arabic labels for its quarters, fiscal year and flags; a Sharjah calendar is checked against Sharjah's weekend
  and has its own change column; the Health Check card counts in correct Arabic.
- **A model file that can't be read is said, not skipped:** when a TMDL file of your project is empty, cut short,
  not text, badly indented or holds git merge-conflict markers, read_model and the Model Health Check name the file and
  why first, give no score (a score of the part read would be wrong), and DataArcus won't plan a report, a twin or a
  calendar on that model until the file is fixed. A file that only lacks a final line break is read as whole.
- **Plans and previews say more:** a plan lists the header growth a report gets when its page tabs need two rows;
  the page previews say plainly that axis labels come from the data and show which way time runs on a chart over time;
  a button slicer counts only the values an IF or SWITCH column can return.
- **The tool texts say what the tools do:** check_report takes Hebrew (`lang: "he"`), every tool that takes tables
  takes up to 100, and the two script tools that write nothing new on a repeat say so.
- **Reading models and reports, more complete:** two Power BI projects side by side in one folder are no longer read
  as whichever comes first: DataArcus names both and asks which; a measure's own KPI target is used as its target for
  status icons and bullet bars (named, never quoted); read_report says the drill level a chart shows, the image files a
  report uses, a custom visual's name, and folds a group's shapes and images into one line.
- **check_report, fewer wrong notes:** it no longer tells you to apply the DAX functions script for a measure that script
  does not hold, and its schema findings no longer show page or visual ids. The website's tools and the MCP now share
  one list of Arabic month names.
- **English words in Arabic downloads, in order:** the website's Arabic project download keeps English words and
  codes inside Arabic titles in their reading order, as the MCP's Arabic reports do. The metric switcher leaves out a
  measure its charts can't break down by their category or month, and the plan says which and why.
- **Licence, support and a one-page privacy summary:** the licence now says you may run the DataArcus MCP on your
  own computers and use what it writes for any purpose, client work included. SUPPORT.md and three GitHub issue forms
  say where to ask (during the beta we answer within 2 working days). The MCP page's "How it works" shows the approval
  step, and PRIVACY.md starts with a one-page summary.
- **Fixes from a Power BI Desktop run:** a line chart's "last 12 months" on a date table showed 13 months when the
  data ended mid-month; it now shows exactly 12, the last month with data counted as one. The plan names every slicer
  the report will have, in English and Arabic, and says when one was added to fill the design's slicer places. An
  Arabic name drafted for a field such as "Year Month" now reads «الشهر والسنة», never word for word. The Arabic approval
  page of the sample project shows its details in Arabic, the English under each.
- **Arabic reports get Arabic titles, never half Arabic, half English:** in an Arabic report every chart title is Arabic
  («إجمالي المبيعات حسب المنطقة»). A field with no Arabic name yet is listed in the plan for an Arabic name to be drafted
  and approved before anything is written; nothing is translated without your approval. A title stays English only for a
  field you keep in English on purpose, and then the whole title is English ("Total Sales by Region"), shown as one run in
  the Arabic page (U+200F and isolates); never an Arabic word between English names, never the column in brackets. This
  holds in the MCP's reports, the Arabic twin and the EN-AR copy (a title you leave untranslated stays wholly English);
  the website's Arabic download asks for the names first (below). A report on a model
  without measures says "Count of Order Id", not «عدد Order Id», and the DAX library's story title is an Arabic sentence
  only for a measure with an Arabic name (its leader is a value from your data, shown as it is).
- **The website's Arabic download asks for Arabic names before it builds:** in the Theme Generator, an Arabic project on
  your own model lists every field name the report shows in English, each with an Arabic draft you can edit. Drafts come
  only from DataArcus's fixed list of report words; a name the list doesn't hold starts empty for you to type. Nothing is
  translated by a service and nothing about your model is sent. The report is built only when you approve every name,
  either your Arabic name or "Keep English" for that name (your choice, never the default); then every title is wholly
  Arabic, or wholly English for a name you kept in English, and the download's README lists each name. The English
  download is unchanged, and a model already named in Arabic downloads at once.
- **Arabic text order, as Desktop draws it:** Arabic story titles from the DAX function library start with a
  right-to-left mark, so an English name at the start keeps the sentence in order. check_report's Arabic lens says an
  English word anywhere in Arabic text can swap the words around it, with the fix. The DAX functions option says Desktop
  shows an error in those visuals until the script is applied, and asks for the compatibility upgrade at Preview and Apply.
- **Custom visuals replaced, said honestly:** the native copy's plan now starts with one line counting its replacements
  at each confidence and how many are guesses; "high" only when the custom visual's own package is in the report and its
  id names the kind written, and each replacement says why. Each one names in words what the reader no longer sees (a
  tornado's two sides, a bullet's bands, a word cloud's sizes, a calendar's day squares) and which of its own settings
  were kept. A bullet chart now becomes columns with its target as a marker on each, and a calendar heatmap a matrix of
  months by weekday shaded by the value; the earlier replacement is offered second (`customVisualsSecond`).
- **Native copies that draw in Desktop:** a map now says, in the plan and after the write, the two Power BI tenant
  settings Azure Maps needs by their exact names (a tenant outside the United States and the European Union needs the
  second) and a location column without a geographic data category, and offers a bar chart second that draws without
  Azure Maps. A text search box becomes a dropdown slicer with its search on in its own box (the input slicer second),
  a row of chips a dropdown with why (the pills' measured height), never a list cut by its box; a word cloud's bars are
  sorted by their value, largest first.
- **The Arabic twin's phone titles and shadows as approved:** a card's phone title you approved apart from its desktop
  title is now kept and fitted as approved (it was replaced by the desktop title when that one wrapped), and a phone
  title changed on its own is fitted too. A shadow the theme gives the visuals (bottom right, say), not set on the
  visual itself, is now cast to the other side on the Arabic pages as well; the English pages keep the theme's. A long
  text answer cut at 40,000 characters never ends in half of a hidden character's code. suggest_fields no longer takes
  a column named "Notes", "Comments" or "Description" with a capital for a category. The weekly Microsoft watch, on an
  issue too long to read whole (over 100,000 comments), now posts nothing and says so.
- **"Can break" only for what was not seen to open:** check_report no longer says that ten kinds of finding of
  Microsoft's validator "can break the report in Power BI Desktop" (a property written inside another, one filter name
  on two pages, a bookmark button with no bookmark, a visual missing a field its type needs or holding one too many, a
  dropdown slicer lower than the validator wants, a scatter chart with nothing to plot each point by, a drillthrough page
  with no back button, a retired visual type, a theme style for a visual Power BI does not list): Power BI Desktop opened
  hand-built reports with each of them, with no error. They now have a kind of their own that says so, that saving the
  report in Desktop may rewrite them, and to look at the part there (a visual missing a field its type needs may still
  show nothing). Every other finding keeps its kind, and the check that runs before a report is written uses the same
  kinds.
- **The Arabic twin of a large hand-built report:** on a report with many fields, every call of the twin now lists
  texts to translate: its terminology sheet is paged on its own (termsFrom) when it would fill the answer, so every
  text and every term can be reached. Two visuals that show one field under their own names (say "Male" and "Female")
  each keep their own name and get their own Arabic: the field's Arabic is never written over them. A title that
  changes with the selection (given by a measure, or on a field parameter) is now listed and said plainly in English
  and Arabic: you can approve a fixed Arabic title (it then no longer changes with the selection) or keep it as it is.
  An Arabic label beside a number (a card's reference label, a KPI's goal text, a data label's title) is now written so
  the number's signs stay where an Arabic reader expects them, and a KPI's goal text and a data label's own title are
  listed for their Arabic too.
- **No mixed titles in the Arabic twin:** a chart on a field parameter whose title Power BI composes, kept as it is
  while another of its fields gets an Arabic name, would read half Arabic, half English: the twin now gives no plan
  for it and says why, in English and Arabic, until you approve a fixed Arabic title or keep those names English too.
  A subtitle given by a measure is now listed like such a title, and a reference line's own label (a target line, for
  example) is listed and written in the Arabic you approve.
- **The Arabic twin keeps each field's meaning:** a field's Arabic is now given for the field's own name, never for a
  name one visual gives it, so approving it changes only the visuals that show the field as it is (a card renamed
  "Female" keeps its own Arabic). A title given by a column (the value chosen in a field parameter, say) is now listed
  like a title given by a measure, and it is never kept English beside Arabic names. The written twin's answer no longer
  says a title measure stayed English when its titles were written as approved Arabic, and check_report's fix for a
  file shape Desktop was measured to open says only what was measured.
- **Every page of the Arabic twin right to left, pages drawn on a picture too:** the page's picture (PNG or JPEG) is
  flipped left to right into a new picture of the Arabic page's own, and the visuals are mirrored onto it, so each one
  sits on the same panel (the original picture is not changed). A picture that may hold words or a logo, which would
  read backwards, is shown in the plan and flipped only when you approve it. A picture around the page (its wallpaper)
  stays as it is. The plan and the approval page say it for each page, and name any visual that leaves its panel.

## [0.3.0]: 2026-10-21 (the version for testers)
Given to testers on 21 Oct 2026, after the last Power BI Desktop proof of rc.3 passed on the laptop (Desktop
2.159.883.0, build 332beac). In short:
- **See it before you approve it:** the approval window draws the planned pages, and every report is checked (the
  measured rules, the layout, accessibility) before it is written.
- **Arabic:** an Arabic copy of a report (`create_arabic_twin`), or one report with an EN-AR language button
  (`into: "same"`); every mixed Arabic and English text reads in the right order; Arabic calendar columns (months,
  days, quarters, fiscal, Hijri) offered as a script, the report switching to them once it is applied; a line chart
  reads from the right (the waterfall stays as Power BI draws it, left to right; a mirrored one is an option, without
  its Total column).
- **New looks:** pill slicers sized to their text, centred in both languages; smooth lines; a metric switcher; flip
  cards; status icons from the theme; a native waterfall; a redesign of an existing report that leaves the original
  as it is; a phone layout on every page.
- **Safety:** nothing is written without your approval; a write that fails half-way leaves nothing half-written; only
  the report's own files are read; DataArcus still sends nothing anywhere and never returns your data's values.
- **Gulf calendar:** `add_gulf_calendar` (weekends by date, Ramadan and Eid, Hijri months, fiscal years).

Every change, one line each (the pull request or the job that made it):
- #37 Preview before Approve: the approval window draws the planned pages before the go.
- #38 Check before write: the measured rules and the layout check on the report before it is written or downloaded.
- #63 Preview fidelity: titles, cut tables, slanting labels, button names and the KPI value side as Desktop draws them.
- #48 B-143: "Please confirm" on a date or fact table that no relationship touches.
- #53 B-147: the format review as "Please confirm".
- #51 B-146: the aggregation guard: non-additive values never stacked or summed, snapshots summed over time asked about.
- #52 A theme from a logo in the Theme Generator (read in the browser only).
- #54 The phone layout on every page (`layout.phoneLayout`, on by default).
- #56 B-148: "Please confirm" answers remembered while the metadata is unchanged (an answers file, after a plan).
- #57 Story titles (B-130, B-131): no "(2)" or "KPI n", long Arabic titles shortened by rule, alt text the full title.
- #58 B-152, B-154: only the report's own files read and copied; every plan pins its model.
- #59 B-153: a write that fails half-way leaves nothing half-written and says whether the plan was used.
- #60 Accessibility of written reports, and `check_report`'s "a11y" rules.
- #61 The visual gallery foundation: combo, waterfall and small multiples behind `gallery: true`.
- #68 Redesign step 2: `plan_layout` with `redesignFrom`, every page as a lossless copy with allowlisted changes
  (supersedes #62).
- #64 Column or bar from the label limits measured in Desktop 2.159 (B-140 option B).
- #69 B-168: `plan_layout` checks the exact report `create_report` writes, and the write is those bytes.
- #70, #71 The 0.2.9.1 fixes (below), with main.
- R3 A right-to-left waterfall reads from the right: the Arabic twin now mirrors a waterfall as the writer does (the
  value axis at the right, the steps reversed by the sort: the first category at the right); Power BI has no setting
  to invert a waterfall's category axis, so only its order is reversed (superseded by D7: native is the default).
- R2, the owner's must-fix: an Arabic report from an English-named model shows no English title words; the plan pins the
  fixed list's Arabic names and lists every field kept in English, with why, before the go.
- R4 A failed write's clean-up removes only what that call created and still finds as it made it (a file or folder
  another program put at one of its names, or a link put on the way, is left and named); folders made one level at a
  time; nothing renamed over a name; `check_model_health`'s scripts and `create_report`'s format script follow the plan
  rule (the outside audit's F01-F03, F06).
- R5 The answers file is replaced only when it is still the file DataArcus read (another program's file is left and named); a failed write names what it left and says whether the plan was used; table questions fingerprinted; stale browser answers kept until "Forget my answers".
- R6 (the outside audit of 19 Oct, F07, F08, F09, F11, F13): the approval page shows everything the click approves, and
  the theme pins its model. A theme planned from a model pins the model and the report theme its colours come from; the
  gate refuses a model plan written without the model and the reverse; generate_theme and create_report read the model
  again right before their first write and refuse a change, before any folder is made. The page lists every file a
  plan writes, grouped and counted (pages, visuals, phone layouts, theme, images, format script, .pbip); a kind change
  shows its measured reason; the first data colour made readable is shown as approved -> written, with its contrast,
  before the click; the native copy's every replacement and loss, a long answers list and every other value in full,
  never cut; the overwrite sentence is true for each plan. The redesign names a visual by its kind, fields and place,
  never by its title text. The wording says what the code does: DataArcus reads files on your machine to check and
  fingerprint them and never returns data values to Claude; the Theme Generator saves a logo's colours in the browser
  like any theme (the image is never uploaded or saved).
- R7 Every privacy and safety claim re-read against the code (PRIVACY.md sentence by sentence, the READMEs, the
  product spec, the skill, the server's instructions and tool descriptions, the approval page, the beta page in English
  and Arabic, the Theme Generator's logo line, the site's privacy page; the evidence in `mcp/work/R7-claims.md`) and
  made true by wording: no page says DataArcus reads no data or never overwrites without naming its own answers file;
  the answers file's plain-text fields and unsalted hashes are said; `read_report`'s short titles are said to be
  returned as typed (screened for instructions and length only); the files read and hashed, the temporary check copy
  and the one log line are said. `test-release-text.mjs` checks these.
- D3 (the owner's must-fix 1, "no English titles in Arabic reports"; the laptop's proof of 0.3.0-rc.2): the Arabic twin
  lists and writes every text a person can see (the phone layout, alt texts, the empty state's "No data" and its
  measure, button tooltips, every other text property of a visual), drafts every fixed report word from the shared
  list, says before the go what stays English and why (notTranslated), and mirrors the phone layout like the pages,
  each phone page tab as wide as its Arabic name by the writer's rule.
- plan_layout and create_report write Power BI's waterfall, combo (line and clustered column) and small multiples when
  the user asks (a slot kind, or `gallery`), where the fields fit; a combo of two measures in different units is two
  panels, never a second axis; gallery titles are told apart by words, never "(2)"; never chosen silently. (D2)
- D4: a redesign keeps a visual laid over another (a "No data" card, a title box, a panel behind a table) with the
  visual under it: they move and resize as one, the plan and the approval page name them once, and no overlay takes a
  slot of its own (the laptop's rc.1/rc.2 proof on "Dense Ops": the overlays stood beside their charts, which were
  squeezed to 240 wide).
- D1 (the owner's must-fix 2): a waterfall in a right-to-left report (create_report in Arabic, create_arabic_twin) is
  written as a stacked column chart drawn as a waterfall from report-level measures: the running total in the time
  order, January at the right, the steps rising from the right, the value axis at the right; no Total column (Power BI's
  axis holds only the model's members), the running total in every step's tooltip; English unchanged.
- D5: the approval window's preview draws what Power BI Desktop draws: every title as the report create_report writes
  it (a Top N title by the text its measure shows, no "(2)"), a title or table header marked cut only when the
  writer's and check_report's own measure says so, and each slicer with its header.
- D6: the Arabic twin's and the theme's approval pages list every file they write, grouped and counted, as
  create_report's does; the theme page shows its colours (swatches and hex) and the report they come from; create_report's
  "Data colours" swatch shows the written colour, with both contrasts; the refusal after a theme's report changed says
  "the model or its report changed"; an Arabic plan's sentence counts the approved Arabic names; approve_plan's "waiting"
  says a later click still counts.
- U1: Microsoft's October 2026 update (Desktop 2.159.883.0): Microsoft's visual catalog 0.1.3 (19 Oct) now lists the
  dropdown slicer's rounded box, so the validator checks it instead of DataArcus marking it "known"; check_report's
  bundled schemas follow Microsoft's September (SU09) release (visualContainer 2.13.0, the version Desktop saves); the
  list slicer's new dropdown mode is researched and not written yet (preview, not measured in Desktop).
- X1 (the owner, 19 Oct: "add the toggle, I think this one will be a niche"): `create_arabic_twin` with `into: "same"`
  writes a copy "<name> (EN-AR)" holding the English pages as they are and their Arabic pages mirrored as the twin
  does (D1's right-to-left waterfall, D3's phone layout, empty state and alt texts), every page with a small language
  button («العربية» / "English") to its counterpart, desktop and phone; the Arabic pages hidden from the tabs (or the
  English, `tabsShown: "ar"`); each slicer pair synced (`syncGroup`); the original untouched. check_report: a page
  button whose page is not in the report is an error (PAGE_LINK_MISSING). The separate twin is unchanged (the default).
- G1: a weekly GitHub routine (`.github/workflows/microsoft-watch.yml`, Mondays 05:17 UTC and by hand) checks
  Microsoft's report schemas, report theme schema, validator and visual catalog on npm, and the Power BI blog's
  Feature Summary posts against what DataArcus is built on, and opens one `microsoft-update` issue (or comments on the
  open one) listing what changed and what in DataArcus it may touch; it never changes code (`scripts/microsoft-watch.mjs`,
  `mcp/research/MICROSOFT-WATCH.md`).
- R1 (research, no tool or default changed): `mcp/research/SEE-THE-RESULT.md` compares four ways to let the AI see what
  Power BI Desktop draws (a shadow-data render on the user's machine, a calibrated in-browser renderer, real-data
  screenshots on opt-in, the Power BI service) and designs the look-and-propose loop; two prototypes with tests:
  `mcp/lib/shadow-model.mjs` (a throwaway copy of a model with made-up typed rows) and `mcp/lib/box-diff.mjs` (a
  box-level score between two drawings of a page); `mcp/research/shadow-try.mjs` writes a fixture's shadow project for
  the laptop. Recommendation: (a) as the v1 (S2), (b) as the fast first look grown by measured rules, (c) later as a
  per-run opt-in, not (d).
- L1: line charts (and the line of a combo) are smooth by default, monotone (no swing past the data), with a small filled
  dot in the series' colour on each point so every value stays findable; `smoothLines: false` keeps straight lines without
  dots. plan_layout pins it, the approval page's preview draws the curve and its dots, the look summary says it.
- plan_layout and create_report take two look options the polish lab proved in Desktop (12-13 Oct), pinned by the plan:
  `slicerStyle` "dropdown" (default, rounded) or "pills" (Power BI's button slicer, rounded buttons, a calm fill, the
  selected one in the accent; only for a field of 2-6 values known from the model's metadata, else a dropdown, told) and
  `grid` "solid" (default) | "dotted" | "none" for the charts' value-axis gridlines; the approval preview draws both,
  the Arabic twin keeps them with the pills right to left. (L2)
- L3: `metricSwitcher` (2-5 of the model's measures, off by default): the report gets its own page "Metric" / «المؤشر»
  with one single-select slicer and a bar chart (by the main category) and a line chart (by month, when the month has an
  order) whose values come from a field parameter, so each chart switches between the measures and keeps each measure's
  own format; the titles follow the metric. The model is never changed: the field parameter and its title measure come
  as a TMDL script file next to the project (lineage tags, NAMEOF of each measure, labels escaped), to apply in TMDL
  view; until then only that page shows Power BI's error. Pinned by the plan, listed on the approval page;
  check_report knows field parameters and flags a title measure that reads the display column alone.
- plan_layout and create_report take `flipCards` (off by default; `true` for every KPI card, or a list of 1-6 card
  numbers): each chosen KPI card becomes the Desktop lab's flip card (10 Oct, "build 1", v2): three Image visuals in the
  card's box (a backdrop in the card colour, the front with the value, the back with one line about the measure,
  hidden), each face turning to the other through a display-only bookmark of its own (two a card), a 0.3 s turn from
  25 degrees that never starts invisible, right to left mirrored in Arabic. The faces' picture measures are written as
  a TMDL script next to the project ("<report> - flip cards.tmdl", applied by the user in TMDL view; DataArcus never
  changes the model; the naming and lineage tags shared with the metric switcher in mcp/lib/model-script.mjs). Pinned by the plan, on the approval page (cards, back line, bookmarks, the model change, "apply
  the script first"); check_report knows the pattern (bookmark naming a missing visual: an error; a picture measure not
  in the model yet: a note). (L4)
- S1 sweep: the twin keeps a sort by a month's number (Min of Month Number, a month start) when time stays left to
  right (B-180); a hidden "Keep:" measure is named in one script (B-181); create_arabic_twin reads its model again
  right before its first write (B-182); the app's own approval prompt counts the files per group and names a changed
  colour (B-183); read_report no longer returns static visual titles (B-184); check_report's validator findings no
  longer quote report names (B-211); repo checks for non-literal requires (B-196) and for every npm test script's
  result line (B-198); the smooth-lines suite reads its source files line-ending blind (PR #81's Windows job).
- D7 (the owner, 20 Oct: "the same design of waterfall ... mirrored rtl ... if not then just leave it normal"):
  `waterfallRtl: "mirror" | "native"` on plan_layout, create_report and create_arabic_twin, pinned by the plan and shown
  on the approval page. "native" (the default: Power BI cannot draw its own waterfall's design right to left) writes
  Power BI's waterfallChart in the Arabic report too, left to right, exactly as the English one, and the plan says "the
  waterfall reads left to right, as Power BI draws it"; "mirror" keeps D1's stacked column chart, now with the English
  waterfall's own increase and decrease colours and its falls labelled negative. The rest of the Arabic report stays mirrored.
- Every DataArcus theme (generate_theme, create_report, the website's Theme Generator) carries three status icons in
  its `icons` block, "daGood" (a tick in a circle), "daWarn" (a triangle with "!") and "daBad" (a cross in a rounded
  square): they differ in shape as well as colour, coloured from the theme's good / neutral / bad (taken to 3:1 on the
  visuals' background, hue kept), unused unless a rule names them. plan_layout and create_report take `statusIcons`
  (off by default): `true` puts an icon before each table or matrix measure that is a rate or ratio whose target the
  model's metadata names (a measure "<name> Target / Goal / Budget"), by a status measure written as a TMDL script next to
  the project ("<report> - status icons.tmdl", at or above the target good, below it bad; the model never changed by
  DataArcus); `[{ measure, good: ">= 0.97", bad: "< 0.94" }]` uses the user's own thresholds as rules (no measure, no
  script). Thresholds are never guessed. Pinned by the plan, on the approval page; check_report knows the icons (a note
  until the script is applied; the shapes carry the meaning, said in the a11y notes). (L5)
- J18 (B-171, the owner, 20 Oct: "continue the held jobs"): the Arabic terminology sheet. An Arabic plan (plan_layout
  lang "ar") and the Arabic twin (create_arabic_twin, both `into` forms) list every field the report shows with its
  places (page, visual, role: title, table header, slicer header, tooltip, alt text), its English name and its Arabic:
  approved (by the person now, or earlier in this session for the same field of the same model, with the same
  description and DAX), draft (the fixed list's, approved only with the plan) or kept in English (declined, or none
  yet, with why); one missing term is asked at a time (askNext). The approved alias is written on every title, table
  header, slicer header, tooltip and alt text: the twin takes `terms` { "Table[Field]": "..." } and derives each
  title and alt text made of those names. Latin identifiers inside Arabic text are wrapped in bidi isolates
  (U+2068 ... U+2069, with U+200F where the run ends the text), so "KPI 2024" keeps its order. The approval page shows
  the sheet side by side, EN | AR, escaped. The plan pins the map (another map at the write: refused, nothing written).
- Two measures share a chart axis only when their units, scale and ISO currency match and the person confirms they
  compare (`sharedAxes`); otherwise separate visuals, each with its unit on its axis, the reason in the plan (English and
  Arabic). No secondary axis anywhere: the gallery's combo and the native copy's combos and multi-value charts follow
  the rule; SAR and AED, minutes and hours, a percent and a count never share. No currency converted, nothing read from
  the data. (J19, B-172)
- J17 (B-170, the owner, 20 Oct: "continue the held jobs"): Gulf business dates and seasonal scope are asked, never
  guessed. With the model, plan_layout lists the structural date candidates (each date column of the plan's fact
  tables, its relationship to the calendar and whether it is active: an active relationship is not business intent)
  and asks, one question at a time in English and Arabic (gulfDates.askNext): which date (order date, ship date or
  another named one), which grain (Gregorian, Hijri, season day) and, for a seasonal page (a Ramadan, Eid or Hijri
  filter or axis), one Hijri year or every season (the year only from the person). A role no active relationship or
  plan measure (USERELATIONSHIP) serves stops the plan with why, as does any answer the plan contradicts (the year
  filter, the grain's axis); an unanswered seasonal question is asked first (sayFirst) and shown as not answered on the
  approval page; a missing calendar column offers add_gulf_calendar with the person's country and years. Estimated versus
  announced dates and the country's limits are carried into the plan and the approval page. Answers are remembered
  for the session per model and dropped when a relationship or column changes. Nothing edits a relationship and
  nothing written holds USERELATIONSHIP.
- W1: the beta page /power-bi-mcp/ (English, and its Arabic at /ar/power-bi-mcp/ and ?lang=ar) says testers get 0.3.0,
  what is new in it (only what integration/0.3.0-wave merged) and what to try first; the plan_layout and
  create_arabic_twin lines follow 0.3.0 (the native waterfall reads left to right; the EN-AR copy).
  `scripts/test-whats-new.mjs` checks the section in both languages and that it names no 0.3.1 draft.
- Q1: every answer stays under 40,000 characters on the 300-table model with every 0.3.0 option on, cut at its cause:
  check_model_health keeps every finding (its object lists shortened evenly, `only` gives one part whole; it used to
  drop 5 of 6 findings at maxItems 200), the Arabic twin's plan pages its texts (`textsFrom`), plan_layout's redesign
  cuts its per-page lists (`redesignPages`), read_model `tables` names every table not shown, check_report says how many
  findings are not listed; an answer over 34,000 characters indented is sent without indentation. New suite
  `large-model-caps`; the golden baseline prints the largest answer per tool.
- A2: the claims re-check of the 0.3.0 wave: every sentence DataArcus says about itself (PRIVACY.md, README.md, the
  tool descriptions, the server's instructions, the skill, the approval pages, the beta page in English and Arabic)
  checked against the code; 24 untrue or overstated sentences reworded at their source (read_report sends no static
  title since S1; approval in the app's own prompt; the EN-AR button where there is room; check_report checks PBIR; the
  flip cards' script was listed as a "Format script"; the 3:1 rule is WCAG 2.1's; PRIVACY names the wave's answers, its
  model scripts and the session-only memory). `mcp/test-0.3.0-claims.mjs`: a check per fixed sentence and the
  forbidden-words scan.
- A3 (the owner's must-fix 1 for 0.3.0, "no English in Arabic reports"): every report DataArcus writes in Arabic
  (directly, as a twin, as the EN-AR copy), with every wave option on, read text by text from the written files by
  `test-0.3.0-arabic-sweep.mjs`: no Latin run on an Arabic page that the plan does not list as kept in English, with why.
  Fixed: plan_layout no longer drops the approved Arabic names when the only fixed-list name comes from the lint's
  fields; the terminology sheet lists the measures shown only on flip cards and the metric switcher's measures (a
  declined one or one without an Arabic name is listed as kept, with why); the twin's plan keeps its texts whole
  (answered compact, texts cut last), names the metric switcher's choices under cannot, lists the EN-AR copy's
  «English» button as kept with why, and lists and labels a button's own title; an Arabic report's flip cards write their
  units as Arabic words after a Western-digit number (3.43 ألف، 1.20 مليون، 2.05 مليار; English keeps K, M, B).
- A1: the integration audit of the 0.3.0 wave (D1-D7, U1, X1, G1, R1, L1-L5, S1, J17-J19, W1, Q1, A2 together): every
  suite, every tool on every fixture in English and Arabic over stdio, every wave option on one report (then its twin,
  its EN-AR copy and its redesign), and the reproducible build; results in this file.
- F1: the ship fixes from the laptop proof (Desktop 2.159): the button-slicer pills draw their text (the shipped
  shape, with labelled variants for the laptop); every mixed Arabic/Latin name isolated, page and tooltip tabs included;
  a Ramadan / Gulf-dates plan gets no plan id until grain and scope are answered; the metric switcher opens on its first
  metric and its Arabic line chart reads right to left; a status icon sits beside its own value and never on a blank
  row; the mirrored waterfall and the flip cards say plainly what they don't draw.
- F2: the button-slicer pills get the height Desktop 2.159 was measured to need (140 at 15pt, scaled with the text):
  the layout gives a pill slicer that height where the rail has room, else a smaller text, else the dropdown with why;
  the laptop's variants report opens in Desktop and measures 120, 130 and 140.
- F4: the button-slicer pills write every margin they have at 0 (the tiles' padding and spacing, the layout's cell, row,
  column padding and outer margins, the container's padding and the space below its title), leaving the tiles the room;
  a measurement grid for the laptop (8, 9, 10, 15pt at several heights, with the earlier shape as a control).
- F6: the pill slicers keep room between their header and the pills (no Arabic descender on a pill, no "clear
  selections" eraser over the first pill), and their height is the one measured on Desktop 2.159 with margins 0 (56 at
  8-9pt, 72 at 10-15pt) plus that room, so the filter rail draws pills again.
- C1 (the owner, 21 Oct): Arabic calendar columns. One shared builder (`assets/js/arabic-calendar.js`) gives a date
  table the Arabic twins of what it has: Month Name/Month Short/Day Name/Day Short (Arabic), Quarter (Arabic) «الربع 1»,
  Year Quarter (Arabic) «2025 الربع 1» (the year isolated), Fiscal Year/Quarter (Arabic), Hijri Month Name (Arabic), and
  text labels for its flags (Is Weekend, Is Working Day, Is Ramadan, Is Eid al-Fitr/al-Adha (Arabic)), each sorted by the
  English column's own sort column (or a hidden number written with it). The Calendar Generator (site and
  add_gulf_calendar) writes them; every Arabic route (plan_layout/create_report lang "ar", create_arabic_twin, the EN-AR
  copy) offers them as a TMDL script for the user's own date table, approved with the plan, never applied by DataArcus.
  Until the script is applied the Arabic report binds the English calendar columns and says which fields show English
  data and how to switch (apply the script, then plan again); after it, the Arabic twins are bound, flags included.
- W2 (an outside review of the public repo and dataarcus.com, 21 Oct): the home page no longer says AI report
  generation is "free and official" or that "every number" is "validated against the source"; README.md drops the
  findings/ folder that does not exist and the stale suite count; PRODUCT_SPEC.md says 0.3.0's truth (11 tools, the
  Gulf calendar and the Arabic calendar columns shipped, Arabic texts drafted by Claude and approved by the person,
  never translated silently, the model never renamed); mcp/README.md documents the EN-AR copy, the Arabic calendar
  script, checking the .mcpb's SHA-256, the developer install's prerequisites and the lowest Desktop version tested.
  `test-0.3.0-claims.mjs` checks each.
- F7 (the API red team, E1 round 2): the Arabic calendar script (C1) leaves out, and names with why, a date table or
  column whose name holds a control character (a line break could end the script's quoted name and stand as script
  lines; AUD-032's rule, as every other script writer); a report's formats script (plan_layout, create_report) changes
  only the fields the report binds, exactly the objects its plan lists (it rewrote the whole model's: 3 listed, 11
  changed); check_model_health's own script still covers the whole model. The Arabic calendar's flag labels say exactly
  true and false (E1's F-4): Is Working Day «يوم عمل» / «يوم عطلة», Is Weekend «عطلة نهاية الأسبوع» / «خارج عطلة نهاية الأسبوع».
- P7 (the owner, 21 Oct: "if English then the value in the pill LTR, if Arabic then RTL"): each pill's value centred
  (text wrap off), the header at the reading start, Arabic tiles from the right; every Arabic calendar label that mixes
  Arabic with digits («الربع 1», «2025 الربع 1», «السنة المالية 2025», «الربع المالي 1») written with its digit runs
  isolated and a right-to-left mark at the end the run reaches, so it reads in the right order inside a pill.
- T1 (the simulated beta testers of 21 Oct, 18 episodes): the approval page leads with the files by kind in words and
  the file asked for, the full list folded; it is in Arabic, right to left, for an Arabic plan; a script is explained
  in one sentence with the 3 steps to apply it, the folder is named, the inputs are in plain words and the items "worth
  a look" are listed; a report path that misses names the report found ("Did you mean ...?"); `add_gulf_calendar`
  `arabicColumnsOnly` writes only the Arabic calendar columns script for the model's own date table.
- T2 (the laptop's final run of 0.3.0): on the Arabic approval page the preview's titles stay inside their boxes,
  English names keep their order (each cell its own direction, quoted names isolated), and the title is Arabic.

## [Unreleased]: 0.2.9.1
Three fixes after 0.2.9; nothing else changes.
- B-174, the plan says what the chart keeps: a chart planned as "Top 5" keeps its top 5 by its measure, or all of its
  categories when it has 7 or fewer (the report's "Keep:" measure, so a chart never leaves out one or two it could show).
  The plan and `create_report`'s notes now say so for each chart ("Comparison: Top 5, all of them when it has 7 or
  fewer"), from what the writer writes, and a chart the writer does not cut is not said to be cut. What Power BI shows
  is unchanged: the laptop's 6 plan groups under "Top 5" were all shown, as now planned.
- A column chart written as a donut (its category has two values) no longer carries a bar chart's hidden value axis,
  which Microsoft's validator reported (PBIR_FORMATTING_OBJECT_UNKNOWN, a `check_report` "can break"). Found by
  draft PR #69's check of the exact report.
- **B-173, Arabic table headers** (Desktop 2.159 on the laptop: the twin listed a header as cut that Desktop draws
  whole, and `check_report` said nothing about one Desktop cuts): one measure of a header for the twin and
  `check_report` (`headerNeed`). Under 0.7 of it an Arabic header is cut (`fitted.headersCut`, `cut: "cut"`; a
  `check_report` warning, TABLE_HEADER_CUT); from there up to the measure it may be cut (`cut: "may be cut"`, with why;
  a `check_report` note). The twin still widens each column to the full measure.

## [0.2.9]: 2026-10-19 (the version for testers)
Given to testers on 19 Oct 2026, after the Power BI Desktop release proof of rc.24 passed on the laptop (Desktop 2.159):
the approval window names the chart kind that is written, the Arabic twin's title measures, buttons and KPI values,
no network connection. The package is built on Windows with its release record (size and SHA-256), sent with the
download. Known issues for testers: the twin can list a table header as cut when Desktop shows it whole; a chart
planned as "Top 5" can show every category.
- **rc.24, the gaps the Desktop release proof of rc.23 found** (18 Oct, Power BI Desktop 2.159; they finish B-140 and
  the Arabic twin, nothing else changes):
  - B-140: the approval window names each chart field by the kind it is written as, with the reason when it changed
    ("Bar chart by Plan[Plan Group] (planned as a column chart: the names would slant or be cut)"), and lists every
    visual written as another kind; it said "Column chart by".
  - The twin translates chart titles given by the report's own title measures ("Top 9 of 16: ..." titles): each of
    their texts is offered ("Chart title (from a title measure)", the counted numbers as {1} and {2}), and the twin gets
    its own Arabic measures ("Title AR: ...") used by its charts only; the original report and the model are not changed.
    A title measure that builds its text another way is listed as not translated, with why.
  - The twin widens each button to its Arabic text (by `check_report`'s own measure), within its page or group, moving
    the buttons beside it and the page's underline with it; a text with no room is said in the plan (`fitted.buttonsCut`).
  - The twin's KPI cards (one value) have their value right-aligned under their right-aligned titles.
  - The twin widens a table column to its Arabic header within the table's width (text columns give up width; numbers
    never narrowed); what can't fit is said in the plan (`fitted.headersCut`).
  - `PRIVACY.md`: the twin returns the fixed texts of the report's title measures (section 3 and its row).
- **rc.23, three fixes from an outside audit of 0.2.9, so `PRIVACY.md` says exactly what the code does** (18 Oct):
  - F1: a `.pbix` (it holds Power BI's data cache) and data files (`.csv`, `.tsv`, `.xlsx`, `.xlsm`, `.xls`, `.parquet`)
    are refused by their name before they are opened (a `.pbix` was read whole, then refused: "No model in this file").
    A `.pbix` refusal says how to get a `.pbit` or a project. A template (or a file with no extension) is read by its
    list of parts first: one that holds a data cache and no model schema is refused before the rest of it is read.
  - F3: `PRIVACY.md` section 3 no longer says a `.pbit`'s schema "holds no data": a model's definition can hold "Enter
    data" tables and DATATABLE values, which DataArcus reads on your machine but never decodes or returns. `read_report`
    (its row, its description, its note and the README) says slicer selections and bookmark states are read with the
    report's files but never returned.
  - F7b: "No" in the app's own approval prompt refuses the plan, as "Not now" in the approval window does: it can't be
    approved later (it stayed "not approved yet"). A prompt closed without an answer still leaves it to be approved.
- **rc.22, fixes from the owner's own Desktop test of rc.21** (18 Oct; the approval window passed in every case):
  - B-137: the Arabic twin of a report DataArcus wrote mirrors its pages. Their background is DataArcus's own transparent
    placeholder (known by its bytes), not a picture; a page on a real background picture still stays left to right.
  - B-140: the plan shows the kind each visual is written as. A column chart whose category names would slant or be
    cut is written as a bar chart, and the plan's slots now say so (`kindChanges`), so what is approved is what is written.
  - B-132: `colors: { accent }` without a theme or design gives the data colours from the accent (exact, first, its calm
    set, as `generate_theme` makes them), shown in the plan; no more Corporate navy.
  - B-141: every plan lists every file it writes: the report's `.pbip` beside its `.Report` folder.
  - B-142: `check_report`'s `validator.errors` and `warnings` agree with the findings (a known gap is a note);
    `validator.reported` keeps the validator's own counts. No false `TOOLTIP_SCROLL` on a tooltip chart kept to its last
    6 months.
  - B-144: `check_model_health` says plainly when a report of the model can't be read and why (`reportNotRead`,
    `reports.notRead`), and that unused columns were not checked then.
  - B-133: `plan_layout` on a large model with no focus gives no plan id: it asks for an area first.
  - B-134: `create_report` says first that a plan is not approved (with any missing input); after "Not now" a plan is
    refused, not "not approved yet".
  - B-138: in the Arabic twin, a page button takes the approved Arabic name of the page it goes to, shown in the plan.
  - B-135: the approval window shows colours as swatches, with the report's real data colours.
  - B-139: the twin's approval window names each Arabic text by what it is and its own text, never by internal ids.
- **Microsoft's report validator 0.5.0** (was 0.4.0), used offline by `check_report`: our reports still pass with 0 errors and 0 warnings.
- `check_report`'s known notes (the dropdown slicer's rounded box) name the validator that ran, read from the installed package; they still said 0.4.0.
- **Approval inside the tools:** a report, theme, script, calendar or twin is written only after a plan is approved
  (new tool `approve_plan`). You approve it yourself: DataArcus opens its own approval window in your browser, on
  your computer only, with the plan and every file it writes, and only your click on Approve approves it (or your yes
  in the app's own prompt, when the app supports one). What the AI types in the chat approves nothing. Plans have
  limits (cards, slicers, table fields) and expire.
- **Model Health Check, the same engine as the website's:** every finding names its source (a Microsoft Learn page, a
  Microsoft Best Practice Analyzer rule, or a DataArcus rule with its reason), and the checks respect Microsoft's
  documented exceptions (one-to-one relationships, FILTER with a measure, text measures, hidden measures, columns that
  need DAX). Measured on 23 public models: about 140 wrong findings removed, none of the right ones lost.
- **New tools:** `approve_plan`, `read_report` (reads an existing report's pages, visuals and fields), and
  `create_arabic_twin` (an Arabic copy of an existing report, mirrored right to left). 11 tools in all.
- **Reports:** month axes in calendar order with the last 12 months, table column widths, bar labels that fit, no
  blank category, no logo placeholder, amounts in automatic units with 2 decimals and counts as whole numbers,
  tooltips with the top 6 or the last 6 months; the layout fits each page's slots by measured sizes.
- **Theme:** light by default, with the brand colour exact and a calm palette checked at 3:1 contrast.
- **Fairer choices:** KPIs ranked by each measure's formula and format, not by words in its name, in any language; a
  time measure (last year, year to date) never ranked before a base measure; one number-format rule for cards and
  tables, the same on the website's download and in the MCP; an Arabic report shows the calendar's Arabic month and
  day names.
- **Checks:** `check_report` adds a design lint of the report (time axes sorted A to Z, labels likely cut, overlaps);
  `plan_layout` lints the planned page before you approve it.
- **Safety and robustness (the 0.2.9 audits and an outside review of the release candidate):**
  - reading stays inside the working folder, also for the model a `.pbip` points at;
  - one bad or oddly shaped file never stops a tool (tested with thousands of generated broken files);
  - writes are all or nothing, and when a write fails, only the files that same call created are removed;
  - the approval gate refuses when a plan does not cover the tool asked, a report's plan writes the report only, only
    your click in the approval window (or the app's prompt) approves, never a typed reply, a plan is approved once, and its time counts from
    when it was proposed;
  - files you name (a logo, a background, a theme) are read once, within their size limit;
  - every answer shows invisible and control characters as code points and stays under 40,000 characters.
- MCP SDK 1.32.1; the runtime dependencies are pinned to exact versions.

## [0.2.8]: 2026-10-08 (the version testers had before 0.2.9)
- Arabic reports: the "Total" word in Arabic tables, and the report's language follows its columns (English columns
  in English reports, Arabic in Arabic reports).
- Install guide fixes.
- 8 tools: `read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`, `create_report`,
  `add_gulf_calendar`, `check_report`.

## [0.2.7]: 2026-10-08 (built and install-tested, not given to testers)
- New tool `check_report`: Microsoft's report validator (0.4.0), run offline.
- The "No data for this selection" message on cards by default.
- Names with control characters are refused in the scripts the tools write.

## Earlier
0.2.0 to 0.2.6 (September and early October 2026): private builds, not distributed.
