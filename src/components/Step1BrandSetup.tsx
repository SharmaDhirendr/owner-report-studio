'use client';

import { useEffect, useId, useRef, type CSSProperties, type ChangeEvent } from 'react';
import { Building, CalendarRange, Palette, Upload, User, X } from 'lucide-react';
import type { BrandSettings } from '@/types/report';

const STORAGE_KEY = 'owner-report-brand';
const DEFAULT_PRIMARY_COLOR = '#1E3A8A';

type Step1BrandSetupProps = {
  settings: BrandSettings;
  onChange: (settings: BrandSettings) => void;
};

const inputClassName =
  'min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500';

export function Step1BrandSetup({ settings, onChange }: Step1BrandSetupProps) {
  const companyId = useId();
  const colorId = useId();
  const periodId = useId();
  const ownerId = useId();
  const logoId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const settingsRef = useRef(settings);
  const pendingLoad = useRef<string | null>(null);
  const lastSaved = useRef<string | null>(null);

  onChangeRef.current = onChange;
  settingsRef.current = settings;

  useEffect(() => {
    const saved = readBrandSettings();
    if (saved) {
      const next: BrandSettings = {
        ...saved,
        primaryColor: normalizeHex(saved.primaryColor) ?? DEFAULT_PRIMARY_COLOR,
      };
      pendingLoad.current = JSON.stringify(next);
      onChangeRef.current(next);
      return;
    }

    const current = settingsRef.current;
    const primaryColor = normalizeHex(current.primaryColor) ?? DEFAULT_PRIMARY_COLOR;
    const next = primaryColor === current.primaryColor ? current : { ...current, primaryColor };
    pendingLoad.current = JSON.stringify(next);
    if (next !== current) {
      onChangeRef.current(next);
    }
  }, []);

  useEffect(() => {
    const serialized = JSON.stringify(settings);
    if (pendingLoad.current !== null) {
      if (serialized !== pendingLoad.current) return;
      pendingLoad.current = null;
      lastSaved.current = serialized;
      return;
    }
    if (lastSaved.current === serialized) return;
    lastSaved.current = serialized;
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore quota and private-mode failures; the form still works in memory.
    }
  }, [settings]);

  function update(patch: Partial<BrandSettings>) {
    onChange({ ...settings, ...patch });
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      onChange({ ...settingsRef.current, logoBase64: reader.result });
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    update({ logoBase64: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const primaryColor = normalizeHex(settings.primaryColor) ?? DEFAULT_PRIMARY_COLOR;

  return (
    <section
      className="mx-auto w-full max-w-lg"
      style={{ '--brand': primaryColor } as CSSProperties}
    >
      <header className="mb-6 sm:mb-8">
        <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: primaryColor }}>
          Step 1 of 4
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Brand setup
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Company details and colors used on the owner report.
        </p>
      </header>

      <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <label
            htmlFor={companyId}
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            <Building className="size-4 text-zinc-500" aria-hidden="true" />
            Company Name
          </label>
          <input
            id={companyId}
            type="text"
            value={settings.companyName}
            onChange={(event) => update({ companyName: event.target.value })}
            placeholder="Northshore Property Group"
            autoComplete="organization"
            className={inputClassName}
          />
        </div>

        <div>
          <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            <Upload className="size-4 text-zinc-500" aria-hidden="true" />
            Logo
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {settings.logoBase64 ? (
              <div className="relative shrink-0">
                {/* Data URLs from the file picker are not supported by next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.logoBase64}
                  alt="Uploaded company logo"
                  className="h-14 w-14 rounded-lg border border-zinc-200 bg-zinc-50 object-contain p-1 dark:border-zinc-700 dark:bg-zinc-950"
                />
                <button
                  type="button"
                  onClick={clearLogo}
                  aria-label="Remove logo"
                  className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </div>
            ) : null}
            <label
              htmlFor={logoId}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-[var(--brand)] hover:text-zinc-950 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <Upload className="size-4" aria-hidden="true" />
              {settings.logoBase64 ? 'Replace logo' : 'Upload logo'}
            </label>
            <input
              ref={fileInputRef}
              id={logoId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={colorId}
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            <Palette className="size-4 text-zinc-500" aria-hidden="true" />
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id={colorId}
              type="color"
              value={primaryColor}
              onChange={(event) => update({ primaryColor: event.target.value.toUpperCase() })}
              className="h-11 w-16 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">{primaryColor}</span>
          </div>
        </div>

        <div>
          <label
            htmlFor={periodId}
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            <CalendarRange className="size-4 text-zinc-500" aria-hidden="true" />
            Report Period
          </label>
          <input
            id={periodId}
            type="text"
            value={settings.reportPeriod}
            onChange={(event) => update({ reportPeriod: event.target.value })}
            placeholder="October 2026"
            className={inputClassName}
          />
        </div>

        <div>
          <label
            htmlFor={ownerId}
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            <User className="size-4 text-zinc-500" aria-hidden="true" />
            Owner / Portfolio Name
          </label>
          <input
            id={ownerId}
            type="text"
            value={settings.ownerName}
            onChange={(event) => update({ ownerName: event.target.value })}
            placeholder="Harborview Holdings"
            autoComplete="name"
            className={inputClassName}
          />
        </div>
      </div>
    </section>
  );
}

function readBrandSettings(): BrandSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBrandSettings(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isBrandSettings(value: unknown): value is BrandSettings {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.companyName === 'string' &&
    (typeof record.logoBase64 === 'string' || record.logoBase64 === null) &&
    typeof record.primaryColor === 'string' &&
    typeof record.reportPeriod === 'string' &&
    typeof record.ownerName === 'string'
  );
}

function normalizeHex(value: string): string | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(value.trim());
  return match ? `#${match[1].toUpperCase()}` : null;
}
