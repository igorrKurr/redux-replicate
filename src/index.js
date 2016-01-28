export mergeStoresStates from './mergeStoresStates';

/**
 * Store enhancer designed to replicate stores' states before/after reductions.
 *
 * @param {String} storeKey
 * @param {Object|Array} replicator(s)
 * @return {Function}
 * @api public
 */
export default function replicate (storeKey, replicators) {
  if (!Array.isArray(replicators)) {
    replicators = [ replicators ];
  }

  return next => (reducer, initialState) => {
    let nextState = null;
    let replaceState = false;
    const mergeNextState = (state, mocked) => {
      if (
        !replaceState
        && state && typeof state === 'object'
        && nextState && typeof nextState === 'object'
        && !Array.isArray(state)
        && !Array.isArray(nextState)
      ) {
        state = { ...state, ...nextState };
      } else {
        state = nextState;
      }

      replaceState = false;

      if (!mocked) {
        nextState = next(reducer, state).getState();
        return mergeNextState(state, true);
      }

      nextState = null;
      return state;
    };

    const replicatedReducer = (state, action) => {
      for (let replicator of replicators) {
        if (replicator.ready && replicator.preReduction) {
          replicator.preReduction(storeKey, state, action);
        }
      }

      if (nextState) {
        state = mergeNextState(state);
      }
      state = reducer(state, action);

      for (let replicator of replicators) {
        if (replicator.ready && replicator.postReduction) {
          replicator.postReduction(storeKey, state, action);
        }
      }

      return state;
    };

    const store = next(replicatedReducer, initialState);
    const initReplicators = () => {
      for (let replicator of replicators) {
        if (replicator.init) {
          replicator.ready = false;
          replicator.init(storeKey, store, ready => replicator.ready = ready);
        } else {
          replicator.ready = true;
        }
      }
    };

    store.setKey = (key) => {
      if (key !== storeKey) {
        storeKey = key;
        replaceState = true;
        initReplicators();
      }
    };

    store.setState = (state) => {
      nextState = state;
      store.replaceReducer(replicatedReducer);
    };

    initReplicators();

    return store;
  };
}
