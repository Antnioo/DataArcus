# S2-1 (20 Oct 2026): the Windows helper of lib/desktop-render.mjs (render_report, experimental). Started by the driver
# with -NoProfile -NonInteractive -File; reads one JSON request a line on stdin ({ id, op, ... }) and answers one JSON
# line ({ id, ok: true, ... } or { id, ok: false, error }). It touches only the Power BI Desktop process the driver
# started (its pid, or the PBIDesktop process whose command line names the driver's project) and that process's
# windows: it never closes, clicks or reads another program, and never closes a process by its name.
#   foreground          is a Power BI Desktop window in front? (the user's own: the driver refuses then)
#   find                PBIDesktop.exe: PBI_DESKTOP_PATH, the installer's folder, the Microsoft Store package
#   open  exe file      starts Desktop on the project file; answers its pid
#   state pid file      the process (alive, its pid if the Store started it again), its main window (the handle,
#                       sized 1600 x 1000 once, never activated), a dialog (the main window disabled, or a Win32 dialog)
#   page  pid hwnd name shows the page whose tab is named so (UI Automation: TabItem, then ListItem; no mouse)
#   capture hwnd file   the window by its handle (PrintWindow with PW_RENDERFULLCONTENT) into a PNG
#   close pid file      ends that process and its children (taskkill /PID /T), only if its command line names file
# Not proven on Windows yet: the laptop runs it first ("For the laptop" in mcp/work/S2.md).
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class DaWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowEnabled(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr h, uint cmd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public static List<IntPtr> Of(uint pid) {
    var l = new List<IntPtr>();
    EnumWindows(delegate (IntPtr h, IntPtr x) { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h)) l.Add(h); return true; }, IntPtr.Zero);
    return l;
  }
  public static string Text(IntPtr h) { var s = new StringBuilder(512); GetWindowText(h, s, 512); return s.ToString(); }
  public static string Class(IntPtr h) { var s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
  public static uint Pid(IntPtr h) { uint p; GetWindowThreadProcessId(h, out p); return p; }
}
"@
[void][DaWin]::SetProcessDPIAware()
$script:sized = @{}

function Send($obj) { [Console]::Out.WriteLine(($obj | ConvertTo-Json -Compress -Depth 5)); [Console]::Out.Flush() }
function Reply($id, $obj) { $obj['id'] = $id; $obj['ok'] = $true; Send $obj }
function Fail($id, $msg) { Send @{ id = $id; ok = $false; error = [string]$msg } }

function Find-Desktop {
  if ($env:PBI_DESKTOP_PATH -and (Test-Path -LiteralPath $env:PBI_DESKTOP_PATH -PathType Leaf)) { return $env:PBI_DESKTOP_PATH }
  foreach ($p in @("$env:ProgramFiles\Microsoft Power BI Desktop\bin\PBIDesktop.exe", "${env:ProgramFiles(x86)}\Microsoft Power BI Desktop\bin\PBIDesktop.exe")) {
    if ($p -and (Test-Path -LiteralPath $p -PathType Leaf)) { return $p }
  }
  $pkg = Get-AppxPackage -Name 'Microsoft.MicrosoftPowerBIDesktop' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($pkg) { $p = Join-Path $pkg.InstallLocation 'bin\PBIDesktop.exe'; if (Test-Path -LiteralPath $p -PathType Leaf) { return $p } }
  if ($env:PBI_DESKTOP_PATH) { throw "PBI_DESKTOP_PATH is set but no file is there, and Desktop is not in Program Files or the Store package" }
  throw 'PBIDesktop.exe not found (PBI_DESKTOP_PATH, Program Files, the Store package)'
}

# the command line of a process (Win32_Process), or ''
function Command-Of([int]$procId) {
  $q = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
  if ($q -and $q.CommandLine) { return [string]$q.CommandLine } else { return '' }
}

