/* token.js — the tessera token, art generation 2 ("watercolor mosaic",
   2026-07-11): deterministic two-half SVG from a seed hex. Under the tile
   field, 3-5 soft pastel washes (blobby seeded polygons, fill-opacity
   0.5-0.7) pool like watercolor pigment and show through the grout gaps.
   Above them, a finer seeded ring mosaic (4-5 rings, per-seed sector
   counts) keeps an ink-dark skeleton so the disk survives grayscale
   printing and decades of fading. Generation 1 is frozen in
   token-legacy.js; verification accepts either. Pure, dual browser/Node.
   Determinism contract: no Math.random, no Date, no locale; all floats
   through r2(); all iteration orders explicit. */
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

  /* palette: design-language.md — ink skeleton, wax, deep pastels above;
     light watercolor pastels beneath */
  var INK = '#211d16', DEEP_INK = '#392E1F', WAX = '#8a4b2d';
  var BLUSH = '#F2C7B6', BASE = '#FBF6EC';
  var DEEP = ['#B65432', '#C97567', '#9DBBA6', '#CDB878', '#A8B4B8'];
  var WASH_COLORS = ['#F5E0D5', '#DFEDE3', '#F3E9D0', '#E4E9EA', '#F2C7B6'];

  /* tile fills: ink family ~50%, wax ~20%, deep pastels ~30% —
     the light pastels live in the wash beneath, not in the tiles */
  function pickColor(r) {
    var v = r();
    if (v < 0.42) return INK;
    if (v < 0.50) return DEEP_INK;
    if (v < 0.70) return WAX;
    return DEEP[Math.floor(r() * DEEP.length) % DEEP.length];
  }

  var CX = 200, CY = 200, R_OUT = 168;

  function pt(rad, ang) {
    return [r2(CX + rad * Math.cos(ang)), r2(CY + rad * Math.sin(ang))];
  }

  /* one blobby watercolor wash: a many-point polygon whose radius follows
     seeded low-frequency lobes plus fine jitter, clamped inside the disk */
  function washPoly(r) {
    var ox = (r() - 0.5) * 28; // wash center drifts a little off the disk center
    var oy = (r() - 0.5) * 28;
    var nPts = 14 + Math.floor(r() * 7);  // 14..20 points
    var baseR = 95 + r() * 40;            // 95..135
    var amp = 20 + r() * 18;              // lobe depth 20..38
    var lobes = 2 + Math.floor(r() * 3);  // 2..4 lobes
    var phase = r() * Math.PI * 2;
    var pts = [];
    for (var i = 0; i < nPts; i++) {
      var ang = (i / nPts) * Math.PI * 2;
      var rad = baseR + amp * Math.sin(phase + ang * lobes) + (r() - 0.5) * 16;
      if (rad < 60) rad = 60;
      var x = CX + ox + rad * Math.cos(ang);
      var y = CY + oy + rad * Math.sin(ang);
      var dx = x - CX, dy = y - CY;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > 163) { x = CX + dx * (163 / d); y = CY + dy * (163 / d); } // stay inside the rim
      pts.push([r2(x), r2(y)]);
    }
    return pts;
  }

  /* shrink a polygon toward its centroid — the darker pooled core of a wash */
  function shrink(pts, k) {
    var cx = 0, cy = 0, i;
    for (i = 0; i < pts.length; i++) { cx += pts[i][0]; cy += pts[i][1]; }
    cx /= pts.length; cy /= pts.length;
    var out = [];
    for (i = 0; i < pts.length; i++) {
      out.push([r2(cx + (pts[i][0] - cx) * k), r2(cy + (pts[i][1] - cy) * k)]);
    }
    return out;
  }

  /* the whole field: washes beneath, then a per-seed ring mosaic above.
     Ring count (4 or 5), band boundaries, each ring's sector count, angular
     phase and tile jitter are all drawn from the stream in fixed order, so
     every disk is individually laid rather than stamped from one template. */
  function tilePolys(r) {
    var washes = [];
    var nW = 3 + Math.floor(r() * 3); // 3..5 washes
    var cStart = Math.floor(r() * WASH_COLORS.length) % WASH_COLORS.length;
    var cStep = 1 + Math.floor(r() * 3); // 1..3, coprime with 5 → no repeated wash color
    for (var w = 0; w < nW; w++) {
      var pts = washPoly(r);
      var op = r2(0.5 + r() * 0.2); // fill-opacity 0.5..0.7
      washes.push({
        points: polyline(pts),
        core: polyline(shrink(pts, 0.72)),
        fill: WASH_COLORS[(cStart + w * cStep) % WASH_COLORS.length],
        opacity: op
      });
    }

    var tiles = [];
    var nRings = r() < 0.45 ? 4 : 5;
    var rIn = 40, rOutMax = 160;
    var band = (rOutMax - rIn) / nRings;
    var bounds = [rIn];
    for (var b = 1; b < nRings; b++) bounds.push(r2(rIn + band * b + (r() - 0.5) * 8));
    bounds.push(rOutMax);

    for (var ring = 0; ring < nRings; ring++) {
      var r0 = bounds[ring], r1 = bounds[ring + 1];
      var rMid = (r0 + r1) / 2;
      var tileW = 14 + r() * 6; // target tile width in px, per ring
      var n = Math.max(10, Math.round((Math.PI * 2 * rMid) / tileW));
      var phase = r() * Math.PI * 2; // rings don't align — laid by hand
      var gapHalf = 1.6 / rMid; // ~3.2px linear grout regardless of radius
      for (var s = 0; s < n; s++) {
        var a0 = phase + (s / n) * Math.PI * 2 + gapHalf;
        var a1 = phase + ((s + 1) / n) * Math.PI * 2 - gapHalf;
        var p1 = pt(r0 + 1.8 + (r() - 0.5) * 2.4, a0);
        var p2 = pt(r1 - 1.8 + (r() - 0.5) * 2.4, a0 + (r() - 0.5) * 0.015);
        var p3 = pt(r1 - 1.8 + (r() - 0.5) * 2.4, a1 + (r() - 0.5) * 0.015);
        var p4 = pt(r0 + 1.8 + (r() - 0.5) * 2.4, a1);
        tiles.push({
          points: p1.join(',') + ' ' + p2.join(',') + ' ' + p3.join(',') + ' ' + p4.join(','),
          fill: pickColor(r)
        });
      }
    }
    return { washes: washes, tiles: tiles };
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

  /* substrate disk → washes (each with a pooled core) → tile field →
     ink rim → blush halo → wax disc. Washes peek through the grout. */
  function tokenBody(art) {
    var s = '';
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="166" fill="' + BASE + '"/>';
    for (var w = 0; w < art.washes.length; w++) {
      var wash = art.washes[w];
      s += '<polygon points="' + wash.points + '" fill="' + wash.fill + '" fill-opacity="' + wash.opacity + '"/>';
      s += '<polygon points="' + wash.core + '" fill="' + wash.fill + '" fill-opacity="0.3"/>';
    }
    for (var i = 0; i < art.tiles.length; i++) {
      s += '<polygon points="' + art.tiles[i].points + '" fill="' + art.tiles[i].fill + '"/>';
    }
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="' + R_OUT + '" fill="none" stroke="' + INK + '" stroke-width="3"/>';
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="31" fill="' + BLUSH + '"/>';
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="24" fill="' + WAX + '" stroke="' + DEEP_INK + '" stroke-width="1.5"/>';
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
    var brkStroke = '<polyline points="' + polyline(brk) + '" fill="none" stroke="#FBF6EC" stroke-width="4"/>';

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
