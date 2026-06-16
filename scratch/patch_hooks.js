const fs = require('fs');
const path = require('path');

const hooksDir = path.join(__dirname, '../apps/web/hooks/api');
const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(hooksDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already uses api from @/lib/axios and has no fetch/fetcher
  if (content.includes('import { api } from "@/lib/axios";')) {
    continue;
  }

  // Remove fetcher definition
  content = content.replace(/const fetcher = async[\s\S]*?};\n\n/g, '');

  // Add import if missing
  if (!content.includes('import { api }')) {
    content = content.replace(/import {([^}]+)} from "@tanstack\/react-query";/, 'import { $1 } from "@tanstack/react-query";\nimport { api } from "@/lib/axios";');
  }

  // Replace fetcher calls
  content = content.replace(/queryFn: \(\) => fetcher\("([^"]+)"\)/g, 'queryFn: async () => { const res = await api.get("$1"); return res.data?.data || res.data; }');
  content = content.replace(/queryFn: \(\) => fetcher\(`([^`]+)`\)/g, 'queryFn: async () => { const res = await api.get(`$1`); return res.data?.data || res.data; }');
  
  // Replace fetch calls
  content = content.replace(/const res = await fetch\("([^"]+)"\);\s+if \(!res\.ok\).*?;\s+return res\.json\(\);/g, 'const res = await api.get("$1");\n      return res.data?.data || [];');
  
  content = content.replace(/mutationFn: \(([^)]+)\) =>\n\s+fetcher\("([^"]+)", {\n\s+method: "POST",\n\s+body: JSON.stringify\(([^)]+)\),\n\s+}\)/g, 'mutationFn: async ($1) => {\n      const res = await api.post("$2", $3);\n      return res.data?.data || res.data;\n    }');

  content = content.replace(/\/api\/v1\//g, '/');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Patched ' + file);
}
