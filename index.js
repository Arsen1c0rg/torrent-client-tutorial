const fs = require("fs")
const bencode = require('bencode') // use bencode version 2.0.0

// 1
const dgram = require('dgram')
const Buffer = require('buffer').Buffer
const urlParse = require('url').parse

const torrent = bencode.decode(fs.readFileSync('puppy.torrent'))
const gta = bencode.decode(fs.readFileSync('gtaiv.torrent'))
// readFileSync is the easiest way to read the content of a file
// return a buffer, not a string.

// console.log(fs.readFileSync("puppy.torrent"))
// console.log(gta);
// console.log(gta.announce.toString('utf8'))
// console.log(torrent.encoding.toString('utf8')) // decode "encoding" field in the torrent file

// the announce url is the location of the torrents tracker
// console.log(torrent.announce.toString('utf8')) // decode "announce" field in the torrent file. "udp://tracker.coppersurfer.tk:6969/announce"
// console.log(torrent)


// 2 
const url = urlParse(torrent.announce.toString('utf8'))
console.log(url);

// 3
const socket = dgram.createSocket('udp4')
// 4
const myMsg = Buffer.from('hello?')
// 5
socket.send(myMsg, 0, myMsg.length, url.port, url.host, (error) => {
    if (error) {
        console.log(error)
    } else {
        console.log("Message sent")
    }
})
// 6
socket.on('message', msg => {
    console.log('message is', msg)
})
