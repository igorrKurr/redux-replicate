import expect from 'expect';
import { createStore, combineReducers, compose } from 'redux';
import replicate from '../src/index';

describe('redux-replicate', () => {
  it('should replicate', (done) => {
    const SET_WOW = 'SET_WOW';
    const SET_VERY = 'SET_VERY';

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
      }
    };

    const initialState = {
      wow: 'such storage',
      very: 'cool'
    };
    let index = 0;
    const wows = [
      initialState.wow,   // 0: creating store, preReduction
      initialState.wow,   // 1: creating store, postReduction
      initialState.wow,   // 2: first `expect` verification
      initialState.wow,   // 3: `init` called after 100ms, preReduction
      initialState.wow,   // 4: `init` called after 100ms, postReduction
      initialState.wow,   // 5: second `expect` verification after 200ms
      initialState.wow,   // 6: dispatch `SET_WOW`, preReduction
      'such test',        // 7: dispatch `SET_WOW`, postReduction
      'such test'         // 8: last `expect` verification
    ];
    const verys = [
      initialState.very,  // 0: creating store, preReduction
      initialState.very,  // 1: creating store, postReduction
      initialState.very,  // 2: first `expect` verification
      'awesome',          // 3: `init` called after 100ms, preReduction
      'awesome',          // 4: `init` called after 100ms, postReduction
      'awesome',          // 5: second `expect` verification after 200ms
      'awesome',          // 6: dispatch `SET_WOW`, preReduction
      'awesome',          // 7: dispatch `SET_WOW`, postReduction
      'awesome'           // 8: last `expect` verification
    ];

    const replicator = {
      init(storeName, store) {
        setTimeout(() => {
          store.setState({ very: 'awesome' });  // 3, 4
          // replaces the state using `replaceReducer` twice
          // first call simply extends the current state
          // second call puts the original `replicatedReducer` back in place
          // so at index 3, `preReduction` will already have the updated `very`
        }, 100);
      },

      preReduction(storeName, state, action) {
        expect(typeof state).toBe('object');
        expect(state.wow).toBe(wows[index]);    // 0, 3, 6
        expect(state.very).toBe(verys[index]);  // 0, 3, 6
        index++;
      },

      postReduction(storeName, state, action) {
        expect(typeof state).toBe('object');
        expect(state.wow).toBe(wows[index]);    // 1, 4, 7
        expect(state.very).toBe(verys[index]);  // 1, 4, 7
        index++;
      }
    };

    const storeName = 'testStore';
    const replication = replicate(storeName, replicator);
    const create = compose(replication)(createStore);
    const store = create(combineReducers(reducers), initialState);  // 0
    const storeState = store.getState();

    expect(typeof store.setState).toBe('function');
    expect(typeof store.setKey).toBe('function');
    expect(typeof storeState).toBe('object');
    expect(storeState.wow).toBe(wows[index]);     // 2
    expect(storeState.very).toBe(verys[index]);   // 2
    index++;

    setTimeout(() => {
      let replicatedState = store.getState();

      expect(typeof replicatedState).toBe('object');
      expect(replicatedState.wow).toBe(wows[index]);    // 5, kept `wow`
      expect(replicatedState.very).toBe(verys[index]);  // 5, updated `very`
      index++;

      store.dispatch({ type: SET_WOW, value: 'such test' }); // 6, 7
      replicatedState = store.getState();

      expect(typeof replicatedState).toBe('object');
      expect(replicatedState.wow).toBe(wows[index]);    // 8, updated `wow`
      expect(replicatedState.very).toBe(verys[index]);  // 8, kept `very`
      index++;

      done();
    }, 200);  // after 100ms timeout from async `init`
  });
});
