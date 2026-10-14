import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  SlidersHorizontal,
  HardDrive,
  Cpu,
  Monitor,
  CircuitBoard,
  Sparkles,
  Info,
  Globe,
  Loader2,
  Star,
  ExternalLink,
  Plus,
  RefreshCw,
  Zap,
  Gauge,
  Smartphone,
  Flame,
  Clock,
} from 'lucide-react';
import { GameGenre, GameRecommendationResult, UserSpecs, GameItem } from '../types';
import { GAMES_DATABASE } from '../data/gamesDatabase';
import { GameFilterPreferences, recommendGames } from '../utils/gameRecommender';

interface GamesSectionProps {
  specs: UserSpecs;
}

interface LivePlayabilityData {
  isPlayable: boolean;
  verdictRating: string;
  status: 'likely_suitable' | 'possible_with_compromises' | 'not_recommended';
  expectedFps: string;
  recommendedSettings: string;
  realWorldSummary: string;
  officialMinCpu?: string;
  officialMinGpu?: string;
  mobileNote?: string;
}

interface OnlineGameData {
  title: string;
  genre: string;
  releaseYear: number;
  isFreeToPlay: boolean;
  criticScore?: string;
  reviewSummary?: string;
  overview?: string;
  minCpu?: string;
  recCpu?: string;
  minCpuScore: number;
  recCpuScore: number;
  minGpu?: string;
  recGpu?: string;
  minGpuScore: number;
  recGpuScore: number;
  minRamGb: number;
  recRamGb: number;
  minVramGb: number;
  recVramGb: number;
  storageGb: number;
  requiresSsd: boolean;
  engineNotes?: string;
  optimizationTips?: string;
  livePlayability?: LivePlayabilityData;
}

interface OnlineSearchResponse {
  data: OnlineGameData;
  sources: Array<{ web?: { uri?: string; title?: string } }>;
  isFallback?: boolean;
  isQuotaExceeded?: boolean;
  notice?: string;
  isCached?: boolean;
  searchLatencyMs?: number;
}

interface LivePlayabilityRecord {
  loading: boolean;
  data?: LivePlayabilityData;
  sources?: Array<{ web?: { uri?: string; title?: string } }>;
  error?: string;
  isCached?: boolean;
}

const POPULAR_SEARCHES = [
  'Black Myth: Wukong',
  'Cyberpunk 2077',
  'Grand Theft Auto V',
  'Elden Ring',
  'Helldivers 2',
  'Valorant',
  'Fortnite',
  'Call of Duty: Warzone',
  'Minecraft',
  'Forza Horizon 5',
  'God of War',
  'Baldur\'s Gate 3',
];

