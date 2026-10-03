import {Game} from "../game";
import type {MoveConditionFunction, Move, Position, OnMove, MoveRecord, MoveQuery} from "../types";
import {ChessRuleSet} from "../chessRuleSet";
import {getColorMultiplier} from "../utils/color";
import type {PieceColor} from "../types/piece";
import {Piece} from "./piece";

const DoubleStepMoveCondition: MoveConditionFunction = (game: Game, pos: Position) => {
    const pawn = game.board.getAtPos(pos);
    if (!pawn || pawn.name !== "pawn" || pawn.isMoved)
        return false;

    const multiplier = getColorMultiplier(pawn.color);
    return ChessRuleSet.isPathClear(game, pos, { x: pos.x, y: pos.y + 2 * multiplier });
}

const LeftCaptureCondition: MoveConditionFunction = (game: Game, pos: Position) => {
    const pawn = game.board.getAtPos(pos);
    if (!pawn || pawn.name !== "pawn" || pos.x === 0)
        return false;

    const y = pos.y + 1 * getColorMultiplier(pawn.color);
    const x = pos.x - 1;
    const capture = game.board.positionMap[y][x];
    return (capture !== null && capture.color !== pawn.color);
}

const RightCaptureCondition: MoveConditionFunction = (game: Game, pos: Position) => {
    const pawn = game.board.getAtPos(pos);
    if (!pawn || pawn.name !== "pawn" || pos.x === game.board.boardSize-1)
        return false;

    const y = pos.y + 1 * getColorMultiplier(pawn.color);
    const x = pos.x + 1;
    const capture = game.board.positionMap[y][x];
    return (capture !== null && capture.color !== pawn.color);
}

const LeftSideEnPassantCondition: MoveConditionFunction = (game: Game, pos: Position) => {
    const pawn = game.board.getAtPos(pos);
    if (!pawn || pawn.name !== "pawn" || pos.x === 0)
        return false;

    const capturePawn = game.board.positionMap[pos.y][pos.x-1];
    if (!capturePawn || capturePawn.name !== "pawn" || capturePawn.color === pawn.color)
        return false;

    const lastMove = game.lastMoveRecord?.moves[0];
    return (lastMove !== undefined && lastMove.piece === capturePawn && Math.abs(lastMove.from.y - lastMove.to.y) === 2);
}

const RightSideEnPassantCondition: MoveConditionFunction = (game: Game, pos: Position) => {
    const pawn = game.board.getAtPos(pos);
    if (!pawn || pawn.name !== "pawn" || pos.x === game.board.boardSize-1)
        return false;

    const capturePawn = game.board.positionMap[pos.y][pos.x+1];
    if (!capturePawn || capturePawn.name !== "pawn" || capturePawn.color === pawn.color)
        return false;

    const lastMove = game.lastMoveRecord?.moves[0];
    return (lastMove !== undefined && lastMove.piece === capturePawn && Math.abs(lastMove.from.y - lastMove.to.y) === 2);
}

const OnLeftSideEnPassant: OnMove = (game: Game, moveQuery: MoveQuery<Position>, moveRecord: MoveRecord)=> {
    const { from } = moveQuery;
    const capturePawnPos: Position = { x: from.x - 1, y: from.y };
    game.addCapture(moveRecord, capturePawnPos);
}

const OnRightSideEnPassant: OnMove = (game: Game, moveQuery: MoveQuery<Position>, moveRecord: MoveRecord)=> {
    const { from } = moveQuery;
    const capturePawnPos: Position = { x: from.x + 1, y: from.y };
    game.addCapture(moveRecord, capturePawnPos);
}

// todo: Handle pawn promotions
const HandlePromotion: OnMove = (game: Game, moveQuery: MoveQuery<Position>, moveRecord: MoveRecord) => {

}

const PawnMoves: Move[] = [
    { vec: { dx:  0, dy:  1 }, isSliding: false, canAttack: false, onMove: HandlePromotion },
    { vec: { dx:  0, dy:  2 }, isSliding: false, canAttack: false, condition: DoubleStepMoveCondition }, // Double Step Move

    { vec: { dx: -1, dy:  1 }, isSliding: false, canAttack: true, condition: LeftCaptureCondition }, // Left Capture
    { vec: { dx:  1, dy:  1 }, isSliding: false, canAttack: true, condition: RightCaptureCondition }, // Right Capture

    { vec: { dx: -1, dy:  1 }, isSliding: false, canAttack: false, condition: LeftSideEnPassantCondition, onMove: OnLeftSideEnPassant }, // Left EnPassant
    { vec: { dx:  1, dy:  1 }, isSliding: false, canAttack: false, condition: RightSideEnPassantCondition, onMove: OnRightSideEnPassant }, // Right EnPassant
];

class Pawn extends Piece
{
    static readonly moves = PawnMoves;

    constructor(color: PieceColor)
    {
        super(color, "pawn");
    }

    public getMoves(): readonly Move[]
    {
        return Pawn.moves;
    }

    public static isLeftEnPassantLegal(game: Game, pos: Position)
    {
        return LeftSideEnPassantCondition(game, pos);
    }

    public static isRightEnPassantLegal(game: Game, pos: Position)
    {
        return RightSideEnPassantCondition(game, pos);
    }
}

export { Pawn };