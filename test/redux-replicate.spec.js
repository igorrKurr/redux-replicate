import expect from 'expect';
import { createStore, combineReducers, compose } from 'redux';
import replicate, { selectKeys, mergeStoresStates } from '../src/index';

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
      initialState.wow,   // 0: first `expect` verification
      initialState.wow,   // 1: `init` called after 100ms, preReduction
      initialState.wow,   // 2: `init` called after 100ms, postReduction
      initialState.wow,   // 3: second `expect` verification after 200ms
      initialState.wow,   // 4: dispatch `SET_WOW`, preReduction
      'such test',        // 5: dispatch `SET_WOW`, postReduction
      'such test'         // 6: last `expect` verification
    ];
    const verys = [
      initialState.very,  // 0: first `expect` verification
      initialState.very,  // 1: `init` called after 100ms, preReduction
      'awesome',          // 2: `init` called after 100ms, postReduction
      'awesome',          // 3: second `expect` verification after 200ms
      'awesome',          // 4: dispatch `SET_WOW`, preReduction
      'awesome',          // 5: dispatch `SET_WOW`, postReduction
      'awesome'           // 6: last `expect` verification
    ];

    const replicator = replicate('test', {
      init(storeKey, store, setReady) {
        setTimeout(() => {
          setReady(true);
          store.setState({ very: 'awesome' });  // 1, 2
          // replaces the state using `replaceReducer` and a reducer enhancer
        }, 100);
      },

      preReduction(storeKey, state, action) {
        expect(typeof state).toBe('object');
        expect(state.wow).toBe(wows[index]);    // 1, 4
        expect(state.very).toBe(verys[index]);  // 1, 4
        index++;
      },

      postReduction(storeKey, state, action) {
        expect(typeof state).toBe('object');
        expect(state.wow).toBe(wows[index]);    // 2, 5
        expect(state.very).toBe(verys[index]);  // 2, 5
        index++;
      }
    });

    const create = compose(replicator)(createStore);
    const store = create(combineReducers(reducers), initialState);
    const storeState = store.getState();

    expect(typeof store.setState).toBe('function');
    expect(typeof storeState).toBe('object');
    expect(storeState.wow).toBe(wows[index]);     // 0
    expect(storeState.very).toBe(verys[index]);   // 0
    index++;

    setTimeout(() => {
      let replicatedState = store.getState();

      expect(typeof replicatedState).toBe('object');
      expect(replicatedState.wow).toBe(wows[index]);    // 3, kept `wow`
      expect(replicatedState.very).toBe(verys[index]);  // 3, updated `very`
      index++;

      store.dispatch({ type: SET_WOW, value: 'such test' }); // 4, 5
      replicatedState = store.getState();

      expect(typeof replicatedState).toBe('object');
      expect(replicatedState.wow).toBe(wows[index]);    // 6, updated `wow`
      expect(replicatedState.very).toBe(verys[index]);  // 6, kept `very`
      index++;

      done();
    }, 200);  // after 100ms timeout from async `init`
  });

  it('should selectKeys', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3
    };

    const selectedAll = selectKeys(null, obj);
    const selectedNone = selectKeys({}, obj);
    const selectedOnlyAB = selectKeys({ a: true, b: true }, obj);
    const selectedNotA = selectKeys({ a: false }, obj);

    expect(selectedAll).toBe(obj);
    expect(Object.keys(selectedNone).length).toBe(0);
    expect(selectedOnlyAB.a).toBe(1);
    expect(selectedOnlyAB.b).toBe(2);
    expect(selectedOnlyAB.c).toBe(undefined);
    expect(selectedNotA.a).toBe(undefined);
    expect(selectedNotA.b).toBe(2);
    expect(selectedNotA.c).toBe(3);
  });

  it('should mergeStoresStates', () => {
    const aReducers = {
      a(state = 1, action) {
        switch (action.type) {
          default:
            return state;
        }
      }
    };

    const bReducers = {
      b(state = 2, action) {
        switch (action.type) {
          default:
            return state;
        }
      }
    };

    const stores = {
      a: createStore(combineReducers(aReducers)),
      b: createStore(combineReducers(bReducers))
    };

    const selectedAll = mergeStoresStates()(stores);
    const selectedA = mergeStoresStates({ a: true })(stores);
    const selectedNotA = mergeStoresStates({ a: false })(stores);

    expect(selectedAll.a).toBe(1);
    expect(selectedAll.b).toBe(2);
    expect(selectedA.a).toBe(1);
    expect(selectedA.b).toBe(undefined);
    expect(selectedNotA.a).toBe(undefined);
    expect(selectedNotA.b).toBe(2);
  });
});
