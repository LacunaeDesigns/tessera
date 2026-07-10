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
     letter, openWhenNeeded } → resolves to the sealed letter object */
  function seal(fields) {
    var M = root.TesseraManifest;
    var letterText = M.canonLetterText(fields.letter) + '\n';
    var seedString = M.tokenSeedString(fields);

    return sha256Hex(seedString).then(function (seedHex) {
      var id = M.deriveId(seedHex);
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
        openWhenNeeded: !!fields.openWhenNeeded
      };
      var readme = M.renderReadme(f);
      var manifest = M.manifestJson(f);
      var token = root.TesseraToken.renderTokenSvg(seedHex, id);
      var tokenSvg = token.sheet + '\n';

      var files = [
        { name: 'README.txt', data: readme },
        { name: 'letter.txt', data: letterText },
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
          zipName: folder + '.zip'
        };
      });
    });
  }

  function download(sealed) {
    var blob = new Blob([sealed.zip], { type: 'application/zip' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = sealed.zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  var api = { seal: seal, download: download, sha256Hex: sha256Hex };
  root.TesseraExport = api;
})(typeof self !== 'undefined' ? self : this);
