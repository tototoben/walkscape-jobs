import * as React from "react";
import { Button } from "@/components/ui/button";

export function ImportModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (data: unknown) => void;
}) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setValue("");
      setError("");
    }
  }, [open]);

  function handleApply() {
    let data: unknown;
    try {
      data = JSON.parse(value);
    } catch {
      setError("Invalid JSON.");
      return;
    }
    onImport(data);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-foreground">Import overrides</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Paste the JSON copied from another device using "Export to clipboard".
        </p>
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder='{"tier": {"Location|Item|1|Common": "S"}, "note": {"Location|Item|1|Common": "some note"}}'
          className="mb-3 min-h-[200px] w-full resize-y rounded-md border border-input bg-background p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
        />
        {error && (
          <p className="mb-3 text-sm text-destructive">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
