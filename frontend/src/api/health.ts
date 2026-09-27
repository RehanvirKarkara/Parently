import { apiRequest, mockDelay, USE_MOCK } from "@/api/client";
import { mockDb } from "@/api/mockDb";
import { todayISO } from "@/lib/utils";
import type { HealthLog, Medicine, TimeOfDay } from "@/types";

export async function getHealthLogs(parentId?: string): Promise<HealthLog[]> {
  if (USE_MOCK) {
    await mockDelay(300);
    const logs = parentId ? mockDb.healthLogs.filter((l) => l.parent_id === parentId) : mockDb.healthLogs;
    return [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
  }
  return apiRequest<HealthLog[]>(parentId ? `/parents/${parentId}/health-logs` : "/health-logs");
}

export async function getHealthLog(parentId: string, date: string, period: TimeOfDay): Promise<HealthLog | null> {
  if (USE_MOCK) {
    await mockDelay(150);
    return mockDb.healthLogs.find((l) => l.parent_id === parentId && l.log_date === date && l.log_time_of_day === period) ?? null;
  }
  return apiRequest<HealthLog | null>(`/parents/${parentId}/health-logs/${date}/${period}`);
}

export interface CheckInPayload {
  parent_id: string;
  log_date: string;
  log_time_of_day: TimeOfDay;
  hours_slept?: number | null;
  meds_taken?: boolean | null;
  breakfast_details?: string | null;
  lunch_details?: string | null;
  steps_walked_afternoon?: number | null;
  workout_details?: string | null;
  snacks_dinner_details?: string | null;
  steps_walked_evening?: number | null;
  day_rating?: number | null;
}

export async function submitCheckIn(payload: CheckInPayload): Promise<HealthLog> {
  if (USE_MOCK) {
    await mockDelay(600);
    const existing = mockDb.healthLogs.find(
      (l) => l.parent_id === payload.parent_id && l.log_date === payload.log_date && l.log_time_of_day === payload.log_time_of_day,
    );
    const base: HealthLog = {
      id: existing?.id ?? `log-${payload.parent_id}-${payload.log_date}-${payload.log_time_of_day}`,
      parent_id: payload.parent_id,
      log_date: payload.log_date,
      log_time_of_day: payload.log_time_of_day,
      hours_slept: null,
      meds_taken: null,
      breakfast_details: null,
      lunch_details: null,
      steps_walked_afternoon: null,
      workout_details: null,
      snacks_dinner_details: null,
      steps_walked_evening: null,
      day_rating: null,
      created_at: existing?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const merged: HealthLog = { ...base, ...payload };
    if (existing) {
      const idx = mockDb.healthLogs.findIndex((l) => l.id === existing.id);
      mockDb.healthLogs[idx] = merged;
    } else {
      mockDb.healthLogs.push(merged);
    }
    return merged;
  }
  return apiRequest<HealthLog>("/health-logs", { method: "POST", body: payload });
}

export async function getMedicines(parentId?: string): Promise<Medicine[]> {
  if (USE_MOCK) {
    await mockDelay(260);
    const meds = parentId ? mockDb.medicines.filter((m) => m.parent_id === parentId) : mockDb.medicines;
    return meds.filter((m) => m.is_active).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }
  return apiRequest<Medicine[]>(parentId ? `/parents/${parentId}/medicines` : "/medicines");
}

export interface MedicinePayload {
  parent_id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  time?: string;
  color?: string;
}

export async function createMedicine(payload: MedicinePayload): Promise<Medicine> {
  if (USE_MOCK) {
    await mockDelay(500);
    const med: Medicine = {
      id: `med-${Date.now().toString(36)}`,
      parent_id: payload.parent_id,
      name: payload.name,
      dosage: payload.dosage ?? null,
      frequency: payload.frequency ?? null,
      instructions: payload.instructions ?? null,
      start_date: todayISO(),
      end_date: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      time: payload.time ?? "08:00",
      color: payload.color ?? "brand",
    };
    mockDb.medicines.push(med);
    return med;
  }
  return apiRequest<Medicine>("/medicines", { method: "POST", body: payload });
}

export async function updateMedicine(id: string, payload: Partial<MedicinePayload>): Promise<Medicine> {
  if (USE_MOCK) {
    await mockDelay(450);
    const idx = mockDb.medicines.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error("Medicine not found.");
    mockDb.medicines[idx] = { ...mockDb.medicines[idx], ...payload, updated_at: new Date().toISOString() };
    return mockDb.medicines[idx];
  }
  return apiRequest<Medicine>(`/medicines/${id}`, { method: "PATCH", body: payload });
}

export async function deleteMedicine(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await mockDelay(400);
    const idx = mockDb.medicines.findIndex((m) => m.id === id);
    if (idx >= 0) {
      mockDb.medicines[idx].is_active = false;
      mockDb.medicines[idx].updated_at = new Date().toISOString();
    }
    return { success: true };
  }
  return apiRequest("/medicines/" + id, { method: "DELETE" });
}
