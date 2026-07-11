/* crypt.js — WebCrypto wrapper. AES-256-GCM, key from PBKDF2-SHA256.
   Privacy from strangers, stated plainly; NOT time-release (the honesty page
   at /about#honesty says so). This is the one module exempt from the
   no-randomness rule: security needs a fresh random salt and IV per seal.
   Tests inject salt/iv so fixtures stay byte-exact (docs/features/encryption.md).
     encryptLetter(text, pass, opts?) -> Promise<{ wrapper, manifestField }>
     decryptLetter(wrapper, pass)     -> Promise<text>
   decryptLetter throws Error('wrong passphrase or damaged file') on auth failure. */
(function (root) {
  'use strict';
  function subtle() {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto unavailable — this browser cannot lock letters');
    }
    return crypto.subtle;
  }
  function getRandom(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }

  var b64 = {
    enc: function (u8) {
      var s = '';
      u8.forEach(function (b) { s += String.fromCharCode(b); });
      return (typeof btoa !== 'undefined') ? btoa(s) : Buffer.from(u8).toString('base64');
    },
    dec: function (s) {
      if (typeof atob !== 'undefined') {
        var bin = atob(s), a = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
        return a;
      }
      return new Uint8Array(Buffer.from(s, 'base64'));
    }
  };

  var ITER = 600000;

  function deriveKey(pass, salt, iterations) {
    return subtle().importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return subtle().deriveKey(
          { name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
  }

  function encryptLetter(text, pass, opts) {
    opts = opts || {};
    var salt = opts.salt || getRandom(16);
    var iv = opts.iv || getRandom(12);
    var iterations = opts.iterations || ITER;
    return deriveKey(pass, salt, iterations).then(function (key) {
      return subtle().encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(text));
    }).then(function (ct) {
      var field = {
        algo: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: iterations,
        salt: b64.enc(salt), iv: b64.enc(iv)
      };
      var wrapper = '# Tessera encrypted letter (AES-256-GCM, PBKDF2-SHA256)\n' +
        '# This file is the letter, locked with a passphrase someone was trusted with.\n' +
        '# salt=' + field.salt + ' iv=' + field.iv + ' iterations=' + iterations + '\n' +
        b64.enc(new Uint8Array(ct)).replace(/(.{64})/g, '$1\n') + '\n';
      return { wrapper: wrapper, manifestField: field };
    });
  }

  function decryptLetter(wrapper, pass) {
    var m = wrapper.match(/salt=(\S+) iv=(\S+) iterations=(\d+)/);
    if (!m) return Promise.reject(new Error('not a Tessera encrypted letter (header missing)'));
    var salt = b64.dec(m[1]), iv = b64.dec(m[2]), iterations = parseInt(m[3], 10);
    var body = wrapper.split('\n').filter(function (l) { return l && l[0] !== '#'; }).join('');
    return deriveKey(pass, salt, iterations).then(function (key) {
      return subtle().decrypt({ name: 'AES-GCM', iv: iv }, key, b64.dec(body));
    }).then(function (pt) {
      return new TextDecoder().decode(pt);
    }, function () {
      throw new Error('wrong passphrase or damaged file');
    });
  }

  var api = { encryptLetter: encryptLetter, decryptLetter: decryptLetter };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraCrypt = api;
})(typeof self !== 'undefined' ? self : this);
