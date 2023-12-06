// tutorial link: https://allenkim67.github.io/programming/2016/05/17/nodejs-buffer-tutorial.html

const Buffer = require('buffer').Buffer

const buf = Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64])

// encoding
console.log(buf.toString('utf-16le')); // 敨汬⁯潷
console.log(buf.toString('utf8')); // hello world

// encoding works both ways, converting buffer to string and string to buffer again
console.log(Buffer.from("hello world", "utf-8")); // <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>

const newBuf = Buffer.alloc(4)
newBuf.writeUInt32BE(123, 0) // unsigned integer 32bit Big Endian
// newBuf.writeUInt32LE(123, 0) // unsigned integer 32bit Little Endian
console.log(newBuf); // <Buffer 00 00 00 7b>
console.log(newBuf.readUInt32BE());

// The copy method
// - useful when you already have a buffer and you want to write its content into another buffer.
const buff1 = Buffer.alloc(11) // empty buffer with length of 11 bytes.

// create two buffers, one that contains 'hello', the other 'world'
const word1 = Buffer.from('hello') // default encoding is utf8
const word2 = Buffer.from('world')

// copy the word buffers into 'buff1' at index 0 and 6 respectively
word1.copy(buff1, 0)
word2.copy(buff1, 6)

console.log(buff1.toString('utf8')) // hello world
console.log(buff1); // <Buffer 68 65 6c 6c 6f 00 77 6f 72 6c 64>