/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/base64-js/index.js":
/*!*****************************************!*\
  !*** ./node_modules/base64-js/index.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),

/***/ "./node_modules/brotli/dec/bit_reader.js":
/*!***********************************************!*\
  !*** ./node_modules/brotli/dec/bit_reader.js ***!
  \***********************************************/
/***/ ((module) => {

/* Copyright 2013 Google Inc. All Rights Reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   Bit reading helpers
*/

var BROTLI_READ_SIZE = 4096;
var BROTLI_IBUF_SIZE =  (2 * BROTLI_READ_SIZE + 32);
var BROTLI_IBUF_MASK =  (2 * BROTLI_READ_SIZE - 1);

var kBitMask = new Uint32Array([
  0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767,
  65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215
]);

/* Input byte buffer, consist of a ringbuffer and a "slack" region where */
/* bytes from the start of the ringbuffer are copied. */
function BrotliBitReader(input) {
  this.buf_ = new Uint8Array(BROTLI_IBUF_SIZE);
  this.input_ = input;    /* input callback */
  
  this.reset();
}

BrotliBitReader.READ_SIZE = BROTLI_READ_SIZE;
BrotliBitReader.IBUF_MASK = BROTLI_IBUF_MASK;

BrotliBitReader.prototype.reset = function() {
  this.buf_ptr_ = 0;      /* next input will write here */
  this.val_ = 0;          /* pre-fetched bits */
  this.pos_ = 0;          /* byte position in stream */
  this.bit_pos_ = 0;      /* current bit-reading position in val_ */
  this.bit_end_pos_ = 0;  /* bit-reading end position from LSB of val_ */
  this.eos_ = 0;          /* input stream is finished */
  
  this.readMoreInput();
  for (var i = 0; i < 4; i++) {
    this.val_ |= this.buf_[this.pos_] << (8 * i);
    ++this.pos_;
  }
  
  return this.bit_end_pos_ > 0;
};

/* Fills up the input ringbuffer by calling the input callback.

   Does nothing if there are at least 32 bytes present after current position.

   Returns 0 if either:
    - the input callback returned an error, or
    - there is no more input and the position is past the end of the stream.

   After encountering the end of the input stream, 32 additional zero bytes are
   copied to the ringbuffer, therefore it is safe to call this function after
   every 32 bytes of input is read.
*/
BrotliBitReader.prototype.readMoreInput = function() {
  if (this.bit_end_pos_ > 256) {
    return;
  } else if (this.eos_) {
    if (this.bit_pos_ > this.bit_end_pos_)
      throw new Error('Unexpected end of input ' + this.bit_pos_ + ' ' + this.bit_end_pos_);
  } else {
    var dst = this.buf_ptr_;
    var bytes_read = this.input_.read(this.buf_, dst, BROTLI_READ_SIZE);
    if (bytes_read < 0) {
      throw new Error('Unexpected end of input');
    }
    
    if (bytes_read < BROTLI_READ_SIZE) {
      this.eos_ = 1;
      /* Store 32 bytes of zero after the stream end. */
      for (var p = 0; p < 32; p++)
        this.buf_[dst + bytes_read + p] = 0;
    }
    
    if (dst === 0) {
      /* Copy the head of the ringbuffer to the slack region. */
      for (var p = 0; p < 32; p++)
        this.buf_[(BROTLI_READ_SIZE << 1) + p] = this.buf_[p];

      this.buf_ptr_ = BROTLI_READ_SIZE;
    } else {
      this.buf_ptr_ = 0;
    }
    
    this.bit_end_pos_ += bytes_read << 3;
  }
};

/* Guarantees that there are at least 24 bits in the buffer. */
BrotliBitReader.prototype.fillBitWindow = function() {    
  while (this.bit_pos_ >= 8) {
    this.val_ >>>= 8;
    this.val_ |= this.buf_[this.pos_ & BROTLI_IBUF_MASK] << 24;
    ++this.pos_;
    this.bit_pos_ = this.bit_pos_ - 8 >>> 0;
    this.bit_end_pos_ = this.bit_end_pos_ - 8 >>> 0;
  }
};

/* Reads the specified number of bits from Read Buffer. */
BrotliBitReader.prototype.readBits = function(n_bits) {
  if (32 - this.bit_pos_ < n_bits) {
    this.fillBitWindow();
  }
  
  var val = ((this.val_ >>> this.bit_pos_) & kBitMask[n_bits]);
  this.bit_pos_ += n_bits;
  return val;
};

module.exports = BrotliBitReader;


/***/ }),

/***/ "./node_modules/brotli/dec/context.js":
/*!********************************************!*\
  !*** ./node_modules/brotli/dec/context.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

/* Copyright 2013 Google Inc. All Rights Reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   Lookup table to map the previous two bytes to a context id.

   There are four different context modeling modes defined here:
     CONTEXT_LSB6: context id is the least significant 6 bits of the last byte,
     CONTEXT_MSB6: context id is the most significant 6 bits of the last byte,
     CONTEXT_UTF8: second-order context model tuned for UTF8-encoded text,
     CONTEXT_SIGNED: second-order context model tuned for signed integers.

   The context id for the UTF8 context model is calculated as follows. If p1
   and p2 are the previous two bytes, we calcualte the context as

     context = kContextLookup[p1] | kContextLookup[p2 + 256].

   If the previous two bytes are ASCII characters (i.e. < 128), this will be
   equivalent to

     context = 4 * context1(p1) + context2(p2),

   where context1 is based on the previous byte in the following way:

     0  : non-ASCII control
     1  : \t, \n, \r
     2  : space
     3  : other punctuation
     4  : " '
     5  : %
     6  : ( < [ {
     7  : ) > ] }
     8  : , ; :
     9  : .
     10 : =
     11 : number
     12 : upper-case vowel
     13 : upper-case consonant
     14 : lower-case vowel
     15 : lower-case consonant

   and context2 is based on the second last byte:

     0 : control, space
     1 : punctuation
     2 : upper-case letter, number
     3 : lower-case letter

   If the last byte is ASCII, and the second last byte is not (in a valid UTF8
   stream it will be a continuation byte, value between 128 and 191), the
   context is the same as if the second last byte was an ASCII control or space.

   If the last byte is a UTF8 lead byte (value >= 192), then the next byte will
   be a continuation byte and the context id is 2 or 3 depending on the LSB of
   the last byte and to a lesser extent on the second last byte if it is ASCII.

   If the last byte is a UTF8 continuation byte, the second last byte can be:
     - continuation byte: the next byte is probably ASCII or lead byte (assuming
       4-byte UTF8 characters are rare) and the context id is 0 or 1.
     - lead byte (192 - 207): next byte is ASCII or lead byte, context is 0 or 1
     - lead byte (208 - 255): next byte is continuation byte, context is 2 or 3

   The possible value combinations of the previous two bytes, the range of
   context ids and the type of the next byte is summarized in the table below:

   |--------\-----------------------------------------------------------------|
   |         \                         Last byte                              |
   | Second   \---------------------------------------------------------------|
   | last byte \    ASCII            |   cont. byte        |   lead byte      |
   |            \   (0-127)          |   (128-191)         |   (192-)         |
   |=============|===================|=====================|==================|
   |  ASCII      | next: ASCII/lead  |  not valid          |  next: cont.     |
   |  (0-127)    | context: 4 - 63   |                     |  context: 2 - 3  |
   |-------------|-------------------|---------------------|------------------|
   |  cont. byte | next: ASCII/lead  |  next: ASCII/lead   |  next: cont.     |
   |  (128-191)  | context: 4 - 63   |  context: 0 - 1     |  context: 2 - 3  |
   |-------------|-------------------|---------------------|------------------|
   |  lead byte  | not valid         |  next: ASCII/lead   |  not valid       |
   |  (192-207)  |                   |  context: 0 - 1     |                  |
   |-------------|-------------------|---------------------|------------------|
   |  lead byte  | not valid         |  next: cont.        |  not valid       |
   |  (208-)     |                   |  context: 2 - 3     |                  |
   |-------------|-------------------|---------------------|------------------|

   The context id for the signed context mode is calculated as:

     context = (kContextLookup[512 + p1] << 3) | kContextLookup[512 + p2].

   For any context modeling modes, the context ids can be calculated by |-ing
   together two lookups from one table using context model dependent offsets:

     context = kContextLookup[offset1 + p1] | kContextLookup[offset2 + p2].

   where offset1 and offset2 are dependent on the context mode.
*/

var CONTEXT_LSB6         = 0;
var CONTEXT_MSB6         = 1;
var CONTEXT_UTF8         = 2;
var CONTEXT_SIGNED       = 3;

/* Common context lookup table for all context modes. */
exports.lookup = new Uint8Array([
  /* CONTEXT_UTF8, last byte. */
  /* ASCII range. */
   0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  4,  0,  0,
   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
   8, 12, 16, 12, 12, 20, 12, 16, 24, 28, 12, 12, 32, 12, 36, 12,
  44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 32, 32, 24, 40, 28, 12,
  12, 48, 52, 52, 52, 48, 52, 52, 52, 48, 52, 52, 52, 52, 52, 48,
  52, 52, 52, 52, 52, 48, 52, 52, 52, 52, 52, 24, 12, 28, 12, 12,
  12, 56, 60, 60, 60, 56, 60, 60, 60, 56, 60, 60, 60, 60, 60, 56,
  60, 60, 60, 60, 60, 56, 60, 60, 60, 60, 60, 24, 12, 28, 12,  0,
  /* UTF8 continuation byte range. */
  0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  /* UTF8 lead byte range. */
  2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3,
  2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3,
  2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3,
  2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3,
  /* CONTEXT_UTF8 second last byte. */
  /* ASCII range. */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1,
  1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1,
  1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 0,
  /* UTF8 continuation byte range. */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  /* UTF8 lead byte range. */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  /* CONTEXT_SIGNED, second last byte. */
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7,
  /* CONTEXT_SIGNED, last byte, same as the above values shifted by 3 bits. */
   0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
  40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
  40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
  48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 56,
  /* CONTEXT_LSB6, last byte. */
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
  /* CONTEXT_MSB6, last byte. */
   0,  0,  0,  0,  1,  1,  1,  1,  2,  2,  2,  2,  3,  3,  3,  3,
   4,  4,  4,  4,  5,  5,  5,  5,  6,  6,  6,  6,  7,  7,  7,  7,
   8,  8,  8,  8,  9,  9,  9,  9, 10, 10, 10, 10, 11, 11, 11, 11,
  12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15,
  16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19,
  20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23,
  24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27,
  28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30, 31, 31, 31, 31,
  32, 32, 32, 32, 33, 33, 33, 33, 34, 34, 34, 34, 35, 35, 35, 35,
  36, 36, 36, 36, 37, 37, 37, 37, 38, 38, 38, 38, 39, 39, 39, 39,
  40, 40, 40, 40, 41, 41, 41, 41, 42, 42, 42, 42, 43, 43, 43, 43,
  44, 44, 44, 44, 45, 45, 45, 45, 46, 46, 46, 46, 47, 47, 47, 47,
  48, 48, 48, 48, 49, 49, 49, 49, 50, 50, 50, 50, 51, 51, 51, 51,
  52, 52, 52, 52, 53, 53, 53, 53, 54, 54, 54, 54, 55, 55, 55, 55,
  56, 56, 56, 56, 57, 57, 57, 57, 58, 58, 58, 58, 59, 59, 59, 59,
  60, 60, 60, 60, 61, 61, 61, 61, 62, 62, 62, 62, 63, 63, 63, 63,
  /* CONTEXT_{M,L}SB6, second last byte, */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

exports.lookupOffsets = new Uint16Array([
  /* CONTEXT_LSB6 */
  1024, 1536,
  /* CONTEXT_MSB6 */
  1280, 1536,
  /* CONTEXT_UTF8 */
  0, 256,
  /* CONTEXT_SIGNED */
  768, 512,
]);


/***/ }),

/***/ "./node_modules/brotli/dec/decode.js":
/*!*******************************************!*\
  !*** ./node_modules/brotli/dec/decode.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* Copyright 2013 Google Inc. All Rights Reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var BrotliInput = (__webpack_require__(/*! ./streams */ "./node_modules/brotli/dec/streams.js").BrotliInput);
var BrotliOutput = (__webpack_require__(/*! ./streams */ "./node_modules/brotli/dec/streams.js").BrotliOutput);
var BrotliBitReader = __webpack_require__(/*! ./bit_reader */ "./node_modules/brotli/dec/bit_reader.js");
var BrotliDictionary = __webpack_require__(/*! ./dictionary */ "./node_modules/brotli/dec/dictionary.js");
var HuffmanCode = (__webpack_require__(/*! ./huffman */ "./node_modules/brotli/dec/huffman.js").HuffmanCode);
var BrotliBuildHuffmanTable = (__webpack_require__(/*! ./huffman */ "./node_modules/brotli/dec/huffman.js").BrotliBuildHuffmanTable);
var Context = __webpack_require__(/*! ./context */ "./node_modules/brotli/dec/context.js");
var Prefix = __webpack_require__(/*! ./prefix */ "./node_modules/brotli/dec/prefix.js");
var Transform = __webpack_require__(/*! ./transform */ "./node_modules/brotli/dec/transform.js");

var kDefaultCodeLength = 8;
var kCodeLengthRepeatCode = 16;
var kNumLiteralCodes = 256;
var kNumInsertAndCopyCodes = 704;
var kNumBlockLengthCodes = 26;
var kLiteralContextBits = 6;
var kDistanceContextBits = 2;

var HUFFMAN_TABLE_BITS = 8;
var HUFFMAN_TABLE_MASK = 0xff;
/* Maximum possible Huffman table size for an alphabet size of 704, max code
 * length 15 and root table bits 8. */
var HUFFMAN_MAX_TABLE_SIZE = 1080;

var CODE_LENGTH_CODES = 18;
var kCodeLengthCodeOrder = new Uint8Array([
  1, 2, 3, 4, 0, 5, 17, 6, 16, 7, 8, 9, 10, 11, 12, 13, 14, 15,
]);

var NUM_DISTANCE_SHORT_CODES = 16;
var kDistanceShortCodeIndexOffset = new Uint8Array([
  3, 2, 1, 0, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2
]);

var kDistanceShortCodeValueOffset = new Int8Array([
  0, 0, 0, 0, -1, 1, -2, 2, -3, 3, -1, 1, -2, 2, -3, 3
]);

var kMaxHuffmanTableSize = new Uint16Array([
  256, 402, 436, 468, 500, 534, 566, 598, 630, 662, 694, 726, 758, 790, 822,
  854, 886, 920, 952, 984, 1016, 1048, 1080
]);

function DecodeWindowBits(br) {
  var n;
  if (br.readBits(1) === 0) {
    return 16;
  }
  
  n = br.readBits(3);
  if (n > 0) {
    return 17 + n;
  }
  
  n = br.readBits(3);
  if (n > 0) {
    return 8 + n;
  }
  
  return 17;
}

/* Decodes a number in the range [0..255], by reading 1 - 11 bits. */
function DecodeVarLenUint8(br) {
  if (br.readBits(1)) {
    var nbits = br.readBits(3);
    if (nbits === 0) {
      return 1;
    } else {
      return br.readBits(nbits) + (1 << nbits);
    }
  }
  return 0;
}

function MetaBlockLength() {
  this.meta_block_length = 0;
  this.input_end = 0;
  this.is_uncompressed = 0;
  this.is_metadata = false;
}

function DecodeMetaBlockLength(br) {
  var out = new MetaBlockLength;  
  var size_nibbles;
  var size_bytes;
  var i;
  
  out.input_end = br.readBits(1);
  if (out.input_end && br.readBits(1)) {
    return out;
  }
  
  size_nibbles = br.readBits(2) + 4;
  if (size_nibbles === 7) {
    out.is_metadata = true;
    
    if (br.readBits(1) !== 0)
      throw new Error('Invalid reserved bit');
    
    size_bytes = br.readBits(2);
    if (size_bytes === 0)
      return out;
    
    for (i = 0; i < size_bytes; i++) {
      var next_byte = br.readBits(8);
      if (i + 1 === size_bytes && size_bytes > 1 && next_byte === 0)
        throw new Error('Invalid size byte');
      
      out.meta_block_length |= next_byte << (i * 8);
    }
  } else {
    for (i = 0; i < size_nibbles; ++i) {
      var next_nibble = br.readBits(4);
      if (i + 1 === size_nibbles && size_nibbles > 4 && next_nibble === 0)
        throw new Error('Invalid size nibble');
      
      out.meta_block_length |= next_nibble << (i * 4);
    }
  }
  
  ++out.meta_block_length;
  
  if (!out.input_end && !out.is_metadata) {
    out.is_uncompressed = br.readBits(1);
  }
  
  return out;
}

/* Decodes the next Huffman code from bit-stream. */
function ReadSymbol(table, index, br) {
  var start_index = index;
  
  var nbits;
  br.fillBitWindow();
  index += (br.val_ >>> br.bit_pos_) & HUFFMAN_TABLE_MASK;
  nbits = table[index].bits - HUFFMAN_TABLE_BITS;
  if (nbits > 0) {
    br.bit_pos_ += HUFFMAN_TABLE_BITS;
    index += table[index].value;
    index += (br.val_ >>> br.bit_pos_) & ((1 << nbits) - 1);
  }
  br.bit_pos_ += table[index].bits;
  return table[index].value;
}

function ReadHuffmanCodeLengths(code_length_code_lengths, num_symbols, code_lengths, br) {
  var symbol = 0;
  var prev_code_len = kDefaultCodeLength;
  var repeat = 0;
  var repeat_code_len = 0;
  var space = 32768;
  
  var table = [];
  for (var i = 0; i < 32; i++)
    table.push(new HuffmanCode(0, 0));
  
  BrotliBuildHuffmanTable(table, 0, 5, code_length_code_lengths, CODE_LENGTH_CODES);

  while (symbol < num_symbols && space > 0) {
    var p = 0;
    var code_len;
    
    br.readMoreInput();
    br.fillBitWindow();
    p += (br.val_ >>> br.bit_pos_) & 31;
    br.bit_pos_ += table[p].bits;
    code_len = table[p].value & 0xff;
    if (code_len < kCodeLengthRepeatCode) {
      repeat = 0;
      code_lengths[symbol++] = code_len;
      if (code_len !== 0) {
        prev_code_len = code_len;
        space -= 32768 >> code_len;
      }
    } else {
      var extra_bits = code_len - 14;
      var old_repeat;
      var repeat_delta;
      var new_len = 0;
      if (code_len === kCodeLengthRepeatCode) {
        new_len = prev_code_len;
      }
      if (repeat_code_len !== new_len) {
        repeat = 0;
        repeat_code_len = new_len;
      }
      old_repeat = repeat;
      if (repeat > 0) {
        repeat -= 2;
        repeat <<= extra_bits;
      }
      repeat += br.readBits(extra_bits) + 3;
      repeat_delta = repeat - old_repeat;
      if (symbol + repeat_delta > num_symbols) {
        throw new Error('[ReadHuffmanCodeLengths] symbol + repeat_delta > num_symbols');
      }
      
      for (var x = 0; x < repeat_delta; x++)
        code_lengths[symbol + x] = repeat_code_len;
      
      symbol += repeat_delta;
      
      if (repeat_code_len !== 0) {
        space -= repeat_delta << (15 - repeat_code_len);
      }
    }
  }
  if (space !== 0) {
    throw new Error("[ReadHuffmanCodeLengths] space = " + space);
  }
  
  for (; symbol < num_symbols; symbol++)
    code_lengths[symbol] = 0;
}

function ReadHuffmanCode(alphabet_size, tables, table, br) {
  var table_size = 0;
  var simple_code_or_skip;
  var code_lengths = new Uint8Array(alphabet_size);
  
  br.readMoreInput();
  
  /* simple_code_or_skip is used as follows:
     1 for simple code;
     0 for no skipping, 2 skips 2 code lengths, 3 skips 3 code lengths */
  simple_code_or_skip = br.readBits(2);
  if (simple_code_or_skip === 1) {
    /* Read symbols, codes & code lengths directly. */
    var i;
    var max_bits_counter = alphabet_size - 1;
    var max_bits = 0;
    var symbols = new Int32Array(4);
    var num_symbols = br.readBits(2) + 1;
    while (max_bits_counter) {
      max_bits_counter >>= 1;
      ++max_bits;
    }

    for (i = 0; i < num_symbols; ++i) {
      symbols[i] = br.readBits(max_bits) % alphabet_size;
      code_lengths[symbols[i]] = 2;
    }
    code_lengths[symbols[0]] = 1;
    switch (num_symbols) {
      case 1:
        break;
      case 3:
        if ((symbols[0] === symbols[1]) ||
            (symbols[0] === symbols[2]) ||
            (symbols[1] === symbols[2])) {
          throw new Error('[ReadHuffmanCode] invalid symbols');
        }
        break;
      case 2:
        if (symbols[0] === symbols[1]) {
          throw new Error('[ReadHuffmanCode] invalid symbols');
        }
        
        code_lengths[symbols[1]] = 1;
        break;
      case 4:
        if ((symbols[0] === symbols[1]) ||
            (symbols[0] === symbols[2]) ||
            (symbols[0] === symbols[3]) ||
            (symbols[1] === symbols[2]) ||
            (symbols[1] === symbols[3]) ||
            (symbols[2] === symbols[3])) {
          throw new Error('[ReadHuffmanCode] invalid symbols');
        }
        
        if (br.readBits(1)) {
          code_lengths[symbols[2]] = 3;
          code_lengths[symbols[3]] = 3;
        } else {
          code_lengths[symbols[0]] = 2;
        }
        break;
    }
  } else {  /* Decode Huffman-coded code lengths. */
    var i;
    var code_length_code_lengths = new Uint8Array(CODE_LENGTH_CODES);
    var space = 32;
    var num_codes = 0;
    /* Static Huffman code for the code length code lengths */
    var huff = [
      new HuffmanCode(2, 0), new HuffmanCode(2, 4), new HuffmanCode(2, 3), new HuffmanCode(3, 2), 
      new HuffmanCode(2, 0), new HuffmanCode(2, 4), new HuffmanCode(2, 3), new HuffmanCode(4, 1),
      new HuffmanCode(2, 0), new HuffmanCode(2, 4), new HuffmanCode(2, 3), new HuffmanCode(3, 2), 
      new HuffmanCode(2, 0), new HuffmanCode(2, 4), new HuffmanCode(2, 3), new HuffmanCode(4, 5)
    ];
    for (i = simple_code_or_skip; i < CODE_LENGTH_CODES && space > 0; ++i) {
      var code_len_idx = kCodeLengthCodeOrder[i];
      var p = 0;
      var v;
      br.fillBitWindow();
      p += (br.val_ >>> br.bit_pos_) & 15;
      br.bit_pos_ += huff[p].bits;
      v = huff[p].value;
      code_length_code_lengths[code_len_idx] = v;
      if (v !== 0) {
        space -= (32 >> v);
        ++num_codes;
      }
    }
    
    if (!(num_codes === 1 || space === 0))
      throw new Error('[ReadHuffmanCode] invalid num_codes or space');
    
    ReadHuffmanCodeLengths(code_length_code_lengths, alphabet_size, code_lengths, br);
  }
  
  table_size = BrotliBuildHuffmanTable(tables, table, HUFFMAN_TABLE_BITS, code_lengths, alphabet_size);
  
  if (table_size === 0) {
    throw new Error("[ReadHuffmanCode] BuildHuffmanTable failed: ");
  }
  
  return table_size;
}

function ReadBlockLength(table, index, br) {
  var code;
  var nbits;
  code = ReadSymbol(table, index, br);
  nbits = Prefix.kBlockLengthPrefixCode[code].nbits;
  return Prefix.kBlockLengthPrefixCode[code].offset + br.readBits(nbits);
}

function TranslateShortCodes(code, ringbuffer, index) {
  var val;
  if (code < NUM_DISTANCE_SHORT_CODES) {
    index += kDistanceShortCodeIndexOffset[code];
    index &= 3;
    val = ringbuffer[index] + kDistanceShortCodeValueOffset[code];
  } else {
    val = code - NUM_DISTANCE_SHORT_CODES + 1;
  }
  return val;
}

function MoveToFront(v, index) {
  var value = v[index];
  var i = index;
  for (; i; --i) v[i] = v[i - 1];
  v[0] = value;
}

function InverseMoveToFrontTransform(v, v_len) {
  var mtf = new Uint8Array(256);
  var i;
  for (i = 0; i < 256; ++i) {
    mtf[i] = i;
  }
  for (i = 0; i < v_len; ++i) {
    var index = v[i];
    v[i] = mtf[index];
    if (index) MoveToFront(mtf, index);
  }
}

/* Contains a collection of huffman trees with the same alphabet size. */
function HuffmanTreeGroup(alphabet_size, num_htrees) {
  this.alphabet_size = alphabet_size;
  this.num_htrees = num_htrees;
  this.codes = new Array(num_htrees + num_htrees * kMaxHuffmanTableSize[(alphabet_size + 31) >>> 5]);  
  this.htrees = new Uint32Array(num_htrees);
}

HuffmanTreeGroup.prototype.decode = function(br) {
  var i;
  var table_size;
  var next = 0;
  for (i = 0; i < this.num_htrees; ++i) {
    this.htrees[i] = next;
    table_size = ReadHuffmanCode(this.alphabet_size, this.codes, next, br);
    next += table_size;
  }
};

function DecodeContextMap(context_map_size, br) {
  var out = { num_htrees: null, context_map: null };
  var use_rle_for_zeros;
  var max_run_length_prefix = 0;
  var table;
  var i;
  
  br.readMoreInput();
  var num_htrees = out.num_htrees = DecodeVarLenUint8(br) + 1;

  var context_map = out.context_map = new Uint8Array(context_map_size);
  if (num_htrees <= 1) {
    return out;
  }

  use_rle_for_zeros = br.readBits(1);
  if (use_rle_for_zeros) {
    max_run_length_prefix = br.readBits(4) + 1;
  }
  
  table = [];
  for (i = 0; i < HUFFMAN_MAX_TABLE_SIZE; i++) {
    table[i] = new HuffmanCode(0, 0);
  }
  
  ReadHuffmanCode(num_htrees + max_run_length_prefix, table, 0, br);
  
  for (i = 0; i < context_map_size;) {
    var code;

    br.readMoreInput();
    code = ReadSymbol(table, 0, br);
    if (code === 0) {
      context_map[i] = 0;
      ++i;
    } else if (code <= max_run_length_prefix) {
      var reps = 1 + (1 << code) + br.readBits(code);
      while (--reps) {
        if (i >= context_map_size) {
          throw new Error("[DecodeContextMap] i >= context_map_size");
        }
        context_map[i] = 0;
        ++i;
      }
    } else {
      context_map[i] = code - max_run_length_prefix;
      ++i;
    }
  }
  if (br.readBits(1)) {
    InverseMoveToFrontTransform(context_map, context_map_size);
  }
  
  return out;
}

function DecodeBlockType(max_block_type, trees, tree_type, block_types, ringbuffers, indexes, br) {
  var ringbuffer = tree_type * 2;
  var index = tree_type;
  var type_code = ReadSymbol(trees, tree_type * HUFFMAN_MAX_TABLE_SIZE, br);
  var block_type;
  if (type_code === 0) {
    block_type = ringbuffers[ringbuffer + (indexes[index] & 1)];
  } else if (type_code === 1) {
    block_type = ringbuffers[ringbuffer + ((indexes[index] - 1) & 1)] + 1;
  } else {
    block_type = type_code - 2;
  }
  if (block_type >= max_block_type) {
    block_type -= max_block_type;
  }
  block_types[tree_type] = block_type;
  ringbuffers[ringbuffer + (indexes[index] & 1)] = block_type;
  ++indexes[index];
}

function CopyUncompressedBlockToOutput(output, len, pos, ringbuffer, ringbuffer_mask, br) {
  var rb_size = ringbuffer_mask + 1;
  var rb_pos = pos & ringbuffer_mask;
  var br_pos = br.pos_ & BrotliBitReader.IBUF_MASK;
  var nbytes;

  /* For short lengths copy byte-by-byte */
  if (len < 8 || br.bit_pos_ + (len << 3) < br.bit_end_pos_) {
    while (len-- > 0) {
      br.readMoreInput();
      ringbuffer[rb_pos++] = br.readBits(8);
      if (rb_pos === rb_size) {
        output.write(ringbuffer, rb_size);
        rb_pos = 0;
      }
    }
    return;
  }

  if (br.bit_end_pos_ < 32) {
    throw new Error('[CopyUncompressedBlockToOutput] br.bit_end_pos_ < 32');
  }

  /* Copy remaining 0-4 bytes from br.val_ to ringbuffer. */
  while (br.bit_pos_ < 32) {
    ringbuffer[rb_pos] = (br.val_ >>> br.bit_pos_);
    br.bit_pos_ += 8;
    ++rb_pos;
    --len;
  }

  /* Copy remaining bytes from br.buf_ to ringbuffer. */
  nbytes = (br.bit_end_pos_ - br.bit_pos_) >> 3;
  if (br_pos + nbytes > BrotliBitReader.IBUF_MASK) {
    var tail = BrotliBitReader.IBUF_MASK + 1 - br_pos;
    for (var x = 0; x < tail; x++)
      ringbuffer[rb_pos + x] = br.buf_[br_pos + x];
    
    nbytes -= tail;
    rb_pos += tail;
    len -= tail;
    br_pos = 0;
  }

  for (var x = 0; x < nbytes; x++)
    ringbuffer[rb_pos + x] = br.buf_[br_pos + x];
  
  rb_pos += nbytes;
  len -= nbytes;

  /* If we wrote past the logical end of the ringbuffer, copy the tail of the
     ringbuffer to its beginning and flush the ringbuffer to the output. */
  if (rb_pos >= rb_size) {
    output.write(ringbuffer, rb_size);
    rb_pos -= rb_size;    
    for (var x = 0; x < rb_pos; x++)
      ringbuffer[x] = ringbuffer[rb_size + x];
  }

  /* If we have more to copy than the remaining size of the ringbuffer, then we
     first fill the ringbuffer from the input and then flush the ringbuffer to
     the output */
  while (rb_pos + len >= rb_size) {
    nbytes = rb_size - rb_pos;
    if (br.input_.read(ringbuffer, rb_pos, nbytes) < nbytes) {
      throw new Error('[CopyUncompressedBlockToOutput] not enough bytes');
    }
    output.write(ringbuffer, rb_size);
    len -= nbytes;
    rb_pos = 0;
  }

  /* Copy straight from the input onto the ringbuffer. The ringbuffer will be
     flushed to the output at a later time. */
  if (br.input_.read(ringbuffer, rb_pos, len) < len) {
    throw new Error('[CopyUncompressedBlockToOutput] not enough bytes');
  }

  /* Restore the state of the bit reader. */
  br.reset();
}

/* Advances the bit reader position to the next byte boundary and verifies
   that any skipped bits are set to zero. */
function JumpToByteBoundary(br) {
  var new_bit_pos = (br.bit_pos_ + 7) & ~7;
  var pad_bits = br.readBits(new_bit_pos - br.bit_pos_);
  return pad_bits == 0;
}

function BrotliDecompressedSize(buffer) {
  var input = new BrotliInput(buffer);
  var br = new BrotliBitReader(input);
  DecodeWindowBits(br);
  var out = DecodeMetaBlockLength(br);
  return out.meta_block_length;
}

exports.BrotliDecompressedSize = BrotliDecompressedSize;

function BrotliDecompressBuffer(buffer, output_size) {
  var input = new BrotliInput(buffer);
  
  if (output_size == null) {
    output_size = BrotliDecompressedSize(buffer);
  }
  
  var output_buffer = new Uint8Array(output_size);
  var output = new BrotliOutput(output_buffer);
  
  BrotliDecompress(input, output);
  
  if (output.pos < output.buffer.length) {
    output.buffer = output.buffer.subarray(0, output.pos);
  }
  
  return output.buffer;
}

exports.BrotliDecompressBuffer = BrotliDecompressBuffer;

function BrotliDecompress(input, output) {
  var i;
  var pos = 0;
  var input_end = 0;
  var window_bits = 0;
  var max_backward_distance;
  var max_distance = 0;
  var ringbuffer_size;
  var ringbuffer_mask;
  var ringbuffer;
  var ringbuffer_end;
  /* This ring buffer holds a few past copy distances that will be used by */
  /* some special distance codes. */
  var dist_rb = [ 16, 15, 11, 4 ];
  var dist_rb_idx = 0;
  /* The previous 2 bytes used for context. */
  var prev_byte1 = 0;
  var prev_byte2 = 0;
  var hgroup = [new HuffmanTreeGroup(0, 0), new HuffmanTreeGroup(0, 0), new HuffmanTreeGroup(0, 0)];
  var block_type_trees;
  var block_len_trees;
  var br;

  /* We need the slack region for the following reasons:
       - always doing two 8-byte copies for fast backward copying
       - transforms
       - flushing the input ringbuffer when decoding uncompressed blocks */
  var kRingBufferWriteAheadSlack = 128 + BrotliBitReader.READ_SIZE;

  br = new BrotliBitReader(input);

  /* Decode window size. */
  window_bits = DecodeWindowBits(br);
  max_backward_distance = (1 << window_bits) - 16;

  ringbuffer_size = 1 << window_bits;
  ringbuffer_mask = ringbuffer_size - 1;
  ringbuffer = new Uint8Array(ringbuffer_size + kRingBufferWriteAheadSlack + BrotliDictionary.maxDictionaryWordLength);
  ringbuffer_end = ringbuffer_size;

  block_type_trees = [];
  block_len_trees = [];
  for (var x = 0; x < 3 * HUFFMAN_MAX_TABLE_SIZE; x++) {
    block_type_trees[x] = new HuffmanCode(0, 0);
    block_len_trees[x] = new HuffmanCode(0, 0);
  }

  while (!input_end) {
    var meta_block_remaining_len = 0;
    var is_uncompressed;
    var block_length = [ 1 << 28, 1 << 28, 1 << 28 ];
    var block_type = [ 0 ];
    var num_block_types = [ 1, 1, 1 ];
    var block_type_rb = [ 0, 1, 0, 1, 0, 1 ];
    var block_type_rb_index = [ 0 ];
    var distance_postfix_bits;
    var num_direct_distance_codes;
    var distance_postfix_mask;
    var num_distance_codes;
    var context_map = null;
    var context_modes = null;
    var num_literal_htrees;
    var dist_context_map = null;
    var num_dist_htrees;
    var context_offset = 0;
    var context_map_slice = null;
    var literal_htree_index = 0;
    var dist_context_offset = 0;
    var dist_context_map_slice = null;
    var dist_htree_index = 0;
    var context_lookup_offset1 = 0;
    var context_lookup_offset2 = 0;
    var context_mode;
    var htree_command;

    for (i = 0; i < 3; ++i) {
      hgroup[i].codes = null;
      hgroup[i].htrees = null;
    }

    br.readMoreInput();
    
    var _out = DecodeMetaBlockLength(br);
    meta_block_remaining_len = _out.meta_block_length;
    if (pos + meta_block_remaining_len > output.buffer.length) {
      /* We need to grow the output buffer to fit the additional data. */
      var tmp = new Uint8Array( pos + meta_block_remaining_len );
      tmp.set( output.buffer );
      output.buffer = tmp;
    }    
    input_end = _out.input_end;
    is_uncompressed = _out.is_uncompressed;
    
    if (_out.is_metadata) {
      JumpToByteBoundary(br);
      
      for (; meta_block_remaining_len > 0; --meta_block_remaining_len) {
        br.readMoreInput();
        /* Read one byte and ignore it. */
        br.readBits(8);
      }
      
      continue;
    }
    
    if (meta_block_remaining_len === 0) {
      continue;
    }
    
    if (is_uncompressed) {
      br.bit_pos_ = (br.bit_pos_ + 7) & ~7;
      CopyUncompressedBlockToOutput(output, meta_block_remaining_len, pos,
                                    ringbuffer, ringbuffer_mask, br);
      pos += meta_block_remaining_len;
      continue;
    }
    
    for (i = 0; i < 3; ++i) {
      num_block_types[i] = DecodeVarLenUint8(br) + 1;
      if (num_block_types[i] >= 2) {
        ReadHuffmanCode(num_block_types[i] + 2, block_type_trees, i * HUFFMAN_MAX_TABLE_SIZE, br);
        ReadHuffmanCode(kNumBlockLengthCodes, block_len_trees, i * HUFFMAN_MAX_TABLE_SIZE, br);
        block_length[i] = ReadBlockLength(block_len_trees, i * HUFFMAN_MAX_TABLE_SIZE, br);
        block_type_rb_index[i] = 1;
      }
    }
    
    br.readMoreInput();
    
    distance_postfix_bits = br.readBits(2);
    num_direct_distance_codes = NUM_DISTANCE_SHORT_CODES + (br.readBits(4) << distance_postfix_bits);
    distance_postfix_mask = (1 << distance_postfix_bits) - 1;
    num_distance_codes = (num_direct_distance_codes + (48 << distance_postfix_bits));
    context_modes = new Uint8Array(num_block_types[0]);

    for (i = 0; i < num_block_types[0]; ++i) {
       br.readMoreInput();
       context_modes[i] = (br.readBits(2) << 1);
    }
    
    var _o1 = DecodeContextMap(num_block_types[0] << kLiteralContextBits, br);
    num_literal_htrees = _o1.num_htrees;
    context_map = _o1.context_map;
    
    var _o2 = DecodeContextMap(num_block_types[2] << kDistanceContextBits, br);
    num_dist_htrees = _o2.num_htrees;
    dist_context_map = _o2.context_map;
    
    hgroup[0] = new HuffmanTreeGroup(kNumLiteralCodes, num_literal_htrees);
    hgroup[1] = new HuffmanTreeGroup(kNumInsertAndCopyCodes, num_block_types[1]);
    hgroup[2] = new HuffmanTreeGroup(num_distance_codes, num_dist_htrees);

    for (i = 0; i < 3; ++i) {
      hgroup[i].decode(br);
    }

    context_map_slice = 0;
    dist_context_map_slice = 0;
    context_mode = context_modes[block_type[0]];
    context_lookup_offset1 = Context.lookupOffsets[context_mode];
    context_lookup_offset2 = Context.lookupOffsets[context_mode + 1];
    htree_command = hgroup[1].htrees[0];

    while (meta_block_remaining_len > 0) {
      var cmd_code;
      var range_idx;
      var insert_code;
      var copy_code;
      var insert_length;
      var copy_length;
      var distance_code;
      var distance;
      var context;
      var j;
      var copy_dst;

      br.readMoreInput();
      
      if (block_length[1] === 0) {
        DecodeBlockType(num_block_types[1],
                        block_type_trees, 1, block_type, block_type_rb,
                        block_type_rb_index, br);
        block_length[1] = ReadBlockLength(block_len_trees, HUFFMAN_MAX_TABLE_SIZE, br);
        htree_command = hgroup[1].htrees[block_type[1]];
      }
      --block_length[1];
      cmd_code = ReadSymbol(hgroup[1].codes, htree_command, br);
      range_idx = cmd_code >> 6;
      if (range_idx >= 2) {
        range_idx -= 2;
        distance_code = -1;
      } else {
        distance_code = 0;
      }
      insert_code = Prefix.kInsertRangeLut[range_idx] + ((cmd_code >> 3) & 7);
      copy_code = Prefix.kCopyRangeLut[range_idx] + (cmd_code & 7);
      insert_length = Prefix.kInsertLengthPrefixCode[insert_code].offset +
          br.readBits(Prefix.kInsertLengthPrefixCode[insert_code].nbits);
      copy_length = Prefix.kCopyLengthPrefixCode[copy_code].offset +
          br.readBits(Prefix.kCopyLengthPrefixCode[copy_code].nbits);
      prev_byte1 = ringbuffer[pos-1 & ringbuffer_mask];
      prev_byte2 = ringbuffer[pos-2 & ringbuffer_mask];
      for (j = 0; j < insert_length; ++j) {
        br.readMoreInput();

        if (block_length[0] === 0) {
          DecodeBlockType(num_block_types[0],
                          block_type_trees, 0, block_type, block_type_rb,
                          block_type_rb_index, br);
          block_length[0] = ReadBlockLength(block_len_trees, 0, br);
          context_offset = block_type[0] << kLiteralContextBits;
          context_map_slice = context_offset;
          context_mode = context_modes[block_type[0]];
          context_lookup_offset1 = Context.lookupOffsets[context_mode];
          context_lookup_offset2 = Context.lookupOffsets[context_mode + 1];
        }
        context = (Context.lookup[context_lookup_offset1 + prev_byte1] |
                   Context.lookup[context_lookup_offset2 + prev_byte2]);
        literal_htree_index = context_map[context_map_slice + context];
        --block_length[0];
        prev_byte2 = prev_byte1;
        prev_byte1 = ReadSymbol(hgroup[0].codes, hgroup[0].htrees[literal_htree_index], br);
        ringbuffer[pos & ringbuffer_mask] = prev_byte1;
        if ((pos & ringbuffer_mask) === ringbuffer_mask) {
          output.write(ringbuffer, ringbuffer_size);
        }
        ++pos;
      }
      meta_block_remaining_len -= insert_length;
      if (meta_block_remaining_len <= 0) break;

      if (distance_code < 0) {
        var context;
        
        br.readMoreInput();
        if (block_length[2] === 0) {
          DecodeBlockType(num_block_types[2],
                          block_type_trees, 2, block_type, block_type_rb,
                          block_type_rb_index, br);
          block_length[2] = ReadBlockLength(block_len_trees, 2 * HUFFMAN_MAX_TABLE_SIZE, br);
          dist_context_offset = block_type[2] << kDistanceContextBits;
          dist_context_map_slice = dist_context_offset;
        }
        --block_length[2];
        context = (copy_length > 4 ? 3 : copy_length - 2) & 0xff;
        dist_htree_index = dist_context_map[dist_context_map_slice + context];
        distance_code = ReadSymbol(hgroup[2].codes, hgroup[2].htrees[dist_htree_index], br);
        if (distance_code >= num_direct_distance_codes) {
          var nbits;
          var postfix;
          var offset;
          distance_code -= num_direct_distance_codes;
          postfix = distance_code & distance_postfix_mask;
          distance_code >>= distance_postfix_bits;
          nbits = (distance_code >> 1) + 1;
          offset = ((2 + (distance_code & 1)) << nbits) - 4;
          distance_code = num_direct_distance_codes +
              ((offset + br.readBits(nbits)) <<
               distance_postfix_bits) + postfix;
        }
      }

      /* Convert the distance code to the actual distance by possibly looking */
      /* up past distnaces from the ringbuffer. */
      distance = TranslateShortCodes(distance_code, dist_rb, dist_rb_idx);
      if (distance < 0) {
        throw new Error('[BrotliDecompress] invalid distance');
      }

      if (pos < max_backward_distance &&
          max_distance !== max_backward_distance) {
        max_distance = pos;
      } else {
        max_distance = max_backward_distance;
      }

      copy_dst = pos & ringbuffer_mask;

      if (distance > max_distance) {
        if (copy_length >= BrotliDictionary.minDictionaryWordLength &&
            copy_length <= BrotliDictionary.maxDictionaryWordLength) {
          var offset = BrotliDictionary.offsetsByLength[copy_length];
          var word_id = distance - max_distance - 1;
          var shift = BrotliDictionary.sizeBitsByLength[copy_length];
          var mask = (1 << shift) - 1;
          var word_idx = word_id & mask;
          var transform_idx = word_id >> shift;
          offset += word_idx * copy_length;
          if (transform_idx < Transform.kNumTransforms) {
            var len = Transform.transformDictionaryWord(ringbuffer, copy_dst, offset, copy_length, transform_idx);
            copy_dst += len;
            pos += len;
            meta_block_remaining_len -= len;
            if (copy_dst >= ringbuffer_end) {
              output.write(ringbuffer, ringbuffer_size);
              
              for (var _x = 0; _x < (copy_dst - ringbuffer_end); _x++)
                ringbuffer[_x] = ringbuffer[ringbuffer_end + _x];
            }
          } else {
            throw new Error("Invalid backward reference. pos: " + pos + " distance: " + distance +
              " len: " + copy_length + " bytes left: " + meta_block_remaining_len);
          }
        } else {
          throw new Error("Invalid backward reference. pos: " + pos + " distance: " + distance +
            " len: " + copy_length + " bytes left: " + meta_block_remaining_len);
        }
      } else {
        if (distance_code > 0) {
          dist_rb[dist_rb_idx & 3] = distance;
          ++dist_rb_idx;
        }

        if (copy_length > meta_block_remaining_len) {
          throw new Error("Invalid backward reference. pos: " + pos + " distance: " + distance +
            " len: " + copy_length + " bytes left: " + meta_block_remaining_len);
        }

        for (j = 0; j < copy_length; ++j) {
          ringbuffer[pos & ringbuffer_mask] = ringbuffer[(pos - distance) & ringbuffer_mask];
          if ((pos & ringbuffer_mask) === ringbuffer_mask) {
            output.write(ringbuffer, ringbuffer_size);
          }
          ++pos;
          --meta_block_remaining_len;
        }
      }

      /* When we get here, we must have inserted at least one literal and */
      /* made a copy of at least length two, therefore accessing the last 2 */
      /* bytes is valid. */
      prev_byte1 = ringbuffer[(pos - 1) & ringbuffer_mask];
      prev_byte2 = ringbuffer[(pos - 2) & ringbuffer_mask];
    }

    /* Protect pos from overflow, wrap it around at every GB of input data */
    pos &= 0x3fffffff;
  }

  output.write(ringbuffer, pos & ringbuffer_mask);
}

exports.BrotliDecompress = BrotliDecompress;

BrotliDictionary.init();


/***/ }),

/***/ "./node_modules/brotli/dec/dictionary-browser.js":
/*!*******************************************************!*\
  !*** ./node_modules/brotli/dec/dictionary-browser.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var base64 = __webpack_require__(/*! base64-js */ "./node_modules/base64-js/index.js");

/**
 * The normal dictionary-data.js is quite large, which makes it 
 * unsuitable for browser usage. In order to make it smaller, 
 * we read dictionary.bin, which is a compressed version of
 * the dictionary, and on initial load, Brotli decompresses 
 * it's own dictionary. 😜
 */
exports.init = function() {
  var BrotliDecompressBuffer = (__webpack_require__(/*! ./decode */ "./node_modules/brotli/dec/decode.js").BrotliDecompressBuffer);
  var compressed = base64.toByteArray(__webpack_require__(/*! ./dictionary.bin.js */ "./node_modules/brotli/dec/dictionary.bin.js"));
  return BrotliDecompressBuffer(compressed);
};


/***/ }),

/***/ "./node_modules/brotli/dec/dictionary.bin.js":
/*!***************************************************!*\
  !*** ./node_modules/brotli/dec/dictionary.bin.js ***!
  \***************************************************/
/***/ ((module) => {

module.exports="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";


/***/ }),

/***/ "./node_modules/brotli/dec/dictionary.js":
/*!***********************************************!*\
  !*** ./node_modules/brotli/dec/dictionary.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* Copyright 2013 Google Inc. All Rights Reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   Collection of static dictionary words.
*/

var data = __webpack_require__(/*! ./dictionary-data */ "./node_modules/brotli/dec/dictionary-browser.js");
exports.init = function() {
  exports.dictionary = data.init();
};

exports.offsetsByLength = new Uint32Array([
     0,     0,     0,     0,     0,  4096,  9216, 21504, 35840, 44032,
 53248, 63488, 74752, 87040, 93696, 100864, 104704, 106752, 108928, 113536,
 115968, 118528, 119872, 121280, 122016,
]);

exports.sizeBitsByLength = new Uint8Array([
  0,  0,  0,  0, 10, 10, 11, 11, 10, 10,
 10, 10, 10,  9,  9,  8,  7,  7,  8,  7,
  7,  6,  6,  5,  5,
]);

exports.minDictionaryWordLength = 4;
exports.maxDictionaryWordLength = 24;


/***/ }),

/***/ "./node_modules/brotli/dec/huffman.js":
/*!********************************************!*\
  !*** ./node_modules/brotli/dec/huffman.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

function HuffmanCode(bits, value) {
  this.bits = bits;   /* number of bits used for this symbol */
  this.value = value; /* symbol value or table offset */
}

exports.HuffmanCode = HuffmanCode;

var MAX_LENGTH = 15;

/* Returns reverse(reverse(key, len) + 1, len), where reverse(key, len) is the
   bit-wise reversal of the len least significant bits of key. */
function GetNextKey(key, len) {
  var step = 1 << (len - 1);
  while (key & step) {
    step >>= 1;
  }
  return (key & (step - 1)) + step;
}

/* Stores code in table[0], table[step], table[2*step], ..., table[end] */
/* Assumes that end is an integer multiple of step */
function ReplicateValue(table, i, step, end, code) {
  do {
    end -= step;
    table[i + end] = new HuffmanCode(code.bits, code.value);
  } while (end > 0);
}

/* Returns the table width of the next 2nd level table. count is the histogram
   of bit lengths for the remaining symbols, len is the code length of the next
   processed symbol */
function NextTableBitSize(count, len, root_bits) {
  var left = 1 << (len - root_bits);
  while (len < MAX_LENGTH) {
    left -= count[len];
    if (left <= 0) break;
    ++len;
    left <<= 1;
  }
  return len - root_bits;
}

exports.BrotliBuildHuffmanTable = function(root_table, table, root_bits, code_lengths, code_lengths_size) {
  var start_table = table;
  var code;            /* current table entry */
  var len;             /* current code length */
  var symbol;          /* symbol index in original or sorted table */
  var key;             /* reversed prefix code */
  var step;            /* step size to replicate values in current table */
  var low;             /* low bits for current root entry */
  var mask;            /* mask for low bits */
  var table_bits;      /* key length of current table */
  var table_size;      /* size of current table */
  var total_size;      /* sum of root table size and 2nd level table sizes */
  var sorted;          /* symbols sorted by code length */
  var count = new Int32Array(MAX_LENGTH + 1);  /* number of codes of each length */
  var offset = new Int32Array(MAX_LENGTH + 1);  /* offsets in sorted table for each length */

  sorted = new Int32Array(code_lengths_size);

  /* build histogram of code lengths */
  for (symbol = 0; symbol < code_lengths_size; symbol++) {
    count[code_lengths[symbol]]++;
  }

  /* generate offsets into sorted symbol table by code length */
  offset[1] = 0;
  for (len = 1; len < MAX_LENGTH; len++) {
    offset[len + 1] = offset[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (symbol = 0; symbol < code_lengths_size; symbol++) {
    if (code_lengths[symbol] !== 0) {
      sorted[offset[code_lengths[symbol]]++] = symbol;
    }
  }
  
  table_bits = root_bits;
  table_size = 1 << table_bits;
  total_size = table_size;

  /* special case code with only one value */
  if (offset[MAX_LENGTH] === 1) {
    for (key = 0; key < total_size; ++key) {
      root_table[table + key] = new HuffmanCode(0, sorted[0] & 0xffff);
    }
    
    return total_size;
  }

  /* fill in root table */
  key = 0;
  symbol = 0;
  for (len = 1, step = 2; len <= root_bits; ++len, step <<= 1) {
    for (; count[len] > 0; --count[len]) {
      code = new HuffmanCode(len & 0xff, sorted[symbol++] & 0xffff);
      ReplicateValue(root_table, table + key, step, table_size, code);
      key = GetNextKey(key, len);
    }
  }

  /* fill in 2nd level tables and add pointers to root table */
  mask = total_size - 1;
  low = -1;
  for (len = root_bits + 1, step = 2; len <= MAX_LENGTH; ++len, step <<= 1) {
    for (; count[len] > 0; --count[len]) {
      if ((key & mask) !== low) {
        table += table_size;
        table_bits = NextTableBitSize(count, len, root_bits);
        table_size = 1 << table_bits;
        total_size += table_size;
        low = key & mask;
        root_table[start_table + low] = new HuffmanCode((table_bits + root_bits) & 0xff, ((table - start_table) - low) & 0xffff);
      }
      code = new HuffmanCode((len - root_bits) & 0xff, sorted[symbol++] & 0xffff);
      ReplicateValue(root_table, table + (key >> root_bits), step, table_size, code);
      key = GetNextKey(key, len);
    }
  }
  
  return total_size;
}


/***/ }),

/***/ "./node_modules/brotli/dec/prefix.js":
/*!*******************************************!*\
  !*** ./node_modules/brotli/dec/prefix.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {

/* Copyright 2013 Google Inc. All Rights Reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   Lookup tables to map prefix codes to value ranges. This is used during
   decoding of the block lengths, literal insertion lengths and copy lengths.
*/

/* Represents the range of values belonging to a prefix code: */
/* [offset, offset + 2^nbits) */
function PrefixCodeRange(offset, nbits) {
  this.offset = offset;
  this.nbits = nbits;
}

exports.kBlockLengthPrefixCode = [
  new PrefixCodeRange(1, 2), new PrefixCodeRange(5, 2), new PrefixCodeRange(9, 2), new PrefixCodeRange(13, 2),
  new PrefixCodeRange(17, 3), new PrefixCodeRange(25, 3), new PrefixCodeRange(33, 3), new PrefixCodeRange(41, 3),
  new PrefixCodeRange(49, 4), new PrefixCodeRange(65, 4), new PrefixCodeRange(81, 4), new PrefixCodeRange(97, 4),
  new PrefixCodeRange(113, 5), new PrefixCodeRange(145, 5), new PrefixCodeRange(177, 5), new PrefixCodeRange(209, 5),
  new PrefixCodeRange(241, 6), new PrefixCodeRange(305, 6), new PrefixCodeRange(369, 7), new PrefixCodeRange(497, 8),
  new PrefixCodeRange(753, 9), new PrefixCodeRange(1265, 10), new PrefixCodeRange(2289, 11), new PrefixCodeRange(4337, 12),
  new PrefixCodeRange(8433, 13), new PrefixCodeRange(16625, 24)
];

exports.kInsertLengthPrefixCode = [
  new PrefixCodeRange(0, 0), new PrefixCodeRange(1, 0), new PrefixCodeRange(2, 0), new PrefixCodeRange(3, 0),
  new PrefixCodeRange(4, 0), new PrefixCodeRange(5, 0), new PrefixCodeRange(6, 1), new PrefixCodeRange(8, 1),
  new PrefixCodeRange(10, 2), new PrefixCodeRange(14, 2), new PrefixCodeRange(18, 3), new PrefixCodeRange(26, 3),
  new PrefixCodeRange(34, 4), new PrefixCodeRange(50, 4), new PrefixCodeRange(66, 5), new PrefixCodeRange(98, 5),
  new PrefixCodeRange(130, 6), new PrefixCodeRange(194, 7), new PrefixCodeRange(322, 8), new PrefixCodeRange(578, 9),
  new PrefixCodeRange(1090, 10), new PrefixCodeRange(2114, 12), new PrefixCodeRange(6210, 14), new PrefixCodeRange(22594, 24),
];

exports.kCopyLengthPrefixCode = [
  new PrefixCodeRange(2, 0), new PrefixCodeRange(3, 0), new PrefixCodeRange(4, 0), new PrefixCodeRange(5, 0),
  new PrefixCodeRange(6, 0), new PrefixCodeRange(7, 0), new PrefixCodeRange(8, 0), new PrefixCodeRange(9, 0),
  new PrefixCodeRange(10, 1), new PrefixCodeRange(12, 1), new PrefixCodeRange(14, 2), new PrefixCodeRange(18, 2),
  new PrefixCodeRange(22, 3), new PrefixCodeRange(30, 3), new PrefixCodeRange(38, 4), new PrefixCodeRange(54, 4),
  new PrefixCodeRange(70, 5), new PrefixCodeRange(102, 5), new PrefixCodeRange(134, 6), new PrefixCodeRange(198, 7),
  new PrefixCodeRange(326, 8), new PrefixCodeRange(582, 9), new PrefixCodeRange(1094, 10), new PrefixCodeRange(2118, 24),
];

exports.kInsertRangeLut = [
  0, 0, 8, 8, 0, 16, 8, 16, 16,
];

exports.kCopyRangeLut = [
  0, 8, 0, 8, 16, 0, 16, 8, 16,
];


/***/ }),

/***/ "./node_modules/brotli/dec/streams.js":
/*!********************************************!*\
  !*** ./node_modules/brotli/dec/streams.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

function BrotliInput(buffer) {
  this.buffer = buffer;
  this.pos = 0;
}

BrotliInput.prototype.read = function(buf, i, count) {
  if (this.pos + count > this.buffer.length) {
    count = this.buffer.length - this.pos;
  }
  
  for (var p = 0; p < count; p++)
    buf[i + p] = this.buffer[this.pos + p];
  
  this.pos += count;
  return count;
}

exports.BrotliInput = BrotliInput;

function BrotliOutput(buf) {
  this.buffer = buf;
  this.pos = 0;
}

BrotliOutput.prototype.write = function(buf, count) {
  if (this.pos + count > this.buffer.length)
    throw new Error('Output buffer is not large enough');
  
  this.buffer.set(buf.subarray(0, count), this.pos);
  this.pos += count;
  return count;
};

exports.BrotliOutput = BrotliOutput;


/***/ }),

/***/ "./node_modules/brotli/dec/transform.js":
/*!**********************************************!*\
  !*** ./node_modules/brotli/dec/transform.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* Copyright 2013 Google Inc. All Rights Reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   Transformations on dictionary words.
*/

var BrotliDictionary = __webpack_require__(/*! ./dictionary */ "./node_modules/brotli/dec/dictionary.js");

var kIdentity       = 0;
var kOmitLast1      = 1;
var kOmitLast2      = 2;
var kOmitLast3      = 3;
var kOmitLast4      = 4;
var kOmitLast5      = 5;
var kOmitLast6      = 6;
var kOmitLast7      = 7;
var kOmitLast8      = 8;
var kOmitLast9      = 9;
var kUppercaseFirst = 10;
var kUppercaseAll   = 11;
var kOmitFirst1     = 12;
var kOmitFirst2     = 13;
var kOmitFirst3     = 14;
var kOmitFirst4     = 15;
var kOmitFirst5     = 16;
var kOmitFirst6     = 17;
var kOmitFirst7     = 18;
var kOmitFirst8     = 19;
var kOmitFirst9     = 20;

function Transform(prefix, transform, suffix) {
  this.prefix = new Uint8Array(prefix.length);
  this.transform = transform;
  this.suffix = new Uint8Array(suffix.length);
  
  for (var i = 0; i < prefix.length; i++)
    this.prefix[i] = prefix.charCodeAt(i);
  
  for (var i = 0; i < suffix.length; i++)
    this.suffix[i] = suffix.charCodeAt(i);
}

var kTransforms = [
     new Transform(         "", kIdentity,       ""           ),
     new Transform(         "", kIdentity,       " "          ),
     new Transform(        " ", kIdentity,       " "          ),
     new Transform(         "", kOmitFirst1,     ""           ),
     new Transform(         "", kUppercaseFirst, " "          ),
     new Transform(         "", kIdentity,       " the "      ),
     new Transform(        " ", kIdentity,       ""           ),
     new Transform(       "s ", kIdentity,       " "          ),
     new Transform(         "", kIdentity,       " of "       ),
     new Transform(         "", kUppercaseFirst, ""           ),
     new Transform(         "", kIdentity,       " and "      ),
     new Transform(         "", kOmitFirst2,     ""           ),
     new Transform(         "", kOmitLast1,      ""           ),
     new Transform(       ", ", kIdentity,       " "          ),
     new Transform(         "", kIdentity,       ", "         ),
     new Transform(        " ", kUppercaseFirst, " "          ),
     new Transform(         "", kIdentity,       " in "       ),
     new Transform(         "", kIdentity,       " to "       ),
     new Transform(       "e ", kIdentity,       " "          ),
     new Transform(         "", kIdentity,       "\""         ),
     new Transform(         "", kIdentity,       "."          ),
     new Transform(         "", kIdentity,       "\">"        ),
     new Transform(         "", kIdentity,       "\n"         ),
     new Transform(         "", kOmitLast3,      ""           ),
     new Transform(         "", kIdentity,       "]"          ),
     new Transform(         "", kIdentity,       " for "      ),
     new Transform(         "", kOmitFirst3,     ""           ),
     new Transform(         "", kOmitLast2,      ""           ),
     new Transform(         "", kIdentity,       " a "        ),
     new Transform(         "", kIdentity,       " that "     ),
     new Transform(        " ", kUppercaseFirst, ""           ),
     new Transform(         "", kIdentity,       ". "         ),
     new Transform(        ".", kIdentity,       ""           ),
     new Transform(        " ", kIdentity,       ", "         ),
     new Transform(         "", kOmitFirst4,     ""           ),
     new Transform(         "", kIdentity,       " with "     ),
     new Transform(         "", kIdentity,       "'"          ),
     new Transform(         "", kIdentity,       " from "     ),
     new Transform(         "", kIdentity,       " by "       ),
     new Transform(         "", kOmitFirst5,     ""           ),
     new Transform(         "", kOmitFirst6,     ""           ),
     new Transform(    " the ", kIdentity,       ""           ),
     new Transform(         "", kOmitLast4,      ""           ),
     new Transform(         "", kIdentity,       ". The "     ),
     new Transform(         "", kUppercaseAll,   ""           ),
     new Transform(         "", kIdentity,       " on "       ),
     new Transform(         "", kIdentity,       " as "       ),
     new Transform(         "", kIdentity,       " is "       ),
     new Transform(         "", kOmitLast7,      ""           ),
     new Transform(         "", kOmitLast1,      "ing "       ),
     new Transform(         "", kIdentity,       "\n\t"       ),
     new Transform(         "", kIdentity,       ":"          ),
     new Transform(        " ", kIdentity,       ". "         ),
     new Transform(         "", kIdentity,       "ed "        ),
     new Transform(         "", kOmitFirst9,     ""           ),
     new Transform(         "", kOmitFirst7,     ""           ),
     new Transform(         "", kOmitLast6,      ""           ),
     new Transform(         "", kIdentity,       "("          ),
     new Transform(         "", kUppercaseFirst, ", "         ),
     new Transform(         "", kOmitLast8,      ""           ),
     new Transform(         "", kIdentity,       " at "       ),
     new Transform(         "", kIdentity,       "ly "        ),
     new Transform(    " the ", kIdentity,       " of "       ),
     new Transform(         "", kOmitLast5,      ""           ),
     new Transform(         "", kOmitLast9,      ""           ),
     new Transform(        " ", kUppercaseFirst, ", "         ),
     new Transform(         "", kUppercaseFirst, "\""         ),
     new Transform(        ".", kIdentity,       "("          ),
     new Transform(         "", kUppercaseAll,   " "          ),
     new Transform(         "", kUppercaseFirst, "\">"        ),
     new Transform(         "", kIdentity,       "=\""        ),
     new Transform(        " ", kIdentity,       "."          ),
     new Transform(    ".com/", kIdentity,       ""           ),
     new Transform(    " the ", kIdentity,       " of the "   ),
     new Transform(         "", kUppercaseFirst, "'"          ),
     new Transform(         "", kIdentity,       ". This "    ),
     new Transform(         "", kIdentity,       ","          ),
     new Transform(        ".", kIdentity,       " "          ),
     new Transform(         "", kUppercaseFirst, "("          ),
     new Transform(         "", kUppercaseFirst, "."          ),
     new Transform(         "", kIdentity,       " not "      ),
     new Transform(        " ", kIdentity,       "=\""        ),
     new Transform(         "", kIdentity,       "er "        ),
     new Transform(        " ", kUppercaseAll,   " "          ),
     new Transform(         "", kIdentity,       "al "        ),
     new Transform(        " ", kUppercaseAll,   ""           ),
     new Transform(         "", kIdentity,       "='"         ),
     new Transform(         "", kUppercaseAll,   "\""         ),
     new Transform(         "", kUppercaseFirst, ". "         ),
     new Transform(        " ", kIdentity,       "("          ),
     new Transform(         "", kIdentity,       "ful "       ),
     new Transform(        " ", kUppercaseFirst, ". "         ),
     new Transform(         "", kIdentity,       "ive "       ),
     new Transform(         "", kIdentity,       "less "      ),
     new Transform(         "", kUppercaseAll,   "'"          ),
     new Transform(         "", kIdentity,       "est "       ),
     new Transform(        " ", kUppercaseFirst, "."          ),
     new Transform(         "", kUppercaseAll,   "\">"        ),
     new Transform(        " ", kIdentity,       "='"         ),
     new Transform(         "", kUppercaseFirst, ","          ),
     new Transform(         "", kIdentity,       "ize "       ),
     new Transform(         "", kUppercaseAll,   "."          ),
     new Transform( "\xc2\xa0", kIdentity,       ""           ),
     new Transform(        " ", kIdentity,       ","          ),
     new Transform(         "", kUppercaseFirst, "=\""        ),
     new Transform(         "", kUppercaseAll,   "=\""        ),
     new Transform(         "", kIdentity,       "ous "       ),
     new Transform(         "", kUppercaseAll,   ", "         ),
     new Transform(         "", kUppercaseFirst, "='"         ),
     new Transform(        " ", kUppercaseFirst, ","          ),
     new Transform(        " ", kUppercaseAll,   "=\""        ),
     new Transform(        " ", kUppercaseAll,   ", "         ),
     new Transform(         "", kUppercaseAll,   ","          ),
     new Transform(         "", kUppercaseAll,   "("          ),
     new Transform(         "", kUppercaseAll,   ". "         ),
     new Transform(        " ", kUppercaseAll,   "."          ),
     new Transform(         "", kUppercaseAll,   "='"         ),
     new Transform(        " ", kUppercaseAll,   ". "         ),
     new Transform(        " ", kUppercaseFirst, "=\""        ),
     new Transform(        " ", kUppercaseAll,   "='"         ),
     new Transform(        " ", kUppercaseFirst, "='"         )
];

exports.kTransforms = kTransforms;
exports.kNumTransforms = kTransforms.length;

function ToUpperCase(p, i) {
  if (p[i] < 0xc0) {
    if (p[i] >= 97 && p[i] <= 122) {
      p[i] ^= 32;
    }
    return 1;
  }
  
  /* An overly simplified uppercasing model for utf-8. */
  if (p[i] < 0xe0) {
    p[i + 1] ^= 32;
    return 2;
  }
  
  /* An arbitrary transform for three byte characters. */
  p[i + 2] ^= 5;
  return 3;
}

exports.transformDictionaryWord = function(dst, idx, word, len, transform) {
  var prefix = kTransforms[transform].prefix;
  var suffix = kTransforms[transform].suffix;
  var t = kTransforms[transform].transform;
  var skip = t < kOmitFirst1 ? 0 : t - (kOmitFirst1 - 1);
  var i = 0;
  var start_idx = idx;
  var uppercase;
  
  if (skip > len) {
    skip = len;
  }
  
  var prefix_pos = 0;
  while (prefix_pos < prefix.length) {
    dst[idx++] = prefix[prefix_pos++];
  }
  
  word += skip;
  len -= skip;
  
  if (t <= kOmitLast9) {
    len -= t;
  }
  
  for (i = 0; i < len; i++) {
    dst[idx++] = BrotliDictionary.dictionary[word + i];
  }
  
  uppercase = idx - len;
  
  if (t === kUppercaseFirst) {
    ToUpperCase(dst, uppercase);
  } else if (t === kUppercaseAll) {
    while (len > 0) {
      var step = ToUpperCase(dst, uppercase);
      uppercase += step;
      len -= step;
    }
  }
  
  var suffix_pos = 0;
  while (suffix_pos < suffix.length) {
    dst[idx++] = suffix[suffix_pos++];
  }
  
  return idx - start_idx;
}


/***/ }),

/***/ "./node_modules/brotli/decompress.js":
/*!*******************************************!*\
  !*** ./node_modules/brotli/decompress.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! ./dec/decode */ "./node_modules/brotli/dec/decode.js").BrotliDecompressBuffer;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!****************************************************************!*\
  !*** ./apps/static/assets/dist/js/map_and_layers_retriever.js ***!
  \****************************************************************/
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : String(i); }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var decompress = __webpack_require__(/*! brotli/decompress */ "./node_modules/brotli/decompress.js");
$(document).ready(function () {
  function applyCSS() {
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = ".parent div { height: 100% !important; }";
    document.head.appendChild(style);
  }
  if (!window.location.href.includes("drone")) {
    var isTouchSupported = function isTouchSupported() {
      var msTouchEnabled = window.navigator.msMaxTouchPoints;
      var generalTouchEnabled = ("ontouchstart" in document.createElement("div"));
      if (msTouchEnabled || generalTouchEnabled) {
        return true;
      }
      return false;
    };
    var makeDraggable = function makeDraggable(element) {
      $(element).draggable({
        start: function start(event, ui) {
          $(this).css({
            right: "auto",
            top: "auto",
            bottom: "auto"
          });
        }
      });
    };
    var getPathBasedContent = function getPathBasedContent(pathLink) {
      var legendHTML_en = "\n        <div id='maplegend' class='maplegend'\n            style='position: absolute; z-index:9999; border:2px solid grey; background-color:rgba(255, 255, 255, 0.8);\n            border-radius:6px; padding: 10px; font-size:14px; right: 20px; bottom: 20px; font-family: \"Helvetica Neue\",Helvetica,Arial,sans-serif; color: rgb(0, 0, 0)'>\n\n        <div class='legend-title'>Legend</div>\n        <div class='legend-scale'>\n            <ul class='legend-labels'>\n                <li><img src=\"https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=25&hoffset=0&voffset=-1\n                &background=1167b1\">&nbsp;&nbsp;Cashew Warehouse</li>\n                <li><img src=\"https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-globe-africa&size=25&hoffset=0&voffset\n                =-1&background=008000\">&nbsp;&nbsp;Plantation Location</li>\n                <li><img src=\"https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-leaf&size=25&hoffset=0&voffset=-1\n                &background=c63e2b\">&nbsp;&nbsp;Nursery</li>\n                <li><img src=\"https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=25&hoffset=0&voffset=-1\n                &background=DBA800\">&nbsp;&nbsp;Training Location</li>\n                <li>&nbsp;<img src=\"https://i.ibb.co/J3L37CV/Picture3.png\" width=\"17\" height=\"24\">&nbsp;&nbsp;&nbsp;Satellite\n                predictions</li>\n            </ul>\n        </div>\n        </div>\n      ";
      var legendHTML_fr = "\n        <div id='maplegend' class='maplegend'\n            style='position: absolute; z-index:9999; border:2px solid grey; background-color:rgba(255, 255, 255, 0.8);\n            border-radius:6px; padding: 10px; font-size:14px; right: 20px; bottom: 20px; font-family: \"Helvetica Neue\",Helvetica,Arial,sans-serif; color: rgb(0, 0, 0)'>\n\n        <div class='legend-title'>L\xE9gende</div>\n        <div class='legend-scale'>\n            <ul class='legend-labels'>\n                <li><img src=\"https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=25&hoffset=0&voffset=-1\n                &background=1167b1\">&nbsp;&nbsp;Entrepot de cajoux</li>\n                <li><img src=\"https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-globe-africa&size=25&hoffset=0&voffset\n                =-1&background=008000\">&nbsp;&nbsp;Plantation</li>\n                <li><img src=\"https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-leaf&size=25&hoffset=0&voffset=-1\n                &background=c63e2b\">&nbsp;&nbsp;P\xE9pini\xE8re</li>\n                <li><img src=\"https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=25&hoffset=0&voffset=-1\n                &background=DBA800\">&nbsp;&nbsp;Lieu d'Apprentissage</li>\n                <li>&nbsp;<img src=\"https://i.ibb.co/J3L37CV/Picture3.png\" width=\"17\" height=\"24\">&nbsp;&nbsp;&nbsp;Pr\xE9dictions\n                satellitaire</li>\n            </ul>\n        </div>\n        </div>\n      ";
      return pathLink.includes("/en/") ? legendHTML_en : pathLink.includes("/fr/") ? legendHTML_fr : "";
    };
    var addLegendBasedOnURL = function addLegendBasedOnURL(pathLink) {
      var parentDiv = document.getElementsByClassName("parent")[0];
      if (!parentDiv) return;
      parentDiv.insertAdjacentHTML("afterbegin", getPathBasedContent(pathLink));
      makeDraggable("#maplegend");
    };
    var decompressData = function decompressData(compressedData) {
      try {
        var decodedData = atob(compressedData.serialized_layers);
        var bytes = new Uint8Array(decodedData.length);
        for (var i = 0; i < decodedData.length; i++) {
          bytes[i] = decodedData.charCodeAt(i);
        }
        var decompressedData = decompress(bytes);
        var decompressed = new TextDecoder("utf-8").decode(decompressedData);
        return JSON.parse(decompressed);
      } catch (err) {
        console.error("Failed to decompress data", err);
        return null;
      }
    };
    var customLayerControl = function customLayerControl(control_layer) {
      if (!isTouchSupported()) {
        var showLayers = function showLayers() {
          button.style.display = "none";
          parent.style.padding = "6px 10px 6px 6px";
          controlContents.style.display = "block";
        };
        var hideLayers = function hideLayers() {
          button.style.display = "block";
          parent.style.padding = "0";
          controlContents.style.display = "none";
        };
        var delayTimeHide = function delayTimeHide() {
          showLayers();
          timer = setTimeout(function () {
            hideLayers();
          }, 4000);
        };
        var controlButton = control_layer.getContainer();
        controlButton.style.backgroundColor = "white";
        controlButton.style.cursor = "default";
        var controlContents = document.getElementsByClassName("leaflet-control-layers-list")[0];
        var button = document.getElementsByClassName("leaflet-control-layers-toggle")[0];
        var contents = document.getElementsByClassName("leaflet-control-layers-list");
        var parent = document.getElementsByClassName("leaflet-control-layers")[0];
        controlContents.style.display = "none";
        var timer;
        controlButton.addEventListener("mouseenter", function () {
          clearTimeout(timer);
          showLayers();
        });
        controlButton.addEventListener("mouseleave", function () {
          delayTimeHide();
        });
      }
    };
    var addHomeButtonToMap = function addHomeButtonToMap(map) {
      var map_leaf_dom = map.getContainer();
      var checkLoadMap = setInterval(function () {
        var map_leaf = eval(map_leaf_dom.id);
        if (map_leaf) {
          // Reset zoom and view function
          // called after map is initiated
          var resetZoom = function resetZoom() {
            document.getElementById("resetview").addEventListener("click", function () {
              map_leaf.setView(initialCenter, initialZoom);
            });
          };
          console.log("Map is done loaded ");
          // Create the node to hold the custom html
          var btnNode = document.createElement("div");
          // Set styles attributes for the div
          btnNode.setAttribute("class", "btn-group");
          btnNode.setAttribute("style", "z-index: 909; position: absolute; top: 10px; right: 45px;");
          btnNode.innerHTML = "<button id=\"resetview\" type=\"buttons\" style=\"background-color: white;\n                                    width: 36px;\n                                    height: 36px;\n                                    border: none;\n                                    box-shadow: rgba(0, 0, 0, 0.45) 0px 1px 5px;\n                                    border-radius: 4px;\n                                    font-size: 20px;\n                                  \">\n                                    <span><i class=\"fa fas fa-home\"></i></span>\n                                </button>";
          map_leaf_dom.appendChild(btnNode); // append to map
          // Store inital load variables
          var initialZoom = map_leaf.getZoom();
          var initialCenter = map_leaf.getCenter();
          resetZoom();
          clearInterval(checkLoadMap);
        }
      }, 500);
    };
    var getValueIgnoreCase = function getValueIgnoreCase(obj, key) {
      if (!obj || _typeof(obj) !== "object") {
        throw new Error("Invalid object provided.");
      }
      if (typeof key !== "string") {
        throw new Error("Invalid key type. Key must be a string.");
      }
      var lowercaseKey = key.toLowerCase();
      for (var objKey in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, objKey) && objKey.toLowerCase() === lowercaseKey) {
          return objKey;
        }
      }
      return undefined;
    };
    var replaceUpperCaseWithUnderscore = function replaceUpperCaseWithUnderscore(sentence) {
      var result = "";
      for (var i = 0; i < sentence.length; i++) {
        var currentChar = sentence.charAt(i);
        if (currentChar === currentChar.toUpperCase()) {
          result += "_" + currentChar.toLowerCase();
        } else {
          result += currentChar;
        }
      }
      return result;
    };
    var fetchMapData = function fetchMapData() {
      $.get(link, function (unparseddata) {
        var data = decompressData(unparseddata);
        if (data) {
          cashewMap = updateMap(data, true);
          $(".child1").promise().done(function () {
            $("div.child2").fadeOut(function () {
              $("div.child2").replaceWith("");
            });
          });
          // const openRequest = indexedDB.open(databaseName, 1);
          // openRequest.onsuccess = function (event) {
          //   const db = event.target.result;
          //   const transaction = db.transaction(objectStoreName, "readwrite");
          //   const objectStore = transaction.objectStore(objectStoreName);
          //   objectStore.put({
          //     id: parseInt(mapId),
          //     html: data,
          //     hash: mapHash,
          //   });
          //   transaction.oncomplete = function () {
          //     db.close();
          //   };
          // };
        }
      });
    };
    var orderingLayers = function orderingLayers(layers) {
      var order = ["countryBorderLayer", "countryLayer", "countryDeptLayer", "countryCommuneLayer", "countryDistrictLayer", "countryColoredDeptLayer", "countryColoredCommuneLayer", "countryProtectedLayer", "countryPlantationLayer", "trainingLayer", "qarLayer", "nurseryLayer"];
      order.forEach(function (layerName) {
        if (layers[layerName]) {
          layers[layerName].bringToFront();
        }
      });
    };
    var addLayersToMap = function addLayersToMap(cashewMap, layers) {
      var order = ["countryBorderLayer",
      // "countryLayer",
      // "countryDeptLayer",
      // "countryCommuneLayer",
      // "countryDistrictLayer",
      // "countryColoredDeptLayer",
      // "countryColoredCommuneLayer",
      // "countryProtectedLayer",
      // "countryPlantationLayer",
      // "trainingLayer",
      // "qarLayer",
      // "nurseryLayer",
      "predictionsLayer"
      // "treeDensityEstimationLayer",
      // "deforestation",
      // "aforestation",
      ];
      order.forEach(function (layerName) {
        if (layers[layerName]) {
          try {
            if (["qarLayer", "nurseryLayer"].includes(layerName)) {
              cashewMap.addLayer(layers[layerName]);
              cashewMap.setView([parseFloat(userCountryLat), parseFloat(userCountryLon)], 8);
            } else {
              layers[layerName].addTo(cashewMap);
              cashewMap.setView([parseFloat(userCountryLat), parseFloat(userCountryLon)], 8);
            }
          } catch (e) {
            console.error("Error adding layer ".concat(layerName, ":"), e);
          }
        }
      });
      return cashewMap;
    };
    var getBaseMap = function getBaseMap(pathLink) {
      try {
        var basemaps = {
          "Google Maps": L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
            attribution: "Google",
            maxZoom: 25
          }),
          "Google Satellite": L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
            attribution: "Google",
            maxZoom: 25
          }),
          "Mapbox Satellite": L.tileLayer("https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2hha2F6IiwiYSI6ImNrczMzNTl3ejB6eTYydnBlNzR0dHUwcnUifQ.vHqPio3Pe0PehWpIuf5QUg", {
            attribution: "Mapbox",
            maxZoom: 25
          })
        };
        basemaps["Google Maps"].addTo(cashewMap);
        L.control.fullscreen({
          position: "topright",
          title: "Full Screen",
          titleCancel: "Exit Full Screen",
          forceSeparateButton: false
        }).addTo(cashewMap);
        addLegendBasedOnURL(pathLink);
        control_layer = L.control.layers(basemaps).addTo(cashewMap);
        customLayerControl(control_layer);
      } catch (e) {
        console.error(e);
      }
      return [cashewMap, control_layer];
    };
    var updateLayer = function updateLayer(new_layer, map) {
      map.eachLayer(function (layer) {
        var newLayerName;
        switch (new_layer.name) {
          case undefined:
            newLayerName = new_layer.options.name;
            break;
          default:
            newLayerName = new_layer.name;
        }
        switch (layer.name) {
          case undefined:
            if (layer.options.name === newLayerName) {
              map.removeLayer(layer);
              control_layer.removeLayer(layer);
              new_layer.addTo(map);
              control_layer.addOverlay(new_layer, new_layer.options.name);
            }
            break;
          default:
            if (layer.name === newLayerName) {
              map.removeLayer(layer);
              control_layer.removeLayer(layer);
              new_layer.addTo(map);
              control_layer.addOverlay(new_layer, new_layer.name);
            }
        }
      });
    };
    var updateMap = function updateMap(serializedData) {
      var isLayersBuilted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var _rebuildLayers = rebuildLayers(serializedData),
        _rebuildLayers2 = _slicedToArray(_rebuildLayers, 2),
        outdated_layer_per_country_and_lang_builded = _rebuildLayers2[0],
        neededToBeBuilded = _rebuildLayers2[1];
      if (neededToBeBuilded === true) {
        if (isLayersBuilted === false) {
          console.log("Updating only: ".concat(Object.keys(outdated_layer_per_country_and_lang_builded)));
          var layers = generateMapLayers(currentLanguage, outdated_layer_per_country_and_lang_builded, userCountryName);
          Object.values(layers).map(function (element) {
            return updateLayer(element, cashewMap);
          });
          return layers;
        } else {
          cashewMap = generateMapLayers(currentLanguage, outdated_layer_per_country_and_lang_builded, userCountryName, isLayersBuilted);
          return cashewMap;
        }
      } else {
        console.log("No need to update layers");
      }
    };
    var rebuildLayers = function rebuildLayers(data) {
      var outdated_layer_per_country_and_lang_builded = {};
      var neededToBeBuilded;
      Object.keys(data).forEach(function (countryName) {
        outdated_layer_per_country_and_lang_builded[countryName] = {};
        var countryData = data[countryName];
        Object.keys(countryData).forEach(function (lang) {
          outdated_layer_per_country_and_lang_builded[countryName][lang] = {};
          var layers = countryData[lang];
          if (Object.keys(layers).length > 0) {
            neededToBeBuilded = true;
          }
          Object.keys(layers).forEach(function (layerName) {
            var layerData = layers[layerName];
            if (_typeof(layerData) !== "object" && layerData !== null) {
              layerData = JSON.parse(layerData);
            }
            var layerNameUpper = layerName.toUpperCase();
            var layerType = MAP_LAYER_TYPE[layerNameUpper];
            outdated_layer_per_country_and_lang_builded[countryName][lang][layerName] = reconstructLayers(layerData, layerType, layerName);
          });
        });
      });
      return [outdated_layer_per_country_and_lang_builded, neededToBeBuilded];
    };
    var reconstructLayers = function reconstructLayers(layerItems, type, layerName) {
      var layers = [];
      switch (type) {
        case "GeoJson":
          layerItems.forEach(function (layerItem) {
            if (layerName == "country_commune_layer") {}
            var layer;
            if (["country_border_layer", "country_colored_dept_layer", "country_colored_commune_layer", "country_protected_layer"].includes(layerName)) {
              var styleFunction = reconstructFunction(layerItem.style_function, layerName);
              layer = L.geoJSON(layerItem.data, {
                style: styleFunction,
                onEachFeature: onEachFeature(styleFunction, layerName)
              });
            } else {
              var _styleFunction = reconstructFunction(layerItem.highlight_function, layerName);
              currentGeoJsonObj = layer = L.geoJSON(layerItem.data, {
                onEachFeature: onEachFeature(_styleFunction, layerName)
              });
            }
            if (layerItem.custom_popup) {
              var popup = L.popup(layerItem.custom_popup.options);
              var content = layerItem.custom_popup.html;
              if (layerName == "country_plantation_layer" && currentLanguage != "fr") {
                var content = $(content)[0];
                var base64EncodedIframe = content.src.split(";base64,")[1];
                var decodedIframe = atob(base64EncodedIframe);
                baseLink = "".concat(window.location.origin, "/fr/dashboard/drone/");
                var baseLink = baseLink.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                modifiedContent = decodedIframe.replace(new RegExp(baseLink, "g"), "".concat(window.location.origin, "/").concat(currentLanguage, "/dashboard/drone/"));
                var modifiedBase64EncodedIframe = btoa(modifiedContent);
                content.src = "data:text/html;charset=utf-8;base64,".concat(modifiedBase64EncodedIframe);
              }
              popup.setContent(content);
              layer.bindPopup(popup);
            }
            if (layerItem.custom_tooltip) {
              var customTooltipLayersFieldsAndAliases = {
                country_dept_layer: {
                  fields: "NAME_1",
                  aliases: "GAUL 1: "
                },
                country_colored_dept_layer: {
                  fields: "NAME_1",
                  aliases: "GAUL 1: "
                },
                country_commune_layer: {
                  fields: "NAME_2",
                  aliases: "GAUL 2: "
                },
                country_district_layer: {
                  fields: "NAME_3",
                  aliases: "GAUL 3: "
                },
                country_colored_commune_layer: {
                  fields: "NAME_2",
                  aliases: "GAUL 2: "
                }
              };
              if (Object.keys(customTooltipLayersFieldsAndAliases).includes(layerName)) {
                layer.bindTooltip(function (layer) {
                  var div = L.DomUtil.create("div");
                  var handleObject = function handleObject(feature) {
                    return _typeof(feature) == "object" ? JSON.stringify(feature) : feature;
                  };
                  var customTooltipLayerFieldsAndAliases = customTooltipLayersFieldsAndAliases[layerName];
                  var fields = [customTooltipLayerFieldsAndAliases.fields];
                  var aliases = [customTooltipLayerFieldsAndAliases.aliases];
                  var table = "<table>" + String(fields.map(function (v, i) {
                    return "<tr>\n                      <th>".concat(aliases[i], "</th>\n\n                      <td>").concat(handleObject(layer.feature.properties[v]), "</td>\n                  </tr>");
                  }).join("")) + "</table>";
                  div.innerHTML = table;
                  return div;
                }, {
                  className: "foliumtooltip",
                  sticky: true,
                  tooltipOptions: {
                    className: "foliumtooltip",
                    sticky: false
                  }
                });
              } else {
                var tooltip = L.tooltip(layerItem.custom_tooltip.options);
                tooltip.setContent(layerItem.custom_tooltip.text);
                layer.bindTooltip(tooltip);
              }
            }
            layers.push(layer);
          });
          break;
        case "Marker":
          if (["country_plantation_marker", "qar_layer"].includes(layerName)) {
            layerItems.forEach(function (layerItem) {
              var layer = reconstructMarker(layerItem, layerName);
              layers.push(layer);
            });
          } else {
            layerItems.forEach(function (layerItem) {
              var layer = reconstructMarker(layerItem);
              layers.push(layer);
            });
          }
          break;
        case "TileLayer":
        case "Raster TileLayer":
          layerItems.forEach(function (layerItem) {
            var layer = createLeafletTileLayer(layerItem);
            layers.push(layer);
          });
          break;
        default:
          console.warn("Unhandled layer type:", type);
      }
      if (type == "Marker") {
        return layers;
      } else {
        return layers;
      }
    };
    var createLeafletTileLayer = function createLeafletTileLayer(data) {
      return L.tileLayer(data.tiles, data.options);
    };
    var reconstructMarker = function reconstructMarker(markerData) {
      var layerName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
      var icon = reconstructIcon(markerData.icon, markerData.icon_class, layerName);
      var current_marker = L.marker(markerData.location, markerData.options);
      current_marker.setIcon(icon);
      if (markerData.popup) {
        var content = $(markerData.popup.html)[0];
        var popup = L.popup(markerData.popup.options);
        popup.setContent(content);
        current_marker.bindPopup(popup);
      }
      if (markerData.tooltip) {
        var tooltip = L.tooltip(markerData.tooltip.options);
        tooltip.setContent(markerData.tooltip.text);
        current_marker.bindTooltip(tooltip);
      }
      return current_marker;
    };
    var reconstructIcon = function reconstructIcon(iconData, iconClass) {
      var layerName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
      if (!iconData) return null;
      switch (iconClass) {
        case "folium.Icon":
          if (layerName == "country_plantation_marker") {
            iconData.options.icon = "globe";
            iconData.options.prefix = "fa";
          } else if (iconData.options.icon == "leaf") {
            iconData.options.prefix = "fa";
          }
          return L.AwesomeMarkers.icon(iconData.options);
        case "folium.features.CustomIcon":
          return L.icon({
            iconUrl: iconData.options.iconUrl,
            iconSize: iconData.options.iconSize
          });
      }
    };
    var onEachFeature = function onEachFeature(styleFunction, layerName) {
      return function (feature, layer) {
        if (["country_plantation_layer"].includes(layerName)) {
          layer.on({
            click: function click(e) {
              if (typeof e.target.getBounds === "function") {
                cashewMap.fitBounds(e.target.getBounds());
              } else if (typeof e.target.getLatLng === "function") {
                var zoom = cashewMap.getZoom();
                zoom = zoom > 12 ? zoom : zoom + 1;
                cashewMap.flyTo(e.target.getLatLng(), zoom);
              }
            }
          });
        } else if (["country_border_layer", "country_protected_layer", "country_colored_dept_layer", "country_colored_commune_layer"].includes(layerName)) {
          layer.on({});
        } else if (["country_layer", "country_dept_layer", "country_commune_layer", "country_district_layer"].includes(layerName)) {
          layer.on({
            mouseout: function mouseout(e) {
              if (typeof e.target.setStyle === "function") {
                currentGeoJsonObj.resetStyle(e.target);
              }
            },
            mouseover: function mouseover(e) {
              if (typeof e.target.setStyle === "function") {
                var highlightStyle = styleFunction(e.target.feature);
                e.target.setStyle(highlightStyle);
              }
            }
          });
        }
      };
    };
    var reconstructFunction = function reconstructFunction(funcData, layerName) {
      if (!funcData) {
        return null;
      }
      if (funcData.__function__) {
        return layers_functions_to_recompute[layerName];
      }
      if (funcData.__partial__) {
        var baseFunction = reconstructFunction({
          __function__: true,
          name: funcData.func
        }, layerName);
        var partialHighlightFunction = function partialHighlightFunction(color_values) {
          return function (feature) {
            return baseFunction(feature, color_values);
          };
        };
        return partialHighlightFunction(funcData.keywords);
      }
      return null;
    };
    var normalizeString = function normalizeString(str) {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };
    var databaseName = "mapDB";
    var objectStoreName = "mapData";
    var cashewMap = L.map("map");
    var control_layer;
    var currentGeoJsonObj;
    var generateMapLayers;
    ;
    ;
    ;
    ;
    ;
    ;
    ;
    ;
    L.NamedFeatureGroup = L.FeatureGroup.extend({
      initialize: function initialize(name, layers) {
        L.FeatureGroup.prototype.initialize.call(this, layers);
        this.name = name;
      }
    });
    try {
      var openRequest = indexedDB.open(databaseName, 1);
      openRequest.onupgradeneeded = function (event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains(objectStoreName)) {
          db.createObjectStore(objectStoreName, {
            keyPath: "id"
          });
        }
      };
      openRequest.onsuccess = function (event) {
        var db = event.target.result;
        var transaction = db.transaction(objectStoreName, "readonly");
        var objectStore = transaction.objectStore(objectStoreName);
        var getRequest = objectStore.get(parseInt(mapId));
        getRequest.onsuccess = function () {
          if (getRequest.result) {
            console.log("OLD MAP HASH: ".concat(getRequest.result.hash, ",\nNEW MAP HASH: ").concat(mapHash));
          }
          if (getRequest.result && getRequest.result.hash === mapHash) {
            var cachedMapHtml = getRequest.result.html;
            $(".child1").html(cachedMapHtml);
            $(".child1").promise().done(function () {
              $("div.child2").fadeOut(function () {
                $("div.child2").replaceWith("");
              });
            });
          } else {
            fetchMapData();
          }
        };
        transaction.oncomplete = function () {
          db.close();
        };
      };
    } catch (error) {
      console.log(error);
    }
    ;
    ;
    ;
    ;
    ;
    if (userRole === "GLOBAL-ADMIN") {
      /**
       * Calls the appropriate layer method based on the function name and parameters.
       * @param {Function} method - The method to be called.
       * @param {string} functionName - The name of the function.
       * @param {string} lang - The language setting.
       * @param {Array} activeCountries - Array of active countries.
       * @param {Object} outdatedLayers - The outdated layers.
       * @return {Object} The result of the method call.
       */
      var callMapMethod = function callMapMethod(mapObject, functionName, map_class_attribute_name, lang, activeCountries, outdatedLayers) {
        function filter_array(outdatedLayers, country, lang, map_class_attribute_name) {
          var value = outdatedLayers[country][lang][getValueIgnoreCase(outdatedLayers[country][lang], replaceUpperCaseWithUnderscore(map_class_attribute_name))];
          if (value != undefined) {
            return value;
          } else {
            return [];
          }
        }
        if (functionName !== "generateCountryPlantationLayer") {
          var result = mapObject[functionName](activeCountries.map(function (country) {
            return filter_array(outdatedLayers, country, lang, map_class_attribute_name);
          }));
          return result;
        } else {
          var _result = mapObject[functionName](activeCountries.map(function (country) {
            return outdatedLayers[country][lang][getValueIgnoreCase(outdatedLayers[country][lang], replaceUpperCaseWithUnderscore(map_class_attribute_name))];
          }), activeCountries.map(function (country) {
            return outdatedLayers[country][lang]["country_plantation_marker"];
          }));
          return _result;
        }
      };
      var GenericMap = /*#__PURE__*/function () {
        function GenericMap() {
          _classCallCheck(this, GenericMap);
          this.countryLayer = null;
          this.countryBorderLayer = null;
          this.countryDeptLayer = null;
          this.countryCommuneLayer = null;
          this.countryDistrictLayer = null;
          this.countryColoredDeptLayer = null;
          this.countryColoredCommuneLayer = null;
          this.countryProtectedLayer = null;
          this.countryPlantationLayer = null;
          this.qarLayer = null;
          this.trainingLayer = null;
          this.nurseryLayer = null;
          this.predictionsLayer = null;
          this.treeDensityEstimationLayer = null;
          this.deforestation = null;
          this.aforestation = null;
        }
        _createClass(GenericMap, [{
          key: "createFeatureGroup",
          value: function createFeatureGroup(name) {
            var show = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var overlay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
            var control = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
            var zIndexOffset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
            var featureGroup = L.featureGroup();
            featureGroup.name = name;
            featureGroup.options = {
              name: name,
              show: show,
              overlay: overlay,
              control: control,
              zIndexOffset: zIndexOffset
            };
            return featureGroup;
          }
        }, {
          key: "createMarkerCluster",
          value: function createMarkerCluster(name) {
            var markerCluster = L.markerClusterGroup({
              name: name
            });
            return markerCluster;
          }
        }, {
          key: "addLayersToGroup",
          value: function addLayersToGroup(layerGroup, countriesLayerList) {
            countriesLayerList = countriesLayerList || [];
            countriesLayerList.forEach(function (obj) {
              (obj || []).forEach(function (elmt) {
                elmt.addTo(layerGroup);
              });
            });
          }
        }, {
          key: "generateCountryColoredCommuneLayer",
          value: function generateCountryColoredCommuneLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Training Recommendations Level 2", false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryColoredCommuneLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryColoredDeptLayer",
          value: function generateCountryColoredDeptLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Training Recommendations Level 1", false, true, true, 10);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryColoredDeptLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryCommuneLayer",
          value: function generateCountryCommuneLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Administrative Level 2", false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryCommuneLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryDeptLayer",
          value: function generateCountryDeptLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Administrative Level 1", false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryDeptLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryDistrictLayer",
          value: function generateCountryDistrictLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Administrative Level 3", false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryDistrictLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryPlantationLayer",
          value: function generateCountryPlantationLayer(countriesLayerList, countriesMarkerList) {
            var layer;
            if (countriesLayerList != undefined && countriesMarkerList != undefined) {
              var plantationCluster = this.createMarkerCluster("Plantations");
              layer = this.createFeatureGroup("Plantation Locations", true, true);
              this.addLayersToGroup(layer, countriesLayerList);
              layer.addLayer(plantationCluster);
              this.addLayersToGroup(plantationCluster, countriesMarkerList);
            } else {
              layer = null;
            }
            ;
            this.countryPlantationLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryProtectedLayer",
          value: function generateCountryProtectedLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Protected Areas", false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryProtectedLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryLayer",
          value: function generateCountryLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Administrative Level 0", false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryBorderLayer",
          value: function generateCountryBorderLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Administrative Boundaries Level 0", true, false, false);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryBorderLayer = layer;
            return layer;
          }
        }, {
          key: "generateNurseryLayer",
          value: function generateNurseryLayer(countriesLayerList) {
            console.log(countriesLayerList, ' Generic Nurseries');
            var markerCluster;
            if (countriesLayerList != undefined) {
              markerCluster = this.createMarkerCluster("Nursery Information");
              this.addLayersToGroup(markerCluster, countriesLayerList);
            } else {
              markerCluster = null;
            }
            ;
            this.nurseryLayer = markerCluster;
            return markerCluster;
          }
        }, {
          key: "generateQarLayer",
          value: function generateQarLayer(countriesLayerList) {
            var markerCluster;
            if (countriesLayerList != undefined) {
              markerCluster = this.createMarkerCluster("Warehouse Location");
              this.addLayersToGroup(markerCluster, countriesLayerList);
            } else {
              markerCluster = null;
            }
            ;
            this.qarLayer = markerCluster;
            return markerCluster;
          }
        }, {
          key: "generateTrainingLayer",
          value: function generateTrainingLayer(countriesLayerList) {
            var markerCluster;
            if (countriesLayerList != undefined) {
              markerCluster = this.createMarkerCluster("Training Information", false);
              this.addLayersToGroup(markerCluster, countriesLayerList);
            } else {
              markerCluster = null;
            }
            ;
            this.trainingLayer = markerCluster;
            return markerCluster;
          }
        }, {
          key: "generateTreeDensityEstimationLayer",
          value: function generateTreeDensityEstimationLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Tree Density Satellite Estimation", false);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.treeDensityEstimationLayer = layer;
            return layer;
          }
        }, {
          key: "generatePredictionsLayer",
          value: function generatePredictionsLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Cashew Growing Areas", true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.predictionsLayer = layer;
            return layer;
          }
        }, {
          key: "generateDeforestation",
          value: function generateDeforestation(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Deforested Area (2021 - 2022) (ha)", false);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.deforestation = layer;
            return layer;
          }
        }, {
          key: "generateAforestation",
          value: function generateAforestation(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Afforested Area (2000 - 2012) (ha)", false);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.aforestation = layer;
            return layer;
          }
        }]);
        return GenericMap;
      }();
      /**
       * Generates layers for a generic map based on outdated layers and language settings.
       * @param {string} lang - The language setting.
       * @param {Object} outdatedLayers - The outdated layers data.
       * @return {Object|null} The generated layers or null in case of an error.
       */
      generateMapLayers = function generateMapLayersFunction(lang, outdatedLayers, country) {
        var isLayersBuilted = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
        var startTime = Date.now();
        var control_layer;
        if (isLayersBuilted != false) {
          var _getBaseMap = getBaseMap(window.location.href);
          var _getBaseMap2 = _slicedToArray(_getBaseMap, 2);
          cashewMap = _getBaseMap2[0];
          control_layer = _getBaseMap2[1];
        }
        var activeCountries = Object.keys(outdatedLayers);
        try {
          var genericMapObj = new GenericMap();
          var layers = {};
          for (var attribute in genericMapObj) {
            if (!attribute.startsWith("_") && genericMapObj[attribute] === null) {
              var functionName = "generate".concat(attribute.charAt(0).toUpperCase()).concat(attribute.slice(1));
              var method = genericMapObj[functionName];
              if (typeof method === "function") {
                layers[attribute] = callMapMethod(genericMapObj, functionName, attribute, lang, activeCountries, outdatedLayers);
              } else {
                console.log("The function '".concat(functionName, "' does not exist."));
              }
            }
          }
          layers = Object.fromEntries(Object.entries(layers).filter(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
              k = _ref2[0],
              v = _ref2[1];
            return v !== null;
          }));
          if (isLayersBuilted === false) {
            return layers;
          } else {
            cashewMap.on("overlayadd", function (event) {
              event.layer.bringToFront();
            });
            console.log('map layers generic', layers);
            cashewMap = addLayersToMap(cashewMap, layers);
            orderingLayers(cashewMap, layers);
            addHomeButtonToMap(cashewMap);
            Object.keys(layers).forEach(function (layerName) {
              switch (layers[layerName].name) {
                case undefined:
                  if (!["Administrative Boundaries Level 0"].includes(layers[layerName].options.name)) {
                    control_layer.addOverlay(layers[layerName], layers[layerName].options.name);
                  }
                  break;
                default:
                  if (!["Administrative Boundaries Level 0"].includes(layers[layerName].name)) {
                    control_layer.addOverlay(layers[layerName], layers[layerName].name);
                  }
              }
            });
            console.log("Total loading time: ".concat(((Date.now() - startTime) / 1000).toFixed(2), " seconds"));
            return cashewMap;
          }
        } catch (e) {
          console.error(e);
          return null;
        }
      };
    } else if (userRole == "") {
      var PublicMap = /*#__PURE__*/function () {
        function PublicMap() {
          _classCallCheck(this, PublicMap);
          this.countryLayer = null;
          this.countryBorderLayer = null;
          this.countryDeptLayer = null;
          this.countryCommuneLayer = null;
          this.countryDistrictLayer = null;
          this.countryProtectedLayer = null;
          this.predictionsLayer = null;
          this.deforestation = null;
        }
        _createClass(PublicMap, [{
          key: "generateCountryCommuneLayer",
          value: function generateCountryCommuneLayer(countriesLayerList) {
            var countryCommuneLayer;
            if (countriesLayerList != undefined) {
              countryCommuneLayer = L.featureGroup({
                name: "Administrative Level 2",
                show: false,
                overlay: true
              });
              countryCommuneLayer.name = "Administrative Level 2";
              countriesLayerList.forEach(function (obj) {
                return obj && obj.forEach(function (elmt) {
                  return countryCommuneLayer.addLayer(elmt);
                });
              });
              this.countryCommuneLayer = countryCommuneLayer;
            } else {
              countryCommuneLayer = null;
            }
            ;
            return countryCommuneLayer;
          }
        }, {
          key: "generateCountryDeptLayer",
          value: function generateCountryDeptLayer(countriesLayerList) {
            var countryDeptLayer;
            if (countriesLayerList != undefined) {
              countryDeptLayer = L.featureGroup({
                name: "Administrative Level 1",
                show: false,
                overlay: true
              });
              countryDeptLayer.name = "Administrative Level 1";
              countriesLayerList.forEach(function (obj) {
                return obj && obj.forEach(function (elmt) {
                  return countryDeptLayer.addLayer(elmt);
                });
              });
              this.countryDeptLayer = countryDeptLayer;
            } else {
              countryDeptLayer = null;
            }
            ;
            return countryDeptLayer;
          }
        }, {
          key: "generateCountryDistrictLayer",
          value: function generateCountryDistrictLayer(countriesLayerList) {
            var countryDistrictLayer;
            if (countriesLayerList != undefined) {
              countryDistrictLayer = L.featureGroup({
                name: "Administrative Level 3",
                show: false,
                overlay: true
              });
              countryDistrictLayer.name = "Administrative Level 3";
              countriesLayerList.forEach(function (obj) {
                return obj && obj.forEach(function (elmt) {
                  return countryDistrictLayer.addLayer(elmt);
                });
              });
              this.countryDistrictLayer = countryDistrictLayer;
            } else {
              countryDistrictLayer = null;
            }
            ;
            return countryDistrictLayer;
          }
        }, {
          key: "generateCountryProtectedLayer",
          value: function generateCountryProtectedLayer(countriesLayerList) {
            var countryProtectedLayer;
            if (countriesLayerList != undefined) {
              countryProtectedLayer = L.featureGroup({
                name: "Protected Areas",
                show: false,
                overlay: true
              });
              countryProtectedLayer.name = "Protected Areas";
              countriesLayerList.forEach(function (obj) {
                return obj && obj.forEach(function (elmt) {
                  return countryProtectedLayer.addLayer(elmt);
                });
              });
              this.countryProtectedLayer = countryProtectedLayer;
            } else {
              countryProtectedLayer = null;
            }
            ;
            return countryProtectedLayer;
          }
        }, {
          key: "generateCountryLayer",
          value: function generateCountryLayer(countriesLayerList) {
            var countryLayer;
            if (countriesLayerList != undefined) {
              countryLayer = L.featureGroup({
                name: "Administrative Level 0",
                show: false,
                overlay: true
              });
              countryLayer.name = "Administrative Level 0";
              countriesLayerList.forEach(function (obj) {
                return obj && obj.forEach(function (elmt) {
                  return countryLayer.addLayer(elmt);
                });
              });
              this.countryLayer = countryLayer;
            } else {
              countryLayer = null;
            }
            ;
            return countryLayer;
          }
        }, {
          key: "generateCountryBorderLayer",
          value: function generateCountryBorderLayer(countriesLayerList) {
            var countryBorderLayer;
            if (countriesLayerList != undefined) {
              countryBorderLayer = L.featureGroup({
                name: "Administrative Boundaries Level 0",
                show: true,
                overlay: false,
                control: false
              });
              countryBorderLayer.name = "Administrative Boundaries Level 0";
              countriesLayerList.forEach(function (obj) {
                return obj && obj.forEach(function (elmt) {
                  return countryBorderLayer.addLayer(elmt);
                });
              });
              this.countryBorderLayer = countryBorderLayer;
            } else {
              countryBorderLayer = null;
            }
            ;
            return countryBorderLayer;
          }
        }, {
          key: "generatePredictionsLayer",
          value: function generatePredictionsLayer(countriesLayerList) {
            var predictionsLayer;
            if (countriesLayerList != undefined) {
              predictionsLayer = L.featureGroup({
                name: "Cashew Growing Areas",
                show: true
              });
              predictionsLayer.name = "Cashew Growing Areas";
              countriesLayerList.forEach(function (obj) {
                return obj && obj.forEach(function (elmt) {
                  return predictionsLayer.addLayer(elmt);
                });
              });
              this.predictionsLayer = predictionsLayer;
            } else {
              predictionsLayer = null;
            }
            ;
            return predictionsLayer;
          }
        }, {
          key: "generateDeforestation",
          value: function generateDeforestation(countriesLayerList) {
            var deforestationLayer;
            if (countriesLayerList != undefined) {
              deforestationLayer = L.featureGroup({
                name: "Deforestation (2021 - 2022)",
                show: false
              });
              deforestationLayer.name = "Deforestation (2021 - 2022)";
              countriesLayerList.forEach(function (obj) {
                return obj && obj.forEach(function (elmt) {
                  return deforestationLayer.addLayer(elmt);
                });
              });
              this.deforestation = deforestationLayer;
            } else {
              deforestationLayer = null;
            }
            ;
            return deforestationLayer;
          }
        }]);
        return PublicMap;
      }();
      /**
       * Generates layers for a public map based on outdated layers and language settings.
       * @param {string} lang - The language setting.
       * @param {Object} outdatedLayers - The outdated layers data.
       * @return {Promise<Object|null>} The generated layers or null in case of an error.
       */
      generateMapLayers = function generateMapLayersFunction(lang, outdatedLayers, country) {
        var isLayersBuilted = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
        var startTime = Date.now();
        var control_layer;
        if (isLayersBuilted != false) {
          var _getBaseMap3 = getBaseMap(window.location.href);
          var _getBaseMap4 = _slicedToArray(_getBaseMap3, 2);
          cashewMap = _getBaseMap4[0];
          control_layer = _getBaseMap4[1];
        }
        var activeCountries = Object.keys(outdatedLayers);
        try {
          var publicMapObj = new PublicMap();
          var layers = {};
          var _loop = function _loop(attribute) {
            var functionName = "generate".concat(attribute.charAt(0).toUpperCase()).concat(attribute.slice(1));
            if (!attribute.startsWith("_") && publicMapObj[attribute] === null && typeof publicMapObj[functionName] === "function") {
              var layerData = activeCountries.map(function (current_country) {
                return outdatedLayers[current_country][lang][getValueIgnoreCase(outdatedLayers[current_country][lang], replaceUpperCaseWithUnderscore(attribute))];
              });
              layers[attribute] = publicMapObj[functionName](layerData);
            }
          };
          for (var attribute in publicMapObj) {
            _loop(attribute);
          }
          layers = Object.fromEntries(Object.entries(layers).filter(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2),
              k = _ref4[0],
              v = _ref4[1];
            return v != null;
          }));
          if (isLayersBuilted === false) {
            console.log("Total loading time: ".concat((Date.now() - startTime) / 1000, " seconds"));
            return layers;
          } else {
            cashewMap.on("overlayadd", function (event) {
              event.layer.bringToFront();
            });
            cashewMap = addLayersToMap(cashewMap, layers);
            orderingLayers(cashewMap, layers);
            addHomeButtonToMap(cashewMap);
            Object.keys(layers).forEach(function (layerName) {
              switch (layers[layerName].name) {
                case undefined:
                  if (!["Administrative Boundaries Level 0"].includes(layers[layerName].options.name)) {
                    control_layer.addOverlay(layers[layerName], layers[layerName].options.name);
                  }
                  break;
                default:
                  if (!["Administrative Boundaries Level 0"].includes(layers[layerName].name)) {
                    control_layer.addOverlay(layers[layerName], layers[layerName].name);
                  }
              }
            });
            console.log("Total loading time: ".concat(((Date.now() - startTime) / 1000).toFixed(2), " seconds"));
            return cashewMap;
          }
        } catch (e) {
          console.error(e);
          return null;
        }
      };
    } else {
      /**
       * Calls the appropriate map method based on the function name and parameters.
       * @param {Function} method - The method to be called.
       * @param {string} functionName - The name of the function.
       * @param {Object} data - The data to be passed to the function.
       * @param {Object} country - The country-specific data.
       * @param {Object} outdatedLayers - The outdated layers.
       * @param {Array} methodWithCountry - Array of method names that require country data.
       * @param {Object} defaultMapObj - The default map object instance.
       * @return {Object} The result of the method calL.
       */
      var _callMapMethod = function _callMapMethod(mapObject, functionName, map_class_attribute_name, lang, country, outdatedLayers, methodWithCountry) {
        if (methodWithCountry.includes(functionName)) {
          var result = mapObject[functionName](outdatedLayers[country][lang][getValueIgnoreCase(outdatedLayers[country][lang], replaceUpperCaseWithUnderscore(map_class_attribute_name))], country);
          return result;
        } else if (functionName === "generateCountryPlantationLayer") {
          var _result2 = mapObject[functionName](outdatedLayers[country][lang][getValueIgnoreCase(outdatedLayers[country][lang], replaceUpperCaseWithUnderscore(map_class_attribute_name))], outdatedLayers[country][lang]["country_plantation_marker"]);
          return _result2;
        } else {
          var _result3 = mapObject[functionName](outdatedLayers[country][lang][getValueIgnoreCase(outdatedLayers[country][lang], replaceUpperCaseWithUnderscore(map_class_attribute_name))]);
          return _result3;
        }
      };
      var DefaultMap = /*#__PURE__*/function () {
        function DefaultMap() {
          _classCallCheck(this, DefaultMap);
          this.countryLayer = null;
          this.countryBorderLayer = null;
          this.countryDeptLayer = null;
          this.countryCommuneLayer = null;
          this.countryDistrictLayer = null;
          this.countryColoredDeptLayer = null;
          this.countryColoredCommuneLayer = null;
          this.countryProtectedLayer = null;
          this.countryPlantationLayer = null;
          this.qarLayer = null;
          this.trainingLayer = null;
          this.nurseryLayer = null;
          this.predictionsLayer = null;
          this.treeDensityEstimationLayer = null;
          this.deforestation = null;
          this.aforestation = null;
        }
        _createClass(DefaultMap, [{
          key: "createFeatureGroup",
          value: function createFeatureGroup(name) {
            var show = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var overlay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
            var control = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
            var zIndexOffset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
            var featureGroup = L.featureGroup();
            featureGroup.name = name;
            featureGroup.options = {
              name: name,
              show: show,
              overlay: overlay,
              control: control,
              zIndexOffset: zIndexOffset
            };
            return featureGroup;
          }
        }, {
          key: "createMarkerCluster",
          value: function createMarkerCluster(name) {
            var marker_Cluster = L.markerClusterGroup({
              name: name
            });
            return marker_Cluster;
          }
        }, {
          key: "addLayersToGroup",
          value: function addLayersToGroup(layerGroup, countriesLayerList) {
            countriesLayerList = countriesLayerList || [];
            (countriesLayerList || []).forEach(function (elmt) {
              elmt.addTo(layerGroup);
            });
          }
        }, {
          key: "generateCountryColoredCommuneLayer",
          value: function generateCountryColoredCommuneLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("GAUL2 Training Recommendations", false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryColoredCommuneLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryColoredDeptLayer",
          value: function generateCountryColoredDeptLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("GAUL1 Training Recommendations", false, true, true, 10);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryColoredDeptLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryCommuneLayer",
          value: function generateCountryCommuneLayer(countriesLayerList, country) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("".concat(country, " ").concat(userCountrylevel2Name), false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryCommuneLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryDeptLayer",
          value: function generateCountryDeptLayer(countriesLayerList, country) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("".concat(country, " ").concat(userCountrylevel1Name), false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryDeptLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryDistrictLayer",
          value: function generateCountryDistrictLayer(countriesLayerList, country) {
            console.log('in generateCountryDistrictLayer Passed ', countriesLayerList, country);
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("".concat(country, " ").concat(userCountryLevel3Name), false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryDistrictLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryPlantationLayer",
          value: function generateCountryPlantationLayer(countriesLayerList, countriesMarkerList) {
            console.log('in generateCountryPlantationLayer Passed ', countriesLayerList, countriesMarkerList);
            var layer;
            if (countriesLayerList != undefined && countriesMarkerList != undefined) {
              var plantationCluster = this.createMarkerCluster("Plantations");
              layer = this.createFeatureGroup("Plantation Locations", true, true);
              this.addLayersToGroup(layer, countriesLayerList);
              layer.addLayer(plantationCluster);
              this.addLayersToGroup(plantationCluster, countriesMarkerList);
            } else {
              layer = null;
            }
            ;
            console.log('default generated plantation layer ', layer);
            this.countryPlantationLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryProtectedLayer",
          value: function generateCountryProtectedLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Protected Areas", false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryProtectedLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryLayer",
          value: function generateCountryLayer(countriesLayerList, country) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("".concat(country, " Republic"), false, true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryLayer = layer;
            return layer;
          }
        }, {
          key: "generateCountryBorderLayer",
          value: function generateCountryBorderLayer(countriesLayerList, country) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("".concat(country, " Boundaries Republic"), true, false, false);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.countryBorderLayer = layer;
            return layer;
          }
        }, {
          key: "generateNurseryLayer",
          value: function generateNurseryLayer(countriesLayerList) {
            var markerCluster;
            if (countriesLayerList != undefined) {
              markerCluster = this.createMarkerCluster("Nursery Information");
              this.addLayersToGroup(markerCluster, countriesLayerList);
            } else {
              markerCluster = null;
            }
            ;
            this.nurseryLayer = markerCluster;
            return markerCluster;
          }
        }, {
          key: "generateQarLayer",
          value: function generateQarLayer(countriesLayerList) {
            var markerCluster;
            if (countriesLayerList != undefined) {
              markerCluster = this.createMarkerCluster("Warehouse Location");
              this.addLayersToGroup(markerCluster, countriesLayerList);
            } else {
              markerCluster = null;
            }
            ;
            this.qarLayer = markerCluster;
            return markerCluster;
          }
        }, {
          key: "generateTrainingLayer",
          value: function generateTrainingLayer(countriesLayerList) {
            var markerCluster;
            if (countriesLayerList != undefined) {
              markerCluster = this.createMarkerCluster("Training Information", false);
              this.addLayersToGroup(markerCluster, countriesLayerList);
            } else {
              markerCluster = null;
            }
            ;
            this.trainingLayer = markerCluster;
            return markerCluster;
          }
        }, {
          key: "generateTreeDensityEstimationLayer",
          value: function generateTreeDensityEstimationLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Tree Density Satellite Estimation", false);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.treeDensityEstimationLayer = layer;
            return layer;
          }
        }, {
          key: "generatePredictionsLayer",
          value: function generatePredictionsLayer(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Cashew Growing Areas", true);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.predictionsLayer = layer;
            return layer;
          }
        }, {
          key: "generateDeforestation",
          value: function generateDeforestation(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Deforested Area (2021 - 2022) (ha)", false);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.deforestation = layer;
            return layer;
          }
        }, {
          key: "generateAforestation",
          value: function generateAforestation(countriesLayerList) {
            var layer;
            if (countriesLayerList != undefined) {
              layer = this.createFeatureGroup("Afforested Area (2000 - 2012) (ha)", false);
              this.addLayersToGroup(layer, countriesLayerList);
            } else {
              layer = null;
            }
            ;
            this.aforestation = layer;
            return layer;
          }
        }]);
        return DefaultMap;
      }();
      /**
       * Generates map layers based on outdated layers and country-specific data.
       * @param {Object} outdatedLayers - The outdated layers to be updated.
       * @param {Object} country - The country-specific data for certain layers.
       * @return {Object|null} The updated layers or null in case of an error.
       */
      generateMapLayers = function generateMapLayersFunction(lang, outdatedLayers, country) {
        var isLayersBuilded = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
        var startTime = Date.now();
        var control_layer;
        if (isLayersBuilded != false) {
          var _getBaseMap5 = getBaseMap(window.location.href);
          var _getBaseMap6 = _slicedToArray(_getBaseMap5, 2);
          cashewMap = _getBaseMap6[0];
          control_layer = _getBaseMap6[1];
        }
        try {
          var layers = {};
          var defaultMapObj = new DefaultMap();
          var methodWithCountry = ["generateCountryCommuneLayer", "generateCountryDeptLayer", "generateCountryDistrictLayer", "generateCountryLayer", "generateCountryBorderLayer"];
          for (var attribute in defaultMapObj) {
            if (!attribute.startsWith("_") && defaultMapObj[attribute] === null) {
              var functionName = "generate".concat(attribute.charAt(0).toUpperCase()).concat(attribute.slice(1));
              var method = defaultMapObj[functionName];
              if (typeof method === "function") {
                layers[attribute] = _callMapMethod(defaultMapObj, functionName, attribute, lang, country, outdatedLayers, methodWithCountry);
              } else {
                console.log("The function '".concat(functionName, "' does not exist."));
              }
            }
          }
          layers = Object.fromEntries(Object.entries(layers).filter(function (_ref5) {
            var _ref6 = _slicedToArray(_ref5, 2),
              k = _ref6[0],
              v = _ref6[1];
            return v !== null;
          }));
          console.log("layers default", layers);
          if (isLayersBuilded === false) {
            return layers;
          } else {
            cashewMap.on("overlayadd", function (event) {
              event.layer.bringToFront();
            });
            console.log('map layers normal default new', layers);
            cashewMap = addLayersToMap(cashewMap, layers);
            orderingLayers(cashewMap, layers);
            addHomeButtonToMap(cashewMap);
            Object.keys(layers).forEach(function (layerName) {
              switch (layers[layerName].name) {
                case undefined:
                  if (!["".concat(country, " Boundaries Republic")].includes(layers[layerName].options.name)) {
                    control_layer.addOverlay(layers[layerName], layers[layerName].options.name);
                  }
                  break;
                default:
                  if (!["".concat(country, " Boundaries Republic")].includes(layers[layerName].name)) {
                    control_layer.addOverlay(layers[layerName], layers[layerName].name);
                  }
              }
            });
            console.log("Total loading time default: ".concat(((Date.now() - startTime) / 1000).toFixed(2), " seconds"));
            return cashewMap;
          }
        } catch (e) {
          console.error(e);
          return null;
        }
      };
    }
    ;
    var MAP_LAYER_OBJECT_TYPE = {
      GEOJSON: "GeoJson",
      MARKER: "Marker",
      TILELAYER: "TileLayer",
      RASTER_TILELAYER: "Raster TileLayer",
      OTHER: "Other"
    };
    var MAP_LAYER_TYPE = {
      COUNTRY_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_BORDER_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_DEPT_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_COLORED_DEPT_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_COMMUNE_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_DISTRICT_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_COLORED_COMMUNE_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_PROTECTED_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_PLANTATION_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_PLANTATION_MARKER: MAP_LAYER_OBJECT_TYPE.MARKER,
      NURSERY_LAYER: MAP_LAYER_OBJECT_TYPE.MARKER,
      QAR_LAYER: MAP_LAYER_OBJECT_TYPE.MARKER,
      TRAINING_LAYER: MAP_LAYER_OBJECT_TYPE.MARKER,
      PREDICTIONS_LAYER: MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER,
      TREE_DENSITY_ESTIMATION_LAYER: MAP_LAYER_OBJECT_TYPE.TILELAYER,
      DEFORESTATION: MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER,
      AFORESTATION: MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER
    };
    ;
    ;
    ;
    ;
    ;
    ;
    ;
    ;
    ;
    ;
    var layers_functions_to_recompute = {
      country_layer: function highlight_function(feature) {
        return {
          fillColor: "#ffaf00",
          color: "green",
          weight: 3,
          dashArray: "1, 1"
        };
      },
      country_border_layer: function highlight_function2(feature) {
        return {
          fillColor: "transparent",
          color: "#B4B4B4",
          weight: 3,
          dashArray: "1, 1"
        };
      },
      country_dept_layer: function highlight_function(feature) {
        return {
          fillColor: "#ffaf00",
          color: "green",
          weight: 3,
          dashArray: "1, 1"
        };
      },
      country_colored_dept_layer: function highlightFunction(feature, _ref7) {
        var color_values = _ref7.color_values;
        if (!feature || !feature.properties || !color_values || _typeof(color_values) !== "object") {
          console.error("Invalid input. Check feature and color_values.");
          return;
        }
        var department = normalizeString(feature.properties.NAME_1);
        var colorCode = color_values.hasOwnProperty(department) ? color_values[department] : 0;
        var color = "transparent";
        var border = "transparent";
        if (colorCode !== 0) {
          var redValue = colorCode & 255;
          var greenValue = colorCode >> 8 & 255;
          var blueValue = colorCode >> 16 & 255;
          color = "#".concat(redValue.toString(16).padStart(2, "0")).concat(greenValue.toString(16).padStart(2, "0")).concat(blueValue.toString(16).padStart(2, "0"));
          border = "black";
        }
        return {
          fillColor: color,
          color: border,
          weight: 3,
          dashArray: "1, 1",
          opacity: 0.35,
          fillOpacity: 0.8
        };
      },
      country_commune_layer: function highlight_function(feature) {
        return {
          fillColor: "#ffaf00",
          color: "green",
          weight: 3,
          dashArray: "1, 1"
        };
      },
      country_district_layer: function highlight_function(feature) {
        return {
          fillColor: "#ffaf00",
          color: "green",
          weight: 3,
          dashArray: "1, 1"
        };
      },
      country_colored_commune_layer: function highlightFunction(feature, _ref8) {
        var color_values = _ref8.color_values;
        if (!feature || !feature.properties || !color_values || _typeof(color_values) !== "object") {
          console.error("Invalid input. Check feature and color_values.");
          return;
        }
        var commune = normalizeString(feature.properties.NAME_2);
        var colorCode = color_values.hasOwnProperty(commune) ? color_values[commune] : 0;
        var color = "transparent";
        var border = "transparent";
        if (colorCode !== 0) {
          var redValue = colorCode & 255;
          var greenValue = colorCode >> 8 & 255;
          var blueValue = colorCode >> 16 & 255;
          color = "#".concat(redValue.toString(16).padStart(2, "0")).concat(greenValue.toString(16).padStart(2, "0")).concat(blueValue.toString(16).padStart(2, "0"));
          border = "black";
        }
        return {
          fillColor: color,
          color: border,
          weight: 3,
          dashArray: "1, 1",
          opacity: 0.35,
          fillOpacity: 0.8
        };
      },
      country_protected_layer: function highlight_function(feature) {
        return {
          color: "black",
          fillColor: "#1167B1",
          weight: 2,
          dashArray: "1, 1",
          opacity: 0.35,
          fillOpacity: 0.75
        };
      }
    };
    var socket = new WebSocket("wss://".concat(host, "/ws/map_layer/"));
    socket.onopen = function (e) {
      console.log("Connection established!");
    };
    socket.onmessage = function (event) {
      console.log('New message!!!');
      var data = JSON.parse(event.data);
      if (data.message) {
        var outdated_layer_per_country_and_lang = data.message;
        updateMap(outdated_layer_per_country_and_lang);
      }
    };
    socket.onclose = function (event) {
      if (event.wasClean) {
        console.log("Connection closed cleanly, code=".concat(event.code, ", reason=").concat(event.reason));
      } else {
        console.error("Connection died");
      }
    };
    socket.onerror = function (error) {
      console.error("WebSocket error observed: ".concat(error));
      console.log(error);
    };

    // Function to dynamically update the legend if the language change without reloading the page
    // function updateLegend() {
    //   let legendDiv = $(".info.legend")[0];
    //   legendDiv.innerHTML = getPathBasedContent();
    //   makeDraggable(legendDiv);
    // }
  } else {
    applyCSS();
    var startTime = performance.now();
    $(document).ready(function () {
      var endTime = performance.now();
      console.log("Document Loading took ".concat(endTime - startTime, " milliseconds"));
      $("div.child1").html(mapData);
      $(".child1").promise().done(function () {
        $("div.child2").fadeOut(function () {
          $("div.child2").replaceWith("");
        });
      });
    });
  }
  ;
});
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX2FuZF9sYXllcnNfcmV0cmlldmVyLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBWTs7QUFFWixrQkFBa0I7QUFDbEIsbUJBQW1CO0FBQ25CLHFCQUFxQjs7QUFFckI7QUFDQTtBQUNBOztBQUVBO0FBQ0EsbUNBQW1DLFNBQVM7QUFDNUM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsY0FBYyxTQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsU0FBUztBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDJDQUEyQyxVQUFVO0FBQ3JEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7O0FDckpBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEJBQTBCO0FBQzFCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsMEJBQTBCO0FBQzFCLDBCQUEwQjtBQUMxQiwwQkFBMEI7QUFDMUIsMEJBQTBCO0FBQzFCLDBCQUEwQjtBQUMxQiwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBLGtCQUFrQixPQUFPO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsUUFBUTtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCLFFBQVE7QUFDOUI7O0FBRUE7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7Ozs7OztBQzNIQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxJQUFJO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUN6UEE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztB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O0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFVBQVU7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsa0JBQWtCLFlBQVk7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixZQUFZO0FBQ2hDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLDhCQUE4Qjs7QUFFOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLDhCQUE4Qjs7QUFFOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGtCQUFrQixnQ0FBZ0M7QUFDbEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IsT0FBTztB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsbUJBQW1CO0FBQ25CLHNCQUFzQjs7QUFFdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLCtCQUErQjtBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLFNBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUN0UEEsc0hBQStEOzs7Ozs7O1VDQS9EO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3RCQSxJQUFJQSxVQUFVLEdBQUdDLG1CQUFPLENBQUMsOERBQW1CLENBQUM7QUFDN0NDLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLENBQUNDLEtBQUssQ0FBQyxZQUFZO0VBQzVCLFNBQVNDLFFBQVFBLENBQUEsRUFBRztJQUNsQixJQUFNQyxLQUFLLEdBQUdILFFBQVEsQ0FBQ0ksYUFBYSxDQUFDLE9BQU8sQ0FBQztJQUM3Q0QsS0FBSyxDQUFDRSxJQUFJLEdBQUcsVUFBVTtJQUN2QkYsS0FBSyxDQUFDRyxTQUFTLEdBQUcsMENBQTBDO0lBQzVETixRQUFRLENBQUNPLElBQUksQ0FBQ0MsV0FBVyxDQUFDTCxLQUFLLENBQUM7RUFDbEM7RUFFQSxJQUFJLENBQUNNLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDQyxJQUFJLENBQUNDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTtJQUFBLElBUWxDQyxnQkFBZ0IsR0FBekIsU0FBU0EsZ0JBQWdCQSxDQUFBLEVBQUc7TUFDMUIsSUFBSUMsY0FBYyxHQUFHTCxNQUFNLENBQUNNLFNBQVMsQ0FBQ0MsZ0JBQWdCO01BQ3RELElBQUlDLG1CQUFtQixJQUFHLGNBQWMsSUFBSWpCLFFBQVEsQ0FBQ0ksYUFBYSxDQUFDLEtBQUssQ0FBQztNQUV6RSxJQUFJVSxjQUFjLElBQUlHLG1CQUFtQixFQUFFO1FBQ3pDLE9BQU8sSUFBSTtNQUNiO01BQ0EsT0FBTyxLQUFLO0lBQ2QsQ0FBQztJQUFBLElBRVFDLGFBQWEsR0FBdEIsU0FBU0EsYUFBYUEsQ0FBQ0MsT0FBTyxFQUFFO01BQzlCcEIsQ0FBQyxDQUFDb0IsT0FBTyxDQUFDLENBQUNDLFNBQVMsQ0FBQztRQUNuQkMsS0FBSyxFQUFFLFNBQUFBLE1BQVVDLEtBQUssRUFBRUMsRUFBRSxFQUFFO1VBQzFCeEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDeUIsR0FBRyxDQUFDO1lBQ1ZDLEtBQUssRUFBRSxNQUFNO1lBQ2JDLEdBQUcsRUFBRSxNQUFNO1lBQ1hDLE1BQU0sRUFBRTtVQUNWLENBQUMsQ0FBQztRQUNKO01BQ0YsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUFBLElBRVFDLG1CQUFtQixHQUE1QixTQUFTQSxtQkFBbUJBLENBQUNDLFFBQVEsRUFBRTtNQUNyQyxJQUFNQyxhQUFhLDY5Q0FxQmxCO01BRUQsSUFBTUMsYUFBYSwyK0NBcUJsQjtNQUNELE9BQU9GLFFBQVEsQ0FBQ2pCLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FDNUJrQixhQUFhLEdBQ2JELFFBQVEsQ0FBQ2pCLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FDdkJtQixhQUFhLEdBQ2IsRUFBRTtJQUNWLENBQUM7SUFBQSxJQUVRQyxtQkFBbUIsR0FBNUIsU0FBU0EsbUJBQW1CQSxDQUFDSCxRQUFRLEVBQUU7TUFDckMsSUFBTUksU0FBUyxHQUFHakMsUUFBUSxDQUFDa0Msc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzlELElBQUksQ0FBQ0QsU0FBUyxFQUFFO01BQ2hCQSxTQUFTLENBQUNFLGtCQUFrQixDQUFDLFlBQVksRUFBRVAsbUJBQW1CLENBQUNDLFFBQVEsQ0FBQyxDQUFDO01BQ3pFWCxhQUFhLENBQUMsWUFBWSxDQUFDO0lBQzdCLENBQUM7SUFBQSxJQUVRa0IsY0FBYyxHQUF2QixTQUFTQSxjQUFjQSxDQUFDQyxjQUFjLEVBQUU7TUFDdEMsSUFBSTtRQUNGLElBQU1DLFdBQVcsR0FBR0MsSUFBSSxDQUFDRixjQUFjLENBQUNHLGlCQUFpQixDQUFDO1FBQzFELElBQU1DLEtBQUssR0FBRyxJQUFJQyxVQUFVLENBQUNKLFdBQVcsQ0FBQ0ssTUFBTSxDQUFDO1FBQ2hELEtBQUssSUFBSUMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHTixXQUFXLENBQUNLLE1BQU0sRUFBRUMsQ0FBQyxFQUFFLEVBQUU7VUFDM0NILEtBQUssQ0FBQ0csQ0FBQyxDQUFDLEdBQUdOLFdBQVcsQ0FBQ08sVUFBVSxDQUFDRCxDQUFDLENBQUM7UUFDdEM7UUFDQSxJQUFNRSxnQkFBZ0IsR0FBR2pELFVBQVUsQ0FBQzRDLEtBQUssQ0FBQztRQUMxQyxJQUFNTSxZQUFZLEdBQUcsSUFBSUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDQyxNQUFNLENBQUNILGdCQUFnQixDQUFDO1FBQ3RFLE9BQU9JLElBQUksQ0FBQ0MsS0FBSyxDQUFDSixZQUFZLENBQUM7TUFDakMsQ0FBQyxDQUFDLE9BQU9LLEdBQUcsRUFBRTtRQUNaQyxPQUFPLENBQUNDLEtBQUssQ0FBQywyQkFBMkIsRUFBRUYsR0FBRyxDQUFDO1FBQy9DLE9BQU8sSUFBSTtNQUNiO0lBQ0YsQ0FBQztJQUFBLElBRVFHLGtCQUFrQixHQUEzQixTQUFTQSxrQkFBa0JBLENBQUNDLGFBQWEsRUFBRTtNQUN6QyxJQUFJLENBQUMzQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUU7UUFBQSxJQW1CZDRDLFVBQVUsR0FBbkIsU0FBU0EsVUFBVUEsQ0FBQSxFQUFHO1VBQ3BCQyxNQUFNLENBQUN2RCxLQUFLLENBQUN3RCxPQUFPLEdBQUcsTUFBTTtVQUM3QkMsTUFBTSxDQUFDekQsS0FBSyxDQUFDMEQsT0FBTyxHQUFHLGtCQUFrQjtVQUN6Q0MsZUFBZSxDQUFDM0QsS0FBSyxDQUFDd0QsT0FBTyxHQUFHLE9BQU87UUFDekMsQ0FBQztRQUFBLElBQ1FJLFVBQVUsR0FBbkIsU0FBU0EsVUFBVUEsQ0FBQSxFQUFHO1VBQ3BCTCxNQUFNLENBQUN2RCxLQUFLLENBQUN3RCxPQUFPLEdBQUcsT0FBTztVQUM5QkMsTUFBTSxDQUFDekQsS0FBSyxDQUFDMEQsT0FBTyxHQUFHLEdBQUc7VUFDMUJDLGVBQWUsQ0FBQzNELEtBQUssQ0FBQ3dELE9BQU8sR0FBRyxNQUFNO1FBQ3hDLENBQUM7UUFBQSxJQUNRSyxhQUFhLEdBQXRCLFNBQVNBLGFBQWFBLENBQUEsRUFBRztVQUN2QlAsVUFBVSxDQUFDLENBQUM7VUFDWlEsS0FBSyxHQUFHQyxVQUFVLENBQUMsWUFBWTtZQUM3QkgsVUFBVSxDQUFDLENBQUM7VUFDZCxDQUFDLEVBQUUsSUFBSSxDQUFDO1FBQ1YsQ0FBQztRQWpDRCxJQUFJSSxhQUFhLEdBQUdYLGFBQWEsQ0FBQ1ksWUFBWSxDQUFDLENBQUM7UUFDaERELGFBQWEsQ0FBQ2hFLEtBQUssQ0FBQ2tFLGVBQWUsR0FBRyxPQUFPO1FBQzdDRixhQUFhLENBQUNoRSxLQUFLLENBQUNtRSxNQUFNLEdBQUcsU0FBUztRQUN0QyxJQUFJUixlQUFlLEdBQUc5RCxRQUFRLENBQUNrQyxzQkFBc0IsQ0FDbkQsNkJBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLElBQU13QixNQUFNLEdBQUcxRCxRQUFRLENBQUNrQyxzQkFBc0IsQ0FDNUMsK0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLElBQU1xQyxRQUFRLEdBQUd2RSxRQUFRLENBQUNrQyxzQkFBc0IsQ0FDOUMsNkJBQ0YsQ0FBQztRQUNELElBQU0wQixNQUFNLEdBQUc1RCxRQUFRLENBQUNrQyxzQkFBc0IsQ0FDNUMsd0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKNEIsZUFBZSxDQUFDM0QsS0FBSyxDQUFDd0QsT0FBTyxHQUFHLE1BQU07UUFDdEMsSUFBSU0sS0FBSztRQWlCVEUsYUFBYSxDQUFDSyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsWUFBWTtVQUN2REMsWUFBWSxDQUFDUixLQUFLLENBQUM7VUFDbkJSLFVBQVUsQ0FBQyxDQUFDO1FBQ2QsQ0FBQyxDQUFDO1FBQ0ZVLGFBQWEsQ0FBQ0ssZ0JBQWdCLENBQUMsWUFBWSxFQUFFLFlBQVk7VUFDdkRSLGFBQWEsQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQztNQUNKO0lBQ0YsQ0FBQztJQUFBLElBRVFVLGtCQUFrQixHQUEzQixTQUFTQSxrQkFBa0JBLENBQUNDLEdBQUcsRUFBRTtNQUMvQixJQUFNQyxZQUFZLEdBQUdELEdBQUcsQ0FBQ1AsWUFBWSxDQUFDLENBQUM7TUFFdkMsSUFBTVMsWUFBWSxHQUFHQyxXQUFXLENBQUMsWUFBTTtRQUNyQyxJQUFNQyxRQUFRLEdBQUdDLElBQUksQ0FBQ0osWUFBWSxDQUFDSyxFQUFFLENBQUM7UUFDdEMsSUFBSUYsUUFBUSxFQUFFO1VBd0JaO1VBQ0E7VUFBQSxJQUNTRyxTQUFTLEdBQWxCLFNBQVNBLFNBQVNBLENBQUEsRUFBRztZQUNuQmxGLFFBQVEsQ0FDTG1GLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FDM0JYLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxZQUFNO2NBQy9CTyxRQUFRLENBQUNLLE9BQU8sQ0FBQ0MsYUFBYSxFQUFFQyxXQUFXLENBQUM7WUFDOUMsQ0FBQyxDQUFDO1VBQ04sQ0FBQztVQS9CRGpDLE9BQU8sQ0FBQ2tDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQztVQUNsQztVQUNBLElBQU1DLE9BQU8sR0FBR3hGLFFBQVEsQ0FBQ0ksYUFBYSxDQUFDLEtBQUssQ0FBQztVQUM3QztVQUNBb0YsT0FBTyxDQUFDQyxZQUFZLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQztVQUMxQ0QsT0FBTyxDQUFDQyxZQUFZLENBQ2xCLE9BQU8sRUFDUCwyREFDRixDQUFDO1VBQ0RELE9BQU8sQ0FBQ2xGLFNBQVMsNmtCQVNlO1VBQ2hDc0UsWUFBWSxDQUFDcEUsV0FBVyxDQUFDZ0YsT0FBTyxDQUFDLENBQUMsQ0FBQztVQUNuQztVQUNBLElBQU1GLFdBQVcsR0FBR1AsUUFBUSxDQUFDVyxPQUFPLENBQUMsQ0FBQztVQUN0QyxJQUFNTCxhQUFhLEdBQUdOLFFBQVEsQ0FBQ1ksU0FBUyxDQUFDLENBQUM7VUFVMUNULFNBQVMsQ0FBQyxDQUFDO1VBQ1hVLGFBQWEsQ0FBQ2YsWUFBWSxDQUFDO1FBQzdCO01BQ0YsQ0FBQyxFQUFFLEdBQUcsQ0FBQztJQUNULENBQUM7SUFBQSxJQUVRZ0Isa0JBQWtCLEdBQTNCLFNBQVNBLGtCQUFrQkEsQ0FBQ0MsR0FBRyxFQUFFQyxHQUFHLEVBQUU7TUFDcEMsSUFBSSxDQUFDRCxHQUFHLElBQUlFLE9BQUEsQ0FBT0YsR0FBRyxNQUFLLFFBQVEsRUFBRTtRQUNuQyxNQUFNLElBQUlHLEtBQUssQ0FBQywwQkFBMEIsQ0FBQztNQUM3QztNQUNBLElBQUksT0FBT0YsR0FBRyxLQUFLLFFBQVEsRUFBRTtRQUMzQixNQUFNLElBQUlFLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQztNQUM1RDtNQUNBLElBQU1DLFlBQVksR0FBR0gsR0FBRyxDQUFDSSxXQUFXLENBQUMsQ0FBQztNQUN0QyxLQUFLLElBQU1DLE1BQU0sSUFBSU4sR0FBRyxFQUFFO1FBQ3hCLElBQ0VPLE1BQU0sQ0FBQ0MsU0FBUyxDQUFDQyxjQUFjLENBQUNDLElBQUksQ0FBQ1YsR0FBRyxFQUFFTSxNQUFNLENBQUMsSUFDakRBLE1BQU0sQ0FBQ0QsV0FBVyxDQUFDLENBQUMsS0FBS0QsWUFBWSxFQUNyQztVQUNBLE9BQU9FLE1BQU07UUFDZjtNQUNGO01BQ0EsT0FBT0ssU0FBUztJQUNsQixDQUFDO0lBQUEsSUFFUUMsOEJBQThCLEdBQXZDLFNBQVNBLDhCQUE4QkEsQ0FBQ0MsUUFBUSxFQUFFO01BQ2hELElBQUlDLE1BQU0sR0FBRyxFQUFFO01BQ2YsS0FBSyxJQUFJaEUsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHK0QsUUFBUSxDQUFDaEUsTUFBTSxFQUFFQyxDQUFDLEVBQUUsRUFBRTtRQUN4QyxJQUFNaUUsV0FBVyxHQUFHRixRQUFRLENBQUNHLE1BQU0sQ0FBQ2xFLENBQUMsQ0FBQztRQUN0QyxJQUFJaUUsV0FBVyxLQUFLQSxXQUFXLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEVBQUU7VUFDN0NILE1BQU0sSUFBSSxHQUFHLEdBQUdDLFdBQVcsQ0FBQ1YsV0FBVyxDQUFDLENBQUM7UUFDM0MsQ0FBQyxNQUFNO1VBQ0xTLE1BQU0sSUFBSUMsV0FBVztRQUN2QjtNQUNGO01BRUEsT0FBT0QsTUFBTTtJQUNmLENBQUM7SUFBQSxJQW1EUUksWUFBWSxHQUFyQixTQUFTQSxZQUFZQSxDQUFBLEVBQUc7TUFDdEJqSCxDQUFDLENBQUNrSCxHQUFHLENBQUNDLElBQUksRUFBRSxVQUFVQyxZQUFZLEVBQUU7UUFDbEMsSUFBTUMsSUFBSSxHQUFHaEYsY0FBYyxDQUFDK0UsWUFBWSxDQUFDO1FBQ3pDLElBQUlDLElBQUksRUFBRTtVQUNSQyxTQUFTLEdBQUdDLFNBQVMsQ0FBQ0YsSUFBSSxFQUFFLElBQUksQ0FBQztVQUNqQ3JILENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FDVHdILE9BQU8sQ0FBQyxDQUFDLENBQ1RDLElBQUksQ0FBQyxZQUFZO1lBQ2hCekgsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDMEgsT0FBTyxDQUFDLFlBQVk7Y0FDbEMxSCxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMySCxXQUFXLENBQUMsRUFBRSxDQUFDO1lBQ2pDLENBQUMsQ0FBQztVQUNKLENBQUMsQ0FBQztVQUNKO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7UUFDRjtNQUNGLENBQUMsQ0FBQztJQUNKLENBQUM7SUFBQSxJQUVRQyxjQUFjLEdBQXZCLFNBQVNBLGNBQWNBLENBQUNDLE1BQU0sRUFBRTtNQUM5QixJQUFNQyxLQUFLLEdBQUcsQ0FDWixvQkFBb0IsRUFDcEIsY0FBYyxFQUNkLGtCQUFrQixFQUNsQixxQkFBcUIsRUFDckIsc0JBQXNCLEVBQ3RCLHlCQUF5QixFQUN6Qiw0QkFBNEIsRUFDNUIsdUJBQXVCLEVBQ3ZCLHdCQUF3QixFQUN4QixlQUFlLEVBQ2YsVUFBVSxFQUNWLGNBQWMsQ0FDZjtNQUVEQSxLQUFLLENBQUNDLE9BQU8sQ0FBQyxVQUFDQyxTQUFTLEVBQUs7UUFDM0IsSUFBSUgsTUFBTSxDQUFDRyxTQUFTLENBQUMsRUFBRTtVQUNyQkgsTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQ0MsWUFBWSxDQUFDLENBQUM7UUFDbEM7TUFDRixDQUFDLENBQUM7SUFDSixDQUFDO0lBQUEsSUFFUUMsY0FBYyxHQUF2QixTQUFTQSxjQUFjQSxDQUFDWixTQUFTLEVBQUVPLE1BQU0sRUFBRTtNQUN6QyxJQUFNQyxLQUFLLEdBQUcsQ0FDWixvQkFBb0I7TUFDcEI7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQUEsQ0FDRDtNQUVEQSxLQUFLLENBQUNDLE9BQU8sQ0FBQyxVQUFDQyxTQUFTLEVBQUs7UUFDM0IsSUFBSUgsTUFBTSxDQUFDRyxTQUFTLENBQUMsRUFBRTtVQUNyQixJQUFJO1lBQ0YsSUFBSSxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQ25ILFFBQVEsQ0FBQ21ILFNBQVMsQ0FBQyxFQUFFO2NBQ3BEVixTQUFTLENBQUNhLFFBQVEsQ0FBQ04sTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQztjQUNyQ1YsU0FBUyxDQUFDakMsT0FBTyxDQUNmLENBQUMrQyxVQUFVLENBQUNDLGNBQWMsQ0FBQyxFQUFFRCxVQUFVLENBQUNFLGNBQWMsQ0FBQyxDQUFDLEVBQ3hELENBQ0YsQ0FBQztZQUNILENBQUMsTUFBTTtjQUNMVCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDTyxLQUFLLENBQUNqQixTQUFTLENBQUM7Y0FDbENBLFNBQVMsQ0FBQ2pDLE9BQU8sQ0FDZixDQUFDK0MsVUFBVSxDQUFDQyxjQUFjLENBQUMsRUFBRUQsVUFBVSxDQUFDRSxjQUFjLENBQUMsQ0FBQyxFQUN4RCxDQUNGLENBQUM7WUFDSDtVQUNGLENBQUMsQ0FBQyxPQUFPRSxDQUFDLEVBQUU7WUFDVmxGLE9BQU8sQ0FBQ0MsS0FBSyx1QkFBQWtGLE1BQUEsQ0FBdUJULFNBQVMsUUFBS1EsQ0FBQyxDQUFDO1VBQ3REO1FBQ0Y7TUFDRixDQUFDLENBQUM7TUFFRixPQUFPbEIsU0FBUztJQUNsQixDQUFDO0lBQUEsSUFFUW9CLFVBQVUsR0FBbkIsU0FBU0EsVUFBVUEsQ0FBQzVHLFFBQVEsRUFBRTtNQUM1QixJQUFJO1FBQ0YsSUFBTTZHLFFBQVEsR0FBRztVQUNmLGFBQWEsRUFBRUMsQ0FBQyxDQUFDQyxTQUFTLENBQ3hCLG9EQUFvRCxFQUNwRDtZQUNFQyxXQUFXLEVBQUUsUUFBUTtZQUNyQkMsT0FBTyxFQUFFO1VBQ1gsQ0FDRixDQUFDO1VBQ0Qsa0JBQWtCLEVBQUVILENBQUMsQ0FBQ0MsU0FBUyxDQUM3QixvREFBb0QsRUFDcEQ7WUFDRUMsV0FBVyxFQUFFLFFBQVE7WUFDckJDLE9BQU8sRUFBRTtVQUNYLENBQ0YsQ0FBQztVQUNELGtCQUFrQixFQUFFSCxDQUFDLENBQUNDLFNBQVMsQ0FDN0Isa0tBQWtLLEVBQ2xLO1lBQ0VDLFdBQVcsRUFBRSxRQUFRO1lBQ3JCQyxPQUFPLEVBQUU7VUFDWCxDQUNGO1FBQ0YsQ0FBQztRQUNESixRQUFRLENBQUMsYUFBYSxDQUFDLENBQUNKLEtBQUssQ0FBQ2pCLFNBQVMsQ0FBQztRQUN4Q3NCLENBQUMsQ0FBQ0ksT0FBTyxDQUNOQyxVQUFVLENBQUM7VUFDVkMsUUFBUSxFQUFFLFVBQVU7VUFDcEJDLEtBQUssRUFBRSxhQUFhO1VBQ3BCQyxXQUFXLEVBQUUsa0JBQWtCO1VBQy9CQyxtQkFBbUIsRUFBRTtRQUN2QixDQUFDLENBQUMsQ0FDRGQsS0FBSyxDQUFDakIsU0FBUyxDQUFDO1FBRW5CckYsbUJBQW1CLENBQUNILFFBQVEsQ0FBQztRQUU3QjJCLGFBQWEsR0FBR21GLENBQUMsQ0FBQ0ksT0FBTyxDQUFDbkIsTUFBTSxDQUFDYyxRQUFRLENBQUMsQ0FBQ0osS0FBSyxDQUFDakIsU0FBUyxDQUFDO1FBRTNEOUQsa0JBQWtCLENBQUNDLGFBQWEsQ0FBQztNQUNuQyxDQUFDLENBQUMsT0FBTytFLENBQUMsRUFBRTtRQUNWbEYsT0FBTyxDQUFDQyxLQUFLLENBQUNpRixDQUFDLENBQUM7TUFDbEI7TUFDQSxPQUFPLENBQUNsQixTQUFTLEVBQUU3RCxhQUFhLENBQUM7SUFDbkMsQ0FBQztJQUFBLElBdXJDUTZGLFdBQVcsR0FBcEIsU0FBU0EsV0FBV0EsQ0FBQ0MsU0FBUyxFQUFFM0UsR0FBRyxFQUFFO01BQ25DQSxHQUFHLENBQUM0RSxTQUFTLENBQUMsVUFBVUMsS0FBSyxFQUFFO1FBQzdCLElBQUlDLFlBQVk7UUFDaEIsUUFBUUgsU0FBUyxDQUFDSSxJQUFJO1VBQ3BCLEtBQUtqRCxTQUFTO1lBQ1pnRCxZQUFZLEdBQUdILFNBQVMsQ0FBQ0ssT0FBTyxDQUFDRCxJQUFJO1lBQ3JDO1VBQ0Y7WUFDRUQsWUFBWSxHQUFHSCxTQUFTLENBQUNJLElBQUk7UUFDakM7UUFFQSxRQUFRRixLQUFLLENBQUNFLElBQUk7VUFDaEIsS0FBS2pELFNBQVM7WUFDWixJQUFJK0MsS0FBSyxDQUFDRyxPQUFPLENBQUNELElBQUksS0FBS0QsWUFBWSxFQUFFO2NBQ3ZDOUUsR0FBRyxDQUFDaUYsV0FBVyxDQUFDSixLQUFLLENBQUM7Y0FDdEJoRyxhQUFhLENBQUNvRyxXQUFXLENBQUNKLEtBQUssQ0FBQztjQUNoQ0YsU0FBUyxDQUFDaEIsS0FBSyxDQUFDM0QsR0FBRyxDQUFDO2NBQ3BCbkIsYUFBYSxDQUFDcUcsVUFBVSxDQUFDUCxTQUFTLEVBQUVBLFNBQVMsQ0FBQ0ssT0FBTyxDQUFDRCxJQUFJLENBQUM7WUFDN0Q7WUFDQTtVQUNGO1lBQ0UsSUFBSUYsS0FBSyxDQUFDRSxJQUFJLEtBQUtELFlBQVksRUFBRTtjQUMvQjlFLEdBQUcsQ0FBQ2lGLFdBQVcsQ0FBQ0osS0FBSyxDQUFDO2NBQ3RCaEcsYUFBYSxDQUFDb0csV0FBVyxDQUFDSixLQUFLLENBQUM7Y0FDaENGLFNBQVMsQ0FBQ2hCLEtBQUssQ0FBQzNELEdBQUcsQ0FBQztjQUNwQm5CLGFBQWEsQ0FBQ3FHLFVBQVUsQ0FBQ1AsU0FBUyxFQUFFQSxTQUFTLENBQUNJLElBQUksQ0FBQztZQUNyRDtRQUNKO01BQ0YsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUFBLElBRVFwQyxTQUFTLEdBQWxCLFNBQVNBLFNBQVNBLENBQUN3QyxjQUFjLEVBQTJCO01BQUEsSUFBekJDLGVBQWUsR0FBQUMsU0FBQSxDQUFBckgsTUFBQSxRQUFBcUgsU0FBQSxRQUFBdkQsU0FBQSxHQUFBdUQsU0FBQSxNQUFHLEtBQUs7TUFDeEQsSUFBQUMsY0FBQSxHQUNFQyxhQUFhLENBQUNKLGNBQWMsQ0FBQztRQUFBSyxlQUFBLEdBQUFDLGNBQUEsQ0FBQUgsY0FBQTtRQUR4QkksMkNBQTJDLEdBQUFGLGVBQUE7UUFBRUcsaUJBQWlCLEdBQUFILGVBQUE7TUFFckUsSUFBSUcsaUJBQWlCLEtBQUssSUFBSSxFQUFFO1FBQzlCLElBQUlQLGVBQWUsS0FBSyxLQUFLLEVBQUU7VUFDN0IxRyxPQUFPLENBQUNrQyxHQUFHLG1CQUFBaUQsTUFBQSxDQUFtQm5DLE1BQU0sQ0FBQ2tFLElBQUksQ0FBQ0YsMkNBQTJDLENBQUMsQ0FBRSxDQUFDO1VBQ3pGLElBQUl6QyxNQUFNLEdBQUc0QyxpQkFBaUIsQ0FDNUJDLGVBQWUsRUFDZkosMkNBQTJDLEVBQzNDSyxlQUNGLENBQUM7VUFDRHJFLE1BQU0sQ0FBQ3NFLE1BQU0sQ0FBQy9DLE1BQU0sQ0FBQyxDQUFDakQsR0FBRyxDQUFDLFVBQUN4RCxPQUFPO1lBQUEsT0FDaENrSSxXQUFXLENBQUNsSSxPQUFPLEVBQUVrRyxTQUFTLENBQUM7VUFBQSxDQUNqQyxDQUFDO1VBQ0QsT0FBT08sTUFBTTtRQUNmLENBQUMsTUFBTTtVQUNMUCxTQUFTLEdBQUdtRCxpQkFBaUIsQ0FDM0JDLGVBQWUsRUFDZkosMkNBQTJDLEVBQzNDSyxlQUFlLEVBQ2ZYLGVBQ0YsQ0FBQztVQUNELE9BQU8xQyxTQUFTO1FBQ2xCO01BQ0YsQ0FBQyxNQUFNO1FBQ0xoRSxPQUFPLENBQUNrQyxHQUFHLENBQUMsMEJBQTBCLENBQUM7TUFDekM7SUFDRixDQUFDO0lBQUEsSUFFUTJFLGFBQWEsR0FBdEIsU0FBU0EsYUFBYUEsQ0FBQzlDLElBQUksRUFBRTtNQUMzQixJQUFJaUQsMkNBQTJDLEdBQUcsQ0FBQyxDQUFDO01BQ3BELElBQUlDLGlCQUFpQjtNQUVyQmpFLE1BQU0sQ0FBQ2tFLElBQUksQ0FBQ25ELElBQUksQ0FBQyxDQUFDVSxPQUFPLENBQUMsVUFBQzhDLFdBQVcsRUFBSztRQUN6Q1AsMkNBQTJDLENBQUNPLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3RCxJQUFNQyxXQUFXLEdBQUd6RCxJQUFJLENBQUN3RCxXQUFXLENBQUM7UUFDckN2RSxNQUFNLENBQUNrRSxJQUFJLENBQUNNLFdBQVcsQ0FBQyxDQUFDL0MsT0FBTyxDQUFDLFVBQUNnRCxJQUFJLEVBQUs7VUFDekNULDJDQUEyQyxDQUFDTyxXQUFXLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1VBQ25FLElBQU1sRCxNQUFNLEdBQUdpRCxXQUFXLENBQUNDLElBQUksQ0FBQztVQUNoQyxJQUFJekUsTUFBTSxDQUFDa0UsSUFBSSxDQUFDM0MsTUFBTSxDQUFDLENBQUNqRixNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2xDMkgsaUJBQWlCLEdBQUcsSUFBSTtVQUMxQjtVQUNBakUsTUFBTSxDQUFDa0UsSUFBSSxDQUFDM0MsTUFBTSxDQUFDLENBQUNFLE9BQU8sQ0FBQyxVQUFDQyxTQUFTLEVBQUs7WUFDekMsSUFBSWdELFNBQVMsR0FBR25ELE1BQU0sQ0FBQ0csU0FBUyxDQUFDO1lBQ2pDLElBQUkvQixPQUFBLENBQU8rRSxTQUFTLE1BQUssUUFBUSxJQUFJQSxTQUFTLEtBQUssSUFBSSxFQUFFO2NBQ3ZEQSxTQUFTLEdBQUc3SCxJQUFJLENBQUNDLEtBQUssQ0FBQzRILFNBQVMsQ0FBQztZQUNuQztZQUNBLElBQUlDLGNBQWMsR0FBR2pELFNBQVMsQ0FBQ2hCLFdBQVcsQ0FBQyxDQUFDO1lBQzVDLElBQUlrRSxTQUFTLEdBQUdDLGNBQWMsQ0FBQ0YsY0FBYyxDQUFDO1lBQzlDWCwyQ0FBMkMsQ0FBQ08sV0FBVyxDQUFDLENBQUNFLElBQUksQ0FBQyxDQUM1RC9DLFNBQVMsQ0FDVixHQUFHb0QsaUJBQWlCLENBQUNKLFNBQVMsRUFBRUUsU0FBUyxFQUFFbEQsU0FBUyxDQUFDO1VBQ3hELENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztNQUVGLE9BQU8sQ0FBQ3NDLDJDQUEyQyxFQUFFQyxpQkFBaUIsQ0FBQztJQUN6RSxDQUFDO0lBQUEsSUFFUWEsaUJBQWlCLEdBQTFCLFNBQVNBLGlCQUFpQkEsQ0FBQ0MsVUFBVSxFQUFFL0ssSUFBSSxFQUFFMEgsU0FBUyxFQUFFO01BQ3RELElBQUlILE1BQU0sR0FBRyxFQUFFO01BRWYsUUFBUXZILElBQUk7UUFDVixLQUFLLFNBQVM7VUFDWitLLFVBQVUsQ0FBQ3RELE9BQU8sQ0FBQyxVQUFDdUQsU0FBUyxFQUFLO1lBQ2hDLElBQUl0RCxTQUFTLElBQUksdUJBQXVCLEVBQUUsQ0FDMUM7WUFDQSxJQUFJeUIsS0FBSztZQUNULElBQ0UsQ0FDRSxzQkFBc0IsRUFDdEIsNEJBQTRCLEVBQzVCLCtCQUErQixFQUMvQix5QkFBeUIsQ0FDMUIsQ0FBQzVJLFFBQVEsQ0FBQ21ILFNBQVMsQ0FBQyxFQUNyQjtjQUNBLElBQU11RCxhQUFhLEdBQUdDLG1CQUFtQixDQUN2Q0YsU0FBUyxDQUFDRyxjQUFjLEVBQ3hCekQsU0FDRixDQUFDO2NBQ0R5QixLQUFLLEdBQUdiLENBQUMsQ0FBQzhDLE9BQU8sQ0FBQ0osU0FBUyxDQUFDakUsSUFBSSxFQUFFO2dCQUNoQ2pILEtBQUssRUFBRW1MLGFBQWE7Z0JBQ3BCSSxhQUFhLEVBQUVBLGFBQWEsQ0FBQ0osYUFBYSxFQUFFdkQsU0FBUztjQUN2RCxDQUFDLENBQUM7WUFDSixDQUFDLE1BQU07Y0FDTCxJQUFNdUQsY0FBYSxHQUFHQyxtQkFBbUIsQ0FDdkNGLFNBQVMsQ0FBQ00sa0JBQWtCLEVBQzVCNUQsU0FDRixDQUFDO2NBQ0Q2RCxpQkFBaUIsR0FBR3BDLEtBQUssR0FBR2IsQ0FBQyxDQUFDOEMsT0FBTyxDQUFDSixTQUFTLENBQUNqRSxJQUFJLEVBQUU7Z0JBQ3BEc0UsYUFBYSxFQUFFQSxhQUFhLENBQUNKLGNBQWEsRUFBRXZELFNBQVM7Y0FDdkQsQ0FBQyxDQUFDO1lBQ0o7WUFDQSxJQUFJc0QsU0FBUyxDQUFDUSxZQUFZLEVBQUU7Y0FDMUIsSUFBSUMsS0FBSyxHQUFHbkQsQ0FBQyxDQUFDbUQsS0FBSyxDQUFDVCxTQUFTLENBQUNRLFlBQVksQ0FBQ2xDLE9BQU8sQ0FBQztjQUNuRCxJQUFJb0MsT0FBTyxHQUFHVixTQUFTLENBQUNRLFlBQVksQ0FBQ0csSUFBSTtjQUN6QyxJQUNFakUsU0FBUyxJQUFJLDBCQUEwQixJQUN2QzBDLGVBQWUsSUFBSSxJQUFJLEVBQ3ZCO2dCQUNBLElBQUlzQixPQUFPLEdBQUdoTSxDQUFDLENBQUNnTSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLElBQUlFLG1CQUFtQixHQUFHRixPQUFPLENBQUNHLEdBQUcsQ0FBQ0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUQsSUFBSUMsYUFBYSxHQUFHN0osSUFBSSxDQUFDMEosbUJBQW1CLENBQUM7Z0JBQzdDSSxRQUFRLE1BQUE3RCxNQUFBLENBQU0vSCxNQUFNLENBQUNDLFFBQVEsQ0FBQzRMLE1BQU0seUJBQXNCO2dCQUMxRCxJQUFJRCxRQUFRLEdBQUdBLFFBQVEsQ0FBQ0UsT0FBTyxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQztnQkFDOURDLGVBQWUsR0FBR0osYUFBYSxDQUFDRyxPQUFPLENBQ3JDLElBQUlFLE1BQU0sQ0FBQ0osUUFBUSxFQUFFLEdBQUcsQ0FBQyxLQUFBN0QsTUFBQSxDQUN0Qi9ILE1BQU0sQ0FBQ0MsUUFBUSxDQUFDNEwsTUFBTSxPQUFBOUQsTUFBQSxDQUFJaUMsZUFBZSxzQkFDOUMsQ0FBQztnQkFDRCxJQUFJaUMsMkJBQTJCLEdBQUdDLElBQUksQ0FBQ0gsZUFBZSxDQUFDO2dCQUN2RFQsT0FBTyxDQUFDRyxHQUFHLDBDQUFBMUQsTUFBQSxDQUEwQ2tFLDJCQUEyQixDQUFFO2NBQ3BGO2NBQ0FaLEtBQUssQ0FBQ2MsVUFBVSxDQUFDYixPQUFPLENBQUM7Y0FDekJ2QyxLQUFLLENBQUNxRCxTQUFTLENBQUNmLEtBQUssQ0FBQztZQUN4QjtZQUNBLElBQUlULFNBQVMsQ0FBQ3lCLGNBQWMsRUFBRTtjQUM1QixJQUFNQyxtQ0FBbUMsR0FBRztnQkFDMUNDLGtCQUFrQixFQUFFO2tCQUNsQkMsTUFBTSxFQUFFLFFBQVE7a0JBQ2hCQyxPQUFPLEVBQUU7Z0JBQ1gsQ0FBQztnQkFDREMsMEJBQTBCLEVBQUU7a0JBQzFCRixNQUFNLEVBQUUsUUFBUTtrQkFDaEJDLE9BQU8sRUFBRTtnQkFDWCxDQUFDO2dCQUNERSxxQkFBcUIsRUFBRTtrQkFDckJILE1BQU0sRUFBRSxRQUFRO2tCQUNoQkMsT0FBTyxFQUFFO2dCQUNYLENBQUM7Z0JBQ0RHLHNCQUFzQixFQUFFO2tCQUN0QkosTUFBTSxFQUFFLFFBQVE7a0JBQ2hCQyxPQUFPLEVBQUU7Z0JBQ1gsQ0FBQztnQkFDREksNkJBQTZCLEVBQUU7a0JBQzdCTCxNQUFNLEVBQUUsUUFBUTtrQkFDaEJDLE9BQU8sRUFBRTtnQkFDWDtjQUNGLENBQUM7Y0FDRCxJQUNFN0csTUFBTSxDQUFDa0UsSUFBSSxDQUFDd0MsbUNBQW1DLENBQUMsQ0FBQ25NLFFBQVEsQ0FDdkRtSCxTQUNGLENBQUMsRUFDRDtnQkFDQXlCLEtBQUssQ0FBQytELFdBQVcsQ0FDZixVQUFVL0QsS0FBSyxFQUFFO2tCQUNmLElBQUlnRSxHQUFHLEdBQUc3RSxDQUFDLENBQUM4RSxPQUFPLENBQUNDLE1BQU0sQ0FBQyxLQUFLLENBQUM7a0JBRWpDLElBQUlDLFlBQVksR0FBRyxTQUFmQSxZQUFZQSxDQUFJQyxPQUFPO29CQUFBLE9BQ3pCNUgsT0FBQSxDQUFPNEgsT0FBTyxLQUFJLFFBQVEsR0FDdEIxSyxJQUFJLENBQUMySyxTQUFTLENBQUNELE9BQU8sQ0FBQyxHQUN2QkEsT0FBTztrQkFBQTtrQkFDYixJQUFNRSxrQ0FBa0MsR0FDdENmLG1DQUFtQyxDQUFDaEYsU0FBUyxDQUFDO2tCQUNoRCxJQUFJa0YsTUFBTSxHQUFHLENBQUNhLGtDQUFrQyxDQUFDYixNQUFNLENBQUM7a0JBQ3hELElBQUlDLE9BQU8sR0FBRyxDQUFDWSxrQ0FBa0MsQ0FBQ1osT0FBTyxDQUFDO2tCQUMxRCxJQUFJYSxLQUFLLEdBQ1AsU0FBUyxHQUNUQyxNQUFNLENBQ0pmLE1BQU0sQ0FDSHRJLEdBQUcsQ0FDRixVQUFDc0osQ0FBQyxFQUFFckwsQ0FBQztvQkFBQSwwQ0FBQTRGLE1BQUEsQ0FFTDBFLE9BQU8sQ0FBQ3RLLENBQUMsQ0FBQyx5Q0FBQTRGLE1BQUEsQ0FFVm1GLFlBQVksQ0FBQ25FLEtBQUssQ0FBQ29FLE9BQU8sQ0FBQ00sVUFBVSxDQUFDRCxDQUFDLENBQUMsQ0FBQztrQkFBQSxDQUUzQyxDQUFDLENBQ0FFLElBQUksQ0FBQyxFQUFFLENBQ1osQ0FBQyxHQUNELFVBQVU7a0JBQ1pYLEdBQUcsQ0FBQ2xOLFNBQVMsR0FBR3lOLEtBQUs7a0JBRXJCLE9BQU9QLEdBQUc7Z0JBQ1osQ0FBQyxFQUNEO2tCQUNFWSxTQUFTLEVBQUUsZUFBZTtrQkFDMUJDLE1BQU0sRUFBRSxJQUFJO2tCQUNaQyxjQUFjLEVBQUU7b0JBQ2RGLFNBQVMsRUFBRSxlQUFlO29CQUMxQkMsTUFBTSxFQUFFO2tCQUNWO2dCQUNGLENBQ0YsQ0FBQztjQUNILENBQUMsTUFBTTtnQkFDTCxJQUFJRSxPQUFPLEdBQUc1RixDQUFDLENBQUM0RixPQUFPLENBQUNsRCxTQUFTLENBQUN5QixjQUFjLENBQUNuRCxPQUFPLENBQUM7Z0JBQ3pENEUsT0FBTyxDQUFDM0IsVUFBVSxDQUFDdkIsU0FBUyxDQUFDeUIsY0FBYyxDQUFDMEIsSUFBSSxDQUFDO2dCQUNqRGhGLEtBQUssQ0FBQytELFdBQVcsQ0FBQ2dCLE9BQU8sQ0FBQztjQUM1QjtZQUNGO1lBQ0EzRyxNQUFNLENBQUM2RyxJQUFJLENBQUNqRixLQUFLLENBQUM7VUFDcEIsQ0FBQyxDQUFDO1VBQ0Y7UUFDRixLQUFLLFFBQVE7VUFDWCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsV0FBVyxDQUFDLENBQUM1SSxRQUFRLENBQUNtSCxTQUFTLENBQUMsRUFBRTtZQUNsRXFELFVBQVUsQ0FBQ3RELE9BQU8sQ0FBQyxVQUFDdUQsU0FBUyxFQUFLO2NBQ2hDLElBQUk3QixLQUFLLEdBQUdrRixpQkFBaUIsQ0FBQ3JELFNBQVMsRUFBRXRELFNBQVMsQ0FBQztjQUNuREgsTUFBTSxDQUFDNkcsSUFBSSxDQUFDakYsS0FBSyxDQUFDO1lBQ3BCLENBQUMsQ0FBQztVQUNKLENBQUMsTUFBTTtZQUNMNEIsVUFBVSxDQUFDdEQsT0FBTyxDQUFDLFVBQUN1RCxTQUFTLEVBQUs7Y0FDaEMsSUFBSTdCLEtBQUssR0FBR2tGLGlCQUFpQixDQUFDckQsU0FBUyxDQUFDO2NBQ3hDekQsTUFBTSxDQUFDNkcsSUFBSSxDQUFDakYsS0FBSyxDQUFDO1lBQ3BCLENBQUMsQ0FBQztVQUNKO1VBQ0E7UUFDRixLQUFLLFdBQVc7UUFDaEIsS0FBSyxrQkFBa0I7VUFDckI0QixVQUFVLENBQUN0RCxPQUFPLENBQUMsVUFBQ3VELFNBQVMsRUFBSztZQUNoQyxJQUFJN0IsS0FBSyxHQUFHbUYsc0JBQXNCLENBQUN0RCxTQUFTLENBQUM7WUFDN0N6RCxNQUFNLENBQUM2RyxJQUFJLENBQUNqRixLQUFLLENBQUM7VUFDcEIsQ0FBQyxDQUFDO1VBQ0Y7UUFDRjtVQUNFbkcsT0FBTyxDQUFDdUwsSUFBSSxDQUFDLHVCQUF1QixFQUFFdk8sSUFBSSxDQUFDO01BQy9DO01BRUEsSUFBSUEsSUFBSSxJQUFJLFFBQVEsRUFBRTtRQUNwQixPQUFPdUgsTUFBTTtNQUNmLENBQUMsTUFBTTtRQUNMLE9BQU9BLE1BQU07TUFDZjtJQUNGLENBQUM7SUFBQSxJQUVRK0csc0JBQXNCLEdBQS9CLFNBQVNBLHNCQUFzQkEsQ0FBQ3ZILElBQUksRUFBRTtNQUNwQyxPQUFPdUIsQ0FBQyxDQUFDQyxTQUFTLENBQUN4QixJQUFJLENBQUN5SCxLQUFLLEVBQUV6SCxJQUFJLENBQUN1QyxPQUFPLENBQUM7SUFDOUMsQ0FBQztJQUFBLElBRVErRSxpQkFBaUIsR0FBMUIsU0FBU0EsaUJBQWlCQSxDQUFDSSxVQUFVLEVBQWtCO01BQUEsSUFBaEIvRyxTQUFTLEdBQUFpQyxTQUFBLENBQUFySCxNQUFBLFFBQUFxSCxTQUFBLFFBQUF2RCxTQUFBLEdBQUF1RCxTQUFBLE1BQUcsRUFBRTtNQUNuRCxJQUFNK0UsSUFBSSxHQUFHQyxlQUFlLENBQzFCRixVQUFVLENBQUNDLElBQUksRUFDZkQsVUFBVSxDQUFDRyxVQUFVLEVBQ3JCbEgsU0FDRixDQUFDO01BQ0QsSUFBTW1ILGNBQWMsR0FBR3ZHLENBQUMsQ0FBQ3dHLE1BQU0sQ0FBQ0wsVUFBVSxDQUFDcE8sUUFBUSxFQUFFb08sVUFBVSxDQUFDbkYsT0FBTyxDQUFDO01BQ3hFdUYsY0FBYyxDQUFDRSxPQUFPLENBQUNMLElBQUksQ0FBQztNQUU1QixJQUFJRCxVQUFVLENBQUNoRCxLQUFLLEVBQUU7UUFDcEIsSUFBSUMsT0FBTyxHQUFHaE0sQ0FBQyxDQUFDK08sVUFBVSxDQUFDaEQsS0FBSyxDQUFDRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekMsSUFBSUYsS0FBSyxHQUFHbkQsQ0FBQyxDQUFDbUQsS0FBSyxDQUFDZ0QsVUFBVSxDQUFDaEQsS0FBSyxDQUFDbkMsT0FBTyxDQUFDO1FBQzdDbUMsS0FBSyxDQUFDYyxVQUFVLENBQUNiLE9BQU8sQ0FBQztRQUN6Qm1ELGNBQWMsQ0FBQ3JDLFNBQVMsQ0FBQ2YsS0FBSyxDQUFDO01BQ2pDO01BRUEsSUFBSWdELFVBQVUsQ0FBQ1AsT0FBTyxFQUFFO1FBQ3RCLElBQUlBLE9BQU8sR0FBRzVGLENBQUMsQ0FBQzRGLE9BQU8sQ0FBQ08sVUFBVSxDQUFDUCxPQUFPLENBQUM1RSxPQUFPLENBQUM7UUFDbkQ0RSxPQUFPLENBQUMzQixVQUFVLENBQUNrQyxVQUFVLENBQUNQLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDO1FBQzNDVSxjQUFjLENBQUMzQixXQUFXLENBQUNnQixPQUFPLENBQUM7TUFDckM7TUFFQSxPQUFPVyxjQUFjO0lBQ3ZCLENBQUM7SUFBQSxJQUVRRixlQUFlLEdBQXhCLFNBQVNBLGVBQWVBLENBQUNLLFFBQVEsRUFBRUMsU0FBUyxFQUFrQjtNQUFBLElBQWhCdkgsU0FBUyxHQUFBaUMsU0FBQSxDQUFBckgsTUFBQSxRQUFBcUgsU0FBQSxRQUFBdkQsU0FBQSxHQUFBdUQsU0FBQSxNQUFHLEVBQUU7TUFDMUQsSUFBSSxDQUFDcUYsUUFBUSxFQUFFLE9BQU8sSUFBSTtNQUUxQixRQUFRQyxTQUFTO1FBQ2YsS0FBSyxhQUFhO1VBQ2hCLElBQUl2SCxTQUFTLElBQUksMkJBQTJCLEVBQUU7WUFDNUNzSCxRQUFRLENBQUMxRixPQUFPLENBQUNvRixJQUFJLEdBQUcsT0FBTztZQUMvQk0sUUFBUSxDQUFDMUYsT0FBTyxDQUFDNEYsTUFBTSxHQUFHLElBQUk7VUFDaEMsQ0FBQyxNQUFNLElBQUlGLFFBQVEsQ0FBQzFGLE9BQU8sQ0FBQ29GLElBQUksSUFBSSxNQUFNLEVBQUU7WUFDMUNNLFFBQVEsQ0FBQzFGLE9BQU8sQ0FBQzRGLE1BQU0sR0FBRyxJQUFJO1VBQ2hDO1VBQ0EsT0FBTzVHLENBQUMsQ0FBQzZHLGNBQWMsQ0FBQ1QsSUFBSSxDQUFDTSxRQUFRLENBQUMxRixPQUFPLENBQUM7UUFDaEQsS0FBSyw0QkFBNEI7VUFDL0IsT0FBT2hCLENBQUMsQ0FBQ29HLElBQUksQ0FBQztZQUNaVSxPQUFPLEVBQUVKLFFBQVEsQ0FBQzFGLE9BQU8sQ0FBQzhGLE9BQU87WUFDakNDLFFBQVEsRUFBRUwsUUFBUSxDQUFDMUYsT0FBTyxDQUFDK0Y7VUFDN0IsQ0FBQyxDQUFDO01BQ047SUFDRixDQUFDO0lBQUEsSUFFUWhFLGFBQWEsR0FBdEIsU0FBU0EsYUFBYUEsQ0FBQ0osYUFBYSxFQUFFdkQsU0FBUyxFQUFFO01BQy9DLE9BQU8sVUFBVTZGLE9BQU8sRUFBRXBFLEtBQUssRUFBRTtRQUMvQixJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQzVJLFFBQVEsQ0FBQ21ILFNBQVMsQ0FBQyxFQUFFO1VBQ3BEeUIsS0FBSyxDQUFDbUcsRUFBRSxDQUFDO1lBQ1BDLEtBQUssRUFBRSxTQUFBQSxNQUFVckgsQ0FBQyxFQUFFO2NBQ2xCLElBQUksT0FBT0EsQ0FBQyxDQUFDc0gsTUFBTSxDQUFDQyxTQUFTLEtBQUssVUFBVSxFQUFFO2dCQUM1Q3pJLFNBQVMsQ0FBQzBJLFNBQVMsQ0FBQ3hILENBQUMsQ0FBQ3NILE1BQU0sQ0FBQ0MsU0FBUyxDQUFDLENBQUMsQ0FBQztjQUMzQyxDQUFDLE1BQU0sSUFBSSxPQUFPdkgsQ0FBQyxDQUFDc0gsTUFBTSxDQUFDRyxTQUFTLEtBQUssVUFBVSxFQUFFO2dCQUNuRCxJQUFJQyxJQUFJLEdBQUc1SSxTQUFTLENBQUMzQixPQUFPLENBQUMsQ0FBQztnQkFDOUJ1SyxJQUFJLEdBQUdBLElBQUksR0FBRyxFQUFFLEdBQUdBLElBQUksR0FBR0EsSUFBSSxHQUFHLENBQUM7Z0JBQ2xDNUksU0FBUyxDQUFDNkksS0FBSyxDQUFDM0gsQ0FBQyxDQUFDc0gsTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQyxFQUFFQyxJQUFJLENBQUM7Y0FDN0M7WUFDRjtVQUNGLENBQUMsQ0FBQztRQUNKLENBQUMsTUFBTSxJQUNMLENBQ0Usc0JBQXNCLEVBQ3RCLHlCQUF5QixFQUN6Qiw0QkFBNEIsRUFDNUIsK0JBQStCLENBQ2hDLENBQUNyUCxRQUFRLENBQUNtSCxTQUFTLENBQUMsRUFDckI7VUFDQXlCLEtBQUssQ0FBQ21HLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNkLENBQUMsTUFBTSxJQUNMLENBQ0UsZUFBZSxFQUNmLG9CQUFvQixFQUNwQix1QkFBdUIsRUFDdkIsd0JBQXdCLENBQ3pCLENBQUMvTyxRQUFRLENBQUNtSCxTQUFTLENBQUMsRUFDckI7VUFDQXlCLEtBQUssQ0FBQ21HLEVBQUUsQ0FBQztZQUNQUSxRQUFRLEVBQUUsU0FBQUEsU0FBVTVILENBQUMsRUFBRTtjQUNyQixJQUFJLE9BQU9BLENBQUMsQ0FBQ3NILE1BQU0sQ0FBQ08sUUFBUSxLQUFLLFVBQVUsRUFBRTtnQkFDM0N4RSxpQkFBaUIsQ0FBQ3lFLFVBQVUsQ0FBQzlILENBQUMsQ0FBQ3NILE1BQU0sQ0FBQztjQUN4QztZQUNGLENBQUM7WUFDRFMsU0FBUyxFQUFFLFNBQUFBLFVBQVUvSCxDQUFDLEVBQUU7Y0FDdEIsSUFBSSxPQUFPQSxDQUFDLENBQUNzSCxNQUFNLENBQUNPLFFBQVEsS0FBSyxVQUFVLEVBQUU7Z0JBQzNDLElBQU1HLGNBQWMsR0FBR2pGLGFBQWEsQ0FBQy9DLENBQUMsQ0FBQ3NILE1BQU0sQ0FBQ2pDLE9BQU8sQ0FBQztnQkFDdERyRixDQUFDLENBQUNzSCxNQUFNLENBQUNPLFFBQVEsQ0FBQ0csY0FBYyxDQUFDO2NBQ25DO1lBQ0Y7VUFDRixDQUFDLENBQUM7UUFDSjtNQUNGLENBQUM7SUFDSCxDQUFDO0lBQUEsSUFFUWhGLG1CQUFtQixHQUE1QixTQUFTQSxtQkFBbUJBLENBQUNpRixRQUFRLEVBQUV6SSxTQUFTLEVBQUU7TUFDaEQsSUFBSSxDQUFDeUksUUFBUSxFQUFFO1FBQ2IsT0FBTyxJQUFJO01BQ2I7TUFFQSxJQUFJQSxRQUFRLENBQUNDLFlBQVksRUFBRTtRQUN6QixPQUFPQyw2QkFBNkIsQ0FBQzNJLFNBQVMsQ0FBQztNQUNqRDtNQUVBLElBQUl5SSxRQUFRLENBQUNHLFdBQVcsRUFBRTtRQUN4QixJQUFNQyxZQUFZLEdBQUdyRixtQkFBbUIsQ0FDdEM7VUFBRWtGLFlBQVksRUFBRSxJQUFJO1VBQUUvRyxJQUFJLEVBQUU4RyxRQUFRLENBQUNLO1FBQUssQ0FBQyxFQUMzQzlJLFNBQ0YsQ0FBQztRQUVELElBQU0rSSx3QkFBd0IsR0FBRyxTQUEzQkEsd0JBQXdCQSxDQUFhQyxZQUFZLEVBQUU7VUFDdkQsT0FBTyxVQUFVbkQsT0FBTyxFQUFFO1lBQ3hCLE9BQU9nRCxZQUFZLENBQUNoRCxPQUFPLEVBQUVtRCxZQUFZLENBQUM7VUFDNUMsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPRCx3QkFBd0IsQ0FBQ04sUUFBUSxDQUFDUSxRQUFRLENBQUM7TUFDcEQ7TUFFQSxPQUFPLElBQUk7SUFDYixDQUFDO0lBQUEsSUFFUUMsZUFBZSxHQUF4QixTQUFTQSxlQUFlQSxDQUFDQyxHQUFHLEVBQUU7TUFDNUIsT0FBT0EsR0FBRyxDQUNQQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQ2hCNUUsT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUMvQnBHLFdBQVcsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7SUF4OURELElBQU1pTCxZQUFZLEdBQUcsT0FBTztJQUM1QixJQUFNQyxlQUFlLEdBQUcsU0FBUztJQUNqQyxJQUFJaEssU0FBUyxHQUFHc0IsQ0FBQyxDQUFDaEUsR0FBRyxDQUFDLEtBQUssQ0FBQztJQUM1QixJQUFJbkIsYUFBYTtJQUNqQixJQUFJb0ksaUJBQWlCO0lBQ3JCLElBQUlwQixpQkFBaUI7SUFzQnBCO0lBcURBO0lBT0E7SUFnQkE7SUE4Q0E7SUE0Q0E7SUFtQkE7SUFjQTtJQUVEN0IsQ0FBQyxDQUFDMkksaUJBQWlCLEdBQUczSSxDQUFDLENBQUM0SSxZQUFZLENBQUNDLE1BQU0sQ0FBQztNQUMxQ0MsVUFBVSxFQUFFLFNBQUFBLFdBQVUvSCxJQUFJLEVBQUU5QixNQUFNLEVBQUU7UUFDbENlLENBQUMsQ0FBQzRJLFlBQVksQ0FBQ2pMLFNBQVMsQ0FBQ21MLFVBQVUsQ0FBQ2pMLElBQUksQ0FBQyxJQUFJLEVBQUVvQixNQUFNLENBQUM7UUFDdEQsSUFBSSxDQUFDOEIsSUFBSSxHQUFHQSxJQUFJO01BQ2xCO0lBQ0YsQ0FBQyxDQUFDO0lBRUYsSUFBSTtNQUNGLElBQU1nSSxXQUFXLEdBQUdDLFNBQVMsQ0FBQ0MsSUFBSSxDQUFDUixZQUFZLEVBQUUsQ0FBQyxDQUFDO01BQ25ETSxXQUFXLENBQUNHLGVBQWUsR0FBRyxVQUFVdlEsS0FBSyxFQUFFO1FBQzdDLElBQU13USxFQUFFLEdBQUd4USxLQUFLLENBQUN1TyxNQUFNLENBQUNqSixNQUFNO1FBQzlCLElBQUksQ0FBQ2tMLEVBQUUsQ0FBQ0MsZ0JBQWdCLENBQUNDLFFBQVEsQ0FBQ1gsZUFBZSxDQUFDLEVBQUU7VUFDbERTLEVBQUUsQ0FBQ0csaUJBQWlCLENBQUNaLGVBQWUsRUFBRTtZQUFFYSxPQUFPLEVBQUU7VUFBSyxDQUFDLENBQUM7UUFDMUQ7TUFDRixDQUFDO01BQ0RSLFdBQVcsQ0FBQ1MsU0FBUyxHQUFHLFVBQVU3USxLQUFLLEVBQUU7UUFDdkMsSUFBTXdRLEVBQUUsR0FBR3hRLEtBQUssQ0FBQ3VPLE1BQU0sQ0FBQ2pKLE1BQU07UUFDOUIsSUFBTXdMLFdBQVcsR0FBR04sRUFBRSxDQUFDTSxXQUFXLENBQUNmLGVBQWUsRUFBRSxVQUFVLENBQUM7UUFDL0QsSUFBTWdCLFdBQVcsR0FBR0QsV0FBVyxDQUFDQyxXQUFXLENBQUNoQixlQUFlLENBQUM7UUFDNUQsSUFBTWlCLFVBQVUsR0FBR0QsV0FBVyxDQUFDcEwsR0FBRyxDQUFDc0wsUUFBUSxDQUFDQyxLQUFLLENBQUMsQ0FBQztRQUVuREYsVUFBVSxDQUFDSCxTQUFTLEdBQUcsWUFBWTtVQUNqQyxJQUFJRyxVQUFVLENBQUMxTCxNQUFNLEVBQUU7WUFDckJ2RCxPQUFPLENBQUNrQyxHQUFHLGtCQUFBaUQsTUFBQSxDQUNROEosVUFBVSxDQUFDMUwsTUFBTSxDQUFDNkwsSUFBSSx1QkFBQWpLLE1BQUEsQ0FBb0JrSyxPQUFPLENBQ3BFLENBQUM7VUFDSDtVQUNBLElBQUlKLFVBQVUsQ0FBQzFMLE1BQU0sSUFBSTBMLFVBQVUsQ0FBQzFMLE1BQU0sQ0FBQzZMLElBQUksS0FBS0MsT0FBTyxFQUFFO1lBQzNELElBQU1DLGFBQWEsR0FBR0wsVUFBVSxDQUFDMUwsTUFBTSxDQUFDb0YsSUFBSTtZQUM1Q2pNLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQ2lNLElBQUksQ0FBQzJHLGFBQWEsQ0FBQztZQUNoQzVTLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FDVHdILE9BQU8sQ0FBQyxDQUFDLENBQ1RDLElBQUksQ0FBQyxZQUFZO2NBQ2hCekgsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDMEgsT0FBTyxDQUFDLFlBQVk7Z0JBQ2xDMUgsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDMkgsV0FBVyxDQUFDLEVBQUUsQ0FBQztjQUNqQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUM7VUFDTixDQUFDLE1BQU07WUFDTFYsWUFBWSxDQUFDLENBQUM7VUFDaEI7UUFDRixDQUFDO1FBQ0RvTCxXQUFXLENBQUNRLFVBQVUsR0FBRyxZQUFZO1VBQ25DZCxFQUFFLENBQUNlLEtBQUssQ0FBQyxDQUFDO1FBQ1osQ0FBQztNQUNILENBQUM7SUFDSCxDQUFDLENBQUMsT0FBT3ZQLEtBQUssRUFBRTtNQUNkRCxPQUFPLENBQUNrQyxHQUFHLENBQUNqQyxLQUFLLENBQUM7SUFDcEI7SUFBQztJQThCQTtJQXVCQTtJQTZDQTtJQThDQTtJQUVELElBQUl3UCxRQUFRLEtBQUssY0FBYyxFQUFFO01BMlkvQjtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7TUFSTSxJQVNTQyxhQUFhLEdBQXRCLFNBQVNBLGFBQWFBLENBQ3BCQyxTQUFTLEVBQ1RDLFlBQVksRUFDWkMsd0JBQXdCLEVBQ3hCcEksSUFBSSxFQUNKcUksZUFBZSxFQUNmQyxjQUFjLEVBQ2Q7UUFDQSxTQUFTQyxZQUFZQSxDQUFDRCxjQUFjLEVBQUVFLE9BQU8sRUFBRXhJLElBQUksRUFBRW9JLHdCQUF3QixFQUFFO1VBQzdFLElBQUlLLEtBQUssR0FBR0gsY0FBYyxDQUFDRSxPQUFPLENBQUMsQ0FBQ3hJLElBQUksQ0FBQyxDQUFDakYsa0JBQWtCLENBQUN1TixjQUFjLENBQUNFLE9BQU8sQ0FBQyxDQUFDeEksSUFBSSxDQUFDLEVBQUVwRSw4QkFBOEIsQ0FBQ3dNLHdCQUF3QixDQUFDLENBQUMsQ0FBQztVQUN0SixJQUFJSyxLQUFLLElBQUk5TSxTQUFTLEVBQUU7WUFDdEIsT0FBTzhNLEtBQUs7VUFDZCxDQUFDLE1BQU07WUFDTCxPQUFPLEVBQUU7VUFDWDtRQUNGO1FBQ0EsSUFBSU4sWUFBWSxLQUFLLGdDQUFnQyxFQUFFO1VBQ3JELElBQUlyTSxNQUFNLEdBQUdvTSxTQUFTLENBQUNDLFlBQVksQ0FBQyxDQUNsQ0UsZUFBZSxDQUFDeE8sR0FBRyxDQUNqQixVQUFDMk8sT0FBTztZQUFBLE9BQUtELFlBQVksQ0FBQ0QsY0FBYyxFQUFFRSxPQUFPLEVBQUV4SSxJQUFJLEVBQUVvSSx3QkFBd0IsQ0FBQztVQUFBLENBQ3BGLENBQ0YsQ0FBQztVQUNELE9BQU90TSxNQUFNO1FBQ2YsQ0FBQyxNQUFNO1VBQ0wsSUFBSUEsT0FBTSxHQUFHb00sU0FBUyxDQUFDQyxZQUFZLENBQUMsQ0FDbENFLGVBQWUsQ0FBQ3hPLEdBQUcsQ0FDakIsVUFBQzJPLE9BQU87WUFBQSxPQUNORixjQUFjLENBQUNFLE9BQU8sQ0FBQyxDQUFDeEksSUFBSSxDQUFDLENBQzdCakYsa0JBQWtCLENBQ2hCdU4sY0FBYyxDQUFDRSxPQUFPLENBQUMsQ0FBQ3hJLElBQUksQ0FBQyxFQUM3QnBFLDhCQUE4QixDQUFDd00sd0JBQXdCLENBQ3pELENBQUMsQ0FDQTtVQUFBLENBQ0wsQ0FBQyxFQUNEQyxlQUFlLENBQUN4TyxHQUFHLENBQ2pCLFVBQUMyTyxPQUFPO1lBQUEsT0FDTkYsY0FBYyxDQUFDRSxPQUFPLENBQUMsQ0FBQ3hJLElBQUksQ0FBQyxDQUFDLDJCQUEyQixDQUFDO1VBQUEsQ0FDOUQsQ0FDRixDQUFDO1VBQ0QsT0FBT2xFLE9BQU07UUFDZjtNQUNGLENBQUM7TUFBQSxJQTViSzRNLFVBQVU7UUFDZCxTQUFBQSxXQUFBLEVBQWM7VUFBQUMsZUFBQSxPQUFBRCxVQUFBO1VBQ1osSUFBSSxDQUFDRSxZQUFZLEdBQUcsSUFBSTtVQUN4QixJQUFJLENBQUNDLGtCQUFrQixHQUFHLElBQUk7VUFDOUIsSUFBSSxDQUFDQyxnQkFBZ0IsR0FBRyxJQUFJO1VBQzVCLElBQUksQ0FBQ0MsbUJBQW1CLEdBQUcsSUFBSTtVQUMvQixJQUFJLENBQUNDLG9CQUFvQixHQUFHLElBQUk7VUFDaEMsSUFBSSxDQUFDQyx1QkFBdUIsR0FBRyxJQUFJO1VBQ25DLElBQUksQ0FBQ0MsMEJBQTBCLEdBQUcsSUFBSTtVQUN0QyxJQUFJLENBQUNDLHFCQUFxQixHQUFHLElBQUk7VUFDakMsSUFBSSxDQUFDQyxzQkFBc0IsR0FBRyxJQUFJO1VBQ2xDLElBQUksQ0FBQ0MsUUFBUSxHQUFHLElBQUk7VUFDcEIsSUFBSSxDQUFDQyxhQUFhLEdBQUcsSUFBSTtVQUN6QixJQUFJLENBQUNDLFlBQVksR0FBRyxJQUFJO1VBQ3hCLElBQUksQ0FBQ0MsZ0JBQWdCLEdBQUcsSUFBSTtVQUM1QixJQUFJLENBQUNDLDBCQUEwQixHQUFHLElBQUk7VUFDdEMsSUFBSSxDQUFDQyxhQUFhLEdBQUcsSUFBSTtVQUN6QixJQUFJLENBQUNDLFlBQVksR0FBRyxJQUFJO1FBQzFCO1FBQUNDLFlBQUEsQ0FBQWxCLFVBQUE7VUFBQXpOLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBb0IsbUJBQ0VqTCxJQUFJLEVBS0o7WUFBQSxJQUpBa0wsSUFBSSxHQUFBNUssU0FBQSxDQUFBckgsTUFBQSxRQUFBcUgsU0FBQSxRQUFBdkQsU0FBQSxHQUFBdUQsU0FBQSxNQUFHLEtBQUs7WUFBQSxJQUNaNkssT0FBTyxHQUFBN0ssU0FBQSxDQUFBckgsTUFBQSxRQUFBcUgsU0FBQSxRQUFBdkQsU0FBQSxHQUFBdUQsU0FBQSxNQUFHLElBQUk7WUFBQSxJQUNkakIsT0FBTyxHQUFBaUIsU0FBQSxDQUFBckgsTUFBQSxRQUFBcUgsU0FBQSxRQUFBdkQsU0FBQSxHQUFBdUQsU0FBQSxNQUFHLElBQUk7WUFBQSxJQUNkOEssWUFBWSxHQUFBOUssU0FBQSxDQUFBckgsTUFBQSxRQUFBcUgsU0FBQSxRQUFBdkQsU0FBQSxHQUFBdUQsU0FBQSxNQUFHLENBQUM7WUFFaEIsSUFBSStLLFlBQVksR0FBR3BNLENBQUMsQ0FBQ29NLFlBQVksQ0FBQyxDQUFDO1lBQ25DQSxZQUFZLENBQUNyTCxJQUFJLEdBQUdBLElBQUk7WUFDeEJxTCxZQUFZLENBQUNwTCxPQUFPLEdBQUc7Y0FBRUQsSUFBSSxFQUFKQSxJQUFJO2NBQUVrTCxJQUFJLEVBQUpBLElBQUk7Y0FBRUMsT0FBTyxFQUFQQSxPQUFPO2NBQUU5TCxPQUFPLEVBQVBBLE9BQU87Y0FBRStMLFlBQVksRUFBWkE7WUFBYSxDQUFDO1lBQ3JFLE9BQU9DLFlBQVk7VUFDckI7UUFBQztVQUFBaFAsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUF5QixvQkFBb0J0TCxJQUFJLEVBQUU7WUFDeEIsSUFBSXVMLGFBQWEsR0FBR3RNLENBQUMsQ0FBQ3VNLGtCQUFrQixDQUFDO2NBQUV4TCxJQUFJLEVBQUVBO1lBQUssQ0FBQyxDQUFDO1lBQ3hELE9BQU91TCxhQUFhO1VBQ3RCO1FBQUM7VUFBQWxQLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBNEIsaUJBQWlCQyxVQUFVLEVBQUVDLGtCQUFrQixFQUFFO1lBQy9DQSxrQkFBa0IsR0FBR0Esa0JBQWtCLElBQUksRUFBRTtZQUM3Q0Esa0JBQWtCLENBQUN2TixPQUFPLENBQUMsVUFBQ2hDLEdBQUcsRUFBSztjQUNsQyxDQUFDQSxHQUFHLElBQUksRUFBRSxFQUFFZ0MsT0FBTyxDQUFDLFVBQUN3TixJQUFJLEVBQUs7Z0JBQzVCQSxJQUFJLENBQUNoTixLQUFLLENBQUM4TSxVQUFVLENBQUM7Y0FDeEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDO1VBQ0o7UUFBQztVQUFBclAsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUFnQyxtQ0FBbUNGLGtCQUFrQixFQUFFO1lBQ3JELElBQUk3TCxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUM3QixrQ0FBa0MsRUFDbEMsS0FBSyxFQUNMLElBQ0YsQ0FBQztjQUNELElBQUksQ0FBQ1EsZ0JBQWdCLENBQUMzTCxLQUFLLEVBQUU2TCxrQkFBa0IsQ0FBQztZQUNsRCxDQUFDLE1BQU07Y0FDTDdMLEtBQUssR0FBRyxJQUFJO1lBQ2Q7WUFBQztZQUNELElBQUksQ0FBQ3dLLDBCQUEwQixHQUFHeEssS0FBSztZQUN2QyxPQUFPQSxLQUFLO1VBQ2Q7UUFBQztVQUFBekQsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUFpQyxnQ0FBZ0NILGtCQUFrQixFQUFFO1lBQ2xELElBQUk3TCxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUM3QixrQ0FBa0MsRUFDbEMsS0FBSyxFQUNMLElBQUksRUFDSixJQUFJLEVBQ0osRUFDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDdUssdUJBQXVCLEdBQUd2SyxLQUFLO1lBQ3BDLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQWtDLDRCQUE0Qkosa0JBQWtCLEVBQUU7WUFDOUMsSUFBSTdMLEtBQUs7WUFDVCxJQUFJNkwsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkMrQyxLQUFLLEdBQUcsSUFBSSxDQUFDbUwsa0JBQWtCLENBQzdCLHdCQUF3QixFQUN4QixLQUFLLEVBQ0wsSUFDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDcUssbUJBQW1CLEdBQUdySyxLQUFLO1lBQ2hDLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQW1DLHlCQUF5Qkwsa0JBQWtCLEVBQUU7WUFDM0MsSUFBSTdMLEtBQUs7WUFDVCxJQUFJNkwsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkMrQyxLQUFLLEdBQUcsSUFBSSxDQUFDbUwsa0JBQWtCLENBQzdCLHdCQUF3QixFQUN4QixLQUFLLEVBQ0wsSUFDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDb0ssZ0JBQWdCLEdBQUdwSyxLQUFLO1lBQzdCLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQW9DLDZCQUE2Qk4sa0JBQWtCLEVBQUU7WUFDL0MsSUFBSTdMLEtBQUs7WUFDVCxJQUFJNkwsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkMrQyxLQUFLLEdBQUcsSUFBSSxDQUFDbUwsa0JBQWtCLENBQzdCLHdCQUF3QixFQUN4QixLQUFLLEVBQ0wsSUFDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDc0ssb0JBQW9CLEdBQUd0SyxLQUFLO1lBQ2pDLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQXFDLCtCQUNFUCxrQkFBa0IsRUFDbEJRLG1CQUFtQixFQUNuQjtZQUNBLElBQUlyTSxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxJQUFJb1AsbUJBQW1CLElBQUlwUCxTQUFTLEVBQUU7Y0FDdkUsSUFBSXFQLGlCQUFpQixHQUFHLElBQUksQ0FBQ2QsbUJBQW1CLENBQUMsYUFBYSxDQUFDO2NBQy9EeEwsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUM3QixzQkFBc0IsRUFDdEIsSUFBSSxFQUNKLElBQ0YsQ0FBQztjQUNELElBQUksQ0FBQ1EsZ0JBQWdCLENBQUMzTCxLQUFLLEVBQUU2TCxrQkFBa0IsQ0FBQztjQUNoRDdMLEtBQUssQ0FBQ3RCLFFBQVEsQ0FBQzROLGlCQUFpQixDQUFDO2NBQ2pDLElBQUksQ0FBQ1gsZ0JBQWdCLENBQUNXLGlCQUFpQixFQUFFRCxtQkFBbUIsQ0FBQztZQUMvRCxDQUFDLE1BQU07Y0FDTHJNLEtBQUssR0FBRyxJQUFJO1lBQ2Q7WUFBQztZQUNELElBQUksQ0FBQzBLLHNCQUFzQixHQUFHMUssS0FBSztZQUNuQyxPQUFPQSxLQUFLO1VBQ2Q7UUFBQztVQUFBekQsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUF3Qyw4QkFBOEJWLGtCQUFrQixFQUFFO1lBQ2hELElBQUk3TCxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUFDLGlCQUFpQixFQUFFLEtBQUssRUFBRSxJQUFJLENBQUM7Y0FDL0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDeUsscUJBQXFCLEdBQUd6SyxLQUFLO1lBQ2xDLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQXlDLHFCQUFxQlgsa0JBQWtCLEVBQUU7WUFDdkMsSUFBSTdMLEtBQUs7WUFDVCxJQUFJNkwsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkMrQyxLQUFLLEdBQUcsSUFBSSxDQUFDbUwsa0JBQWtCLENBQzdCLHdCQUF3QixFQUN4QixLQUFLLEVBQ0wsSUFDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDa0ssWUFBWSxHQUFHbEssS0FBSztZQUN6QixPQUFPQSxLQUFLO1VBQ2Q7UUFBQztVQUFBekQsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUEwQywyQkFBMkJaLGtCQUFrQixFQUFFO1lBQzdDLElBQUk3TCxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUM3QixtQ0FBbUMsRUFDbkMsSUFBSSxFQUNKLEtBQUssRUFDTCxLQUNGLENBQUM7Y0FDRCxJQUFJLENBQUNRLGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7WUFDbEQsQ0FBQyxNQUFNO2NBQ0w3TCxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRCxJQUFJLENBQUNtSyxrQkFBa0IsR0FBR25LLEtBQUs7WUFDL0IsT0FBT0EsS0FBSztVQUNkO1FBQUM7VUFBQXpELEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBMkMscUJBQXFCYixrQkFBa0IsRUFBRTtZQUN2Q2hTLE9BQU8sQ0FBQ2tDLEdBQUcsQ0FBQzhQLGtCQUFrQixFQUFFLG9CQUFvQixDQUFDO1lBQ3JELElBQUlKLGFBQWE7WUFDakIsSUFBSUksa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkN3TyxhQUFhLEdBQUcsSUFBSSxDQUFDRCxtQkFBbUIsQ0FBQyxxQkFBcUIsQ0FBQztjQUMvRCxJQUFJLENBQUNHLGdCQUFnQixDQUFDRixhQUFhLEVBQUVJLGtCQUFrQixDQUFDO1lBQzFELENBQUMsTUFBTTtjQUNMSixhQUFhLEdBQUcsSUFBSTtZQUN0QjtZQUFDO1lBQ0QsSUFBSSxDQUFDWixZQUFZLEdBQUdZLGFBQWE7WUFDakMsT0FBT0EsYUFBYTtVQUN0QjtRQUFDO1VBQUFsUCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQTRDLGlCQUFpQmQsa0JBQWtCLEVBQUU7WUFDbkMsSUFBSUosYUFBYTtZQUNqQixJQUFJSSxrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQ3dPLGFBQWEsR0FBRyxJQUFJLENBQUNELG1CQUFtQixDQUFDLG9CQUFvQixDQUFDO2NBQzlELElBQUksQ0FBQ0csZ0JBQWdCLENBQUNGLGFBQWEsRUFBRUksa0JBQWtCLENBQUM7WUFDMUQsQ0FBQyxNQUFNO2NBQ0xKLGFBQWEsR0FBRyxJQUFJO1lBQ3RCO1lBQUM7WUFDRCxJQUFJLENBQUNkLFFBQVEsR0FBR2MsYUFBYTtZQUM3QixPQUFPQSxhQUFhO1VBQ3RCO1FBQUM7VUFBQWxQLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBNkMsc0JBQXNCZixrQkFBa0IsRUFBRTtZQUN4QyxJQUFJSixhQUFhO1lBQ2pCLElBQUlJLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25Dd08sYUFBYSxHQUFHLElBQUksQ0FBQ0QsbUJBQW1CLENBQ3RDLHNCQUFzQixFQUN0QixLQUNGLENBQUM7Y0FDRCxJQUFJLENBQUNHLGdCQUFnQixDQUFDRixhQUFhLEVBQUVJLGtCQUFrQixDQUFDO1lBQzFELENBQUMsTUFBTTtjQUNMSixhQUFhLEdBQUcsSUFBSTtZQUN0QjtZQUFDO1lBQ0QsSUFBSSxDQUFDYixhQUFhLEdBQUdhLGFBQWE7WUFDbEMsT0FBT0EsYUFBYTtVQUN0QjtRQUFDO1VBQUFsUCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQThDLG1DQUFtQ2hCLGtCQUFrQixFQUFFO1lBQ3JELElBQUk3TCxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUM3QixtQ0FBbUMsRUFDbkMsS0FDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDK0ssMEJBQTBCLEdBQUcvSyxLQUFLO1lBQ3ZDLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQStDLHlCQUF5QmpCLGtCQUFrQixFQUFFO1lBQzNDLElBQUk3TCxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQztjQUM3RCxJQUFJLENBQUNRLGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7WUFDbEQsQ0FBQyxNQUFNO2NBQ0w3TCxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRCxJQUFJLENBQUM4SyxnQkFBZ0IsR0FBRzlLLEtBQUs7WUFDN0IsT0FBT0EsS0FBSztVQUNkO1FBQUM7VUFBQXpELEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBZ0Qsc0JBQXNCbEIsa0JBQWtCLEVBQUU7WUFDeEMsSUFBSTdMLEtBQUs7WUFDVCxJQUFJNkwsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkMrQyxLQUFLLEdBQUcsSUFBSSxDQUFDbUwsa0JBQWtCLENBQzdCLG9DQUFvQyxFQUNwQyxLQUNGLENBQUM7Y0FDRCxJQUFJLENBQUNRLGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7WUFDbEQsQ0FBQyxNQUFNO2NBQ0w3TCxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRCxJQUFJLENBQUNnTCxhQUFhLEdBQUdoTCxLQUFLO1lBQzFCLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQWlELHFCQUFxQm5CLGtCQUFrQixFQUFFO1lBQ3ZDLElBQUk3TCxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUM3QixvQ0FBb0MsRUFDcEMsS0FDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDaUwsWUFBWSxHQUFHakwsS0FBSztZQUN6QixPQUFPQSxLQUFLO1VBQ2Q7UUFBQztRQUFBLE9BQUFnSyxVQUFBO01BQUE7TUFHSDtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7TUFDTWhKLGlCQUFpQixHQUFHLFNBQVNpTSx5QkFBeUJBLENBQ3BEM0wsSUFBSSxFQUNKc0ksY0FBYyxFQUNkRSxPQUFPLEVBRVA7UUFBQSxJQURBdkosZUFBZSxHQUFBQyxTQUFBLENBQUFySCxNQUFBLFFBQUFxSCxTQUFBLFFBQUF2RCxTQUFBLEdBQUF1RCxTQUFBLE1BQUcsS0FBSztRQUV2QixJQUFJME0sU0FBUyxHQUFHQyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUlwVCxhQUFhO1FBQ2pCLElBQUl1RyxlQUFlLElBQUksS0FBSyxFQUFFO1VBQUEsSUFBQThNLFdBQUEsR0FDQ3BPLFVBQVUsQ0FBQ2hJLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDQyxJQUFJLENBQUM7VUFBQSxJQUFBbVcsWUFBQSxHQUFBMU0sY0FBQSxDQUFBeU0sV0FBQTtVQUE1RHhQLFNBQVMsR0FBQXlQLFlBQUE7VUFBRXRULGFBQWEsR0FBQXNULFlBQUE7UUFDM0I7UUFDQSxJQUFJM0QsZUFBZSxHQUFHOU0sTUFBTSxDQUFDa0UsSUFBSSxDQUFDNkksY0FBYyxDQUFDO1FBQ2pELElBQUk7VUFDRixJQUFJMkQsYUFBYSxHQUFHLElBQUl2RCxVQUFVLENBQUMsQ0FBQztVQUNwQyxJQUFJNUwsTUFBTSxHQUFHLENBQUMsQ0FBQztVQUNmLEtBQUssSUFBSW9QLFNBQVMsSUFBSUQsYUFBYSxFQUFFO1lBQ25DLElBQ0UsQ0FBQ0MsU0FBUyxDQUFDQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQzFCRixhQUFhLENBQUNDLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFDakM7Y0FDQSxJQUFJL0QsWUFBWSxjQUFBekssTUFBQSxDQUFjd08sU0FBUyxDQUNwQ2xRLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FDVEMsV0FBVyxDQUFDLENBQUMsRUFBQXlCLE1BQUEsQ0FBR3dPLFNBQVMsQ0FBQ0UsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFFO2NBQ3ZDLElBQUlDLE1BQU0sR0FBR0osYUFBYSxDQUFDOUQsWUFBWSxDQUFDO2NBQ3hDLElBQUksT0FBT2tFLE1BQU0sS0FBSyxVQUFVLEVBQUU7Z0JBQ2hDdlAsTUFBTSxDQUFDb1AsU0FBUyxDQUFDLEdBQUdqRSxhQUFhLENBQy9CZ0UsYUFBYSxFQUNiOUQsWUFBWSxFQUNaK0QsU0FBUyxFQUNUbE0sSUFBSSxFQUNKcUksZUFBZSxFQUNmQyxjQUNGLENBQUM7Y0FDSCxDQUFDLE1BQU07Z0JBQ0wvUCxPQUFPLENBQUNrQyxHQUFHLGtCQUFBaUQsTUFBQSxDQUFrQnlLLFlBQVksc0JBQW1CLENBQUM7Y0FDL0Q7WUFDRjtVQUNGO1VBQ0FyTCxNQUFNLEdBQUd2QixNQUFNLENBQUMrUSxXQUFXLENBQ3pCL1EsTUFBTSxDQUFDZ1IsT0FBTyxDQUFDelAsTUFBTSxDQUFDLENBQUMwUCxNQUFNLENBQUMsVUFBQUMsSUFBQTtZQUFBLElBQUFDLEtBQUEsR0FBQXBOLGNBQUEsQ0FBQW1OLElBQUE7Y0FBRUUsQ0FBQyxHQUFBRCxLQUFBO2NBQUV2SixDQUFDLEdBQUF1SixLQUFBO1lBQUEsT0FBTXZKLENBQUMsS0FBSyxJQUFJO1VBQUEsRUFDdEQsQ0FBQztVQUVELElBQUlsRSxlQUFlLEtBQUssS0FBSyxFQUFFO1lBQzdCLE9BQU9uQyxNQUFNO1VBQ2YsQ0FBQyxNQUFNO1lBQ0xQLFNBQVMsQ0FBQ3NJLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVXJPLEtBQUssRUFBRTtjQUMxQ0EsS0FBSyxDQUFDa0ksS0FBSyxDQUFDeEIsWUFBWSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDO1lBQ0YzRSxPQUFPLENBQUNrQyxHQUFHLENBQUMsb0JBQW9CLEVBQUVxQyxNQUFNLENBQUM7WUFDekNQLFNBQVMsR0FBR1ksY0FBYyxDQUFDWixTQUFTLEVBQUVPLE1BQU0sQ0FBQztZQUM3Q0QsY0FBYyxDQUFDTixTQUFTLEVBQUVPLE1BQU0sQ0FBQztZQUNqQ2xELGtCQUFrQixDQUFDMkMsU0FBUyxDQUFDO1lBQzdCaEIsTUFBTSxDQUFDa0UsSUFBSSxDQUFDM0MsTUFBTSxDQUFDLENBQUNFLE9BQU8sQ0FBQyxVQUFDQyxTQUFTLEVBQUs7Y0FDekMsUUFBUUgsTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQzJCLElBQUk7Z0JBQzVCLEtBQUtqRCxTQUFTO2tCQUNaLElBQ0UsQ0FBQyxDQUFDLG1DQUFtQyxDQUFDLENBQUM3RixRQUFRLENBQzdDZ0gsTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQzRCLE9BQU8sQ0FBQ0QsSUFDNUIsQ0FBQyxFQUNEO29CQUNBbEcsYUFBYSxDQUFDcUcsVUFBVSxDQUN0QmpDLE1BQU0sQ0FBQ0csU0FBUyxDQUFDLEVBQ2pCSCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDNEIsT0FBTyxDQUFDRCxJQUM1QixDQUFDO2tCQUNIO2tCQUNBO2dCQUNGO2tCQUNFLElBQ0UsQ0FBQyxDQUFDLG1DQUFtQyxDQUFDLENBQUM5SSxRQUFRLENBQzdDZ0gsTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQzJCLElBQ3BCLENBQUMsRUFDRDtvQkFDQWxHLGFBQWEsQ0FBQ3FHLFVBQVUsQ0FDdEJqQyxNQUFNLENBQUNHLFNBQVMsQ0FBQyxFQUNqQkgsTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQzJCLElBQ3BCLENBQUM7a0JBQ0g7Y0FDSjtZQUNGLENBQUMsQ0FBQztZQUVGckcsT0FBTyxDQUFDa0MsR0FBRyx3QkFBQWlELE1BQUEsQ0FDYyxDQUFDLENBQUNtTyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLFNBQVMsSUFBSSxJQUFJLEVBQUVnQixPQUFPLENBQzlELENBQ0YsQ0FBQyxhQUNILENBQUM7WUFFRCxPQUFPclEsU0FBUztVQUNsQjtRQUNGLENBQUMsQ0FBQyxPQUFPa0IsQ0FBQyxFQUFFO1VBQ1ZsRixPQUFPLENBQUNDLEtBQUssQ0FBQ2lGLENBQUMsQ0FBQztVQUNoQixPQUFPLElBQUk7UUFDYjtNQUNGLENBQUM7SUFxREgsQ0FBQyxNQUFNLElBQUl1SyxRQUFRLElBQUksRUFBRSxFQUFFO01BQUEsSUFDbkI2RSxTQUFTO1FBQ2IsU0FBQUEsVUFBQSxFQUFjO1VBQUFsRSxlQUFBLE9BQUFrRSxTQUFBO1VBQ1osSUFBSSxDQUFDakUsWUFBWSxHQUFHLElBQUk7VUFDeEIsSUFBSSxDQUFDQyxrQkFBa0IsR0FBRyxJQUFJO1VBQzlCLElBQUksQ0FBQ0MsZ0JBQWdCLEdBQUcsSUFBSTtVQUM1QixJQUFJLENBQUNDLG1CQUFtQixHQUFHLElBQUk7VUFDL0IsSUFBSSxDQUFDQyxvQkFBb0IsR0FBRyxJQUFJO1VBQ2hDLElBQUksQ0FBQ0cscUJBQXFCLEdBQUcsSUFBSTtVQUNqQyxJQUFJLENBQUNLLGdCQUFnQixHQUFHLElBQUk7VUFDNUIsSUFBSSxDQUFDRSxhQUFhLEdBQUcsSUFBSTtRQUMzQjtRQUFDRSxZQUFBLENBQUFpRCxTQUFBO1VBQUE1UixHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQWtDLDRCQUE0Qkosa0JBQWtCLEVBQUU7WUFDOUMsSUFBSXhCLG1CQUFtQjtZQUN2QixJQUFJd0Isa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkNvTixtQkFBbUIsR0FBR2xMLENBQUMsQ0FBQ29NLFlBQVksQ0FBQztnQkFDbkNyTCxJQUFJLEVBQUUsd0JBQXdCO2dCQUM5QmtMLElBQUksRUFBRSxLQUFLO2dCQUNYQyxPQUFPLEVBQUU7Y0FDWCxDQUFDLENBQUM7Y0FDRmhCLG1CQUFtQixDQUFDbkssSUFBSSxHQUFHLHdCQUF3QjtjQUNuRDJMLGtCQUFrQixDQUFDdk4sT0FBTyxDQUN4QixVQUFDaEMsR0FBRztnQkFBQSxPQUNGQSxHQUFHLElBQUlBLEdBQUcsQ0FBQ2dDLE9BQU8sQ0FBQyxVQUFDd04sSUFBSTtrQkFBQSxPQUFLekIsbUJBQW1CLENBQUMzTCxRQUFRLENBQUNvTixJQUFJLENBQUM7Z0JBQUEsRUFBQztjQUFBLENBQ3BFLENBQUM7Y0FDRCxJQUFJLENBQUN6QixtQkFBbUIsR0FBR0EsbUJBQW1CO1lBQ2hELENBQUMsTUFBTTtjQUNMQSxtQkFBbUIsR0FBRyxJQUFJO1lBQzVCO1lBQUM7WUFDRCxPQUFPQSxtQkFBbUI7VUFDNUI7UUFBQztVQUFBOU4sR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUFtQyx5QkFBeUJMLGtCQUFrQixFQUFFO1lBQzNDLElBQUl6QixnQkFBZ0I7WUFDcEIsSUFBSXlCLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DbU4sZ0JBQWdCLEdBQUdqTCxDQUFDLENBQUNvTSxZQUFZLENBQUM7Z0JBQ2hDckwsSUFBSSxFQUFFLHdCQUF3QjtnQkFDOUJrTCxJQUFJLEVBQUUsS0FBSztnQkFDWEMsT0FBTyxFQUFFO2NBQ1gsQ0FBQyxDQUFDO2NBQ0ZqQixnQkFBZ0IsQ0FBQ2xLLElBQUksR0FBRyx3QkFBd0I7Y0FDaEQyTCxrQkFBa0IsQ0FBQ3ZOLE9BQU8sQ0FDeEIsVUFBQ2hDLEdBQUc7Z0JBQUEsT0FDRkEsR0FBRyxJQUFJQSxHQUFHLENBQUNnQyxPQUFPLENBQUMsVUFBQ3dOLElBQUk7a0JBQUEsT0FBSzFCLGdCQUFnQixDQUFDMUwsUUFBUSxDQUFDb04sSUFBSSxDQUFDO2dCQUFBLEVBQUM7Y0FBQSxDQUNqRSxDQUFDO2NBQ0QsSUFBSSxDQUFDMUIsZ0JBQWdCLEdBQUdBLGdCQUFnQjtZQUMxQyxDQUFDLE1BQU07Y0FDTEEsZ0JBQWdCLEdBQUcsSUFBSTtZQUN6QjtZQUFDO1lBQ0QsT0FBT0EsZ0JBQWdCO1VBQ3pCO1FBQUM7VUFBQTdOLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBb0MsNkJBQTZCTixrQkFBa0IsRUFBRTtZQUMvQyxJQUFJdkIsb0JBQW9CO1lBQ3hCLElBQUl1QixrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQ3FOLG9CQUFvQixHQUFHbkwsQ0FBQyxDQUFDb00sWUFBWSxDQUFDO2dCQUNwQ3JMLElBQUksRUFBRSx3QkFBd0I7Z0JBQzlCa0wsSUFBSSxFQUFFLEtBQUs7Z0JBQ1hDLE9BQU8sRUFBRTtjQUNYLENBQUMsQ0FBQztjQUNGZixvQkFBb0IsQ0FBQ3BLLElBQUksR0FBRyx3QkFBd0I7Y0FDcEQyTCxrQkFBa0IsQ0FBQ3ZOLE9BQU8sQ0FDeEIsVUFBQ2hDLEdBQUc7Z0JBQUEsT0FDRkEsR0FBRyxJQUFJQSxHQUFHLENBQUNnQyxPQUFPLENBQUMsVUFBQ3dOLElBQUk7a0JBQUEsT0FBS3hCLG9CQUFvQixDQUFDNUwsUUFBUSxDQUFDb04sSUFBSSxDQUFDO2dCQUFBLEVBQUM7Y0FBQSxDQUNyRSxDQUFDO2NBQ0QsSUFBSSxDQUFDeEIsb0JBQW9CLEdBQUdBLG9CQUFvQjtZQUNsRCxDQUFDLE1BQU07Y0FDTEEsb0JBQW9CLEdBQUcsSUFBSTtZQUM3QjtZQUFDO1lBQ0QsT0FBT0Esb0JBQW9CO1VBQzdCO1FBQUM7VUFBQS9OLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBd0MsOEJBQThCVixrQkFBa0IsRUFBRTtZQUNoRCxJQUFJcEIscUJBQXFCO1lBQ3pCLElBQUlvQixrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQ3dOLHFCQUFxQixHQUFHdEwsQ0FBQyxDQUFDb00sWUFBWSxDQUFDO2dCQUNyQ3JMLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCa0wsSUFBSSxFQUFFLEtBQUs7Z0JBQ1hDLE9BQU8sRUFBRTtjQUNYLENBQUMsQ0FBQztjQUNGWixxQkFBcUIsQ0FBQ3ZLLElBQUksR0FBRyxpQkFBaUI7Y0FDOUMyTCxrQkFBa0IsQ0FBQ3ZOLE9BQU8sQ0FDeEIsVUFBQ2hDLEdBQUc7Z0JBQUEsT0FDRkEsR0FBRyxJQUFJQSxHQUFHLENBQUNnQyxPQUFPLENBQUMsVUFBQ3dOLElBQUk7a0JBQUEsT0FBS3JCLHFCQUFxQixDQUFDL0wsUUFBUSxDQUFDb04sSUFBSSxDQUFDO2dCQUFBLEVBQUM7Y0FBQSxDQUN0RSxDQUFDO2NBQ0QsSUFBSSxDQUFDckIscUJBQXFCLEdBQUdBLHFCQUFxQjtZQUNwRCxDQUFDLE1BQU07Y0FDTEEscUJBQXFCLEdBQUcsSUFBSTtZQUM5QjtZQUFDO1lBQ0QsT0FBT0EscUJBQXFCO1VBQzlCO1FBQUM7VUFBQWxPLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBeUMscUJBQXFCWCxrQkFBa0IsRUFBRTtZQUN2QyxJQUFJM0IsWUFBWTtZQUNoQixJQUFJMkIsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkNpTixZQUFZLEdBQUcvSyxDQUFDLENBQUNvTSxZQUFZLENBQUM7Z0JBQzVCckwsSUFBSSxFQUFFLHdCQUF3QjtnQkFDOUJrTCxJQUFJLEVBQUUsS0FBSztnQkFDWEMsT0FBTyxFQUFFO2NBQ1gsQ0FBQyxDQUFDO2NBQ0ZuQixZQUFZLENBQUNoSyxJQUFJLEdBQUcsd0JBQXdCO2NBQzVDMkwsa0JBQWtCLENBQUN2TixPQUFPLENBQ3hCLFVBQUNoQyxHQUFHO2dCQUFBLE9BQUtBLEdBQUcsSUFBSUEsR0FBRyxDQUFDZ0MsT0FBTyxDQUFDLFVBQUN3TixJQUFJO2tCQUFBLE9BQUs1QixZQUFZLENBQUN4TCxRQUFRLENBQUNvTixJQUFJLENBQUM7Z0JBQUEsRUFBQztjQUFBLENBQ3BFLENBQUM7Y0FDRCxJQUFJLENBQUM1QixZQUFZLEdBQUdBLFlBQVk7WUFDbEMsQ0FBQyxNQUFNO2NBQ0xBLFlBQVksR0FBRyxJQUFJO1lBQ3JCO1lBQUM7WUFDRCxPQUFPQSxZQUFZO1VBQ3JCO1FBQUM7VUFBQTNOLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBMEMsMkJBQTJCWixrQkFBa0IsRUFBRTtZQUM3QyxJQUFJMUIsa0JBQWtCO1lBQ3RCLElBQUkwQixrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQ2tOLGtCQUFrQixHQUFHaEwsQ0FBQyxDQUFDb00sWUFBWSxDQUFDO2dCQUNsQ3JMLElBQUksRUFBRSxtQ0FBbUM7Z0JBQ3pDa0wsSUFBSSxFQUFFLElBQUk7Z0JBQ1ZDLE9BQU8sRUFBRSxLQUFLO2dCQUNkOUwsT0FBTyxFQUFFO2NBQ1gsQ0FBQyxDQUFDO2NBQ0Y0SyxrQkFBa0IsQ0FBQ2pLLElBQUksR0FBRyxtQ0FBbUM7Y0FDN0QyTCxrQkFBa0IsQ0FBQ3ZOLE9BQU8sQ0FDeEIsVUFBQ2hDLEdBQUc7Z0JBQUEsT0FDRkEsR0FBRyxJQUFJQSxHQUFHLENBQUNnQyxPQUFPLENBQUMsVUFBQ3dOLElBQUk7a0JBQUEsT0FBSzNCLGtCQUFrQixDQUFDekwsUUFBUSxDQUFDb04sSUFBSSxDQUFDO2dCQUFBLEVBQUM7Y0FBQSxDQUNuRSxDQUFDO2NBQ0QsSUFBSSxDQUFDM0Isa0JBQWtCLEdBQUdBLGtCQUFrQjtZQUM5QyxDQUFDLE1BQU07Y0FDTEEsa0JBQWtCLEdBQUcsSUFBSTtZQUMzQjtZQUFDO1lBQ0QsT0FBT0Esa0JBQWtCO1VBQzNCO1FBQUM7VUFBQTVOLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBK0MseUJBQXlCakIsa0JBQWtCLEVBQUU7WUFDM0MsSUFBSWYsZ0JBQWdCO1lBQ3BCLElBQUllLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DNk4sZ0JBQWdCLEdBQUczTCxDQUFDLENBQUNvTSxZQUFZLENBQUM7Z0JBQ2hDckwsSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUJrTCxJQUFJLEVBQUU7Y0FDUixDQUFDLENBQUM7Y0FDRk4sZ0JBQWdCLENBQUM1SyxJQUFJLEdBQUcsc0JBQXNCO2NBQzlDMkwsa0JBQWtCLENBQUN2TixPQUFPLENBQ3hCLFVBQUNoQyxHQUFHO2dCQUFBLE9BQ0ZBLEdBQUcsSUFBSUEsR0FBRyxDQUFDZ0MsT0FBTyxDQUFDLFVBQUN3TixJQUFJO2tCQUFBLE9BQUtoQixnQkFBZ0IsQ0FBQ3BNLFFBQVEsQ0FBQ29OLElBQUksQ0FBQztnQkFBQSxFQUFDO2NBQUEsQ0FDakUsQ0FBQztjQUNELElBQUksQ0FBQ2hCLGdCQUFnQixHQUFHQSxnQkFBZ0I7WUFDMUMsQ0FBQyxNQUFNO2NBQ0xBLGdCQUFnQixHQUFHLElBQUk7WUFDekI7WUFBQztZQUNELE9BQU9BLGdCQUFnQjtVQUN6QjtRQUFDO1VBQUF2TyxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQWdELHNCQUFzQmxCLGtCQUFrQixFQUFFO1lBQ3hDLElBQUl1QyxrQkFBa0I7WUFDdEIsSUFBSXZDLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DbVIsa0JBQWtCLEdBQUdqUCxDQUFDLENBQUNvTSxZQUFZLENBQUM7Z0JBQ2xDckwsSUFBSSxFQUFFLDZCQUE2QjtnQkFDbkNrTCxJQUFJLEVBQUU7Y0FDUixDQUFDLENBQUM7Y0FDRmdELGtCQUFrQixDQUFDbE8sSUFBSSxHQUFHLDZCQUE2QjtjQUN2RDJMLGtCQUFrQixDQUFDdk4sT0FBTyxDQUN4QixVQUFDaEMsR0FBRztnQkFBQSxPQUNGQSxHQUFHLElBQUlBLEdBQUcsQ0FBQ2dDLE9BQU8sQ0FBQyxVQUFDd04sSUFBSTtrQkFBQSxPQUFLc0Msa0JBQWtCLENBQUMxUCxRQUFRLENBQUNvTixJQUFJLENBQUM7Z0JBQUEsRUFBQztjQUFBLENBQ25FLENBQUM7Y0FDRCxJQUFJLENBQUNkLGFBQWEsR0FBR29ELGtCQUFrQjtZQUN6QyxDQUFDLE1BQU07Y0FDTEEsa0JBQWtCLEdBQUcsSUFBSTtZQUMzQjtZQUFDO1lBQ0QsT0FBT0Esa0JBQWtCO1VBQzNCO1FBQUM7UUFBQSxPQUFBRCxTQUFBO01BQUE7TUFHSDtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7TUFDTW5OLGlCQUFpQixHQUFHLFNBQVNpTSx5QkFBeUJBLENBQ3BEM0wsSUFBSSxFQUNKc0ksY0FBYyxFQUNkRSxPQUFPLEVBRVA7UUFBQSxJQURBdkosZUFBZSxHQUFBQyxTQUFBLENBQUFySCxNQUFBLFFBQUFxSCxTQUFBLFFBQUF2RCxTQUFBLEdBQUF1RCxTQUFBLE1BQUcsS0FBSztRQUV2QixJQUFJME0sU0FBUyxHQUFHQyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUlwVCxhQUFhO1FBQ2pCLElBQUl1RyxlQUFlLElBQUksS0FBSyxFQUFFO1VBQUEsSUFBQThOLFlBQUEsR0FDQ3BQLFVBQVUsQ0FBQ2hJLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDQyxJQUFJLENBQUM7VUFBQSxJQUFBbVgsWUFBQSxHQUFBMU4sY0FBQSxDQUFBeU4sWUFBQTtVQUE1RHhRLFNBQVMsR0FBQXlRLFlBQUE7VUFBRXRVLGFBQWEsR0FBQXNVLFlBQUE7UUFDM0I7UUFDQSxJQUFJM0UsZUFBZSxHQUFHOU0sTUFBTSxDQUFDa0UsSUFBSSxDQUFDNkksY0FBYyxDQUFDO1FBRWpELElBQUk7VUFDRixJQUFJMkUsWUFBWSxHQUFHLElBQUlKLFNBQVMsQ0FBQyxDQUFDO1VBQ2xDLElBQUkvUCxNQUFNLEdBQUcsQ0FBQyxDQUFDO1VBQUMsSUFBQW9RLEtBQUEsWUFBQUEsTUFBQWhCLFNBQUEsRUFDb0I7WUFDbEMsSUFBSS9ELFlBQVksY0FBQXpLLE1BQUEsQ0FBY3dPLFNBQVMsQ0FDcENsUSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQ1RDLFdBQVcsQ0FBQyxDQUFDLEVBQUF5QixNQUFBLENBQUd3TyxTQUFTLENBQUNFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBRTtZQUN2QyxJQUNFLENBQUNGLFNBQVMsQ0FBQ0MsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUMxQmMsWUFBWSxDQUFDZixTQUFTLENBQUMsS0FBSyxJQUFJLElBQ2hDLE9BQU9lLFlBQVksQ0FBQzlFLFlBQVksQ0FBQyxLQUFLLFVBQVUsRUFDaEQ7Y0FDQSxJQUFJbEksU0FBUyxHQUFHb0ksZUFBZSxDQUFDeE8sR0FBRyxDQUNqQyxVQUFDc1QsZUFBZTtnQkFBQSxPQUNkN0UsY0FBYyxDQUFDNkUsZUFBZSxDQUFDLENBQUNuTixJQUFJLENBQUMsQ0FDckNqRixrQkFBa0IsQ0FDaEJ1TixjQUFjLENBQUM2RSxlQUFlLENBQUMsQ0FBQ25OLElBQUksQ0FBQyxFQUNyQ3BFLDhCQUE4QixDQUFDc1EsU0FBUyxDQUMxQyxDQUFDLENBQ0E7Y0FBQSxDQUNMLENBQUM7Y0FDRHBQLE1BQU0sQ0FBQ29QLFNBQVMsQ0FBQyxHQUFHZSxZQUFZLENBQUM5RSxZQUFZLENBQUMsQ0FBQ2xJLFNBQVMsQ0FBQztZQUMzRDtVQUNGLENBQUM7VUFwQkQsS0FBSyxJQUFJaU0sU0FBUyxJQUFJZSxZQUFZO1lBQUFDLEtBQUEsQ0FBQWhCLFNBQUE7VUFBQTtVQXNCbENwUCxNQUFNLEdBQUd2QixNQUFNLENBQUMrUSxXQUFXLENBQ3pCL1EsTUFBTSxDQUFDZ1IsT0FBTyxDQUFDelAsTUFBTSxDQUFDLENBQUMwUCxNQUFNLENBQUMsVUFBQVksS0FBQTtZQUFBLElBQUFDLEtBQUEsR0FBQS9OLGNBQUEsQ0FBQThOLEtBQUE7Y0FBRVQsQ0FBQyxHQUFBVSxLQUFBO2NBQUVsSyxDQUFDLEdBQUFrSyxLQUFBO1lBQUEsT0FBTWxLLENBQUMsSUFBSSxJQUFJO1VBQUEsRUFDckQsQ0FBQztVQUVELElBQUlsRSxlQUFlLEtBQUssS0FBSyxFQUFFO1lBQzdCMUcsT0FBTyxDQUFDa0MsR0FBRyx3QkFBQWlELE1BQUEsQ0FDYyxDQUFDbU8sSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHRixTQUFTLElBQUksSUFBSSxhQUN4RCxDQUFDO1lBQ0QsT0FBTzlPLE1BQU07VUFDZixDQUFDLE1BQU07WUFDTFAsU0FBUyxDQUFDc0ksRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFVck8sS0FBSyxFQUFFO2NBQzFDQSxLQUFLLENBQUNrSSxLQUFLLENBQUN4QixZQUFZLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUM7WUFDRlgsU0FBUyxHQUFHWSxjQUFjLENBQUNaLFNBQVMsRUFBRU8sTUFBTSxDQUFDO1lBQzdDRCxjQUFjLENBQUNOLFNBQVMsRUFBRU8sTUFBTSxDQUFDO1lBQ2pDbEQsa0JBQWtCLENBQUMyQyxTQUFTLENBQUM7WUFDN0JoQixNQUFNLENBQUNrRSxJQUFJLENBQUMzQyxNQUFNLENBQUMsQ0FBQ0UsT0FBTyxDQUFDLFVBQUNDLFNBQVMsRUFBSztjQUN6QyxRQUFRSCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDMkIsSUFBSTtnQkFDNUIsS0FBS2pELFNBQVM7a0JBQ1osSUFDRSxDQUFDLENBQUMsbUNBQW1DLENBQUMsQ0FBQzdGLFFBQVEsQ0FDN0NnSCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDNEIsT0FBTyxDQUFDRCxJQUM1QixDQUFDLEVBQ0Q7b0JBQ0FsRyxhQUFhLENBQUNxRyxVQUFVLENBQ3RCakMsTUFBTSxDQUFDRyxTQUFTLENBQUMsRUFDakJILE1BQU0sQ0FBQ0csU0FBUyxDQUFDLENBQUM0QixPQUFPLENBQUNELElBQzVCLENBQUM7a0JBQ0g7a0JBQ0E7Z0JBQ0Y7a0JBQ0UsSUFDRSxDQUFDLENBQUMsbUNBQW1DLENBQUMsQ0FBQzlJLFFBQVEsQ0FDN0NnSCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDMkIsSUFDcEIsQ0FBQyxFQUNEO29CQUNBbEcsYUFBYSxDQUFDcUcsVUFBVSxDQUN0QmpDLE1BQU0sQ0FBQ0csU0FBUyxDQUFDLEVBQ2pCSCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDMkIsSUFDcEIsQ0FBQztrQkFDSDtjQUNKO1lBQ0YsQ0FBQyxDQUFDO1lBRUZyRyxPQUFPLENBQUNrQyxHQUFHLHdCQUFBaUQsTUFBQSxDQUNjLENBQUMsQ0FBQ21PLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBR0YsU0FBUyxJQUFJLElBQUksRUFBRWdCLE9BQU8sQ0FDOUQsQ0FDRixDQUFDLGFBQ0gsQ0FBQztZQUVELE9BQU9yUSxTQUFTO1VBQ2xCO1FBQ0YsQ0FBQyxDQUFDLE9BQU9rQixDQUFDLEVBQUU7VUFDVmxGLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDaUYsQ0FBQyxDQUFDO1VBQ2hCLE9BQU8sSUFBSTtRQUNiO01BQ0YsQ0FBQztJQUNILENBQUMsTUFBTTtNQWtaTDtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO01BVk0sSUFXU3dLLGNBQWEsR0FBdEIsU0FBU0EsY0FBYUEsQ0FDcEJDLFNBQVMsRUFDVEMsWUFBWSxFQUNaQyx3QkFBd0IsRUFDeEJwSSxJQUFJLEVBQ0p3SSxPQUFPLEVBQ1BGLGNBQWMsRUFDZGdGLGlCQUFpQixFQUNqQjtRQUNBLElBQUlBLGlCQUFpQixDQUFDeFgsUUFBUSxDQUFDcVMsWUFBWSxDQUFDLEVBQUU7VUFDNUMsSUFBSXJNLE1BQU0sR0FBR29NLFNBQVMsQ0FBQ0MsWUFBWSxDQUFDLENBQ2xDRyxjQUFjLENBQUNFLE9BQU8sQ0FBQyxDQUFDeEksSUFBSSxDQUFDLENBQzdCakYsa0JBQWtCLENBQ2hCdU4sY0FBYyxDQUFDRSxPQUFPLENBQUMsQ0FBQ3hJLElBQUksQ0FBQyxFQUM3QnBFLDhCQUE4QixDQUFDd00sd0JBQXdCLENBQ3pELENBQUMsQ0FDQSxFQUNESSxPQUNGLENBQUM7VUFDRCxPQUFPMU0sTUFBTTtRQUNmLENBQUMsTUFBTSxJQUFJcU0sWUFBWSxLQUFLLGdDQUFnQyxFQUFFO1VBQzVELElBQUlyTSxRQUFNLEdBQUdvTSxTQUFTLENBQUNDLFlBQVksQ0FBQyxDQUNsQ0csY0FBYyxDQUFDRSxPQUFPLENBQUMsQ0FBQ3hJLElBQUksQ0FBQyxDQUM3QmpGLGtCQUFrQixDQUNoQnVOLGNBQWMsQ0FBQ0UsT0FBTyxDQUFDLENBQUN4SSxJQUFJLENBQUMsRUFDN0JwRSw4QkFBOEIsQ0FBQ3dNLHdCQUF3QixDQUN6RCxDQUFDLENBQ0EsRUFDREUsY0FBYyxDQUFDRSxPQUFPLENBQUMsQ0FBQ3hJLElBQUksQ0FBQyxDQUFDLDJCQUEyQixDQUMzRCxDQUFDO1VBQ0QsT0FBT2xFLFFBQU07UUFDZixDQUFDLE1BQU07VUFDTCxJQUFJQSxRQUFNLEdBQUdvTSxTQUFTLENBQUNDLFlBQVksQ0FBQyxDQUNsQ0csY0FBYyxDQUFDRSxPQUFPLENBQUMsQ0FBQ3hJLElBQUksQ0FBQyxDQUM3QmpGLGtCQUFrQixDQUNoQnVOLGNBQWMsQ0FBQ0UsT0FBTyxDQUFDLENBQUN4SSxJQUFJLENBQUMsRUFDN0JwRSw4QkFBOEIsQ0FBQ3dNLHdCQUF3QixDQUN6RCxDQUFDLENBRUgsQ0FBQztVQUNELE9BQU90TSxRQUFNO1FBQ2Y7TUFDRixDQUFDO01BQUEsSUF0Y0t5UixVQUFVO1FBQ2QsU0FBQUEsV0FBQSxFQUFjO1VBQUE1RSxlQUFBLE9BQUE0RSxVQUFBO1VBQ1osSUFBSSxDQUFDM0UsWUFBWSxHQUFHLElBQUk7VUFDeEIsSUFBSSxDQUFDQyxrQkFBa0IsR0FBRyxJQUFJO1VBQzlCLElBQUksQ0FBQ0MsZ0JBQWdCLEdBQUcsSUFBSTtVQUM1QixJQUFJLENBQUNDLG1CQUFtQixHQUFHLElBQUk7VUFDL0IsSUFBSSxDQUFDQyxvQkFBb0IsR0FBRyxJQUFJO1VBQ2hDLElBQUksQ0FBQ0MsdUJBQXVCLEdBQUcsSUFBSTtVQUNuQyxJQUFJLENBQUNDLDBCQUEwQixHQUFHLElBQUk7VUFDdEMsSUFBSSxDQUFDQyxxQkFBcUIsR0FBRyxJQUFJO1VBQ2pDLElBQUksQ0FBQ0Msc0JBQXNCLEdBQUcsSUFBSTtVQUNsQyxJQUFJLENBQUNDLFFBQVEsR0FBRyxJQUFJO1VBQ3BCLElBQUksQ0FBQ0MsYUFBYSxHQUFHLElBQUk7VUFDekIsSUFBSSxDQUFDQyxZQUFZLEdBQUcsSUFBSTtVQUN4QixJQUFJLENBQUNDLGdCQUFnQixHQUFHLElBQUk7VUFDNUIsSUFBSSxDQUFDQywwQkFBMEIsR0FBRyxJQUFJO1VBQ3RDLElBQUksQ0FBQ0MsYUFBYSxHQUFHLElBQUk7VUFDekIsSUFBSSxDQUFDQyxZQUFZLEdBQUcsSUFBSTtRQUMxQjtRQUFDQyxZQUFBLENBQUEyRCxVQUFBO1VBQUF0UyxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQW9CLG1CQUNFakwsSUFBSSxFQUtKO1lBQUEsSUFKQWtMLElBQUksR0FBQTVLLFNBQUEsQ0FBQXJILE1BQUEsUUFBQXFILFNBQUEsUUFBQXZELFNBQUEsR0FBQXVELFNBQUEsTUFBRyxLQUFLO1lBQUEsSUFDWjZLLE9BQU8sR0FBQTdLLFNBQUEsQ0FBQXJILE1BQUEsUUFBQXFILFNBQUEsUUFBQXZELFNBQUEsR0FBQXVELFNBQUEsTUFBRyxJQUFJO1lBQUEsSUFDZGpCLE9BQU8sR0FBQWlCLFNBQUEsQ0FBQXJILE1BQUEsUUFBQXFILFNBQUEsUUFBQXZELFNBQUEsR0FBQXVELFNBQUEsTUFBRyxJQUFJO1lBQUEsSUFDZDhLLFlBQVksR0FBQTlLLFNBQUEsQ0FBQXJILE1BQUEsUUFBQXFILFNBQUEsUUFBQXZELFNBQUEsR0FBQXVELFNBQUEsTUFBRyxDQUFDO1lBRWhCLElBQUkrSyxZQUFZLEdBQUdwTSxDQUFDLENBQUNvTSxZQUFZLENBQUMsQ0FBQztZQUNuQ0EsWUFBWSxDQUFDckwsSUFBSSxHQUFHQSxJQUFJO1lBQ3hCcUwsWUFBWSxDQUFDcEwsT0FBTyxHQUFHO2NBQUVELElBQUksRUFBSkEsSUFBSTtjQUFFa0wsSUFBSSxFQUFKQSxJQUFJO2NBQUVDLE9BQU8sRUFBUEEsT0FBTztjQUFFOUwsT0FBTyxFQUFQQSxPQUFPO2NBQUUrTCxZQUFZLEVBQVpBO1lBQWEsQ0FBQztZQUNyRSxPQUFPQyxZQUFZO1VBQ3JCO1FBQUM7VUFBQWhQLEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBeUIsb0JBQW9CdEwsSUFBSSxFQUFFO1lBQ3hCLElBQUk0TyxjQUFjLEdBQUczUCxDQUFDLENBQUN1TSxrQkFBa0IsQ0FBQztjQUFFeEwsSUFBSSxFQUFFQTtZQUFLLENBQUMsQ0FBQztZQUN6RCxPQUFPNE8sY0FBYztVQUN2QjtRQUFDO1VBQUF2UyxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQTRCLGlCQUFpQkMsVUFBVSxFQUFFQyxrQkFBa0IsRUFBRTtZQUMvQ0Esa0JBQWtCLEdBQUdBLGtCQUFrQixJQUFJLEVBQUU7WUFDN0MsQ0FBQ0Esa0JBQWtCLElBQUksRUFBRSxFQUFFdk4sT0FBTyxDQUFDLFVBQUN3TixJQUFJLEVBQUs7Y0FDM0NBLElBQUksQ0FBQ2hOLEtBQUssQ0FBQzhNLFVBQVUsQ0FBQztZQUN4QixDQUFDLENBQUM7VUFDSjtRQUFDO1VBQUFyUCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQWdDLG1DQUFtQ0Ysa0JBQWtCLEVBQUU7WUFDckQsSUFBSTdMLEtBQUs7WUFDVCxJQUFJNkwsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkMrQyxLQUFLLEdBQUcsSUFBSSxDQUFDbUwsa0JBQWtCLENBQzdCLGdDQUFnQyxFQUNoQyxLQUFLLEVBQ0wsSUFDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDd0ssMEJBQTBCLEdBQUd4SyxLQUFLO1lBQ3ZDLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQWlDLGdDQUFnQ0gsa0JBQWtCLEVBQUU7WUFDbEQsSUFBSTdMLEtBQUs7WUFDVCxJQUFJNkwsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkMrQyxLQUFLLEdBQUcsSUFBSSxDQUFDbUwsa0JBQWtCLENBQzdCLGdDQUFnQyxFQUNoQyxLQUFLLEVBQ0wsSUFBSSxFQUNKLElBQUksRUFDSixFQUNGLENBQUM7Y0FDRCxJQUFJLENBQUNRLGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7WUFDbEQsQ0FBQyxNQUFNO2NBQ0w3TCxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRCxJQUFJLENBQUN1Syx1QkFBdUIsR0FBR3ZLLEtBQUs7WUFDcEMsT0FBT0EsS0FBSztVQUNkO1FBQUM7VUFBQXpELEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBa0MsNEJBQTRCSixrQkFBa0IsRUFBRS9CLE9BQU8sRUFBRTtZQUN2RCxJQUFJOUosS0FBSztZQUNULElBQUk2TCxrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQytDLEtBQUssR0FBRyxJQUFJLENBQUNtTCxrQkFBa0IsSUFBQW5NLE1BQUEsQ0FDMUI4SyxPQUFPLE9BQUE5SyxNQUFBLENBQUkrUCxxQkFBcUIsR0FDbkMsS0FBSyxFQUNMLElBQ0YsQ0FBQztjQUNELElBQUksQ0FBQ3BELGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7WUFDbEQsQ0FBQyxNQUFNO2NBQ0w3TCxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRCxJQUFJLENBQUNxSyxtQkFBbUIsR0FBR3JLLEtBQUs7WUFDaEMsT0FBT0EsS0FBSztVQUNkO1FBQUM7VUFBQXpELEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBbUMseUJBQXlCTCxrQkFBa0IsRUFBRS9CLE9BQU8sRUFBRTtZQUNwRCxJQUFJOUosS0FBSztZQUNULElBQUk2TCxrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQytDLEtBQUssR0FBRyxJQUFJLENBQUNtTCxrQkFBa0IsSUFBQW5NLE1BQUEsQ0FDMUI4SyxPQUFPLE9BQUE5SyxNQUFBLENBQUlnUSxxQkFBcUIsR0FDbkMsS0FBSyxFQUNMLElBQ0YsQ0FBQztjQUNELElBQUksQ0FBQ3JELGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7WUFDbEQsQ0FBQyxNQUFNO2NBQ0w3TCxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRCxJQUFJLENBQUNvSyxnQkFBZ0IsR0FBR3BLLEtBQUs7WUFDN0IsT0FBT0EsS0FBSztVQUNkO1FBQUM7VUFBQXpELEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBb0MsNkJBQTZCTixrQkFBa0IsRUFBRS9CLE9BQU8sRUFBRTtZQUN4RGpRLE9BQU8sQ0FBQ2tDLEdBQUcsQ0FBQyx5Q0FBeUMsRUFBRThQLGtCQUFrQixFQUFFL0IsT0FBTyxDQUFDO1lBQ25GLElBQUk5SixLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixJQUFBbk0sTUFBQSxDQUMxQjhLLE9BQU8sT0FBQTlLLE1BQUEsQ0FBSWlRLHFCQUFxQixHQUNuQyxLQUFLLEVBQ0wsSUFDRixDQUFDO2NBQ0QsSUFBSSxDQUFDdEQsZ0JBQWdCLENBQUMzTCxLQUFLLEVBQUU2TCxrQkFBa0IsQ0FBQztZQUNsRCxDQUFDLE1BQU07Y0FDTDdMLEtBQUssR0FBRyxJQUFJO1lBQ2Q7WUFBQztZQUNELElBQUksQ0FBQ3NLLG9CQUFvQixHQUFHdEssS0FBSztZQUNqQyxPQUFPQSxLQUFLO1VBQ2Q7UUFBQztVQUFBekQsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUFxQywrQkFDRVAsa0JBQWtCLEVBQ2xCUSxtQkFBbUIsRUFDbkI7WUFDQXhTLE9BQU8sQ0FBQ2tDLEdBQUcsQ0FBQywyQ0FBMkMsRUFBRThQLGtCQUFrQixFQUFFUSxtQkFBbUIsQ0FBQztZQUNqRyxJQUFJck0sS0FBSztZQUNULElBQUk2TCxrQkFBa0IsSUFBSTVPLFNBQVMsSUFBSW9QLG1CQUFtQixJQUFJcFAsU0FBUyxFQUFFO2NBQ3ZFLElBQUlxUCxpQkFBaUIsR0FBRyxJQUFJLENBQUNkLG1CQUFtQixDQUFDLGFBQWEsQ0FBQztjQUMvRHhMLEtBQUssR0FBRyxJQUFJLENBQUNtTCxrQkFBa0IsQ0FDN0Isc0JBQXNCLEVBQ3RCLElBQUksRUFDSixJQUNGLENBQUM7Y0FDRCxJQUFJLENBQUNRLGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7Y0FDaEQ3TCxLQUFLLENBQUN0QixRQUFRLENBQUM0TixpQkFBaUIsQ0FBQztjQUNqQyxJQUFJLENBQUNYLGdCQUFnQixDQUFDVyxpQkFBaUIsRUFBRUQsbUJBQW1CLENBQUM7WUFDL0QsQ0FBQyxNQUFNO2NBQ0xyTSxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRG5HLE9BQU8sQ0FBQ2tDLEdBQUcsQ0FBQyxxQ0FBcUMsRUFBRWlFLEtBQUssQ0FBQztZQUN6RCxJQUFJLENBQUMwSyxzQkFBc0IsR0FBRzFLLEtBQUs7WUFDbkMsT0FBT0EsS0FBSztVQUNkO1FBQUM7VUFBQXpELEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBd0MsOEJBQThCVixrQkFBa0IsRUFBRTtZQUNoRCxJQUFJN0wsS0FBSztZQUNULElBQUk2TCxrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQytDLEtBQUssR0FBRyxJQUFJLENBQUNtTCxrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDO2NBQy9ELElBQUksQ0FBQ1EsZ0JBQWdCLENBQUMzTCxLQUFLLEVBQUU2TCxrQkFBa0IsQ0FBQztZQUNsRCxDQUFDLE1BQU07Y0FDTDdMLEtBQUssR0FBRyxJQUFJO1lBQ2Q7WUFBQztZQUNELElBQUksQ0FBQ3lLLHFCQUFxQixHQUFHekssS0FBSztZQUNsQyxPQUFPQSxLQUFLO1VBQ2Q7UUFBQztVQUFBekQsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUF5QyxxQkFBcUJYLGtCQUFrQixFQUFFL0IsT0FBTyxFQUFFO1lBQ2hELElBQUk5SixLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixJQUFBbk0sTUFBQSxDQUMxQjhLLE9BQU8sZ0JBQ1YsS0FBSyxFQUNMLElBQ0YsQ0FBQztjQUNELElBQUksQ0FBQzZCLGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7WUFDbEQsQ0FBQyxNQUFNO2NBQ0w3TCxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRCxJQUFJLENBQUNrSyxZQUFZLEdBQUdsSyxLQUFLO1lBQ3pCLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQTBDLDJCQUEyQlosa0JBQWtCLEVBQUUvQixPQUFPLEVBQUU7WUFDdEQsSUFBSTlKLEtBQUs7WUFDVCxJQUFJNkwsa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkMrQyxLQUFLLEdBQUcsSUFBSSxDQUFDbUwsa0JBQWtCLElBQUFuTSxNQUFBLENBQzFCOEssT0FBTywyQkFDVixJQUFJLEVBQ0osS0FBSyxFQUNMLEtBQ0YsQ0FBQztjQUNELElBQUksQ0FBQzZCLGdCQUFnQixDQUFDM0wsS0FBSyxFQUFFNkwsa0JBQWtCLENBQUM7WUFDbEQsQ0FBQyxNQUFNO2NBQ0w3TCxLQUFLLEdBQUcsSUFBSTtZQUNkO1lBQUM7WUFDRCxJQUFJLENBQUNtSyxrQkFBa0IsR0FBR25LLEtBQUs7WUFDL0IsT0FBT0EsS0FBSztVQUNkO1FBQUM7VUFBQXpELEdBQUE7VUFBQXdOLEtBQUEsRUFFRCxTQUFBMkMscUJBQXFCYixrQkFBa0IsRUFBRTtZQUN2QyxJQUFJSixhQUFhO1lBQ2pCLElBQUlJLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25Dd08sYUFBYSxHQUFHLElBQUksQ0FBQ0QsbUJBQW1CLENBQUMscUJBQXFCLENBQUM7Y0FDL0QsSUFBSSxDQUFDRyxnQkFBZ0IsQ0FBQ0YsYUFBYSxFQUFFSSxrQkFBa0IsQ0FBQztZQUMxRCxDQUFDLE1BQU07Y0FDTEosYUFBYSxHQUFHLElBQUk7WUFDdEI7WUFBQztZQUNELElBQUksQ0FBQ1osWUFBWSxHQUFHWSxhQUFhO1lBQ2pDLE9BQU9BLGFBQWE7VUFDdEI7UUFBQztVQUFBbFAsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUE0QyxpQkFBaUJkLGtCQUFrQixFQUFFO1lBQ25DLElBQUlKLGFBQWE7WUFDakIsSUFBSUksa0JBQWtCLElBQUk1TyxTQUFTLEVBQUU7Y0FDbkN3TyxhQUFhLEdBQUcsSUFBSSxDQUFDRCxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQztjQUM5RCxJQUFJLENBQUNHLGdCQUFnQixDQUFDRixhQUFhLEVBQUVJLGtCQUFrQixDQUFDO1lBQzFELENBQUMsTUFBTTtjQUNMSixhQUFhLEdBQUcsSUFBSTtZQUN0QjtZQUFDO1lBQ0QsSUFBSSxDQUFDZCxRQUFRLEdBQUdjLGFBQWE7WUFDN0IsT0FBT0EsYUFBYTtVQUN0QjtRQUFDO1VBQUFsUCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQTZDLHNCQUFzQmYsa0JBQWtCLEVBQUU7WUFDeEMsSUFBSUosYUFBYTtZQUNqQixJQUFJSSxrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQ3dPLGFBQWEsR0FBRyxJQUFJLENBQUNELG1CQUFtQixDQUN0QyxzQkFBc0IsRUFDdEIsS0FDRixDQUFDO2NBQ0QsSUFBSSxDQUFDRyxnQkFBZ0IsQ0FBQ0YsYUFBYSxFQUFFSSxrQkFBa0IsQ0FBQztZQUMxRCxDQUFDLE1BQU07Y0FDTEosYUFBYSxHQUFHLElBQUk7WUFDdEI7WUFBQztZQUNELElBQUksQ0FBQ2IsYUFBYSxHQUFHYSxhQUFhO1lBQ2xDLE9BQU9BLGFBQWE7VUFDdEI7UUFBQztVQUFBbFAsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUE4QyxtQ0FBbUNoQixrQkFBa0IsRUFBRTtZQUNyRCxJQUFJN0wsS0FBSztZQUNULElBQUk2TCxrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQytDLEtBQUssR0FBRyxJQUFJLENBQUNtTCxrQkFBa0IsQ0FDN0IsbUNBQW1DLEVBQ25DLEtBQ0YsQ0FBQztjQUNELElBQUksQ0FBQ1EsZ0JBQWdCLENBQUMzTCxLQUFLLEVBQUU2TCxrQkFBa0IsQ0FBQztZQUNsRCxDQUFDLE1BQU07Y0FDTDdMLEtBQUssR0FBRyxJQUFJO1lBQ2Q7WUFBQztZQUNELElBQUksQ0FBQytLLDBCQUEwQixHQUFHL0ssS0FBSztZQUN2QyxPQUFPQSxLQUFLO1VBQ2Q7UUFBQztVQUFBekQsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUErQyx5QkFBeUJqQixrQkFBa0IsRUFBRTtZQUMzQyxJQUFJN0wsS0FBSztZQUNULElBQUk2TCxrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQytDLEtBQUssR0FBRyxJQUFJLENBQUNtTCxrQkFBa0IsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUM7Y0FDN0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDOEssZ0JBQWdCLEdBQUc5SyxLQUFLO1lBQzdCLE9BQU9BLEtBQUs7VUFDZDtRQUFDO1VBQUF6RCxHQUFBO1VBQUF3TixLQUFBLEVBRUQsU0FBQWdELHNCQUFzQmxCLGtCQUFrQixFQUFFO1lBQ3hDLElBQUk3TCxLQUFLO1lBQ1QsSUFBSTZMLGtCQUFrQixJQUFJNU8sU0FBUyxFQUFFO2NBQ25DK0MsS0FBSyxHQUFHLElBQUksQ0FBQ21MLGtCQUFrQixDQUM3QixvQ0FBb0MsRUFDcEMsS0FDRixDQUFDO2NBQ0QsSUFBSSxDQUFDUSxnQkFBZ0IsQ0FBQzNMLEtBQUssRUFBRTZMLGtCQUFrQixDQUFDO1lBQ2xELENBQUMsTUFBTTtjQUNMN0wsS0FBSyxHQUFHLElBQUk7WUFDZDtZQUFDO1lBQ0QsSUFBSSxDQUFDZ0wsYUFBYSxHQUFHaEwsS0FBSztZQUMxQixPQUFPQSxLQUFLO1VBQ2Q7UUFBQztVQUFBekQsR0FBQTtVQUFBd04sS0FBQSxFQUVELFNBQUFpRCxxQkFBcUJuQixrQkFBa0IsRUFBRTtZQUN2QyxJQUFJN0wsS0FBSztZQUNULElBQUk2TCxrQkFBa0IsSUFBSTVPLFNBQVMsRUFBRTtjQUNuQytDLEtBQUssR0FBRyxJQUFJLENBQUNtTCxrQkFBa0IsQ0FDN0Isb0NBQW9DLEVBQ3BDLEtBQ0YsQ0FBQztjQUNELElBQUksQ0FBQ1EsZ0JBQWdCLENBQUMzTCxLQUFLLEVBQUU2TCxrQkFBa0IsQ0FBQztZQUNsRCxDQUFDLE1BQU07Y0FDTDdMLEtBQUssR0FBRyxJQUFJO1lBQ2Q7WUFBQztZQUNELElBQUksQ0FBQ2lMLFlBQVksR0FBR2pMLEtBQUs7WUFDekIsT0FBT0EsS0FBSztVQUNkO1FBQUM7UUFBQSxPQUFBNk8sVUFBQTtNQUFBO01BR0g7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO01BQ003TixpQkFBaUIsR0FBRyxTQUFTaU0seUJBQXlCQSxDQUNwRDNMLElBQUksRUFDSnNJLGNBQWMsRUFDZEUsT0FBTyxFQUVQO1FBQUEsSUFEQW9GLGVBQWUsR0FBQTFPLFNBQUEsQ0FBQXJILE1BQUEsUUFBQXFILFNBQUEsUUFBQXZELFNBQUEsR0FBQXVELFNBQUEsTUFBRyxLQUFLO1FBRXZCLElBQU0wTSxTQUFTLEdBQUdDLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUM7UUFDNUIsSUFBSXBULGFBQWE7UUFDakIsSUFBSWtWLGVBQWUsSUFBSSxLQUFLLEVBQUU7VUFBQSxJQUFBQyxZQUFBLEdBQ0NsUSxVQUFVLENBQUNoSSxNQUFNLENBQUNDLFFBQVEsQ0FBQ0MsSUFBSSxDQUFDO1VBQUEsSUFBQWlZLFlBQUEsR0FBQXhPLGNBQUEsQ0FBQXVPLFlBQUE7VUFBNUR0UixTQUFTLEdBQUF1UixZQUFBO1VBQUVwVixhQUFhLEdBQUFvVixZQUFBO1FBQzNCO1FBQ0EsSUFBSTtVQUNGLElBQUloUixNQUFNLEdBQUcsQ0FBQyxDQUFDO1VBQ2YsSUFBSWlSLGFBQWEsR0FBRyxJQUFJUixVQUFVLENBQUMsQ0FBQztVQUNwQyxJQUFNRCxpQkFBaUIsR0FBRyxDQUN4Qiw2QkFBNkIsRUFDN0IsMEJBQTBCLEVBQzFCLDhCQUE4QixFQUM5QixzQkFBc0IsRUFDdEIsNEJBQTRCLENBQzdCO1VBQ0QsS0FBSyxJQUFJcEIsU0FBUyxJQUFJNkIsYUFBYSxFQUFFO1lBQ25DLElBQ0UsQ0FBQzdCLFNBQVMsQ0FBQ0MsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUMxQjRCLGFBQWEsQ0FBQzdCLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFDakM7Y0FDQSxJQUFJL0QsWUFBWSxjQUFBekssTUFBQSxDQUFjd08sU0FBUyxDQUNwQ2xRLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FDVEMsV0FBVyxDQUFDLENBQUMsRUFBQXlCLE1BQUEsQ0FBR3dPLFNBQVMsQ0FBQ0UsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFFO2NBQ3ZDLElBQUlDLE1BQU0sR0FBRzBCLGFBQWEsQ0FBQzVGLFlBQVksQ0FBQztjQUN4QyxJQUFJLE9BQU9rRSxNQUFNLEtBQUssVUFBVSxFQUFFO2dCQUNoQ3ZQLE1BQU0sQ0FBQ29QLFNBQVMsQ0FBQyxHQUFHakUsY0FBYSxDQUMvQjhGLGFBQWEsRUFDYjVGLFlBQVksRUFDWitELFNBQVMsRUFDVGxNLElBQUksRUFDSndJLE9BQU8sRUFDUEYsY0FBYyxFQUNkZ0YsaUJBQ0YsQ0FBQztjQUNILENBQUMsTUFBTTtnQkFDTC9VLE9BQU8sQ0FBQ2tDLEdBQUcsa0JBQUFpRCxNQUFBLENBQWtCeUssWUFBWSxzQkFBbUIsQ0FBQztjQUMvRDtZQUNGO1VBQ0Y7VUFFQXJMLE1BQU0sR0FBR3ZCLE1BQU0sQ0FBQytRLFdBQVcsQ0FDekIvUSxNQUFNLENBQUNnUixPQUFPLENBQUN6UCxNQUFNLENBQUMsQ0FBQzBQLE1BQU0sQ0FBQyxVQUFBd0IsS0FBQTtZQUFBLElBQUFDLEtBQUEsR0FBQTNPLGNBQUEsQ0FBQTBPLEtBQUE7Y0FBRXJCLENBQUMsR0FBQXNCLEtBQUE7Y0FBRTlLLENBQUMsR0FBQThLLEtBQUE7WUFBQSxPQUFNOUssQ0FBQyxLQUFLLElBQUk7VUFBQSxFQUN0RCxDQUFDO1VBQ0Q1SyxPQUFPLENBQUNrQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUVxQyxNQUFNLENBQUM7VUFFckMsSUFBSThRLGVBQWUsS0FBSyxLQUFLLEVBQUU7WUFDN0IsT0FBTzlRLE1BQU07VUFDZixDQUFDLE1BQU07WUFDTFAsU0FBUyxDQUFDc0ksRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFVck8sS0FBSyxFQUFFO2NBQzFDQSxLQUFLLENBQUNrSSxLQUFLLENBQUN4QixZQUFZLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUM7WUFDRjNFLE9BQU8sQ0FBQ2tDLEdBQUcsQ0FBQywrQkFBK0IsRUFBRXFDLE1BQU0sQ0FBQztZQUNwRFAsU0FBUyxHQUFHWSxjQUFjLENBQUNaLFNBQVMsRUFBRU8sTUFBTSxDQUFDO1lBQzdDRCxjQUFjLENBQUNOLFNBQVMsRUFBRU8sTUFBTSxDQUFDO1lBQ2pDbEQsa0JBQWtCLENBQUMyQyxTQUFTLENBQUM7WUFDN0JoQixNQUFNLENBQUNrRSxJQUFJLENBQUMzQyxNQUFNLENBQUMsQ0FBQ0UsT0FBTyxDQUFDLFVBQUNDLFNBQVMsRUFBSztjQUN6QyxRQUFRSCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDMkIsSUFBSTtnQkFDNUIsS0FBS2pELFNBQVM7a0JBQ1osSUFDRSxDQUFDLElBQUErQixNQUFBLENBQUk4SyxPQUFPLDBCQUF1QixDQUFDMVMsUUFBUSxDQUMxQ2dILE1BQU0sQ0FBQ0csU0FBUyxDQUFDLENBQUM0QixPQUFPLENBQUNELElBQzVCLENBQUMsRUFDRDtvQkFDQWxHLGFBQWEsQ0FBQ3FHLFVBQVUsQ0FDdEJqQyxNQUFNLENBQUNHLFNBQVMsQ0FBQyxFQUNqQkgsTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQzRCLE9BQU8sQ0FBQ0QsSUFDNUIsQ0FBQztrQkFDSDtrQkFDQTtnQkFDRjtrQkFDRSxJQUNFLENBQUMsSUFBQWxCLE1BQUEsQ0FBSThLLE9BQU8sMEJBQXVCLENBQUMxUyxRQUFRLENBQUNnSCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDMkIsSUFBSSxDQUFDLEVBQ3BFO29CQUNBbEcsYUFBYSxDQUFDcUcsVUFBVSxDQUN0QmpDLE1BQU0sQ0FBQ0csU0FBUyxDQUFDLEVBQ2pCSCxNQUFNLENBQUNHLFNBQVMsQ0FBQyxDQUFDMkIsSUFDcEIsQ0FBQztrQkFDSDtjQUNKO1lBQ0YsQ0FBQyxDQUFDO1lBRUZyRyxPQUFPLENBQUNrQyxHQUFHLGdDQUFBaUQsTUFBQSxDQUNzQixDQUFDLENBQUNtTyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLFNBQVMsSUFBSSxJQUFJLEVBQUVnQixPQUFPLENBQ3RFLENBQ0YsQ0FBQyxhQUNILENBQUM7WUFFRCxPQUFPclEsU0FBUztVQUNsQjtRQUNGLENBQUMsQ0FBQyxPQUFPa0IsQ0FBQyxFQUFFO1VBQ1ZsRixPQUFPLENBQUNDLEtBQUssQ0FBQ2lGLENBQUMsQ0FBQztVQUNoQixPQUFPLElBQUk7UUFDYjtNQUNGLENBQUM7SUF3REg7SUFBQztJQUVELElBQU15USxxQkFBcUIsR0FBRztNQUM1QkMsT0FBTyxFQUFFLFNBQVM7TUFDbEJDLE1BQU0sRUFBRSxRQUFRO01BQ2hCQyxTQUFTLEVBQUUsV0FBVztNQUN0QkMsZ0JBQWdCLEVBQUUsa0JBQWtCO01BQ3BDQyxLQUFLLEVBQUU7SUFDVCxDQUFDO0lBRUQsSUFBTW5PLGNBQWMsR0FBRztNQUNyQm9PLGFBQWEsRUFBRU4scUJBQXFCLENBQUNDLE9BQU87TUFDNUNNLG9CQUFvQixFQUFFUCxxQkFBcUIsQ0FBQ0MsT0FBTztNQUNuRE8sa0JBQWtCLEVBQUVSLHFCQUFxQixDQUFDQyxPQUFPO01BQ2pEUSwwQkFBMEIsRUFBRVQscUJBQXFCLENBQUNDLE9BQU87TUFDekRTLHFCQUFxQixFQUFFVixxQkFBcUIsQ0FBQ0MsT0FBTztNQUNwRFUsc0JBQXNCLEVBQUVYLHFCQUFxQixDQUFDQyxPQUFPO01BQ3JEVyw2QkFBNkIsRUFBRVoscUJBQXFCLENBQUNDLE9BQU87TUFDNURZLHVCQUF1QixFQUFFYixxQkFBcUIsQ0FBQ0MsT0FBTztNQUN0RGEsd0JBQXdCLEVBQUVkLHFCQUFxQixDQUFDQyxPQUFPO01BQ3ZEYyx5QkFBeUIsRUFBRWYscUJBQXFCLENBQUNFLE1BQU07TUFDdkRjLGFBQWEsRUFBRWhCLHFCQUFxQixDQUFDRSxNQUFNO01BQzNDZSxTQUFTLEVBQUVqQixxQkFBcUIsQ0FBQ0UsTUFBTTtNQUN2Q2dCLGNBQWMsRUFBRWxCLHFCQUFxQixDQUFDRSxNQUFNO01BQzVDaUIsaUJBQWlCLEVBQUVuQixxQkFBcUIsQ0FBQ0ksZ0JBQWdCO01BQ3pEZ0IsNkJBQTZCLEVBQUVwQixxQkFBcUIsQ0FBQ0csU0FBUztNQUM5RGtCLGFBQWEsRUFBRXJCLHFCQUFxQixDQUFDSSxnQkFBZ0I7TUFDckRrQixZQUFZLEVBQUV0QixxQkFBcUIsQ0FBQ0k7SUFDdEMsQ0FBQztJQStCQTtJQTZCQTtJQThCQTtJQW9LQTtJQUlBO0lBeUJBO0lBb0JBO0lBZ0RBO0lBMEJBO0lBT0E7SUFFRCxJQUFNMUksNkJBQTZCLEdBQUc7TUFDcEM2SixhQUFhLEVBQUUsU0FBUzVPLGtCQUFrQkEsQ0FBQ2lDLE9BQU8sRUFBRTtRQUNsRCxPQUFPO1VBQ0w0TSxTQUFTLEVBQUUsU0FBUztVQUNwQkMsS0FBSyxFQUFFLE9BQU87VUFDZEMsTUFBTSxFQUFFLENBQUM7VUFDVEMsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNILENBQUM7TUFDREMsb0JBQW9CLEVBQUUsU0FBU0MsbUJBQW1CQSxDQUFDak4sT0FBTyxFQUFFO1FBQzFELE9BQU87VUFDTDRNLFNBQVMsRUFBRSxhQUFhO1VBQ3hCQyxLQUFLLEVBQUUsU0FBUztVQUNoQkMsTUFBTSxFQUFFLENBQUM7VUFDVEMsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNILENBQUM7TUFDRDNOLGtCQUFrQixFQUFFLFNBQVNyQixrQkFBa0JBLENBQUNpQyxPQUFPLEVBQUU7UUFDdkQsT0FBTztVQUNMNE0sU0FBUyxFQUFFLFNBQVM7VUFDcEJDLEtBQUssRUFBRSxPQUFPO1VBQ2RDLE1BQU0sRUFBRSxDQUFDO1VBQ1RDLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSCxDQUFDO01BQ0R4TiwwQkFBMEIsRUFBRSxTQUFTMk4saUJBQWlCQSxDQUNwRGxOLE9BQU8sRUFBQW1OLEtBQUEsRUFFUDtRQUFBLElBREVoSyxZQUFZLEdBQUFnSyxLQUFBLENBQVpoSyxZQUFZO1FBRWQsSUFDRSxDQUFDbkQsT0FBTyxJQUNSLENBQUNBLE9BQU8sQ0FBQ00sVUFBVSxJQUNuQixDQUFDNkMsWUFBWSxJQUNiL0ssT0FBQSxDQUFPK0ssWUFBWSxNQUFLLFFBQVEsRUFDaEM7VUFDQTFOLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDLGdEQUFnRCxDQUFDO1VBQy9EO1FBQ0Y7UUFFQSxJQUFJMFgsVUFBVSxHQUFHL0osZUFBZSxDQUFDckQsT0FBTyxDQUFDTSxVQUFVLENBQUMrTSxNQUFNLENBQUM7UUFDM0QsSUFBSUMsU0FBUyxHQUFHbkssWUFBWSxDQUFDeEssY0FBYyxDQUFDeVUsVUFBVSxDQUFDLEdBQ25EakssWUFBWSxDQUFDaUssVUFBVSxDQUFDLEdBQ3hCLENBQUM7UUFDTCxJQUFJUCxLQUFLLEdBQUcsYUFBYTtRQUN6QixJQUFJVSxNQUFNLEdBQUcsYUFBYTtRQUUxQixJQUFJRCxTQUFTLEtBQUssQ0FBQyxFQUFFO1VBQ25CLElBQUlFLFFBQVEsR0FBR0YsU0FBUyxHQUFHLEdBQUc7VUFDOUIsSUFBSUcsVUFBVSxHQUFJSCxTQUFTLElBQUksQ0FBQyxHQUFJLEdBQUc7VUFDdkMsSUFBSUksU0FBUyxHQUFJSixTQUFTLElBQUksRUFBRSxHQUFJLEdBQUc7VUFFdkNULEtBQUssT0FBQWpTLE1BQUEsQ0FBTzRTLFFBQVEsQ0FBQ0csUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFBaFQsTUFBQSxDQUFHNlMsVUFBVSxDQUM1REUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUNaQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFBaFQsTUFBQSxDQUFHOFMsU0FBUyxDQUFDQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUNDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUU7VUFDL0RMLE1BQU0sR0FBRyxPQUFPO1FBQ2xCO1FBRUEsT0FBTztVQUNMWCxTQUFTLEVBQUVDLEtBQUs7VUFDaEJBLEtBQUssRUFBRVUsTUFBTTtVQUNiVCxNQUFNLEVBQUUsQ0FBQztVQUNUQyxTQUFTLEVBQUUsTUFBTTtVQUNqQmMsT0FBTyxFQUFFLElBQUk7VUFDYkMsV0FBVyxFQUFFO1FBQ2YsQ0FBQztNQUNILENBQUM7TUFDRHRPLHFCQUFxQixFQUFFLFNBQVN6QixrQkFBa0JBLENBQUNpQyxPQUFPLEVBQUU7UUFDMUQsT0FBTztVQUNMNE0sU0FBUyxFQUFFLFNBQVM7VUFDcEJDLEtBQUssRUFBRSxPQUFPO1VBQ2RDLE1BQU0sRUFBRSxDQUFDO1VBQ1RDLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSCxDQUFDO01BQ0R0TixzQkFBc0IsRUFBRSxTQUFTMUIsa0JBQWtCQSxDQUFDaUMsT0FBTyxFQUFFO1FBQzNELE9BQU87VUFDTDRNLFNBQVMsRUFBRSxTQUFTO1VBQ3BCQyxLQUFLLEVBQUUsT0FBTztVQUNkQyxNQUFNLEVBQUUsQ0FBQztVQUNUQyxTQUFTLEVBQUU7UUFDYixDQUFDO01BQ0gsQ0FBQztNQUNEck4sNkJBQTZCLEVBQUUsU0FBU3dOLGlCQUFpQkEsQ0FDdkRsTixPQUFPLEVBQUErTixLQUFBLEVBRVA7UUFBQSxJQURFNUssWUFBWSxHQUFBNEssS0FBQSxDQUFaNUssWUFBWTtRQUVkLElBQ0UsQ0FBQ25ELE9BQU8sSUFDUixDQUFDQSxPQUFPLENBQUNNLFVBQVUsSUFDbkIsQ0FBQzZDLFlBQVksSUFDYi9LLE9BQUEsQ0FBTytLLFlBQVksTUFBSyxRQUFRLEVBQ2hDO1VBQ0ExTixPQUFPLENBQUNDLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQztVQUMvRDtRQUNGO1FBRUEsSUFBSXNZLE9BQU8sR0FBRzNLLGVBQWUsQ0FBQ3JELE9BQU8sQ0FBQ00sVUFBVSxDQUFDMk4sTUFBTSxDQUFDO1FBQ3hELElBQUlYLFNBQVMsR0FBR25LLFlBQVksQ0FBQ3hLLGNBQWMsQ0FBQ3FWLE9BQU8sQ0FBQyxHQUNoRDdLLFlBQVksQ0FBQzZLLE9BQU8sQ0FBQyxHQUNyQixDQUFDO1FBQ0wsSUFBSW5CLEtBQUssR0FBRyxhQUFhO1FBQ3pCLElBQUlVLE1BQU0sR0FBRyxhQUFhO1FBRTFCLElBQUlELFNBQVMsS0FBSyxDQUFDLEVBQUU7VUFDbkIsSUFBSUUsUUFBUSxHQUFHRixTQUFTLEdBQUcsR0FBRztVQUM5QixJQUFJRyxVQUFVLEdBQUlILFNBQVMsSUFBSSxDQUFDLEdBQUksR0FBRztVQUN2QyxJQUFJSSxTQUFTLEdBQUlKLFNBQVMsSUFBSSxFQUFFLEdBQUksR0FBRztVQUV2Q1QsS0FBSyxPQUFBalMsTUFBQSxDQUFPNFMsUUFBUSxDQUFDRyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUNDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUFoVCxNQUFBLENBQUc2UyxVQUFVLENBQzVERSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQ1pDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUFoVCxNQUFBLENBQUc4UyxTQUFTLENBQUNDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBRTtVQUMvREwsTUFBTSxHQUFHLE9BQU87UUFDbEI7UUFFQSxPQUFPO1VBQ0xYLFNBQVMsRUFBRUMsS0FBSztVQUNoQkEsS0FBSyxFQUFFVSxNQUFNO1VBQ2JULE1BQU0sRUFBRSxDQUFDO1VBQ1RDLFNBQVMsRUFBRSxNQUFNO1VBQ2pCYyxPQUFPLEVBQUUsSUFBSTtVQUNiQyxXQUFXLEVBQUU7UUFDZixDQUFDO01BQ0gsQ0FBQztNQUNESSx1QkFBdUIsRUFBRSxTQUFTblEsa0JBQWtCQSxDQUFDaUMsT0FBTyxFQUFFO1FBQzVELE9BQU87VUFDTDZNLEtBQUssRUFBRSxPQUFPO1VBQ2RELFNBQVMsRUFBRSxTQUFTO1VBQ3BCRSxNQUFNLEVBQUUsQ0FBQztVQUNUQyxTQUFTLEVBQUUsTUFBTTtVQUNqQmMsT0FBTyxFQUFFLElBQUk7VUFDYkMsV0FBVyxFQUFFO1FBQ2YsQ0FBQztNQUNIO0lBQ0YsQ0FBQztJQUVELElBQU1LLE1BQU0sR0FBRyxJQUFJQyxTQUFTLFVBQUF4VCxNQUFBLENBQVV5VCxJQUFJLG1CQUFnQixDQUFDO0lBRTNERixNQUFNLENBQUNHLE1BQU0sR0FBRyxVQUFVM1QsQ0FBQyxFQUFFO01BQzNCbEYsT0FBTyxDQUFDa0MsR0FBRyxDQUFDLHlCQUF5QixDQUFDO0lBQ3hDLENBQUM7SUFFRHdXLE1BQU0sQ0FBQ0ksU0FBUyxHQUFHLFVBQVU3YSxLQUFLLEVBQUU7TUFDbEMrQixPQUFPLENBQUNrQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7TUFDN0IsSUFBTTZCLElBQUksR0FBR2xFLElBQUksQ0FBQ0MsS0FBSyxDQUFDN0IsS0FBSyxDQUFDOEYsSUFBSSxDQUFDO01BQ25DLElBQUlBLElBQUksQ0FBQ2dWLE9BQU8sRUFBRTtRQUNoQixJQUFJQyxtQ0FBbUMsR0FBR2pWLElBQUksQ0FBQ2dWLE9BQU87UUFDdEQ5VSxTQUFTLENBQUMrVSxtQ0FBbUMsQ0FBQztNQUNoRDtJQUNGLENBQUM7SUFFRE4sTUFBTSxDQUFDTyxPQUFPLEdBQUcsVUFBVWhiLEtBQUssRUFBRTtNQUNoQyxJQUFJQSxLQUFLLENBQUNpYixRQUFRLEVBQUU7UUFDbEJsWixPQUFPLENBQUNrQyxHQUFHLG9DQUFBaUQsTUFBQSxDQUMwQmxILEtBQUssQ0FBQ2tiLElBQUksZUFBQWhVLE1BQUEsQ0FBWWxILEtBQUssQ0FBQ21iLE1BQU0sQ0FDdkUsQ0FBQztNQUNILENBQUMsTUFBTTtRQUNMcFosT0FBTyxDQUFDQyxLQUFLLENBQUMsaUJBQWlCLENBQUM7TUFDbEM7SUFDRixDQUFDO0lBRUR5WSxNQUFNLENBQUNXLE9BQU8sR0FBRyxVQUFVcFosS0FBSyxFQUFFO01BQ2hDRCxPQUFPLENBQUNDLEtBQUssOEJBQUFrRixNQUFBLENBQThCbEYsS0FBSyxDQUFFLENBQUM7TUFDbkRELE9BQU8sQ0FBQ2tDLEdBQUcsQ0FBQ2pDLEtBQUssQ0FBQztJQUNwQixDQUFDOztJQUVEO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtFQUNGLENBQUMsTUFBTTtJQUNMcEQsUUFBUSxDQUFDLENBQUM7SUFDVixJQUFNd1csU0FBUyxHQUFHaUcsV0FBVyxDQUFDL0YsR0FBRyxDQUFDLENBQUM7SUFDbkM3VyxDQUFDLENBQUNDLFFBQVEsQ0FBQyxDQUFDQyxLQUFLLENBQUMsWUFBWTtNQUM1QixJQUFNMmMsT0FBTyxHQUFHRCxXQUFXLENBQUMvRixHQUFHLENBQUMsQ0FBQztNQUNqQ3ZULE9BQU8sQ0FBQ2tDLEdBQUcsMEJBQUFpRCxNQUFBLENBQTBCb1UsT0FBTyxHQUFHbEcsU0FBUyxrQkFBZSxDQUFDO01BQ3hFM1csQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDaU0sSUFBSSxDQUFDNlEsT0FBTyxDQUFDO01BQzdCOWMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUNUd0gsT0FBTyxDQUFDLENBQUMsQ0FDVEMsSUFBSSxDQUFDLFlBQVk7UUFDaEJ6SCxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMwSCxPQUFPLENBQUMsWUFBWTtVQUNsQzFILENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQzJILFdBQVcsQ0FBQyxFQUFFLENBQUM7UUFDakMsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ04sQ0FBQyxDQUFDO0VBQ0o7RUFBQztBQUNILENBQUMsQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY2FqdS1kYXNoYm9hcmQtdjIvLi9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwid2VicGFjazovL2NhanUtZGFzaGJvYXJkLXYyLy4vbm9kZV9tb2R1bGVzL2Jyb3RsaS9kZWMvYml0X3JlYWRlci5qcyIsIndlYnBhY2s6Ly9jYWp1LWRhc2hib2FyZC12Mi8uL25vZGVfbW9kdWxlcy9icm90bGkvZGVjL2NvbnRleHQuanMiLCJ3ZWJwYWNrOi8vY2FqdS1kYXNoYm9hcmQtdjIvLi9ub2RlX21vZHVsZXMvYnJvdGxpL2RlYy9kZWNvZGUuanMiLCJ3ZWJwYWNrOi8vY2FqdS1kYXNoYm9hcmQtdjIvLi9ub2RlX21vZHVsZXMvYnJvdGxpL2RlYy9kaWN0aW9uYXJ5LWJyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vY2FqdS1kYXNoYm9hcmQtdjIvLi9ub2RlX21vZHVsZXMvYnJvdGxpL2RlYy9kaWN0aW9uYXJ5LmJpbi5qcyIsIndlYnBhY2s6Ly9jYWp1LWRhc2hib2FyZC12Mi8uL25vZGVfbW9kdWxlcy9icm90bGkvZGVjL2RpY3Rpb25hcnkuanMiLCJ3ZWJwYWNrOi8vY2FqdS1kYXNoYm9hcmQtdjIvLi9ub2RlX21vZHVsZXMvYnJvdGxpL2RlYy9odWZmbWFuLmpzIiwid2VicGFjazovL2NhanUtZGFzaGJvYXJkLXYyLy4vbm9kZV9tb2R1bGVzL2Jyb3RsaS9kZWMvcHJlZml4LmpzIiwid2VicGFjazovL2NhanUtZGFzaGJvYXJkLXYyLy4vbm9kZV9tb2R1bGVzL2Jyb3RsaS9kZWMvc3RyZWFtcy5qcyIsIndlYnBhY2s6Ly9jYWp1LWRhc2hib2FyZC12Mi8uL25vZGVfbW9kdWxlcy9icm90bGkvZGVjL3RyYW5zZm9ybS5qcyIsIndlYnBhY2s6Ly9jYWp1LWRhc2hib2FyZC12Mi8uL25vZGVfbW9kdWxlcy9icm90bGkvZGVjb21wcmVzcy5qcyIsIndlYnBhY2s6Ly9jYWp1LWRhc2hib2FyZC12Mi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jYWp1LWRhc2hib2FyZC12Mi8uL2FwcHMvc3RhdGljL2Fzc2V0cy9kaXN0L2pzL21hcF9hbmRfbGF5ZXJzX3JldHJpZXZlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICB2YXIgaVxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHxcbiAgICAgIHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAyKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMSkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArXG4gICAgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9XG4gICAgICAoKHVpbnQ4W2ldIDw8IDE2KSAmIDB4RkYwMDAwKSArXG4gICAgICAoKHVpbnQ4W2kgKyAxXSA8PCA4KSAmIDB4RkYwMCkgK1xuICAgICAgKHVpbnQ4W2kgKyAyXSAmIDB4RkYpXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsodWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKSkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8qIENvcHlyaWdodCAyMDEzIEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG5cbiAgIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cbiAgIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbiAgIEJpdCByZWFkaW5nIGhlbHBlcnNcbiovXG5cbnZhciBCUk9UTElfUkVBRF9TSVpFID0gNDA5NjtcbnZhciBCUk9UTElfSUJVRl9TSVpFID0gICgyICogQlJPVExJX1JFQURfU0laRSArIDMyKTtcbnZhciBCUk9UTElfSUJVRl9NQVNLID0gICgyICogQlJPVExJX1JFQURfU0laRSAtIDEpO1xuXG52YXIga0JpdE1hc2sgPSBuZXcgVWludDMyQXJyYXkoW1xuICAwLCAxLCAzLCA3LCAxNSwgMzEsIDYzLCAxMjcsIDI1NSwgNTExLCAxMDIzLCAyMDQ3LCA0MDk1LCA4MTkxLCAxNjM4MywgMzI3NjcsXG4gIDY1NTM1LCAxMzEwNzEsIDI2MjE0MywgNTI0Mjg3LCAxMDQ4NTc1LCAyMDk3MTUxLCA0MTk0MzAzLCA4Mzg4NjA3LCAxNjc3NzIxNVxuXSk7XG5cbi8qIElucHV0IGJ5dGUgYnVmZmVyLCBjb25zaXN0IG9mIGEgcmluZ2J1ZmZlciBhbmQgYSBcInNsYWNrXCIgcmVnaW9uIHdoZXJlICovXG4vKiBieXRlcyBmcm9tIHRoZSBzdGFydCBvZiB0aGUgcmluZ2J1ZmZlciBhcmUgY29waWVkLiAqL1xuZnVuY3Rpb24gQnJvdGxpQml0UmVhZGVyKGlucHV0KSB7XG4gIHRoaXMuYnVmXyA9IG5ldyBVaW50OEFycmF5KEJST1RMSV9JQlVGX1NJWkUpO1xuICB0aGlzLmlucHV0XyA9IGlucHV0OyAgICAvKiBpbnB1dCBjYWxsYmFjayAqL1xuICBcbiAgdGhpcy5yZXNldCgpO1xufVxuXG5Ccm90bGlCaXRSZWFkZXIuUkVBRF9TSVpFID0gQlJPVExJX1JFQURfU0laRTtcbkJyb3RsaUJpdFJlYWRlci5JQlVGX01BU0sgPSBCUk9UTElfSUJVRl9NQVNLO1xuXG5Ccm90bGlCaXRSZWFkZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuYnVmX3B0cl8gPSAwOyAgICAgIC8qIG5leHQgaW5wdXQgd2lsbCB3cml0ZSBoZXJlICovXG4gIHRoaXMudmFsXyA9IDA7ICAgICAgICAgIC8qIHByZS1mZXRjaGVkIGJpdHMgKi9cbiAgdGhpcy5wb3NfID0gMDsgICAgICAgICAgLyogYnl0ZSBwb3NpdGlvbiBpbiBzdHJlYW0gKi9cbiAgdGhpcy5iaXRfcG9zXyA9IDA7ICAgICAgLyogY3VycmVudCBiaXQtcmVhZGluZyBwb3NpdGlvbiBpbiB2YWxfICovXG4gIHRoaXMuYml0X2VuZF9wb3NfID0gMDsgIC8qIGJpdC1yZWFkaW5nIGVuZCBwb3NpdGlvbiBmcm9tIExTQiBvZiB2YWxfICovXG4gIHRoaXMuZW9zXyA9IDA7ICAgICAgICAgIC8qIGlucHV0IHN0cmVhbSBpcyBmaW5pc2hlZCAqL1xuICBcbiAgdGhpcy5yZWFkTW9yZUlucHV0KCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgdGhpcy52YWxfIHw9IHRoaXMuYnVmX1t0aGlzLnBvc19dIDw8ICg4ICogaSk7XG4gICAgKyt0aGlzLnBvc187XG4gIH1cbiAgXG4gIHJldHVybiB0aGlzLmJpdF9lbmRfcG9zXyA+IDA7XG59O1xuXG4vKiBGaWxscyB1cCB0aGUgaW5wdXQgcmluZ2J1ZmZlciBieSBjYWxsaW5nIHRoZSBpbnB1dCBjYWxsYmFjay5cblxuICAgRG9lcyBub3RoaW5nIGlmIHRoZXJlIGFyZSBhdCBsZWFzdCAzMiBieXRlcyBwcmVzZW50IGFmdGVyIGN1cnJlbnQgcG9zaXRpb24uXG5cbiAgIFJldHVybnMgMCBpZiBlaXRoZXI6XG4gICAgLSB0aGUgaW5wdXQgY2FsbGJhY2sgcmV0dXJuZWQgYW4gZXJyb3IsIG9yXG4gICAgLSB0aGVyZSBpcyBubyBtb3JlIGlucHV0IGFuZCB0aGUgcG9zaXRpb24gaXMgcGFzdCB0aGUgZW5kIG9mIHRoZSBzdHJlYW0uXG5cbiAgIEFmdGVyIGVuY291bnRlcmluZyB0aGUgZW5kIG9mIHRoZSBpbnB1dCBzdHJlYW0sIDMyIGFkZGl0aW9uYWwgemVybyBieXRlcyBhcmVcbiAgIGNvcGllZCB0byB0aGUgcmluZ2J1ZmZlciwgdGhlcmVmb3JlIGl0IGlzIHNhZmUgdG8gY2FsbCB0aGlzIGZ1bmN0aW9uIGFmdGVyXG4gICBldmVyeSAzMiBieXRlcyBvZiBpbnB1dCBpcyByZWFkLlxuKi9cbkJyb3RsaUJpdFJlYWRlci5wcm90b3R5cGUucmVhZE1vcmVJbnB1dCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5iaXRfZW5kX3Bvc18gPiAyNTYpIHtcbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAodGhpcy5lb3NfKSB7XG4gICAgaWYgKHRoaXMuYml0X3Bvc18gPiB0aGlzLmJpdF9lbmRfcG9zXylcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBlbmQgb2YgaW5wdXQgJyArIHRoaXMuYml0X3Bvc18gKyAnICcgKyB0aGlzLmJpdF9lbmRfcG9zXyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGRzdCA9IHRoaXMuYnVmX3B0cl87XG4gICAgdmFyIGJ5dGVzX3JlYWQgPSB0aGlzLmlucHV0Xy5yZWFkKHRoaXMuYnVmXywgZHN0LCBCUk9UTElfUkVBRF9TSVpFKTtcbiAgICBpZiAoYnl0ZXNfcmVhZCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBlbmQgb2YgaW5wdXQnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGJ5dGVzX3JlYWQgPCBCUk9UTElfUkVBRF9TSVpFKSB7XG4gICAgICB0aGlzLmVvc18gPSAxO1xuICAgICAgLyogU3RvcmUgMzIgYnl0ZXMgb2YgemVybyBhZnRlciB0aGUgc3RyZWFtIGVuZC4gKi9cbiAgICAgIGZvciAodmFyIHAgPSAwOyBwIDwgMzI7IHArKylcbiAgICAgICAgdGhpcy5idWZfW2RzdCArIGJ5dGVzX3JlYWQgKyBwXSA9IDA7XG4gICAgfVxuICAgIFxuICAgIGlmIChkc3QgPT09IDApIHtcbiAgICAgIC8qIENvcHkgdGhlIGhlYWQgb2YgdGhlIHJpbmdidWZmZXIgdG8gdGhlIHNsYWNrIHJlZ2lvbi4gKi9cbiAgICAgIGZvciAodmFyIHAgPSAwOyBwIDwgMzI7IHArKylcbiAgICAgICAgdGhpcy5idWZfWyhCUk9UTElfUkVBRF9TSVpFIDw8IDEpICsgcF0gPSB0aGlzLmJ1Zl9bcF07XG5cbiAgICAgIHRoaXMuYnVmX3B0cl8gPSBCUk9UTElfUkVBRF9TSVpFO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJ1Zl9wdHJfID0gMDtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5iaXRfZW5kX3Bvc18gKz0gYnl0ZXNfcmVhZCA8PCAzO1xuICB9XG59O1xuXG4vKiBHdWFyYW50ZWVzIHRoYXQgdGhlcmUgYXJlIGF0IGxlYXN0IDI0IGJpdHMgaW4gdGhlIGJ1ZmZlci4gKi9cbkJyb3RsaUJpdFJlYWRlci5wcm90b3R5cGUuZmlsbEJpdFdpbmRvdyA9IGZ1bmN0aW9uKCkgeyAgICBcbiAgd2hpbGUgKHRoaXMuYml0X3Bvc18gPj0gOCkge1xuICAgIHRoaXMudmFsXyA+Pj49IDg7XG4gICAgdGhpcy52YWxfIHw9IHRoaXMuYnVmX1t0aGlzLnBvc18gJiBCUk9UTElfSUJVRl9NQVNLXSA8PCAyNDtcbiAgICArK3RoaXMucG9zXztcbiAgICB0aGlzLmJpdF9wb3NfID0gdGhpcy5iaXRfcG9zXyAtIDggPj4+IDA7XG4gICAgdGhpcy5iaXRfZW5kX3Bvc18gPSB0aGlzLmJpdF9lbmRfcG9zXyAtIDggPj4+IDA7XG4gIH1cbn07XG5cbi8qIFJlYWRzIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGJpdHMgZnJvbSBSZWFkIEJ1ZmZlci4gKi9cbkJyb3RsaUJpdFJlYWRlci5wcm90b3R5cGUucmVhZEJpdHMgPSBmdW5jdGlvbihuX2JpdHMpIHtcbiAgaWYgKDMyIC0gdGhpcy5iaXRfcG9zXyA8IG5fYml0cykge1xuICAgIHRoaXMuZmlsbEJpdFdpbmRvdygpO1xuICB9XG4gIFxuICB2YXIgdmFsID0gKCh0aGlzLnZhbF8gPj4+IHRoaXMuYml0X3Bvc18pICYga0JpdE1hc2tbbl9iaXRzXSk7XG4gIHRoaXMuYml0X3Bvc18gKz0gbl9iaXRzO1xuICByZXR1cm4gdmFsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCcm90bGlCaXRSZWFkZXI7XG4iLCIvKiBDb3B5cmlnaHQgMjAxMyBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuXG4gICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG4gICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4gICBMb29rdXAgdGFibGUgdG8gbWFwIHRoZSBwcmV2aW91cyB0d28gYnl0ZXMgdG8gYSBjb250ZXh0IGlkLlxuXG4gICBUaGVyZSBhcmUgZm91ciBkaWZmZXJlbnQgY29udGV4dCBtb2RlbGluZyBtb2RlcyBkZWZpbmVkIGhlcmU6XG4gICAgIENPTlRFWFRfTFNCNjogY29udGV4dCBpZCBpcyB0aGUgbGVhc3Qgc2lnbmlmaWNhbnQgNiBiaXRzIG9mIHRoZSBsYXN0IGJ5dGUsXG4gICAgIENPTlRFWFRfTVNCNjogY29udGV4dCBpZCBpcyB0aGUgbW9zdCBzaWduaWZpY2FudCA2IGJpdHMgb2YgdGhlIGxhc3QgYnl0ZSxcbiAgICAgQ09OVEVYVF9VVEY4OiBzZWNvbmQtb3JkZXIgY29udGV4dCBtb2RlbCB0dW5lZCBmb3IgVVRGOC1lbmNvZGVkIHRleHQsXG4gICAgIENPTlRFWFRfU0lHTkVEOiBzZWNvbmQtb3JkZXIgY29udGV4dCBtb2RlbCB0dW5lZCBmb3Igc2lnbmVkIGludGVnZXJzLlxuXG4gICBUaGUgY29udGV4dCBpZCBmb3IgdGhlIFVURjggY29udGV4dCBtb2RlbCBpcyBjYWxjdWxhdGVkIGFzIGZvbGxvd3MuIElmIHAxXG4gICBhbmQgcDIgYXJlIHRoZSBwcmV2aW91cyB0d28gYnl0ZXMsIHdlIGNhbGN1YWx0ZSB0aGUgY29udGV4dCBhc1xuXG4gICAgIGNvbnRleHQgPSBrQ29udGV4dExvb2t1cFtwMV0gfCBrQ29udGV4dExvb2t1cFtwMiArIDI1Nl0uXG5cbiAgIElmIHRoZSBwcmV2aW91cyB0d28gYnl0ZXMgYXJlIEFTQ0lJIGNoYXJhY3RlcnMgKGkuZS4gPCAxMjgpLCB0aGlzIHdpbGwgYmVcbiAgIGVxdWl2YWxlbnQgdG9cblxuICAgICBjb250ZXh0ID0gNCAqIGNvbnRleHQxKHAxKSArIGNvbnRleHQyKHAyKSxcblxuICAgd2hlcmUgY29udGV4dDEgaXMgYmFzZWQgb24gdGhlIHByZXZpb3VzIGJ5dGUgaW4gdGhlIGZvbGxvd2luZyB3YXk6XG5cbiAgICAgMCAgOiBub24tQVNDSUkgY29udHJvbFxuICAgICAxICA6IFxcdCwgXFxuLCBcXHJcbiAgICAgMiAgOiBzcGFjZVxuICAgICAzICA6IG90aGVyIHB1bmN0dWF0aW9uXG4gICAgIDQgIDogXCIgJ1xuICAgICA1ICA6ICVcbiAgICAgNiAgOiAoIDwgWyB7XG4gICAgIDcgIDogKSA+IF0gfVxuICAgICA4ICA6ICwgOyA6XG4gICAgIDkgIDogLlxuICAgICAxMCA6ID1cbiAgICAgMTEgOiBudW1iZXJcbiAgICAgMTIgOiB1cHBlci1jYXNlIHZvd2VsXG4gICAgIDEzIDogdXBwZXItY2FzZSBjb25zb25hbnRcbiAgICAgMTQgOiBsb3dlci1jYXNlIHZvd2VsXG4gICAgIDE1IDogbG93ZXItY2FzZSBjb25zb25hbnRcblxuICAgYW5kIGNvbnRleHQyIGlzIGJhc2VkIG9uIHRoZSBzZWNvbmQgbGFzdCBieXRlOlxuXG4gICAgIDAgOiBjb250cm9sLCBzcGFjZVxuICAgICAxIDogcHVuY3R1YXRpb25cbiAgICAgMiA6IHVwcGVyLWNhc2UgbGV0dGVyLCBudW1iZXJcbiAgICAgMyA6IGxvd2VyLWNhc2UgbGV0dGVyXG5cbiAgIElmIHRoZSBsYXN0IGJ5dGUgaXMgQVNDSUksIGFuZCB0aGUgc2Vjb25kIGxhc3QgYnl0ZSBpcyBub3QgKGluIGEgdmFsaWQgVVRGOFxuICAgc3RyZWFtIGl0IHdpbGwgYmUgYSBjb250aW51YXRpb24gYnl0ZSwgdmFsdWUgYmV0d2VlbiAxMjggYW5kIDE5MSksIHRoZVxuICAgY29udGV4dCBpcyB0aGUgc2FtZSBhcyBpZiB0aGUgc2Vjb25kIGxhc3QgYnl0ZSB3YXMgYW4gQVNDSUkgY29udHJvbCBvciBzcGFjZS5cblxuICAgSWYgdGhlIGxhc3QgYnl0ZSBpcyBhIFVURjggbGVhZCBieXRlICh2YWx1ZSA+PSAxOTIpLCB0aGVuIHRoZSBuZXh0IGJ5dGUgd2lsbFxuICAgYmUgYSBjb250aW51YXRpb24gYnl0ZSBhbmQgdGhlIGNvbnRleHQgaWQgaXMgMiBvciAzIGRlcGVuZGluZyBvbiB0aGUgTFNCIG9mXG4gICB0aGUgbGFzdCBieXRlIGFuZCB0byBhIGxlc3NlciBleHRlbnQgb24gdGhlIHNlY29uZCBsYXN0IGJ5dGUgaWYgaXQgaXMgQVNDSUkuXG5cbiAgIElmIHRoZSBsYXN0IGJ5dGUgaXMgYSBVVEY4IGNvbnRpbnVhdGlvbiBieXRlLCB0aGUgc2Vjb25kIGxhc3QgYnl0ZSBjYW4gYmU6XG4gICAgIC0gY29udGludWF0aW9uIGJ5dGU6IHRoZSBuZXh0IGJ5dGUgaXMgcHJvYmFibHkgQVNDSUkgb3IgbGVhZCBieXRlIChhc3N1bWluZ1xuICAgICAgIDQtYnl0ZSBVVEY4IGNoYXJhY3RlcnMgYXJlIHJhcmUpIGFuZCB0aGUgY29udGV4dCBpZCBpcyAwIG9yIDEuXG4gICAgIC0gbGVhZCBieXRlICgxOTIgLSAyMDcpOiBuZXh0IGJ5dGUgaXMgQVNDSUkgb3IgbGVhZCBieXRlLCBjb250ZXh0IGlzIDAgb3IgMVxuICAgICAtIGxlYWQgYnl0ZSAoMjA4IC0gMjU1KTogbmV4dCBieXRlIGlzIGNvbnRpbnVhdGlvbiBieXRlLCBjb250ZXh0IGlzIDIgb3IgM1xuXG4gICBUaGUgcG9zc2libGUgdmFsdWUgY29tYmluYXRpb25zIG9mIHRoZSBwcmV2aW91cyB0d28gYnl0ZXMsIHRoZSByYW5nZSBvZlxuICAgY29udGV4dCBpZHMgYW5kIHRoZSB0eXBlIG9mIHRoZSBuZXh0IGJ5dGUgaXMgc3VtbWFyaXplZCBpbiB0aGUgdGFibGUgYmVsb3c6XG5cbiAgIHwtLS0tLS0tLVxcLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4gICB8ICAgICAgICAgXFwgICAgICAgICAgICAgICAgICAgICAgICAgTGFzdCBieXRlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgfCBTZWNvbmQgICBcXC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXxcbiAgIHwgbGFzdCBieXRlIFxcICAgIEFTQ0lJICAgICAgICAgICAgfCAgIGNvbnQuIGJ5dGUgICAgICAgIHwgICBsZWFkIGJ5dGUgICAgICB8XG4gICB8ICAgICAgICAgICAgXFwgICAoMC0xMjcpICAgICAgICAgIHwgICAoMTI4LTE5MSkgICAgICAgICB8ICAgKDE5Mi0pICAgICAgICAgfFxuICAgfD09PT09PT09PT09PT18PT09PT09PT09PT09PT09PT09PXw9PT09PT09PT09PT09PT09PT09PT18PT09PT09PT09PT09PT09PT09fFxuICAgfCAgQVNDSUkgICAgICB8IG5leHQ6IEFTQ0lJL2xlYWQgIHwgIG5vdCB2YWxpZCAgICAgICAgICB8ICBuZXh0OiBjb250LiAgICAgfFxuICAgfCAgKDAtMTI3KSAgICB8IGNvbnRleHQ6IDQgLSA2MyAgIHwgICAgICAgICAgICAgICAgICAgICB8ICBjb250ZXh0OiAyIC0gMyAgfFxuICAgfC0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tfFxuICAgfCAgY29udC4gYnl0ZSB8IG5leHQ6IEFTQ0lJL2xlYWQgIHwgIG5leHQ6IEFTQ0lJL2xlYWQgICB8ICBuZXh0OiBjb250LiAgICAgfFxuICAgfCAgKDEyOC0xOTEpICB8IGNvbnRleHQ6IDQgLSA2MyAgIHwgIGNvbnRleHQ6IDAgLSAxICAgICB8ICBjb250ZXh0OiAyIC0gMyAgfFxuICAgfC0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tfFxuICAgfCAgbGVhZCBieXRlICB8IG5vdCB2YWxpZCAgICAgICAgIHwgIG5leHQ6IEFTQ0lJL2xlYWQgICB8ICBub3QgdmFsaWQgICAgICAgfFxuICAgfCAgKDE5Mi0yMDcpICB8ICAgICAgICAgICAgICAgICAgIHwgIGNvbnRleHQ6IDAgLSAxICAgICB8ICAgICAgICAgICAgICAgICAgfFxuICAgfC0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tfFxuICAgfCAgbGVhZCBieXRlICB8IG5vdCB2YWxpZCAgICAgICAgIHwgIG5leHQ6IGNvbnQuICAgICAgICB8ICBub3QgdmFsaWQgICAgICAgfFxuICAgfCAgKDIwOC0pICAgICB8ICAgICAgICAgICAgICAgICAgIHwgIGNvbnRleHQ6IDIgLSAzICAgICB8ICAgICAgICAgICAgICAgICAgfFxuICAgfC0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tfFxuXG4gICBUaGUgY29udGV4dCBpZCBmb3IgdGhlIHNpZ25lZCBjb250ZXh0IG1vZGUgaXMgY2FsY3VsYXRlZCBhczpcblxuICAgICBjb250ZXh0ID0gKGtDb250ZXh0TG9va3VwWzUxMiArIHAxXSA8PCAzKSB8IGtDb250ZXh0TG9va3VwWzUxMiArIHAyXS5cblxuICAgRm9yIGFueSBjb250ZXh0IG1vZGVsaW5nIG1vZGVzLCB0aGUgY29udGV4dCBpZHMgY2FuIGJlIGNhbGN1bGF0ZWQgYnkgfC1pbmdcbiAgIHRvZ2V0aGVyIHR3byBsb29rdXBzIGZyb20gb25lIHRhYmxlIHVzaW5nIGNvbnRleHQgbW9kZWwgZGVwZW5kZW50IG9mZnNldHM6XG5cbiAgICAgY29udGV4dCA9IGtDb250ZXh0TG9va3VwW29mZnNldDEgKyBwMV0gfCBrQ29udGV4dExvb2t1cFtvZmZzZXQyICsgcDJdLlxuXG4gICB3aGVyZSBvZmZzZXQxIGFuZCBvZmZzZXQyIGFyZSBkZXBlbmRlbnQgb24gdGhlIGNvbnRleHQgbW9kZS5cbiovXG5cbnZhciBDT05URVhUX0xTQjYgICAgICAgICA9IDA7XG52YXIgQ09OVEVYVF9NU0I2ICAgICAgICAgPSAxO1xudmFyIENPTlRFWFRfVVRGOCAgICAgICAgID0gMjtcbnZhciBDT05URVhUX1NJR05FRCAgICAgICA9IDM7XG5cbi8qIENvbW1vbiBjb250ZXh0IGxvb2t1cCB0YWJsZSBmb3IgYWxsIGNvbnRleHQgbW9kZXMuICovXG5leHBvcnRzLmxvb2t1cCA9IG5ldyBVaW50OEFycmF5KFtcbiAgLyogQ09OVEVYVF9VVEY4LCBsYXN0IGJ5dGUuICovXG4gIC8qIEFTQ0lJIHJhbmdlLiAqL1xuICAgMCwgIDAsICAwLCAgMCwgIDAsICAwLCAgMCwgIDAsICAwLCAgNCwgIDQsICAwLCAgMCwgIDQsICAwLCAgMCxcbiAgIDAsICAwLCAgMCwgIDAsICAwLCAgMCwgIDAsICAwLCAgMCwgIDAsICAwLCAgMCwgIDAsICAwLCAgMCwgIDAsXG4gICA4LCAxMiwgMTYsIDEyLCAxMiwgMjAsIDEyLCAxNiwgMjQsIDI4LCAxMiwgMTIsIDMyLCAxMiwgMzYsIDEyLFxuICA0NCwgNDQsIDQ0LCA0NCwgNDQsIDQ0LCA0NCwgNDQsIDQ0LCA0NCwgMzIsIDMyLCAyNCwgNDAsIDI4LCAxMixcbiAgMTIsIDQ4LCA1MiwgNTIsIDUyLCA0OCwgNTIsIDUyLCA1MiwgNDgsIDUyLCA1MiwgNTIsIDUyLCA1MiwgNDgsXG4gIDUyLCA1MiwgNTIsIDUyLCA1MiwgNDgsIDUyLCA1MiwgNTIsIDUyLCA1MiwgMjQsIDEyLCAyOCwgMTIsIDEyLFxuICAxMiwgNTYsIDYwLCA2MCwgNjAsIDU2LCA2MCwgNjAsIDYwLCA1NiwgNjAsIDYwLCA2MCwgNjAsIDYwLCA1NixcbiAgNjAsIDYwLCA2MCwgNjAsIDYwLCA1NiwgNjAsIDYwLCA2MCwgNjAsIDYwLCAyNCwgMTIsIDI4LCAxMiwgIDAsXG4gIC8qIFVURjggY29udGludWF0aW9uIGJ5dGUgcmFuZ2UuICovXG4gIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsXG4gIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsXG4gIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsXG4gIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDEsXG4gIC8qIFVURjggbGVhZCBieXRlIHJhbmdlLiAqL1xuICAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLFxuICAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLFxuICAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLFxuICAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLCAyLCAzLFxuICAvKiBDT05URVhUX1VURjggc2Vjb25kIGxhc3QgYnl0ZS4gKi9cbiAgLyogQVNDSUkgcmFuZ2UuICovXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsXG4gIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDEsIDEsIDEsIDEsIDEsIDEsXG4gIDEsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsXG4gIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDIsIDEsIDEsIDEsIDEsIDEsXG4gIDEsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsXG4gIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDMsIDEsIDEsIDEsIDEsIDAsXG4gIC8qIFVURjggY29udGludWF0aW9uIGJ5dGUgcmFuZ2UuICovXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIC8qIFVURjggbGVhZCBieXRlIHJhbmdlLiAqL1xuICAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLFxuICAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLFxuICAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLCAyLFxuICAvKiBDT05URVhUX1NJR05FRCwgc2Vjb25kIGxhc3QgYnl0ZS4gKi9cbiAgMCwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSwgMSxcbiAgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMixcbiAgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMixcbiAgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMiwgMixcbiAgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMyxcbiAgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMyxcbiAgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMyxcbiAgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMywgMyxcbiAgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCxcbiAgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCxcbiAgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCxcbiAgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCwgNCxcbiAgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSxcbiAgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSxcbiAgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSwgNSxcbiAgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNiwgNyxcbiAgLyogQ09OVEVYVF9TSUdORUQsIGxhc3QgYnl0ZSwgc2FtZSBhcyB0aGUgYWJvdmUgdmFsdWVzIHNoaWZ0ZWQgYnkgMyBiaXRzLiAqL1xuICAgMCwgOCwgOCwgOCwgOCwgOCwgOCwgOCwgOCwgOCwgOCwgOCwgOCwgOCwgOCwgOCxcbiAgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsXG4gIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LFxuICAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNiwgMTYsIDE2LCAxNixcbiAgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsXG4gIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LFxuICAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCxcbiAgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsXG4gIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLFxuICAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMixcbiAgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsXG4gIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLCAzMiwgMzIsIDMyLFxuICA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCxcbiAgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsXG4gIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLCA0MCwgNDAsIDQwLFxuICA0OCwgNDgsIDQ4LCA0OCwgNDgsIDQ4LCA0OCwgNDgsIDQ4LCA0OCwgNDgsIDQ4LCA0OCwgNDgsIDQ4LCA1NixcbiAgLyogQ09OVEVYVF9MU0I2LCBsYXN0IGJ5dGUuICovXG4gICAwLCAgMSwgIDIsICAzLCAgNCwgIDUsICA2LCAgNywgIDgsICA5LCAxMCwgMTEsIDEyLCAxMywgMTQsIDE1LFxuICAxNiwgMTcsIDE4LCAxOSwgMjAsIDIxLCAyMiwgMjMsIDI0LCAyNSwgMjYsIDI3LCAyOCwgMjksIDMwLCAzMSxcbiAgMzIsIDMzLCAzNCwgMzUsIDM2LCAzNywgMzgsIDM5LCA0MCwgNDEsIDQyLCA0MywgNDQsIDQ1LCA0NiwgNDcsXG4gIDQ4LCA0OSwgNTAsIDUxLCA1MiwgNTMsIDU0LCA1NSwgNTYsIDU3LCA1OCwgNTksIDYwLCA2MSwgNjIsIDYzLFxuICAgMCwgIDEsICAyLCAgMywgIDQsICA1LCAgNiwgIDcsICA4LCAgOSwgMTAsIDExLCAxMiwgMTMsIDE0LCAxNSxcbiAgMTYsIDE3LCAxOCwgMTksIDIwLCAyMSwgMjIsIDIzLCAyNCwgMjUsIDI2LCAyNywgMjgsIDI5LCAzMCwgMzEsXG4gIDMyLCAzMywgMzQsIDM1LCAzNiwgMzcsIDM4LCAzOSwgNDAsIDQxLCA0MiwgNDMsIDQ0LCA0NSwgNDYsIDQ3LFxuICA0OCwgNDksIDUwLCA1MSwgNTIsIDUzLCA1NCwgNTUsIDU2LCA1NywgNTgsIDU5LCA2MCwgNjEsIDYyLCA2MyxcbiAgIDAsICAxLCAgMiwgIDMsICA0LCAgNSwgIDYsICA3LCAgOCwgIDksIDEwLCAxMSwgMTIsIDEzLCAxNCwgMTUsXG4gIDE2LCAxNywgMTgsIDE5LCAyMCwgMjEsIDIyLCAyMywgMjQsIDI1LCAyNiwgMjcsIDI4LCAyOSwgMzAsIDMxLFxuICAzMiwgMzMsIDM0LCAzNSwgMzYsIDM3LCAzOCwgMzksIDQwLCA0MSwgNDIsIDQzLCA0NCwgNDUsIDQ2LCA0NyxcbiAgNDgsIDQ5LCA1MCwgNTEsIDUyLCA1MywgNTQsIDU1LCA1NiwgNTcsIDU4LCA1OSwgNjAsIDYxLCA2MiwgNjMsXG4gICAwLCAgMSwgIDIsICAzLCAgNCwgIDUsICA2LCAgNywgIDgsICA5LCAxMCwgMTEsIDEyLCAxMywgMTQsIDE1LFxuICAxNiwgMTcsIDE4LCAxOSwgMjAsIDIxLCAyMiwgMjMsIDI0LCAyNSwgMjYsIDI3LCAyOCwgMjksIDMwLCAzMSxcbiAgMzIsIDMzLCAzNCwgMzUsIDM2LCAzNywgMzgsIDM5LCA0MCwgNDEsIDQyLCA0MywgNDQsIDQ1LCA0NiwgNDcsXG4gIDQ4LCA0OSwgNTAsIDUxLCA1MiwgNTMsIDU0LCA1NSwgNTYsIDU3LCA1OCwgNTksIDYwLCA2MSwgNjIsIDYzLFxuICAvKiBDT05URVhUX01TQjYsIGxhc3QgYnl0ZS4gKi9cbiAgIDAsICAwLCAgMCwgIDAsICAxLCAgMSwgIDEsICAxLCAgMiwgIDIsICAyLCAgMiwgIDMsICAzLCAgMywgIDMsXG4gICA0LCAgNCwgIDQsICA0LCAgNSwgIDUsICA1LCAgNSwgIDYsICA2LCAgNiwgIDYsICA3LCAgNywgIDcsICA3LFxuICAgOCwgIDgsICA4LCAgOCwgIDksICA5LCAgOSwgIDksIDEwLCAxMCwgMTAsIDEwLCAxMSwgMTEsIDExLCAxMSxcbiAgMTIsIDEyLCAxMiwgMTIsIDEzLCAxMywgMTMsIDEzLCAxNCwgMTQsIDE0LCAxNCwgMTUsIDE1LCAxNSwgMTUsXG4gIDE2LCAxNiwgMTYsIDE2LCAxNywgMTcsIDE3LCAxNywgMTgsIDE4LCAxOCwgMTgsIDE5LCAxOSwgMTksIDE5LFxuICAyMCwgMjAsIDIwLCAyMCwgMjEsIDIxLCAyMSwgMjEsIDIyLCAyMiwgMjIsIDIyLCAyMywgMjMsIDIzLCAyMyxcbiAgMjQsIDI0LCAyNCwgMjQsIDI1LCAyNSwgMjUsIDI1LCAyNiwgMjYsIDI2LCAyNiwgMjcsIDI3LCAyNywgMjcsXG4gIDI4LCAyOCwgMjgsIDI4LCAyOSwgMjksIDI5LCAyOSwgMzAsIDMwLCAzMCwgMzAsIDMxLCAzMSwgMzEsIDMxLFxuICAzMiwgMzIsIDMyLCAzMiwgMzMsIDMzLCAzMywgMzMsIDM0LCAzNCwgMzQsIDM0LCAzNSwgMzUsIDM1LCAzNSxcbiAgMzYsIDM2LCAzNiwgMzYsIDM3LCAzNywgMzcsIDM3LCAzOCwgMzgsIDM4LCAzOCwgMzksIDM5LCAzOSwgMzksXG4gIDQwLCA0MCwgNDAsIDQwLCA0MSwgNDEsIDQxLCA0MSwgNDIsIDQyLCA0MiwgNDIsIDQzLCA0MywgNDMsIDQzLFxuICA0NCwgNDQsIDQ0LCA0NCwgNDUsIDQ1LCA0NSwgNDUsIDQ2LCA0NiwgNDYsIDQ2LCA0NywgNDcsIDQ3LCA0NyxcbiAgNDgsIDQ4LCA0OCwgNDgsIDQ5LCA0OSwgNDksIDQ5LCA1MCwgNTAsIDUwLCA1MCwgNTEsIDUxLCA1MSwgNTEsXG4gIDUyLCA1MiwgNTIsIDUyLCA1MywgNTMsIDUzLCA1MywgNTQsIDU0LCA1NCwgNTQsIDU1LCA1NSwgNTUsIDU1LFxuICA1NiwgNTYsIDU2LCA1NiwgNTcsIDU3LCA1NywgNTcsIDU4LCA1OCwgNTgsIDU4LCA1OSwgNTksIDU5LCA1OSxcbiAgNjAsIDYwLCA2MCwgNjAsIDYxLCA2MSwgNjEsIDYxLCA2MiwgNjIsIDYyLCA2MiwgNjMsIDYzLCA2MywgNjMsXG4gIC8qIENPTlRFWFRfe00sTH1TQjYsIHNlY29uZCBsYXN0IGJ5dGUsICovXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG5dKTtcblxuZXhwb3J0cy5sb29rdXBPZmZzZXRzID0gbmV3IFVpbnQxNkFycmF5KFtcbiAgLyogQ09OVEVYVF9MU0I2ICovXG4gIDEwMjQsIDE1MzYsXG4gIC8qIENPTlRFWFRfTVNCNiAqL1xuICAxMjgwLCAxNTM2LFxuICAvKiBDT05URVhUX1VURjggKi9cbiAgMCwgMjU2LFxuICAvKiBDT05URVhUX1NJR05FRCAqL1xuICA3NjgsIDUxMixcbl0pO1xuIiwiLyogQ29weXJpZ2h0IDIwMTMgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cblxuICAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAgIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuICAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbnZhciBCcm90bGlJbnB1dCA9IHJlcXVpcmUoJy4vc3RyZWFtcycpLkJyb3RsaUlucHV0O1xudmFyIEJyb3RsaU91dHB1dCA9IHJlcXVpcmUoJy4vc3RyZWFtcycpLkJyb3RsaU91dHB1dDtcbnZhciBCcm90bGlCaXRSZWFkZXIgPSByZXF1aXJlKCcuL2JpdF9yZWFkZXInKTtcbnZhciBCcm90bGlEaWN0aW9uYXJ5ID0gcmVxdWlyZSgnLi9kaWN0aW9uYXJ5Jyk7XG52YXIgSHVmZm1hbkNvZGUgPSByZXF1aXJlKCcuL2h1ZmZtYW4nKS5IdWZmbWFuQ29kZTtcbnZhciBCcm90bGlCdWlsZEh1ZmZtYW5UYWJsZSA9IHJlcXVpcmUoJy4vaHVmZm1hbicpLkJyb3RsaUJ1aWxkSHVmZm1hblRhYmxlO1xudmFyIENvbnRleHQgPSByZXF1aXJlKCcuL2NvbnRleHQnKTtcbnZhciBQcmVmaXggPSByZXF1aXJlKCcuL3ByZWZpeCcpO1xudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vdHJhbnNmb3JtJyk7XG5cbnZhciBrRGVmYXVsdENvZGVMZW5ndGggPSA4O1xudmFyIGtDb2RlTGVuZ3RoUmVwZWF0Q29kZSA9IDE2O1xudmFyIGtOdW1MaXRlcmFsQ29kZXMgPSAyNTY7XG52YXIga051bUluc2VydEFuZENvcHlDb2RlcyA9IDcwNDtcbnZhciBrTnVtQmxvY2tMZW5ndGhDb2RlcyA9IDI2O1xudmFyIGtMaXRlcmFsQ29udGV4dEJpdHMgPSA2O1xudmFyIGtEaXN0YW5jZUNvbnRleHRCaXRzID0gMjtcblxudmFyIEhVRkZNQU5fVEFCTEVfQklUUyA9IDg7XG52YXIgSFVGRk1BTl9UQUJMRV9NQVNLID0gMHhmZjtcbi8qIE1heGltdW0gcG9zc2libGUgSHVmZm1hbiB0YWJsZSBzaXplIGZvciBhbiBhbHBoYWJldCBzaXplIG9mIDcwNCwgbWF4IGNvZGVcbiAqIGxlbmd0aCAxNSBhbmQgcm9vdCB0YWJsZSBiaXRzIDguICovXG52YXIgSFVGRk1BTl9NQVhfVEFCTEVfU0laRSA9IDEwODA7XG5cbnZhciBDT0RFX0xFTkdUSF9DT0RFUyA9IDE4O1xudmFyIGtDb2RlTGVuZ3RoQ29kZU9yZGVyID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAxLCAyLCAzLCA0LCAwLCA1LCAxNywgNiwgMTYsIDcsIDgsIDksIDEwLCAxMSwgMTIsIDEzLCAxNCwgMTUsXG5dKTtcblxudmFyIE5VTV9ESVNUQU5DRV9TSE9SVF9DT0RFUyA9IDE2O1xudmFyIGtEaXN0YW5jZVNob3J0Q29kZUluZGV4T2Zmc2V0ID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAzLCAyLCAxLCAwLCAzLCAzLCAzLCAzLCAzLCAzLCAyLCAyLCAyLCAyLCAyLCAyXG5dKTtcblxudmFyIGtEaXN0YW5jZVNob3J0Q29kZVZhbHVlT2Zmc2V0ID0gbmV3IEludDhBcnJheShbXG4gIDAsIDAsIDAsIDAsIC0xLCAxLCAtMiwgMiwgLTMsIDMsIC0xLCAxLCAtMiwgMiwgLTMsIDNcbl0pO1xuXG52YXIga01heEh1ZmZtYW5UYWJsZVNpemUgPSBuZXcgVWludDE2QXJyYXkoW1xuICAyNTYsIDQwMiwgNDM2LCA0NjgsIDUwMCwgNTM0LCA1NjYsIDU5OCwgNjMwLCA2NjIsIDY5NCwgNzI2LCA3NTgsIDc5MCwgODIyLFxuICA4NTQsIDg4NiwgOTIwLCA5NTIsIDk4NCwgMTAxNiwgMTA0OCwgMTA4MFxuXSk7XG5cbmZ1bmN0aW9uIERlY29kZVdpbmRvd0JpdHMoYnIpIHtcbiAgdmFyIG47XG4gIGlmIChici5yZWFkQml0cygxKSA9PT0gMCkge1xuICAgIHJldHVybiAxNjtcbiAgfVxuICBcbiAgbiA9IGJyLnJlYWRCaXRzKDMpO1xuICBpZiAobiA+IDApIHtcbiAgICByZXR1cm4gMTcgKyBuO1xuICB9XG4gIFxuICBuID0gYnIucmVhZEJpdHMoMyk7XG4gIGlmIChuID4gMCkge1xuICAgIHJldHVybiA4ICsgbjtcbiAgfVxuICBcbiAgcmV0dXJuIDE3O1xufVxuXG4vKiBEZWNvZGVzIGEgbnVtYmVyIGluIHRoZSByYW5nZSBbMC4uMjU1XSwgYnkgcmVhZGluZyAxIC0gMTEgYml0cy4gKi9cbmZ1bmN0aW9uIERlY29kZVZhckxlblVpbnQ4KGJyKSB7XG4gIGlmIChici5yZWFkQml0cygxKSkge1xuICAgIHZhciBuYml0cyA9IGJyLnJlYWRCaXRzKDMpO1xuICAgIGlmIChuYml0cyA9PT0gMCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBici5yZWFkQml0cyhuYml0cykgKyAoMSA8PCBuYml0cyk7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG5mdW5jdGlvbiBNZXRhQmxvY2tMZW5ndGgoKSB7XG4gIHRoaXMubWV0YV9ibG9ja19sZW5ndGggPSAwO1xuICB0aGlzLmlucHV0X2VuZCA9IDA7XG4gIHRoaXMuaXNfdW5jb21wcmVzc2VkID0gMDtcbiAgdGhpcy5pc19tZXRhZGF0YSA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBEZWNvZGVNZXRhQmxvY2tMZW5ndGgoYnIpIHtcbiAgdmFyIG91dCA9IG5ldyBNZXRhQmxvY2tMZW5ndGg7ICBcbiAgdmFyIHNpemVfbmliYmxlcztcbiAgdmFyIHNpemVfYnl0ZXM7XG4gIHZhciBpO1xuICBcbiAgb3V0LmlucHV0X2VuZCA9IGJyLnJlYWRCaXRzKDEpO1xuICBpZiAob3V0LmlucHV0X2VuZCAmJiBici5yZWFkQml0cygxKSkge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cbiAgXG4gIHNpemVfbmliYmxlcyA9IGJyLnJlYWRCaXRzKDIpICsgNDtcbiAgaWYgKHNpemVfbmliYmxlcyA9PT0gNykge1xuICAgIG91dC5pc19tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgaWYgKGJyLnJlYWRCaXRzKDEpICE9PSAwKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHJlc2VydmVkIGJpdCcpO1xuICAgIFxuICAgIHNpemVfYnl0ZXMgPSBici5yZWFkQml0cygyKTtcbiAgICBpZiAoc2l6ZV9ieXRlcyA9PT0gMClcbiAgICAgIHJldHVybiBvdXQ7XG4gICAgXG4gICAgZm9yIChpID0gMDsgaSA8IHNpemVfYnl0ZXM7IGkrKykge1xuICAgICAgdmFyIG5leHRfYnl0ZSA9IGJyLnJlYWRCaXRzKDgpO1xuICAgICAgaWYgKGkgKyAxID09PSBzaXplX2J5dGVzICYmIHNpemVfYnl0ZXMgPiAxICYmIG5leHRfYnl0ZSA9PT0gMClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHNpemUgYnl0ZScpO1xuICAgICAgXG4gICAgICBvdXQubWV0YV9ibG9ja19sZW5ndGggfD0gbmV4dF9ieXRlIDw8IChpICogOCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAoaSA9IDA7IGkgPCBzaXplX25pYmJsZXM7ICsraSkge1xuICAgICAgdmFyIG5leHRfbmliYmxlID0gYnIucmVhZEJpdHMoNCk7XG4gICAgICBpZiAoaSArIDEgPT09IHNpemVfbmliYmxlcyAmJiBzaXplX25pYmJsZXMgPiA0ICYmIG5leHRfbmliYmxlID09PSAwKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc2l6ZSBuaWJibGUnKTtcbiAgICAgIFxuICAgICAgb3V0Lm1ldGFfYmxvY2tfbGVuZ3RoIHw9IG5leHRfbmliYmxlIDw8IChpICogNCk7XG4gICAgfVxuICB9XG4gIFxuICArK291dC5tZXRhX2Jsb2NrX2xlbmd0aDtcbiAgXG4gIGlmICghb3V0LmlucHV0X2VuZCAmJiAhb3V0LmlzX21ldGFkYXRhKSB7XG4gICAgb3V0LmlzX3VuY29tcHJlc3NlZCA9IGJyLnJlYWRCaXRzKDEpO1xuICB9XG4gIFxuICByZXR1cm4gb3V0O1xufVxuXG4vKiBEZWNvZGVzIHRoZSBuZXh0IEh1ZmZtYW4gY29kZSBmcm9tIGJpdC1zdHJlYW0uICovXG5mdW5jdGlvbiBSZWFkU3ltYm9sKHRhYmxlLCBpbmRleCwgYnIpIHtcbiAgdmFyIHN0YXJ0X2luZGV4ID0gaW5kZXg7XG4gIFxuICB2YXIgbmJpdHM7XG4gIGJyLmZpbGxCaXRXaW5kb3coKTtcbiAgaW5kZXggKz0gKGJyLnZhbF8gPj4+IGJyLmJpdF9wb3NfKSAmIEhVRkZNQU5fVEFCTEVfTUFTSztcbiAgbmJpdHMgPSB0YWJsZVtpbmRleF0uYml0cyAtIEhVRkZNQU5fVEFCTEVfQklUUztcbiAgaWYgKG5iaXRzID4gMCkge1xuICAgIGJyLmJpdF9wb3NfICs9IEhVRkZNQU5fVEFCTEVfQklUUztcbiAgICBpbmRleCArPSB0YWJsZVtpbmRleF0udmFsdWU7XG4gICAgaW5kZXggKz0gKGJyLnZhbF8gPj4+IGJyLmJpdF9wb3NfKSAmICgoMSA8PCBuYml0cykgLSAxKTtcbiAgfVxuICBici5iaXRfcG9zXyArPSB0YWJsZVtpbmRleF0uYml0cztcbiAgcmV0dXJuIHRhYmxlW2luZGV4XS52YWx1ZTtcbn1cblxuZnVuY3Rpb24gUmVhZEh1ZmZtYW5Db2RlTGVuZ3Rocyhjb2RlX2xlbmd0aF9jb2RlX2xlbmd0aHMsIG51bV9zeW1ib2xzLCBjb2RlX2xlbmd0aHMsIGJyKSB7XG4gIHZhciBzeW1ib2wgPSAwO1xuICB2YXIgcHJldl9jb2RlX2xlbiA9IGtEZWZhdWx0Q29kZUxlbmd0aDtcbiAgdmFyIHJlcGVhdCA9IDA7XG4gIHZhciByZXBlYXRfY29kZV9sZW4gPSAwO1xuICB2YXIgc3BhY2UgPSAzMjc2ODtcbiAgXG4gIHZhciB0YWJsZSA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDMyOyBpKyspXG4gICAgdGFibGUucHVzaChuZXcgSHVmZm1hbkNvZGUoMCwgMCkpO1xuICBcbiAgQnJvdGxpQnVpbGRIdWZmbWFuVGFibGUodGFibGUsIDAsIDUsIGNvZGVfbGVuZ3RoX2NvZGVfbGVuZ3RocywgQ09ERV9MRU5HVEhfQ09ERVMpO1xuXG4gIHdoaWxlIChzeW1ib2wgPCBudW1fc3ltYm9scyAmJiBzcGFjZSA+IDApIHtcbiAgICB2YXIgcCA9IDA7XG4gICAgdmFyIGNvZGVfbGVuO1xuICAgIFxuICAgIGJyLnJlYWRNb3JlSW5wdXQoKTtcbiAgICBici5maWxsQml0V2luZG93KCk7XG4gICAgcCArPSAoYnIudmFsXyA+Pj4gYnIuYml0X3Bvc18pICYgMzE7XG4gICAgYnIuYml0X3Bvc18gKz0gdGFibGVbcF0uYml0cztcbiAgICBjb2RlX2xlbiA9IHRhYmxlW3BdLnZhbHVlICYgMHhmZjtcbiAgICBpZiAoY29kZV9sZW4gPCBrQ29kZUxlbmd0aFJlcGVhdENvZGUpIHtcbiAgICAgIHJlcGVhdCA9IDA7XG4gICAgICBjb2RlX2xlbmd0aHNbc3ltYm9sKytdID0gY29kZV9sZW47XG4gICAgICBpZiAoY29kZV9sZW4gIT09IDApIHtcbiAgICAgICAgcHJldl9jb2RlX2xlbiA9IGNvZGVfbGVuO1xuICAgICAgICBzcGFjZSAtPSAzMjc2OCA+PiBjb2RlX2xlbjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGV4dHJhX2JpdHMgPSBjb2RlX2xlbiAtIDE0O1xuICAgICAgdmFyIG9sZF9yZXBlYXQ7XG4gICAgICB2YXIgcmVwZWF0X2RlbHRhO1xuICAgICAgdmFyIG5ld19sZW4gPSAwO1xuICAgICAgaWYgKGNvZGVfbGVuID09PSBrQ29kZUxlbmd0aFJlcGVhdENvZGUpIHtcbiAgICAgICAgbmV3X2xlbiA9IHByZXZfY29kZV9sZW47XG4gICAgICB9XG4gICAgICBpZiAocmVwZWF0X2NvZGVfbGVuICE9PSBuZXdfbGVuKSB7XG4gICAgICAgIHJlcGVhdCA9IDA7XG4gICAgICAgIHJlcGVhdF9jb2RlX2xlbiA9IG5ld19sZW47XG4gICAgICB9XG4gICAgICBvbGRfcmVwZWF0ID0gcmVwZWF0O1xuICAgICAgaWYgKHJlcGVhdCA+IDApIHtcbiAgICAgICAgcmVwZWF0IC09IDI7XG4gICAgICAgIHJlcGVhdCA8PD0gZXh0cmFfYml0cztcbiAgICAgIH1cbiAgICAgIHJlcGVhdCArPSBici5yZWFkQml0cyhleHRyYV9iaXRzKSArIDM7XG4gICAgICByZXBlYXRfZGVsdGEgPSByZXBlYXQgLSBvbGRfcmVwZWF0O1xuICAgICAgaWYgKHN5bWJvbCArIHJlcGVhdF9kZWx0YSA+IG51bV9zeW1ib2xzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignW1JlYWRIdWZmbWFuQ29kZUxlbmd0aHNdIHN5bWJvbCArIHJlcGVhdF9kZWx0YSA+IG51bV9zeW1ib2xzJyk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgcmVwZWF0X2RlbHRhOyB4KyspXG4gICAgICAgIGNvZGVfbGVuZ3Roc1tzeW1ib2wgKyB4XSA9IHJlcGVhdF9jb2RlX2xlbjtcbiAgICAgIFxuICAgICAgc3ltYm9sICs9IHJlcGVhdF9kZWx0YTtcbiAgICAgIFxuICAgICAgaWYgKHJlcGVhdF9jb2RlX2xlbiAhPT0gMCkge1xuICAgICAgICBzcGFjZSAtPSByZXBlYXRfZGVsdGEgPDwgKDE1IC0gcmVwZWF0X2NvZGVfbGVuKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHNwYWNlICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiW1JlYWRIdWZmbWFuQ29kZUxlbmd0aHNdIHNwYWNlID0gXCIgKyBzcGFjZSk7XG4gIH1cbiAgXG4gIGZvciAoOyBzeW1ib2wgPCBudW1fc3ltYm9sczsgc3ltYm9sKyspXG4gICAgY29kZV9sZW5ndGhzW3N5bWJvbF0gPSAwO1xufVxuXG5mdW5jdGlvbiBSZWFkSHVmZm1hbkNvZGUoYWxwaGFiZXRfc2l6ZSwgdGFibGVzLCB0YWJsZSwgYnIpIHtcbiAgdmFyIHRhYmxlX3NpemUgPSAwO1xuICB2YXIgc2ltcGxlX2NvZGVfb3Jfc2tpcDtcbiAgdmFyIGNvZGVfbGVuZ3RocyA9IG5ldyBVaW50OEFycmF5KGFscGhhYmV0X3NpemUpO1xuICBcbiAgYnIucmVhZE1vcmVJbnB1dCgpO1xuICBcbiAgLyogc2ltcGxlX2NvZGVfb3Jfc2tpcCBpcyB1c2VkIGFzIGZvbGxvd3M6XG4gICAgIDEgZm9yIHNpbXBsZSBjb2RlO1xuICAgICAwIGZvciBubyBza2lwcGluZywgMiBza2lwcyAyIGNvZGUgbGVuZ3RocywgMyBza2lwcyAzIGNvZGUgbGVuZ3RocyAqL1xuICBzaW1wbGVfY29kZV9vcl9za2lwID0gYnIucmVhZEJpdHMoMik7XG4gIGlmIChzaW1wbGVfY29kZV9vcl9za2lwID09PSAxKSB7XG4gICAgLyogUmVhZCBzeW1ib2xzLCBjb2RlcyAmIGNvZGUgbGVuZ3RocyBkaXJlY3RseS4gKi9cbiAgICB2YXIgaTtcbiAgICB2YXIgbWF4X2JpdHNfY291bnRlciA9IGFscGhhYmV0X3NpemUgLSAxO1xuICAgIHZhciBtYXhfYml0cyA9IDA7XG4gICAgdmFyIHN5bWJvbHMgPSBuZXcgSW50MzJBcnJheSg0KTtcbiAgICB2YXIgbnVtX3N5bWJvbHMgPSBici5yZWFkQml0cygyKSArIDE7XG4gICAgd2hpbGUgKG1heF9iaXRzX2NvdW50ZXIpIHtcbiAgICAgIG1heF9iaXRzX2NvdW50ZXIgPj49IDE7XG4gICAgICArK21heF9iaXRzO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBudW1fc3ltYm9sczsgKytpKSB7XG4gICAgICBzeW1ib2xzW2ldID0gYnIucmVhZEJpdHMobWF4X2JpdHMpICUgYWxwaGFiZXRfc2l6ZTtcbiAgICAgIGNvZGVfbGVuZ3Roc1tzeW1ib2xzW2ldXSA9IDI7XG4gICAgfVxuICAgIGNvZGVfbGVuZ3Roc1tzeW1ib2xzWzBdXSA9IDE7XG4gICAgc3dpdGNoIChudW1fc3ltYm9scykge1xuICAgICAgY2FzZSAxOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaWYgKChzeW1ib2xzWzBdID09PSBzeW1ib2xzWzFdKSB8fFxuICAgICAgICAgICAgKHN5bWJvbHNbMF0gPT09IHN5bWJvbHNbMl0pIHx8XG4gICAgICAgICAgICAoc3ltYm9sc1sxXSA9PT0gc3ltYm9sc1syXSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tSZWFkSHVmZm1hbkNvZGVdIGludmFsaWQgc3ltYm9scycpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBpZiAoc3ltYm9sc1swXSA9PT0gc3ltYm9sc1sxXSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW1JlYWRIdWZmbWFuQ29kZV0gaW52YWxpZCBzeW1ib2xzJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvZGVfbGVuZ3Roc1tzeW1ib2xzWzFdXSA9IDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgICBpZiAoKHN5bWJvbHNbMF0gPT09IHN5bWJvbHNbMV0pIHx8XG4gICAgICAgICAgICAoc3ltYm9sc1swXSA9PT0gc3ltYm9sc1syXSkgfHxcbiAgICAgICAgICAgIChzeW1ib2xzWzBdID09PSBzeW1ib2xzWzNdKSB8fFxuICAgICAgICAgICAgKHN5bWJvbHNbMV0gPT09IHN5bWJvbHNbMl0pIHx8XG4gICAgICAgICAgICAoc3ltYm9sc1sxXSA9PT0gc3ltYm9sc1szXSkgfHxcbiAgICAgICAgICAgIChzeW1ib2xzWzJdID09PSBzeW1ib2xzWzNdKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW1JlYWRIdWZmbWFuQ29kZV0gaW52YWxpZCBzeW1ib2xzJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChici5yZWFkQml0cygxKSkge1xuICAgICAgICAgIGNvZGVfbGVuZ3Roc1tzeW1ib2xzWzJdXSA9IDM7XG4gICAgICAgICAgY29kZV9sZW5ndGhzW3N5bWJvbHNbM11dID0gMztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb2RlX2xlbmd0aHNbc3ltYm9sc1swXV0gPSAyO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSBlbHNlIHsgIC8qIERlY29kZSBIdWZmbWFuLWNvZGVkIGNvZGUgbGVuZ3Rocy4gKi9cbiAgICB2YXIgaTtcbiAgICB2YXIgY29kZV9sZW5ndGhfY29kZV9sZW5ndGhzID0gbmV3IFVpbnQ4QXJyYXkoQ09ERV9MRU5HVEhfQ09ERVMpO1xuICAgIHZhciBzcGFjZSA9IDMyO1xuICAgIHZhciBudW1fY29kZXMgPSAwO1xuICAgIC8qIFN0YXRpYyBIdWZmbWFuIGNvZGUgZm9yIHRoZSBjb2RlIGxlbmd0aCBjb2RlIGxlbmd0aHMgKi9cbiAgICB2YXIgaHVmZiA9IFtcbiAgICAgIG5ldyBIdWZmbWFuQ29kZSgyLCAwKSwgbmV3IEh1ZmZtYW5Db2RlKDIsIDQpLCBuZXcgSHVmZm1hbkNvZGUoMiwgMyksIG5ldyBIdWZmbWFuQ29kZSgzLCAyKSwgXG4gICAgICBuZXcgSHVmZm1hbkNvZGUoMiwgMCksIG5ldyBIdWZmbWFuQ29kZSgyLCA0KSwgbmV3IEh1ZmZtYW5Db2RlKDIsIDMpLCBuZXcgSHVmZm1hbkNvZGUoNCwgMSksXG4gICAgICBuZXcgSHVmZm1hbkNvZGUoMiwgMCksIG5ldyBIdWZmbWFuQ29kZSgyLCA0KSwgbmV3IEh1ZmZtYW5Db2RlKDIsIDMpLCBuZXcgSHVmZm1hbkNvZGUoMywgMiksIFxuICAgICAgbmV3IEh1ZmZtYW5Db2RlKDIsIDApLCBuZXcgSHVmZm1hbkNvZGUoMiwgNCksIG5ldyBIdWZmbWFuQ29kZSgyLCAzKSwgbmV3IEh1ZmZtYW5Db2RlKDQsIDUpXG4gICAgXTtcbiAgICBmb3IgKGkgPSBzaW1wbGVfY29kZV9vcl9za2lwOyBpIDwgQ09ERV9MRU5HVEhfQ09ERVMgJiYgc3BhY2UgPiAwOyArK2kpIHtcbiAgICAgIHZhciBjb2RlX2xlbl9pZHggPSBrQ29kZUxlbmd0aENvZGVPcmRlcltpXTtcbiAgICAgIHZhciBwID0gMDtcbiAgICAgIHZhciB2O1xuICAgICAgYnIuZmlsbEJpdFdpbmRvdygpO1xuICAgICAgcCArPSAoYnIudmFsXyA+Pj4gYnIuYml0X3Bvc18pICYgMTU7XG4gICAgICBici5iaXRfcG9zXyArPSBodWZmW3BdLmJpdHM7XG4gICAgICB2ID0gaHVmZltwXS52YWx1ZTtcbiAgICAgIGNvZGVfbGVuZ3RoX2NvZGVfbGVuZ3Roc1tjb2RlX2xlbl9pZHhdID0gdjtcbiAgICAgIGlmICh2ICE9PSAwKSB7XG4gICAgICAgIHNwYWNlIC09ICgzMiA+PiB2KTtcbiAgICAgICAgKytudW1fY29kZXM7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmICghKG51bV9jb2RlcyA9PT0gMSB8fCBzcGFjZSA9PT0gMCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tSZWFkSHVmZm1hbkNvZGVdIGludmFsaWQgbnVtX2NvZGVzIG9yIHNwYWNlJyk7XG4gICAgXG4gICAgUmVhZEh1ZmZtYW5Db2RlTGVuZ3Rocyhjb2RlX2xlbmd0aF9jb2RlX2xlbmd0aHMsIGFscGhhYmV0X3NpemUsIGNvZGVfbGVuZ3RocywgYnIpO1xuICB9XG4gIFxuICB0YWJsZV9zaXplID0gQnJvdGxpQnVpbGRIdWZmbWFuVGFibGUodGFibGVzLCB0YWJsZSwgSFVGRk1BTl9UQUJMRV9CSVRTLCBjb2RlX2xlbmd0aHMsIGFscGhhYmV0X3NpemUpO1xuICBcbiAgaWYgKHRhYmxlX3NpemUgPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJbUmVhZEh1ZmZtYW5Db2RlXSBCdWlsZEh1ZmZtYW5UYWJsZSBmYWlsZWQ6IFwiKTtcbiAgfVxuICBcbiAgcmV0dXJuIHRhYmxlX3NpemU7XG59XG5cbmZ1bmN0aW9uIFJlYWRCbG9ja0xlbmd0aCh0YWJsZSwgaW5kZXgsIGJyKSB7XG4gIHZhciBjb2RlO1xuICB2YXIgbmJpdHM7XG4gIGNvZGUgPSBSZWFkU3ltYm9sKHRhYmxlLCBpbmRleCwgYnIpO1xuICBuYml0cyA9IFByZWZpeC5rQmxvY2tMZW5ndGhQcmVmaXhDb2RlW2NvZGVdLm5iaXRzO1xuICByZXR1cm4gUHJlZml4LmtCbG9ja0xlbmd0aFByZWZpeENvZGVbY29kZV0ub2Zmc2V0ICsgYnIucmVhZEJpdHMobmJpdHMpO1xufVxuXG5mdW5jdGlvbiBUcmFuc2xhdGVTaG9ydENvZGVzKGNvZGUsIHJpbmdidWZmZXIsIGluZGV4KSB7XG4gIHZhciB2YWw7XG4gIGlmIChjb2RlIDwgTlVNX0RJU1RBTkNFX1NIT1JUX0NPREVTKSB7XG4gICAgaW5kZXggKz0ga0Rpc3RhbmNlU2hvcnRDb2RlSW5kZXhPZmZzZXRbY29kZV07XG4gICAgaW5kZXggJj0gMztcbiAgICB2YWwgPSByaW5nYnVmZmVyW2luZGV4XSArIGtEaXN0YW5jZVNob3J0Q29kZVZhbHVlT2Zmc2V0W2NvZGVdO1xuICB9IGVsc2Uge1xuICAgIHZhbCA9IGNvZGUgLSBOVU1fRElTVEFOQ0VfU0hPUlRfQ09ERVMgKyAxO1xuICB9XG4gIHJldHVybiB2YWw7XG59XG5cbmZ1bmN0aW9uIE1vdmVUb0Zyb250KHYsIGluZGV4KSB7XG4gIHZhciB2YWx1ZSA9IHZbaW5kZXhdO1xuICB2YXIgaSA9IGluZGV4O1xuICBmb3IgKDsgaTsgLS1pKSB2W2ldID0gdltpIC0gMV07XG4gIHZbMF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gSW52ZXJzZU1vdmVUb0Zyb250VHJhbnNmb3JtKHYsIHZfbGVuKSB7XG4gIHZhciBtdGYgPSBuZXcgVWludDhBcnJheSgyNTYpO1xuICB2YXIgaTtcbiAgZm9yIChpID0gMDsgaSA8IDI1NjsgKytpKSB7XG4gICAgbXRmW2ldID0gaTtcbiAgfVxuICBmb3IgKGkgPSAwOyBpIDwgdl9sZW47ICsraSkge1xuICAgIHZhciBpbmRleCA9IHZbaV07XG4gICAgdltpXSA9IG10ZltpbmRleF07XG4gICAgaWYgKGluZGV4KSBNb3ZlVG9Gcm9udChtdGYsIGluZGV4KTtcbiAgfVxufVxuXG4vKiBDb250YWlucyBhIGNvbGxlY3Rpb24gb2YgaHVmZm1hbiB0cmVlcyB3aXRoIHRoZSBzYW1lIGFscGhhYmV0IHNpemUuICovXG5mdW5jdGlvbiBIdWZmbWFuVHJlZUdyb3VwKGFscGhhYmV0X3NpemUsIG51bV9odHJlZXMpIHtcbiAgdGhpcy5hbHBoYWJldF9zaXplID0gYWxwaGFiZXRfc2l6ZTtcbiAgdGhpcy5udW1faHRyZWVzID0gbnVtX2h0cmVlcztcbiAgdGhpcy5jb2RlcyA9IG5ldyBBcnJheShudW1faHRyZWVzICsgbnVtX2h0cmVlcyAqIGtNYXhIdWZmbWFuVGFibGVTaXplWyhhbHBoYWJldF9zaXplICsgMzEpID4+PiA1XSk7ICBcbiAgdGhpcy5odHJlZXMgPSBuZXcgVWludDMyQXJyYXkobnVtX2h0cmVlcyk7XG59XG5cbkh1ZmZtYW5UcmVlR3JvdXAucHJvdG90eXBlLmRlY29kZSA9IGZ1bmN0aW9uKGJyKSB7XG4gIHZhciBpO1xuICB2YXIgdGFibGVfc2l6ZTtcbiAgdmFyIG5leHQgPSAwO1xuICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5udW1faHRyZWVzOyArK2kpIHtcbiAgICB0aGlzLmh0cmVlc1tpXSA9IG5leHQ7XG4gICAgdGFibGVfc2l6ZSA9IFJlYWRIdWZmbWFuQ29kZSh0aGlzLmFscGhhYmV0X3NpemUsIHRoaXMuY29kZXMsIG5leHQsIGJyKTtcbiAgICBuZXh0ICs9IHRhYmxlX3NpemU7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIERlY29kZUNvbnRleHRNYXAoY29udGV4dF9tYXBfc2l6ZSwgYnIpIHtcbiAgdmFyIG91dCA9IHsgbnVtX2h0cmVlczogbnVsbCwgY29udGV4dF9tYXA6IG51bGwgfTtcbiAgdmFyIHVzZV9ybGVfZm9yX3plcm9zO1xuICB2YXIgbWF4X3J1bl9sZW5ndGhfcHJlZml4ID0gMDtcbiAgdmFyIHRhYmxlO1xuICB2YXIgaTtcbiAgXG4gIGJyLnJlYWRNb3JlSW5wdXQoKTtcbiAgdmFyIG51bV9odHJlZXMgPSBvdXQubnVtX2h0cmVlcyA9IERlY29kZVZhckxlblVpbnQ4KGJyKSArIDE7XG5cbiAgdmFyIGNvbnRleHRfbWFwID0gb3V0LmNvbnRleHRfbWFwID0gbmV3IFVpbnQ4QXJyYXkoY29udGV4dF9tYXBfc2l6ZSk7XG4gIGlmIChudW1faHRyZWVzIDw9IDEpIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgdXNlX3JsZV9mb3JfemVyb3MgPSBici5yZWFkQml0cygxKTtcbiAgaWYgKHVzZV9ybGVfZm9yX3plcm9zKSB7XG4gICAgbWF4X3J1bl9sZW5ndGhfcHJlZml4ID0gYnIucmVhZEJpdHMoNCkgKyAxO1xuICB9XG4gIFxuICB0YWJsZSA9IFtdO1xuICBmb3IgKGkgPSAwOyBpIDwgSFVGRk1BTl9NQVhfVEFCTEVfU0laRTsgaSsrKSB7XG4gICAgdGFibGVbaV0gPSBuZXcgSHVmZm1hbkNvZGUoMCwgMCk7XG4gIH1cbiAgXG4gIFJlYWRIdWZmbWFuQ29kZShudW1faHRyZWVzICsgbWF4X3J1bl9sZW5ndGhfcHJlZml4LCB0YWJsZSwgMCwgYnIpO1xuICBcbiAgZm9yIChpID0gMDsgaSA8IGNvbnRleHRfbWFwX3NpemU7KSB7XG4gICAgdmFyIGNvZGU7XG5cbiAgICBici5yZWFkTW9yZUlucHV0KCk7XG4gICAgY29kZSA9IFJlYWRTeW1ib2wodGFibGUsIDAsIGJyKTtcbiAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgY29udGV4dF9tYXBbaV0gPSAwO1xuICAgICAgKytpO1xuICAgIH0gZWxzZSBpZiAoY29kZSA8PSBtYXhfcnVuX2xlbmd0aF9wcmVmaXgpIHtcbiAgICAgIHZhciByZXBzID0gMSArICgxIDw8IGNvZGUpICsgYnIucmVhZEJpdHMoY29kZSk7XG4gICAgICB3aGlsZSAoLS1yZXBzKSB7XG4gICAgICAgIGlmIChpID49IGNvbnRleHRfbWFwX3NpemUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJbRGVjb2RlQ29udGV4dE1hcF0gaSA+PSBjb250ZXh0X21hcF9zaXplXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHRfbWFwW2ldID0gMDtcbiAgICAgICAgKytpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0X21hcFtpXSA9IGNvZGUgLSBtYXhfcnVuX2xlbmd0aF9wcmVmaXg7XG4gICAgICArK2k7XG4gICAgfVxuICB9XG4gIGlmIChici5yZWFkQml0cygxKSkge1xuICAgIEludmVyc2VNb3ZlVG9Gcm9udFRyYW5zZm9ybShjb250ZXh0X21hcCwgY29udGV4dF9tYXBfc2l6ZSk7XG4gIH1cbiAgXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIERlY29kZUJsb2NrVHlwZShtYXhfYmxvY2tfdHlwZSwgdHJlZXMsIHRyZWVfdHlwZSwgYmxvY2tfdHlwZXMsIHJpbmdidWZmZXJzLCBpbmRleGVzLCBicikge1xuICB2YXIgcmluZ2J1ZmZlciA9IHRyZWVfdHlwZSAqIDI7XG4gIHZhciBpbmRleCA9IHRyZWVfdHlwZTtcbiAgdmFyIHR5cGVfY29kZSA9IFJlYWRTeW1ib2wodHJlZXMsIHRyZWVfdHlwZSAqIEhVRkZNQU5fTUFYX1RBQkxFX1NJWkUsIGJyKTtcbiAgdmFyIGJsb2NrX3R5cGU7XG4gIGlmICh0eXBlX2NvZGUgPT09IDApIHtcbiAgICBibG9ja190eXBlID0gcmluZ2J1ZmZlcnNbcmluZ2J1ZmZlciArIChpbmRleGVzW2luZGV4XSAmIDEpXTtcbiAgfSBlbHNlIGlmICh0eXBlX2NvZGUgPT09IDEpIHtcbiAgICBibG9ja190eXBlID0gcmluZ2J1ZmZlcnNbcmluZ2J1ZmZlciArICgoaW5kZXhlc1tpbmRleF0gLSAxKSAmIDEpXSArIDE7XG4gIH0gZWxzZSB7XG4gICAgYmxvY2tfdHlwZSA9IHR5cGVfY29kZSAtIDI7XG4gIH1cbiAgaWYgKGJsb2NrX3R5cGUgPj0gbWF4X2Jsb2NrX3R5cGUpIHtcbiAgICBibG9ja190eXBlIC09IG1heF9ibG9ja190eXBlO1xuICB9XG4gIGJsb2NrX3R5cGVzW3RyZWVfdHlwZV0gPSBibG9ja190eXBlO1xuICByaW5nYnVmZmVyc1tyaW5nYnVmZmVyICsgKGluZGV4ZXNbaW5kZXhdICYgMSldID0gYmxvY2tfdHlwZTtcbiAgKytpbmRleGVzW2luZGV4XTtcbn1cblxuZnVuY3Rpb24gQ29weVVuY29tcHJlc3NlZEJsb2NrVG9PdXRwdXQob3V0cHV0LCBsZW4sIHBvcywgcmluZ2J1ZmZlciwgcmluZ2J1ZmZlcl9tYXNrLCBicikge1xuICB2YXIgcmJfc2l6ZSA9IHJpbmdidWZmZXJfbWFzayArIDE7XG4gIHZhciByYl9wb3MgPSBwb3MgJiByaW5nYnVmZmVyX21hc2s7XG4gIHZhciBicl9wb3MgPSBici5wb3NfICYgQnJvdGxpQml0UmVhZGVyLklCVUZfTUFTSztcbiAgdmFyIG5ieXRlcztcblxuICAvKiBGb3Igc2hvcnQgbGVuZ3RocyBjb3B5IGJ5dGUtYnktYnl0ZSAqL1xuICBpZiAobGVuIDwgOCB8fCBici5iaXRfcG9zXyArIChsZW4gPDwgMykgPCBici5iaXRfZW5kX3Bvc18pIHtcbiAgICB3aGlsZSAobGVuLS0gPiAwKSB7XG4gICAgICBici5yZWFkTW9yZUlucHV0KCk7XG4gICAgICByaW5nYnVmZmVyW3JiX3BvcysrXSA9IGJyLnJlYWRCaXRzKDgpO1xuICAgICAgaWYgKHJiX3BvcyA9PT0gcmJfc2l6ZSkge1xuICAgICAgICBvdXRwdXQud3JpdGUocmluZ2J1ZmZlciwgcmJfc2l6ZSk7XG4gICAgICAgIHJiX3BvcyA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChici5iaXRfZW5kX3Bvc18gPCAzMikge1xuICAgIHRocm93IG5ldyBFcnJvcignW0NvcHlVbmNvbXByZXNzZWRCbG9ja1RvT3V0cHV0XSBici5iaXRfZW5kX3Bvc18gPCAzMicpO1xuICB9XG5cbiAgLyogQ29weSByZW1haW5pbmcgMC00IGJ5dGVzIGZyb20gYnIudmFsXyB0byByaW5nYnVmZmVyLiAqL1xuICB3aGlsZSAoYnIuYml0X3Bvc18gPCAzMikge1xuICAgIHJpbmdidWZmZXJbcmJfcG9zXSA9IChici52YWxfID4+PiBici5iaXRfcG9zXyk7XG4gICAgYnIuYml0X3Bvc18gKz0gODtcbiAgICArK3JiX3BvcztcbiAgICAtLWxlbjtcbiAgfVxuXG4gIC8qIENvcHkgcmVtYWluaW5nIGJ5dGVzIGZyb20gYnIuYnVmXyB0byByaW5nYnVmZmVyLiAqL1xuICBuYnl0ZXMgPSAoYnIuYml0X2VuZF9wb3NfIC0gYnIuYml0X3Bvc18pID4+IDM7XG4gIGlmIChicl9wb3MgKyBuYnl0ZXMgPiBCcm90bGlCaXRSZWFkZXIuSUJVRl9NQVNLKSB7XG4gICAgdmFyIHRhaWwgPSBCcm90bGlCaXRSZWFkZXIuSUJVRl9NQVNLICsgMSAtIGJyX3BvcztcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRhaWw7IHgrKylcbiAgICAgIHJpbmdidWZmZXJbcmJfcG9zICsgeF0gPSBici5idWZfW2JyX3BvcyArIHhdO1xuICAgIFxuICAgIG5ieXRlcyAtPSB0YWlsO1xuICAgIHJiX3BvcyArPSB0YWlsO1xuICAgIGxlbiAtPSB0YWlsO1xuICAgIGJyX3BvcyA9IDA7XG4gIH1cblxuICBmb3IgKHZhciB4ID0gMDsgeCA8IG5ieXRlczsgeCsrKVxuICAgIHJpbmdidWZmZXJbcmJfcG9zICsgeF0gPSBici5idWZfW2JyX3BvcyArIHhdO1xuICBcbiAgcmJfcG9zICs9IG5ieXRlcztcbiAgbGVuIC09IG5ieXRlcztcblxuICAvKiBJZiB3ZSB3cm90ZSBwYXN0IHRoZSBsb2dpY2FsIGVuZCBvZiB0aGUgcmluZ2J1ZmZlciwgY29weSB0aGUgdGFpbCBvZiB0aGVcbiAgICAgcmluZ2J1ZmZlciB0byBpdHMgYmVnaW5uaW5nIGFuZCBmbHVzaCB0aGUgcmluZ2J1ZmZlciB0byB0aGUgb3V0cHV0LiAqL1xuICBpZiAocmJfcG9zID49IHJiX3NpemUpIHtcbiAgICBvdXRwdXQud3JpdGUocmluZ2J1ZmZlciwgcmJfc2l6ZSk7XG4gICAgcmJfcG9zIC09IHJiX3NpemU7ICAgIFxuICAgIGZvciAodmFyIHggPSAwOyB4IDwgcmJfcG9zOyB4KyspXG4gICAgICByaW5nYnVmZmVyW3hdID0gcmluZ2J1ZmZlcltyYl9zaXplICsgeF07XG4gIH1cblxuICAvKiBJZiB3ZSBoYXZlIG1vcmUgdG8gY29weSB0aGFuIHRoZSByZW1haW5pbmcgc2l6ZSBvZiB0aGUgcmluZ2J1ZmZlciwgdGhlbiB3ZVxuICAgICBmaXJzdCBmaWxsIHRoZSByaW5nYnVmZmVyIGZyb20gdGhlIGlucHV0IGFuZCB0aGVuIGZsdXNoIHRoZSByaW5nYnVmZmVyIHRvXG4gICAgIHRoZSBvdXRwdXQgKi9cbiAgd2hpbGUgKHJiX3BvcyArIGxlbiA+PSByYl9zaXplKSB7XG4gICAgbmJ5dGVzID0gcmJfc2l6ZSAtIHJiX3BvcztcbiAgICBpZiAoYnIuaW5wdXRfLnJlYWQocmluZ2J1ZmZlciwgcmJfcG9zLCBuYnl0ZXMpIDwgbmJ5dGVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tDb3B5VW5jb21wcmVzc2VkQmxvY2tUb091dHB1dF0gbm90IGVub3VnaCBieXRlcycpO1xuICAgIH1cbiAgICBvdXRwdXQud3JpdGUocmluZ2J1ZmZlciwgcmJfc2l6ZSk7XG4gICAgbGVuIC09IG5ieXRlcztcbiAgICByYl9wb3MgPSAwO1xuICB9XG5cbiAgLyogQ29weSBzdHJhaWdodCBmcm9tIHRoZSBpbnB1dCBvbnRvIHRoZSByaW5nYnVmZmVyLiBUaGUgcmluZ2J1ZmZlciB3aWxsIGJlXG4gICAgIGZsdXNoZWQgdG8gdGhlIG91dHB1dCBhdCBhIGxhdGVyIHRpbWUuICovXG4gIGlmIChici5pbnB1dF8ucmVhZChyaW5nYnVmZmVyLCByYl9wb3MsIGxlbikgPCBsZW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1tDb3B5VW5jb21wcmVzc2VkQmxvY2tUb091dHB1dF0gbm90IGVub3VnaCBieXRlcycpO1xuICB9XG5cbiAgLyogUmVzdG9yZSB0aGUgc3RhdGUgb2YgdGhlIGJpdCByZWFkZXIuICovXG4gIGJyLnJlc2V0KCk7XG59XG5cbi8qIEFkdmFuY2VzIHRoZSBiaXQgcmVhZGVyIHBvc2l0aW9uIHRvIHRoZSBuZXh0IGJ5dGUgYm91bmRhcnkgYW5kIHZlcmlmaWVzXG4gICB0aGF0IGFueSBza2lwcGVkIGJpdHMgYXJlIHNldCB0byB6ZXJvLiAqL1xuZnVuY3Rpb24gSnVtcFRvQnl0ZUJvdW5kYXJ5KGJyKSB7XG4gIHZhciBuZXdfYml0X3BvcyA9IChici5iaXRfcG9zXyArIDcpICYgfjc7XG4gIHZhciBwYWRfYml0cyA9IGJyLnJlYWRCaXRzKG5ld19iaXRfcG9zIC0gYnIuYml0X3Bvc18pO1xuICByZXR1cm4gcGFkX2JpdHMgPT0gMDtcbn1cblxuZnVuY3Rpb24gQnJvdGxpRGVjb21wcmVzc2VkU2l6ZShidWZmZXIpIHtcbiAgdmFyIGlucHV0ID0gbmV3IEJyb3RsaUlucHV0KGJ1ZmZlcik7XG4gIHZhciBiciA9IG5ldyBCcm90bGlCaXRSZWFkZXIoaW5wdXQpO1xuICBEZWNvZGVXaW5kb3dCaXRzKGJyKTtcbiAgdmFyIG91dCA9IERlY29kZU1ldGFCbG9ja0xlbmd0aChicik7XG4gIHJldHVybiBvdXQubWV0YV9ibG9ja19sZW5ndGg7XG59XG5cbmV4cG9ydHMuQnJvdGxpRGVjb21wcmVzc2VkU2l6ZSA9IEJyb3RsaURlY29tcHJlc3NlZFNpemU7XG5cbmZ1bmN0aW9uIEJyb3RsaURlY29tcHJlc3NCdWZmZXIoYnVmZmVyLCBvdXRwdXRfc2l6ZSkge1xuICB2YXIgaW5wdXQgPSBuZXcgQnJvdGxpSW5wdXQoYnVmZmVyKTtcbiAgXG4gIGlmIChvdXRwdXRfc2l6ZSA9PSBudWxsKSB7XG4gICAgb3V0cHV0X3NpemUgPSBCcm90bGlEZWNvbXByZXNzZWRTaXplKGJ1ZmZlcik7XG4gIH1cbiAgXG4gIHZhciBvdXRwdXRfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkob3V0cHV0X3NpemUpO1xuICB2YXIgb3V0cHV0ID0gbmV3IEJyb3RsaU91dHB1dChvdXRwdXRfYnVmZmVyKTtcbiAgXG4gIEJyb3RsaURlY29tcHJlc3MoaW5wdXQsIG91dHB1dCk7XG4gIFxuICBpZiAob3V0cHV0LnBvcyA8IG91dHB1dC5idWZmZXIubGVuZ3RoKSB7XG4gICAgb3V0cHV0LmJ1ZmZlciA9IG91dHB1dC5idWZmZXIuc3ViYXJyYXkoMCwgb3V0cHV0LnBvcyk7XG4gIH1cbiAgXG4gIHJldHVybiBvdXRwdXQuYnVmZmVyO1xufVxuXG5leHBvcnRzLkJyb3RsaURlY29tcHJlc3NCdWZmZXIgPSBCcm90bGlEZWNvbXByZXNzQnVmZmVyO1xuXG5mdW5jdGlvbiBCcm90bGlEZWNvbXByZXNzKGlucHV0LCBvdXRwdXQpIHtcbiAgdmFyIGk7XG4gIHZhciBwb3MgPSAwO1xuICB2YXIgaW5wdXRfZW5kID0gMDtcbiAgdmFyIHdpbmRvd19iaXRzID0gMDtcbiAgdmFyIG1heF9iYWNrd2FyZF9kaXN0YW5jZTtcbiAgdmFyIG1heF9kaXN0YW5jZSA9IDA7XG4gIHZhciByaW5nYnVmZmVyX3NpemU7XG4gIHZhciByaW5nYnVmZmVyX21hc2s7XG4gIHZhciByaW5nYnVmZmVyO1xuICB2YXIgcmluZ2J1ZmZlcl9lbmQ7XG4gIC8qIFRoaXMgcmluZyBidWZmZXIgaG9sZHMgYSBmZXcgcGFzdCBjb3B5IGRpc3RhbmNlcyB0aGF0IHdpbGwgYmUgdXNlZCBieSAqL1xuICAvKiBzb21lIHNwZWNpYWwgZGlzdGFuY2UgY29kZXMuICovXG4gIHZhciBkaXN0X3JiID0gWyAxNiwgMTUsIDExLCA0IF07XG4gIHZhciBkaXN0X3JiX2lkeCA9IDA7XG4gIC8qIFRoZSBwcmV2aW91cyAyIGJ5dGVzIHVzZWQgZm9yIGNvbnRleHQuICovXG4gIHZhciBwcmV2X2J5dGUxID0gMDtcbiAgdmFyIHByZXZfYnl0ZTIgPSAwO1xuICB2YXIgaGdyb3VwID0gW25ldyBIdWZmbWFuVHJlZUdyb3VwKDAsIDApLCBuZXcgSHVmZm1hblRyZWVHcm91cCgwLCAwKSwgbmV3IEh1ZmZtYW5UcmVlR3JvdXAoMCwgMCldO1xuICB2YXIgYmxvY2tfdHlwZV90cmVlcztcbiAgdmFyIGJsb2NrX2xlbl90cmVlcztcbiAgdmFyIGJyO1xuXG4gIC8qIFdlIG5lZWQgdGhlIHNsYWNrIHJlZ2lvbiBmb3IgdGhlIGZvbGxvd2luZyByZWFzb25zOlxuICAgICAgIC0gYWx3YXlzIGRvaW5nIHR3byA4LWJ5dGUgY29waWVzIGZvciBmYXN0IGJhY2t3YXJkIGNvcHlpbmdcbiAgICAgICAtIHRyYW5zZm9ybXNcbiAgICAgICAtIGZsdXNoaW5nIHRoZSBpbnB1dCByaW5nYnVmZmVyIHdoZW4gZGVjb2RpbmcgdW5jb21wcmVzc2VkIGJsb2NrcyAqL1xuICB2YXIga1JpbmdCdWZmZXJXcml0ZUFoZWFkU2xhY2sgPSAxMjggKyBCcm90bGlCaXRSZWFkZXIuUkVBRF9TSVpFO1xuXG4gIGJyID0gbmV3IEJyb3RsaUJpdFJlYWRlcihpbnB1dCk7XG5cbiAgLyogRGVjb2RlIHdpbmRvdyBzaXplLiAqL1xuICB3aW5kb3dfYml0cyA9IERlY29kZVdpbmRvd0JpdHMoYnIpO1xuICBtYXhfYmFja3dhcmRfZGlzdGFuY2UgPSAoMSA8PCB3aW5kb3dfYml0cykgLSAxNjtcblxuICByaW5nYnVmZmVyX3NpemUgPSAxIDw8IHdpbmRvd19iaXRzO1xuICByaW5nYnVmZmVyX21hc2sgPSByaW5nYnVmZmVyX3NpemUgLSAxO1xuICByaW5nYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkocmluZ2J1ZmZlcl9zaXplICsga1JpbmdCdWZmZXJXcml0ZUFoZWFkU2xhY2sgKyBCcm90bGlEaWN0aW9uYXJ5Lm1heERpY3Rpb25hcnlXb3JkTGVuZ3RoKTtcbiAgcmluZ2J1ZmZlcl9lbmQgPSByaW5nYnVmZmVyX3NpemU7XG5cbiAgYmxvY2tfdHlwZV90cmVlcyA9IFtdO1xuICBibG9ja19sZW5fdHJlZXMgPSBbXTtcbiAgZm9yICh2YXIgeCA9IDA7IHggPCAzICogSFVGRk1BTl9NQVhfVEFCTEVfU0laRTsgeCsrKSB7XG4gICAgYmxvY2tfdHlwZV90cmVlc1t4XSA9IG5ldyBIdWZmbWFuQ29kZSgwLCAwKTtcbiAgICBibG9ja19sZW5fdHJlZXNbeF0gPSBuZXcgSHVmZm1hbkNvZGUoMCwgMCk7XG4gIH1cblxuICB3aGlsZSAoIWlucHV0X2VuZCkge1xuICAgIHZhciBtZXRhX2Jsb2NrX3JlbWFpbmluZ19sZW4gPSAwO1xuICAgIHZhciBpc191bmNvbXByZXNzZWQ7XG4gICAgdmFyIGJsb2NrX2xlbmd0aCA9IFsgMSA8PCAyOCwgMSA8PCAyOCwgMSA8PCAyOCBdO1xuICAgIHZhciBibG9ja190eXBlID0gWyAwIF07XG4gICAgdmFyIG51bV9ibG9ja190eXBlcyA9IFsgMSwgMSwgMSBdO1xuICAgIHZhciBibG9ja190eXBlX3JiID0gWyAwLCAxLCAwLCAxLCAwLCAxIF07XG4gICAgdmFyIGJsb2NrX3R5cGVfcmJfaW5kZXggPSBbIDAgXTtcbiAgICB2YXIgZGlzdGFuY2VfcG9zdGZpeF9iaXRzO1xuICAgIHZhciBudW1fZGlyZWN0X2Rpc3RhbmNlX2NvZGVzO1xuICAgIHZhciBkaXN0YW5jZV9wb3N0Zml4X21hc2s7XG4gICAgdmFyIG51bV9kaXN0YW5jZV9jb2RlcztcbiAgICB2YXIgY29udGV4dF9tYXAgPSBudWxsO1xuICAgIHZhciBjb250ZXh0X21vZGVzID0gbnVsbDtcbiAgICB2YXIgbnVtX2xpdGVyYWxfaHRyZWVzO1xuICAgIHZhciBkaXN0X2NvbnRleHRfbWFwID0gbnVsbDtcbiAgICB2YXIgbnVtX2Rpc3RfaHRyZWVzO1xuICAgIHZhciBjb250ZXh0X29mZnNldCA9IDA7XG4gICAgdmFyIGNvbnRleHRfbWFwX3NsaWNlID0gbnVsbDtcbiAgICB2YXIgbGl0ZXJhbF9odHJlZV9pbmRleCA9IDA7XG4gICAgdmFyIGRpc3RfY29udGV4dF9vZmZzZXQgPSAwO1xuICAgIHZhciBkaXN0X2NvbnRleHRfbWFwX3NsaWNlID0gbnVsbDtcbiAgICB2YXIgZGlzdF9odHJlZV9pbmRleCA9IDA7XG4gICAgdmFyIGNvbnRleHRfbG9va3VwX29mZnNldDEgPSAwO1xuICAgIHZhciBjb250ZXh0X2xvb2t1cF9vZmZzZXQyID0gMDtcbiAgICB2YXIgY29udGV4dF9tb2RlO1xuICAgIHZhciBodHJlZV9jb21tYW5kO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IDM7ICsraSkge1xuICAgICAgaGdyb3VwW2ldLmNvZGVzID0gbnVsbDtcbiAgICAgIGhncm91cFtpXS5odHJlZXMgPSBudWxsO1xuICAgIH1cblxuICAgIGJyLnJlYWRNb3JlSW5wdXQoKTtcbiAgICBcbiAgICB2YXIgX291dCA9IERlY29kZU1ldGFCbG9ja0xlbmd0aChicik7XG4gICAgbWV0YV9ibG9ja19yZW1haW5pbmdfbGVuID0gX291dC5tZXRhX2Jsb2NrX2xlbmd0aDtcbiAgICBpZiAocG9zICsgbWV0YV9ibG9ja19yZW1haW5pbmdfbGVuID4gb3V0cHV0LmJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgIC8qIFdlIG5lZWQgdG8gZ3JvdyB0aGUgb3V0cHV0IGJ1ZmZlciB0byBmaXQgdGhlIGFkZGl0aW9uYWwgZGF0YS4gKi9cbiAgICAgIHZhciB0bXAgPSBuZXcgVWludDhBcnJheSggcG9zICsgbWV0YV9ibG9ja19yZW1haW5pbmdfbGVuICk7XG4gICAgICB0bXAuc2V0KCBvdXRwdXQuYnVmZmVyICk7XG4gICAgICBvdXRwdXQuYnVmZmVyID0gdG1wO1xuICAgIH0gICAgXG4gICAgaW5wdXRfZW5kID0gX291dC5pbnB1dF9lbmQ7XG4gICAgaXNfdW5jb21wcmVzc2VkID0gX291dC5pc191bmNvbXByZXNzZWQ7XG4gICAgXG4gICAgaWYgKF9vdXQuaXNfbWV0YWRhdGEpIHtcbiAgICAgIEp1bXBUb0J5dGVCb3VuZGFyeShicik7XG4gICAgICBcbiAgICAgIGZvciAoOyBtZXRhX2Jsb2NrX3JlbWFpbmluZ19sZW4gPiAwOyAtLW1ldGFfYmxvY2tfcmVtYWluaW5nX2xlbikge1xuICAgICAgICBici5yZWFkTW9yZUlucHV0KCk7XG4gICAgICAgIC8qIFJlYWQgb25lIGJ5dGUgYW5kIGlnbm9yZSBpdC4gKi9cbiAgICAgICAgYnIucmVhZEJpdHMoOCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBcbiAgICBpZiAobWV0YV9ibG9ja19yZW1haW5pbmdfbGVuID09PSAwKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGlzX3VuY29tcHJlc3NlZCkge1xuICAgICAgYnIuYml0X3Bvc18gPSAoYnIuYml0X3Bvc18gKyA3KSAmIH43O1xuICAgICAgQ29weVVuY29tcHJlc3NlZEJsb2NrVG9PdXRwdXQob3V0cHV0LCBtZXRhX2Jsb2NrX3JlbWFpbmluZ19sZW4sIHBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJpbmdidWZmZXIsIHJpbmdidWZmZXJfbWFzaywgYnIpO1xuICAgICAgcG9zICs9IG1ldGFfYmxvY2tfcmVtYWluaW5nX2xlbjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBcbiAgICBmb3IgKGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgICBudW1fYmxvY2tfdHlwZXNbaV0gPSBEZWNvZGVWYXJMZW5VaW50OChicikgKyAxO1xuICAgICAgaWYgKG51bV9ibG9ja190eXBlc1tpXSA+PSAyKSB7XG4gICAgICAgIFJlYWRIdWZmbWFuQ29kZShudW1fYmxvY2tfdHlwZXNbaV0gKyAyLCBibG9ja190eXBlX3RyZWVzLCBpICogSFVGRk1BTl9NQVhfVEFCTEVfU0laRSwgYnIpO1xuICAgICAgICBSZWFkSHVmZm1hbkNvZGUoa051bUJsb2NrTGVuZ3RoQ29kZXMsIGJsb2NrX2xlbl90cmVlcywgaSAqIEhVRkZNQU5fTUFYX1RBQkxFX1NJWkUsIGJyKTtcbiAgICAgICAgYmxvY2tfbGVuZ3RoW2ldID0gUmVhZEJsb2NrTGVuZ3RoKGJsb2NrX2xlbl90cmVlcywgaSAqIEhVRkZNQU5fTUFYX1RBQkxFX1NJWkUsIGJyKTtcbiAgICAgICAgYmxvY2tfdHlwZV9yYl9pbmRleFtpXSA9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGJyLnJlYWRNb3JlSW5wdXQoKTtcbiAgICBcbiAgICBkaXN0YW5jZV9wb3N0Zml4X2JpdHMgPSBici5yZWFkQml0cygyKTtcbiAgICBudW1fZGlyZWN0X2Rpc3RhbmNlX2NvZGVzID0gTlVNX0RJU1RBTkNFX1NIT1JUX0NPREVTICsgKGJyLnJlYWRCaXRzKDQpIDw8IGRpc3RhbmNlX3Bvc3RmaXhfYml0cyk7XG4gICAgZGlzdGFuY2VfcG9zdGZpeF9tYXNrID0gKDEgPDwgZGlzdGFuY2VfcG9zdGZpeF9iaXRzKSAtIDE7XG4gICAgbnVtX2Rpc3RhbmNlX2NvZGVzID0gKG51bV9kaXJlY3RfZGlzdGFuY2VfY29kZXMgKyAoNDggPDwgZGlzdGFuY2VfcG9zdGZpeF9iaXRzKSk7XG4gICAgY29udGV4dF9tb2RlcyA9IG5ldyBVaW50OEFycmF5KG51bV9ibG9ja190eXBlc1swXSk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbnVtX2Jsb2NrX3R5cGVzWzBdOyArK2kpIHtcbiAgICAgICBici5yZWFkTW9yZUlucHV0KCk7XG4gICAgICAgY29udGV4dF9tb2Rlc1tpXSA9IChici5yZWFkQml0cygyKSA8PCAxKTtcbiAgICB9XG4gICAgXG4gICAgdmFyIF9vMSA9IERlY29kZUNvbnRleHRNYXAobnVtX2Jsb2NrX3R5cGVzWzBdIDw8IGtMaXRlcmFsQ29udGV4dEJpdHMsIGJyKTtcbiAgICBudW1fbGl0ZXJhbF9odHJlZXMgPSBfbzEubnVtX2h0cmVlcztcbiAgICBjb250ZXh0X21hcCA9IF9vMS5jb250ZXh0X21hcDtcbiAgICBcbiAgICB2YXIgX28yID0gRGVjb2RlQ29udGV4dE1hcChudW1fYmxvY2tfdHlwZXNbMl0gPDwga0Rpc3RhbmNlQ29udGV4dEJpdHMsIGJyKTtcbiAgICBudW1fZGlzdF9odHJlZXMgPSBfbzIubnVtX2h0cmVlcztcbiAgICBkaXN0X2NvbnRleHRfbWFwID0gX28yLmNvbnRleHRfbWFwO1xuICAgIFxuICAgIGhncm91cFswXSA9IG5ldyBIdWZmbWFuVHJlZUdyb3VwKGtOdW1MaXRlcmFsQ29kZXMsIG51bV9saXRlcmFsX2h0cmVlcyk7XG4gICAgaGdyb3VwWzFdID0gbmV3IEh1ZmZtYW5UcmVlR3JvdXAoa051bUluc2VydEFuZENvcHlDb2RlcywgbnVtX2Jsb2NrX3R5cGVzWzFdKTtcbiAgICBoZ3JvdXBbMl0gPSBuZXcgSHVmZm1hblRyZWVHcm91cChudW1fZGlzdGFuY2VfY29kZXMsIG51bV9kaXN0X2h0cmVlcyk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgICBoZ3JvdXBbaV0uZGVjb2RlKGJyKTtcbiAgICB9XG5cbiAgICBjb250ZXh0X21hcF9zbGljZSA9IDA7XG4gICAgZGlzdF9jb250ZXh0X21hcF9zbGljZSA9IDA7XG4gICAgY29udGV4dF9tb2RlID0gY29udGV4dF9tb2Rlc1tibG9ja190eXBlWzBdXTtcbiAgICBjb250ZXh0X2xvb2t1cF9vZmZzZXQxID0gQ29udGV4dC5sb29rdXBPZmZzZXRzW2NvbnRleHRfbW9kZV07XG4gICAgY29udGV4dF9sb29rdXBfb2Zmc2V0MiA9IENvbnRleHQubG9va3VwT2Zmc2V0c1tjb250ZXh0X21vZGUgKyAxXTtcbiAgICBodHJlZV9jb21tYW5kID0gaGdyb3VwWzFdLmh0cmVlc1swXTtcblxuICAgIHdoaWxlIChtZXRhX2Jsb2NrX3JlbWFpbmluZ19sZW4gPiAwKSB7XG4gICAgICB2YXIgY21kX2NvZGU7XG4gICAgICB2YXIgcmFuZ2VfaWR4O1xuICAgICAgdmFyIGluc2VydF9jb2RlO1xuICAgICAgdmFyIGNvcHlfY29kZTtcbiAgICAgIHZhciBpbnNlcnRfbGVuZ3RoO1xuICAgICAgdmFyIGNvcHlfbGVuZ3RoO1xuICAgICAgdmFyIGRpc3RhbmNlX2NvZGU7XG4gICAgICB2YXIgZGlzdGFuY2U7XG4gICAgICB2YXIgY29udGV4dDtcbiAgICAgIHZhciBqO1xuICAgICAgdmFyIGNvcHlfZHN0O1xuXG4gICAgICBici5yZWFkTW9yZUlucHV0KCk7XG4gICAgICBcbiAgICAgIGlmIChibG9ja19sZW5ndGhbMV0gPT09IDApIHtcbiAgICAgICAgRGVjb2RlQmxvY2tUeXBlKG51bV9ibG9ja190eXBlc1sxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrX3R5cGVfdHJlZXMsIDEsIGJsb2NrX3R5cGUsIGJsb2NrX3R5cGVfcmIsXG4gICAgICAgICAgICAgICAgICAgICAgICBibG9ja190eXBlX3JiX2luZGV4LCBicik7XG4gICAgICAgIGJsb2NrX2xlbmd0aFsxXSA9IFJlYWRCbG9ja0xlbmd0aChibG9ja19sZW5fdHJlZXMsIEhVRkZNQU5fTUFYX1RBQkxFX1NJWkUsIGJyKTtcbiAgICAgICAgaHRyZWVfY29tbWFuZCA9IGhncm91cFsxXS5odHJlZXNbYmxvY2tfdHlwZVsxXV07XG4gICAgICB9XG4gICAgICAtLWJsb2NrX2xlbmd0aFsxXTtcbiAgICAgIGNtZF9jb2RlID0gUmVhZFN5bWJvbChoZ3JvdXBbMV0uY29kZXMsIGh0cmVlX2NvbW1hbmQsIGJyKTtcbiAgICAgIHJhbmdlX2lkeCA9IGNtZF9jb2RlID4+IDY7XG4gICAgICBpZiAocmFuZ2VfaWR4ID49IDIpIHtcbiAgICAgICAgcmFuZ2VfaWR4IC09IDI7XG4gICAgICAgIGRpc3RhbmNlX2NvZGUgPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRpc3RhbmNlX2NvZGUgPSAwO1xuICAgICAgfVxuICAgICAgaW5zZXJ0X2NvZGUgPSBQcmVmaXgua0luc2VydFJhbmdlTHV0W3JhbmdlX2lkeF0gKyAoKGNtZF9jb2RlID4+IDMpICYgNyk7XG4gICAgICBjb3B5X2NvZGUgPSBQcmVmaXgua0NvcHlSYW5nZUx1dFtyYW5nZV9pZHhdICsgKGNtZF9jb2RlICYgNyk7XG4gICAgICBpbnNlcnRfbGVuZ3RoID0gUHJlZml4LmtJbnNlcnRMZW5ndGhQcmVmaXhDb2RlW2luc2VydF9jb2RlXS5vZmZzZXQgK1xuICAgICAgICAgIGJyLnJlYWRCaXRzKFByZWZpeC5rSW5zZXJ0TGVuZ3RoUHJlZml4Q29kZVtpbnNlcnRfY29kZV0ubmJpdHMpO1xuICAgICAgY29weV9sZW5ndGggPSBQcmVmaXgua0NvcHlMZW5ndGhQcmVmaXhDb2RlW2NvcHlfY29kZV0ub2Zmc2V0ICtcbiAgICAgICAgICBici5yZWFkQml0cyhQcmVmaXgua0NvcHlMZW5ndGhQcmVmaXhDb2RlW2NvcHlfY29kZV0ubmJpdHMpO1xuICAgICAgcHJldl9ieXRlMSA9IHJpbmdidWZmZXJbcG9zLTEgJiByaW5nYnVmZmVyX21hc2tdO1xuICAgICAgcHJldl9ieXRlMiA9IHJpbmdidWZmZXJbcG9zLTIgJiByaW5nYnVmZmVyX21hc2tdO1xuICAgICAgZm9yIChqID0gMDsgaiA8IGluc2VydF9sZW5ndGg7ICsraikge1xuICAgICAgICBici5yZWFkTW9yZUlucHV0KCk7XG5cbiAgICAgICAgaWYgKGJsb2NrX2xlbmd0aFswXSA9PT0gMCkge1xuICAgICAgICAgIERlY29kZUJsb2NrVHlwZShudW1fYmxvY2tfdHlwZXNbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrX3R5cGVfdHJlZXMsIDAsIGJsb2NrX3R5cGUsIGJsb2NrX3R5cGVfcmIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrX3R5cGVfcmJfaW5kZXgsIGJyKTtcbiAgICAgICAgICBibG9ja19sZW5ndGhbMF0gPSBSZWFkQmxvY2tMZW5ndGgoYmxvY2tfbGVuX3RyZWVzLCAwLCBicik7XG4gICAgICAgICAgY29udGV4dF9vZmZzZXQgPSBibG9ja190eXBlWzBdIDw8IGtMaXRlcmFsQ29udGV4dEJpdHM7XG4gICAgICAgICAgY29udGV4dF9tYXBfc2xpY2UgPSBjb250ZXh0X29mZnNldDtcbiAgICAgICAgICBjb250ZXh0X21vZGUgPSBjb250ZXh0X21vZGVzW2Jsb2NrX3R5cGVbMF1dO1xuICAgICAgICAgIGNvbnRleHRfbG9va3VwX29mZnNldDEgPSBDb250ZXh0Lmxvb2t1cE9mZnNldHNbY29udGV4dF9tb2RlXTtcbiAgICAgICAgICBjb250ZXh0X2xvb2t1cF9vZmZzZXQyID0gQ29udGV4dC5sb29rdXBPZmZzZXRzW2NvbnRleHRfbW9kZSArIDFdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQgPSAoQ29udGV4dC5sb29rdXBbY29udGV4dF9sb29rdXBfb2Zmc2V0MSArIHByZXZfYnl0ZTFdIHxcbiAgICAgICAgICAgICAgICAgICBDb250ZXh0Lmxvb2t1cFtjb250ZXh0X2xvb2t1cF9vZmZzZXQyICsgcHJldl9ieXRlMl0pO1xuICAgICAgICBsaXRlcmFsX2h0cmVlX2luZGV4ID0gY29udGV4dF9tYXBbY29udGV4dF9tYXBfc2xpY2UgKyBjb250ZXh0XTtcbiAgICAgICAgLS1ibG9ja19sZW5ndGhbMF07XG4gICAgICAgIHByZXZfYnl0ZTIgPSBwcmV2X2J5dGUxO1xuICAgICAgICBwcmV2X2J5dGUxID0gUmVhZFN5bWJvbChoZ3JvdXBbMF0uY29kZXMsIGhncm91cFswXS5odHJlZXNbbGl0ZXJhbF9odHJlZV9pbmRleF0sIGJyKTtcbiAgICAgICAgcmluZ2J1ZmZlcltwb3MgJiByaW5nYnVmZmVyX21hc2tdID0gcHJldl9ieXRlMTtcbiAgICAgICAgaWYgKChwb3MgJiByaW5nYnVmZmVyX21hc2spID09PSByaW5nYnVmZmVyX21hc2spIHtcbiAgICAgICAgICBvdXRwdXQud3JpdGUocmluZ2J1ZmZlciwgcmluZ2J1ZmZlcl9zaXplKTtcbiAgICAgICAgfVxuICAgICAgICArK3BvcztcbiAgICAgIH1cbiAgICAgIG1ldGFfYmxvY2tfcmVtYWluaW5nX2xlbiAtPSBpbnNlcnRfbGVuZ3RoO1xuICAgICAgaWYgKG1ldGFfYmxvY2tfcmVtYWluaW5nX2xlbiA8PSAwKSBicmVhaztcblxuICAgICAgaWYgKGRpc3RhbmNlX2NvZGUgPCAwKSB7XG4gICAgICAgIHZhciBjb250ZXh0O1xuICAgICAgICBcbiAgICAgICAgYnIucmVhZE1vcmVJbnB1dCgpO1xuICAgICAgICBpZiAoYmxvY2tfbGVuZ3RoWzJdID09PSAwKSB7XG4gICAgICAgICAgRGVjb2RlQmxvY2tUeXBlKG51bV9ibG9ja190eXBlc1syXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tfdHlwZV90cmVlcywgMiwgYmxvY2tfdHlwZSwgYmxvY2tfdHlwZV9yYixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tfdHlwZV9yYl9pbmRleCwgYnIpO1xuICAgICAgICAgIGJsb2NrX2xlbmd0aFsyXSA9IFJlYWRCbG9ja0xlbmd0aChibG9ja19sZW5fdHJlZXMsIDIgKiBIVUZGTUFOX01BWF9UQUJMRV9TSVpFLCBicik7XG4gICAgICAgICAgZGlzdF9jb250ZXh0X29mZnNldCA9IGJsb2NrX3R5cGVbMl0gPDwga0Rpc3RhbmNlQ29udGV4dEJpdHM7XG4gICAgICAgICAgZGlzdF9jb250ZXh0X21hcF9zbGljZSA9IGRpc3RfY29udGV4dF9vZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgLS1ibG9ja19sZW5ndGhbMl07XG4gICAgICAgIGNvbnRleHQgPSAoY29weV9sZW5ndGggPiA0ID8gMyA6IGNvcHlfbGVuZ3RoIC0gMikgJiAweGZmO1xuICAgICAgICBkaXN0X2h0cmVlX2luZGV4ID0gZGlzdF9jb250ZXh0X21hcFtkaXN0X2NvbnRleHRfbWFwX3NsaWNlICsgY29udGV4dF07XG4gICAgICAgIGRpc3RhbmNlX2NvZGUgPSBSZWFkU3ltYm9sKGhncm91cFsyXS5jb2RlcywgaGdyb3VwWzJdLmh0cmVlc1tkaXN0X2h0cmVlX2luZGV4XSwgYnIpO1xuICAgICAgICBpZiAoZGlzdGFuY2VfY29kZSA+PSBudW1fZGlyZWN0X2Rpc3RhbmNlX2NvZGVzKSB7XG4gICAgICAgICAgdmFyIG5iaXRzO1xuICAgICAgICAgIHZhciBwb3N0Zml4O1xuICAgICAgICAgIHZhciBvZmZzZXQ7XG4gICAgICAgICAgZGlzdGFuY2VfY29kZSAtPSBudW1fZGlyZWN0X2Rpc3RhbmNlX2NvZGVzO1xuICAgICAgICAgIHBvc3RmaXggPSBkaXN0YW5jZV9jb2RlICYgZGlzdGFuY2VfcG9zdGZpeF9tYXNrO1xuICAgICAgICAgIGRpc3RhbmNlX2NvZGUgPj49IGRpc3RhbmNlX3Bvc3RmaXhfYml0cztcbiAgICAgICAgICBuYml0cyA9IChkaXN0YW5jZV9jb2RlID4+IDEpICsgMTtcbiAgICAgICAgICBvZmZzZXQgPSAoKDIgKyAoZGlzdGFuY2VfY29kZSAmIDEpKSA8PCBuYml0cykgLSA0O1xuICAgICAgICAgIGRpc3RhbmNlX2NvZGUgPSBudW1fZGlyZWN0X2Rpc3RhbmNlX2NvZGVzICtcbiAgICAgICAgICAgICAgKChvZmZzZXQgKyBici5yZWFkQml0cyhuYml0cykpIDw8XG4gICAgICAgICAgICAgICBkaXN0YW5jZV9wb3N0Zml4X2JpdHMpICsgcG9zdGZpeDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBDb252ZXJ0IHRoZSBkaXN0YW5jZSBjb2RlIHRvIHRoZSBhY3R1YWwgZGlzdGFuY2UgYnkgcG9zc2libHkgbG9va2luZyAqL1xuICAgICAgLyogdXAgcGFzdCBkaXN0bmFjZXMgZnJvbSB0aGUgcmluZ2J1ZmZlci4gKi9cbiAgICAgIGRpc3RhbmNlID0gVHJhbnNsYXRlU2hvcnRDb2RlcyhkaXN0YW5jZV9jb2RlLCBkaXN0X3JiLCBkaXN0X3JiX2lkeCk7XG4gICAgICBpZiAoZGlzdGFuY2UgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignW0Jyb3RsaURlY29tcHJlc3NdIGludmFsaWQgZGlzdGFuY2UnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBvcyA8IG1heF9iYWNrd2FyZF9kaXN0YW5jZSAmJlxuICAgICAgICAgIG1heF9kaXN0YW5jZSAhPT0gbWF4X2JhY2t3YXJkX2Rpc3RhbmNlKSB7XG4gICAgICAgIG1heF9kaXN0YW5jZSA9IHBvcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1heF9kaXN0YW5jZSA9IG1heF9iYWNrd2FyZF9kaXN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgY29weV9kc3QgPSBwb3MgJiByaW5nYnVmZmVyX21hc2s7XG5cbiAgICAgIGlmIChkaXN0YW5jZSA+IG1heF9kaXN0YW5jZSkge1xuICAgICAgICBpZiAoY29weV9sZW5ndGggPj0gQnJvdGxpRGljdGlvbmFyeS5taW5EaWN0aW9uYXJ5V29yZExlbmd0aCAmJlxuICAgICAgICAgICAgY29weV9sZW5ndGggPD0gQnJvdGxpRGljdGlvbmFyeS5tYXhEaWN0aW9uYXJ5V29yZExlbmd0aCkge1xuICAgICAgICAgIHZhciBvZmZzZXQgPSBCcm90bGlEaWN0aW9uYXJ5Lm9mZnNldHNCeUxlbmd0aFtjb3B5X2xlbmd0aF07XG4gICAgICAgICAgdmFyIHdvcmRfaWQgPSBkaXN0YW5jZSAtIG1heF9kaXN0YW5jZSAtIDE7XG4gICAgICAgICAgdmFyIHNoaWZ0ID0gQnJvdGxpRGljdGlvbmFyeS5zaXplQml0c0J5TGVuZ3RoW2NvcHlfbGVuZ3RoXTtcbiAgICAgICAgICB2YXIgbWFzayA9ICgxIDw8IHNoaWZ0KSAtIDE7XG4gICAgICAgICAgdmFyIHdvcmRfaWR4ID0gd29yZF9pZCAmIG1hc2s7XG4gICAgICAgICAgdmFyIHRyYW5zZm9ybV9pZHggPSB3b3JkX2lkID4+IHNoaWZ0O1xuICAgICAgICAgIG9mZnNldCArPSB3b3JkX2lkeCAqIGNvcHlfbGVuZ3RoO1xuICAgICAgICAgIGlmICh0cmFuc2Zvcm1faWR4IDwgVHJhbnNmb3JtLmtOdW1UcmFuc2Zvcm1zKSB7XG4gICAgICAgICAgICB2YXIgbGVuID0gVHJhbnNmb3JtLnRyYW5zZm9ybURpY3Rpb25hcnlXb3JkKHJpbmdidWZmZXIsIGNvcHlfZHN0LCBvZmZzZXQsIGNvcHlfbGVuZ3RoLCB0cmFuc2Zvcm1faWR4KTtcbiAgICAgICAgICAgIGNvcHlfZHN0ICs9IGxlbjtcbiAgICAgICAgICAgIHBvcyArPSBsZW47XG4gICAgICAgICAgICBtZXRhX2Jsb2NrX3JlbWFpbmluZ19sZW4gLT0gbGVuO1xuICAgICAgICAgICAgaWYgKGNvcHlfZHN0ID49IHJpbmdidWZmZXJfZW5kKSB7XG4gICAgICAgICAgICAgIG91dHB1dC53cml0ZShyaW5nYnVmZmVyLCByaW5nYnVmZmVyX3NpemUpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgZm9yICh2YXIgX3ggPSAwOyBfeCA8IChjb3B5X2RzdCAtIHJpbmdidWZmZXJfZW5kKTsgX3grKylcbiAgICAgICAgICAgICAgICByaW5nYnVmZmVyW194XSA9IHJpbmdidWZmZXJbcmluZ2J1ZmZlcl9lbmQgKyBfeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYmFja3dhcmQgcmVmZXJlbmNlLiBwb3M6IFwiICsgcG9zICsgXCIgZGlzdGFuY2U6IFwiICsgZGlzdGFuY2UgK1xuICAgICAgICAgICAgICBcIiBsZW46IFwiICsgY29weV9sZW5ndGggKyBcIiBieXRlcyBsZWZ0OiBcIiArIG1ldGFfYmxvY2tfcmVtYWluaW5nX2xlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYmFja3dhcmQgcmVmZXJlbmNlLiBwb3M6IFwiICsgcG9zICsgXCIgZGlzdGFuY2U6IFwiICsgZGlzdGFuY2UgK1xuICAgICAgICAgICAgXCIgbGVuOiBcIiArIGNvcHlfbGVuZ3RoICsgXCIgYnl0ZXMgbGVmdDogXCIgKyBtZXRhX2Jsb2NrX3JlbWFpbmluZ19sZW4pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZGlzdGFuY2VfY29kZSA+IDApIHtcbiAgICAgICAgICBkaXN0X3JiW2Rpc3RfcmJfaWR4ICYgM10gPSBkaXN0YW5jZTtcbiAgICAgICAgICArK2Rpc3RfcmJfaWR4O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvcHlfbGVuZ3RoID4gbWV0YV9ibG9ja19yZW1haW5pbmdfbGVuKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBiYWNrd2FyZCByZWZlcmVuY2UuIHBvczogXCIgKyBwb3MgKyBcIiBkaXN0YW5jZTogXCIgKyBkaXN0YW5jZSArXG4gICAgICAgICAgICBcIiBsZW46IFwiICsgY29weV9sZW5ndGggKyBcIiBieXRlcyBsZWZ0OiBcIiArIG1ldGFfYmxvY2tfcmVtYWluaW5nX2xlbik7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgY29weV9sZW5ndGg7ICsraikge1xuICAgICAgICAgIHJpbmdidWZmZXJbcG9zICYgcmluZ2J1ZmZlcl9tYXNrXSA9IHJpbmdidWZmZXJbKHBvcyAtIGRpc3RhbmNlKSAmIHJpbmdidWZmZXJfbWFza107XG4gICAgICAgICAgaWYgKChwb3MgJiByaW5nYnVmZmVyX21hc2spID09PSByaW5nYnVmZmVyX21hc2spIHtcbiAgICAgICAgICAgIG91dHB1dC53cml0ZShyaW5nYnVmZmVyLCByaW5nYnVmZmVyX3NpemUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK3BvcztcbiAgICAgICAgICAtLW1ldGFfYmxvY2tfcmVtYWluaW5nX2xlbjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBXaGVuIHdlIGdldCBoZXJlLCB3ZSBtdXN0IGhhdmUgaW5zZXJ0ZWQgYXQgbGVhc3Qgb25lIGxpdGVyYWwgYW5kICovXG4gICAgICAvKiBtYWRlIGEgY29weSBvZiBhdCBsZWFzdCBsZW5ndGggdHdvLCB0aGVyZWZvcmUgYWNjZXNzaW5nIHRoZSBsYXN0IDIgKi9cbiAgICAgIC8qIGJ5dGVzIGlzIHZhbGlkLiAqL1xuICAgICAgcHJldl9ieXRlMSA9IHJpbmdidWZmZXJbKHBvcyAtIDEpICYgcmluZ2J1ZmZlcl9tYXNrXTtcbiAgICAgIHByZXZfYnl0ZTIgPSByaW5nYnVmZmVyWyhwb3MgLSAyKSAmIHJpbmdidWZmZXJfbWFza107XG4gICAgfVxuXG4gICAgLyogUHJvdGVjdCBwb3MgZnJvbSBvdmVyZmxvdywgd3JhcCBpdCBhcm91bmQgYXQgZXZlcnkgR0Igb2YgaW5wdXQgZGF0YSAqL1xuICAgIHBvcyAmPSAweDNmZmZmZmZmO1xuICB9XG5cbiAgb3V0cHV0LndyaXRlKHJpbmdidWZmZXIsIHBvcyAmIHJpbmdidWZmZXJfbWFzayk7XG59XG5cbmV4cG9ydHMuQnJvdGxpRGVjb21wcmVzcyA9IEJyb3RsaURlY29tcHJlc3M7XG5cbkJyb3RsaURpY3Rpb25hcnkuaW5pdCgpO1xuIiwidmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpO1xuXG4vKipcbiAqIFRoZSBub3JtYWwgZGljdGlvbmFyeS1kYXRhLmpzIGlzIHF1aXRlIGxhcmdlLCB3aGljaCBtYWtlcyBpdCBcbiAqIHVuc3VpdGFibGUgZm9yIGJyb3dzZXIgdXNhZ2UuIEluIG9yZGVyIHRvIG1ha2UgaXQgc21hbGxlciwgXG4gKiB3ZSByZWFkIGRpY3Rpb25hcnkuYmluLCB3aGljaCBpcyBhIGNvbXByZXNzZWQgdmVyc2lvbiBvZlxuICogdGhlIGRpY3Rpb25hcnksIGFuZCBvbiBpbml0aWFsIGxvYWQsIEJyb3RsaSBkZWNvbXByZXNzZXMgXG4gKiBpdCdzIG93biBkaWN0aW9uYXJ5LiDwn5icXG4gKi9cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgQnJvdGxpRGVjb21wcmVzc0J1ZmZlciA9IHJlcXVpcmUoJy4vZGVjb2RlJykuQnJvdGxpRGVjb21wcmVzc0J1ZmZlcjtcbiAgdmFyIGNvbXByZXNzZWQgPSBiYXNlNjQudG9CeXRlQXJyYXkocmVxdWlyZSgnLi9kaWN0aW9uYXJ5LmJpbi5qcycpKTtcbiAgcmV0dXJuIEJyb3RsaURlY29tcHJlc3NCdWZmZXIoY29tcHJlc3NlZCk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHM9XCJXNS9mY1FMbjVnS2YyWFViQWlRMVhVTFgrVFp6NkFEVG9Ec2dxazZxVmZlQzBlNG02T08yd2NRMUo3NlpCVlJWMWZSa0VzZHUvLzYyelFzRkVaV1NUQ25NaGNzUUtsUzJxT2h1VllZTUdDa1YwZlhXRW9NRmJFU1hyS0VaOXdkVUVzeXc5ZzRiSmxFdDFZNm9WTXhNUlRFVmJDSXdaekp6Ym9LNWo4bTRZSDAycWdYWWh2MVYrUE00MzVzTFZ4eUhKaWhhSlJFRWhaR3FMMDN0eEdGUUxtNzZjYUdPL292eEt2ekNieS8zdk1UdFgvNDU5ZjBpZ2k3V3V0bktpTVE2d09EU29SaC84THgxVjNROTlNdkt0d0I2YkhkRVJZUlkwaFN0Sm9Nak5lVHNOWDdibitZN2U0RVEzYmY4eEJjN0wwQnN5ZkZQSzQzZEdTWHBMNmNsWUMvSTMyOGg1NC9WWXJRNWkwNjQ4RmdiR3RsODM3c3ZKMzVMM01vdC8rblBsTnBXZ0t4MWdHWFFZcVg2bitiYlo3d3V5Q0hLY1VvazEyWGpxdWI3TlhaR3pxQngwU0QrdXppTmY4N3Q3dmU0Mmp4U0tRb1czbnl4VnJXSUdsRlNoaENLeGpwWlo1TWVHbmEwK2xCa2sra2FOOEY5cUZCQUZnRW9neU1CZGNYL1QxVy9Xbk1PaS83eWNXVVFsb0VCS0dlQzQ4TWtpd3FKa0pPKzEyZVFpT0ZITW1jazZxL0lqV1czUlpsYW55MjNUQm0rY05yLzg0L29pNUdHbUdCWldyWjZqK3p5a1Zveno1ZlQvUUgvRGE2V1RiWllZUHluVk5PN2t4enVOTjJreEtLV2NoZTVXdmVpdFBLQWVjQjhZY0FIei8relhMamNMemtkRFNrdE5JRHdaRTlKOVgrdHRvNDNvSnk2NXdBcE0zbUR6WXRDd1g5bE0rTjVWUjNrWFlvMFozdDBUdFhmZ0JGZzdnVThvTjBEZ2w3ZlpsVWJoTmxsKzB1dW9oUlZLanJFZDhlZ3JTbmR5NS9UZ2QyZ3FqQTRDQVZ1QzdFU1VtTDNEWm9HbmZoUVY4dXducGk4RUd2QVZWc293TlJ4UHVkY2s3K29xQVVEa3dab3BXcUZuVzFyaXNzMHQxejZpQ0lTVktyZVlHTnZRY1h2KzFMOStqYlA4Y2QvZFBVaXFCc28ycSs3WnlGQnZFTkNra1ZyNDRpeVBidE9vT29DZWNXc2l1cU1TTUw1bHYrdk41TXpVcitEbmg3M0c3UTFZblJZSlZZWEhSSmFOQU9CeWlhSzZDdXNnRmRCUEU0MHIwcnZxWFY3dGtzS08yRHJIWVhCVHY4UDV5c3F4RXg4VkRYVUREcWtQSDZOTk9WL2EyV0g4emxrWFJFTFNhOFAraGVOeUpCQlA3UGdzRzFFdFd0TmVmNi9pK2xjYXl6UXdRQ3NkdWlkcGJLZmhXVURnQUVteWhHdS96VlRhY0k2UlMwelRBQnJPWXVlZW1uVmExOXU5ZlQyM04vVGE2UnZUcG9mNURXeWdxcmVDcXJEQWdNNExJRDErMVQvdGFVNnlURlZMcVhPdisvTXVRT0ZuYUY4dkxNS0Q3dEtXRG9CZEFMZ3hGMzN6UWNjQ2NkSHg4ZktJVmRXNjlPN3FIdFhwZUdyOWpiYnBGQStxUk1XcjVocDBzNjdGUGM3SEFpTFYwZzAvcGVabFc3aEpQWUVoWnlocFN3YWhuZjkzL3RaZ2ZxWldYRmRtZFhCenF4R0hMclFLeG9BWTZmUm9CaGdDUlBtbUd1ZVlaNUpleFRWREtVSVh6a0cvZnFwLzBVM2hBZ1FkSjl6dW11dEs2bnFXYmFxdm0xcGd1MDNJWVIrRys4czBqREJCejhjQXBaRlNCZXVXYXN5cW8yT01ES0FaQ296UytHV1N2TC9Ic0U5ckh4b29lMTdVM3MvbFRFK1ZaQWs0ajNkcDZ1SUdhQzBKTWlxUjVDVXNhYlB5TTBkT1lEUjdFYTdpcDRVU1pseWEzOFlmUHR2clgvdEJsaEhpbGo1NW5aMW5mTjI0QU9BaTlCVnR6L01ibjhBRURKQ3FKZ3NWVWE2blFuU3h2MkZzN2wvTmxDenBmWUVqbVByTnlpYi8rdDBlaTJlRU1qdk5oTGtIQ1psY2k0V2hCZTdlUFpUbXpZcWxZOSsxcHh0UzRHQis1bE0xQkhUOXRTMjcwRVdVRFlGcTFJMHlZL2ZOaUFrNGJrOXlCZ21lZi9mMms2QWxZUVpIc05Gblc4d0JReENkNjhpV3Y3LzM1YlhmejNKWm1mR2xpZ1dBS1JqSXMzSXB6eFEyN3ZBZ2xIU2lPekNZeko5TDlBMUNkaXlGdnlSNjZ1Y0E0aktpZnU1ZWh3RVIyNnlWN0hqS3FuNU1mb3pvN0NveHh0OExXV1BUNDdCZU14WDhwMFBqYjdoWm4rNmJ3N3ozTHcrNzY1M2o1c0k4Q0x1NWtUaHBNbGoxbTRjMmNoM2pHY1AxRnNUMTN2dUszcWplY0tUWmsya0hjT1pZNDBVWCtxZGF4c3RacXNxUXFnWHorUUdGOTlaSkxxcjNWWXU0YWVjbDFBYjVHbXFTOGsvR1Y1Yjk1enhRNWQ0RWZYVUo2a1RTL0NYRi9haXFLRE9UMVQ3Sno1ejBQd0RVY3dyOWNsTE4xT0pHQ2lLZnF2YWgraDNYenJCT2lMT1c4d3ZuOGdXNnFFOHZQeGkrRWZ2K1VINTVUN1BRRlZNaDZjWjFwWlFsekpwS1o3UDd1V3Z3UEdKNkRUbFI2d2J5ajNJdjJIeWVmblJvL2R2N2ROeCtxYWEwTjM4aUJzUisrVWlsN1dkNGFmd0ROc3J6REFLNGZYWnd2RVkvamRLdUlLWGxmclFkMkMzOWRXN250blJiSXA5T3RHeTlwUEJuL1YyQVNvaS8yVUpaZlMreHVHTEg4Ym5MdVBsemRUTlM2emR5azhEdC9oNnNmT1c1bXl4aDFmK3pmM3paM01YL21POWNRUHA1cE94OTY3WkE2L3BxSHZjbE5mblVGRitycStWZDdhbEtyNktXUGNJRGhwbjZ2Mks2TmxVdTZMcktvOGIvcFlwVS9HYXpmdnR3aG43dEVPVXVYaHQ1clVKZFNmNnNMallmMFZUWURnd0o4MXlhcUtUVVllai90Ykhja1NSYi9IWmljd0dKcWgxbUFIQi9JdU5zOWRjOXl1dkYzRDVYb2NtM2VsV0ZkcTVvRXk3MGRZRml0Nzl5YUxpTmpQajVVVWNWbVpVVmhRRWhXNVYyWjZDbTRIVkgvUjhxbGFtUll3QmlsZXVoMDdDYkVjZTNUWGEySm1YV0JmK296dDMxOXBzYm9vYmVaaFZud2hNWnpPZVFKemhwVERiUDcxVHY4SHVaeHhVSS8rbWEzWFc2REZERHM0K3FtcEVSd0hHQmQyZWR4d1VLbE9EUmRVV1ovZzBHT2V6cmJ6T1phdUZNYWk0UVU2R1ZIVjZhUE5CaUJuZEhTc1Y0SXpwdlVpaVl5ZzZPeXlyTDREajVxL0x3M041a0F3ZnRFVmw5ck5kN0prNVBEaWoyaFRINndJWG5zeVhrS2VQeGJtSFlnQzhBNmFuNUZvYi9LSDVHdEMwbDRlRnNvK1ZweGVkdEpIZEhwTm0rQnZ5NEM3OXlWT2tyWnNMclEzT0hDZUIwUmEra0JJUmxkVUdsRENFbXEyUndYbmZ5aDZEeithbGs2ZWZ0STJuNnNhc3RSckd3YndzekJlRFJTL0ZhL0t3UkprQ3pUc0xyL0pDczVoT1BFL01QTFlkWjFGMWZ2N0QrVm15c1g2TnBPQzhhVTlGNFFzNkh2RHlVeTlQdkZHREtaL1A1MTAxVFlIRmw4cGpqNndtL3F5Uzc1ZXRaaGhmZzBVRUw0T1ltSGs2bTZkTzE5MkF6b0l5UFNWOVFlZERBNE1sMjNyUmJxeE1QTXhmN0ZKbkRjNUZURWxWUy9QeXFnZVB6bXdWWjI2TldoUkRRK29hVDdseTdlbGw0czNEeXBTMXMwZyt0T3I3WEhycmtaajkreC9tSkJ0dHJMeDk4bEZJYVJaekh6NGFDN3I1Mi9KUTRWakhhaFkyL1lWWFpuL1FDMnp0UWIvc1kzdVJseWM1dlFTOG5MUEdUL24yNzQ5NWk4SFBBMTUyejdGaDVhRnB5bjFHUEpLSHVQTDhJdzk0RHVXM0tqa1VSQVdaWG40RVF5ODl4aUtFSE4xbWsvdGtNNGdZREJ4d05vWXZSZkU2TEZxc3hXSnRQckRHYnNuTE1hcDNLYTNNVW95dFcwY3ZpZW96T21kRVJtaGNxekcrM0htWnYyeVplaUllUVRLR2RSVDRISE54ZWttMXRZKy9uMDZyR21GbGVxTHNjU0VSemN0VEtNNkc5UDBQYzFSbVZ2cmFzY0l4YU8xQ1FDaVlQRTE1YkQ3YzN4U2VXN2dYeFlqZ3hjclVsY2JJdk8wcitZcGxoeDBrVHQzcWFmRE9tRnlNamdHeFh1NzNyZGRNSHBWMXdNdWJ5QUdjZi92NWRMcjVQNzJUYTlsQkYrZnpNSnJNeWN3dis5dm5VM0FOSWwxY0g5dGZXN2FmOHUwL0hHMHZWNDdqTkZYekZUdGFoYTF4dnplL3M4S010Q1l1Y1hjMW56ZmQvTVF5ZFVYbi9iNzJSQnQ1d08vM2pSY01IOUJkaEMveWN0S0JJdmVSWVByTnBEV3FCc084Vk1tUCtXdlJhT2NBNHpSTVIxUHZTb085MnJTN3BZRXYrZlpmRWZUTXpFZE0rNlg1dExseXhFeGhxTFJrbXM1RXVMb3ZMZng2NmRlNWZMMi95WDAySDUyRlBWd2FoclBxbU4vRTBvVlhuc0NLaGJpL3lSeFg4M25SYlVLV2h6WWNlWE9udGZ1WG41MU5zeko2TU83M3BRZjVQbDRpbjNlYzRKVThoRjdwcFYzNCttbTlyMUxZMGVlL2kxTzF3cGQ4K3pmTHp0RTBjcUJ4Z2dpQmk1QnU5NXY5bDNyOXIvVTVod2VMbitUYmZ4b3dyV0RxZEphdUtkOCtxL2RIOHNiUGtjOXR0dXlPOTRmNy9YSy9uSFg0Nk1QRkxFYjVxUWxOUHZoSjUwLzU5dDlmdDNMWHU3dVZhV2FPMmJEckRDblJTelp5V3ZGS3hPMSt2VDhNd3d1blIzYlgwQ2tmUGpxYjRLOU8xOXRuNVg1MFB2bVlwRXdIdGlXOVd0enVWL3M3NkIxenZMTE5rVmlOZDh5U3hJbC8zb3JmcVA5MFR5VEdhZjcvcng4alF6ZUhKWGRtaC9ONllEdmJ2bVRCd0NkeGZFUTFOY0w2d05NZFNJWE5xN2IxRVV6UnkxL0F4c3lrNXAyMkdNRzFiK0d4RmdiSEVyWmg5Mnd1dmNvMEF1T0xYY3Q5aHZ3Mm53L0xxSWNEUlJtSm1tWnpjZ1VhN0pwTS9XVi9TOUlVZmJGNTZUTDJvcnpxd2ViZFJEOG5JWU5KNDFEL2h6MzdGbzExcDJZMjF3elBjbjcxM3FWR2hxdGV2U3RZZkdING42OU9FSnRQdmJiTFlXdnNjRHFjM0hnbnUxNjYrdEF5TG54clgwWTV6b1lqVisrMXNJN3Q1a01yMDJLVC8rdXd0a2MrclpMT2YvcW4vczNuWUNmMTNEZzgvc0IyZGlKZ2pHcWpRK1RMaHhienl1ZTJPYjdYNi85bFV3VzdhK2xiem5Iek9ZeThMS1cxQy91UlBiUVkzS1cvMGdPOUxYdW5ITHZQTDk3YWZiYTliRnRjOWhtejdHQXR0alZZbEN2UUFpT3dBay9nQzUraGtMRXM2dHIzQVpLeExKdE9Fd2syZEx4VFlXc0lCL2ovVG9XdElXem85MDZGclNHOGlhcXFxcXFxaUlpSWlBZ3pNek16TnorQXlLKzAxL3ppOG44UytZMU1qb1JhUTgwV1UvRzhNQmxPKzUzVlBYQU5yV200d3pHVVZaVWpqQkpaVmRocGNma2pzbWNXYU8rVUVsZFhpMWUrenErSE9zQ3BrbllzaHVoOHBPTElTSnVuN1ROMEVJR1cyeFRubE9JbWVlY25vR1c0cmF4ZTJHMVQzSEV2ZllVWU1oRytnQUZPQXdoNW5LOG1aaHdKTW1ON3IyMjRRVnNORnZaODdaMHFhdHZrbmtseVBESzNIeTQ1UGdWS1hqaTUyV2VuNGQ0UGxGVlZZR25OYXArZlNwRmJLOTByWW5oVWM2bjkxUTNBWTlFMHRKT0ZyY2ZadG0vNDkxWGJjRy9qc1ZpVVBQWDc2cW1ldWl6K3FZMUhrNy8xVlBNNDA1eldWdW9oZUxVaW1wV1lkVnpDbVVkS0hlYk1kemdyWXJiOG1MMmVlTFNuUldIZG9uZlphOFJzT1U5RjM3dys1OTFsNUZMWUhpT3FXZUh0RS9sV3JCSGNSS3AzdWh0cjh5WG04TFUvNW1zK05NNlpLc3F1OTBjRlo0bzU4K2s0cmRydEI5N05BREZid21FRzdsWHF2aXJoT1RPcVUxNHh1VUYybXlJalVSY1BIclBPUTRsbU0zUGVNZzdiVXVrMG5uWmk2N2JYc1U2SDhsaHFJbzhUYU9yRWFmQ08xQVJLOVBqQzBRT29xMkJ4bU1kZ1lCOUcvbEliOSsrZnFOSjJzN0JIR0Z5Qk5tWkFSOEozS0NvMDEyaWthU1A4QkNyZjZWSTBYNXhkbmJoSElPK0I1cmJPeUI1NHpYa3pmT2J5SjRlY3d4ZnFCSk1MRmM3bTU5ck5jdzdob0huRlowYjAwemVlK2dUcXZqbTYxUGI0eG4wa2NEWDRqdkhNMHJCWFp5cEczRENLbkQvV2FhL1p0SG10RlBnTzVlRVR4K2s3UnJWZzNhU3dtMllvTlhuQ3MzWFBRRGhObitGaWE2SWxPT3VJRzZWSkg3VFA2YXZhMjZlaEtIUWEyVDROMHRjWjlkUENHbzNaZG5ObHRzSFFiZVl0NXZQbkplelYvY0FlTnlwZG1sMXZDSEk4TTgxblNSUDVRaTIrbUk4di9zeGlacnU5MTg3blJ0cDNmLzQyTmVtY09OYSs0ZVZDM1BDWnpjODhhWmg4NTFDcVNzc2hlNzB1UHhlTi9kbVl3bHdiM3Ryd01yTjFHcThqYm5BcGNWRHgveURQZVlzNS83cjYydHNRNmxMZytEaUZYVEVoelI5ZEhxdjBpVDR0Z2o4MjVXK0gzWGlSVU5VWlQya1I5UmkwK2xwK1VNM2lRdFM4dU9FMjNMeTRLWXR2cUgxM2pnaFVudEpSQWV3dXpOTERYcDhSeGRjYUEzY01ZNlRPMkllU0ZSWGV6ZVdJakNxeWhzVWRNWXVDZ1lUWlNLcEJ5cGUxelJmcThGc2h2ZkJQYzZCQVFXbDcvUXhJRHAzVkdvMUozdm40Mk9FczNxem53cytZTFJYYnlteUIxOWE5WEJ4Nm4vb3djeXhsRVl5RldDaStrRzlGK0V5RC80eW44MCthZ2FaOVA3YXkyRG55OTlhSzJvOTFGa2ZFT1k4aEJ3eWZpNXV3eDJ5NVNhSG1HK29xL3psMUZYLzhpck9mOFkzdkFjWC82dUxQNkE2bnZNTzI0ZWRTR1BqUWM4MjdSdzJhdFgrejJiS3EwQ21XOW1PdFlucjUvQWZEYTFaZlBhWG5LdGxXYm9ydXA3UVl4K09yMnVXYitOM04vLzIreURjWE1xSUpkZjU1eGw3L3ZzajRXb1BQbHhMeHRWcmtKNHcvdFRlM21MZEFUT09Zd3hjcTUydzVXeHo1TWJQZFZzNU84L2xoZkU3ZFBqMGJJaVBRM1FWMGlxbTRtM1lYOGhSZmM2alEzZldlcGV2TXFVREpkODZaNHZ3TTQwQ1dIbm4rV3Boc0dIZmllRjAyRDN0bVp2cFdEK2tCcE5DRmNMblpoY21tcmhwR3p6YmRBK3NRMWFyMThPSkQ4N0lPS09Gb1JOem5hSFBOSFVmVU5odlkxaVUrdWh2RXZwS0hhVW4zcUszZXhWVnlYNGpvaXBwM3VtN0ZtWUpXbUErV2JJRHNoUnBiVlJ4NS9ucXN0Q2d5ODdGR2JmVkI4eURHQ3FTKzJxQ3NuUnduU0FONnpnenhmZEIybkJUL3ZaNC82dXhiNm9IOGI0VkJSeGlJQjkzd0xhNDdoRzN3MlNMLzJaMjd5T1hKRndacFNKYUJZeXZhakE3dlJSWU5LcWxqWEtwdC9DRkQvdFNNcjE4REtLYndCMHhnZ0JlUGF0bDFua2kweXZxVzV6Y2hseVptSjBPVHhKM0QrZnNZSnMvbXhZTjUrTGU1b2FndGNsK1lzVnZ5OGtTakkyWUd2R2p2bXBrUlM5VzJkdFhxV25WdXhVaFVSbTFsS3RvdS9oZEVxMTlWQnA5T2pHdkhFUVNtcnB1ZjJSMjRtWEdoZWlsOEtlaUFOWThmVzFWRVJVZkJJbWI2NGoxMmNhQlptUlZpWkhiZVZNakNyUERnOUE5MElYcnRuc1lDdVp0UlEwUHlyS0RqQk5Pc1BmS3NnMXBBMDJnSGxWcjBPWGlGaHRwNm5KcVhWemNiZk0wS256QzNnZ09FTlBFOVZCZG1IS042TFlhaWpiNHdYeEpuNUEwRlNERjVqK2gxb29aeDg4NUp0M1pLek81bjdaNVdmTkVPdHl5UHFRRW5uN1dMdjVGaXMzUGRnTXNoakYxRlJ5ZGJOeWVCYnlLSTFvTjFUUlZyVks3a2dzYi96alg0TkRQSVJNY3RWZWF4VkIzOFZoMXg1S2JlSmJVMTM4QU01S3ptWnUzdW55MEVyeWd4aUpGN0dWWFVyUHpGeHJseDF1RmRBYVpGRE45Y3ZJYjc0cUQ5dHpCTW83TDdXSUVZSytzbGExRFZNSHBGMEY3YjMrWTZTK3pqdkxlRE1DcGFwbUpvMXdlQld1eEtGM3JPb2NpaDFndW40Qm9KaDFrV25WL0ptaXE2dU9oSzNWZkt4RUhFa2FmakxnSzNvdWphUHpZNlNYZzhwaGhMNFROUjF4dkpkMVdhMGFZRmZQVU1Mck5CRENoNEF1R1JUYnRLTWM2WjFVZGo4ZXZZL1pwQ3VNQVVlZmRvNjlEWlVuZ29xRTFQOUEzUEpmT2Y3V2l4Q0VqK1k2dDdmWWVIYmJ4VUFvRlYzTTg5Y0NLZm1hM2ZjMStqS1JlN01GV0ViUXFFZnl6TzJ4L3dyTzJWWUg3aVlkUTlCa1B5STgvM2tYQnBMYUNwVTdlQzBZdi9hbS90RUR1N0hacHFnMEV2SG8wbmYvUi9nUnpVV3kzMy9IWE1KUWV1MUd5bEttT2tYemxDZkdGcnVBY1BQaGFHcVpPdHUxOXpzSjFTTzJKejRadHRoNWNCWDZtUlF3V21Ed3J5RzlGVU1sWnpOY2tNZEsrSW9NSnYxck9XbkJhbVMydzJLSGlhUE1QTEMxNWhDWm00S1Rwb1p5ajRFMlRxQy9QNnI3L0VobkRNaEtpY1paMVp3eHVDN0RQekRHczUzcThnWGFJOWtGVEsrMkxUcTdiaHdzVGJyTVY4UnNmdWE1bE1TMEZ3YlRpdFVWblZhMXlUYjVJWDUxbW1ZblVjUDl3UHI4SmkxdGlZSmVKVjlHWlRyUWhGN3Z2ZFUyT1RVNDJvZ0o5RkR3aG15Y0kyTElnKyswM0M2c2NZaFV5VXVNVjV0a3c2a0dVb0wrbWpOQzM4K3dNZFdObGpuNnRHUHBSRVM3dmVxclNuNVRSdXYrZGg2SlZML2lESFUxZGI0YzlXSzMrK09ySDNQcXppRjkxNlVNVUtuOEc2N25ONjBHZldpSHJYWWhVRzN5VldteVlhazU5TkhqOHQxc21HNFVEaVd6MnJQSE5yS25ONFpvMUxCYnIyL2VGOVlaMG4wYmx4Mm5HNFgrRUtGeHZTM1cyOEpFU0QrRldrNjFWQ0Qzei9VUkdIaUpsKys3VGRCd2tDajZ0R09IM3FEYjBRcWNPRjlLenBqMEhVYi9LeUZXM1loajJWTUtKcUdabGVGQkg3dnF2ZjdXcUxDM1hNdUhWOHE4YTRzVEZ1eFV0a0QvNkpJQnZLYVZqdjk2bmRncnVLWjFrL0JIenFmMks5ZkxrN0hHWEFOeUxEZDF2eGtLL2kwNTVwbnpsK3p3NnpMbndYbFZZVnRmbWFjSmdFcFJQMWhiR2dyWVBWTjZ2MmxHK2lkUU5HbXdjS1h1Lzh4RWovUDZxZS9zQjJXbXdOcDZwcDhqYUlTTWt3ZGxlRlhZSzU1TkhXTFRUYnV0U1VxakJmREdXby9ZZzkxOHFRKzhCUlpTQUhaYmZ1Tlp6Mk8wc292MVVlNENXbFZnM3JGaE0zS2xqajlrc0dkL05VaGs0bkgrYTVVTjIrMWk4K05NM3ZSTnA3dVE2c3FleFNDdWtFVmxWWnJpSE5xRmk1ckxtOVRNV2E0cW0zaWRKcXBwUUFDb2wybDRWU3V2V0xmdGE0SmNYeTNiUk9QTmJYT2dkT2hHNDdMQzBDd1cvZE1sU3g0SmYxN2FFVTN5QTF4OXArWWMwanVwWGdjTXVZTmt1NjRpWU9rR1RvVkR1SnZsYkVLbEpxc21pSGJ2TnJJVlpFSCt5RmRGOERibGVaNmlOaVd3TXF2dE1wL21TcHd4NUt4UnJUOXAzTUFQVEhHdE1iZnZkRmh5ajl2aGFLY24zQXQ4TGMxNkFpK3ZCY1NwMXp0WGk3ckNKWngvcWw3VFhjY2xxNlE3NlVlS1dEeTlib1MwV0hJalV1V2hQRzhMQm1XNXkycmh1VHBNNXZzTHQrSE9MaDFZZjBEcVhhOXRzZkMra2FLdDJodEEwYWkvTDJpN1JLb05qRXd6dGttUlUwR2ZnVzFUeFV2UEZoZzBWN0RkZldKazVnZnJjY3BZditNQTlNMGRrR1RMRUNlWXdVaXhSempSRmRtakc3emRaSWwzWEtCOVlsaU5LSTMxbGZhN2kySkc1QzhTcytySGUwRDdaNjk2L1YzREVBT1dIblE5eU5haE1VbDVrRU5XUzZwSEtLcDJEMUJhU3JySGRFMXcycU54SXp0cFhnVUlyRjBibTE1WU1MNGI2VjFrK0dwTnlzVGFoS01WcnJTODVsVFZvOU9HSjk2STQ3ZUF5NXJZV3BSZi9tSXplb1lVMURLYVFDVFVWd3JoSGV5Tm9EcUhlbCtsTHhyOVdLemhTWXc3dnJSNitWNXEwcGZpMmszTDF6cWt1Ylk2cnJkOVpMdlN1V05mMHVxbmtZK0ZwVHZGelNXOUZwMGI5bDhKQTdUSFY5ZUNpL1BZL1NDWklVWXgzQlUyYWxqN0NtM1ZWNmVZcGlvczRiNld1Tk9KZFlYVUszelRxajVDVkcyRnFZTTRaN0N1SVUwcU8wNVhSMGQ3MUZITTBZaFptSm1UUmZMbFhFdW1OODJCR3R6ZFgwUzE5dDFlK2JVaWVLOHpSbXFwYTRRYzVUU2ppZm1hUXNZMkVUTGpoSTM2Z01SMSs3cXBqZFhYSGljZVVla2ZCYXVjSFNoQU9pRlhtdjNzTm1HUXlVNWlWZ25vb2N1b25RWEVQVEZ3c2xIdFM4UitBNDdTdEk5d2owaVNydGJpNXJNeXNjekZpSW1zUStiZEZDbG5GampwWFh3TXk2TzdxZmpPcjhGYjBhN09ESXRpc2pubjNFUU8xNit5cGQxY3d5YUFXNVl6eHo1UWtuZk1PNzY0M2ZYVy9JOXkzVTJ4SDI3T2FwcXI1NlovdEV6Z2xqNkliVDZIRUhqb3BpWHFlUmJlNW1RUXZ4dGNiRE9WdmVyTjBaZ01kenFSWVJqYVh0TVJkNTZRNGNaU21kUHZaSmRTcmhKMUQ5ek5YUHFBRXFQSWF2UGRmdWJ0NW9rZTJrbXYwZHp0SXN6U3YyVll1b3lmMVV1b3Bic1liK3VYOWg2V3B3anBndFo2Zk5OYXdOSjRxOE8zQ0ZvU2Jpb0FhT1NaTXgyR1lhUFlCK3JFYjZxalFpTlJGUTc2VHZ3TkZWS0QrQmhIOVZoY0tHc1h6bU1JN0JwdFUvQ05Xb2xNN1l6Uk92cEZBbnRzaVdKcDZlUjJkM0dhcmNZU2hWWVNVcWhtWU9XajVFOTZOSzJXdm1ZTlRlWTdaczRSVUVkdjloOVFUNEVzZUt0Nkx6THJxRU9zM2h4QVkxTWFOV3BTYTZ6Wng4RjNZT1ZlQ1lNUzg4VytDWUhEdVdlNHlvYzZZSytkakR1RU9yQlI1bHZoMHIrUTl1TTg4bHJqeDl4OUF0Z3BRVk5FOHIrM082R3Z3NTlEK2tCRi9VTVh5aGxpWVV0UGptdlhHWTZEazN4K2tFT1crR3RkTVZDNEVaVHFvUy9qbVIwUDBMUzc1RE9jL3cydm5yaTk3TTRTZGJaOHFlVTdnZzhEVmJFUmtVNWdlYU1RTzNtWXJTWXlBbmdlVVFxck4wQzAvdnNGbWNnV05YTmVpZHNUQWo3LzRNbmNKUjBjYWFCVXBiTEsxeUJDQk5SakV2Nkt2dVZTZHBQbkVNSmRzUlJ0cUorVTh0TjFnWEE0ZVBIYzZaVDBldmlJNzNVT0pGMGZFWjhZYW5lQVFxUWRHcGhOdndNNG5JcVBuWHhWMHhBMGZuQ1Qrb0FoSnV5dy9xOGpPMHk4Q2pTdGVaRXh3QnBJTjZTdk5wNkE1Ry9hYmk2ZWdlTkQvMUdUZ3VodU5qYVViYm5TYkdkNEw4OTM3RXptMzRFeWk2bjFtYWVPQnhoM1BJMGp6SkRmNW1oL0JzTEQ3RjJHT0t2bEEvNWd0dnhJMy9lVjRzTGZLVzVXeStvaW8rZXMvdTZUOFVVK25zb2Z5NTdJY2IvSmxaSFBGdENnZC94K2J3dDNaVCt4WFR0VHRUckdBYjRRZWhDNlg5Rys4WVQrb3pjTHhEc2RDanN1T3F3UEZucmRMWWFGYzkyVWkwbTRmcjM5bFltbENhcVRpdDdHNk8vM2tXRGtndFhqTkg0QmlFbS8ramVnUW5paE90ZmZmbjMzV3hzRmpoZk1kNDhIVCtmNm82WDY1ajdYUjhXTFNITUZreGJ2T1lzclJzRjFib3dEdVNRMThNa3hrNHF6MnpvR1BMNWZ1OWgySHFtdDFhc2wzUTNZdTNzek9jK3NwaUNtWDRBRVRCTTNwTG9UWVNwM3NWeGFoeWhMOGVDNG1QTjlrMngzbzB4a2lpeEl6TTNDWkZ6ZjVvUjRtZWNRNStheDJ3Q2FoMy9jcm1uSG9xUjArS01hT1B4UmlmMW9FRlJGT08va1RQUG10d3crTmZNWHhFSzZnbjZpVTMyVTZmRnJ1SXo4UTRXZ2xqdG5hQ1ZUQmdXeDdkaVVkc2hDOVpFYTV5S3BSQkJlVzEyci9pTmMvK0VnTnFtaHN3TkI4U0JvaWhIWGVERjdycldETGNtdDNWOEdZWU43cFhSeTREWmpqNERKdVVCTDVpQzNEUUFhb280dmtmdHFWVFlSR0xTM21IWjdnZG1kVFRxYmdOTi9QVGRUQ09UZ1hvbGM4OE1oWEFFVU1kWDBpeTFKTXVrNXdMc2dldTBRVVlsejJTNHNrVFd3Sno2cE9tLzhpaHJtZ0dmRmdyaStaV1VLMmdBUEhnYldhOGphb2NkU3VNNEZKWW9LaWNZWC9aU0VOa2c5UTFaekpmd1NjZlZuUjJEZWdPR3dDdm1vZ2FXSkNMUWVwdjlXTmxVNlFnc21Pd0lDcXVVMjhNbGszZDlXNUU4MWxVLzVFejBMY1g2bHdLTVdETmx1TktmQkRVeS9waEpnQmNNbmZraDlpUnhyZE96Z3MwOEpkUEI4NUx3bytHVVNiNHQzbkMrMGJ5cU1adE8yZlFKNFUyekdJcjQ5dC8yOHFtbUd2MlJhbkREN2EzRkVjZHR1dGtXOHR3d3dsVVNwYjhRYWxvZGRkYkJmTkhLRFE4MjhCZEU3T0JnRmRpS1lvaExhd0ZZcXB5YlFveEFUWnJoZUxoZEk3KzBabHU5UTFteVJjZDE1cjlVSW04SzJMR0p4cVRlZ250cU5WTUtuZjFhOHpRaXlVUjFyeG9xamlGeGVIeHFGY1lVVEhmRHU3cmhiV25nNnFPeE9zSSs1QTFwOW1SeUVQZFZrVGxFMjR2WTU0VzdiV2M2ak1nWnZOWGRmQzkvOXE3NDA4S0RzYmRMN1V0ejdRRlNEZXR6MnBpY0FyenJkcEw4T2FDSEM5VjI2UnJvZW10RFo1eU5NL0tHa1dNeVRtZm5JbkV2d3RTRDIzVWNGY2poYUUzVkt6a29hRU1LR0JmdDRYYklPNmZvclRZMWxtR1F3Vm1LaWNCQ2lBckR6RSsxb0l4RTA4ZldldmlJT0Q1VHpucUgrT29IYWR2b09QMjBkck1QZTVJcmczWEJRemlXMlhEdUhZempxUVE0d3lTc3NqWFVzNUgrdDNGV1lNSHBwVW5CSE14L25ZSVQ1ZDdPbWpEYmdEOUY2bmEzbTRsN0tka2VTTzNrVEVQWGFmaVdpbm9nYWc3YjUydGFpWmhMMVRTdkJGbUVaYWZGcTJIOGtoUWFaWHVpdENld1Q1RkJnVnRQSzBqNHhVSFBmVXozUTI4ZWFjMVoxMzlEQVAyM2Rna2k5NEVDOHZiRFBUUUM5N0hQUFNXalVORzV0V0tNc2F4QUVNS0MwNjY1WHZvMU50ZDA3d0NMTmY4UTU2bXJFUFZwQ3hsSU1WbFFsV1J4TTNvQWZwZ0ljKzhLQzNyRVhVb2c1ZzA2dnQ3emdYWThnckg3aGh3VlNhZXV2QzA2WVlSQXdwYnlrL1Vuemo5aExFWk5zMm94UFFCOXljK0duTDZ6VGdxN3JJKytLREp3WDJTUDhTZDZZelR1dzVsVi9rVTZlUXhSRDEyb21mUUFXNmNhVFI0TGlrWWtCQjFDTU9ydmdSci9WWTc1K05TQjQwQ25pNmJBREF0YUsrdnl4VldwZjlOZUtKeE4yS1lROFEyeFBCM0sxczdmdWh2V2JyMlhwZ1cwNDRWRDZEUnMwcVhvcUtmMU5Gc2FHdktKYzQ3bGVVVjNwcHBQLzVWVEtGaGFHdW9sNEVzZmpmNXp5Q3lVSG1IdGhDaGNZaDRoWUxRRitBRldzdXE0dDB3SnlXZ2R3UVZPWmlWMGVmUkhQb0s1K0Uxdmp6OXdUSm1Wa0lUQzlvRXN0QXN5WlNnRS9kYmljd0tyODlZVXhLWkkrb3dEMjA1VG01bG5ubURSdVAvSm56eFgzZ010bHJjWDBVZXNaZHh5UXFZUXVFVzRSNTF2bVE1eE9adGVVZDhTSnJ1TWxUVXpodFZ3L05xN2VVQmNxTjIvSFZvdGdmbmdpZjYweUtFdG9VeDNXWU9abFZKdUpPaDh1NTlmelNEUEZZdFFncURVQUd5R2hRT0F2S3JvWE1jT1lZMHFqblN0SlIvRzNhUCtKdDFzTFZsR1Y4UE93ci82T0dzcWV0bnlGM1RtVHFaakVOZm5YaDUxb3hlOXFWVXcyTTc4RXpBSitJTThsWjFNQlBROVpXU1ZjNEozbVdTckxLck1IUmVBNXFkR296ME9EUnNhQSt2d3hYQTJjQU00cWxmekJKQTY1ODFtNGh6eEl0UXc1ZHhyckJMM1k2a0NiVWNGeG8xUzhqeVY0NHEvLys3QVNOTnVkWjZ4ZWFOT1NJVWZmcU1uNEE5bElqRmN0WW4yZ3BFUEFiM2Y3cDNpSUJOOEgxNEZVR1E5Y3QyaFBzTCtjRXNUZ1VyUjQ3dUpWTjRuNHd0L3dnZnd3SHVPbkxkNHlvYmtvZnk4SnZ4U1FUQTdyTXBESWM2MDhTbFpGSmZaWWNtYlQwdEFIcFBFOE1ydFE0MnNpVFVOV3hxdldaT212dTlmMEpQb1FtZys2bDdzWld3eWZpNlBYa3hKbndCcmFVRzBNWUc0ellIUXozaWd5L1hzRmt4NXROUXh3NDNxdkk5ZFUzZjBEZGhPVWxIS2ptaTFWQXIyS2l5MEhad0Q4VmVFYmhoME9pRGRNWXNwb2xRc1lkU3dqQ2NqZW93SVhOWlZVUG1MMnd3SWtZaG1YS2hHb3pkQ0o0bFJLYnNmNE5CaC9YblFvUzkyTkpFV09WT0ZzMlloTjhjNVFaRmVLMHBSZEFHNDBocXZMYm1vU0E4eFFtek9PRWM3d0xjbWU5Sk9zalBDRWdwQ3dVczlFMkRvaE1IUmhVZXlHSU42VEZ2cmJueThuRHVpbHNEcHpySDVtUzc2QVBvSUVKbUl0UzY3c1FKK25md2Rkem1qUHhjQkVCQkN3MGtXRHdkMEVaQ2tOZU9EN05OUWh0Qm03S0hMOW1SeGo2VTF5V1UycHV6bElEdHBZeGRINFpQZVhCSmtUR0FKZlVyL29UQ3ovaXlwWTZ1WGFSMlYxZG9QeEpZbHJ3MmdoSDBENWdicmhGY0l4ell3aTRhLzRocVZkZjJEZHhCcDZ2R1lEamF2eE1BQW95KzErM2FpTzZTM1cvUUFLTlZYYWdEdHZzTnR4N0tzK0hLZ282VTIxQitRU1pnSW9nVjVCdCtCblhpc2RWZnk5VnlYVisyUDVmTXV2ZHBBak0xby9LOVorWG5FNEVPQ3J1ZStrY2RZSHFBUTAvWS9PbU5sUTZPSTMzakgvdUQxUmFsUGFIcEpBbTJhdjAveHRwcWRYVktORHJjOUYyaXpvMjNXdTdmaXJnYlVSRkROWDllR0dlWUJoaXlweVhaZnQyajNoVHZ6RTZQTVdLc29kLy9yRUlMRGt6QlhmaTd4aDBlRmtmYjMvMXp6UEsvUEk1TmszRmJaeVRsNG1xNUJmQm9Wb3FpUEhPNFE0UUtaQWxyUTNNZE5maTNveElqdnNNM2tBRnYzZmR1ZnVycVlSM1BTd1gvbXBHeS9HRkkvQjJNTlBpTmRPcHBXVmJzL2dqRjNZSCtRQTlqTWhsQWJodmFzQUhzdEIwSUpldzA5aUFrbVhIbDEvVEVqK2p2SE9wT0dyUFJRWGJQQURNK0lnMi9PRWNVY3BnUFRJdE10VzREZHFnZllWSS8rNGhBRldZalVHcE9QL1V3TnVCNytCYktPY0FMYmpvYmRnemVCUWZqZ05TcDJHT3B4ekdMajcwVnZxNWN3MkFvWUVOd0tMVXRKVVg4c0dSb3g0ZFZhL1RONHhLd2FLY2w5WGF3UVIvdU51czcwMEhmMTdweU5uZXpyVWdhWTllNE1BRGhFREJwc0pUNnkxZ0RKczFxNndsd0dodVV6R1I3QzhrZ3BqUHlIV3dzdnJmM3luMXpKRUlSYTVlU3hvTEFaT0NSOXhidXp0eEZSSlc5Wm1NWWZDRkowZXZtOUYyZlZudWplOTJSYzRQbDZBOGJsdU44TVp5eUpHWjArc05TYi8vRHZBRnhDMkJxbEVzRndjY1dlQWw2Q3lCY1FWMWJ4NG1RTUJQMUp4cWsxRVVBRE5MZWllUzJkVUZiUS9jL2t2d0l0Ylo3dHgwc3QxNnZpcWQ1M1dzUm1QVEt2MkFEOENVbmh0UFdnNWFVZWdOcHNZZ2FzYXcyK0VWb29lTkttclczTUZ0ajc2YllISm01SzlncEFYWlhzRTVVOERNOFhtVk9TSjFGMVduTHk2blF1cCtqeDUyYkFiK3JDcTZ5OVdYbDJCMm9aRGhmRGtXN0gzb1lmVC80eHg1Vm5jQnV4TVhQMmxOZmhVVlFqU1N6U1JidVpGRTR2RmF3bHp2ZVh4YVlLVnM4THB2QWI4SVJZRjNaSGlSbm0wQURlTlBXb2N3eFN6TnNlRzdOclNFVlpvSGRLV3FhR0VCejFOOFB0N2tGYnFoM0xZbUFibTlpMUlDaElwTHBNNUFTNm1yNk9BUEhNd3d6blZ5NjFZcEJZWDh4WkROL2ErbHQ3bit4NWo0Yk5PVnRlWjhsajNocEFIU3gxVlI4dlpIZWM0QUhPOVhGQ2RqWjllUmtTVjY1bGpNbVpWemFlajJxRm4vcXQxbHZXek5aRWZIeEszcU9KckhMNmNycjBDUnpNb3g1ZjJlOEFMQkI0VUdGWktBM3RONkY2SVhkMzJHVEpYR1E3RFRpOWovZE5jTEY5akNiRGNXR0t4b0tUWWJsSXdiTERSZUwwMExSY0RQTWNRdVhMTWg1WXpndGZqa0ZLMURQMWlEenpZWVZaejVNL2tXWVJsUnBpZzFodFZSalZDa25tK2gxTTVMaUVEWE95SFJFaHZ6Q0dwRlpqSFMwUnNLMjdvMmF2Z2RpbHJKa2FsV3FQVzNEOWdtd1YzN0hLbWZNM0Y4WVpqMmFyK3ZIRnZmM0I4Q1JvSDRrREhJSzltckFnK293aUV3TmpqZDlWK0ZzUUtZUjhjekpyVWtmN1FvaTJZYVc2RVZEWnA1ellscWlZdHVYT1RIazRmQWNaN3FCYmRMRGlKcTBXTlYxbDIrSG50azFtTVd2eHJZbWM4a0l4OEczclczNko2UmE0bExyVE9DZ2lPaWhtb3crWW56VVQxOWpiVjJCM1JXcVNIeXhraG1nc0JxTVlXdk9jVW9tMWpEUTQzNitmY2J1M3hmMmJiZXFVL2NhK0M0RE9LRStlM3F2bWVNcVczQXhlamZ6QlJGVmN3VllQcTRMMEFQU1dXb0p1KzVVWVg0cWc1VTZZVGlvcVFHUEc5WHJudVovQmt4dVlwZTZMaTg3KzE4RXNreVFXL3VBK3VrMnJwSHByNmh1dDJUbFZiS2dXa0ZweCtBWmZmd2VpdzIrVml0dGtFeWYvaWZpblMvMEl0UkwySnEzdFFPY3hQYVdPMnhyRzY4R2RGb1VwWmdGWGFQMndZVnRSYzZ4WUNmSTFDYUJxeVdwZzRieDhPSEJRd3NWNFhXTWliWlowTFlqV0V5Mkl4UTFtWnJmMS9VTmJZQ0pwbFd1M25aNFdwb2RJR1ZBMDVkK1JXU1MrRVQ5dEgzUmZHR21OSTFjSVk3ZXZaWnE3bythMGJqanlncG1SM21WZmFsa1QvU1pHVDI3UThRR2Fsd0dsRE9TOVZIQ3lGQUlMMGExUTdKaVczc2F6OWdxWThscUt5bkZyUEN6eGtVNFNJZkxjOVZmQ0k1ZWRnUmhEWHMwZWRPOTkybmhUS0hyaVJFUDFOSkM2U1JPTWdRMHhPNWtOTlpPaE1PSVQ5OUFVRWxieHFlWkY4QTN4cmZESnNXdERuVWVuQUhkWVdTd0FiWWpGcVFaK0Q1Z2kzaE5LOENTeFU5aTZmNkNsTDlJR2xqMU9QTVFBc3I4NFlHNmlqc0pwQ2FHV2o3NWMzeU9aS0JCOW1OcFFOUFVLa0swRDZ3Z0xIOE1Hb3lSeFRYNlkwNVE0QW5ZTlhNWndYTTRlaWovOVdwc00vOUNvUm5GUVhHUjZNRWFZK0ZYdlhFTzNSTzBKYVN0azZPWHVIVkFUSEpFKzFXK1RVM2JTWjJrc010cWpPMHpmU0pDZEJ2N3kyZDhETXg2VGZWbWUzcTBacFRLTU11NFlML3Q3Y2lUTnRkRGt3UG9naDNDbmp4N3FrMDhTSHdmK2Rrc1o3TTJ2Q09sZnNGMGhRNko0ZWhQQ2FIVE5yTS96QlNPcUQ4M2RCRUJDVy9GL0xFbWVoMG5PSGQ3b1ZsMy9Rby85R1VEa2tiajd5eis5Y3Z2dStkREF0eDhOekNEVFA0aUtkWnZrOU1XaWl6dnRJTExlcHlzZmxTdlRMRkJaMzdSTHdpcmlxeVJ4WXYvenJnRmQvOVhWSGgvT216QnZEWDRtaXRNUi9sVWF2czJWeDZjUjk0bHpBa3BsbTNJUk55NFRGZnU0N3R1WXM5RVFQSVBWdGE0UDY0dFYrc1o3bjN1ZWQzY2dFeDJZSytRTDUreG1zNm9zazhxUWJUeXVLVkdkYVg5RlFxazZxZkRuVDV5a3hrMFZLN0taNjJiNkRORFVmUWxxR0h4U01LdjFQMFhONUJxTWVLRzFQNFdwNVFmWkRVQ0VsZHBwb1gwVTZzczJqSWtvMlhwVVJLQ0loZmFPcUxQZlNoZHRTMzdaclQrakZSU0gyeFlWVjFybVQvTUJ0UlFoeGlPNE1RM2lBR2xhWmkrOVBXQkVJWE9WbnU5ak4xZjkyMWxXTFpreTlicWJNM0oyTUFBSTlqbXVBeDNneW9FVWE2UDJpdnMwRWVOdi9PUitBWDZxNVNXNmw1SGFvRnVTNmpyNnlnOWxpbXUrUDBLWUt6Zk1YV2NRU2ZUWHpwT3pLRUtwd0kzWUdYWnBTU3kyTFRsTWdmbUZBM0NGNlI1Yzl4V0V0UnVDZzJaUFVRMk5iNmRSRlROZDRUZkdIcm5FV1NLSFB1UnlpSlNEQVorS1gwVnhtU0hqR1BiUVRMVnBxaXhpYTJ1eWhRMzk0Z0JNdDdDM1pBbXhuL0RKUytsMWZCc0FvMkVpci9DMGpHOWNzZDQrL3RwMTJwUGMvQlZKR2FLOW1mdnI3TS9DZXp0cm1DTzVxWTA2RWRpNHhBR3RpRWhuV0Fiekx5MlZFeWF6RTFKNW5QbWdVNFJwVzRTYTBUbk9UNnc1bGd0My90TXBST2lnSEhtZXhCR0FNWTBtZGNEYkR4V0l6NDFOZ2RENm94Z0hzSlJncjVSblQ2d1pBa1RPY1N0VTROTU9RTmVtU083Z3hHYWhkRXNDK05SVkd4TVVoUW1tTTBsbFdSYmJtRkdIekVxTE00SXcwSDc1NzdLeW8rWmYrMmNVRklPdzkzZ0VZMTcxdlFhTTBITHdwanBkUlI2Sno3VjBja0U3WHpZSjBUbVk5em5MZHprdmEwdk5yQUdHVDVTVVo1dWFIRGtjR3ZJMHlTcHdrYXNFZ1pQTXNlWWN1ODV3OEhQZFNOaSs0VDZBODNpQXdEYnhnZUZjQjFaTTJpR1h6RmNFT1VsWVZyRWNrYU95b2RmdmFZU1E3R3VCNElTRTBuWUpjMTVYLzFjaURUUGJQQ2dZSks1NVZrRW9yNEx2ekw5UzJXRHk0eGorNkZPcVZ5VEFDMlpOb3doZWVlU0k1aEEvMDJsOFVZa3Y0bms5aWFWbitrQ1ZFVXN0Z2s1SHlxK2dKbTZSOXZHM3JodU05MDRoZS9oRm1OUWFVSUFUQjF5M3Z3K09teFA0WDVZaTZBNUk1akp1ZkhDakY5K0FHTnduRWxsWmpVY282WGhzTzVUNStSM3l4ejV5TFZPbkFuMHp1Uys2emRqMG5USmJFWkNiWEpkdHBmWVpmQ2VDT3FKSG9FMnZQUEZTNmVSTGpJSmxHNjlYOTNuZlIwbXhTRlh6cDFaYzBsdC9WYWZEYUltaFVNdGJucVdWYjlNNG5HTlFMTjY4QkhQN0FSOElsOWRrY3h6bUJ2OFBDWmx3OWd1WTBsdXJiQnNtTllsd0pac0EvQjE1L0hma2JqYndQZGRhVmVjbHMvZWxtREhOVzJyNGNyQXg0M2ZlTmtmUndzYU5xL3l5SjBkL3A1aFo2QVphano3REJmVW9rMFpVNjJnQ3p6N3g4ZVZmSlRLQThJV240NXZJTkxTTTFxK0hGOUNWOXFGM3pQNk1sMjFrUFBMM0NYemt1WVVsblNxVCtJajR0SS9vZDVLd0lzK3REYWpEczY0b3dON3RPQWQ2ZXVjR3orS2ZPMjZpTmNCRnBiV0E1NzMyYkJOV080a0hOcHI5RDk1NUw2MWJ2SENGL213U3J6NmVRYURqZkRFQU5xR01rRmMrTkd4cEtaekNEMnNqL0pySGQremxQUThJejdRKzJKVklpVkN1Q0tvSy9obEFFSHp2ay9QaXEzbVJMMXJUL2ZFaDlob1Q1R0ptZVlzd2cxb3RpS3lkaXpKL2ZTMlNlS0hWdTZaM0pFSGppVzhOYVRRZ1A1eGRCbGk4bkM1N1hpTjlocnF1QnU5OWhuOXpxd285MitQTTJKWHRwZVZaUzBQZHFSNW1EeURyZU1NdEV3cytDcHdhUnl5em9ZdGZjdnQ5UEpJVzBmSlZOTmkvRkZ5UnNlYTdwZUx2SnJMKzViNEdPWEo4dEFyK0FUazlmOEttaUlzUmhxUnkwdkZ6d1JWM1o1ZFozUXFJVThKUS91UXBrSmJqTVVNRmoyRjlzQ0ZlYUJqSTQrZkwvb04zK0xRZ2pJNHp1QWZRKzNJUElQRlFCY2NmMGNsSnBzZnBuQnhEODRhdHd0dXBrR3FLdnJIN2NHTmwvUWNXY1NpNndjVkRNTDZsak9nWWJvKzJCT0FXTk5qbFVCUGl5aXRVQXdibmhGdkxibnF3NDJrUjNZcDJrdjJkTWVEZGNHT1g1a1Q0UzZNNDRLSEVCL1NwQ2ZsN3hnc1V2cytKTlk5RzNPMlgvNkZFdDlGeUFuNTdscmJpdSt0bDgzc0N5bVN2cTllWmJlOW1jaEw3TVRmL1RhNzhlODB6U2YwaFlZNWVVVTcrZmYxNGp2N1h5OHFqemZ6enp2YUpucklkdkZiNUJMV0tjV0d5NS93Nyt2VjJjdklmd0hxZFRCK1J1Sks1b2o5bWJ0MEh5OTRBbWpNamp3WU5abE5TNnVpeXhObndOeXQzZ2RyZUxiNjRwLzMrMDhuWGtiOTJMVGtrUmdGT3drMW9HRVZsbGNPajVsdjFoZkFaeXdEb3dzMDk0NFU4dlVGdytBL251VnEvVUN5Z3NybVdJQm5IeVUwMWQwWEpQd3JpRU92eC9JU0s2UGs0eTJ3MGdtb2paczdsVThUdGFrQkFkbmU0di9hTnhtTXBLNFZjR01wN3NpMHlxc2lvbFhSdU9pMVoxUDdTcUQzWm1wMENXY3lLNFVibXAyU1hpWHVJNW5HTENpZUZIS0hOUklsY1kzUHlzMmR3TVRZQ2FxbHlXU0lUd3Iyb0dYdnlVM2gxUGY4ZVEzdzFibkQ3aWxvY1ZqWURrY1hSM09vMUJYZ01MVFVqTncyeE1Wd2p0cDk5TmhTVmM1YUlXckRRVDVESFBLdEN0aGVCUDR6SGN3NGR6MmVSZFRNYW1obEhodGZncUpKSEk3TkdEVXcxWEw4dnNTZVNIeUtxRHRxb0FtclFxc1l3dndpN0hXM29qV3loSWE1b3o1eEpUYXExNE5BekZMalZMUjEyclJOVVE2eG9oRG5yV0ZiNWJHOXlmOGFDRDhkNXBob2Fja2NOSnArRHczRHVlM1JNKzVSaWQ3RXVJZ3Nud2dwWDByVVdoL25xUHRCeU1oTVpaNjlOcGd2UlRLWjYyVmlaK1E3RHA1cjRLMGQ3RWZKdWl5MDZLdUlZYXVSaDVFY3JoZHQyUXBUUzFrMUFzY0VIdmFwTmJVM0hMMUYyVEZ5UjMzV3hiNU12SDVpWnNybjNTRGNzeGxubnNoTzhQTHdtZEdOK3BhV25RdU9SdFpHWDM3dWhGVDY0U2V1UHN4OFVPb2tZNk9OODVXZFExZGtpNXpFcnNKR2F6Y0JPZGRXSkVLcU5QaUpwc01EMUdyVkxyVlkrQU9kUFdRbmVUeXlQMWhSWC9sTU00Wm9nR0dPaFl1QWRyN0YvRE9pQW9jKytjbjV2bGYwemtNVUo0MFoxcmxndjlCZWxQcVZPcHhLZU9wektkRjhtYUsrMVZ2MjNNTzlrLzgrcXBMb3hySUdIMkVEUWxuR21IOENEMzFHOFFxbHlRSWNwbVI1YndtU1Z3OS9OczZJSGd1bENSZWh2Wi8rVnJNNjBDdS9yM0FvbnRGZnJsamV3NzRza1llMnV5bjdKS1F0RlFCUVJKOXJ5R2ljL3pRT3NiUzRzY1VCY3RBOGNQVG9RM3g2WkJRdTZEUHU1bTFibkN0UDhUbGxMWUEwVVRRTlZxemE1bmZldzNNb3B5MUdQVXdHNWpzbDBPVlhuaVBtQWNtTHFPNUhHOEh2M25TTGVjRTlvT2pQRFhjc1R4b0NCeFl5ekJkajR3bW55RVY0a3ZGRHVuaXBTOFNTa3ZkYU1uVEJOOWJySFVSOHhkbW1FQXAvUGRxazl1ZXh0cDF0K0pydFh3cE4vTUcydy9xaFJNcFNOeFExdWhnL2tLTzMwZVEvRnlIVURrV0hUOFY2Z0dSVTREaERNeFp1N3hYaWo5VWk2amxwV21RQ3FKZzNGa09UcTNXS25lQ1JZWnhCWE1OQVZMUWdIWFNDR1NxTmRqZWJZOTRveUlwVmpNWWVoQWlGeC90cXpCWEZIWmFMNVBlZUQ3NHJXNU95c0ZvVVhZOHNlYlVabGVGVFVhLyt6QktWVEZEb3BUUmVYTnVacTQ3UWprV254amlyQ29tbU80TC9HckZ0VlYyMUVwTXl3OHd5VGhMNVk1OWQ4OHh0bHgxZzF0dFNJQ0R3bm9mNmx0LzZ6bGlQemdWVUw4aldCakMwbzJENktnK2pOdVRoa0FsYURKc3EvQUcyYUtBLy9BNzZhdncyS05xdHYyMjNQK1dxM1N0UkRETktGRmd0c0Z1a1l0MUdGRFdvb0ZWWGl0YU5oYjNSQ3lKaTRjTWVOalJPaVBFRGI0aytHMytoRDh0c2crNWhobVNjLzh0MkpUU3dZb0N6QUk3NWRvcThRVEhlK0UvVHcwUlFTVURsVSs2dUJlTk4zaDZqSkdYL21IOG9qMGkzY2FDTnNqdlRub2g3M0J0eVpwc2ZsSExxNkFmd0pOQ0RYNFM5OGg0K3BDT2hHS0RoVjNydGtLSE1hM0VHNEo5eTh6RldJNFVzZk56Qy9SbDVtaWRObjdnd29OOWoyM0hHQ1FRK09BWnBUVFBNZGlWb3c3NDBnSXl1RXRkMHFWeE15TlhoSGNudVhSS2R3NXdEVVNMMzU4a3RqTVhtQWt2SUI3M0JMYTF2ZkY5QkFVWkluUFlKaXd4cUZXUVFCVms3Z1FING9qZlVRL0tFam4rQS9XUjZFRWU0Q3RicG9MZTFtekhrYWpnVElvRTBTTERIVmF1S2hycTEyenJBWEJHYlBQV0tDdDRER2VkcTNKeUdSYm1QRlczMmJFN1QyMCs3M0JhdFYvcVFoaEJXZldCRkhmaFlXWGpBTHRzMzhGZW1ub1QrOWJuMWpEQk1jVU1tWWdTYzBlN0dRanYyTVVCd0xVOGlvbkNwZ1YrUXJoZzdpVUlmVVk2SkZ4UjBZK1pUQ1BNK3JWdXEwR05MeUpYWDZuclVUdDhIekZCUlkxRS9GSW0yRWVWQTlOY1hyajdTNllZSUNoVlFDV3IvbTJmWVVqQzRqMFhMa3paOEdDU0xmbWtXM1BCL3hxK25sWHNLVkJPajd2VHZxS0NPTXE3WnRxcjNjUStOOGdCblBhQXBzK29Hd1dPa2J1eG5SWWoveC9XamlEY2xWcnMyMnhNSzRxQXJFMVp0azE0NTZraUpyaXc2YWJrTmVSSG9nYVBSQmdiZ0Y5WjhpL3RieldFTE40Q3ZicXRycVY5VHRHU25tUFMyRjlrcU9JQmFhekhZYUo5YmkzQW9EQnZsWmFzTWx1eHQwQkRYZmhwMDJKbjQxMWFWdDZTNFRVQjhaZ0ZEa0k2VFA2Z3dQWTg1dytvVVFTc2pJZVhWbWlucndJZEsyWkFhd2I4U2U2WE9KYk9hbGlReEhTcm5BZU9OREx1Q25GZWpJYnA0WUR0QmNRQ3dNc1lpUlpmSGVmdUVKcUpjd0tUVEo4c3g1aGpIbUpJMXNQRkhPcjZXOUFoWjJOQW9kMzhtbkxRazFnT3oyTENBb2hvUWJnTWJVSzlSTUVBM0xraUY3U3I5dExacDZsa2NpSUdoRTJWNTQ2dzNNYW01M1Z0VmtHYkI5dzBZazJYaVJuQ21icHhtSHIyazRlU0MwUnVOYmpOc1VmRElmYzhEWnZSdmdVRGUxSWxLZFpUemNUNFpHRWI1M2RwOFZ0c29abHlYekxIT2RBYnNwMUxQVFZhSHZMQTBHWURGTWJBVy9XVUJmVUFkSHdxTEZBViszdUh2WVdyQ2ZoVU9SMmk4OXF2Q0JvT2I0OHVzQUdkY0YyTTRhS243OWsvNDNXekJaK3hSMUwwdVpmaWE3MFhQOXNvUVJlZXVoWmlVblhGREcxVDgvT1hObXNzVFNuWU8rM2tWTEFnZWlZNzE5dUR3TDlGUXljZ0xQZXNzTmloTVpiQUtHN3F3UFp5RzExRzErWkEzakFYMnlkZHBZZm1hS0JsbWZjSy9WMG13SVJVREMwbkpTT1BVbDJLQjhoMTNGNGRsVlppUmhkR1k1ZmFyd04rZjloRWIxY1JpNDFaY0dEbjZYZTlNTVNUT1k4MVVMSnlYSUhTV0ZJUUhzdFZZTGlKRWlVamt0bEhpR2pudE41L2J0QjhGdSt2cDI4emwyZlpYTitkSkR5TjZFWGhTKzB5enFwbC9MU0pORVVWeG11N0JzTmRqQVkwalZzQWhrTnV1WTBFMUc0OGVqMjVtU3QrMDB5UGJRNFNSQ1ZrSXdiNklTdll0bUpSUHo5WnQ1ZGs3NmJsZitsSndBUEg1S0RGK3ZIQW1BQ0xvQ2RHMkFkaWk2ZE9Ibk5KblRtWnRvT0dPOFExankxdmVNdzZnYkxGVG9RbWZKYTduVDdBbDg5bVJiUmtaWlF4SlRLZ0s1S2M5SU56bVRKRnAwdHBBUHpObXlML0YwOGJYM25oQ3VtTS9jUi8yUlBuOWVtWjNWbGpva3R0WkQxelZXWGxVSXFFVTdTTGs1STBsRlJVMEFjRU5YQllhek5hVnpzVkhBL3NEM285aG00MndiSElSYi9CQlFUS3pBaThzMytiTXRwT09aZ0xkUXpDWVBmWDNVVXhLZDFXWVZrR0g3bGgvUkJCZ01aWndYelU5K0dZeGRCcWxHczBMUCtEWjVnMkJXTmg2RkFjUjk0NEIrSy9KVFdJM3Q5WXlWeVJobFA0Q0NvVWsvbW1GNytyMnBpbFZCanhYQkhGYUJmQnRyOWhiVm4yekR1STBrRU9HM2tCeDhDR2RQT2pYMXBoMVBPT1pKVU8xSkVHRzBqelV5MnRLNFgwQ2dWTllobWtxcVF5c1JOdEt1UGRDSnFLM1dXNTdrYVYxN3ZYZ2l5UHJsNEtFRVdnaUdGMWV1STRRa1NGSEZmMFREcm9RaUxOS0ppTGJkaEgwWUJocmlSTkNIUHhTcUptTk5va2V0YWlvb2hxTWdsaDZ3THRFR1dTTTFFWmJRZzcyaDBVSkFJUFZGQ0FKT1RocFFHR2RLZkZvdmN3RWVpQnVaSE4yT2I0dVZNNytnd1pMejFEOUU3dGE0Um1NWjI0T0JCQWc3RWg2ZExYR29mWjRVMlRGT0NRTUtqd2hWY2tqcnlkUlMrWWFxQ3cxa1l0NlVleHV6Yk5FRHlZTFRabnJZMVB6c0haSlQ0VSthd08yeGxxVFNZdTZuL1UyOU8yd1BYZ0dPRUtETVNxK3pUVXR5YzgrNmlMcDBpdmF2NEZLeCt4eFZ5NEZ4aElGL3B1Y1ZEcXBzVmUyakZPZmRaaFR6THoyUWp0enZzVEN2RFBVN2J6REgyZVhWS1VWOVRaK3FGdGFTU3huWWdZZFhLd1ZyZUlndldoVDllR0RCMk92bld5UExmSUlJZk5uZkl4VThuVzdNYmNIMDVuaGxzWXRhVzlFWlJzeFdjS2RFcUlucTFEaVpQS0N6N2lHbUFVOS9jY25uUXVkMnBOZ0lHRllPVEFXamhJcmQ2M2FQRGdmajgvc2RsRDRsK1VUbGN4VEk5amJhTXFxTjBnUXhTSHM2MElBY1czY0g0cDNWMWFTY2lUS0IyOUwxdHoyZVVRaFJpVGdUdm1xYytzR3RCTmg0a3kwbVFKR3NkeWNCUkVQK2ZBYVNzMUVSRURWbzVndmdpNSthQ043TkVDdzMwb3diQ2MxbVNwamlhaHlOVndKZDFqaUdnelN3ZlRwemYyYzVYSnZHL2cxbjBmSDg4S0hObmYrdTdaaVJNbFh1ZVNJc2xvSkJVdFc5ZXp2c3g5Z3Jmc1gvRk54bmJ4VTFMdmcwaEx4aXh5cEhLR0ZBYVB1MHhDRDhvRFRlRlN5ZlJUNnM4MTA5R01VWkw4bTJ4WHA4WDJkcFBDV1dkWDg0aWdhNEJyVGxPZnFveDRzaHFFZ2gvSHQ0cVJzdDUyY0ExeE9JVXVPeGdmVWl2cDZ2NWY4SVZ5YXJ5RWRwVms3MkVSQXdkVDRhb1kxdXNCZ21QKzBtMDZRMjE2SC9udWJ0Tll4SGFPSVlqY2FjaDNBOEV6L3pjMEtjU2hoZWwwSENZakZzQTBGallxeUo1WlVIMWFadzMreldDMGhMcE02R0RmY0FkbjlmcTJvclBtWmJXNlhYcmYrS3JjOVJ0dklJNWplRDNkRm9UMUt3Wkp3eGZVTXZjNUtMZm44clJPVzIzSnc4OXNKMmE1ZHBCM3FXRFVCV0YyaVg4T0N1S3BySG9zSjJtZmxCUitXcXM4NlZ2Z0kvWE1uc3FiOTcrVmxLZFBWeXNjelBqOEpoemYrV0N2R0JIaWpBcVlsYXZiRjYwc29NV2xIYnZLVCtTY3ZocHJnZVRsbjUxeFgwc0YrRWFkYy9sMnMyYTVCZ2tWYkhZeXowRTg1cDBMc3RxSCtnRUdpUjg0bkJSUkZJbjhoTFNackd3cWpaM0UyOWN1R2krNVo1YnA3RU04TVdGYTlzc1Mvdnk0VnJEZkVDU3Y3RFNVODREYVAwc1hJM0FwNGxXem5RNjVuUW9US1JXVTMwZ2Q3Tm44Wm93VXZHSXg0YXF5WEd3bUEvUEI0cU44bXNKVU9EZXpVSEVsMFZQOXVvK2NaOHZQRm9kU0lCNEM3bFFZakVGajh5dTQ5QzJLSVYzcXhNRllUZXZHOEtxQXIwVFBsa2J6SEhuVHBEcHZwenppQWlORmg4eGlUN0MvVGl5SDBFZ3VVdzR2eEFncG5FMjdXSXlwVit1Rk4yelc3eG5pRi9uNzV0cnM5SUo1YW1CMXpYWFoxTEZrSjZHYlMvZEZva3psNGNjMm1hbVZ3aEw0WFUwQXY1Z0RXQWwrYUVXaEFQN3QyVkl3VStFcHZmT1BEY0xBU1g3SDdsWnBYQTJYUWZiU2xENHFVMThOZmZOUG9BS01OU2NjQmZPOVlWVmdtbFc0UnlkQnFmSEFWNytoclo4NFdKR2hvNmJOVDBZTWh4eExkT3gvZHdHajBveWFrOWFBa05KOGxSSnpVdUE4c1IrZlB5aXlUZ1VIaW81K1BwK1lhS2xIcmhSNDFqWTVORVNQUzN4K3pUTWUwUzJIbkxPS0NPUVBwZHhLeXZpQnZkSHJDRFJxTytsOTZIaGhOQkxYV3Y0eUVNdUVVWW84a1huWUpNOG9JZ1ZNNFhKK3hYT2V2NFliV2Vxc3ZncTBsbXc0L1BpWXI5c1lMdCtXNUVBdVlTRm5KRWFuOEN3SndidEFTQmZMQkJwSlppUlBvci9hQ0pCWnNNK01odlM3WmVweUh2VThtNVdTbWFabnh1THRzOG9qbDZLa1M4b1NBSGtxNUdXbENCL05nSjVXM3JPMkNqMU1LN2FoeHNDcmJUVDNhMFYvUVFIK3NFcnhWNFhVV0RIeDBra0Z5MjViUG1CTUJRNkJVM0hvSGhoWWNKQjlKaFA2TlhVV0t4bkUwcmFYSEI2VTlLSHBXZFFDUUk3MnFldnA1Zk16Y20rQXZDODVyc3luVlFocnVEQTlmcDlDT2U3TjU2Y2cxVUtHU2FzODl2ck4rV2xHTFlUd2k1VysweFlkS0VHdEdDZU5Kd1hLRFUwWHFVNXVRWW5Xc013VEVOTEd0YlFNdm9HaklGSUVNekNSYWw0cm5CQWc3RC9DU244TXNDdlMrRkRKSkF6b2lpb0pFaFpKZ0FwOW4yKzFZem5yN0grNmVUNFlrSjlNcGo2MEltY1c0aTRpSERMbjlSeWRCOGR4M1FZbTNyc1g2bjRWUnJaRHNZSzZEQ0d3a3dkNW4zL0lORkVwazE2ZllwUDZKdE1RcHFFTXpjT2ZRR0FIWEJURUd6dUxKMDNHWVFMOWJtVjIvN0V4RGxSZitVdmYxc00yZnJSdENXbWFsMTJwTWd0b252U0N0UjRuMUNMVVpSZFRIREhQMU90d3FkK3JjZGxhdm5LalVCL09ZWFFIVUp6cE55Rm9LcFFLKzJPZ3JFS3BHeUlnSUJnbjJ5OVFIblRKaWhaT3BFdk9LSW9IQU1HQVhIbWoyMUx5bTM5TWJpb3c0SUYrNzd4TnVld3ppTlZCeHI2S0Q1ZSs5SHpaU0JJbFVhL0Ftc0RGSkZYZXlyUWFrUjNGd293VEdjQURKSGNFZmhHa1hZTkdTWW80ZGg0Ynh3TE0rMjh4amlxa2RuMC8zUjRVRWt2Y0JyQmZuL1N6QmMxWGhLTTJWUGxKZ0tTb3JqRGFjOTZWMlVuUVlYbDEveVpQVDREVmVsZ08rc29NamV4WHdZTzU4VkxsNXhJblFVWkk4amMzSDJDUG5DTmI5WDA1bk94SXk0TWxlY2FzVHFHSzZzMmF6NFJqcEYyY1FQMkcyOFIrN3dEUHNaRFpDL2tXdGpkb0hDN1NwZFBtcVFyVUFoTXdLVnV4Q21ZVGlEOXEvTzdHSHRadlBTTjBDQVVRTi9yeW1YWk5uaVlMbEpERTcwYnNrNlh4c2g0a0RPZHhlN0Eyd283UDlGNVl2cXFSREk2YnJmNzl5UENTcDRJMGpWb080WW5MWXRYNW56c3BSNVdCNEFLT1l0UjF1alhiT1FwUHlZRHZmUkUzRk41encwaTdyZWVoZGk3eVYwWURSS1JsbEdDR1JrNVl6K1V2MWZZbDJad3JuR3Nxc2pnQVZvMHhFVWJhOG9oamFOTUpOd1R3WkEvd0JEV0ZTQ3BnMWVVSDhNWUwyemRpb3hSVHFnR1FyRFp4UXlOenlCSlBYWkYwK294SVRKQWJqN29OQzVKd2dETVVKYU01R3FsR0NXYy8vS0NJckkrYWNsRWU0SUEwdXp2N2N1ajZHQ2RhSk9OcGkxM081NDR2YnRJSEJGK0ErSmVERlVRTnk2MUdraTNydHlRNGFVeXduNnJ1MzE0L2RrR2lQOEl3am8wSi8yVHhzNDlaa3dFbDRteCtpWVVVTzU1STZwSnpVNFArN1JScytEWFpreUtVWVpxVldyUEY0STk0bTRXeDF0WGVFNzRvOUd1WDk3N3l2Si9qa2RhazgrQW1vSFZqSTE1VitXd0JkQVJGVjJJUGlySmdWTWRzZzFQZXoyVk5IcWE3RUhXZFRrbDNYVGN5akc5Qml1ZVdGdlFmWEk4YVdTa3V1Um1xaS9IVXV6cXl2TEpmTmZzMHR4TXFsZFlZZmxXQjFCUzMxV2t1UEpHR3dYVUNwamlRU2t0a3VCTVd3SGpTa1F4ZWVocXcxS2d6MFRyem03UWJ0Z3hpRVBEVm1XQ05DQWVDZlJPVHBoZDFaTk9oekx5NlhmSnlHNlhnZDVNQ0FadzR4aWUwU2o1QW5ZMS9ha0RnTlM5WUZsM1kwNnZkNkZBc2cyZ1ZRSnR6RzdMVnExT0gyZnJiWE5IV0gvTlk4OU5OWjRRVVNKcUwyeUVjR0FEYlQzOFgwYkdkdWtxWWxTb2xpS09jc1NUdXFoY2FlbVVlWUxMb0k4K01ab3IyUnhYVFJUaEYxTHJIZnFmLzVMY0xBamRsNEVFUmdVeXNZUzJnZUUreUZkYXNVOTFVZ1VEc2MyY1NRMVpvVDkrdUxPd2RnQW1pZndRcUYwMjhJTmMySVFFRGZUbVV3M2VaeHZ6N1VkMXozeGMxUFFmZUN2ZktzQjlqT2hSajdyRnliOVhjRFdMY1lqMGJCeW9zeWNoTWV6TUxWa0ZpWWNkQkJRdHZJNkswS1J1T1pRSDJrQnNZSEphWFRrdXA4RjBlSWhPMS9HY0l3V0twcjJtb3VCN2c1VFVESk52T1JYUFhhL21VOGJoMjdUQVpZQmUyc0t4NE5TdjVPam5ISVdEMlJ1eXNDekJsVWZlTlhoRGQyanhuSG9VbGhlSjNqQkFwelVSeTBmd20yRnd3c1NVMGNhUUdsMEt2OGhvcFJRRTIxMU5udnRMUnNtQ05yaGhwRURvTmlaRXpEMlFkSldLYlJSV25hRmVkWEhBRUxTTjB0MGJmc0NzTWYwa3RmQm9YQm9OQStuWk45K3BTbG11enNwRmV2bXNxcWNNbGx6enZreVhyem9BK1J5bzFlUFhwZEdPb0p2aHlydStFQlJzbU9wN01YWjB2TlVNVXFITFVvS2dsZzFwNzNzV2VabVBjK0tBdzBwRTJ6SXNGRkU1SDQxOTJLd0R2RHhkeEVZb0RCRE5aamJnMmJtQURUZVVLSzU3SVBENGZUWUY0YzZFblh4L3RlWU1PUkJEdEloUEpuZWlabnk3TnYvekcrWW1la0lLQ294cjZrYXVFMmJadEJMdWZldE5HMEJ0Qlk3ZisvSW1VeXBNQnZkV3UvUTd2VE1Senc1YVFHWld1YzFWMEhFc0l0RllNSUJub0tHWjB4Y2FyYmEvVFlacTUwa0NhZmxGeXNZakE0RURLSHFHZHBZV2RLWW1tK2E3VEFEbVczNXlmbk9ZcFpZcmtwVkV0aXFGMEV1akkwMGFlcGxOczJrK3F5RlpOZUUzQ0RQTDlQNmI0UFEva2F0YUhrVnBMU0VWR0s3RVg2ckFhN0lWTnJ2WnRGdk9BNm9rS3ZCZ010RkRBR1pPeDg4TWVCY0o4QVIzQWdVVWVJem5BTjZ0akNVaXBHRFpPTm0xRmpXSnA0QTNRSXpTYUlPbVo3RHZGL3lzWVliTS9mRkRPVjBqbnRBalJkYXB4SnhMMGVUaHBFaEtPakNERHEya3MrM0dyd3hxSUZLTGUxV2RPeklJOFhJT1BHbnd5NkxLWFZmcFNET1RFZmFSc0d1amhwUzRoQklzTU9xSGJsMTZQSnhjNEVrYVZ1OXdwRVlsRi84NE5TdjVadW00ZHJNZnA5eVhienpBT0pxcVM0WWtJNGNCckZyQzdiTVBpQ2ZnSTNuTlpBcWtrM1FPWnFSK3l5cXgrbkRRS0JCQlo3UUtyZkdNQ0wrWHBxRmFCSlUwd3BrQmRBaGJSNGhKc21UNWF5bmx2a291b3htL05qRDVvZTZCelZJTzl1a3RNKy81ZEVDNVA3dlp2YXJtdU8vbEtYejRzQmFiVlBJQVR1S1Ryd2JKUDhYVWtkTTZ1RWN0SEtYSUNVSkdqYVpJV1JiWnA4Y3pxdVFZZlk2eW5CVUNmSVUrZ0c2d3FTSUJtWUltOXBacFhkYUwxMjFWN3EwVmpEam1Rblh2TWU3eXNvRVpuWkwxNUIwU3B4UzFqamQ4M3VOSU9LWnd1NU1QemcyTmhPeDN4TU9QWXdFbjJDVXpiU3J3QXM1T0F0cnozR0FhVWtKT1U3NFh3amFZVW1HSmRaQlMxTkpWa0dZclRvSU5MS0RqeGN1SWx5ZlZzS1FTRy9HNER5aU8yU2xRdkowZDBPdDF1T0c1SUZTQWtxK1BSVk1nVk1Edk9JSk1kcWplQ0ZLVUdSV0JXOXdpZ1l2Y2JVN0NRTC83bWVGMktaQWFXbCs0eTl1aG93QVg3ZWxvZ0F2SXRBQXhvMitTRnhHUnNIR0VXOUJuaGxUdVdpZ1l4UmNuVlVCUlFIVjQxTFYrRnI1Q0pZVjdzSGZleXdzd3g0WE10VXg2RWtCaFIrcThBWFhVQTh1UEo3M1BiNDlpOUtHOWZPbGp2WGV5Rmo5aXhnYm82Q2NiQUo3V0hXcUtIeS9oK1lqQndwNlZjTjdNODlGR3pRMDRxYnJRdGdyT0Z5YmczZ1FSVFlHNXhuNzNBcmtmUVdqQ0pST3d5M0ozOER4L0Q3ak9hNkJCTnNpdEV3MXdHcTc4MEVFaW9PZUQrWkdwMko2NkFEaVZHTWF5aUhZdWNNazhuVEsyenpUOUNuRXJhQWs5NWtRank0azBHUkVsTEw1WUFLTFFFcko1cnAxZWF5OU80RmI2eUpHbTlVNEZhTXdQR3h0S0Q2b2RJSUhLb1duaEtvMVU4S0lwRkMrTVZuNTlaWG1jN1pUQlpmc2c2RlE4VzEwWWZUcjR1MG5ZcnBIWmJaMWpYaUxtb29GMGNPbTArbVBuSkJYUXRlcGM3bjBCcU9pcE5DcUk2eXlsb1RlUlNoTktIMDRGSW8wZ2NNazBIL3hUaHlONHBQQVdqRERrRXAzbE5OUFJOVmZwTUk0NENXUmxSZ1ZpUDY0ZUswSlNScDBXVXZDV1l1bWxXL2M1OFZjei95TXdWY1c1b1liOSsyNlRFaHd2YnhpTmc0OGhsMVZJMVVYVFUvL0V0YStCTUtuR1VpdmN0Zkw1d0lOREQwZ2lRTDFpcHQ2VTdDOWNkNCtsZ3FZMmxNVVowMlV2NlBycytaRVplcjdaZldCWFZnaGxmT09yQ2x3c29PRkt6V0VmejZSWnUxZUNzK0s4Zkx2a3RzNStCWDBneXJGWXZlMEMzcUhybjVVL09oNkQvQ2lobVdJclk3SFVaUmhKYXhkZSt0bGR1NmFkWUorTGVYdXBRdzBYRXhDMzZSRVRkTkZ4Y3E5Z2xNdTRjTlFTWDljcVIvR1FZcCtJeFVrSWNOR1dWVTdadEdhNlAzWEF5b2RSdDBYZVMzVHAwMUFuQ2gwWmJVaDRWclNaZVY5UldmU29XeXhuWTNoemNaMzBHL0luRHE0d3hSckVlanJlQnhuaElRYmt4ZW54a2F4bCtrN2VMVVFrVVI2dktKMmlERk5HWDNXbVZBMXlhT0grbXZoQmQrc0U2dmFjUXpGb2J3WTVCcUVBRm1landXNW5lN0h0Vk5vbE9VZ0pjOENzVXhtYy9MQmk4TjVtdTlWc0lBNUh5RXJuUzZ6ZUN6N1ZMSTkrbi9oYlQ2aFRva01YVFZ5WEpSS1NHMmhkMmxhYlhUYnRtSzRmTkgzSVpCUHJlU0E0Rk1lVm91Vk4zekc1eDlDaUdwTHcvM3BjZW80cUdxcCtyVnAreis3eVE5OG9FZitueUg0RjMrSjlJaGVEQmE5NFdpNjN6SmJMQkNJWm03UDBhc0hHcElKdDNQekUzbTBTNFlJV3lYQkNWWEdpa2o4TXVkRFBCLzZObTJ2NEl4SjVnVTBpaTBndXk1U1VIcUdVWXpUUDBqSUpVNUU4MlJIVVh0WDRsRGRyaWhCTGRQMVlhRzFBR1VDMTJyUUt1SWFHdkNwTWpaQzliV1NDWW5qRGx2cFdia2RYTVROZUJITEtpdW9vek1HSXZrY3ptUDBhUkpTSjhQWW5MQ1ZOaEtIWEJOY2tINzllOFo4S2Myd1VlajRzUVpvSDhxRFJHa2c4Nm1hVy9aUVdHTm5MY1htcTNGbFhNNnNzUi8zUDZFL2JITXZtNkhMcnYxeVJpeGl0MjVKc0gzL0lPcjJVVjRCV0poeFhXNUJKNlhkcjA3bjlrRjNaTkFrNi9YcGM1TVNGbVlKMlI3YmRMOEtrN3ExT1U5RWxnL3RDeEo4Z2lUMjd3U1R5U0YwR094ZzRQYllKZGkvTnlpYTlObjg5Q0dEdWxmSmVtbTFhaUVyL2VsZUdTTis1TVJyVko0SzZsZ3lUVElXM2k5Y1EwZEFpNkZIdDBZTWJIM3dEU0F0R0xTQWNjZXp6eEhpdHQxUWRoVzM2Q1FnUGNBOHZJSUJoMy9KTmpmL09ibWMyeXpwazhlZFNsUzRsVmR3Z1c1dnpiWUV5Rm9GNEdDQkJieTFrZVZOdWVIQUgrZXZpK0g3b09WZlMzWHVQUVNOVFhPT05BYnpKZVNiNXN0d2RRSGwxWmpyR29FNDlJOCtBOWozdCthaGhRajc0RkNTV3Bacmo3d1JTRkpKbm53aTFUOUhMNXFyQ0ZXL0pacTZQNjJYa01XVGIrdTRsR3BLZm1td2lKV3gxNzhHT0c3S2JyWkdxeVd3bXV5S1dQa05zd2taMXE4dXB0VWx2aUlpK0FYaDJiT09UT0xzcnROa2ZxYlFKZWgyNHJlZWJrSU5Ma2p1dDVyNGQ5R1IvcjhDQmE5U1UwVVFoc25acDVjUCtScVdDaXhSbTdpNFlSRmJ0WjRFQWtodE5hNmpIYjZnUFlRdjdNS3FrUExSbVgzZEZzSzhYc1JMVlo2SUVWckNibU5EYzhvNW1xc29nakFRZm9DOUJjN1I2Z2Z3MDNtK2xRcHY2a1RmaHhzY0RJWDZzMHcrZkJ4dGtoalhBWHIxMFVvdVdDeDNDL3AvRll3SlJTL0FYUktrak9iNUNMbUs0WFJlMCt4ZUREd1ZrSlBaYXU1MmJ6TEVESENxVjBmNDRwUGdLT2tZS2dUWkozM2ZtazNUdThTZHhKMDJTSE04RmVtNVNNc1dxUnlpMkYxeW5mUkpzemNGS3lrZFdsTnFnREEvTDlsS1lCbWM3WnUvcTlpaTFGUEY0N1ZKa3FoaXJVb2I1M3pvaUp0VlZSVndNUjM0Z1Y5aXFjQmFIYlJ1OWtrdnFrM3lNcGZSRkc0OXBLS2pJaXE3aC9WcFJ3UEdUSG9ZNGNnMDVYNTAyOGlIc0x2VVcvdXora2pQeUlFaGhjS1V3Q2tKQXdiUjlwSUVHT244ejZzdkFPOGk4OXNKM2RMNXFEV0ZZYlMrSEdQUk14WXdKSXRGUU44NllFU2VKUWhuMnVyR2lMUmZmUWVMcHREbDhkQWdiK1RwNDdVUVB4V093MTdPZUNoTE4xV256bGtQTDFUNU8rTzNNZW5wbjRDM0lZNUxFZXBIcG5QZVpIYnZ1V2ZlVnRQbGtINExaalBiQnJrSlQzTm9SSnpCdDg2Q08wWHE1OW9RKzhkc20weW1SY21ReW44dzcxbWhtY3VFSTVieXVGK0M4OFZQWWx5MnNFempsekFRM3Zkbi8xK0h6Z3V3NnFGTk5icWVuaFpHYmRpRzZSd1phVEc3alRBMlg5UmRYakROOXlqMXVRcHlPNEx4OEtSQWNaY2JaTWFmcDR3UE9kNU1kWG9GWTUyVjFBOE05aGkzc3NvOTMrdXByRTBxWU5NamtFMjJDdks0SHVVeHFON29JejVwV3VFVHExbFFBanFsU2xxZEQyUm5yL2dncC9UVmtRWWpuOWxNZlllbGsyc0g1SFBkb3BZbzdNSHdsVjFvcjlCeGYrUUN5THptOTJ2ekcyd2ppSWpDL1pIRUp6ZXJvSmw2YmRGUFRwWmhvNU1WMlU4NmZMUXF4TmxHSU1xQ0d5KzlXWWhKOG9iMXIwK1doeGRlOUwyUGR5c0VUdjk3Tyt4VncrVk5OMVRaU1FONUk2bDltNUlwNnBMSXFMbTRhMUIxZmZINmdIeXFUOXA4Mk5Pam50UldHSW9mTzNiSno1R2hrdlNXYnNYdWVUQU1hSkRvdTk5a0dMcURsaHdCWk5FUTRtS1B1RHZWd1NLNFdtTGx1SHloQTk3cFppVmU4ZytKeG1uSkY4SWtWL3RDczRKcS9IZ09vQUVHUjl0Q0RzRGJEbWkzT3ZpVVFwRzVEOFhtS2NTQVVhRkxSWGIybG1KVE5ZZGh0WXlmakJZWlFtTjVxVDVDTnVhRDNCVm5sa0NrN2JzTVczQXRYa05NTVR1VzRIalVFUlNKblZRMHZzQkdhMXdvM1FoNzExNVhHZVRGM05Uejh3MDQ0MEFnVTdjM2JTWE8vS01JTmFJV1hkMG9McG9xLzAvUUp4Q1FTSjlYbll5MVc3VFlMQkpwSHNWV0QxYWhzQTdGak52UmQ2bXhDaUhzbThnNlowcG56cUlwRjFkSFV0UDJJVFU1WjFoWkhidStMM0JFRVN0QmJMOVhZdkdmRWFrdjFibWYrYk9aR25vaXVIRWRsQm5hQ2h4WUtOekIyM2I4c3c4WXlUN0FqeGZrNDllSklBdmRiVmtkRkNlMkowZ01lZmhRMGJJWnhoeDNmek1JeXNRTmlOOFBnT1VLeE9NdXIxMExkdWlnUkVEUk1aeVA0b0dXclAxR0ZZNHQ2Z3JvQVNzWjQyMW9zNDh3QWRucmJvdk5oTHQ3U2NOVUxrd1o1QUlaSlRyYmFLWVRMakExb0ozc0l1Ti9hWW9jbS85dW9RSEVJbGFjRjFzL1RNMWZMY1BUTDM4TzlmT3NqTUVJd29QS2Z2dDdvcHVJOUcySGYvUFI0YUNMRFE3d05tSWRFdVhKL1FOTDcyazVxNE5lakFsZFBmZTNVVlZxemt5czhZWi9qWU9HT3A2YytZelJDckN1cTBNMTF5N1RpTjZxazdZWFJNbi9ndWt4ckVpbWJNUWpyM2p3Uk02ZEtWWjRSVWZXUXI4bm9QWExKcTZ5aDVSM0VIMUlWT0hFU3N0L0xJdGJHMkQydlJzWlJrQU9ienZRQUFEM21iMy9HNE56b3BJMEZBaUhmYnBxMFg3MmFkZzZTUmorOE9ITVNodEZ4eExabGYvbkxnUkxiQ2x3bDVXbWFZU3MreUVqa3E0OHRZN1oyYkUwTjkxbUp3dCt1YTBObFJKSURoMEhpa0Y0VXZTVm9yRmoyWVZ1OVllUzV0ZnZsVmpQU29OdS9adTZkRVVmQk9UNTU1aGFoQmROM1NhNVh1ajJSdmF1MWxRTklhQzk0NHkwUldqOVVpTkRza0FLMVdvTCtFZlhjQzZJYkJYRlJ5VmZYL1dLWHhQQXdVeUlBR1c4Z2daMDhoY2lqS1R0MVlLblVPNlFQdmNybURWQWIwRkNMSVhuNWlkNGZEL0p4NHR3L2diWHM3V0Y5YjJSZ1h0UGhMQkc5dkY1RkVrZEhBS3JRSFpBSkMvSFd2azdudnp6RHpJWFpsZkZUSm9DM0pwR2dMUEJZN1NRVGpHbFV2RzU3N3lOdXRaMWhUZnM5LzFua1NYSzl6ektMUlozVk9EZUtVb3ZKZTBXQ3ExelZNWXhDSk1lbm1OelBJVTJTOFRBNEU3d1dtYk5reHE5ckkyZGQ2djBWcGNBUFZNeG5Ec3ZXVFdGYXl5cXZLWk83WjA4YTYyaS9vSDIvanhmOHJwbWZPNjRpbjNGTGlMMUdYOElHdFZFOU0yM3lHc0lxSmJ4RFR5K0x0YU1XRGFQcWt5bWI1VnJRZHpPdnFsZGVVMFNVaTZJaXJHOFVaM2pjcFJid0hhMUMwRHd3OUcvU0ZYM2dQdlRKUUUra3l6K2cxQmVNSUxLS08rb2xjSHpjdE9XZ3p4WUhuT0Q3ZHBDUnR1WkVYQUNqZ3Flc1pNYXNvUGdudURDNG5VdmlBQXhEYzVwbmdqb0FJVElrdmhLd2c1ZDYwOHBkclpjQStxbjVUTVQ2VW8vUXpCYU94QkNMVEpYM01nazg1ck1mc25XeDg2b0x4ZjdwMlBYNU9OcWllVGEvcU0zdFB3NFpYdmxBcDgzTlNEOEY3K1pnY3RLMVRwb1l3dGlVMmgwMkhDR2lvSDV0a1ZDcU5WVE1INXAwMHNSeTJKVTFxeURCUDJDSUkvRGc0V0RzSWwremdlWDc1ODlzcng2WU9SUlFNQmZLYm9kYkI3NDNUbDRXTEtPRW53V1VWQnNtOTRTT2xDcmFjVTcyTVN5ajA2OHdkcFlqeXoxRndDMmJqUW54bkI2TXAvcForeXlaWHRndUVhWUIra3FoalE2VVVtd1NGYXpPYityaFlqTGFvaU0rYU45LzhLS24wemFDVEZwTjllS3dXeTcvdTRFSHpPNDZUZEZTTmpNZm4yaVBTSndEUENGSGMwSTErdmpkQVp3NVpqcVIvdXppOVpuMjBvQWE1Sm5MRWsvRUEzVlJXRTdKL1hydXBmRkpQdENVdXFIUHBubEw3SVNKdFJwU1ZjQjhxc1pDbTJRRWtXb1JPdENLS3hVaDN5RWNNYldZSndrNkRsRUJHMGJaUDZlZzA2RkwzdjZSUGI3b2RHdXdtN0ZOOGZHNHdvcXRCOGU3TTVrbFBwbzk3R29PYk53dCtsdWRUQW14eUM1aG1jRngrZEl2RVpLSTZpZ0ZLSHFMSDAxaVkxbzc5MDNWekc5UUdldHlWeDVSTm1CWVVVK3pJdVN2YS95SWNFQ1VpNHBSbUUzVmtGMmF2cXVsUUVVWTR5Wi93bU5ib0J6UG1BUGV5MytkU1l0QlpVamVXV1QwcFB3Q3o0Vm96eHA5eGVDbElVNjBxdkVGTVFDYVB2UGFBNzBXbE9QOWYvZXkzOW1hY3ZwR0NWYSt6ZmE4Z080NHdieHBKVWxDOEdOL3BSTVRRdHpZOFo4L2hpTnJVK1pxNjRaZkZHSWtkajdtN2FiY0sxRUJ0d3MxWDRKL2hucXZhc1B2dkRTRFlXTitRY1FWR01xWGFsa0R0VGFkNXJZWTBUSVIxRXFveDNjendQTWpLUHZGNXNGdjE3VGh1anIxSVoxWXRsNFZYMUowdmpYS21MWTRsbVhpcFJBcm8wcVZHRWNYeEVWTU1FbDU0alFNZDRKN1JqZ29tVTBqMXB0anl4WStjTGlTeVhQZmlFY0lTMmxXREszSVNBeTZVWjNIYjV2blBuY0E5NDQxMWpjeTc1YXk2QjZEU1R6SzZVVENaUjl1REFOdFBCcnZJRGdqc2Zhck1pd29heDJPbEx4YVNvWW40aVJna3BFR3FFa3dveDV0eUk4YUtrTGxmWjEybE8xMVR4c3FSTVk4OWo1SmFPNTVYZlBKUERMMUxHU25DODhSZTlBaStOdTViWmp0d1JydkZJVFVGSFBSNFpteEdzbFFNZWNnYlpPN25IazMycUh4WWtkdldwdXAwN29qY01DYVZycEZBeUZaSkpiTnZCcFpmZGYzOUhkbzJrUHRUN3YwL2Y4Ui9CNU56NGYxdDkvM3pOTS83bjZTVUhmY1drNWRmUUZKdmNKTWdQb2xHQ3BPRmIvV0MwRkdXVTJhc3VReVQrcm04OFpLWjc4Q2VpL0NBaDkzOUNIMEpZYnBaSVB0eGMydWZYcWpTM3BISDlsbldLNGlKN09qUi9FRVNwQ28yUjNNWUt5RTdySGZoVHZXaG80Y0wxUWRONGpGVHlSNnN5TXdGbTEyNFRWRERSWE1OdmVJMURwL250d2R6OGs4a3h3N2lGU3g2K1l4Nk8rMUx6TVZyTjBCQnp6aVppOWtuZVpTemdvbGxCblZ3Qmg2b1NPUEhYcmdsck9qK1FtUi9BRVNyaERwS3JXVCs4L0FpTUR4Uy81d3dSTnVHUVBMbEo5b3ZvbWhKV244c01MVkl0UThOLzdJWHZ0RDhrZE9vSGF3K3ZCU2JGSW1Rc3YvT0NBSXVpOTlFK1lTSU9NbE12QlhrQXQrTkFaSzh3QjlKZjhDUHRCK1RPVU9SK3o3MWQvQUZYcFBCVDYrQTVGTGp4TWpMSUVvSnpyUWZxdXZ4RUlpK1dvVXpHUjFJelFGTnZiWU9ueGIyUHlRMGtHZHlYS3pXMmF4UUw4bE5BWFBrNk5FanFyUkQxb1p0S0xsRm9vZnJYdzBkQ05XQVNIenkrN1BTek9VSjNYdGFQWnN4TERqcitvNDFmS3VLV05tamladGZrT3pJdHZsVjJNREdTaGVHRjBtYTA0cUUzVFVFZnFKTXJYRm03RHBLKzI3RFN2Q1VWZjdyYk5vbGpQaGhhNVc3S0JxVnEwU2hVU1RiUm11cVB0UXJlVldINEpFVDV5TWh1cU1vU2Q0ci9OOHNEbWVRaVFRdmkxdGNadjdNb2M3ZFQ1WDVBdENENmtORUdaT3pWY05ZbHBYNEFiVHNMZ1NZWWxpaVB5Vm9uaXVZWXlTeHNCeTVjZ2IzcEQrRUswR3BiMHdKZzAzMWRQZ2FMOEpadDZzSXZ6TlBFSGZWUE9qWG1hWGo0YmQ0dm9YenBaNUdBcE1oSUxnTWJDRVdaMnp3Z2RlUWdqTkhMYlBJdCtLcXhSd1dQTFRONkh3WjBPdWlqajRVRitTZzBBdThYdUlLVzBXeGxleGRyRnJEY1pKOFNoYXVhdDNYMFhtSHlncWdMMW5BdTJockpGYjR3WlhrY1MraTM2S015VTF5RnZZdjIzYlFVSmkvM3lRcHFyL25hVU9vaUVXT3hja3lxL2dxNDNkRm91MURWRGFZTVpLOXRobzcrSVhYb2tCQ3M1R1JmT2NCSzdnM0EralhRMzlLNFlBOFBCUlc0bTUreVIwWkF4V0puY2pSVmJJVHZJQVBIWVJ0MUVKM1lMaVVicUl2b0tIdHpIS3RVeTFkZFJVUTBBVU80MXZvblpEVU9XK21yc3p3K1NXLzZRL0lVZ05wY1hGamtNN0Y0Q1NTUTJFeFpnODVvdHNNczdrcXNRRDRPeFllQk5EY1NwaWZqTW9MYjdHRWJHV1R3YXNWT2JtQi9iZlBjVWxxMHdZaFhDWUVEV1JXMDJUUDViQnJZc0tUR1dqbldEREoxRjd6V2FpMHpXLzJYc0N1dkJRalBGY1RZYVFYM3RTWFJTbThoc0FvRGRqQXJLL09GcDZ2Y1dZT0U3bGl6UDBZYys4cDE2aTcvTmlYSWlpUVRwN2M3WHVzOTI1VkV0bEtBalVkRmh5YWlMVDdWeERhZ3ByTUZ3aXg0d1owNXUwcWo3Y0RXRmQwVzlPWUhJdTNKYkpLTVhSSjFhWU5vdnVnZytRcVJON2ZOSFNpMjZWU2dCcG4rSmZNdVBvM2FlcVBXaWsvd0k1UnozQldhclBRWDRpNStkTTBucHdWT3NYK0tzT2hDN3ZEZytPSnN6NFE1emxuSWVmbFVXTDZRWU1iZjlXRGZMbW9zTEY0UWV2M21KaU91SGpvb3IvZE1lQnBBOWlLRGtNallCTmJSbzQxNEhDeGpzSHJCNEVYTmJIek5NREhDTHVOQkc2U2YrSjRNWi9FbFZzRFNMeGpJaUdzVFBodzhCUGp4YmZRdHNraitkeU5NS09PY1VZSVJCRUlxYmF6ejNsbWpsUlFocGx4cTY3M1ZrbE1NWTY1OTd2dStkODllYy96cTdNaTRnUXZoODdlaFlicE91WkVYajVnL1E3UzdCRkRBQUI5RHpHMzVTQzg1M3h0V1ZjblpRb0g1NGplT3FZTFI5TkR1d3hzVnRoVFY3Vjk5bi9CN0hTYkF5dGJFeVZUei81TmhKOGdHSWpHMEU1ajNncmlVTFVkNVJnN3RRUis5MGhKZ05RS1FIMmJ0YlNmUGNhVE9mSWV4YzFkYjFCeFVPaE0xdldDcExhWXVLcjNGZE5UdC9UM1BXQ3BFVVdES0V0ellyanB6bEwvd3JpM01JVEtzRnZ0RjhRVlYvTmhWbzk3YUtJQmdkbGlOYzEwZFdkWFZEcFZ0c05uKzJVSW9scmdxZFdBNEVZOHNvMFl2QjRhK2FMek1YaU1BdU9IUXJYWTB0citDTDEwSmJ2WnpnakpKdUIxY1JrZFQ3RFVxVHZuc3dWVXA1a2tVU0ZWdElJRllLMDUrdFF4VDY5OTJISE5XVmhXeFVzRDFQa2NlSXJsWHVVVlJvZ3dtZmRoeXJmNnp6YUw4K2MwTDdHWE1aT3RlQWhBVlFWd2RKaCs3bnJYN3g0TGFJSWZ6MkYydjdEZy91RGZ6MkZhKzRnRm0yekhBb3I4VXFpbUpHM1ZUSnRaRW9GWGhuRFlYdnhNSkZjNmt1MmJoYkN4emlqMno1VU51SzBqbXAxbW52a1ZOVWZSK1NFbWoxTHI5NEx5bTc1UE83RnMwTUlyM0dkc1dYUlhTZmdMVFZZMEZMcWJhOTd1MUluOE5BY1k3SUM2VGpXTGlnd0tFSW00M054VGRhVlR2OW1jS2t6dXpCa0tkOHgveHQxcC85QmJQN1d5YjRicG8xSzFnbk9wYkx2S3o1OHBXbDNCNTVSSi9aNW1SRExQdE5RZzE0amRPRXM5K2gvVjVVVnB3ckFJOGtHYlg4S1BWUERJTWZJcUtEakpEOVV5RE9QaGpaM3ZGQXllY3d5cTRha1VFOW1ET3RKRUsxaHBEeWk2QWU4N3NXQUNsWEdUaXdQd043UFhXd2p4YVI3OUFySFJJUGVZS1R1blZXMjRzUHIvM0hQejJJd0g4b0tINE9sV0VtdDRCTE02VzVnNGtNY1liTHdqMnVzb2REMTA4OHN0WkE3Vk9zVVNwRVZsNHc3Tk1iMUVVSE1SeEF4TEYwQ0lWKzBMM2laYitla0IxdlNEU0ZqQVozaGZMSmY3Z0ZhWHJPS24rbWhSK3JXdy9lVFhJY0FnbDRIdkZ1QmcxTE9tT0F3SkgzZW9WRWpqd2hlS0E0aWNiclFDbXZBdHBRMG1YRzBhZ1lwNW1qNFJiNm1kUStSVjRRQlBieE1xaDlDN284blAwV2tvMm9jbkNIZVJHaE4xWFZ5VDJiOUFDc0wrNnlsVXkreUMzUUVuYUtSSUpLOTFZdGFvU3JjV1pNTXd4dU0wRTlKNjhaK1l5akEwZzhwMVBmSEFBSVJPeTZTYTA0VlhPdVQ2QTM1MUZPV2hLZlRHc0ZKM1JUSkdXWVBvTGs1RlZLNE9hWVI5aGtKdmV6d0Y5dlFOMTEyNnI2aXNNR1hXVHFGVyszSEwzSS9qdXJsSWREV0lWdllZK3M2eXE3bHJGU1BBR1JkblU3UFZ3WS9TdldiWkdwWHp5M0JRMkxtQUpsck9OVXNaczRvR2tseTBWMjY3eGJENUtNWTh3b05Oc21XRzFWVmdMQ3JhOGFRQkJjSTREUDJCbE53eGhpQ3RIbGF6Nk9XRm9DVzB2TVIzRXJyRzdKeU1qVFNDbnZSY3NFSGdtUG53QTZpTnBKMkRyRmI0Z0xsaEtKeVpHYVdrQTk3SDZGRmR3RWNMVDZEUlFRTCsrZk9rVkM0Y1lHVzFURy8zaUs1ZFNoUlN1aUJ1bG1paHFnalI0NVZpMDNvMlJiUWJQM3N4dDkwVnhRNnZ6ZGxHZmtYbW1LbWpPaTA4MEpTSGtMbnRqdnNCSm52N2dLc2NPYVRPa0VhUlFxQW5DQTRIV3RCNFhuTXRPaHBSbUgyRkg4dFRYcklqQUdOV0VtdWRRTENrY1ZsR1RROTY1S2gwSDZpeFhiZ0ltUVA2YjQyQjQ5c081QzhwYzdpUmxneXZTWXZjbkg5RmdRM2F6TGJRRzJjVVc5NlNEb2pUUVN0eGtPSnlPdURHVEhBbm5Xa3oyOWFFd045RlQ4RUo0eWhYT2crakxUckNQS2VFb0o5YTdsRFhPakVyOEFnWDRCbW5NUTY2OG9XMHpZUHlRaVZNUHhLUkh0cGZuRUV5YUtoZHpOVlRobHh4RFFOZHJIZVppVUZiNk5vWTJLd3ZTYjdCblJjcEp5Ky9nL3pBWXgzZllTTjVRRWFWRDJZMVZzTld4QjBCU08xMk1Sc1JZOEpMZkFlelJNejVsVVJ1TFVuRzFUb0trNlEzMEZ1Z2hxV042Z0JOY0Z4UC9uWS9pditpYVVRT2ErMk51eW00Nnd0SS9EdlNmelNwMWpFaTRTZFlCRTdZaFRpVlY1Y1g5Z3dib1ZETVZnWnA1WUJRbEhPUXZhRE5mY0NvQ0p1WWhmNWt6NWt3aUlLUGp6Z3BjUkpIUGJPaEphamVvZVJMNTNjdU1haGhWOFo3SVJyNk00aFcwSnpUN216YU1VelFwbTg2Nnp3TTdDczA3ZkpZWHVXdmpBTWtiZTVPNlY0YnU3MXNPRzZKUTRvTDh6SWVYSGhlRlZhdnp4bWxJeUJrZ2M5SVpsRURwbE1Qcjh4bGN5c3M0cFZVZHdLMWU3Q0sya1RzU2RxN2c1U0hSQWwzcFlVQjlLbzRmc2g0cWxlT3lKdjF6M0tGU1RTdndFY1JPL0V3OG96RURZWlNxcGZvVlc5dWhKZllyTkFYUjBaM1ZtZW9BRCtyVld0d1AvMTNzRS8zSUNYM0hoREczQ01jNDc2ZEVFQzBLM3VtU0FENGorWlFMVmRGT3NXTDJDMVRINSs0S2lTV0grbE1pYm8rQjU1aFIzR3E0MEcxbjI1c0djTjBtRWNvVTJ3TjlGQ1Z5UUxCaFlPdTlhSFZMV2pFS3gySklVWmk1eVNvSFVBSTliOGhHemFMTXhDWkRNTGh2OE1rY3BUcUV3ejlLRkRwQ3BxUWhWbXNHUU44bTI0d3lCODJGQUtObWpnZktSc1hSbXNTRVNvdkF3WGpCSW9NS1NHNTFwNlVtOGIzaTdHSVNzN2tqVHEvUFpvaW9DZkp6ZktkSlROMFE0NWtRRVF1aDlIODhNM3lFczNEYnRSVEtBTHJhTTBZQzhsYWlNaU9PZTZBRG1UY0NpUkVlQVdaZWxCYUVYUmFTdWoybHgweEhhUllxRjY1TzBMbzVPQ0ZVMThBOGNNREU0TUxZbTl3MlFTcjlOZ1FBSWNSeFpzTnBBN1VKUjBlNzFKTCtWVStJU1dGazVJOTdscmE4dUdnN0dsUVloR2Q0R2M2cnhzTEZSaUllR080YWJQNFM0ZWtRMWZpcURDeTg3R1pIZDUyZm41YWFER3V2T21Jb2ZyenBWd012dGJyZVovODU1T2FYVFJjTmlORTB3ekdaU3hiamcyNnY4a284TDUzN3YvWENDV1AyTUZhQXJKcHZua2VwMHBBK084Nk1XalJBWlBRUmZ6blppU0lhVHBweTZtM3A2SHJOU3NZN2ZEdHo3Q2w0Vi9ESkFqUURveWlMMnV3ZjFVSFZkMkFJcnpCVVNsSmFUajRrNk5MOTdhL0dxaFdLVTlSVW1qbllLcG0ycitKWVVjcmtDdVpLdmNZdnJnOHBEb1VLUXl3WTlHRFdnMDNEVUZTaXJsVVhCUzVTV24vS0FudG5mMElkSEdMLzdtd1hxREcrTFpZamJFZFFtcVVxcTR5NTRUTm1XVVA3SWdjQXc1ODE2WUJ6d2lOSUppRTlNNGxQQ3plSS9GR0JlWXkzcDZJQW1INEFqWFhtdlE0SXkwWTgyTlRvYmNBZ2dUMkNkcXo2TXg0VGRHb3E5Zm4yZXRyV0tVTkZ5YXRBSHlkUVRWVVEyUzVPV1ZVbHVnY052b1VybEE4Y0pKejlNcU9hL1czaVZubzR6REhmRTd6aG9ZNWY1bFJUVlpEaHJRYlI4TFM0ZVJMejhpUE15Qkw2bzRQaUxscDg5Rmpkb2tRTGFTQm1LSFV3V3AwbmE1ZkUzdjl6bnkyWWNEWEcvamZJOXNjdHVsSFJiZGtJNWE0R09QSng0b0FKUXpWWi95WUFhZG84S05aVWRFRnM5WlBpQnNhdXNvdFhNTmViRWdyMGR5b3B1cWZTY0ZKM09ETlBIZ2NsQUNQZGNjd3YwWUpHUWRzTjJsaG9WNEhWR0J4Y0VVZVVYL2FscjRucXBjYzFDQ1IzdlI3ZzQwenRlUWcvSnZXbUZsVUU0bUFpVHBIbFlHckI3dytVMktkU3dRejJRSktCZS81ZWlpeFdpcG1mUDE1QUZXcks4U2gxR0JCWUxnemtpMXdUTWhHUW1hZ1hxSjIrRnVxSjhmMFh6WENWSkZIUWRNQXc4eGNvMTFIaE0zNDdhbHJBdSt3bVgzcERGQUJPdmtDK1dQWDBVaGcxWjVNVkhLTlJPeGFSODRZVjNzMTJVY00rNzBjSjQ2MFN6RWFLTHloNDcydk9NRDNYbmFLN3p4WmNYbFdxZW5FdmNqbWdHTlIyT0tiSTFzOFUraXdpVytIb3RIYWxwM2UxTUdEeTZCTVZJdmFqbkF6a0ZIYmVWc2dqbUpVa3JQOU9Bd25FSFlYVkJxWXgzcTdMdlhqb1ZSMG1ZOGgrWmFPbmgwNTNwZHNHa21icWh5cnlOMDFlVkh5U3IrQ2tEWWtTTWVaMXhqUE5WTStnVkxUREt1MlZHc01VSnFXTzRUd1BEUDBWT2cyLzhJVGJBVWFNR2I0TGpMN0wrUGkxMWxFVk1YVFlJbEFaL1FIbVRFTmp5eDNrRGtCZGZjdnZRdDZ0S2s2allGTTRFRzVVWERUYUY1KzFaalJ6Nlc3TWRKUEMrd1RrYkRVaW00cDVRUUgzYjlrR2syQmtpbHlldXI4QmMyMHdtNXVKU0JPOTVHZllESTFFWmlwb1JhSDd1VnZlbmVxejQzdGxUWkdSUTRhN0NObU1IZ1h5T1FRT0w2V1FrZ01VVFFEVDh2aDIxYVNkejdFUmlaVDFqSzlGK3Y2d2dGdnVFbUduZ1N2SVVSMkNKa2M1dHgxUXlnZlpuQXJ1T05vYkIxaWRDTEIxRkNmTzdOMVpkUm9jVDgvV3llK0VuRGlPOXB6cUlwbkxEbDRia2FSS1crZWtCVndIbjQ2U2h3MVgwdGNsdC8wUk9panVVQjRrSUluclZKVTRidVdmNFlJVEp0ak9KNmlLZHIxdStmbGdRZUZINzBHeEtqaGRndC9NcndmQjRLL3NYY3pRKzl6WWNyRDRkaFk2cVpoWjAxMHJyeGdnV0E4SmFaeWcycFlpajhpZVlFZzFhWkprWks5TzFSZTdzQjBpb3VmNjBySzBHZCtBWWxwN3NvcUNCQ0RHd2ZLZVVRaENCbjBFMG8wR1M2UGRtakxpMFR0Q1laZXFhenF3Tit5TklOSUE4TGszaVBEbldVaUlQTEdOY0htWkR4ZmVLMGlBZHhtL1Q3TG5OK2dlbVJMNjFoSEljME5DQVphaVlKUitPSG5MV1NlOHNMcks5MDVCNWVFSkhObFdxNFJtRVhJYUZUbW80OWY4dzYxK053ZkVVeXVKQXdWcVpDTEZjeUhCS0FjSVZqM3NOemZFT1h6VktJbmR4SHcrQVI5M293aGJDeFVaZjZHczhjejYvMVZkckZFUHJ2MzMwKzlzNkJ0TVZQSjN6bC9VZjlyVWkwWi9vcGV4ZmRMM3lrRjc2ZTk5OUdQZlZ2OGZKdi9ZLysvNWhFTW9uMXRxTkZ5VlJldlY5eTkvdUl2c0czZGJCOEdSUnJnYUVYZmh4KzJ4ZU9GdCtjRW4zUlphbk54ZEVlMitCNk1IcE5iclJFNTNQbERpZlB2RmNwNGtPNzhJTFIwVDR4eVcvV0dQeUJzcUdkb0E3ekpKQ3UxVEtiR2ZobnFnblJieGJCMkIzVVpvZVEyYnoyc1RWblV3b2tUY1RVMjFSeE4xUFlQUzNTYXI3VDBlUklzeUNOb3dyOWFtd29NVS9vZDlzMkFQdGlLTkw2RU5PbHlLQURzdEFFV0tBK3NkS0Rocko2Qk9oUkptWitRSmJBYVozLzVGcTAvbHVtQ2dFekdFYnUzeWkwWTRJNEVnVkFqcXhoNEhidVFuMEdyUmhPV3lBZnNnbFFKQVZMMXkvNnllelMyazhSRTJNc3RKTGg5Mk5PQjNHQ1lnRlh6bkY0ZDI1cWlQNFpDeUk0UllHZXN1dDZGWEs2R3dQcEtLOFdIRWtoWXVpMEF5RW1yNU1sM3VCRnRQRmRuaW9JOFJpQ29vYTdaMUcxV3V5SWkzblNOZ2x1dGMreFk4QmtlVzNKSlhQSzZqZDJWSU1wYVN4cFZ0RnErUit5U0s5SjZXRzVRdnQrQytRSDFoeVlVT1ZLNzg1N25GbXlEQllnWi9vK0FuaWJ6TlZxeVlDSlF2eURYRFRLK2lYZGtBNzFiWTdUTDNidnVMeExCUThrYlR2VEVZOWFxa1EzK01pTFdiRWdqTHpPSCtsWGdjbzFFUmd6ZDgwckRDeW1scGFSUWJPWW5LRy9PRG9GbDQ2bHpUMGNqTTVGWVZ2djBxTFViRDVseUp0TVVhQzFwRmxUa05PTng2bGxpYVg5bzBpLzF2d3M1Yk5LbjVPdUVOUUVLbUxsY1A0bzJabUpqRDR6emQzRmszMnVRNHVSV2tQU1VxYjRMQmUzRVhIZE9STkIyQldzd3M1ZGFSbk1mTlZYN2lzUFNiMWhNUWRBSmkxL3FtRE1mUlVsQ1U3NHBtbnpqYlhmTDhQVkc4TnNXNklRTTJOZTIzaUNQSXByeUpqWWJWbm01aEN2S3BNYTdITFZpTmlOYyt4VGZESWFLbTNqY3RWaUQ4QTFNOVlQSk5rMDAzVlZyNFpvMk11R1c4dmlsOFNMYUdwUFhxRzdJNERMZHRsOGE0UmJ4MUx0NHc1SHVxYWExWHpaQnRqMjA4RUpWR2NtS1lFdWFlTjI3elQ5RUU2YTA5SmVyWGRFYnBhTmdOcVlKZGhQMU5kcWlQS3NiRFJVaTg2WHZ2TkM3ck1FNW1yU1F0cnpBWlZuZHRTakNNcWQ4Qm1hZUdSNGw0WUZVTEdSQmVYSVY5WTR5eExGZHlvVU5waXkySWhlUFNXekJvZllQUDBlSWEycTVKUDRqOUc4YXQvQXFvU3NMQVV1Ulh0dmdzcVgvell3c0Urb2Y2b1NEYlVPbzRSTUp3K0RPVVRKcStobnF3S2ltOVl5L25hcHlaTlRjMnJDcTZWOWpIdEpieEdQRHdseldqL1NrM3pGL0JIT2xUL2ZTalNxN0ZxbFBJMXE2SitydThBa3UwMDhTRklOWFpmT2ZuWk5PdkdQTXRFbW4yZ0xQdCtINFFMQSsvU1llNGozOThhdXpoS0lwMlBvazNtUEM1cTFJTjFIZ1IrbW5FZmM0TmVlSFl3ZDIva3BzelIzY0JuN25pOU5iSXFodFNXRlc4eGJVSnVVUFZPZWVYdTNqMElHWm1GTml3YU5aNnJINC96UTJPRHo2dEZ4UkxzVVladTFiZmQxdUl2ZlFEdDRZRC9lZktZdjhWRjhiSEdEZ0syMncyV3F3cGk0M3ZOQ09YRkpaQ0dNcVdpUGJMOG1pbDZ0c21PVFhBV0N5TUN3NzNlMnJBRFpqMklLNnJxa3NNM0VYRjJjYkxiNHZqQjE0d2EveVhLNXZ3VSswNU16RVJKNW5Yc1hzVzIxbzdNK2dPMGpzMk95S2NpUDV1RjJpWHliMkRpcHR3UWVIZXF5Z2tyTnNxVkNTbGxkeEJNcHdIaTF2ZmM4UktwUC80TDNMbXBxNkRaY3ZoRERmeFRDRTNzcGxhY1RjT3RYZEsyZzMwM2RJV0JWZTJ3RC9HdmphMWNDbEZRNjdndzB0MVpVdHRzVWdRMVZla3k4b09wUzZrc1lFYzRicXNlQ2JaeTc2NlN2TDNGb2RtbmFobFdKUmdWQ05qUHhoTC9mazJ3eXZsS2hJVEgvVlFDaXBPSTBkTmNSYTVCMU01SG1PQmpUTGVaUUp5MjM3ZTJtb2J3bUR5Sk5IZVBoZERtaWtudkxLYURiU2hMK0lzMVhUQ0p1TFFkMndtZEpMNyttS3ZzMjk0d2hYUUQrdnRkODhLS2swRFhQOEIxWHU5Sit4bzY5Vk91RmdleGdUcmN2STZTeWx0dUxpeDlPUHVFNi9pUkpZb0JNRVh4VTRzaFFNZjRGanF3ZjFQdG5KL3dXU1pkMjlyaFpqUm1UR2dpR1RBVVFxUnorbkNkamVNZlloc0JENUx2NjBLSUxXRXZORUhmbXNEczJMMEEyNTIzNTFlVW9ZeEF5c1ZhQ0pWTGRIOVFGV0FtcUpEQ09EVWNkb28xMitnZDZiVzJib1kwcEJWSFdMNkxRREs1YllXaDFWOHZGdmkwY1JwZnd2N2NKaU1YM0FaTkp1VGRkSGVoVElkVTBZUS9zUTFkTG9GMnhRUGNDdUhLaXVDV09ZMzBESGUxT3djQ2xMQWhxQUt5cWxuSWJILzh1OVNjSnBjUzRrZ3A2SEtEVWRpT2dSYVJHU2lVQ1JCanpJNWdTa3NNWktxeTdTZDUxYWVnMHRnSit4MFRIOVlIMk1nc2FwOU43RU5aZEVCMGJleTJETVRyQkExaG41NlNFck5IZjN0S3RxeUw5YjZ5WEVQOTcvcmMramdEMk4xTE5VSDZSTTlBelAza1NpcHIwNlJrS09vbFI3SE83NjhqaldpSDFYOTJqQTdka2c3Z2NOY2pxc1pDZ2ZxV3cwdFBYZExnMjBjRjZ2blF5cGc3Z0x0a2F6ckhBb2R5WWZFTlBRWnNkZm5qTVppTnU0bkpPOTdEMS9zUUUrM3ZORnpyU0RPS3cra2VMRUNZZjdSSndWSGVQL2o3OTgzM29aMGVnb25ZQjJGbEZFNXFqMDJCL0xWT01KUWxzQjh1TmczTGVnNHF0WndudHNPU05pZFIwYWJiWm1BSzRzQ3p2dDhZaXV6MnlyTkNKb0g1TzhYdlgvdkxlUi9CQllUV2owc09QWU0vanl4UmQ1Ky9KemlLQUFCYVBjdy8zNFVBM2FqL2dMWnhaZ1JDV042bTRtM2RlbWFuTmdzeDBQMjM3L1ErRXc1VlluSlBreUNZMGNJVkhvRm4yQXkvZTdVNFAxOUFQYlBGWEVIWDk0TjZLaEVNUEc3aXdCMytJK08xamQ1bjZWU2dIZWd4Z2FTYXdPNmlRQ1lGZ0RzUFNNc05PY1VqNHEzc0Y2S3pHYUgvMHU1UFFvQWovOHpxNlVjOU1vTnJHcWhZZWIyalFvMFdsR2xYanh0YW5aTFMyNC9PSU41R3gvMmc2ODRCUERRcHdscW5rRmN4cG1QL29zbk9YckZ1dTRQcWlmb3VRSDBlRjVxQ2t2SVRRYkp3L1p2eTVtQUhXQzlvVStjVGlZaEptU2ZLc0N5dDFjR1Z4aXNLdStOeW1FUUlBeWFDZ3VkL1YwOXFUM25rLzlzL1NXc1l0aGE3eU5wekJJTU00MHJDU0dhSjl1NmxFa2wwMHZYQmlFdDdwOVA1SUJDaWF2eW5FT3Y3RmdMcVBkZXF4UmlDd3VGVk1vbFNJVUJjb3lmVUMyZTJGSlNBVWdZZFZHRmYwYjBLbjJFWmxLOTd5eXhyVDJNVmd2dFJpa2ZkYUFXOFJ3RUVmTitCNy9lSzhiQmRwN1VScGJxbjF4Y3JDNmQyVWpkc0tiekNqQkZxa0trb1p0N01yaGc2WWFnRTdzcGtxajBqT3JXTStVR1EwTVVsRzJldlAxdUUxcDJ4U3Y0ZE1LMGRuYTZFTmNOVUYreGthSjdCNzY0TmR4TENwdXZoYmxsdFZSQWY3dks1cVB0dEovOVJZRlVVU0djTGRpYm56Nm1mN1drUE8zTWtVVWhSMm1BT3VHdjhJV3c1WEcxWnZvVk1ualNBWmU2VDdXWUE5OUdFTnhvSGtNaUt4SGxDdUs1R2QwSU5ySVNJbUhRclFtdjZGNG1xVS9UVFE4bkhNRHpDUml2S3lTUThkcWtwUWduVU1ud0lrYUF1YzYvRkdxMWh3M2IyU2JhMzk4QmhVd1VaU0FJTzhYWnZudUxkWTJuNmhPWHdzK2dxOUJIVUtjS0ZBNmt6NkZEbnB4TFBJQ2EzcUdobmM5N2JvMUZUL1hKazQ4THJrSEoyQ0F0QnYwUnROOTdOMjFwbGZwWEh2WjhnTUpiN1pjNGNmSTZNYlB3c1c3QWlsQ1NYTUZJRVVFbWlyOFhMRWtsQTB6dFliR3BUVEdxdHRwNWhwRlRUSXFVeWFBSXF2TVQ5QS94K0ppNWVqQTRCaHhiL2NsMXBVZE9ENmVwZDN5aWxJZE82ajI5N3hJbm9pQlB1RURXMi9VZnNsRHloR2tRczdXeTI1M2JWbmxUK1NXZzg5ellJSy85S1hGbDVmZStqb3cycmQ1Rlh2OHpEUHJtZk1YaVVQdDlRQk8vaUs0UUdiWDVqLzdSeDFjMXZ6c1k4T05iUDNsVklhUHJoTDQrMVFyRUNUTjNueUthdkdHMGdCQnRIdlRLaEdvQkhnTVhIU3RGb3dOK0hLclByaVl1K09aMDVGcm44b2tRclBhYXhvS1AxVUxDUy9jbUtGTjNnY0g3SFFsVmpyYUNlUW10amcxcFNReGV1cVhpU0tnTHB4Yy8xT2lac1U0K240bHo0aHBhaEd5V0JVUkxpNDY0Mm4xZ245cXo5YklzYUNlRVBKMHVKbWVuTVdwMnRKbUl3TFE2VlNnRFlFck9lQkNmU2o5UDRHL3ZJN29JRitsL241ZnA5NTZRZ3hHdnVyNzd5bmF3QXUzRzlNZEZiSmJ1NDlOWm5Xbm5GY1FIanhSdWhVWXZnMVUvZTg0TjRKVGVjY2lEQUtiL0tZSUZYemxveXVFMWVZWGY1NE1taGpUcTdCL3lCVG9EenpweDN0SkNUbzNIQ21WUFlmbXRCUmUzbVBZRUUvNlJsVEl4YmY0ZlNPY2FLRkdrNGdiYVVXZTQ0aFZrOVNaemhXODB5Zlc1UVdCSHhtdFV6dk1oZlZRbGk0Z1pUa3RJT1pkOW1qSjVoc2JtenR0YUhRQjI5QW0zZFprbXgzZy9xdllvY3loWjJQWEFXc05RaUlhZitROFcvTVdQSUs3L1RqdkN4NXEyWFJwNGxWV3lkTWMyd0lRa2hhZERCMHhzbncva1NFeUdqTEtqSTRjb1ZJd3R1YlRGM0U3TUo2TFM2VU9zSktqODJYVkFWUEpKY2VwZmV3YnpFOTFpdlhadk92WWZzbU1ldnd0UHBmTXpHbUM3V0pseVcyajBqaDdBRjFKTG13RUpTS1l3SXZ1NkRIYzNZbnlMSDlaZElCblErbk9WRFJpUCtSRXBxdisrdHlwWUhJdm9KeUlDR0E0MGQ4YlI3SFIyazdkbzZVUVRIRjRvcmlZZUlRYnhLZTRUaDYrL2wxQmpVdFM5aHFPUmgzTWJndllyU3RYVGZTd2FCT21BVlFaenBZTnFzQW1ReWpZNTZNVXF0eTNjL3hINkd1aE52TmFHOXZHYkc2Y1B0Qk04VUEzZThyNTFEMEFSOWtvekt1R0dTTWdMejNuQUh4RE5uYzdHVHdwTGo3LzZIZVdwMWlrc0RlVGp3Q0xweGVqdU10cE1uR0pnc2lrdTFzT0FDd1E5dWt6RVNpRFJONzdZTkVTeFI1THBoT2xjQVNYQTV1SXRzMUxuQkljbjFKN0JMV3M0OURNQUxTbnV6OTVnZE9yVFpyMHUxU2VZSGlubm8vcEU1OHhZb1hiVk8vUytGRU1NczVxeVdrTW5wOFEzQ2x5VGxaUDUyWTlucTdiOGZJVFB1VlhVazlvaEc1RUZIdzRnQUVjakZ4ZktiM3h1QXNFangyejF3eE5iU1pNY2dTOUdLeVczUjZLd0pPTmd0QTY0TFR5eFdtOEJ2dWRwME0xRmRKUEVHb3BNNEZ2ZzdHL2hzcHRraENmSEZlZ3Y0RU53eFBlWG1ZaHh3Wnk3anMrQmVNMjd0OU9EQk15blZDTEo3UldjQk10ZVpKdHZqT1lIYjVsT25DTFlXTkVNS0M1OUJBN2NvdnUxY0FOYTJQWEwwNWlHZHVmT3prZ0ZxcUhCT3JnUVZVbUxFYytNa3o0UnE4TzZXa05yN2F0TmtINE04ZCtTRDF0L3RTenQzb0ZxbCtuZVZzK0F3RUk1SmFCSmF4QVJ0WTJaNG1Lb1VxeGRzNFVwWjBzdjN6SWJOb28wSjRmaWhsZFFUWDNYTmN1TmNabWNyQjVMVFdNZHplUnVBdEJrM2NaSFlRRjZnVGkzUE51REowbm1SKzRMUExvSHZ4UUl4UmdKOWlOTlhxZjJTWUpoY3ZDdEppVldvODVUc3lGT3VxN0V5QlBKckFkaEVnRTBjVHExNkZRWGhZUEpGcVNmaVZuMElRblBPeTBMYlU0QmVHOTRRamRZTkIwQ2lRM1FheFFxRDJlYlNNaU5qYVZhdzhXYU00WjVXbnpjVkRzcjRlR3dlU0xhMkRFM0JXVmlheGhaRkljU1RqZ3hOQ0FmZWxnK2h6blZPWW9lNVZxVFlzMWc3V3RmVG0zZTQvV2R1QzZwK3FxQU04SDRaeXJKQ0dwZXdUaFREUGU2SDdDelgvelE4VG0rcjY1SGVabitNc214VWNpRVdQbEFWYUsvVkJhUUJXZm9HL2FSTC9qU1pJUWZlcC84OUdqYXNXbWJhV3plRVoyUjFGT2p2eUpUMzdPOUI4MDQ2U1JTS1ZFblhXbEJxYmtiNVhDUzNxRmV1RTl4YjkrZnJFa254V0I1aDFEL2hydXoyaVZERUFTNytxa0V6NU90NWFnSEpjN1dDZFk5NFdzNjFzVVJjWDVuRzhVRUxHQkFIWjNpKzNWdWxBeVQwbktOTno0SzJMQkhCV0pjVEJYMXd6ZisvL3Uvai85Ky8vdjg3KzkvbDlMYmgvTC91eU5ZaVRzV1YyTHdzamFBNk14VHV6Rk1xbXhXOEp3LytJcHBkWDh0L0NsZ2kxckkxU04wVUMvcjZ0WC80bFVjMlZWMU9RUmVTZUNzalVwS1pjaHc0WFVjakhmdzZyeUNWM1I4czZWWG02N3ZwNG4rbGNQVjlnSndtYktRRXNtckppOWMydmt3cm04SEZiVllOVGFSR3E4RDkxdDluNStVK2FEL2hOdE4zSGpDL25DL3ZVb0dGU0NrWFArTmxSY21MVXFMYmlVQmw0TFlmMVUvQ0N2d3RkM3J5Q0g4Z1VtR0lUQXhpSDFPNXJuR1R6N3kxTHVGam1uRkdRMVVXdU03SHdmWHRXbDJmUEZLa2xZd05VcEYySUwvVG1hUkVUalFpTTVTSmFjSSszR3Y1TUJVOGxQNUlvNmdXa2F3cHl6TkVWR3FPZHg0WWxPMWRDdmpiV0ZaV2JDbWVpRktQU2xNS3RLY01GTHMvS1F4dGdBSGk3TlpOQ1EzMmJCQVcybWJIZmxWWjh3WEtpMUpLVkhrVzIwYm5ZbmwzZEtXSmVXSk9pWDNvS1BCRDZaYmkwWnZTSXVXa3RVSEI4cURSOERNTWgxWmZrQkw5RlM5eDVyMGhCR0xKOHBVQ0p2M05ZSCtBZThwNDBtWldkNW01ZmhvYkZqUWVRdnFUVDRWS1dJWWZSTDB0ZmFYS2lWbDc1aEhSZXVUSkVjcVZsdWcrZU9JSWM0YmRJeWR0bjJLMGlOWlBzWVdRdlFpbzJxYk8zT3FBbFBIRERPQjdEZmpHRWZWRjUxRnFxTmFjZDZRbWdGS0pwTWZMcDVESFR2NHdYbE9OS1ZYRjl6VEpwRFY0bTFzWVpxSlBob3Rjc2xpWk04eWtzS2tDa3pwaVh0K0VjUlF2U1FxbUJTOVdkV2t4TVRKWFBTdzk0anFJM3ZhckNqUXhUYXpqbE1IOGpUUzhpbGFXODAxNC92d0EvTE5hK1lpRm95eXgzcy9Lc3dQM084UVcxanRxNDV5VE0vRFg5YThNNHZvVFZhTzJlYnZ3MUVvb0R3L3lnNlkxZmFZK1d3cmRWczVZdDBoUTVFd1JmWVhTRnhyYXkxWXZTTStrWW1scExHMi85bW0xTWZtYktIWHI0NEloOG5WS2IxTTUzN1pBTlVrQ3Rkc1BaODBKVktWS2FiVkhDYWRhTFhnK0lWOGk1R1N3cFp0aTBoNmRpVGFLczlzZHBVS0VwZDdqRFVwWW1IdGlYMzNTS2lPM3R1eWRrYXhBN3BFYzlYSVFFT2ZXSmxzemo1WXBMNWJLZVF5VDdhWlNCT2FtdlNIbDh4c1d2Z28yNklQL2JxayswRUpVeitna2tjdmxVbHlQcDJrZEtGdHQ3eTVhQ2RrczlaSkpjRnA1WldlYVdLZ3RuWE1OM09Sd0dMQkUwUHRrRUllazVGWTJhVnNzVVpIdHNXSXZubGpNVkp0dVZJanBadXAvNVZMMXlQT0hXV0hrT01jNll5U1dNY2tjekQ1alVqMm1sTFZxdUZhTVU4bGVHVmFxZVhpcythUlJMOHptNFd1Qms2Y3lXZkdNeGd0cjh1c2VRRXg3ay9QdlJvWnlkOW5kZTFHVUNWODRnTVg4T2d1L0JXZXpZUFNSMjdsbHpRbkE5N29vMHBZeXhvYllVSmZzait5c1RtOXpKK1M0cGswVEdvOVZURzBLanFZaFRtQUxmb0RaVktsYTJiNXlodjI0MVB4RmFMSnMzaTA1SzBBQUlkY0d4Q0pabVQzWmRUN0NsaVI3cStrdXI3V2RRanlnWXRPV1JMOUI4RTRzNExJOEtwQWo3YkUwZGc3RExPYVgrTUdlQWkwaE1NU1NXWkV6K1J1ZFhiWkNzR1lTMFFxaVhqSDlYUWJkOHNDQituSVZUcTcvVC9GRFMreldZOXE3WjJmZHExdGRMYjZ2M2hLS1ZEQXc1Z2pqNm85cjF3SEZST2RIYzE4TUpwNFNKMlVjdnUraVE5RWdrZWtXOFZDTStwc002eSsvMlNCeTh0Tk40YTNMMU16UCtPTHN5dkVTbzVnUzdJUU9uSXFNbXZpSkJWYzZ6YlZHMW44ZVhpQTNqNDZrbXZ2dEpsZXd3TkRyeGs0U2JKT3RQL1RWL2xJVks5dWVTaE5iYk1IZnduTFRMTGhiWnVPNzllYzVYdmZnUndMRksrdzFyNVpXVzE1clZGWnJFK3dLcU5SdjVLcXNMTmZwR2dub1VVNlk3MU54RW1ON015cXdxQVFxb0lVTE93L0xidVVCMit1RTc1Z0p0K2txMXFZNExveFYrcVIvemFsdXBlYTNENStXTWVhUkluMHNBSTZERFdEaDE1OGZxVWI0WWhBeGhSRWJVTjBxeXlKWWtCVTRWMktBUlhEVDY1Z1czZ1JzaXY3eFNQWUVLTHd6Z3JpV2NXZ1ByMHNiWm52N20xWEhORlc2eFBkR05aVWR4RmlVWWxtWE5qRFZXdXU3TENrWC9uVmtyWGFKaGlZa3RCSVNDMnhnQlhRbk5FUCtjcHRXbDFlRzYyYTdDUFhybnJrVFE1QlFBU2JFcVVaV01EaVpVaXNLeUhEZUxGT2FKSUxVbzVmNmlEdDRaTzhNbHFhS0x0bzBBbVRIVlZia0d1eVBhMVIveXdac1dSb1JEb1JkTk1NSHdZVHNrbE1WbmxBZDJTMDI4MmJnTUk4ZmlKcERoNjlPU0w2SzNxYm8yMEtmcE5NdXJuWUdRU3Ivc3RGcVo3aFlzeEtsTG5LQUtoc21COEFJcEVRNGJkL05yVExUWGVmc0U2Q2hSbUtXalhLVmdwR29QczhHQWljZ0tWdzRLMHFnRGd5MUE2aEZxMVdSYXQzZkhGK0ZrVStiNkg0TldwT1UzS1hUeHJJYjJxU0hBYitxaG04aGlTUk9pLzlvZmFwanhoeUt4eG50UHBnZTZLTDVaNCtXQk1Za0FjRTYrMEhkM1loMnpCc0syTVYzaVcwWTZjdk9Dcm9YbFJiMk1NSnRkV3grM2RrRnpHaDJQZTNEWjlRcFNxcGFSL3JFMUltT3JIcVlZeWNjcGlMQzIyYW1KSWpSV1ZBaGVyVGZwUUxtbzYvSzJwbmE4NUdyRHVRUGxIMVRzYXI4aXNBSmJYTGFmU3dPb2Y0Z2c5UmtBR20vb1lwQlFRaVBVb3lEazJCQ1ExaytLSUxxNDhFckZvNFdTUmhITHEveTdtZ3czK0w4NVBwUDZ4V3I2Y2dwOXNPallqS2FnT3J4RjE0OHVodWFXdGpldDk1M2ZoMUlRaUV6Z0MrZDJJZ0JDY1VacWdUQUlDbTJiUjhvQ2pETEJzbWcrVGh5aGZEK3pCYWxzS0JZMUNlNTRZL3Q5Y3dmYkx1OVNGd0VncGhmb3BOQTN5TnhneURhZlVNM21ZVG92Wk5nUEdkZDRaRkZPajF2dGZGVzN1N04raUhFTjFIa2Vlc0RNWEtQeW9DRENHVk1vNEdDQ0Q2UEJoUTNkUlpJSHkwWS8zTWFFNXpVOW1UQ3J3d25ab2p0RStxTnBNU2tKU3BtR2UwRXpMeUZlbE1KcWhmRlE3YTUwdVh4WjhwQ2Myd3h0QUtXZ0hvZWFtUjJPN1IrYnE3SWJQWUl0TzBlc2RSZ29UYVkzOGhaTEo1eTAyb0lWd29Qb2tHSXp4QU1EdWFuUTF2bjJXRFEwMFJoNm81UU9hQ1J1OTlmd0RiUWNOMFhBdXFrRnB4VC9jZnozc2xHUlZva3JOVTBpcWlNQUpGRWJLU2NaZG1Ta1RVem5DMFUrTWZ3Rk9HZExnc2V3UnlQS3dCWllTbXk2VTMyNWlVaEJRTnhiQUMzRkxLRFY5VlNPdVFwT091a0ovR0FtdS90eUViWDlEZ0VwNmR2MXpvVTBJcXpwRzZnc3NTaklZUlZQR2dVMVFBUVlSZ0lUOGdFVjBFWHIxc3FlaDJJNnJYanRtb0NZeUVEQ2UvUGtGRWkvUTQ4RnVUMjlwNTU3aU4rTEN3azVDSy9DWjJXZEFkZlFaaDJaOVFHcnpQTFNOUmo1aWdVV3psOVZpMHJDcUg4RzFLcDRRTUxrdXdNQ0F5cGR2aURYeU9JazBBSFRNOEhCWUtoM2IwL0YrRHhvTmo0WmRvWmZDcFFWZG5aYXJxb01hSFduTUxOVmN5ZXZ5dEdzclhRRW9JYnVicVdZTm83TlJIemRjMHp2VDIxZldWaXJqN2czNml5NnB4b2dmdmdIcDF4SDFUdXJiejhReXlIblhlQkppY3BZVWN0YnpBcHd6WjFIVCtGUEVYTUFnVVpldGdlR013dDRHK0RIaURUMkx1K1BUMjFmakpDQWZWMTZhL1d1MVBxT2tVSFNUS1loV1c2UGhoSFVsTnRXekZuQTdNYlkrcjY0dmt3ZHBmTkIySmZXZ1dYQXZremQ0Mks0bE45eDdXcmc0a0lLZ1hDYjRtY1c1OTVNQ1BKL2NUZlBBTVFNRld3bnF3ZGU0dzhIWllKRnBRd2NTTWhqVno0QjhwNm5jU0NOMVg0a2x4b0lINEJOMko2dGFCTWo2bEhrQU9zOEpKQW1YcTV4c1F0clBJUElJcC9IRzZpMjF4TUdjRmdxRFhTUkYweFFnMTRkMnV5NkhnS0UxM0xTdlFlNTJvU2hGNUp4MVI2YXZ5TDR0aGhYUVpIZkM5NG9aenVQVUJLRllmMVZ2RGF4SXJ0VjZkTkdTeDdETzBpMXA2Q3pCa3VBbUVxeVdjZVFZN0Y5K1UwT2JZRHpvYTFpS2FvL2NPRC92NlE5Z0hycnIxdUNlT2s4ZlNUOU1HMjNVbDBLbU0zcitXbjZIaTZXQWNMN2dFZWF5a2ljdmdqemtqU3dGc0FYSVI4MVp4NFFKNm9vc1Z5SmtDY1QrNHhBbGRDY2locXZUZjk0SEhVUFhZcDNSRUlhUjRkaHBRRjYrRksxSDBpOWk3UHZoOG93dTNsTzRQVDFpdXF1K0RrTDJCajkra2RmR0FnMlRYdzAzaU5IeW9ieG9mTEUyaWJqc1lEUGdlRVFsUk1SN2FmWGJTR1FjblBqSTJEK3NkdG11UTc3MWRiQVNVc0RuZFU3dDU4anJyTkdSeklTdndpb0FsSHM1RkErY0JFNUNjem5rZDhOTVY2QlI2a3NuS0xQWm5NVWF3UkRVMU1aL2liM3hDZGtUYmxIS3U0YmxOaXlsSDVuMjEzeU0wenViRWllMG80Smh6Y2ZBeTNINXFoMmwxN3VMb29CTkxhTytnem9uVEgydUY4UFF1OUV5SCtwakdzQUNUTXk0Y0h6c1BkeW1VU1hZSk9NUDN5VGtYcXZPL2xwdnQwY1g1ZWtERXU5UFVmQmVaT0RrRnVBalhDYUdkaTZldzRxeEo4UG1GZndtUHBrZ1FqUWxXcW9tRlk2VWtqbWNuQXRKRzc1RVZSK05wekdwUDFFZjVxVVViZm93ckMzemNTTFgzQnhnV0VnRXgvdjljUDhIOHUxTXZ0OS9yTURZZjZzandVMXhTT1BCZ3pGRWVKTE1SVkZ0S281UUhzVVlUOFpSTENhaDI3NTk5RXVxb0M5UFlqWU82YW9BTUhCOFgxT0h3RUFZb3VIZkhCM255YjJCK1NuWnhNL3Z3L2JDdE9SakxNU3k1YVpvRXB2Z2RHdmxKZk5QRlV1L3A3WjRWVksxaGlJMC9VVHVCM1pQcTRvaEVibTdNbnRnYzFldkV0a25hb3NnWlN3bkRDMkJkTW1pYnBlZzQ4WDhJeGwrLzgreFhkYnNoUVhVUFB2eDhqVDNma0VMaXZIU21xYmhibGZORlNoV0F5UW5KM1dCVTZTTVlTSXBURG1IamRMVkFkbEFEZHo5Z0NwbFp3Nm1UaUhxRHdJc3hibTlFckd1c2lWcGcydzhRM2toS1YvUjlPajhQRmVGNDNobVcvblNkOTluWnpoeWpDWDNRT1pra0I2QnNINEg4NjZXR3l2OUUwaFZBelBZYWgydGtSZlFaTW1QMnJpbmZPZVFhbGdlMG92aGR1QmpKczlhMUdCd1JlZXJjZWlmeTQ5Y3RPaDUvNjVBVFl1TXNBa1ZsdG12VExCazRvSHBkbDZpK3A4RG9OajRGYjJ2aGRGWWVyMkpTRWlsRXdQZDVuNXpOb0dCWEVqcmVnL3doMk5Gbk5SYUlVSFNPWGE0ZUpSd3lnWm9YNnZuV25xVmRDUlQxQVJ4ZUZyTkJKK3RzZG9vTXdxblloRTd6SXhuRDhwWkgrUDBOdTF3V3hDUFRBRGZOV21xeDYyNklCSkpxNk5lYXBjR2VPbWJ0WHZsMFRlV0cwWTdPR0dWNCtFSFR0TkJJVDVXZDBCdWpsN2luWGdaZ2ZYVE01ZWZEM3FEVEo1NE85djNCa3YrdGRJUmxxMWtYY1ZEMEJFTWlybUZ4Z2xOUHQ1cGVkYjFBbnh1Q1lNQ2hVeWt3c1RJV3FUMjNYRHB2VGlLRXJ1MWNUY0VNZW5pQitIUURlaHhQWE5ta290RmR3VVBuaWxCL3U0Tng1WGM2bDhKOWpIMUVnS1pVVXQ4dDhjeW9abGVEQkV0OG9pYkRtSlJBb01LSjVPZTlDU1dTNVpNRUp2YWNzR1ZkWERXanAvWXBlNXgwcDlQWEIyUEF3dDJMUkQzZCtmdE5ncHV5dnhsUDhwQjg0b0IxaTczdkFWcHd5cm1YVzcyaGZXNkR6bjlKa2o0KyswVlE0ZDBLU3gxQXNEQTRPdFhYRG82My93K0dEK3pDN3c1U0pheHNtbmxZUlE0ZGdkakE3dFRsMktOTG5wSittdmtvRHh0dDFhNG9QYVgzRVZxajk2bzlzUktCUXFVN1pPaXVwZUFJeUxNRCtZM1l3SHgzMFhXSEI1Q1FpdzdxM21qMUVEbFAyZUJzWmJ6NzlheVVNYnlIUTdzOGd1NExnaXAxTGlHSmo3TlFqOTA1LytyZ1VZS0FBNXFkcmxIS0lrbldtcWZ1UitQQjhSZEJrRGcvTmdubFQ4OUc3MmgyTnZ5U25qN1V5QndEK21pL0lXczF4V2J4dVZ3VUlWWHVuNWNNcUJ0RmJyY2NJK0RJTGpzVlFnNmVlcTBpdGlSZmVkbjg5Q3Z5RnRwa3hhYXVFdlNBTnVabUIxcDhGR1BiVTk0SjltZWR3c1o5SGtVWWptSTdPSDVIdXhlbmRMYnhUYVlyUHVJZkUyZmZYRktob05CVXAzM0hzRkFYbUNWL1Z4cHE1QVlnRm9ScjVBeTkzWkxSbGdhSVBqaFpqWFpaQ2hUK2FFNWlXQVhNWDBvU0ZRRXR3aml1aFFRSXRUUVg1SVlyS2ZLQitxdWVUTnBsUjFIb2ZsbzUvSTZhUFBtQUN3UUNFMmpUT1lvNUR6MWNzN1NvZDBLVEcvM2tFREdrM2tVYVVDT04xOXhTSkNhYjNrTnBXWmhTV2tPOGwrU3BXNzBXbjNnMGNpT0lKTzVKWG1hNmRib3M2anlpc3V4WHdVVWhqMisxdUdoY3Z1bGlLdFd3c1VUdzRnaTFjL2RpRUVwWkhvS294VEJlTURtaFBoS1R4N1RYV1Jha1Y4aW1KUjM1NURjSUhrUjlJUkVIeG9oUDRUYnlSNUx0RlUyNHVtUlBSbUVZSGJwZTFMZ2h5eFB4N1lnVUhqTmJiUUZSUWhoNEtlVTFFYWJYeDhGUzNKQXhwMnJ3UkRvZVdrSmdXUlVTS3c2Z0dQNVUyUHVPOVY0WnVpS1hHR3pGUXVSdWYrdGtTU3NiQnRSSktoQ2kzRU51TGxYaFBialRLRDRkalhWbmZYRmRzNlpiKzFYaVVyUmZ5YXlHeEpxMStTWUJFZmJLbGdqaVNtazBvcmdUcXpTUytEWjVyVHFzSmJ0dGlOdHArS01xR0UyQUhHRnc2alFxTTV2RDZ2TXB0bVhWOU9BanE0OVVmL0x4OU9wYW0rSG41TzlwOHFvQkJBUWl4elFaNGVOVmtPOXNQekpBTXlSMXk0L1JDUVExczBwVjVLQVU1c0tMdzN0a2NGYkkvSnFyakNzSzRNdytXOGFvZDRsaW9ZdWF3VWlDeVZXQkUvcVBhRmk1Ym5rZ3BmdS9hZTQ3MTc0ckkxZnFRb1RiVzBIclU2RkFlanE3QnlNMFY0emtaVGcwMi9ZSksyTjdoVVFSQ2VaNEJJZ1NFcWdEOFhzanpHNkxJc1NidUhvSWR6L0xoRnpiTm4xY2xjaTFOSFdKMC82L084SEpNZElwRVpicWkxUnJyRmZvby9ySS83dWZtMk1QRzVsVUkwSVlKNE1BaUhSVFNPRkoyb1R2ZXJGSFlYVGhrWUZJb3lGeDZyTVlGZ2FPS000eE5XZGxPbkljS2Ivc3VwdHB0Z1RPVGRWSWY0WWdkYUFqSm5JQW00cU5OSE5RcXFBenZpNTNHa3lSQ0Vvc2VVQnJIb2hac2pVYmtSOGdmS3RjLytPYTcybHd4SjhNcTZIRGZEQVRiZmJKaHplSXVGUUpTaXcxdVpwckhselVmOTBXZ3FHNzZ6TzBlQ0IxV2RQdjFJVDZzTnh4aDkxR0VMMllwZ0M5N2lrRkh5b2FIOTJuZHdkdXFaNklZamtnMjBEWDMzTVdkb1prN1FrY0tVQ2dpc0lZc2xPYWFMeXZJSXFSS1dRajE2akUxRGxRV0pKYVBvcFdUSmpYZml4RWpSSkpvOGc0Kyt3dVFqYnErV1ZZanNxQ3VOSVFXM1lqbnhLZTJNNVpLRXFxK2NYN1pWZ25rYnNVM1JXSXlYQTFyeHY0a0dlcnNZSmpELy9hdWxkWEdtY0ViY2ZUZUYxNlkxNzA4RkIxSElmbVd2NmRTRmk2b0Q0RStSSWpDc0VaK2tZN2RLbndSZUpKdzN4Q2pLdmkza0dONDJydnloVWxJejBCcCtmTlNWNXh3Rml1QnpHMjk2ZTVzL29Ib0Z0VXlVcGxtUHVsSVBsK2UxQ1FJUVZ0amx6THp6emJWK0QvT1ZRdFl6bzVpeHRNaTVCbUh1RzROL3VLZkprNVVJUkVwNysxMm9abEt0UEJvbVhTekFZMEtndGJQenpab0hReHVqblJFVWdCVStPL2pLS2hneFZoUlB0YnF5SGlVYVJ3UnBIdjdwZ1JQeVVybkU3ZllrVmJsR21mVFkyOHRGQ3ZsSUxDMDRUejNpdmtOV1ZhekErT3NZcnh2Uk0vaGlObjhGYzRiUUJlVVpBQkd4NVMveEZmOUxiYm1rMjk4WDdpRmcyeWVpbXZzUXFxSitoWWJ0NnVxK1pmOWpDK0pjd2ljY2Q2MU5LUXRGdkdXcmdKaUhCNWx3aTZmUjhLellTN0VhRUhmL2thOUVDN0g4RCtXRWEzVEVBQ0hCa05Tai9jWHhGZXE0UmxsQytmVUZtMnh0c3RZTEwybm9zMURmenNDOXZxRERkUlZjUEEzSG85NWFFUUh2RXhWVGhYUHF5bTY1bGxrS2xmUlhiUFRSaURlcGR5bEhqbVY5WVRXQUVqbEQ5RGRRbkNlbTdBai9tbDU4T24zNjYzOTIyMTRCNXpybVF6Lzl5U0cybUZxRXdqcTVzRmw1dFlKUHc1aE56OGx5WlBVVHNyNUUwRjJDOVZNUG5aY2tXUDcrbWJ3cC9CaU43ZjRrZjd2dEduWkYySkd2aksvc0RYMVJ0Y0ZZNW9QUW5FNGxJQVlWNDlVM0M5U1AwTENZLzlpL1dJRks5T1Jqek05a0cvS0dyQXV3Rm1nZEVwZExhaXFRTnBDVEdaVnVBTzY1YWZrWTFoMzNocnF5TGpaeTkySkszL3R3ZGo5cGFmRmN3ZlhPTm1QUVdsZFBsTWU3amxQMjRKczB2OW04YklKOVRnUzJJdVJ2RTlaVlJhQ3dTSllPdEFmTDVIL1lTNEZmektXS2JlaytHRnVsaGV5S3RETmxCdHJkbXIrS1UraWJIVGRhbHpGVW1NZnh3M2YzNngrM2NRYkpMSXRTaWxXOWN1dlpFTWpLdzk4N2p5a1pSbHNIL1VJK0hsS2ZvMnRMd2VtQkVlQkZ0bXhGMnhtSXRBL2RBSWZRK3JYbm04OGRxdlhhK0dhcE9ZVnQvMndhRmltWEZ4M1RDMk1VaU9pNS9NbCszcmovWVU2SWh4MmhYZ2lEWEZzVWVRa1JBRDZ3RjNTQ1BpMmZsazdYd0tBQTR6Ym9xeW51RUxEMzEyRUo4OGxtREVWT01hMVcvSy9hOHRHeWxaUk1yTW9JTHlvTVF6emJESkhOWnJoSDc3TDlxU0M0MkhWbUtpWjVTMDAxNlVUcDgzZ09oQ3d6OVhJdEs5ZmdYZkszRjVkN25aQ0JVZWtvTHhydXRRYVBIYTE2UmpzYTBnVHJ6eWpxVG5tY0ljcnhnNlg2ZGtLaXVjdWRjMERENVc0cEpQZjB2dURXOHI1L3V3MjRZZk11eEZScEQyb3ZUMm1GWDc5eEg2SmYrTVZkdjJUWXFSNi85NTVRZ1ZQZTNKQ0QvV2pBWWNMQTl0cFhnRmlFamdlMko1bGplSS9pVXpnOTFLUXVIa0lJNG1tSFp4QzNYUU9STEFDNkc3dUZuNUxPbWxuWGtqRmRvTzk3Nm1vTlR4RWxTOEhkeFdvUEFrampvY0RSMTM2bTJsK2Y1dDZ4YWFOZ2RvZE92VHUwcmlldm5oTkFCNzlXTnJWczZFc1Bna2dmYWhGOWdTRnp6QWQrckpTcmF3NU1sbGl0N3ZVUDVZeEE4NDNsVXB1Ni81akFSMFJ2SDRyUlhrU2czbkUrTzVHRnlmZStMMHM1cjNrMDVGeWdoU0ZuS280VFRnczA3cWo0blRMcU9ZajZxYVc5a25KVERrRjVPRk1ZYm1DUCs4SDE2VHk0ODJPanZFUlY2T0Z5dzA0M0w5dzNob0ppNDA4c1IrU0dvMVd2aVhVdThkN3FTK2VoS2pwS3d4ZUN0aHNtMkxCRlNGZWV0eDB4NEFhS1B4dHAzQ3hkV3FDc0xyQjFzL2o1VEFoYzFqTlpzWFdsNnRqby9XRG9ld3h6ZzhUOE5uaFoxbmlVd0wvbmhmeWdMYW5DblJ3YUZHRHlMdytzZlpoeVoxVXRZVHA4VFlCNmRFN1IzVnNLS0g5NUNVeEo4dThOKzl1Mi85SFVOS0hXM3gzdzVHUXJmT1BhZmsydzVxWnE4TWFIVDBlYmVZM3dJc3Azck45bHJwSXNXOWMxd3MzVk5WK0p3TnowTG85K1Y3elpyNkdENTZXZTZnV1ZJdnRtYW01R1BQa1ZBYnI3NHI2U3dodUwrVFJYdFcvMHBneVgxNlZObDQvRUFENTBUblVQdXdyVzZPY1VPMlZsV1hTMGlucTg3MmtrN0dVbFc2by9vekZLcStTaXA2TGNUdFNEZkRyUFRjQ0hoeDc1SDhCZVJvbitLRzJ3Und6ZkRnV2hBTG1pV09NTzZoM3BtMVVDWkVQRWpTY3lrN3RkTHg2V3JkQTJOMVFUUEVOdk5uaENRalc2a2wwNTcvcXY3SXdScnlIclpCQ3dWU2JMTG5GUmlIZFR3azhtbFlpeEZ0MXNsRWNQRDdGVmh0MTNIeXFWZXlENTVIT1hyaDJFbEF4Snlpbkdlb0Z6d0tBOTF6ZnJkTHZEeEpTanptSW1mdlRpc3JlSTI1RURjVmZHc214TFZiZlU4UEdlLzdObVdXS2pYY2RUSjExakFsVklZL0J2L21jeGcvUTEwdkNId0tHMUdXL1hiSnE1bnhEaHlMcWlvcm43V2Q3VkVWTDhVZ1Z6cEhNalErWjhEVWdTdWtpVndXQUtrZVRsVlZlWjd0MURHbkNnSlZJZEJQWkFFSzVmOENEeURObzd0SzQvNURCamRENU1QVjg2VGFFaEdzTFZGUFFTSTY4S2xCWXk4NEZpZXZkVTlnV2g2WFpydWd2dENabWk5dmZkNmRiNlY3Rm1vRWNSSG5HMzZWWkg4TjRhWmFsZHE5elphd3QxdUJGZ3hZWXgrR3MvcVcxandBTmVGeStMQ295bXlNNnpnRzdqOGJHelV5TGh2cmJKa1RZQUVkSUNFYjRrTUt1c0tUOVYzZUl3TUxzamRVZGdpak1jKzdpS3JyK1R4clZXRzBVK1c5NVNHcnhueEdyRTRlYUpGZmd2QWpVTTRTQXk4VWFSd0U5ajZaUUg1cVlBV0d0WEJ5dkRpTFNEZk9EMHlGQTNVQ01LU3lRMzBmeXkxbUlSZzRaY2daSExOSFdsK2M5U2Vpak92Yk9KeG9ReTdsVE4ycjNZOHA2b3Z4dlVZNzRhT1lidVZlenJ5cVhBNlUrZmNwNndTVjlYNS9PWktQMTh0QjU2VWEwZ015eEpJN1h5TlQ3SXJxTjhHc0I5ckwva1A1S01yalh4Z3FLTERhK1Y1T0NINmE1aG1PV2VtTVVzZWE5dlFsOXQ1T2NlNzZQclR5VHY1MEV4T3FuZ0UzUEhQZlNMLy9BSXRQZEI3a0dueVRSaFZVVUZOZEpKMno3UnRrdFp3Z21RemhCRy9HN1FzalptSmZDRTdrNzVFbWRJS0g3eGxubURyTk0vWGJUVDZGemxkY0gvcmNSR3hsUHJ2NHFEU2NxRTdKU21RQUJKV3FSVC9UVWNKU3dvUU0rMWp2RGlndnJqakg4b2VLMmluMVMrL3lPMWo4eEF3cy9UNXUwVm5JdkFQcWFFMWF0TnVOMGN1UmxpTGNIMmowblRMNEpwY1I3dzlReWEwSm9hSGdzT2lBTExDQ3pSa2wxVVVFU3oremUvZ0lYSEd0RHdnWXJLNnBDRktKMXdlYlNEb2c0elRsUGtnWFpxeGxRRGlZTWpoRHB3VHRCVzJXeHRoV2JvdjlkdDJYOVhGTEZtY0YrZUVjMVVhUTc0Z3FaaVpzZGo2M3BIMXFjdjNWeThKWWNpb2dJVktzSjhZeTNKOXcvR2hqV1ZTUUFtclMwQlBPV0srUktWKzBsV3FYZ1lNbklGd3BjWlZEN3pQU3A1NDdpOUhsZmxCOGdWblNUR21tcTFDbE8wODFPVy9VSDExcEVRTWZrRWRERnpqTEMxQ2RvL0JkTDNzN2NYYjhKKytIenoxcmhPVVZaRklQZWhSaVo4Vll1Nis3RXI3ajVQU1p1OWcvR0JkbU56Sm15Q0Q5d2lzd2o5Qlp3K1QzaUJyZzgxcmUzNmloTUxqb1ZMb1djKzYyYTFVLzdxVlg1Q3B2VFZGN3JvY1NBS3d2NGNCVnFabTdsTERTL3FvWHM0Zk1zL1ZRaTZCdFZiTkEzdVN6S3BRZmpIMW8zeDRMcnZrT240MHpobTZoamR1RGdsekpVd0EwUE9hYmdkWEluZHA5ZnpoT28yM1BlK1JrOUdTTFgwZDcxUG9xcnk4TlFEVHpObHNhK0pUTkc5K1VyRWYrbmd4Q2pHRXNEQ2MwYnordWRWUnlIUUkxam1FTzNTK0lPUXljRXE3WHdCNnozd2ZNZmE3M204UFZScCtpT2d0WmZlU0JsMDF4bjAzdk1hUUpreWo3dm5oR0NrbHNDV1ZSVWw0eSs1b05VelE2M0IyZGJqREYzdmlrZC8zUlVNaWZQWW5YNUdsZnVrMkZzVi83UnFqSTl5S1RiRTh3SlkrNzRwN3FYTzgrZElZZ2p0TEQvTjhUSnRSaDA0Tjl0WEpBNEg1OUlrTW1MRWxndnIwUTVPQ2VWZmRBdCs1aGtoNHBRZ2ZSTUhwTDc0WGF0TFFwUGlPeUhScy9PZG1IdEJmOG5PWmN4Vkt6ZEdjbElOMTZsRTdrSitwVk1qc3BPSSs1K1RxTFJPNm0wWnBOWEpvWlJ2OU1QRFJjQWZKVXROWkh5aWcvczJ3d1JlYWtGZ1BQSndDUW11MUkzMC90Y0JiamkrTmE1M2kxVzFOK0Jxb1k3WnhvK1UvTTlYeUo0T2syU1NrQnRvT3J3dWhBWTNhMDNFdTZsOHdGZElHMWNOK2U4aG9wVGtpS0YwOTNLdUgvQmNCMzlyTWlHRExuNlhWaEdLRWFhVC92cWIvbHVmdUFkcEdFeGV2RjErSjlpdGtGaENmeW1Xcjl2R2IzQlRLNGo1OTh6Ukg3K2UrTVU5bWFydVpxYjBwa0d4UkRSRTFDRDRaOExWNHZoZ1BpZGs1dzJCcTgxNmczbkh3MS8vajNKU3R6N05SOUhJV0VMTzhUTW4zUXJQL3pacC8vK0R2OXA0Mjkvb2d2K0dBVFIrbi9VZEYrbnM5eE5rWFpRSlhZNHQ5ak1rSk5VRnlnQXR6bmRYd2pzcyt5V0g5SEFuTFFRZmhBc2tkWlMybDAxSExXdjdMN3VzNXVUSDQwOXBxaXR2ZlNPUWcvYytadDdrODc5UDNLOStXVjY4bjcrM2NaZnVSZC9kRFBQLzAzcm4rZCsvbkJ2V2ZnRGx0OCtMempxSi92eDNDbk5Pd2lYaGhvNzc4Qzk2aUQrMVRCdlJaWWVQK0VIODFMRTB2VndPT3JtQ0xCM2lLekkxeCt2SkVzclBINHVGMFVCNFRKNFgzdURmT0NvM1BZcFllME1GNGJvdWgwRFEvbDQzZnhVRjdZK2RwV3V2VFNmZkIweU8yVVFVRVRJL0x3Q1pFM0J2bmV2SjdjOXpVbFkzSDU4eHprZTZETkZEUUc4bjBXdERONExBWU40bm9nS2F2MWV6T2ZLL3ordDZ0c0NUcCtkaHg0eW1qV3VDSmsxZEVVaWZEUCtIeVM0aVAvVmc5QjJqVG85TDROYmlCdURTNG51dUhXNkgrSkRRbjJKdHFSS0drRVFQRVlFN3V6YXpYSWtjeElBcVVxMWVzYXNaQkVUbEVaWTd5N0pvK1JvVi9Jc2pZOWVJTWtVdnI0MkhjMHhxdHNhdlp2aHoxT0x3U3hNT1R1cXpsaGIwV2JkT3dCSDlFWWl5QmphdHo0MGJVeFRIYmlXeHFKMHVtYTE5cWhQcnV2Y1dKbGJpU1NINDhPTEREcGFIUHN6dnljdDQxWmZUdTEwK3Zqb3g2a09xSzZ2MEsvZ0VQcGhFdk1sL3Z3U3YrQTRIaG0zNkpTUDlJWFR5Q1pEbTRrS3NxRDVheThiMVNhZC92YWl5TzVOL3NEZkVWNlo0cTk1RSt5Zmp4cHFCb0JFVFcyQzd4bDRwSU8yYkRPRERGdXJVUHdFN0VXQzJVcGxxK0FIbUJIdmlyMlBTZ2tSMTIvUnk2NU8wYVp0UVBlWGk5bVRsRi9XajVHUSt2RmtZeWhYc0xUanJCU1A5aHdrNEdQcURQNXJCbjUvbDhiMG1MUkF2UlN6WEhjMjkzYnMzczhFc2RFM20yZXh4aWRXVkI0am9IUitTK2R6NS9XK3YwMEszVHFOMTRDREJ0aDhlV2NzVGJpd1hQc3lnSGRHaWQwUEVkeTZISG0ydi9JVXVWNVJWYXBZbXpHc1g5MG1wbklkTkdjT09xNjREYmM1R1ViWXBEOU03Uys2Y0xZLy9RbWp4RkxQNWN1VEZSbTN2QTVya0Zacm9Gbk8zYmpIRjM1dVUzczhtdkw3VHA5bnlUYzRteW1USjVzTElwN3VtU25Ha08yM2ZhZWh0ejNtbVRTN2ZiVng1clA3eDNIWElqUk5lcS9BM3hDczlKTkIwOGM5UzlCRjJPM2JPdXIwSXRzbEZ4WGdSUGRhYXBCSWk0ZFJwS0d4Vno3aXI2OXQvYmM5cVR4anZ0T3lHT2ZpTEdEaFI0Zll5d0h2MVdkT3BseElWODdUcExCeTNXYzBRUDBQOXM0RzdGQk5PZElUUy90ZXAzbzNoMVRFYTVYRERpaTdmV3RxUnpVRVJlUDJmYnh6N2JIV1dKZGJJT3hPVUpadEl0TlpwVEZSZmo2dm05c1lqUnhRVk8rV1RkaU9oZFBlVEorOFlpclB2b2VMODhsNWlMWU9IZDNiL0lta3ErMVpOMUVsM1Vpa2hmdHV0ZUVZeGYxV3Vqb2Y4UHI0SUNUdTVlelp5WjR0SFFNeGx6VUhMWU8yVk1Pb05NR0wvMjBTNWkybzJvYmZrKzhxcWRSN3h6YlJEYmdVMGxudUlnejRMZWxRNVhTN3hiTHVTUXROUzk1djNaVU9kYVV4L1FkOHF4Q3Q2eGYyRTYyeWIvSHVrTE82UnlvclY4S2dZbDVZTmM3NXkrS3ZlZnJ4WStsYy82NHk5a3ZXUDBhMGJEei9yb2pxK1JXak8wNldlcnVXcU5GVTdyM0hQSWNMV1JxbDhJQ1pzejJMcy9xT20vQ0xuNisrWCtRZjdtR3NwWUNyWm9kL2xwbDZSdzR4Ti95dXE4Z3FWNEI2YUhrMWhWRTFTZklMeFd1NWd2WHFiZkFSWVFwc3BjeEtwMUYvYzhYT1B6a1p2bW9Tdyt2RXFCTGRycTFmcjN3QVB2NU5uTTlpOEYramRBdXhrUDVaNzFjNnVoSzNlbmxuR3ltcjdVc1daS0MxMnFnVWlHOFhYR1E5bXhucXo0R1NJbHliRjllWG1icWoyc0hYK2ExamYwZ1JvT05IUmRSU3JJcTAzVHk4OWVRMUdiVi9CaytkdTQrVjE1emxzK3Z2RVJ2WjRFN1pibnhXVFZqRGpiNG8vazhqbHc0NHBUSXJVR3h4dUp2QmVPK2hldWhPanBGc082bFZKL2FYbkpEYS9iTTBRbDFjTGJYRS9QYnYzRVozdmozaVZyQjVpcmp1cFpUemxudjY3N05ySTlVTllOcWJQZ3AvSFpYUytsSm1rODd3ZWMrN1lPeFREbzJhdzJsM05mRHIzNFZObHZxV0pCa251SzdvU2xaNi9UMTB6dU9vUFpPZW9JazgxTitzTDg0M1dKMlE0WjBmWjNzY3NxQy9KVjJmdWhXaTFqR1VSU0taVjYzN2xmNTNYbm54MTYvdktFWFk4OWFWSjBmdjkxakdkZkcrRzQrc25pd0hlczRoUyt1ZE9yNFJmaEZoRy9GNWdVRzM1UWFVK01jdUxtY2xiNVpXbVIrc0c1VjZuZitQeFl6bHJuRkd4cFphSzhlcXFWbzBOZm1BV29HZlhEaVQvRm5VYld2ekdET1RyOGFrdE9aV2c0Qll2ejVZSDEyWmJmQ2NHdE5rK2REQVpOR1d2SG92K1BJT25ZOVByamc4aC93TFJyVDY5c3VhTVZaNWJOdUswMGxTVnBucVNYMU5PTi84MUZvUDkyclluZGlvbndnT2lBOFdNZjR2YzhsMTVLcUVFRzR5QW0yK1dBTjVCcmZ1MXNxOXN1V1lxZ29hamdPWXQvSkNrMWdDOHdQa0srWEtDdFJYNlRBdGd2cm51QmdOUm1uNkk4bFZEaXBPVkI5a1g2T3hrcDRaS3lkMU02R2o4L3YyVTdrK1lRQkw5NUtiOVBRRU51Y0piMEpsVzNiNXRPYk43bS9aMWoxZXYzODhkN28xNXpnWHNJOUNpa0FHQVZpUjZsa0p2N25iNEFrNDBNMkc4VEo0NDdrTitwdmZIaU9GalNVU1A2UE0rUWZiQXl3S0pDQmF4U1Z4cGl6SHNlWlV5VUJocTU5dkZ3cmt5R29SaUhibzBhcHdlRVplU0x1TmlRK0hBZWtPbmFyRmcwMGRaTlhhUGVvSFBUUlIwRm1FeXFZRXhPVmFhYU84YzB1RlVoN1U0ZS9VeGRCbXRobEJEZ2cyNTdRMzNqMWhBN0hUeFNlVFRTdVZuUFpiZ1cxbm9kd21HMTZhS0JES3hFZXR2N0Q5T2pPMEpocmJKVG5vZStrY0dvREphekZTTzgvZlVOOUp5L2c0WEs1UFVrdzJkZ1BER3BKcUJmaGU3R0ErY2p6ZkUvRUdzTU0rRlY5bmo5SUFoclNmVC9KM1FFNVRFSVl5azVVanNJNlpaY0NQcjZBOEZaVUY0ZzlubnBWbWpYOTBNTFNReXNJUEQwbkZ6cXdDY1NKbUliNW1ZdjJDbWsrQzFNREZrWlF5Q0JxNGMvWWFpOUxKNnhZa0dTL3gyczUvZnJJVzJ2bUcyV3J2MEFQcENkZ0NBOXNuRnZmcGU4dWMwT3dkUnM0Rzk5NzNQR0VCblFCNXFLckNRNm02WC9IN05Jblo3eS8xNjc0L1pYT1ZwN09ldUNSazhKRlM1MTZWSHJuSDFIa0lVSWxUSWxqakhhUXRFdGtKdG9zWXVsNzdjVndqazNnVzFBamFhNnpXZXlIR0xscGszVkhFMlZGelQyeUkvRXZsR1VTejJIOXpZRTFzNG5zS010TXFOeUtOdEwvNTlDcEZKa2k1Rm91NlZYR204dldBVEVQd3JVVk9Mdm9BOGpMdXdPelZCQ2dIQjJDcjVWNk93RVd0SkVLb2tKa2ZjODdoK3NOSFR2TWIwS1ZUcDUyODRRVFB1cG9XdlFWVXdVZW9nWlIza0JNRVNZbzBtZnVrZXdSVlBLaDUrcnpMUWI3SEtqRkZJZ1doajF3M3lOL3FDTm9QSThYRmlVZ0JOVDFoQ0hCc0F6OEw3T3l0OHdRV1VGajkyT05uL0FQeUpGZzhoenVlcW9KZE5qNTdST3JGYmZmdVMvWHhyU1hMVFJnajV1eFpqcGdRWWNlZU1jMndKcmFoUmVTS3BtM1FqSGZxRXhUTEFCMmlwVnVtRThwcWNadjhMWVhRaVBISHNnYjVCTVc4ek01cHZRaXQrbVF4OFhHYVZEY2ZWYkx5TVRsWTh4Y2ZtbS9SU0FUL0gwOVVRb2w1Z0l6N3JFU0RtbnJRNGJVUklCNGlSWE1EUXd4Z2V4MUdndER4S3AySGF5SWtSK0UvYURtQ3R0Tm0yQzZseXRXZGZPVnpENlgyU3BEV2pRRGxNUnZBcDFzeW1XdjRteTFiUENEK0UxRW1Hbk1HV2hOd215Y0puRFYyV3JRTnhPNDV1a0ViMDhBQWZmaXpZS1ZVTHAxNUk0dmJOSzVEeld3Q1NVQURmbUtoZkdTVXFpaTFMMlVzRThyQjdtTHVIdVVKWk94NCtXaWl6SEJKL2h3Ym9hQnpocE5PVnZnRlRmNWNKc0hlZjdMMUhDSTlkT1VVYmIrWXhVSlduNmRZT0x6K1RIaTkxa3pZNWR0TzVjK2dyWDd2MGpFYnN1b09Hbm9JcmVESWcvc0ZNeUcrVHlDTEljQVdkMUlaMVVORnhFOFVpZTEzdWNtNDBVMmZjeEMwdTNXTHZMT3h3dStGN01XVXNIc2R0RlFaN1crbmxmQ0FTaUFLeWg4cm5QM0V5REJ5dnRKYjZLYXg2L0hrTHpUOVN5RXlUTVZNMXpQdE0wTUpZMTREbXNXaDRNZ0QxNUVhOUhkMDBBZGtUWjBFaUc1TkFHdUlCelFKSjBKUjBuYStPQjdsUUE2VUt4TWZpaElRN0dDQ25WejY5NFF2eWtXWFR4cFMyc29EdStzbXJ1MVVkSXhTdkFzekJGRDFjOGM2Wk9vYkE4YkppSkl2dXljZ0lYQlFJWFd3aHlUZ1pEUXhKVFJYZ0V3Uk5BYXdHU1hPMGExREtqZGloTFZOcC90YUUveFloc2d3ZStWcEtFRUI0TGxyYVF5RTg0Z0VpaHhDbmJmb3lPdUpJRVh5MkZJWXcrSmpSdXN5YktsVTJnL3ZoVFNHVHlkdkN2WGhZQmR0QVh0UzJ2N0xrSHRtWGgvOGZseTFkbzhGSS9EMGY4VWJ6VmI1aCtLUmhNR1NBbVIybWhpMFlHL3VqN3dneGNmekNyTXZkaml0VUlwWERYOGFlMkpjRi8zNnFVV0lNd042SnNqYVJHTmorakV0ZUdEY0Z5VFViOFgvTkhTdWNLTUpwN3BkdXh0RDZLdXhWbHl4eHdhZWlDMUZiR0JFU084NGxieXJBdWdZeGRsKzJOOC82QWdXcG8vSWVvQU9jc0czNUlBL2IzQXVTeW9hNTVMN2xsQkxsYVdsRVd2dUNGZDhmOE5mY1RVZ3pKdjZDYkIrNm9oV3dvZGxrOW5HV0ZwQkFPYXo1dUVXNXhCdm1qbkhGZURzYjBtWHdheWozbWRZcTVneHhOZjNIMy90bkNnSHdqU3JwU2dWeExtaVR0dXN6ZFJVRklzbjZMaU1Qakw4MDh2TDF1UWhEYk03YUE0M21JU1hSZXFqU3NreW5JUmNIQ0o5cWVGb3BKZng5dHF5VW9HYlN3SmV4LzBhREUzcGxCUEd0TkJZZ1diZExvbTMrUS9iamRpelIyL0FTL2MvZEgvZDNHN3B5bDFxRFhndE9GdEVxaWR3THF4UFl0ck5FdmVhc1dxM3ZQVVV0cVRldThncG92NGJkT1FSSTJrbmVGdlJOTXJTaHlWZUV1cEsxUG9MRFBNU2ZXTUlKY3MyNjdtR0I4WDlDZWhRQ0YwZ0l5aHBQMTBtYnlNN2x3VzFlNlRHdkhCVjFzZy9VeVRnaEhQR1JxTXlhZWJDNnBiQjFXS05DUXRsYWkxR0d2bXE5elVLYVV6TGFYc1hFQll0SHhtRmJFWjJrSmhSMTY0TGhXVzJUbHAxZGhzR0U3WmdJV1JCT3gzWmN1MkR4Z0grRzgzV1RQY2VLRzBUZ1FLS2lpTk5PbFdndnFORWJucms2ZlZEK0FxUmFtMk9ndVpiMFlXU1RYODhOK2kvRUxTeGJhVVVwUHg0dkpVellnL1dvblNlQTh4VUs2dTdEUEhncHFXcEVlNkQ0Y1hnNXVLOUZJWVZiYTQ3Vi9uYit3eU90ayt6RzhSclM0RUEwb3V3YTA0aUJ5UkxTdm9KQTJGemFvYmJadFhucThHZGJmcUVwNUkyZHBmcGo1OVRDVmlmNitFNzVwNjY1ZmFpWDhnUzIxM1JxQnhUWnFmSFA0Nm5GNk5TZW5PbmV1VCt2Z2JMVWJkVEgyL3QwUkVGWFpKT0VCNkRIdng2TjZnOTk1NkNZclkvQVljbTlnRUxKWFlrclNpKzBGMGdlS0RaZ09DSVlrTFUvK0dPVzVhR2o4bXZMRmd0Rkg1K1hDOGh2QUUzQ3ZIUmZsNG9mTS9Rd2s0eDJBK1IrbnljOWdOdS85VGVtN1hXNFhSbnlSeW1mNTJ6MDljVE9kcitQRzYrUC9WYjRRaVhsd2F1YzVXQjF6M28rSUpqbGJ4SThNeVd0U3pUK2s0c0tWYmhGM3hhK3ZEdHMzTnhYYTg3aWl1K3hSSDljQXBybk9MMmg2dlY1NGlRUlh1T0FqMXM4bkxGSzhnWjcwVGhJUWNXZEYxOS8yeGFKbVQwZWZya05Ea1dicEFRUGRvOTJaOCtIbi9hTGpiT3pCOUFJL2sxMmZQczlIaFVOREoxdTZheDJWeEQzUjZQeXdON0JyTEoyNno2czNRb01wNzZxenp3ZXRyREFCS1NHa2ZXNVB3UzFHdllOVWJLNnVScXhmeVZHTnlGQjBFK091Z01NOGtLd21KbXVwdVJXTzhYa1hYWFFFQ3lSVnc5VXlJcnRDdGNjNG9OcVhxcjdBVVJCbUtuNktoejNlQk45Nkx3SUpyQUdQOW1yLzU5dVRPU3g2MzFzdXlUK1F1akRkNGJlVUZwWjBrSkVFbmpsUCtYL0tyMmtDS2huRU5UZzRCc01UT21NcWxqMldNRkxSVWxWRzBmemRDQmdVdGE5b2RySmZwVmRGb21UaTZhazB0RmpYVGNkcXF2V0JBempZNmhWckg5c2J0M1o5Z24rQVZEcFRjUUltZWZiQjRlZGlyanpyc05pZXZ2ZTRaVDRFVVpXVjNUeEVzSVcrOU1UL1JKb0tmWlpZU1JHZkMxQ3dQRy85cmRNT004cVIvTFVZdnc1Zi9lbVVTb0Q3WVNGdU9vcWNoZFVnMlVlUGQxZUN0RlNLZ3hMU1o3NjRveTRsdlJDSUg2Ym93UHhaV3d4TkZjdGtzTGVpbDQ3cGZldmNCaXBra0JJYzRuZ1pHK2t4R1o3MWE3MktRN1ZhWjZNWk9aa1FKWlhNNmtiL0FjMC9Ya0p4OGR2eWZKY1diSTN6T05FYUVQSVc4R2JrWWpzWmN3eStlTW9LcllqRG12RUVpeEh6a0NTQ1JQUnpoT2ZKWnVMZGNieDE5RUwyM01BOHJualRaWjc4N0ZHTW5rcW5wdXpCNS85MHcxZ3RVU1JhV2NiMGV0YTgxOThWRWVaTVVTZkloeXVjNC9ueXdGUTl1cW43amRxWGgrNXd3ditSSzlYb3VOUGJZZG9FZWxOR28zNEt5eVN3aWdzcmZDZTB2L1BsV1B2UXZRZzhSMEtnSE8xOG1UVlRoaFFybGJFUTBLcC9KeFBkakh5UjdFMVFQdy91dDByK0hEREc3QndaRm05SXFFVVpScHYyV3B6bE1rT2VtZUxjQXQ1Q3NyenNrTEdhVk9BeHl5U3paVi9EMkVZN3lkTlpNZjhlOFZoSGNLR0hBV05zemYxRU9xOGZOc3Rpak1ZNEpYeUFUd1RkbmNGRnFjTkRmRG8rbVdGdnhKSnBjNHNFWnRqWHlCZG9GY3hiVW1uaUNvS3E1anlkVUhOallKeE1xTjFLellWNjJNdWdjRUxWaFMzQm5kK1RMTE9oN2R3cy96U1hXenhFYjROajRhRnVuNXg0a0RXTEs1VFVGL3lDWEIvY1pZdkk5a1BnVnNHMmpTaHRYa3hmZ1QreHpqSm9mWHFQRW5JWElRMWxuSWRtVnpCT005MEVYdkpVVzZhMG5aLzdYakpHbDhUb08zSC9mZHhueG1UTktCWnhua3BYTFZnTFhDWnl3R1QzWXlTNzV3L1BBSDVJL2pNdVJzcGVqOHhaT2JVOWtSRWJSQStrcWptS1JGYUtHV0FtRlFzcEMrUUxiS1BmMFJhSzNPWHZCU1dxbzQ2cDcwd3MvZVpwdTZqQ3RaVWdReTZyNHRITVBVZEFnV0dHVVlOYnV2LzFhNksrTVZGc2QzVDE4MytUOGNhcFNvNm0wK1NoNTdmRWVHLzk1ZHlrR0pCUU1qMDlEU1cyYlkwbVVvbkR5OWE4dHJMbm5MNUI1TFczTmw4ckpaTnlzTzhaYis4MHpYeHFVR0ZwdWQzUXp3YjdiZis4bXE2eDBUQW5KVTlwRFFSOVlRbVpobG5hMnh1eEp0MGFDTy9mMVNVOGdibE9yYkl5TXN4VGxWVVc2OVZKUHpZVTJIbFJYY3FFMmxMTHhuT2JadXoydFQ5Q2l2ZlRBVVlmbXpKbHQvbE9QZ3NSNlZONjQveFFkNEpsay9SVjdVS1Z2Mkd4L0FXc21UQXVDV0toZHdDKzRIbUtFS1laaDJYaXM0S3NVUjFCZU9iczFjMTN3cUZSbm9jZG11aGVhVFYzMGd2VlhaY291ekhLSzV6d3JONTJqWEpFdVg2ZEd4M0JDcFYvKys0ZjNoeWFXL2NRSkxGS3Fhc2pzTXVPM0IzV2xNcTJneVlmZEsxZTdMMnBPL3RSeWUybXd6d1pQZmRVTXJsNXdkTHFkZDJLdi93VnRucHlXWWhkNDlMNnJzT1YrOEhYUHJXSDJLdXA4OWwydHo2YmY4MGlZU2QrVjRMUk9TT0hlYW12ZXhSNTI0cTRyNDNyVG10RnpRdkFycHZXZkxZRlpyYkZzcEJzWE5VcXFlbmp4Tk5zRlhhdFp2bEloazd0ZVVQZksrWUwzMkY4TWNUbmp2MEJaTnBwYit2c2hvQ3J0TFhqSVdxM0VKWHBWWElsRzZaTkwwZGg2cUVtMldNd0RqRDNMZk9ma0doMS9jelljLzBxaGlEMm96Tm5INDg4Mk1WVnQzSmJWRmtid293TkNPM0tMNUlvWVc1d2xWZUdDVmlPdXYxc3ZaeDdGYnp4S3pBNHpHcUJsUlJhUldDb2JYYVZxNHlZQ1diWmY4ZWlKd3QzT1krTUZpU0plbmdjRlAydDBKTWZ6T2lKN2NFQ3ZweDduZWcxUmM1eCs3bXlQSk9YdDJGb2hWUnlYdEQrL3JEb1RPeUdZSW5KZWxaTWpvbGVjVkhVaFVOcXZkWldnMkoydDBqUG1pTEZlUkQvOGZPVDRvK05HSUxiK1R1ZkNvOWNlQkJtM0pMVm4rTU8yNjc1bjdxaUVYLzZXKzE4OGNZZzNabjVOU1RqZ09LZldGU0FBTmE2cmFDeFNvVlU4NTFvSkxZMTFXSW9ZSzBkdTBlYzVFNHRDbkFQb0toNzFyaVRzalZJcDNnS3ZCYkVZUWlOWXJtSDIyb0xRV0EyQWR3TW5JRDZQWDliNThkUjJRS280cWFnMUQxWitML0Z3RUtUUjdvc09aUFdFQ1BKSUhRcVBVc001aS9DSDVZdXBWUGZGQTVwSFVCY3Nlc2g4ZU81WWh5V25hVlJQWm4vQm1kWFZ1bVpXUHhNUDVlMjh6bTJ1cUhnRm9UOUN5bUhZTk5yenJyamxYWk0wNkhuekR4WU5sSTViL1Fvc3hMbW1ycURGcW1vZ1FkcWswV0xrVWNlb0F2UXhIZ2tJeXZXVTY5QlBGcjI0VkI2K2x4NzVSbmE2ZEd0cm1PeERudkJvanZpMS80ZEhqVmVnOG93b2ZQZTFjT254VTFpb2gwMTZzL1Z1ZHY5bWhWOWYzNUF0K1NoMjhoMWJwcDh4aHIwOSt2ZjQ3RWx4M01zNmh5cDZRdkIzdDB2bkxiT2h3bzY2MGNwN0swdnZlcGFiSzdZSmZ4RVdXZnJDMll6SmZZT2p5Z1B3ZndkLzFhbVRxYTBoWjV1ZWViaFdZVk11YlJUd0lqaiswT3Ewb2hVM3pmUmZ1TDhndDU5WHNIZHdLdHhUUVE0WTJxejZnaXN4bm0yVWRsbXBFa2dPc1p6N2lFazZRT3Q4QnVQd3IrTlIwMUxUcVhtSm8xQzc2bzFOMjc0dHdKdmwrSTA2OVRpTHBlbksvbWlSeGh5WThqdllWNlcxV3VTd2hIOXE3a3V3bkpNdG03SVdjcXM3SHNueUhTcVdYTFNwWXRaR2FSMVYzdDBnYXVuaW5GUFpHdFdza0Y2NXJ0dGk0OFVWOXVWOUtNOGtmRFlzMHBnQjAwUytUbHpUWFY2UDhteHExNWI5RW44c3ozaldTc3pjaWZaYS9OdXVmUE5uTlRiMDMxcHB0dDArc1JTSC83VUc4cHpic2d0dDNPRzN1dDdCOUp6RE10Mm1UWnV5Uk5JVjhENTRUdVRycE5jSHRnbU1sWUplaVk5WFM4M05ZSmljalJqdEpTZjlCWkxzUXY2MjlRZERzS1FoVEs1Q25YaHBrN3ZNTmtIelBobTBFeFcvVkNHQXBIZlB5QmFndFpRVFFtUEh4N2c1SVhYc3JRRFB6SVZodjJMQjZJaDEzOGlTRHd3MUpOSHJEdnpVeHZwNzNNc1FCVmhXOEViclJlYVZVY0xCMVIzUFVYeWFZRzRIcEpVY0xWeE1nRHhjUGtWUlFwTDdWVEFHYWJEemJLY3ZnMTJ0NVA4VFNHUWtyai9nT3JwbmJpREh3bHVBNzN4Ylh0cy9MN3U0NjhjUldTV1J0Z1R3bFFuQTQ3RUtnME9pWkRnRnhBS1FRVWNzYkdvbUlUZ2VYVUFBeUtlMDNlQTdNcDRnbnlLUW1tMExYSnRFazZkZGtzTUpDdXhEbW1Iem1WaE8rWGFOMkE1NE1JaDNuaXc1Q0Y3UHdpWEZacm5BOHdPZGVITHZ2aGRvcUlERzlQREk3VW5XV0hxNTI2VDh5Nml4SlBoa3VWS1pub1VydU9wVWdPT3AzaUlLQmprK3lpMXZIbzVjSXRIWGIxUElLekdhWmxSUzBnNWQzTVYycEQ4RlFkR1lMWjczYWFlL2VFSVVlUE1jNE5GejhwSVVmTENyckY0alZXSDVnUW5lTjNTOHZBTkJtVVhyRWNLR242aElVTjk1eTF2cHN2THdiR3B6VjlMMFpLVGFuNlREWE0wNTIzNnVMSmNJRU1LVkF4S05UMEs4V2xqdXdObnkzQk5RUmZ6b3ZBODViZUk5enIxQUdOWW5ZQ1ZrUjFhR25nV1VSVXJncVIrZ1JyUWh4VzgxbDNDSGV2anZHRVB6UE1UeGRzSWZCOWRmR1JiWlUwY2cvMW1jdWJ0RUNYNHR2YWVkbU5BdlR4Q0p0YzJRYW9VYWxHZkVOQ0dLN0lTL084Q1JwZE9WY2E4RVdDUnd2MnNTV0U4Q0pQVzVQQ3VnakNYUGQzaDZVNjBjUEQrYmRodFhadVlCNnN0Y292ZUU3U201TU0yeXZmVUhYRlNXN0t6TG1pNy9FZUVXTDB3cWNPSDlNT1NLamhDSEhtdytKR0xjWUUvN1NCWlFDUmdnb3gwWlpUQXhybHpOTlhZWEw1Zk5JamtkVDRZTXFWVXo2cDhZRHQwNDl2NE9YR2RnM3FUcnRMQlVYT1pmN2FoUGxaQVkvTys3U3AwYnZHU0hkeVE4QjFMT3NwbHFNYjlTZThWQUU3Z0lkU1p2eGJSU3JmbCtMazVRYXFpNVFKY2Vxaml0ZEVyY0hYZy8zTXJ5bGpQU0lBTWFhbG9GbTFjVndCSjhETm1rRHFvR1JPU0hGZXRyZ2pRNUNhaHVLa2RINXBSUGlnTXJnVHRsRkk4dWZKUEpTVWxHZ1RqYkJTdnBSYzB6eXBpVW42VTVLWnFjUm95cnR6aG1KNy9jYWVaa21WUndKUWVMT0c4TFk2dlA1Q2hwS2hjOEpzMEVsK242RlhxYng5SXRkdEx0WVA5MmtLZmFUTHRDaThTdExaZEVOSmE5RXgxbk9vejFrUTdxeG9pWkZLUnlMZjRPNENIUlQwVC8wVzlGOGVwTktWb2V5eFVYaHkzc1FNTXNKalFKRXlNT2ptT2hNRmdPbW1sc2NWNGVGaTFDbGRVOTJ5andsZWlyRUtQVzNiUEF1RWhSWlY3SnNLVjNMcjVjRVRBaUZ1WDVOdzVVbEY3ZDJIWjk2Qmgwc2dGSUw1S0dhS1NvVllWbHZkS3BaSlZQNStOWjd4REVrUWhtRGdzREtjaWF6SkNYSjZaTjJCM0ZZMmY2Vlp5R2wvdDRhdW5HSUFrL0JIYVMraStTcGRSZm5CL09rdE92eWppbldOZk05S3NyNld3dENhMWhDbWVSSTZpY3BGTTRvOHF1Q0xzaWtVMHRNb1pJLzlFcVhSTXBLR2FXem9mbDRuUXVWUW0xN2Q1ZlU1cVhDUWVDRHFWYUw5WEo5cUowOG4zRzNFRlpTMjhTSEViM2NkUkJkdE8wWWNUemlsM1Frbk5LRWUvc21RMWZUYjBYYnB5TkI1eEFldUlsZis1S1dsRVkwRHFKYnNuekpsUXhKUE9WeUhpS014NVh1OUZjRXYxRmJnNkZobTR0K0p5eTVKQzFXM1lPOGRZTHNPMFBYUGJ4b2RCZ3R0VGJIM3J0OUNwMWxKSWsycjNPMVpxdTk0ZVJibkl6MmY1MGxXb2xZenVLc2o0UE1vazRhYkhMTzhOQUM4ODRoaVh4NUZ5NXBXS08wYldMN3VFR1hhSkN0em5oUDY3U2xRNHhqV0lmZ3E2RXBaMjhRTXR1Wks3SkMwUkdibDluQTRYdEZMdWcvTkxNb0gxcEd0OUlvbkFKcWNFREx5SDZURFJPY2JzbUdQYUdJeE1vNDFJVUFuUVZQTVBHQnlwNG1PbWg5WlFNa0JBY2tzVUs1NUxzWmo3RTV6NVh1Wm95V0NLdTZuSG1EcTIyeEkvOVo4WWR4Snk0a1dwRDE2akxWcnB3R0xXZnlPRDBXZCtjQnpGQnhWYUd2N1M1azlxd2gvNXQvTFFFWHNScUkzUTlSbTNRSW9hWlc5R2xzRGFLT1V5eWt5V3VoTk9wclNFaTBzMUc0cmdvaVgxVjc0M0VFTHRpK3BKdTVvZzZYMGc2b1R5blVxbGhIOWs2ZXp5UmkwNU5HWkh6MG52cDNIT0pyN2VickFVRnJEamJrRkJPYkV2ZFFXa2tVYkwwcEV2TVU0Nlg1OHZGOWo5RjNqNmtweWV0TlVCSXRyRXViVzladk1QTTRxTnFMbHNTQkpxT0gzWGJOd3YvY1hEWE54TjhpRkx6VWh0ZWlzWVkrUmxIWU91UDI5L0NiK0wreHYrMzVSdjd4dWRuWjZvaEs0Y01QZkNHOEtJN2RObWpOay9INGU4NHBPeG4vc1pISzlwc2Z2ajhuY0E4cUp6N084eHFieEVTRGl2R0pPWnpGN281UEpMUTdnMzRxQVdveXVBK3gzYnRVOThMVDZaeUd5Y2VJWGpycW9iMkNBVnFsNFZPVFFQVVFZdkhWL2c0ekF1Q1pHdllRQnRmMHdtZDVsaWxydnVFbjFCWExueTAxQjRoNFNNRGxZc25OcG05ZDdtOWg1Nzh1ZnBlZjlaNFdwbHFXUXZxbzUyZnlVQTdKMjRlWkQ1YXY2U3lHSVY5a3BtSE5xeXZkZnpjcEVNdzk3QnZrblYyZnErTUZIdW45QlQzTHNmOHBienZpc1dpSVF2WWtuZys4VnhrMVYrZGxpMXU1NmtZNTBMUmphUGRvdHZUNUJ3cXR3eUYrZW1vL3o5SjN5VlVWR2ZLcnhRdEpNT0FRV29RaWkvNGRwOXdneWJTYTVta3VjbVJMdEVRWi9wejB0TC9OVmNnV0FkOTVuRVEzVGc2dE5idXluM0llcHo2NUwzaHVNVVVCbnRsbFd1dTREYnRPRlNNU2JwSUxWNGZ5NndsTTBTT3ZpNkNwTGg4MWMxTHJlSXZLZDYxdUVXQmNEdzFsVUJVVzFJMForbS9QYVJsWCtQUS9veGcwWWU2S1VpSWlURjRBRE5rNTlZZHB0NS9ya3htcTl0VjVLY3AvZVFMVVZWbUJ6UU5WdXl0UUNQNkV6ZDBHOGVMeFd5SHBtWldKM2JBemtXVHRnNGxabHc0MlNRZXpFbWlVUGFKVXVSL3FrbFZBLzg3UzRBckZDcEFMZFkzUVJkVXczRzNYYldVcDZhcTl6MHpVaXpjUGE3MzUxcDlKWE9aeWZkWkJGbnF0OTBWelFuZFhCL213ZjhMQzlTVGo1a2VuVnBOdXFPUVFQM21JUkpqN2VWMjFGeEc4VkF4S3JFbjNjK1hmbVo4MDBFUGI5LzVsSWxpanNjVWJCNmRhMFJRYU1vb2swenVnMUcwdEtpL0pCQzRydzcvRDNtNEFSekFrek1jVnJEY1QyU3lGdFVkV0FzRmxzUERGcVYzTitFanlYYW9FZVB3cm9hWkNpTHFFemI4TVcrUE5FOVRtVEMwMUV6V2xpNTFQelp2VXFrbXl1Uk9VK1Y2aWsrTGUvOXFUNm53elV6Zjl0UDY4dFllaTBZYURHeDZrQWQ3am4xY0txT0N1WWJpRUxIOXpZcWNjNE1uUkpqa2VHaXFhR3dMSW1oeWVLcyt4S0pNQmxPSjA1b3c5Z0dDS1oxVnBuTUtvU0NUYk1TK1grMjN5MDQyek9iNU10Y1kvNm9CZUFvMVZ5ODlPVHlocGF2RlA3OGpYQ2NGSDB0N0d4MjRoTUVPbTJnc0VmR2FiVnBRZ3ZGcWJRS01za25GUlJtdVBIY1p1MFN1L1dNRnBoWnZCMnIvRUdiRzcycnBHR2hvM2grTXN6MHVHeko3aE5LMnVxUWlFMXFtbjB6Z2FjS1lZWkJDcXN4VitzamJwb1ZkU2lsVy9iOTRuMnhOYjY0OFZtTklvaXpxRVdoQm5zZW4rZDBrYkNQbVJJdGZXcVNCZU9kOVduZTNjNmJjZDZ1dlhPSjZXZGlTc3VYcTBuZGhxclE0UW9XVWpDall0WjBFQWhuU09QMW00NHhrZjBPN2pYZ2hyelNKV3hQNGEvdDcyalUyOVZ1MnJ2dTRuN0hmSGtrbVFPTUdTUytOUGVMR081STczbUMyQjcrbE1pQlFRWlJNOS85bGlMSWZvd3VwVUZBYlBCYlIrbHhETTZNOFB0Z2gxcGFKcTVSdnM3eUV1TFF2LzdkMW9VMndvRlNiM0ZNUFdRT0tNdUN1SjdwRERqcEljbHVzNVRlRW9NQnkyWWRWQjRmeG1lc2FDZU1Oc0VnVEhLUzVXRFNHeU5VT29FcGNDMk9GV3RJUmYwdzI3Y2szNC9EanhSVFZJY2M5K2txWkU2aU1TaVZEc2lLZFAvWHo1WGZFaG0vc0JoTzUwcDFydkpEbGt5eXh1SjlTUGdzN1llVUpCalhkZUFrRStQOU9RSm02U1pubjFzdmNkdUk3OGRZbWJrRTJtdHppUHJjalZpc1hHNzhzcEx2YlphU0Z4L1Jrczl6UDRMS24wQ2R6LzNKc2V0a1QwNkE4Zi95Q2dNTzZNYjFIbWUwSko3YjJ3WnoxcWxlcVR1S0JHb2toUFZVWjBkVnUrdG5RWU5FWTFmbWtaU3o2K0VHWjVFekw3NjU3bXJlWkdSM2pVZmFFazQ1OFBEbmlCenNTbUJLaERSemZYYW1lcnlKdjkvRDVtNkhJcVowUitvdUNFNTREenA0SUp1dUQxZTREYzVpK1BwU09SSmZHMjN1VmdxaXhBTUR2Y2hNUjBuWmRINWJyY2xZd1JvSlJXdi9ybHhHUkk1ZmZENU5QR21JRHQ3dkRFMTQzNHBZZFZaSUZoODlCczk0SEdHSmJUd3JOOFQ2bGgxSFpGVE9CNGxXeldqNkVWcXhTTXZDMC9saldCUTNGMmtjL21PMmI2dFdvblQySkVxRXdGdHM4cnoyaCtvV05kczljZVIyY2I3elp2SlREcHBIYUVoSzVhdldxc3NlV2EyRHQ1QkJoYWJkV1NrdFM4MG9NUXJMNFR2QU05YjVITW15RG5PK09ra2JNWGZVSkc3ZVhxVElHNmxxU09FYnFWUitxWWRQN3VXYjU3V0VKcXp5aDQxMUdBVnNEaW5QczdLdlVlWEl0bGNNZE9VV3pYQkg2enNjeW1WMUxMVkN0YzhJZVBvanpYSEY5bTViNXpHd0JSZHpjeVVKa2l1OTM4QXBtQWF5UmRKclgxUG1WZ3VXVXZ0MlRoUTYyY3pJdFR5V0pNVzJBbi9oZERmTUs3U2lGUWxHSWRBYmx0SHozeWNvaDdqOVY3R3hOV0JwYnRjU2RxbTRYeFJ3VGF3YzNjYloreGZTdjlxUWZFa0RLZlpUd0NrcVdHSS91cjI1MEl0WGxNbGg2dlVOV0VZSWc5QTNHemJnbWJxdlROOGpzMllNbzg3Q1U1eTZuWjRkYkpMRFFKajlmYzd5TTd0WnpKRFpGdHFPY1U4K21aallscTRWbWlmSTIzaUhiMVpvVDlFK2tUMmRvbG5QMUFmaU9rdDdQUUNTeWtCaVh5NW12NjM3SWVnV1NLajlJS3JZWmY0THU5K0k3dWIrbWtSZGx2WXplaGgvamFKOW43SFVINWIySWJnZU5ka1k3d3gxeVZ6eFM3cGJ2a3k2K25tVlV0UmxsRUZmd2VVUTAvbkcwMTdXb1VZU3hzK2oyQjRGVi9GNjJFdEhsTVdaWFlyakdIcHRobk5iMXg2NkxLWjBRZTkySU5XSGRmUi92cXAwMndNUzhyMUc0ZEpxSG9rOEttUTc5NDdHMTNhNFlYYnNHZ0hjQnZSdVZ1MWVBaTQvQTUrWml4bWRTWE03M0x1cEIvTEg3Tzl5eExUVlhKVHlCYkkxUzQ5VElST3JmVkNPYi9jelo5cE00SnNaeDhrVXo4ZFFHdjdnVVdLeFh2VEg3UU0vM0oyT3VYWGdjaVVocVkrY2d0YU9saVFRVk9ZdGhCTFYzeHBFU1pUM3JtZkVZTlp4bXBCYmIyNENSYW84NnBybitpOVROT2g4VnhSSkdYSmZYSEFUSkhzMVQ1dHhnYy9vcFlyWThYamxHUVFiUmNveElCY25Wc01qbVUxeW1tSVVMNGR2aUpYbmRNQUowWWV0K2M3TzUyL3A5OHl0bG1Bc0dCYVRBbU1oaW1BbnZwMVRXTkdNOUJwdWl0R2ordDgxMENVMlVob3JyalBLR3RUaFZDOFdhWHcwNFdGblQ1ZlRqcW1QeXJRMHROM0NrTHNjdFZ5MnhyMFpXZ2lXVloxT3JsRmpqeEpZc09pWnYyY0FvT3ZFKzdzWTBJL1R3V2NacU1veUlLTk9mdHdQN3crK1JmZzY3bGpmb3ZLWWE1MGlmM2Z6RS84YVBZVmV5L05xMzUrbkgyc0xQaC9mUDVUc3lsU0tHT1o0azY5ZDJQbkg0MytrcSsrc1JYSFFxR0FyV2R3aHgraHB3UUM2SmdUMnV4ZWhZVTRaYnc3b05iNi9ITGlrUHlKUk9HSzJvdXlyK3Z6c2VFU3A5RzUwVDRBeUZyU3FPUTBycm9DWVA0c01ERkJySG4zNDJFeVpUTWxTeWs0N3JIU3E4OVk5L25JM3pHNWxYMTZaNWx4cGhndUxPY1pVbmRMOHdOY3JreWpIODJqcWc4Qm84T1lreW5yeFp2YkZubzVsVVMzT1ByOEtvM21YOU5vUlBkWU9LS2pEMDdidmdGZ3BaL1JGK1l6a1d2Si9Icy90VWJmZUd6R1dMeE5BamZEekhITVZTRHdCNVNhYlFMc0laSGlCcDQzRmpHa2FpZW5Zb0RkMThodTJCR3dPSzdVM283MEsvV1kva3V1S2RtZHJ5a0lCVWRHMm12RTkxTDFKdFRiaDIwbU9MYmsxdkNBYW11N3V0bFhlR1Uyb29WaWtiVS9hY3RjZ21zQzFGS2sycW1qM0dXZUlXYmo0dEdJeEU3QkxjQldVdnZjbmQvbFl4c01WNEY5MTdmV2VGQi9YYklOTjNxR3ZJeVRwQ2FsejFsVmV3ZElHcWVBUy9nQjhNaStzQStCcURpWDNWR0QyZVV1blRSYlNZK0F1RHk0RTNReDNoQWh3blNYWCtCMHp1ajNlUTFtaVM4VnV4MnovbDYvQmtXdGpLR1U3MmFKa09DV2hHY1NmMytrRmtrQjE1dkdPc1FyU2RGcjZxVGowZ0JZaU9sbkJPNDExNzBnT1dIU1VvQlZSVTJKandwcFlkaElGRGZ1N3RJUkhjY1NOTTVLWk9GRFB6MFRHTUFqenpFcGVMd1RXcCtrbjIwMWtVNk5qYmlNUUp4ODMrTFgxZTF0WjEwa3VDaEpaL1hCVVExZHdhQkhqVERKRHFPeW1wRWs4WDJNM1Z0VncyMUprc0NoQTh3MXRUZWZPM1JKMUZNYnFaMDFiSEhrdWREQi9PaExmZTdQNUdPSGFJMjhaWEtUTXVxbzBoTFdRNEhhYkJzR0c3TmJQMVJpWHRFVHowNzRlcjZ3L09lckpXRXFqbWtxMnk1MXExQlZJK0pVdWRuVmEzb2dCcHpkaEZFN2ZDN2t5YnJBdDJaNlJxRGpBVEFVRVllWUs0NVdNdXBCS1FSdFFsVSt1TnNqbnpqNlptR3JlekErQVNyV3hRNkxNa0hSWHFYd05xN2Z0djI4ZFV4L1pTSmNpRFhQMlNXSnNXYU4wRmpQWDlZa282TG9iWjdhWVcvSWRVa3RJOWFwVEx5SFM4RHlXUHl1b1p5eE4xVEsvdnRmeGszSHdXaDZKY3paQzhGdG4wYklKYXkyZytuNXdkN2xtOXJFc0tPK3N2cVZtaStjMWo4OGhTQ3hienJnNCtIRVAwTnQxL0I2WVcxWFZtMDlUMUNwQUtqYzluMThoanFzYUZHZGZ5dmExWkcwWHUzaXA2TjZKR3B5VFNxWTVoNEJPbHBMUGFPbnl3NDVQZFhUTitEdEFLZzdETHJMRlRuV3Vzb1NCSGszczBkN1lvdUpIcTg1L1IwOVRmYzM3RU5YWkY0OGVBWUxucTlHTGlvTmN3RFpyQzZGVzZnb2RCOEpucVlVUHZuMHBXTGZRejBsTTBZeThNeWJnbjg0RHMzUTliRFAxMGJMeU9WK3F6eGE0UmQ5RGh1N2NqdThtTWFPTlhLM1VxbUJROXFJZzdldEl3RXFNL2tFQ2svRHpqYTRCczF4UitRL3RDYmM4SUtyU0dzVGRKSjB2Z2U3SUcyMFc2ODd1Vm1LNmljV1E2Y0QzbHdGemdOTUd0RnZPNXF5SmVLZmxHTEFBY1FaT3JreFZ3eTNjV3ZxbEdwdmptZjlRZTZBcDIwTVBiVjkyRFBWME9oRk00a3o4WXIwZmZDMnpMV1NRMWtxWTZRZFFydHRSM2toMVlMdFFkMWtDRXY1aFZvUElSV2w1RVJjVVR0dEJJcldwNlhzNUVoaDVPVVV3STVhRUJ2dWlEbVVvRU5tblZ3MUZvaENyYlJwMUExRStYU2xXVk9UaTdBRFcrNU9oYjl6MXZLNHF4NVI1bFBkR0NQQkpaMDBtQytTc3A4VlViZ3BHQXZYV011V1FRUmJDcUk2UnIyanR4Wnh0ZlA3Vy84b256K3l6MEdzNzZMYVQ1SFg5ZWN5aVpDQi9aUi9nRnRNeFBzRHdvaG9lQ1J0aXVMeEUxR00xdlVFVWdCdjg2K2VlaEw1OC9QNTZRRkdRL01xT2UvdkM3Nkw2M2p6bWVheDRleGQvT0tUVXZrWGcrZk9KVUh5Y2g5eHQvOWdvSk1yYXBTZ3ZYcmo4Kzh2ay9OODBmMjJTZXdqNmN5R3F0MUI2bXp0b2VrbFZISHJhb3VodkhKYUcvT3VCejZESEtNcEZtUVVMVTFiUldseVlFMFJQWFlZa1V5Y0llbU43VEx0Z05DSlg2QnFkeXhES2tlZ083bkpLNXhRN09WWURaVE1mOWJWSGlkdGs2RFFYOUV0K1Y5TTdlc2dic1lCZEVlVXBzQjBYdncya2Q5K3JJN1YrbTQ3dStPL3RxN213NzI2MkhVMVdsUzl1RnpzVjZKeElITm1VQ3kwUVM5ZTA3N0pHUkZiRzY1ejMvZE9LQi9aayt5RGRLcFVtZFhqbi9hUzNONW52NGZLN2JNSEhtUGxIZDRFMitpVGJWNXJwelNjUm54azZLQVJ1RFRKOFExTHBLMm1QOGdqMUVidUo5Ukl5WStFV0s0aENpSURCQVMxVG0ySUVYQUZmZ0tQZ2RMOU82bUFhMDZ3akNjVUFMNkVzeFBRV085Vk5lZ0JQbS8wR2drWmJEeEN5bnh1algvOTJ2bUdjalpSTUFZNDVwdWFrMnNGTENMU3dYcEVzeXk1Zm5GMGpHSkJobStmTlNIS0tVVWZ5KzI3NkE3L2ZlTE9GeHhVdUhSTkpJMk9zZW54eXZmOERBR09iVDYwcGZUVGxoRWc5dS9LS2toSnFtNVUxLytCRWNTa3BGREE1WGVDcXh3WG1QYWMxamN1WjNKV1ErcDBOZFd6Yi81djFadkY4R3RNVEZGRWRRanBMTzBid1BiMEJITlduaXAzbGlEWEkyZlhmMDVqanZmSjBOcGpMQ1VnZlRoOUNNRllWRktFZDRaL09HLzJDK040MzVtbksrOXQxZ3ZDaVZjYWFIN3JLNCtQakN2cFZOaXordDJReXFIMU84eDNKS1pWbDZRK0xwL1hLOHdNalZNc2xPcTlGZFN3NUZ0VXMvQ3B0WEg5UFcrd2JXSGdyVjE3UjVqVFZPdEd0S0Z1M25iODBUK0UwdHY5UWt6VzNKMmRiYXcvOGRkQUtaMHB4SWFFcUxqbFByamkzVmdKM0d2ZEZ2bHFEODA3NXdveGg0ZlZ0MEpaRTBLVkZzQXZxaGUwZHFOOWIzNWp0U3BuWU1Ya1UrdlpxK0lBSGFkM0lIYzJzL0xZcm5EMWFuZkc0NklGaU1JcjlvTmJaRFd2d3RocVlOcU9pZ2FLZC9YbExVNFhIZmsvUFhJalBzTHkvOS9rQXRRKy93S0graEkvSVJPV2o1RlB2VFpBVDlmN2o0WlhReUc0TTBUdWpNQUZYWWtLdkVIdjF4aHlTZWtnWEdHcU54V2VXS2xmOGREQWxMdUIxY2IvcU9EK3JrN2Ntd3QrMXlLcGs5Y3VkcUJhblRpNnpUYlhSdFY4cXlsTnRqeU9WS3kxSFR6MEdXOXJqdDZzU2pBWmNUNVIrS2R0eVliMHp5cUc5cFNMdUN3NVdCd0FuN2ZqQmpLTExveExYTUkrNTJMOWNMd0lSMkI2T2xsSlpMSEo4dkR4bVdkdEYrUUpubXQxcnNIUElXWTIwbGZ0azhmWWVQa0FJZzZIZ241MzJRb0lwZWdNeGlXZ0FPZmU1L1U0NEFQUjhBYzBOZVpyVmgzZ0VoczEyVyt0VlNpV2lVUWVrZi9ZQkVDVXk1ZmRZYkEwOGRkN1Z6UEFQOWFpVmNJQjlrNnRZN1dkSjF3TlYrYkhleWROdG1DNkc1SUN0RkMxWndtSlUvajhoZjBJOFRSVktTaXo1b1lJYTkzRXBVSTc4WDhHWUlBWmFieDQ3L244TERBQUowbk50UDFycFJPcHJxS01CUmVjU2hjYTZxWHVUU0kzalpCTE9CM1ZwMzgxQjVyQ0doalN2aC9OU1ZrWXAycUlkUC9CZz1cIjtcbiIsIi8qIENvcHlyaWdodCAyMDEzIEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG5cbiAgIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cbiAgIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbiAgIENvbGxlY3Rpb24gb2Ygc3RhdGljIGRpY3Rpb25hcnkgd29yZHMuXG4qL1xuXG52YXIgZGF0YSA9IHJlcXVpcmUoJy4vZGljdGlvbmFyeS1kYXRhJyk7XG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgZXhwb3J0cy5kaWN0aW9uYXJ5ID0gZGF0YS5pbml0KCk7XG59O1xuXG5leHBvcnRzLm9mZnNldHNCeUxlbmd0aCA9IG5ldyBVaW50MzJBcnJheShbXG4gICAgIDAsICAgICAwLCAgICAgMCwgICAgIDAsICAgICAwLCAgNDA5NiwgIDkyMTYsIDIxNTA0LCAzNTg0MCwgNDQwMzIsXG4gNTMyNDgsIDYzNDg4LCA3NDc1MiwgODcwNDAsIDkzNjk2LCAxMDA4NjQsIDEwNDcwNCwgMTA2NzUyLCAxMDg5MjgsIDExMzUzNixcbiAxMTU5NjgsIDExODUyOCwgMTE5ODcyLCAxMjEyODAsIDEyMjAxNixcbl0pO1xuXG5leHBvcnRzLnNpemVCaXRzQnlMZW5ndGggPSBuZXcgVWludDhBcnJheShbXG4gIDAsICAwLCAgMCwgIDAsIDEwLCAxMCwgMTEsIDExLCAxMCwgMTAsXG4gMTAsIDEwLCAxMCwgIDksICA5LCAgOCwgIDcsICA3LCAgOCwgIDcsXG4gIDcsICA2LCAgNiwgIDUsICA1LFxuXSk7XG5cbmV4cG9ydHMubWluRGljdGlvbmFyeVdvcmRMZW5ndGggPSA0O1xuZXhwb3J0cy5tYXhEaWN0aW9uYXJ5V29yZExlbmd0aCA9IDI0O1xuIiwiZnVuY3Rpb24gSHVmZm1hbkNvZGUoYml0cywgdmFsdWUpIHtcbiAgdGhpcy5iaXRzID0gYml0czsgICAvKiBudW1iZXIgb2YgYml0cyB1c2VkIGZvciB0aGlzIHN5bWJvbCAqL1xuICB0aGlzLnZhbHVlID0gdmFsdWU7IC8qIHN5bWJvbCB2YWx1ZSBvciB0YWJsZSBvZmZzZXQgKi9cbn1cblxuZXhwb3J0cy5IdWZmbWFuQ29kZSA9IEh1ZmZtYW5Db2RlO1xuXG52YXIgTUFYX0xFTkdUSCA9IDE1O1xuXG4vKiBSZXR1cm5zIHJldmVyc2UocmV2ZXJzZShrZXksIGxlbikgKyAxLCBsZW4pLCB3aGVyZSByZXZlcnNlKGtleSwgbGVuKSBpcyB0aGVcbiAgIGJpdC13aXNlIHJldmVyc2FsIG9mIHRoZSBsZW4gbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBvZiBrZXkuICovXG5mdW5jdGlvbiBHZXROZXh0S2V5KGtleSwgbGVuKSB7XG4gIHZhciBzdGVwID0gMSA8PCAobGVuIC0gMSk7XG4gIHdoaWxlIChrZXkgJiBzdGVwKSB7XG4gICAgc3RlcCA+Pj0gMTtcbiAgfVxuICByZXR1cm4gKGtleSAmIChzdGVwIC0gMSkpICsgc3RlcDtcbn1cblxuLyogU3RvcmVzIGNvZGUgaW4gdGFibGVbMF0sIHRhYmxlW3N0ZXBdLCB0YWJsZVsyKnN0ZXBdLCAuLi4sIHRhYmxlW2VuZF0gKi9cbi8qIEFzc3VtZXMgdGhhdCBlbmQgaXMgYW4gaW50ZWdlciBtdWx0aXBsZSBvZiBzdGVwICovXG5mdW5jdGlvbiBSZXBsaWNhdGVWYWx1ZSh0YWJsZSwgaSwgc3RlcCwgZW5kLCBjb2RlKSB7XG4gIGRvIHtcbiAgICBlbmQgLT0gc3RlcDtcbiAgICB0YWJsZVtpICsgZW5kXSA9IG5ldyBIdWZmbWFuQ29kZShjb2RlLmJpdHMsIGNvZGUudmFsdWUpO1xuICB9IHdoaWxlIChlbmQgPiAwKTtcbn1cblxuLyogUmV0dXJucyB0aGUgdGFibGUgd2lkdGggb2YgdGhlIG5leHQgMm5kIGxldmVsIHRhYmxlLiBjb3VudCBpcyB0aGUgaGlzdG9ncmFtXG4gICBvZiBiaXQgbGVuZ3RocyBmb3IgdGhlIHJlbWFpbmluZyBzeW1ib2xzLCBsZW4gaXMgdGhlIGNvZGUgbGVuZ3RoIG9mIHRoZSBuZXh0XG4gICBwcm9jZXNzZWQgc3ltYm9sICovXG5mdW5jdGlvbiBOZXh0VGFibGVCaXRTaXplKGNvdW50LCBsZW4sIHJvb3RfYml0cykge1xuICB2YXIgbGVmdCA9IDEgPDwgKGxlbiAtIHJvb3RfYml0cyk7XG4gIHdoaWxlIChsZW4gPCBNQVhfTEVOR1RIKSB7XG4gICAgbGVmdCAtPSBjb3VudFtsZW5dO1xuICAgIGlmIChsZWZ0IDw9IDApIGJyZWFrO1xuICAgICsrbGVuO1xuICAgIGxlZnQgPDw9IDE7XG4gIH1cbiAgcmV0dXJuIGxlbiAtIHJvb3RfYml0cztcbn1cblxuZXhwb3J0cy5Ccm90bGlCdWlsZEh1ZmZtYW5UYWJsZSA9IGZ1bmN0aW9uKHJvb3RfdGFibGUsIHRhYmxlLCByb290X2JpdHMsIGNvZGVfbGVuZ3RocywgY29kZV9sZW5ndGhzX3NpemUpIHtcbiAgdmFyIHN0YXJ0X3RhYmxlID0gdGFibGU7XG4gIHZhciBjb2RlOyAgICAgICAgICAgIC8qIGN1cnJlbnQgdGFibGUgZW50cnkgKi9cbiAgdmFyIGxlbjsgICAgICAgICAgICAgLyogY3VycmVudCBjb2RlIGxlbmd0aCAqL1xuICB2YXIgc3ltYm9sOyAgICAgICAgICAvKiBzeW1ib2wgaW5kZXggaW4gb3JpZ2luYWwgb3Igc29ydGVkIHRhYmxlICovXG4gIHZhciBrZXk7ICAgICAgICAgICAgIC8qIHJldmVyc2VkIHByZWZpeCBjb2RlICovXG4gIHZhciBzdGVwOyAgICAgICAgICAgIC8qIHN0ZXAgc2l6ZSB0byByZXBsaWNhdGUgdmFsdWVzIGluIGN1cnJlbnQgdGFibGUgKi9cbiAgdmFyIGxvdzsgICAgICAgICAgICAgLyogbG93IGJpdHMgZm9yIGN1cnJlbnQgcm9vdCBlbnRyeSAqL1xuICB2YXIgbWFzazsgICAgICAgICAgICAvKiBtYXNrIGZvciBsb3cgYml0cyAqL1xuICB2YXIgdGFibGVfYml0czsgICAgICAvKiBrZXkgbGVuZ3RoIG9mIGN1cnJlbnQgdGFibGUgKi9cbiAgdmFyIHRhYmxlX3NpemU7ICAgICAgLyogc2l6ZSBvZiBjdXJyZW50IHRhYmxlICovXG4gIHZhciB0b3RhbF9zaXplOyAgICAgIC8qIHN1bSBvZiByb290IHRhYmxlIHNpemUgYW5kIDJuZCBsZXZlbCB0YWJsZSBzaXplcyAqL1xuICB2YXIgc29ydGVkOyAgICAgICAgICAvKiBzeW1ib2xzIHNvcnRlZCBieSBjb2RlIGxlbmd0aCAqL1xuICB2YXIgY291bnQgPSBuZXcgSW50MzJBcnJheShNQVhfTEVOR1RIICsgMSk7ICAvKiBudW1iZXIgb2YgY29kZXMgb2YgZWFjaCBsZW5ndGggKi9cbiAgdmFyIG9mZnNldCA9IG5ldyBJbnQzMkFycmF5KE1BWF9MRU5HVEggKyAxKTsgIC8qIG9mZnNldHMgaW4gc29ydGVkIHRhYmxlIGZvciBlYWNoIGxlbmd0aCAqL1xuXG4gIHNvcnRlZCA9IG5ldyBJbnQzMkFycmF5KGNvZGVfbGVuZ3Roc19zaXplKTtcblxuICAvKiBidWlsZCBoaXN0b2dyYW0gb2YgY29kZSBsZW5ndGhzICovXG4gIGZvciAoc3ltYm9sID0gMDsgc3ltYm9sIDwgY29kZV9sZW5ndGhzX3NpemU7IHN5bWJvbCsrKSB7XG4gICAgY291bnRbY29kZV9sZW5ndGhzW3N5bWJvbF1dKys7XG4gIH1cblxuICAvKiBnZW5lcmF0ZSBvZmZzZXRzIGludG8gc29ydGVkIHN5bWJvbCB0YWJsZSBieSBjb2RlIGxlbmd0aCAqL1xuICBvZmZzZXRbMV0gPSAwO1xuICBmb3IgKGxlbiA9IDE7IGxlbiA8IE1BWF9MRU5HVEg7IGxlbisrKSB7XG4gICAgb2Zmc2V0W2xlbiArIDFdID0gb2Zmc2V0W2xlbl0gKyBjb3VudFtsZW5dO1xuICB9XG5cbiAgLyogc29ydCBzeW1ib2xzIGJ5IGxlbmd0aCwgYnkgc3ltYm9sIG9yZGVyIHdpdGhpbiBlYWNoIGxlbmd0aCAqL1xuICBmb3IgKHN5bWJvbCA9IDA7IHN5bWJvbCA8IGNvZGVfbGVuZ3Roc19zaXplOyBzeW1ib2wrKykge1xuICAgIGlmIChjb2RlX2xlbmd0aHNbc3ltYm9sXSAhPT0gMCkge1xuICAgICAgc29ydGVkW29mZnNldFtjb2RlX2xlbmd0aHNbc3ltYm9sXV0rK10gPSBzeW1ib2w7XG4gICAgfVxuICB9XG4gIFxuICB0YWJsZV9iaXRzID0gcm9vdF9iaXRzO1xuICB0YWJsZV9zaXplID0gMSA8PCB0YWJsZV9iaXRzO1xuICB0b3RhbF9zaXplID0gdGFibGVfc2l6ZTtcblxuICAvKiBzcGVjaWFsIGNhc2UgY29kZSB3aXRoIG9ubHkgb25lIHZhbHVlICovXG4gIGlmIChvZmZzZXRbTUFYX0xFTkdUSF0gPT09IDEpIHtcbiAgICBmb3IgKGtleSA9IDA7IGtleSA8IHRvdGFsX3NpemU7ICsra2V5KSB7XG4gICAgICByb290X3RhYmxlW3RhYmxlICsga2V5XSA9IG5ldyBIdWZmbWFuQ29kZSgwLCBzb3J0ZWRbMF0gJiAweGZmZmYpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdG90YWxfc2l6ZTtcbiAgfVxuXG4gIC8qIGZpbGwgaW4gcm9vdCB0YWJsZSAqL1xuICBrZXkgPSAwO1xuICBzeW1ib2wgPSAwO1xuICBmb3IgKGxlbiA9IDEsIHN0ZXAgPSAyOyBsZW4gPD0gcm9vdF9iaXRzOyArK2xlbiwgc3RlcCA8PD0gMSkge1xuICAgIGZvciAoOyBjb3VudFtsZW5dID4gMDsgLS1jb3VudFtsZW5dKSB7XG4gICAgICBjb2RlID0gbmV3IEh1ZmZtYW5Db2RlKGxlbiAmIDB4ZmYsIHNvcnRlZFtzeW1ib2wrK10gJiAweGZmZmYpO1xuICAgICAgUmVwbGljYXRlVmFsdWUocm9vdF90YWJsZSwgdGFibGUgKyBrZXksIHN0ZXAsIHRhYmxlX3NpemUsIGNvZGUpO1xuICAgICAga2V5ID0gR2V0TmV4dEtleShrZXksIGxlbik7XG4gICAgfVxuICB9XG5cbiAgLyogZmlsbCBpbiAybmQgbGV2ZWwgdGFibGVzIGFuZCBhZGQgcG9pbnRlcnMgdG8gcm9vdCB0YWJsZSAqL1xuICBtYXNrID0gdG90YWxfc2l6ZSAtIDE7XG4gIGxvdyA9IC0xO1xuICBmb3IgKGxlbiA9IHJvb3RfYml0cyArIDEsIHN0ZXAgPSAyOyBsZW4gPD0gTUFYX0xFTkdUSDsgKytsZW4sIHN0ZXAgPDw9IDEpIHtcbiAgICBmb3IgKDsgY291bnRbbGVuXSA+IDA7IC0tY291bnRbbGVuXSkge1xuICAgICAgaWYgKChrZXkgJiBtYXNrKSAhPT0gbG93KSB7XG4gICAgICAgIHRhYmxlICs9IHRhYmxlX3NpemU7XG4gICAgICAgIHRhYmxlX2JpdHMgPSBOZXh0VGFibGVCaXRTaXplKGNvdW50LCBsZW4sIHJvb3RfYml0cyk7XG4gICAgICAgIHRhYmxlX3NpemUgPSAxIDw8IHRhYmxlX2JpdHM7XG4gICAgICAgIHRvdGFsX3NpemUgKz0gdGFibGVfc2l6ZTtcbiAgICAgICAgbG93ID0ga2V5ICYgbWFzaztcbiAgICAgICAgcm9vdF90YWJsZVtzdGFydF90YWJsZSArIGxvd10gPSBuZXcgSHVmZm1hbkNvZGUoKHRhYmxlX2JpdHMgKyByb290X2JpdHMpICYgMHhmZiwgKCh0YWJsZSAtIHN0YXJ0X3RhYmxlKSAtIGxvdykgJiAweGZmZmYpO1xuICAgICAgfVxuICAgICAgY29kZSA9IG5ldyBIdWZmbWFuQ29kZSgobGVuIC0gcm9vdF9iaXRzKSAmIDB4ZmYsIHNvcnRlZFtzeW1ib2wrK10gJiAweGZmZmYpO1xuICAgICAgUmVwbGljYXRlVmFsdWUocm9vdF90YWJsZSwgdGFibGUgKyAoa2V5ID4+IHJvb3RfYml0cyksIHN0ZXAsIHRhYmxlX3NpemUsIGNvZGUpO1xuICAgICAga2V5ID0gR2V0TmV4dEtleShrZXksIGxlbik7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gdG90YWxfc2l6ZTtcbn1cbiIsIi8qIENvcHlyaWdodCAyMDEzIEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG5cbiAgIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cbiAgIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbiAgIExvb2t1cCB0YWJsZXMgdG8gbWFwIHByZWZpeCBjb2RlcyB0byB2YWx1ZSByYW5nZXMuIFRoaXMgaXMgdXNlZCBkdXJpbmdcbiAgIGRlY29kaW5nIG9mIHRoZSBibG9jayBsZW5ndGhzLCBsaXRlcmFsIGluc2VydGlvbiBsZW5ndGhzIGFuZCBjb3B5IGxlbmd0aHMuXG4qL1xuXG4vKiBSZXByZXNlbnRzIHRoZSByYW5nZSBvZiB2YWx1ZXMgYmVsb25naW5nIHRvIGEgcHJlZml4IGNvZGU6ICovXG4vKiBbb2Zmc2V0LCBvZmZzZXQgKyAyXm5iaXRzKSAqL1xuZnVuY3Rpb24gUHJlZml4Q29kZVJhbmdlKG9mZnNldCwgbmJpdHMpIHtcbiAgdGhpcy5vZmZzZXQgPSBvZmZzZXQ7XG4gIHRoaXMubmJpdHMgPSBuYml0cztcbn1cblxuZXhwb3J0cy5rQmxvY2tMZW5ndGhQcmVmaXhDb2RlID0gW1xuICBuZXcgUHJlZml4Q29kZVJhbmdlKDEsIDIpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDUsIDIpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDksIDIpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDEzLCAyKSxcbiAgbmV3IFByZWZpeENvZGVSYW5nZSgxNywgMyksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMjUsIDMpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDMzLCAzKSwgbmV3IFByZWZpeENvZGVSYW5nZSg0MSwgMyksXG4gIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNDksIDQpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDY1LCA0KSwgbmV3IFByZWZpeENvZGVSYW5nZSg4MSwgNCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoOTcsIDQpLFxuICBuZXcgUHJlZml4Q29kZVJhbmdlKDExMywgNSksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMTQ1LCA1KSwgbmV3IFByZWZpeENvZGVSYW5nZSgxNzcsIDUpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDIwOSwgNSksXG4gIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMjQxLCA2KSwgbmV3IFByZWZpeENvZGVSYW5nZSgzMDUsIDYpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDM2OSwgNyksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNDk3LCA4KSxcbiAgbmV3IFByZWZpeENvZGVSYW5nZSg3NTMsIDkpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDEyNjUsIDEwKSwgbmV3IFByZWZpeENvZGVSYW5nZSgyMjg5LCAxMSksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNDMzNywgMTIpLFxuICBuZXcgUHJlZml4Q29kZVJhbmdlKDg0MzMsIDEzKSwgbmV3IFByZWZpeENvZGVSYW5nZSgxNjYyNSwgMjQpXG5dO1xuXG5leHBvcnRzLmtJbnNlcnRMZW5ndGhQcmVmaXhDb2RlID0gW1xuICBuZXcgUHJlZml4Q29kZVJhbmdlKDAsIDApLCBuZXcgUHJlZml4Q29kZVJhbmdlKDEsIDApLCBuZXcgUHJlZml4Q29kZVJhbmdlKDIsIDApLCBuZXcgUHJlZml4Q29kZVJhbmdlKDMsIDApLFxuICBuZXcgUHJlZml4Q29kZVJhbmdlKDQsIDApLCBuZXcgUHJlZml4Q29kZVJhbmdlKDUsIDApLCBuZXcgUHJlZml4Q29kZVJhbmdlKDYsIDEpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDgsIDEpLFxuICBuZXcgUHJlZml4Q29kZVJhbmdlKDEwLCAyKSwgbmV3IFByZWZpeENvZGVSYW5nZSgxNCwgMiksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMTgsIDMpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDI2LCAzKSxcbiAgbmV3IFByZWZpeENvZGVSYW5nZSgzNCwgNCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNTAsIDQpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDY2LCA1KSwgbmV3IFByZWZpeENvZGVSYW5nZSg5OCwgNSksXG4gIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMTMwLCA2KSwgbmV3IFByZWZpeENvZGVSYW5nZSgxOTQsIDcpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDMyMiwgOCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNTc4LCA5KSxcbiAgbmV3IFByZWZpeENvZGVSYW5nZSgxMDkwLCAxMCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMjExNCwgMTIpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDYyMTAsIDE0KSwgbmV3IFByZWZpeENvZGVSYW5nZSgyMjU5NCwgMjQpLFxuXTtcblxuZXhwb3J0cy5rQ29weUxlbmd0aFByZWZpeENvZGUgPSBbXG4gIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMiwgMCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMywgMCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNCwgMCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNSwgMCksXG4gIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNiwgMCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoNywgMCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoOCwgMCksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoOSwgMCksXG4gIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMTAsIDEpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDEyLCAxKSwgbmV3IFByZWZpeENvZGVSYW5nZSgxNCwgMiksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMTgsIDIpLFxuICBuZXcgUHJlZml4Q29kZVJhbmdlKDIyLCAzKSwgbmV3IFByZWZpeENvZGVSYW5nZSgzMCwgMyksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMzgsIDQpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDU0LCA0KSxcbiAgbmV3IFByZWZpeENvZGVSYW5nZSg3MCwgNSksIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMTAyLCA1KSwgbmV3IFByZWZpeENvZGVSYW5nZSgxMzQsIDYpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDE5OCwgNyksXG4gIG5ldyBQcmVmaXhDb2RlUmFuZ2UoMzI2LCA4KSwgbmV3IFByZWZpeENvZGVSYW5nZSg1ODIsIDkpLCBuZXcgUHJlZml4Q29kZVJhbmdlKDEwOTQsIDEwKSwgbmV3IFByZWZpeENvZGVSYW5nZSgyMTE4LCAyNCksXG5dO1xuXG5leHBvcnRzLmtJbnNlcnRSYW5nZUx1dCA9IFtcbiAgMCwgMCwgOCwgOCwgMCwgMTYsIDgsIDE2LCAxNixcbl07XG5cbmV4cG9ydHMua0NvcHlSYW5nZUx1dCA9IFtcbiAgMCwgOCwgMCwgOCwgMTYsIDAsIDE2LCA4LCAxNixcbl07XG4iLCJmdW5jdGlvbiBCcm90bGlJbnB1dChidWZmZXIpIHtcbiAgdGhpcy5idWZmZXIgPSBidWZmZXI7XG4gIHRoaXMucG9zID0gMDtcbn1cblxuQnJvdGxpSW5wdXQucHJvdG90eXBlLnJlYWQgPSBmdW5jdGlvbihidWYsIGksIGNvdW50KSB7XG4gIGlmICh0aGlzLnBvcyArIGNvdW50ID4gdGhpcy5idWZmZXIubGVuZ3RoKSB7XG4gICAgY291bnQgPSB0aGlzLmJ1ZmZlci5sZW5ndGggLSB0aGlzLnBvcztcbiAgfVxuICBcbiAgZm9yICh2YXIgcCA9IDA7IHAgPCBjb3VudDsgcCsrKVxuICAgIGJ1ZltpICsgcF0gPSB0aGlzLmJ1ZmZlclt0aGlzLnBvcyArIHBdO1xuICBcbiAgdGhpcy5wb3MgKz0gY291bnQ7XG4gIHJldHVybiBjb3VudDtcbn1cblxuZXhwb3J0cy5Ccm90bGlJbnB1dCA9IEJyb3RsaUlucHV0O1xuXG5mdW5jdGlvbiBCcm90bGlPdXRwdXQoYnVmKSB7XG4gIHRoaXMuYnVmZmVyID0gYnVmO1xuICB0aGlzLnBvcyA9IDA7XG59XG5cbkJyb3RsaU91dHB1dC5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbihidWYsIGNvdW50KSB7XG4gIGlmICh0aGlzLnBvcyArIGNvdW50ID4gdGhpcy5idWZmZXIubGVuZ3RoKVxuICAgIHRocm93IG5ldyBFcnJvcignT3V0cHV0IGJ1ZmZlciBpcyBub3QgbGFyZ2UgZW5vdWdoJyk7XG4gIFxuICB0aGlzLmJ1ZmZlci5zZXQoYnVmLnN1YmFycmF5KDAsIGNvdW50KSwgdGhpcy5wb3MpO1xuICB0aGlzLnBvcyArPSBjb3VudDtcbiAgcmV0dXJuIGNvdW50O1xufTtcblxuZXhwb3J0cy5Ccm90bGlPdXRwdXQgPSBCcm90bGlPdXRwdXQ7XG4iLCIvKiBDb3B5cmlnaHQgMjAxMyBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuXG4gICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG4gICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4gICBUcmFuc2Zvcm1hdGlvbnMgb24gZGljdGlvbmFyeSB3b3Jkcy5cbiovXG5cbnZhciBCcm90bGlEaWN0aW9uYXJ5ID0gcmVxdWlyZSgnLi9kaWN0aW9uYXJ5Jyk7XG5cbnZhciBrSWRlbnRpdHkgICAgICAgPSAwO1xudmFyIGtPbWl0TGFzdDEgICAgICA9IDE7XG52YXIga09taXRMYXN0MiAgICAgID0gMjtcbnZhciBrT21pdExhc3QzICAgICAgPSAzO1xudmFyIGtPbWl0TGFzdDQgICAgICA9IDQ7XG52YXIga09taXRMYXN0NSAgICAgID0gNTtcbnZhciBrT21pdExhc3Q2ICAgICAgPSA2O1xudmFyIGtPbWl0TGFzdDcgICAgICA9IDc7XG52YXIga09taXRMYXN0OCAgICAgID0gODtcbnZhciBrT21pdExhc3Q5ICAgICAgPSA5O1xudmFyIGtVcHBlcmNhc2VGaXJzdCA9IDEwO1xudmFyIGtVcHBlcmNhc2VBbGwgICA9IDExO1xudmFyIGtPbWl0Rmlyc3QxICAgICA9IDEyO1xudmFyIGtPbWl0Rmlyc3QyICAgICA9IDEzO1xudmFyIGtPbWl0Rmlyc3QzICAgICA9IDE0O1xudmFyIGtPbWl0Rmlyc3Q0ICAgICA9IDE1O1xudmFyIGtPbWl0Rmlyc3Q1ICAgICA9IDE2O1xudmFyIGtPbWl0Rmlyc3Q2ICAgICA9IDE3O1xudmFyIGtPbWl0Rmlyc3Q3ICAgICA9IDE4O1xudmFyIGtPbWl0Rmlyc3Q4ICAgICA9IDE5O1xudmFyIGtPbWl0Rmlyc3Q5ICAgICA9IDIwO1xuXG5mdW5jdGlvbiBUcmFuc2Zvcm0ocHJlZml4LCB0cmFuc2Zvcm0sIHN1ZmZpeCkge1xuICB0aGlzLnByZWZpeCA9IG5ldyBVaW50OEFycmF5KHByZWZpeC5sZW5ndGgpO1xuICB0aGlzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgdGhpcy5zdWZmaXggPSBuZXcgVWludDhBcnJheShzdWZmaXgubGVuZ3RoKTtcbiAgXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcHJlZml4Lmxlbmd0aDsgaSsrKVxuICAgIHRoaXMucHJlZml4W2ldID0gcHJlZml4LmNoYXJDb2RlQXQoaSk7XG4gIFxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN1ZmZpeC5sZW5ndGg7IGkrKylcbiAgICB0aGlzLnN1ZmZpeFtpXSA9IHN1ZmZpeC5jaGFyQ29kZUF0KGkpO1xufVxuXG52YXIga1RyYW5zZm9ybXMgPSBbXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIgXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgIFwiIFwiLCBrSWRlbnRpdHksICAgICAgIFwiIFwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga09taXRGaXJzdDEsICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtVcHBlcmNhc2VGaXJzdCwgXCIgXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiIHRoZSBcIiAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga0lkZW50aXR5LCAgICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICBcInMgXCIsIGtJZGVudGl0eSwgICAgICAgXCIgXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiIG9mIFwiICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUZpcnN0LCBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIgYW5kIFwiICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrT21pdEZpcnN0MiwgICAgIFwiXCIgICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga09taXRMYXN0MSwgICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICBcIiwgXCIsIGtJZGVudGl0eSwgICAgICAgXCIgXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiLCBcIiAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga1VwcGVyY2FzZUZpcnN0LCBcIiBcIiAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIgaW4gXCIgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiIHRvIFwiICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgIFwiZSBcIiwga0lkZW50aXR5LCAgICAgICBcIiBcIiAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCJcXFwiXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIuXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiXFxcIj5cIiAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiXFxuXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtPbWl0TGFzdDMsICAgICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiXVwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIiBmb3IgXCIgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtPbWl0Rmlyc3QzLCAgICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrT21pdExhc3QyLCAgICAgIFwiXCIgICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIiBhIFwiICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIgdGhhdCBcIiAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgIFwiIFwiLCBrVXBwZXJjYXNlRmlyc3QsIFwiXCIgICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIi4gXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIuXCIsIGtJZGVudGl0eSwgICAgICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgIFwiIFwiLCBrSWRlbnRpdHksICAgICAgIFwiLCBcIiAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga09taXRGaXJzdDQsICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIgd2l0aCBcIiAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiJ1wiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIiBmcm9tIFwiICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIgYnkgXCIgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrT21pdEZpcnN0NSwgICAgIFwiXCIgICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga09taXRGaXJzdDYsICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICBcIiB0aGUgXCIsIGtJZGVudGl0eSwgICAgICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrT21pdExhc3Q0LCAgICAgIFwiXCIgICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIi4gVGhlIFwiICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtVcHBlcmNhc2VBbGwsICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiIG9uIFwiICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIiBhcyBcIiAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIgaXMgXCIgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrT21pdExhc3Q3LCAgICAgIFwiXCIgICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga09taXRMYXN0MSwgICAgICBcImluZyBcIiAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCJcXG5cXHRcIiAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCI6XCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgIFwiIFwiLCBrSWRlbnRpdHksICAgICAgIFwiLiBcIiAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcImVkIFwiICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtPbWl0Rmlyc3Q5LCAgICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrT21pdEZpcnN0NywgICAgIFwiXCIgICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga09taXRMYXN0NiwgICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIoXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrVXBwZXJjYXNlRmlyc3QsIFwiLCBcIiAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga09taXRMYXN0OCwgICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIgYXQgXCIgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwibHkgXCIgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgIFwiIHRoZSBcIiwga0lkZW50aXR5LCAgICAgICBcIiBvZiBcIiAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtPbWl0TGFzdDUsICAgICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrT21pdExhc3Q5LCAgICAgIFwiXCIgICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga1VwcGVyY2FzZUZpcnN0LCBcIiwgXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtVcHBlcmNhc2VGaXJzdCwgXCJcXFwiXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIuXCIsIGtJZGVudGl0eSwgICAgICAgXCIoXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrVXBwZXJjYXNlQWxsLCAgIFwiIFwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUZpcnN0LCBcIlxcXCI+XCIgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIj1cXFwiXCIgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga0lkZW50aXR5LCAgICAgICBcIi5cIiAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICBcIi5jb20vXCIsIGtJZGVudGl0eSwgICAgICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgXCIgdGhlIFwiLCBrSWRlbnRpdHksICAgICAgIFwiIG9mIHRoZSBcIiAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUZpcnN0LCBcIidcIiAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCIuIFRoaXMgXCIgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiLFwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIi5cIiwga0lkZW50aXR5LCAgICAgICBcIiBcIiAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtVcHBlcmNhc2VGaXJzdCwgXCIoXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrVXBwZXJjYXNlRmlyc3QsIFwiLlwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcIiBub3QgXCIgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIgXCIsIGtJZGVudGl0eSwgICAgICAgXCI9XFxcIlwiICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCJlciBcIiAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgIFwiIFwiLCBrVXBwZXJjYXNlQWxsLCAgIFwiIFwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga0lkZW50aXR5LCAgICAgICBcImFsIFwiICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIgXCIsIGtVcHBlcmNhc2VBbGwsICAgXCJcIiAgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiPSdcIiAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUFsbCwgICBcIlxcXCJcIiAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUZpcnN0LCBcIi4gXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIgXCIsIGtJZGVudGl0eSwgICAgICAgXCIoXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiZnVsIFwiICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga1VwcGVyY2FzZUZpcnN0LCBcIi4gXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCJpdmUgXCIgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwibGVzcyBcIiAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUFsbCwgICBcIidcIiAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtJZGVudGl0eSwgICAgICAgXCJlc3QgXCIgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgIFwiIFwiLCBrVXBwZXJjYXNlRmlyc3QsIFwiLlwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUFsbCwgICBcIlxcXCI+XCIgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga0lkZW50aXR5LCAgICAgICBcIj0nXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtVcHBlcmNhc2VGaXJzdCwgXCIsXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwiaXplIFwiICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUFsbCwgICBcIi5cIiAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCBcIlxceGMyXFx4YTBcIiwga0lkZW50aXR5LCAgICAgICBcIlwiICAgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIgXCIsIGtJZGVudGl0eSwgICAgICAgXCIsXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrVXBwZXJjYXNlRmlyc3QsIFwiPVxcXCJcIiAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrVXBwZXJjYXNlQWxsLCAgIFwiPVxcXCJcIiAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrSWRlbnRpdHksICAgICAgIFwib3VzIFwiICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUFsbCwgICBcIiwgXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtVcHBlcmNhc2VGaXJzdCwgXCI9J1wiICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgIFwiIFwiLCBrVXBwZXJjYXNlRmlyc3QsIFwiLFwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga1VwcGVyY2FzZUFsbCwgICBcIj1cXFwiXCIgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga1VwcGVyY2FzZUFsbCwgICBcIiwgXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgIFwiXCIsIGtVcHBlcmNhc2VBbGwsICAgXCIsXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrVXBwZXJjYXNlQWxsLCAgIFwiKFwiICAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICAgXCJcIiwga1VwcGVyY2FzZUFsbCwgICBcIi4gXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIgXCIsIGtVcHBlcmNhc2VBbGwsICAgXCIuXCIgICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgICBcIlwiLCBrVXBwZXJjYXNlQWxsLCAgIFwiPSdcIiAgICAgICAgICksXG4gICAgIG5ldyBUcmFuc2Zvcm0oICAgICAgICBcIiBcIiwga1VwcGVyY2FzZUFsbCwgICBcIi4gXCIgICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIgXCIsIGtVcHBlcmNhc2VGaXJzdCwgXCI9XFxcIlwiICAgICAgICApLFxuICAgICBuZXcgVHJhbnNmb3JtKCAgICAgICAgXCIgXCIsIGtVcHBlcmNhc2VBbGwsICAgXCI9J1wiICAgICAgICAgKSxcbiAgICAgbmV3IFRyYW5zZm9ybSggICAgICAgIFwiIFwiLCBrVXBwZXJjYXNlRmlyc3QsIFwiPSdcIiAgICAgICAgIClcbl07XG5cbmV4cG9ydHMua1RyYW5zZm9ybXMgPSBrVHJhbnNmb3JtcztcbmV4cG9ydHMua051bVRyYW5zZm9ybXMgPSBrVHJhbnNmb3Jtcy5sZW5ndGg7XG5cbmZ1bmN0aW9uIFRvVXBwZXJDYXNlKHAsIGkpIHtcbiAgaWYgKHBbaV0gPCAweGMwKSB7XG4gICAgaWYgKHBbaV0gPj0gOTcgJiYgcFtpXSA8PSAxMjIpIHtcbiAgICAgIHBbaV0gXj0gMzI7XG4gICAgfVxuICAgIHJldHVybiAxO1xuICB9XG4gIFxuICAvKiBBbiBvdmVybHkgc2ltcGxpZmllZCB1cHBlcmNhc2luZyBtb2RlbCBmb3IgdXRmLTguICovXG4gIGlmIChwW2ldIDwgMHhlMCkge1xuICAgIHBbaSArIDFdIF49IDMyO1xuICAgIHJldHVybiAyO1xuICB9XG4gIFxuICAvKiBBbiBhcmJpdHJhcnkgdHJhbnNmb3JtIGZvciB0aHJlZSBieXRlIGNoYXJhY3RlcnMuICovXG4gIHBbaSArIDJdIF49IDU7XG4gIHJldHVybiAzO1xufVxuXG5leHBvcnRzLnRyYW5zZm9ybURpY3Rpb25hcnlXb3JkID0gZnVuY3Rpb24oZHN0LCBpZHgsIHdvcmQsIGxlbiwgdHJhbnNmb3JtKSB7XG4gIHZhciBwcmVmaXggPSBrVHJhbnNmb3Jtc1t0cmFuc2Zvcm1dLnByZWZpeDtcbiAgdmFyIHN1ZmZpeCA9IGtUcmFuc2Zvcm1zW3RyYW5zZm9ybV0uc3VmZml4O1xuICB2YXIgdCA9IGtUcmFuc2Zvcm1zW3RyYW5zZm9ybV0udHJhbnNmb3JtO1xuICB2YXIgc2tpcCA9IHQgPCBrT21pdEZpcnN0MSA/IDAgOiB0IC0gKGtPbWl0Rmlyc3QxIC0gMSk7XG4gIHZhciBpID0gMDtcbiAgdmFyIHN0YXJ0X2lkeCA9IGlkeDtcbiAgdmFyIHVwcGVyY2FzZTtcbiAgXG4gIGlmIChza2lwID4gbGVuKSB7XG4gICAgc2tpcCA9IGxlbjtcbiAgfVxuICBcbiAgdmFyIHByZWZpeF9wb3MgPSAwO1xuICB3aGlsZSAocHJlZml4X3BvcyA8IHByZWZpeC5sZW5ndGgpIHtcbiAgICBkc3RbaWR4KytdID0gcHJlZml4W3ByZWZpeF9wb3MrK107XG4gIH1cbiAgXG4gIHdvcmQgKz0gc2tpcDtcbiAgbGVuIC09IHNraXA7XG4gIFxuICBpZiAodCA8PSBrT21pdExhc3Q5KSB7XG4gICAgbGVuIC09IHQ7XG4gIH1cbiAgXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGRzdFtpZHgrK10gPSBCcm90bGlEaWN0aW9uYXJ5LmRpY3Rpb25hcnlbd29yZCArIGldO1xuICB9XG4gIFxuICB1cHBlcmNhc2UgPSBpZHggLSBsZW47XG4gIFxuICBpZiAodCA9PT0ga1VwcGVyY2FzZUZpcnN0KSB7XG4gICAgVG9VcHBlckNhc2UoZHN0LCB1cHBlcmNhc2UpO1xuICB9IGVsc2UgaWYgKHQgPT09IGtVcHBlcmNhc2VBbGwpIHtcbiAgICB3aGlsZSAobGVuID4gMCkge1xuICAgICAgdmFyIHN0ZXAgPSBUb1VwcGVyQ2FzZShkc3QsIHVwcGVyY2FzZSk7XG4gICAgICB1cHBlcmNhc2UgKz0gc3RlcDtcbiAgICAgIGxlbiAtPSBzdGVwO1xuICAgIH1cbiAgfVxuICBcbiAgdmFyIHN1ZmZpeF9wb3MgPSAwO1xuICB3aGlsZSAoc3VmZml4X3BvcyA8IHN1ZmZpeC5sZW5ndGgpIHtcbiAgICBkc3RbaWR4KytdID0gc3VmZml4W3N1ZmZpeF9wb3MrK107XG4gIH1cbiAgXG4gIHJldHVybiBpZHggLSBzdGFydF9pZHg7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVjL2RlY29kZScpLkJyb3RsaURlY29tcHJlc3NCdWZmZXI7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwidmFyIGRlY29tcHJlc3MgPSByZXF1aXJlKCdicm90bGkvZGVjb21wcmVzcycpO1xyXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgZnVuY3Rpb24gYXBwbHlDU1MoKSB7XHJcbiAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcclxuICAgIHN0eWxlLnR5cGUgPSBcInRleHQvY3NzXCI7XHJcbiAgICBzdHlsZS5pbm5lckhUTUwgPSBcIi5wYXJlbnQgZGl2IHsgaGVpZ2h0OiAxMDAlICFpbXBvcnRhbnQ7IH1cIjtcclxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF3aW5kb3cubG9jYXRpb24uaHJlZi5pbmNsdWRlcyhcImRyb25lXCIpKSB7XHJcbiAgICBjb25zdCBkYXRhYmFzZU5hbWUgPSBcIm1hcERCXCI7XHJcbiAgICBjb25zdCBvYmplY3RTdG9yZU5hbWUgPSBcIm1hcERhdGFcIjtcclxuICAgIHZhciBjYXNoZXdNYXAgPSBMLm1hcChcIm1hcFwiKTtcclxuICAgIHZhciBjb250cm9sX2xheWVyO1xyXG4gICAgbGV0IGN1cnJlbnRHZW9Kc29uT2JqO1xyXG4gICAgdmFyIGdlbmVyYXRlTWFwTGF5ZXJzO1xyXG5cclxuICAgIGZ1bmN0aW9uIGlzVG91Y2hTdXBwb3J0ZWQoKSB7XHJcbiAgICAgIHZhciBtc1RvdWNoRW5hYmxlZCA9IHdpbmRvdy5uYXZpZ2F0b3IubXNNYXhUb3VjaFBvaW50cztcclxuICAgICAgdmFyIGdlbmVyYWxUb3VjaEVuYWJsZWQgPSBcIm9udG91Y2hzdGFydFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcblxyXG4gICAgICBpZiAobXNUb3VjaEVuYWJsZWQgfHwgZ2VuZXJhbFRvdWNoRW5hYmxlZCkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlRHJhZ2dhYmxlKGVsZW1lbnQpIHtcclxuICAgICAgJChlbGVtZW50KS5kcmFnZ2FibGUoe1xyXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAkKHRoaXMpLmNzcyh7XHJcbiAgICAgICAgICAgIHJpZ2h0OiBcImF1dG9cIixcclxuICAgICAgICAgICAgdG9wOiBcImF1dG9cIixcclxuICAgICAgICAgICAgYm90dG9tOiBcImF1dG9cIixcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRQYXRoQmFzZWRDb250ZW50KHBhdGhMaW5rKSB7XHJcbiAgICAgIGNvbnN0IGxlZ2VuZEhUTUxfZW4gPSBgXHJcbiAgICAgICAgPGRpdiBpZD0nbWFwbGVnZW5kJyBjbGFzcz0nbWFwbGVnZW5kJ1xyXG4gICAgICAgICAgICBzdHlsZT0ncG9zaXRpb246IGFic29sdXRlOyB6LWluZGV4Ojk5OTk7IGJvcmRlcjoycHggc29saWQgZ3JleTsgYmFja2dyb3VuZC1jb2xvcjpyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOCk7XHJcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6NnB4OyBwYWRkaW5nOiAxMHB4OyBmb250LXNpemU6MTRweDsgcmlnaHQ6IDIwcHg7IGJvdHRvbTogMjBweDsgZm9udC1mYW1pbHk6IFwiSGVsdmV0aWNhIE5ldWVcIixIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjsgY29sb3I6IHJnYigwLCAwLCAwKSc+XHJcblxyXG4gICAgICAgIDxkaXYgY2xhc3M9J2xlZ2VuZC10aXRsZSc+TGVnZW5kPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzcz0nbGVnZW5kLXNjYWxlJz5cclxuICAgICAgICAgICAgPHVsIGNsYXNzPSdsZWdlbmQtbGFiZWxzJz5cclxuICAgICAgICAgICAgICAgIDxsaT48aW1nIHNyYz1cImh0dHBzOi8vY2RuLm1hcG1hcmtlci5pby9hcGkvdjEvZm9udC1hd2Vzb21lL3Y1L3Bpbj9pY29uPWZhLXdhcmVob3VzZSZzaXplPTI1JmhvZmZzZXQ9MCZ2b2Zmc2V0PS0xXHJcbiAgICAgICAgICAgICAgICAmYmFja2dyb3VuZD0xMTY3YjFcIj4mbmJzcDsmbmJzcDtDYXNoZXcgV2FyZWhvdXNlPC9saT5cclxuICAgICAgICAgICAgICAgIDxsaT48aW1nIHNyYz1cImh0dHBzOi8vY2RuLm1hcG1hcmtlci5pby9hcGkvdjEvZm9udC1hd2Vzb21lL3Y1L3Bpbj9pY29uPWZhLWdsb2JlLWFmcmljYSZzaXplPTI1JmhvZmZzZXQ9MCZ2b2Zmc2V0XHJcbiAgICAgICAgICAgICAgICA9LTEmYmFja2dyb3VuZD0wMDgwMDBcIj4mbmJzcDsmbmJzcDtQbGFudGF0aW9uIExvY2F0aW9uPC9saT5cclxuICAgICAgICAgICAgICAgIDxsaT48aW1nIHNyYz1cImh0dHBzOi8vY2RuLm1hcG1hcmtlci5pby9hcGkvdjEvZm9udC1hd2Vzb21lL3Y1L3Bpbj9pY29uPWZhLWxlYWYmc2l6ZT0yNSZob2Zmc2V0PTAmdm9mZnNldD0tMVxyXG4gICAgICAgICAgICAgICAgJmJhY2tncm91bmQ9YzYzZTJiXCI+Jm5ic3A7Jm5ic3A7TnVyc2VyeTwvbGk+XHJcbiAgICAgICAgICAgICAgICA8bGk+PGltZyBzcmM9XCJodHRwczovL2Nkbi5tYXBtYXJrZXIuaW8vYXBpL3YxL2ZvbnQtYXdlc29tZS92NS9waW4/aWNvbj1mYS13YXJlaG91c2Umc2l6ZT0yNSZob2Zmc2V0PTAmdm9mZnNldD0tMVxyXG4gICAgICAgICAgICAgICAgJmJhY2tncm91bmQ9REJBODAwXCI+Jm5ic3A7Jm5ic3A7VHJhaW5pbmcgTG9jYXRpb248L2xpPlxyXG4gICAgICAgICAgICAgICAgPGxpPiZuYnNwOzxpbWcgc3JjPVwiaHR0cHM6Ly9pLmliYi5jby9KM0wzN0NWL1BpY3R1cmUzLnBuZ1wiIHdpZHRoPVwiMTdcIiBoZWlnaHQ9XCIyNFwiPiZuYnNwOyZuYnNwOyZuYnNwO1NhdGVsbGl0ZVxyXG4gICAgICAgICAgICAgICAgcHJlZGljdGlvbnM8L2xpPlxyXG4gICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICBgO1xyXG5cclxuICAgICAgY29uc3QgbGVnZW5kSFRNTF9mciA9IGBcclxuICAgICAgICA8ZGl2IGlkPSdtYXBsZWdlbmQnIGNsYXNzPSdtYXBsZWdlbmQnXHJcbiAgICAgICAgICAgIHN0eWxlPSdwb3NpdGlvbjogYWJzb2x1dGU7IHotaW5kZXg6OTk5OTsgYm9yZGVyOjJweCBzb2xpZCBncmV5OyBiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMjU1LCAyNTUsIDI1NSwgMC44KTtcclxuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czo2cHg7IHBhZGRpbmc6IDEwcHg7IGZvbnQtc2l6ZToxNHB4OyByaWdodDogMjBweDsgYm90dG9tOiAyMHB4OyBmb250LWZhbWlseTogXCJIZWx2ZXRpY2EgTmV1ZVwiLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmOyBjb2xvcjogcmdiKDAsIDAsIDApJz5cclxuXHJcbiAgICAgICAgPGRpdiBjbGFzcz0nbGVnZW5kLXRpdGxlJz5Mw6lnZW5kZTwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9J2xlZ2VuZC1zY2FsZSc+XHJcbiAgICAgICAgICAgIDx1bCBjbGFzcz0nbGVnZW5kLWxhYmVscyc+XHJcbiAgICAgICAgICAgICAgICA8bGk+PGltZyBzcmM9XCJodHRwczovL2Nkbi5tYXBtYXJrZXIuaW8vYXBpL3YxL2ZvbnQtYXdlc29tZS92NS9waW4/aWNvbj1mYS13YXJlaG91c2Umc2l6ZT0yNSZob2Zmc2V0PTAmdm9mZnNldD0tMVxyXG4gICAgICAgICAgICAgICAgJmJhY2tncm91bmQ9MTE2N2IxXCI+Jm5ic3A7Jm5ic3A7RW50cmVwb3QgZGUgY2Fqb3V4PC9saT5cclxuICAgICAgICAgICAgICAgIDxsaT48aW1nIHNyYz1cImh0dHBzOi8vY2RuLm1hcG1hcmtlci5pby9hcGkvdjEvZm9udC1hd2Vzb21lL3Y1L3Bpbj9pY29uPWZhLWdsb2JlLWFmcmljYSZzaXplPTI1JmhvZmZzZXQ9MCZ2b2Zmc2V0XHJcbiAgICAgICAgICAgICAgICA9LTEmYmFja2dyb3VuZD0wMDgwMDBcIj4mbmJzcDsmbmJzcDtQbGFudGF0aW9uPC9saT5cclxuICAgICAgICAgICAgICAgIDxsaT48aW1nIHNyYz1cImh0dHBzOi8vY2RuLm1hcG1hcmtlci5pby9hcGkvdjEvZm9udC1hd2Vzb21lL3Y1L3Bpbj9pY29uPWZhLWxlYWYmc2l6ZT0yNSZob2Zmc2V0PTAmdm9mZnNldD0tMVxyXG4gICAgICAgICAgICAgICAgJmJhY2tncm91bmQ9YzYzZTJiXCI+Jm5ic3A7Jm5ic3A7UMOpcGluacOocmU8L2xpPlxyXG4gICAgICAgICAgICAgICAgPGxpPjxpbWcgc3JjPVwiaHR0cHM6Ly9jZG4ubWFwbWFya2VyLmlvL2FwaS92MS9mb250LWF3ZXNvbWUvdjUvcGluP2ljb249ZmEtd2FyZWhvdXNlJnNpemU9MjUmaG9mZnNldD0wJnZvZmZzZXQ9LTFcclxuICAgICAgICAgICAgICAgICZiYWNrZ3JvdW5kPURCQTgwMFwiPiZuYnNwOyZuYnNwO0xpZXUgZCdBcHByZW50aXNzYWdlPC9saT5cclxuICAgICAgICAgICAgICAgIDxsaT4mbmJzcDs8aW1nIHNyYz1cImh0dHBzOi8vaS5pYmIuY28vSjNMMzdDVi9QaWN0dXJlMy5wbmdcIiB3aWR0aD1cIjE3XCIgaGVpZ2h0PVwiMjRcIj4mbmJzcDsmbmJzcDsmbmJzcDtQcsOpZGljdGlvbnNcclxuICAgICAgICAgICAgICAgIHNhdGVsbGl0YWlyZTwvbGk+XHJcbiAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIGA7XHJcbiAgICAgIHJldHVybiBwYXRoTGluay5pbmNsdWRlcyhcIi9lbi9cIilcclxuICAgICAgICA/IGxlZ2VuZEhUTUxfZW5cclxuICAgICAgICA6IHBhdGhMaW5rLmluY2x1ZGVzKFwiL2ZyL1wiKVxyXG4gICAgICAgICAgPyBsZWdlbmRIVE1MX2ZyXHJcbiAgICAgICAgICA6IFwiXCI7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZExlZ2VuZEJhc2VkT25VUkwocGF0aExpbmspIHtcclxuICAgICAgY29uc3QgcGFyZW50RGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInBhcmVudFwiKVswXTtcclxuICAgICAgaWYgKCFwYXJlbnREaXYpIHJldHVybjtcclxuICAgICAgcGFyZW50RGl2Lmluc2VydEFkamFjZW50SFRNTChcImFmdGVyYmVnaW5cIiwgZ2V0UGF0aEJhc2VkQ29udGVudChwYXRoTGluaykpO1xyXG4gICAgICBtYWtlRHJhZ2dhYmxlKFwiI21hcGxlZ2VuZFwiKTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb21wcmVzc0RhdGEoY29tcHJlc3NlZERhdGEpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBkZWNvZGVkRGF0YSA9IGF0b2IoY29tcHJlc3NlZERhdGEuc2VyaWFsaXplZF9sYXllcnMpO1xyXG4gICAgICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoZGVjb2RlZERhdGEubGVuZ3RoKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlY29kZWREYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBieXRlc1tpXSA9IGRlY29kZWREYXRhLmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGRlY29tcHJlc3NlZERhdGEgPSBkZWNvbXByZXNzKGJ5dGVzKTtcclxuICAgICAgICBjb25zdCBkZWNvbXByZXNzZWQgPSBuZXcgVGV4dERlY29kZXIoXCJ1dGYtOFwiKS5kZWNvZGUoZGVjb21wcmVzc2VkRGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGVjb21wcmVzc2VkKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBkZWNvbXByZXNzIGRhdGFcIiwgZXJyKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBjdXN0b21MYXllckNvbnRyb2woY29udHJvbF9sYXllcikge1xyXG4gICAgICBpZiAoIWlzVG91Y2hTdXBwb3J0ZWQoKSkge1xyXG4gICAgICAgIHZhciBjb250cm9sQnV0dG9uID0gY29udHJvbF9sYXllci5nZXRDb250YWluZXIoKTtcclxuICAgICAgICBjb250cm9sQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcclxuICAgICAgICBjb250cm9sQnV0dG9uLnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xyXG4gICAgICAgIHZhciBjb250cm9sQ29udGVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxyXG4gICAgICAgICAgXCJsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzLWxpc3RcIlxyXG4gICAgICAgIClbMF07XHJcbiAgICAgICAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcclxuICAgICAgICAgIFwibGVhZmxldC1jb250cm9sLWxheWVycy10b2dnbGVcIlxyXG4gICAgICAgIClbMF07XHJcbiAgICAgICAgY29uc3QgY29udGVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxyXG4gICAgICAgICAgXCJsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzLWxpc3RcIlxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3QgcGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcclxuICAgICAgICAgIFwibGVhZmxldC1jb250cm9sLWxheWVyc1wiXHJcbiAgICAgICAgKVswXTtcclxuXHJcbiAgICAgICAgY29udHJvbENvbnRlbnRzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICB2YXIgdGltZXI7XHJcbiAgICAgICAgZnVuY3Rpb24gc2hvd0xheWVycygpIHtcclxuICAgICAgICAgIGJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICBwYXJlbnQuc3R5bGUucGFkZGluZyA9IFwiNnB4IDEwcHggNnB4IDZweFwiO1xyXG4gICAgICAgICAgY29udHJvbENvbnRlbnRzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGhpZGVMYXllcnMoKSB7XHJcbiAgICAgICAgICBidXR0b24uc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgICAgICAgIHBhcmVudC5zdHlsZS5wYWRkaW5nID0gXCIwXCI7XHJcbiAgICAgICAgICBjb250cm9sQ29udGVudHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBkZWxheVRpbWVIaWRlKCkge1xyXG4gICAgICAgICAgc2hvd0xheWVycygpO1xyXG4gICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaGlkZUxheWVycygpO1xyXG4gICAgICAgICAgfSwgNDAwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRyb2xCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgICAgICAgIHNob3dMYXllcnMoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb250cm9sQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGRlbGF5VGltZUhpZGUoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRIb21lQnV0dG9uVG9NYXAobWFwKSB7XHJcbiAgICAgIGNvbnN0IG1hcF9sZWFmX2RvbSA9IG1hcC5nZXRDb250YWluZXIoKTtcclxuXHJcbiAgICAgIGNvbnN0IGNoZWNrTG9hZE1hcCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICBjb25zdCBtYXBfbGVhZiA9IGV2YWwobWFwX2xlYWZfZG9tLmlkKTtcclxuICAgICAgICBpZiAobWFwX2xlYWYpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWFwIGlzIGRvbmUgbG9hZGVkIFwiKTtcclxuICAgICAgICAgIC8vIENyZWF0ZSB0aGUgbm9kZSB0byBob2xkIHRoZSBjdXN0b20gaHRtbFxyXG4gICAgICAgICAgY29uc3QgYnRuTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAvLyBTZXQgc3R5bGVzIGF0dHJpYnV0ZXMgZm9yIHRoZSBkaXZcclxuICAgICAgICAgIGJ0bk5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJidG4tZ3JvdXBcIik7XHJcbiAgICAgICAgICBidG5Ob2RlLnNldEF0dHJpYnV0ZShcclxuICAgICAgICAgICAgXCJzdHlsZVwiLFxyXG4gICAgICAgICAgICBcInotaW5kZXg6IDkwOTsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDEwcHg7IHJpZ2h0OiA0NXB4O1wiXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgYnRuTm9kZS5pbm5lckhUTUwgPSBgPGJ1dHRvbiBpZD1cInJlc2V0dmlld1wiIHR5cGU9XCJidXR0b25zXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDM2cHg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMzZweDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBub25lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3gtc2hhZG93OiByZ2JhKDAsIDAsIDAsIDAuNDUpIDBweCAxcHggNXB4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjBweDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj48aSBjbGFzcz1cImZhIGZhcyBmYS1ob21lXCI+PC9pPjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5gO1xyXG4gICAgICAgICAgbWFwX2xlYWZfZG9tLmFwcGVuZENoaWxkKGJ0bk5vZGUpOyAvLyBhcHBlbmQgdG8gbWFwXHJcbiAgICAgICAgICAvLyBTdG9yZSBpbml0YWwgbG9hZCB2YXJpYWJsZXNcclxuICAgICAgICAgIGNvbnN0IGluaXRpYWxab29tID0gbWFwX2xlYWYuZ2V0Wm9vbSgpO1xyXG4gICAgICAgICAgY29uc3QgaW5pdGlhbENlbnRlciA9IG1hcF9sZWFmLmdldENlbnRlcigpO1xyXG4gICAgICAgICAgLy8gUmVzZXQgem9vbSBhbmQgdmlldyBmdW5jdGlvblxyXG4gICAgICAgICAgLy8gY2FsbGVkIGFmdGVyIG1hcCBpcyBpbml0aWF0ZWRcclxuICAgICAgICAgIGZ1bmN0aW9uIHJlc2V0Wm9vbSgpIHtcclxuICAgICAgICAgICAgZG9jdW1lbnRcclxuICAgICAgICAgICAgICAuZ2V0RWxlbWVudEJ5SWQoXCJyZXNldHZpZXdcIilcclxuICAgICAgICAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIG1hcF9sZWFmLnNldFZpZXcoaW5pdGlhbENlbnRlciwgaW5pdGlhbFpvb20pO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVzZXRab29tKCk7XHJcbiAgICAgICAgICBjbGVhckludGVydmFsKGNoZWNrTG9hZE1hcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCA1MDApO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRWYWx1ZUlnbm9yZUNhc2Uob2JqLCBrZXkpIHtcclxuICAgICAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgb2JqZWN0IHByb3ZpZGVkLlwiKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodHlwZW9mIGtleSAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQga2V5IHR5cGUuIEtleSBtdXN0IGJlIGEgc3RyaW5nLlwiKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBsb3dlcmNhc2VLZXkgPSBrZXkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgZm9yIChjb25zdCBvYmpLZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgb2JqS2V5KSAmJlxyXG4gICAgICAgICAgb2JqS2V5LnRvTG93ZXJDYXNlKCkgPT09IGxvd2VyY2FzZUtleVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgcmV0dXJuIG9iaktleTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcmVwbGFjZVVwcGVyQ2FzZVdpdGhVbmRlcnNjb3JlKHNlbnRlbmNlKSB7XHJcbiAgICAgIGxldCByZXN1bHQgPSBcIlwiO1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbnRlbmNlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudENoYXIgPSBzZW50ZW5jZS5jaGFyQXQoaSk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRDaGFyID09PSBjdXJyZW50Q2hhci50b1VwcGVyQ2FzZSgpKSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gXCJfXCIgKyBjdXJyZW50Q2hhci50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gY3VycmVudENoYXI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuXHJcbiAgICBMLk5hbWVkRmVhdHVyZUdyb3VwID0gTC5GZWF0dXJlR3JvdXAuZXh0ZW5kKHtcclxuICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG5hbWUsIGxheWVycykge1xyXG4gICAgICAgIEwuRmVhdHVyZUdyb3VwLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgbGF5ZXJzKTtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgb3BlblJlcXVlc3QgPSBpbmRleGVkREIub3BlbihkYXRhYmFzZU5hbWUsIDEpO1xyXG4gICAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICBjb25zdCBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XHJcbiAgICAgICAgaWYgKCFkYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKG9iamVjdFN0b3JlTmFtZSkpIHtcclxuICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKG9iamVjdFN0b3JlTmFtZSwgeyBrZXlQYXRoOiBcImlkXCIgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICBvcGVuUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICBjb25zdCBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XHJcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbihvYmplY3RTdG9yZU5hbWUsIFwicmVhZG9ubHlcIik7XHJcbiAgICAgICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmplY3RTdG9yZU5hbWUpO1xyXG4gICAgICAgIGNvbnN0IGdldFJlcXVlc3QgPSBvYmplY3RTdG9yZS5nZXQocGFyc2VJbnQobWFwSWQpKTtcclxuXHJcbiAgICAgICAgZ2V0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpZiAoZ2V0UmVxdWVzdC5yZXN1bHQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgYE9MRCBNQVAgSEFTSDogJHtnZXRSZXF1ZXN0LnJlc3VsdC5oYXNofSxcXG5ORVcgTUFQIEhBU0g6ICR7bWFwSGFzaH1gXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoZ2V0UmVxdWVzdC5yZXN1bHQgJiYgZ2V0UmVxdWVzdC5yZXN1bHQuaGFzaCA9PT0gbWFwSGFzaCkge1xyXG4gICAgICAgICAgICBjb25zdCBjYWNoZWRNYXBIdG1sID0gZ2V0UmVxdWVzdC5yZXN1bHQuaHRtbDtcclxuICAgICAgICAgICAgJChcIi5jaGlsZDFcIikuaHRtbChjYWNoZWRNYXBIdG1sKTtcclxuICAgICAgICAgICAgJChcIi5jaGlsZDFcIilcclxuICAgICAgICAgICAgICAucHJvbWlzZSgpXHJcbiAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJChcImRpdi5jaGlsZDJcIikuZmFkZU91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICQoXCJkaXYuY2hpbGQyXCIpLnJlcGxhY2VXaXRoKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmZXRjaE1hcERhdGEoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBkYi5jbG9zZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGZldGNoTWFwRGF0YSgpIHtcclxuICAgICAgJC5nZXQobGluaywgZnVuY3Rpb24gKHVucGFyc2VkZGF0YSkge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBkZWNvbXByZXNzRGF0YSh1bnBhcnNlZGRhdGEpO1xyXG4gICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICBjYXNoZXdNYXAgPSB1cGRhdGVNYXAoZGF0YSwgdHJ1ZSk7XHJcbiAgICAgICAgICAkKFwiLmNoaWxkMVwiKVxyXG4gICAgICAgICAgICAucHJvbWlzZSgpXHJcbiAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAkKFwiZGl2LmNoaWxkMlwiKS5mYWRlT3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoXCJkaXYuY2hpbGQyXCIpLnJlcGxhY2VXaXRoKFwiXCIpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIGNvbnN0IG9wZW5SZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oZGF0YWJhc2VOYW1lLCAxKTtcclxuICAgICAgICAgIC8vIG9wZW5SZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgLy8gICBjb25zdCBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XHJcbiAgICAgICAgICAvLyAgIGNvbnN0IHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24ob2JqZWN0U3RvcmVOYW1lLCBcInJlYWR3cml0ZVwiKTtcclxuICAgICAgICAgIC8vICAgY29uc3Qgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmplY3RTdG9yZU5hbWUpO1xyXG4gICAgICAgICAgLy8gICBvYmplY3RTdG9yZS5wdXQoe1xyXG4gICAgICAgICAgLy8gICAgIGlkOiBwYXJzZUludChtYXBJZCksXHJcbiAgICAgICAgICAvLyAgICAgaHRtbDogZGF0YSxcclxuICAgICAgICAgIC8vICAgICBoYXNoOiBtYXBIYXNoLFxyXG4gICAgICAgICAgLy8gICB9KTtcclxuICAgICAgICAgIC8vICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIC8vICAgICBkYi5jbG9zZSgpO1xyXG4gICAgICAgICAgLy8gICB9O1xyXG4gICAgICAgICAgLy8gfTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBvcmRlcmluZ0xheWVycyhsYXllcnMpIHtcclxuICAgICAgY29uc3Qgb3JkZXIgPSBbXHJcbiAgICAgICAgXCJjb3VudHJ5Qm9yZGVyTGF5ZXJcIixcclxuICAgICAgICBcImNvdW50cnlMYXllclwiLFxyXG4gICAgICAgIFwiY291bnRyeURlcHRMYXllclwiLFxyXG4gICAgICAgIFwiY291bnRyeUNvbW11bmVMYXllclwiLFxyXG4gICAgICAgIFwiY291bnRyeURpc3RyaWN0TGF5ZXJcIixcclxuICAgICAgICBcImNvdW50cnlDb2xvcmVkRGVwdExheWVyXCIsXHJcbiAgICAgICAgXCJjb3VudHJ5Q29sb3JlZENvbW11bmVMYXllclwiLFxyXG4gICAgICAgIFwiY291bnRyeVByb3RlY3RlZExheWVyXCIsXHJcbiAgICAgICAgXCJjb3VudHJ5UGxhbnRhdGlvbkxheWVyXCIsXHJcbiAgICAgICAgXCJ0cmFpbmluZ0xheWVyXCIsXHJcbiAgICAgICAgXCJxYXJMYXllclwiLFxyXG4gICAgICAgIFwibnVyc2VyeUxheWVyXCIsXHJcbiAgICAgIF07XHJcblxyXG4gICAgICBvcmRlci5mb3JFYWNoKChsYXllck5hbWUpID0+IHtcclxuICAgICAgICBpZiAobGF5ZXJzW2xheWVyTmFtZV0pIHtcclxuICAgICAgICAgIGxheWVyc1tsYXllck5hbWVdLmJyaW5nVG9Gcm9udCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZExheWVyc1RvTWFwKGNhc2hld01hcCwgbGF5ZXJzKSB7XHJcbiAgICAgIGNvbnN0IG9yZGVyID0gW1xyXG4gICAgICAgIFwiY291bnRyeUJvcmRlckxheWVyXCIsXHJcbiAgICAgICAgLy8gXCJjb3VudHJ5TGF5ZXJcIixcclxuICAgICAgICAvLyBcImNvdW50cnlEZXB0TGF5ZXJcIixcclxuICAgICAgICAvLyBcImNvdW50cnlDb21tdW5lTGF5ZXJcIixcclxuICAgICAgICAvLyBcImNvdW50cnlEaXN0cmljdExheWVyXCIsXHJcbiAgICAgICAgLy8gXCJjb3VudHJ5Q29sb3JlZERlcHRMYXllclwiLFxyXG4gICAgICAgIC8vIFwiY291bnRyeUNvbG9yZWRDb21tdW5lTGF5ZXJcIixcclxuICAgICAgICAvLyBcImNvdW50cnlQcm90ZWN0ZWRMYXllclwiLFxyXG4gICAgICAgIC8vIFwiY291bnRyeVBsYW50YXRpb25MYXllclwiLFxyXG4gICAgICAgIC8vIFwidHJhaW5pbmdMYXllclwiLFxyXG4gICAgICAgIC8vIFwicWFyTGF5ZXJcIixcclxuICAgICAgICAvLyBcIm51cnNlcnlMYXllclwiLFxyXG4gICAgICAgIFwicHJlZGljdGlvbnNMYXllclwiLFxyXG4gICAgICAgIC8vIFwidHJlZURlbnNpdHlFc3RpbWF0aW9uTGF5ZXJcIixcclxuICAgICAgICAvLyBcImRlZm9yZXN0YXRpb25cIixcclxuICAgICAgICAvLyBcImFmb3Jlc3RhdGlvblwiLFxyXG4gICAgICBdO1xyXG5cclxuICAgICAgb3JkZXIuZm9yRWFjaCgobGF5ZXJOYW1lKSA9PiB7XHJcbiAgICAgICAgaWYgKGxheWVyc1tsYXllck5hbWVdKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoW1wicWFyTGF5ZXJcIiwgXCJudXJzZXJ5TGF5ZXJcIl0uaW5jbHVkZXMobGF5ZXJOYW1lKSkge1xyXG4gICAgICAgICAgICAgIGNhc2hld01hcC5hZGRMYXllcihsYXllcnNbbGF5ZXJOYW1lXSk7XHJcbiAgICAgICAgICAgICAgY2FzaGV3TWFwLnNldFZpZXcoXHJcbiAgICAgICAgICAgICAgICBbcGFyc2VGbG9hdCh1c2VyQ291bnRyeUxhdCksIHBhcnNlRmxvYXQodXNlckNvdW50cnlMb24pXSxcclxuICAgICAgICAgICAgICAgIDhcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGxheWVyc1tsYXllck5hbWVdLmFkZFRvKGNhc2hld01hcCk7XHJcbiAgICAgICAgICAgICAgY2FzaGV3TWFwLnNldFZpZXcoXHJcbiAgICAgICAgICAgICAgICBbcGFyc2VGbG9hdCh1c2VyQ291bnRyeUxhdCksIHBhcnNlRmxvYXQodXNlckNvdW50cnlMb24pXSxcclxuICAgICAgICAgICAgICAgIDhcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGFkZGluZyBsYXllciAke2xheWVyTmFtZX06YCwgZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBjYXNoZXdNYXA7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGdldEJhc2VNYXAocGF0aExpbmspIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBiYXNlbWFwcyA9IHtcclxuICAgICAgICAgIFwiR29vZ2xlIE1hcHNcIjogTC50aWxlTGF5ZXIoXHJcbiAgICAgICAgICAgIFwiaHR0cHM6Ly9tdDEuZ29vZ2xlLmNvbS92dC9seXJzPW0meD17eH0meT17eX0mej17en1cIixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiBcIkdvb2dsZVwiLFxyXG4gICAgICAgICAgICAgIG1heFpvb206IDI1LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgXCJHb29nbGUgU2F0ZWxsaXRlXCI6IEwudGlsZUxheWVyKFxyXG4gICAgICAgICAgICBcImh0dHBzOi8vbXQxLmdvb2dsZS5jb20vdnQvbHlycz1zJng9e3h9Jnk9e3l9Jno9e3p9XCIsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjogXCJHb29nbGVcIixcclxuICAgICAgICAgICAgICBtYXhab29tOiAyNSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFwiTWFwYm94IFNhdGVsbGl0ZVwiOiBMLnRpbGVMYXllcihcclxuICAgICAgICAgICAgXCJodHRwczovL2FwaS5tYXBib3guY29tL3Y0L21hcGJveC5zYXRlbGxpdGUve3p9L3t4fS97eX0ucG5nP2FjY2Vzc190b2tlbj1way5leUoxSWpvaWMyaGhhMkY2SWl3aVlTSTZJbU5yY3pNek5UbDNlakI2ZVRZeWRuQmxOelIwZEhVd2NuVWlmUS52SHFQaW8zUGUwUGVoV3BJdWY1UVVnXCIsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjogXCJNYXBib3hcIixcclxuICAgICAgICAgICAgICBtYXhab29tOiAyNSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGJhc2VtYXBzW1wiR29vZ2xlIE1hcHNcIl0uYWRkVG8oY2FzaGV3TWFwKTtcclxuICAgICAgICBMLmNvbnRyb2xcclxuICAgICAgICAgIC5mdWxsc2NyZWVuKHtcclxuICAgICAgICAgICAgcG9zaXRpb246IFwidG9wcmlnaHRcIixcclxuICAgICAgICAgICAgdGl0bGU6IFwiRnVsbCBTY3JlZW5cIixcclxuICAgICAgICAgICAgdGl0bGVDYW5jZWw6IFwiRXhpdCBGdWxsIFNjcmVlblwiLFxyXG4gICAgICAgICAgICBmb3JjZVNlcGFyYXRlQnV0dG9uOiBmYWxzZSxcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuYWRkVG8oY2FzaGV3TWFwKTtcclxuXHJcbiAgICAgICAgYWRkTGVnZW5kQmFzZWRPblVSTChwYXRoTGluayk7XHJcblxyXG4gICAgICAgIGNvbnRyb2xfbGF5ZXIgPSBMLmNvbnRyb2wubGF5ZXJzKGJhc2VtYXBzKS5hZGRUbyhjYXNoZXdNYXApO1xyXG5cclxuICAgICAgICBjdXN0b21MYXllckNvbnRyb2woY29udHJvbF9sYXllcik7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBbY2FzaGV3TWFwLCBjb250cm9sX2xheWVyXTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHVzZXJSb2xlID09PSBcIkdMT0JBTC1BRE1JTlwiKSB7XHJcbiAgICAgIGNsYXNzIEdlbmVyaWNNYXAge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5TGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5Qm9yZGVyTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5RGVwdExheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuY291bnRyeUNvbW11bmVMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlEaXN0cmljdExheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuY291bnRyeUNvbG9yZWREZXB0TGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5Q29sb3JlZENvbW11bmVMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlQcm90ZWN0ZWRMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlQbGFudGF0aW9uTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5xYXJMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLnRyYWluaW5nTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5udXJzZXJ5TGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5wcmVkaWN0aW9uc0xheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMudHJlZURlbnNpdHlFc3RpbWF0aW9uTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5kZWZvcmVzdGF0aW9uID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuYWZvcmVzdGF0aW9uID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICBzaG93ID0gZmFsc2UsXHJcbiAgICAgICAgICBvdmVybGF5ID0gdHJ1ZSxcclxuICAgICAgICAgIGNvbnRyb2wgPSB0cnVlLFxyXG4gICAgICAgICAgekluZGV4T2Zmc2V0ID0gMFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgbGV0IGZlYXR1cmVHcm91cCA9IEwuZmVhdHVyZUdyb3VwKCk7XHJcbiAgICAgICAgICBmZWF0dXJlR3JvdXAubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgICBmZWF0dXJlR3JvdXAub3B0aW9ucyA9IHsgbmFtZSwgc2hvdywgb3ZlcmxheSwgY29udHJvbCwgekluZGV4T2Zmc2V0IH07XHJcbiAgICAgICAgICByZXR1cm4gZmVhdHVyZUdyb3VwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3JlYXRlTWFya2VyQ2x1c3RlcihuYW1lKSB7XHJcbiAgICAgICAgICB2YXIgbWFya2VyQ2x1c3RlciA9IEwubWFya2VyQ2x1c3Rlckdyb3VwKHsgbmFtZTogbmFtZSB9KTtcclxuICAgICAgICAgIHJldHVybiBtYXJrZXJDbHVzdGVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWRkTGF5ZXJzVG9Hcm91cChsYXllckdyb3VwLCBjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGNvdW50cmllc0xheWVyTGlzdCA9IGNvdW50cmllc0xheWVyTGlzdCB8fCBbXTtcclxuICAgICAgICAgIGNvdW50cmllc0xheWVyTGlzdC5mb3JFYWNoKChvYmopID0+IHtcclxuICAgICAgICAgICAgKG9iaiB8fCBbXSkuZm9yRWFjaCgoZWxtdCkgPT4ge1xyXG4gICAgICAgICAgICAgIGVsbXQuYWRkVG8obGF5ZXJHcm91cCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlDb2xvcmVkQ29tbXVuZUxheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIlRyYWluaW5nIFJlY29tbWVuZGF0aW9ucyBMZXZlbCAyXCIsXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5Q29sb3JlZENvbW11bmVMYXllciA9IGxheWVyO1xyXG4gICAgICAgICAgcmV0dXJuIGxheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVDb3VudHJ5Q29sb3JlZERlcHRMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBsYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlR3JvdXAoXHJcbiAgICAgICAgICAgICAgXCJUcmFpbmluZyBSZWNvbW1lbmRhdGlvbnMgTGV2ZWwgMVwiLFxyXG4gICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgIHRydWUsXHJcbiAgICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICAgICAgICAxMFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5Q29sb3JlZERlcHRMYXllciA9IGxheWVyO1xyXG4gICAgICAgICAgcmV0dXJuIGxheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVDb3VudHJ5Q29tbXVuZUxheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIkFkbWluaXN0cmF0aXZlIExldmVsIDJcIixcclxuICAgICAgICAgICAgICBmYWxzZSxcclxuICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlDb21tdW5lTGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlQ291bnRyeURlcHRMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBsYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlR3JvdXAoXHJcbiAgICAgICAgICAgICAgXCJBZG1pbmlzdHJhdGl2ZSBMZXZlbCAxXCIsXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5RGVwdExheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlEaXN0cmljdExheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIkFkbWluaXN0cmF0aXZlIExldmVsIDNcIixcclxuICAgICAgICAgICAgICBmYWxzZSxcclxuICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlEaXN0cmljdExheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlQbGFudGF0aW9uTGF5ZXIoXHJcbiAgICAgICAgICBjb3VudHJpZXNMYXllckxpc3QsXHJcbiAgICAgICAgICBjb3VudHJpZXNNYXJrZXJMaXN0XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCAmJiBjb3VudHJpZXNNYXJrZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsZXQgcGxhbnRhdGlvbkNsdXN0ZXIgPSB0aGlzLmNyZWF0ZU1hcmtlckNsdXN0ZXIoXCJQbGFudGF0aW9uc1wiKTtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIlBsYW50YXRpb24gTG9jYXRpb25zXCIsXHJcbiAgICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgICAgbGF5ZXIuYWRkTGF5ZXIocGxhbnRhdGlvbkNsdXN0ZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAocGxhbnRhdGlvbkNsdXN0ZXIsIGNvdW50cmllc01hcmtlckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMuY291bnRyeVBsYW50YXRpb25MYXllciA9IGxheWVyO1xyXG4gICAgICAgICAgcmV0dXJuIGxheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVDb3VudHJ5UHJvdGVjdGVkTGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsYXllciA9IHRoaXMuY3JlYXRlRmVhdHVyZUdyb3VwKFwiUHJvdGVjdGVkIEFyZWFzXCIsIGZhbHNlLCB0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKGxheWVyLCBjb3VudHJpZXNMYXllckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMuY291bnRyeVByb3RlY3RlZExheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBsYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlR3JvdXAoXHJcbiAgICAgICAgICAgICAgXCJBZG1pbmlzdHJhdGl2ZSBMZXZlbCAwXCIsXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5TGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlQ291bnRyeUJvcmRlckxheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIkFkbWluaXN0cmF0aXZlIEJvdW5kYXJpZXMgTGV2ZWwgMFwiLFxyXG4gICAgICAgICAgICAgIHRydWUsXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgZmFsc2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKGxheWVyLCBjb3VudHJpZXNMYXllckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMuY291bnRyeUJvcmRlckxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZU51cnNlcnlMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGNvdW50cmllc0xheWVyTGlzdCwgJyBHZW5lcmljIE51cnNlcmllcycpO1xyXG4gICAgICAgICAgbGV0IG1hcmtlckNsdXN0ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBtYXJrZXJDbHVzdGVyID0gdGhpcy5jcmVhdGVNYXJrZXJDbHVzdGVyKFwiTnVyc2VyeSBJbmZvcm1hdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKG1hcmtlckNsdXN0ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtYXJrZXJDbHVzdGVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLm51cnNlcnlMYXllciA9IG1hcmtlckNsdXN0ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbWFya2VyQ2x1c3RlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlUWFyTGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgbWFya2VyQ2x1c3RlcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1hcmtlckNsdXN0ZXIgPSB0aGlzLmNyZWF0ZU1hcmtlckNsdXN0ZXIoXCJXYXJlaG91c2UgTG9jYXRpb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChtYXJrZXJDbHVzdGVyLCBjb3VudHJpZXNMYXllckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbWFya2VyQ2x1c3RlciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5xYXJMYXllciA9IG1hcmtlckNsdXN0ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbWFya2VyQ2x1c3RlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlVHJhaW5pbmdMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBtYXJrZXJDbHVzdGVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbWFya2VyQ2x1c3RlciA9IHRoaXMuY3JlYXRlTWFya2VyQ2x1c3RlcihcclxuICAgICAgICAgICAgICBcIlRyYWluaW5nIEluZm9ybWF0aW9uXCIsXHJcbiAgICAgICAgICAgICAgZmFsc2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKG1hcmtlckNsdXN0ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtYXJrZXJDbHVzdGVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLnRyYWluaW5nTGF5ZXIgPSBtYXJrZXJDbHVzdGVyO1xyXG4gICAgICAgICAgcmV0dXJuIG1hcmtlckNsdXN0ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZVRyZWVEZW5zaXR5RXN0aW1hdGlvbkxheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIlRyZWUgRGVuc2l0eSBTYXRlbGxpdGUgRXN0aW1hdGlvblwiLFxyXG4gICAgICAgICAgICAgIGZhbHNlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLnRyZWVEZW5zaXR5RXN0aW1hdGlvbkxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZVByZWRpY3Rpb25zTGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsYXllciA9IHRoaXMuY3JlYXRlRmVhdHVyZUdyb3VwKFwiQ2FzaGV3IEdyb3dpbmcgQXJlYXNcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLnByZWRpY3Rpb25zTGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlRGVmb3Jlc3RhdGlvbihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBsYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlR3JvdXAoXHJcbiAgICAgICAgICAgICAgXCJEZWZvcmVzdGVkIEFyZWEgKDIwMjEgLSAyMDIyKSAoaGEpXCIsXHJcbiAgICAgICAgICAgICAgZmFsc2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKGxheWVyLCBjb3VudHJpZXNMYXllckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMuZGVmb3Jlc3RhdGlvbiA9IGxheWVyO1xyXG4gICAgICAgICAgcmV0dXJuIGxheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVBZm9yZXN0YXRpb24oY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsYXllciA9IHRoaXMuY3JlYXRlRmVhdHVyZUdyb3VwKFxyXG4gICAgICAgICAgICAgIFwiQWZmb3Jlc3RlZCBBcmVhICgyMDAwIC0gMjAxMikgKGhhKVwiLFxyXG4gICAgICAgICAgICAgIGZhbHNlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLmFmb3Jlc3RhdGlvbiA9IGxheWVyO1xyXG4gICAgICAgICAgcmV0dXJuIGxheWVyO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdlbmVyYXRlcyBsYXllcnMgZm9yIGEgZ2VuZXJpYyBtYXAgYmFzZWQgb24gb3V0ZGF0ZWQgbGF5ZXJzIGFuZCBsYW5ndWFnZSBzZXR0aW5ncy5cclxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmcgLSBUaGUgbGFuZ3VhZ2Ugc2V0dGluZy5cclxuICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dGRhdGVkTGF5ZXJzIC0gVGhlIG91dGRhdGVkIGxheWVycyBkYXRhLlxyXG4gICAgICAgKiBAcmV0dXJuIHtPYmplY3R8bnVsbH0gVGhlIGdlbmVyYXRlZCBsYXllcnMgb3IgbnVsbCBpbiBjYXNlIG9mIGFuIGVycm9yLlxyXG4gICAgICAgKi9cclxuICAgICAgZ2VuZXJhdGVNYXBMYXllcnMgPSBmdW5jdGlvbiBnZW5lcmF0ZU1hcExheWVyc0Z1bmN0aW9uKFxyXG4gICAgICAgIGxhbmcsXHJcbiAgICAgICAgb3V0ZGF0ZWRMYXllcnMsXHJcbiAgICAgICAgY291bnRyeSxcclxuICAgICAgICBpc0xheWVyc0J1aWx0ZWQgPSBmYWxzZVxyXG4gICAgICApIHtcclxuICAgICAgICBsZXQgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICBsZXQgY29udHJvbF9sYXllcjtcclxuICAgICAgICBpZiAoaXNMYXllcnNCdWlsdGVkICE9IGZhbHNlKSB7XHJcbiAgICAgICAgICBbY2FzaGV3TWFwLCBjb250cm9sX2xheWVyXSA9IGdldEJhc2VNYXAod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgYWN0aXZlQ291bnRyaWVzID0gT2JqZWN0LmtleXMob3V0ZGF0ZWRMYXllcnMpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB2YXIgZ2VuZXJpY01hcE9iaiA9IG5ldyBHZW5lcmljTWFwKCk7XHJcbiAgICAgICAgICBsZXQgbGF5ZXJzID0ge307XHJcbiAgICAgICAgICBmb3IgKGxldCBhdHRyaWJ1dGUgaW4gZ2VuZXJpY01hcE9iaikge1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgIWF0dHJpYnV0ZS5zdGFydHNXaXRoKFwiX1wiKSAmJlxyXG4gICAgICAgICAgICAgIGdlbmVyaWNNYXBPYmpbYXR0cmlidXRlXSA9PT0gbnVsbFxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICBsZXQgZnVuY3Rpb25OYW1lID0gYGdlbmVyYXRlJHthdHRyaWJ1dGVcclxuICAgICAgICAgICAgICAgIC5jaGFyQXQoMClcclxuICAgICAgICAgICAgICAgIC50b1VwcGVyQ2FzZSgpfSR7YXR0cmlidXRlLnNsaWNlKDEpfWA7XHJcbiAgICAgICAgICAgICAgbGV0IG1ldGhvZCA9IGdlbmVyaWNNYXBPYmpbZnVuY3Rpb25OYW1lXTtcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICBsYXllcnNbYXR0cmlidXRlXSA9IGNhbGxNYXBNZXRob2QoXHJcbiAgICAgICAgICAgICAgICAgIGdlbmVyaWNNYXBPYmosXHJcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uTmFtZSxcclxuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICBsYW5nLFxyXG4gICAgICAgICAgICAgICAgICBhY3RpdmVDb3VudHJpZXMsXHJcbiAgICAgICAgICAgICAgICAgIG91dGRhdGVkTGF5ZXJzXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgVGhlIGZ1bmN0aW9uICcke2Z1bmN0aW9uTmFtZX0nIGRvZXMgbm90IGV4aXN0LmApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbGF5ZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKFxyXG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhsYXllcnMpLmZpbHRlcigoW2ssIHZdKSA9PiB2ICE9PSBudWxsKVxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBpZiAoaXNMYXllcnNCdWlsdGVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbGF5ZXJzO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2FzaGV3TWFwLm9uKFwib3ZlcmxheWFkZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICBldmVudC5sYXllci5icmluZ1RvRnJvbnQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdtYXAgbGF5ZXJzIGdlbmVyaWMnLCBsYXllcnMpO1xyXG4gICAgICAgICAgICBjYXNoZXdNYXAgPSBhZGRMYXllcnNUb01hcChjYXNoZXdNYXAsIGxheWVycyk7XHJcbiAgICAgICAgICAgIG9yZGVyaW5nTGF5ZXJzKGNhc2hld01hcCwgbGF5ZXJzKTtcclxuICAgICAgICAgICAgYWRkSG9tZUJ1dHRvblRvTWFwKGNhc2hld01hcCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGxheWVycykuZm9yRWFjaCgobGF5ZXJOYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgc3dpdGNoIChsYXllcnNbbGF5ZXJOYW1lXS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcclxuICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICFbXCJBZG1pbmlzdHJhdGl2ZSBCb3VuZGFyaWVzIExldmVsIDBcIl0uaW5jbHVkZXMoXHJcbiAgICAgICAgICAgICAgICAgICAgICBsYXllcnNbbGF5ZXJOYW1lXS5vcHRpb25zLm5hbWVcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xfbGF5ZXIuYWRkT3ZlcmxheShcclxuICAgICAgICAgICAgICAgICAgICAgIGxheWVyc1tsYXllck5hbWVdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGF5ZXJzW2xheWVyTmFtZV0ub3B0aW9ucy5uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAhW1wiQWRtaW5pc3RyYXRpdmUgQm91bmRhcmllcyBMZXZlbCAwXCJdLmluY2x1ZGVzKFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGF5ZXJzW2xheWVyTmFtZV0ubmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbF9sYXllci5hZGRPdmVybGF5KFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGF5ZXJzW2xheWVyTmFtZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBsYXllcnNbbGF5ZXJOYW1lXS5uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBgVG90YWwgbG9hZGluZyB0aW1lOiAkeygoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgLyAxMDAwKS50b0ZpeGVkKFxyXG4gICAgICAgICAgICAgICAgMlxyXG4gICAgICAgICAgICAgICl9IHNlY29uZHNgXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY2FzaGV3TWFwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBDYWxscyB0aGUgYXBwcm9wcmlhdGUgbGF5ZXIgbWV0aG9kIGJhc2VkIG9uIHRoZSBmdW5jdGlvbiBuYW1lIGFuZCBwYXJhbWV0ZXJzLlxyXG4gICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZXRob2QgLSBUaGUgbWV0aG9kIHRvIGJlIGNhbGxlZC5cclxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvbi5cclxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmcgLSBUaGUgbGFuZ3VhZ2Ugc2V0dGluZy5cclxuICAgICAgICogQHBhcmFtIHtBcnJheX0gYWN0aXZlQ291bnRyaWVzIC0gQXJyYXkgb2YgYWN0aXZlIGNvdW50cmllcy5cclxuICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dGRhdGVkTGF5ZXJzIC0gVGhlIG91dGRhdGVkIGxheWVycy5cclxuICAgICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgcmVzdWx0IG9mIHRoZSBtZXRob2QgY2FsbC5cclxuICAgICAgICovXHJcbiAgICAgIGZ1bmN0aW9uIGNhbGxNYXBNZXRob2QoXHJcbiAgICAgICAgbWFwT2JqZWN0LFxyXG4gICAgICAgIGZ1bmN0aW9uTmFtZSxcclxuICAgICAgICBtYXBfY2xhc3NfYXR0cmlidXRlX25hbWUsXHJcbiAgICAgICAgbGFuZyxcclxuICAgICAgICBhY3RpdmVDb3VudHJpZXMsXHJcbiAgICAgICAgb3V0ZGF0ZWRMYXllcnNcclxuICAgICAgKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZmlsdGVyX2FycmF5KG91dGRhdGVkTGF5ZXJzLCBjb3VudHJ5LCBsYW5nLCBtYXBfY2xhc3NfYXR0cmlidXRlX25hbWUpIHtcclxuICAgICAgICAgIGxldCB2YWx1ZSA9IG91dGRhdGVkTGF5ZXJzW2NvdW50cnldW2xhbmddW2dldFZhbHVlSWdub3JlQ2FzZShvdXRkYXRlZExheWVyc1tjb3VudHJ5XVtsYW5nXSwgcmVwbGFjZVVwcGVyQ2FzZVdpdGhVbmRlcnNjb3JlKG1hcF9jbGFzc19hdHRyaWJ1dGVfbmFtZSkpXTtcclxuICAgICAgICAgIGlmICh2YWx1ZSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gW11cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZ1bmN0aW9uTmFtZSAhPT0gXCJnZW5lcmF0ZUNvdW50cnlQbGFudGF0aW9uTGF5ZXJcIikge1xyXG4gICAgICAgICAgbGV0IHJlc3VsdCA9IG1hcE9iamVjdFtmdW5jdGlvbk5hbWVdKFxyXG4gICAgICAgICAgICBhY3RpdmVDb3VudHJpZXMubWFwKFxyXG4gICAgICAgICAgICAgIChjb3VudHJ5KSA9PiBmaWx0ZXJfYXJyYXkob3V0ZGF0ZWRMYXllcnMsIGNvdW50cnksIGxhbmcsIG1hcF9jbGFzc19hdHRyaWJ1dGVfbmFtZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGxldCByZXN1bHQgPSBtYXBPYmplY3RbZnVuY3Rpb25OYW1lXShcclxuICAgICAgICAgICAgYWN0aXZlQ291bnRyaWVzLm1hcChcclxuICAgICAgICAgICAgICAoY291bnRyeSkgPT5cclxuICAgICAgICAgICAgICAgIG91dGRhdGVkTGF5ZXJzW2NvdW50cnldW2xhbmddW1xyXG4gICAgICAgICAgICAgICAgZ2V0VmFsdWVJZ25vcmVDYXNlKFxyXG4gICAgICAgICAgICAgICAgICBvdXRkYXRlZExheWVyc1tjb3VudHJ5XVtsYW5nXSxcclxuICAgICAgICAgICAgICAgICAgcmVwbGFjZVVwcGVyQ2FzZVdpdGhVbmRlcnNjb3JlKG1hcF9jbGFzc19hdHRyaWJ1dGVfbmFtZSlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgYWN0aXZlQ291bnRyaWVzLm1hcChcclxuICAgICAgICAgICAgICAoY291bnRyeSkgPT5cclxuICAgICAgICAgICAgICAgIG91dGRhdGVkTGF5ZXJzW2NvdW50cnldW2xhbmddW1wiY291bnRyeV9wbGFudGF0aW9uX21hcmtlclwiXVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAodXNlclJvbGUgPT0gXCJcIikge1xyXG4gICAgICBjbGFzcyBQdWJsaWNNYXAge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5TGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5Qm9yZGVyTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5RGVwdExheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuY291bnRyeUNvbW11bmVMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlEaXN0cmljdExheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuY291bnRyeVByb3RlY3RlZExheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMucHJlZGljdGlvbnNMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLmRlZm9yZXN0YXRpb24gPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVDb3VudHJ5Q29tbXVuZUxheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGNvdW50cnlDb21tdW5lTGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb3VudHJ5Q29tbXVuZUxheWVyID0gTC5mZWF0dXJlR3JvdXAoe1xyXG4gICAgICAgICAgICAgIG5hbWU6IFwiQWRtaW5pc3RyYXRpdmUgTGV2ZWwgMlwiLFxyXG4gICAgICAgICAgICAgIHNob3c6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIG92ZXJsYXk6IHRydWUsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb3VudHJ5Q29tbXVuZUxheWVyLm5hbWUgPSBcIkFkbWluaXN0cmF0aXZlIExldmVsIDJcIjtcclxuICAgICAgICAgICAgY291bnRyaWVzTGF5ZXJMaXN0LmZvckVhY2goXHJcbiAgICAgICAgICAgICAgKG9iaikgPT5cclxuICAgICAgICAgICAgICAgIG9iaiAmJiBvYmouZm9yRWFjaCgoZWxtdCkgPT4gY291bnRyeUNvbW11bmVMYXllci5hZGRMYXllcihlbG10KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5Q29tbXVuZUxheWVyID0gY291bnRyeUNvbW11bmVMYXllcjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvdW50cnlDb21tdW5lTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHJldHVybiBjb3VudHJ5Q29tbXVuZUxheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVDb3VudHJ5RGVwdExheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGNvdW50cnlEZXB0TGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb3VudHJ5RGVwdExheWVyID0gTC5mZWF0dXJlR3JvdXAoe1xyXG4gICAgICAgICAgICAgIG5hbWU6IFwiQWRtaW5pc3RyYXRpdmUgTGV2ZWwgMVwiLFxyXG4gICAgICAgICAgICAgIHNob3c6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIG92ZXJsYXk6IHRydWUsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb3VudHJ5RGVwdExheWVyLm5hbWUgPSBcIkFkbWluaXN0cmF0aXZlIExldmVsIDFcIjtcclxuICAgICAgICAgICAgY291bnRyaWVzTGF5ZXJMaXN0LmZvckVhY2goXHJcbiAgICAgICAgICAgICAgKG9iaikgPT5cclxuICAgICAgICAgICAgICAgIG9iaiAmJiBvYmouZm9yRWFjaCgoZWxtdCkgPT4gY291bnRyeURlcHRMYXllci5hZGRMYXllcihlbG10KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5RGVwdExheWVyID0gY291bnRyeURlcHRMYXllcjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvdW50cnlEZXB0TGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHJldHVybiBjb3VudHJ5RGVwdExheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVDb3VudHJ5RGlzdHJpY3RMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBjb3VudHJ5RGlzdHJpY3RMYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvdW50cnlEaXN0cmljdExheWVyID0gTC5mZWF0dXJlR3JvdXAoe1xyXG4gICAgICAgICAgICAgIG5hbWU6IFwiQWRtaW5pc3RyYXRpdmUgTGV2ZWwgM1wiLFxyXG4gICAgICAgICAgICAgIHNob3c6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIG92ZXJsYXk6IHRydWUsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb3VudHJ5RGlzdHJpY3RMYXllci5uYW1lID0gXCJBZG1pbmlzdHJhdGl2ZSBMZXZlbCAzXCI7XHJcbiAgICAgICAgICAgIGNvdW50cmllc0xheWVyTGlzdC5mb3JFYWNoKFxyXG4gICAgICAgICAgICAgIChvYmopID0+XHJcbiAgICAgICAgICAgICAgICBvYmogJiYgb2JqLmZvckVhY2goKGVsbXQpID0+IGNvdW50cnlEaXN0cmljdExheWVyLmFkZExheWVyKGVsbXQpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlEaXN0cmljdExheWVyID0gY291bnRyeURpc3RyaWN0TGF5ZXI7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb3VudHJ5RGlzdHJpY3RMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGNvdW50cnlEaXN0cmljdExheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVDb3VudHJ5UHJvdGVjdGVkTGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgY291bnRyeVByb3RlY3RlZExheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY291bnRyeVByb3RlY3RlZExheWVyID0gTC5mZWF0dXJlR3JvdXAoe1xyXG4gICAgICAgICAgICAgIG5hbWU6IFwiUHJvdGVjdGVkIEFyZWFzXCIsXHJcbiAgICAgICAgICAgICAgc2hvdzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgb3ZlcmxheTogdHJ1ZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvdW50cnlQcm90ZWN0ZWRMYXllci5uYW1lID0gXCJQcm90ZWN0ZWQgQXJlYXNcIjtcclxuICAgICAgICAgICAgY291bnRyaWVzTGF5ZXJMaXN0LmZvckVhY2goXHJcbiAgICAgICAgICAgICAgKG9iaikgPT5cclxuICAgICAgICAgICAgICAgIG9iaiAmJiBvYmouZm9yRWFjaCgoZWxtdCkgPT4gY291bnRyeVByb3RlY3RlZExheWVyLmFkZExheWVyKGVsbXQpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlQcm90ZWN0ZWRMYXllciA9IGNvdW50cnlQcm90ZWN0ZWRMYXllcjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvdW50cnlQcm90ZWN0ZWRMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGNvdW50cnlQcm90ZWN0ZWRMYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlQ291bnRyeUxheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGNvdW50cnlMYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvdW50cnlMYXllciA9IEwuZmVhdHVyZUdyb3VwKHtcclxuICAgICAgICAgICAgICBuYW1lOiBcIkFkbWluaXN0cmF0aXZlIExldmVsIDBcIixcclxuICAgICAgICAgICAgICBzaG93OiBmYWxzZSxcclxuICAgICAgICAgICAgICBvdmVybGF5OiB0cnVlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY291bnRyeUxheWVyLm5hbWUgPSBcIkFkbWluaXN0cmF0aXZlIExldmVsIDBcIjtcclxuICAgICAgICAgICAgY291bnRyaWVzTGF5ZXJMaXN0LmZvckVhY2goXHJcbiAgICAgICAgICAgICAgKG9iaikgPT4gb2JqICYmIG9iai5mb3JFYWNoKChlbG10KSA9PiBjb3VudHJ5TGF5ZXIuYWRkTGF5ZXIoZWxtdCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUxheWVyID0gY291bnRyeUxheWVyO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY291bnRyeUxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICByZXR1cm4gY291bnRyeUxheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVDb3VudHJ5Qm9yZGVyTGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgY291bnRyeUJvcmRlckxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY291bnRyeUJvcmRlckxheWVyID0gTC5mZWF0dXJlR3JvdXAoe1xyXG4gICAgICAgICAgICAgIG5hbWU6IFwiQWRtaW5pc3RyYXRpdmUgQm91bmRhcmllcyBMZXZlbCAwXCIsXHJcbiAgICAgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuICAgICAgICAgICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgICAgICAgICAgICBjb250cm9sOiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvdW50cnlCb3JkZXJMYXllci5uYW1lID0gXCJBZG1pbmlzdHJhdGl2ZSBCb3VuZGFyaWVzIExldmVsIDBcIjtcclxuICAgICAgICAgICAgY291bnRyaWVzTGF5ZXJMaXN0LmZvckVhY2goXHJcbiAgICAgICAgICAgICAgKG9iaikgPT5cclxuICAgICAgICAgICAgICAgIG9iaiAmJiBvYmouZm9yRWFjaCgoZWxtdCkgPT4gY291bnRyeUJvcmRlckxheWVyLmFkZExheWVyKGVsbXQpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlCb3JkZXJMYXllciA9IGNvdW50cnlCb3JkZXJMYXllcjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvdW50cnlCb3JkZXJMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGNvdW50cnlCb3JkZXJMYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlUHJlZGljdGlvbnNMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBwcmVkaWN0aW9uc0xheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcHJlZGljdGlvbnNMYXllciA9IEwuZmVhdHVyZUdyb3VwKHtcclxuICAgICAgICAgICAgICBuYW1lOiBcIkNhc2hldyBHcm93aW5nIEFyZWFzXCIsXHJcbiAgICAgICAgICAgICAgc2hvdzogdHJ1ZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHByZWRpY3Rpb25zTGF5ZXIubmFtZSA9IFwiQ2FzaGV3IEdyb3dpbmcgQXJlYXNcIjtcclxuICAgICAgICAgICAgY291bnRyaWVzTGF5ZXJMaXN0LmZvckVhY2goXHJcbiAgICAgICAgICAgICAgKG9iaikgPT5cclxuICAgICAgICAgICAgICAgIG9iaiAmJiBvYmouZm9yRWFjaCgoZWxtdCkgPT4gcHJlZGljdGlvbnNMYXllci5hZGRMYXllcihlbG10KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5wcmVkaWN0aW9uc0xheWVyID0gcHJlZGljdGlvbnNMYXllcjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHByZWRpY3Rpb25zTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHJldHVybiBwcmVkaWN0aW9uc0xheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVEZWZvcmVzdGF0aW9uKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGRlZm9yZXN0YXRpb25MYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGRlZm9yZXN0YXRpb25MYXllciA9IEwuZmVhdHVyZUdyb3VwKHtcclxuICAgICAgICAgICAgICBuYW1lOiBcIkRlZm9yZXN0YXRpb24gKDIwMjEgLSAyMDIyKVwiLFxyXG4gICAgICAgICAgICAgIHNob3c6IGZhbHNlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZGVmb3Jlc3RhdGlvbkxheWVyLm5hbWUgPSBcIkRlZm9yZXN0YXRpb24gKDIwMjEgLSAyMDIyKVwiO1xyXG4gICAgICAgICAgICBjb3VudHJpZXNMYXllckxpc3QuZm9yRWFjaChcclxuICAgICAgICAgICAgICAob2JqKSA9PlxyXG4gICAgICAgICAgICAgICAgb2JqICYmIG9iai5mb3JFYWNoKChlbG10KSA9PiBkZWZvcmVzdGF0aW9uTGF5ZXIuYWRkTGF5ZXIoZWxtdCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmb3Jlc3RhdGlvbiA9IGRlZm9yZXN0YXRpb25MYXllcjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRlZm9yZXN0YXRpb25MYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGRlZm9yZXN0YXRpb25MYXllcjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZW5lcmF0ZXMgbGF5ZXJzIGZvciBhIHB1YmxpYyBtYXAgYmFzZWQgb24gb3V0ZGF0ZWQgbGF5ZXJzIGFuZCBsYW5ndWFnZSBzZXR0aW5ncy5cclxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmcgLSBUaGUgbGFuZ3VhZ2Ugc2V0dGluZy5cclxuICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dGRhdGVkTGF5ZXJzIC0gVGhlIG91dGRhdGVkIGxheWVycyBkYXRhLlxyXG4gICAgICAgKiBAcmV0dXJuIHtQcm9taXNlPE9iamVjdHxudWxsPn0gVGhlIGdlbmVyYXRlZCBsYXllcnMgb3IgbnVsbCBpbiBjYXNlIG9mIGFuIGVycm9yLlxyXG4gICAgICAgKi9cclxuICAgICAgZ2VuZXJhdGVNYXBMYXllcnMgPSBmdW5jdGlvbiBnZW5lcmF0ZU1hcExheWVyc0Z1bmN0aW9uKFxyXG4gICAgICAgIGxhbmcsXHJcbiAgICAgICAgb3V0ZGF0ZWRMYXllcnMsXHJcbiAgICAgICAgY291bnRyeSxcclxuICAgICAgICBpc0xheWVyc0J1aWx0ZWQgPSBmYWxzZVxyXG4gICAgICApIHtcclxuICAgICAgICBsZXQgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICBsZXQgY29udHJvbF9sYXllcjtcclxuICAgICAgICBpZiAoaXNMYXllcnNCdWlsdGVkICE9IGZhbHNlKSB7XHJcbiAgICAgICAgICBbY2FzaGV3TWFwLCBjb250cm9sX2xheWVyXSA9IGdldEJhc2VNYXAod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgYWN0aXZlQ291bnRyaWVzID0gT2JqZWN0LmtleXMob3V0ZGF0ZWRMYXllcnMpO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgbGV0IHB1YmxpY01hcE9iaiA9IG5ldyBQdWJsaWNNYXAoKTtcclxuICAgICAgICAgIGxldCBsYXllcnMgPSB7fTtcclxuICAgICAgICAgIGZvciAobGV0IGF0dHJpYnV0ZSBpbiBwdWJsaWNNYXBPYmopIHtcclxuICAgICAgICAgICAgbGV0IGZ1bmN0aW9uTmFtZSA9IGBnZW5lcmF0ZSR7YXR0cmlidXRlXHJcbiAgICAgICAgICAgICAgLmNoYXJBdCgwKVxyXG4gICAgICAgICAgICAgIC50b1VwcGVyQ2FzZSgpfSR7YXR0cmlidXRlLnNsaWNlKDEpfWA7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAhYXR0cmlidXRlLnN0YXJ0c1dpdGgoXCJfXCIpICYmXHJcbiAgICAgICAgICAgICAgcHVibGljTWFwT2JqW2F0dHJpYnV0ZV0gPT09IG51bGwgJiZcclxuICAgICAgICAgICAgICB0eXBlb2YgcHVibGljTWFwT2JqW2Z1bmN0aW9uTmFtZV0gPT09IFwiZnVuY3Rpb25cIlxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICBsZXQgbGF5ZXJEYXRhID0gYWN0aXZlQ291bnRyaWVzLm1hcChcclxuICAgICAgICAgICAgICAgIChjdXJyZW50X2NvdW50cnkpID0+XHJcbiAgICAgICAgICAgICAgICAgIG91dGRhdGVkTGF5ZXJzW2N1cnJlbnRfY291bnRyeV1bbGFuZ11bXHJcbiAgICAgICAgICAgICAgICAgIGdldFZhbHVlSWdub3JlQ2FzZShcclxuICAgICAgICAgICAgICAgICAgICBvdXRkYXRlZExheWVyc1tjdXJyZW50X2NvdW50cnldW2xhbmddLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2VVcHBlckNhc2VXaXRoVW5kZXJzY29yZShhdHRyaWJ1dGUpXHJcbiAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgbGF5ZXJzW2F0dHJpYnV0ZV0gPSBwdWJsaWNNYXBPYmpbZnVuY3Rpb25OYW1lXShsYXllckRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGF5ZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKFxyXG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhsYXllcnMpLmZpbHRlcigoW2ssIHZdKSA9PiB2ICE9IG51bGwpXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGlmIChpc0xheWVyc0J1aWx0ZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgIGBUb3RhbCBsb2FkaW5nIHRpbWU6ICR7KERhdGUubm93KCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2BcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmV0dXJuIGxheWVycztcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhc2hld01hcC5vbihcIm92ZXJsYXlhZGRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgZXZlbnQubGF5ZXIuYnJpbmdUb0Zyb250KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjYXNoZXdNYXAgPSBhZGRMYXllcnNUb01hcChjYXNoZXdNYXAsIGxheWVycyk7XHJcbiAgICAgICAgICAgIG9yZGVyaW5nTGF5ZXJzKGNhc2hld01hcCwgbGF5ZXJzKTtcclxuICAgICAgICAgICAgYWRkSG9tZUJ1dHRvblRvTWFwKGNhc2hld01hcCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGxheWVycykuZm9yRWFjaCgobGF5ZXJOYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgc3dpdGNoIChsYXllcnNbbGF5ZXJOYW1lXS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcclxuICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICFbXCJBZG1pbmlzdHJhdGl2ZSBCb3VuZGFyaWVzIExldmVsIDBcIl0uaW5jbHVkZXMoXHJcbiAgICAgICAgICAgICAgICAgICAgICBsYXllcnNbbGF5ZXJOYW1lXS5vcHRpb25zLm5hbWVcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xfbGF5ZXIuYWRkT3ZlcmxheShcclxuICAgICAgICAgICAgICAgICAgICAgIGxheWVyc1tsYXllck5hbWVdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGF5ZXJzW2xheWVyTmFtZV0ub3B0aW9ucy5uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAhW1wiQWRtaW5pc3RyYXRpdmUgQm91bmRhcmllcyBMZXZlbCAwXCJdLmluY2x1ZGVzKFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGF5ZXJzW2xheWVyTmFtZV0ubmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbF9sYXllci5hZGRPdmVybGF5KFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGF5ZXJzW2xheWVyTmFtZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBsYXllcnNbbGF5ZXJOYW1lXS5uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBgVG90YWwgbG9hZGluZyB0aW1lOiAkeygoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgLyAxMDAwKS50b0ZpeGVkKFxyXG4gICAgICAgICAgICAgICAgMlxyXG4gICAgICAgICAgICAgICl9IHNlY29uZHNgXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY2FzaGV3TWFwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNsYXNzIERlZmF1bHRNYXAge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5TGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5Qm9yZGVyTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5RGVwdExheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuY291bnRyeUNvbW11bmVMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlEaXN0cmljdExheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuY291bnRyeUNvbG9yZWREZXB0TGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5Q29sb3JlZENvbW11bmVMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlQcm90ZWN0ZWRMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlQbGFudGF0aW9uTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5xYXJMYXllciA9IG51bGw7XHJcbiAgICAgICAgICB0aGlzLnRyYWluaW5nTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5udXJzZXJ5TGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5wcmVkaWN0aW9uc0xheWVyID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMudHJlZURlbnNpdHlFc3RpbWF0aW9uTGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5kZWZvcmVzdGF0aW9uID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuYWZvcmVzdGF0aW9uID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICBzaG93ID0gZmFsc2UsXHJcbiAgICAgICAgICBvdmVybGF5ID0gdHJ1ZSxcclxuICAgICAgICAgIGNvbnRyb2wgPSB0cnVlLFxyXG4gICAgICAgICAgekluZGV4T2Zmc2V0ID0gMFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgbGV0IGZlYXR1cmVHcm91cCA9IEwuZmVhdHVyZUdyb3VwKCk7XHJcbiAgICAgICAgICBmZWF0dXJlR3JvdXAubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgICBmZWF0dXJlR3JvdXAub3B0aW9ucyA9IHsgbmFtZSwgc2hvdywgb3ZlcmxheSwgY29udHJvbCwgekluZGV4T2Zmc2V0IH07XHJcbiAgICAgICAgICByZXR1cm4gZmVhdHVyZUdyb3VwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3JlYXRlTWFya2VyQ2x1c3RlcihuYW1lKSB7XHJcbiAgICAgICAgICB2YXIgbWFya2VyX0NsdXN0ZXIgPSBMLm1hcmtlckNsdXN0ZXJHcm91cCh7IG5hbWU6IG5hbWUgfSk7XHJcbiAgICAgICAgICByZXR1cm4gbWFya2VyX0NsdXN0ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhZGRMYXllcnNUb0dyb3VwKGxheWVyR3JvdXAsIGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgY291bnRyaWVzTGF5ZXJMaXN0ID0gY291bnRyaWVzTGF5ZXJMaXN0IHx8IFtdO1xyXG4gICAgICAgICAgKGNvdW50cmllc0xheWVyTGlzdCB8fCBbXSkuZm9yRWFjaCgoZWxtdCkgPT4ge1xyXG4gICAgICAgICAgICBlbG10LmFkZFRvKGxheWVyR3JvdXApO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlDb2xvcmVkQ29tbXVuZUxheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIkdBVUwyIFRyYWluaW5nIFJlY29tbWVuZGF0aW9uc1wiLFxyXG4gICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgIHRydWVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKGxheWVyLCBjb3VudHJpZXNMYXllckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMuY291bnRyeUNvbG9yZWRDb21tdW5lTGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlQ291bnRyeUNvbG9yZWREZXB0TGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsYXllciA9IHRoaXMuY3JlYXRlRmVhdHVyZUdyb3VwKFxyXG4gICAgICAgICAgICAgIFwiR0FVTDEgVHJhaW5pbmcgUmVjb21tZW5kYXRpb25zXCIsXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICAgICAgICB0cnVlLFxyXG4gICAgICAgICAgICAgIDEwXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlDb2xvcmVkRGVwdExheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlDb21tdW5lTGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0LCBjb3VudHJ5KSB7XHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsYXllciA9IHRoaXMuY3JlYXRlRmVhdHVyZUdyb3VwKFxyXG4gICAgICAgICAgICAgIGAke2NvdW50cnl9ICR7dXNlckNvdW50cnlsZXZlbDJOYW1lfWAsXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5Q29tbXVuZUxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlEZXB0TGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0LCBjb3VudHJ5KSB7XHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsYXllciA9IHRoaXMuY3JlYXRlRmVhdHVyZUdyb3VwKFxyXG4gICAgICAgICAgICAgIGAke2NvdW50cnl9ICR7dXNlckNvdW50cnlsZXZlbDFOYW1lfWAsXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5RGVwdExheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlEaXN0cmljdExheWVyKGNvdW50cmllc0xheWVyTGlzdCwgY291bnRyeSkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ2luIGdlbmVyYXRlQ291bnRyeURpc3RyaWN0TGF5ZXIgUGFzc2VkICcsIGNvdW50cmllc0xheWVyTGlzdCwgY291bnRyeSlcclxuICAgICAgICAgIGxldCBsYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlR3JvdXAoXHJcbiAgICAgICAgICAgICAgYCR7Y291bnRyeX0gJHt1c2VyQ291bnRyeUxldmVsM05hbWV9YCxcclxuICAgICAgICAgICAgICBmYWxzZSxcclxuICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlEaXN0cmljdExheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlQbGFudGF0aW9uTGF5ZXIoXHJcbiAgICAgICAgICBjb3VudHJpZXNMYXllckxpc3QsXHJcbiAgICAgICAgICBjb3VudHJpZXNNYXJrZXJMaXN0XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnaW4gZ2VuZXJhdGVDb3VudHJ5UGxhbnRhdGlvbkxheWVyIFBhc3NlZCAnLCBjb3VudHJpZXNMYXllckxpc3QsIGNvdW50cmllc01hcmtlckxpc3QpXHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCAmJiBjb3VudHJpZXNNYXJrZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsZXQgcGxhbnRhdGlvbkNsdXN0ZXIgPSB0aGlzLmNyZWF0ZU1hcmtlckNsdXN0ZXIoXCJQbGFudGF0aW9uc1wiKTtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIlBsYW50YXRpb24gTG9jYXRpb25zXCIsXHJcbiAgICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgICAgbGF5ZXIuYWRkTGF5ZXIocGxhbnRhdGlvbkNsdXN0ZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAocGxhbnRhdGlvbkNsdXN0ZXIsIGNvdW50cmllc01hcmtlckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdkZWZhdWx0IGdlbmVyYXRlZCBwbGFudGF0aW9uIGxheWVyICcsIGxheWVyKVxyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5UGxhbnRhdGlvbkxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUNvdW50cnlQcm90ZWN0ZWRMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBsYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlR3JvdXAoXCJQcm90ZWN0ZWQgQXJlYXNcIiwgZmFsc2UsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5UHJvdGVjdGVkTGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlQ291bnRyeUxheWVyKGNvdW50cmllc0xheWVyTGlzdCwgY291bnRyeSkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBgJHtjb3VudHJ5fSBSZXB1YmxpY2AsXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5jb3VudHJ5TGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlQ291bnRyeUJvcmRlckxheWVyKGNvdW50cmllc0xheWVyTGlzdCwgY291bnRyeSkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBgJHtjb3VudHJ5fSBCb3VuZGFyaWVzIFJlcHVibGljYCxcclxuICAgICAgICAgICAgICB0cnVlLFxyXG4gICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgIGZhbHNlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzVG9Hcm91cChsYXllciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLmNvdW50cnlCb3JkZXJMYXllciA9IGxheWVyO1xyXG4gICAgICAgICAgcmV0dXJuIGxheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVOdXJzZXJ5TGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgbWFya2VyQ2x1c3RlcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1hcmtlckNsdXN0ZXIgPSB0aGlzLmNyZWF0ZU1hcmtlckNsdXN0ZXIoXCJOdXJzZXJ5IEluZm9ybWF0aW9uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobWFya2VyQ2x1c3RlciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG1hcmtlckNsdXN0ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMubnVyc2VyeUxheWVyID0gbWFya2VyQ2x1c3RlcjtcclxuICAgICAgICAgIHJldHVybiBtYXJrZXJDbHVzdGVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVRYXJMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBtYXJrZXJDbHVzdGVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbWFya2VyQ2x1c3RlciA9IHRoaXMuY3JlYXRlTWFya2VyQ2x1c3RlcihcIldhcmVob3VzZSBMb2NhdGlvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKG1hcmtlckNsdXN0ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtYXJrZXJDbHVzdGVyID0gbnVsbDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICB0aGlzLnFhckxheWVyID0gbWFya2VyQ2x1c3RlcjtcclxuICAgICAgICAgIHJldHVybiBtYXJrZXJDbHVzdGVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVUcmFpbmluZ0xheWVyKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IG1hcmtlckNsdXN0ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBtYXJrZXJDbHVzdGVyID0gdGhpcy5jcmVhdGVNYXJrZXJDbHVzdGVyKFxyXG4gICAgICAgICAgICAgIFwiVHJhaW5pbmcgSW5mb3JtYXRpb25cIixcclxuICAgICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobWFya2VyQ2x1c3RlciwgY291bnRyaWVzTGF5ZXJMaXN0KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG1hcmtlckNsdXN0ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMudHJhaW5pbmdMYXllciA9IG1hcmtlckNsdXN0ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbWFya2VyQ2x1c3RlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlVHJlZURlbnNpdHlFc3RpbWF0aW9uTGF5ZXIoY291bnRyaWVzTGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICBpZiAoY291bnRyaWVzTGF5ZXJMaXN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsYXllciA9IHRoaXMuY3JlYXRlRmVhdHVyZUdyb3VwKFxyXG4gICAgICAgICAgICAgIFwiVHJlZSBEZW5zaXR5IFNhdGVsbGl0ZSBFc3RpbWF0aW9uXCIsXHJcbiAgICAgICAgICAgICAgZmFsc2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKGxheWVyLCBjb3VudHJpZXNMYXllckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMudHJlZURlbnNpdHlFc3RpbWF0aW9uTGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdlbmVyYXRlUHJlZGljdGlvbnNMYXllcihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBsYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlR3JvdXAoXCJDYXNoZXcgR3Jvd2luZyBBcmVhc1wiLCB0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKGxheWVyLCBjb3VudHJpZXNMYXllckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMucHJlZGljdGlvbnNMYXllciA9IGxheWVyO1xyXG4gICAgICAgICAgcmV0dXJuIGxheWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2VuZXJhdGVEZWZvcmVzdGF0aW9uKGNvdW50cmllc0xheWVyTGlzdCkge1xyXG4gICAgICAgICAgbGV0IGxheWVyO1xyXG4gICAgICAgICAgaWYgKGNvdW50cmllc0xheWVyTGlzdCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVHcm91cChcclxuICAgICAgICAgICAgICBcIkRlZm9yZXN0ZWQgQXJlYSAoMjAyMSAtIDIwMjIpIChoYSlcIixcclxuICAgICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExheWVyc1RvR3JvdXAobGF5ZXIsIGNvdW50cmllc0xheWVyTGlzdCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllciA9IG51bGw7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5kZWZvcmVzdGF0aW9uID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZW5lcmF0ZUFmb3Jlc3RhdGlvbihjb3VudHJpZXNMYXllckxpc3QpIHtcclxuICAgICAgICAgIGxldCBsYXllcjtcclxuICAgICAgICAgIGlmIChjb3VudHJpZXNMYXllckxpc3QgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlR3JvdXAoXHJcbiAgICAgICAgICAgICAgXCJBZmZvcmVzdGVkIEFyZWEgKDIwMDAgLSAyMDEyKSAoaGEpXCIsXHJcbiAgICAgICAgICAgICAgZmFsc2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcnNUb0dyb3VwKGxheWVyLCBjb3VudHJpZXNMYXllckxpc3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMuYWZvcmVzdGF0aW9uID0gbGF5ZXI7XHJcbiAgICAgICAgICByZXR1cm4gbGF5ZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogR2VuZXJhdGVzIG1hcCBsYXllcnMgYmFzZWQgb24gb3V0ZGF0ZWQgbGF5ZXJzIGFuZCBjb3VudHJ5LXNwZWNpZmljIGRhdGEuXHJcbiAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRkYXRlZExheWVycyAtIFRoZSBvdXRkYXRlZCBsYXllcnMgdG8gYmUgdXBkYXRlZC5cclxuICAgICAgICogQHBhcmFtIHtPYmplY3R9IGNvdW50cnkgLSBUaGUgY291bnRyeS1zcGVjaWZpYyBkYXRhIGZvciBjZXJ0YWluIGxheWVycy5cclxuICAgICAgICogQHJldHVybiB7T2JqZWN0fG51bGx9IFRoZSB1cGRhdGVkIGxheWVycyBvciBudWxsIGluIGNhc2Ugb2YgYW4gZXJyb3IuXHJcbiAgICAgICAqL1xyXG4gICAgICBnZW5lcmF0ZU1hcExheWVycyA9IGZ1bmN0aW9uIGdlbmVyYXRlTWFwTGF5ZXJzRnVuY3Rpb24oXHJcbiAgICAgICAgbGFuZyxcclxuICAgICAgICBvdXRkYXRlZExheWVycyxcclxuICAgICAgICBjb3VudHJ5LFxyXG4gICAgICAgIGlzTGF5ZXJzQnVpbGRlZCA9IGZhbHNlXHJcbiAgICAgICkge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgbGV0IGNvbnRyb2xfbGF5ZXI7XHJcbiAgICAgICAgaWYgKGlzTGF5ZXJzQnVpbGRlZCAhPSBmYWxzZSkge1xyXG4gICAgICAgICAgW2Nhc2hld01hcCwgY29udHJvbF9sYXllcl0gPSBnZXRCYXNlTWFwKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGxldCBsYXllcnMgPSB7fTtcclxuICAgICAgICAgIHZhciBkZWZhdWx0TWFwT2JqID0gbmV3IERlZmF1bHRNYXAoKTtcclxuICAgICAgICAgIGNvbnN0IG1ldGhvZFdpdGhDb3VudHJ5ID0gW1xyXG4gICAgICAgICAgICBcImdlbmVyYXRlQ291bnRyeUNvbW11bmVMYXllclwiLFxyXG4gICAgICAgICAgICBcImdlbmVyYXRlQ291bnRyeURlcHRMYXllclwiLFxyXG4gICAgICAgICAgICBcImdlbmVyYXRlQ291bnRyeURpc3RyaWN0TGF5ZXJcIixcclxuICAgICAgICAgICAgXCJnZW5lcmF0ZUNvdW50cnlMYXllclwiLFxyXG4gICAgICAgICAgICBcImdlbmVyYXRlQ291bnRyeUJvcmRlckxheWVyXCIsXHJcbiAgICAgICAgICBdO1xyXG4gICAgICAgICAgZm9yIChsZXQgYXR0cmlidXRlIGluIGRlZmF1bHRNYXBPYmopIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICFhdHRyaWJ1dGUuc3RhcnRzV2l0aChcIl9cIikgJiZcclxuICAgICAgICAgICAgICBkZWZhdWx0TWFwT2JqW2F0dHJpYnV0ZV0gPT09IG51bGxcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgbGV0IGZ1bmN0aW9uTmFtZSA9IGBnZW5lcmF0ZSR7YXR0cmlidXRlXHJcbiAgICAgICAgICAgICAgICAuY2hhckF0KDApXHJcbiAgICAgICAgICAgICAgICAudG9VcHBlckNhc2UoKX0ke2F0dHJpYnV0ZS5zbGljZSgxKX1gO1xyXG4gICAgICAgICAgICAgIGxldCBtZXRob2QgPSBkZWZhdWx0TWFwT2JqW2Z1bmN0aW9uTmFtZV07XHJcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgbGF5ZXJzW2F0dHJpYnV0ZV0gPSBjYWxsTWFwTWV0aG9kKFxyXG4gICAgICAgICAgICAgICAgICBkZWZhdWx0TWFwT2JqLFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbk5hbWUsXHJcbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZSxcclxuICAgICAgICAgICAgICAgICAgbGFuZyxcclxuICAgICAgICAgICAgICAgICAgY291bnRyeSxcclxuICAgICAgICAgICAgICAgICAgb3V0ZGF0ZWRMYXllcnMsXHJcbiAgICAgICAgICAgICAgICAgIG1ldGhvZFdpdGhDb3VudHJ5XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgVGhlIGZ1bmN0aW9uICcke2Z1bmN0aW9uTmFtZX0nIGRvZXMgbm90IGV4aXN0LmApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxheWVycyA9IE9iamVjdC5mcm9tRW50cmllcyhcclxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMobGF5ZXJzKS5maWx0ZXIoKFtrLCB2XSkgPT4gdiAhPT0gbnVsbClcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImxheWVycyBkZWZhdWx0XCIsIGxheWVycyk7XHJcblxyXG4gICAgICAgICAgaWYgKGlzTGF5ZXJzQnVpbGRlZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxheWVycztcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhc2hld01hcC5vbihcIm92ZXJsYXlhZGRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgZXZlbnQubGF5ZXIuYnJpbmdUb0Zyb250KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbWFwIGxheWVycyBub3JtYWwgZGVmYXVsdCBuZXcnLCBsYXllcnMpO1xyXG4gICAgICAgICAgICBjYXNoZXdNYXAgPSBhZGRMYXllcnNUb01hcChjYXNoZXdNYXAsIGxheWVycyk7XHJcbiAgICAgICAgICAgIG9yZGVyaW5nTGF5ZXJzKGNhc2hld01hcCwgbGF5ZXJzKTtcclxuICAgICAgICAgICAgYWRkSG9tZUJ1dHRvblRvTWFwKGNhc2hld01hcCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGxheWVycykuZm9yRWFjaCgobGF5ZXJOYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgc3dpdGNoIChsYXllcnNbbGF5ZXJOYW1lXS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcclxuICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICFbYCR7Y291bnRyeX0gQm91bmRhcmllcyBSZXB1YmxpY2BdLmluY2x1ZGVzKFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGF5ZXJzW2xheWVyTmFtZV0ub3B0aW9ucy5uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250cm9sX2xheWVyLmFkZE92ZXJsYXkoXHJcbiAgICAgICAgICAgICAgICAgICAgICBsYXllcnNbbGF5ZXJOYW1lXSxcclxuICAgICAgICAgICAgICAgICAgICAgIGxheWVyc1tsYXllck5hbWVdLm9wdGlvbnMubmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgIVtgJHtjb3VudHJ5fSBCb3VuZGFyaWVzIFJlcHVibGljYF0uaW5jbHVkZXMobGF5ZXJzW2xheWVyTmFtZV0ubmFtZSlcclxuICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbF9sYXllci5hZGRPdmVybGF5KFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGF5ZXJzW2xheWVyTmFtZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBsYXllcnNbbGF5ZXJOYW1lXS5uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBgVG90YWwgbG9hZGluZyB0aW1lIGRlZmF1bHQ6ICR7KChEYXRlLm5vdygpIC0gc3RhcnRUaW1lKSAvIDEwMDApLnRvRml4ZWQoXHJcbiAgICAgICAgICAgICAgICAyXHJcbiAgICAgICAgICAgICAgKX0gc2Vjb25kc2BcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjYXNoZXdNYXA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIENhbGxzIHRoZSBhcHByb3ByaWF0ZSBtYXAgbWV0aG9kIGJhc2VkIG9uIHRoZSBmdW5jdGlvbiBuYW1lIGFuZCBwYXJhbWV0ZXJzLlxyXG4gICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZXRob2QgLSBUaGUgbWV0aG9kIHRvIGJlIGNhbGxlZC5cclxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvbi5cclxuICAgICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBUaGUgZGF0YSB0byBiZSBwYXNzZWQgdG8gdGhlIGZ1bmN0aW9uLlxyXG4gICAgICAgKiBAcGFyYW0ge09iamVjdH0gY291bnRyeSAtIFRoZSBjb3VudHJ5LXNwZWNpZmljIGRhdGEuXHJcbiAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRkYXRlZExheWVycyAtIFRoZSBvdXRkYXRlZCBsYXllcnMuXHJcbiAgICAgICAqIEBwYXJhbSB7QXJyYXl9IG1ldGhvZFdpdGhDb3VudHJ5IC0gQXJyYXkgb2YgbWV0aG9kIG5hbWVzIHRoYXQgcmVxdWlyZSBjb3VudHJ5IGRhdGEuXHJcbiAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZWZhdWx0TWFwT2JqIC0gVGhlIGRlZmF1bHQgbWFwIG9iamVjdCBpbnN0YW5jZS5cclxuICAgICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgcmVzdWx0IG9mIHRoZSBtZXRob2QgY2FsTC5cclxuICAgICAgICovXHJcbiAgICAgIGZ1bmN0aW9uIGNhbGxNYXBNZXRob2QoXHJcbiAgICAgICAgbWFwT2JqZWN0LFxyXG4gICAgICAgIGZ1bmN0aW9uTmFtZSxcclxuICAgICAgICBtYXBfY2xhc3NfYXR0cmlidXRlX25hbWUsXHJcbiAgICAgICAgbGFuZyxcclxuICAgICAgICBjb3VudHJ5LFxyXG4gICAgICAgIG91dGRhdGVkTGF5ZXJzLFxyXG4gICAgICAgIG1ldGhvZFdpdGhDb3VudHJ5XHJcbiAgICAgICkge1xyXG4gICAgICAgIGlmIChtZXRob2RXaXRoQ291bnRyeS5pbmNsdWRlcyhmdW5jdGlvbk5hbWUpKSB7XHJcbiAgICAgICAgICBsZXQgcmVzdWx0ID0gbWFwT2JqZWN0W2Z1bmN0aW9uTmFtZV0oXHJcbiAgICAgICAgICAgIG91dGRhdGVkTGF5ZXJzW2NvdW50cnldW2xhbmddW1xyXG4gICAgICAgICAgICBnZXRWYWx1ZUlnbm9yZUNhc2UoXHJcbiAgICAgICAgICAgICAgb3V0ZGF0ZWRMYXllcnNbY291bnRyeV1bbGFuZ10sXHJcbiAgICAgICAgICAgICAgcmVwbGFjZVVwcGVyQ2FzZVdpdGhVbmRlcnNjb3JlKG1hcF9jbGFzc19hdHRyaWJ1dGVfbmFtZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBjb3VudHJ5XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9IGVsc2UgaWYgKGZ1bmN0aW9uTmFtZSA9PT0gXCJnZW5lcmF0ZUNvdW50cnlQbGFudGF0aW9uTGF5ZXJcIikge1xyXG4gICAgICAgICAgbGV0IHJlc3VsdCA9IG1hcE9iamVjdFtmdW5jdGlvbk5hbWVdKFxyXG4gICAgICAgICAgICBvdXRkYXRlZExheWVyc1tjb3VudHJ5XVtsYW5nXVtcclxuICAgICAgICAgICAgZ2V0VmFsdWVJZ25vcmVDYXNlKFxyXG4gICAgICAgICAgICAgIG91dGRhdGVkTGF5ZXJzW2NvdW50cnldW2xhbmddLFxyXG4gICAgICAgICAgICAgIHJlcGxhY2VVcHBlckNhc2VXaXRoVW5kZXJzY29yZShtYXBfY2xhc3NfYXR0cmlidXRlX25hbWUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgb3V0ZGF0ZWRMYXllcnNbY291bnRyeV1bbGFuZ11bXCJjb3VudHJ5X3BsYW50YXRpb25fbWFya2VyXCJdXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbGV0IHJlc3VsdCA9IG1hcE9iamVjdFtmdW5jdGlvbk5hbWVdKFxyXG4gICAgICAgICAgICBvdXRkYXRlZExheWVyc1tjb3VudHJ5XVtsYW5nXVtcclxuICAgICAgICAgICAgZ2V0VmFsdWVJZ25vcmVDYXNlKFxyXG4gICAgICAgICAgICAgIG91dGRhdGVkTGF5ZXJzW2NvdW50cnldW2xhbmddLFxyXG4gICAgICAgICAgICAgIHJlcGxhY2VVcHBlckNhc2VXaXRoVW5kZXJzY29yZShtYXBfY2xhc3NfYXR0cmlidXRlX25hbWUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IE1BUF9MQVlFUl9PQkpFQ1RfVFlQRSA9IHtcclxuICAgICAgR0VPSlNPTjogXCJHZW9Kc29uXCIsXHJcbiAgICAgIE1BUktFUjogXCJNYXJrZXJcIixcclxuICAgICAgVElMRUxBWUVSOiBcIlRpbGVMYXllclwiLFxyXG4gICAgICBSQVNURVJfVElMRUxBWUVSOiBcIlJhc3RlciBUaWxlTGF5ZXJcIixcclxuICAgICAgT1RIRVI6IFwiT3RoZXJcIixcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgTUFQX0xBWUVSX1RZUEUgPSB7XHJcbiAgICAgIENPVU5UUllfTEFZRVI6IE1BUF9MQVlFUl9PQkpFQ1RfVFlQRS5HRU9KU09OLFxyXG4gICAgICBDT1VOVFJZX0JPUkRFUl9MQVlFUjogTUFQX0xBWUVSX09CSkVDVF9UWVBFLkdFT0pTT04sXHJcbiAgICAgIENPVU5UUllfREVQVF9MQVlFUjogTUFQX0xBWUVSX09CSkVDVF9UWVBFLkdFT0pTT04sXHJcbiAgICAgIENPVU5UUllfQ09MT1JFRF9ERVBUX0xBWUVSOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuR0VPSlNPTixcclxuICAgICAgQ09VTlRSWV9DT01NVU5FX0xBWUVSOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuR0VPSlNPTixcclxuICAgICAgQ09VTlRSWV9ESVNUUklDVF9MQVlFUjogTUFQX0xBWUVSX09CSkVDVF9UWVBFLkdFT0pTT04sXHJcbiAgICAgIENPVU5UUllfQ09MT1JFRF9DT01NVU5FX0xBWUVSOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuR0VPSlNPTixcclxuICAgICAgQ09VTlRSWV9QUk9URUNURURfTEFZRVI6IE1BUF9MQVlFUl9PQkpFQ1RfVFlQRS5HRU9KU09OLFxyXG4gICAgICBDT1VOVFJZX1BMQU5UQVRJT05fTEFZRVI6IE1BUF9MQVlFUl9PQkpFQ1RfVFlQRS5HRU9KU09OLFxyXG4gICAgICBDT1VOVFJZX1BMQU5UQVRJT05fTUFSS0VSOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuTUFSS0VSLFxyXG4gICAgICBOVVJTRVJZX0xBWUVSOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuTUFSS0VSLFxyXG4gICAgICBRQVJfTEFZRVI6IE1BUF9MQVlFUl9PQkpFQ1RfVFlQRS5NQVJLRVIsXHJcbiAgICAgIFRSQUlOSU5HX0xBWUVSOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuTUFSS0VSLFxyXG4gICAgICBQUkVESUNUSU9OU19MQVlFUjogTUFQX0xBWUVSX09CSkVDVF9UWVBFLlJBU1RFUl9USUxFTEFZRVIsXHJcbiAgICAgIFRSRUVfREVOU0lUWV9FU1RJTUFUSU9OX0xBWUVSOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuVElMRUxBWUVSLFxyXG4gICAgICBERUZPUkVTVEFUSU9OOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuUkFTVEVSX1RJTEVMQVlFUixcclxuICAgICAgQUZPUkVTVEFUSU9OOiBNQVBfTEFZRVJfT0JKRUNUX1RZUEUuUkFTVEVSX1RJTEVMQVlFUixcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gdXBkYXRlTGF5ZXIobmV3X2xheWVyLCBtYXApIHtcclxuICAgICAgbWFwLmVhY2hMYXllcihmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgICBsZXQgbmV3TGF5ZXJOYW1lO1xyXG4gICAgICAgIHN3aXRjaCAobmV3X2xheWVyLm5hbWUpIHtcclxuICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxyXG4gICAgICAgICAgICBuZXdMYXllck5hbWUgPSBuZXdfbGF5ZXIub3B0aW9ucy5uYW1lO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIG5ld0xheWVyTmFtZSA9IG5ld19sYXllci5uYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3dpdGNoIChsYXllci5uYW1lKSB7XHJcbiAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcclxuICAgICAgICAgICAgaWYgKGxheWVyLm9wdGlvbnMubmFtZSA9PT0gbmV3TGF5ZXJOYW1lKSB7XHJcbiAgICAgICAgICAgICAgbWFwLnJlbW92ZUxheWVyKGxheWVyKTtcclxuICAgICAgICAgICAgICBjb250cm9sX2xheWVyLnJlbW92ZUxheWVyKGxheWVyKTtcclxuICAgICAgICAgICAgICBuZXdfbGF5ZXIuYWRkVG8obWFwKTtcclxuICAgICAgICAgICAgICBjb250cm9sX2xheWVyLmFkZE92ZXJsYXkobmV3X2xheWVyLCBuZXdfbGF5ZXIub3B0aW9ucy5uYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGlmIChsYXllci5uYW1lID09PSBuZXdMYXllck5hbWUpIHtcclxuICAgICAgICAgICAgICBtYXAucmVtb3ZlTGF5ZXIobGF5ZXIpO1xyXG4gICAgICAgICAgICAgIGNvbnRyb2xfbGF5ZXIucmVtb3ZlTGF5ZXIobGF5ZXIpO1xyXG4gICAgICAgICAgICAgIG5ld19sYXllci5hZGRUbyhtYXApO1xyXG4gICAgICAgICAgICAgIGNvbnRyb2xfbGF5ZXIuYWRkT3ZlcmxheShuZXdfbGF5ZXIsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHVwZGF0ZU1hcChzZXJpYWxpemVkRGF0YSwgaXNMYXllcnNCdWlsdGVkID0gZmFsc2UpIHtcclxuICAgICAgY29uc3QgW291dGRhdGVkX2xheWVyX3Blcl9jb3VudHJ5X2FuZF9sYW5nX2J1aWxkZWQsIG5lZWRlZFRvQmVCdWlsZGVkXSA9XHJcbiAgICAgICAgcmVidWlsZExheWVycyhzZXJpYWxpemVkRGF0YSk7XHJcbiAgICAgIGlmIChuZWVkZWRUb0JlQnVpbGRlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGlmIChpc0xheWVyc0J1aWx0ZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhgVXBkYXRpbmcgb25seTogJHtPYmplY3Qua2V5cyhvdXRkYXRlZF9sYXllcl9wZXJfY291bnRyeV9hbmRfbGFuZ19idWlsZGVkKX1gKTtcclxuICAgICAgICAgIHZhciBsYXllcnMgPSBnZW5lcmF0ZU1hcExheWVycyhcclxuICAgICAgICAgICAgY3VycmVudExhbmd1YWdlLFxyXG4gICAgICAgICAgICBvdXRkYXRlZF9sYXllcl9wZXJfY291bnRyeV9hbmRfbGFuZ19idWlsZGVkLFxyXG4gICAgICAgICAgICB1c2VyQ291bnRyeU5hbWVcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBPYmplY3QudmFsdWVzKGxheWVycykubWFwKChlbGVtZW50KSA9PlxyXG4gICAgICAgICAgICB1cGRhdGVMYXllcihlbGVtZW50LCBjYXNoZXdNYXApXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmV0dXJuIGxheWVycztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY2FzaGV3TWFwID0gZ2VuZXJhdGVNYXBMYXllcnMoXHJcbiAgICAgICAgICAgIGN1cnJlbnRMYW5ndWFnZSxcclxuICAgICAgICAgICAgb3V0ZGF0ZWRfbGF5ZXJfcGVyX2NvdW50cnlfYW5kX2xhbmdfYnVpbGRlZCxcclxuICAgICAgICAgICAgdXNlckNvdW50cnlOYW1lLFxyXG4gICAgICAgICAgICBpc0xheWVyc0J1aWx0ZWRcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICByZXR1cm4gY2FzaGV3TWFwO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIk5vIG5lZWQgdG8gdXBkYXRlIGxheWVyc1wiKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiByZWJ1aWxkTGF5ZXJzKGRhdGEpIHtcclxuICAgICAgbGV0IG91dGRhdGVkX2xheWVyX3Blcl9jb3VudHJ5X2FuZF9sYW5nX2J1aWxkZWQgPSB7fTtcclxuICAgICAgbGV0IG5lZWRlZFRvQmVCdWlsZGVkO1xyXG5cclxuICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaCgoY291bnRyeU5hbWUpID0+IHtcclxuICAgICAgICBvdXRkYXRlZF9sYXllcl9wZXJfY291bnRyeV9hbmRfbGFuZ19idWlsZGVkW2NvdW50cnlOYW1lXSA9IHt9O1xyXG4gICAgICAgIGNvbnN0IGNvdW50cnlEYXRhID0gZGF0YVtjb3VudHJ5TmFtZV07XHJcbiAgICAgICAgT2JqZWN0LmtleXMoY291bnRyeURhdGEpLmZvckVhY2goKGxhbmcpID0+IHtcclxuICAgICAgICAgIG91dGRhdGVkX2xheWVyX3Blcl9jb3VudHJ5X2FuZF9sYW5nX2J1aWxkZWRbY291bnRyeU5hbWVdW2xhbmddID0ge307XHJcbiAgICAgICAgICBjb25zdCBsYXllcnMgPSBjb3VudHJ5RGF0YVtsYW5nXTtcclxuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhsYXllcnMpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbmVlZGVkVG9CZUJ1aWxkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgT2JqZWN0LmtleXMobGF5ZXJzKS5mb3JFYWNoKChsYXllck5hbWUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGxheWVyRGF0YSA9IGxheWVyc1tsYXllck5hbWVdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGxheWVyRGF0YSAhPT0gXCJvYmplY3RcIiAmJiBsYXllckRhdGEgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICBsYXllckRhdGEgPSBKU09OLnBhcnNlKGxheWVyRGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGxheWVyTmFtZVVwcGVyID0gbGF5ZXJOYW1lLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIHZhciBsYXllclR5cGUgPSBNQVBfTEFZRVJfVFlQRVtsYXllck5hbWVVcHBlcl07XHJcbiAgICAgICAgICAgIG91dGRhdGVkX2xheWVyX3Blcl9jb3VudHJ5X2FuZF9sYW5nX2J1aWxkZWRbY291bnRyeU5hbWVdW2xhbmddW1xyXG4gICAgICAgICAgICAgIGxheWVyTmFtZVxyXG4gICAgICAgICAgICBdID0gcmVjb25zdHJ1Y3RMYXllcnMobGF5ZXJEYXRhLCBsYXllclR5cGUsIGxheWVyTmFtZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gW291dGRhdGVkX2xheWVyX3Blcl9jb3VudHJ5X2FuZF9sYW5nX2J1aWxkZWQsIG5lZWRlZFRvQmVCdWlsZGVkXTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcmVjb25zdHJ1Y3RMYXllcnMobGF5ZXJJdGVtcywgdHlwZSwgbGF5ZXJOYW1lKSB7XHJcbiAgICAgIGxldCBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgIGNhc2UgXCJHZW9Kc29uXCI6XHJcbiAgICAgICAgICBsYXllckl0ZW1zLmZvckVhY2goKGxheWVySXRlbSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobGF5ZXJOYW1lID09IFwiY291bnRyeV9jb21tdW5lX2xheWVyXCIpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgbGF5ZXI7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICBcImNvdW50cnlfYm9yZGVyX2xheWVyXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvdW50cnlfY29sb3JlZF9kZXB0X2xheWVyXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvdW50cnlfY29sb3JlZF9jb21tdW5lX2xheWVyXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvdW50cnlfcHJvdGVjdGVkX2xheWVyXCIsXHJcbiAgICAgICAgICAgICAgXS5pbmNsdWRlcyhsYXllck5hbWUpXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHN0eWxlRnVuY3Rpb24gPSByZWNvbnN0cnVjdEZ1bmN0aW9uKFxyXG4gICAgICAgICAgICAgICAgbGF5ZXJJdGVtLnN0eWxlX2Z1bmN0aW9uLFxyXG4gICAgICAgICAgICAgICAgbGF5ZXJOYW1lXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICBsYXllciA9IEwuZ2VvSlNPTihsYXllckl0ZW0uZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHN0eWxlRnVuY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBvbkVhY2hGZWF0dXJlOiBvbkVhY2hGZWF0dXJlKHN0eWxlRnVuY3Rpb24sIGxheWVyTmFtZSksXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgc3R5bGVGdW5jdGlvbiA9IHJlY29uc3RydWN0RnVuY3Rpb24oXHJcbiAgICAgICAgICAgICAgICBsYXllckl0ZW0uaGlnaGxpZ2h0X2Z1bmN0aW9uLFxyXG4gICAgICAgICAgICAgICAgbGF5ZXJOYW1lXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICBjdXJyZW50R2VvSnNvbk9iaiA9IGxheWVyID0gTC5nZW9KU09OKGxheWVySXRlbS5kYXRhLCB7XHJcbiAgICAgICAgICAgICAgICBvbkVhY2hGZWF0dXJlOiBvbkVhY2hGZWF0dXJlKHN0eWxlRnVuY3Rpb24sIGxheWVyTmFtZSksXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGxheWVySXRlbS5jdXN0b21fcG9wdXApIHtcclxuICAgICAgICAgICAgICBsZXQgcG9wdXAgPSBMLnBvcHVwKGxheWVySXRlbS5jdXN0b21fcG9wdXAub3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBsYXllckl0ZW0uY3VzdG9tX3BvcHVwLmh0bWw7XHJcbiAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgbGF5ZXJOYW1lID09IFwiY291bnRyeV9wbGFudGF0aW9uX2xheWVyXCIgJiZcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRMYW5ndWFnZSAhPSBcImZyXCJcclxuICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gJChjb250ZW50KVswXTtcclxuICAgICAgICAgICAgICAgIHZhciBiYXNlNjRFbmNvZGVkSWZyYW1lID0gY29udGVudC5zcmMuc3BsaXQoXCI7YmFzZTY0LFwiKVsxXTtcclxuICAgICAgICAgICAgICAgIHZhciBkZWNvZGVkSWZyYW1lID0gYXRvYihiYXNlNjRFbmNvZGVkSWZyYW1lKTtcclxuICAgICAgICAgICAgICAgIGJhc2VMaW5rID0gYCR7d2luZG93LmxvY2F0aW9uLm9yaWdpbn0vZnIvZGFzaGJvYXJkL2Ryb25lL2A7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmFzZUxpbmsgPSBiYXNlTGluay5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XHJcbiAgICAgICAgICAgICAgICBtb2RpZmllZENvbnRlbnQgPSBkZWNvZGVkSWZyYW1lLnJlcGxhY2UoXHJcbiAgICAgICAgICAgICAgICAgIG5ldyBSZWdFeHAoYmFzZUxpbmssIFwiZ1wiKSxcclxuICAgICAgICAgICAgICAgICAgYCR7d2luZG93LmxvY2F0aW9uLm9yaWdpbn0vJHtjdXJyZW50TGFuZ3VhZ2V9L2Rhc2hib2FyZC9kcm9uZS9gXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGlmaWVkQmFzZTY0RW5jb2RlZElmcmFtZSA9IGJ0b2EobW9kaWZpZWRDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQuc3JjID0gYGRhdGE6dGV4dC9odG1sO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LCR7bW9kaWZpZWRCYXNlNjRFbmNvZGVkSWZyYW1lfWA7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHBvcHVwLnNldENvbnRlbnQoY29udGVudCk7XHJcbiAgICAgICAgICAgICAgbGF5ZXIuYmluZFBvcHVwKHBvcHVwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobGF5ZXJJdGVtLmN1c3RvbV90b29sdGlwKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgY3VzdG9tVG9vbHRpcExheWVyc0ZpZWxkc0FuZEFsaWFzZXMgPSB7XHJcbiAgICAgICAgICAgICAgICBjb3VudHJ5X2RlcHRfbGF5ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgZmllbGRzOiBcIk5BTUVfMVwiLFxyXG4gICAgICAgICAgICAgICAgICBhbGlhc2VzOiBcIkdBVUwgMTogXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY291bnRyeV9jb2xvcmVkX2RlcHRfbGF5ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgZmllbGRzOiBcIk5BTUVfMVwiLFxyXG4gICAgICAgICAgICAgICAgICBhbGlhc2VzOiBcIkdBVUwgMTogXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY291bnRyeV9jb21tdW5lX2xheWVyOiB7XHJcbiAgICAgICAgICAgICAgICAgIGZpZWxkczogXCJOQU1FXzJcIixcclxuICAgICAgICAgICAgICAgICAgYWxpYXNlczogXCJHQVVMIDI6IFwiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNvdW50cnlfZGlzdHJpY3RfbGF5ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgZmllbGRzOiBcIk5BTUVfM1wiLFxyXG4gICAgICAgICAgICAgICAgICBhbGlhc2VzOiBcIkdBVUwgMzogXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY291bnRyeV9jb2xvcmVkX2NvbW11bmVfbGF5ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgZmllbGRzOiBcIk5BTUVfMlwiLFxyXG4gICAgICAgICAgICAgICAgICBhbGlhc2VzOiBcIkdBVUwgMjogXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY3VzdG9tVG9vbHRpcExheWVyc0ZpZWxkc0FuZEFsaWFzZXMpLmluY2x1ZGVzKFxyXG4gICAgICAgICAgICAgICAgICBsYXllck5hbWVcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIGxheWVyLmJpbmRUb29sdGlwKFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZGl2ID0gTC5Eb21VdGlsLmNyZWF0ZShcImRpdlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhhbmRsZU9iamVjdCA9IChmZWF0dXJlKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGZlYXR1cmUgPT0gXCJvYmplY3RcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IEpTT04uc3RyaW5naWZ5KGZlYXR1cmUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZmVhdHVyZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21Ub29sdGlwTGF5ZXJGaWVsZHNBbmRBbGlhc2VzID1cclxuICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbVRvb2x0aXBMYXllcnNGaWVsZHNBbmRBbGlhc2VzW2xheWVyTmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkcyA9IFtjdXN0b21Ub29sdGlwTGF5ZXJGaWVsZHNBbmRBbGlhc2VzLmZpZWxkc107XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFsaWFzZXMgPSBbY3VzdG9tVG9vbHRpcExheWVyRmllbGRzQW5kQWxpYXNlcy5hbGlhc2VzXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdGFibGUgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgXCI8dGFibGU+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgU3RyaW5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHYsIGkpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8dGg+JHthbGlhc2VzW2ldfTwvdGg+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgPHRkPiR7aGFuZGxlT2JqZWN0KGxheWVyLmZlYXR1cmUucHJvcGVydGllc1t2XSl9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgPC90cj5gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICApICtcclxuICAgICAgICAgICAgICAgICAgICAgIFwiPC90YWJsZT5cIjtcclxuICAgICAgICAgICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gdGFibGU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXY7XHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiZm9saXVtdG9vbHRpcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0aWNreTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImZvbGl1bXRvb2x0aXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgIHN0aWNreTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IHRvb2x0aXAgPSBMLnRvb2x0aXAobGF5ZXJJdGVtLmN1c3RvbV90b29sdGlwLm9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcC5zZXRDb250ZW50KGxheWVySXRlbS5jdXN0b21fdG9vbHRpcC50ZXh0KTtcclxuICAgICAgICAgICAgICAgIGxheWVyLmJpbmRUb29sdGlwKHRvb2x0aXApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsYXllcnMucHVzaChsYXllcik7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJNYXJrZXJcIjpcclxuICAgICAgICAgIGlmIChbXCJjb3VudHJ5X3BsYW50YXRpb25fbWFya2VyXCIsIFwicWFyX2xheWVyXCJdLmluY2x1ZGVzKGxheWVyTmFtZSkpIHtcclxuICAgICAgICAgICAgbGF5ZXJJdGVtcy5mb3JFYWNoKChsYXllckl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICBsZXQgbGF5ZXIgPSByZWNvbnN0cnVjdE1hcmtlcihsYXllckl0ZW0sIGxheWVyTmFtZSk7XHJcbiAgICAgICAgICAgICAgbGF5ZXJzLnB1c2gobGF5ZXIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVySXRlbXMuZm9yRWFjaCgobGF5ZXJJdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgbGV0IGxheWVyID0gcmVjb25zdHJ1Y3RNYXJrZXIobGF5ZXJJdGVtKTtcclxuICAgICAgICAgICAgICBsYXllcnMucHVzaChsYXllcik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcIlRpbGVMYXllclwiOlxyXG4gICAgICAgIGNhc2UgXCJSYXN0ZXIgVGlsZUxheWVyXCI6XHJcbiAgICAgICAgICBsYXllckl0ZW1zLmZvckVhY2goKGxheWVySXRlbSkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgbGF5ZXIgPSBjcmVhdGVMZWFmbGV0VGlsZUxheWVyKGxheWVySXRlbSk7XHJcbiAgICAgICAgICAgIGxheWVycy5wdXNoKGxheWVyKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGNvbnNvbGUud2FybihcIlVuaGFuZGxlZCBsYXllciB0eXBlOlwiLCB0eXBlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHR5cGUgPT0gXCJNYXJrZXJcIikge1xyXG4gICAgICAgIHJldHVybiBsYXllcnM7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGxheWVycztcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVMZWFmbGV0VGlsZUxheWVyKGRhdGEpIHtcclxuICAgICAgcmV0dXJuIEwudGlsZUxheWVyKGRhdGEudGlsZXMsIGRhdGEub3B0aW9ucyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlY29uc3RydWN0TWFya2VyKG1hcmtlckRhdGEsIGxheWVyTmFtZSA9IFwiXCIpIHtcclxuICAgICAgY29uc3QgaWNvbiA9IHJlY29uc3RydWN0SWNvbihcclxuICAgICAgICBtYXJrZXJEYXRhLmljb24sXHJcbiAgICAgICAgbWFya2VyRGF0YS5pY29uX2NsYXNzLFxyXG4gICAgICAgIGxheWVyTmFtZVxyXG4gICAgICApO1xyXG4gICAgICBjb25zdCBjdXJyZW50X21hcmtlciA9IEwubWFya2VyKG1hcmtlckRhdGEubG9jYXRpb24sIG1hcmtlckRhdGEub3B0aW9ucyk7XHJcbiAgICAgIGN1cnJlbnRfbWFya2VyLnNldEljb24oaWNvbik7XHJcblxyXG4gICAgICBpZiAobWFya2VyRGF0YS5wb3B1cCkge1xyXG4gICAgICAgIHZhciBjb250ZW50ID0gJChtYXJrZXJEYXRhLnBvcHVwLmh0bWwpWzBdO1xyXG4gICAgICAgIHZhciBwb3B1cCA9IEwucG9wdXAobWFya2VyRGF0YS5wb3B1cC5vcHRpb25zKTtcclxuICAgICAgICBwb3B1cC5zZXRDb250ZW50KGNvbnRlbnQpO1xyXG4gICAgICAgIGN1cnJlbnRfbWFya2VyLmJpbmRQb3B1cChwb3B1cCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChtYXJrZXJEYXRhLnRvb2x0aXApIHtcclxuICAgICAgICB2YXIgdG9vbHRpcCA9IEwudG9vbHRpcChtYXJrZXJEYXRhLnRvb2x0aXAub3B0aW9ucyk7XHJcbiAgICAgICAgdG9vbHRpcC5zZXRDb250ZW50KG1hcmtlckRhdGEudG9vbHRpcC50ZXh0KTtcclxuICAgICAgICBjdXJyZW50X21hcmtlci5iaW5kVG9vbHRpcCh0b29sdGlwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGN1cnJlbnRfbWFya2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiByZWNvbnN0cnVjdEljb24oaWNvbkRhdGEsIGljb25DbGFzcywgbGF5ZXJOYW1lID0gXCJcIikge1xyXG4gICAgICBpZiAoIWljb25EYXRhKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgIHN3aXRjaCAoaWNvbkNsYXNzKSB7XHJcbiAgICAgICAgY2FzZSBcImZvbGl1bS5JY29uXCI6XHJcbiAgICAgICAgICBpZiAobGF5ZXJOYW1lID09IFwiY291bnRyeV9wbGFudGF0aW9uX21hcmtlclwiKSB7XHJcbiAgICAgICAgICAgIGljb25EYXRhLm9wdGlvbnMuaWNvbiA9IFwiZ2xvYmVcIjtcclxuICAgICAgICAgICAgaWNvbkRhdGEub3B0aW9ucy5wcmVmaXggPSBcImZhXCI7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGljb25EYXRhLm9wdGlvbnMuaWNvbiA9PSBcImxlYWZcIikge1xyXG4gICAgICAgICAgICBpY29uRGF0YS5vcHRpb25zLnByZWZpeCA9IFwiZmFcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBMLkF3ZXNvbWVNYXJrZXJzLmljb24oaWNvbkRhdGEub3B0aW9ucyk7XHJcbiAgICAgICAgY2FzZSBcImZvbGl1bS5mZWF0dXJlcy5DdXN0b21JY29uXCI6XHJcbiAgICAgICAgICByZXR1cm4gTC5pY29uKHtcclxuICAgICAgICAgICAgaWNvblVybDogaWNvbkRhdGEub3B0aW9ucy5pY29uVXJsLFxyXG4gICAgICAgICAgICBpY29uU2l6ZTogaWNvbkRhdGEub3B0aW9ucy5pY29uU2l6ZSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIG9uRWFjaEZlYXR1cmUoc3R5bGVGdW5jdGlvbiwgbGF5ZXJOYW1lKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZmVhdHVyZSwgbGF5ZXIpIHtcclxuICAgICAgICBpZiAoW1wiY291bnRyeV9wbGFudGF0aW9uX2xheWVyXCJdLmluY2x1ZGVzKGxheWVyTmFtZSkpIHtcclxuICAgICAgICAgIGxheWVyLm9uKHtcclxuICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlLnRhcmdldC5nZXRCb3VuZHMgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgY2FzaGV3TWFwLmZpdEJvdW5kcyhlLnRhcmdldC5nZXRCb3VuZHMoKSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZS50YXJnZXQuZ2V0TGF0TG5nID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIGxldCB6b29tID0gY2FzaGV3TWFwLmdldFpvb20oKTtcclxuICAgICAgICAgICAgICAgIHpvb20gPSB6b29tID4gMTIgPyB6b29tIDogem9vbSArIDE7XHJcbiAgICAgICAgICAgICAgICBjYXNoZXdNYXAuZmx5VG8oZS50YXJnZXQuZ2V0TGF0TG5nKCksIHpvb20pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICBbXHJcbiAgICAgICAgICAgIFwiY291bnRyeV9ib3JkZXJfbGF5ZXJcIixcclxuICAgICAgICAgICAgXCJjb3VudHJ5X3Byb3RlY3RlZF9sYXllclwiLFxyXG4gICAgICAgICAgICBcImNvdW50cnlfY29sb3JlZF9kZXB0X2xheWVyXCIsXHJcbiAgICAgICAgICAgIFwiY291bnRyeV9jb2xvcmVkX2NvbW11bmVfbGF5ZXJcIixcclxuICAgICAgICAgIF0uaW5jbHVkZXMobGF5ZXJOYW1lKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgbGF5ZXIub24oe30pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICBbXHJcbiAgICAgICAgICAgIFwiY291bnRyeV9sYXllclwiLFxyXG4gICAgICAgICAgICBcImNvdW50cnlfZGVwdF9sYXllclwiLFxyXG4gICAgICAgICAgICBcImNvdW50cnlfY29tbXVuZV9sYXllclwiLFxyXG4gICAgICAgICAgICBcImNvdW50cnlfZGlzdHJpY3RfbGF5ZXJcIixcclxuICAgICAgICAgIF0uaW5jbHVkZXMobGF5ZXJOYW1lKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgbGF5ZXIub24oe1xyXG4gICAgICAgICAgICBtb3VzZW91dDogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIGUudGFyZ2V0LnNldFN0eWxlID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRHZW9Kc29uT2JqLnJlc2V0U3R5bGUoZS50YXJnZXQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbW91c2VvdmVyOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgZS50YXJnZXQuc2V0U3R5bGUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGlnaGxpZ2h0U3R5bGUgPSBzdHlsZUZ1bmN0aW9uKGUudGFyZ2V0LmZlYXR1cmUpO1xyXG4gICAgICAgICAgICAgICAgZS50YXJnZXQuc2V0U3R5bGUoaGlnaGxpZ2h0U3R5bGUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcmVjb25zdHJ1Y3RGdW5jdGlvbihmdW5jRGF0YSwgbGF5ZXJOYW1lKSB7XHJcbiAgICAgIGlmICghZnVuY0RhdGEpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZ1bmNEYXRhLl9fZnVuY3Rpb25fXykge1xyXG4gICAgICAgIHJldHVybiBsYXllcnNfZnVuY3Rpb25zX3RvX3JlY29tcHV0ZVtsYXllck5hbWVdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZnVuY0RhdGEuX19wYXJ0aWFsX18pIHtcclxuICAgICAgICBjb25zdCBiYXNlRnVuY3Rpb24gPSByZWNvbnN0cnVjdEZ1bmN0aW9uKFxyXG4gICAgICAgICAgeyBfX2Z1bmN0aW9uX186IHRydWUsIG5hbWU6IGZ1bmNEYXRhLmZ1bmMgfSxcclxuICAgICAgICAgIGxheWVyTmFtZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHBhcnRpYWxIaWdobGlnaHRGdW5jdGlvbiA9IGZ1bmN0aW9uIChjb2xvcl92YWx1ZXMpIHtcclxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZmVhdHVyZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYmFzZUZ1bmN0aW9uKGZlYXR1cmUsIGNvbG9yX3ZhbHVlcyk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHBhcnRpYWxIaWdobGlnaHRGdW5jdGlvbihmdW5jRGF0YS5rZXl3b3Jkcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBub3JtYWxpemVTdHJpbmcoc3RyKSB7XHJcbiAgICAgIHJldHVybiBzdHJcclxuICAgICAgICAubm9ybWFsaXplKFwiTkZEXCIpXHJcbiAgICAgICAgLnJlcGxhY2UoL1tcXHUwMzAwLVxcdTAzNmZdL2csIFwiXCIpXHJcbiAgICAgICAgLnRvTG93ZXJDYXNlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGxheWVyc19mdW5jdGlvbnNfdG9fcmVjb21wdXRlID0ge1xyXG4gICAgICBjb3VudHJ5X2xheWVyOiBmdW5jdGlvbiBoaWdobGlnaHRfZnVuY3Rpb24oZmVhdHVyZSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBmaWxsQ29sb3I6IFwiI2ZmYWYwMFwiLFxyXG4gICAgICAgICAgY29sb3I6IFwiZ3JlZW5cIixcclxuICAgICAgICAgIHdlaWdodDogMyxcclxuICAgICAgICAgIGRhc2hBcnJheTogXCIxLCAxXCIsXHJcbiAgICAgICAgfTtcclxuICAgICAgfSxcclxuICAgICAgY291bnRyeV9ib3JkZXJfbGF5ZXI6IGZ1bmN0aW9uIGhpZ2hsaWdodF9mdW5jdGlvbjIoZmVhdHVyZSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBmaWxsQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcclxuICAgICAgICAgIGNvbG9yOiBcIiNCNEI0QjRcIixcclxuICAgICAgICAgIHdlaWdodDogMyxcclxuICAgICAgICAgIGRhc2hBcnJheTogXCIxLCAxXCIsXHJcbiAgICAgICAgfTtcclxuICAgICAgfSxcclxuICAgICAgY291bnRyeV9kZXB0X2xheWVyOiBmdW5jdGlvbiBoaWdobGlnaHRfZnVuY3Rpb24oZmVhdHVyZSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBmaWxsQ29sb3I6IFwiI2ZmYWYwMFwiLFxyXG4gICAgICAgICAgY29sb3I6IFwiZ3JlZW5cIixcclxuICAgICAgICAgIHdlaWdodDogMyxcclxuICAgICAgICAgIGRhc2hBcnJheTogXCIxLCAxXCIsXHJcbiAgICAgICAgfTtcclxuICAgICAgfSxcclxuICAgICAgY291bnRyeV9jb2xvcmVkX2RlcHRfbGF5ZXI6IGZ1bmN0aW9uIGhpZ2hsaWdodEZ1bmN0aW9uKFxyXG4gICAgICAgIGZlYXR1cmUsXHJcbiAgICAgICAgeyBjb2xvcl92YWx1ZXMgfVxyXG4gICAgICApIHtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAhZmVhdHVyZSB8fFxyXG4gICAgICAgICAgIWZlYXR1cmUucHJvcGVydGllcyB8fFxyXG4gICAgICAgICAgIWNvbG9yX3ZhbHVlcyB8fFxyXG4gICAgICAgICAgdHlwZW9mIGNvbG9yX3ZhbHVlcyAhPT0gXCJvYmplY3RcIlxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgaW5wdXQuIENoZWNrIGZlYXR1cmUgYW5kIGNvbG9yX3ZhbHVlcy5cIik7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGVwYXJ0bWVudCA9IG5vcm1hbGl6ZVN0cmluZyhmZWF0dXJlLnByb3BlcnRpZXMuTkFNRV8xKTtcclxuICAgICAgICBsZXQgY29sb3JDb2RlID0gY29sb3JfdmFsdWVzLmhhc093blByb3BlcnR5KGRlcGFydG1lbnQpXHJcbiAgICAgICAgICA/IGNvbG9yX3ZhbHVlc1tkZXBhcnRtZW50XVxyXG4gICAgICAgICAgOiAwO1xyXG4gICAgICAgIGxldCBjb2xvciA9IFwidHJhbnNwYXJlbnRcIjtcclxuICAgICAgICBsZXQgYm9yZGVyID0gXCJ0cmFuc3BhcmVudFwiO1xyXG5cclxuICAgICAgICBpZiAoY29sb3JDb2RlICE9PSAwKSB7XHJcbiAgICAgICAgICBsZXQgcmVkVmFsdWUgPSBjb2xvckNvZGUgJiAyNTU7XHJcbiAgICAgICAgICBsZXQgZ3JlZW5WYWx1ZSA9IChjb2xvckNvZGUgPj4gOCkgJiAyNTU7XHJcbiAgICAgICAgICBsZXQgYmx1ZVZhbHVlID0gKGNvbG9yQ29kZSA+PiAxNikgJiAyNTU7XHJcblxyXG4gICAgICAgICAgY29sb3IgPSBgIyR7cmVkVmFsdWUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKX0ke2dyZWVuVmFsdWVcclxuICAgICAgICAgICAgLnRvU3RyaW5nKDE2KVxyXG4gICAgICAgICAgICAucGFkU3RhcnQoMiwgXCIwXCIpfSR7Ymx1ZVZhbHVlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIil9YDtcclxuICAgICAgICAgIGJvcmRlciA9IFwiYmxhY2tcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBmaWxsQ29sb3I6IGNvbG9yLFxyXG4gICAgICAgICAgY29sb3I6IGJvcmRlcixcclxuICAgICAgICAgIHdlaWdodDogMyxcclxuICAgICAgICAgIGRhc2hBcnJheTogXCIxLCAxXCIsXHJcbiAgICAgICAgICBvcGFjaXR5OiAwLjM1LFxyXG4gICAgICAgICAgZmlsbE9wYWNpdHk6IDAuOCxcclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgICBjb3VudHJ5X2NvbW11bmVfbGF5ZXI6IGZ1bmN0aW9uIGhpZ2hsaWdodF9mdW5jdGlvbihmZWF0dXJlKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGZpbGxDb2xvcjogXCIjZmZhZjAwXCIsXHJcbiAgICAgICAgICBjb2xvcjogXCJncmVlblwiLFxyXG4gICAgICAgICAgd2VpZ2h0OiAzLFxyXG4gICAgICAgICAgZGFzaEFycmF5OiBcIjEsIDFcIixcclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgICBjb3VudHJ5X2Rpc3RyaWN0X2xheWVyOiBmdW5jdGlvbiBoaWdobGlnaHRfZnVuY3Rpb24oZmVhdHVyZSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBmaWxsQ29sb3I6IFwiI2ZmYWYwMFwiLFxyXG4gICAgICAgICAgY29sb3I6IFwiZ3JlZW5cIixcclxuICAgICAgICAgIHdlaWdodDogMyxcclxuICAgICAgICAgIGRhc2hBcnJheTogXCIxLCAxXCIsXHJcbiAgICAgICAgfTtcclxuICAgICAgfSxcclxuICAgICAgY291bnRyeV9jb2xvcmVkX2NvbW11bmVfbGF5ZXI6IGZ1bmN0aW9uIGhpZ2hsaWdodEZ1bmN0aW9uKFxyXG4gICAgICAgIGZlYXR1cmUsXHJcbiAgICAgICAgeyBjb2xvcl92YWx1ZXMgfVxyXG4gICAgICApIHtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAhZmVhdHVyZSB8fFxyXG4gICAgICAgICAgIWZlYXR1cmUucHJvcGVydGllcyB8fFxyXG4gICAgICAgICAgIWNvbG9yX3ZhbHVlcyB8fFxyXG4gICAgICAgICAgdHlwZW9mIGNvbG9yX3ZhbHVlcyAhPT0gXCJvYmplY3RcIlxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgaW5wdXQuIENoZWNrIGZlYXR1cmUgYW5kIGNvbG9yX3ZhbHVlcy5cIik7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY29tbXVuZSA9IG5vcm1hbGl6ZVN0cmluZyhmZWF0dXJlLnByb3BlcnRpZXMuTkFNRV8yKTtcclxuICAgICAgICBsZXQgY29sb3JDb2RlID0gY29sb3JfdmFsdWVzLmhhc093blByb3BlcnR5KGNvbW11bmUpXHJcbiAgICAgICAgICA/IGNvbG9yX3ZhbHVlc1tjb21tdW5lXVxyXG4gICAgICAgICAgOiAwO1xyXG4gICAgICAgIGxldCBjb2xvciA9IFwidHJhbnNwYXJlbnRcIjtcclxuICAgICAgICBsZXQgYm9yZGVyID0gXCJ0cmFuc3BhcmVudFwiO1xyXG5cclxuICAgICAgICBpZiAoY29sb3JDb2RlICE9PSAwKSB7XHJcbiAgICAgICAgICBsZXQgcmVkVmFsdWUgPSBjb2xvckNvZGUgJiAyNTU7XHJcbiAgICAgICAgICBsZXQgZ3JlZW5WYWx1ZSA9IChjb2xvckNvZGUgPj4gOCkgJiAyNTU7XHJcbiAgICAgICAgICBsZXQgYmx1ZVZhbHVlID0gKGNvbG9yQ29kZSA+PiAxNikgJiAyNTU7XHJcblxyXG4gICAgICAgICAgY29sb3IgPSBgIyR7cmVkVmFsdWUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKX0ke2dyZWVuVmFsdWVcclxuICAgICAgICAgICAgLnRvU3RyaW5nKDE2KVxyXG4gICAgICAgICAgICAucGFkU3RhcnQoMiwgXCIwXCIpfSR7Ymx1ZVZhbHVlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIil9YDtcclxuICAgICAgICAgIGJvcmRlciA9IFwiYmxhY2tcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBmaWxsQ29sb3I6IGNvbG9yLFxyXG4gICAgICAgICAgY29sb3I6IGJvcmRlcixcclxuICAgICAgICAgIHdlaWdodDogMyxcclxuICAgICAgICAgIGRhc2hBcnJheTogXCIxLCAxXCIsXHJcbiAgICAgICAgICBvcGFjaXR5OiAwLjM1LFxyXG4gICAgICAgICAgZmlsbE9wYWNpdHk6IDAuOCxcclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgICBjb3VudHJ5X3Byb3RlY3RlZF9sYXllcjogZnVuY3Rpb24gaGlnaGxpZ2h0X2Z1bmN0aW9uKGZlYXR1cmUpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29sb3I6IFwiYmxhY2tcIixcclxuICAgICAgICAgIGZpbGxDb2xvcjogXCIjMTE2N0IxXCIsXHJcbiAgICAgICAgICB3ZWlnaHQ6IDIsXHJcbiAgICAgICAgICBkYXNoQXJyYXk6IFwiMSwgMVwiLFxyXG4gICAgICAgICAgb3BhY2l0eTogMC4zNSxcclxuICAgICAgICAgIGZpbGxPcGFjaXR5OiAwLjc1LFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHNvY2tldCA9IG5ldyBXZWJTb2NrZXQoYHdzczovLyR7aG9zdH0vd3MvbWFwX2xheWVyL2ApO1xyXG5cclxuICAgIHNvY2tldC5vbm9wZW4gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb24gZXN0YWJsaXNoZWQhXCIpO1xyXG4gICAgfTtcclxuXHJcbiAgICBzb2NrZXQub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdOZXcgbWVzc2FnZSEhIScpO1xyXG4gICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcclxuICAgICAgaWYgKGRhdGEubWVzc2FnZSkge1xyXG4gICAgICAgIHZhciBvdXRkYXRlZF9sYXllcl9wZXJfY291bnRyeV9hbmRfbGFuZyA9IGRhdGEubWVzc2FnZTtcclxuICAgICAgICB1cGRhdGVNYXAob3V0ZGF0ZWRfbGF5ZXJfcGVyX2NvdW50cnlfYW5kX2xhbmcpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHNvY2tldC5vbmNsb3NlID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmIChldmVudC53YXNDbGVhbikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgYENvbm5lY3Rpb24gY2xvc2VkIGNsZWFubHksIGNvZGU9JHtldmVudC5jb2RlfSwgcmVhc29uPSR7ZXZlbnQucmVhc29ufWBcclxuICAgICAgICApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb25uZWN0aW9uIGRpZWRcIik7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgc29ja2V0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgV2ViU29ja2V0IGVycm9yIG9ic2VydmVkOiAke2Vycm9yfWApO1xyXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEZ1bmN0aW9uIHRvIGR5bmFtaWNhbGx5IHVwZGF0ZSB0aGUgbGVnZW5kIGlmIHRoZSBsYW5ndWFnZSBjaGFuZ2Ugd2l0aG91dCByZWxvYWRpbmcgdGhlIHBhZ2VcclxuICAgIC8vIGZ1bmN0aW9uIHVwZGF0ZUxlZ2VuZCgpIHtcclxuICAgIC8vICAgbGV0IGxlZ2VuZERpdiA9ICQoXCIuaW5mby5sZWdlbmRcIilbMF07XHJcbiAgICAvLyAgIGxlZ2VuZERpdi5pbm5lckhUTUwgPSBnZXRQYXRoQmFzZWRDb250ZW50KCk7XHJcbiAgICAvLyAgIG1ha2VEcmFnZ2FibGUobGVnZW5kRGl2KTtcclxuICAgIC8vIH1cclxuICB9IGVsc2Uge1xyXG4gICAgYXBwbHlDU1MoKTtcclxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBlbmRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBEb2N1bWVudCBMb2FkaW5nIHRvb2sgJHtlbmRUaW1lIC0gc3RhcnRUaW1lfSBtaWxsaXNlY29uZHNgKTtcclxuICAgICAgJChcImRpdi5jaGlsZDFcIikuaHRtbChtYXBEYXRhKTtcclxuICAgICAgJChcIi5jaGlsZDFcIilcclxuICAgICAgICAucHJvbWlzZSgpXHJcbiAgICAgICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgJChcImRpdi5jaGlsZDJcIikuZmFkZU91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQoXCJkaXYuY2hpbGQyXCIpLnJlcGxhY2VXaXRoKFwiXCIpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9O1xyXG59KTsiXSwibmFtZXMiOlsiZGVjb21wcmVzcyIsInJlcXVpcmUiLCIkIiwiZG9jdW1lbnQiLCJyZWFkeSIsImFwcGx5Q1NTIiwic3R5bGUiLCJjcmVhdGVFbGVtZW50IiwidHlwZSIsImlubmVySFRNTCIsImhlYWQiLCJhcHBlbmRDaGlsZCIsIndpbmRvdyIsImxvY2F0aW9uIiwiaHJlZiIsImluY2x1ZGVzIiwiaXNUb3VjaFN1cHBvcnRlZCIsIm1zVG91Y2hFbmFibGVkIiwibmF2aWdhdG9yIiwibXNNYXhUb3VjaFBvaW50cyIsImdlbmVyYWxUb3VjaEVuYWJsZWQiLCJtYWtlRHJhZ2dhYmxlIiwiZWxlbWVudCIsImRyYWdnYWJsZSIsInN0YXJ0IiwiZXZlbnQiLCJ1aSIsImNzcyIsInJpZ2h0IiwidG9wIiwiYm90dG9tIiwiZ2V0UGF0aEJhc2VkQ29udGVudCIsInBhdGhMaW5rIiwibGVnZW5kSFRNTF9lbiIsImxlZ2VuZEhUTUxfZnIiLCJhZGRMZWdlbmRCYXNlZE9uVVJMIiwicGFyZW50RGl2IiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImluc2VydEFkamFjZW50SFRNTCIsImRlY29tcHJlc3NEYXRhIiwiY29tcHJlc3NlZERhdGEiLCJkZWNvZGVkRGF0YSIsImF0b2IiLCJzZXJpYWxpemVkX2xheWVycyIsImJ5dGVzIiwiVWludDhBcnJheSIsImxlbmd0aCIsImkiLCJjaGFyQ29kZUF0IiwiZGVjb21wcmVzc2VkRGF0YSIsImRlY29tcHJlc3NlZCIsIlRleHREZWNvZGVyIiwiZGVjb2RlIiwiSlNPTiIsInBhcnNlIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwiY3VzdG9tTGF5ZXJDb250cm9sIiwiY29udHJvbF9sYXllciIsInNob3dMYXllcnMiLCJidXR0b24iLCJkaXNwbGF5IiwicGFyZW50IiwicGFkZGluZyIsImNvbnRyb2xDb250ZW50cyIsImhpZGVMYXllcnMiLCJkZWxheVRpbWVIaWRlIiwidGltZXIiLCJzZXRUaW1lb3V0IiwiY29udHJvbEJ1dHRvbiIsImdldENvbnRhaW5lciIsImJhY2tncm91bmRDb2xvciIsImN1cnNvciIsImNvbnRlbnRzIiwiYWRkRXZlbnRMaXN0ZW5lciIsImNsZWFyVGltZW91dCIsImFkZEhvbWVCdXR0b25Ub01hcCIsIm1hcCIsIm1hcF9sZWFmX2RvbSIsImNoZWNrTG9hZE1hcCIsInNldEludGVydmFsIiwibWFwX2xlYWYiLCJldmFsIiwiaWQiLCJyZXNldFpvb20iLCJnZXRFbGVtZW50QnlJZCIsInNldFZpZXciLCJpbml0aWFsQ2VudGVyIiwiaW5pdGlhbFpvb20iLCJsb2ciLCJidG5Ob2RlIiwic2V0QXR0cmlidXRlIiwiZ2V0Wm9vbSIsImdldENlbnRlciIsImNsZWFySW50ZXJ2YWwiLCJnZXRWYWx1ZUlnbm9yZUNhc2UiLCJvYmoiLCJrZXkiLCJfdHlwZW9mIiwiRXJyb3IiLCJsb3dlcmNhc2VLZXkiLCJ0b0xvd2VyQ2FzZSIsIm9iaktleSIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsInVuZGVmaW5lZCIsInJlcGxhY2VVcHBlckNhc2VXaXRoVW5kZXJzY29yZSIsInNlbnRlbmNlIiwicmVzdWx0IiwiY3VycmVudENoYXIiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsImZldGNoTWFwRGF0YSIsImdldCIsImxpbmsiLCJ1bnBhcnNlZGRhdGEiLCJkYXRhIiwiY2FzaGV3TWFwIiwidXBkYXRlTWFwIiwicHJvbWlzZSIsImRvbmUiLCJmYWRlT3V0IiwicmVwbGFjZVdpdGgiLCJvcmRlcmluZ0xheWVycyIsImxheWVycyIsIm9yZGVyIiwiZm9yRWFjaCIsImxheWVyTmFtZSIsImJyaW5nVG9Gcm9udCIsImFkZExheWVyc1RvTWFwIiwiYWRkTGF5ZXIiLCJwYXJzZUZsb2F0IiwidXNlckNvdW50cnlMYXQiLCJ1c2VyQ291bnRyeUxvbiIsImFkZFRvIiwiZSIsImNvbmNhdCIsImdldEJhc2VNYXAiLCJiYXNlbWFwcyIsIkwiLCJ0aWxlTGF5ZXIiLCJhdHRyaWJ1dGlvbiIsIm1heFpvb20iLCJjb250cm9sIiwiZnVsbHNjcmVlbiIsInBvc2l0aW9uIiwidGl0bGUiLCJ0aXRsZUNhbmNlbCIsImZvcmNlU2VwYXJhdGVCdXR0b24iLCJ1cGRhdGVMYXllciIsIm5ld19sYXllciIsImVhY2hMYXllciIsImxheWVyIiwibmV3TGF5ZXJOYW1lIiwibmFtZSIsIm9wdGlvbnMiLCJyZW1vdmVMYXllciIsImFkZE92ZXJsYXkiLCJzZXJpYWxpemVkRGF0YSIsImlzTGF5ZXJzQnVpbHRlZCIsImFyZ3VtZW50cyIsIl9yZWJ1aWxkTGF5ZXJzIiwicmVidWlsZExheWVycyIsIl9yZWJ1aWxkTGF5ZXJzMiIsIl9zbGljZWRUb0FycmF5Iiwib3V0ZGF0ZWRfbGF5ZXJfcGVyX2NvdW50cnlfYW5kX2xhbmdfYnVpbGRlZCIsIm5lZWRlZFRvQmVCdWlsZGVkIiwia2V5cyIsImdlbmVyYXRlTWFwTGF5ZXJzIiwiY3VycmVudExhbmd1YWdlIiwidXNlckNvdW50cnlOYW1lIiwidmFsdWVzIiwiY291bnRyeU5hbWUiLCJjb3VudHJ5RGF0YSIsImxhbmciLCJsYXllckRhdGEiLCJsYXllck5hbWVVcHBlciIsImxheWVyVHlwZSIsIk1BUF9MQVlFUl9UWVBFIiwicmVjb25zdHJ1Y3RMYXllcnMiLCJsYXllckl0ZW1zIiwibGF5ZXJJdGVtIiwic3R5bGVGdW5jdGlvbiIsInJlY29uc3RydWN0RnVuY3Rpb24iLCJzdHlsZV9mdW5jdGlvbiIsImdlb0pTT04iLCJvbkVhY2hGZWF0dXJlIiwiaGlnaGxpZ2h0X2Z1bmN0aW9uIiwiY3VycmVudEdlb0pzb25PYmoiLCJjdXN0b21fcG9wdXAiLCJwb3B1cCIsImNvbnRlbnQiLCJodG1sIiwiYmFzZTY0RW5jb2RlZElmcmFtZSIsInNyYyIsInNwbGl0IiwiZGVjb2RlZElmcmFtZSIsImJhc2VMaW5rIiwib3JpZ2luIiwicmVwbGFjZSIsIm1vZGlmaWVkQ29udGVudCIsIlJlZ0V4cCIsIm1vZGlmaWVkQmFzZTY0RW5jb2RlZElmcmFtZSIsImJ0b2EiLCJzZXRDb250ZW50IiwiYmluZFBvcHVwIiwiY3VzdG9tX3Rvb2x0aXAiLCJjdXN0b21Ub29sdGlwTGF5ZXJzRmllbGRzQW5kQWxpYXNlcyIsImNvdW50cnlfZGVwdF9sYXllciIsImZpZWxkcyIsImFsaWFzZXMiLCJjb3VudHJ5X2NvbG9yZWRfZGVwdF9sYXllciIsImNvdW50cnlfY29tbXVuZV9sYXllciIsImNvdW50cnlfZGlzdHJpY3RfbGF5ZXIiLCJjb3VudHJ5X2NvbG9yZWRfY29tbXVuZV9sYXllciIsImJpbmRUb29sdGlwIiwiZGl2IiwiRG9tVXRpbCIsImNyZWF0ZSIsImhhbmRsZU9iamVjdCIsImZlYXR1cmUiLCJzdHJpbmdpZnkiLCJjdXN0b21Ub29sdGlwTGF5ZXJGaWVsZHNBbmRBbGlhc2VzIiwidGFibGUiLCJTdHJpbmciLCJ2IiwicHJvcGVydGllcyIsImpvaW4iLCJjbGFzc05hbWUiLCJzdGlja3kiLCJ0b29sdGlwT3B0aW9ucyIsInRvb2x0aXAiLCJ0ZXh0IiwicHVzaCIsInJlY29uc3RydWN0TWFya2VyIiwiY3JlYXRlTGVhZmxldFRpbGVMYXllciIsIndhcm4iLCJ0aWxlcyIsIm1hcmtlckRhdGEiLCJpY29uIiwicmVjb25zdHJ1Y3RJY29uIiwiaWNvbl9jbGFzcyIsImN1cnJlbnRfbWFya2VyIiwibWFya2VyIiwic2V0SWNvbiIsImljb25EYXRhIiwiaWNvbkNsYXNzIiwicHJlZml4IiwiQXdlc29tZU1hcmtlcnMiLCJpY29uVXJsIiwiaWNvblNpemUiLCJvbiIsImNsaWNrIiwidGFyZ2V0IiwiZ2V0Qm91bmRzIiwiZml0Qm91bmRzIiwiZ2V0TGF0TG5nIiwiem9vbSIsImZseVRvIiwibW91c2VvdXQiLCJzZXRTdHlsZSIsInJlc2V0U3R5bGUiLCJtb3VzZW92ZXIiLCJoaWdobGlnaHRTdHlsZSIsImZ1bmNEYXRhIiwiX19mdW5jdGlvbl9fIiwibGF5ZXJzX2Z1bmN0aW9uc190b19yZWNvbXB1dGUiLCJfX3BhcnRpYWxfXyIsImJhc2VGdW5jdGlvbiIsImZ1bmMiLCJwYXJ0aWFsSGlnaGxpZ2h0RnVuY3Rpb24iLCJjb2xvcl92YWx1ZXMiLCJrZXl3b3JkcyIsIm5vcm1hbGl6ZVN0cmluZyIsInN0ciIsIm5vcm1hbGl6ZSIsImRhdGFiYXNlTmFtZSIsIm9iamVjdFN0b3JlTmFtZSIsIk5hbWVkRmVhdHVyZUdyb3VwIiwiRmVhdHVyZUdyb3VwIiwiZXh0ZW5kIiwiaW5pdGlhbGl6ZSIsIm9wZW5SZXF1ZXN0IiwiaW5kZXhlZERCIiwib3BlbiIsIm9udXBncmFkZW5lZWRlZCIsImRiIiwib2JqZWN0U3RvcmVOYW1lcyIsImNvbnRhaW5zIiwiY3JlYXRlT2JqZWN0U3RvcmUiLCJrZXlQYXRoIiwib25zdWNjZXNzIiwidHJhbnNhY3Rpb24iLCJvYmplY3RTdG9yZSIsImdldFJlcXVlc3QiLCJwYXJzZUludCIsIm1hcElkIiwiaGFzaCIsIm1hcEhhc2giLCJjYWNoZWRNYXBIdG1sIiwib25jb21wbGV0ZSIsImNsb3NlIiwidXNlclJvbGUiLCJjYWxsTWFwTWV0aG9kIiwibWFwT2JqZWN0IiwiZnVuY3Rpb25OYW1lIiwibWFwX2NsYXNzX2F0dHJpYnV0ZV9uYW1lIiwiYWN0aXZlQ291bnRyaWVzIiwib3V0ZGF0ZWRMYXllcnMiLCJmaWx0ZXJfYXJyYXkiLCJjb3VudHJ5IiwidmFsdWUiLCJHZW5lcmljTWFwIiwiX2NsYXNzQ2FsbENoZWNrIiwiY291bnRyeUxheWVyIiwiY291bnRyeUJvcmRlckxheWVyIiwiY291bnRyeURlcHRMYXllciIsImNvdW50cnlDb21tdW5lTGF5ZXIiLCJjb3VudHJ5RGlzdHJpY3RMYXllciIsImNvdW50cnlDb2xvcmVkRGVwdExheWVyIiwiY291bnRyeUNvbG9yZWRDb21tdW5lTGF5ZXIiLCJjb3VudHJ5UHJvdGVjdGVkTGF5ZXIiLCJjb3VudHJ5UGxhbnRhdGlvbkxheWVyIiwicWFyTGF5ZXIiLCJ0cmFpbmluZ0xheWVyIiwibnVyc2VyeUxheWVyIiwicHJlZGljdGlvbnNMYXllciIsInRyZWVEZW5zaXR5RXN0aW1hdGlvbkxheWVyIiwiZGVmb3Jlc3RhdGlvbiIsImFmb3Jlc3RhdGlvbiIsIl9jcmVhdGVDbGFzcyIsImNyZWF0ZUZlYXR1cmVHcm91cCIsInNob3ciLCJvdmVybGF5IiwiekluZGV4T2Zmc2V0IiwiZmVhdHVyZUdyb3VwIiwiY3JlYXRlTWFya2VyQ2x1c3RlciIsIm1hcmtlckNsdXN0ZXIiLCJtYXJrZXJDbHVzdGVyR3JvdXAiLCJhZGRMYXllcnNUb0dyb3VwIiwibGF5ZXJHcm91cCIsImNvdW50cmllc0xheWVyTGlzdCIsImVsbXQiLCJnZW5lcmF0ZUNvdW50cnlDb2xvcmVkQ29tbXVuZUxheWVyIiwiZ2VuZXJhdGVDb3VudHJ5Q29sb3JlZERlcHRMYXllciIsImdlbmVyYXRlQ291bnRyeUNvbW11bmVMYXllciIsImdlbmVyYXRlQ291bnRyeURlcHRMYXllciIsImdlbmVyYXRlQ291bnRyeURpc3RyaWN0TGF5ZXIiLCJnZW5lcmF0ZUNvdW50cnlQbGFudGF0aW9uTGF5ZXIiLCJjb3VudHJpZXNNYXJrZXJMaXN0IiwicGxhbnRhdGlvbkNsdXN0ZXIiLCJnZW5lcmF0ZUNvdW50cnlQcm90ZWN0ZWRMYXllciIsImdlbmVyYXRlQ291bnRyeUxheWVyIiwiZ2VuZXJhdGVDb3VudHJ5Qm9yZGVyTGF5ZXIiLCJnZW5lcmF0ZU51cnNlcnlMYXllciIsImdlbmVyYXRlUWFyTGF5ZXIiLCJnZW5lcmF0ZVRyYWluaW5nTGF5ZXIiLCJnZW5lcmF0ZVRyZWVEZW5zaXR5RXN0aW1hdGlvbkxheWVyIiwiZ2VuZXJhdGVQcmVkaWN0aW9uc0xheWVyIiwiZ2VuZXJhdGVEZWZvcmVzdGF0aW9uIiwiZ2VuZXJhdGVBZm9yZXN0YXRpb24iLCJnZW5lcmF0ZU1hcExheWVyc0Z1bmN0aW9uIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsIl9nZXRCYXNlTWFwIiwiX2dldEJhc2VNYXAyIiwiZ2VuZXJpY01hcE9iaiIsImF0dHJpYnV0ZSIsInN0YXJ0c1dpdGgiLCJzbGljZSIsIm1ldGhvZCIsImZyb21FbnRyaWVzIiwiZW50cmllcyIsImZpbHRlciIsIl9yZWYiLCJfcmVmMiIsImsiLCJ0b0ZpeGVkIiwiUHVibGljTWFwIiwiZGVmb3Jlc3RhdGlvbkxheWVyIiwiX2dldEJhc2VNYXAzIiwiX2dldEJhc2VNYXA0IiwicHVibGljTWFwT2JqIiwiX2xvb3AiLCJjdXJyZW50X2NvdW50cnkiLCJfcmVmMyIsIl9yZWY0IiwibWV0aG9kV2l0aENvdW50cnkiLCJEZWZhdWx0TWFwIiwibWFya2VyX0NsdXN0ZXIiLCJ1c2VyQ291bnRyeWxldmVsMk5hbWUiLCJ1c2VyQ291bnRyeWxldmVsMU5hbWUiLCJ1c2VyQ291bnRyeUxldmVsM05hbWUiLCJpc0xheWVyc0J1aWxkZWQiLCJfZ2V0QmFzZU1hcDUiLCJfZ2V0QmFzZU1hcDYiLCJkZWZhdWx0TWFwT2JqIiwiX3JlZjUiLCJfcmVmNiIsIk1BUF9MQVlFUl9PQkpFQ1RfVFlQRSIsIkdFT0pTT04iLCJNQVJLRVIiLCJUSUxFTEFZRVIiLCJSQVNURVJfVElMRUxBWUVSIiwiT1RIRVIiLCJDT1VOVFJZX0xBWUVSIiwiQ09VTlRSWV9CT1JERVJfTEFZRVIiLCJDT1VOVFJZX0RFUFRfTEFZRVIiLCJDT1VOVFJZX0NPTE9SRURfREVQVF9MQVlFUiIsIkNPVU5UUllfQ09NTVVORV9MQVlFUiIsIkNPVU5UUllfRElTVFJJQ1RfTEFZRVIiLCJDT1VOVFJZX0NPTE9SRURfQ09NTVVORV9MQVlFUiIsIkNPVU5UUllfUFJPVEVDVEVEX0xBWUVSIiwiQ09VTlRSWV9QTEFOVEFUSU9OX0xBWUVSIiwiQ09VTlRSWV9QTEFOVEFUSU9OX01BUktFUiIsIk5VUlNFUllfTEFZRVIiLCJRQVJfTEFZRVIiLCJUUkFJTklOR19MQVlFUiIsIlBSRURJQ1RJT05TX0xBWUVSIiwiVFJFRV9ERU5TSVRZX0VTVElNQVRJT05fTEFZRVIiLCJERUZPUkVTVEFUSU9OIiwiQUZPUkVTVEFUSU9OIiwiY291bnRyeV9sYXllciIsImZpbGxDb2xvciIsImNvbG9yIiwid2VpZ2h0IiwiZGFzaEFycmF5IiwiY291bnRyeV9ib3JkZXJfbGF5ZXIiLCJoaWdobGlnaHRfZnVuY3Rpb24yIiwiaGlnaGxpZ2h0RnVuY3Rpb24iLCJfcmVmNyIsImRlcGFydG1lbnQiLCJOQU1FXzEiLCJjb2xvckNvZGUiLCJib3JkZXIiLCJyZWRWYWx1ZSIsImdyZWVuVmFsdWUiLCJibHVlVmFsdWUiLCJ0b1N0cmluZyIsInBhZFN0YXJ0Iiwib3BhY2l0eSIsImZpbGxPcGFjaXR5IiwiX3JlZjgiLCJjb21tdW5lIiwiTkFNRV8yIiwiY291bnRyeV9wcm90ZWN0ZWRfbGF5ZXIiLCJzb2NrZXQiLCJXZWJTb2NrZXQiLCJob3N0Iiwib25vcGVuIiwib25tZXNzYWdlIiwibWVzc2FnZSIsIm91dGRhdGVkX2xheWVyX3Blcl9jb3VudHJ5X2FuZF9sYW5nIiwib25jbG9zZSIsIndhc0NsZWFuIiwiY29kZSIsInJlYXNvbiIsIm9uZXJyb3IiLCJwZXJmb3JtYW5jZSIsImVuZFRpbWUiLCJtYXBEYXRhIl0sInNvdXJjZVJvb3QiOiIifQ==