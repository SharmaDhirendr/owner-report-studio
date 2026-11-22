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
    setBrand((current) => ({
      ...current,
      companyName: current.companyName.trim() || 'Northshore Property Group',
      ownerName: current.ownerName.trim() || 'Harborview Holdings',
      reportPeriod: current.reportPeriod.trim() || 'October 2026',
      primaryColor: current.primaryColor.trim() || '#1E3A8A',
    }));
    setCurrentStep(4);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#1E3A8A] uppercase">
            Step {currentStep} of 4
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
          <button
            type="button"
            onClick={loadSampleReport}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Load sample data
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
