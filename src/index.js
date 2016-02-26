import selectKeys from './selectKeys';
import mergeStoresStates from './mergeStoresStates';

export { selectKeys, mergeStoresStates };

/**
 * Store enhancer designed to replicate stores' states before/after reductions.
 *
 * @param {String|Function} storeKey
 * @param {Object|Array} replicator(s)
 * @param {Object} keys Optional
 * @return {Function}
 * @api public
 */
export default function replicate(storeKey, replicator, keys) {
  return next => (reducer, initialState, enhancer) => {
    const replicators = Array.isArray(replicator)
      ? replicator.map(Object.create)
      : [ Object.create(replicator) ];

    let nextState = null;
    const mergeNextState = (state, mocked) => {
      if (
        state && typeof state === 'object'
        && nextState && typeof nextState === 'object'
        && !Array.isArray(state)
        && !Array.isArray(nextState)
      ) {
        state = { ...state, ...nextState };
      } else {
        state = nextState;
      }

      if (!mocked) {
        nextState = next(reducer, state, enhancer).getState();
        return mergeNextState(state, true);
      }

      nextState = null;
      return state;
    };

    const replicatedReducer = (state, action) => {
      for (let replicator of replicators) {
        if (replicator.ready && replicator.preReduction) {
          replicator.preReduction(
            storeKey, selectKeys(keys, state), action
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
            storeKey, selectKeys(keys, state), action
          );
        }
      }

      return state;
    };

    const store = next(replicatedReducer, initialState, enhancer);
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

    store.setState = (state) => {
      nextState = state;
      store.replaceReducer(replicatedReducer);
    };

    initReplicators();

    return store;
  };
}
