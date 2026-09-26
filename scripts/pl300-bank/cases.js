// PL-300 case studies
const Q = require('./h.js');
module.exports = [
{ id: 'PCS1', title: 'Gulf Auto Group',
  scenario: `<h4>Overview</h4><p>Gulf Auto Group sells and services cars in 14 showrooms across the UAE. The analytics team uses Power BI Pro licenses. A new workspace named Sales Analytics is assigned to a Fabric F64 capacity.</p>
<h4>Existing environment</h4><ul>
<li>Leads and sales are stored in a SQL Server database named CRMDB in the company datacenter. There's no network connectivity from Azure to the datacenter.</li>
<li>Monthly showroom targets are maintained by Finance in an Excel workbook in a SharePoint Online site. The workbook has one row per showroom and one column per month.</li>
<li>CRMDB has a table named Sales with the columns SaleID, ShowroomID, ModelID, SaleDate, DeliveryDate, CustomerID and Amount.</li>
<li>A Showroom table stores ShowroomID, ShowroomName, City and ManagerEmail.</li></ul>
<h4>Requirements</h4><h5>Reporting</h5><ul>
<li>Managers must compare sales by sale date and by delivery date in the same visual.</li>
<li>A report page must show each month's sales against the Finance target.</li>
<li>Sales must refresh every day at 7:00 AM.</li>
<li>Executives want an email when monthly sales drop below target.</li></ul>
<h5>Security</h5><ul>
<li>Each showroom manager must see only their showroom's data. Managers must not be able to edit reports.</li>
<li>Regional directors must be able to build their own reports on the semantic model without a workspace role.</li></ul>`,
  questions: [
Q('get','single',2,'Gateways',
`You need to meet the daily refresh requirement for the CRMDB data. What should you deploy?`,
[`A standard on-premises data gateway on a server that can reach CRMDB`,`A virtual network data gateway`,`Nothing; the Fabric capacity reaches CRMDB directly`,`A personal mode gateway on a manager's laptop`],0,
`CRMDB is in the company datacenter with no Azure connectivity, so the service needs an on-premises data gateway. Standard mode is shared and runs on an always-on server.`,
[``,`VNet gateways reach sources in Azure virtual networks.`,`Capacities don't open network paths to on-premises servers.`,`A laptop gateway is personal and goes offline.`],
`CRMDB داخل مركز البيانات، لذلك تحتاج standard on-premises gateway.`,['gw']),
Q('transform','single',2,'Unpivot',
`You need to prepare the Finance target workbook so each month's target can be compared with sales. What should you do in Power Query?`,
[`Select ShowroomID and use Unpivot other columns, then convert the attribute to a month date`,`Pivot the month columns`,`Append the workbook to the Sales query`,`Transpose the table and load it`],0,
`The workbook is wide (one column per month). Unpivoting gives one row per showroom and month, which can relate to the Showroom and Date tables.`,
[``,`Pivot makes it wider.`,`Append stacks rows from tables with the same columns.`,`Transpose puts showrooms in columns, still not a fact table.`],
`جدول الأهداف العريض يُحول بـ Unpivot other columns.`,['unpivot']),
Q('design','single',2,'Role-playing dimension',
`You need to meet the requirement to compare sales by sale date and by delivery date in the same visual. What should you do?`,
[`Create two date tables, Sale Date and Delivery Date, each with an active relationship to Sales`,`Create one Date table with two active relationships`,`Use USERELATIONSHIP in a single measure only`,`Make the relationship bi-directional`],0,
`To slice by both dates in the same visual, each date role needs its own table with an active relationship. USERELATIONSHIP measures switch the relationship but don't allow two date axes at once.`,
[``,`Only one active relationship is allowed between two tables.`,`USERELATIONSHIP alone doesn't give two separate date fields to slice by.`,`Direction doesn't add a second role.`],
`للتصفية بتاريخين في نفس الـ visual: جدولا تاريخ منفصلان.`,['star','userel']),
Q('security','single',2,'RLS',
`You need to meet the showroom manager requirement. What should you configure?`,
[`A dynamic RLS role on Showroom with [ManagerEmail] = USERPRINCIPALNAME(), and give managers the app audience or Viewer role`,`A static role per showroom, and give managers the Contributor role`,`A page filter on ShowroomName, and give managers the Member role`,`Hide the Showroom table, and give managers the Viewer role`],0,
`Dynamic RLS with the user's UPN serves all managers with one role, and RLS only applies to read-only users such as Viewers or app users, who also can't edit.`,
[``,`Contributors can edit and bypass RLS.`,`Page filters aren't security and Members can edit.`,`Hiding a table doesn't filter rows.`],
`RLS ديناميكي + Viewer أو تطبيق حتى يطبق RLS ولا يعدلوا.`,['rls']),
Q('workspace','single',2,'Alerts',
`You need to meet the executive email requirement. What should you create?`,
[`A dashboard with a KPI or card tile for monthly sales versus target, and a data alert on it`,`A subscription to the report page every Monday`,`Automatic page refresh on the report`,`A bookmark`],0,
`Data alerts send notifications when a dashboard tile value crosses a threshold. They're available on card, KPI and gauge tiles.`,
[``,`Subscriptions send on a schedule, not when a value drops.`,`Page refresh doesn't send email.`,`Bookmarks don't notify.`],
`تنبيه عند انخفاض القيمة = data alert على tile في dashboard.`,['alerts','dash']),
Q('security','yesno',2,'Item access',
`Regional directors must build their own reports on the semantic model without a workspace role.<br>For each of the following statements, select Yes if the statement is true. Otherwise, select No.`,
[`Granting Build permission on the semantic model lets them create reports in Power BI Desktop with a live connection.`,`If directors are also members of an RLS role, RLS applies to their new reports.`,`Directors need the Member role to connect to the semantic model.`],
[true,true,false],
`Build permission allows creating content on the model without a workspace role. RLS applies to them because they only have read and build access. No workspace role is required.`,
[`Yes.`,`Yes. Build doesn't bypass RLS.`,`No. Build permission is enough to connect and build.`],
`Build يكفي لبناء تقارير، وRLS يبقى مطبقًا عليهم.`,['build','rls'])
  ]
},
{ id: 'PCS2', title: 'Desert Retail Co.',
  scenario: `<h4>Overview</h4><p>Desert Retail Co. runs 60 supermarkets in Saudi Arabia and Qatar. The BI team publishes reports to a workspace named Retail BI that uses a Premium Per User (PPU) license mode.</p>
<h4>Existing environment</h4><ul>
<li>Point-of-sale data is exported nightly as CSV files to a SharePoint Online document library, one file per store per day.</li>
<li>A Product table in an Azure SQL database has 40,000 products. Only 9,000 products have ever been sold.</li>
<li>An Inventory table records the quantity on hand per product per store at the end of each day.</li>
<li>The current Sales table contains a DateTime column with seconds and a TransactionID column with 400 million unique values. Neither is used in any report.</li>
<li>The main report page has 28 visuals and takes 15 seconds to load.</li></ul>
<h4>Requirements</h4><ul>
<li>Monthly inventory must show the stock on the last day of each month, summed across stores.</li>
<li>Reduce model size and improve the main page load time.</li>
<li>Store managers use phones in the Power BI mobile app.</li>
<li>Reports must support Arabic-speaking readers who use screen readers.</li></ul>`,
  questions: [
Q('get','single',1,'Get data',
`You need to load all the daily CSV files into one Sales table with the least ongoing effort. What should you use?`,
[`The SharePoint folder connector with Combine files`,`The Text/CSV connector once per file`,`The Web connector`,`A dataflow that copies files to a local folder`],0,
`The SharePoint folder connector lists all files and Combine files appends them through a sample-file function, picking up new files at each refresh.`,
[``,`One query per file doesn't scale.`,`The Web connector reads single URLs.`,`Copying to a local folder adds a gateway and extra steps.`],
`ملفات يومية في SharePoint: SharePoint folder ثم Combine files.`,['append']),
Q('dax','single',2,'Semi-additive',
`Which measure meets the monthly inventory requirement?`,
[`CLOSINGBALANCEMONTH(SUM(Inventory[Qty]), 'Date'[Date])`,`SUM(Inventory[Qty])`,`TOTALMTD(SUM(Inventory[Qty]), 'Date'[Date])`,`AVERAGE(Inventory[Qty])`],0,
`Stock is semi-additive: sum across stores, but take the last day for the month. CLOSINGBALANCEMONTH does this.`,
[``,`SUM adds every day's stock.`,`TOTALMTD accumulates across days.`,`An average isn't the closing stock.`],
`المخزون آخر الشهر = CLOSINGBALANCEMONTH.`,['closing']),
Q('perf','multi',2,'Reduce data',
`Which two changes reduce the model size the most without affecting any report? Each correct answer presents a complete solution. Select TWO.`,
[`Remove the TransactionID column and replace the DateTime column with a Date column`,`Filter the Product query to products that appear in Sales`,`Hide the TransactionID column`,`Turn on Auto date/time`,`Add a calculated column for the date`],
[0,1],
`High-cardinality unused columns and unused dimension rows take memory. Removing them in Power Query shrinks the model. Hiding columns, auto date tables and extra calculated columns don't help or make it bigger.`,
[`Correct.`,`Correct.`,`Hidden columns are still stored.`,`Auto date/time adds hidden tables.`,`Calculated columns add data.`],
`احذف الأعمدة عالية التفرد غير المستخدمة وصفوف الأبعاد غير المستخدمة.`,['datared']),
Q('perf','single',2,'Performance Analyzer',
`You need to find out why the main page takes 15 seconds. What should you do first?`,
[`Run Performance Analyzer on the page and review each visual's DAX query and visual display times`,`Turn on automatic page refresh`,`Add more slicers`,`Change the theme`],0,
`Performance Analyzer shows exactly which of the 28 visuals are slow and whether the time is DAX or rendering, which guides the fix.`,
[``,`That adds more queries.`,`More slicers add more queries.`,`Themes don't affect query time.`],
`ابدأ دائمًا بـ Performance Analyzer لمعرفة سبب البطء.`,['perfan']),
Q('usability','single',1,'Mobile',
`What should you do for the store managers who use phones?`,
[`Create a mobile layout for the pages they use`,`Make the page size 360 by 640`,`Publish a copy of the report for phones`,`Remove all slicers`],0,
`Mobile layouts show automatically in the Power BI mobile apps in portrait orientation, without changing the desktop layout.`,
[``,`That shrinks the desktop view too.`,`A copy doubles maintenance.`,`Slicers can be optimized for mobile rather than removed.`],
`لمستخدمي الهاتف: Mobile layout.`,['mobile']),
Q('usability','yesno',2,'Accessibility',
`You're improving accessibility for screen reader users.<br>For each of the following statements, select Yes if the statement is true. Otherwise, select No.`,
[`Alt text on visuals is read by screen readers.`,`Setting the tab order in the Selection pane helps keyboard navigation.`,`Using only color to show good and bad results is enough for accessibility.`],
[true,true,false],
`Alt text gives a text description, tab order controls keyboard focus, and color alone excludes users with color vision deficiency.`,
[`Yes.`,`Yes.`,`No. Add icons, labels or markers in addition to color.`],
`Alt text وترتيب Tab مهمان، واللون وحده لا يكفي.`,['access'])
  ]
}
];
