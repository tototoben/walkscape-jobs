import * as React from "react";
import { columns, TierCell, NoteCell } from "./columns";
import type { Job } from "./columns";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { ImportModal } from "./import-modal";
import ultraximusData from "@/data/ultraximus_tierlist.json";
import gdteData from "@/data/gdte_jobs.json";

const STORAGE_KEY = "walkscape-tier-overrides";
const NOTES_STORAGE_KEY = "walkscape-note-overrides";

type RawLocation = { location: string; jobs: Record<string, unknown>[] };

const regionMap: Record<string, string> = {
  Kallaheim: "Jarvonia",
  Azurazera: "Jarvonia",
  Vastalume: "Syrenthia",
};

function resolveRegion(location: string): string {
  return regionMap[location] ?? "GDTE";
}

function jobId(location: string, item: string, quantity: number, quality: string): string {
  return `${location}|${item}|${quantity}|${quality}`;
}

function flattenJobs(data: RawLocation[]): Job[] {
  return data.flatMap((location) =>
    location.jobs.map((job) => {
      const item = job.item as string;
      const quantity = job.quantity as number;
      const quality = job.quality as string;
      return {
        id: jobId(location.location, item, quantity, quality),
        region: resolveRegion(location.location),
        location: location.location,
        item,
        quantity,
        quality,
        rewards: job.rewards as string[],
        ...(job.tier !== undefined && { tier: job.tier as string }),
        ...(job.note !== undefined && { note: job.note as string }),
      };
    }),
  );
}

function loadOverrides(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function loadNoteOverrides(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveNoteOverrides(overrides: Record<string, string>) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(overrides));
}

const tierRowClass: Record<string, string> = {
  S: "bg-[rgba(255,191,0,0.07)]",
  A: "bg-[rgba(148,163,184,0.07)]",
  B: "bg-[rgba(180,83,9,0.07)]",
  F: "bg-[rgba(239,68,68,0.07)]",
};

export default function JobsTable() {
  const [ready, setReady] = React.useState(false);
  const [overrides, setOverrides] = React.useState<Record<string, string>>(loadOverrides);
  const [noteOverrides, setNoteOverrides] = React.useState<Record<string, string>>(loadNoteOverrides);
  const [importOpen, setImportOpen] = React.useState(false);

  React.useEffect(() => {
    setReady(true);
  }, []);

  const baseJobs = React.useMemo(
    () => [
      ...flattenJobs(ultraximusData as RawLocation[]),
      ...flattenJobs(gdteData as RawLocation[]),
    ],
    [],
  );

  const jobs = React.useMemo(
    () =>
      baseJobs.map((job) => {
        const tierOverride = overrides[job.id];
        const noteOverride = noteOverrides[job.id];
        return {
          ...job,
          ...(tierOverride && { tier: tierOverride }),
          ...(noteOverride && { note: noteOverride }),
        };
      }),
    [baseJobs, overrides, noteOverrides],
  );

  function handleTierChange(id: string, tier: string | undefined) {
    setOverrides((prev) => {
      const next = { ...prev };
      if (tier) {
        next[id] = tier;
      } else {
        delete next[id];
      }
      saveOverrides(next);
      return next;
    });
  }

  function handleNoteChange(id: string, note: string | undefined) {
    setNoteOverrides((prev) => {
      const next = { ...prev };
      if (note) {
        next[id] = note;
      } else {
        delete next[id];
      }
      saveNoteOverrides(next);
      return next;
    });
  }

  function handleResetAll() {
    setOverrides({});
    setNoteOverrides({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NOTES_STORAGE_KEY);
  }

  function handleExport() {
    const payload = { tier: overrides, note: noteOverrides };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  }

  function handleImport(data: unknown) {
    if (typeof data !== "object" || data === null) return;

    // New format: { tier: {...}, note: {...} }
    if ("tier" in data || "note" in data) {
      const tierData = "tier" in data && typeof data.tier === "object" && data.tier !== null
        ? data.tier as Record<string, string>
        : {};
      const noteData = "note" in data && typeof data.note === "object" && data.note !== null
        ? data.note as Record<string, string>
        : {};
      setOverrides(tierData);
      setNoteOverrides(noteData);
      saveOverrides(tierData);
      saveNoteOverrides(noteData);
      return;
    }

    // Old flat format: { "id": "S", ... } — treat as tier overrides
    const flat = data as Record<string, string>;
    setOverrides(flat);
    saveOverrides(flat);
  }

  const dynamicColumns = React.useMemo(
    () =>
      columns.map((col) => {
        if ("accessorKey" in col && (col as { accessorKey: string }).accessorKey === "tier") {
          return {
            ...col,
            cell: ({ row }: { row: { original: Job } }) => (
              <TierCell
                tier={row.original.tier}
                onChange={(tier) => handleTierChange(row.original.id, tier)}
              />
            ),
          };
        }
        if ("accessorKey" in col && (col as { accessorKey: string }).accessorKey === "note") {
          return {
            ...col,
            cell: ({ row }: { row: { original: Job } }) => (
              <NoteCell
                note={row.original.note}
                onChange={(note) => handleNoteChange(row.original.id, note)}
              />
            ),
          };
        }
        return col;
      }),
    [],
  );

  const [fabOpen, setFabOpen] = React.useState(false);

  React.useEffect(() => {
    if (!fabOpen) return;
    function handleClick(e: MouseEvent) {
      const fab = document.getElementById("override-fab");
      if (fab && !fab.contains(e.target as Node)) {
        setFabOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [fabOpen]);

  const locations = React.useMemo(
    () => [...new Set(baseJobs.map((j) => j.location))].sort(),
    [baseJobs],
  );

  const hasOverrides = Object.keys(overrides).length > 0;

  if (!ready) {
    return <div className="container mx-auto h-dvh overflow-hidden py-4 sm:py-6" />;
  }

  return (
    <div className="container mx-auto flex h-dvh flex-col overflow-hidden py-4 sm:py-6">
      <DataTable
        columns={dynamicColumns}
        data={jobs}
        locations={locations}
        className="flex-1 min-h-0"
        getRowClassName={(row) => (row.tier ? tierRowClass[row.tier] ?? "" : "")}
      />
      <div id="override-fab" className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-200 ${
            fabOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <Button
            className="h-9 rounded-full bg-destructive px-4 text-xs text-destructive-foreground shadow-xl shadow-black/40 hover:bg-destructive/90"
            onClick={() => { handleResetAll(); setFabOpen(false); }}
          >
            Reset
          </Button>
          {hasOverrides && (
            <Button
              className="h-9 rounded-full bg-secondary px-4 text-xs text-secondary-foreground shadow-xl shadow-black/40 hover:brightness-125"
              onClick={() => { handleExport(); setFabOpen(false); }}
            >
              Export
            </Button>
          )}
          <Button
            className="h-9 rounded-full bg-primary px-4 text-xs text-primary-foreground shadow-xl shadow-black/40 hover:bg-primary/90"
            onClick={() => { setImportOpen(true); setFabOpen(false); }}
          >
            Import
          </Button>
        </div>
        <button
          onClick={() => setFabOpen((o) => !o)}
          className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium shadow-xl shadow-black/40 transition-all duration-200 ${
            fabOpen
              ? "bg-muted text-foreground"
              : hasOverrides
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Overrides
        </button>
      </div>
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
