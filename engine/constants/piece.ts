import type {PieceName, PieceNameCode} from "../types/piece";

const PieceType = { pawn: 0, knight: 1, bishop: 2, rook: 3, queen: 4, king: 5 } as const satisfies Record<PieceName, number>;
const PieceMaterialValue  = { king: 0, pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 } as const satisfies Record<PieceName, number>;

const PieceCode = { pawn: "P", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K" } as const satisfies Record<PieceName, PieceNameCode>;

export { PieceType, PieceMaterialValue, PieceCode };