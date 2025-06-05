// server.js (or server.ts if you want to use TypeScript)
import { createServer } from "http";
import { Server } from "socket.io";
import db from "./lib/db"; // Make sure these paths are correct and compatible
import { logger } from "./lib/logger";
import {
  isValidMove,
  distributeSeeds,
  handleCapture,
  checkGameOver,
  getNextPlayer,
} from "./lib/game-logic";

const port = process.env.PORT || 3001;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  logger.info("User connected");
  socket.on("disconnect", () => logger.info("User disconnected"));

  socket.on("hello", async () => {
    try {
      const messages = await db.getMessages();
      socket.emit("hello", { messages });
    } catch (error) {
      logger.error("Error retrieving messages:", error);
      socket.emit("error", { message: "Failed to retrieve messages" });
    }
  });

  socket.on("message", async (data) => io.emit("message", data));

  socket.on("create-room", async (lobbyName) => {
    try {
      socket.join(lobbyName);
      const game = await db.getGameByLobbyName(lobbyName);
      io.to(lobbyName).emit("game-start", game);
      logger.info(`User created room: ${lobbyName}`);
    } catch (error) {
      logger.error("Error creating room:", error);
      socket.emit("error", { message: "Failed to create room" });
    }
  });

  socket.on("join-room", async (lobbyName) => {
    try {
      socket.join(lobbyName);
      const game = await db.getGameByLobbyName(lobbyName);
      io.to(lobbyName).emit("game-start", game);
      logger.info(`User joined room: ${lobbyName}`);
    } catch (error) {
      logger.error("Error joining room:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("leave-room", async (lobbyName) => {
    try {
      socket.leave(lobbyName);
      logger.info(`User left room: ${lobbyName}`);
    } catch (error) {
      logger.error("Error leaving room:", error);
    }
  });

  socket.on("get-rooms", async () => {
    try {
      const rooms = await db.getAvailableGames();
      socket.emit("rooms-list", rooms);
    } catch (error) {
      logger.error("Error getting rooms:", error);
      socket.emit("error", { message: "Failed to get rooms" });
    }
  });

  socket.on("player-move", async (data) => {
    try {
      const { game, lobbyName, pitIndex } = data;
      let board = game.board || [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
      const isPlayer1Turn = game.current === "player1";

      if (!isValidMove(pitIndex, board, isPlayer1Turn)) {
        socket.emit("error", { message: "Invalid move" });
        return;
      }

      const lastPit = distributeSeeds(board, pitIndex, isPlayer1Turn);
      handleCapture(board, lastPit, isPlayer1Turn);
      const winner = checkGameOver(board);
      let winnerId = "";
      if (winner) {
        winnerId =
          winner === "player1"
            ? game.player1
            : winner === "player2"
            ? game.player2
            : "tie";
      }
      const nextPlayer = getNextPlayer(lastPit, isPlayer1Turn, game.current);
      const gameStatus = winner ? "complete" : "inProgress";

      const updatedGame = await db.gameMove(
        lobbyName,
        board,
        nextPlayer,
        winnerId,
        gameStatus
      );

      io.to(lobbyName).emit("game-update", updatedGame);

      if (gameStatus === "complete") {
        const completedGame = await db.getGameByLobbyName(lobbyName);
        io.to(lobbyName).emit("game-over", completedGame);
      }
    } catch (error) {
      logger.error("Error processing player move:", error);
      socket.emit("error", { message: "Failed to process move" });
    }
  });
});

httpServer.listen(port, () => {
  logger.info(`> WebSocket server listening on port ${port}`);
});