export const GamesSection: React.FC<GamesSectionProps> = ({ specs }) => {
  const [preferences, setPreferences] = useState<GameFilterPreferences>({
    genres: [], // Empty means all
    priority: 'smooth',
    allowLowerSettings: true,
    freeOnly: false,
    resolution: specs.displayResolution.includes('2560') ? '1440p' : specs.displayResolution.includes('1366') ? '720p' : '1080p',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'suitable' | 'compromise' | 'unsuitable'>('all');

  // Custom dynamically searched online games
  const [onlineGames, setOnlineGames] = useState<GameItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchElapsedSec, setSearchElapsedSec] = useState(0);
  const [onlineSearchResult, setOnlineSearchResult] = useState<OnlineSearchResponse | null>(null);
  const [onlineSearchError, setOnlineSearchError] = useState<string | null>(null);
  const [searchProgressStep, setSearchProgressStep] = useState<string>('');

  // Live Internet Playability cache for catalog games
  const [livePlayabilityMap, setLivePlayabilityMap] = useState<Record<string, LivePlayabilityRecord>>({});
  const [isVerifyingAllLive, setIsVerifyingAllLive] = useState(false);

  const searchTimerRef = useRef<any>(null);

  const allGenres: GameGenre[] = ['Shooting', 'Open-world', 'Action RPG', 'Racing', 'Strategy', 'Simulation', 'Casual'];

  const toggleGenre = (genre: GameGenre) => {
    setPreferences((prev) => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
      };
    });
  };

  // Combine static DB with any saved online searched games
  const combinedGames = [...onlineGames, ...GAMES_DATABASE];

  // Run game evaluation engine
  const evaluatedGames = recommendGames(combinedGames, specs, preferences);

  // Apply search query and status filter
  const displayedGames = evaluatedGames.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.game.title.toLowerCase().includes(q) && !item.game.genre.toLowerCase().includes(q)) {
        return false;
      }
    }

    const liveRecord = livePlayabilityMap[item.game.id]?.data;
    const effectiveStatus = liveRecord?.status || item.status;

    if (statusFilter === 'suitable' && effectiveStatus !== 'likely_suitable') return false;
    if (statusFilter === 'compromise' && effectiveStatus !== 'possible_with_compromises') return false;
    if (statusFilter === 'unsuitable' && effectiveStatus !== 'not_recommended') return false;

    return true;
  });

  const suitableCount = evaluatedGames.filter((g) => {
    const live = livePlayabilityMap[g.game.id]?.data;
    const st = live?.status || g.status;
    return st === 'likely_suitable';
  }).length;

  const compromiseCount = evaluatedGames.filter((g) => {
    const live = livePlayabilityMap[g.game.id]?.data;
    const st = live?.status || g.status;
    return st === 'possible_with_compromises';
  }).length;

  const unsuitableCount = evaluatedGames.filter((g) => {
    const live = livePlayabilityMap[g.game.id]?.data;
    const st = live?.status || g.status;
    return st === 'not_recommended';
  }).length;

  // Batch verify catalog games against live internet benchmarks
  const handleVerifyAllGamesOnline = async () => {
    setIsVerifyingAllLive(true);
    try {
      const res = await fetch('/api/games/batch-live-playability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          games: combinedGames.map((g) => ({
            id: g.id,
            title: g.title,
            minGpuScore: g.minGpuScore,
            recGpuScore: g.recGpuScore,
          })),
          userSpecs: specs,
        }),
      });

      const json = await res.json();
      if (json.success && json.results) {
        setLivePlayabilityMap((prev) => {
          const updated = { ...prev };
          for (const [id, rec] of Object.entries(json.results as Record<string, any>)) {
            updated[id] = {
              loading: false,
              data: rec.data,
              sources: rec.sources || [],
              isCached: rec.isCached,
            };
          }
          return updated;
        });
      }
    } catch (e) {
      console.error('Batch live playability verification error:', e);
    } finally {
      setIsVerifyingAllLive(false);
    }
  };

  // Auto-connect catalog games to live internet on initial mount / specs change
  useEffect(() => {
    handleVerifyAllGamesOnline();
  }, [specs.gpuName, specs.cpuName, specs.deviceType]);

  // Handle Online Web Search for any game with step feedback
  const handleSearchOnline = async (queryToSearch: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) return;

    setIsSearchingOnline(true);
    setSearchElapsedSec(0);
    setOnlineSearchError(null);
    setOnlineSearchResult(null);
    setSearchProgressStep('Connecting to live gaming databases...');

    const start = Date.now();
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    searchTimerRef.current = setInterval(() => {
      setSearchElapsedSec(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);

    const stepTimer1 = setTimeout(() => {
      setSearchProgressStep('Fetching Steam requirements & verified reviews...');
    }, 500);

    const stepTimer2 = setTimeout(() => {
      setSearchProgressStep(`Testing real-world FPS on ${specs.gpuName || 'your GPU'}...`);
    }, 1400);

    try {
      const res = await fetch('/api/games/online-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, userSpecs: specs }),
      });

      const json = await res.json();
      if (!res.ok || json.error || json.notFound) {
        setOnlineSearchResult(null);
        throw new Error(json.error || "I couldn't find the game. Please check the spelling or search for another game.");
      }

      setOnlineSearchResult(json);
      setOnlineSearchError(null);
    } catch (err: any) {
      console.error('Online game search failed:', err);
      setOnlineSearchResult(null);
      const isNotFound =
        err.message?.toLowerCase().includes("couldn't find") ||
        err.message?.toLowerCase().includes('not found') ||
        err.message?.toLowerCase().includes('failed to search');
      setOnlineSearchError(
        isNotFound
          ? "I couldn't find the game. Please check the title or search for another game."
          : err.message || "I couldn't find the game."
      );
    } finally {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsSearchingOnline(false);
      setSearchProgressStep('');
    }
  };

  // Check live internet playability for catalog game
  const handleCheckLivePlayability = async (gameTitle: string, gameId: string) => {
    setLivePlayabilityMap((prev) => ({
      ...prev,
      [gameId]: { loading: true },
    }));

    try {
      const res = await fetch('/api/games/live-playability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameTitle, userSpecs: specs }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to check live playability');
      }

      setLivePlayabilityMap((prev) => ({
        ...prev,
        [gameId]: {
          loading: false,
          data: json.data,
          sources: json.sources,
          isCached: json.isCached,
        },
      }));
    } catch (err: any) {
      console.error('Live playability check failed:', err);
      setLivePlayabilityMap((prev) => ({
        ...prev,
        [gameId]: {
          loading: false,
          error: err.message || 'Could not query live web benchmarks',
        },
      }));
    }
  };

  const handleAddOnlineGameToCatalog = (data: OnlineGameData) => {
    // Map OnlineGameData to GameItem
    const newGame: GameItem = {
      id: `online_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title,
      genre: (data.genre as GameGenre) || 'Casual',
      releaseYear: data.releaseYear || new Date().getFullYear(),
      isFreeToPlay: Boolean(data.isFreeToPlay),
      minCpuScore: data.minCpuScore || 6500,
      recCpuScore: data.recCpuScore || 16000,
      minGpuScore: data.minGpuScore || 5000,
      recGpuScore: data.recGpuScore || 18000,
      minVramGb: data.minVramGb || 4,
      recVramGb: data.recVramGb || 8,
      minRamGb: data.minRamGb || 8,
      recRamGb: data.recRamGb || 16,
      storageGb: data.storageGb || 50,
      requiresSsd: Boolean(data.requiresSsd),
      notes: data.engineNotes || data.overview || 'Added from live online web search',
      compromiseTips: data.optimizationTips || 'Adjust graphical resolution scaling and texture details',
    };

    setOnlineGames((prev) => [newGame, ...prev]);
    setOnlineSearchResult(null);
  };

  // Evaluate single online search result against active specs
  const localEvaluatedResult: GameRecommendationResult | null = onlineSearchResult
    ? recommendGames(
        [
          {
            id: 'temp_online',
            title: onlineSearchResult.data.title,
            genre: (onlineSearchResult.data.genre as GameGenre) || 'Casual',
            releaseYear: onlineSearchResult.data.releaseYear,
            isFreeToPlay: onlineSearchResult.data.isFreeToPlay,
            minCpuScore: onlineSearchResult.data.minCpuScore,
            recCpuScore: onlineSearchResult.data.recCpuScore,
            minGpuScore: onlineSearchResult.data.minGpuScore,
            recGpuScore: onlineSearchResult.data.recGpuScore,
            minVramGb: onlineSearchResult.data.minVramGb,
            recVramGb: onlineSearchResult.data.recVramGb,
            minRamGb: onlineSearchResult.data.minRamGb,
            recRamGb: onlineSearchResult.data.recRamGb,
            storageGb: onlineSearchResult.data.storageGb,
            requiresSsd: onlineSearchResult.data.requiresSsd,
            notes: onlineSearchResult.data.engineNotes || '',
            compromiseTips: onlineSearchResult.data.optimizationTips || '',
          },
        ],
        specs,
        preferences
      )[0]
    : null;

  // If Gemini provided direct live web-tested playability, prioritize that verdict!
  const livePlay = onlineSearchResult?.data?.livePlayability;
  const effectiveStatus = livePlay
    ? (livePlay.status as GameRecommendationResult['status']) || localEvaluatedResult?.status || 'possible_with_compromises'
    : localEvaluatedResult?.status || 'possible_with_compromises';
  const effectiveBadgeLabel = livePlay?.verdictRating || localEvaluatedResult?.statusBadge || 'Playable';

  const getStatusBadge = (status: GameRecommendationResult['status']) => {
    switch (status) {
      case 'likely_suitable':
        return {
          badge: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'possible_with_compromises':
        return {
          badge: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'not_recommended':
      default:
        return {
          badge: 'bg-rose-950/40 text-rose-300 border-rose-800/40',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
        };
    }
  };

  return (
    <div className="space-y-16">
      {/* Intro Header */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-12 shadow-2xl space-y-8">
        <div className="space-y-3 pb-8 border-b border-zinc-800">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-medium">
            Publisher Telemetry & Requirements
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl text-zinc-100 font-normal tracking-tight">
            Game Compatibility Engine
          </h1>
          <p className="text-sm sm:text-base text-zinc-200 max-w-2xl font-sans">
            Evaluate your active system against verified publisher hardware requirements and real-world shader pipeline demands.
          </p>
        </div>

        {/* User Preferences Form */}
        <div className="space-y-6">
          {/* Genre Preferences */}
          <div className="space-y-3">
            <div className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-medium flex items-center justify-between">
              <span>Filter Catalog By Genre</span>
              <span className="text-zinc-400">
                {preferences.genres.length === 0 ? 'All Genres' : `${preferences.genres.length} Selected`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((g) => {
                const active = preferences.genres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 text-xs uppercase tracking-wider font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-zinc-900 border-emerald-500/60 text-emerald-400'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-zinc-800">
            <div className="space-y-2">
              <label className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-medium">Resolution Target</label>
              <select
                aria-label="Target Gaming Resolution"
                value={preferences.resolution}
                onChange={(e) => setPreferences((p) => ({ ...p, resolution: e.target.value as any }))}
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 p-3 text-xs uppercase tracking-wide focus:outline-none focus:border-emerald-500 rounded-none cursor-pointer"
              >
                <option value="720p">720p (720p Handheld)</option>
                <option value="1080p">1080p (Standard Full HD)</option>
                <option value="1440p">1440p (High-Res 1440p)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-medium">Optimization Priority</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferences((p) => ({ ...p, priority: 'smooth' }))}
                  className={`p-3 text-xs uppercase tracking-wider font-medium border text-center transition-colors cursor-pointer ${
                    preferences.priority === 'smooth'
                      ? 'bg-zinc-900 border-emerald-500/60 text-emerald-400'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:text-zinc-100'
                  }`}
                >
                  60 FPS Smooth
                </button>
                <button
                  type="button"
                  onClick={() => setPreferences((p) => ({ ...p, priority: 'graphics' }))}
                  className={`p-3 text-xs uppercase tracking-wider font-medium border text-center transition-colors cursor-pointer ${
                    preferences.priority === 'graphics'
                      ? 'bg-zinc-900 border-emerald-500/60 text-emerald-400'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:text-zinc-100'
                  }`}
                >
                  Max Quality
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-medium">Settings Tolerance</label>
              <button
                type="button"
                onClick={() => setPreferences((p) => ({ ...p, allowLowerSettings: !p.allowLowerSettings }))}
                className={`w-full p-3 text-xs uppercase tracking-wider font-medium border text-center transition-colors cursor-pointer ${
                  preferences.allowLowerSettings
                    ? 'bg-zinc-900 border-emerald-500/60 text-emerald-400'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:text-zinc-100'
                }`}
              >
                {preferences.allowLowerSettings ? 'Accept Dynamic Scaling' : 'Native Resolution Only'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE INTERNET SEARCH BAR (One button per section) */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-10 space-y-6">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal">
            Query Live Steam & Publisher Registry
          </h2>
          <p className="text-xs text-zinc-300 font-sans">
            Fetch official silicon requirements for any modern PC title in real time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchOnline(searchQuery);
              }}
              placeholder="Search title: e.g. Black Myth: Wukong, Cyberpunk 2077, Elden Ring..."
              className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3.5 text-xs text-zinc-100 uppercase tracking-wide rounded-none focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSearchOnline(searchQuery)}
            disabled={isSearchingOnline || !searchQuery.trim()}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            {isSearchingOnline ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Web...</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 stroke-[1.5]" />
                <span>Verify Requirements</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Trending Popular Searches Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider shrink-0">
            Reference Titles:
          </span>
          {POPULAR_SEARCHES.slice(0, 6).map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                setSearchQuery(title);
                handleSearchOnline(title);
              }}
              className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/60 text-zinc-300 hover:text-emerald-400 transition-colors"
            >
              {title}
            </button>
          ))}
        </div>

        {/* Live Internet Search In-Flight Progress */}
        {isSearchingOnline && (
          <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-emerald-400" />
              <div>
                <span className="font-semibold text-zinc-200">Live Web Search & Benchmark:</span>
                <span className="text-zinc-400 ml-1.5">{searchProgressStep || 'Querying live gaming databases...'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                {searchElapsedSec}s
              </span>
              <span className="text-[10px] font-mono uppercase text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Web Grounded
              </span>
            </div>
          </div>
        )}

        {/* Live Internet Search Error */}
        {onlineSearchError && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-300">I couldn't find the game</div>
              <div className="text-zinc-300 mt-0.5">{onlineSearchError}</div>
            </div>
          </div>
        )}

        {/* Real-Time Retrieved Online Game Card */}
        {onlineSearchResult && (
          <div className="mt-6 p-8 bg-zinc-950 border border-zinc-800 space-y-6">
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Game Found: <strong>{onlineSearchResult.data.title}</strong></span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 border flex items-center gap-1 ${
                      onlineSearchResult.isQuotaExceeded
                        ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
                        : 'bg-zinc-900 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    <Globe className="w-3 h-3" />{' '}
                    {onlineSearchResult.isQuotaExceeded ? 'Offline Hardware Profile' : 'Live Web Grounded'}
                  </span>
                  {onlineSearchResult.isCached && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Instant Cache
                    </span>
                  )}
                  <span className="text-zinc-300 font-mono text-xs">{onlineSearchResult.data.genre}</span>
                  <span className="text-zinc-700">|</span>
                  <span className="text-zinc-300 font-mono text-xs">{onlineSearchResult.data.releaseYear}</span>
                </div>

                <h2 className="font-serif text-3xl text-zinc-100 font-normal mt-3">
                  {onlineSearchResult.data.title}
                </h2>

                {onlineSearchResult.data.overview && (
                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed max-w-2xl font-sans">
                    {onlineSearchResult.data.overview}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 ${
                  getStatusBadge(effectiveStatus).badge
                }`}
              >
                {getStatusBadge(effectiveStatus).icon}
                <span>{effectiveBadgeLabel}</span>
              </div>
            </div>

            {/* LIVE REAL-WORLD PLAYABILITY PANEL GROUNDED IN WEB BENCHMARKS */}
            {onlineSearchResult.data.livePlayability && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    Live Web Real-World Playability Verdict ({specs.gpuName || 'Your GPU'})
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                    {onlineSearchResult.data.livePlayability.verdictRating}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
                    <div className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1.5">
                      <Gauge className="w-3 h-3" /> Expected Framerate:
                    </div>
                    <div className="text-zinc-100 font-bold text-sm mt-0.5">
                      {onlineSearchResult.data.livePlayability.expectedFps}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
                    <div className="text-[10px] font-mono uppercase text-cyan-400 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3 h-3" /> Recommended Graphics Settings:
                    </div>
                    <div className="text-zinc-100 font-medium text-xs mt-0.5">
                      {onlineSearchResult.data.livePlayability.recommendedSettings}
                    </div>
                  </div>
                </div>

                {onlineSearchResult.data.livePlayability.realWorldSummary && (
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
                    <strong className="text-emerald-400">Web Testing Consensus: </strong>
                    {onlineSearchResult.data.livePlayability.realWorldSummary}
                  </p>
                )}

                {/* Mobile Specific Gameplay Note */}
                {specs.deviceType === 'phone' && (
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs flex items-start gap-2 text-blue-200">
                    <Smartphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-300">Smartphone Playability: </strong>
                      {onlineSearchResult.data.livePlayability.mobileNote ||
                        'Title playable at 60 FPS on mobile via Cloud Gaming (GeForce NOW / Xbox Cloud) or native mobile app stores.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Online Reviews Consensus Callout */}
            {onlineSearchResult.data.reviewSummary && (
              <div className="mt-4 p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-1">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-emerald-400" />
                  Live Web Review & Player Consensus:
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  "{onlineSearchResult.data.reviewSummary}"
                </p>
              </div>
            )}

            {/* Official Requirements vs User Rig */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80 space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Official Minimum Specs:</div>
                <div className="text-zinc-300 font-medium">CPU: {onlineSearchResult.data.minCpu || 'Standard Multi-Core'}</div>
                <div className="text-zinc-300 font-medium">GPU: {onlineSearchResult.data.minGpu || '4GB Dedicated / Fast iGPU'}</div>
                <div className="text-zinc-400 text-[11px]">RAM: {onlineSearchResult.data.minRamGb} GB · Storage: {onlineSearchResult.data.storageGb} GB</div>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80 space-y-1">
                <div className="text-[10px] font-mono uppercase text-emerald-400">Official Recommended Specs:</div>
                <div className="text-zinc-300 font-medium">CPU: {onlineSearchResult.data.recCpu || 'High-End 8-Core'}</div>
                <div className="text-zinc-300 font-medium">GPU: {onlineSearchResult.data.recGpu || '8GB+ Dedicated Modern GPU'}</div>
                <div className="text-zinc-400 text-[11px]">RAM: {onlineSearchResult.data.recRamGb} GB · {onlineSearchResult.data.requiresSsd ? 'SSD Mandatory' : 'SSD Recommended'}</div>
              </div>
            </div>

            {/* Compatibility Verdict & Recommendation */}
            <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-zinc-400">Rig Target Profile: </span>
                <strong className="text-zinc-200">
                  {localEvaluatedResult?.recommendedResolution || preferences.resolution} · {localEvaluatedResult?.recommendedSettings || 'Optimal Settings'}
                </strong>
                {localEvaluatedResult?.bottlenecks && localEvaluatedResult.bottlenecks.length > 0 && (
                  <span className="text-amber-400 ml-2">({localEvaluatedResult.bottlenecks[0]})</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAddOnlineGameToCatalog(onlineSearchResult.data)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-xs font-semibold rounded-md border border-zinc-700 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Track in My Evaluated Games
              </button>
            </div>

            {/* Grounding Web Sources */}
            {onlineSearchResult.sources && onlineSearchResult.sources.length > 0 && (
              <div className="mt-3 pt-2 text-[10px] text-zinc-500 flex flex-wrap items-center gap-2">
                <span>Verified against web sources:</span>
                {onlineSearchResult.sources.slice(0, 3).map((s, idx) => (
                  s.web?.uri ? (
                    <a
                      key={idx}
                      href={s.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-emerald-400 underline truncate max-w-[200px] flex items-center gap-0.5"
                    >
                      {s.web.title || s.web.uri}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : null
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Filter Tabs & Live Web Connect Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              All Games ({evaluatedGames.length})
            </button>
            <button
              onClick={() => setStatusFilter('suitable')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'suitable'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Likely Suitable ({suitableCount})
            </button>
            <button
              onClick={() => setStatusFilter('compromise')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'compromise'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              With Compromises ({compromiseCount})
            </button>
            <button
              onClick={() => setStatusFilter('unsuitable')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'unsuitable'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Not Recommended ({unsuitableCount})
            </button>
          </div>

          <button
            type="button"
            onClick={handleVerifyAllGamesOnline}
            disabled={isVerifyingAllLive}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-semibold transition-all shrink-0 self-start sm:self-auto"
          >
            {isVerifyingAllLive ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                Connecting Catalog to Web...
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Connect All to Live Web
              </>
            )}
          </button>
        </div>
      </div>

      {/* Game Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedGames.map((item) => {
          const game = item.game;
          const liveCheck = livePlayabilityMap[game.id];
          const liveData = liveCheck?.data;

          // If live web benchmark exists, dynamically compute the card status from real web tests!
          const effectiveCardStatus: GameRecommendationResult['status'] = liveData
            ? liveData.status || (liveData.isPlayable ? 'likely_suitable' : 'possible_with_compromises')
            : item.status;
          const badge = getStatusBadge(effectiveCardStatus);
          const badgeLabel = liveData?.verdictRating || item.statusBadge;

          return (
            <div
              key={game.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">{game.genre}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-[11px] text-zinc-400">{game.releaseYear}</span>
                      {liveData && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40 flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" /> Web Verified
                          </span>
                        </>
                      )}
                      {game.isFreeToPlay && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/60 px-1 rounded border border-emerald-800/30">
                            Free-to-Play
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 mt-1">{game.title}</h3>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border shrink-0 ${badge.badge}`}
                  >
                    {badge.icon}
                    <span>{badgeLabel}</span>
                  </div>
                </div>

                {/* Explanation */}
                <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {liveData?.realWorldSummary || item.explanation}
                </p>

                {/* Recommended Resolution & Settings */}
                <div className="mt-3.5 p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Target Profile:</span>
                  <span className="font-semibold text-zinc-200">
                    {liveData ? `${liveData.expectedFps} · ${liveData.recommendedSettings}` : `${item.recommendedResolution} · ${item.recommendedSettings}`}
                  </span>
                </div>

                {/* Component Status Grid */}
                <div className="grid grid-cols-4 gap-2 mt-3.5 text-xs text-center">
                  <div className="p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                    <div className="text-[10px] text-zinc-500 uppercase">CPU</div>
                    <div
                      className={`text-[11px] font-bold mt-0.5 ${
                        item.cpuStatus === 'pass'
                          ? 'text-emerald-400'
                          : item.cpuStatus === 'warning'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {item.cpuStatus === 'pass' ? 'Pass' : item.cpuStatus === 'warning' ? 'Min' : 'Below'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                    <div className="text-[10px] text-zinc-500 uppercase">GPU</div>
                    <div
                      className={`text-[11px] font-bold mt-0.5 ${
                        item.gpuStatus === 'pass'
                          ? 'text-emerald-400'
                          : item.gpuStatus === 'warning'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {item.gpuStatus === 'pass' ? 'Pass' : item.gpuStatus === 'warning' ? 'Min' : 'Below'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                    <div className="text-[10px] text-zinc-500 uppercase">RAM</div>
                    <div
                      className={`text-[11px] font-bold mt-0.5 ${
                        item.ramStatus === 'pass'
                          ? 'text-emerald-400'
                          : item.ramStatus === 'warning'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {item.ramStatus === 'pass' ? 'Pass' : item.ramStatus === 'warning' ? 'Min' : 'Below'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                    <div className="text-[10px] text-zinc-500 uppercase">VRAM</div>
                    <div
                      className={`text-[11px] font-bold mt-0.5 ${
                        item.vramStatus === 'pass'
                          ? 'text-emerald-400'
                          : item.vramStatus === 'warning'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {item.vramStatus === 'pass' ? 'Pass' : item.vramStatus === 'warning' ? 'Min' : 'Below'}
                    </div>
                  </div>
                </div>

                {/* Bottlenecks Warning */}
                {item.bottlenecks.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {item.bottlenecks.map((b, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-400/90">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* LIVE WEB PLAYABILITY CHECK PANEL */}
                {liveCheck && liveCheck.data && (
                  <div className="mt-3.5 p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-600/40 text-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-emerald-300 font-bold flex items-center gap-1.5 text-[11px]">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        Live Web Benchmarks for Your Rig:
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                        {liveCheck.data.verdictRating}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-zinc-950/80 rounded border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] block">Expected FPS:</span>
                        <strong className="text-zinc-100">{liveCheck.data.expectedFps}</strong>
                      </div>
                      <div className="p-2 bg-zinc-950/80 rounded border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] block">Settings:</span>
                        <strong className="text-zinc-200 truncate block">{liveCheck.data.recommendedSettings}</strong>
                      </div>
                    </div>

                    {liveCheck.data.realWorldSummary && (
                      <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-950/40 p-2 rounded border border-zinc-800/60">
                        {liveCheck.data.realWorldSummary}
                      </p>
                    )}

                    {specs.deviceType === 'phone' && liveCheck.data.mobileNote && (
                      <div className="text-[11px] text-blue-300 bg-blue-950/30 p-2 rounded border border-blue-800/40 flex items-start gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                        <span>{liveCheck.data.mobileNote}</span>
                      </div>
                    )}
                  </div>
                )}

                {liveCheck && liveCheck.error && (
                  <div className="mt-2 text-[11px] text-rose-300 bg-rose-950/30 p-2 rounded border border-rose-800/40">
                    {liveCheck.error}
                  </div>
                )}
              </div>

              {/* Bottom Actions: Live Web Check Button & Engine Notes */}
              <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-[11px] text-zinc-400">
                <button
                  type="button"
                  onClick={() => handleCheckLivePlayability(game.title, game.id)}
                  disabled={liveCheck?.loading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-xs font-semibold rounded-md border border-zinc-700 transition-colors shrink-0 disabled:opacity-60"
                >
                  {liveCheck?.loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      Checking Web FPS...
                    </>
                  ) : liveCheck?.data ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      Re-check Live Web
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      Verify Live Playability on Web
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-zinc-500 text-[10px]">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-zinc-500" />
                    {game.storageGb} GB
                  </span>
                  <span className="truncate max-w-[150px] text-right" title={game.notes}>
                    {game.notes}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedGames.length === 0 && (
        <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 text-xs space-y-3">
          <p>No games in the local catalog match "{searchQuery}".</p>
          <button
            type="button"
            onClick={() => handleSearchOnline(searchQuery)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4" />
            Search the Live Internet for "{searchQuery}"
          </button>
        </div>
      )}
    </div>
  );
};
