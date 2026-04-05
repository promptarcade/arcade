// ============================================================
// JSON Schema Validator — lightweight, no dependencies
// ============================================================
// Validates objects against simple JSON schemas (type, required,
// properties, items, enum, minimum, maximum, minItems, minLength).

function validate(data, schema, path = '') {
  const errors = [];

  if (schema.type) {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (schema.type === 'integer') {
      if (typeof data !== 'number' || !Number.isInteger(data)) {
        errors.push(`${path || 'root'}: expected integer, got ${typeof data} (${data})`);
      }
    } else if (actualType !== schema.type) {
      errors.push(`${path || 'root'}: expected ${schema.type}, got ${actualType}`);
      return { valid: false, errors }; // type mismatch, skip deeper checks
    }
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path || 'root'}: value "${data}" not in enum [${schema.enum.join(', ')}]`);
  }

  if (schema.minimum !== undefined && typeof data === 'number' && data < schema.minimum) {
    errors.push(`${path || 'root'}: ${data} < minimum ${schema.minimum}`);
  }

  if (schema.maximum !== undefined && typeof data === 'number' && data > schema.maximum) {
    errors.push(`${path || 'root'}: ${data} > maximum ${schema.maximum}`);
  }

  if (schema.minLength !== undefined && typeof data === 'string' && data.length < schema.minLength) {
    errors.push(`${path || 'root'}: string length ${data.length} < minLength ${schema.minLength}`);
  }

  if (schema.minItems !== undefined && Array.isArray(data) && data.length < schema.minItems) {
    errors.push(`${path || 'root'}: array length ${data.length} < minItems ${schema.minItems}`);
  }

  if (schema.maxItems !== undefined && Array.isArray(data) && data.length > schema.maxItems) {
    errors.push(`${path || 'root'}: array length ${data.length} > maxItems ${schema.maxItems}`);
  }

  if (schema.required && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const key of schema.required) {
      if (data[key] === undefined || data[key] === null) {
        errors.push(`${path || 'root'}: missing required field "${key}"`);
      }
    }
  }

  if (schema.properties && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (data[key] !== undefined) {
        const sub = validate(data[key], propSchema, `${path}.${key}`);
        errors.push(...sub.errors);
      }
    }
  }

  if (schema.items && Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const sub = validate(data[i], schema.items, `${path}[${i}]`);
      errors.push(...sub.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validate };
