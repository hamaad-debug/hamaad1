import { GameItem } from '../types';
import pcDatabase from './pc_database.json';

/**
 * GAMES DATABASE (STRICTLY FROM pc_database.json)
 * Rule: Use pc_database.json as the ONLY data source.
 * If a game requirement is not in it, use Gemini API.
 * If that is also unavailable, show 'Not enough data'.
 * Never invent requirements.
 */
export const GAMES_DATABASE: GameItem[] = (pcDatabase.games || []) as GameItem[];
