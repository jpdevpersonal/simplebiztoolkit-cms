/**
 * LockedBadge – small visual indicator rendered inside locked block NodeViews.
 *
 * Import and render in a NodeView whenever `node.attrs.locked === true`.
 */

/** Shows a small "🔒 Locked" chip with an optional tooltip. */
export function LockedBadge({ reason }: { reason?: string | null }) {
  return (
    <span
      title={
        reason
          ? `Locked: ${reason}`
          : "This block is locked and cannot be edited"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 7px",
        background: "#fef3c7",
        border: "1px solid #f59e0b",
        borderRadius: 3,
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "#92400e",
        cursor: "default",
        userSelect: "none",
        lineHeight: 1.6,
      }}
    >
      🔒 Locked
    </span>
  );
}
