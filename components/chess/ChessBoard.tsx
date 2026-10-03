'use client';

import {Game} from '@/engine/game';
import {ChessRuleSet} from '@/engine/chessRuleSet';
import {Position} from '@/engine/types';
import {useState, useRef} from 'react';
import ChessPiece from "./ChessPiece";

const pieceSymbols = {
  white: {
    king: "♔", queen: "♕", rook: "♖",
    bishop: "♗", knight: "♘", pawn: "♙",
  },
  black: {
    king: "♚", queen: "♛", rook: "♜",
    bishop: "♝", knight: "♞", pawn: "♟",
  }
};

export default function ChessBoard()
{
  const [game] = useState(() => {
    const newGame = new Game();
    newGame.setBoardLayout();
    return newGame;
  });

  const [__, setBoard] = useState(0);
  const [square, setSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);

  const board = game.board.positionMap;
  const boardRef = useRef<HTMLDivElement>(null);

  function handleClick(x: number, y: number)
  {
    const clickedPiece = board[y][x];

    if (square) {
      const isLegalMove = legalMoves.some(
        (move) => move.x === x && move.y === y
      );

      if (isLegalMove) {
        const result = game.playMoveWithValidation({
          from: square,
          to: {x, y}
        });

        if (result.executed) {
          setSquare(null);
          setLegalMoves([]);
          setBoard((change) => change + 1);
          return;
        }
      }

      if (clickedPiece?.color === game.currentTurnColor) {
        const moves = ChessRuleSet.getLegalMoves(
          game,
          {x, y}
        );

        setSquare({x, y});
        setLegalMoves(moves);
        return;
      }

      setSquare(null);
      setLegalMoves([]);
      return;
    }

    if (!clickedPiece) return;
    if (clickedPiece.color !== game.currentTurnColor) return;

    const moves = ChessRuleSet.getLegalMoves(
      game,
      {x, y}
    );

    setSquare({x, y});
    setLegalMoves(moves);
  }

  function isSelected(x: number, y: number)
  {
    return square?.x === x && square?.y === y;
  }

  function isLegalMove(x: number, y: number)
  {
    return legalMoves.some(
      (move) => move.x === x && move.y === y
    );
  }

  function handleDragStart(x: number, y: number)
  {
    const draggedPiece = board[y][x];

    if (!draggedPiece) return;

    if (
      draggedPiece.color !==
      game.currentTurnColor
    ) {
      return;
    }

    setSquare({x, y});

    const moves = ChessRuleSet.getLegalMoves(
      game,
      {x, y}
    );

    setLegalMoves(moves);
  }

  function handleDragEnd(
    fromX: number,
    fromY: number,
    clientX: number,
    clientY: number
  )
  {
    const boardElement = boardRef.current;

    if (!boardElement) {
      return false;
    }

    const rect =
      boardElement.getBoundingClientRect();

    const squareSize =
      rect.width / 8;

    const toX = Math.floor(
      (clientX - rect.left) /
      squareSize
    );

    const toY = Math.floor(
      (clientY - rect.top) /
      squareSize
    );

    if (
      toX < 0 ||
      toX > 7 ||
      toY < 0 ||
      toY > 7
    ) {
      setSquare(null);
      setLegalMoves([]);
      return false;
    }

    const result =
      game.playMoveWithValidation({
        from: {x: fromX, y: fromY},
        to: {x: toX, y: toY}
      });

    if (result.executed) {
      setSquare(null);
      setLegalMoves([]);
      setBoard((change) => change + 1);
      return true;
    }

    setSquare(null);
    setLegalMoves([]);

    return false;
  }

  return (
    <div>
      <div
        ref={boardRef}
        className="grid aspect-square w-[min(90vw,640px)] grid-cols-8 border-4 border-slate-700 shadow-2xl"
      >
        {board.map((row, rowIndex) =>
          row.map((piece, columnIndex) => {
            const isLightSquare =
              (rowIndex + columnIndex) % 2 === 0;

            const selected =
              isSelected(
                columnIndex,
                rowIndex
              );

            const legalMove =
              isLegalMove(
                columnIndex,
                rowIndex
              );

            const symbol = piece
              ? pieceSymbols[
                  piece.color
                ][piece.name]
              : "";

            return (
              <button
                key={`${rowIndex}-${columnIndex}`}
                type="button"
                onClick={() =>
                  handleClick(
                    columnIndex,
                    rowIndex
                  )
                }
                className={`relative flex aspect-square items-center justify-center select-none ${
                  isLightSquare
                    ? "bg-amber-100"
                    : "bg-emerald-700"
                } ${
                  selected
                    ? "ring-4 ring-inset ring-yellow-400"
                    : ""
                }`}
              >
                {piece && (
                  <ChessPiece
                    symbol={symbol}
                    color={piece.color}
                    isTurn={
                      piece.color ===
                      game.currentTurnColor
                    }
                    onDragStart={() => {
                      handleDragStart(
                        columnIndex,
                        rowIndex
                      );
                    }}
                    onDragEnd={(clientX, clientY) => {
                      return handleDragEnd(
                        columnIndex,
                        rowIndex,
                        clientX,
                        clientY
                      );
                    }}
                  />
                )}

                {legalMove && (
                  <span
                    className={`absolute rounded-full ${
                      piece
                        ? "inset-2 border-4 border-red-500"
                        : "h-5 w-5 bg-black/30"
                    }`}
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-4 text-center text-white">
        Turn:{" "}
        <span className="font-semibold capitalize">
          {game.currentTurnColor}
        </span>
      </div>
    </div>
  );
}