export const defaultGetKey = (key, reducerKey) => (`${key}/${reducerKey}`);

/**
 * Creates a Redux store enhancer designed to replicate actions and states.
 *
 * @param {Mixed} key
 * @param {Boolean|Array|Object} reducerKeys Optional
 * @param {Object|Array} replicator(s)
 * @param {Object} clientState Optional
 * @return {Function}
 * @api public
 */
export default function replicate(key, reducerKeys, replicator, clientState) {
  if (arguments.length === 2) {
    replicator = reducerKeys;
    reducerKeys = false;
  }

  if (!Array.isArray(replicator)) {
    replicator = [ replicator ];
  }

  return next => (reducer, initialState, enhancer) => {
    let store = null;
    let nextState = null;
    const replicators = replicator.map(Object.create);
    const readyCallbacks = [];

    function getInitialState() {
      let initialState = reducerKeys ? {} : null;
      let setInitialState = false;
      let semaphore = replicators.length;

      function clear() {
        if (--semaphore === 0) {
          if (setInitialState) {
            store.setState(initialState);
          }

          while (readyCallbacks.length) {
            readyCallbacks.shift()(key, store);
          }
        }
      }

      if (reducerKeys) {
        let initialReducerKeys = reducerKeys;

        if (reducerKeys === true) {
          reducerKeys = Object.keys(store.getState());
          initialReducerKeys = reducerKeys;
        }

        // here we want the client to get only the undefined initial states
        if (clientState) {
          initialReducerKeys = [];

          if (Array.isArray(reducerKeys)) {
            for (let reducerKey of reducerKeys) {
              if (typeof clientState[reducerKey] === 'undefined') {
                initialReducerKeys.push(reducerKey);
              }
            }
          } else {
            // if reducerKeys is an object, truthy values indicate keys that
            // can be overridden by the client
            for (let reducerKey in reducerKeys) {
              if (
                reducerKeys[reducerKey]
                && typeof clientState[reducerKey] === 'undefined'
              ) {
                initialReducerKeys.push(reducerKey);
              }
            }

            reducerKeys = Object.keys(reducerKeys);
          }
        }

        semaphore = semaphore * initialReducerKeys.length;

        if (semaphore) {
          for (let replicator of replicators) {
            let { getKey = defaultGetKey } = replicator;

            if (replicator.getInitialState) {
              for (let reducerKey of initialReducerKeys) {
                replicator.getInitialState(getKey(key, reducerKey), state => {
                  if (typeof state !== 'undefined') {
                    initialState[reducerKey] = state;
                    setInitialState = true;
                  }

                  clear();
                });
              }
            } else {
              for (let reducerKey of initialReducerKeys) {
                clear();
              }
            }
          }
        } else {
          semaphore = 1;
          clear();
        }
      } else {
        for (let replicator of replicators) {
          if (replicator.getInitialState) {
            replicator.getInitialState(key, state => {
              if (typeof state !== 'undefined') {
                initialState = state;
                setInitialState = true;
              }

              clear();
            });
          } else {
            clear();
          }
        }
      }
    }

    function mergeNextState(state, mocked = store.initializedReplication) {
      if (reducerKeys) {
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
    }

    function replicatedReducer(state, action) {
      const actualNextState = nextState
        ? reducer(mergeNextState(state), action)
        : reducer(state, action);

      if (store && store.initializedReplication) {
        for (let replicator of replicators) {
          let { getKey = defaultGetKey } = replicator;

          if (replicator.onStateChange) {
            if (reducerKeys) {
              for (let reducerKey of reducerKeys) {
                if (state[reducerKey] !== actualNextState[reducerKey]) {
                  replicator.onStateChange(
                    getKey(key, reducerKey),
                    state[reducerKey],
                    actualNextState[reducerKey],
                    action
                  );
                }
              }
            } else if (state !== actualNextState) {
              replicator.onStateChange(
                key, state, actualNextState, action
              );
            }
          }

          if (replicator.postReduction) {
            replicator.postReduction(
              key, state, actualNextState, action
            );
          }
        }
      }

      return actualNextState;
    }

    store = next(replicatedReducer, initialState, enhancer);
    store.initializedReplication = false;

    store.onReady = readyCallback => {
      readyCallbacks.push(readyCallback);
    };

    for (let replicator of replicators) {
      if (replicator.onReady) {
        store.onReady(replicator.onReady);
      }
    }

    store.onReady(() => {
      store.initializedReplication = true;
    });

    store.setState = state => {
      nextState = state;
      store.replaceReducer(replicatedReducer);
    };

    getInitialState();

    return store;
  };
}
