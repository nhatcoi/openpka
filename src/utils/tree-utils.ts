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

/**
 * Flattens a tree structure back to a flat array
 * @param tree - Tree structure with nested children
 * @returns Flat array of all nodes
 */
export function flattenTree<T extends TreeNode>(tree: T[]): T[] {
  const result: T[] = [];
  
  function traverse(nodes: T[]) {
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children as T[]);
      }
    });
  }
  
  traverse(tree);
  return result;
}

/**
 * Finds a node by ID in a tree structure
 * @param tree - Tree structure to search in
 * @param id - ID to search for
 * @returns Found node or null
 */
export function findNodeById<T extends TreeNode>(tree: T[], id: number): T | null {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children as T[], id);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Gets all leaf nodes (nodes without children) from a tree
 * @param tree - Tree structure
 * @returns Array of leaf nodes
 */
export function getLeafNodes<T extends TreeNode>(tree: T[]): T[] {
  const leaves: T[] = [];
  
  function traverse(nodes: T[]) {
    nodes.forEach(node => {
      if (!node.children || node.children.length === 0) {
        leaves.push(node);
      } else {
        traverse(node.children as T[]);
      }
    });
  }
  
  traverse(tree);
  return leaves;
}

/**
 * Calculates the depth of a node in the tree
 * @param tree - Tree structure
 * @param nodeId - ID of the node
 * @returns Depth level (0 for root nodes)
 */
export function getNodeDepth<T extends TreeNode>(tree: T[], nodeId: number): number {
  function findDepth(nodes: T[], targetId: number, currentDepth: number = 0): number {
    for (const node of nodes) {
      if (node.id === targetId) {
        return currentDepth;
      }
      
      if (node.children && node.children.length > 0) {
        const depth = findDepth(node.children as T[], targetId, currentDepth + 1);
        if (depth !== -1) {
          return depth;
        }
      }
    }
    return -1;
  }
  
  return findDepth(tree, nodeId);
}

/**
 * Gets all nodes at a specific depth level
 * @param tree - Tree structure
 * @param targetDepth - Target depth level
 * @returns Array of nodes at the specified depth
 */
export function getNodesAtDepth<T extends TreeNode>(tree: T[], targetDepth: number): T[] {
  const nodes: T[] = [];
  
  function traverse(nodes: T[], currentDepth: number) {
    if (currentDepth === targetDepth) {
      nodes.push(...nodes);
      return;
    }
    
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        traverse(node.children as T[], currentDepth + 1);
      }
    });
  }
  
  traverse(tree, 0);
  return nodes;
}
