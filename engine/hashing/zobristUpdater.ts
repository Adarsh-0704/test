import {Board} from "../board";
import {Zobrist, type Hash} from "./zobrist";
import {Game, type GameSpecialRights} from "../game";
import type {MoveRecord} from "../types";
import type {PieceColor} from "../types/piece";

type HashMap = Map<Hash, number[]>;

class ZobristUpdater
{
    private _currentHash: Hash = 0n;
    private _hashMap: HashMap = new Map();
    private _hashMoveHistory: MoveRecord[] = [];

    // Getters
    public get currentHash(): Readonly<Hash> { return this._currentHash; }

    // Update Hash Methods
    public rebuildHash(game: Game)
    {
        this._hashMap.clear();
        this._currentHash = Zobrist.getBoardHash(game);
        this._hashMap.set(this._currentHash, [-1]);
    }

    public toggleMoveChanges(moveRecord: MoveRecord)
    {
        const { moves, captures, promotions } = moveRecord;

        for (const { from, piece } of captures)
            this._currentHash = Zobrist.togglePieceAtPos(piece, from, this._currentHash);

        for (const { from, to, piece } of moves) {
            this._currentHash = Zobrist.togglePieceAtPos(piece, from, this._currentHash);
            this._currentHash = Zobrist.togglePieceAtPos(piece, to, this._currentHash);
        }

        for (const { to, piece } of promotions)
            this._currentHash = Zobrist.togglePieceAtPos(piece, to, this._currentHash);
    }

    public switchSideToMove()
    {
        this._currentHash = Zobrist.switchSideToMove(this._currentHash);
    }

    public toggleSpecialRights(specialRights: GameSpecialRights)
    {
        this._currentHash = Zobrist.toggleSpecialRights(specialRights, this._currentHash);
    }

    public addMoveRecord(game: Game, moveRecordIndex: number)
    {
        if (moveRecordIndex < 0 || moveRecordIndex >= game.moveHistory.length)
            return;

        const moveRecord: MoveRecord = game.moveHistory[moveRecordIndex];

        // Removing old info from hash
        this.toggleSpecialRights(game.specialRights);

        // Applying new changes
        game.updateSpecialRights();

        this.switchSideToMove();
        this.toggleMoveChanges(moveRecord);
        this.toggleSpecialRights(game.specialRights);

        this._hashMoveHistory.push(moveRecord);

        // Adding New Occurrence
        this.recordCurrentHashOccurrence(moveRecordIndex);
        console.log(this._hashMap);
    }

    public removeMoveRecord(game: Game, moveRecordIndex: number)
    {
        if (moveRecordIndex < 0 || moveRecordIndex >= game.moveHistory.length)
            return;

        const { _hashMoveHistory: hashMoveHistory } = this;
        const moveRecord: MoveRecord = game.moveHistory[moveRecordIndex];

        if (hashMoveHistory.length === 0 || hashMoveHistory[hashMoveHistory.length-1] !== moveRecord)
            return;

        // Removing Latest Occurrence
        this.removeCurrentHashOccurrence();

        // Reversing Hash
        this.toggleMoveChanges(moveRecord);
        this.toggleSpecialRights(game.specialRights);
        this.switchSideToMove();
        hashMoveHistory.pop();

        game.updateSpecialRights();
        this.toggleSpecialRights(game.specialRights);
    }

    // Hash Occurrences
    private recordCurrentHashOccurrence(index: number)
    {
        const indexes = this._hashMap.get(this._currentHash) ?? [];
        indexes.push(index);
        this._hashMap.set(this._currentHash, indexes);
    }

    private removeCurrentHashOccurrence()
    {
        const indexes = this._hashMap.get(this._currentHash);
        if (indexes) {
            indexes.pop();
            if (indexes.length === 0)
                this._hashMap.delete(this._currentHash);
        }
    }

    public checkThreeFoldRepetition(game: Game)
    {
        const occurrences = this._hashMap.get(this._currentHash);
        if (!occurrences || occurrences.length < 3)
            return false;

        // Current Position Snapshot
        const currentBoard: Board = game.board.copyBoard();
        const currentTurnColor: PieceColor = game.currentTurnColor;
        const currentSpecialRights: GameSpecialRights = {
            castlingRights: { ...game.specialRights.castlingRights },
            enPassantFile: game.specialRights.enPassantFile
        };

        // Comparing all positions
        const matches = game.evaluateAt(occurrences, (game: Game) => {
            game.updateSpecialRights();
            return game.isSamePosition(currentBoard, currentTurnColor, currentSpecialRights);
        });

        let totalMatches = 0;
        for (let i = 0; i < matches.length; ++i)
            totalMatches += matches[i] ? 1 : 0;

        return totalMatches === 3;
    }
}

export { ZobristUpdater };