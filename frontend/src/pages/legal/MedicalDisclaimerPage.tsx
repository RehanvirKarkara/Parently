import { LegalLayout } from "./LegalLayout";
import { AlertTriangle, HeartPulse, PhoneCall, Stethoscope } from "lucide-react";

export function MedicalDisclaimerPage() {
  return (
    <LegalLayout
      title="Medical & Clinical Disclaimer"
      badge="Health & Safety"
      version="1.0"
      effectiveDate="September 27, 2026"
    >
      {/* Emergency Callout */}
      <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
          <PhoneCall className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1 text-sm text-red-950 dark:text-red-200">
          <h3 className="font-bold text-base text-red-700 dark:text-red-300">
            Emergency Situations: Call Emergency Services Immediately
          </h3>
          <p>
            Parently is <strong>NOT an emergency response service</strong> and cannot dispatch emergency medical personnel. If your loved one is experiencing chest pain, difficulty breathing, sudden weakness, severe injury, or any life-threatening condition, immediately dial your local emergency services (such as 911, 112, or local paramedics) or go to the nearest emergency room.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h2>1. Not a Substitute for Professional Medical Advice</h2>
        </div>
        <p>
          Parently is an informal health-logging and family coordination platform. The content provided through the platform—including daily check-in ratings, sleep graphs, medication schedules, care tips, and automated health summaries—is intended strictly for informational and organizational purposes.
        </p>
        <p>
          Nothing contained within Parently should be considered medical advice, medical diagnosis, clinical evaluation, or treatment guidance. Always seek the advice of a qualified physician, nurse practitioner, or licensed healthcare professional with any questions you may have regarding a medical condition.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2>2. Artificial Intelligence (AI) Output Limitations</h2>
        </div>
        <p>
          Parently features an intelligent AI care assistant that analyzes conversation prompts and past health check-in notes to provide family caregivers with organized overviews and suggestions.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Statistical Inaccuracies:</strong> Large Language Models generate text based on probabilistic patterns and may produce incomplete, obsolete, or incorrect information.</li>
          <li><strong>No Doctor-Patient Relationship:</strong> Using Parently or communicating with the AI care assistant does not establish a doctor-patient, fiduciary, or healthcare provider relationship.</li>
          <li><strong>Independent Verification:</strong> Never adjust prescription medication dosages, discontinue treatments, or start new therapeutic regimens based on AI outputs or summaries without prior consultation with a licensed prescribing physician.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <HeartPulse className="w-5 h-5 text-rose-500" />
          <h2>3. Medication Management Safeguards</h2>
        </div>
        <p>
          While Parently offers medication reminders, users remain entirely responsible for ensuring medications are administered according to proper clinical instructions. Parently is not liable for missed reminders, device battery depletion, push notification delivery failures, or discrepancies in dosage schedules.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. No Exaggerated Medical Claims</h2>
        <p>
          Parently makes no clinical efficacy claims and does not guarantee health improvements, fall prevention, cure of ailments, or prolongation of life. It serves as an assistive family management utility to streamline communication between elders and their caregivers.
        </p>
      </section>
    </LegalLayout>
  );
}
