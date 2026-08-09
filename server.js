const app = require('./app.js')
const connectToDB = require('./config/db.js')
const http = require('http')
const { Server } = require('socket.io')

// connect to database and listen on Port 3000
async function startServer() {
    const PORT = process.env.PORT || 3000;
    await connectToDB();

    const server = http.createServer(app)

    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
        }
    })

    io.on("connection", (socket) => {
        console.log("Socket Connected:", socket.id)

        socket.on("disconnect", () => {
            console.log("Socket Disconnected:", socket.id)
        })
    })

    server.listen(PORT, () => {
        console.log(`App is running on port ${PORT}`);
    });
}


startServer();