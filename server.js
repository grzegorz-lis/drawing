const express = require("express");
const path = require('path');
const fs = require('fs');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log("Server running on Port", PORT)
);

let imgArr = null;

const fileStorage = multer.diskStorage({
  destination:(req,file,cb) =>{
    cb(null,'images');
  },
  filename:(req,file,cb) =>{
    cb(null,file.originalname);
  }
})

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage}).single('image'))
// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
// );
app.use(express.static("public"));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.get('/',(req,res)=>{
  let isLoggedIn = "";
if (req.get('Cookie')) {
   isLoggedIn = req.get('Cookie').split('=')[1].trim();
}
console.log(imgArr)
  res.render('index',{
    isAuthenticated:isLoggedIn,
    imgUrl:imgArr
  })
});

app.get('/delete',(req,res)=>{
  imgArr ? fs.unlinkSync(imgArr) : null;
  imgArr=null;
  res.redirect('/')
})

app.post('/',(req,res) =>{
  //ustawiam swoje hasło i nazwę użytkownika
  const userName = "wiktor";
  const password = "1234";

  if(req.body.username === userName && req.body.password === password) {
    res.setHeader('Set-Cookie', 'loggedIn=true');
  } 

  
  res.redirect('/');
});

app.post('/image', (req,res)=>{
 imgArr ? fs.unlinkSync(imgArr) : null;
imgArr=req.file.path;

 res.redirect('/')
})

const socket = require("socket.io");
const io = socket(server);

let socketNumber = 0;

const drawQueue = [];

io.on("connect", socket => {
  socketNumber++;
  io.emit("socketNumber", socketNumber);

  socket.on('image', ()=>{
    io.emit('image',imgArr);
  })
  

  drawQueue.forEach(([...args]) => socket.emit("drawing", ...args));

  socket.on("clearCanvas", () => {
    drawQueue.length = 0;
    io.emit("clearCanvas");
  });

  socket.on("drawing", (...args) => {
    drawQueue.push([...args]);
    io.emit("drawing", ...args);
  });

  socket.on("disconnect", () => {
    socketNumber--;
    io.emit("socketNumber", socketNumber);
  });
});
