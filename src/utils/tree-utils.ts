// Tree utility functions for building hierarchical structures

export interface TreeNode {
  id: string | number;
  parent_id: string | number | null;
  children?: TreeNode[];
  [key: string]: unknown;
}

/**
 * Builds a tree structure from a flat array of nodes
 * @param nodes - Flat array of nodes with id and parent_id
 * @returns Array of root nodes with nested children
 */
export function buildTree<T extends TreeNode>(nodes: T[]): T[] {
  const nodeMap = new Map<string | number, T & { children: T[] }>();
  const roots: T[] = [];

  // First pass: create map of all nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Lấy tất cả các id từ nodes
  const existingIds = new Set(nodes.map(node => node.id));

  // tạo tree structure
  nodes.forEach(node => {
    const nodeWithChildren = nodeMap.get(node.id)!;
    
    if (node.parent_id === null || !existingIds.has(node.parent_id)) {
      // id cao nhất
      roots.push(nodeWithChildren);
    } else {
      // Child node
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(nodeWithChildren);
      }
    }
  });

  return roots;
}
