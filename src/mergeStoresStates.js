/**
 * Small utility to help with easily merging the states of multiple stores into
 * a single object.  See comments in the code below for exact usage.
 *
 * @param {Object} keys
 * @return {Function} pass the `stores` to this returned function
 * @api public
 */
const mergeStoresStates = keys => stores => {
  const merged = {};

  if (!keys) {
    // merge everything
    for (let name in stores) {
      Object.assign(merged, stores[name].getState());
    }

    return merged;
  }

  const keysArray = Object.keys(keys);
  const firstKey = keysArray[0];

  if (!firstKey) {
    // empty object implies no keys are replicated
    return merged;
  }

  if (keys[firstKey]) {
    // when truthy, replicate only each key
    for (let name in stores) {
      let state = stores[name].getState();

      for (let key in keys) {
        if (typeof state[key] !== 'undefined') {
          merged[key] = state[key];
        }
      }
    }
  } else {
    // when falsy, replicate only other keys
    for (let name in stores) {
      let state = stores[name].getState();

      for (let key in state) {
        if (typeof keys[key] === 'undefined') {
          merged[key] = state[key];
        }
      }
    }
  }

  return merged;
};

export default mergeStoresStates;
