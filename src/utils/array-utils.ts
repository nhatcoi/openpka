// Array utility functions

/**
 * Removes duplicates from an array
 * @param array - Array to remove duplicates from
 * @returns Array with unique values
 */
export function removeDuplicates<T>(array: T[]): T[] {
    return [...new Set(array)];
}

/**
 * Removes duplicates from an array based on a key
 * @param array - Array of objects
 * @param key - Key to check for duplicates
 * @returns Array with unique objects based on key
 */
export function removeDuplicatesByKey<T extends Record<string,
    never

>>(
    array: T[],
    key: keyof T
): T[] {
    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

/**
 * Groups array items by a key
 * @param array - Array of objects
 * @param key - Key to group by
 * @returns Object with grouped items
 */
export function groupBy<T extends Record<string, never>>(
    array: T[],
    key: keyof T
): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const group = String(item[key]);
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {} as Record<string, T[]>);
}

/**
 * Sorts array by a key
 * @param array - Array of objects
 * @param key - Key to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortBy<T extends Record<string, never>>(
    array: T[],
    key: keyof T,
    direction: 'asc' | 'desc' = 'asc'
): T[] {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Filters array by multiple conditions
 * @param array - Array to filter
 * @param filters - Object with filter conditions
 * @returns Filtered array
 */
export function filterBy<T extends Record<string, never>>(
    array: T[],
    filters: Partial<T>
): T[] {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (value === undefined || value === null || value === '') return true;

            const itemValue = item[key];
            if (typeof value === 'string' && typeof itemValue === 'string') {
                return itemValue.toLowerCase().includes(value.toLowerCase());
            }

            return itemValue === value;
        });
    });
}

/**
 * Chunks array into smaller arrays
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Gets random items from array
 * @param array - Array to sample from
 * @param count - Number of items to get
 * @returns Array of random items
 */
export function sample<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Gets unique values from array based on a function
 * @param array - Array to process
 * @param keyFn - Function to extract key for uniqueness
 * @returns Array with unique items
 */
export function uniqueBy<T>(array: T[], keyFn: (item: T) => never): T[] {
    const seen = new Set();
    return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * Merges multiple arrays and removes duplicates
 * @param arrays - Arrays to merge
 * @returns Merged array with unique values
 */
export function mergeUnique<T>(...arrays: T[][]): T[] {
    const merged = arrays.flat();
    return removeDuplicates(merged);
}

/**
 * Finds intersection of multiple arrays
 * @param arrays - Arrays to find intersection
 * @returns Array with common elements
 */
export function intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0];

    return arrays.reduce((acc, curr) => {
        return acc.filter(item => curr.includes(item));
    });
}

/**
 * Finds difference between arrays (elements in first array but not in others)
 * @param arrays - Arrays to find difference
 * @returns Array with elements only in first array
 */
export function difference<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0];

    const firstArray = arrays[0];
    const otherArrays = arrays.slice(1);

    return firstArray.filter(item =>
        !otherArrays.some(array => array.includes(item))
    );
}

/**
 * Partitions array into two arrays based on condition
 * @param array - Array to partition
 * @param predicate - Function to test each element
 * @returns Tuple with [true elements, false elements]
 */
export function partition<T>(
    array: T[],
    predicate: (item: T) => boolean
): [T[], T[]] {
    const trueItems: T[] = [];
    const falseItems: T[] = [];

    array.forEach(item => {
        if (predicate(item)) {
            trueItems.push(item);
        } else {
            falseItems.push(item);
        }
    });

    return [trueItems, falseItems];
}

/**
 * Calculates sum of numeric array
 * @param array - Array of numbers
 * @returns Sum of all numbers
 */
export function sum(array: number[]): number {
    return array.reduce((acc, curr) => acc + curr, 0);
}

/**
 * Calculates average of numeric array
 * @param array - Array of numbers
 * @returns Average of all numbers
 */
export function average(array: number[]): number {
    if (array.length === 0) return 0;
    return sum(array) / array.length;
}

/**
 * Gets minimum value from array
 * @param array - Array of numbers
 * @returns Minimum value
 */
export function min(array: number[]): number {
    return Math.min(...array);
}

/**
 * Gets maximum value from array
 * @param array - Array of numbers
 * @returns Maximum value
 */
export function max(array: number[]): number {
    return Math.max(...array);
}
