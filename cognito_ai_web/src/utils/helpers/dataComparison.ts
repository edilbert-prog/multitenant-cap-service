/**
 * Compares two objects to see if they have any differences.
 * This performs a shallow comparison, trimming string values before checking for equality.
 * @param original The original object.
 * @param current The current (potentially modified) object.
 * @returns {boolean} `true` if there are differences, `false` otherwise.
 */
export const hasChanges = (original: Record<string, any>, current: Record<string, any>): boolean => {
    // If the objects are strictly equal, no changes.
    if (original === current) {
        return false;
    }

    // Get keys from both objects to compare
    const originalKeys = Object.keys(original);
    const currentKeys = Object.keys(current);

    // If number of keys is different, there are changes.
    if (originalKeys.length !== currentKeys.length) {
        return true;
    }

    // Check if all keys in original object exist and have the same trimmed string value in the current object.
    return originalKeys.some(key => !current.hasOwnProperty(key) || String(original[key]).trim() !== String(current[key]).trim());
};