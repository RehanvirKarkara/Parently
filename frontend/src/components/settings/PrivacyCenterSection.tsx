import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  HeartPulse,
  Loader2,
  Lock,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ConsentItem,
  PoliciesResponse,
  deleteUserAccount,
  deleteUserData,
  exportUserData,
  fetchConsentStatus,
  fetchPolicies,
  grantConsent,
  withdrawConsent,
} from "@/api/privacy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/authStore";

export function PrivacyCenterSection() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [policiesData, setPoliciesData] = useState<PoliciesResponse | null>(null);
  const [activeConsents, setActiveConsents] = useState<string[]>([]);
  const [consentItems, setConsentItems] = useState<ConsentItem[]>([]);
  const [showProcessors, setShowProcessors] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Delete Data Modal state
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [deleteDataScope, setDeleteDataScope] = useState<"health_and_activity" | "notifications" | "all_records">("health_and_activity");
  const [deleteDataPassword, setDeleteDataPassword] = useState("");
  const [deleteDataSubmitting, setDeleteDataSubmitting] = useState(false);

  // Delete Account Modal state
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState("");
  const [deleteAccountSubmitting, setDeleteAccountSubmitting] = useState(false);

  const loadPrivacyState = async () => {
    setLoading(true);
    try {
      const [policies, consents] = await Promise.all([
        fetchPolicies().catch(() => null),
        fetchConsentStatus().catch(() => null),
      ]);
      if (policies) setPoliciesData(policies);
      if (consents) {
        setActiveConsents(consents.active_types);
        setConsentItems(consents.consents);
      }
    } catch (err) {
      console.error("Failed to load privacy status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivacyState();
  }, []);

  const handleToggleConsent = async (consentType: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await withdrawConsent(consentType, "User toggled off in Privacy Center");
        setActiveConsents((prev) => prev.filter((t) => t !== consentType));
        toast.success(`Consent for ${consentType.replace(/_/g, " ")} has been withdrawn.`);
      } else {
        await grantConsent(consentType, "v1.0");
        setActiveConsents((prev) => [...prev, consentType]);
        toast.success(`Consent for ${consentType.replace(/_/g, " ")} granted.`);
      }
      await loadPrivacyState();
    } catch (err: any) {
      toast.error(err.message || "Failed to update consent preference");
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await exportUserData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `parently_data_export_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Your personal data export has been downloaded.");
    } catch (err: any) {
      toast.error(err.message || "Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteDataSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!deleteDataPassword) {
      toast.error("Please enter your current password to confirm deletion.");
      return;
    }
    setDeleteDataSubmitting(true);
    try {
      await deleteUserData(deleteDataPassword, deleteDataScope);
      toast.success("Selected data records have been successfully purged.");
      setDeleteDataOpen(false);
      setDeleteDataPassword("");
      await loadPrivacyState();
    } catch (err: any) {
      toast.error(err.message || "Incorrect password or failed to delete records.");
    } finally {
      setDeleteDataSubmitting(false);
    }
  };

  const handleDeleteAccountSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (deleteAccountConfirm.trim() !== "DELETE") {
      toast.error('You must type "DELETE" to confirm account erasure.');
      return;
    }
    if (!deleteAccountPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    setDeleteAccountSubmitting(true);
    try {
      await deleteUserAccount(deleteAccountPassword, "DELETE");
      toast.success("Your account and associated personal data have been permanently deleted.");
      setDeleteAccountOpen(false);
      logout();
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Account deletion failed. Verify your password.");
    } finally {
      setDeleteAccountSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Center Header Card */}
      <Card className="border-border/60 shadow-soft bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Privacy & Security Center</CardTitle>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Manage your consents, export personal data, review third-party processors, and exercise your privacy rights.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPrivacyState}
              disabled={loading}
              className="gap-1.5 text-xs rounded-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* YOUR DATA OVERVIEW */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-primary" />
              Your Data Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl border border-border/50 bg-background/60">
                <div className="font-semibold text-foreground">Profile & Account</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{user?.email ?? "Credentials & profile"}</div>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-background/60">
                <div className="font-semibold text-foreground">Family Circle</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Relationships & roles</div>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-background/60">
                <div className="font-semibold text-foreground">Health & Logs</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Check-ins & medications</div>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-background/60">
                <div className="font-semibold text-foreground">Device Tokens</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Push reminder endpoints</div>
              </div>
            </div>
          </div>

          {/* YOUR CONSENT CONTROLS */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Your Privacy & Consents
              </span>
              <span className="text-[10px] text-muted-foreground font-normal lowercase">
                {consentItems.length} active ledger records
              </span>
            </h3>

            <div className="divide-y divide-border/40 text-xs">
              {/* Terms of Service */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>Terms of Service Acknowledgement</span>
                    <span className="text-[10px] text-muted-foreground font-normal">(v1.0 - Required)</span>
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Governs platform access and acceptable caregiving use.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Accepted</span>
                  <Switch checked={true} disabled aria-label="Terms of Service accepted" />
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>Privacy Policy & Data Processing</span>
                    <span className="text-[10px] text-muted-foreground font-normal">(v1.0 - Required)</span>
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Authorizes storage of self-reported family wellness entries.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Accepted</span>
                  <Switch checked={true} disabled aria-label="Privacy policy accepted" />
                </div>
              </div>

              {/* AI & RAG Processing */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>AI Care Assistant & Semantic Search</span>
                    <span className="text-[10px] text-primary font-medium">(Optional)</span>
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Allows Groq LLM and ChromaDB embeddings to generate care digests and answers.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={activeConsents.includes("ai_processing")}
                    onCheckedChange={(checked) => handleToggleConsent("ai_processing", !checked)}
                    aria-label="Toggle AI processing consent"
                  />
                </div>
              </div>

              {/* Marketing / Care Updates */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>Caregiving Updates & Product Guides</span>
                    <span className="text-[10px] text-primary font-medium">(Optional)</span>
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Receive educational wellness tips and platform notifications.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={activeConsents.includes("marketing")}
                    onCheckedChange={(checked) => handleToggleConsent("marketing", !checked)}
                    aria-label="Toggle marketing consent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LEGAL POLICIES & DISCLOSURES LINKS */}
          <div className="pt-2 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Legal Policies & Disclosures
            </h3>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <Link
                to="/privacy-policy"
                target="_blank"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Privacy Policy</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>

              <Link
                to="/terms"
                target="_blank"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Terms of Service</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>

              <Link
                to="/medical-disclaimer"
                target="_blank"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-foreground">Medical Disclaimer</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>

              <Link
                to="/ai-data-processing"
                target="_blank"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">AI & Data Processing</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>

              <Link
                to="/cookie-policy"
                target="_blank"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors sm:col-span-2"
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-foreground">Cookie & Local Storage Policy</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* THIRD-PARTY PROCESSORS ACCORDION */}
          <div className="pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => setShowProcessors(!showProcessors)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-primary" />
                <span>Active Third-Party Sub-Processors ({policiesData?.third_party_services.length ?? 6})</span>
              </div>
              {showProcessors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showProcessors && policiesData?.third_party_services && (
              <div className="mt-3 space-y-2.5 pt-2 border-t border-border/30">
                {policiesData.third_party_services.map((svc) => (
                  <div
                    key={svc.name}
                    className="p-3 rounded-xl border border-border/50 bg-background/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{svc.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {svc.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <strong>Purpose:</strong> {svc.purpose}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <strong>Data Involved:</strong> {svc.data_involved}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS: DATA EXPORT & DELETION */}
          <div className="pt-4 border-t border-border/40 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Data Management & Rights
            </h3>

            <div className="grid sm:grid-cols-3 gap-3">
              {/* Download My Data */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={exporting}
                className="w-full justify-center gap-2 text-xs rounded-xl h-10 border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-primary" />}
                <span>{exporting ? "Generating Export…" : "Download My Data"}</span>
              </Button>

              {/* Delete Selected Records */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDataOpen(true)}
                className="w-full justify-center gap-2 text-xs rounded-xl h-10 border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Specific Data</span>
              </Button>

              {/* Delete Account */}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteAccountOpen(true)}
                className="w-full justify-center gap-2 text-xs rounded-xl h-10"
              >
                <XCircle className="w-4 h-4" />
                <span>Delete Account</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG: SELECTIVE DATA DELETION */}
      <Dialog open={deleteDataOpen} onOpenChange={setDeleteDataOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Selective Data Deletion
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select which categories of historical personal data you would like to purge without closing your account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeleteDataSubmit} className="space-y-4 pt-2">
            <div className="space-y-2 text-xs">
              <Label className="font-semibold text-foreground">Select Deletion Scope</Label>
              <div className="space-y-2">
                <label className="flex items-start gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-muted/30 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={deleteDataScope === "health_and_activity"}
                    onChange={() => setDeleteDataScope("health_and_activity")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-foreground">Daily check-ins & health logs</div>
                    <div className="text-[11px] text-muted-foreground">Purges self-reported logs and sleep metrics.</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-muted/30 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={deleteDataScope === "notifications"}
                    onChange={() => setDeleteDataScope("notifications")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-foreground">Notifications & reminders history</div>
                    <div className="text-[11px] text-muted-foreground">Purges historical delivered notification alerts.</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-muted/30 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={deleteDataScope === "all_records"}
                    onChange={() => setDeleteDataScope("all_records")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-foreground">All health records & medications</div>
                    <div className="text-[11px] text-muted-foreground">Purges check-ins, prescriptions, and reports.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Confirm with your password</Label>
              <Input
                type="password"
                placeholder="Enter your current password"
                value={deleteDataPassword}
                onChange={(e) => setDeleteDataPassword(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteDataOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={deleteDataSubmitting || !deleteDataPassword}
              >
                {deleteDataSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {deleteDataSubmitting ? "Purging records…" : "Confirm Deletion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ACCOUNT DELETION */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-destructive">
              <ShieldAlert className="w-5 h-5" />
              Permanently Delete Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action is permanent and cannot be undone. All your personal data, memberships, health logs, and consents will be permanently erased.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeleteAccountSubmit} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1 leading-normal">
              <strong>Family ownership safeguard:</strong> If you are the creator of a family group with other active members, family management will be safely transferred to another active family member before your profile is deleted.
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Your Current Password</Label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Type <span className="font-mono text-destructive font-bold">DELETE</span> to confirm
              </Label>
              <Input
                type="text"
                placeholder="DELETE"
                value={deleteAccountConfirm}
                onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteAccountOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={deleteAccountSubmitting || deleteAccountConfirm.trim() !== "DELETE" || !deleteAccountPassword}
              >
                {deleteAccountSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {deleteAccountSubmitting ? "Deleting account…" : "Permanently Delete Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
