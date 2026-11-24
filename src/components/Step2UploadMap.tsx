'use client';

import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ArrowLeft, ArrowRight, FileSpreadsheet, Table2, Upload } from 'lucide-react';
import { isOwnerContribution } from '@/lib/contribution';
import { isOpeningBalance } from '@/lib/openingBalance';
import type { ColumnMapping, RawTransaction } from '@/types/report';
import { sampleTransactions } from '@/lib/sampleData';
import { calculateReportSummary } from '@/lib/calculator';

type Step2UploadMapProps = {
  onDataReady: (transactions: RawTransaction[]) => void;
  onBack: () => void;
  onContinue?: () => void;
};

type ParsedSheet = {
  fileName: string;
  headers: string[];
  rows: Record<string, unknown>[];
};

type AmountParse = {
  amount: number;
  negative: boolean;
};

const FIELD_ORDER: (keyof ColumnMapping)[] = [
  'property',
  'date',
  'category',
  'description',
  'type',
  'amount',
];

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  property: 'Property',
  date: 'Date',
  category: 'Category',
  description: 'Description',
  type: 'Type',
  amount: 'Amount',
};

const FIELD_KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  property: ['property', 'unit', 'building', 'address', 'asset'],
  date: ['date', 'posted', 'posting'],
  category: ['category', 'account', 'gl code', 'class'],
  description: ['description', 'memo', 'details', 'detail', 'narrative', 'note'],
  type: ['transaction type', 'income/expense', 'type'],
  amount: ['amount', 'total', 'payment', 'value'],
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const controlClassName =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50';

export function Step2UploadMap({ onDataReady, onBack, onContinue }: Step2UploadMapProps) {
  const fileId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const onDataReadyRef = useRef(onDataReady);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>(emptyMapping);
  const [usingSample, setUsingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  onDataReadyRef.current = onDataReady;

  const transactions = useMemo(() => {
    if (usingSample) return sampleTransactions;
    if (!sheet || !isMappingComplete(mapping)) return null;
    return rowsToTransactions(sheet.rows, mapping);
  }, [usingSample, sheet, mapping]);

  const ready = transactions !== null && transactions.length > 0;
  const summary = ready && transactions ? calculateReportSummary(transactions) : null;

  useEffect(() => {
    if (!ready || !transactions) return;
    onDataReadyRef.current(transactions);
  }, [ready, transactions]);

  function loadSample() {
    requestId.current += 1;
    setUsingSample(true);
    setSheet(null);
    setMapping(emptyMapping());
    setError(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSelectedFile(file: File | undefined) {
    if (!file) return;
    const currentRequest = ++requestId.current;
    setError(null);

    if (!isSupportedFile(file)) {
      setError('Upload a .csv or .xlsx file.');
      return;
    }

    if (file.name.toLowerCase().endsWith('.csv')) {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (currentRequest !== requestId.current) return;
          const headers = (results.meta.fields ?? []).map((field) => field.trim()).filter(Boolean);
          const rows = results.data.filter((row) => rowHasValues(row));
          if (headers.length === 0 || rows.length === 0) {
            setError('No rows found in that CSV file.');
            return;
          }
          publishSheet(file.name, headers, rows);
        },
        error: () => {
          if (currentRequest !== requestId.current) return;
          setError('Could not read that CSV file.');
        },
      });
      return;
    }

    void file.arrayBuffer().then(
      (buffer) => {
        if (currentRequest !== requestId.current) return;
        try {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            setError('That workbook has no sheets.');
            return;
          }
          const parsedRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
            defval: '',
            raw: true,
          });
          const normalized = normalizeSheetRows(parsedRows);
          if (normalized.headers.length === 0 || normalized.rows.length === 0) {
            setError('No rows found in that spreadsheet.');
            return;
          }
          publishSheet(file.name, normalized.headers, normalized.rows);
        } catch {
          setError('Could not read that spreadsheet.');
        }
      },
      () => {
        if (currentRequest !== requestId.current) return;
        setError('Could not read that spreadsheet.');
      },
    );
  }

  function publishSheet(fileName: string, headers: string[], rows: Record<string, unknown>[]) {
    setUsingSample(false);
    setSheet({ fileName, headers, rows });
    setMapping(guessMapping(headers));
    setError(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleSelectedFile(event.dataTransfer.files?.[0]);
  }

  const showUnreadableAmounts =
    !usingSample && sheet !== null && isMappingComplete(mapping) && transactions?.length === 0;

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#1E3A8A] uppercase">Step 2 of 4</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Upload & map
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Import a ledger file, or preview the report with sample transactions.
        </p>
      </header>

      <div className="space-y-5">
        <label
          htmlFor={fileId}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition ${
            isDragging
              ? 'border-[#1E3A8A] bg-blue-50 dark:bg-blue-950/30'
              : 'border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900'
          }`}
        >
          <Upload className="size-5 text-zinc-500" aria-hidden="true" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {sheet ? sheet.fileName : 'Drop a CSV or Excel file'}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">or click to browse · .csv, .xlsx</span>
          <input
            ref={fileInputRef}
            id={fileId}
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => {
              handleSelectedFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>

        <button
          type="button"
          onClick={loadSample}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1E40AF]"
        >
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          Load Sample Data
        </button>

        {error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}

        {sheet && !usingSample ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              <Table2 className="size-4 text-zinc-500" aria-hidden="true" />
              Map columns
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELD_ORDER.map((field) => (
                <label key={field} className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {FIELD_LABELS[field]}
                  <select
                    value={mapping[field]}
                    onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}
                    className={`${controlClassName} mt-1.5`}
                  >
                    <option value="">Select a column</option>
                    {sheet.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {showUnreadableAmounts ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            No transaction amounts could be read. Check the amount column.
          </p>
        ) : null}

        {summary ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Reconciliation</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {summary.transactions.length} transactions
              {usingSample ? ' · sample data' : ''}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <SummaryStat label="Gross Income" value={money.format(summary.totalIncome)} />
              <SummaryStat label="Total Expenses" value={money.format(summary.totalExpenses)} />
              <SummaryStat
                label="NOI"
                value={summary.netOperatingIncome < 0 ? `(${money.format(Math.abs(summary.netOperatingIncome))})` : money.format(summary.netOperatingIncome)}
                negative={summary.netOperatingIncome < 0}
              />
              <SummaryStat label="Distributions" value={money.format(summary.totalDistributed)} />
            </dl>
          </div>
        ) : null}

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
            disabled={!ready}
            onClick={() => {
              if (!transactions) return;
              onDataReady(transactions);
              onContinue?.();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
          >
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function SummaryStat({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-3 py-3 dark:bg-zinc-950">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold ${negative ? 'text-[#DC2626]' : 'text-zinc-950 dark:text-zinc-50'}`}>
        {value}
      </dd>
    </div>
  );
}

