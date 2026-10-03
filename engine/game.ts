import type {Position, MoveRecord, MoveQuery, MoveRemark, LegalPosition, StaticMethodsMatching} from "./types";
import type {PieceColor} from "./types/piece";
import {Board, BoardChange, BoardStringLayout} from "./board";
import {ChessRuleSet} from "./chessRuleSet";
import {King, Pawn, Piece} from "./pieces";
import {switchColor} from "./utils/color";
import {GameStatus, GameResult, BOARD_SIZE, DefaultBoard} from "./constants/game";
import {CastleType} from "./constants/castleType";
import {GameOutcome, GameSpecialRights} from "./types/game";
import {ZobristUpdater} from "./hashing/zobristUpdater";

type BoardChangeOptions = {
    updateGameHash?: boolean;
}
type PlayMoveOptions = {
    updateGameStatus?: boolean;
    updateGameHash?: boolean;
}

class Game
{
    private _moveHistory: MoveRecord[] = [];
    private _currentMoveIndex = -1;

    private _currentTurnColor: PieceColor = "white";
    private _currentStatus: GameStatus = GameStatus.NOT_STARTED;
    private _currentResult: GameResult = GameResult.PENDING;

    private _zobristUpdater = new ZobristUpdater();
    private _specialRights: GameSpecialRights = {
        castlingRights: {
            [CastleType.WHITE_SHORT_CASTLE]: false,
            [CastleType.WHITE_LONG_CASTLE]: false,
            [CastleType.BLACK_SHORT_CASTLE]: false,
            [CastleType.BLACK_LONG_CASTLE]: false
        },
        enPassantFile: null
    };

    public readonly board: Board = new Board(BOARD_SIZE);

    // Getters
    public get lastMoveRecord(): Readonly<MoveRecord | null>
        { return this._moveHistory ? this._moveHistory[this._moveHistory.length-1] : null; }

    public get currentTurnColor(): PieceColor   { return this._currentTurnColor; }
    public get currentStatus(): GameStatus      { return this._currentStatus; }
    public get currentResult(): GameResult      { return this._currentResult; }

    public get moveHistory(): Readonly<MoveRecord[]>        { return this._moveHistory; }
    public get specialRights(): Readonly<GameSpecialRights> { return this._specialRights };
    public get zobristUpdater(): Readonly<ZobristUpdater>   { return this._zobristUpdater };

    // Board Related Changes
    public setBoardLayout(layout: BoardStringLayout = DefaultBoard): boolean
    {
        if (this.board.isValidLayout(layout)) {
            this.board.applyLayout(layout);
            this._zobristUpdater.rebuildHash(this);
            return true;
        }

        return false;
    }

    public applyChanges(moveRecord: MoveRecord, { updateGameHash = false }: BoardChangeOptions = {})
    {
        const { moves, captures, promotions } = moveRecord;

        for (const { from } of captures) {
            this.board.setAtPos(from, null);
        }

        for (const { from, to, piece } of moves) {
            this.board.setAtPos(from, null);
            this.board.setAtPos(to, piece);
            piece.movesPlayed++;
        }

        for (const { to, piece } of promotions) {
            this.board.setAtPos(to, piece);
        }

        this.changeCurrentTurn();

        if (updateGameHash) this.recordHashForLatestMove();
    }

    public removeChanges(moveRecord: MoveRecord, { updateGameHash = false }: BoardChangeOptions = {})
    {
        const { moves, captures, promotions } = moveRecord;

        if (updateGameHash) this.removeHashForLatestMove();

        for (const { to } of promotions) {
            this.board.setAtPos(to, null);
        }

        for (const { from, to, piece } of moves) {
            this.board.setAtPos(from, piece);
            this.board.setAtPos(to, null);
            piece.movesPlayed--;
        }

        for (const { from, piece } of captures) {
            this.board.setAtPos(from, piece);
        }

        this.changeCurrentTurn();
    }

    // Comparisons
    public isSamePosition(board: Board, turnColor: PieceColor, specialRights: GameSpecialRights)
    {
        return (
            Board.isSame(board, this.board) &&
            this.currentTurnColor === turnColor &&
            this.specialRights.castlingRights[CastleType.WHITE_SHORT_CASTLE] === specialRights.castlingRights[CastleType.WHITE_SHORT_CASTLE] &&
            this.specialRights.castlingRights[CastleType.WHITE_LONG_CASTLE] === specialRights.castlingRights[CastleType.WHITE_LONG_CASTLE] &&
            this.specialRights.castlingRights[CastleType.BLACK_SHORT_CASTLE] === specialRights.castlingRights[CastleType.BLACK_SHORT_CASTLE] &&
            this.specialRights.castlingRights[CastleType.BLACK_LONG_CASTLE] === specialRights.castlingRights[CastleType.BLACK_LONG_CASTLE] &&
            this.specialRights.enPassantFile === specialRights.enPassantFile
        );
    }

