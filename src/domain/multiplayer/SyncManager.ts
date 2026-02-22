import {
  getRoundWords,
  getLatestRoundId,
  seedRoundWords,
  submitWord,
  DbResponse,
} from '../../services/multiplayer';
import { countLetters, canFormWord } from '../../utils';
import Word from '../../types/Word';

export interface WordSyncResult {
  words: Word[];
  syncedCount: number;
}

export class SyncManager {
  /**
   * Sincroniza las palabras de una ronda con el servidor
   */
  async syncRoundWords(
    roomId: number,
    roundId: number,
    localWords: Word[]
  ): Promise<WordSyncResult> {
    const { data: serverWords } = await getRoundWords(roomId, roundId);

    if (!serverWords || serverWords.length === 0) {
      return {
        words: localWords,
        syncedCount: 0,
      };
    }

    // Actualizar palabras locales con el estado del servidor
    const syncedWords = localWords.map(localWord => {
      const serverWord = serverWords.find(sw => sw.word === localWord.word);
      
      if (serverWord && serverWord.status === 'correct') {
        return { ...localWord, guessed: true };
      }
      
      return localWord;
    });

    const syncedCount = syncedWords.filter(w => w.guessed).length;

    return {
      words: syncedWords,
      syncedCount,
    };
  }

  /**
   * Obtiene el ID de la ronda actual
   */
  async getCurrentRoundId(roomId: number): Promise<number | null> {
    const { data: roundId } = await getLatestRoundId(roomId);
    return roundId;
  }

  /**
   * Carga las palabras de una ronda con reintentos
   */
  async loadRoundWordsWithRetry(
    roomId: number,
    roundId: number,
    maxAttempts: number = 15,
    baseDelay: number = 300
  ): Promise<{ word: string; status: string }[] | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data } = await getRoundWords(roomId, roundId);
      
      if (data && data.length > 0) {
        return data;
      }
      
      if (attempt < maxAttempts - 1) {
        const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  }

  /**
   * Siembra las palabras posibles en el servidor
   */
  async seedWords(
    roomCode: string,
    currentWord: string,
    allWords: string[]
  ): Promise<DbResponse<{ inserted: number }>> {
    const lettersCount = countLetters(currentWord);
    const filteredWords = allWords.filter(
      word => word.length >= 4 && word.length <= 9
    );
    
    const possibleWords = filteredWords.filter(w =>
      canFormWord(countLetters(w), lettersCount)
    );
    
    possibleWords.sort((a, b) => a.length - b.length || a.localeCompare(b));
    
    return await seedRoundWords(roomCode, possibleWords);
  }

  /**
   * Envía una palabra al servidor
   */
  async submitPlayerWord(
    roomCode: string,
    playerId: number,
    word: string,
    isValid: boolean
  ): Promise<DbResponse<{ status: string }>> {
    return await submitWord(roomCode, playerId, word, isValid);
  }

  /**
   * Marca palabras como acertadas desde datos del servidor
   */
  markWordsFromServer(
    localWords: Word[],
    serverWords: { word: string; status: string }[]
  ): Word[] {
    return localWords.map(localWord => {
      const serverWord = serverWords.find(sw => sw.word === localWord.word);
      
      if (serverWord && serverWord.status === 'correct') {
        return { ...localWord, guessed: true };
      }
      
      return localWord;
    });
  }

  /**
   * Combina palabras locales con intentos del jugador
   */
  mergePlayerAttempts(
    localWords: Word[],
    playerAttempts: { word: string; status: string }[]
  ): Word[] {
    return localWords.map(localWord => {
      const playerAttempt = playerAttempts.find(
        pa => pa.word === localWord.word && pa.status === 'correct'
      );
      
      if (playerAttempt) {
        return { ...localWord, guessed: true };
      }
      
      return localWord;
    });
  }

  /**
   * Sincroniza el estado completo de una ronda
   */
  async syncCompleteRoundState(
    roomId: number,
    roundId: number,
    localWords: Word[],
    playerAttempts: { word: string; status: string }[]
  ): Promise<Word[]> {
    const serverWords = await this.loadRoundWordsWithRetry(roomId, roundId);
    
    if (!serverWords) {
      // Si no hay datos del servidor, usar solo intentos locales
      return this.mergePlayerAttempts(localWords, playerAttempts);
    }
    
    // Combinar datos del servidor con intentos locales
    let syncedWords = this.markWordsFromServer(localWords, serverWords);
    syncedWords = this.mergePlayerAttempts(syncedWords, playerAttempts);
    
    return syncedWords;
  }
}

export default SyncManager;
