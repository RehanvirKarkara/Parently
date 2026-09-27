import { motion } from "framer-motion";
import { Clock, Pill, Plus, Trash2, Pencil, Sunrise, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateMedicine, useDeleteMedicine, useMedicines, useParents, useUpdateMedicine } from "@/hooks/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ParentSelector } from "@/components/shared/ParentSelector";
import { CardSlider } from "@/components/shared/CardSlider";
import { MedicationSkeleton } from "@/components/shared/RichSkeletons";
import type { Medicine } from "@/types";

const colorOptions = [
  { value: "brand", label: "Indigo", class: "bg-primary/10 text-primary ring-1 ring-primary/20", swatch: "bg-primary" },
  { value: "coral", label: "Coral", class: "bg-accent/12 text-accent ring-1 ring-accent/20", swatch: "bg-accent" },
  { value: "mint", label: "Green", class: "bg-secondary/10 text-secondary ring-1 ring-secondary/20", swatch: "bg-secondary" },
  { value: "warning", label: "Amber", class: "bg-warning/10 text-warning-foreground ring-1 ring-warning/20", swatch: "bg-warning" },
];

const frequencyOptions = ["Once daily", "Twice daily", "Three times daily", "Every other day", "Weekly", "As needed", "At night"];

export function MedicinesPage() {
  const { data: parents } = useParents();
  const [parentId, setParentId] = useState("p-mom");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Medications"
        title="Medicines"
        description="Track prescriptions, dosages, and schedule reminders for each parent."
        actions={
          <Button
            variant="default"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add medicine
          </Button>
        }
      />

      <ParentSelector parents={parents} activeId={parentId} onChange={setParentId} />

      <MedicinesContent
        parentId={parentId}
        onAdd={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        onEdit={(med) => {
          setEditing(med);
          setDialogOpen(true);
        }}
      />

      <MedicineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parentId={parentId}
        medicine={editing}
        onDone={() => setDialogOpen(false)}
      />
    </div>
  );
}

