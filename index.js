const express = require("express")
const app = express()
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
app.use(cors())
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
})

const columnDisplay = 12
const rowDisplay = 8
let roomState = []

const responseToOneClient = (clientId, event, dataArr) => {
    io.to(clientId).emit(event, dataArr)
}


const createDropButtonArr = () => {
    var createDropButton = []
    for (var i = 1; i <= columnDisplay; i++) {
        createDropButton.push({ column: i, row: 1 })
    }
    return createDropButton
}
const createTableArr = () => {
    var createTable = []
    for (var j = rowDisplay; j > 0; j--) {
        for (var i = 1; i <= columnDisplay; i++) {
            createTable.push({ column: i, row: j, symbol: '' })
        }
    }
    return createTable
}


io.on("connection", (socket) => {

    socket.on("joinRoom", (data) => {
        if (roomState.filter((room) => (room.roomId === data.room)).length === 0) {
            roomState.push({
                roomId: data.room,
                player1: { name: data.playerName, socketId: socket.id },
                player2: undefined,
                gameStatus: false,
                activeBox: {},
                playerTurn: data.playerName,
                dropButton: createDropButtonArr(),
                table: createTableArr()
            })
        } else {
            roomState = roomState.map((room) => {
                if (room.roomId === data.room) {
                    return {
                        roomId: room.roomId,
                        player1: room.player1,
                        player2: { name: data.playerName, socketId: socket.id },
                        gameStatus: room.gameStatus,
                        activeBox: room.activeBox,
                        playerTurn: room.playerTurn,
                        dropButton: room.dropButton,
                        table: room.table
                    }
                } else {
                    return room
                }
            })
        }



        if (roomState.filter((room) => (room.roomId === data.room))[0].player1 !== undefined && roomState.filter((room) => (room.roomId === data.room))[0].player2 !== undefined) {
            roomState = roomState.map((room) => {
                if (room.roomId === data.room) {
                    return {
                        roomId: room.roomId,
                        player1: room.player1,
                        player2: room.player2,
                        gameStatus: !room.gameStatus,
                        activeBox: room.activeBox,
                        playerTurn: room.playerTurn,
                        dropButton: room.dropButton,
                        table: room.table
                    }
                } else {
                    return room
                }
            })
            responseToOneClient(
                roomState.filter((room) => (room.roomId === data.room))[0].player1.socketId,
                "returnRoomState",
                roomState.filter((room) => (room.roomId === data.room))
            )
            responseToOneClient(
                roomState.filter((room) => (room.roomId === data.room))[0].player2.socketId,
                "returnRoomState",
                roomState.filter((room) => (room.roomId === data.room))
            )

        } else {
            if (roomState.filter((room) => (room.roomId === data.room))[0].player1 !== undefined) {
                responseToOneClient(
                    roomState.filter((room) => (room.roomId === data.room))[0].player1.socketId,
                    "returnRoomState",
                    roomState.filter((room) => (room.roomId === data.room))
                )
            }
            if (roomState.filter((room) => (room.roomId === data.room))[0].player2 !== undefined) {
                responseToOneClient(
                    roomState.filter((room) => (room.roomId === data.room))[0].player2.socketId,
                    "returnRoomState",
                    roomState.filter((room) => (room.roomId === data.room))
                )
            }
        }
    })

    socket.on("clickDropButton", (data) => {
        roomState = roomState.map((room) => {
            if (room.roomId === data.room) {
                // update button action
                room.dropButton = room.dropButton.map((dropButton) => {
                    if (dropButton.column === data.column && dropButton.row < 8) {
                        return {
                            column: dropButton.column,
                            row: dropButton.row + 1
                        }
                    } else {
                        return dropButton
                    }

                })
                // update table display
                room.table = room.table.map((table) => {
                    if (table.column === data.column && table.row === data.row) {
                        return {
                            column: table.column,
                            row: table.row,
                            symbol: data.playerTurn
                        }
                    } else {
                        return table
                    }
                })
                // update active button
                room.activeBox = { column: data.column, row: data.row }
                // update player turn
                if (data.playerTurn === room.player1.name) {
                    room.playerTurn = room.player2.name
                } else {
                    room.playerTurn = room.player1.name
                }
                return room

            } else {
                return room
            }
        })
        responseToOneClient(
            roomState.filter((room) => (room.roomId === data.room))[0].player1.socketId,
            "returnRoomState",
            roomState.filter((room) => (room.roomId === data.room))
        )
        responseToOneClient(
            roomState.filter((room) => (room.roomId === data.room))[0].player2.socketId,
            "returnRoomState",
            roomState.filter((room) => (room.roomId === data.room))
        )
    })
    socket.on("reStartGame", (data) => {
        roomState = roomState.map((room) => {
            if (room.roomId === data.room) {
                return {
                    roomId: room.roomId,
                    player1: room.player1,
                    player2: room.player2,
                    gameStatus: true,
                    activeBox: {},
                    playerTurn: room.playerTurn,
                    dropButton: createDropButtonArr(),
                    table: createTableArr()
                }
            } else {
                return room
            }
        })
        responseToOneClient(
            roomState.filter((room) => (room.roomId === data.room))[0].player1.socketId,
            "returnRoomState",
            roomState.filter((room) => (room.roomId === data.room))
        )
        responseToOneClient(
            roomState.filter((room) => (room.roomId === data.room))[0].player2.socketId,
            "returnRoomState",
            roomState.filter((room) => (room.roomId === data.room))
        )
    })

    
})

server.listen(3001, () => {
    console.log("SERVER IS RUNNING")
})