function emptyMapping(): ColumnMapping {
  return {
    property: '',
    date: '',
    category: '',
    description: '',
    type: '',
    amount: '',
  };
}

function isSupportedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || name.endsWith('.xlsx');
}

function isMappingComplete(mapping: ColumnMapping): boolean {
  return FIELD_ORDER.every((field) => mapping[field].trim().length > 0);
}

function guessMapping(headers: string[]): ColumnMapping {
  const mapping = emptyMapping();
  const candidates: { field: keyof ColumnMapping; header: string; score: number }[] = [];

  for (const field of FIELD_ORDER) {
    for (const header of headers) {
      const score = scoreHeader(header, field);
      if (score > 0) candidates.push({ field, header, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const usedHeaders = new Set<string>();
  const usedFields = new Set<keyof ColumnMapping>();

  for (const candidate of candidates) {
    if (usedHeaders.has(candidate.header) || usedFields.has(candidate.field)) continue;
    mapping[candidate.field] = candidate.header;
    usedHeaders.add(candidate.header);
    usedFields.add(candidate.field);
  }

  return mapping;
}

function scoreHeader(header: string, field: keyof ColumnMapping): number {
  const normalized = header.toLowerCase().trim();
  let best = 0;
  for (const keyword of FIELD_KEYWORDS[field]) {
    if (normalized === keyword) {
      best = Math.max(best, 100 + keyword.length);
      continue;
    }
    const partial = keyword.includes(' ') || keyword.includes('/')
      ? normalized.includes(keyword)
      : new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(normalized);
    if (partial) best = Math.max(best, 40 + keyword.length);
  }
  return best;
}

function rowsToTransactions(rows: Record<string, unknown>[], mapping: ColumnMapping): RawTransaction[] {
  const transactions: RawTransaction[] = [];

  for (const row of rows) {
    const parsed = parseAmount(row[mapping.amount]);
    if (!parsed) continue;

    const property = cellText(row[mapping.property]);
    const date = normalizeDate(row[mapping.date]);
    const category = cellText(row[mapping.category]);
    const description = cellText(row[mapping.description]);
    const typeText = cellText(row[mapping.type]);

    const type = classifyType(typeText, category, description, parsed.negative);
    transactions.push({
      property,
      date,
      category,
      description,
      type,
      amount:
        (type === 'Opening' || type === 'Contribution') && parsed.negative
          ? -parsed.amount
          : parsed.amount,
    });
  }

  return transactions;
}

function classifyType(
  typeText: string,
  category: string,
  description: string,
  negative: boolean,
): RawTransaction['type'] {
  if (isOpeningBalance(typeText, category, description)) return 'Opening';
  if (isOwnerContribution(typeText, category)) return 'Contribution';

  const combined = `${typeText} ${category} ${description}`.toLowerCase();
  if (combined.includes('distribution') || combined.includes('owner draw')) return 'Distribution';

  const normalized = typeText.trim().toLowerCase();
  if (normalized === 'income' || normalized.includes('income')) return 'Income';
  if (normalized === 'expense' || normalized.includes('expense')) return 'Expense';
  if (negative) return 'Expense';
  return 'Income';
}

function parseAmount(value: unknown): AmountParse | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return { amount: toCents(Math.abs(value)), negative: value < 0 };
  }

  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const negative = /^\(.*\)$/.test(raw) || raw.startsWith('-');
  const cleaned = raw.replace(/[$,\s]/g, '').replace(/[()]/g, '').replace(/^-/, '');
  if (!cleaned) return null;

  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric)) return null;
  return { amount: toCents(Math.abs(numeric)), negative: negative || numeric < 0 };
}

function normalizeDate(value: unknown): string {
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
    const month = String(utc.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utc.getUTCDate()).padStart(2, '0');
    return `${utc.getUTCFullYear()}-${month}-${day}`;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  return cellText(value);
}

function cellText(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return normalizeDate(value);
  return String(value ?? '').trim();
}

function rowHasValues(row: Record<string, unknown>): boolean {
  return Object.values(row).some((value) => cellText(value).length > 0);
}

function normalizeSheetRows(rows: Record<string, unknown>[]): {
  headers: string[];
  rows: Record<string, unknown>[];
} {
  const headers: string[] = [];
  const seen = new Set<string>();
  const normalized = rows
    .map((row) => {
      const next: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        const header = key.trim();
        if (!header) continue;
        next[header] = value;
        if (!seen.has(header)) {
          seen.add(header);
          headers.push(header);
        }
      }
      return next;
    })
    .filter((row) => rowHasValues(row));

  return { headers, rows: normalized };
}

function toCents(num: number): number {
  return Math.round(num * 100) / 100;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
