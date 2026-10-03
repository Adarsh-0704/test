import type {BoardStringLayout} from "../types/board";

enum GameStatus {NOT_STARTED, ACTIVE, WHITE_WON, BLACK_WON, DRAW}
enum GameResult {PENDING = -1, ABORT, RESIGN, CHECKMATE, TIMEOUT, ABANDONED, STALEMATE, THREE_FOLD_REPETITION, FIFTY_MOVE_RULE, DRAW_BY_AGREEMENT, DRAW_BY_INSUFFICIENT_MATERIAL}

const BOARD_SIZE = 8;

const DefaultBoard: BoardStringLayout = [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
];

export {GameStatus, GameResult, BOARD_SIZE, DefaultBoard};