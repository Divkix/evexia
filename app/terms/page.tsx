import { LegalPageLayout } from '@/components/legal-page-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>What We Are</CardTitle>
            <CardDescription>Understanding Evexia's role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              Evexia is a <strong>medical data aggregator</strong>. We display
              health records that are retrieved from connected healthcare
              sources such as hospitals, clinics, and laboratories.
            </p>
            <p>
              Think of us as a window into your distributed health data. We pull
              information together from multiple sources so you can see it in
              one place, but we do not originate or permanently store this data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What We Are Not</CardTitle>
            <CardDescription>Important distinctions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Not a healthcare provider:</strong> We do not diagnose,
                treat, or provide medical care of any kind.
              </li>
              <li>
                <strong>Not a diagnostic tool:</strong> The data displayed is
                for informational purposes only and should not be used to make
                medical decisions.
              </li>
              <li>
                <strong>Not a replacement for medical advice:</strong> Always
                consult qualified healthcare professionals for any health
                concerns.
              </li>
              <li>
                <strong>Not a permanent medical record:</strong> We aggregate
                and display data in real-time; we are not the system of record.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Content Disclaimer</CardTitle>
            <CardDescription>
              Understanding AI summaries and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p className="rounded-md bg-muted p-4 font-medium">
              {MEDICAL_DISCLAIMER}
            </p>
            <p>
              Our AI features are designed to help you understand your data:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                AI summaries are generated automatically based on your health
                records
              </li>
              <li>
                These summaries may contain errors, omissions, or
                misinterpretations
              </li>
              <li>
                Always verify AI-generated content against original records
              </li>
              <li>
                Never make health decisions based solely on AI-generated content
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
            <CardDescription>Use at your own discretion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              This service is provided <strong>"as is"</strong> without any
              warranties, express or implied. We make no guarantees about:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                The accuracy, completeness, or timeliness of aggregated data
              </li>
              <li>The availability or reliability of connected data sources</li>
              <li>The correctness of AI-generated summaries or insights</li>
              <li>
                The suitability of this service for any particular purpose
              </li>
            </ul>
            <p className="mt-4">
              By using this service, you acknowledge that you do so at your own
              risk. We are not liable for any decisions made or actions taken
              based on information displayed through this platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Responsibilities</CardTitle>
            <CardDescription>
              Your obligations when using Evexia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <ul className="list-inside list-disc space-y-2">
              <li>
                Keep your account credentials secure and do not share access
                with others
              </li>
              <li>
                Verify the accuracy of displayed data against original sources
              </li>
              <li>
                Use share tokens responsibly and only with trusted healthcare
                providers
              </li>
              <li>
                Consult healthcare professionals for any medical concerns or
                decisions
              </li>
              <li>
                Report any errors or discrepancies you notice in your data
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </LegalPageLayout>
  )
}
