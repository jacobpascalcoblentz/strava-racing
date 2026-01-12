"use client";

interface Props {
  distance: number; // meters
  elevationGain: number; // meters
  averageGrade: number; // percentage
  climbCategory?: number;
}

export function ElevationProfile({ distance, elevationGain, averageGrade, climbCategory }: Props) {
  // Calculate profile points
  const width = 200;
  const height = 60;
  const padding = 10;

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // Create a simple climb profile
  // Start at bottom left, climb to top right based on grade
  const startX = padding;
  const startY = height - padding;
  const endX = width - padding;

  // Calculate end Y based on elevation gain ratio
  const maxElevation = Math.max(elevationGain, 50); // minimum 50m for visibility
  const elevationRatio = Math.min(elevationGain / maxElevation, 1);
  const endY = padding + innerHeight * (1 - elevationRatio);

  // Create a smooth curve path
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - (averageGrade > 5 ? 10 : 5); // Slight curve for steeper climbs

  const pathD = `M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`;

  // Fill area under the curve
  const fillD = `${pathD} L ${endX} ${height - padding} L ${startX} ${height - padding} Z`;

  // Color based on climb category/grade
  const getGradientColors = () => {
    if (climbCategory === 1) return ["#ef4444", "#dc2626"]; // Red - HC/Cat 1
    if (climbCategory === 2) return ["#f97316", "#ea580c"]; // Orange - Cat 2
    if (climbCategory === 3) return ["#eab308", "#ca8a04"]; // Yellow - Cat 3
    if (climbCategory === 4) return ["#84cc16", "#65a30d"]; // Lime - Cat 4
    if (climbCategory === 5) return ["#22c55e", "#16a34a"]; // Green - Cat 5
    if (averageGrade > 8) return ["#ef4444", "#dc2626"];
    if (averageGrade > 5) return ["#f97316", "#ea580c"];
    if (averageGrade > 3) return ["#eab308", "#ca8a04"];
    return ["#3b82f6", "#2563eb"]; // Blue - flat
  };

  const [colorStart, colorEnd] = getGradientColors();
  const gradientId = `elev-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colorEnd} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Background grid lines */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {/* Fill area */}
        <path
          d={fillD}
          fill={`url(#${gradientId})`}
        />

        {/* Profile line */}
        <path
          d={pathD}
          fill="none"
          stroke={colorEnd}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Start point */}
        <circle cx={startX} cy={startY} r="3" fill={colorStart} />

        {/* End point */}
        <circle cx={endX} cy={endY} r="3" fill={colorEnd} />
      </svg>

      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>📈 {elevationGain.toFixed(0)}m</span>
        <span>📐 {averageGrade.toFixed(1)}%</span>
      </div>
    </div>
  );
}
