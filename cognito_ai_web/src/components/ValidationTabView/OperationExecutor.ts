// import { AppliedOperation, Column, ColumnSourceConfig, ConcatPart, TRANSFORMATION_OPERATIONS } from '../types/deriveColumn';
// import { format, parse } from 'date-fns';

// const polarToDateFnsMap: Record<string, string> = {
//   '%Y': 'yyyy', '%y': 'yy', '%m': 'MM', '%b': 'MMM', '%B': 'MMMM',
//   '%d': 'dd', '%H': 'HH', '%I': 'hh', '%p': 'a', '%M': 'mm', '%S': 'ss',
//   '%f': 'SSS', '%z': 'xx', '%Z': 'zzz', '%j': 'DDD', '%a': 'EEE',
//   '%A': 'EEEE', '%w': 'i', '%U': 'ww', '%W': 'II', '%%': '%'
// };

// function convertPolarFormatToDateFns(polarFormat: string | undefined): string {
//   if (!polarFormat) return '';
//   const regex = new RegExp(Object.keys(polarToDateFnsMap).join('|'), 'g');
//   return polarFormat.replace(regex, (match) => polarToDateFnsMap[match]);
// }

// export const applyOperation = (op: AppliedOperation, value: any, rowIndex: number, availableColumns: Column[]) => { 
//   try {
//     const opDef = TRANSFORMATION_OPERATIONS.find(o => o.name === op.operation_name);
//     if (!opDef) throw new Error(`Operation "${op.operation_name}" not found.`);

//     const getParamValue = (paramValue: any) => {
//       if (paramValue && typeof paramValue === 'object' && paramValue.source_mode) {
//         const config = paramValue as ColumnSourceConfig;
//         const col = availableColumns.find(c => c.id === config.column_id);
//         if (!col) return '';
//         let colValue = String(col.sampleData[rowIndex] ?? '');
//         if (config.source_mode === 'substring') {
//           colValue = colValue.slice(config.start, config.end);
//         }
//         return `${config.prefix || ''}${colValue}${config.suffix || ''}`;
//       }
//       return paramValue;
//     };

//     const args = opDef.parameters.map(p => getParamValue(op.parameters[p.name]));

//     switch (op.operation_name) {
//       case 'reverse':
//         return { result: String(value).split('').reverse().join('') };
      
//       case 'to_titlecase':
//         return { result: String(value).replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) };
      
//       case 'to_str':
//         return { result: String(value) };
      
//       case 'to_int': {
//         const intResult = parseInt(String(value), 10);
//         return { result: isNaN(intResult) ? null : intResult };
//       }
      
//       case 'to_float': {
//         const floatResult = parseFloat(String(value));
//         return { result: isNaN(floatResult) ? null : floatResult };
//       }

//       case 'trim': {
//         const [strip] = args;
//         let result = String(value);
//         if (strip && strip !== '') {
//           const stripChar = String(strip);
//           result = result.replace(new RegExp(`^[${stripChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+|[${stripChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+$`, 'g'), '');
//         } else {
//           result = result.trim();
//         }
//         return { result };
//       }

//       case 'trimStart': {
//         const [strip] = args;
//         let result = String(value);
//         if (strip && strip !== '') {
//           const stripChar = String(strip);
//           result = result.replace(new RegExp(`^[${stripChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+`, 'g'), '');
//         } else {
//           result = result.trimStart();
//         }
//         return { result };
//       }

//       case 'trimEnd': {
//         const [strip] = args;
//         let result = String(value);
//         if (strip && strip !== '') {
//           const stripChar = String(strip);
//           result = result.replace(new RegExp(`[${stripChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+$`, 'g'), '');
//         } else {
//           result = result.trimEnd();
//         }
//         return { result };
//       }

//       case 'replace': { 
//         const isRegex = op.parameters.is_regex;
//         const searchValue = getParamValue(op.parameters.search_value);
//         const replaceValue = getParamValue(op.parameters.replace_value);
        
//         if (!searchValue) return { error: 'Search value is required' };
        
//         let result = String(value);
//         if (isRegex) { 
//           try { 
//             const regex = new RegExp(searchValue);
//             result = result.replace(regex, replaceValue || '');
//           } catch (e) {
//             return { error: `Invalid regex pattern: ${searchValue}` };
//           }
//         } else {
//           result = result.replace(searchValue, replaceValue || '');
//         }
//         return { result };
//       }

