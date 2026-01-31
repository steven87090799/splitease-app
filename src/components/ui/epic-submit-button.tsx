'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface EpicSubmitButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    children?: React.ReactNode;
    className?: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    angle: number;
    speed: number;
    size: number;
    color: string;
    life: number;
}

export function EpicSubmitButton({
    onClick,
    disabled = false,
    type = 'submit',
    children = '新增費用',
    className,
}: EpicSubmitButtonProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [electricArcs, setElectricArcs] = useState<{ id: number; path: string }[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const particleIdRef = useRef(0);

    const colors = [
        '#00f5ff', // Cyan
        '#00d4ff', // Light blue
        '#0099ff', // Blue
        '#00ff9f', // Green
        '#7c3aed', // Purple
        '#ffffff', // White
    ];

    const generateElectricArc = useCallback(() => {
        const arcs: { id: number; path: string }[] = [];
        for (let i = 0; i < 6; i++) {
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            let path = `M ${startX} ${startY}`;
            let x = startX;
            let y = startY;

            for (let j = 0; j < 4; j++) {
                x += (Math.random() - 0.5) * 40;
                y += (Math.random() - 0.5) * 40;
                path += ` L ${x} ${y}`;
            }

            arcs.push({ id: i, path });
        }
        return arcs;
    }, []);

    const createParticles = useCallback((count: number) => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: particleIdRef.current++,
                x: 50,
                y: 50,
                angle: Math.random() * Math.PI * 2,
                speed: 2 + Math.random() * 4,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
            });
        }
        return newParticles;
    }, [colors]);

    const handleClick = useCallback(() => {
        if (disabled || isAnimating) return;

        setIsAnimating(true);
        setParticles(createParticles(30));
        setElectricArcs(generateElectricArc());

        // Multi-stage animation
        const arcInterval = setInterval(() => {
            setElectricArcs(generateElectricArc());
        }, 80);

        // Particle animation
        let frame = 0;
        const animateParticles = () => {
            frame++;
            setParticles(prev =>
                prev
                    .map(p => ({
                        ...p,
                        x: p.x + Math.cos(p.angle) * p.speed,
                        y: p.y + Math.sin(p.angle) * p.speed,
                        life: p.life - 0.03,
                        speed: p.speed * 0.96,
                    }))
                    .filter(p => p.life > 0)
            );

            if (frame < 40) {
                requestAnimationFrame(animateParticles);
            }
        };
        animateParticles();

        setTimeout(() => {
            clearInterval(arcInterval);
            setElectricArcs([]);
            setIsAnimating(false);
            setParticles([]);
        }, 600);
    }, [disabled, isAnimating, createParticles, generateElectricArc]);

    return (
        <button
            ref={buttonRef}
            type={type}
            disabled={disabled}
            onClick={(e) => {
                handleClick();
                onClick?.();
            }}
            className={cn(
                'relative overflow-visible group',
                'px-4 py-2 rounded-lg font-semibold text-sm',
                'transition-all duration-300 ease-out',
                'border-2',
                disabled
                    ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50'
                    : [
                        'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500',
                        'border-cyan-400/50',
                        'text-white',
                        'shadow-[0_0_20px_rgba(0,245,255,0.3)]',
                        'hover:shadow-[0_0_30px_rgba(0,245,255,0.5),0_0_60px_rgba(0,245,255,0.2)]',
                        'hover:scale-105',
                        'hover:border-cyan-300',
                        'active:scale-95',
                    ],
                isAnimating && !disabled && [
                    'scale-110',
                    'shadow-[0_0_40px_rgba(0,245,255,0.8),0_0_80px_rgba(0,245,255,0.4)]',
                ],
                className
            )}
        >
            {/* Electric glow background */}
            <div className={cn(
                'absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300',
                'bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20',
                !disabled && 'group-hover:opacity-100',
                isAnimating && 'opacity-100 animate-pulse'
            )} />

            {/* Electric arcs SVG overlay */}
            {isAnimating && (
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    {electricArcs.map(arc => (
                        <path
                            key={arc.id}
                            d={arc.path}
                            fill="none"
                            stroke="url(#electric-gradient)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className="animate-pulse"
                            style={{
                                filter: 'drop-shadow(0 0 4px #00f5ff) drop-shadow(0 0 8px #00f5ff)',
                            }}
                        />
                    ))}
                    <defs>
                        <linearGradient id="electric-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00f5ff" />
                            <stop offset="50%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#00f5ff" />
                        </linearGradient>
                    </defs>
                </svg>
            )}

            {/* Particles */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute pointer-events-none rounded-full"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                        backgroundColor: particle.color,
                        opacity: particle.life,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`,
                    }}
                />
            ))}

            {/* Scanning line effect */}
            {!disabled && (
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
                        <div
                            className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                            style={{
                                animation: 'scanLine 2s linear infinite',
                                top: '0%',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Button content */}
            <span className="relative z-10 flex items-center gap-2">
                <Zap className={cn(
                    'w-4 h-4 transition-all duration-300',
                    !disabled && 'group-hover:text-cyan-200 group-hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]',
                    isAnimating && 'animate-pulse text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                )} />
                {children}
            </span>

            {/* Outer glow ring on animation */}
            {isAnimating && (
                <div
                    className="absolute -inset-2 rounded-xl animate-ping opacity-30"
                    style={{
                        background: 'linear-gradient(90deg, #00f5ff, #7c3aed, #00f5ff)',
                    }}
                />
            )}

            <style jsx>{`
        @keyframes scanLine {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
        </button>
    );
}
