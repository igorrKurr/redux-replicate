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
    let store = null;
    const stores = {};
    const listeners = [];

    function callListeners () {
      listeners.slice().forEach(listener => listener());
    }

    function setStore () {
      if (!stores[storeKey]) {
        stores[storeKey] = next(reducer, initialState);
      }

      store = stores[storeKey];

      if (!store.setKey) {
        store.setKey = (key) => {
          if (key !== storeKey) {
            storeKey = key;
            setStore();
          }
        };
      }

      if (!store.setState) {
        store.setState = (state) => {
          if (state) {
            store.replaceReducer(current => ({ ...current, ...state }));
            store.replaceReducer(reducer);
            callListeners();
          }
        };
      }

      for (let replicator of replicators) {
        if (replicator.init) {
          replicator.init(storeKey, store);
        }
      }
    }

    setStore();

    return {
      dispatch(action) {
        for (let replicator of replicators) {
          if (replicator.preDispatch) {
            replicator.preDispatch(storeKey, store, action);
          }
        }

        store.dispatch(action);
        callListeners();

        for (let replicator of replicators) {
          if (replicator.postDispatch) {
            replicator.postDispatch(storeKey, store, action);
          }
        }

        return action;
      },

      setKey(key) {
        return store.setKey(key);
      },

      setState(state) {
        return store.setState(state);
      },

      getState() {
        return store.getState();
      },

      subscribe(listener) {
        let isSubscribed = true;
        listeners.push(listener);

        return function unsubscribe () {
          if (isSubscribed) {
            isSubscribed = false;
            listeners.splice(listeners.indexOf(listener), 1);
          }
        }
      },

      replaceReducer(nextReducer) {
        for (let key in stores) {
          stores[key].replaceReducer(nextReducer);
        }
      }
    };
  };
}
