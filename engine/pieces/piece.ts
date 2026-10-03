import type {PieceColor, PieceName} from "../types/piece";
import type {Move} from "../types";

abstract class Piece
{
    movesPlayed: number = 0;

    protected constructor(
        public readonly color: PieceColor,
        public readonly name: PieceName
    ) {}

    public static isSameType(p1: Piece, p2: Piece)
    {
        return p1.color === p2.color && p1.name === p2.name;
    }

    public get isMoved(): boolean { return this.movesPlayed !== 0; }

    abstract getMoves(): readonly Move[];
}

export { Piece };