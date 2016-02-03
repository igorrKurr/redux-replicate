/**
 * Extracts keys from some object.  See inline comments below for exact usage.
 *
 * @param {Object} keys
 * @param {Object} obj
 * @return {Function} pass the `stores` to this returned function
 * @api public
 */
const selectKeys = (keys, obj) => {
  if (!keys) {
    return obj;
  }

  const selected = {};
  const keysArray = Object.keys(keys);
  const firstKey = keysArray[0];

  if (!firstKey) {
    // empty object implies no keys are extracted
    return selected;
  }

  if (keys[firstKey]) {
    // when truthy, extract each key
    for (let key in keys) {
      if (typeof obj[key] !== 'undefined') {
        selected[key] = obj[key];
      }
    }
  } else {
    // when falsy, extract other keys
    for (let key in obj) {
      if (typeof keys[key] === 'undefined') {
        selected[key] = obj[key];
      }
    }
  }

  return selected;
};

export default selectKeys;
