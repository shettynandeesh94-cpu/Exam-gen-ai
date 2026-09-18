import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Sparkles, User, UserCheck } from 'lucide-react';

const eyePositions = {
    female: [
        { id: 'f-left', top: '36.5%', left: '44%', width: '4.6%', height: '2.5%', color: '#dfab92' },
        { id: 'f-right', top: '36.5%', left: '55.5%', width: '4.6%', height: '2.5%', color: '#dfab92' }
    ],
    male: [
        { id: 'm-left', top: '36.8%', left: '44%', width: '4.2%', height: '2.4%', color: '#e5bda1' },
        { id: 'm-right', top: '36.8%', left: '53.8%', width: '4.2%', height: '2.4%', color: '#e5bda1' }
    ]
};

const AIInterviewer = ({
    state = 'idle', // 'idle' | 'speaking' | 'listening' | 'thinking'
    gender: externalGender,
    onChangeGender
}) => {
    const [localGender, setLocalGender] = useState('female');
    const gender = externalGender || localGender;

    const handleGenderToggle = (newGender) => {
        if (onChangeGender) {
            onChangeGender(newGender);
        } else {
            setLocalGender(newGender);
        }
    };

    const femalePhoto = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400";
    const malePhoto = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=400";
    const currentPhoto = gender === 'female' ? femalePhoto : malePhoto;
    const currentEyes = gender === 'female' ? eyePositions.female : eyePositions.male;

    // Glow configurations based on state
    const getGlowStyles = () => {
        switch (state) {
            case 'speaking':
                return {
                    shadowColor: 'rgba(6, 182, 212, 0.75)', // cyan
                    borderColor: 'border-cyan-500/80',
                    textColor: 'text-cyan-400',
                    glowPulse: [
                        '0 0 12px rgba(6, 182, 212, 0.4)',
                        '0 0 28px rgba(6, 182, 212, 0.85)',
                        '0 0 12px rgba(6, 182, 212, 0.4)'
                    ]
                };
            case 'listening':
                return {
                    shadowColor: 'rgba(34, 197, 94, 0.75)', // green
                    borderColor: 'border-emerald-500/80',
                    textColor: 'text-emerald-400',
                    glowPulse: [
                        '0 0 12px rgba(34, 197, 94, 0.4)',
                        '0 0 28px rgba(34, 197, 94, 0.85)',
                        '0 0 12px rgba(34, 197, 94, 0.4)'
                    ]
                };
            case 'thinking':
                return {
                    shadowColor: 'rgba(168, 85, 247, 0.75)', // purple/indigo
                    borderColor: 'border-purple-500/80',
                    textColor: 'text-purple-400',
                    glowPulse: [
                        '0 0 12px rgba(168, 85, 247, 0.4)',
                        '0 0 28px rgba(168, 85, 247, 0.85)',
                        '0 0 12px rgba(168, 85, 247, 0.4)'
                    ]
                };
            case 'idle':
            default:
                return {
                    shadowColor: 'rgba(59, 130, 246, 0.4)', // blue
                    borderColor: 'border-blue-500/50',
                    textColor: 'text-blue-400',
                    glowPulse: [
                        '0 0 8px rgba(59, 130, 246, 0.25)',
                        '0 0 16px rgba(59, 130, 246, 0.45)',
                        '0 0 8px rgba(59, 130, 246, 0.25)'
                    ]
                };
        }
    };

    const config = getGlowStyles();

    // Floating variants combined with breathing
    const floatAndBreatheVariants = {
        animate: {
            y: [0, -4, 0, 4, 0],
            scale: [1, 1.025, 1, 0.985, 1],
            transition: {
                y: {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                },
                scale: {
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 select-none">

            {/* Outer Hologram Space / Ring Container */}
            <div className="relative w-56 h-56 flex items-center justify-center mb-6">

                {/* Hologram Telemetry Grid Background */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-cyan-500/5 to-purple-500/5 blur-xl opacity-80 pointer-events-none" />

                {/* --- LISTENING: Concentric Mic Pulse Rings (Green) --- */}
                {state === 'listening' && (
                    <>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0.9 }}
                            animate={{ scale: 1.45, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                            className="absolute w-44 h-44 rounded-full border border-emerald-500/30 z-0 pointer-events-none"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0.7 }}
                            animate={{ scale: 1.6, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2, delay: 0.65, ease: "easeOut" }}
                            className="absolute w-44 h-44 rounded-full border border-emerald-400/20 z-0 pointer-events-none"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0.5 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2, delay: 1.3, ease: "easeOut" }}
                            className="absolute w-44 h-44 rounded-full border border-emerald-300/10 z-0 pointer-events-none"
                        />
                    </>
                )}

                {/* --- THINKING: Purple Rotating Loaders --- */}
                {state === 'thinking' && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                        {/* Outer Ring rotating CW */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            className="w-[192px] h-[192px] border-2 border-dashed border-purple-500/40 rounded-full absolute"
                        />
                        {/* Inner Ring rotating CCW */}
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                            className="w-[180px] h-[180px] border border-dashed border-indigo-400/30 rounded-full absolute"
                        />
                        {/* Glowing Accent Dots orbiting */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="w-[186px] h-[186px] rounded-full absolute flex items-start justify-center"
                        >
                            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                        </motion.div>
                    </div>
                )}

                {/* --- SPEAKING: Cyan Pulsing Accent Rings --- */}
                {state === 'speaking' && (
                    <motion.div
                        animate={{
                            boxShadow: [
                                '0 0 0 0px rgba(6, 182, 212, 0.4)',
                                '0 0 0 16px rgba(6, 182, 212, 0)',
                            ]
                        }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                        className="absolute w-44 h-44 rounded-full z-0 pointer-events-none"
                    />
                )}

                {/* Main Avatar Frame */}
                <motion.div
                    variants={floatAndBreatheVariants}
                    animate="animate"
                    style={{ transformOrigin: "center bottom" }}
                    className="relative w-44 h-44 z-10"
                >
                    {/* Avatar Glass Border with State-Based Glow */}
                    <motion.div
                        animate={{
                            boxShadow: config.glowPulse
                        }}
                        transition={{ repeat: Infinity, duration: state === 'speaking' ? 1.2 : 2.5, ease: "easeInOut" }}
                        className={`w-full h-full rounded-full border-2 ${config.borderColor} bg-slate-950/80 p-1 flex items-center justify-center overflow-hidden backdrop-blur-md relative`}
                    >
                        {/* Portrait Image */}
                        <img
                            src={currentPhoto}
                            alt={`${gender} interviewer`}
                            className="w-full h-full rounded-full object-cover select-none pointer-events-none filter brightness-95 contrast-105"
                        />

                        {/* Glowing Scanlines overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.15),transparent)] rounded-full pointer-events-none" />
                        <div className="absolute inset-0 rounded-full pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-40" />

                        {/* --- BLINKING: Absolute overlays over the eyes in Unsplash photo --- */}
                        {currentEyes.map((eye) => (
                            <motion.div
                                key={eye.id}
                                style={{
                                    position: 'absolute',
                                    top: eye.top,
                                    left: eye.left,
                                    width: eye.width,
                                    height: eye.height,
                                    backgroundColor: eye.color,
                                    borderRadius: '50% / 100% 100% 0 0',
                                    transformOrigin: 'top',
                                    zIndex: 25,
                                    filter: 'blur(0.3px)'
                                }}
                                animate={{
                                    scaleY: [0, 0, 1, 0, 0, 0, 1, 0, 0] // Blinks twice for natural feeling
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    times: [0, 0.45, 0.47, 0.49, 0.9, 0.91, 0.93, 0.95, 1]
                                }}
                            />
                        ))}
                    </motion.div>

                    {/* Gender Selector Overlay Badge (Top-Right) */}
                    <div className="absolute top-0 right-0 z-20 flex space-x-1 p-1 bg-slate-900/90 border border-white/10 rounded-full shadow-lg backdrop-blur-md">
                        <button
                            onClick={() => handleGenderToggle('female')}
                            className={`p-1.5 rounded-full transition-all text-xs font-semibold ${gender === 'female'
                                    ? 'bg-cyan-500/25 border border-cyan-500/40 text-cyan-400 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                            title="Switch to Female Recruitment Executive"
                        >
                            <User className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleGenderToggle('male')}
                            className={`p-1.5 rounded-full transition-all text-xs font-semibold ${gender === 'male'
                                    ? 'bg-cyan-500/25 border border-cyan-500/40 text-cyan-400 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                            title="Switch to Male Recruitment Executive"
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* --- WAVEFORM: Speaking animation below the avatar --- */}
            <div className="h-8 w-full flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {state === 'speaking' && (
                        <motion.div
                            key="speaking-wave"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-1.5 h-6 px-4 bg-cyan-950/20 border border-cyan-500/10 rounded-full"
                        >
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400 mr-1 animate-pulse" />
                            {[...Array(8)].map((_, i) => (
                                <motion.span
                                    key={i}
                                    animate={{
                                        height: [6, 20, 6],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.6 + (i % 3) * 0.15,
                                        ease: "easeInOut",
                                        delay: i * 0.08
                                    }}
                                    className="w-1 bg-cyan-400 rounded-full"
                                />
                            ))}
                        </motion.div>
                    )}

                    {state === 'listening' && (
                        <motion.div
                            key="listening-wave"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2 h-6 px-4 bg-emerald-950/20 border border-emerald-500/10 rounded-full"
                        >
                            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-mono tracking-wider text-emerald-400 font-bold">
                                MIC RECORDING DETECTED
                            </span>
                        </motion.div>
                    )}

                    {state === 'thinking' && (
                        <motion.div
                            key="thinking-status"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2 h-6 px-4 bg-purple-950/20 border border-purple-500/10 rounded-full"
                        >
                            <Sparkles className="w-3 h-3 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
                            <span className="text-[9px] font-mono tracking-widest text-purple-400 font-bold uppercase">
                                HEURISTIC SCORING ALIGNMENT
                            </span>
                        </motion.div>
                    )}

                    {state === 'idle' && (
                        <motion.div
                            key="idle-status"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="h-6 flex items-center justify-center"
                        >
                            <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase border border-slate-800 rounded-full px-3 py-0.5 bg-slate-950/30">
                                TELEMETRY SCANNER ACTIVE
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- STATUS LABEL with animated loading dots --- */}
            <div className="text-center mt-3 relative z-10 w-full min-h-[44px]">
                <h2 className={`text-sm font-extrabold ${config.textColor} tracking-wide transition-colors duration-500`}>
                    {state === 'listening' && (
                        <span>
                            Listening
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
                            >.</motion.span>
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, times: [0, 0.5, 1] }}
                            >.</motion.span>
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, times: [0, 0.5, 1] }}
                            >.</motion.span>
                        </span>
                    )}
                    {state === 'speaking' && (
                        <span>
                            Speaking
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.5, 1] }}
                            >.</motion.span>
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: 0.25, times: [0, 0.5, 1] }}
                            >.</motion.span>
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: 0.5, times: [0, 0.5, 1] }}
                            >.</motion.span>
                        </span>
                    )}
                    {state === 'thinking' && (
                        <span>
                            Analyzing your answer
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.5, 1] }}
                            >.</motion.span>
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, delay: 0.4, times: [0, 0.5, 1] }}
                            >.</motion.span>
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, delay: 0.8, times: [0, 0.5, 1] }}
                            >.</motion.span>
                        </span>
                    )}
                    {state === 'idle' && <span>AI Interviewer (Attentive)</span>}
                </h2>

                <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                    {state === 'listening' && 'Speak clearly. When done, click Stop Recording.'}
                    {state === 'speaking' && 'Attenuating voice responses. Select voice rate below.'}
                    {state === 'thinking' && 'Analyzing tone, pace, filler words & technical scope.'}
                    {state === 'idle' && 'Click the microphone or Repeat Question to begin.'}
                </p>
            </div>

        </div>
    );
};

export default AIInterviewer;
