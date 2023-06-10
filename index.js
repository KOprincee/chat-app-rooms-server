const express = require("express");
const app = express();
const socket = require("socket.io");
const cors = require("cors");

const c_users = [];

function join_User(id, username, room) {
  const p_user = { id, username, room };

  c_users.push(p_user);
  console.log(c_users, "users");

  return p_user;
}

function get_Current_User(id) {
  return c_users.find((p_user) => p_user.id === id);
}

function user_Disconnect(id) {
  const index = c_users.findIndex((p_user) => p_user.id === id);

  if (index !== -1) {
    return c_users.splice(index, 1)[0];
  }
}

app.use(express());

const port = process.env.PORT || 8090;

app.use(cors());

let server = app.listen(
  port,
  console.log(`Server is running on the port no: ${port} `)
);

const io = socket(server, {
  cors: {
    origin: "https://app-chat-room.netlify.app",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  //for a new user joining the room
  console.log("joined");
  socket.on("joinRoom", ({ userName, roomName }) => {
    console.log("joining room", { userName, roomName });
    const p_user = join_User(socket.id, userName, roomName);
    console.log(socket.id, "=id");
    socket.join(p_user.room);

    socket.broadcast.to(p_user.room).emit("message", {
      userId: p_user.id,
      username: p_user.username,
      text: `${p_user.username} has joined the chat`,
      align: "center",
    });
  });

  socket.on("chat", (text) => {
    console.log("chat", { text });
    const p_user = get_Current_User(socket.id);

    socket.broadcast.to(p_user?.room).emit("message", {
      userId: p_user?.id,
      username: p_user?.username,
      text: text,
      align: "left",
    });
  });

  socket.on("typing", () => {
    console.log("typing");
    try {
      const p_user = get_Current_User(socket.id);

      socket.broadcast.to(p_user?.room).emit("typing", {
        userId: p_user?.id,
        username: "",
        text: `${p_user?.username} is typing`,
        align: "left",
      });
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("disconnect", () => {
    const p_user = user_Disconnect(socket.id);

    if (p_user) {
      io.to(p_user.room).emit("message", {
        userId: p_user.id,
        username: p_user.username,
        text: `${p_user.username} has left the chat`,
        align: "center",
      });
    }
  });
});
