'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import { OwnerReportPDF } from '@/components/pdf/OwnerReportPDF';
import type { BrandSettings, ReportSummary } from '@/types/report';

type DownloadStatementProps = {
  brand: BrandSettings;
  summary: ReportSummary;
  notes: string;
};

export function DownloadStatement({ brand, summary, notes }: DownloadStatementProps) {
  return (
    <PDFDownloadLink
      document={<OwnerReportPDF brand={brand} summary={summary} notes={notes} />}
      fileName={statementFileName(brand)}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1E40AF] sm:w-auto"
    >
      {({ loading }) => (
        <>
          <Download className="size-4" aria-hidden="true" />
          {loading ? 'Preparing PDF…' : 'Download PDF'}
        </>
      )}
    </PDFDownloadLink>
  );
}

function statementFileName(brand: BrandSettings): string {
  const company = brand.companyName.trim() || 'owner-statement';
  const period = brand.reportPeriod.trim();
  const base = [company, period].filter(Boolean).join(' ');
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'owner-statement'}.pdf`;
}
