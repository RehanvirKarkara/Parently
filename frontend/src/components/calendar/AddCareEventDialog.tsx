import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCalendarStore } from "@/stores/calendarStore";
import { CATEGORY_META } from "@/lib/calendarHelpers";
import type { CareEventCategory } from "@/types/calendar";

interface AddCareEventDialogProps {
  parentId: string;
  parentName?: string;
  editEventId?: string | null;
  onClose: () => void;
}

export function AddCareEventDialog({
  parentId,
  parentName,
  editEventId,
  onClose,
}: AddCareEventDialogProps) {
  const { isAddModalOpen, selectedDate, events, addEvent, updateEvent } =
    useCalendarStore();

  const isEditing = Boolean(editEventId);
  const editingEvent = events.find((e) => e.id === editEventId);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CareEventCategory>("reminder");
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [dosage, setDosage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setCategory(editingEvent.category);
      setDate(editingEvent.date);
      setStartTime(editingEvent.startTime);
      setEndTime(editingEvent.endTime ?? "");
      setDetails(editingEvent.details ?? "");
      setLocation(editingEvent.location ?? "");
      setDoctorName(editingEvent.doctorName ?? "");
      setDosage(editingEvent.dosage ?? "");
    } else {
      setTitle("");
      setCategory("reminder");
      setDate(selectedDate);
      setStartTime("09:00");
      setEndTime("");
      setDetails("");
      setLocation("");
      setDoctorName("");
      setDosage("");
    }
  }, [editingEvent, selectedDate, isAddModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for the event");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editEventId) {
        updateEvent(editEventId, {
          title: title.trim(),
          category,
          date,
          startTime,
          endTime: endTime.trim() || undefined,
          details: details.trim() || undefined,
          location: location.trim() || undefined,
          doctorName: doctorName.trim() || undefined,
          dosage: dosage.trim() || undefined,
        });
        toast.success(`Updated "${title}"`);
      } else {
        addEvent({
          parentId,
          title: title.trim(),
          category,
          status: "scheduled",
          date,
          startTime,
          endTime: endTime.trim() || undefined,
          details: details.trim() || undefined,
          location: location.trim() || undefined,
          doctorName: doctorName.trim() || undefined,
          dosage: dosage.trim() || undefined,
          source: "manual",
        });
        toast.success(`Added "${title}" to ${parentName ?? "parent"}'s calendar`);
      }
      onClose();
    } catch {
      toast.error("Could not save calendar event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isAddModalOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-border/70 bg-card/95 backdrop-blur-2xl shadow-soft-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Care Event" : `Add Care Event for ${parentName ?? "Parent"}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Schedule an appointment, medication, activity, or health reminder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-xs font-semibold">
              Event Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event-title"
              placeholder="e.g. Dr. Patel Cardiology Visit, Blood Glucose Check..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="event-category" className="text-xs font-semibold">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as CareEventCategory)}
            >
              <SelectTrigger id="event-category" className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {(Object.keys(CATEGORY_META) as CareEventCategory[]).map((catKey) => {
                  const meta = CATEGORY_META[catKey];
                  const Icon = meta.icon;
                  return (
                    <SelectItem key={catKey} value={catKey} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{meta.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="event-date" className="text-xs font-semibold">
                Date
              </Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-start-time" className="text-xs font-semibold">
                Start Time
              </Label>
              <Input
                id="event-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-end-time" className="text-xs font-semibold">
                End Time <span className="text-muted-foreground font-normal">(Opt)</span>
              </Label>
              <Input
                id="event-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Conditional Fields based on Category */}
          {category === "medication" && (
            <div className="space-y-1.5">
              <Label htmlFor="event-dosage" className="text-xs font-semibold">
                Dosage & Frequency Instructions
              </Label>
              <Input
                id="event-dosage"
                placeholder="e.g. 500 mg with breakfast"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}

          {category === "appointment" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-doctor" className="text-xs font-semibold">
                  Physician / Specialist
                </Label>
                <Input
                  id="event-doctor"
                  placeholder="e.g. Dr. Evelyn Reed, MD"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-location" className="text-xs font-semibold">
                  Clinic / Location
                </Label>
                <Input
                  id="event-location"
                  placeholder="e.g. St. Mary's Clinic, Suite 410"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Notes / Details */}
          <div className="space-y-1.5">
            <Label htmlFor="event-details" className="text-xs font-semibold">
              Care Notes & Instructions <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="event-details"
              placeholder="Add relevant instructions, preparation (e.g. fasting, transportation), or monitoring notes..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="rounded-xl resize-none text-xs leading-relaxed"
            />
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
              {isEditing ? "Save Changes" : "Add to Calendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
