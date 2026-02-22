import {
  createRoomWithHost,
  joinRoomAsPlayer,
  getRoomPlayers,
  startRoomWithWord,
  finishRoundToLobby,
  finishRoundToLost,
  setNewRoomCode,
  DbResponse,
  RoomRow,
  RoomPlayerRow,
} from '../../services/multiplayer';
import Difficulty from '../../types/Difficulty';

export interface RoomInfo {
  roomId: number;
  roomCode: string;
  playerId: number;
  playerName: string;
  role: 'host' | 'player';
  difficulty: Difficulty;
}

export class RoomManager {
  /**
   * Crea una nueva sala con el host
   */
  async createRoom(
    roomCode: string,
    hostName: string,
    difficulty: Difficulty
  ): Promise<DbResponse<RoomInfo>> {
    const result = await createRoomWithHost(roomCode, hostName, difficulty);

    if (result.error || !result.data) {
      return { data: null, error: result.error };
    }

    return {
      data: {
        roomId: result.data.room.id,
        roomCode: result.data.room.code,
        playerId: result.data.host.id,
        playerName: hostName,
        role: 'host',
        difficulty,
      },
      error: null,
    };
  }

  /**
   * Une un jugador a una sala existente
   */
  async joinRoom(
    roomCode: string,
    playerName: string
  ): Promise<DbResponse<RoomInfo>> {
    const result = await joinRoomAsPlayer(roomCode, playerName);

    if (result.error || !result.data) {
      return { data: null, error: result.error };
    }

    return {
      data: {
        roomId: result.data.room.id,
        roomCode: result.data.room.code,
        playerId: result.data.player.id,
        playerName,
        role: 'player',
        difficulty: 'medium', // Se obtiene del estado de la sala
      },
      error: null,
    };
  }

  /**
   * Obtiene la lista de jugadores en una sala
   */
  async getPlayers(roomId: number): Promise<DbResponse<RoomPlayerRow[]>> {
    return await getRoomPlayers(roomId);
  }

  /**
   * Inicia una nueva ronda con una palabra
   */
  async startRound(
    roomCode: string,
    word: string
  ): Promise<DbResponse<RoomRow>> {
    return await startRoomWithWord(roomCode, word);
  }

  /**
   * Finaliza la ronda y avanza al lobby
   */
  async finishRoundSuccess(roomCode: string): Promise<DbResponse<RoomRow>> {
    return await finishRoundToLobby(roomCode);
  }

  /**
   * Finaliza la ronda por pérdida
   */
  async finishRoundFailure(
    roomCode: string,
    level: number,
    score: number,
    rounds: number,
    perfects: number
  ): Promise<DbResponse<RoomRow>> {
    return await finishRoundToLost(roomCode, level, score, rounds, perfects);
  }

  /**
   * Crea una nueva sala para jugar de nuevo
   */
  async createNewRoomForRematch(
    oldRoomCode: string,
    newRoomCode: string,
    hostName: string,
    difficulty: Difficulty
  ): Promise<DbResponse<RoomInfo>> {
    // Crear la nueva sala
    const createResult = await this.createRoom(newRoomCode, hostName, difficulty);
    
    if (createResult.error || !createResult.data) {
      return createResult;
    }

    // Notificar a los jugadores sobre la nueva sala
    await setNewRoomCode(oldRoomCode, newRoomCode);

    return createResult;
  }

  /**
   * Valida si un código de sala es válido
   */
  validateRoomCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code);
  }

  /**
   * Genera un código de sala aleatorio
   */
  generateRoomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Verifica si un nombre de jugador es válido
   */
  validatePlayerName(name: string): { valid: boolean; error?: string } {
    if (name.length < 3) {
      return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
    }
    if (name.length > 10) {
      return { valid: false, error: 'El nombre no puede tener más de 10 caracteres' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return { valid: false, error: 'El nombre solo puede contener letras, números y guiones bajos' };
    }
    return { valid: true };
  }
}

export default RoomManager;
