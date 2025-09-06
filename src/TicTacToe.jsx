import React, { Component } from "react";
import { RefreshCw, Undo2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// --- Helpers
const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

function calculateWinner(board) {
    for (const [a, b, c] of LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line: [a, b, c] };
        }
    }
    return null;
}

function isDraw(board) {
    return board.every((c) => c !== null) && !calculateWinner(board);
}

function clone(board) {
    return [...board];
}

function availableMoves(board) {
    return board.map((c, i) => (c ? null : i)).filter((v) => v !== null);
}

// Simple AI: win > block > center > corners > sides
function getComputerMoveEasy(board, computer, human) {
    const moves = availableMoves(board);
    if (!moves.length) return null;
    for (const m of moves) {
        const test = clone(board); test[m] = computer;
        if (calculateWinner(test)) return m;
    }
    for (const m of moves) {
        const test = clone(board); test[m] = human;
        if (calculateWinner(test)) return m;
    }
    if (moves.includes(4)) return 4;
    const corners = [0, 2, 6, 8].filter((i) => moves.includes(i));
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    const sides = [1, 3, 5, 7].filter((i) => moves.includes(i));
    if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
    return moves[0];
}

export default class TicTacToe extends Component {
    state = {
        board: Array(9).fill(null),
        xIsNext: true,
        history: [],
        mode: "2 Players",       // "vs Computer" bhi available
        computerPlays: "O",
    };

    componentDidUpdate(_, prevState) {
        const { mode, board, xIsNext, computerPlays } = this.state;
        if (mode !== "vs Computer") return;

        const winnerInfo = calculateWinner(board);
        const draw = isDraw(board);
        const current = xIsNext ? "X" : "O";

        const wasAITurnBefore = (prevState.xIsNext ? "X" : "O") === prevState.computerPlays;
        const isAITurnNow = current === computerPlays;
        const boardChanged = prevState.board !== board;

        if ((isAITurnNow && !wasAITurnBefore) || (isAITurnNow && boardChanged)) {
            if (!winnerInfo && !draw) {
                clearTimeout(this.aiTimer);
                this.aiTimer = setTimeout(() => {
                    const human = computerPlays === "X" ? "O" : "X";
                    const idx = getComputerMoveEasy(board, computerPlays, human);
                    if (idx !== null && board[idx] === null) this.playMove(idx);
                }, 400);
            }
        }
    }

    componentWillUnmount() {
        clearTimeout(this.aiTimer);
    }

    reset = (newMode) => {
        this.setState({
            board: Array(9).fill(null),
            xIsNext: true,
            history: [],
            mode: newMode || this.state.mode,
        });
    };

    playMove = (i) => {
        const { board, xIsNext, history } = this.state;
        if (board[i] || calculateWinner(board)) return;
        const next = clone(board);
        const current = xIsNext ? "X" : "O";
        next[i] = current;
        this.setState({
            board: next,
            xIsNext: !xIsNext,
            history: [...history, board],
        });
    };

    undo = () => {
        const { history, xIsNext, board } = this.state;
        if (!history.length || calculateWinner(board)) return;
        const prev = history[history.length - 1];
        this.setState({
            board: prev,
            history: history.slice(0, -1),
            xIsNext: !xIsNext,
        });
    };

    toggleComputerSide = () => {
        this.setState((s) => ({ computerPlays: s.computerPlays === "X" ? "O" : "X" }));
    };

    setMode = (m) => {
        this.reset(m);
    };

    render() {
        const { board, xIsNext, history, mode, computerPlays } = this.state;
        const winnerInfo = calculateWinner(board);
        const draw = isDraw(board);
        const current = xIsNext ? "X" : "O";
        const status = winnerInfo ? `Winner: ${winnerInfo.winner}` : draw ? "Draw" : `Turn: ${current}`;

        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-2xl font-bold">Tic-Tac-Toe</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={this.undo}
                                disabled={!history.length || !!winnerInfo}
                                className="p-2 rounded-lg border disabled:opacity-50"
                                title="Undo"
                            >
                                <Undo2 size={18} />
                            </button>
                            <button
                                onClick={() => this.reset()}
                                className="p-2 rounded-lg border"
                                title="New game"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Mode & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                        <div className="text-sm text-gray-600">{status}</div>
                        <div className="flex gap-2">
                            <ModeToggle mode={mode} setMode={this.setMode} />
                            {mode === "vs Computer" && (
                                <button
                                    onClick={this.toggleComputerSide}
                                    className="px-3 py-1 text-sm border rounded-lg flex items-center gap-1"
                                >
                                    <Sparkles size={16} /> Computer: {computerPlays}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Board */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-3 gap-2"
                    >
                        {Array.from({ length: 9 }).map((_, i) => (
                            <Square
                                key={i}
                                value={board[i]}
                                onClick={() =>
                                    mode === "vs Computer" && current === computerPlays ? null : this.playMove(i)
                                }
                                highlight={!!winnerInfo && winnerInfo.line.includes(i)}
                                disabled={
                                    !!winnerInfo || board[i] !== null || (mode === "vs Computer" && current === computerPlays)
                                }
                            />
                        ))}
                    </motion.div>

                    {/* Footer */}
                    <div className="mt-4 text-center text-sm text-gray-500">
                        {winnerInfo ? (
                            <span>
                                {winnerInfo.winner} wins! Click <span className="font-medium">New game</span> to play again.
                            </span>
                        ) : draw ? (
                            <span>It's a draw. Try again!</span>
                        ) : (
                            <span>
                                {mode === "2 Players" ? "Tap a square to play." : current === computerPlays ? "Thinking…" : "Your move."}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

// Square
function Square({ value, onClick, highlight, disabled }) {
    return (
        <motion.button
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            onClick={onClick}
            disabled={disabled}
            className={[
                "aspect-square flex items-center justify-center rounded-lg border text-3xl font-bold",
                disabled ? "cursor-not-allowed opacity-70" : "hover:bg-gray-100",
                highlight ? "bg-yellow-100 border-yellow-400" : "bg-white border-gray-300",
            ].join(" ")}
        >
            <span className={value === "X" ? "text-blue-600" : value === "O" ? "text-red-500" : ""}>
                {value ?? ""}
            </span>
        </motion.button>
    );
}

// Mode toggle
function ModeToggle({ mode, setMode }) {
    return (
        <div className="inline-flex rounded-lg border text-sm">
            {["2 Players", "vs Computer"].map((m) => (
                <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={["px-3 py-1 rounded-lg", mode === m ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"].join(" ")}
                >
                    {m}
                </button>
            ))}
        </div>
    );
}
