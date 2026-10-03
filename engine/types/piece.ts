type PieceColor = "white" | "black";
type PieceName = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";

type PieceColorCode = "w" | "b";
type PieceNameCode = "P" | "N" | "B" | "R" | "Q" | "K";
type PieceLayoutCode = `${PieceColorCode}${PieceNameCode}`;

export type { PieceColor, PieceName, PieceColorCode, PieceNameCode, PieceLayoutCode };