function MedicinesContent({ parentId, onAdd, onEdit }: { parentId: string; onAdd: () => void; onEdit: (med: Medicine) => void }) {
  const { data: medicines, isLoading, isError, refetch } = useMedicines(parentId);
  const deleteMedicine = useDeleteMedicine();

  if (isLoading) {
    return <MedicationSkeleton />;
  }

  if (isError) {
    return <ErrorState title="Medicines are unavailable" onRetry={() => void refetch()} />;
  }

  if (!medicines?.length) {
    return (
      <EmptyState
        icon={Pill}
        title="No medicines yet"
        description="Add a parent's regular medicines so they get gentle reminders and you can track adherence."
        actionLabel="Add medicine"
        onAction={onAdd}
        className="py-14"
      />
    );
  }

  const scheduleSlots = [
    {
      id: "morning",
      label: "Morning",
      time: "08:00 AM",
      icon: Sunrise,
      accent: "text-amber-500 bg-amber-500/10 ring-amber-500/20",
      items: medicines.filter(
        (m) =>
          !m.time ||
          m.time.toLowerCase().includes("am") ||
          m.frequency?.toLowerCase().includes("morning") ||
          m.frequency?.toLowerCase().includes("once") ||
          m.frequency?.toLowerCase().includes("daily"),
      ),
    },
    {
      id: "afternoon",
      label: "Afternoon",
      time: "01:00 PM",
      icon: Sun,
      accent: "text-orange-500 bg-orange-500/10 ring-orange-500/20",
      items: medicines.filter(
        (m) =>
          (m.time?.toLowerCase().includes("pm") && !m.time?.toLowerCase().includes("night")) ||
          m.frequency?.toLowerCase().includes("afternoon") ||
          m.frequency?.toLowerCase().includes("twice") ||
          m.frequency?.toLowerCase().includes("three"),
      ),
    },
    {
      id: "evening",
      label: "Evening",
      time: "06:30 PM",
      icon: Sun,
      accent: "text-primary bg-primary/10 ring-primary/20",
      items: medicines.filter(
        (m) =>
          m.frequency?.toLowerCase().includes("evening") ||
          m.frequency?.toLowerCase().includes("three"),
      ),
    },
    {
      id: "night",
      label: "Bedtime",
      time: "09:30 PM",
      icon: Moon,
      accent: "text-indigo-500 bg-indigo-500/10 ring-indigo-500/20",
      items: medicines.filter(
        (m) =>
          m.time?.toLowerCase().includes("night") ||
          m.frequency?.toLowerCase().includes("night") ||
          m.frequency?.toLowerCase().includes("bedtime"),
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Daily Medication Schedule Carousel */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold tracking-[-0.01em] text-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" /> Daily Dosage Schedule
          </h2>
          <span className="text-xs font-medium text-muted-foreground">Swipe or scroll timeline</span>
        </div>

        <CardSlider itemClassName="w-[78vw] sm:w-[260px]" showDots gap="sm" ariaLabel="Daily dosage schedule">
          {scheduleSlots.map((slot) => {
            const SlotIcon = slot.icon;
            const hasMeds = slot.items.length > 0;
            return (
              <div
                key={slot.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 shadow-soft-xs",
                  hasMeds
                    ? "border-border/80 bg-card/95 hover:border-primary/30 hover:shadow-soft"
                    : "border-border/40 bg-card/50 opacity-75",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex size-8 items-center justify-center rounded-xl ring-1 ring-inset", slot.accent)}>
                      <SlotIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{slot.label}</p>
                      <p className="font-metric text-[11px] text-muted-foreground">{slot.time}</p>
                    </div>
                  </div>
                  <Badge variant={hasMeds ? "outline" : "muted"} className="text-[10px] px-2 py-0.5">
                    {hasMeds ? `${slot.items.length} med${slot.items.length > 1 ? "s" : ""}` : "None"}
                  </Badge>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px]">
                  {hasMeds ? (
                    <div className="space-y-1">
                      {slot.items.slice(0, 2).map((item) => (
                        <p key={item.id} className="truncate font-semibold text-foreground/90 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {item.name} {item.dosage && <span className="text-muted-foreground font-normal">({item.dosage})</span>}
                        </p>
                      ))}
                      {slot.items.length > 2 && (
                        <p className="text-[10px] text-primary font-medium">+{slot.items.length - 2} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground/75 italic">No medications due</p>
                  )}
                </div>
              </div>
            );
          })}
        </CardSlider>
      </div>

      {/* Prescriptions & Reminders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pt-2">
          <h2 className="font-heading text-sm font-semibold tracking-[-0.01em] text-foreground">
            All Prescriptions ({medicines.length})
          </h2>
          <span className="text-xs text-muted-foreground">Active medications</span>
        </div>
      {medicines.map((med, i) => {
        const color = colorOptions.find((c) => c.value === med.color) ?? colorOptions[0];
        return (
          <motion.div
            key={med.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 rounded-xl border border-border/70 bg-card/90 p-4 shadow-soft-xs transition-[border-color,box-shadow] hover:border-primary/20 hover:shadow-soft sm:p-5"
          >
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", color.class)}>
              <Pill className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                 <p className="font-heading text-base font-semibold text-foreground">{med.name}</p>
                {med.dosage && <Badge variant="muted">{med.dosage}</Badge>}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{med.frequency ?? "—"}</p>
              {med.instructions && <p className="mt-1 truncate text-xs text-muted-foreground/80">{med.instructions}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {med.time && (
                <span className="hidden items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-2 font-metric text-xs font-bold text-muted-foreground sm:flex">
                  <Clock className="h-3.5 w-3.5" /> {med.time}
                </span>
              )}
              <button
                onClick={() => onEdit(med)}
                 className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                aria-label={`Edit ${med.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  deleteMedicine.mutate(med.id, {
                    onSuccess: () => toast.success(`${med.name} removed`),
                    onError: () => toast.error("Could not remove medicine"),
                  });
                }}
                 className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/15"
                aria-label={`Remove ${med.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}

function MedicineDialog({
  open,
  onOpenChange,
  parentId,
  medicine,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  parentId: string;
  medicine: Medicine | null;
  onDone: () => void;
}) {
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const [name, setName] = useState(medicine?.name ?? "");
  const [dosage, setDosage] = useState(medicine?.dosage ?? "");
  const [frequency, setFrequency] = useState(medicine?.frequency ?? "");
  const [time, setTime] = useState(medicine?.time ?? "08:00");
  const [instructions, setInstructions] = useState(medicine?.instructions ?? "");
  const [color, setColor] = useState(medicine?.color ?? "brand");
  const submitting = createMedicine.isPending || updateMedicine.isPending;

  useEffect(() => {
    if (!open) return;
    setName(medicine?.name ?? "");
    setDosage(medicine?.dosage ?? "");
    setFrequency(medicine?.frequency ?? "");
    setTime(medicine?.time ?? "08:00");
    setInstructions(medicine?.instructions ?? "");
    setColor(medicine?.color ?? "brand");
  }, [medicine, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold">{medicine ? `Edit ${medicine.name}` : "Add a medicine"}</DialogTitle>
          <DialogDescription>
            {medicine ? "Update the details below." : "Add a medicine your parent takes regularly."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              toast.error("Medicine name is required");
              return;
            }
            const payload = { parent_id: parentId, name: name.trim(), dosage, frequency, instructions, time, color };
            if (medicine) {
              updateMedicine.mutate(
                { id: medicine.id, payload },
                {
                  onSuccess: () => {
                    toast.success("Medicine updated");
                    onDone();
                  },
                  onError: () => toast.error("Could not update medicine"),
                },
              );
            } else {
              createMedicine.mutate(payload, {
                onSuccess: () => {
                  toast.success(`${name.trim()} added`);
                  onDone();
                },
                onError: () => toast.error("Could not add medicine"),
              });
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="medicine-name" className="font-medium">Medicine name</Label>
            <Input id="medicine-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metformin" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="medicine-dosage" className="font-medium">Dosage</Label>
              <Input id="medicine-dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="500 mg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-time" className="font-medium">Time</Label>
              <Input id="medicine-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicine-frequency" className="font-medium">Frequency</Label>
            <Select value={frequency || undefined} onValueChange={setFrequency}>
              <SelectTrigger id="medicine-frequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                {(frequency && !frequencyOptions.includes(frequency) ? [frequency, ...frequencyOptions] : frequencyOptions).map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicine-instructions" className="font-medium">Instructions (optional)</Label>
            <Textarea id="medicine-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Take with food" className="min-h-[64px] rounded-xl" />
          </div>
          <div className="space-y-2">
<Label id="medicine-color-label" className="font-medium">Color tag</Label>
             <div className="flex gap-2.5" role="group" aria-labelledby="medicine-color-label">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                     "flex size-10 items-center justify-center rounded-xl border-2 transition-[border-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 motion-reduce:transform-none",
                     color === c.value ? "scale-105 border-primary shadow-soft" : "border-border opacity-80 hover:opacity-100",
                  )}
                   aria-label={c.label}
                   aria-pressed={color === c.value}
                >
                  <span className={cn("h-6 w-6 rounded-lg", c.swatch)} />
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              isLoading={submitting}
              loadingText={medicine ? "Saving changes…" : "Adding medicine…"}
            >
              {medicine ? "Save changes" : "Add medicine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