//     case 'replaceAll': {  
//       const isRegex = op.parameters.is_regex;
//       const searchValue = getParamValue(op.parameters.search_value);
//       const replaceValue = getParamValue(op.parameters.replace_value);
      
//       if (!searchValue) return { error: 'Search value is required' };
      
//       let result = String(value);
//       if (isRegex) {
//         try { 
//           const regex = new RegExp(searchValue, 'g');
//           result = result.replace(regex, replaceValue || '');
//         } catch (e) {
//           return { error: `Invalid regex pattern: ${searchValue}` };
//         }
//       } else {  
//         result = result.split(searchValue).join(replaceValue || '');
//       }
//       return { result };
//     }

//       case 'split': { 
//         const isRegex = op.parameters.is_regex;
//         const separator = getParamValue(op.parameters.separator);
//         const index = getParamValue(op.parameters.limit);
        
//         let parts: string[];
//         if (isRegex && separator) { 
//           try {
//             const regex = new RegExp(separator);
//             parts = String(value).split(regex);
//           } catch (e) {
//             return { error: `Invalid regex pattern: ${separator}` };
//           }
//         } else {
//           parts = String(value).split(separator || '');
//         }
        
//         if (index !== undefined && index !== null) { 
//           if (index < 0 || index >= parts.length) {
//             return { error: `Index ${index} is out of bounds for split array (length: ${parts.length}).` };
//           }
//           return { result: parts[index] };
//         }
        
//         return { result: parts };
//       }

//       case 'containsAny': { 
//         const isRegex = op.parameters.is_regex;
//         const values = getParamValue(op.parameters.values);
        
//         if (!values) return { result: false, error: "No values provided to search for." };
        
//         const searchValues = String(values).split(',').map(s => s.trim()).filter(Boolean);
//         if (searchValues.length === 0) return { result: false, error: "No valid values provided to search for." };
        
//         const stringValue = String(value);
        
//         if (isRegex) { 
//           try { 
//             return { 
//               result: searchValues.some(pattern => { 
//                 const regex = new RegExp(pattern);
//                 return regex.test(stringValue);
//               })
//             };
//           } catch (e) {
//             return { error: `Invalid regex pattern in values: ${values}` };
//           }
//         } else {
//           return { result: searchValues.some(term => stringValue.includes(term)) };
//         }
//       }

//       case 'abs': {
//         const numValue = parseFloat(String(value));
//         return { result: isNaN(numValue) ? null : Math.abs(numValue) };
//       }

//       case 'round': {
//         const [decimals] = args;
//         const numValue = parseFloat(String(value));
//         if (isNaN(numValue)) return { result: null };
//         const decimalPlaces = decimals !== undefined ? Number(decimals) : 0;
//         return { result: Number(numValue.toFixed(decimalPlaces)) };
//       }

//       case 'floor': {
//         const numValue = parseFloat(String(value));
//         return { result: isNaN(numValue) ? null : Math.floor(numValue) };
//       }

//       case 'ceil': {
//         const numValue = parseFloat(String(value));
//         return { result: isNaN(numValue) ? null : Math.ceil(numValue) };
//       }

//       case 'clip': {
//         const [minValue, maxValue] = args;
//         const numValue = parseFloat(String(value));
//         if (isNaN(numValue)) return { result: null };
        
//         let result = numValue;
//         if (minValue !== undefined && minValue !== null) result = Math.max(result, Number(minValue));
//         if (maxValue !== undefined && maxValue !== null) result = Math.min(result, Number(maxValue));
//         return { result };
//       }

//       case 'fill_null': {
//         const fillValue = getParamValue(op.parameters.fill_value);
//         if (value === null || value === undefined || value === '') {
//           return { result: fillValue || '' };
//         }
//         return { result: value };
//       }

//       case 'substring': {
//         const [start, end] = args;
//         if (start === undefined) return { error: 'Start index is required for substring operation.' };
//         return { result: String(value).substring(Number(start), end !== undefined ? Number(end) : undefined) };
//       }

//       case 'padStart': {
//         const [targetLength, padString] = args;
//         if (targetLength === undefined) return { error: 'Target length is required for padStart operation.' };
//         return { result: String(value).padStart(Number(targetLength), padString || ' ') };
//       }

//       case 'padEnd': {
//         const [targetLength, padString] = args;
//         if (targetLength === undefined) return { error: 'Target length is required for padEnd operation.' };
//         return { result: String(value).padEnd(Number(targetLength), padString || ' ') };
//       }

