import {GameResult, type GameStatus} from "../constants/game";
import type {CastleType} from "../constants/castleType";

interface GameOutcome {
    status: GameStatus;
    result: GameResult;
}

interface GameSpecialRights {
    castlingRights: Record<CastleType, boolean>;
    enPassantFile: number | null
}

export { GameOutcome, GameSpecialRights };