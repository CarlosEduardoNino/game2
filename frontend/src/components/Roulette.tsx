import React, { useState, useEffect } from 'react';

interface Participant {
    name: string;
}

interface RouletteProps {
    participants: Participant[];
    onSpinEnd: (winner: Participant) => void;
    isSpinning: boolean;
    targetIndex?: number | null;
    className?: string;
}

const Roulette: React.FC<RouletteProps> = ({ participants, onSpinEnd, isSpinning, targetIndex, className }) => {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (isSpinning && targetIndex !== undefined && targetIndex !== null) {
            const segmentSize = 360 / participants.length;
            // The pointer is at the top (0 degrees). 
            // We want the middle of segment `targetIndex` to be at the top.
            // A rotation of 0 puts middle of segment 0 at 0 + segmentSize/2.
            // We need to rotate so that (targetIndex * segmentSize + segmentSize/2) is at the top.
            // Target rotation for segment i to be at top: 360 - (i * segmentSize + segmentSize/2)
            const targetAngle = 360 - (targetIndex * segmentSize + segmentSize / 2);

            // Add extra spins for effect
            const extraSpins = 5;
            const newRotation = rotation + (extraSpins * 360) + (targetAngle - (rotation % 360) + 360) % 360;

            setRotation(newRotation);

            const timer = setTimeout(() => {
                onSpinEnd(participants[targetIndex]);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isSpinning, targetIndex]);

    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8', '#1e40af'];
    const displayParticipants = participants.length > 0 ? participants : [
        { name: 'Esperando...', email: '' },
        { name: 'Accua Game', email: '' },
        { name: 'Añadir...', email: '' }
    ];

    const segmentAngle = 360 / displayParticipants.length;

    return (
        <div className={`roulette-wrapper ${className || ''}`}>
            <div className="pointer"></div>
            <div
                className="roulette-container"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    backgroundColor: participants.length === 0 ? '#f0f9ff' : 'transparent'
                }}
            >
                <div className="center-hub">🎯</div>
                <svg
                    viewBox="0 0 100 100"
                    style={{ width: '100%', height: '100%', overflow: 'visible' }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {displayParticipants.length === 1 ? (
                        <g>
                            <circle cx="50" cy="50" r="50" fill={colors[0]} />
                            <text
                                x="50"
                                y="50"
                                fill="black"
                                fontSize="4.5"
                                fontWeight="900"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                style={{
                                    letterSpacing: '0.1px',
                                    pointerEvents: 'none'
                                }}
                            >
                                {displayParticipants[0].name}
                            </text>
                        </g>
                    ) : (
                        displayParticipants.map((person, index) => {
                            const angle = segmentAngle * index;
                            const startAngle = (angle - 90) * (Math.PI / 180);
                            const endAngle = (angle + segmentAngle - 90) * (Math.PI / 180);
                            const x1 = 50 + 50 * Math.cos(startAngle);
                            const y1 = 50 + 50 * Math.sin(startAngle);
                            const x2 = 50 + 50 * Math.cos(endAngle);
                            const y2 = 50 + 50 * Math.sin(endAngle);

                            const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                            const d = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                            const labelAngle = angle + segmentAngle / 2;
                            const labelRad = (labelAngle - 90) * (Math.PI / 180);
                            const labelX = 50 + 35 * Math.cos(labelRad);
                            const labelY = 50 + 35 * Math.sin(labelRad);

                            return (
                                <g key={index}>
                                    <path
                                        d={d}
                                        fill={colors[index % colors.length]}
                                        stroke="rgba(255,255,255,0.3)"
                                        strokeWidth="0.5"
                                        style={{ opacity: participants.length === 0 ? 0.3 : 1 }}
                                    />
                                    <text
                                        x={labelX}
                                        y={labelY}
                                        fill="black"
                                        fontSize="4.5"
                                        fontWeight="900"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        transform={`rotate(${labelAngle}, ${labelX}, ${labelY})`}
                                        style={{
                                            letterSpacing: '0.1px',
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        {person.name}
                                    </text>
                                </g>
                            );
                        })
                    )}
                </svg>
            </div>
        </div>
    );
};

export default Roulette;
