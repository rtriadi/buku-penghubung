const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Header, Footer } = require('docx');

const mdPath = path.join(__dirname, 'docs', 'buku-panduan.md');
const docxPath = path.join(__dirname, 'docs', 'buku-panduan.docx');

if (!fs.existsSync(mdPath)) {
  console.error(`Markdown file not found at ${mdPath}`);
  process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf8');
const lines = mdContent.split(/\r?\n/);

const docElements = [];

// Primary Colors
const COLOR_PRIMARY = "1E8449";    // Green
const COLOR_SECONDARY = "27AE60";  // Light Green
const COLOR_TEXT = "2C3E50";       // Charcoal Dark
const COLOR_MUTED = "7F8C8D";      // Muted Gray
const COLOR_WARNING = "C0392B";    // Soft Red
const COLOR_WARNING_BG = "FDEDEC"; // Very light red/pink for warnings
const COLOR_INFO_BG = "E8F8F5";    // Very light green for info/callouts
const COLOR_DIVIDER = "BDC3C7";

// Typography Font Family
const FONT_PRIMARY = "Segoe UI";

// ==========================================
// CREATE BEAUTIFUL COVER PAGE
// ==========================================

// Big spacing
docElements.push(new Paragraph({ spacing: { before: 1800 } }));

// Title
docElements.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "BUKU PANDUAN LENGKAP",
        font: FONT_PRIMARY,
        size: 52, // 26pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
    spacing: { after: 120 },
  })
);

// Subtitle
docElements.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "Aplikasi Buku Penghubung Online",
        font: FONT_PRIMARY,
        size: 32, // 16pt
        bold: true,
        color: COLOR_SECONDARY,
      }),
    ],
    spacing: { after: 240 },
  })
);

// Decorative Line
docElements.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "♦ ♦ ♦   PAUD ISLAM TERPADU DARUL KHAIRAT   ♦ ♦ ♦",
        font: FONT_PRIMARY,
        size: 20, // 10pt
        color: COLOR_MUTED,
        bold: true,
      }),
    ],
    spacing: { after: 3600 }, // Huge space before metadata
  })
);

// Metadata Block
docElements.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "Untuk Peran:\n",
        font: FONT_PRIMARY,
        size: 22,
        color: COLOR_TEXT,
        bold: true,
      }),
      new TextRun({
        text: "Administrator • Guru (Wali Kelas) • Orang Tua (Wali Murid) • Kepala Sekolah\n\n",
        font: FONT_PRIMARY,
        size: 22,
        color: COLOR_TEXT,
      }),
      new TextRun({
        text: "Tahun Ajaran 2026/2027 • Versi PWA & Autosave Aktif",
        font: FONT_PRIMARY,
        size: 20,
        italic: true,
        color: COLOR_MUTED,
      }),
    ],
    spacing: { after: 200 },
  })
);

// Page break to start manual content
docElements.push(new Paragraph({ children: [new PageBreak()] }));

// ==========================================
// PARSE MANIFEST CONTENT
// ==========================================

let inTableOfContents = false;

