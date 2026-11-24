'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Step1BrandSetup } from '@/components/Step1BrandSetup';
import { Step2UploadMap } from '@/components/Step2UploadMap';
import { Step3ManagerNotes } from '@/components/Step3ManagerNotes';
import { calculateReportSummary } from '@/lib/calculator';
import { emptyBrand, DEFAULT_PRIMARY_COLOR, isSamplePrefill, sanitizeBrand, visiblePrimaryColor } from '@/lib/brandDefaults';
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

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const CONTACT_EMAIL = 'dhirusharma175@gmail.com';
const FEEDBACK_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Owner Report Feedback')}`;

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [brand, setBrand] = useState<BrandSettings>(emptyBrand);
  const [transactions, setTransactions] = useState<RawTransaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [notes, setNotes] = useState('');
  const downloadSectionRef = useRef<HTMLDivElement>(null);
  const pendingDownloadScroll = useRef(false);

  useEffect(() => {
    if (!pendingDownloadScroll.current || currentStep !== 4 || !summary) return;
    const section = downloadSectionRef.current;
    if (!section) return;
    pendingDownloadScroll.current = false;
    requestAnimationFrame(() => {
      const margin = 16;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY - margin;
      const actions = section.querySelector<HTMLElement>('[data-download-actions]');
      let top = sectionTop;
      if (actions) {
        const actionsBottom = actions.getBoundingClientRect().bottom + window.scrollY + margin;
        const showActions = actionsBottom - window.innerHeight;
        if (showActions > top) top = showActions;
      }
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }, [currentStep, summary]);

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
      const primaryColor = visiblePrimaryColor(current.primaryColor);
      return {
        ...current,
        companyName: current.companyName.trim() || 'Northshore Property Group',
        ownerName: current.ownerName.trim() || 'Harborview Holdings',
        reportPeriod: current.reportPeriod.trim() || 'October 2026',
        primaryColor,
        logoBase64: current.logoBase64?.trim() ? current.logoBase64 : createPlaceholderLogo(primaryColor),
      };
    });
    pendingDownloadScroll.current = true;
    setCurrentStep(4);
  }

  function startOver() {
    setTransactions([]);
    setSummary(null);
    setNotes('');
    setCurrentStep(1);
    setBrand((current) => {
      const stored = readStoredBrand();
      const next = isSamplePrefill(current) && stored ? stored : sanitizeBrand(current);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The form still resets in memory when storage is unavailable.
      }
      return next;
    });
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <div className="mb-6 flex justify-end">
        <a
          href={FEEDBACK_MAILTO}
          className="inline-flex min-h-11 items-center text-sm font-medium text-[#1E3A8A] underline-offset-2 hover:underline dark:text-[#93C5FD]"
        >
          Give feedback
        </a>
      </div>
      <header className="mb-8 flex flex-col items-center gap-8 sm:mb-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full max-w-xl text-center lg:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-3xl lg:text-4xl dark:text-zinc-50">
            Turn AppFolio & Buildium exports into branded owner reports
          </h1>
          <p className="mt-3 text-base leading-7 text-pretty text-zinc-700 dark:text-zinc-200">
            Upload your CSV or Excel export, add your branding, and download a clean PDF owner
            statement in under 2 minutes.
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Your data stays in your browser. Nothing is uploaded to a server.
          </p>
          {currentStep < 4 ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={loadSampleReport}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] sm:w-auto"
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
                className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
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
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-950 hover:underline dark:text-zinc-300 dark:hover:text-white"
          >
            Start over
          </button>
        ) : null}
      </div>

      {currentStep === 1 ? (
        <>
          <Step1BrandSetup settings={brand} onChange={setBrand} />
          <div className="mx-auto mt-5 flex w-full max-w-lg sm:justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1E40AF] sm:w-auto"
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
        <div ref={downloadSectionRef} className="scroll-mt-4">
          <Step4Preview
            brand={brand}
            summary={summary}
            notes={notes}
            onBack={() => setCurrentStep(3)}
            onStartOver={startOver}
          />
        </div>
      ) : null}
      <footer className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-700 sm:mt-16 dark:border-zinc-800 dark:text-zinc-300">
        <p className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <span>Built by Dhirendra Sharma</span>
          <span className="hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="break-all font-medium text-[#1E3A8A] hover:underline dark:text-[#93C5FD]"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </footer>
    </main>
  );
}