    // Evaluation
    private evaluateStatus(): GameOutcome
    {
        if (ChessRuleSet.isCheckmated(this)) {
            const winner = switchColor(this.currentTurnColor);

            return {
                status: (winner === "white" ? GameStatus.WHITE_WON : GameStatus.BLACK_WON),
                result: GameResult.CHECKMATE
            };
        }

        const drawConditions: [StaticMethodsMatching<typeof ChessRuleSet, (game: Game) => boolean>, GameResult][] =
            [
                [ChessRuleSet.isDrawByStalemate,                GameResult.STALEMATE],
                [ChessRuleSet.isDrawByThreeFoldRepetition,      GameResult.THREE_FOLD_REPETITION],
                [ChessRuleSet.isDrawByInsufficientMaterial,     GameResult.DRAW_BY_INSUFFICIENT_MATERIAL],
                [ChessRuleSet.isDrawByFiftyMoveRule,            GameResult.FIFTY_MOVE_RULE],
            ];

        for(const [condition, result] of drawConditions) {
            if(condition(this))
                return { status: GameStatus.DRAW, result };
        }

        return { status: GameStatus.ACTIVE, result: GameResult.PENDING };
    }

    public evaluateAndBacktrack<T>(moveQuery: MoveQuery<LegalPosition>, fn: (game: Game) => T): T | null
    {
        const piece = this.board.getAtPos(moveQuery.from);
        if (!piece) return null;

        this.playMove(moveQuery, { updateGameHash: false });

        try     { return fn(this); }
        finally { this.undoMove({ updateGameHash: false }); }
    }

    public evaluateAt<T>(moveHistoryIndexes: number[], evaluate: (game: Game) => T): T[]
    {
        const results: T[] = Array(moveHistoryIndexes.length);

        try {
            for (let i = 0; i < moveHistoryIndexes.length; ++i) {
                this.jumpToMove(moveHistoryIndexes[i]);
                results[i] = evaluate(this);
            }
        } finally {
            this.jumpToLatestMove();
            this.updateSpecialRights(); // For safely returning to latest position
        }

        return results;
    }

    // Update Game Attributes
    public updateStatus()
    {
        const { status, result } = this.evaluateStatus();
        this._currentStatus = status;
        this._currentResult = result;
    }

    public updateSpecialRights()
    {
        const { castlingRights } = this._specialRights;

        const whiteKing = this.board.findPiece("white", "king");
        const blackKing = this.board.findPiece("black", "king");

        if (!whiteKing || !blackKing)
            throw Error(`[Invalid Board State] Cannot find white or black king on board`);

        castlingRights[CastleType.WHITE_SHORT_CASTLE] = King.canShortCastle(this, whiteKing);
        castlingRights[CastleType.WHITE_LONG_CASTLE] = King.canLongCastle(this, whiteKing);
        castlingRights[CastleType.BLACK_SHORT_CASTLE] = King.canShortCastle(this, blackKing);
        castlingRights[CastleType.BLACK_LONG_CASTLE] = King.canLongCastle(this, blackKing);

        const pawns: Position[] = [];
        for (let y = 0; y < BOARD_SIZE; ++y) {
            for (let x = 0; x < BOARD_SIZE; ++x) {
                const piece = this.board.positionMap[y][x];
                if (piece?.name === "pawn")
                    pawns.push({ x, y });
            }
        }

        this._specialRights.enPassantFile = null;
        for (const pawnPos of pawns) {
            if (Pawn.isLeftEnPassantLegal(this, pawnPos)) {
                this._specialRights.enPassantFile = pawnPos.x - 1;
                break;
            }
            else if (Pawn.isRightEnPassantLegal(this, pawnPos)) {
                this._specialRights.enPassantFile = pawnPos.x + 1;
                break;
            }
        }
    }

    // Changing turn
    private changeCurrentTurn()
    {
        this._currentTurnColor = this._currentTurnColor === "white" ? "black" : "white";
    }

    // Move Record helpers
    public addMove(moveRecord: MoveRecord, moveQuery: MoveQuery<Position>)
    {
        const { from, to } = moveQuery;
        const piece = this.board.getAtPos(from);
        if (!piece) {
            console.warn(`[Invalid Call] No piece at position (${from.x}, ${from.y}) at makeMove`);
            return;
        }

        moveRecord.moves.push({ type: "move", piece, from, to });

        const capture = this.board.getAtPos(to);
        if (capture) this.addCapture(moveRecord, to);
    }

    public addCapture(moveRecord: MoveRecord, from: Position)
    {
        const piece = this.board.getAtPos(from);
        if (!piece) {
            console.warn(`[Invalid Call] No piece at position (${from.x}, ${from.y}) at makeCapture`);
            return;
        }

        const change: BoardChange = { type: "capture", piece, from };
        moveRecord.captures.push(change);
    }

