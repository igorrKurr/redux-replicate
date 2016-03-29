import expect from 'expect';
import { createStore, combineReducers, compose } from 'redux';
import replicate from '../src/index';

describe('redux-replicate', () => {
  const SET_WOW = 'SET_WOW';
  const SET_VERY = 'SET_VERY';
  const SET_AWESOME = 'SET_AWESOME';

  const actions = {
    setWow(value) {
      return { type: SET_WOW, value };
    },

    setVery(value) {
      return { type: SET_VERY, value };
    },

    setAwesome(value) {
      return { type: SET_AWESOME, value };
    }
  };

  const reducers = {
    wow(state = '', action) {
      switch (action.type) {
        case SET_WOW:
          return action.value;

        default:
          return state;
      }
    },

    very(state = '', action) {
      switch (action.type) {
        case SET_VERY:
          return action.value;

        default:
          return state;
      }
    },

    awesome(state = '', action) {
      switch (action.type) {
        case SET_AWESOME:
          return action.value;

        default:
          return state;
      }
    }
  };

  const initialState = {
    wow: 'such replication',
    very: 'useful',
    awesome: 'ness'
  };

  const customInitialState = {
    wow: 'such custom initialization'
  };

  const databaseState = {
    'test/wow': 'such database',
    'test/very': 'intuitive async initialization',
    'test/awesome': 'sauce'
  };

  let lastAction = null;
  let onStateChangeCalls = 0;
  let postReductionCalls = 0;
  let customInitializationCalls = 0;
  let readyCallbackCalls = 0;

  const replicator = {
    getInitialState(key, setState) {
      setTimeout(() => {
        setState(databaseState[key]);
      }, 500);
    },

    onStateChange(key, state, nextState, action) {
      databaseState[key] = nextState;
      onStateChangeCalls++;
    },

    postReduction(key, state, nextState, action) {
      lastAction = action;
      postReductionCalls++;
    }
  };

  const customInitialization = next => (reducer, initialState, enhancer) => {
    const store = next(reducer, initialState, enhancer);

    customInitializationCalls++;
    store.dispatch(actions.setWow(customInitialState.wow));

    return store;
  };

  const readyCallback = () => (readyCallbackCalls++);

  const replication = replicate('test', ['wow', 'very'], replicator);
  const create = compose(replication, customInitialization)(createStore);
  const store = create(combineReducers(reducers), initialState);

  it('should initialize the store as usual, including custom initialization via some enhancer', () => {
    const state = store.getState();
    expect(typeof state).toBe('object');
    expect(state.wow).toBe(customInitialState.wow);
    expect(state.very).toBe(initialState.very);
    expect(state.awesome).toBe(initialState.awesome);
  });

  it('should add onReady method to store', () => {
    store.onReady(readyCallback);
  });

  it('should add setState method to store, which merges next state if reducer keys are specified', () => {
    store.setState({ wow: 'wow', very: 'very' });

    const state = store.getState();
    expect(typeof state).toBe('object');
    expect(state.wow).toBe(customInitialState.wow);
    expect(state.very).toBe('very');
    expect(state.awesome).toBe(initialState.awesome);
  });

  it('should not call postReduction/onStateChange until replicator has initialized', () => {
    const wow = 'such replication (not yet replicated)';
    const very = 'easy right? (not yet replicated)';
    let state = null;

    store.dispatch(actions.setWow(wow));
    store.dispatch(actions.setVery(very));

    state = store.getState();
    expect(typeof state).toBe('object');
    expect(state.wow).toBe(wow);
    expect(state.very).toBe(very);
    expect(onStateChangeCalls).toBe(0);
    expect(postReductionCalls).toBe(0);

    store.setState(initialState);
    state = store.getState();
    expect(typeof state).toBe('object');
    expect(state.wow).toBe(customInitialState.wow);
    expect(state.very).toBe(initialState.very);
    expect(state.awesome).toBe(initialState.awesome);
    expect(onStateChangeCalls).toBe(0);
    expect(postReductionCalls).toBe(0);
  });

  it('should not be ready yet', () => {
    expect(store.initializedReplication).toBe(false);
    expect(readyCallbackCalls).toBe(0);
  });

  it('should mock store initialization until replication initialized', () => {
    // happens whenever store is initialized or setState is called, so 3 so far
    expect(customInitializationCalls).toBe(3);
  });

  it('should have reinitialized via async data source after 500ms', done => {
    setTimeout(() => {
      const state = store.getState();

      expect(typeof state).toBe('object');
      expect(state.wow).toBe(customInitialState.wow);
      expect(state.very).toBe(databaseState['test/very']);
      expect(onStateChangeCalls).toBe(0);
      expect(postReductionCalls).toBe(0);

      done();
    }, 520);
  });

  it('should have reinitialized only the specified reducer keys', done => {
    setTimeout(() => {
      const state = store.getState();

      expect(state.awesome).toBe(initialState.awesome);

      done();
    }, 520);
  });

  it('should be ready now', done => {
    setTimeout(() => {
      expect(store.initializedReplication).toBe(true);
      expect(readyCallbackCalls).toBe(1);

      done();
    }, 520);
  });

  it('should call postReduction upon every action', done => {
    setTimeout(() => {
      const wow = 'such replication';
      const very = 'easy right?';
      let action = null;

      action = actions.setWow(wow);
      store.dispatch(action);
      expect(lastAction).toBe(action);
      expect(postReductionCalls).toBe(1);

      action = actions.setVery(very);
      store.dispatch(action);
      expect(lastAction).toBe(action);
      expect(postReductionCalls).toBe(2);

      done();
    }, 520);
  });

  it('should call onStateChange only when state has changed', done => {
    setTimeout(() => {
      const wow = 'such replication';
      const very = 'easy amirite?!?!?!';

      // from previous test: setWow, setVery = 2 calls so far
      store.dispatch(actions.setWow(wow));
      expect(onStateChangeCalls).toBe(2);   // wow was unchanged

      store.dispatch(actions.setVery(very));
      expect(onStateChangeCalls).toBe(3);

      expect(databaseState['test/wow']).toBe(wow);
      expect(databaseState['test/very']).toBe(very);

      done();
    }, 520);
  });

  it('should not call onStateChange for unspecified reducer keys', done => {
    setTimeout(() => {
      const awesome = 'jawesome';

      store.dispatch(actions.setAwesome(awesome));
      expect(onStateChangeCalls).toBe(3);   // still 3

      done();
    }, 520);
  });

  it('should call postReduction once per reduction but onStateChange once per changed reducer key', done => {
    setTimeout(() => {
      store.setState({
        wow: 'zers',
        awesome: '!!!!!!!!!!!!!'
      });

      // setWow, setVery, setWow, setVery, setAwesome, setState = 6
      expect(postReductionCalls).toBe(6);

      // changed wow, 1
      // changed very, 2
      // did not change wow
      // changed very, 3
      // changed awesome but not replicated
      // changed wow, 4
      // changed awesome but not replicated
      expect(onStateChangeCalls).toBe(4);

      done();
    }, 520);
  });

  it('should have only run custom enhancer one more time', done => {
    setTimeout(() => {
      expect(customInitializationCalls).toBe(4);

      done();
    }, 520);
  });
});
