"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorFeedback from "@/components/EditorFeedback";
import { clientApi } from "@/lib/clientApi";
import {
  STAT_HINTS,
  STAT_LABELS,
  STAT_NAMES,
  STAT_NO_VALUE,
  STAT_VALUE_MAX_LENGTH,
  STAT_YES_VALUE,
  isYesNoStat,
  toYesNoStatValue,
  validateStatValue,
  type BulkStatInput,
  type SiteStat,
  type StatName,
} from "@/lib/stats";

type StatsEditorProps = {
  stats: SiteStat[];
  /** Message shown when the initial admin fetch failed. */
  loadError?: string | null;
};

type StatDraft = {
  value: string;
  hidden: boolean;
};

type StatDrafts = Record<StatName, StatDraft>;

const YES_NO_OPTIONS = [STAT_YES_VALUE, STAT_NO_VALUE];

function toDraftValue(name: StatName, value: string | undefined): string {
  return isYesNoStat(name) ? toYesNoStatValue(value) : (value ?? "");
}

function toDrafts(stats: SiteStat[]): StatDrafts {
  const byName = new Map(
    stats.map((stat) => [stat.name?.trim().toLowerCase(), stat]),
  );

  return STAT_NAMES.reduce((drafts, name) => {
    const stat = byName.get(name);
    drafts[name] = {
      value: toDraftValue(name, stat?.value),
      hidden: stat?.hidden ?? false,
    };
    return drafts;
  }, {} as StatDrafts);
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  switch (getErrorStatus(error)) {
    case 400:
      return message || "The stat values were rejected. Check them and retry.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You are not authorized to change site statistics.";
    case 404:
      return "That statistic no longer exists on the server.";
    case 429:
      return "Too many admin requests. Wait a moment, then save again.";
    case 500:
      return "The server could not save the statistics. Please try again.";
    default:
      return message || "Unable to save site statistics.";
  }
}

const statsIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 3v18h18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 15v3M12 10v8M17 6v12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function StatsEditor({ stats, loadError }: StatsEditorProps) {
  const router = useRouter();

  const [drafts, setDrafts] = useState<StatDrafts>(() => toDrafts(stats));
  const [savingName, setSavingName] = useState<StatName | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => {
    return STAT_NAMES.reduce(
      (errors, name) => {
        errors[name] = validateStatValue(drafts[name].value);
        return errors;
      },
      {} as Record<StatName, string | null>,
    );
  }, [drafts]);

  const busy = savingAll || savingName !== null;

  function updateDraft(name: StatName, patch: Partial<StatDraft>) {
    setMessage(null);
    setError(null);
    setDrafts((current) => ({
      ...current,
      [name]: { ...current[name], ...patch },
    }));
  }

  function applyResponse(saved: SiteStat[] | SiteStat | undefined | null) {
    const list = Array.isArray(saved) ? saved : saved ? [saved] : [];
    if (list.length === 0) return;

    setDrafts((current) => {
      const next = { ...current };
      for (const stat of list) {
        const name = stat?.name?.trim().toLowerCase();
        if (name && name in next) {
          next[name as StatName] = {
            value: toDraftValue(name as StatName, stat.value),
            hidden: Boolean(stat.hidden),
          };
        }
      }
      return next;
    });
  }

  async function handleSaveOne(name: StatName) {
    if (validationErrors[name]) {
      setMessage(null);
      setError(`${STAT_LABELS[name]}: ${validationErrors[name]}`);
      return;
    }

    setSavingName(name);
    setMessage(null);
    setError(null);

    try {
      const saved = await clientApi.updateStat(name, {
        value: drafts[name].value.trim(),
        hidden: drafts[name].hidden,
      });
      applyResponse(saved);
      setMessage(`${STAT_LABELS[name]} saved.`);
      router.refresh();
    } catch (err: unknown) {
      setError(describeError(err));
    } finally {
      setSavingName(null);
    }
  }

  async function handleSaveAll(event: React.FormEvent) {
    event.preventDefault();

    const invalid = STAT_NAMES.filter((name) => validationErrors[name]);
    if (invalid.length > 0) {
      setMessage(null);
      setError(
        invalid
          .map((name) => `${STAT_LABELS[name]}: ${validationErrors[name]}`)
          .join(" "),
      );
      return;
    }

    setSavingAll(true);
    setMessage(null);
    setError(null);

    try {
      const payload: BulkStatInput[] = STAT_NAMES.map((name) => ({
        name,
        value: drafts[name].value.trim(),
        hidden: drafts[name].hidden,
      }));

      const saved = await clientApi.updateStats(payload);
      applyResponse(saved);
      setMessage("All statistics saved.");
      router.refresh();
    } catch (err: unknown) {
      setError(describeError(err));
    } finally {
      setSavingAll(false);
    }
  }

  return (
    <form onSubmit={handleSaveAll}>
      {loadError && (
        <div role="alert" className="admin-feedback admin-feedback-error mb-3">
          {loadError}
        </div>
      )}

      <AdminFormBlock icon={statsIcon} title="Trust statistics">
        <p className="form-text mb-4">
          These values appear in the trust bar and About section of the public
          home page. Values are saved exactly as typed (no number formatting)
          and must be {STAT_VALUE_MAX_LENGTH} characters or fewer. Hidden
          statistics are removed from the public site entirely.
        </p>

        <div className="row g-4">
          {STAT_NAMES.map((name) => {
            const draft = drafts[name];
            const fieldError = validationErrors[name];
            const length = draft.value.trim().length;
            const yesNo = isYesNoStat(name);

            return (
              <div className="col-12" key={name}>
                <div className="row g-3 align-items-start">
                  <div className="col-md-5">
                    {yesNo ? (
                      <span className="form-label fw-semibold d-block">
                        {STAT_LABELS[name]}
                      </span>
                    ) : (
                      <label
                        className="form-label fw-semibold"
                        htmlFor={`stat-${name}`}
                      >
                        {STAT_LABELS[name]}
                      </label>
                    )}

                    {yesNo ? (
                      <div role="radiogroup" aria-label={STAT_LABELS[name]}>
                        {YES_NO_OPTIONS.map((option) => {
                          const optionId = `stat-${name}-${option.toLowerCase()}`;
                          return (
                            <div
                              className="form-check form-check-inline"
                              key={option}
                            >
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`stat-${name}`}
                                id={optionId}
                                value={option}
                                checked={draft.value === option}
                                onChange={() =>
                                  updateDraft(name, { value: option })
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor={optionId}
                              >
                                {option}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        id={`stat-${name}`}
                        className={`form-control${fieldError ? " is-invalid" : ""}`}
                        value={draft.value}
                        onChange={(e) =>
                          updateDraft(name, { value: e.target.value })
                        }
                        aria-describedby={`stat-${name}-hint`}
                        aria-invalid={fieldError ? true : undefined}
                      />
                    )}

                    <div id={`stat-${name}-hint`} className="form-text">
                      {STAT_HINTS[name]}
                      {!yesNo && ` (${length}/${STAT_VALUE_MAX_LENGTH})`}
                    </div>
                    {fieldError && (
                      <div className="invalid-feedback d-block" role="alert">
                        {fieldError}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`stat-${name}-visible`}
                        checked={!draft.hidden}
                        onChange={(e) =>
                          updateDraft(name, { hidden: !e.target.checked })
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`stat-${name}-visible`}
                      >
                        Show on the public site
                      </label>
                    </div>
                    <div className="form-text">
                      {draft.hidden ? "Hidden" : "Visible"}
                    </div>
                  </div>

                  <div className="col-md-3">
                    <button
                      type="button"
                      className="admin-btn-cancel"
                      onClick={() => handleSaveOne(name)}
                      disabled={busy}
                    >
                      {savingName === name
                        ? "Saving…"
                        : `Save ${STAT_LABELS[name]}`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AdminFormBlock>

      <div className="admin-form-actions">
        <div className="admin-form-actions-primary">
          <button type="submit" className="admin-btn-save" disabled={busy}>
            {savingAll ? "Saving…" : "Save All Statistics"}
          </button>
        </div>
      </div>

      <EditorFeedback message={message} error={error} />
    </form>
  );
}
