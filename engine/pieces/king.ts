import type {Move, MoveConditionFunction, Position, OnMove, MoveRecord, MoveQuery} from "../types";
import {Game} from "../game";
import {ChessRuleSet} from "../chessRuleSet";
import type {PieceColor} from "../types/piece";
import {Piece} from "./piece";
import type {Rook} from "./rook";
import {checkPieceName} from "../utils/piece";
import type {MoveChange} from "../types/board";

const ShortCastleCondition: MoveConditionFunction = (game: Game, pos: Position) => {
    const { board } = game;
    const king = board.getAtPos(pos);
    const rook = board.positionMap[pos.y][board.boardSize-1];

    if (!checkPieceName(king, "king") || king.isMoved ||
        !checkPieceName(rook, "rook") || rook.isMoved ||
        rook.color !== king.color ||
        ChessRuleSet.isKingInCheck(game, king.color) ||
        !ChessRuleSet.canSeeEachOther(game, pos, { x: board.boardSize-1, y: pos.y }))
    {
        return false;
    }

    for(let dx = 1; dx <= 2; ++dx) {
        const isKingInCheck = game.evaluateAndBacktrack(
            { from: pos, to: { x: pos.x + dx, y: pos.y } },
            (game: Game): boolean => ChessRuleSet.isKingInCheck(game, king.color)
        );

        if (isKingInCheck) return false;
    }

    return true;
}

const LongCastleCondition: MoveConditionFunction = (game: Game, pos: Position) => {
    const { board } = game;
    const king = board.getAtPos(pos);
    const rook = board.positionMap[pos.y][0];

    if (!checkPieceName(king, "king") || king.isMoved ||
        !checkPieceName(rook, "rook") || rook.isMoved ||
        rook.color !== king.color ||
        ChessRuleSet.isKingInCheck(game, king.color) ||
        !ChessRuleSet.canSeeEachOther(game, pos, { x: board.boardSize-1, y: pos.y }))
    {
        return false;
    }

    for(let dx = -1; dx >= -2; --dx) {
        const isKingInCheck = game.evaluateAndBacktrack(
            { from: pos, to: { x: pos.x + dx, y: pos.y } },
            (game: Game): boolean => ChessRuleSet.isKingInCheck(game, king.color)
        );

        if (isKingInCheck) return false;
    }

    return true;
}

const OnShortCastle: OnMove = (game: Game, moveQuery: MoveQuery<Position>, moveRecord: MoveRecord) => {
    const { from: startKingPos, to: endKingPos } = moveQuery;

    game.addMove(moveRecord, {
        from: { x: game.board.boardSize - 1, y: startKingPos.y },
        to:   { x: endKingPos.x - 1, y: endKingPos.y }
    });
}

const OnLongCastle: OnMove = (game: Game, moveQuery: MoveQuery<Position>, moveRecord: MoveRecord) => {
    const { from: startKingPos, to: endKingPos } = moveQuery;

    game.addMove(moveRecord, {
        from: { x: 0, y: startKingPos.y },
        to:   { x: endKingPos.x + 1, y: endKingPos.y }
    });
}

const KingMoves: Move[] = [
    { vec: { dx:  0, dy:  1 }, isSliding: false, canAttack: true },
    { vec: { dx:  0, dy: -1 }, isSliding: false, canAttack: true },
    { vec: { dx:  1, dy:  0 }, isSliding: false, canAttack: true },
    { vec: { dx: -1, dy:  0 }, isSliding: false, canAttack: true },
    { vec: { dx:  1, dy:  1 }, isSliding: false, canAttack: true },
    { vec: { dx: -1, dy:  1 }, isSliding: false, canAttack: true },
    { vec: { dx: -1, dy: -1 }, isSliding: false, canAttack: true },
    { vec: { dx:  1, dy: -1 }, isSliding: false, canAttack: true },

    { vec: { dx:  2, dy:  0 }, isSliding: false, canAttack: false, condition: ShortCastleCondition, onMove: OnShortCastle }, // Short Castle
    { vec: { dx: -2, dy:  0 }, isSliding: false, canAttack: false, condition: LongCastleCondition, onMove: OnLongCastle }, // Long Castle
];

class King extends Piece
{
    static readonly moves= KingMoves;

    constructor(color: PieceColor)
    {
        super(color, "king");
    }

    public getMoves(): readonly Move[]
    {
        return King.moves;
    }

    private static canCastle(king: King, rook: Rook)
    {
        return (!king.isMoved && !rook.isMoved && king.color === rook.color);
    }

    public static canShortCastle(game: Game, pos: Position)
    {
        const { board } = game;
        const king = board.getAtPos(pos);
        const rook = board.positionMap[pos.y][board.boardSize-1];

        return (checkPieceName(king, "king") && checkPieceName(rook, "rook") && King.canCastle(king, rook));
    }

    public static canLongCastle(game: Game, pos: Position)
    {
        const { board } = game;
        const king = board.getAtPos(pos);
        const rook = board.positionMap[pos.y][0];

        return (checkPieceName(king, "king") && checkPieceName(rook, "rook") && King.canCastle(king, rook));
    }
}

export { King };