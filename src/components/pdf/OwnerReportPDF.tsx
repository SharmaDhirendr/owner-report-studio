import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { BrandSettings, RawTransaction, ReportSummary } from '@/types/report';

type OwnerReportPDFProps = {
  brand: BrandSettings;
  summary: ReportSummary;
  notes: string;
};

type CategoryGroup = {
  category: string;
  rows: RawTransaction[];
  total: number;
};

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const NEGATIVE_COLOR = '#DC2626';

const SECTIONS: { type: RawTransaction['type']; title: string; totalLabel: string }[] = [
  { type: 'Opening', title: 'Opening balance', totalLabel: 'Beginning cash' },
  { type: 'Income', title: 'Income', totalLabel: 'Total income' },
  { type: 'Expense', title: 'Expenses', totalLabel: 'Total expenses' },
  { type: 'Contribution', title: 'Owner Contributions', totalLabel: 'Total contributions' },
  { type: 'Distribution', title: 'Distributions', totalLabel: 'Total distributed' },
];

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 52,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#18181B',
  },
  ledgerPage: {
    paddingTop: 50,
    paddingHorizontal: 40,
    paddingBottom: 46,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#18181B',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: 10,
    objectFit: 'contain',
  },
  company: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    marginBottom: 2,
  },
  owner: {
    fontSize: 9,
    color: '#52525B',
  },
  titleBlock: {
    alignItems: 'flex-end',
  },
  statement: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 3,
  },
  period: {
    fontSize: 9,
    color: '#52525B',
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 4,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  kpiCardLast: {
    marginRight: 0,
  },
  kpiRule: {
    height: 2,
    borderRadius: 1,
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 7,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: 'Courier-Bold',
    fontSize: 11,
  },
  notesLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#3F3F46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  notesBox: {
    backgroundColor: '#F4F4F5',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  notesText: {
    fontSize: 9,
    lineHeight: 1.45,
    color: '#27272A',
  },
  notesEmpty: {
    fontSize: 9,
    lineHeight: 1.45,
    color: '#71717A',
    fontStyle: 'italic',
  },
  sectionHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  headerCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#52525B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E4E7',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  cell: {
    fontSize: 8,
    color: '#27272A',
  },
  propertyName: {
    flex: 1,
    paddingRight: 8,
  },
  moneyCol: {
    width: 78,
    textAlign: 'right',
    fontFamily: 'Courier',
  },
  moneyHeader: {
    width: 78,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  totalLabel: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  boldMoney: {
    width: 78,
    textAlign: 'right',
    fontFamily: 'Courier-Bold',
    fontSize: 8,
  },
  emptyRow: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    color: '#71717A',
    fontSize: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 18,
  },
  expensePanel: {
    flex: 1.45,
    marginRight: 14,
  },
  cashPanel: {
    flex: 1,
  },
  barRow: {
    marginBottom: 9,
  },
  barMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 3,
  },
  barName: {
    flex: 1,
    fontSize: 8,
    color: '#27272A',
    paddingRight: 8,
  },
  barFigures: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#3F3F46',
  },
  barTrack: {
    height: 7,
    backgroundColor: '#E4E4E7',
    borderRadius: 4,
  },
  barFill: {
    height: 7,
    borderRadius: 4,
  },
  cashBox: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cashLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cashLabel: {
    fontSize: 8,
    color: '#3F3F46',
    paddingRight: 8,
  },
  cashAmount: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#18181B',
  },
  cashDivider: {
    borderTopWidth: 0.75,
    borderTopColor: '#D4D4D8',
    marginTop: 2,
    marginBottom: 6,
  },
  cashTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#18181B',
  },
  cashTotalAmount: {
    fontFamily: 'Courier-Bold',
    fontSize: 9,
    color: '#18181B',
  },
  cashNote: {
    marginTop: 8,
    fontSize: 7,
    lineHeight: 1.35,
    color: '#71717A',
  },
  ledgerHeader: {
    position: 'absolute',
    top: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E4E7',
    paddingBottom: 6,
  },
  ledgerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  ledgerMeta: {
    fontSize: 8,
    color: '#52525B',
  },
  ledgerSection: {
    marginBottom: 8,
  },
  ledgerSectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 6,
  },
  dateCol: {
    width: 68,
  },
  propertyCol: {
    width: 108,
    paddingRight: 6,
  },
  categoryCol: {
    width: 96,
    paddingRight: 6,
  },
  descriptionCol: {
    flex: 1,
    paddingRight: 8,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E4E7',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  subtotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  sectionTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
  },
  sectionTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  sectionTotalAmount: {
    fontFamily: 'Courier-Bold',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: '#E4E4E7',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#71717A',
  },
});

