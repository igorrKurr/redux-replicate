import selectKeys from './selectKeys';
import mergeStoresStates from './mergeStoresStates';

export { selectKeys, mergeStoresStates };

export const INIT_REPLICATORS = '@@redux-replicate/INIT_REPLICATORS';

/**
 * Store enhancer designed to replicate stores' states before/after reductions.
 *
 * @param {String|Function} storeKey
 * @param {Object|Array} replicator(s)
 * @return {Function}
 * @api public
 */
export default function replicate(storeKey, replicator) {
  return next => (reducer, initialState, enhancer) => {
    const create = r => (typeof r === 'function' ? r() : Object.create(r));
    const replicators = Array.isArray(replicator)
      ? replicator.map(create)
      : [ create(replicator) ];

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

    const createSelect = (state, action, setValue, done) => {
      /**
       * @param {Function|Object} selector Passed to replicator from app config
       * @param {Function} handler From replicator
       * @param {Function} callback From replicator
       */
      return (selector, handler, callback) => {
        const complete = () => {
          if (callback) {
            callback();
          }

          if (done) {
            done();
          }
        };

        if (typeof selector === 'function') {
          const selectedState = selector(storeKey, state, action);

          for (let key in selectedState) {
            handler(key, selectedState[key], setValue);
          }

          complete();
        } else {
          selectKeys(selector, state, (key, value, clear) => {
            handler(key, value, (key, value) => {
              if (setValue) {
                setValue(key, value);
              }

              clear();
            });
          }, complete);
        }
      };
    };

    const replicatedReducer = (state, action) => {
      let select = createSelect(state, action);
      const previousState = state;

      for (let replicator of replicators) {
        if (replicator.ready && replicator.preReduction) {
          replicator.preReduction(
            storeKey, select, state, action
          );
        }
      }

      if (nextState) {
        state = mergeNextState(state);
      }
      state = reducer(state, action);
      select = createSelect(state, action);

      for (let replicator of replicators) {
        if (replicator.ready && replicator.postReduction) {
          replicator.postReduction(
            storeKey, select, previousState, state, action
          );
        }
      }

      return state;
    };

    const store = next(replicatedReducer, initialState, enhancer);
    const dispatch = store.dispatch;
    const pendingActions = [];
    const readyCallbacks = [];
    const initReplicators = () => {
      const initState = {};
      const state = store.getState();
      const action = { type: INIT_REPLICATORS };

      let semaphore = replicators.length;
      const clear = () => {
        if (--semaphore === 0) {
          if (Object.keys(initState).length) {
            store.setState(initState);
          }

          while (readyCallbacks.length) {
            readyCallbacks.shift()();
          }
        }
      };

      for (let replicator of replicators) {
        replicator.ready = false;

        if (replicator.init) {
          replicator.init(
            storeKey,
            store,
            createSelect(
              state,
              action,
              (key, value) => {
                if (typeof value !== 'undefined') {
                  initState[key] = value;
                }
              },
              clear
            )
          );
        } else {
          clear();
        }
      }
    };

    if (!store.onReady) {
      store.onReady = callback => {
        readyCallbacks.push(callback);
      };
    }

    store.onReady(() => {
      for (let replicator of replicators) {
        replicator.ready = true;
      }

      store.dispatch = dispatch;
      while (pendingActions.length) {
        store.dispatch(pendingActions.shift());
      }
    });

    store.dispatch = (action) => {
      pendingActions.push(action);
      return action;
    };

    store.setState = (state) => {
      nextState = state;
      store.replaceReducer(replicatedReducer);
    };

    initReplicators();

    return store;
  };
}
