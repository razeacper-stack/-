import { SafeUser } from '../types/auth';
import { ReportResult } from '../types/reports';
import { authStorage } from '../services/authStorage';

/**
 * Reusable Export Engine for Phase 11
 * Handles CSV and Excel-compatible XML Spreadsheet generation.
 */

const escapeCSVField = (val: any): string => {
  let str = String(val ?? '').replace(/"/g, '""');
  // Formula Injection Guard (CSV Injection / CWE-1236)
  // If field starts with formula trigger characters (=, +, -, @, \t, \r), prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
};

export const exportReportToCSV = (
  actingUser: SafeUser,
  report: ReportResult
): string => {
  // Check export permission
  const isAuthorized =
    authStorage.isSuperAdmin(actingUser) ||
    authStorage.hasPermission(actingUser, 'reports.export') ||
    authStorage.hasPermission(actingUser, 'finance.export') ||
    authStorage.hasPermission(actingUser, 'teachers.export') ||
    authStorage.hasPermission(actingUser, 'attendance.export') ||
    authStorage.hasPermission(actingUser, 'timetable.export') ||
    authStorage.hasPermission(actingUser, 'payments.export');

  if (!isAuthorized) {
    authStorage.logAudit({
      actorId: actingUser.id,
      actorName: actingUser.fullName,
      actorRole: actingUser.roleCode,
      action: 'REPORT_UNAUTHORIZED_ATTEMPT',
      targetType: 'REPORT',
      targetId: report.definition.id,
      result: 'DENIED',
      details: `محاولة تصدير غير مصرح بها لتقرير (${report.definition.titleAr})`,
    });
    throw new Error('ليس لديك الصلاحية الكافية لتصدير هذا التقرير (reports.export).');
  }

  // Financial safety check
  if (report.definition.category === 'finance') {
    const hasFin =
      authStorage.isSuperAdmin(actingUser) ||
      authStorage.hasPermission(actingUser, 'finance.export') ||
      authStorage.hasPermission(actingUser, 'finance.view_reports');
    if (!hasFin) {
      throw new Error('ليس لديك الصلاحية الكافية لتصدير التقارير والبيانات المالية.');
    }
  }

  const bom = '\uFEFF';
  const lines: string[] = [];

  // Header Metadata block
  lines.push(escapeCSVField(`نظام إدارة المدارس — ${report.definition.titleAr}`));
  lines.push(
    [
      escapeCSVField(`الفرع: ${report.branchNameAr}`),
      report.academicYearNameAr ? escapeCSVField(`العام الدراسي: ${report.academicYearNameAr}`) : '',
      escapeCSVField(`تاريخ الإنشاء: ${report.generatedAt.slice(0, 10)}`),
      escapeCSVField(`بواسطة: ${report.generatedBy}`),
    ]
      .filter(Boolean)
      .join(',')
  );
  lines.push('');

  // Column Headers
  lines.push(report.columns.map((c) => escapeCSVField(c.labelAr)).join(','));

  // Rows
  for (const row of report.rows) {
    const rowValues = report.columns.map((c) => escapeCSVField(row[c.key]));
    lines.push(rowValues.join(','));
  }

  // Summary Block
  if (report.summary && report.summary.length > 0) {
    lines.push('');
    lines.push(escapeCSVField('--- ملخص مؤشرات التقرير ---'));
    for (const item of report.summary) {
      lines.push(`${escapeCSVField(item.labelAr)},${escapeCSVField(item.value)}`);
    }
  }

  // Audit Logging
  authStorage.logAudit({
    actorId: actingUser.id,
    actorName: actingUser.fullName,
    actorRole: actingUser.roleCode,
    action: 'REPORT_EXPORTED',
    targetType: 'REPORT',
    targetId: report.definition.id,
    branchContext: report.branchNameAr,
    result: 'SUCCESS',
    details: `تم تصدير تقرير (${report.definition.titleAr}) إلى ملف CSV بنجاح وعدد السجلات: ${report.rows.length}`,
  });

  return bom + lines.join('\n');
};

/**
 * Generates an Excel-compatible XML Spreadsheet 2003 file.
 * Microsoft Excel opens this natively with bold headers, proper cell formats and full UTF-8 Arabic support.
 */
export const exportReportToXLSX = (
  actingUser: SafeUser,
  report: ReportResult
): string => {
  // Check permission same as CSV
  const isAuthorized =
    authStorage.isSuperAdmin(actingUser) ||
    authStorage.hasPermission(actingUser, 'reports.export') ||
    authStorage.hasPermission(actingUser, 'finance.export') ||
    authStorage.hasPermission(actingUser, 'teachers.export');

  if (!isAuthorized) {
    throw new Error('ليس لديك الصلاحية الكافية لتصدير هذا التقرير إلى Excel.');
  }

  if (report.definition.category === 'finance') {
    const hasFin =
      authStorage.isSuperAdmin(actingUser) ||
      authStorage.hasPermission(actingUser, 'finance.export') ||
      authStorage.hasPermission(actingUser, 'finance.view_reports');
    if (!hasFin) {
      throw new Error('ليس لديك الصلاحية الكافية لتصدير التقارير والبيانات المالية.');
    }
  }

  const escapeXML = (str: any): string => {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Size="11" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1D4ED8"/>
   </Borders>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Size="14" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Meta">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellEnd">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="SummaryLabel">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Color="#334155"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SummaryValue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXML(report.definition.titleAr.slice(0, 30))}">
  <Table ss:DefaultRowHeight="20">
   <Row ss:Height="28">
    <Cell ss:MergeAcross="${report.columns.length - 1}" ss:StyleID="Title">
     <Data ss:Type="String">${escapeXML(report.definition.titleAr)}</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="${report.columns.length - 1}" ss:StyleID="Meta">
     <Data ss:Type="String">الفرع: ${escapeXML(report.branchNameAr)} | التاريخ: ${escapeXML(report.generatedAt.slice(0, 10))} | المعتمد: ${escapeXML(report.generatedBy)}</Data>
    </Cell>
   </Row>
   <Row ss:Height="10"/>
   <Row ss:Height="24">
    ${report.columns
      .map(
        (c) =>
          `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(c.labelAr)}</Data></Cell>`
      )
      .join('\n    ')}
   </Row>
   ${report.rows
     .map(
       (r) =>
         `<Row ss:Height="20">
    ${report.columns
      .map((c) => {
        const val = r[c.key];
        const isNum = typeof val === 'number';
        const style =
          c.align === 'center'
            ? 'CellCenter'
            : c.align === 'end'
            ? 'CellEnd'
            : 'Cell';
        return `<Cell ss:StyleID="${style}"><Data ss:Type="${
          isNum ? 'Number' : 'String'
        }">${escapeXML(val)}</Data></Cell>`;
      })
      .join('\n    ')}
   </Row>`
     )
     .join('\n   ')}
   ${
     report.summary && report.summary.length > 0
       ? `
   <Row ss:Height="12"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">مؤشر الملخص</Data></Cell>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">القيمة</Data></Cell>
   </Row>
   ${report.summary
     .map(
       (item) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">${escapeXML(item.labelAr)}</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="String">${escapeXML(item.value)}</Data></Cell>
   </Row>`
     )
     .join('')}`
       : ''
   }
  </Table>
 </Worksheet>
</Workbook>`;

  authStorage.logAudit({
    actorId: actingUser.id,
    actorName: actingUser.fullName,
    actorRole: actingUser.roleCode,
    action: 'REPORT_EXPORTED',
    targetType: 'REPORT',
    targetId: report.definition.id,
    branchContext: report.branchNameAr,
    result: 'SUCCESS',
    details: `تم تصدير تقرير (${report.definition.titleAr}) إلى ملف Excel بنجاح`,
  });

  return xmlHeader;
};

/**
 * Helper to download content as a file in browser
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string
): void => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
