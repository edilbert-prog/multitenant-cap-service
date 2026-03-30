/**
 * Convert user-defined filter rules into SAP RFC WHERE clause strings
 * @param {Array} filters - list of filter objects like:
 *   [{ field: 'VKORG', operator: 'equals', value: '1000' }]
 * @returns {Array<string>} - e.g. ["VKORG = '1000'", "ERDAT BETWEEN '20240101' AND '20241231'"]
 */
export function buildWhereClauses(filters: Array<{ field: string; operator: string; value: string }> = []): string[] {
  const clauses: string[] = [];

  filters.forEach((f) => {
    const field = f.field;
    const op = f.operator?.toLowerCase();
    const value = f.value;
    let clause = '';

    switch (op) {
      case 'equals':
      case '=':
        clause = `${field} = '${value}'`;
        break;

      case 'not equals':
      case '!=':
      case '<>':
        clause = `${field} <> '${value}'`;
        break;

      case 'contains':
        clause = `${field} LIKE '%${value}%'`;
        break;

      case 'starts with':
        clause = `${field} LIKE '${value}%'`;
        break;

      case 'ends with':
        clause = `${field} LIKE '%${value}'`;
        break;

      case 'in':
        if (Array.isArray(value)) {
          const items = value.map((v) => `'${v}'`).join(', ');
          clause = `${field} IN (${items})`;
        } else if (typeof value === 'string') {
          // Handle comma-separated string
          const items = value
            .split(',')
            .map((v) => `'${v.trim()}'`)
            .join(', ');
          clause = `${field} IN (${items})`;
        }
        break;

      case 'not in':
        if (Array.isArray(value)) {
          const items = value.map((v) => `'${v}'`).join(', ');
          clause = `${field} NOT IN (${items})`;
        } else if (typeof value === 'string') {
          const items = value
            .split(',')
            .map((v) => `'${v.trim()}'`)
            .join(', ');
          clause = `${field} NOT IN (${items})`;
        }
        break;

      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          clause = `${field} BETWEEN '${value[0]}' AND '${value[1]}'`;
        }
        break;

      case 'greater than':
      case '>':
        clause = `${field} > '${value}'`;
        break;

      case 'less than':
      case '<':
        clause = `${field} < '${value}'`;
        break;

      case 'greater than or equal':
      case 'greater than or equal to':
      case '>=':
        clause = `${field} >= '${value}'`;
        break;

      case 'less than or equal':
      case 'less than or equal to':
      case '<=':
        clause = `${field} <= '${value}'`;
        break;

      case 'is null':
      case 'null':
        clause = `${field} IS NULL`;
        break;

      case 'is not null':
      case 'not null':
        clause = `${field} IS NOT NULL`;
        break;

      default:
        console.warn(`Unsupported operator: ${op}`);
    }

    if (clause) clauses.push(clause);
  });

  return clauses;
}

/**
 * Build a single WHERE clause string from multiple filter rules
 * @param filters - Array of filter rules
 * @param operator - Logical operator to join clauses (AND/OR), defaults to AND
 * @returns Single WHERE clause string
 */
export function buildWhereClauseString(
  filters: Array<{ field: string; operator: string; value: string }> = [],
  operator: 'AND' | 'OR' = 'AND',
): string {
  const clauses = buildWhereClauses(filters);
  return clauses.join(` ${operator} `);
}
