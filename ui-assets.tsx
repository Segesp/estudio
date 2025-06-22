
import React from 'react';

export const APP_NAME = "EstudioPro";

export const HomeIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

export const BookOpenIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

// Updated RectangleStackIcon (Flashcard Icon) to pixel-perfect spec
export const RectangleStackIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <rect x="2" y="6" width="20" height="12" rx="2" ry="2" stroke="currentColor"/>
    <path d="M16 6 H22 V12 L16 6" stroke="currentColor" fill="none"/>
    <line x1="5" y1="10" x2="19" y2="10" stroke="currentColor"/>
  </svg>
);


export const CheckCircleIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const SparklesIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 13.75M18.25 12L17 10.25M18.25 12L19.5 13.75M18.25 12L19.5 10.25M12.75 5.25L11.5 7M12.75 5.25L14 7M12.75 5.25L11.5 3.5M12.75 5.25L14 3.5M5.25 12.75L3.5 11.5M5.25 12.75L7 11.5M5.25 12.75L3.5 14M5.25 12.75L7 14M12 18.75L13.75 17M12 18.75L10.25 17M12 18.75L13.75 20.5M12 18.75L10.25 20.5" />
  </svg>
);

export const PlusIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.298.27m-3.298-.27L5.036 6.128a2.25 2.25 0 012.244-2.077h3.75a2.25 2.25 0 012.244 2.077L14.74 5.79m-4.856 0a48.108 48.108 0 013.478-.397m-3.478.397L9.261 5.79m0 0l3.081-1.616a2.25 2.25 0 012.244 0l3.081 1.616m-7.007 0c.058-.119.122-.236.194-.351L9.26 5.79m0 0a2.25 2.25 0 012.244-2.077h3.75a2.25 2.25 0 012.244 2.077L14.74 5.79" />
  </svg>
);

export const EditIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

export const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const ChevronUpIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const LightBulbIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311V21m-3.75-2.311V21m0 0a2.25 2.25 0 01-1.619-3.137m5.238 3.137a2.25 2.25 0 00-1.618-3.137M15.116 5.536A9.005 9.005 0 0112 5.25c-1.298 0-2.512.201-3.616.57m1.275 3.103c-.11.23-.008.498.148.653A3.74 3.74 0 0112 10.5c.348 0 .686-.052.992-.149.155-.06.257-.209.148-.364l-.195-.278A9.029 9.029 0 0012 9c-.53 0-1.034.092-1.5.256m1.275 3.103l-.195.278" />
</svg>
);

// Updated BrainIcon (Elaboration/Pencil Icon) to pixel-perfect spec
export const BrainIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    {/* Body of pencil: inclined rectangle (approximated with polygon)
        P1: (6,18), P2: (18,6)
        For width 4px perpendicular to line (6,18)-(18,6)
        Line equation: y - 18 = ((6-18)/(18-6)) * (x - 6) => y - 18 = -1(x-6) => y = -x + 24
        Perpendicular slope = 1
        Offsetting points by sqrt(2) in perpendicular directions for 2px offset (half of 4px width)
        P1_a = (6-sqrt(2), 18-sqrt(2)), P1_b = (6+sqrt(2), 18+sqrt(2))
        P2_a = (18-sqrt(2), 6-sqrt(2)), P2_b = (18+sqrt(2), 6+sqrt(2))
        Approximation for pixel grid: (6-1,18-1)=(5,17), (6+1,18+1)=(7,19), (18-1,6-1)=(17,5), (18+1,6+1)=(19,7)
        Let's try: (5,17)-(17,5)-(19,7)-(7,19)
    */}
    <polygon points="5,17 17,5 19,7 7,19" stroke="currentColor" fill="currentColor" />
    {/* Eraser: 4x6 px at lower-left end. (6,18) is one end of centerline.
        If pencil body point is (6,18), eraser extends from here.
        Approximate rectangle for eraser based on (6,18)
        If pencil is 4px wide, centered on (6,18), eraser points could be
        (6-2, 18-3) = (4,15) to (6+2, 18+3) = (8,21) -> (4,15) (8,15) (8,21) (4,21) for a 4x6 rect
        Aligned with the pencil: (4,17) (6,15) (10,19) (8,21) - this is a parallelogram
        Spec: Rect 4x6px. Let's place it aligned to axis for simplicity, near the (6,18) end.
        Example: (3,16) width 4, height 6 => (3,16) (7,16) (7,22) (3,22)
    */}
    <rect x="3" y="15" width="6" height="4" rx="1" fill="white" stroke="currentColor" transform="rotate(-45 6 18)"/>

    {/* Graphite: Triangle (18,6), (20,4), (16,4) */}
    <polygon points="18,6 20,4 16,4" fill="currentColor" stroke="currentColor"/>
  </svg>
);


