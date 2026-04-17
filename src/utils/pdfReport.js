// pdfReport.js — Client-side PDF generation using jsPDF
// Install: npm install jspdf

import { jsPDF } from 'jspdf';

const COLORS = {
  primary: [15, 76, 117],
  accent: [249, 115, 22],
  success: [22, 163, 74],
  danger: [220, 38, 38],
  warning: [217, 119, 6],
  info: [8, 145, 178],
  light: [240, 244, 248],
  muted: [100, 116, 139],
  white: [255, 255, 255],
  dark: [30, 41, 59],
  border: [226, 232, 240],
};

const STATUS_COLORS = {
  solved: COLORS.success,
  pending: COLORS.warning,
  rejected: COLORS.danger,
  assigned: COLORS.info,
  'in-progress': [8, 145, 178],
};

const TYPE_LABELS = {
  garbage: 'Garbage & Waste',
  streetlight: 'Street Light',
  water: 'Water Wastage',
  drainage: 'Drainage',
};

const TYPE_LABELS_HI = {
  garbage: 'कचरा',
  streetlight: 'स्ट्रीट लाइट',
  water: 'पानी',
  drainage: 'नाली',
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getPeriodLabel(period, from, to) {
  if (period === 'today') return 'Today';
  if (period === 'yesterday') return 'Yesterday';
  if (period === 'last10') return 'Last 10 Days';
  if (period === 'month') return 'Last 30 Days';
  if (from && to) return `${formatDate(from)} to ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  if (to) return `Until ${formatDate(to)}`;
  return 'All Time';
}

// Draw a rounded rectangle
function roundRect(doc, x, y, w, h, r, fillColor, strokeColor) {
  if (fillColor) { doc.setFillColor(...fillColor); }
  if (strokeColor) { doc.setDrawColor(...strokeColor); } else { doc.setDrawColor(255,255,255,0); }
  doc.roundedRect(x, y, w, h, r, r, fillColor ? (strokeColor ? 'FD' : 'F') : 'S');
}

// Draw stat box
function drawStatBox(doc, x, y, w, h, icon, value, label, color) {
  roundRect(doc, x, y, w, h, 3, COLORS.white, COLORS.border);
  // Left accent bar
  doc.setFillColor(...color);
  doc.rect(x, y, 3, h, 'F');
  // Icon
  doc.setFontSize(18);
  doc.text(icon, x + 10, y + h/2 + 2);
  // Value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...color);
  doc.text(String(value), x + 30, y + h/2 - 2);
  // Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(label, x + 30, y + h/2 + 7);
}

// Draw bar chart
function drawBarChart(doc, x, y, w, h, data, title) {
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(title, x, y - 3);

  // Background
  roundRect(doc, x, y, w, h, 3, [248, 250, 252], COLORS.border);

  if (!data || data.length === 0) {
    doc.setFontSize(9); doc.setTextColor(...COLORS.muted);
    doc.text('No data available', x + w/2, y + h/2, { align: 'center' });
    return;
  }

  const maxVal = Math.max(...data.map(d => d.value || d.count || 0), 1);
  const barW = (w - 20) / data.length - 6;
  const chartH = h - 30;
  const baseY = y + h - 16;

  data.forEach((d, i) => {
    const val = d.value || d.count || 0;
    const barH = (val / maxVal) * chartH;
    const bx = x + 10 + i * ((w - 20) / data.length);
    const by = baseY - barH;
    const color = d.color || COLORS.primary;

    doc.setFillColor(...color);
    doc.roundedRect(bx, by, barW, barH, 2, 2, 'F');

    // Value on top
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.dark);
    if (val > 0) doc.text(String(val), bx + barW/2, by - 2, { align: 'center' });

    // Label below
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    const label = d.name || d.label || '';
    doc.text(label.length > 10 ? label.substring(0,10)+'..' : label, bx + barW/2, baseY + 8, { align: 'center' });
  });
}

// Draw horizontal bar for area-wise
function drawAreaTable(doc, x, y, w, data, title) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(title, x, y);
  y += 6;

  if (!data || data.length === 0) {
    roundRect(doc, x, y, w, 20, 2, [248,250,252], COLORS.border);
    doc.setFontSize(9); doc.setTextColor(...COLORS.muted);
    doc.text('No area data available', x + w/2, y + 13, { align: 'center' });
    return y + 25;
  }

  // Header
  roundRect(doc, x, y, w, 9, 1, COLORS.primary, null);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.white);
  doc.text('Area / Location', x + 3, y + 6.5);
  doc.text('Total', x + w * 0.54, y + 6.5, { align: 'center' });
  doc.text('Solved', x + w * 0.68, y + 6.5, { align: 'center' });
  doc.text('Pending', x + w * 0.82, y + 6.5, { align: 'center' });
  doc.text('Rejected', x + w * 0.96, y + 6.5, { align: 'right' });
  y += 9;

  data.forEach((row, i) => {
    const bg = i % 2 === 0 ? COLORS.white : [248, 250, 252];
    roundRect(doc, x, y, w, 9, 0, bg, COLORS.border);

    // Progress bar for solved
    const maxTotal = data[0].total || 1;
    const barW = (w * 0.35) * (row.total / maxTotal);
    doc.setFillColor(...COLORS.primary);
    doc.setGState && doc.setGState(new doc.GState({ opacity: 0.12 }));
    doc.rect(x, y, barW, 9, 'F');
    doc.setGState && doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.dark);
    const areaLabel = row.area.length > 28 ? row.area.substring(0, 28) + '..' : row.area;
    doc.text(areaLabel, x + 3, y + 6.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(String(row.total), x + w * 0.54, y + 6.2, { align: 'center' });

    doc.setTextColor(...COLORS.success);
    doc.text(String(row.solved || 0), x + w * 0.68, y + 6.2, { align: 'center' });

    doc.setTextColor(...COLORS.warning);
    doc.text(String(row.pending || 0), x + w * 0.82, y + 6.2, { align: 'center' });

    doc.setTextColor(...COLORS.danger);
    doc.text(String(row.rejected || 0), x + w * 0.96, y + 6.2, { align: 'right' });

    y += 9;
  });
  return y + 4;
}

// Draw status pills
function drawStatusPills(doc, x, y, byStatus) {
  const entries = Object.entries(byStatus).filter(([,v]) => v > 0);
  let cx = x;
  entries.forEach(([key, val]) => {
    const color = STATUS_COLORS[key] || COLORS.muted;
    const label = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`;
    const tw = doc.getStringUnitWidth(label) * 8 / doc.internal.scaleFactor + 10;
    roundRect(doc, cx, y - 5, tw, 9, 4, [...color, 20], color);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(label, cx + tw/2, y + 1.5, { align: 'center' });
    cx += tw + 4;
  });
}