function ExampleReportPreview() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <figure className="mx-auto w-full max-w-sm shrink-0 lg:mx-0">
        <figcaption className="mb-2 text-center text-xs font-semibold tracking-[0.14em] text-zinc-700 uppercase dark:text-zinc-200">
          Example report
        </figcaption>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-xl text-left transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <ExampleReportCard size="compact" />
          <span className="mt-2 block text-center text-sm font-medium text-[#1E3A8A] dark:text-[#93C5FD]">
            View larger
          </span>
        </button>
      </figure>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Example owner report"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <ExampleReportCard size="large" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ExampleReportCard({ size }: { size: 'compact' | 'large' }) {
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
  const large = size === 'large';

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white text-zinc-900 shadow-xl dark:border-zinc-600">
      <div className={large ? 'h-2 bg-[#2563EB]' : 'h-1.5 bg-[#2563EB]'} />
      <div className={large ? 'space-y-4 p-5 sm:p-6' : 'space-y-3 p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={large ? 'text-lg leading-tight font-bold' : 'text-sm leading-tight font-bold'}>
              Northshore Property Group
            </p>
            <p className={large ? 'mt-1 text-sm text-zinc-600' : 'mt-0.5 text-xs text-zinc-600'}>
              Harborview Holdings
            </p>
          </div>
          <p
            className={`text-right font-semibold text-[#2563EB] ${large ? 'text-sm leading-5' : 'text-xs leading-4'}`}
          >
            Monthly Owner
            <br />
            Statement
          </p>
        </div>
        <div className={large ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-1.5'}>
          {figures.map(([label, value]) => (
            <div key={label} className={`rounded border border-zinc-200 ${large ? 'px-3 py-2' : 'px-2 py-1.5'}`}>
              <p className={`tracking-wide text-zinc-500 uppercase ${large ? 'text-xs' : 'text-[10px]'}`}>
                {label}
              </p>
              <p className={large ? 'text-base font-semibold' : 'text-sm font-semibold'}>{value}</p>
            </div>
          ))}
        </div>
        <div className={`space-y-1.5 border-t border-zinc-200 ${large ? 'pt-3' : 'pt-2'}`}>
          {properties.map(([name, noi]) => (
            <div
              key={name}
              className={`flex items-center justify-between gap-3 ${large ? 'text-sm' : 'text-xs'}`}
            >
              <span className="min-w-0 break-words text-zinc-700">{name}</span>
              <span className="shrink-0 font-semibold">{noi}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
        <p className="mt-2 text-sm leading-6 break-words text-zinc-600 dark:text-zinc-400">
          {brand.companyName} · {brand.ownerName} · {brand.reportPeriod}
        </p>
      </header>

      <div className="space-y-5">
        <dl className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
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

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Manager’s notes</h3>
          <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
            {notes.trim() || 'No manager notes were added for this period.'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Properties</h3>
          <ul className="mt-3 divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {summary.byProperty.map((property) => (
              <li key={property.property} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0 break-words text-zinc-800 dark:text-zinc-200">{property.property}</span>
                <span
                  className={`shrink-0 text-right font-medium ${
                    property.noi < 0 ? 'text-[#DC2626]' : 'text-zinc-950 dark:text-zinc-50'
                  }`}
                >
                  {formatAccounting(property.noi)} NOI
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div data-download-actions className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Back
          </button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onStartOver}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
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

  const fill = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_PRIMARY_COLOR;
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
    return sanitizeBrand({
      companyName: record.companyName,
      logoBase64: record.logoBase64,
      primaryColor: record.primaryColor,
      reportPeriod: record.reportPeriod,
      ownerName: record.ownerName,
    });
  } catch {
    return null;
  }
}
