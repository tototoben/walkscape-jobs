import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Job = {
  id: string;
  region: string;
  location: string;
  tier?: string;
  item: string;
  quantity: number;
  quality: string;
  rewards: string[];
  note?: string;
};

const tierRank: Record<string, number> = {
  S: 0, A: 1, B: 2, C: 3, D: 4, E: 5, F: 6,
};

const allTiers = ["S", "A", "B", "C", "D", "E", "F"];

const tierSelectBg: Record<string, string> = {
  S: "rgba(255,191,0,0.15)",
  A: "rgba(148,163,184,0.15)",
  B: "rgba(180,83,9,0.15)",
  F: "rgba(239,68,68,0.15)",
};

export function NoteCell({ note, onChange }: { note?: string; onChange: (note: string | undefined) => void }) {
  return (
    <input
      type="text"
      value={note ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder="—"
      className="w-full min-w-[120px] bg-transparent px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring rounded"
    />
  );
}

export function TierCell({ tier, onChange }: { tier?: string; onChange: (tier: string | undefined) => void }) {
  const idx = tier ? allTiers.indexOf(tier) : -1;

  function bumpUp() {
    if (idx <= 0) return;
    onChange(allTiers[idx - 1]);
  }

  function bumpDown() {
    if (idx === -1) {
      onChange(allTiers[allTiers.length - 1]);
      return;
    }
    if (idx >= allTiers.length - 1) return;
    onChange(allTiers[idx + 1]);
  }

  return (
    <span className="inline-flex items-center gap-0">
      <button
        type="button"
        onClick={bumpUp}
        className="cursor-pointer rounded-l p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-default"
        disabled={idx <= 0 || idx === -1}
      >
        <ChevronLeft className="h-3 w-3" />
      </button>
      <select
        value={tier ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-14 cursor-pointer appearance-none rounded-none border border-border p-0 text-center text-xs font-medium outline-none focus:ring-1 focus:ring-ring"
        style={tier ? { backgroundColor: tierSelectBg[tier] } : undefined}
      >
        <option value="">—</option>
        {allTiers.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={bumpDown}
        className="cursor-pointer rounded-r p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-default"
        disabled={idx >= allTiers.length - 1 || idx === -1}
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    </span>
  );
}

function tierSorter<T>(rowA: Row<T>, rowB: Row<T>, columnId: string): number {
  const a = tierRank[rowA.getValue(columnId) as string] ?? 99;
  const b = tierRank[rowB.getValue(columnId) as string] ?? 99;
  return a - b;
}

function SortHeader({ column, label }: { column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc: boolean) => void }; label: string }) {
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      <Icon className="ml-2 h-4 w-4" />
    </Button>
  );
}

export const columns: ColumnDef<Job>[] = [
  {
    accessorKey: "region",
    header: ({ column }) => <SortHeader column={column} label="Region" />,
  },
  {
    accessorKey: "location",
    header: ({ column }) => <SortHeader column={column} label="Location" />,
  },
  {
    accessorKey: "tier",
    header: ({ column }) => <SortHeader column={column} label="Tier" />,
    sortingFn: tierSorter,
  },
  {
    accessorKey: "item",
    header: ({ column }) => <SortHeader column={column} label="Item" />,
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => <SortHeader column={column} label="Qty" />,
  },
  {
    accessorKey: "quality",
    header: ({ column }) => <SortHeader column={column} label="Quality" />,
  },
  {
    accessorKey: "rewards",
    header: "Rewards",
    cell: ({ row }) => row.original.rewards.join(", "),
  },
  {
    accessorKey: "note",
    header: "Note",
    cell: ({ row }) => row.original.note ?? "",
  },
];
