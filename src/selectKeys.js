/**
 * Extracts keys from some object.  See inline comments below for exact usage.
 *
 * @param {Object} keys
 * @param {Object} object
 * @param {Function} handler Optional
 * @return {Function} pass the `stores` to this returned function
 * @api public
 */
const selectKeys = (keys, object, handler = () => {}) => {
  if (!keys) {
    for (let key in object) {
      if (typeof object[key] !== 'undefined') {
        handler(key, object[key]);
      }
    }

    return object;
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
      if (typeof object[key] !== 'undefined') {
        selected[key] = object[key];
        handler(key, object[key]);
      }
    }
  } else {
    // when falsy, extract other keys
    for (let key in object) {
      if (typeof keys[key] === 'undefined') {
        selected[key] = object[key];
        handler(key, object[key]);
      }
    }
  }

  return selected;
};

export default selectKeys;
