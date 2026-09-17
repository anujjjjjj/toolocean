/**
 * Strings that are deliberately identical across content modules.
 *
 * scripts/check-content.mjs fails any 8-word phrase shared between two pages,
 * which is what keeps the authoring programme from becoming one template with
 * the nouns swapped. This file is the exception list, and it exists for the
 * cases where varying the wording would make the text worse rather than better.
 *
 * A measurement method line is the clearest example: the runs really were on the
 * same machine, the same browser and the same day, and writing that fact five
 * different ways to satisfy a duplicate checker would be inventing differences
 * that do not exist. One canonical description also means one place to update
 * when the corpus is re-measured.
 *
 * Add to this only for statements that are true in the same way everywhere.
 * "Free and easy to use" is not a candidate.
 */

/** Session S1 in docs/CONTENT_FIXTURES.md. */
export const MEASURED_S1 =
  "Measured by driving this page in headless Chrome 152 on an Apple M4 Pro running macOS 15.5, on 2026-09-17. The fixture is handed to the page's own file input, the page's own button is pressed, and the figure recorded is the size of the file the page produces. Timings come from a warm page on a fast machine with no network involved, so treat them as a floor rather than a typical result.";

export const SHARED_CONTENT_STRINGS: string[] = [MEASURED_S1];
