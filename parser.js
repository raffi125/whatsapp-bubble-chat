// parser.js
// Fungsi: parse WhatsApp exported .txt ke array pesan {timestamp, author, text, raw}
// Catatan: regex menangani beberapa format tanggal umum. Tidak sempurna untuk semua lokal,
// tapi bekerja untuk banyak export standar (dd/mm/yyyy, mm/dd/yy, dll).

(function(global){
  function tryParseDate(dateStr, timeStr){
    // Gabungkan dan coba Date parsing heuristik:
    const s = dateStr + ' ' + timeStr;
    // Replace dots with slashes, remove ordinal th/st/nd jika ada
    const cleaned = s.replace(/(\d)(st|nd|rd|th)/g, '$1').replace(/\./g, '/');
    const d = new Date(cleaned);
    if(!isNaN(d)) return d.toISOString();
    // Fallback: just return raw string
    return cleaned;
  }

  function parseWhatsAppExport(text){
    const lines = text.split(/\r?\n/);
    const messages = [];
    // Pattern: tanggal, waktu - rest
    // contoh: 23/6/2024, 21:15 - Name: pesan...
    const headerRegex = /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APMapm]{2})?)\s-\s(.*)$/;
    let current = null;

    for (let i = 0; i < lines.length; i++){
      const line = lines[i];
      const m = line.match(headerRegex);
      if (m){
        // new message
        if (current) messages.push(current);
        const datePart = m[1].trim();
        const timePart = m[2].trim();
        let rest = m[3];
        // rest often "Name: message" but could be "Messages to this chat..." (system) or "Name: " missing
        const authorSep = rest.indexOf(':');
        let author = null;
        let textPart = rest;
        if (authorSep !== -1){
          author = rest.slice(0, authorSep).trim();
          textPart = rest.slice(authorSep + 1).trim();
        } else {
          // system message (no author)
          author = null;
          textPart = rest.trim();
        }

        current = {
          timestamp: tryParseDate(datePart, timePart),
          date_raw: datePart + ', ' + timePart,
          author: author,
          text: textPart,
          raw: line
        };
      } else {
        // continuation line of previous message (multi-line message)
        if (current){
          if (line.trim() === '') {
            current.text += '\n';
          } else {
            current.text += '\n' + line;
          }
        } else {
          // if file starts with BOM/garbage lines, skip or attach as system
          const sys = {
            timestamp: null,
            date_raw: null,
            author: null,
            text: line,
            raw: line
          };
          messages.push(sys);
        }
      }
    }
    if (current) messages.push(current);
    return messages;
  }

  // expose
  global.parseWhatsAppExport = parseWhatsAppExport;
})(window);
