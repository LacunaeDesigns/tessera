/* reminders.js — calendar/card affordances for the landing shelf and the
   sealed receipt. Pure glue over the shared engine; open-when letters carry
   no date and are never offered a calendar file (the reminder is the life
   event, not a day). Spec: docs/features/reminders.md. */
(function (root) {
  'use strict';
  var M = root.TesseraManifest, I = root.TesseraIcs, E = root.TesseraExport, P = root.TesseraPrint;

  function icsFor(e) {
    return {
      id: e.id, to: e.to || 'someone', written: e.written, openOn: e.openOn,
      coverText: 'A letter for ' + (e.to || 'someone') + ', sealed '
        + (e.written ? M.dateInWords(e.written) : 'long ago') + '.'
    };
  }
  function downloadOne(e) {
    E.downloadText(I.buildIcs([icsFor(e)]), 'tessera-' + e.id + '.ics', 'text/calendar');
  }
  function downloadAll(entries) {
    var dated = (entries || []).filter(function (x) { return !x.openWhenNeeded; });
    if (dated.length) E.downloadText(I.buildIcs(dated.map(icsFor)), 'tessera-letters.ics', 'text/calendar');
  }
  function printCard(entries) { P.printCard(entries || []); }

  root.TesseraReminders = { icsFor: icsFor, downloadOne: downloadOne, downloadAll: downloadAll, printCard: printCard };
})(typeof self !== 'undefined' ? self : this);
