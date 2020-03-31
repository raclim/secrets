var peerData = [];
var peerID;

var peer = new Peer({host: 'liveweb-new.itp.io', port: 9000, path: '/'});

var socket = io.connect();

socket.on('connect', function () {
    console.log("Connected");
});

//Receive a message
socket.on('showMessage', function(data) {
  console.log("Got: " + data);
  let innerMessages = document.getElementById('messages');
  while (innerMessages.firstChild) {
    innerMessages.removeChild(innerMessages.firstChild);
  }
  innerMessages.innerHTML += ('' + data);
});

// Get an ID from the PeerJS server
peer.on('open', function(id) {
    peerID = id;
});

peer.on('error', function(err) {
    console.log(err);
});

socket.on('new peer enter', function(data) {
    console.log("new peer in");
    let length = data.length;
    console.log("data length " + length);
    let otherVids = document.getElementById('otherVids');

    for (let i = 0; i < length; i++) {
      if (peerID != data[i].peerid) {
        console.log(otherVids);
        console.log(length, data);
        makeCall(data[i].peerid);
        console.log("calling" + data[i].peerid);
      }
      else {
        return;
      }
    }
});

socket.on('deletePeer', function(deletingPeer) {
  // let ovids = document.getElementById('otherVids');
  console.log(deletingPeer);
  let deletePeer = document.getElementById(deletingPeer);
  console.log('delete: ', deletePeer);
  deletePeer.parentNode.removeChild(deletePeer);

});

let sendMessage = function() {
  let message = document.getElementById('message').value;
  console.log("Sending: " + message);
  // Send a message
  socket.send(message);
};

let myBlurCount=40;
let sendConfirm = function() {
  let videoId = {
    id:peerID,
    blurCount: myBlurCount
  };
  console.log("sendConfirm video ID", videoId.id);
  socket.emit('confirm', videoId);
  let lessBlurMyVid = document.getElementById('myVideo');
  if (videoId.blurCount > 0) {
    videoId.blurCount -= 5;
    myBlurCount -=5;
  }
  console.log('blurCount: ', videoId.blurCount);
  let finalBlurCount = 'blur(' + videoId.blurCount + 'px' +')';
  console.log(finalBlurCount);
  lessBlurMyVid.style.filter = finalBlurCount;
};

socket.on('lessBlur', function(data) {
  let lessBlurVideo = document.getElementById(data.id);
  let finalBlurCount = 'blur(' + data.blurCount + 'px' +')';
  lessBlurVideo.style.filter = finalBlurCount;
})

peer.on('call', function(incomingCall) {
    console.log("Got a call! ");
    incomingCall.answer(my_stream); // Answer the call with our stream from getUserMedia
    incomingCall.on('stream', function (remoteStream) { // we receive a getUserMedia stream from the remote caller
      console.log("CREATING MY VIDEO!");
      var ovideoElement = document.createElement('video');
      ovideoElement.srcObject = remoteStream;
      ovideoElement.setAttribute("autoplay", "true");
      ovideoElement.style.filter = 'blur(40px)';
      ovideoElement.style.width = '40%';
      ovideoElement.play();
      ovideoElement.setAttribute("id", incomingCall.peer);
      console.log('incomingCall: ', incomingCall.peer);
      var ovids = document.getElementById('otherVids');
      ovids.appendChild(ovideoElement);
    });
});

// let callList = [];
function makeCall(idToCall) {
    var call = peer.call(idToCall, my_stream);

    call.on('stream', function (remoteStream) {
        console.log("CREATING VIDEO!");
        var ovideoElement = document.createElement('video');
        ovideoElement.srcObject = remoteStream;
        ovideoElement.setAttribute("autoplay", "true");
        ovideoElement.style.filter = 'blur(40px)';
        ovideoElement.style.width = '40%';
        ovideoElement.play();
        console.log(idToCall);
        ovideoElement.setAttribute("id", idToCall);
        var ovids = document.getElementById('otherVids');
        ovids.appendChild(ovideoElement);
    });
}


/* Get User Media */
let my_steam = null;
let webcamSettings = {
    audio: false,
    video: true,
}

window.addEventListener('load', function () {

    let webcam = document.getElementById('myVideo');
    //if permission allowed
    navigator.mediaDevices.getUserMedia(webcamSettings)
        .then(function (stream) {

            // Global for stream
            webcam.srcObject = stream;
            webcam.onloadedmetadata = function (e) {
                webcam.play();
            }

            my_stream = stream;
            setTimeout(
                function () {
                    var mypeerData = {
                        id: peerID
                    };
                    console.log(mypeerData);
                    peerData.push(mypeerData);
                    socket.emit('new peer', mypeerData);
                }, 800);
        })
        .catch(function (err) {
            console.log(err);
        })
})
