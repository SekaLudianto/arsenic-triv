
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOTAL_ROUNDS, ROUND_TIMER_SECONDS, KNOCKOUT_ROUND_TIMER_SECONDS, KNOCKOUT_TARGET_SCORE } from '../constants';
// FIX: Import LetterObject from types.ts instead of defining it locally.
import { GameMode, GameStyle, LetterObject, LeaderboardEntry, KnockoutPlayer, FootballState } from '../types';
import { InternalGameState } from '../hooks/useGameLogic';
import { ServerIcon, HeartIcon, GiftIcon, InfoIcon, ShieldCheckIcon, AlertTriangleIcon } from './IconComponents';

// FIX: Removed local definition of LetterObject as it's now imported from types.ts.

interface GameTabProps {
  gameState: InternalGameState;
  serverTime: Date | null;
  gifterLeaderboard: LeaderboardEntry[];
  likerLeaderboard: LeaderboardEntry[];
}

const formatServerTime = (date: Date | null): string => {
    if (!date) return '00:00:00';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const getLetterBoxSizeClasses = (totalLetters: number): string => {
  if (totalLetters > 22) return 'w-5 h-7 text-sm gap-0.5';
  if (totalLetters > 16) return 'w-6 h-8 text-lg gap-1';
  if (totalLetters > 12) return 'w-7 h-9 text-xl gap-1';
  return 'w-9 h-11 text-2xl gap-1.5';
};

const ScrambledWordDisplay: React.FC<{ scrambledWord: LetterObject[][], isRoundActive: boolean, isHardMode: boolean, revealLevel: number }> = ({ scrambledWord, isRoundActive, isHardMode, revealLevel }) => {
    const totalLetters = scrambledWord.flat().length;
    const sizeClasses = getLetterBoxSizeClasses(totalLetters);
    
    // In Hard Mode, reveal 1 letter per level (starting from 0)
    // Fixed: Previously multiplied by 2, causing "double" reading perception.
    const revealedCount = isHardMode ? revealLevel : totalLetters;

    let globalIndex = 0;

    return (
        <div className="flex flex-col items-center gap-1 px-2 relative">
            {scrambledWord.map((word, wordIndex) => (
                <div key={wordIndex} className={`flex flex-wrap justify-center ${sizeClasses.split(' ')[2]}`}>
                    {word.map((item: LetterObject) => {
                        const isHidden = isRoundActive && isHardMode && globalIndex >= revealedCount;
                        globalIndex++;
                        
                        return (
                        <motion.div
                            key={item.id}
                            layout
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`bg-sky-100 dark:bg-gray-700 border-2 rounded-md flex items-center justify-center font-bold transition-colors duration-500 ${sizeClasses.split(' ').slice(0, 2).join(' ')} ${
                                isRoundActive
                                    ? 'border-sky-200 dark:border-gray-600 text-amber-500 dark:text-amber-400'
                                    : 'border-green-500 text-green-600 dark:text-green-300'
                                }`}
                        >
                            {isHidden ? (
                                <span className="text-gray-400 dark:text-gray-500">🔒</span>
                            ) : (
                                item.letter
                            )}
                        </motion.div>
                    )})}
                </div>
            ))}
            {isRoundActive && isHardMode && revealedCount < totalLetters && (
                <div className="mt-2 flex items-center justify-center gap-4 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-1.5">
                        <span className="text-white text-xs font-semibold">Clue:</span>
                        <img 
                            src="https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp" 
                            alt="1 Coin Gift" 
                            className="w-5 h-5" 
                        />
                    </div>
                    <div className="w-px h-5 bg-white/30"></div> {/* Separator */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-white text-xs font-semibold">Skip:</span>
                        <img 
                            src="https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a4c4dc437fd3a6632aba149769491f49.png~tplv-obj.webp" 
                            alt="Finger Heart" 
                            className="w-5 h-5" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const FlagOverlay: React.FC<{ isRoundActive: boolean, isHardMode: boolean, revealLevel: number }> = ({ isRoundActive, isHardMode, revealLevel }) => {
    if (!isRoundActive || !isHardMode) return null;

    // 4x4 Grid = 16 blocks.
    // Reveal 1 block per level.
    const totalBlocks = 16;
    const blocksToReveal = revealLevel; 
    
    // Create an array of 16 blocks
    const blocks = Array.from({ length: totalBlocks }, (_, i) => i);

    return (
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 w-full h-full">
            {blocks.map((index) => {
                // Determine if this block should be hidden (revealed)
                const isRevealed = index < blocksToReveal;
                
                return (
                    <AnimatePresence key={index}>
                        {!isRevealed && (
                            <motion.div
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ duration: 0.5 }}
                                className="bg-slate-300 dark:bg-slate-600 border border-slate-400/50 flex items-center justify-center"
                            >
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">?</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                );
            })}
             {blocksToReveal < totalBlocks && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1 pointer-events-none">
                     <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                        <span className="text-[10px] font-semibold text-white">Clue:</span>
                        <img 
                            src="https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp" 
                            alt="1 Coin Gift" 
                            className="w-4 h-4" 
                        />
                     </div>
                </div>
            )}
        </div>
    );
};

// --- NEW FOOTBALL FIELD COMPONENT ---
const FootballField: React.FC<{ 
    player1: KnockoutPlayer, 
    player2: KnockoutPlayer, 
    footballState: FootballState,
    timer: number,
    isRoundActive: boolean
}> = ({ player1, player2, footballState, timer, isRoundActive }) => {
    
    // Logic for ball animation during SAVE
    const ballAnimation = {
        left: `${footballState.ballPosition}%`,
        y: '-50%'
    };

    // If saving, animate ball away from goal (simple bounce back effect)
    if (footballState.actionState === 'save') {
        const isLeftGoal = footballState.ballPosition < 50;
        ballAnimation.left = isLeftGoal ? '30%' : '70%'; // Bounce out
    }

    const isP1Defender = footballState.defenderId === player1.userId;
    const isP2Defender = footballState.defenderId === player2.userId;

    return (
        <div className="relative w-full h-56 bg-[#4CA058] overflow-hidden border-b-4 border-white/20 shadow-inner flex flex-col justify-center select-none shrink-0">
            {/* Grass Pattern Stripes (Vertical stripes like standard pitch) */}
            <div className="absolute inset-0 w-full h-full pointer-events-none" 
                 style={{ 
                     background: 'repeating-linear-gradient(90deg, #4ca058, #4ca058 10%, #459151 10%, #459151 20%)'
                 }}>
            </div>

            {/* Field Markings */}
            <div className="absolute inset-0">
                {/* Border Line */}
                <div className="absolute inset-2 border-2 border-white/80"></div>
                
                {/* Center Line */}
                <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-white/80 -translate-x-1/2"></div>
                
                {/* Center Circle */}
                <div className="absolute left-1/2 top-1/2 w-24 h-24 border-2 border-white/80 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                
                {/* Center Spot */}
                <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>

                {/* --- LEFT SIDE --- */}
                {/* Left Penalty Area (Big Box) */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-24 h-32 border-r-2 border-y-2 border-white/80 bg-transparent"></div>
                
                {/* Left Goal Area (Small Box) */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-16 border-r-2 border-y-2 border-white/80 bg-transparent"></div>
                
                {/* Left Penalty Spot */}
                <div className="absolute left-16 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                
                {/* Left Penalty Arc */}
                <div className="absolute left-[98px] top-1/2 -translate-y-1/2 w-8 h-16 border-r-2 border-white/80 rounded-r-full" 
                     style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}>
                </div>
                
                {/* Left Goal Post */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-10 border-r-2 border-y-2 border-white/90 bg-white/20"></div>


                {/* --- RIGHT SIDE --- */}
                {/* Right Penalty Area (Big Box) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-32 border-l-2 border-y-2 border-white/80 bg-transparent"></div>
                
                {/* Right Goal Area (Small Box) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-16 border-l-2 border-y-2 border-white/80 bg-transparent"></div>

                {/* Right Penalty Spot */}
                <div className="absolute right-16 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>

                {/* Right Penalty Arc */}
                <div className="absolute right-[98px] top-1/2 -translate-y-1/2 w-8 h-16 border-l-2 border-white/80 rounded-l-full"
                     style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}>
                </div>

                {/* Right Goal Post */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-10 border-l-2 border-y-2 border-white/90 bg-white/20"></div>

                {/* Corner Arcs */}
                <div className="absolute top-2 left-2 w-4 h-4 border-b-2 border-r-2 border-white/80 rounded-br-full"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-t-2 border-r-2 border-white/80 rounded-tr-full"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-b-2 border-l-2 border-white/80 rounded-bl-full"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-t-2 border-l-2 border-white/80 rounded-tl-full"></div>
            </div>

            {/* Commentary Ticker (Fixed: No truncation, running text style) */}
            <div className="absolute bottom-0 inset-x-0 bg-black/85 text-white p-2 border-t-2 border-white/30 z-30 flex items-center justify-center min-h-[40px]">
                <p className="text-xs font-mono text-center leading-tight break-words animate-pulse">
                    {footballState.commentary}
                </p>
            </div>

            {/* Match Timer Scoreboard (Fixed: Always visible in active round) */}
            {isRoundActive && (
                <motion.div 
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-40"
                >
                    <div className="bg-black/90 border-2 border-white/50 px-4 py-1 rounded-lg shadow-xl flex flex-col items-center min-w-[80px]">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">TIME</span>
                        <div className={`text-2xl font-mono font-bold leading-none ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                            00:{timer.toString().padStart(2, '0')}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Players (Tokens) */}
            <motion.div 
                className={`absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 transition-opacity duration-300 ${isRoundActive && !isP1Defender ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}`}
                animate={{ left: '15%' }} 
                transition={{ type: "spring", stiffness: 100 }}
            >
                {isRoundActive && isP1Defender && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-white mb-0.5 animate-pulse"
                    >
                        DEFEND!
                    </motion.div>
                )}
                <div className={`w-10 h-10 rounded-full border-2 ${footballState.attackerId === player1.userId ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-red-500'} bg-white overflow-hidden relative shadow-lg ${isRoundActive && isP1Defender ? 'ring-4 ring-red-500/60 shadow-red-500/50' : ''}`}>
                    <img src={player1.profilePictureUrl} alt={player1.nickname} className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full truncate max-w-[70px] shadow-sm font-semibold border border-white/20">{player1.nickname}</span>
            </motion.div>

            <motion.div 
                className={`absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 transition-opacity duration-300 ${isRoundActive && !isP2Defender ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}`}
                animate={{ right: '15%' }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                {isRoundActive && isP2Defender && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-white mb-0.5 animate-pulse"
                    >
                        DEFEND!
                    </motion.div>
                )}
                <div className={`w-10 h-10 rounded-full border-2 ${footballState.attackerId === player2.userId ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-blue-500'} bg-white overflow-hidden relative shadow-lg ${isRoundActive && isP2Defender ? 'ring-4 ring-red-500/60 shadow-red-500/50' : ''}`}>
                    <img src={player2.profilePictureUrl} alt={player2.nickname} className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full truncate max-w-[70px] shadow-sm font-semibold border border-white/20">{player2.nickname}</span>
            </motion.div>

            {/* Ball */}
            <motion.div
                className="absolute top-1/2 w-4 h-4 rounded-full shadow-lg z-30 bg-white flex items-center justify-center border border-gray-300"
                animate={ballAnimation}
                transition={{ type: "spring", stiffness: 120, damping: 15 }}
            >
                {/* Soccer ball pattern dots */}
                <div className="w-1 h-1 bg-black rounded-full opacity-80 absolute top-0.5 left-1"></div>
                <div className="w-1 h-1 bg-black rounded-full opacity-80 absolute bottom-0.5 right-1"></div>
                <div className="w-1.5 h-1.5 bg-black rounded-full opacity-80"></div>
            </motion.div>
        </div>
    );
};

const GuessTheFlagContent: React.FC<{ gameState: InternalGameState }> = ({ gameState }) => {
    const { currentCountry, scrambledWord, isRoundActive, isHardMode, revealLevel } = gameState;
    if (!currentCountry) return null;

    return (
        <>
            <h2 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-300 text-center mb-2">
                Tebak nama dari bendera ini:
            </h2>
            <div className="my-2 relative inline-block rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-600">
                <img 
                    src={`https://flagcdn.com/w160/${currentCountry.code}.png`} 
                    alt="Bendera" 
                    className="h-24 w-auto object-cover" 
                />
                <FlagOverlay isRoundActive={isRoundActive} isHardMode={isHardMode} revealLevel={revealLevel} />
            </div>
            <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={isRoundActive} isHardMode={isHardMode} revealLevel={revealLevel} />
        </>
    );
};

// Modified: Question Overlay fills the entire football field area
const ActiveQuestionDisplay: React.FC<{ gameState: InternalGameState }> = ({ gameState }) => {
    const { gameMode, isRoundActive, scrambledWord, currentCountry, currentTriviaQuestion, currentWord, currentWordCategory, currentCity, currentStadium, footballState, knockoutPlayers } = gameState;
    
    // Determine defender nickname
    const defender = knockoutPlayers.find(p => p.userId === footballState.defenderId);
    
    if (!isRoundActive) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center p-3 text-center bg-black/90 backdrop-blur-[2px] select-none"
        >
            <div className="absolute top-4 left-0 right-0 z-50 flex flex-col items-center">
                <div className="bg-red-600 text-white px-6 py-2 rounded-full border-4 border-white shadow-2xl animate-pulse flex items-center gap-2 max-w-[90%]">
                    <ShieldCheckIcon className="w-6 h-6 shrink-0" />
                    <span className="text-lg sm:text-xl font-black tracking-wider uppercase truncate">GILIRAN: {defender?.nickname}</span>
                </div>
                <div className="bg-black/60 text-white text-[10px] sm:text-xs mt-1 px-3 py-0.5 rounded-full border border-white/30 backdrop-blur-sm">
                    ⚠️ HANYA {defender?.nickname} YANG BOLEH MENJAWAB! ⚠️
                </div>
            </div>

            <div className="w-full flex flex-col items-center justify-center h-full gap-2 mt-8">
                {gameMode === GameMode.GuessTheFlag && currentCountry && (
                    <>
                        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">Tebak Negara</h3>
                        <img src={`https://flagcdn.com/w160/${currentCountry.code}.png`} alt="Flag" className="h-16 w-auto shadow-2xl rounded border-2 border-white/50 mb-2" />
                        <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={true} isHardMode={false} revealLevel={0} />
                    </>
                )}
                
                {(gameMode === GameMode.Trivia || gameMode === GameMode.KpopTrivia || gameMode === GameMode.TriviaBola) && currentTriviaQuestion && (
                    <>
                        <div className="bg-white/10 p-3 rounded-lg border border-white/20 w-full max-w-xs mb-2">
                            <h3 className="text-sm font-bold text-white leading-snug">{currentTriviaQuestion.question}</h3>
                        </div>
                        <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={true} isHardMode={false} revealLevel={0} />
                    </>
                )}

                {(gameMode === GameMode.GuessTheWord || gameMode === GameMode.GuessTheFruit || gameMode === GameMode.GuessTheAnimal || gameMode === GameMode.ZonaFilm) && currentWord && (
                    <>
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-2">Tebak {currentWordCategory}</h3>
                        <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={true} isHardMode={false} revealLevel={0} />
                    </>
                )}
                
                {gameMode === GameMode.ZonaBola && (
                    <>
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-2">Tebak {currentWordCategory}</h3>
                        <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={true} isHardMode={false} revealLevel={0} />
                    </>
                )}
            </div>
        </motion.div>
    );
}


const ABC5DasarContent: React.FC<{ gameState: InternalGameState }> = ({ gameState }) => {
    const { currentLetter, currentCategory } = gameState;
    return (
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-300 mb-4">
            Kategori: <span className="text-amber-500">{currentCategory}</span>
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300">Sebutkan nama-nama yang berawalan dengan huruf:</p>
        <div className="my-4 text-8xl font-bold text-amber-500 dark:text-amber-400 animate-pulse">
            {currentLetter}
        </div>
      </div>
    );
};


const GuessTheWordContent: React.FC<{ gameState: InternalGameState }> = ({ gameState }) => {
    const { currentWord, currentWordCategory, scrambledWord, isRoundActive, isHardMode, revealLevel } = gameState;
  
    return (
      <>
        <h2 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-300 text-center mb-3">
            Kategori: {currentWordCategory}
        </h2>
        <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={isRoundActive} isHardMode={isHardMode} revealLevel={revealLevel} />
        <AnimatePresence>
            {!isRoundActive && currentWord && (
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-center"
                 >
                    <p className="text-lg font-bold text-green-600 dark:text-green-300">
                        {currentWord}
                    </p>
                 </motion.div>
            )}
            </AnimatePresence>
      </>
    );
};

const TriviaContent: React.FC<{ gameState: InternalGameState }> = ({ gameState }) => {
    const { currentTriviaQuestion, isRoundActive, scrambledWord, isHardMode, revealLevel } = gameState;
    if (!currentTriviaQuestion) return null;
  
    return (
      <div className="text-center px-2 flex flex-col items-center justify-center gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-sky-600 dark:text-sky-300 leading-tight">
            {currentTriviaQuestion.question}
        </h2>
        
        <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={isRoundActive} isHardMode={isHardMode} revealLevel={revealLevel} />

        <AnimatePresence>
        {!isRoundActive && (
             <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
             >
                <p className="text-sm text-gray-500 dark:text-gray-400">Jawabannya adalah:</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-300">
                    {currentTriviaQuestion.answer}
                </p>
             </motion.div>
        )}
        </AnimatePresence>
      </div>
    );
};

const GuessTheCityContent: React.FC<{ gameState: InternalGameState }> = ({ gameState }) => {
    const { currentCity, scrambledWord, isRoundActive, isHardMode, revealLevel } = gameState;
    if (!currentCity) return null;

    return (
        <>
            <h2 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-300 text-center mb-3">
                Tebak Nama Kota:
            </h2>
            <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={isRoundActive} isHardMode={isHardMode} revealLevel={revealLevel} />
            
            <AnimatePresence>
            {!isRoundActive && (
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-center"
                 >
                    <p className="text-lg font-bold text-green-600 dark:text-green-300">
                        {currentCity.name}
                    </p>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        ({currentCity.region})
                    </p>
                 </motion.div>
            )}
            </AnimatePresence>
        </>
    );
};

const ZonaBolaContent: React.FC<{ gameState: InternalGameState }> = ({ gameState }) => {
    const { currentWord, currentWordCategory, currentStadium, scrambledWord, isRoundActive, isHardMode, revealLevel } = gameState;
    const answer = currentWord || currentStadium?.name;
    const location = currentStadium?.location;

    return (
        <>
            <h2 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-300 text-center mb-3">
                Tebak: <span className="text-amber-500">{currentWordCategory}</span>
            </h2>
            <ScrambledWordDisplay scrambledWord={scrambledWord} isRoundActive={isRoundActive} isHardMode={isHardMode} revealLevel={revealLevel} />
            
            <AnimatePresence>
            {!isRoundActive && answer && (
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-center"
                 >
                    <p className="text-lg font-bold text-green-600 dark:text-green-300">
                        {answer}
                    </p>
                    {location && (
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            ({location})
                        </p>
                    )}
                 </motion.div>
            )}
            </AnimatePresence>
        </>
    );
};

const Top3List: React.FC<{ title: string; icon: React.ReactNode; data: LeaderboardEntry[]; emptyText: string; theme: 'like' | 'gift'; infoTooltip?: string }> = ({ title, icon, data, emptyText, theme, infoTooltip }) => {
    const top3 = data.slice(0, 3);
    
    const themeClasses = {
        like: {
            bg: 'bg-pink-50 dark:bg-pink-900/20',
            border: 'border-pink-200 dark:border-pink-500/30',
            title: 'text-pink-600 dark:text-pink-400',
            score: 'text-pink-500 dark:text-pink-400',
        },
        gift: {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-500/30',
            title: 'text-amber-600 dark:text-amber-400',
            score: 'text-amber-500 dark:text-amber-400',
        }
    };

    const currentTheme = themeClasses[theme];

    return (
        <div className={`rounded-xl p-2 ${currentTheme.bg} border ${currentTheme.border}`}>
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
                {icon}
                <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.title}`}>{title}</h3>
                {infoTooltip && (
                    <div className="group relative">
                        <InfoIcon className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs text-white bg-gray-900 dark:bg-black rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {infoTooltip}
                        </div>
                    </div>
                )}
            </div>
            {top3.length > 0 ? (
                <div className="space-y-1">
                    {top3.map((entry, index) => (
                        <motion.div
                            key={entry.userId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-2 text-xs"
                        >
                            <span className="font-bold w-4 text-center text-slate-500 dark:text-slate-400">{index + 1}</span>
                            <img src={entry.profilePictureUrl || 'https://i.pravatar.cc/40'} alt={entry.nickname} className="w-5 h-5 rounded-full" />
                            <span className="font-semibold truncate flex-1 text-slate-700 dark:text-slate-300">{entry.nickname}</span>
                            <span className={`font-bold ${currentTheme.score}`}>{entry.score.toLocaleString()}</span>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-2">{emptyText}</p>
            )}
        </div>
    );
};

const GameTab: React.FC<GameTabProps> = ({ gameState, serverTime, gifterLeaderboard, likerLeaderboard }) => {
  const { 
    round, totalRounds, roundWinners, roundTimer, gameMode, currentCategory, 
    availableAnswersCount, maxWinners, gameStyle, knockoutBracket, 
    currentBracketRoundIndex, currentMatchIndex, knockoutMatchPoints, 
    knockoutCategory, footballState, knockoutPlayers 
  } = gameState;
  const progressPercentage = (round / totalRounds) * 100;

  const timerDuration = gameStyle === GameStyle.Knockout ? KNOCKOUT_ROUND_TIMER_SECONDS : ROUND_TIMER_SECONDS;
  const timerProgress = (roundTimer / timerDuration) * 100;

  const maxWinnersForThisRound = gameMode === GameMode.ABC5Dasar && availableAnswersCount != null
    ? Math.min(maxWinners, availableAnswersCount)
    : maxWinners;
    
  const getRoundTitle = () => {
    if (gameStyle === GameStyle.Knockout) {
        if (knockoutCategory === 'Trivia') return "Trivia Pengetahuan Umum";
        if (knockoutCategory === 'GuessTheCountry') return "Tebak Negara";
        if (knockoutCategory === 'ZonaBola') return "Zona Bola";
        if (knockoutCategory === 'TriviaBola') return "Trivia Sepak Bola"; // NEW
        if (knockoutCategory === 'GuessTheFruit') return "Tebak Kata: Buah";
        if (knockoutCategory === 'GuessTheAnimal') return "Tebak Kata: Hewan";
        if (knockoutCategory === 'KpopTrivia') return "Trivia: Zona KPOP";
        if (knockoutCategory === 'ZonaFilm') return "Zona Film";

        if (currentBracketRoundIndex === null || !knockoutBracket || !knockoutBracket[currentBracketRoundIndex]) {
            return "Mode Knockout";
        }
        
        const currentRoundMatchCount = knockoutBracket[currentBracketRoundIndex].length;

        if (currentRoundMatchCount === 1) return "Babak Final";
        if (currentRoundMatchCount === 2) return "Babak Semi-Final";
        if (currentRoundMatchCount === 4) return "Babak Perempat Final";
        if (currentRoundMatchCount === 8) return "Babak 16 Besar";
        
        return `Babak Penyisihan`; // Fallback
    }
    // Classic Mode Titles
    if (gameMode === GameMode.GuessTheFlag) return 'Tebak Bendera';
    if (gameMode === GameMode.GuessTheCity) return 'Tebak Kota';
    if (gameMode === GameMode.ABC5Dasar) return `ABC 5 Dasar`;
    if (gameMode === GameMode.GuessTheWord) return `Tebak Kata Acak`;
    if (gameMode === GameMode.Trivia) return 'Trivia Umum';
    if (gameMode === GameMode.ZonaBola) return 'Zona Bola';
    if (gameMode === GameMode.TriviaBola) return 'Trivia Sepak Bola'; // NEW
    if (gameMode === GameMode.GuessTheFruit) return 'Tebak Buah';
    if (gameMode === GameMode.GuessTheAnimal) return 'Tebak Hewan';
    if (gameMode === GameMode.KpopTrivia) return 'Trivia: Zona KPOP';
    if (gameMode === GameMode.ZonaFilm) return 'Zona Film';
    return '';
  }

  const currentMatch = gameStyle === GameStyle.Knockout && knockoutBracket && currentBracketRoundIndex !== null && currentMatchIndex !== null
    ? knockoutBracket[currentBracketRoundIndex][currentMatchIndex]
    : null;

  return (
    <motion.div 
      key={`${round}-${gameMode}-${currentCategory}-${currentMatch?.id}-${gameState.currentWord}-${gameState.currentCountry?.name}-${gameState.currentTriviaQuestion?.question}-${gameState.currentCity?.name}-${gameState.currentStadium?.name}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="p-3 flex flex-col h-full relative"
    >
      <div className="grid grid-cols-3 items-center text-xs text-gray-500 dark:text-gray-400 shrink-0">
        <span className="text-left">{gameStyle === GameStyle.Classic ? `Ronde ${round} / ${totalRounds}` : `🎯 Rally Point (Target ${KNOCKOUT_TARGET_SCORE})`}</span>
        
        <span className='font-semibold text-center'>{getRoundTitle()}</span>

        <div className="group relative flex items-center gap-1 justify-self-end">
            <ServerIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-mono font-semibold text-gray-600 dark:text-gray-300">
                {formatServerTime(serverTime)}
            </span>
            <div className="absolute top-full right-0 mt-2 w-64 p-2 text-xs text-white bg-gray-900 dark:bg-black rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                Waktu Resmi Server. Semua jawaban dinilai berdasarkan waktu ini, bukan waktu di HP Anda, untuk memastikan keadilan bagi semua pemain karena adanya perbedaan latensi jaringan.
            </div>
        </div>
      </div>

      <div className="w-full bg-sky-100 dark:bg-gray-700 rounded-full h-2 my-2 shrink-0">
        {gameStyle === GameStyle.Classic ? (
          <motion.div
            className="bg-gradient-to-r from-sky-500 to-teal-400 h-2 rounded-full"
            initial={{ width: `${((round - 1) / totalRounds) * 100}%` }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        ) : (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full w-full" />
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 my-2 shrink-0">
        <Top3List 
            title="ORANG GABUT"
            icon={<HeartIcon className="w-3.5 h-3.5 text-pink-500" />}
            data={likerLeaderboard}
            emptyText="Belum ada yang gabut."
            theme="like"
            infoTooltip="Jumlah 'like' adalah perkiraan berdasarkan data yang dikirim oleh TikTok, bukan hitungan pasti setiap tap."
        />
        <Top3List 
            title="ORANG BAIK"
            icon={<GiftIcon className="w-3.5 h-3.5 text-amber-500" />}
            data={gifterLeaderboard}
            emptyText="Belum ada orang baik."
            theme="gift"
        />
      </div>

      <div className="flex-grow flex flex-col items-center justify-center relative min-h-0">
        {currentMatch && currentMatch.player1 && currentMatch.player2 && (
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex justify-between items-center mb-1 px-2 gap-2 shrink-0"
             >
                <div className="flex flex-col items-center text-center flex-1 min-w-0">
                    <p className="font-bold text-sm mt-1 truncate w-full text-slate-700 dark:text-white">{currentMatch.player1.nickname}</p>
                </div>
                <div className="text-center flex-shrink-0 px-2">
                    <p className="text-3xl font-bold text-red-500">
                        {knockoutMatchPoints.player1} - {knockoutMatchPoints.player2}
                    </p>
                </div>
                <div className="flex flex-col items-center text-center flex-1 min-w-0">
                    <p className="font-bold text-sm mt-1 truncate w-full text-slate-700 dark:text-white">{currentMatch.player2.nickname}</p>
                </div>
             </motion.div>
        )}
        
        {/* Main game content area */}
        {gameStyle === GameStyle.Knockout && currentMatch && currentMatch.player1 && currentMatch.player2 ? (
            <div className="relative w-full rounded-xl overflow-hidden border-4 border-white/20 shadow-2xl">
                <FootballField 
                    player1={currentMatch.player1} 
                    player2={currentMatch.player2} 
                    footballState={footballState} 
                    timer={roundTimer}
                    isRoundActive={gameState.isRoundActive}
                />
                
                <AnimatePresence>
                    {gameState.isRoundActive && (
                        <ActiveQuestionDisplay gameState={gameState} />
                    )}
                </AnimatePresence>
            </div>
        ) : (
            // Classic Mode Content Rendering
            <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center">
                {(gameState.gameMode === GameMode.GuessTheWord || gameState.gameMode === GameMode.GuessTheFruit || gameState.gameMode === GameMode.GuessTheAnimal || gameState.gameMode === GameMode.ZonaFilm) && <GuessTheWordContent gameState={gameState} />}
                {gameState.gameMode === GameMode.GuessTheFlag && <GuessTheFlagContent gameState={gameState} />}
                {gameState.gameMode === GameMode.ABC5Dasar && <ABC5DasarContent gameState={gameState} />}
                {(gameState.gameMode === GameMode.Trivia || gameState.gameMode === GameMode.KpopTrivia || gameState.gameMode === GameMode.TriviaBola) && <TriviaContent gameState={gameState} />}
                {gameState.gameMode === GameMode.GuessTheCity && <GuessTheCityContent gameState={gameState} />}
                {gameState.gameMode === GameMode.ZonaBola && <ZonaBolaContent gameState={gameState} />}
            </div>
        )}


        {gameStyle === GameStyle.Knockout && gameState.isRoundActive && (
             <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-2 w-full bg-red-600 rounded-lg shadow-lg flex items-center justify-center p-2 gap-2 z-10 shrink-0 border-2 border-red-400"
             >
                <AlertTriangleIcon className="w-5 h-5 text-yellow-300 animate-pulse" />
                <div className="flex flex-col text-center text-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">TUGAS MENJAWAB</span>
                    <span className="text-sm font-black uppercase tracking-wide leading-none">{knockoutPlayers.find(p => p.userId === footballState.defenderId)?.nickname || '...'}</span>
                </div>
                <AlertTriangleIcon className="w-5 h-5 text-yellow-300 animate-pulse" />
            </motion.div>
        )}

        <div className="mt-2 w-full text-center shrink-0">
          <AnimatePresence mode="wait">
            {roundWinners.length > 0 && gameStyle === GameStyle.Classic ? (
              <motion.div
                key="winner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <div className="flex flex-col items-center gap-1">
                    <p className="text-green-600 dark:text-green-300 font-semibold text-sm">Jawaban Benar Ditemukan!</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Pemenang: <span className="font-bold text-slate-700 dark:text-white">{roundWinners.length}</span> / <span className="font-bold text-slate-700 dark:text-white">{maxWinnersForThisRound}</span>
                    </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-winner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                 {gameStyle === GameStyle.Classic ? (
                    <>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Siapa yang akan menjawab tercepat?</p>
                        <p className="text-amber-500 dark:text-amber-400 text-xs mt-1 font-semibold">Hanya {maxWinnersForThisRound} penebak tercepat yang mendapat poin!</p>
                    </>
                 ) : (
                     // Knockout Timer Status Message (Optional, redundant with Scoreboard)
                     null
                 )}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="w-full max-w-[150px] bg-sky-100 dark:bg-gray-700 rounded-full h-1.5 mx-auto mt-2">
            <motion.div
              className="bg-gradient-to-r from-sky-500 to-teal-400 h-1.5 rounded-full"
              animate={{ width: `${timerProgress}%` }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GameTab;
