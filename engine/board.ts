import {Position} from "./types";
import type {PiecePositionMap, BoardStringLayout} from './types/board';
import {Piece, Bishop, King, Knight, Pawn, Queen, Rook, type PieceColor, type PieceColorCode, type PieceName, type PieceNameCode, type PieceLayoutCode} from "./pieces";
import {PieceCode} from "./constants/piece";

type PieceConstructor = new (color: PieceColor) => Piece;
const pieceClassMap: Record<PieceNameCode, PieceConstructor> = { "P": Pawn, "N": Knight, "B": Bishop, "R": Rook, "Q": Queen, "K": King };

class Board
{
    public readonly positionMap: PiecePositionMap;

    constructor(
        public readonly boardSize: number
    ) {
        this.positionMap = Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(null)) as PiecePositionMap;
    }

    public static isSame(b1: Board, b2: Board)
    {
        if (b1.boardSize != b2.boardSize)
            return false;

        const { positionMap: map1, boardSize } = b1;
        const { positionMap: map2 } = b2;

        for (let y = 0; y < boardSize; ++y)
            for (let x = 0; x < boardSize; ++x) {
                const p1 = map1[y][x];
                const p2 = map2[y][x];
                if ((p1 === null && p2 !== null) || (p1 !== null && p2 === null))
                    return false;

                if (p1 !== null && p2 !== null && !Piece.isSameType(p1, p2))
                    return false;
            }

        return true;
    }

    public copyBoard(): Board
    {
        const board = new Board(this.boardSize);

        for (let y = 0; y < this.boardSize; ++y)
            for (let x = 0; x < this.boardSize; ++x)
                board.positionMap[y][x] = this.positionMap[y][x];

        return board;
    }

    public isValidLayout(layout: (string | null)[][])
    {
        // Checking size of board
        if (layout.length !== this.boardSize)
            return false;

        for (let row of layout) {
            if (row.length !== this.boardSize)
                return false;
        }

        // Checking if representation is correct
        for (let row = 0; row < this.boardSize; ++row) {
            for (let col = 0; col < this.boardSize; ++col) {
                const val = layout[row][col];
                if ( val !== null &&
                    (val.length !== 2 ||
                    !["w", "b"].includes(val[0]) ||
                    !["P", "N", "B", "R", "Q", "K"].includes(val[1]))
                ) return false;
            }
        }

        return true;
    }

    public applyLayout(layout: BoardStringLayout)
    {
        for (let row = 0; row < this.boardSize; ++row) {
            for (let col = 0; col < this.boardSize; ++col) {
                const val = layout[row][col];
                this.positionMap[row][col] =
                    val ? new pieceClassMap[val[1] as PieceNameCode](val[0] as PieceColorCode === "w" ? "white" : "black") : null;
            }
        }
    }

    public clearBoard()
    {
        for (let row = 0; row < this.boardSize; ++row)
            for (let col = 0; col < this.boardSize; ++col)
                this.positionMap[row][col] = null;
    }

    public getStrLayout()
    {
        const boardStrLayout: BoardStringLayout = Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(null)) as BoardStringLayout;
        for (let row = 0; row < this.boardSize; ++row) {
            for (let col = 0; col < this.boardSize; ++col) {
                const piece = this.positionMap[row][col];
                if (piece)
                    boardStrLayout[row][col] = `${piece.color[0]}${PieceCode[piece.name]}` as PieceLayoutCode;
            }
        }

        return boardStrLayout;
    }

    public setAtPos(pos: Position, piece: Piece | null)
    {
        this.positionMap[pos.y][pos.x] = piece;
    }

    public getAtPos(pos: Position)
    {
        return this.positionMap[pos.y][pos.x];
    }

    public findPiece(color: PieceColor, name: PieceName): Position | null
    {
        for (let y = 0; y < this.boardSize; ++y)
            for (let x = 0; x < this.boardSize; ++x)
                if (this.positionMap[y][x]?.color === color && this.positionMap[y][x]?.name === name)
                    return { x, y };

        return null;
    }

    public isInBounds(pos: Position)
    {
        return (pos.x >= 0 && pos.y >= 0 && pos.x < this.boardSize && pos.y < this.boardSize);
    }
}

export { Board };
export type { PiecePositionMap, BoardStringLayout, MoveChange, PromotionChange, CaptureChange, BoardChange } from './types/board';