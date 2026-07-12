/* booklet.js — PURE saddle-stitch imposition math (docs/features/booklet.md).
   No DOM, no Date, no random, no locale — dual browser/Node like js/zip.js.
   impose(nPages) -> [{ front:[outer,inner], back:[inner,outer] }, ...], one
   entry per duplex A4 sheet. nPages is padded up to a multiple of 4; padded
   slots come back as null (print them blank). sequential(nPages) is the plain
   1..n order for the spiral/staple two-up mode. */
(function (root) {
  'use strict';

  function impose(nPages) {
    var n = Math.ceil(nPages / 4) * 4;
    function page(p) { return p <= nPages ? p : null; }
    var sheets = [];
    for (var i = 0; i < n / 4; i++) {
      sheets.push({
        front: [page(n - 2 * i), page(1 + 2 * i)],
        back: [page(2 + 2 * i), page(n - 1 - 2 * i)]
      });
    }
    return sheets;
  }

  function sequential(nPages) {
    var out = [];
    for (var p = 1; p <= nPages; p++) out.push(p);
    return out;
  }

  var api = { impose: impose, sequential: sequential };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraBooklet = api;
})(typeof self !== 'undefined' ? self : this);
