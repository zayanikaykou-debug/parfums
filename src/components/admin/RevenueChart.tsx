import { useState } from 'react';
import { formatTnd, useStore } from '../../context/StoreContext';

interface Point {
  label: string;
  date: string;
  revenue: number;
  orders: number;
}

export function RevenueChart({ data }: { data: Point[] }) {
  const { t } = useStore();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[#F7F4EE]/50">
        {t.admin.chart.noData}
      </div>
    );
  }

  const maxRev = Math.max(100, ...data.map((d) => d.revenue));
  const width = 760;
  const height = 240;
  const padX = 36;
  const padTop = 20;
  const padBottom = 32;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const coords = data.map((d, i) => {
    const x =
      data.length === 1 ? padX + plotW / 2 : padX + (i / (data.length - 1)) * plotW;
    const y = padTop + plotH - (d.revenue / maxRev) * plotH;
    return { x, y, ...d };
  });

  const linePath = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
    padTop + plotH
  ).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const hovered = hoveredIdx !== null ? coords[hoveredIdx] : null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4 min-h-[24px]">
        <p className="text-xs text-[#F7F4EE]/60">
          {t.admin.chart.title}
        </p>
        {hovered ? (
          <div className="text-xs tabular-nums text-[#E8CFA0]">
            {hovered.label} · {formatTnd(hovered.revenue)} ({hovered.orders} {t.admin.chart.cmdShort})
          </div>
        ) : (
          <div className="text-xs text-[#F7F4EE]/45">
            {t.admin.chart.hoverHint}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-60 overflow-visible"
        role="img"
        aria-label={t.admin.chart.ariaLabel}
      >
        <defs>
          <linearGradient id="zephorGoldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF6E" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#D4AF6E" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padTop + plotH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="rgba(212, 175, 110, 0.1)"
                strokeDasharray="3 3"
              />
              <text
                x={padX - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#F7F4EE]/40 text-[10px]"
              >
                {Math.round(maxRev * t)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#zephorGoldGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="#D4AF6E"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((pt, i) => {
          const showLabel =
            data.length <= 10 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0;
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={pt.date}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={pt.x - 14}
                y={padTop}
                width={28}
                height={plotH + padBottom}
                fill="transparent"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5.5 : 3.2}
                fill={isHovered ? '#F7F4EE' : '#D4AF6E'}
                stroke="#060B17"
                strokeWidth="1.5"
              />
              {showLabel && (
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-[#F7F4EE]/45 text-[10px]"
                >
                  {pt.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
