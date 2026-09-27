import { LegalLayout } from "./LegalLayout";

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      badge="Transparency & Trust"
      version="1.0"
      effectiveDate="September 27, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Introduction & Overview</h2>
        <p>
          Parently is a family care coordination and wellness monitoring platform designed to help adult children and caregivers support aging parents through routine daily check-ins, medication tracking, wellness trends, and intelligent reminders.
        </p>
        <p>
          We believe that health and family data is deeply personal. This Privacy Policy describes how Parently collects, uses, stores, shares, and protects your information, as well as the choices and rights you have over your personal records.
        </p>
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-normal">
          <strong>Important Notice:</strong> This document describes the actual technical behavior and data architecture of Parently. Parently makes no claim of legal certification under specific regional regimes (e.g., HIPAA, GDPR, DPDP) unless an independent verification has been conducted. Where applicable, statutory compliance provisions are subject to periodic legal review.
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
        <p>We collect information that you directly provide to us, as well as information generated during your use of the platform:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>
            <strong>Account Information:</strong> Name, email address, password hash, phone number, and optional profile avatar color.
          </li>
          <li>
            <strong>Family & Member Information:</strong> Family group name, creator identity, invited member emails, relationship tags, and role permissions.
          </li>
          <li>
            <strong>Health & Care Information (Self-Reported):</strong> Daily check-ins (sleep hours, medication adherence, meal logs, physical activity notes, overall day rating), medical conditions, allergies, date of birth, blood group, and emergency contact details.
          </li>
          <li>
            <strong>Medications & Schedules:</strong> Medication names, dosages, frequencies, administration instructions, and scheduled reminder times.
          </li>
          <li>
            <strong>Engagement & Legacy Information:</strong> Responses to family quiz questions, shared memories, and recorded life stories.
          </li>
          <li>
            <strong>Device & Notification Data:</strong> Browser push notification tokens (FCM device registration tokens), notification delivery records, and delivery preference toggles.
          </li>
          <li>
            <strong>Technical & Log Data:</strong> Internet Protocol (IP) address, user agent, timestamps of consent actions, and anonymized performance metrics.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. How We Use Your Information</h2>
        <p>We use your information exclusively for care support, service delivery, and safety purposes:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>Facilitating family communication, check-in visibility, and peace of mind.</li>
          <li>Sending medication alerts, check-in prompts, and care reminders via push notifications and email.</li>
          <li>Generating weekly care summaries and health trend overviews.</li>
          <li>Powering the conversational AI assistant to answer caregiving questions and summarize wellness patterns.</li>
          <li>Maintaining an immutable audit ledger of consent and sensitive account events.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Artificial Intelligence (AI) & RAG Processing</h2>
        <p>
          Parently utilizes modern Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG) to provide conversational assistance and wellness insights.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>
            <strong>Provider:</strong> Cloud LLM inference is powered via the Groq API (utilizing open models such as Llama 3.3 and Qwen).
          </li>
          <li>
            <strong>Vector Search:</strong> Contextual retrieval uses Nomic text embeddings stored in a local ChromaDB instance to find relevant past check-in snippets.
          </li>
          <li>
            <strong>Privacy Safeguard:</strong> Queries sent to AI inference endpoints contain only the necessary context for the immediate response. User data is not used by third-party model providers to train foundation models.
          </li>
          <li>
            <strong>User Control:</strong> You can withdraw consent for AI processing at any time through the Privacy Center in Settings.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Third-Party Service Providers</h2>
        <p>Parently integrates only with service providers essential to application functionality:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-border/60">
            <thead className="bg-muted/60 text-foreground font-semibold">
              <tr>
                <th className="p-2.5 border border-border/60">Provider</th>
                <th className="p-2.5 border border-border/60">Purpose</th>
                <th className="p-2.5 border border-border/60">Data Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="p-2.5 border border-border/60 font-medium">Groq API</td>
                <td className="p-2.5 border border-border/60">AI inference and care assistant responses</td>
                <td className="p-2.5 border border-border/60">Ephemeral query and check-in prompt snippets</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-border/60 font-medium">ChromaDB / Nomic AI</td>
                <td className="p-2.5 border border-border/60">Semantic vector retrieval (RAG)</td>
                <td className="p-2.5 border border-border/60">Health log embeddings</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-border/60 font-medium">Brevo (Sendinblue)</td>
                <td className="p-2.5 border border-border/60">Transactional email (OTPs, invites)</td>
                <td className="p-2.5 border border-border/60">Email address and verification codes</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-border/60 font-medium">Upstash Redis</td>
                <td className="p-2.5 border border-border/60">Celery task broker & rate limiting</td>
                <td className="p-2.5 border border-border/60">Transient reminder task IDs and IP rate limits</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-border/60 font-medium">Firebase FCM</td>
                <td className="p-2.5 border border-border/60">Web push notifications</td>
                <td className="p-2.5 border border-border/60">Device push tokens and notification snippets</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Data Retention, Export, and Deletion Rights</h2>
        <p>You maintain full control over the personal information associated with your account:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>
            <strong>Download My Data:</strong> You may at any time request an export of your personal profile, family associations, health check-ins, medication logs, and consent records in structured JSON format via the Privacy Center.
          </li>
          <li>
            <strong>Selective Data Deletion:</strong> You can purge specific subsets of records (e.g. historical check-ins, notifications) without deleting your account.
          </li>
          <li>
            <strong>Account Deletion:</strong> You can permanently erase your account. This cascades and irreversibly removes your personal information, consents, session tokens, and health logs.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">7. Security Safeguards</h2>
        <p>
          We implement technical and organizational security controls including salted PBKDF2/bcrypt password hashing, short-lived JWT authentication, HTTPS transit encryption, role-based authorization barriers, and automated audit logging of sensitive actions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">8. Policy Updates & Contact</h2>
        <p>
          When material changes are made to this policy, we will update the version number and prompt users for updated acknowledgement upon their next sign-in.
        </p>
        <p className="text-sm">
          If you have questions, grievances, or formal data requests, contact our Privacy & Governance Team at:{" "}
          <a href="mailto:privacy@parently.app" className="font-semibold underline text-primary">
            privacy@parently.app
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
