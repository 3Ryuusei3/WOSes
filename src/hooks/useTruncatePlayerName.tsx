const useTruncatePlayerName = (playerName: string, wordLength: number) => {
  let truncatedName = playerName;

  if (wordLength === 8) {
    truncatedName = playerName.length > 4 ? playerName.substring(0, 4) + '...' : playerName;
  } else if (wordLength === 7) {
    truncatedName = playerName.length > 7 ? playerName.substring(0, 7) + '...' : playerName;
  } else if (wordLength === 6) {
    truncatedName = playerName.length > 9 ? playerName.substring(0, 9) + '...' : playerName;
  } else if (wordLength === 5) {
    truncatedName = playerName.length > 12 ? playerName.substring(0, 12) + '...' : playerName;
  } else if (wordLength === 4) {
    truncatedName = playerName.length > 14 ? playerName.substring(0, 14) + '...' : playerName;
  }

  return truncatedName;
};

export default useTruncatePlayerName;
