import { LegalLayout } from "./LegalLayout";

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      badge="User Agreement"
      version="1.0"
      effectiveDate="September 27, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Agreement to Terms</h2>
        <p>
          By creating an account, accessing, or using Parently (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Description of the Service</h2>
        <p>
          Parently is a care-management and family communication platform designed to assist families in tracking wellness check-ins, medication routines, and daily activities of aging family members.
        </p>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-normal">
          <strong>Non-Clinical Platform Notice:</strong> Parently is not a medical device, medical emergency response system, or licensed healthcare provider. The platform is intended solely for personal communication and organizational purposes.
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Account Eligibility & Responsibilities</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Age:</strong> You must be at least 18 years of age or possess legal capacity in your jurisdiction to create an account.</li>
          <li><strong>Account Security:</strong> You are responsible for safeguarding your credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access.</li>
          <li><strong>Accuracy:</strong> You agree to provide accurate and complete registration and profile information.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Family Roles & Parent Authorization</h2>
        <p>
          Parently operates with distinct user roles to respect autonomy and privacy:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Family Owner / Caregiver:</strong> Coordinates the family circle and manages invitations. Family owners do not obtain unilateral rights over an adult parent&rsquo;s data without the parent&rsquo;s explicit authorization.</li>
          <li><strong>Parent / Senior Member:</strong> Maintains ownership of personal health and check-in entries. When accepting an invitation, the parent explicitly grants data-sharing scopes (e.g. check-ins, medications, reports) and may adjust or revoke authorization at any time.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Acceptable Use Policy</h2>
        <p>You agree not to use Parently to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>Impersonate any person or misrepresent your relationship with an aging family member.</li>
          <li>Enter misleading, harmful, or unlawful health information.</li>
          <li>Attempt to reverse engineer, decompile, or breach security perimeters of the application or APIs.</li>
          <li>Bypass rate limits or initiate denial-of-service attacks.</li>
          <li>Rely on the platform during clinical emergencies.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. AI-Generated Output & Disclaimers</h2>
        <p>
          Features that incorporate artificial intelligence, such as automated summaries and care advice responses, rely on statistical models. You acknowledge that AI output may occasionally contain inaccuracies, hallucinations, or incomplete guidance. You must independently evaluate AI suggestions and verify clinical decisions with a physician.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">7. Disclaimers & Limitation of Liability</h2>
        <p className="text-xs uppercase text-muted-foreground font-semibold">
          PLEASE READ THIS SECTION CAREFULLY AS IT LIMITS THE LIABILITY OF PARENTLY.
        </p>
        <p className="text-sm">
          THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, PARENTLY AND ITS AFFILIATES DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p className="text-sm">
          IN NO EVENT SHALL PARENTLY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM OR RELATING TO YOUR ACCESS OR INABILITY TO ACCESS THE SERVICE OR RELIANCE UPON HEALTH-RELATED SUMMARIES.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">8. Termination & Account Erasure</h2>
        <p>
          You may terminate your agreement and erase your account at any time via the Privacy Center. We reserve the right to suspend or terminate accounts that violate these Terms or present security risks to other users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">9. Governing Law & Jurisdiction</h2>
        <p className="text-sm">
          These Terms shall be governed by and construed in accordance with applicable governing laws. Any dispute arising under these Terms shall be resolved in the competent courts having jurisdiction over the platform&rsquo;s principal place of business.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">10. Contact Information</h2>
        <p className="text-sm">
          For legal inquiries or questions regarding these Terms, contact:{" "}
          <a href="mailto:privacy@parently.app" className="font-semibold underline text-primary">
            privacy@parently.app
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
