import jsPDF from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import type { WorkforceInsights } from "../types/dashboard";
import { formatAedAmount } from "./currency";

const COLORS = {
  navy: [15, 23, 42] as [number, number, number],
  navyMid: [30, 41, 59] as [number, number, number],
  accent: [234, 88, 12] as [number, number, number],
  accentSoft: [255, 247, 237] as [number, number, number],
  brand: [37, 99, 235] as [number, number, number],
  brandSoft: [239, 246, 255] as [number, number, number],
  violet: [124, 58, 237] as [number, number, number],
  violetSoft: [245, 243, 255] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  amberSoft: [255, 251, 235] as [number, number, number],
  slate: [100, 116, 139] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  surface: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
};

const MARGIN_X = 14;
const PAGE_TOP = 18;
const PAGE_BOTTOM = 16;
const HEADER_HEIGHT = 48;
const ROW_H = 7;
const HEAD_H = 8;
const TITLE_H = 14;

export type InsightsPdfOptions = {
  data: WorkforceInsights;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  variant: "headcount" | "hours";
};

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

function formatCount(value: number): string {
  return (Number(value) || 0).toLocaleString("en-US");
}

function formatHours(value: number): string {
  const amount = Number(value) || 0;
  const isWhole = Number.isInteger(amount);
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

function formatDisplayDate(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}-${month}-${year}`;
}

function ascii(text: string): string {
  return String(text || "")
    .replace(/[–—]/g, "-")
    .replace(/[•·∙]/g, "-")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadAdaaLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch("/images/logo/logo-icon.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function pageBottom(pdf: jsPDF): number {
  return pdf.internal.pageSize.getHeight() - PAGE_BOTTOM;
}

function estimateTableHeight(rows: number): number {
  return HEAD_H + Math.max(rows, 1) * ROW_H;
}

function lastTableY(pdf: jsPDF, fallback: number): number {
  return (pdf as JsPdfWithAutoTable).lastAutoTable?.finalY ?? fallback;
}

function drawHeaderBand(
  pdf: jsPDF,
  periodLabel: string,
  periodStart: string,
  periodEnd: string,
  variant: "headcount" | "hours",
  logoDataUrl: string | null,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...COLORS.navy);
  pdf.rect(0, 0, pageWidth, HEADER_HEIGHT, "F");

  // Accent stripe
  pdf.setFillColor(...COLORS.accent);
  pdf.rect(0, HEADER_HEIGHT - 2.2, pageWidth, 2.2, "F");

  // Soft highlight on left
  pdf.setFillColor(...COLORS.navyMid);
  pdf.rect(0, 0, 4, HEADER_HEIGHT, "F");

  const textLeft = logoDataUrl ? 34 : MARGIN_X;

  if (logoDataUrl) {
    try {
      pdf.setFillColor(...COLORS.white);
      pdf.roundedRect(MARGIN_X, 12, 16, 16, 3, 3, "F");
      pdf.addImage(logoDataUrl, "PNG", MARGIN_X + 2, 14, 12, 12);
    } catch {
      // ignore logo failures
    }
  }

  pdf.setTextColor(...COLORS.white);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("ADAA Employment LLC", textLeft, 18);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(203, 213, 225);
  pdf.text("Workforce Insights Report", textLeft, 26);

  pdf.setFontSize(7.5);
  pdf.text(`Generated ${ascii(new Date().toLocaleString("en-GB"))}`, textLeft, 40);

  // Period card on the right - constrained so it never overflows
  const cardW = 58;
  const cardX = pageWidth - MARGIN_X - cardW;
  pdf.setFillColor(51, 65, 85);
  pdf.roundedRect(cardX, 10, cardW, 28, 2.5, 2.5, "F");

  const period = ascii(periodLabel);
  const range = `${formatDisplayDate(periodStart)} to ${formatDisplayDate(periodEnd)}`;
  const focus = variant === "hours" ? "Focus: Hours" : "Focus: Headcount";

  pdf.setTextColor(...COLORS.white);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(period, cardX + cardW / 2, 19, {
    align: "center",
    maxWidth: cardW - 6,
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(226, 232, 240);
  pdf.text(range, cardX + cardW / 2, 26, {
    align: "center",
    maxWidth: cardW - 6,
  });
  pdf.text(focus, cardX + cardW / 2, 33, {
    align: "center",
    maxWidth: cardW - 6,
  });
}

function drawSectionHeading(
  pdf: jsPDF,
  title: string,
  y: number,
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(...COLORS.brandSoft);
  pdf.roundedRect(MARGIN_X, y, pageWidth - MARGIN_X * 2, 10, 2, 2, "F");
  pdf.setFillColor(...COLORS.accent);
  pdf.roundedRect(MARGIN_X, y, 2.4, 10, 1, 1, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.navy);
  pdf.text(ascii(title), MARGIN_X + 7, y + 6.5);
  return y + TITLE_H;
}

function drawKpiCards(
  pdf: jsPDF,
  y: number,
  cards: Array<{
    label: string;
    value: string;
    subtitle: string;
    accent: [number, number, number];
    soft: [number, number, number];
  }>,
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const gap = 3.5;
  const cardWidth =
    (pageWidth - MARGIN_X * 2 - gap * (cards.length - 1)) / cards.length;
  const cardHeight = 30;

  if (y + cardHeight > pageBottom(pdf)) {
    pdf.addPage();
    y = PAGE_TOP;
  }

  cards.forEach((card, index) => {
    const x = MARGIN_X + index * (cardWidth + gap);
    pdf.setFillColor(...card.soft);
    pdf.setDrawColor(...COLORS.line);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, "FD");

    pdf.setFillColor(...card.accent);
    pdf.circle(x + 5, y + 6.5, 1.3, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(ascii(card.label).toUpperCase(), x + 9, y + 7.5, {
      maxWidth: cardWidth - 12,
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...COLORS.text);
    pdf.text(ascii(card.value), x + 5, y + 17, {
      maxWidth: cardWidth - 10,
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.8);
    pdf.setTextColor(...COLORS.slate);
    pdf.text(ascii(card.subtitle), x + 5, y + 24, {
      maxWidth: cardWidth - 10,
    });
  });

  return y + cardHeight + 10;
}

function drawFatBars(
  pdf: jsPDF,
  y: number,
  adaa: number,
  client: number,
  adaaHours: number,
  clientHours: number,
  focusHours: boolean,
): number {
  const totalPeople = adaa + client;
  const totalHrs = adaaHours + clientHours;
  const rows = [
    {
      label: "ADAA Client FAT",
      count: adaa,
      hours: adaaHours,
      color: COLORS.brand,
      soft: COLORS.brandSoft,
      share: focusHours
        ? totalHrs
          ? (adaaHours / totalHrs) * 100
          : 0
        : totalPeople
          ? (adaa / totalPeople) * 100
          : 0,
    },
    {
      label: "Client FAT",
      count: client,
      hours: clientHours,
      color: COLORS.violet,
      soft: COLORS.violetSoft,
      share: focusHours
        ? totalHrs
          ? (clientHours / totalHrs) * 100
          : 0
        : totalPeople
          ? (client / totalPeople) * 100
          : 0,
    },
  ];

  const blockH = TITLE_H + 48;
  if (y + blockH > pageBottom(pdf)) {
    pdf.addPage();
    y = PAGE_TOP;
  }

  y = drawSectionHeading(pdf, "FAT Mix", y);
  const barX = MARGIN_X;
  const barWidth = pdf.internal.pageSize.getWidth() - MARGIN_X * 2;

  rows.forEach((row) => {
    pdf.setFillColor(...row.soft);
    pdf.roundedRect(barX, y - 1, barWidth, 16, 2, 2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.text);
    pdf.text(row.label, barX + 4, y + 4.5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...COLORS.muted);
    const meta = `${formatCount(row.count)} people | ${formatHours(row.hours)} hrs | ${formatPercent(row.share)}`;
    pdf.text(meta, barX + barWidth - 4, y + 4.5, { align: "right" });

    pdf.setFillColor(...COLORS.line);
    pdf.roundedRect(barX + 4, y + 8, barWidth - 8, 3.8, 1.2, 1.2, "F");
    const fill = Math.max(0, Math.min(barWidth - 8, ((barWidth - 8) * row.share) / 100));
    if (fill > 0) {
      pdf.setFillColor(...row.color);
      pdf.roundedRect(barX + 4, y + 8, fill, 3.8, 1.2, 1.2, "F");
    }
    y += 19;
  });

  pdf.setFillColor(...COLORS.navy);
  pdf.roundedRect(barX, y, barWidth, 11, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...COLORS.white);
  pdf.text("Total (unique active)", barX + 5, y + 7);
  pdf.text(
    `${formatCount(totalPeople)} people | ${formatHours(totalHrs)} hrs`,
    barX + barWidth - 5,
    y + 7,
    { align: "right" },
  );

  return y + 18;
}

function tableBaseOptions(sectionTitle: string): Partial<UserOptions> {
  return {
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 2.2, right: 2.2, bottom: 2.2, left: 2.2 },
      textColor: COLORS.text,
      lineColor: COLORS.line,
      lineWidth: 0.15,
      valign: "middle",
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    headStyles: {
      fillColor: COLORS.navy,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 2.6, right: 2.2, bottom: 2.6, left: 2.2 },
    },
    alternateRowStyles: {
      fillColor: COLORS.surface,
    },
    margin: {
      left: MARGIN_X,
      right: MARGIN_X,
      top: PAGE_TOP + TITLE_H,
      bottom: PAGE_BOTTOM,
    },
    pageBreak: "auto",
    rowPageBreak: "avoid",
    showHead: "everyPage",
    // Only redraw heading on continuation pages (never over the cover header)
    didDrawPage: (hook) => {
      if (hook.pageNumber <= 1) return;
      drawSectionHeading(pdfFromHook(hook.doc), sectionTitle, PAGE_TOP);
    },
  };
}

function pdfFromHook(doc: unknown): jsPDF {
  return doc as jsPDF;
}

/**
 * Ensures heading + table start together. If the whole block fits on one page
 * but not in the remaining space, move to the next page first.
 * Heading is drawn here for the first page; didDrawPage redraws it only on
 * later pages so it never overlays the cover header.
 */
function renderSectionTable(
  pdf: jsPDF,
  y: number,
  title: string,
  options: UserOptions,
  bodyRowCount: number,
): number {
  const tableH = estimateTableHeight(bodyRowCount);
  const blockH = TITLE_H + tableH + 2;
  const usable = pageBottom(pdf) - PAGE_TOP;
  const fitsOnePage = blockH <= usable;
  const remaining = pageBottom(pdf) - y;

  if (fitsOnePage) {
    if (remaining < blockH) {
      pdf.addPage();
      y = PAGE_TOP;
    }
  } else if (remaining < TITLE_H + HEAD_H + ROW_H * 4) {
    pdf.addPage();
    y = PAGE_TOP;
  }

  y = drawSectionHeading(pdf, title, y);

  autoTable(pdf, {
    ...tableBaseOptions(title),
    ...options,
    startY: y,
  });

  return lastTableY(pdf, y) + 10;
}

function drawLogoWatermark(pdf: jsPDF, logoDataUrl: string | null) {
  if (!logoDataUrl) return;

  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const size = 95;
  const x = (pageWidth - size) / 2;
  const y = (pageHeight - size) / 2;

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    try {
      pdf.saveGraphicsState();
      pdf.setGState(new pdf.GState({ opacity: 0.08 }));
      pdf.addImage(logoDataUrl, "PNG", x, y, size, size);
      pdf.restoreGraphicsState();
    } catch {
      // Skip watermark if graphics state / image fails on this page
    }
  }
}

function addFooters(pdf: jsPDF) {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(...COLORS.line);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_X, pageHeight - 11, pageWidth - MARGIN_X, pageHeight - 11);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.muted);
    pdf.text("ADAA Employment LLC  |  Confidential", MARGIN_X, pageHeight - 6.5);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN_X, pageHeight - 6.5, {
      align: "right",
    });
  }
}

export async function downloadInsightsPdfReport(
  options: InsightsPdfOptions,
): Promise<void> {
  const { data, periodLabel, periodStart, periodEnd, variant } = options;
  const focusHours = variant === "hours";
  const pdf = new jsPDF("p", "mm", "a4");
  const logoDataUrl = await loadAdaaLogoDataUrl();

  drawHeaderBand(
    pdf,
    periodLabel,
    periodStart,
    periodEnd,
    variant,
    logoDataUrl,
  );

  let y = HEADER_HEIGHT + 8;
  const adaa = data.fatTotals?.adaa ?? 0;
  const client = data.fatTotals?.client ?? 0;
  const adaaHours = data.fatTotals?.adaaHours ?? 0;
  const clientHours = data.fatTotals?.clientHours ?? 0;
  const total = data.total ?? 0;
  const totalHours = data.totalHours ?? 0;
  const idleCount = data.idleTotals?.count ?? 0;
  const idleHours = data.idleTotals?.hours ?? 0;

  y = drawKpiCards(pdf, y, [
    {
      label: focusHours ? "Total hours" : "Active people",
      value: focusHours ? formatHours(totalHours) : formatCount(total),
      subtitle: focusHours
        ? `${formatCount(total)} unique active`
        : `${formatHours(totalHours)} hrs`,
      accent: COLORS.brand,
      soft: COLORS.brandSoft,
    },
    {
      label: "ADAA FAT",
      value: focusHours ? formatHours(adaaHours) : formatCount(adaa),
      subtitle: focusHours
        ? `${formatCount(adaa)} people`
        : `${formatHours(adaaHours)} hrs`,
      accent: COLORS.navyMid,
      soft: COLORS.surface,
    },
    {
      label: "Client FAT",
      value: focusHours ? formatHours(clientHours) : formatCount(client),
      subtitle: focusHours
        ? `${formatCount(client)} people`
        : `${formatHours(clientHours)} hrs`,
      accent: COLORS.violet,
      soft: COLORS.violetSoft,
    },
    {
      label: focusHours ? "Idle hours" : "Idle people",
      value: focusHours ? formatHours(idleHours) : formatCount(idleCount),
      subtitle: focusHours
        ? `${formatCount(idleCount)} IDLE status`
        : `${formatHours(idleHours)} idle hrs`,
      accent: COLORS.amber,
      soft: COLORS.amberSoft,
    },
  ]);

  y = drawFatBars(pdf, y, adaa, client, adaaHours, clientHours, focusHours);

  const trades = [...(data.trades ?? [])].sort((a, b) =>
    focusHours
      ? b.hours - a.hours || a.label.localeCompare(b.label)
      : b.count - a.count || a.label.localeCompare(b.label),
  );
  const clients = [...(data.clients ?? [])].sort((a, b) =>
    focusHours
      ? b.hours - a.hours || a.label.localeCompare(b.label)
      : b.count - a.count || a.label.localeCompare(b.label),
  );

  y = renderSectionTable(
    pdf,
    y,
    "Workforce by Trade",
    {
      head: [["Trade", "Headcount", "Share", "Hours", "Hours share"]],
      body: trades.map((row) => [
        ascii(row.label),
        formatCount(row.count),
        formatPercent(row.percent),
        formatHours(row.hours),
        formatPercent(row.hoursPercent),
      ]),
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: "right", cellWidth: 28 },
        2: { halign: "right", cellWidth: 24 },
        3: {halign: "right", cellWidth: 28 },
        4: {halign: "right", cellWidth: 28 },
      },
    },
    trades.length,
  );

  y = renderSectionTable(
    pdf,
    y,
    "Workforce by Client",
    {
      head: [["Client", "Headcount", "Share", "Hours", "Hours share"]],
      body: clients.map((row) => [
        ascii(row.label),
        formatCount(row.count),
        formatPercent(row.percent),
        formatHours(row.hours),
        formatPercent(row.hoursPercent),
      ]),
      columnStyles: {
        0: { cellWidth: 70 },
        1: {halign: "right", cellWidth: 28 },
        2: {halign: "right", cellWidth: 24 },
        3: {halign: "right", cellWidth: 28 },
        4: {halign: "right", cellWidth: 28 },
      },
    },
    clients.length,
  );

  const clientsByFat = data.clientsByFat ?? [];
  y = renderSectionTable(
    pdf,
    y,
    "Clients by FAT",
    {
      head: [
        ["Client", "ADAA", "Client", "Total", "ADAA hrs", "Client hrs", "Total hrs"],
      ],
      body: [
        ...clientsByFat.map((row) => [
          ascii(row.client),
          formatCount(row.adaa),
          formatCount(row.clientFat),
          formatCount(row.total),
          formatHours(row.adaaHours),
          formatHours(row.clientHours),
          formatHours(row.totalHours),
        ]),
        [
          "Total (unique)",
          formatCount(adaa),
          formatCount(client),
          formatCount(total),
          formatHours(adaaHours),
          formatHours(clientHours),
          formatHours(totalHours),
        ],
      ],
      columnStyles: {
        0: { cellWidth: 46 },
        1: {halign: "right", cellWidth: 18 },
        2: {halign: "right", cellWidth: 18 },
        3: {halign: "right", cellWidth: 18 },
        4: {halign: "right", cellWidth: 22 },
        5: {halign: "right", cellWidth: 22 },
        6: {halign: "right", cellWidth: 22 },
      },
      didParseCell: (hookData) => {
        if (
          hookData.section === "body" &&
          hookData.row.index === clientsByFat.length
        ) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = COLORS.accentSoft;
        }
      },
    },
    clientsByFat.length + 1,
  );

  const idleRows = [...(data.idleByTrade ?? [])].filter(
    (row) => row.count > 0 || row.hours > 0,
  );
  if (idleRows.length === 0) {
    if (y + 24 > pageBottom(pdf)) {
      pdf.addPage();
      y = PAGE_TOP;
    }
    y = drawSectionHeading(pdf, "Idle by Trade (IDLE status)", y);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.muted);
    pdf.text("No IDLE-status employees in this period.", MARGIN_X, y);
    y += 10;
  } else {
    y = renderSectionTable(
      pdf,
      y,
      "Idle by Trade (IDLE status)",
      {
        head: [["Trade", "People", "Hours"]],
        body: [
          ...idleRows.map((row) => [
            ascii(row.trade),
            formatCount(row.count),
            formatHours(row.hours),
          ]),
          ["Idle total", formatCount(idleCount), formatHours(idleHours)],
        ],
        columnStyles: {
          0: { cellWidth: 100 },
          1: {halign: "right", cellWidth: 36 },
          2: {halign: "right", cellWidth: 36 },
        },
        didParseCell: (hookData) => {
          if (
            hookData.section === "body" &&
            hookData.row.index === idleRows.length
          ) {
            hookData.cell.styles.fontStyle = "bold";
            hookData.cell.styles.fillColor = COLORS.accentSoft;
          }
        },
      },
      idleRows.length + 1,
    );
  }

  const countries = [...(data.countries ?? [])].sort((a, b) =>
    focusHours
      ? b.hours - a.hours || a.country.localeCompare(b.country)
      : b.count - a.count || a.country.localeCompare(b.country),
  );
  if (countries.length > 0) {
    y = renderSectionTable(
      pdf,
      y,
      "Headcount by Country",
      {
        head: [["Country", "Headcount", "Share", "Hours", "Hours share"]],
        body: countries.map((row) => [
          ascii(row.country),
          formatCount(row.count),
          formatPercent(row.percent),
          formatHours(row.hours),
          formatPercent(row.hoursPercent),
        ]),
        columnStyles: {
          0: { cellWidth: 70 },
          1: {halign: "right", cellWidth: 28 },
          2: {halign: "right", cellWidth: 24 },
          3: {halign: "right", cellWidth: 28 },
          4: {halign: "right", cellWidth: 28 },
        },
      },
      countries.length,
    );
  }

  const payroll = data.monthlyPayroll ?? [];
  if (payroll.length > 0) {
    renderSectionTable(
      pdf,
      y,
      "Monthly ADAA Payroll",
      {
        head: [["Month", "Headcount", "Hours", "Gross payroll"]],
        body: payroll.map((row) => [
          ascii(row.label || row.month),
          formatCount(row.headcount),
          formatHours(row.hours),
          ascii(formatAedAmount(row.amount)),
        ]),
        columnStyles: {
          0: { cellWidth: 55 },
          1: {halign: "right", cellWidth: 35 },
          2: {halign: "right", cellWidth: 35 },
          3: {halign: "right", cellWidth: 53 },
        },
      },
      payroll.length,
    );
  }

  // Watermark behind content visually (drawn last at low opacity so pages stay readable)
  drawLogoWatermark(pdf, logoDataUrl);
  addFooters(pdf);

  const safePeriod = ascii(periodLabel).replace(/[^\w-]+/g, "_");
  pdf.save(`ADAA_Insights_${safePeriod || "Report"}.pdf`);
}
