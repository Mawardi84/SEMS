const fs = require('fs');

const dbPath = 'db.json';
const tsPath = 'src/data/initialData.ts';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let tsContent = fs.readFileSync(tsPath, 'utf8');

const updatedDbString = JSON.stringify(db, null, 2);

const newTsContent = `import { SEMSData } from "../types";\n\nexport const initialData: SEMSData = ${updatedDbString};\n`;

fs.writeFileSync(tsPath, newTsContent);
console.log('src/data/initialData.ts updated');
