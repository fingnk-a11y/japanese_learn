const fs = require('fs');
const path = require('path');

// This small utility will walk through the "vocabs" directory and
// ensure every vocabulary object has a "tm" property. If none is
// provided it copies the english text as a placeholder so the UI
// doesn't break when Turkmen is selected.  You can later replace
// the placeholder values with actual translations.

const dir = path.join(__dirname, 'vocabs');

fs.readdirSync(dir).forEach(file => {
  if (!file.endsWith('.json')) return;
  const full = path.join(dir, file);
  const json = JSON.parse(fs.readFileSync(full, 'utf8'));

  if (Array.isArray(json)) {
    let updated = false;
    json.forEach(item => {
      if (item && typeof item === 'object' && !('tm' in item)) {
        item.tm = item.en || '';
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(full, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`patched ${file}`);
    }
  }
});
