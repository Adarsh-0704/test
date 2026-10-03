import type {PieceColor} from "../types/piece";

function getColorMultiplier(color: PieceColor)
{
    return color === "white" ? -1 : 1;
}

function switchColor(color: PieceColor): PieceColor
{
    return color === "white" ? "black" : "white";
}

export { getColorMultiplier, switchColor };