# the Desktop process that is ours: the pid started, else (a Store Desktop starts again under another pid) the
# PBIDesktop process whose command line names our project file; never another Desktop
function Find-Ours([int]$procId, [string]$file) {
  $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
  if ($p -and -not $p.HasExited) { return $procId }
  $q = Get-CimInstance Win32_Process -Filter "Name = 'PBIDesktop.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($file) } | Select-Object -First 1
  if ($q) { return [int]$q.ProcessId }
  return $null
}

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  if (-not $line.Trim()) { continue }
  $m = $null
  try { $m = $line | ConvertFrom-Json } catch { continue }
  try {
    switch -Exact ([string]$m.op) {
      'foreground' {
        $h = [DaWin]::GetForegroundWindow()
        $p = Get-Process -Id ([int][DaWin]::Pid($h)) -ErrorAction SilentlyContinue
        Reply $m.id @{ desktop = [bool]($p -and $p.ProcessName -eq 'PBIDesktop') }
      }
      'find' { Reply $m.id @{ path = (Find-Desktop) } }
      'open' {
        $p = Start-Process -FilePath ([string]$m.exe) -ArgumentList ('"' + [string]$m.file + '"') -PassThru
        Reply $m.id @{ pid = $p.Id }
      }
      'state' {
        $own = Find-Ours ([int]$m.pid) ([string]$m.file)
        if (-not $own) { Reply $m.id @{ pid = $null; alive = $false; hwnd = $null; dialog = $null }; break }
        $base = [IO.Path]::GetFileNameWithoutExtension([string]$m.file)
        $wins = [DaWin]::Of([uint32]$own)
        $main = $wins | Where-Object { [DaWin]::GetWindow($_, 4) -eq [IntPtr]::Zero -and ([DaWin]::Text($_)).Contains($base) } | Select-Object -First 1
        $dialog = $null
        foreach ($w in $wins) { if ($w -ne $main -and [DaWin]::Class($w) -eq '#32770') { $dialog = @{ title = [DaWin]::Text($w) }; break } }
        if (-not $dialog -and $main -and -not [DaWin]::IsWindowEnabled($main)) {
          $other = $wins | Where-Object { $_ -ne $main -and [DaWin]::IsWindowEnabled($_) } | Select-Object -First 1
          $dialog = @{ title = $(if ($other) { [DaWin]::Text($other) } else { '' }) }
        }
        $hwnd = $null
        if ($main) {
          $hwnd = $main.ToInt64()
          if (-not $script:sized.ContainsKey($hwnd)) {
            if ([DaWin]::IsIconic($main)) { [void][DaWin]::ShowWindow($main, 4) }   # SW_SHOWNOACTIVATE
            $r = New-Object 'DaWin+RECT'; [void][DaWin]::GetWindowRect($main, [ref]$r)
            [void][DaWin]::SetWindowPos($main, [IntPtr]::Zero, $r.Left, $r.Top, 1600, 1000, 0x14)   # SWP_NOZORDER | SWP_NOACTIVATE
            $script:sized[$hwnd] = $true
          }
        }
        Reply $m.id @{ pid = $own; alive = $true; hwnd = $hwnd; dialog = $dialog }
      }
      'page' {
        $root = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr][long]$m.hwnd)
        $named = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, [string]$m.name)
        $done = $null
        foreach ($ct in @([System.Windows.Automation.ControlType]::TabItem, [System.Windows.Automation.ControlType]::ListItem)) {
          $cond = New-Object System.Windows.Automation.AndCondition($named, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, $ct)))
          $el = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
          if (-not $el) { continue }
          $pat = $null
          if ($el.TryGetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern, [ref]$pat)) { $pat.Select(); $done = $ct.ProgrammaticName; break }
          if ($el.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$pat)) { $pat.Invoke(); $done = $ct.ProgrammaticName; break }
        }
        if (-not $done) { throw "no page tab named so (UI Automation: TabItem, ListItem)" }
        Reply $m.id @{ by = $done }
      }
      'capture' {
        $h = [IntPtr][long]$m.hwnd
        $r = New-Object 'DaWin+RECT'; [void][DaWin]::GetWindowRect($h, [ref]$r)
        $w = $r.Right - $r.Left; $ht = $r.Bottom - $r.Top
        if ($w -le 0 -or $ht -le 0) { throw 'the window has no size (minimized?)' }
        $bmp = New-Object System.Drawing.Bitmap $w, $ht
        $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
        $ok = [DaWin]::PrintWindow($h, $dc, 2)   # PW_RENDERFULLCONTENT
        $g.ReleaseHdc($dc); $g.Dispose()
        if (-not $ok) { $bmp.Dispose(); throw 'PrintWindow returned 0' }
        $bmp.Save([string]$m.file, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
        Reply $m.id @{ width = $w; height = $ht }
      }
      'close' {
        $procId = [int]$m.pid
        if (-not (Get-Process -Id $procId -ErrorAction SilentlyContinue)) { Reply $m.id @{ closed = $true; was = 'gone' }; break }
        if (-not (Command-Of $procId).Contains([string]$m.file)) { throw "process $procId is not the Desktop DataArcus started (its command line does not name the project): not closed" }
        $null = & taskkill.exe /PID $procId /T /F 2>&1
        Reply $m.id @{ closed = ($LASTEXITCODE -eq 0) }
      }
      default { throw "unknown op $($m.op)" }
    }
  } catch { Fail $m.id $_.Exception.Message }
}
