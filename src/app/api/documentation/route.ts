import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface DocumentationFile {
  name: string;
  displayName: string;
  path: string;
  type: 'markdown' | 'pdf' | 'other';
  size: number;
  lastModified: Date;
}

// Mapping tên file với tên hiển thị (có thể mở rộng sau)
const DISPLAY_NAME_MAP: Record<string, string> = {
  'CAIDAT.md': 'Tài liệu hướng dẫn cài đặt',
  'N01_G02_TLCaidat.md': 'Tài liệu hướng dẫn cài đặt',

};

// Hàm format tên file thành tên hiển thị đẹp
function formatDisplayName(fileName: string): string {
  // Kiểm tra mapping trước
  if (DISPLAY_NAME_MAP[fileName]) {
    return DISPLAY_NAME_MAP[fileName];
  }

  // Bỏ extension
  let displayName = fileName;
  const lastDotIndex = displayName.lastIndexOf('.');
  if (lastDotIndex > 0) {
    displayName = displayName.substring(0, lastDotIndex);
  }

  // Thay thế các ký tự đặc biệt
  displayName = displayName
    .replace(/[_\-]/g, ' ') // Thay underscore và dash bằng space
    .replace(/([A-Z])/g, ' $1') // Thêm space trước chữ hoa
    .trim()
    .replace(/\s+/g, ' '); // Chuẩn hóa khoảng trắng

  // Title case
  displayName = displayName
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      // Giữ nguyên các từ viết tắt (toàn chữ hoa)
      if (word === word.toUpperCase() && word.length <= 5) {
        return word;
      }
      // Title case cho từ thường
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return displayName || fileName;
}

export async function GET() {
  try {
    const docsDir = join(process.cwd(), 'public', 'documentation');
    
    // Kiểm tra thư mục có tồn tại không
    try {
      await stat(docsDir);
    } catch {
      // Thư mục không tồn tại, trả về mảng rỗng
      return NextResponse.json([]);
    }
    
    // Đọc danh sách files trong thư mục documentation
    const files = await readdir(docsDir, { withFileTypes: true });
    
    const documents: DocumentationFile[] = [];
    
    for (const file of files) {
      // Bỏ qua hidden files và README
      if (file.name.startsWith('.') || file.name.toLowerCase() === 'readme.md') {
        continue;
      }
      
      if (file.isFile()) {
        try {
          const filePath = join(docsDir, file.name);
          const fileStat = await stat(filePath);
          
          // Xác định loại file
          let type: 'markdown' | 'pdf' | 'other' = 'other';
          const lowerName = file.name.toLowerCase();
          if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
            type = 'markdown';
          } else if (lowerName.endsWith('.pdf')) {
            type = 'pdf';
          }
          
          // Chỉ thêm markdown và PDF files
          if (type !== 'other') {
            documents.push({
              name: file.name,
              displayName: formatDisplayName(file.name),
              path: `/documentation/${file.name}`,
              type,
              size: fileStat.size,
              lastModified: fileStat.mtime,
            });
          }
        } catch (err) {
          // Bỏ qua file nếu không đọc được
          console.warn(`Failed to read file ${file.name}:`, err);
        }
      }
    }
    
    // Sắp xếp theo tên
    documents.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error reading documentation directory:', error);
    return NextResponse.json(
      { error: 'Failed to read documentation files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