// ============================================================
// MAIN EXPORT — Generate PDF based on role
// ============================================================
export function generatePDF({ role, reportData, user, period, from, to, lang = 'en' }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210; // page width
  const PH = 297; // page height
  const M = 14;   // margin
  const CW = PW - 2 * M; // content width
  let curY = M;

  const isHindi = lang === 'hi';
  const tLabel = (en, hi) => isHindi ? hi : en;

  // ── HEADER BANNER ──
  roundRect(doc, 0, 0, PW, 42, 0, COLORS.primary, null);
  // Accent stripe
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 38, PW, 4, 'F');

  // Logo area
  doc.setFillColor(255, 255, 255, 30);
  doc.circle(M + 10, 20, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.text('', M + 6, 23);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.white);
  doc.text(isHindi ? 'नगरसेवा' : 'NagarSeva', M + 26, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 240);
  const roleLabels = { admin: isHindi ? 'प्रशासक रिपोर्ट' : 'Administrator Report', supervisor: isHindi ? 'पर्यवेक्षक रिपोर्ट' : 'Supervisor Report', user: isHindi ? 'नागरिक शिकायत रिपोर्ट' : 'Citizen Complaint Report' };
  doc.text(roleLabels[role] || 'Complaint Report', M + 26, 25);

  // Right side — meta
  doc.setFontSize(8);
  doc.setTextColor(180, 210, 240);
  const periodLabel = getPeriodLabel(period, from, to);
  doc.text(`${isHindi ? 'अवधि' : 'Period'}: ${periodLabel}`, PW - M, 14, { align: 'right' });
  doc.text(`${isHindi ? 'बनाया गया' : 'Generated'}: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, PW - M, 20, { align: 'right' });
  if (user?.name) doc.text(`${isHindi ? 'नाम' : 'Name'}: ${user.name}`, PW - M, 26, { align: 'right' });
  if (user?.mobile) doc.text(`${isHindi ? 'मोबाइल' : 'Mobile'}: ${user.mobile}`, PW - M, 32, { align: 'right' });

  curY = 52;

  // ── SUMMARY STAT BOXES ──
  const { total = 0, byStatus = {}, byType = {}, byArea = [] } = reportData;
  const solved = byStatus.solved || 0;
  const pending = byStatus.pending || 0;
  const rejected = byStatus.rejected || 0;
  const assigned = byStatus.assigned || 0;
  const inProgress = byStatus['in-progress'] || 0;

  const boxW = (CW - 12) / 4;
  const boxH = 22;
  const statData = [
    { icon: '', value: total, label: tLabel('Total Complaints', 'कुल शिकायतें'), color: COLORS.primary },
    { icon: '', value: solved, label: tLabel('Resolved', 'हल की गई'), color: COLORS.success },
    { icon: '', value: pending + assigned + inProgress, label: tLabel('In Process', 'प्रक्रिया में'), color: COLORS.warning },
    { icon: '', value: rejected, label: tLabel('Rejected', 'अस्वीकृत'), color: COLORS.danger },
  ];
  statData.forEach((s, i) => {
    drawStatBox(doc, M + i * (boxW + 4), curY, boxW, boxH, s.icon, s.value, s.label, s.color);
  });
  curY += boxH + 8;

  // Resolution rate badge
  const rate = total > 0 ? ((solved / total) * 100).toFixed(1) : '0.0';
  roundRect(doc, M, curY, CW, 10, 2, [240, 253, 244], [22, 163, 74]);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...COLORS.success);
  doc.text(`${tLabel('Resolution Rate', 'समाधान दर')}: ${rate}%  |  ${tLabel('Total Processed', 'कुल प्रसंस्कृत')}: ${total}  |  ${tLabel('Pending Action', 'कार्रवाई बाकी')}: ${pending + assigned + inProgress}`, M + CW/2, curY + 7, { align: 'center' });
  curY += 16;

  // ── STATUS PILLS ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...COLORS.dark);
  doc.text(tLabel('Status Breakdown', 'स्थिति विवरण'), M, curY);
  curY += 5;
  drawStatusPills(doc, M, curY + 4, byStatus);
  curY += 16;

  // ── BAR CHARTS (side by side) ──
  const chartW = (CW - 6) / 2;
  const chartH = 52;

  // By Type chart
  const typeBarData = Object.entries(byType).map(([k, v]) => ({
    name: isHindi ? (TYPE_LABELS_HI[k] || k) : (TYPE_LABELS[k] || k),
    count: v,
    color: k === 'garbage' ? [245, 158, 11] : k === 'streetlight' ? [234, 179, 8] : k === 'water' ? [59, 130, 246] : [168, 85, 247],
  }));
  drawBarChart(doc, M, curY, chartW, chartH, typeBarData, tLabel('Complaints by Category', 'श्रेणी अनुसार शिकायतें'));

  // By Status chart
  const statusBarData = Object.entries(byStatus).filter(([,v]) => v > 0).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    count: v,
    color: STATUS_COLORS[k] || COLORS.muted,
  }));
  drawBarChart(doc, M + chartW + 6, curY, chartW, chartH, statusBarData, tLabel('Complaints by Status', 'स्थिति अनुसार शिकायतें'));
  curY += chartH + 10;

  // ── AREA-WISE TABLE ──
  if (byArea && byArea.length > 0) {
    // Check if need new page
    const tableH = 9 + byArea.length * 9 + 15;
    if (curY + tableH > PH - 20) { doc.addPage(); curY = M; }
    curY = drawAreaTable(doc, M, curY, CW, byArea, tLabel('Area-wise Complaint Analysis', 'क्षेत्रवार शिकायत विश्लेषण'));
  }

  // ── AREA VISUAL: Horizontal filled bars for top 5 areas ──
  if (byArea && byArea.length > 0) {
    if (curY + 50 > PH - 20) { doc.addPage(); curY = M; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...COLORS.dark);
    doc.text(tLabel('Top Areas — Complaint Load', 'शीर्ष क्षेत्र — शिकायत भार'), M, curY);
    curY += 5;
    const top5 = byArea.slice(0, 5);
    const maxT = top5[0]?.total || 1;
    top5.forEach((row, i) => {
      const barMaxW = CW - 50;
      const filledW = (row.total / maxT) * barMaxW;
      const solvedW = row.total > 0 ? (row.solved / row.total) * filledW : 0;
      // BG bar
      roundRect(doc, M + 45, curY, barMaxW, 7, 2, [240,244,248], null);
      // Solved portion
      if (solvedW > 0) { doc.setFillColor(...COLORS.success); doc.roundedRect(M + 45, curY, solvedW, 7, 2, 2, 'F'); }
      // Pending portion
      const pendingW = filledW - solvedW;
      if (pendingW > 0) { doc.setFillColor(...COLORS.warning); doc.rect(M + 45 + solvedW, curY, pendingW, 7, 'F'); }
      // Label
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...COLORS.dark);
      const al = row.area.length > 20 ? row.area.substring(0,20)+'..' : row.area;
      doc.text(`${i+1}. ${al}`, M, curY + 5.5);
      // Value
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.primary);
      doc.text(String(row.total), M + 45 + barMaxW + 3, curY + 5.5);
      curY += 10;
    });
    // Legend
    doc.setFontSize(7);
    [COLORS.success, COLORS.warning].forEach((c, i) => {
      doc.setFillColor(...c); doc.rect(M + i * 45, curY, 5, 4, 'F');
      doc.setTextColor(...COLORS.muted); doc.setFont('helvetica', 'normal');
      doc.text(i === 0 ? tLabel('Solved', 'हल') : tLabel('Pending/Others', 'बाकी'), M + 7 + i * 45, curY + 3.5);
    });
    curY += 10;
  }

  // ── FOOTER ──
  const footerY = PH - 14;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, footerY - 2, PW, 16, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(180, 210, 240);
  doc.text('NagarSeva — Civic Complaint Management System', M, footerY + 5);
  doc.text(`Page 1  |  ${new Date().toLocaleDateString('en-IN')}`, PW - M, footerY + 5, { align: 'right' });
  doc.setTextColor(...COLORS.accent);
  doc.text('Confidential — For Official Use Only', PW/2, footerY + 5, { align: 'center' });

  // Save
  const roleStr = role === 'admin' ? 'Admin' : role === 'supervisor' ? 'Supervisor' : 'Citizen';
  const fileName = `NagarSeva_${roleStr}_Report_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}
