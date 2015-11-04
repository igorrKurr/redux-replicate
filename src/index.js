export default function replicate (storeName, ...replicators) {
  return next => (reducer, initialState) => {
    const store = next(reducer, initialState);

    if (!store.setState) {
      store.setState = (state) => {
        if (state) {
          store.replaceReducer(current => ({ ...current, ...state }));
          store.replaceReducer(reducer);
        }
      };
    }

    for (let replicator of replicators) {
      if (replicator.init) {
        replicator.init(storeName, store);
      }
    }

    return {
      ...store,

      dispatch(action) {
        for (let replicator of replicators) {
          if (replicator.preDispatch) {
            replicator.preDispatch(storeName, store, action);
          }
        }

        store.dispatch(action);
        
        for (let replicator of replicators) {
          if (replicator.postDispatch) {
            replicator.postDispatch(storeName, store, action);
          }
        }

        return action;
      }
    };
  };
}