// Updated ClockIcon (Pomodoro Icon) to pixel-perfect spec
export const ClockIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="12" x2="12" y2="6"/> 
    <line x1="12" y1="12" x2="17" y2="12"/> 
    <rect x="10" y="3" width="4" height="3" rx="1"/> 
    <rect x="10" y="18" width="4" height="3" rx="1"/> 
  </svg>
);

// Updated PuzzlePieceIcon (Interleaving Icon) to pixel-perfect spec
export const PuzzlePieceIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    {/* Flecha ↗: Linea (6,18) -> (18,6) */}
    <line x1="6" y1="18" x2="18" y2="6"/>
    {/* Cabeza de flecha: (14,10)-(18,6) and (18,6)-(14,2)
        This interpretation for head: from (18,6) go towards (14,10) for 4px, and towards (14,2) for 4px
        Or lines from (14,10) to (18,6) and (14,2) to (18,6). The spec "de (14,10) hacia (18,6)" is one line.
        Let's assume the vertex is (18,6). Line 1: (18,6) to (14,10). Line 2: (18,6) to (14,2).
    */}
    <polyline points="14,10 18,6 14,2"/>

    {/* Flecha ↙: Linea (6,6) -> (18,18) */}
    <line x1="6" y1="6" x2="18" y2="18"/>
    {/* Cabeza de flecha (rotada): vertex (6,6). Points (10,2) (6,6) (10,10) */}
    <polyline points="10,2 6,6 10,10"/>
  </svg>
);

// Updated PaintBrushIcon (Generative Drawing Icon) to pixel-perfect spec
export const PaintBrushIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    {/* Lienzo: Rect 16x12 en (4,6), esquinas 2px */}
    <rect x="4" y="6" width="16" height="12" rx="2" ry="2" stroke="currentColor"/>
    {/* Pincel: Mango rect 2x10 rotado 30°, esquina inf-izq del lienzo (approx (4,18)) */}
    {/* Center of rotation for handle could be (5,17) for bottom-left of handle */}
    <rect x="4" y="12" width="10" height="2" rx="1" stroke="currentColor" transform="rotate(-30 5 17)"/>
    {/* Cerdas: Triangulo base 6, altura 4. Approx position near (4+10*cos(30)-ish, 18-10*sin(30)-ish) which is end of handle */}
    {/* Tip of handle approx (4+10*cos(-30), 17+10*sin(-30)) = (4+8.66, 17-5) = (12.66, 12) */}
    <polygon points="11,10 14,13 12,14" fill="currentColor" stroke="currentColor"/>
  </svg>
);


export const TargetIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21V3M12 3a9.004 9.004 0 00-8.716 6.747M12 3a9.004 9.004 0 018.716 6.747m0 0H20.75m-1.25 0H3.25m17.5 0a9.004 9.004 0 00-1.659-5.322M3.25 0a9.004 9.004 0 011.659-5.322m0 0A9.004 9.004 0 003.25 12m6.75-8.991A1.5 1.5 0 1012 5.25a1.5 1.5 0 00-2.25-2.241z" />
  </svg>
);

export const MoonIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

export const SunIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);


