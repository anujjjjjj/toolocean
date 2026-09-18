import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { buildInfoPageGraph } from "@/lib/sitePageSchema";
import { INFO_PAGE_SEO } from "@/data/staticPageSeo";
import { Code, InfoPageLayout, P, Section, UL } from "@/components/layout/InfoPageLayout";

/**
 * About page.
 *
 * Exists mainly to close the E-E-A-T gap flagged in docs/SEO.md: a named person
 * accountable for the site, and a concrete explanation of how it works. Vague
 * "we are passionate about tools" copy would add nothing, the specifics are the
 * whole point, because they are checkable.
 *
 * Every number here is verifiable from the repository rather than asserted:
 * the tool count comes from the catalog, the bundle sizes from the build output
 * recorded in docs/SEO.md.
 */
const AboutPage = () => {
  useSEO({
    ...INFO_PAGE_SEO["/about"],
    path: "/about",
    jsonLd: [buildInfoPageGraph("/about")].filter(Boolean),
  });

  return (
    <InfoPageLayout
      title="About ToolOcean"
      intro="114 browser tools that do their work on your device instead of on someone's server."
    >
      <Section id="what" heading="What this is">
        <P>
          ToolOcean is a collection of 114 free utilities across ten categories, developer tools,
          PDF, image, audio, video, CSV, spreadsheet, compression, archive and format converters.
          There is no account, no upload step, no watermark, no daily quota and no paid tier.
        </P>
        <P>
          It is maintained by <strong className="text-foreground">Anuj Kabra</strong>, who writes and
          runs all of it.
        </P>
      </Section>

      <Section id="why" heading="Why nothing gets uploaded">
        <P>
          Most online file tools work by taking your document, sending it to a server, processing it
          there and sending something back. That design means a stranger's machine holds your
          contract, your ID scan or your company's spreadsheet, however briefly, and you have only
          a privacy policy's word about what happens next.
        </P>
        <P>
          Browsers have been able to do this work locally for years. They can read files, decode
          images, decompress archives, parse spreadsheets and process audio without asking a server
          for help. ToolOcean is built on that: the page loads once, and after that every tool runs
          as JavaScript on your own machine.
        </P>
        <P>
          The test is simple. Load a tool, disconnect from the internet, and use it. It still works,
          because the code that does the job is already on your device. A server-backed tool cannot
          pass that test.
        </P>
        <P>
          Three tools are exceptions, because their entire function is a network request, DNS
          Lookup, IP Address Lookup and the HTTP Request Composer. They are named individually in
          the{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          rather than hidden behind a blanket claim.
        </P>
      </Section>

      <Section id="how" heading="How it is built">
        <P>
          React and TypeScript, bundled with Vite, using established libraries for the heavy work:
          pdf-lib and PDF.js for documents, SheetJS for spreadsheets, JSZip for archives, and the
          browser's own Canvas and Web Audio APIs for images and sound.
        </P>
        <UL>
          <li>
            Every one of the 125 pages is prerendered to static HTML at build time, so the content
            is present before any JavaScript runs, better for slow connections, and for anything
            that reads the page without executing scripts.
          </li>
          <li>
            Each tool is a separate bundle, loaded only when you open it. Opening one tool does not
            download the other 113. The shared entry bundle is about 130 kB compressed.
          </li>
          <li>
            No analytics or fonts block the page from rendering, and the analytics tag is only
            fetched once the page is already interactive.
          </li>
        </UL>
      </Section>

      <Section id="money" heading="How it is funded">
        <P>
          It isn't, currently. There are no ads, no affiliate links, no sponsored placements and
          nothing for sale. Running costs are low precisely because there is no backend doing the
          processing. The site is static files on a CDN, and your device does the work.
        </P>
        <P>
          If that ever changes, this page will say so plainly, and the{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          will change with it before anything else does.
        </P>
      </Section>

      <Section id="accuracy" heading="On accuracy">
        <P>
          The tools are useful but not infallible. Compression re-encodes images, format conversion
          discards what the target format cannot represent, and a CSV parser has to guess at
          ambiguous input. Where a tool makes a trade-off like that, its page says so in the FAQ
          rather than leaving you to discover it.
        </P>
        <P>
          Keep your originals, and check anything that matters before you rely on it. That advice
          applies to every tool of this kind, including this one.
        </P>
      </Section>

      <Section id="start" heading="Where to start">
        <P>
          Press <Code>Cmd</Code>+<Code>K</Code> anywhere on the site to search all 114 tools, or
          browse the categories from the footer. The most fully documented tool is the{" "}
          <Link to="/json-formatter" className="text-primary underline underline-offset-4">
            JSON Formatter
          </Link>
          , which covers the awkward cases most formatters skip, large-integer precision loss,
          duplicate keys, and how key ordering actually behaves.
        </P>
      </Section>
    </InfoPageLayout>
  );
};

export default AboutPage;
