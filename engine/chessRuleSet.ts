import {BOARD_SIZE, Game} from "./game";
import {switchColor} from "./utils/color";
import type {PieceColor, PieceName} from "./types/piece";
import type {IsValidMove, LegalPosition, Position, SoftFixedArrayGrid} from "./types";

type attackGrid = SoftFixedArrayGrid<boolean, typeof BOARD_SIZE>;

class ChessRuleSet
{
    private constructor() {}

    private static getPiecePos(game: Game, pieceColor: PieceColor, pieceName: PieceName): Position
    {
        const piecePos = game.board.findPiece(pieceColor, pieceName);
        if (!piecePos)
        {
            throw Error(`[Not Found] ${pieceColor} ${pieceName} is missing from board!`);
        }

        return piecePos;
    }

    private static markAttackedSquares(game: Game, piecePos: Position, attackedSquares: attackGrid): void
    {
        const { board } = game;
        const { boardSize, positionMap } = board;

        const piece = board.getAtPos(piecePos);
        if (!piece) return;

        for (const move of piece.getMoves()) {
            if (!move.canAttack)
                continue;

            const dx = move.vec.dx;
            const dy = move.vec.dy * (piece.color === "white" ? -1 : 1);
            let { x: currX, y: currY } = piecePos;

            do {
                currX += dx; currY += dy;
                if (currX < 0 || currY < 0 || currX >= boardSize || currY >= boardSize ||
                    (!move.canAttack && positionMap[currY][currX]) ||
                    positionMap[currY][currX]?.color === piece.color)
                {
                    break;
                }

                attackedSquares[currY][currX] = true;

            } while(move.isSliding && !positionMap[currY][currX]);
        }
    }

    private static getAttackedSquaresByColor(game: Game, color: PieceColor): attackGrid
    {
        const { board } = game;
        const { boardSize, positionMap } = board;

        const attackedSquares: attackGrid = Array.from({ length: boardSize }, () => Array(boardSize).fill(false)) as attackGrid;

        for (let y = 0; y < boardSize; ++y)
            for (let x = 0; x < boardSize; ++x)
                if (positionMap[y][x]?.color === color)
                    ChessRuleSet.markAttackedSquares(game, { x, y }, attackedSquares);

        return attackedSquares;
    }

    private static getPseudoLegalMoves(game: Game, pos: Position): LegalPosition[]
    {
        const { board } = game;
        const piece = board.getAtPos(pos);
        if (!piece)
            throw Error(`Invalid try to get legal moves, no piece at position (${pos.x}, ${pos.y})!`);

        const pseudoLegalMoves: LegalPosition[] = [];
        const { boardSize, positionMap: piecePositionMap } = board;

        for (const move of piece.getMoves()) {
            if (move.condition && !move.condition(game, pos))
                continue;

            const dx = move.vec.dx;
            const dy = move.vec.dy * (piece.color === "white" ? -1 : 1);
            let { x: currX, y: currY } = pos;

            do {
                currX += dx; currY += dy;
                if (currX < 0 || currY < 0 || currX >= boardSize || currY >= boardSize ||
                    (!move.canAttack && piecePositionMap[currY][currX]) ||
                    piecePositionMap[currY][currX]?.color === piece.color)
                {
                    break;
                }

                pseudoLegalMoves.push({ x: currX, y: currY, onMove: move.onMove ?? undefined });

            } while(move.isSliding && !piecePositionMap[currY][currX]);
        }

        return pseudoLegalMoves;
    }

    public static isKingInCheck(game: Game, color: PieceColor): boolean
    {
        const kingPos = ChessRuleSet.getPiecePos(game, color, "king");
        const enemyAttackedSquares = ChessRuleSet.getAttackedSquaresByColor(game, switchColor(color));

        return enemyAttackedSquares[kingPos.y][kingPos.x];
    }

    public static isCheckmated(game: Game): boolean
    {
        return ChessRuleSet.isKingInCheck(game, game.currentTurnColor) && !ChessRuleSet.hasPlayerAnyLegalMove(game);
    }

    public static isDrawByStalemate(game: Game): boolean
    {
        return !ChessRuleSet.isKingInCheck(game, game.currentTurnColor) && !ChessRuleSet.hasPlayerAnyLegalMove(game);
    }

    public static isDrawByThreeFoldRepetition(game: Game): boolean
    {
        return game.zobristUpdater.checkThreeFoldRepetition(game);
    }

    public static isDrawByFiftyMoveRule(game: Game): boolean
    {
        return false;
    }

    public static isDrawByInsufficientMaterial(game: Game): boolean
    {
        return false;
    }

    public static getLegalMoves(game: Game, piecePos: Position): LegalPosition[]
    {
        const pseudoLegalMoves = ChessRuleSet.getPseudoLegalMoves(game, piecePos);

        const { currentTurnColor } = game;
        return pseudoLegalMoves.filter(move =>
            game.evaluateAndBacktrack(
                { from: piecePos, to: move },
                (game) => !ChessRuleSet.isKingInCheck(game, currentTurnColor)
            ));
    }

    public static hasPlayerAnyLegalMove(game: Game): boolean
    {
        const { board, currentTurnColor: color } = game;
        const { boardSize } = board;

        for (let y = 0; y < boardSize; ++y)
            for (let x = 0; x < boardSize; ++x)
                if (board.positionMap[y][x]?.color === color && ChessRuleSet.getLegalMoves(game, { x, y }).length > 0)
                    return true;

        return false;
    }

    public static validateAsLegalMove(game: Game, from: Position, to: Position): IsValidMove
    {
        const legalMoves = ChessRuleSet.getLegalMoves(game, from);
        const foundMove = legalMoves.find(move => move.x === to.x && move.y === to.y);

        if (!foundMove)
            return { valid: false };

        return { valid: true, move: foundMove };
    }

    public static canSeeEachOther(game: Game, a: Position, b: Position)
    {
        if (!game.board.isInBounds(a) || !game.board.isInBounds(b))
            return false;

        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);

        if (a.x != b.x && a.y != b.y && dx != dy)
            return false;

        const stepX = Math.sign(b.x - a.x);
        const stepY = Math.sign(b.y - a.y);

        let x = a.x + stepX, y = a.y + stepY;
        while (x !== b.x || y !== b.y) {
            if (game.board.positionMap[y][x] !== null)
                return false;
            x += stepX;
            y += stepY;
        }

        return true;
    }

    public static isPathClear(game: Game, start: Position, end: Position)
    {
        if (!game.board.isInBounds(start) || !game.board.isInBounds(end))
            return false;

        const dx = Math.abs(start.x - end.x);
        const dy = Math.abs(start.y - end.y);

        if (start.x != end.x && start.y != end.y && dx != dy)
            return false;

        const stepX = Math.sign(end.x - start.x);
        const stepY = Math.sign(end.y - start.y);

        let x = start.x, y = start.y;
        while (x !== end.x || y !== end.y) {
            x += stepX;
            y += stepY;
            if (game.board.positionMap[y][x] !== null)
                return false;
        }

        return true;
    }

}

export { ChessRuleSet };