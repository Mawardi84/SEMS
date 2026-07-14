const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// We will wrap the generateContent calls with a retry function.
// Let's first add a helper function at the top.
const retryHelper = `
async function generateWithRetry(client: any, options: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent(options);
    } catch (error: any) {
      if (error?.status === "UNAVAILABLE" || error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand")) {
        if (attempt === maxRetries) throw error;
        console.warn(\`Model overload, retrying attempt \${attempt + 1}...\`);
        await new Promise(res => setTimeout(res, attempt * 2000));
      } else {
        throw error;
      }
    }
  }
}
`;

if (!content.includes('generateWithRetry')) {
  content = content.replace('const app = express();', retryHelper + '\nconst app = express();');
}

content = content.replace(/await client\.models\.generateContent\(\{/g, 'await generateWithRetry(client, {');

fs.writeFileSync('server.ts', content);