    public addPromotion(moveRecord: MoveRecord, to: Position, promoteTo: typeof Piece)
    {

    }

    // Move Execution
    private playMove(moveQuery: MoveQuery<LegalPosition>, { updateGameStatus = false, updateGameHash = true }: PlayMoveOptions = {})
    {
        const { from, to } = moveQuery;
        const piece = this.board.getAtPos(from);
        if (!piece)
            throw Error(`[Invalid Call] No piece at position (${from.x}, ${from.y}) at playMoveWithoutValidation`);

        // Create Move Record for add to history
        const moveRecord: MoveRecord = { moves: [], captures: [], promotions: [] };
        this._moveHistory.push(moveRecord);

        this.addMove(moveRecord, moveQuery);

        // Calling onMove function
        if(to.onMove) to.onMove(this, moveQuery, moveRecord);

        // Apply changes to board
        ++this._currentMoveIndex;
        this.applyChanges(moveRecord, { updateGameHash });

        // Handling Options
        if (updateGameStatus) this.updateStatus();
    }

    public playMoveWithValidation(moveQuery: MoveQuery<Position>): MoveRemark
    {
        const { from, to } = moveQuery;

        if (!this.board.isInBounds(from) || !this.board.isInBounds(to))
            return { result: "Invalid Move", executed: false, remark: `[Range Error] moveQuery not in board bounds!` };

        this.jumpToLatestMove();
        const piece = this.board.getAtPos(from);

        if (!piece)
            return { result: "Invalid Move", executed: false, remark: `No piece at position (${from.x},${from.y})` };

        if (piece.color !== this._currentTurnColor)
            return { result: "Invalid Turn", remark: `Wait for ${this._currentTurnColor}'s turn!`, executed: false };

        const validation = ChessRuleSet.validateAsLegalMove(this, from, to);
        if (!validation.valid) return { result: "Illegal Move", executed: false };

        this.playMove({ from, to: validation.move }, { updateGameStatus: true, updateGameHash: true });

        return { result: "Legal Move", executed: true };
    }

    public undoMove({ updateGameStatus = false, updateGameHash = true }: PlayMoveOptions = {})
    {
        if (this._moveHistory.length === 0)
            return;

        const moveRecord = this._moveHistory[this._moveHistory.length-1];

        // Apply Changes to board
        this.removeChanges(moveRecord, { updateGameHash });
        --this._currentMoveIndex;
        this._moveHistory.pop();

        // Handling Options
        if (updateGameStatus) this.updateStatus();
    }

    // Board Hashing
    public recordHashForLatestMove()
    {
        this._zobristUpdater.addMoveRecord(this, this._moveHistory.length - 1);
    }

    public removeHashForLatestMove()
    {
        this._zobristUpdater.removeMoveRecord(this, this._moveHistory.length - 1);
    }

    // Board View
    public jumpToStartingMove()
    {
        const { moveHistory } = this;
        for (let i = this._currentMoveIndex; i >= 0; --i)
            this.removeChanges(moveHistory[i]);

        this._currentMoveIndex = -1;
    }

    public jumpToLatestMove()
    {
        const { moveHistory } = this;
        for (let i = this._currentMoveIndex + 1; i < moveHistory.length; ++i)
            this.applyChanges(moveHistory[i]);

        this._currentMoveIndex = moveHistory.length-1;
    }

    public forwardOneMove()
    {
        const { moveHistory } = this;
        if (this._currentMoveIndex + 1 >= moveHistory.length)
            return;

        this.applyChanges(moveHistory[++this._currentMoveIndex]);
    }

    public reverseOneMove()
    {
        const { moveHistory } = this;
        if (this._currentMoveIndex < 0)
            return;

        this.applyChanges(moveHistory[this._currentMoveIndex--]);
    }

    public jumpToMove(moveHistoryIndex: number)
    {
        if (moveHistoryIndex < 0 || moveHistoryIndex >= this._moveHistory.length || moveHistoryIndex === this._currentMoveIndex)
            return;

        let curr = this._currentMoveIndex;
        const direction = Math.sign(moveHistoryIndex - this._currentMoveIndex);

        if (direction > 0) {
            while (curr !== moveHistoryIndex) {
                curr += direction;
                this.applyChanges(this._moveHistory[curr]);
            }
        }

        else if (direction < 0) {
            while (curr !== moveHistoryIndex) {
                this.removeChanges(this._moveHistory[curr]);
                curr += direction;
            }
        }

        this._currentMoveIndex = moveHistoryIndex;
    }
}

export { Game };
export type { GameOutcome, GameSpecialRights } from "./types/game";
export { GameStatus, GameResult, BOARD_SIZE, DefaultBoard } from "./constants/game";
