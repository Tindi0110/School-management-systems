const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'pages');

function processFile(fp) {
    let content = fs.readFileSync(fp, 'utf8');

    // Remove inline p-x from cards
    content = content.replace(/className="card p-\d+ /g, 'className="card ');
    content = content.replace(/className="card p-\d+"/g, 'className="card"');

    // Remove bg-white from cards
    content = content.replace(/className="card([^"]*) bg-white /g, 'className="card$1 ');
    content = content.replace(/className="card([^"]*) bg-white"/g, 'className="card$1"');

    // Remove shadow variants from cards
    content = content.replace(/className="card([^"]*) shadow-(sm|md|lg|xl) /g, 'className="card$1 ');
    content = content.replace(/className="card([^"]*) shadow-(sm|md|lg|xl)"/g, 'className="card$1"');

    // Remove base shadow from cards
    content = content.replace(/className="card([^"]*) shadow /g, 'className="card$1 ');
    content = content.replace(/className="card([^"]*) shadow"/g, 'className="card$1"');

    fs.writeFileSync(fp, content);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(f => {
    processFile(path.join(dir, f));
});

console.log('Successfully cleaned all cards in pages!');