export const AcademicCapIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path d="M11.205 5.42c.105-.187.305-.308.528-.308h.532c.224 0 .424.12.528.308L15 10.5H9l2.205-5.08z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12.308A19.503 19.503 0 0012 15.118c2.617 0 5.101-.586 7.275-1.637S22.023 9.74 22.023 9V8.086c0-.493-.1-.973-.285-1.417L19.5 3.75H4.5L2.262 6.67c-.184.443-.284.923-.284 1.416V9c0 .76.24 1.486.68 2.083.414.557.944 1.026 1.542 1.393L3.75 12.308zm0 0V15.75c0 .32.128.628.358.857l1.018.99c.07.068.146.126.226.176.262.164.544.298.838.397C7.096 18.42 8.942 18.75 10.5 18.75h3c1.558 0 3.404-.33 4.546-.865.294-.1.576-.233.838-.397.08-.05.157-.108.226-.176l1.018-.99a1.21 1.21 0 00.358-.857v-3.442" />
  </svg>
);

// TimerIcon uses the same pixel-perfect definition as ClockIcon
export const TimerIcon: React.FC<{className?: string}> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="12" x2="12" y2="6"/> 
    <line x1="12" y1="12" x2="17" y2="12"/> 
    <rect x="10" y="3" width="4" height="3" rx="1"/> 
    <rect x="10" y="18" width="4" height="3" rx="1"/> 
  </svg>
);


// Updated CogIcon (Settings Icon) to pixel-perfect spec
export const CogIcon: React.FC<{className?: string}> = ({ className }) => {
  const teeth = [];
  const numTeeth = 6;
  const angleStep = 360 / numTeeth;
  // Center of 4x4 tooth is at radius 6 from (12,12). Tooth extends from r=4 to r=8.
  // Base circle is r=6.
  for (let i = 0; i < numTeeth; i++) {
    const angle = angleStep * i;
    // Calculate the center of the tooth relative to (12,12)
    // The spec "Posicionados radialmente cada 60°: centros a 6 px del centro (12, 12)"
    // "Alineados 'inside' de forma que asomen 2 px fuera del círculo (r=6)"
    // This means the outer edge of the tooth is at r=8. A 4x4 tooth means its inner edge is at r=4.
    // So the tooth center (cx, cy for the tooth itself) should be placed at radius 6 from (12,12).
    // The tooth is 4x4. To place its center (relative to its own coords, i.e. x=2, y=2 for the tooth) at a point on a circle of radius 6:
    // tooth_render_x = 12 + 6 * cos(angle_rad) - 2 (half width)
    // tooth_render_y = 12 + 6 * sin(angle_rad) - 2 (half height)
    // This seems correct for placing the center of the tooth.
    teeth.push(
      <rect
        key={i}
        x="10" // x position before rotation (center of 4x4 is 12, so top-left is 10)
        y="2"  // y position for tooth center to be on radius 6, if circle is (12,12) r=6, this puts center of tooth at (12,4) before rotation
               // if main circle is (12,12) r=6. Tooth center should be at (12, 12-6=6). Rect (10,4) to (14,8).
        width="4"
        height="4"
        rx="0.5" // Small rounding for teeth
        transform={`rotate(${angle} 12 12)`}
        stroke="currentColor"
        fill="currentColor"
      />
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
      <circle cx="12" cy="12" r="6" stroke="currentColor" fill="none"/>
      {teeth}
    </svg>
  );
};

export const ChatBubbleLeftEllipsisIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.862 8.25-8.625 8.25S3.75 16.556 3.75 12 7.612 3.75 12.375 3.75 21 7.444 21 12z" />
  </svg>
);

export const DocumentArrowUpIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export const CalendarDaysIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12v-.008zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75v-.008zm0 2.25h.008v.008H9.75v-.008zm2.25-4.5h.008v.008H14.25v-.008zm0 2.25h.008v.008H14.25v-.008zm0 2.25h.008v.008H14.25v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5v-.008z" />
  </svg>
);
