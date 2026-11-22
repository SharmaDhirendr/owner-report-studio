'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Step1BrandSetup } from '@/components/Step1BrandSetup';
import { Step2UploadMap } from '@/components/Step2UploadMap';
import { Step3ManagerNotes } from '@/components/Step3ManagerNotes';
import { calculateReportSummary } from '@/lib/calculator';
import { sampleTransactions } from '@/lib/sampleData';
import type { BrandSettings, RawTransaction, ReportSummary } from '@/types/report';

const DownloadStatement = dynamic(
  () => import('@/components/pdf/DownloadStatement').then((mod) => mod.DownloadStatement),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex items-center rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white">
        Preparing PDF…
      </span>
    ),
  },
);

type WizardStep = 1 | 2 | 3 | 4;

const STORAGE_KEY = 'owner-report-brand';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: 'Brand' },
  { id: 2, label: 'Upload' },
  { id: 3, label: 'Notes' },
  { id: 4, label: 'Download' },
];

const emptyBrand: BrandSettings = {
  companyName: '',
  logoBase64: null,
  primaryColor: '#1E3A8A',
  reportPeriod: '',
  ownerName: '',
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [brand, setBrand] = useState<BrandSettings>(emptyBrand);
  const [transactions, setTransactions] = useState<RawTransaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const stored = readStoredBrand();
    if (stored) setBrand(stored);
  }, []);

  function handleTransactions(nextTransactions: RawTransaction[]) {
    setTransactions(nextTransactions);
    setSummary(calculateReportSummary(nextTransactions));
  }

  function loadSampleReport() {
    const sampleSummary = calculateReportSummary(sampleTransactions);
    setTransactions(sampleTransactions);
    setSummary(sampleSummary);
    setNotes(
      (current) =>
        current ||
        `Operations were steady in ${brand.reportPeriod || 'October 2026'}. The portfolio collected ${money.format(sampleSummary.totalIncome)} in gross income, with net operating income of ${money.format(sampleSummary.netOperatingIncome)}.`,
    );
    setBrand((current) => {
      const primaryColor = current.primaryColor.trim() || '#1E3A8A';
      const next = {
        ...current,
        companyName: current.companyName.trim() || 'Northshore Property Group',
        ownerName: current.ownerName.trim() || 'Harborview Holdings',
        reportPeriod: current.reportPeriod.trim() || 'October 2026',
        primaryColor,
        logoBase64: current.logoBase64?.trim() ? current.logoBase64 : createPlaceholderLogo(primaryColor),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The in-memory brand still includes the demo logo for this download.
      }
      return next;
    });
    setCurrentStep(4);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl dark:text-zinc-50">
          Turn AppFolio & Buildium exports into branded owner reports
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-pretty text-zinc-600 dark:text-zinc-400">
          Upload your CSV or Excel export, add your branding, and download a clean PDF owner
          statement in under 2 minutes.
        </p>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Your data stays in your browser. Nothing is uploaded to a server.
        </p>
      </header>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <ol className="flex flex-wrap gap-2">
            {STEPS.map((step) => {
              const active = step.id === currentStep;
              const complete = step.id < currentStep;
              return (
                <li
                  key={step.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                    active
                      ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                      : complete
                        ? 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500'
                  }`}
                >
                  <span>{step.id}</span>
                  {step.label}
                </li>
              );
            })}
          </ol>
        </div>
        {currentStep < 4 ? (
          <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:w-72 dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Try example</p>
              <span className="rounded-full bg-[#1E3A8A]/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-[#1E3A8A] uppercase dark:bg-[#1E3A8A]/30 dark:text-[#BFDBFE]">
                Demo
              </span>
            </div>
            <button
              type="button"
              onClick={loadSampleReport}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#1E3A8A]/20 bg-[#1E3A8A]/10 px-3 py-2 text-sm font-medium text-[#1E3A8A] transition hover:bg-[#1E3A8A]/15 dark:border-[#93C5FD]/20 dark:bg-[#1E3A8A]/35 dark:text-[#DBEAFE] dark:hover:bg-[#1E3A8A]/50"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-[#1E3A8A]/15 dark:bg-white/10">
                <FileSpreadsheet className="size-3.5" aria-hidden="true" />
              </span>
              Load sample data
            </button>
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              See a finished example report instantly
              <span className="block text-zinc-400 dark:text-zinc-500">(uses sample data)</span>
            </p>
          </div>
        ) : null}
      </div>

      {currentStep === 1 ? (
        <>
          <Step1BrandSetup settings={brand} onChange={setBrand} />
          <div className="mx-auto mt-5 flex w-full max-w-lg justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1E40AF]"
            >
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : null}

      {currentStep === 2 ? (
        <Step2UploadMap
          onDataReady={handleTransactions}
          onBack={() => setCurrentStep(1)}
          onContinue={() => setCurrentStep(3)}
        />
      ) : null}

      {currentStep === 3 && summary ? (
        <Step3ManagerNotes
          summary={summary}
          notes={notes}
          onNotesChange={setNotes}
          onBack={() => setCurrentStep(2)}
          onContinue={() => setCurrentStep(4)}
        />
      ) : null}

      {currentStep === 4 && summary ? (
        <Step4Preview
          brand={brand}
          summary={summary}
          notes={notes}
          onBack={() => setCurrentStep(3)}
        />
      ) : null}
    </main>
  );
}

function Step4Preview({
  brand,
  summary,
  notes,
  onBack,
}: {
  brand: BrandSettings;
  summary: ReportSummary;
  notes: string;
  onBack: () => void;
}) {
  const figures = [
    { label: 'Gross Income', value: money.format(summary.totalIncome) },
    { label: 'Total Expenses', value: money.format(summary.totalExpenses) },
    { label: 'Net Operating Income', value: money.format(summary.netOperatingIncome) },
    { label: 'Cash Distributed', value: money.format(summary.totalDistributed) },
  ];

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Preview and download
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {brand.companyName} · {brand.ownerName} · {brand.reportPeriod}
        </p>
      </header>

      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-3">
          {figures.map((figure) => (
            <div
              key={figure.label}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">{figure.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{figure.value}</dd>
            </div>
          ))}
        </dl>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Manager’s notes</h3>
          <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
            {notes.trim() || 'No manager notes were added for this period.'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Properties</h3>
          <ul className="mt-3 divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {summary.byProperty.map((property) => (
              <li key={property.property} className="flex items-center justify-between gap-3 py-2">
                <span className="text-zinc-800 dark:text-zinc-200">{property.property}</span>
                <span className="font-medium text-zinc-950 dark:text-zinc-50">
                  {money.format(property.noi)} NOI
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Back
          </button>
          <DownloadStatement brand={brand} summary={summary} notes={notes} />
        </div>
      </div>
    </section>
  );
}

function createPlaceholderLogo(color: string): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const fill = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#1E3A8A';
  context.fillStyle = fill;
  roundedRect(context, 0, 0, 128, 128, 28);
  context.fill();

  context.fillStyle = '#FFFFFF';
  for (const bar of [
    { x: 26, height: 36 },
    { x: 50, height: 58 },
    { x: 74, height: 44 },
  ]) {
    roundedRect(context, bar.x, 92 - bar.height, 18, bar.height, 4);
    context.fill();
  }

  return canvas.toDataURL('image/png');
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function readStoredBrand(): BrandSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.companyName !== 'string' ||
      (typeof record.logoBase64 !== 'string' && record.logoBase64 !== null) ||
      typeof record.primaryColor !== 'string' ||
      typeof record.reportPeriod !== 'string' ||
      typeof record.ownerName !== 'string'
    ) {
      return null;
    }
    return {
      companyName: record.companyName,
      logoBase64: record.logoBase64,
      primaryColor: record.primaryColor || '#1E3A8A',
      reportPeriod: record.reportPeriod,
      ownerName: record.ownerName,
    };
  } catch {
    return null;
  }
}
