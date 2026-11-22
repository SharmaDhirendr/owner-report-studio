'use client';

import { useId } from 'react';
import { ArrowLeft, ArrowRight, NotebookPen } from 'lucide-react';
import type { ReportSummary } from '@/types/report';

type Step3ManagerNotesProps = {
  summary: ReportSummary;
  notes: string;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const templates = [
  {
    id: 'smooth',
    label: 'Standard Smooth Month',
    text: (summary: ReportSummary) =>
      `Operations were steady this period. The portfolio collected ${money.format(summary.totalIncome)} in gross income and incurred ${money.format(summary.totalExpenses)} in operating expenses, for net operating income of ${money.format(summary.netOperatingIncome)}. Cash distributed to the owner was ${money.format(summary.totalDistributed)}. No unusual repairs or vacancies needed attention, and results were in line with expectations.`,
  },
  {
    id: 'maintenance',
    label: 'High Maintenance Explanation',
    text: (summary: ReportSummary) =>
      `Income held at ${money.format(summary.totalIncome)}, while repairs and upkeep brought operating expenses to ${money.format(summary.totalExpenses)}. Net operating income was ${money.format(summary.netOperatingIncome)}, and ${money.format(summary.totalDistributed)} was distributed. The higher expense total reflects completed maintenance that protects the properties and is not expected to repeat at the same level next period.`,
  },
  {
    id: 'vacancy',
    label: 'Vacancy / Turnover Update',
    text: (summary: ReportSummary) =>
      `This period included vacancy and turnover. Gross income was ${money.format(summary.totalIncome)} after lost rent, operating expenses were ${money.format(summary.totalExpenses)}, and net operating income was ${money.format(summary.netOperatingIncome)}. Cash distributed was ${money.format(summary.totalDistributed)}. Make-ready work is underway so the vacant time stays as short as possible.`,
  },
] as const;

export function Step3ManagerNotes({
  summary,
  notes,
  onNotesChange,
  onBack,
  onContinue,
}: Step3ManagerNotesProps) {
  const notesId = useId();
  const figures = [
    { label: 'Gross Income', value: money.format(summary.totalIncome) },
    { label: 'Total Expenses', value: money.format(summary.totalExpenses) },
    { label: 'Net Operating Income', value: money.format(summary.netOperatingIncome) },
    { label: 'Cash Distributed', value: money.format(summary.totalDistributed) },
  ];

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#1E3A8A] uppercase">Step 3 of 4</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Manager notes
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Confirm the totals, then add a short note for the owner.
        </p>
      </header>

      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Reconciliation</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Check these totals before the report is generated.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {figures.map((figure) => (
              <div key={figure.label} className="rounded-xl bg-zinc-50 px-3 py-3 dark:bg-zinc-950">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">{figure.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{figure.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <label
            htmlFor={notesId}
            className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            <NotebookPen className="size-4 text-zinc-500" aria-hidden="true" />
            Manager’s executive summary
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onNotesChange(template.text(summary))}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-[#1E3A8A] hover:text-[#1E3A8A] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-[#1E3A8A] dark:hover:text-blue-200"
              >
                {template.label}
              </button>
            ))}
          </div>
          <textarea
            id={notesId}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={8}
            placeholder="Summarize the month for the owner."
            className="mt-4 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1E40AF]"
          >
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
