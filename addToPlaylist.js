const readline = require('readline');
const path = require('path');
const fs = require('fs');
const {parentPort} = require('worker_threads');

const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

r1.question('Enter path to a single file you want to add to playlist (Eg. /home/ne.mp3', (answer) => {
    if(path.basename(answer).extname !== 'mp3'){
        return console.log('Invalid File')
    }
    parentPost.post({songPath: path.resolve(answer)});

    rl.on('line', (input) => {
        console.log(`Received: ${input}`);
      });
})

parentPort.on('message', message  => {
    if(message === "close") {
        parentPort.post('exit')
        parentPort.close();
    }
})
