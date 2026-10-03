import type {Move} from "../types";
import type {PieceColor} from "../types/piece";
import {Piece} from "./piece";

const BishopMoves: Move[] = [
    { vec: { dx:  1, dy:  1 }, isSliding: true, canAttack: true },
    { vec: { dx: -1, dy:  1 }, isSliding: true, canAttack: true },
    { vec: { dx: -1, dy: -1 }, isSliding: true, canAttack: true },
    { vec: { dx:  1, dy: -1 }, isSliding: true, canAttack: true }
];

class Bishop extends Piece
{
    static readonly moves = BishopMoves;

    constructor(color: PieceColor)
    {
        super(color, "bishop");
    }

    public getMoves(): readonly Move[]
    {
        return Bishop.moves;
    }
}

export { Bishop };