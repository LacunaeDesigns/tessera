/* zip.js — pure store-method ZIP writer and reader (no compression: bytes
   stay readable even without zip tooling — SPEC §1, century test B). Dual
   browser/Node. Deliberate small code instead of a dependency (architecture.md
   vendoring policy). Deterministic: caller supplies the {y,m,d} stamp. */
(function (root) {
  'use strict';

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    // Node < 11 fallback
    return new Uint8Array(Buffer.from(str, 'utf8'));
  }

  function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
  function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

  function dosStamp(d) { // {y,m,d} → [timeLo,timeHi,dateLo,dateHi]; fixed noon, determinism
    var time = (12 << 11) | (0 << 5) | 0;
    var date = (((d.y - 1980) & 0x7F) << 9) | ((d.m & 0xF) << 5) | (d.d & 0x1F);
    return u16(time).concat(u16(date));
  }

  /* entries: [{ name: string, data: Uint8Array|string }], stamp: {y,m,d} */
  function buildZip(entries, stamp) {
    var chunks = [], central = [], offset = 0;
    var stampBytes = dosStamp(stamp);

    for (var i = 0; i < entries.length; i++) {
      var name = utf8(entries[i].name);
      var data = typeof entries[i].data === 'string' ? utf8(entries[i].data) : entries[i].data;
      var crc = crc32(data);
      var header = [].concat(
        u32(0x04034B50),        // local file header signature
        u16(10),                // version needed: 1.0 (store)
        u16(0x0800),            // flags: UTF-8 names
        u16(0),                 // method: store
        stampBytes,             // mod time + date
        u32(crc),
        u32(data.length),       // compressed (== uncompressed, store)
        u32(data.length),
        u16(name.length),
        u16(0)                  // extra length
      );
      chunks.push(new Uint8Array(header), name, data);

      central.push([].concat(
        u32(0x02014B50),        // central directory signature
        u16(20), u16(10),       // made by / needed
        u16(0x0800), u16(0),
        stampBytes,
        u32(crc),
        u32(data.length), u32(data.length),
        u16(name.length), u16(0), u16(0),
        u16(0), u16(0), u32(0),
        u32(offset)
      ), name);
      offset += header.length + name.length + data.length;
    }

    var centralStart = offset, centralSize = 0;
    for (var c = 0; c < central.length; c += 2) {
      var head = new Uint8Array(central[c]);
      chunks.push(head, central[c + 1]);
      centralSize += head.length + central[c + 1].length;
    }

    chunks.push(new Uint8Array([].concat(
      u32(0x06054B50),          // end of central directory
      u16(0), u16(0),
      u16(entries.length), u16(entries.length),
      u32(centralSize),
      u32(centralStart),
      u16(0)
    )));

    var total = 0;
    for (var j = 0; j < chunks.length; j++) total += chunks[j].length;
    var out = new Uint8Array(total), pos = 0;
    for (var k = 0; k < chunks.length; k++) { out.set(chunks[k], pos); pos += chunks[k].length; }
    return out;
  }

  function utf8dec(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
    // Node < 11 fallback
    return Buffer.from(bytes).toString('utf8');
  }

  /* readZip(bytes: Uint8Array) -> [{ name, data: Uint8Array, crcOk: boolean }]
     Store-method reader: EOCD -> central directory -> local headers. */
  function readZip(bytes) {
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var eocd = -1; // scan back for PK\x05\x06 (our own zips carry no comment, but scan anyway)
    for (var i = bytes.length - 22; i >= 0; i--) {
      if (dv.getUint32(i, true) === 0x06054B50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('not a zip: end-of-central-directory signature missing');
    var count = dv.getUint16(eocd + 10, true);
    var cdOfs = dv.getUint32(eocd + 16, true);
    var out = [];
    var p = cdOfs;
    for (var n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014B50) throw new Error('bad central directory entry');
      var method = dv.getUint16(p + 10, true);
      var crc = dv.getUint32(p + 16, true);
      var csize = dv.getUint32(p + 20, true);
      var nameLen = dv.getUint16(p + 28, true);
      var extraLen = dv.getUint16(p + 30, true);
      var cmtLen = dv.getUint16(p + 32, true);
      var localOfs = dv.getUint32(p + 42, true);
      var name = utf8dec(bytes.subarray(p + 46, p + 46 + nameLen));
      if (method !== 0) throw new Error('unsupported compression in ' + name + ' (Tessera zips are store-only)');
      var lNameLen = dv.getUint16(localOfs + 26, true);
      var lExtraLen = dv.getUint16(localOfs + 28, true);
      var dataStart = localOfs + 30 + lNameLen + lExtraLen;
      var data = bytes.subarray(dataStart, dataStart + csize);
      out.push({ name: name, data: data, crcOk: crc32(data) === crc });
      p += 46 + nameLen + extraLen + cmtLen;
    }
    return out;
  }

  var api = { crc32: crc32, buildZip: buildZip, readZip: readZip, utf8: utf8, utf8dec: utf8dec };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraZip = api;
})(typeof self !== 'undefined' ? self : this);
