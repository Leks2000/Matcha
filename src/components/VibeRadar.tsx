import React from 'react';

interface VibeRadarProps {
  currentUserTags: string[];
  candidateTags: string[];
  currentUserName?: string;
  candidateName?: string;
}

export default function VibeRadar({
  currentUserTags,
  candidateTags,
  currentUserName = "Me",
  candidateName = "Them"
}: VibeRadarProps) {
  // Normalize tags to lowercase and trim
  const userTagsSet = new Set(currentUserTags.map(t => t.toLowerCase().trim()));
  const candidateTagsSet = new Set(candidateTags.map(t => t.toLowerCase().trim()));

  // 1. Build 5 distinct axes matching the target's and candidate's tags
  const combinedTagsSet = new Set([
    ...currentUserTags.map(t => t.trim()),
    ...candidateTags.map(t => t.trim())
  ]);
  
  const axesTags = Array.from(combinedTagsSet).slice(0, 5);
  
  // Fill with default cultural axes if tag count is too low
  const defaults = ["Matcha Vibe", "Indie Hacking", "Late Night Talks", "Crypto/Speculation", "Meme Culture"];
  while (axesTags.length < 5) {
    const nextDefault = defaults.find(d => !axesTags.includes(d));
    if (nextDefault) {
      axesTags.push(nextDefault);
    } else {
      axesTags.push(`Vibe #${axesTags.length + 1}`);
    }
  }

  // Geometrical constraints for SVG Radar (Width: 280, Height: 150)
  const cx = 140;
  const cy = 72;
  const r = 40; // Max radius
  const numAxes = 5;

  // Let's pre-generate deterministic weights for organic variance if user/candidate have the tag
  // This makes the shape look organic and gorgeous instead of a simple binary on/off
  const getTagWeight = (tag: string, isUser: boolean) => {
    const normalized = tag.toLowerCase().trim();
    const hasTag = isUser ? userTagsSet.has(normalized) : candidateTagsSet.has(normalized);
    if (hasTag) {
      // Return 0.85 - 1.0 depending on tag characters for authentic variance
      return 0.82 + (tag.length % 5) * 0.04;
    } else {
      // Even if they don't have it, they have some minimal presence (0.2 - 0.35) so it doesn't collapse
      return 0.2 + (tag.length % 4) * 0.05;
    }
  };

  const getCoordinates = (index: number, val: number) => {
    // Offset by -Math.PI / 2 to starting pointing straight upwards
    const angle = index * 2 * Math.PI / numAxes - Math.PI / 2;
    const x = cx + r * val * Math.cos(angle);
    const y = cy + r * val * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate grid levels (0.25, 0.5, 0.75, 1.0)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  
  // Generate points for User and Candidate polygons
  const userPoints: { x: number; y: number }[] = [];
  const candidatePoints: { x: number; y: number }[] = [];
  const axisLines: { x1: number; y1: number; x2: number; y2: number; label: string; labelX: number; labelY: number }[] = [];

  for (let i = 0; i < numAxes; i++) {
    const tagVal = axesTags[i];
    const userWeight = getTagWeight(tagVal, true);
    const candidateWeight = getTagWeight(tagVal, false);

    const userCoord = getCoordinates(i, userWeight);
    userPoints.push({ x: userCoord.x, y: userCoord.y });

    const candCoord = getCoordinates(i, candidateWeight);
    candidatePoints.push({ x: candCoord.x, y: candCoord.y });

    // Radial axis line and label coordinates
    const outerCoord = getCoordinates(i, 1.0);
    
    // Position labels slightly offset from vertices
    const labelOffset = 13;
    const angle = i * 2 * Math.PI / numAxes - Math.PI / 2;
    const labelX = cx + (r + labelOffset) * Math.cos(angle);
    const labelY = cy + (r + labelOffset) * Math.sin(angle);

    axisLines.push({
      x1: cx,
      y1: cy,
      x2: outerCoord.x,
      y2: outerCoord.y,
      label: tagVal,
      labelX,
      labelY
    });
  }

  // Convert points arrays into SVG path definitions or points string
  const getPointsString = (points: { x: number; y: number }[]) => {
    return points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  };

  return (
    <div className="w-full flex flex-col items-center justify-between" id="vibe-radar-chart">
      {/* SVG Container */}
      <svg className="w-full h-[142px]" viewBox="0 0 280 142" fill="none">
        <defs>
          <radialGradient id="userGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00C896" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#00C896" stopOpacity="0.04" />
          </radialGradient>
          <radialGradient id="candidateGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A1A1A" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0.04" />
          </radialGradient>
        </defs>

        {/* 1. Grid Level Polygons (Concentric Webs) */}
        {gridLevels.map((lvl, index) => {
          const gridPoints = Array.from({ length: numAxes }).map((_, i) => {
            const coord = getCoordinates(i, lvl);
            return `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`;
          }).join(' ');

          return (
            <polygon
              key={`grid-${index}`}
              points={gridPoints}
              fill="none"
              stroke="#000000"
              strokeWidth="0.5"
              strokeOpacity="0.07"
              strokeDasharray={index === gridLevels.length - 1 ? "none" : "2,2"}
            />
          );
        })}

        {/* 2. Axis Lines */}
        {axisLines.map((line, index) => (
          <line
            key={`axis-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#000000"
            strokeWidth="0.75"
            strokeOpacity="0.1"
          />
        ))}

        {/* 3. User Polygon Structure */}
        <polygon
          points={getPointsString(userPoints)}
          fill="url(#userGlow)"
          stroke="#00C896"
          strokeWidth="1.5"
          className="transition-all duration-300"
        />

        {/* 4. Candidate Polygon Structure */}
        <polygon
          points={getPointsString(candidatePoints)}
          fill="url(#candidateGlow)"
          stroke="#1A7A55"
          strokeWidth="1.25"
          strokeDasharray="1,1"
          className="transition-all duration-300"
        />

        {/* 5. Draw active dots on vertices for gorgeous aesthetic layout */}
        {userPoints.map((pt, idx) => (
          <circle
            key={`u-dot-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r="2.5"
            fill="#00C896"
            stroke="#FFFFFF"
            strokeWidth="0.75"
            shadow-sm="true"
          />
        ))}

        {candidatePoints.map((pt, idx) => (
          <circle
            key={`c-dot-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r="2"
            fill="#1A7A55"
            stroke="#FFFFFF"
            strokeWidth="0.75"
          />
        ))}

        {/* 6. Dynamic Axis Labels placed cleanly around SVG sides */}
        {axisLines.map((line, index) => {
          // Adjust alignment anchor depending on coordinates (left/right/center)
          let textAnchor = "middle";
          if (line.labelX < cx - 10) {
            textAnchor = "end";
          } else if (line.labelX > cx + 10) {
            textAnchor = "start";
          }
          
          // Micro vertical alignment optimization
          const dyValue = line.labelY < cy - 10 ? "0" : (line.labelY > cy + 10 ? "7" : "3.5");

          return (
            <text
              key={`label-${index}`}
              x={line.labelX}
              y={line.labelY}
              textAnchor={textAnchor}
              dy={dyValue}
              className="text-[7.5px] font-black tracking-tight fill-[#1A1A1A]/80 font-mono uppercase bg-white px-1"
            >
              {line.label.length > 11 ? `${line.label.slice(0, 10)}.` : line.label}
            </text>
          );
        })}
      </svg>

      {/* Mini Legend Indicator Row */}
      <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-[#1A1A1A]/60 font-mono">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C896] inline-block border border-white" />
          <span>Вы ({currentUserName})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1A7A55] inline-block border border-white" />
          <span>Они ({candidateName})</span>
        </div>
      </div>
    </div>
  );
}
