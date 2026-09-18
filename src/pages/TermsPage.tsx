import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { buildInfoPageGraph } from "@/lib/sitePageSchema";
import { INFO_PAGE_SEO } from "@/data/staticPageSeo";
import { InfoPageLayout, P, Section, UL } from "@/components/layout/InfoPageLayout";

/**
 * Terms of use.
 *
 * Plain-language and deliberately short. The service is free, takes no accounts
 * and holds no user data, so most of what a standard SaaS ToS covers does not
 * apply here and has been left out rather than padded in.
 *
 * Two clauses are intentionally absent because they need a decision only the
 * owner can make: a contact address and a governing-law jurisdiction.
 */
const LAST_UPDATED = "18 August 2026";

const TermsPage = () => {
  useSEO({ ...INFO_PAGE_SEO["/terms"], path: "/terms" });

  return (
    <InfoPageLayout
      title="Terms of Use"
      intro="ToolOcean is free to use with no account. These terms cover what you can expect from it, and what it does not promise."
      lastUpdated={LAST_UPDATED}
    >
      <Section id="acceptance" heading="Using the site">
        <P>
          By using ToolOcean you agree to these terms. If you do not agree with them, please do not
          use the site. There is nothing to cancel and no account to close, closing the tab is
          sufficient.
        </P>
      </Section>

      <Section id="free" heading="The service is free and provided as is">
        <P>
          Every tool is free to use, for personal or commercial work, with no attribution required
          and no limit on how much you process. There is no paid tier.
        </P>
        <P>
          In exchange, the site is provided <strong className="text-foreground">as is</strong> and{" "}
          <strong className="text-foreground">without warranties of any kind</strong>, express or
          implied. That includes any implied warranty of merchantability, fitness for a particular
          purpose, or non-infringement. No promise is made that a tool is free of defects, that it
          will be available at any given moment, or that its output is correct for your purpose.
        </P>
      </Section>

      <Section id="your-files" heading="Your files are your responsibility">
        <P>
          Tools run in your browser and operate on files you select. Because processing happens on
          your own device, you keep full control of your data, and full responsibility for it.
        </P>
        <UL>
          <li>
            Keep your own backups. Several tools produce a modified file; none of them can recover
            an original you have overwritten.
          </li>
          <li>
            Check important output before relying on it. A compressed PDF, a converted spreadsheet
            or a trimmed audio file should be reviewed, particularly for legal, financial or
            archival use.
          </li>
          <li>
            You are responsible for having the right to process the files you use, and for
            complying with any law that applies to their contents.
          </li>
        </UL>
      </Section>

      <Section id="acceptable" heading="Acceptable use">
        <P>You agree not to use the site to:</P>
        <UL>
          <li>break any applicable law, or infringe anyone's rights;</li>
          <li>
            attack, overload or interfere with the site, its hosting, or the third-party services it
            depends on;
          </li>
          <li>
            direct the HTTP Request Composer at systems you have no authorisation to send requests
            to. That tool sends requests wherever you point it, and that choice is yours alone.
          </li>
        </UL>
      </Section>

      <Section id="liability" heading="Limitation of liability">
        <P>
          To the fullest extent permitted by law, the maintainer of ToolOcean is not liable for any
          indirect, incidental, special or consequential loss arising from your use of the site.
          That expressly includes lost, corrupted or overwritten files, lost profits, and lost time.
        </P>
        <P>
          Some jurisdictions do not allow certain warranty exclusions or liability limits, so parts
          of the two sections above may not apply to you.
        </P>
      </Section>

      <Section id="third-party" heading="Third-party services">
        <P>
          A few tools rely on external services to function at all, and the site loads fonts and
          analytics from third parties. Those services have their own terms, and their behaviour is
          outside the maintainer's control. Which tools these are, and exactly what each transmits,
          is set out in the{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </P>
      </Section>

      <Section id="ip" heading="Intellectual property">
        <P>
          The ToolOcean name, design and source code belong to their author. Anything{" "}
          <em>you</em> produce with the tools is entirely yours. No licence to your content is
          claimed, granted or needed, since your content never reaches the site's operator.
        </P>
      </Section>

      <Section id="changes" heading="Changes">
        <P>
          These terms may be updated as the site changes. The date above shows the last revision,
          and continuing to use the site after a change means accepting the revised terms.
        </P>
      </Section>
    </InfoPageLayout>
  );
};

export default TermsPage;
