# Getting help with DataArcus

For the DataArcus MCP ("DataArcus for Power BI", the Claude Desktop extension) and the free tools on dataarcus.com.

## Where to ask
- **On GitHub:** [open an issue](https://github.com/Antnioo/DataArcus/issues/new/choose) and pick a form: a bug
  report, a report that reads wrong in Arabic, or an install problem. Issues are public: anyone can read them.
- **By email:** [hello@dataarcus.com](mailto:hello@dataarcus.com), for anything you would rather not post in public.

During the beta we read every report and answer within 2 working days (Monday to Friday, UAE time).

## What to include
- **The DataArcus version:** in Claude Desktop, Settings > Extensions > DataArcus for Power BI, or the name of the
  `.mcpb` file you installed (for example `dataarcus-0.3.0.mcpb`).
- **Your AI app** and its version (Claude Desktop, Claude Code, or another MCP client).
- **Your Windows version** (Settings > System > About), and Power BI Desktop's (Help > About).
- **What you asked, and the tool's answer**: the tool's name and what it said, copied as text.

**Never send** a `.pbix`, a model or report folder, your data, or a screenshot that shows figures. DataArcus works on
names and structure, and a report of a problem needs no more than that. Names can say something about your business
too: if a table or measure name matters to the problem but is private, replace it with a made-up name.

## How you learn of a new version
DataArcus does not check for updates itself: it connects to nothing outside your computer
([PRIVACY.md, section 1](mcp/PRIVACY.md#1-the-mcp-runs-on-your-machine-and-sends-nothing-itself)). A new version is
published on:
- **the release page:** https://github.com/Antnioo/dataarcus-releases/releases (each release with its `.mcpb` and its
  SHA-256; GitHub's Watch > Custom > Releases sends you an email for each new one);
- **the DataArcus for Power BI page:** https://dataarcus.com/power-bi-mcp/ (its download button names the version).

To update, open the new `.mcpb` as you installed the first one ([mcp/README.md](mcp/README.md#claude-desktop-beta),
step 3).

## Privacy and security
What DataArcus reads, writes and sends: [mcp/PRIVACY.md](mcp/PRIVACY.md). A security problem: write to
[hello@dataarcus.com](mailto:hello@dataarcus.com) rather than opening a public issue.
