import { LegalPageLayout } from '@/components/legal-page-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Data Aggregation Model</CardTitle>
            <CardDescription>How we handle your health data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              Evexia operates as a <strong>pass-through data aggregator</strong>
              . This means:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>No permanent storage:</strong> Your medical records are
                fetched from connected sources in real-time and displayed to
                you. We do not maintain a permanent copy of your health records.
              </li>
              <li>
                <strong>Session-based access:</strong> Data is retrieved when
                you log in and is not retained after your session ends.
              </li>
              <li>
                <strong>Source of truth:</strong> Your original healthcare
                providers remain the authoritative source for your medical
                records.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What We Collect</CardTitle>
            <CardDescription>Information we do store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              While we don't store your medical records, we do collect minimal
              operational data:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Email address:</strong> Used for OTP (one-time password)
                authentication to verify your identity
              </li>
              <li>
                <strong>Session data:</strong> Temporary authentication tokens
                to keep you logged in during your session
              </li>
              <li>
                <strong>Access logs:</strong> Records of when providers accessed
                your data via share tokens, for your security and transparency
              </li>
              <li>
                <strong>AI summaries:</strong> Generated summaries are cached to
                improve performance and avoid redundant processing
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What We Don't Do</CardTitle>
            <CardDescription>Our data commitments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>No selling of data:</strong> We do not sell, rent, or
                trade your personal information or health data to any third
                parties
              </li>
              <li>
                <strong>No third-party sharing:</strong> Your data is not shared
                with advertisers, data brokers, or analytics companies
              </li>
              <li>
                <strong>No advertising:</strong> We do not display ads or use
                your data for targeted advertising purposes
              </li>
              <li>
                <strong>No profiling:</strong> We do not build behavioral
                profiles or track you across services
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Processing</CardTitle>
            <CardDescription>How AI summaries are generated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>When you request an AI-generated health summary:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                Your health records are sent to an AI provider (OpenRouter API)
                for processing
              </li>
              <li>
                The AI provider processes the request and returns a summary
              </li>
              <li>
                <strong>No retention by AI provider:</strong> According to our
                agreement, the AI provider does not retain your data after
                processing
              </li>
              <li>
                <strong>Cached locally:</strong> Generated summaries are cached
                in our system to avoid re-processing identical requests
              </li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              If AI features are disabled or unavailable, a rule-based fallback
              system generates summaries locally without external API calls.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider Access</CardTitle>
            <CardDescription>When you share your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              You control who can access your health data through share tokens:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>You create tokens:</strong> Only you can generate access
                tokens for your data
              </li>
              <li>
                <strong>Time-limited:</strong> Tokens expire after a period you
                specify
              </li>
              <li>
                <strong>Revocable:</strong> You can revoke access at any time
              </li>
              <li>
                <strong>Logged:</strong> All provider access is logged and
                visible to you in your access history
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>Demo environment notice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              This is a demonstration environment. Data retention policies in
              this demo context:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>Demo accounts and data may be reset periodically</li>
              <li>
                Access logs and cached summaries are retained for the duration
                of the demo
              </li>
              <li>
                This environment should not be used for actual medical data
                management
              </li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              In a production environment, a comprehensive data retention policy
              would be established in compliance with applicable healthcare
              regulations (such as HIPAA in the United States).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Questions about privacy</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed">
            <p>
              For questions about this privacy policy or our data practices,
              please reach out through the project's GitHub repository or
              contact the development team directly.
            </p>
          </CardContent>
        </Card>
      </div>
    </LegalPageLayout>
  )
}
