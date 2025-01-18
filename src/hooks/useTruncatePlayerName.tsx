const useTruncateplayer = (player: string, wordLength: number) => {
  let truncatedName = player;

  if (wordLength === 9) {
    truncatedName = player.length > 8 ? player.substring(0, 8) + '...' : player;
  } else if (wordLength === 8) {
    truncatedName = player.length > 10 ? player.substring(0, 10) + '...' : player;
  } else if (wordLength === 7) {
    truncatedName = player.length > 12 ? player.substring(0, 12) + '...' : player;
  } else if (wordLength === 6) {
    truncatedName = player.length > 14 ? player.substring(0, 14) + '...' : player;
  } else if (wordLength === 5) {
    truncatedName = player.length > 16 ? player.substring(0, 16) + '...' : player;
  } else if (wordLength === 4) {
    truncatedName = player.length > 18 ? player.substring(0, 18) + '...' : player;
  }

  return truncatedName;
};

export default useTruncateplayer;
