import { useEffect } from "react";
import { resolveSeo, type SeoInput } from "@/lib/seoHead";

export type SEOOptions = SeoInput;

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

/**
 * Keeps the document head in sync with the active route.
 *
 * On a prerendered page the correct tags are already in the HTML, so the first
 * pass is a no-op overwrite with identical values. Its real job is client-side
 * navigation, where no new document is fetched and nothing else would update the
 * title, canonical, or structured data.
 *
 * Values come from resolveSeo() — the same function the build-time prerender
 * uses — so the static HTML and the runtime DOM cannot disagree.
 */
export function useSEO(options: SEOOptions) {
  const { title, description, path, keywords, image, noindex, jsonLd } = options;

  useEffect(() => {
    const seo = resolveSeo({ title, description, path, keywords, image, noindex, jsonLd });

    document.title = seo.fullTitle;
    setCanonical(seo.canonical);

    for (const [name, content] of Object.entries(seo.metaByName)) {
      upsertMeta("name", name, content);
    }
    for (const [property, content] of Object.entries(seo.metaByProperty)) {
      upsertMeta("property", property, content);
    }

    /*
     * Structured data is replaced wholesale rather than patched. The prerender
     * stamps its own blocks with the same data-seo-jsonld attribute, so a
     * prerendered graph is swapped exactly once here instead of leaving a
     * duplicate alongside the freshly-created one.
     */
    document.querySelectorAll("script[data-seo-jsonld]").forEach((node) => node.remove());
    const created: HTMLScriptElement[] = [];
    for (const schema of seo.jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      created.push(script);
    }

    return () => created.forEach((script) => script.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, noindex, JSON.stringify(keywords), JSON.stringify(jsonLd)]);
}
