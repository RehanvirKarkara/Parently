import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Crown, Gamepad2, Mail, RefreshCw, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import * as familiesApi from "@/api/families";
import { useFamily, useFamilyMembers, useLegacyAnswers, useParents, useResendParentInvite } from "@/hooks/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { useAuthStore } from "@/stores/authStore";
import { relativeTime } from "@/lib/utils";
import { FamilySkeleton } from "@/components/shared/RichSkeletons";

export function FamilyPage() {
  const { data: family, isLoading: familyLoading, isError: familyError, refetch: refetchFamily } = useFamily();
  const { data: parents, isLoading: parentsLoading, isError: parentsError, refetch: refetchParents } = useParents();
  const { data: legacyAnswers, isError: legacyError, refetch: refetchLegacy } = useLegacyAnswers();
  const user = useAuthStore((s) => s.user);
  const resendInvite = useResendParentInvite();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [siblingEmail, setSiblingEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const pendingParents = parents?.filter((p) => !p.is_active) ?? [];
  const activeParents = parents?.filter((p) => p.is_active) ?? [];

  if (familyLoading || parentsLoading) {
    return <FamilySkeleton />;
  }

  if (familyError || parentsError || legacyError) {
    return (
      <ErrorState
        title="Your care circle is unavailable"
        onRetry={() => {
          void refetchFamily();
          void refetchParents();
          void refetchLegacy();
        }}
      />
    );
  }

  const sendSiblingInvite = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siblingEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    setIsSending(true);
    try {
      const res = await familiesApi.inviteSibling(siblingEmail);
      if (res.dev_code) toast.info(`Dev mode — sibling code ${res.dev_code}`);
      else toast.success(`Invitation sent to ${siblingEmail}`);
      setSiblingEmail("");
      setInviteOpen(false);
    } catch {
      toast.error("Unable to send invitation");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Care circle"
        title={family?.name ?? "Family"}
        description="Everyone who cares, together — members, shared memories, and a little fun."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite sibling
          </Button>
        }
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Family members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MemberRow name={`${user?.first_name} ${user?.last_name}`} email={user?.email} badge="You · Organizer" badgeColor="default" color="brand" />
            <SiblingsList />
            {activeParents.map((p) => (
              <MemberRow key={p.id} name={`${p.first_name} ${p.last_name}`} email={p.email} badge="Parent" badgeColor="mint" color={p.avatar_color} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingParents.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No pending parent invitations.</p>
            ) : (
              pendingParents.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/20 bg-warning/8 p-4">
                  <PersonAvatar first={p.first_name} last={p.last_name} color={p.avatar_color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{p.first_name} {p.last_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <Badge variant="warning">Awaiting OTP</Badge>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      resendInvite.mutate(p.id, {
                        onSuccess: (res) => {
                          if (res.dev_code) toast.info(`Dev mode — new code ${res.dev_code}`);
                          else toast.success("Invitation resent");
                        },
                        onError: () => toast.error("Could not resend"),
                      });
                    }}
                    aria-label="Resend invitation"
                  >
                    <RefreshCw className={`h-4 w-4 ${resendInvite.isPending && resendInvite.variables === p.id ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              ))
            )}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/35 p-4">
              <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Parents accept their invitation with the 6-digit code sent to their email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-4 w-4 text-primary" /> Legacy memories
            </CardTitle>
            <Badge variant="muted">{legacyAnswers?.length ?? 0} shared</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {!legacyAnswers?.length ? (
              <EmptyState
                icon={BookOpen}
                title="No memories shared yet"
                description="When parents answer their life-story questions, their answers land here."
                className="py-10"
              />
            ) : (
              (legacyAnswers ?? []).slice(0, 3).map((a, i) => {
                const parent = parents?.find((p) => p.id === a.parent_id);
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl border border-border/60 bg-card/70 p-4 transition-colors hover:border-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      <PersonAvatar first={parent?.first_name} last={parent?.last_name} color={parent?.avatar_color} size="sm" />
                      <div>
                         <p className="text-xs font-semibold text-foreground">{parent?.first_name}'s memory</p>
                         <p className="text-[0.6875rem] text-muted-foreground">{relativeTime(a.answered_at)}</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-foreground/90 italic line-clamp-3">"{a.answer_text}"</p>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 shadow-soft">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/8 blur-3xl" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Gamepad2 className="h-4 w-4 text-accent" /> Family Bonding Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Answer fun questions about Mom and Dad's life, compare your guesses, and see who knows
              the family best. New questions land every few days.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">3 of 5 questions answered this round</span>
            </div>
             <Button className="mt-5" variant="accent" asChild>
              <Link to="/family/quiz">Play the quiz</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <InviteSiblingDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        email={siblingEmail}
        setEmail={setSiblingEmail}
        onSend={sendSiblingInvite}
        isSending={isSending}
      />
    </div>
  );
}

function SiblingsList() {
  const { data: members } = useFamilyMembers();
  const user = useAuthStore((s) => s.user);
  const { data: familyUsers } = useQuery({
    queryKey: ["family-users"],
    queryFn: () => familiesApi.getFamilyUsers(),
  });

  return (
    <>
      {members
        ?.filter((m) => m.user_id !== user?.id)
        .map((m) => {
          const u = familyUsers?.find((fu) => fu.id === m.user_id);
          return <MemberRow key={m.id} name={`${u?.first_name} ${u?.last_name}`} email={u?.email} badge="Sibling" badgeColor="coral" color={u?.avatar_color} />;
        })}
    </>
  );
}

function MemberRow({
  name,
  email,
  badge,
  badgeColor,
  color,
}: {
  name: string;
  email?: string;
  badge: string;
  badgeColor: "default" | "mint" | "coral" | "warning";
  color?: string;
}) {
  const badgeClass = {
    default: "solid",
    mint: "success",
    coral: "accent",
    warning: "warning",
  }[badgeColor] as "solid" | "success" | "accent" | "warning";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/65 p-3.5 shadow-soft-xs transition-[border-color,background-color] hover:border-primary/20 hover:bg-card">
      <PersonAvatar first={name.split(" ")[0]} last={name.split(" ")[1]} color={color} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
          {name}
          {badgeColor === "default" && <Crown className="h-3.5 w-3.5 text-warning-foreground" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <Badge variant={badgeClass}>{badge}</Badge>
    </div>
  );
}

function InviteSiblingDialog({
  open,
  onOpenChange,
  email,
  setEmail,
  onSend,
  isSending = false,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  email: string;
  setEmail: (e: string) => void;
  onSend: () => void;
  isSending?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold">Invite a sibling</DialogTitle>
          <DialogDescription>Send an invite to a sibling's email so they can join the care circle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="sib-email" className="font-semibold">Sibling's email</Label>
          <Input id="sib-email" type="email" placeholder="sibling@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={onSend}
            isLoading={isSending}
            loadingText="Sending invite…"
          >
            <UserPlus className="h-4 w-4" /> Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
