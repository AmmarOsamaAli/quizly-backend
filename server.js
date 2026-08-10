const app = require('./app.js')
const connectToDB = require('./config/db.js')
const http = require('http')
const { initializeSocket } = require('./config/socket.js')

// connect to database and listen on Port 3000
async function startServer() {
    const PORT = process.env.PORT || 3000;
    await connectToDB();

    const server = http.createServer(app)

    initializeSocket(server)


    server.listen(PORT, () => {
        console.log(`App is running on port ${PORT}`);
    });
}


startServer();