import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

export interface DocumentationFile {
  name: string;
  displayName: string;
  path: string;
  section?: string;
  type: 'markdown' | 'pdf' | 'other';
  size: number;
  lastModified: Date;
}

export interface DocumentationSection {
  name: string;
  displayName: string;
  path: string;
  files: DocumentationFile[];
}

const DISPLAY_NAME_MAP: Record<string, string> = {
  'installation.md': 'Cài đặt hệ thống',
  'task-assignment.md': 'Phân công công việc',
  'finalSRS.pdf': 'Tài liệu yêu cầu phần mềm (SRS)',
  'overview.md': 'Tổng quan kiến trúc',
  'terminology.md': 'Thuật ngữ & Ký hiệu chính',
  'syllabus-api-spec.md': 'Syllabus API Specification',
  'syllabus-business-rules.md': 'Quy tắc nghiệp vụ Syllabus',
  'syllabus-use-cases.md': 'Use Cases Syllabus',
  'syllabus-detailed-spec.md': 'Syllabus Detailed Spec',
};

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  'getting-started': 'Getting Started',
  'architecture': 'Architecture',
  'api': 'API',
  'modules': 'Modules',
  'use-cases': 'Use Cases',
  'business-rules': 'Business Rules',
  'database': 'Database',
  'devops': 'DevOps',
  'ui-ux': 'UI/UX',
};

function formatDisplayName(fileName: string): string {
  if (DISPLAY_NAME_MAP[fileName]) {
    return DISPLAY_NAME_MAP[fileName];
  }

  let displayName = fileName;
  const lastDotIndex = displayName.lastIndexOf('.');
  if (lastDotIndex > 0) {
    displayName = displayName.substring(0, lastDotIndex);
  }

  displayName = displayName
    .replace(/[_\-]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\s+/g, ' ');

  displayName = displayName
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      if (word === word.toUpperCase() && word.length <= 5) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return displayName || fileName;
}

async function scanDirectory(
  dirPath: string,
  baseDir: string,
  section?: string,
  includeRootReadme: boolean = false
): Promise<DocumentationFile[]> {
    const documents: DocumentationFile[] = [];
  const entries = await readdir(dirPath, { withFileTypes: true });
    
  for (const entry of entries) {
    const isRootReadme = entry.name.toLowerCase() === 'readme.md' && !section && dirPath === baseDir;
    if (entry.name.startsWith('.') || (entry.name.toLowerCase() === 'readme.md' && !includeRootReadme && !isRootReadme)) {
        continue;
      }
      
    const fullPath = join(dirPath, entry.name);
    const relativePath = relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const subSection = entry.name;
      const subDocs = await scanDirectory(fullPath, baseDir, subSection, false);
      documents.push(...subDocs);
    } else if (entry.isFile()) {
      try {
        const fileStat = await stat(fullPath);
          let type: 'markdown' | 'pdf' | 'other' = 'other';
        const lowerName = entry.name.toLowerCase();

          if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
            type = 'markdown';
          } else if (lowerName.endsWith('.pdf')) {
            type = 'pdf';
          }
          
          if (type !== 'other') {
          const sectionName = section || 'root';
            documents.push({
            name: entry.name,
            displayName: formatDisplayName(entry.name),
            path: `/documentation/${relativePath.replace(/\\/g, '/')}`,
            section: sectionName === 'root' ? undefined : sectionName,
              type,
              size: fileStat.size,
              lastModified: fileStat.mtime,
            });
          }
        } catch (err) {
        // Silently skip files that can't be read
      }
    }
  }

  return documents;
}

export async function GET(request: Request) {
  try {
    const docsDir = join(process.cwd(), 'public', 'documentation');
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    try {
      await stat(docsDir);
    } catch {
      return NextResponse.json({ sections: [], files: [] });
    }

    const allDocuments = await scanDirectory(docsDir, docsDir, undefined, true);
    const filteredDocuments = section
      ? allDocuments.filter((doc) => doc.section === section)
      : allDocuments;
    
    // Get root README.md
    let rootReadme: DocumentationFile | null = null;
    if (!section) {
      try {
        const readmePath = join(docsDir, 'README.md');
        const readmeStat = await stat(readmePath);
        rootReadme = {
          name: 'README.md',
          displayName: 'Tổng quan',
          path: '/documentation/README.md',
          section: undefined,
          type: 'markdown',
          size: readmeStat.size,
          lastModified: readmeStat.mtime,
        };
      } catch {
        // README.md doesn't exist, ignore
      }
    }
    
    const sectionsMap = new Map<string, DocumentationFile[]>();
    for (const doc of allDocuments) {
      const sectionName = doc.section || 'root';
      if (!sectionsMap.has(sectionName)) {
        sectionsMap.set(sectionName, []);
      }
      sectionsMap.get(sectionName)!.push(doc);
    }

    const sections: DocumentationSection[] = Array.from(sectionsMap.entries())
      .filter(([name]) => name !== 'root')
      .map(([name, files]) => ({
        name,
        displayName: SECTION_DISPLAY_NAMES[name] || formatDisplayName(name),
        path: `/documentation/${name}`,
        files: files.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const rootFiles = (sectionsMap.get('root') || []).filter(
      (file) => file.name.toLowerCase() !== 'readme.md'
    );

    return NextResponse.json({
      sections,
      files: section
        ? filteredDocuments.sort((a, b) => a.name.localeCompare(b.name))
        : rootFiles.sort((a, b) => a.name.localeCompare(b.name)),
      rootReadme: rootReadme,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to read documentation files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

