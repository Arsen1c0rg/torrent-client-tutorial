const fs = require('fs')
const bencode = require('bencode') // use bencode version 2.0.0
const bignum = require('bignum')

module.exports.open = (filepath) => {
    return bencode.decode(fs.readFileSync(filepath))
}

module.exports.size = torrent => {
    const size = torrent.info.files ?
        torrent.info.files.map(file => file.length).reduece((a, b) => a + b) :
        torrent.info.length

    return bignum.toBuffer(size, { size: 8 })
}

/**
 * If we take the info property from the torrent file and pass it through a SHA1
 * hashing function, you would get the info hash!
 * 
 * SHA1 is one of many hashing functions but it's the one used by bittorrent
 * Its a compact way to uniquely identify the torrent. 
 * 
 * A hashing function returns a fixed length bufdfer(in this case 20-bytes long)
 * @param {*} torrent 
 */
module.exports.infoHash = torrent => {
    const info = bencode.encode(torrent.info)
    return crypto.createHash('sha1').update(info).digest()
}