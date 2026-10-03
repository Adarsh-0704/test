import type {Move} from "../types";
import type {PieceColor} from "../types/piece";
import {Piece} from "./piece";

const RookMoves: Move[] = [
    { vec: { dx:  0, dy:  1 }, isSliding: true, canAttack: true },
    { vec: { dx:  0, dy: -1 }, isSliding: true, canAttack: true },
    { vec: { dx:  1, dy:  0 }, isSliding: true, canAttack: true },
    { vec: { dx: -1, dy:  0 }, isSliding: true, canAttack: true }
];

class Rook extends Piece
{
    static readonly moves = RookMoves;

    constructor(color: PieceColor)
    {
        super(color, "rook");
    }

    public getMoves(): readonly Move[]
    {
        return Rook.moves;
    }
}

export { Rook };