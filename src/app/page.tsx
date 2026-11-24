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
const CONTACT_EMAIL = 'dhirusharma175@gmail.com';
const FEEDBACK_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Owner Report Feedback')}`;

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

  function startOver() {
    setTransactions([]);
    setSummary(null);
    setNotes('');
    setCurrentStep(1);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
      <div className="mb-6 flex justify-end">
        <a
          href={FEEDBACK_MAILTO}
          className="text-sm font-medium text-[#1E3A8A] underline-offset-2 hover:underline dark:text-[#93C5FD]"
        >
          Give feedback
        </a>
      </div>
      <header className="mb-10 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl text-center lg:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl dark:text-zinc-50">
            Turn AppFolio & Buildium exports into branded owner reports
          </h1>
          <p className="mt-3 text-base leading-7 text-pretty text-zinc-700 dark:text-zinc-200">
            Upload your CSV or Excel export, add your branding, and download a clean PDF owner
            statement in under 2 minutes.
          </p>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            Your data stays in your browser. Nothing is uploaded to a server.
          </p>
          {currentStep < 4 ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={loadSampleReport}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1E40AF]"
              >
                <FileSpreadsheet className="size-5" aria-hidden="true" />
                Load sample data
              </button>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                See a finished example report instantly (uses sample data)
              </p>
            </div>
          ) : null}
        </div>
        <ExampleReportPreview />
      </header>
      <div className="mb-8">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Step {currentStep} of 4: {STEPS.find((step) => step.id === currentStep)?.label}
        </p>
        <ol className="mt-3 flex flex-wrap gap-2">
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
                      ? 'border-zinc-300 bg-white text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100'
                      : 'border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300'
                }`}
              >
                <span>{step.id}</span>
                {step.label}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">
          Output: a branded PDF owner statement, ready to send.
        </p>
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={startOver}
            className="mt-3 text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-950 hover:underline dark:text-zinc-300 dark:hover:text-white"
          >
            Start over
          </button>
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
          onStartOver={startOver}
        />
      ) : null}
      <footer className="mt-16 border-t border-zinc-200 pt-6 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        Built by Dhirendra Sharma ·{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-[#1E3A8A] hover:underline dark:text-[#93C5FD]">
          {CONTACT_EMAIL}
        </a>
      </footer>
    </main>
  );
}

function ExampleReportPreview() {
  const figures = [
    ['Gross income', '$10,600'],
    ['Expenses', '$2,459'],
    ['NOI', '$8,141'],
    ['Distributed', '$7,150'],
  ];
  const properties = [
    ['Maple St Duplex', '$2,750'],
    ['Oak Ave 4-Plex', '$3,762'],
    ['Pine Rd Single Family', '$1,629'],
  ];

  return (
    <figure className="w-full max-w-56 shrink-0">
      <figcaption className="mb-2 text-center text-xs font-semibold tracking-[0.14em] text-zinc-700 uppercase dark:text-zinc-200">
        Example report
      </figcaption>
      <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white text-zinc-900 shadow-xl dark:border-zinc-600">
        <div className="h-1.5 bg-[#1E3A8A]" />
        <div className="space-y-2.5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] leading-tight font-bold">Northshore Property Group</p>
              <p className="mt-0.5 text-[8px] text-zinc-600">Harborview Holdings</p>
            </div>
            <p className="text-right text-[8px] leading-tight font-semibold text-[#1E3A8A]">
              Monthly Owner
              <br />
              Statement
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {figures.map(([label, value]) => (
              <div key={label} className="rounded border border-zinc-200 px-1.5 py-1">
                <p className="text-[7px] tracking-wide text-zinc-500 uppercase">{label}</p>
                <p className="text-[9px] font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1 border-t border-zinc-200 pt-2">
            {properties.map(([name, noi]) => (
              <div key={name} className="flex items-center justify-between gap-2 text-[8px]">
                <span className="truncate text-zinc-700">{name}</span>
                <span className="font-semibold">{noi}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

function Step4Preview({
  brand,
  summary,
  notes,
  onBack,
  onStartOver,
}: {
  brand: BrandSettings;
  summary: ReportSummary;
  notes: string;
  onBack: () => void;
  onStartOver: () => void;
}) {
  const figures = [
    { label: 'Gross Income', value: money.format(summary.totalIncome), negative: false },
    { label: 'Total Expenses', value: money.format(summary.totalExpenses), negative: false },
    {
      label: 'Net Operating Income',
      value: formatAccounting(summary.netOperatingIncome),
      negative: summary.netOperatingIncome < 0,
    },
    { label: 'Cash Distributed', value: money.format(summary.totalDistributed), negative: false },
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
              <dd
                className={`mt-1 text-sm font-semibold ${
                  figure.negative ? 'text-[#DC2626]' : 'text-zinc-950 dark:text-zinc-50'
                }`}
              >
                {figure.value}
              </dd>
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
                <span
                  className={`font-medium ${
                    property.noi < 0 ? 'text-[#DC2626]' : 'text-zinc-950 dark:text-zinc-50'
                  }`}
                >
                  {formatAccounting(property.noi)} NOI
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStartOver}
              className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              New report
            </button>
            <DownloadStatement brand={brand} summary={summary} notes={notes} />
          </div>
        </div>
      </div>
    </section>
  );
}

function formatAccounting(value: number): string {
  if (value < 0) return `(${money.format(Math.abs(value))})`;
  return money.format(value);
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
