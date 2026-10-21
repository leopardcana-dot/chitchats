// astro-ephemeris.js
// Thin, defensive adapter around window.ephemeris.
// Exposes a simple API that your chart code can call reliably.

(function () {
  'use strict';

  // ── Backend / library sanity ──────────────────────────────
  function ensureLibrary() {
    if (typeof window.ephemeris === 'undefined' || !window.ephemeris) {
      throw new Error(
        'astro-ephemeris: window.ephemeris is not loaded. ' +
        'Make sure <script src="ephemeris-browser.min.js"> runs BEFORE astro-ephemeris.js.'
      );
    }
    if (typeof window.ephemeris.getAllPlanets !== 'function') {
      throw new Error(
        'astro-ephemeris: window.ephemeris.getAllPlanets is missing. ' +
        'The bundle may have failed to load. Check the Network tab.'
      );
    }
  }

  // ── Julian Day helpers ────────────────────────────────────
  function jdFromUTCDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }
  function dateFromJD(jd) {
    return new Date((jd - 2440587.5) * 86400000);
  }

  // ── Name map: your app names → this library's body names ─
  // The moshier backend ships these lowercase names:
  //   sun, mercury, venus, moon, mars, jupiter, saturn, uranus,
  //   neptune, pluto, chiron, sirius, rahu, ketu, trueRahu, trueKetu
  var BODY_MAP = {
    Sun:     'sun',
    Moon:    'moon',
    Mercury: 'mercury',
    Venus:   'venus',
    Mars:    'mars',
    Jupiter: 'jupiter',
    Saturn:  'saturn',
    Uranus:  'uranus',
    Neptune: 'neptune',
    Pluto:   'pluto',
    Chiron:  'chiron',
    NNode:   'trueRahu',
    SNode:   'trueKetu'
  };

  // ── Cached raw result per JD (avoid recomputing 13x) ─────
  var rawCache = {};

  function getRaw(jd) {
    var key = jd.toFixed(6);
    if (rawCache[key]) return rawCache[key];

    ensureLibrary();

    var date = dateFromJD(jd);
    if (isNaN(date.getTime())) {
      throw new Error('astro-ephemeris: jd ' + jd + ' produced an invalid Date');
    }

    // Try in priority order. Prefer the moshier backend (bundled,
    // no data files needed, ~1 arcsec accuracy 1600–2200).
    var backends = ['moshier', 'astronomy-engine', 'swisseph'];
    var lastErr = null;
    for (var i = 0; i < backends.length; i++) {
      try {
        if (typeof window.ephemeris.backends === 'function') {
          var list = window.ephemeris.backends();
          var found = list.filter(function (b) {
            return b.name === backends[i] && b.available;
          })[0];
          if (!found) continue;
        }
        if (typeof window.ephemeris.use === 'function') {
          window.ephemeris.use(backends[i]);
        }
        var r = window.ephemeris.getAllPlanets(date, 0, 0, 0);
        if (r && r.observed) {
          rawCache[key] = r;
          return r;
        }
      } catch (e) {
        lastErr = e;
      }
    }
    throw new Error(
      'astro-ephemeris: no usable backend. Last error: ' +
      (lastErr ? lastErr.message : 'unknown')
    );
  }

  // ── Public API ────────────────────────────────────────────

  // Longitude in degrees [0, 360) for an app-name planet at a JD.
  function lon(appName, jd) {
    var bname = BODY_MAP[appName];
    if (!bname) return 0;
    var r = getRaw(jd);
    var body = r.observed[bname];
    if (!body || !body.available) return 0;
    var L = body.apparentLongitudeDd;
    if (typeof L !== 'number' || isNaN(L)) return 0;
    return ((L % 360) + 360) % 360;
  }

  // Retrograde flag (Sun/Moon always false).
  function rx(appName, jd) {
    if (appName === 'Sun' || appName === 'Moon') return false;
    var bname = BODY_MAP[appName];
    if (!bname) return false;
    var r = getRaw(jd);
    var body = r.observed[bname];
    return !!(body && body.available && body.is_retrograde);
  }

  // Daily motion in degrees/day (absolute value).
  function speed(appName, jd) {
    var bname = BODY_MAP[appName];
    if (!bname) return 0;
    var r = getRaw(jd);
    var body = r.observed[bname];
    if (!body || !body.available) return 0;
    var m = body.apparentLongitudeDdPerDay;
    if (typeof m !== 'number' || isNaN(m)) return 0;
    return Math.abs(m);
  }

  // Optional: expose raw data for debugging.
  function raw(appName, jd) {
    var bname = BODY_MAP[appName];
    if (!bname) return null;
    return getRaw(jd).observed[bname] || null;
  }

  // Fill an array of planet objects compatible with your chart code.
  // Your existing loop builds { id, name, g, col, lon, rx, dm, sign, dig }.
  // This helper only fills lon / rx / dm — you still run getSign() and
  // getDignity() yourself.
  function fillPlanets(appNames, jd, out) {
    out = out || [];
    for (var i = 0; i < appNames.length; i++) {
      var n = appNames[i];
      out.push({
        id: n,
        name: n,
        lon: lon(n, jd),
        rx: rx(n, jd),
        dm: speed(n, jd)
      });
    }
    return out;
  }

  window.astroEphemeris = {
    version: '1.0.0',
    jdFromUTCDate: jdFromUTCDate,
    dateFromJD: dateFromJD,
    lon: lon,
    rx: rx,
    speed: speed,
    raw: raw,
    fillPlanets: fillPlanets,
    // Let the app inspect/clear the cache.
    clearCache: function () { rawCache = {}; },
    // Expose the map so the app can extend it if needed.
    BODY_MAP: BODY_MAP
  };
})();