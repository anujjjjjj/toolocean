import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { buildInfoPageGraph } from "@/lib/sitePageSchema";
import { INFO_PAGE_SEO } from "@/data/staticPageSeo";
import { Code, InfoPageLayout, P, Section, UL } from "@/components/layout/InfoPageLayout";

/**
 * Privacy policy.
 *
 * Written against what the code actually does, not against the marketing line.
 * Two things in particular are disclosed rather than glossed over:
 *
 *   - Three tools genuinely do make network requests (dns-lookup, ip-address,
 *     http-request-composer). "Nothing ever leaves your device" is true of every
 *     file-processing tool and false of those three, so they are named.
 *   - index.html loads webfonts from Google's CDN, which discloses the visitor's
 *     IP to Google on every page. That is a third-party request and belongs here.
 *
 * If a tool is added that transmits anything, this page has to change with it.
 */
const LAST_UPDATED = "18 August 2026";

const PrivacyPage = () => {
  useSEO({ ...INFO_PAGE_SEO["/privacy"], path: "/privacy" });

  return (
    <InfoPageLayout
      title="Privacy Policy"
      intro="ToolOcean has no backend to process your files, so for almost every tool there is nothing to collect. This page sets out the exceptions precisely rather than making a blanket claim."
      lastUpdated={LAST_UPDATED}
    >
      <Section id="short" heading="The short version">
        <UL>
          <li>
            Your files, documents, images, audio and pasted text are processed entirely in your
            browser. They are never uploaded, because there is no server that could receive them.
          </li>
          <li>Three tools do make network requests. They are named below.</li>
          <li>No account, no sign-up, and no advertising or tracking cookies.</li>
          <li>
            Anonymous usage analytics run only if you accept them. Declining costs you nothing.
          </li>
        </UL>
      </Section>

      <Section id="files" heading="Your files and text">
        <P>
          Every tool in the PDF, image, audio, video, CSV, spreadsheet, compression, archive and
          converter categories runs as JavaScript inside the page you are already looking at. The
          file you choose is read into your browser's memory, worked on there, and handed back to
          you as a download. It does not travel anywhere.
        </P>
        <P>
          A practical consequence: once the page has loaded, these tools keep working with your
          network disconnected. That is the clearest proof of the claim — a tool that needed a
          server would stop.
        </P>
      </Section>

      <Section id="exceptions" heading="The three tools that do use the network">
        <P>
          These cannot work without a network request, so using them means data leaves your
          device. Every other tool on the site does not.
        </P>
        <UL>
          <li>
            <strong className="text-foreground">DNS Lookup</strong> — the domain name you enter is
            sent to Google's public DNS-over-HTTPS resolver at <Code>dns.google</Code> to be
            resolved. Google receives the domain you looked up and your IP address.
          </li>
          <li>
            <strong className="text-foreground">IP Address Lookup</strong> — calls{" "}
            <Code>ipapi.co</Code> and <Code>api.ipify.org</Code> to discover your public IP and its
            approximate location. Those services necessarily see your IP address. Looking up
            someone else's IP sends that address to them instead.
          </li>
          <li>
            <strong className="text-foreground">HTTP Request Composer</strong> — sends a request to
            whatever URL you type, which is the entire point of the tool. Anything you put in the
            URL, headers or body goes to that destination. Nothing is routed through ToolOcean.
          </li>
        </UL>
      </Section>

      <Section id="local" heading="What is stored on your device">
        <P>
          Three values are kept in your browser's <Code>localStorage</Code>. They stay on your
          machine and are readable only by this site. Clearing your browser storage removes all of
          them.
        </P>
        <UL>
          <li>
            <Code>toolOcean.history</Code> — a short local list of tools you have used, so recent
            work is easy to return to. Capped at the last 100 entries.
          </li>
          <li>
            <Code>toolOcean.analyticsConsent</Code> — whether you accepted or declined analytics,
            so you are not asked again.
          </li>
          <li>
            <Code>darkMode</Code> — your light or dark theme preference.
          </li>
        </UL>
      </Section>

      <Section id="analytics" heading="Analytics">
        <P>
          ToolOcean uses Google Analytics 4 to count visits and see which tools get used. It is
          configured conservatively:
        </P>
        <UL>
          <li>
            Storage consent defaults to <em>denied</em>. Until you press Accept, no analytics
            cookie or identifier is stored on your device.
          </li>
          <li>
            Advertising signals are denied permanently, including after you accept. There are no
            ads and no remarketing on this site, so that permission is never requested.
          </li>
          <li>
            What is recorded: the page visited, its title, and two interaction events — that a tool
            was used, and which control was pressed. That means a tool's name, such as{" "}
            <Code>json-formatter</Code>, and a button label, such as <Code>Beautify</Code>.
          </li>
          <li>
            What is never recorded: anything you type, paste or open. The content of your work is
            not part of any event, by design.
          </li>
        </UL>
        <P>
          Google acts as the data processor for this analytics data and receives your IP address as
          part of any request to it. You can decline on the banner, or use any tracker blocker —
          the tools all work identically either way.
        </P>
      </Section>

      <Section id="third-party" heading="Hosting and other third parties">
        <UL>
          <li>
            <strong className="text-foreground">Vercel</strong> hosts the site. Like any web host it
            processes the requests needed to serve pages, and its edge network logs standard request
            metadata including IP addresses.
          </li>
          <li>
            <strong className="text-foreground">Google Fonts</strong> serves the two typefaces the
            site uses, loaded from Google's CDN. Because the request goes to Google's servers, your
            IP address is disclosed to Google when a page loads.
          </li>
        </UL>
      </Section>

      <Section id="children" heading="Children">
        <P>
          The site is a set of general-purpose utilities and is not directed at children. No
          personal information is knowingly collected from anyone, of any age.
        </P>
      </Section>

      <Section id="changes" heading="Changes to this policy">
        <P>
          If a tool is added that transmits data, this page is updated in the same change. The date
          above reflects the last revision. For more on how the site is built and why it works this
          way, see <Link to="/about" className="text-primary underline underline-offset-4">About</Link>.
        </P>
      </Section>
    </InfoPageLayout>
  );
};

export default PrivacyPage;
