import selectKeys from './selectKeys';
import mergeStoresStates from './mergeStoresStates';

export { selectKeys, mergeStoresStates };

/**
 * Store enhancer designed to replicate stores' states before/after reductions.
 *
 * @param {Mixed} storeKey
 * @param {Object|Array} replicatorCreator(s)
 * @return {Function}
 * @api public
 */
export default function replicate (storeKey, replicatorCreators) {
  if (!Array.isArray(replicatorCreators)) {
    replicatorCreators = [ replicatorCreators ];
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
        nextState = next(reducer, state, true).getState();
        return mergeNextState(state, true);
      }

      nextState = null;
      return state;
    };

    const replicators = replicatorCreators.map(replicator => replicator());
    const replicatedReducer = (state, action) => {
      for (let replicator of replicators) {
        if (replicator.ready && replicator.preReduction) {
          replicator.preReduction(
            storeKey, selectKeys(replicator.keys, state), action
          );
        }
      }

      if (nextState) {
        state = mergeNextState(state);
      }
      state = reducer(state, action);

      for (let replicator of replicators) {
        if (replicator.ready && replicator.postReduction) {
          replicator.postReduction(
            storeKey, selectKeys(replicator.keys, state), action
          );
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
