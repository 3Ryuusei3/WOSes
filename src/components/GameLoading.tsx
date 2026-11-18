import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import useCountdown from "../hooks/useCountdown";
import useRandomWords from "../hooks/useRandomWords";
import { advanceRoomToGame, withRetry } from "../services/multiplayer";
import { roomRealtime } from "../realtime/roomRealtime";
import useGameStore from "../store/useGameStore";

import countdownMusic from "../assets/countdown.mp3";

export default function GameLoading() {
  const { t } = useTranslation();
  const { volume, role, players, roomCode, gameDifficulty } = useGameStore();
  const countdown = useCountdown();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // En multiplayer, la palabra ya está establecida por GameRoom o GameLobby
  // Solo generar palabra en singleplayer
  useRandomWords(gameDifficulty, players === "multi");

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(countdownMusic);
      const effectiveVolume =
        players === "multi" && role === "player" ? 0 : volume;
      audioRef.current.volume = effectiveVolume;

      timeoutRef.current = setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [volume]);

  // Fin de la cuenta atrás en multijugador
  const countdownDone = countdown <= 0;
  useEffect(() => {
    if (!countdownDone || players !== "multi" || !roomCode) return;

    if (role === "host") {
      // El host pasa la sala a 'game' (con reintentos si falla la red)
      void withRetry(() => advanceRoomToGame(roomCode)).then(() =>
        roomRealtime.resync(),
      );
    }

    // Si el evento 'game' no llega, lo preguntamos al servidor.
    // (useRoomSync cambia de pantalla en cuanto el estado sea 'game')
    const interval = setInterval(() => {
      void roomRealtime.resync();
    }, 1500);
    return () => clearInterval(interval);
  }, [countdownDone, players, role, roomCode]);

  useEffect(() => {
    if (audioRef.current) {
      const effectiveVolume =
        players === "multi" && role === "player" ? 0 : volume;
      audioRef.current.volume = effectiveVolume;
    }
  }, [volume, players, role]);

  return (
    <div className="game__container">
      <h2 className="highlight">{t("game.gameStartsIn")}</h2>
      <div className="loading__container">
        <h2 className="highlight">
          {countdown <= 0 ? t("game.start") : Math.ceil(countdown)}
        </h2>
        <div className="loading__container--box loading__container--box-xl"></div>
        <div className="loading__container--box loading__container--box-lg"></div>
        <div className="loading__container--box loading__container--box-md"></div>
        <div className="loading__container--box"></div>
      </div>
    </div>
  );
}
