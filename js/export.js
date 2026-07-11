/* export.js — the one seal path (architecture.md): every letter, from any
   flow, becomes a folder and a print kit here. Browser-side orchestration
   over the pure modules. */
(function (root) {
  'use strict';

  function toHex(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }

  function sha256Hex(str) {
    var bytes = TesseraZip.utf8(str);
    return crypto.subtle.digest('SHA-256', bytes).then(toHex);
  }

  /* fields: { to, from, written, openOn, occasion, language, custody[],
     letter, openWhenNeeded, writeback } → resolves to the sealed letter object */
  function seal(fields) {
    var M = root.TesseraManifest;
    var letterText = M.canonLetterText(fields.letter) + '\n';
    var seedString = M.tokenSeedString(fields);

    return sha256Hex(seedString).then(function (seedHex) {
      var id = M.deriveId(seedHex);

      /* optional passphrase privacy (SPEC §9): the letter body becomes
         letter.txt.enc; README.txt is never locked. One seal path still —
         encryption is just a step inside it. The passphrase itself is never
         persisted; only salt/iv/iterations (+ optional hint) ride the manifest. */
      var lockStep;
      if (fields.passphrase) {
        lockStep = root.TesseraCrypt.encryptLetter(letterText, fields.passphrase).then(function (enc) {
          var field = enc.manifestField;
          if (fields.hint) field.hint = fields.hint;
          return { name: 'letter.txt.enc', data: enc.wrapper, encryption: field };
        });
      } else {
        lockStep = Promise.resolve({ name: 'letter.txt', data: letterText, encryption: null });
      }

      return lockStep.then(function (letterFile) {
        var f = {
          id: id,
          written: fields.written,
          openOn: fields.openOn,
          from: fields.from,
          to: fields.to,
          occasion: fields.occasion,
          language: fields.language || 'en',
          custody: fields.custody || [],
          tokenSeed: seedHex,
          openWhenNeeded: !!fields.openWhenNeeded,
          writeback: fields.writeback || null
        };
        if (letterFile.encryption) f.encryption = letterFile.encryption;
        var readme = M.renderReadme(f);
        var manifest = M.manifestJson(f);
        var token = root.TesseraToken.renderTokenSvg(seedHex, id);
        var tokenSvg = token.sheet + '\n';

        var files = [
          { name: 'README.txt', data: readme },
          { name: letterFile.name, data: letterFile.data },
          { name: 'manifest.json', data: manifest },
          { name: 'token.svg', data: tokenSvg }
        ];

        return Promise.all(files.map(function (file) {
          return sha256Hex(file.data);
        })).then(function (sums) {
          var checks = '';
          for (var i = 0; i < files.length; i++) checks += sums[i] + '  ' + files[i].name + '\n';
          files.push({ name: 'checksums.txt', data: checks });

          var folder = 'tessera-' + id;
          var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f.written);
          var zip = root.TesseraZip.buildZip(
            files.map(function (file) { return { name: folder + '/' + file.name, data: file.data }; }),
            { y: parseInt(dm[1], 10), m: parseInt(dm[2], 10), d: parseInt(dm[3], 10) }
          );

          return {
            fields: f,
            letterText: letterText,
            readme: readme,
            token: token,
            zip: zip,
            zipName: folder + '.zip',
            encrypted: !!letterFile.encryption
          };
        });
      });
    });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function download(sealed) {
    downloadBlob(new Blob([sealed.zip], { type: 'application/zip' }), sealed.zipName);
  }

  /* generic text download — the calendar files (text/calendar) reuse this */
  function downloadText(text, filename, mime) {
    downloadBlob(new Blob([text], { type: mime || 'text/plain' }), filename);
  }

  var api = { seal: seal, download: download, downloadText: downloadText, sha256Hex: sha256Hex };
  root.TesseraExport = api;
})(typeof self !== 'undefined' ? self : this);
