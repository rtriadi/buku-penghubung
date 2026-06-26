const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

const mdPath = path.join(__dirname, 'docs', 'buku-panduan.md');
const docxPath = path.join(__dirname, 'docs', 'buku-panduan.docx');

if (!fs.existsSync(mdPath)) {
  console.error(`Markdown file not found at ${mdPath}`);
  process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf8');
const lines = mdContent.split(/\r?\n/);

const docElements = [];

// Title / Header styling helper
function addHeading(text, headingLevel) {
  docElements.push(
    new Paragraph({
      text: text,
      heading: headingLevel,
      spacing: { before: 240, after: 120, line: 276 },
    })
  );
}

// Plain text paragraph
function addParagraph(text, isBold = false) {
  docElements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: text,
          bold: isBold,
          size: 24, // 12pt
        }),
      ],
      spacing: { before: 80, after: 80, line: 276 },
    })
  );
}

// Bullet point list item
function addBulletItem(text) {
  // Simple check for bold markers like **Wali Kelas**
  const children = [];
  const parts = text.split('**');
  
  for (let i = 0; i < parts.length; i++) {
    children.push(
      new TextRun({
        text: parts[i],
        bold: i % 2 !== 0,
        size: 24,
      })
    );
  }

  docElements.push(
    new Paragraph({
      children: children,
      bullet: {
        level: 0,
      },
      spacing: { before: 40, after: 40, line: 276 },
    })
  );
}

// Parse markdown lines
for (let line of lines) {
  line = line.trim();
  
  if (!line) {
    continue;
  }
  
  if (line.startsWith('# ')) {
    addHeading(line.slice(2), HeadingLevel.TITLE);
  } else if (line.startsWith('## ')) {
    addHeading(line.slice(3), HeadingLevel.HEADING_1);
  } else if (line.startsWith('### ')) {
    addHeading(line.slice(4), HeadingLevel.HEADING_2);
  } else if (line.startsWith('* ') || line.startsWith('- ')) {
    addBulletItem(line.slice(2));
  } else if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. ') || line.startsWith('6. ')) {
    // Numbered list item
    docElements.push(
      new Paragraph({
        text: line,
        spacing: { before: 40, after: 40, line: 276 },
      })
    );
  } else if (line === '---') {
    // Divider line
    docElements.push(
      new Paragraph({
        text: '__________________________________________________________________',
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
      })
    );
  } else {
    // Regular text (handle potential inline bold markers)
    const children = [];
    const parts = line.split('**');
    
    for (let i = 0; i < parts.length; i++) {
      children.push(
        new TextRun({
          text: parts[i],
          bold: i % 2 !== 0,
          size: 24,
        })
      );
    }
    
    docElements.push(
      new Paragraph({
        children: children,
        spacing: { before: 80, after: 80, line: 276 },
      })
    );
  }
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: docElements,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(docxPath, buffer);
  console.log(`Successfully compiled Word document at ${docxPath}`);
}).catch((err) => {
  console.error('Error packaging docx:', err);
});