export function OwnerReportPDF({ brand, summary, notes }: OwnerReportPDFProps) {
  const accent = normalizeColor(brand.primaryColor);
  const logo = brand.logoBase64?.trim() ? brand.logoBase64 : null;
  const note = notes.trim();
  const expenseCategories = summary.expensesByCategory.slice(0, 6);
  const largestExpense = expenseCategories.reduce((max, item) => Math.max(max, item.amount), 0);
  const hasOpeningBalance = summary.openingBalance !== undefined;
  const beginningCash = summary.openingBalance ?? 0;
  const contributions = summary.totalContributions ?? 0;
  const endingCash =
    Math.round(
      (beginningCash + summary.netOperatingIncome + contributions - summary.totalDistributed) * 100,
    ) / 100;
  const kpis = [
    { label: 'Gross Income', value: summary.totalIncome },
    { label: 'Total Expenses', value: summary.totalExpenses },
    { label: 'Net Operating Income', value: summary.netOperatingIncome, emphasizeSign: true },
    { label: 'Cash Distributed', value: summary.totalDistributed },
  ];

  return (
    <Document
      title={`${brand.reportPeriod || 'Owner'} Statement`}
      author={brand.companyName}
      subject={`Monthly owner statement for ${brand.ownerName}`}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={[styles.accent, { backgroundColor: accent }]} fixed />
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            {logo ? <Image src={logo} style={styles.logo} /> : null}
            <View>
              <Text style={styles.company}>{brand.companyName || 'Owner statement'}</Text>
              <Text style={styles.owner}>{brand.ownerName || 'Owner'}</Text>
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={[styles.statement, { color: accent }]}>Monthly Owner Statement</Text>
            <Text style={styles.period}>{brand.reportPeriod}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          {kpis.map((kpi, index) => (
            <View
              key={kpi.label}
              style={index === kpis.length - 1 ? [styles.kpiCard, styles.kpiCardLast] : styles.kpiCard}
            >
              <View style={[styles.kpiRule, { backgroundColor: accent }]} />
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={[styles.kpiValue, amountStyle(kpi.value, kpi.emphasizeSign)]}>
                {formatAmount(kpi.value, kpi.emphasizeSign)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.notesLabel}>Manager’s notes</Text>
        <View style={styles.notesBox}>
          <Text style={note ? styles.notesText : styles.notesEmpty} hyphenationCallback={keepWholeWord}>
            {note || 'No manager notes were added for this period.'}
          </Text>
        </View>

        <View>
          <Text style={styles.sectionHeading}>Property summary</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.propertyName]}>Property</Text>
              <Text style={[styles.headerCell, styles.moneyHeader]}>Income</Text>
              <Text style={[styles.headerCell, styles.moneyHeader]}>Expenses</Text>
              <Text style={[styles.headerCell, styles.moneyHeader]}>NOI</Text>
            </View>
            {summary.byProperty.length === 0 ? (
              <Text style={styles.emptyRow}>No property activity in this period.</Text>
            ) : (
              summary.byProperty.map((property) => (
                <View key={property.property} style={styles.row} wrap={false}>
                  <Text style={[styles.cell, styles.propertyName]}>{property.property}</Text>
                  <Text style={[styles.cell, styles.moneyCol]}>{money.format(property.income)}</Text>
                  <Text style={[styles.cell, styles.moneyCol]}>{money.format(property.expenses)}</Text>
                  <Text style={[styles.cell, styles.moneyCol, amountStyle(property.noi, true)]}>
                {formatAmount(property.noi, true)}
              </Text>
                </View>
              ))
            )}
            <View style={styles.totalRow} wrap={false}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.boldMoney}>{money.format(summary.totalIncome)}</Text>
              <Text style={styles.boldMoney}>{money.format(summary.totalExpenses)}</Text>
              <Text style={[styles.boldMoney, amountStyle(summary.netOperatingIncome, true)]}>
            {formatAmount(summary.netOperatingIncome, true)}
          </Text>
          </View>
        </View>

        <View style={styles.insightRow}>
            <View style={styles.expensePanel}>
              <Text style={styles.sectionHeading}>Expense breakdown</Text>
              {expenseCategories.length === 0 ? (
                <Text style={styles.emptyRow}>No operating expenses this period.</Text>
              ) : (
                expenseCategories.map((item) => {
                  const width =
                    item.amount > 0 && largestExpense > 0
                      ? Math.max(4, Math.round((item.amount / largestExpense) * 100))
                      : 0;
                  return (
                    <View key={item.category} style={styles.barRow} wrap={false}>
                      <View style={styles.barMeta}>
                        <Text style={styles.barName}>{item.category}</Text>
                        <Text style={styles.barFigures}>
                          {money.format(item.amount)} · {item.percentage.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${width}%`, backgroundColor: accent }]} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.cashPanel}>
              <Text style={styles.sectionHeading}>Cash flow reconciliation</Text>
              <View style={styles.cashBox} wrap={false}>
                <View style={styles.cashLine}>
                  <Text style={styles.cashLabel}>Beginning Cash / Reserves</Text>
                  <Text style={[styles.cashAmount, amountStyle(beginningCash, true)]}>
                    {formatAmount(beginningCash, true)}
                  </Text>
                </View>
                <View style={styles.cashLine}>
                  <Text style={styles.cashLabel}>Net Operating Income</Text>
                  <Text style={[styles.cashAmount, amountStyle(summary.netOperatingIncome, true)]}>
                    {signedAmount(summary.netOperatingIncome, '+')}
                  </Text>
                </View>
                {contributions !== 0 ? (
                  <View style={styles.cashLine}>
                    <Text style={styles.cashLabel}>Owner Contributions</Text>
                    <Text style={[styles.cashAmount, amountStyle(contributions, true)]}>
                      {signedAmount(contributions, '+')}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.cashLine}>
                  <Text style={styles.cashLabel}>Cash Distributed</Text>
                  <Text style={styles.cashAmount}>− {money.format(summary.totalDistributed)}</Text>
                </View>
                <View style={styles.cashDivider} />
                <View style={[styles.cashLine, { marginBottom: 0 }]}>
                  <Text style={styles.cashTotalLabel}>Ending Cash Retained</Text>
                  <Text style={[styles.cashTotalAmount, amountStyle(endingCash, true, accent)]}>
                    {formatAmount(endingCash, true)}
                  </Text>
                </View>
                {hasOpeningBalance ? null : (
                  <Text style={styles.cashNote}>
                    Opening balance was not in this export, so reserves start at $0.00.
                  </Text>
                )}
              </View>
            </View>
          </View>
        <Footer brand={brand} />
      </Page>

      <Page size="LETTER" style={styles.ledgerPage}>
        <View style={[styles.accent, { backgroundColor: accent }]} fixed />
        <View style={styles.ledgerHeader} fixed>
          <Text style={[styles.ledgerTitle, { color: accent }]}>Itemized ledger</Text>
          <Text style={styles.ledgerMeta}>
            {brand.companyName} · {brand.reportPeriod}
          </Text>
        </View>

        {SECTIONS.map((section) => {
          const groups = categoryGroups(summary.transactions, section.type);
          if (groups.length === 0) return null;
          const sectionTotal = sumAmounts(groups.flatMap((group) => group.rows));
          return (
            <View key={section.type} style={styles.ledgerSection}>
              <Text style={[styles.ledgerSectionTitle, { color: accent }]}>{section.title}</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
                <Text style={[styles.headerCell, styles.propertyCol]}>Property</Text>
                <Text style={[styles.headerCell, styles.categoryCol]}>Category</Text>
                <Text style={[styles.headerCell, styles.descriptionCol]}>Description</Text>
                <Text style={[styles.headerCell, styles.moneyHeader]}>Amount</Text>
              </View>
              {groups.map((group) => (
                <View key={group.category}>
                  {group.rows.map((transaction, index) => (
                    <View
                      key={`${transaction.date}-${transaction.property}-${transaction.description}-${index}`}
                      style={styles.row}
                      wrap={false}
                    >
                      <Text style={[styles.cell, styles.dateCol]}>{formatDate(transaction.date)}</Text>
                      <Text style={[styles.cell, styles.propertyCol]}>{transaction.property}</Text>
                      <Text style={[styles.cell, styles.categoryCol]}>{transaction.category}</Text>
                      <Text style={[styles.cell, styles.descriptionCol]} hyphenationCallback={keepWholeWord}>
                        {transaction.description}
                      </Text>
                      <Text style={[styles.cell, styles.moneyCol, amountStyle(transaction.amount, true)]}>
                        {formatAmount(transaction.amount, true)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.subtotalRow} wrap={false}>
                    <Text style={styles.subtotalLabel}>{group.category} subtotal</Text>
                    <Text style={[styles.boldMoney, amountStyle(group.total, true)]}>
                      {formatAmount(group.total, true)}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={styles.sectionTotal} wrap={false}>
                <Text style={styles.sectionTotalLabel}>{section.totalLabel}</Text>
                <Text style={[styles.sectionTotalAmount, amountStyle(sectionTotal, true)]}>
                  {formatAmount(sectionTotal, true)}
                </Text>
              </View>
            </View>
          );
        })}
        <Footer brand={brand} />
      </Page>
    </Document>
  );
}

function Footer({ brand }: { brand: BrandSettings }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{brand.companyName} · Monthly Owner Statement</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function categoryGroups(transactions: RawTransaction[], type: RawTransaction['type']): CategoryGroup[] {
  const buckets = new Map<string, RawTransaction[]>();
  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    const category = transaction.category.trim() || 'Uncategorized';
    const rows = buckets.get(category) ?? [];
    rows.push(transaction);
    buckets.set(category, rows);
  }

  return Array.from(buckets, ([category, rows]) => {
    const sorted = [...rows].sort(
      (a, b) => a.date.localeCompare(b.date) || a.property.localeCompare(b.property),
    );
    return { category, rows: sorted, total: sumAmounts(sorted) };
  }).sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
}

function sumAmounts(rows: RawTransaction[]): number {
  return Math.round(rows.reduce((sum, row) => sum + row.amount, 0) * 100) / 100;
}

function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatAmount(value: number, showSign = false): string {
  if (showSign && value < 0) return `(${money.format(Math.abs(value))})`;
  return money.format(value);
}

function signedAmount(value: number, sign: '+' | '−'): string {
  if (value < 0) return formatAmount(value, true);
  return `${sign} ${money.format(value)}`;
}

function amountStyle(value: number, showSign = false, positiveColor?: string) {
  if (showSign && value < 0) return { color: NEGATIVE_COLOR };
  return positiveColor ? { color: positiveColor } : {};
}

function normalizeColor(value: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim()) ? value.trim() : '#1E3A8A';
}

function keepWholeWord(word: string): string[] {
  return [word];
}
