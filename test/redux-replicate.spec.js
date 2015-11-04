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

    const replicator = {
      init(storeName, store) {
        setTimeout(() => {
          store.setState({ very: 'awesome' });
        }, 100);
      },

      preDispatch(storeName, store, action) {
        const preDispatchState = store.getState();

        expect(typeof preDispatchState).toBe('object');
        expect(preDispatchState.wow).toBe('such storage');
        expect(preDispatchState.very).toBe('awesome');
      },

      postDispatch(storeName, store, action) {
        const postDispatchState = store.getState();

        expect(typeof postDispatchState).toBe('object');
        expect(postDispatchState.wow).toBe('such test');
        expect(postDispatchState.very).toBe('awesome');
      }
    };

    const storeName = 'testStore';
    const replication = replicate(storeName, replicator);
    const create = compose(replication)(createStore);
    const store = create(combineReducers(reducers), initialState);
    const storeState = store.getState();

    expect(typeof store.setState).toBe('function');
    expect(typeof storeState).toBe('object');
    expect(storeState.wow).toBe('such storage');
    expect(storeState.very).toBe('cool');

    setTimeout(() => {
      const replicatedState = store.getState();

      expect(typeof replicatedState).toBe('object');
      expect(replicatedState.wow).toBe('such storage');  // should keep `wow`
      expect(replicatedState.very).toBe('awesome');      // and update `very`

      store.dispatch({ type: SET_WOW, value: 'such test' });

      done();
    }, 200);  // after 100ms timeout from async `init`
  });
});
