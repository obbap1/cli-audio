/* eslint-disable no-plusplus */
/* eslint-disable no-console */
const uWS = require("./node_modules/uWebSockets.js/uws");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const readline = require('readline');
const {isMainThread, parentPort, Worker} = require('worker_threads');
const dirent = new fs.Dirent();
const playlist = [];

function fetchSongs(dir) {
  if(isMainThread){
  //Start the add to playlist worker
  const addToPlaylistWorker = new Worker('./addToPlaylist.js');
  addToPlaylistWorker.on('message',(message) => {
    console.log('New song to add to playlist', message);
    if(path.extname(message) !== mp3) return console.log(`Only Mp3 types are valid`); 
  });

  addToPlaylistWorker.on('error', (e) => {
    const workerError = new Error( `Playlist worker exited with error ${e}`);
    return workerError;
  });

  addToPlaylistWorker.on('exit', (code) => {
    return console.log(`Worker Exited with code ${code}`);
  });

  fsPromises.readdir(`${dir}`)
    .then(files => {
        console.log(files);
        files.forEach(file => {
          if(fs.stat(file).isFile() && path.extname(file) === 'mp3'){
            playlist.push(path.resolve(file))
          }
        })
    })
  }else{
    parentPort.on('message', message => console.log(`listening ${message}`))
  }
}

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

r1.question('Please enter the path to your folder', (answer) => {
  try{
  console.log(dirent.isDirectory((path.resolve(answer))));
  return dirent.isDirectory((path.resolve(answer))) ? fetchSongs(answer) : console.log(`Invalid Directory ${answer}`); 
  } catch(e){
    console.log(`Dirent Error ${e}`)
  }
})


const port = 9001;
const fileName = "/home/obbap/Documents/cli-video-chat/Do.mp3";
const totalSize = fs.statSync(fileName).size;

let openStreams = 0;
let streamIndex = 0;

console.log(`Video size is ${totalSize} bytes`);

function toArrayBuffer(buffer) {
  // console.log(`${buffer} to be converted`);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

function onAbortedOrFinishedResponse(res, readStream) {
  if (res.id == -1) {
    console.log(
      "Error! onAbortedOrFinishedResponse called twice for the same res!"
    );
  } else {const getPlaylist = {
    type: "input",
    name: "Play List",
    message:
      "Add path to folder where your songs are ? \n ( Eg. /home/o/Documents/cli-video-chat/)",
    validate: input =>
      fs.Stats(path.resolve(input)).isDirectory() ? "Valid Input" : "Please enter a valid directory"
  };
    // eslint-disable-next-line no-plusplus
    console.log(`Stream was closed, openStreams: ${--openStreams}`);
    console.timeEnd(res.id);
    readStream.destroy();
  }

  res.id = -1;
}

function pipeStreamOverResponse(res, readStream, totalSize) {
  readStream
    .on("data", chunk => {
      const ab = toArrayBuffer(chunk);
      const lastOffset = res.getWriteOffset();
      const [ok, done] = res.tryEnd(ab, totalSize);

      if (done) {
        onAbortedOrFinishedResponse(res, readStream);
      } else if (!ok) {
        readStream.pause();
        res.ab = ab;
        res.abOffset = lastOffset;

        res.onWritable(offset => {
          const [okay, donee] = res.tryEnd(
            res.ab.slice(offset - res.abOffset),
            totalSize
          );
          if (donee) {
            onAbortedOrFinishedResponse(res, readStream);
          } else if (okay) {
            readStream.resume();
          }
          return ok;
        });
      }
    })
    .on("error", e => {
      console.log(`${e} close response!`);
    });

  res.onAborted(() => {
    onAbortedOrFinishedResponse(res, readStream);
  });
}

const app = uWS
  ./* SSL */ App({
    key_file_name: "",
    cert_file_name: "",
    passphrase: "1234"
  })
  .get("/download", (res, req) => {
    console.time((res.id = ++streamIndex));
    console.log(`Stream was opened, openStreams: ${++openStreams}`);
    const readStream = fs.createReadStream(fileName);
    pipeStreamOverResponse(res, readStream, totalSize);
  })
  .get("/*", (res, req) => {
    res.end("Nothing yet");
  })
  .listen(port, token =>
    token
      ? console.log(`listening to port ${port}`)
      : console.log(`failed to listen to port ${port}`)
  );
