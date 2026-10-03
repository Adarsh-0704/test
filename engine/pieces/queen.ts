import type {Move} from "../types";
import type {PieceColor} from "../types/piece";
import {Piece} from "./piece";

const QueenMoves: Move[] = [
    { vec: { dx:  0, dy:  1 }, isSliding: true, canAttack: true },
    { vec: { dx:  0, dy: -1 }, isSliding: true, canAttack: true },
    { vec: { dx:  1, dy:  0 }, isSliding: true, canAttack: true },
    { vec: { dx: -1, dy:  0 }, isSliding: true, canAttack: true },
    { vec: { dx:  1, dy:  1 }, isSliding: true, canAttack: true },
    { vec: { dx: -1, dy:  1 }, isSliding: true, canAttack: true },
    { vec: { dx: -1, dy: -1 }, isSliding: true, canAttack: true },
    { vec: { dx:  1, dy: -1 }, isSliding: true, canAttack: true }
];

class Queen extends Piece
{
    static readonly moves = QueenMoves;

    constructor(color: PieceColor)
    {
        super(color, "queen");
    }

    public getMoves(): readonly Move[]
    {
        return Queen.moves;
    }
}

export { Queen };