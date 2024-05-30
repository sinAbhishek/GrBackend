const http = require("http");
const express = require("express");

const app = express();
// const server = http.createServer(app);
const {Server}=require("socket.io")
// import { Server } from "socket.io";
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  // mongoConnect();
  console.log("database connected");
});
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});
// const io = require("socket.io")(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true,
//   },
// });
// const { addUser, removeUser } = require("./user");
let lobbies = [
  { 12345: [{ socket: "123121", name: "abhi", character: "Default" }] },
];
var passwords=[]
var boss=[]
// const PORT = 5000;
const rooms = [];
const addroom = (room) => {
  rooms.push(room);
  console.log(rooms);
};
const joinlobby=(data,id)=>{
  console.log(passwords,"passwords")
  console.log(typeof(data.password))

  const check=passwords.some((c)=>c[data.path]===data.password)
  console.log(check,"check")
  if(check){
    console.log(data.password)
    lobbies.forEach((c)=>{
      if(c[data.path]){
        if(c[data.path].length<4){
          c[data.path].push({
            socketid: id,
            name: data.name,
            character: "Default",
          });
          return lobbies
        }
        else{
          throw new Error("Lobby full")
        }
      
      }
  
    })
 
    console.log("password approve")
  }else{
    console.log("password incorrect")
    throw new Error("Password wrong")
  }
 

}
const leaveroom=(id)=>{

  var joinedRoom=""
  lobbies.forEach((c)=>{
    const room=Object.keys(c)[0]
    const userexist=c[room].some((u)=> u.socketid===id)
    console.log(userexist)
    if(c[room].length===1&&userexist){
      joinedRoom=room
      const updatedarr=lobbies.filter((u)=>u[room]===undefined )
      lobbies=updatedarr
      console.log(updatedarr,"arrra")
    }
    else if(userexist){
      joinedRoom=room
      const updatedroom=c[room].filter((u)=>u.socketid!==id)
      c[room]=updatedroom
      console.log(lobbies,"test")
    }
  })
  return joinedRoom


}
const updateBoss=(data)=>{
  let updatedboss=""
  boss.forEach((c)=>{
  if(c[data.room]){
    c[data.room].boss=data.boss
    updatedboss=c[data.room]
  }})
  console.log(boss,"update boss check")
  return updatedboss
}
const createLobbies = (data, id) => {
  lobbies.forEach((c)=>console.log(c[data.room]))
  const exists = lobbies.some((c) => c[data.room] !== undefined||null);
  console.log(exists)
  if (!exists) {
    lobbies.push({
      [data.room]: [{ socketid: id, name: data.name, character: "Default" }],
    });
    passwords.push({
      [data.room]: data.password,
    });
    boss.push({
      [data.room]: { boss:"Default" }
    })
    console.log(lobbies)
    console.log(boss,"boss addded")
  }

  const testo = lobbies.map((c) => console.log(c[data.room]));
  console.log(exists);
  console.log(data.room);
  const lobby=lobbies.filter((c)=>c[data.room]!==undefined)
  return lobby

};
const addcharacter = (data, id) => {
  lobbies.forEach((c) => {
    if (c[data.room]) {
      c[data.room].forEach((obj) => {
        if (obj.socketid === id) {
          obj.character = data.name;
        }
      });
    }
  });
  const lobby=lobbies.filter((c)=>c[data.room]!==undefined)
  console.log(lobbies[lobbies.length - 1][data.room], "huhu");
  return lobby
 
};
const sendparty=(data)=>{
  const lobby=lobbies.filter((c)=>c[data.room]!==undefined)
  return lobby
}
io.on("connection", async (socket) => {
  socket.emit("roominfo", lobbies);

  const sockets = await io.in("12345").fetchSockets();
  console.log(`hehe ${sockets}`);
 
  socket.on("join", (data) => {
   
    console.log(data);
    console.log(socket.id);
  });
 
  console.log(socket.id);
  socket.on("joinroom",(data)=>{
    try{
      const lobby=joinlobby(data,socket.id)
      socket.join(data.path);
      socket.emit("route",data)
      io.emit("roominfo", lobbies);
    }
    catch(e){
      socket.emit("error", {error:e.message});
    }
   
   
  
  })
  socket.on("updateboss",(data)=>{
    console.log(data,"boss change")
    const boss=updateBoss(data)
    console.log(boss)
    io.to(data.room).emit("bosses",boss)
  })
  socket.on("createroom", (data) => {
    console.log(data);
    socket.join(data.room);
    addroom(data.room);
    const lobby=createLobbies(data, socket.id);
    socket.emit("route",{path:data.room})
    io.emit("roominfo", lobbies);
    // io.to(data.room).emit("receive",lobby[0]);
  });
  socket.on("changecharacter", (data) => {
    console.log(data);
    const lobby=addcharacter(data, socket.id);
    io.to(data.room).emit("receive",lobby);
  });
  socket.on("send", async(data) => {
    console.log(data);

    const lobby=sendparty(data);
    console.log(lobby,"lobby")
    console.log(data,boss,"boss info")
    const updatedboss=boss.filter((c)=>c[data.room]!==undefined)
    io.to(data.room).emit("bosses",updatedboss[0][data.room])
    io.to(data.room).emit("receive", lobby);
    // socket.to(data.room).emit("receive", lobby)
   
  });
  socket.on("lobbies", async (names) => {
    console.log(io.sockets.adapter.rooms);
    console.log(lobbies[lobbies.length - 1], "jeut");
    const rawrooms = Array.from(io.sockets.adapter.rooms.entries());
    const sockets = await io.allSockets();
    const allsockets = Array.from(sockets);
    const filterrooms = rawrooms.filter((c) => !allsockets.includes(c[0]));
    console.log(filterrooms);
    const createroomobj = filterrooms.map((c) => {
      const key = c[0];
      const value = Array.from(c[1]);
      console.log(value);
      const newobj = { [key]: value };
      return newobj;
    });
    createroomobj.forEach((c) => console.log(Object.keys(c)));

  
    io.emit("allLobby", createroomobj);
  });
  socket.on("forcedc",()=>{
    socket.disconnect()
    console.log("huhuhu im dc now")
  })
  socket.on("disconnect", () => {
 
    const room=leaveroom(socket.id)
    if(room){
      const filter=lobbies.filter((c)=>c[room]!==undefined)
   
      console.log("this is getting send after leave",filter)
      io.to(room).emit("receive",filter);
      io.emit("roominfo", lobbies);
      console.log("A disconnection has been made and they have been removed",socket.id);
    }
    else{
      console.log("A disconnection has been made but they werent joined in any room",socket.id);
    }

    
  });
});

// server.listen(PORT, () => console.log(`Server is Quannected to Port ${PORT}`));
