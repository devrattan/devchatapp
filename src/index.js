const path = require('path');
const http = require('http');
const Filter = require('bad-words');
const express = require('express');
const app = express();
const socketio = require('socket.io');
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')

const server = http.createServer(app);
const publicDirectoryPath = path.join(__dirname,'../public');
const io = socketio(server)

const port = process.env.PORT||3000
app.use(express.static(publicDirectoryPath));

let message = "Welcome";
let filter = new Filter();
io.on('connection',(socket)=>{
    
    
    socket.on('join',(options,callback)=>{
       const {error,user} = addUser({id:socket.id,...options})
       if(error){
         return callback(error);
       }
       socket.join(user.room);
       socket.emit('message',generateMessage("Admin","WELCOME!"));
       socket.broadcast.to(user.room).emit('message',generateMessage("Admin",`${user.username} has joined the room ${user.room}`));
       callback();
       io.to(user.room).emit('roomData',{
         room:user.room,
         users:getUsersInRoom(user.room)
        })
    })

    socket.on('sendMessage',(message,callback)=>{
      const user = getUser(socket.id);
      if(user){ 
           if(filter.isProfane(message)){
            callback('message not delivered')
            return  socket.emit('message',generateMessage('Profanity not allowed'));
    }  
      io.to(user.room).emit('message',generateMessage(user.username,message));
      callback()
    }
    })
 
    socket.on('disconnect',()=>{
      const user = removeUser(socket.id);
      if(user){
      io.to(user.room).emit('message',generateMessage( "Admin",`${user.username} has left`))
      io.to(user.room).emit('roomData',{
        room:user.room,
        users:getUsersInRoom(user.room)
      })
      }
    })

    socket.on('sendLocation',(message,callback)=>{
      let user = getUser(socket.id);
      if(user){
      io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${message.latitude},${message.longitude}`));
       
      callback()
      }
    })
    
})




server.listen(port,()=>{
    console.log('app listening at '+port);
})