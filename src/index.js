/**
 * Store enhancer designed to replicate stores before/after `dispatch`.
 *
 * @param {String} storeKey
 * @param {Object|Array} replicator(s)
 * @return {Function}
 * @api public
 */
export default function replicate (storeKey, ...replicators) {
  return next => (reducer, initialState) => {
    const store = next(reducer, initialState);
    const initReplicators = () => {
      for (let replicator of replicators) {
        if (replicator.init) {
          replicator.init(storeKey, store);
        }
      }
    };

    if (!store.setState) {
      store.setState = (state) => {
        if (state) {
          store.replaceReducer(current => ({ ...current, ...state }));
          store.replaceReducer(reducer);
        }
      };
    }

    if (!store.setKey) {
      store.setKey = (key) => {
        if (key !== storeKey) {
          storeKey = key;
          initReplicators();
        }
      };
    }

    initReplicators();

    return {
      ...store,

      dispatch(action) {
        for (let replicator of replicators) {
          if (replicator.preDispatch) {
            replicator.preDispatch(storeKey, store, action);
          }
        }

        store.dispatch(action);

        for (let replicator of replicators) {
          if (replicator.postDispatch) {
            replicator.postDispatch(storeKey, store, action);
          }
        }

        return action;
      }
    };
  };
}