//       case 'to_date':
//       case 'to_datetime':
//       case 'to_time': {
//         const [inputFormat] = args;
//         const dateFnsInputFormat = convertPolarFormatToDateFns(inputFormat);
//         let date;
//         try {
//           if (dateFnsInputFormat && typeof dateFnsInputFormat === 'string') {
//             date = parse(String(value), dateFnsInputFormat, new Date());
//           } else {
//             date = new Date(value);
//           }
//           if (isNaN(date.getTime())) {
//             throw new Error('Invalid date');
//           }
//         } catch (e) {
//           return { error: `Could not parse date: "${value}" with format "${inputFormat}"` };
//         }
//         if (op.operation_name === 'to_date') return { result: format(date, 'yyyy-MM-dd') };
//         if (op.operation_name === 'to_datetime') return { result: date.toISOString() };
//         if (op.operation_name === 'to_time') return { result: format(date, 'HH:mm:ss') };
//         break;
//       }

//       case 'strftime': {
//         const [outputFormat] = args;
//         const date = new Date(value);
//         if (isNaN(date.getTime())) {
//           return { error: `Invalid date input: "${value}"` };
//         }
//         if (!outputFormat) return { error: 'Output format string is required.' };
//         const dateFnsOutputFormat = convertPolarFormatToDateFns(outputFormat);
//         try {
//           return { result: format(date, dateFnsOutputFormat) };
//         } catch (e) {
//           return { error: `Invalid output format: "${outputFormat}"` };
//         }
//       }

//       case 'concat': {
//         const sources: ConcatPart[] = op.parameters.sources || [];
//         const stringsToJoin = sources.map(part => {
//           if (part.type === 'column' && part.column_config) {
//             return getParamValue(part.column_config);
//           }
//           return part.value || '';
//         });
//         return { result: String(value).concat(...stringsToJoin) };
//       }

//       default: {
//         if (typeof String.prototype[op.operation_name] === 'function') {
//           // @ts-ignore
//           return { result: String(value)[op.operation_name](...args) };
//         }
//         return { error: `Operation "${op.operation_name}" is not a standard method and has no custom implementation.` };
//       }
//     }
//     return { error: 'Unhandled operation' };
//   } catch (error: any) {
//     return { error: error.message };
//   }
// };

import { AppliedOperation, Column, ConcatPart, TRANSFORMATION_OPERATIONS } from './types/deriveColumn';
import { format, parse } from 'date-fns';
const polarToDateFnsMap: Record<string, string> = {
  '%Y': 'yyyy', '%y': 'yy', '%m': 'MM', '%b': 'MMM', '%B': 'MMMM',
  '%d': 'dd', '%H': 'HH', '%I': 'hh', '%p': 'a', '%M': 'mm', '%S': 'ss',
  '%f': 'SSS', '%z': 'xx', '%Z': 'zzz', '%j': 'DDD', '%a': 'EEE',
  '%A': 'EEEE', '%w': 'i', '%U': 'ww', '%W': 'II', '%%': '%'
};

function convertPolarFormatToDateFns(polarFormat: string | undefined): string {
  if (!polarFormat) return '';
  const regex = new RegExp(Object.keys(polarToDateFnsMap).join('|'), 'g');
  return polarFormat.replace(regex, (match) => polarToDateFnsMap[match]);
}

const formatNumberResult = (num: any): number | null => {
    if (typeof num !== 'number' || isNaN(num)) return num;
    if (num % 1 !== 0) { // It's a float
        return parseFloat(num.toFixed(2));
    }
    return num; // It's an integer
};

