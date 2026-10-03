import type {PieceLayoutCode} from "./piece";
import type {Position} from "./move";
import type {SoftFixedArrayGrid} from "./util";
import {BOARD_SIZE} from "../game";
import {Piece} from "../pieces";

type BoardStringLayout = SoftFixedArrayGrid<(PieceLayoutCode | null), typeof BOARD_SIZE>;

type PiecePositionMap = SoftFixedArrayGrid<(Piece | null), typeof BOARD_SIZE>;

interface MoveChange {
    type: "move";
    piece: Piece;
    from: Position;
    to: Position;
}

interface PromotionChange {
    type: "promotion";
    piece: Piece;
    to: Position;
}

interface CaptureChange {
    type: "capture";
    piece: Piece;
    from: Position;
}

type BoardChange = MoveChange | PromotionChange | CaptureChange;

export type { PiecePositionMap, BoardStringLayout, MoveChange, PromotionChange, CaptureChange, BoardChange };