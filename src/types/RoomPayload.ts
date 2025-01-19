import Mode from "./Mode";

interface RoomPayload {
  room: string;
  mode: Mode;
  highest_score: number;
  score: number;
  level: number;
}

export default RoomPayload ;
