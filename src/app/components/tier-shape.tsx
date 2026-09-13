import type { Tier } from "@/lib/types";

interface TierShapeProps {
  tier: Tier;
  className?: string;
  // "sign" marks a whole result; "row" marks a single piece of evidence.
  use: "sign" | "row";
}

// Each tier has its own road-sign shape so the meaning never depends on colour.
export function TierShape({ tier, className, use }: TierShapeProps) {
  if (tier === "red") {
    return (
      <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
        <polygon
          points="14,2 34,2 46,14 46,34 34,46 14,46 2,34 2,14"
          fill="#c8102e"
          stroke="#fff"
          strokeWidth="3"
        />
        <rect x="21.5" y="10" width="5" height="19" rx="2" fill="#fff" />
        <circle cx="24" cy="36" r="3.2" fill="#fff" />
      </svg>
    );
  }

  if (tier === "amber") {
    return (
      <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
        <polygon
          points="24,2 46,24 24,46 2,24"
          fill="#ffcd00"
          stroke="#1c2226"
          strokeWidth="3"
        />
        <rect x="21.5" y="12" width="5" height="16" rx="2" fill="#1c2226" />
        <circle cx="24" cy="34" r="3" fill="#1c2226" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="6"
        fill="#1f4e8c"
        stroke="#fff"
        strokeWidth="3"
      />
      {use === "sign" ? (
        <>
          <circle cx="21" cy="21" r="9" fill="none" stroke="#fff" strokeWidth="4" />
          <path d="m28 28 9 9" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="24" cy="13" r="3.2" fill="#fff" />
          <rect x="21.5" y="19" width="5" height="17" rx="2" fill="#fff" />
        </>
      )}
    </svg>
  );
}
