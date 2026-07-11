"use client";

function polygonToRoundedPath(points: string, radius: number): string {
  const coords = points.split(" ").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x, y };
  });
  if (coords.length < 3) return "";

  const getVector = (
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    return { dx: dx / len, dy: dy / len, len };
  };

  let path = "";
  for (let i = 0; i < coords.length; i++) {
    const prev = coords[(i - 1 + coords.length) % coords.length];
    const curr = coords[i];
    const next = coords[(i + 1) % coords.length];
    const v1 = getVector(curr, prev);
    const v2 = getVector(curr, next);
    const r = Math.min(radius, v1.len / 2, v2.len / 2);
    const p1 = { x: curr.x + v1.dx * r, y: curr.y + v1.dy * r };
    const p2 = { x: curr.x + v2.dx * r, y: curr.y + v2.dy * r };
    if (i === 0) {
      path = `M ${p1.x},${p1.y}`;
    } else {
      path += ` L ${p1.x},${p1.y}`;
    }
    path += ` Q ${curr.x},${curr.y} ${p2.x},${p2.y}`;
  }
  return `${path} Z`;
}

export function LogoMark({ size = 45 }: { size?: number }) {
  const starPoints =
    "41,33 42.25,36.75 46,38 42.25,39.25 41,43 39.75,39.25 36,38 39.75,36.75";
  return (
    <svg
      viewBox="-2 -2 62 62"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <g>
        <path
          fill="#0ea5e9"
          d={polygonToRoundedPath("0,22.032 17.064,31.032 58.064,10.032", 1.5)}
        />
        <path
          fill="#38bdf8"
          d={polygonToRoundedPath(
            "24.064,35.032 20.064,48.032 58.064,10.032",
            1.5
          )}
        />
        <path
          fill="#7dd3fc"
          d={polygonToRoundedPath(
            "17.064,31.032 24.064,35.032 44.064,48.032 58.064,10.032",
            1.5
          )}
        />
        <path
          fill="#bae6fd"
          d={polygonToRoundedPath(
            "24.064,35.032 20.127,48.032 17.064,31.032 58.064,10.032",
            1.5
          )}
        />
      </g>
      <defs>
        <clipPath id="shell-star-tr-bl">
          <polygon points="41,33 46,38 41,38" />
          <polygon points="41,38 36,38 41,43" />
        </clipPath>
      </defs>
      <polygon fill="#ffffff" points={starPoints} />
      <polygon
        fill="#ffffff"
        points={starPoints}
        clipPath="url(#shell-star-tr-bl)"
      />
    </svg>
  );
}