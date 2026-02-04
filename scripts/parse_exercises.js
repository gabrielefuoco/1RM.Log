const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../esercizi.md');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const exercises = [];

let currentSection = '';
let currentHeaders = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Section headers
    if (line.startsWith('## ')) {
        const match = line.match(/## \d+\. (.*)/);
        if (match) {
            currentSection = match[1];
        }
    }

    // Identify tables
    if (line.startsWith('|') && line.includes('---')) continue;
    if (line.startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');

        // Header detection
        if (cells.some(c => c.toLowerCase().includes('esercizio') || c.toLowerCase().includes('exercise'))) {
            currentHeaders = cells;
            continue;
        }

        if (currentHeaders.length > 0 && cells.length >= 2) {
            const exercise = {};
            currentHeaders.forEach((header, index) => {
                exercise[header.toLowerCase()] = cells[index];
            });

            // Map to schema: name, body_parts, type
            const mapped = {
                name: exercise['esercizio'] || exercise['exercise'] || cells[0],
                body_parts: [currentSection.split(':')[0].trim()], // e.g. ["Il Complesso Toracico"]
                type: 'unknown',
                notes: exercise['note biomeccaniche'] || exercise['dettaglio biomeccanico'] || exercise['note tecniche'] || exercise['note'] || ''
            };

            // Heuristic for type (equipment)
            const name = mapped.name.toLowerCase();
            if (name.includes('barbell') || name.includes('bilanciere')) mapped.type = 'bilanciere';
            else if (name.includes('dumbbell') || name.includes('manubri')) mapped.type = 'manubrio';
            else if (name.includes('cable') || name.includes('cavi')) mapped.type = 'cavi';
            else if (name.includes('machine') || name.includes('macchina') || name.includes('press machine') || name.includes('pec deck')) mapped.type = 'macchina';
            else if (name.includes('bodyweight') || name.includes('push-up') || name.includes('pull-up') || name.includes('dip')) mapped.type = 'corpo libero';

            // Check headers for explicit equipment
            const equipmentHeader = currentHeaders.find(h => h.toLowerCase().includes('attrezzatura') || h.toLowerCase().includes('tipo'));
            if (equipmentHeader) {
                const equipmentVal = exercise[equipmentHeader.toLowerCase()].toLowerCase();
                if (equipmentVal.includes('bilanciere')) mapped.type = 'bilanciere';
                else if (equipmentVal.includes('manubrio')) mapped.type = 'manubrio';
                else if (equipmentVal.includes('cavi')) mapped.type = 'cavi';
                else if (equipmentVal.includes('macchina')) mapped.type = 'macchina';
                else if (equipmentVal.includes('corpo libero')) mapped.type = 'corpo libero';
            }

            exercises.push(mapped);
        }
    }
}

// Generate SQL
const sql = exercises.map(ex => {
    const name = ex.name.replace(/'/g, "''");
    // Convert body_parts array to PostgreSQL array literal: ARRAY['item1', 'item2']
    const bodyPartsSql = `ARRAY[${ex.body_parts.map(p => `'${p.replace(/'/g, "''")}'`).join(', ')}]`;
    const type = ex.type.replace(/'/g, "''");
    return `INSERT INTO exercises (name, body_parts, type, user_id) VALUES ('${name}', ${bodyPartsSql}, '${type}', NULL);`;
}).join('\n');

fs.writeFileSync(path.join(__dirname, '../supabase/seed_exercises.sql'), sql);
console.log(`Parsed ${exercises.length} exercises.`);
