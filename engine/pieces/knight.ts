import type {Move} from "../types";
import type {PieceColor} from "../types/piece";
import {Piece} from "./piece";

const KnightMoves: Move[] = [
    { vec: { dx:  1, dy:  2 }, isSliding: false, canAttack: true },
    { vec: { dx: -1, dy:  2 }, isSliding: false, canAttack: true },
    { vec: { dx:  1, dy: -2 }, isSliding: false, canAttack: true },
    { vec: { dx: -1, dy: -2 }, isSliding: false, canAttack: true },
    { vec: { dx:  2, dy:  1 }, isSliding: false, canAttack: true },
    { vec: { dx: -2, dy:  1 }, isSliding: false, canAttack: true },
    { vec: { dx:  2, dy: -1 }, isSliding: false, canAttack: true },
    { vec: { dx: -2, dy: -1 }, isSliding: false, canAttack: true }
];

class Knight extends Piece
{
    static readonly moves = KnightMoves;

    constructor(color: PieceColor)
    {
        super(color, "knight");
    }

    public getMoves(): readonly Move[]
    {
        return Knight.moves;
    }
}

export { Knight };