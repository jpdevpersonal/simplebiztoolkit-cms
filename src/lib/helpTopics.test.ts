import { describe, expect, it } from "vitest";
import { addHelpTopicAnchors } from "./helpTopics";

describe("addHelpTopicAnchors", () => {
  it("adds ids to h3 headings and returns them as topics", () => {
    const { html, topics } = addHelpTopicAnchors(
      `<h2>Intro</h2><div><h3 style="color:red">Where to find <strong>your</strong> download</h3><p>x</p></div><h3>Still stuck?</h3>`,
    );

    expect(topics).toEqual([
      { id: "help-where-to-find-your-download", title: "Where to find your download" },
      { id: "help-still-stuck", title: "Still stuck?" },
    ]);
    expect(html).toContain(
      `<h3 id="help-where-to-find-your-download" style="color:red">`,
    );
    expect(html).toContain(`<h3 id="help-still-stuck">Still stuck?</h3>`);
    expect(html).toContain("<h2>Intro</h2>");
  });

  it("keeps existing ids and de-duplicates generated ones", () => {
    const { topics } = addHelpTopicAnchors(
      `<h3 id="custom">Printing</h3><h3>Printing</h3><h3>Printing</h3><h3>  </h3>`,
    );

    expect(topics.map((t) => t.id)).toEqual([
      "custom",
      "help-printing",
      "help-printing-2",
    ]);
  });
});
