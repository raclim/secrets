var https = require('https');
var fs = require('fs'); // Using the filesystem module
var url = require('url');

//Database to store database
var Datastore = require('nedb');
var db = new Datastore({filename: "responses.db", autoload: true});

var options = {
  key: fs.readFileSync('my-key.pem'),
  cert: fs.readFileSync('my-cert.pem')
};

function handleIt(req, res) {
  var parsedUrl = url.parse(req.url);

  var path = parsedUrl.pathname;
  if (path == "/") {
    path = "index.html";
  }

  fs.readFile(__dirname + path,

    // Callback function for reading
    function (err, fileContents) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + req.url);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200);
      res.end(fileContents);
    }
  );

  // Send a log message to the console
  console.log("Got a request " + req.url);
}

var httpServer = https.createServer(options, handleIt);
httpServer.listen(8081);

console.log('Server listening on port 8081');

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
var peers = [];

io.sockets.on('connection',
  // We are given a websocket object in our function
  function (socket) {

    console.log("We have a new client: " + socket.id);
    socket.on('new peer', function (data) {
      //  console.log("new peer id:" + peerid);
      var newPeer = {
        id: socket.id,
        peerid: data.id,
      }
      //store in server
      peers.push(newPeer);
      console.log("Peer array: " + peers);
      socket.emit('new peer enter', peers);

      //receive messages
      socket.on('message', function(msgData) {
        console.log("message: " + msgData);

        let dataToSave = {
          message: msgData
        }

        //insert the data into the database
        db.insert(dataToSave, function(err, newDocs) {
          console.log("err: ", err);
          console.log("newDocs: ", newDocs);
        });
        //send to all clients
        io.sockets.emit('showMessage', msgData);
      })

      //receive confirmation
      socket.on('confirm', function(data) {
        socket.broadcast.emit('lessBlur', data);
      });

      //on disconnet
      socket.on('disconnect', function () {
        console.log("Client has disconnected");
        for (let i = 0; i < peers.length; i++) {
          //if the user is a player, remove it from the players list
          if (peers[i].id == socket.id) {
            console.log(peers[i].id);
            console.log(i);
            io.emit('deletePeer', peers[i].peerid);
            peers.splice(i, 1);
            console.log("a player is disconnected");
          };
        }
      });
    });
  }
);