for (let line of lines) {
  const trimmed = line.trim();
  
  // Skip empty lines or top titles that we already made a cover for
  if (!trimmed || trimmed.startsWith('# Buku Panduan') || trimmed.startsWith('**PAUD Islam Terpadu')) {
    continue;
  }

  // Handle intro paragraph
  if (trimmed.startsWith('Selamat datang di Buku Panduan')) {
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            font: FONT_PRIMARY,
            size: 23, // 11.5pt
            color: COLOR_TEXT,
            italic: true,
          }),
        ],
        spacing: { before: 200, after: 300, line: 300 }, // 1.25x line spacing
      })
    );
    continue;
  }

  // Handle Daftar Isi block
  if (trimmed.startsWith('## 📌 DAFTAR ISI')) {
    inTableOfContents = true;
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "📌 DAFTAR ISI MANUAL",
            font: FONT_PRIMARY,
            size: 26, // 13pt
            bold: true,
            color: COLOR_PRIMARY,
          }),
        ],
        spacing: { before: 240, after: 120 },
      })
    );
    continue;
  }

  if (inTableOfContents) {
    if (trimmed === '---') {
      inTableOfContents = false;
      // Add a nice bottom border for table of contents
      docElements.push(
        new Paragraph({
          border: {
            bottom: { color: COLOR_DIVIDER, space: 8, style: "single", size: 6 }
          },
          spacing: { after: 300 }
        })
      );
      continue;
    }
    // Clean up markdown link syntax e.g. [Cara Mengakses](#1-...) -> Cara Mengakses
    let cleanText = trimmed.replace(/^\d+\.\s+\[(.*?)\]\(.*?\)/, '$1');
    if (cleanText === trimmed) {
      cleanText = trimmed.replace(/-\s+\[(.*?)\]\(.*?\)/, '$1');
    }
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "  •  " + cleanText,
            font: FONT_PRIMARY,
            size: 22,
            color: COLOR_TEXT,
          }),
        ],
        spacing: { before: 60, after: 60 },
      })
    );
    continue;
  }

  // Skip visual divider markers
  if (trimmed === '---') {
    docElements.push(
      new Paragraph({
        border: {
          bottom: { color: COLOR_DIVIDER, space: 12, style: "single", size: 6 }
        },
        spacing: { before: 240, after: 240 }
      })
    );
    continue;
  }

  // Heading 1 (## Sections)
  if (trimmed.startsWith('## ')) {
    const text = trimmed.slice(3).toUpperCase();
    docElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: text,
            font: FONT_PRIMARY,
            size: 28, // 14pt
            bold: true,
            color: COLOR_PRIMARY,
          }),
        ],
        border: {
          bottom: { color: COLOR_SECONDARY, space: 6, style: "single", size: 12 }
        },
        spacing: { before: 400, after: 180, line: 300 },
      })
    );
    continue;
  }

  // Heading 2 (### Subsections / Subheadings)
  if (trimmed.startsWith('### ')) {
    const text = trimmed.slice(4);
    
    // Check if it is a Warning/Troubleshooting heading
    const isWarning = text.includes('⚠️');
    
    docElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: text,
            font: FONT_PRIMARY,
            size: 24, // 12pt
            bold: true,
            color: isWarning ? COLOR_WARNING : COLOR_SECONDARY,
          }),
        ],
        spacing: { before: 280, after: 100, line: 280 },
      })
    );
    continue;
  }

  // Lists (Bullet Points)
  if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
    const contentText = trimmed.slice(2);
    
    // Check for bold prefixes e.g. * **Melihat Daftar Kelas**: Menampilkan...
    const children = [];
    const boldParts = contentText.split('**');
    
    for (let i = 0; i < boldParts.length; i++) {
      children.push(
        new TextRun({
          text: boldParts[i],
          font: FONT_PRIMARY,
          size: 22, // 11pt
          bold: i % 2 !== 0,
          color: COLOR_TEXT,
        })
      );
    }

    docElements.push(
      new Paragraph({
        children: children,
        bullet: {
          level: 0,
        },
        spacing: { before: 60, after: 60, line: 260 },
      })
    );
    continue;
  }

  // Numbered list items
  if (/^\d+\.\s+/.test(trimmed)) {
    const prefixMatch = trimmed.match(/^(\d+\.\s+)(.*)/);
    const numPrefix = prefixMatch[1];
    const contentText = prefixMatch[2];
    
    const children = [
      new TextRun({
        text: numPrefix,
        font: FONT_PRIMARY,
        size: 22,
        bold: true,
        color: COLOR_PRIMARY,
      })
    ];
    
    const boldParts = contentText.split('**');
    for (let i = 0; i < boldParts.length; i++) {
      children.push(
        new TextRun({
          text: boldParts[i],
          font: FONT_PRIMARY,
          size: 22,
          bold: i % 2 !== 0,
          color: COLOR_TEXT,
        })
      );
    }

    docElements.push(
      new Paragraph({
        children: children,
        spacing: { before: 80, after: 80, line: 260 },
        indent: { left: 360, hanging: 360 }, // Beautiful list hanging indent
      })
    );
    continue;
  }

  // Check if paragraph is warning/troubleshooting callout
  const isTroubleshootParagraph = trimmed.startsWith('Hubungi Administrator') || trimmed.startsWith('Jika saat mendaftarkan Wali Ortu') || trimmed.startsWith('⚠️');

  const children = [];
  const boldParts = trimmed.split('**');
  for (let i = 0; i < boldParts.length; i++) {
    // Process markdown link format in paragraphs e.g. [Manajemen Kelas](...)
    let text = boldParts[i];
    
    // Simple inline link cleaner
    text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Inline code tag cleaner
    text = text.replace(/`(.*?)`/g, '"$1"');

    children.push(
      new TextRun({
        text: text,
        font: FONT_PRIMARY,
        size: 22,
        bold: i % 2 !== 0,
        color: isTroubleshootParagraph ? COLOR_WARNING : COLOR_TEXT,
        italic: isTroubleshootParagraph,
      })
    );
  }

  if (isTroubleshootParagraph) {
    // Render as a beautiful callout box (styled alert block)
    docElements.push(
      new Paragraph({
        children: children,
        border: {
          left: { color: COLOR_WARNING, space: 16, style: "single", size: 24 } // Thick red left border
        },
        shading: {
          fill: COLOR_WARNING_BG, // Soft pink/red background
        },
        indent: { left: 240 },
        spacing: { before: 180, after: 180, line: 260 },
      })
    );
  } else {
    // Render as normal paragraph
    docElements.push(
      new Paragraph({
        children: children,
        spacing: { before: 120, after: 120, line: 276 },
      })
    );
  }
}

// ==========================================
// CREATE DOCUMENT PACKER
// ==========================================
const doc = new Document({
  features: {
    updateFields: true,
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            bottom: 1440, // 1 inch
            left: 1440,   // 1 inch
            right: 1440,  // 1 inch
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "PAUD IT Darul Khairat  |  Buku Penghubung Online",
                  font: FONT_PRIMARY,
                  size: 16, // 8pt
                  color: COLOR_MUTED,
                }),
              ],
              border: {
                bottom: { color: COLOR_DIVIDER, space: 4, style: "single", size: 4 }
              },
              spacing: { after: 180 }
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Halaman dokumen panduan operasional. Rahasia Internal Sekolah.",
                  font: FONT_PRIMARY,
                  size: 16,
                  color: COLOR_MUTED,
                })
              ],
              border: {
                top: { color: COLOR_DIVIDER, space: 4, style: "single", size: 4 }
              },
              spacing: { before: 180 }
            })
          ]
        })
      },
      children: docElements,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  try {
    fs.writeFileSync(docxPath, buffer);
    console.log(`Successfully compiled beautifully styled Word document at ${docxPath}`);
  } catch (writeErr) {
    if (writeErr.code === 'EBUSY') {
      const fallbackPath = path.join(__dirname, 'docs', 'buku-panduan-baru.docx');
      fs.writeFileSync(fallbackPath, buffer);
      console.warn(`\n⚠️  WARNING: File ${docxPath} is currently OPEN and locked by another application (like Word).`);
      console.warn(`   Successfully saved the new version to: ${fallbackPath}`);
      console.warn(`   Please close the open file to overwrite it directly next time.\n`);
    } else {
      throw writeErr;
    }
  }
}).catch((err) => {
  console.error('Error packaging docx:', err);
});
