/**
 * Line icons shared by the friendly page heroes, topic cards and action
 * panels. Pick explicitly by name or let `pickIconName` infer one from text.
 */

const iconPaths = {
  download: "M12 3v12m0 0-4-4m4 4 4-4M5 21h14",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h4",
  printer:
    "M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z",
  tablet:
    "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 15h2",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01",
  rocket:
    "M5 15c-1.5 1.3-2 4-2 4s2.7-.5 4-2m-2-2 4 4m-4-4c.6-3 2.5-6.5 6-9 2.5-1.8 5.5-2.5 7.5-2.5 0 2-.7 5-2.5 7.5-2.5 3.5-6 5.4-9 6m4-8.5h.01",
  briefcase:
    "M4 8h16v11H4zM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16",
  pen: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-11v6m0-9h.01",
  chart: "M3 17l5-5 4 4 8-8M14 8h6v6",
  receipt:
    "M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Zm2 5h6M9 12h6M9 16h4",
  table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14",
  book: "M5 4a2 2 0 0 1 2-2h11v18H7a2 2 0 0 0-2 2V4Zm0 16a2 2 0 0 1 2-2h11M9 7h6M9 11h6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  bag: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  tool: "M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.8-.7-.7-2.8 2.5-2.5Z",
} as const;

export type PageIconName = keyof typeof iconPaths;

/** Most specific keywords first. */
const iconRules: Array<[RegExp, PageIconName]> = [
  [/guest|email/i, "mail"],
  [/grey|gray|processing|wait/i, "clock"],
  [/not start|doesn.t start|does not start|won.t/i, "refresh"],
  [/cannot find|can.t find|missing|find the order/i, "search"],
  [/getting started|start here|basics/i, "rocket"],
  [/licen[cs]|commercial|business use/i, "briefcase"],
  [/custom|edit|personalis|personaliz/i, "pen"],
  [/refund|support|still stuck|contact|message/i, "chat"],
  [/csv|spreadsheet|report/i, "table"],
  [/estimate|quote|invoice|receipt/i, "receipt"],
  [/profit|calculat|fee|margin/i, "chart"],
  [/print/i, "printer"],
  [/digital|tablet|goodnotes|ipad/i, "tablet"],
  [/format|software|open|file|pdf/i, "file"],
  [/about|what is|template/i, "info"],
  [/download|find/i, "download"],
];

export function pickIconName(text: string): PageIconName {
  return iconRules.find(([re]) => re.test(text))?.[1] ?? "help";
}

export default function PageIcon({
  name,
  size = 22,
}: {
  name: PageIconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}
