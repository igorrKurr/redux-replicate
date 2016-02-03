import selectKeys from './selectKeys';

/**
 * Small utility to help with easily merging the states of multiple stores into
 * a single object.
 *
 * @param {Object} keys
 * @return {Function} pass the `stores` to this returned function
 * @api public
 */
const mergeStoresStates = keys => stores => {
  const merged = {};

  for (let name in stores) {
    Object.assign(merged, selectKeys(keys, stores[name].getState()));
  }

  return merged;
};

export default mergeStoresStates;
