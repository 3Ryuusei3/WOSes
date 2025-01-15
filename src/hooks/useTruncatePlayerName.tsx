const useTruncatePlayerName = (playerName: string, wordLength: number) => {
  let truncatedName = playerName;

  if (wordLength === 9) {
    truncatedName = playerName.length > 8 ? playerName.substring(0, 8) + '...' : playerName;
  } else if (wordLength === 8) {
    truncatedName = playerName.length > 10 ? playerName.substring(0, 10) + '...' : playerName;
  } else if (wordLength === 7) {
    truncatedName = playerName.length > 12 ? playerName.substring(0, 12) + '...' : playerName;
  } else if (wordLength === 6) {
    truncatedName = playerName.length > 14 ? playerName.substring(0, 14) + '...' : playerName;
  } else if (wordLength === 5) {
    truncatedName = playerName.length > 16 ? playerName.substring(0, 16) + '...' : playerName;
  } else if (wordLength === 4) {
    truncatedName = playerName.length > 18 ? playerName.substring(0, 18) + '...' : playerName;
  }

  return truncatedName;
};

export default useTruncatePlayerName;
