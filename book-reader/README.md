# Book Reader Skill for OpenClaw

Read full-length books (epub, pdf, txt) with progress tracking.

## Quick Start

```bash
# Search for a book
./book-reader.sh search "Pride and Prejudice"

# Download from Project Gutenberg
./book-reader.sh download 1342

# Read 50 pages
./book-reader.sh read ~/.openclaw/workspace/books/pg1342.epub --pages 50

# Continue reading
./book-reader.sh read ~/.openclaw/workspace/books/pg1342.epub --pages 50

# Check progress
./book-reader.sh status
```

## Installation

```bash
# Install dependencies (choose one)
sudo apt-get install pandoc          # Debian/Ubuntu/Raspberry Pi OS
brew install pandoc                  # macOS

# Or use Python (alternative)
pip3 install ebooklib beautifulsoup4 lxml
```

## Book Sources

- **Project Gutenberg**: 70,000+ public domain books (legal, free)
- **Local files**: Your own epub/pdf collection
- **Anna's Archive**: For newer books (check local laws)

## Features

- ✅ Progress tracking (remember where you left off)
- ✅ Multiple formats (EPUB, PDF, TXT)
- ✅ Chunk reading (configurable page count)
- ✅ Search Project Gutenberg catalog
- ✅ Auto-download from Gutenberg
- ✅ Status reporting

## Use Cases

- **Daily reading project**: Read 1 book per day with AI insights
- **Research**: Extract knowledge from technical books
- **Learning**: Study classics and educational content
- **Summarization**: Read and summarize key insights

## Example: Daily Reading Bot

```bash
#!/bin/bash
# Read 50 pages every morning

BOOK="$HOME/.openclaw/workspace/books/thinking-fast-slow.epub"

if [ ! -f "$BOOK" ]; then
    echo "Download book first"
    exit 1
fi

book-reader.sh read "$BOOK" --pages 50
```

## Privacy & Ethics

- ✅ Public domain books (Gutenberg): Fully legal worldwide
- ⚠️  Copyrighted books: Check your jurisdiction's laws
- 💡 Consider buying books you find valuable to support authors
- 🚫 Don't redistribute downloaded content

## Limitations

- PDF quality depends on source OCR
- DRM-protected books not supported (by design)
- Very large PDFs may be slow
- EPUB→text conversion may lose some formatting

---

**Part of the OpenClaw skill ecosystem.**
