/* token.js — the tessera token: deterministic two-half SVG from a seed hex.
   Reference "mosaic ring" family (docs/features/token.md). Pure, dual
   browser/Node. Determinism contract: no Math.random, no Date, no locale;
   all floats through r2(); all iteration orders explicit. */
(function (root) {
  'use strict';

  /* sfc32 PRNG, seeded from the first 32 hex chars (4 × uint32, big-endian slices) */
  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }

  function rngFromSeed(seedHex) {
    var h = String(seedHex).toLowerCase();
    var ints = [];
    for (var i = 0; i < 4; i++) ints.push(parseInt(h.slice(i * 8, i * 8 + 8), 16) >>> 0);
    var r = sfc32(ints[0], ints[1], ints[2], ints[3]);
    for (var w = 0; w < 12; w++) r(); // warm up
    return r;
  }

  function r2(v) { return Math.round(v * 100) / 100; }

  /* palette: design-language.md — ink / wax / warm mids */
  var INK = '#211d16', WAX = '#8a4b2d', MID1 = '#6e5c44', MID2 = '#b39b78';

  function pickColor(r) {
    var v = r();
    if (v < 0.55) return INK;
    if (v < 0.80) return WAX;
    return r() < 0.5 ? MID1 : MID2;
  }

  var CX = 200, CY = 200, R_OUT = 168;
  var RINGS = [[34, 72], [72, 106], [106, 138], [138, 166]];
  var SECTORS = [10, 14, 18, 22];

  function pt(rad, ang) {
    return [r2(CX + rad * Math.cos(ang)), r2(CY + rad * Math.sin(ang))];
  }

  function tilePolys(r) {
    var polys = [];
    for (var ring = 0; ring < RINGS.length; ring++) {
      var r0 = RINGS[ring][0], r1 = RINGS[ring][1];
      var n = SECTORS[ring];
      var gapA = 0.035; // radians of grout between tiles
      for (var s = 0; s < n; s++) {
        var a0 = (s / n) * Math.PI * 2 + gapA;
        var a1 = ((s + 1) / n) * Math.PI * 2 - gapA;
        var j = function () { return (r() - 0.5) * 6; };
        var p1 = pt(r0 + 2.5 + j() * 0.4, a0);
        var p2 = pt(r1 - 2.5 + j() * 0.4, a0 + (r() - 0.5) * 0.02);
        var p3 = pt(r1 - 2.5 + j() * 0.4, a1 + (r() - 0.5) * 0.02);
        var p4 = pt(r0 + 2.5 + j() * 0.4, a1);
        polys.push({
          points: p1.join(',') + ' ' + p2.join(',') + ' ' + p3.join(',') + ' ' + p4.join(','),
          fill: pickColor(r)
        });
      }
    }
    return polys;
  }

  function breakLine(r) {
    var pts = [];
    var steps = 6;
    for (var i = 0; i <= steps; i++) {
      var y = 20 + (360 / steps) * i;
      var x = CX + (r() - 0.5) * 2 * (0.12 * R_OUT);
      pts.push([r2(x), r2(y)]);
    }
    // two interlocking notches at PRNG-chosen segments (1..steps-2)
    var n1 = 1 + Math.floor(r() * (steps - 2));
    var n2 = 1 + Math.floor(r() * (steps - 2));
    if (n2 === n1) n2 = (n1 % (steps - 2)) + 1;
    var withNotches = [];
    for (var k = 0; k < pts.length; k++) {
      withNotches.push(pts[k]);
      if (k === n1 || k === n2) {
        var yMid = r2((pts[k][1] + pts[k + 1][1]) / 2);
        var dir = (k === n1) ? 1 : -1;
        var xBase = r2((pts[k][0] + pts[k + 1][0]) / 2);
        withNotches.push([r2(xBase + dir * 16), r2(yMid - 8)]);
        withNotches.push([r2(xBase - dir * 10), r2(yMid + 2)]);
        withNotches.push([r2(xBase + dir * 12), r2(yMid + 9)]);
      }
    }
    return withNotches;
  }

  function polyline(pts) {
    var s = [];
    for (var i = 0; i < pts.length; i++) s.push(pts[i][0] + ',' + pts[i][1]);
    return s.join(' ');
  }

  function clipPolygon(pts, side) {
    // close the break polyline against the left or right edge of the viewBox
    var s = polyline(pts);
    if (side === 'left') return '0,20 ' + s + ' 0,380';
    return '400,20 ' + s + ' 400,380';
  }

  function tokenBody(polys) {
    var s = '';
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="' + R_OUT + '" fill="none" stroke="' + INK + '" stroke-width="3"/>';
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="24" fill="' + WAX + '"/>';
    for (var i = 0; i < polys.length; i++) {
      s += '<polygon points="' + polys[i].points + '" fill="' + polys[i].fill + '"/>';
    }
    return s;
  }

  function svgOpen(w, h) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">';
  }

  /* Renders { full, left, right, sheet } SVG strings. `id` is printed under
     each half on the sheet so halves stay identified when separated. */
  function renderTokenSvg(seedHex, id) {
    var r = rngFromSeed(seedHex);
    var polys = tilePolys(r);
    var brk = breakLine(r);
    var body = tokenBody(polys);
    var brkStroke = '<polyline points="' + polyline(brk) + '" fill="none" stroke="#f7f3ea" stroke-width="4"/>';

    var full = svgOpen(400, 400) + body + brkStroke + '</svg>';

    function half(side) {
      var clipId = 'cut-' + side;
      return svgOpen(400, 400) +
        '<defs><clipPath id="' + clipId + '"><polygon points="' + clipPolygon(brk, side) + '"/></clipPath></defs>' +
        '<g clip-path="url(#' + clipId + ')">' + body + '</g>' +
        '</svg>';
    }
    var left = half('left');
    var right = half('right');

    function inner(svgStr) {
      return svgStr.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    }

    /* the sheet: both halves side by side, dashed cut line, ID under each,
       assembled preview in the corner. Generic font families only. */
    var sheet = svgOpen(880, 500);
    sheet += '<g transform="translate(10,20) scale(0.95)">' + inner(left) + '</g>';
    sheet += '<g transform="translate(470,20) scale(0.95)">' + inner(right) + '</g>';
    sheet += '<line x1="440" y1="10" x2="440" y2="430" stroke="' + INK + '" stroke-width="1" stroke-dasharray="6,6"/>';
    sheet += '<text x="200" y="440" text-anchor="middle" font-family="monospace" font-size="16" fill="' + INK + '">' + id + ' - keep this half</text>';
    sheet += '<text x="660" y="440" text-anchor="middle" font-family="monospace" font-size="16" fill="' + INK + '">' + id + ' - travels with the letter</text>';
    sheet += '<text x="440" y="475" text-anchor="middle" font-family="serif" font-size="14" fill="' + INK + '">Cut along the dashed line. The broken edge is the signature; the halves must meet.</text>';
    sheet += '<g transform="translate(800,410) scale(0.18)">' + inner(full) + '</g>';
    sheet += '</svg>';

    return { full: full, left: left, right: right, sheet: sheet };
  }

  var api = { renderTokenSvg: renderTokenSvg, rngFromSeed: rngFromSeed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraToken = api;
})(typeof self !== 'undefined' ? self : this);
