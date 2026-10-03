import {Piece, type PieceColor, type PieceName} from "../pieces";

function checkPieceColorAndName(piece: Piece | null, color: PieceColor, name: PieceName): boolean
{
    return (piece !== null && piece.color === color && piece.name === name);
}

function checkPieceName<T extends PieceName>(piece: Piece | null, name: PieceName): piece is Piece & { name: T }
{
    return (piece !== null && piece.name === name);
}

export { checkPieceColorAndName, checkPieceName };