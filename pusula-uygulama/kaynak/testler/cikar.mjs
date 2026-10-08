// Uygulamanın (app_v2.js) üst düzey tanımlarını ayrıştırıp listeler
import * as acorn from "acorn";
import fs from "node:fs";
const src = fs.readFileSync(process.argv[2], "utf8");
const ast = acorn.parse(src, {ecmaVersion: "latest", sourceType: "script", allowAwaitOutsideFunction: true});
const tanim = {};
for (const n of ast.body) {
  if (n.type === "FunctionDeclaration") tanim[n.id.name] = [n.start, n.end];
  else if (n.type === "VariableDeclaration") for (const d of n.declarations) if (d.id.type === "Identifier") tanim[d.id.name] = [n.start, n.end];
}
console.log(Object.keys(tanim).join(" "));