export const applyOperation = (op: AppliedOperation, value: any, rowIndex: number, availableColumns: Column[]) => { 
  try {
    const opDef = TRANSFORMATION_OPERATIONS.find(o => o.name === op.operation_name);
    if (!opDef) throw new Error(`Operation "${op.operation_name}" not found.`);

    const getParamValue = (paramValue: any) => {
      if (paramValue && typeof paramValue === 'object' && paramValue.source_mode) {
        const config = paramValue;
        const col = availableColumns.find(c => c.id === config.column_id);
        if (!col) return '';
        let colValue = String(col.sampleData[rowIndex] ?? '');
        if (config.source_mode === 'substring') {
          colValue = colValue.slice(config.start, config.end);
        }
        return `${config.prefix || ''}${colValue}${config.suffix || ''}`;
      }
      return paramValue;
    };

    const args = opDef.parameters.map(p => getParamValue(op.parameters[p.name]));

    // Handle aggregation operations
    if (opDef.category === 'aggregation' && Array.isArray(value)) {
        const numericValues = value.map(Number).filter(n => !isNaN(n));
        switch(op.operation_name) {
            case 'sum':
                return { result: formatNumberResult(numericValues.reduce((acc, curr) => acc + curr, 0)) };
            case 'count':
                return { result: value.length };
            case 'max':
                return { result: formatNumberResult(numericValues.length > 0 ? Math.max(...numericValues) : null) };
            case 'min':
                return { result: formatNumberResult(numericValues.length > 0 ? Math.min(...numericValues) : null) };
            case 'line_item_match':
                // Line item match counts matching values between left and right arrays
                // This will be used to compare aggregated left and right values
                return { result: value.length };
        }
    }

    // Handle non-aggregation operations
    const stringValue = String(value);

    switch (op.operation_name) {
      case 'reverse':
        return { result: stringValue.split('').reverse().join('') };
      
      case 'to_titlecase':
        return { result: stringValue.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) };
      
      case 'to_str':
        return { result: stringValue };
      
      case 'to_int': {
        const intResult = parseInt(stringValue, 10);
        return { result: isNaN(intResult) ? null : intResult };
      }
      
      case 'to_float': {
        const floatResult = parseFloat(stringValue);
        return { result: formatNumberResult(floatResult) };
      }

      case 'trim': {
        const [strip] = args;
        let result = stringValue;
        if (strip && strip !== '') {
          const stripChar = String(strip);
          result = result.replace(new RegExp(`^[${stripChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+|[${stripChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+$`, 'g'), '');
        } else {
          result = result.trim();
        }
        return { result };
      }

      case 'trimStart': {
        const [strip] = args;
        let result = stringValue;
        if (strip && strip !== '') {
          const stripChar = String(strip);
          result = result.replace(new RegExp(`^[${stripChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+`, 'g'), '');
        } else {
          result = result.trimStart();
        }
        return { result };
      }

      case 'trimEnd': {
        const [strip] = args;
        let result = stringValue;
        if (strip && strip !== '') {
          const stripChar = String(strip);
          result = result.replace(new RegExp(`[${stripChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+$`, 'g'), '');
        } else {
          result = result.trimEnd();
        }
        return { result };
      }

      case 'replace': { 
        const isRegex = op.parameters.is_regex;
        const searchValue = getParamValue(op.parameters.search_value);
        const replaceValue = getParamValue(op.parameters.replace_value);
        
        if (!searchValue) return { error: 'Search value is required' };
        
        let result = stringValue;
        if (isRegex) { 
          try { 
            const regex = new RegExp(searchValue);
            result = result.replace(regex, replaceValue || '');
          } catch (e) {
            return { error: `Invalid regex pattern: ${searchValue}` };
          }
        } else {
          result = result.replace(searchValue, replaceValue || '');
        }
        return { result };
      }

    case 'replaceAll': {  
      const isRegex = op.parameters.is_regex;
      const searchValue = getParamValue(op.parameters.search_value);
      const replaceValue = getParamValue(op.parameters.replace_value);
      
      if (!searchValue) return { error: 'Search value is required' };
      
      let result = stringValue;
      if (isRegex) {
        try { 
          const regex = new RegExp(searchValue, 'g');
          result = result.replace(regex, replaceValue || '');
        } catch (e) {
          return { error: `Invalid regex pattern: ${searchValue}` };
        }
      } else {  
        result = result.split(searchValue).join(replaceValue || '');
      }
      return { result };
    }

      case 'split': { 
        const isRegex = op.parameters.is_regex;
        const separator = getParamValue(op.parameters.separator);
        const index = getParamValue(op.parameters.limit);
        
        let parts: string[];
        if (isRegex && separator) { 
          try {
            const regex = new RegExp(separator);
            parts = stringValue.split(regex);
          } catch (e) {
            return { error: `Invalid regex pattern: ${separator}` };
          }
        } else {
          parts = stringValue.split(separator || '');
        }
        
        if (index !== undefined && index !== null) { 
          if (index < 0 || index >= parts.length) {
            return { error: `Index ${index} is out of bounds for split array (length: ${parts.length}).` };
          }
          return { result: parts[index] };
        }
        
        return { result: parts };
      }

      case 'containsAny': { 
        const isRegex = op.parameters.is_regex;
        const values = getParamValue(op.parameters.values);
        
        if (!values) return { result: false, error: "No values provided to search for." };
        
        const searchValues = String(values).split(',').map(s => s.trim()).filter(Boolean);
        if (searchValues.length === 0) return { result: false, error: "No valid values provided to search for." };
        
        if (isRegex) { 
          try { 
            return { 
              result: searchValues.some(pattern => { 
                const regex = new RegExp(pattern);
                return regex.test(stringValue);
              })
            };
          } catch (e) {
            return { error: `Invalid regex pattern in values: ${values}` };
          }
        } else {
          return { result: searchValues.some(term => stringValue.includes(term)) };
        }
      }

      case 'abs': {
        const numValue = parseFloat(stringValue);
        return { result: formatNumberResult(isNaN(numValue) ? null : Math.abs(numValue)) };
      }

      case 'round': {
        const [decimals] = args;
        const numValue = parseFloat(stringValue);
        if (isNaN(numValue)) return { result: null };
        const decimalPlaces = decimals !== undefined ? Number(decimals) : 0;
        return { result: Number(numValue.toFixed(decimalPlaces)) };
      }

      case 'floor': {
        const numValue = parseFloat(stringValue);
        return { result: isNaN(numValue) ? null : Math.floor(numValue) };
      }

      case 'ceil': {
        const numValue = parseFloat(stringValue);
        return { result: isNaN(numValue) ? null : Math.ceil(numValue) };
      }

      case 'clip': {
        const [minValue, maxValue] = args;
        const numValue = parseFloat(stringValue);
        if (isNaN(numValue)) return { result: null };
        
        let result = numValue;
        if (minValue !== undefined && minValue !== null) result = Math.max(result, Number(minValue));
        if (maxValue !== undefined && maxValue !== null) result = Math.min(result, Number(maxValue));
        return { result: formatNumberResult(result) };
      }

      case 'fill_null': {
        const fillValue = getParamValue(op.parameters.fill_value);
        if (value === null || value === undefined || value === '') {
          return { result: fillValue || '' };
        }
        return { result: value };
      }

      case 'substring': {
        const [start, end] = args;
        if (start === undefined) return { error: 'Start index is required for substring operation.' };
        return { result: stringValue.substring(Number(start), end !== undefined ? Number(end) : undefined) };
      }

      case 'padStart': {
        const [targetLength, padString] = args;
        if (targetLength === undefined) return { error: 'Target length is required for padStart operation.' };
        return { result: stringValue.padStart(Number(targetLength), padString || ' ') };
      }

      case 'padEnd': {
        const [targetLength, padString] = args;
        if (targetLength === undefined) return { error: 'Target length is required for padEnd operation.' };
        return { result: stringValue.padEnd(Number(targetLength), padString || ' ') };
      }

      case 'to_date':
      case 'to_datetime':
      case 'to_time': {
        const [inputFormat] = args;
        const dateFnsInputFormat = convertPolarFormatToDateFns(inputFormat);
        let date;
        try {
          if (dateFnsInputFormat && typeof dateFnsInputFormat === 'string') {
            date = parse(stringValue, dateFnsInputFormat, new Date());
          } else {
            date = new Date(value);
          }
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (e) {
          return { error: `Could not parse date: "${value}" with format "${inputFormat}"` };
        }
        if (op.operation_name === 'to_date') return { result: format(date, 'yyyy-MM-dd') };
        if (op.operation_name === 'to_datetime') return { result: date.toISOString() };
        if (op.operation_name === 'to_time') return { result: format(date, 'HH:mm:ss') };
        break;
      }

      case 'strftime': {
        const [outputFormat] = args;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { error: `Invalid date input: "${value}"` };
        }
        if (!outputFormat) return { error: 'Output format string is required.' };
        const dateFnsOutputFormat = convertPolarFormatToDateFns(outputFormat);
        try {
          return { result: format(date, dateFnsOutputFormat) };
        } catch (e) {
          return { error: `Invalid output format: "${outputFormat}"` };
        }
      }

      case 'concat': {
        const sources: ConcatPart[] = op.parameters.sources || [];
        const stringsToJoin = sources.map(part => {
          if (part.type === 'column' && part.column_config) {
            return getParamValue(part.column_config);
          }
          return part.value || '';
        });
        return { result: stringValue.concat(...stringsToJoin) };
      }

      default: {
        if (typeof String.prototype[op.operation_name as keyof String] === 'function') {
          // @ts-ignore
          return { result: stringValue[op.operation_name](...args) };
        }
        return { error: `Operation "${op.operation_name}" is not a standard method and has no custom implementation.` };
      }
    }
    return { error: 'Unhandled operation' };
  } catch (error: any) {
    return { error: error.message };
  }
};
