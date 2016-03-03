/**
 * Extracts keys from some object.  See inline comments below for exact usage.
 *
 * @param {Object} keys
 * @param {Object} object
 * @param {Function} handler Optional
 * @param {Function} done Optional
 * @return {Function} pass the `stores` to this returned function
 * @api public
 */
const selectKeys = (keys, object, handler = () => {}, done = () => {}) => {
  let semaphore = 0;
  const clear = () => {
    if (--semaphore === 0) {
      done();
    }
  };

  if (!keys) {
    semaphore = Object.keys(object);

    if (semaphore) {
      for (let key in object) {
        if (typeof object[key] !== 'undefined') {
          handler(key, object[key], clear);
        } else {
          clear();
        }
      }
    } else {
      done();
    }

    return object;
  }

  const selected = {};
  const keysArray = Object.keys(keys);
  const firstKey = keysArray[0];

  if (!firstKey) {        // empty object implies no keys are extracted
    done();
    return selected;
  }

  if (keys[firstKey]) {   // when truthy, extract each key
    semaphore = keysArray.length;

    for (let key in keys) {
      if (typeof object[key] !== 'undefined') {
        selected[key] = object[key];
        handler(key, object[key], clear);
      } else {
        clear();
      }
    }
  } else {                // when falsy, extract other keys
    semaphore = Object.keys(object).length;

    for (let key in object) {
      if (typeof keys[key] === 'undefined') {
        selected[key] = object[key];
        handler(key, object[key], clear);
      } else {
        clear();
      }
    }
  }

  return selected;
};

export default selectKeys;
