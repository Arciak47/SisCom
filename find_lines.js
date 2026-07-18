const fs = require('fs');
const file = "app/gerente/nomina/page.jsx";
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

console.log("=== Searching in app/gerente/nomina/page.jsx ===");
lines.forEach((line, idx) => {
  if (line.includes("Jefe o Supervisor") || line.includes("inces:") || line.includes("contratistas:") || line.includes("CATEGORY_SCHEMAS")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
