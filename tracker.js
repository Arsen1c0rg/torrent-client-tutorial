const dgram = require('dgram')
const Buffer = require('buffer').Buffer
const urlParse = require('url').parse
const crypto = require('crypto')
const util = require('./util')
const torrentParser = require('./torrent-parser')

module.exports.getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4')
    const url = torrent.announce.toString('utf8')

    // 1. send connect request
    udpSend(socket, buildConnReq(), url)

    socket.on('message', response => {
        if (respType(response) === 'connect') {
            // 2. receive and parse connect response
            const connResp = parseConnResp(response);
            // 3. send announce request
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
            udpSend(socket, announceReq, url);
        } else if (respType(response) === 'announce') {
            // 4. parse announce response
            const announceResp = parseAnnounceResp(response);
            // 5. pass peers to callback
            callback(announceResp.peers);
        }
    });
}

function udpSend(socket, message, rawUrl, callback = () => { }) {
    const url = urlParse(rawUrl)
    socket.send(message, 0, message.length, url.port, url.hostname, callback)
}

function respType(resp) {
    const action = resp.readUInt32BE(0)
    if (action === 0) return 'connect'
    if (action === 1) return 'announce'
}

/**
 * 3.3.1 Connect messaging from the tutorial
 * 
 * A simple connect request structure:
 *
 * | Offset | Size            | Name           | Value                |
 * |--------|-----------------|----------------|----------------------|
 * | 0      | 64-bit integer  | connection_id  | 0x41727101980        |
 * | 8      | 32-bit integer  | action         | 0                    |
 * | 12     | 32-bit integer  | transaction_id | ? (random)           |
 * | 16     |                 |                |                      |
 *
 * The total message length is 16 bytes long, and should look something like this:
 * <Buffer 00 00 04 17 27 10 19 80 00 00 00 00 a6 ec 6b 7d>
 *
 * @returns {Buffer} buf
 */
function buildConnReq() {
    const buf = Buffer.alloc(16) // 1

    // connection id (node doesnt support to write 64-bit integer, so we split it into 2 32-bits write)
    buf.writeUInt32BE(0x417, 0) // 2 -> at index 0
    buf.writeUInt32BE(0x27101980, 4) // at index 4
    // action
    buf.writeUInt32BE(0, 8) // 3
    // transaction id
    crypto.randomBytes(4).copy(buf, 12) // 5 -> create 4 bytes of randomBytes and copy them at index 12 of buf

    return buf
}

/**
 * 
 * @param {Buffer} resp 
 * @returns 
 */
function parseConnResp(resp) {
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    }
}

function buildAnnounceReq(connId, torrent, port = 6881) {
    const buf = Buffer.alloc(98)

    // connection id
    connId.copy(buf, 0)
    // action
    buf.writeUInt32BE(1, 8)
    // transaction id
    crypto.randomBytes(4).copy(buf, 12)
    // info hash
    torrentParser.infoHash(torrent).copy(buf, 16)
    // peerId
    util.genId().copy(buf, 36)
    // downloaded
    Buffer.alloc(8).copy(buf, 56)
    // left
    torrentParser.size(torrent).copy(buf, 64)
    // uploaded
    Buffer.alloc(8).copy(buf, 72)
    // event
    buf.writeUInt32BE(0, 80)
    // ip address
    buf.writeUInt32BE(0, 80)
    // key
    crypto.randomBytes(4).copy(buf, 88)
    // num want
    buf.writeInt32BE(-1, 91)
    // port
    buf.writeUInt32BE(port, 96)

    return buf
}

function parseAnnounceResp(resp) {
    // break up the addresses part of the response
    function group(iterable, groupSize) {
        let groups = []
        for (let i = 0; i < iterable.length; i += groupSize) {
            groups.push(iterable.slice(i, i + groupSize))
        }

        return groups
    }

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt32BE(4)
            }
        })
    }
}
