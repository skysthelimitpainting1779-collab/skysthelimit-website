import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const wikiDir = path.join(projectRoot, 'wiki');

function walkDir(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        files = files.concat(walkDir(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'INDEX.md') {
      files.push(fullPath);
    }
  }
  return files;
}

export function compileWiki() {
  const mdFiles = walkDir(wikiDir);
  const nodes = [];
  const links = [];
  const conceptMap = new Map();

  // 1. Parse all Markdown notes
  mdFiles.forEach((filePath, idx) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(wikiDir, filePath).replace(/\\/g, '/');
    
    // Extract title from YAML or H1
    let title = path.basename(filePath, '.md');
    const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/title:\s*["']?([^"'\n]+)["']?/);
    if (titleMatch) title = titleMatch[1].trim();

    // Extract tags
    const tagsMatch = content.match(/tags:\s*\[(.*?)\]/);
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];

    // Extract summary
    const summaryMatch = content.match(/## Summary\s*\n+([^#\n]+)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : 'No summary provided.';

    const dirCategory = path.dirname(relativePath) || 'general';

    const node = {
      id: title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      label: `[[${title}]]`,
      rawTitle: title,
      filePath: relativePath,
      dir: `Wiki / ${dirCategory}`,
      summary,
      tags,
      degree: 0,
      community: idx % 6
    };

    nodes.push(node);
    conceptMap.set(title.toLowerCase(), node.id);
  });

  // 2. Extract [[Wikilinks]] as Graph Edges
  mdFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    let sourceTitle = path.basename(filePath, '.md');
    const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/title:\s*["']?([^"'\n]+)["']?/);
    if (titleMatch) sourceTitle = titleMatch[1].trim();
    const sourceId = conceptMap.get(sourceTitle.toLowerCase());

    const wikilinkMatches = content.matchAll(/\[\[(.*?)\]\]/g);
    for (const match of wikilinkMatches) {
      const targetTitle = match[1].trim().toLowerCase();
      let targetId = conceptMap.get(targetTitle);

      if (!targetId) {
        // Uncompiled / needed concept node
        targetId = targetTitle.replace(/[^a-z0-9]/g, '-');
        nodes.push({
          id: targetId,
          label: `[[${match[1]}]]*`,
          rawTitle: match[1],
          filePath: 'uncompiled',
          dir: 'Wiki / Needed Concepts',
          summary: 'Concept mentioned but not yet compiled.',
          tags: ['uncompiled'],
          degree: 0,
          community: 5
        });
        conceptMap.set(targetTitle, targetId);
      }

      if (sourceId && targetId && sourceId !== targetId) {
        links.push({ source: sourceId, target: targetId });
      }
    }
  });

  // Update degrees
  links.forEach(l => {
    const srcNode = nodes.find(n => n.id === l.source);
    const tgtNode = nodes.find(n => n.id === l.target);
    if (srcNode) srcNode.degree++;
    if (tgtNode) tgtNode.degree++;
  });

  const graphData = { nodes, links };
  const graphJsonPath = path.join(wikiDir, 'wiki-graph.json');
  fs.writeFileSync(graphJsonPath, JSON.stringify(graphData, null, 2), 'utf-8');

  // Also copy to frontend dist if available
  const frontendDistPath = "C:\\Users\\Johnny Cage\\AppData\\Roaming\\npm\\node_modules\\@deepseek-ai\\dsh\\node_modules\\@deepseek-ai\\dsh-web-frontend\\dist\\wiki-graph.json";
  try {
    fs.writeFileSync(frontendDistPath, JSON.stringify(graphData, null, 2), 'utf-8');
  } catch {}

  // 3. Compile Master INDEX.md
  let indexMd = `# Karpathy LLM Wiki: Master Index\n\n`;
  indexMd += `> **Compiled at:** ${new Date().toISOString()} | **Total Concept Nodes:** ${nodes.length} | **Synaptic Links:** ${links.length}\n\n`;
  indexMd += `## Concept Catalog\n\n`;
  nodes.forEach(n => {
    indexMd += `- **${n.label}** (${n.dir})\n  ${n.summary}\n`;
  });

  fs.writeFileSync(path.join(wikiDir, 'INDEX.md'), indexMd, 'utf-8');
  console.log(`[LLM Wiki Compiler] Compiled ${nodes.length} nodes & ${links.length} links into wiki-graph.json & INDEX.md`);
}

compileWiki();
