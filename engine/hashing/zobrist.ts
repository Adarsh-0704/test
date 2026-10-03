import type {Position, SoftFixedArray, SoftFixedArrayGrid} from "../types";
import {BOARD_SIZE, Game, type GameSpecialRights} from "../game";
import type {PieceColor} from "../types/piece";
import {CastleType} from "../constants/castleType";
import {King, Pawn, Piece} from "../pieces";
import {PieceType} from "../constants/piece";
import {SplitMix64} from "../utils/splitMix64";

type Hash = bigint;

type PieceSquareHashMap = SoftFixedArray<SoftFixedArrayGrid<Hash, typeof BOARD_SIZE>, 12>;
type BoardFiles = SoftFixedArray<Hash, typeof BOARD_SIZE>;

class Zobrist
{
    private static readonly rng = new SplitMix64(0x123456789abcdef0n);

    private static _pieceSquareHashMap: PieceSquareHashMap;
    private static _sideToMove: Record<PieceColor, Hash>;
    private static _castlingRights: Record<CastleType, Hash>;
    private static _enPassantFile: BoardFiles;

    public static initializeValues()
    {
        Zobrist._pieceSquareHashMap = Array.from({ length: 12 },
            () => Array.from({ length: BOARD_SIZE },
                () => Array.from({ length: BOARD_SIZE },
                    () => Zobrist.rng.next()
            ))) as PieceSquareHashMap;

        Zobrist._sideToMove = { white: Zobrist.rng.next(), black: Zobrist.rng.next() };

        Zobrist._castlingRights = {
            [CastleType.WHITE_SHORT_CASTLE]: Zobrist.rng.next(),
            [CastleType.WHITE_LONG_CASTLE]: Zobrist.rng.next(),
            [CastleType.BLACK_SHORT_CASTLE]: Zobrist.rng.next(),
            [CastleType.BLACK_LONG_CASTLE]: Zobrist.rng.next()
        };

        Zobrist._enPassantFile = Array.from({ length: BOARD_SIZE }, () => Zobrist.rng.next()) as BoardFiles;
    }

    public static getPieceIndex(piece: Piece)
    {
        return (piece.color === "black" ? 6 : 0) + PieceType[piece.name];
    }

    public static getBoardHash(game: Game): Hash
    {
        let hash: Hash = Zobrist._sideToMove[game.currentTurnColor];

        const { boardSize, positionMap } = game.board;
        for (let y = 0; y < boardSize; ++y) {
            for (let x = 0; x < boardSize; ++x) {
                const piece = positionMap[y][x];
                if (!piece) continue;

                hash ^= Zobrist._pieceSquareHashMap[Zobrist.getPieceIndex(piece)][y][x];

                if (piece.name === "king")
                {
                    if (piece.color === "white" && King.canShortCastle(game, { x, y }))
                        hash ^= Zobrist._castlingRights[CastleType.WHITE_SHORT_CASTLE];
                    if (piece.color === "white" && King.canLongCastle(game, { x, y }))
                        hash ^= Zobrist._castlingRights[CastleType.WHITE_LONG_CASTLE];

                    if (piece.color === "black" && King.canShortCastle(game, { x, y }))
                        hash ^= Zobrist._castlingRights[CastleType.BLACK_SHORT_CASTLE];
                    if (piece.color === "black" && King.canLongCastle(game, { x, y }))
                        hash ^= Zobrist._castlingRights[CastleType.BLACK_LONG_CASTLE];
                }

                else if (piece.name === "pawn")
                {
                    if (Pawn.isLeftEnPassantLegal(game, { x, y }))
                        hash ^= Zobrist._enPassantFile[x-1];
                    if (Pawn.isRightEnPassantLegal(game, { x, y }))
                        hash ^= Zobrist._enPassantFile[x+1];
                }

            }
        }

        // Adding Special Rights
        game.updateSpecialRights();
        hash = Zobrist.toggleSpecialRights(game.specialRights, hash);

        // Setting Color for Side To Move
        hash ^= Zobrist._sideToMove["white"];

        return hash;
    }

    public static togglePieceAtPos(piece: Piece, pos: Position, hash: Hash)
    {
        hash ^= Zobrist._pieceSquareHashMap[Zobrist.getPieceIndex(piece)][pos.y][pos.x];
        return hash;
    }

    public static toggleEnPassantOnFile(file: number, hash: Hash)
    {
        hash ^= Zobrist._enPassantFile[file];
        return hash;
    }

    public static toggleCastlingRights(castleType: CastleType, hash: Hash)
    {
        hash ^= Zobrist._castlingRights[castleType];
        return hash;
    }

    public static toggleSideToMove(color: PieceColor, hash: Hash)
    {
        hash ^= Zobrist._sideToMove[color];
        return hash;
    }

    public static switchSideToMove(hash: Hash)
    {
        hash ^= (Zobrist._sideToMove["white"] ^ Zobrist._sideToMove["black"]);
        return hash;
    }

    public static toggleSpecialRights(specialRights: GameSpecialRights, hash: Hash)
    {
        const { castlingRights, enPassantFile } = specialRights;

        // Toggling Castling Rights
        if (castlingRights[CastleType.WHITE_SHORT_CASTLE])
            hash = Zobrist.toggleCastlingRights(CastleType.WHITE_SHORT_CASTLE, hash);
        if (castlingRights[CastleType.WHITE_LONG_CASTLE])
            hash = Zobrist.toggleCastlingRights(CastleType.WHITE_LONG_CASTLE, hash);
        if (castlingRights[CastleType.BLACK_SHORT_CASTLE])
            hash = Zobrist.toggleCastlingRights(CastleType.BLACK_SHORT_CASTLE, hash);
        if (castlingRights[CastleType.BLACK_LONG_CASTLE])
            hash = Zobrist.toggleCastlingRights(CastleType.BLACK_LONG_CASTLE, hash);

        // Toggling EnPassant File
        if (enPassantFile !== null)
            hash = Zobrist.toggleEnPassantOnFile(enPassantFile, hash);

        return hash;
    }

}

Zobrist.initializeValues();

export { Hash, Zobrist };