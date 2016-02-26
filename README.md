# redux-replicate

[![build status](https://img.shields.io/travis/loggur/redux-replicate/master.svg?style=flat-square)](https://travis-ci.org/loggur/redux-replicate) [![npm version](https://img.shields.io/npm/v/redux-replicate.svg?style=flat-square)](https://www.npmjs.com/package/redux-replicate)
[![npm downloads](https://img.shields.io/npm/dm/redux-replicate.svg?style=flat-square)](https://www.npmjs.com/package/redux-replicate)

Store enhancer for [`redux`](https://github.com/rackt/redux) designed to easily save/restore/initialize stores' states and replicate actions/states before and/or after reduction.


## Installation

```
npm install redux-replicate --save
```


## Usage

```js
replicate (String storeKey, Function|Array replicatorCreator(s))
```

This package exports a single function which returns a [`redux`](https://github.com/rackt/redux) store enhancer.  The first argument should be the name of your store, and the rest of the arguments should be functions that return replicators.  The enhancer adds the following 2 methods to the `store` object:

- `setState (Object state)` - Extends the current state with `state`, similarly to React's `setState` method.


## Replicators

A replicator should be an object of the following shape:

- `keys` - Optional object containing the keys you wish to replicate.  The values should be truthy or falsy which will specify which keys to select or not to select.  If `keys` is undefined, all keys will be replicated.  If it's an empty object, no keys will be replicated.

- `init (String storeKey, Object store, setReady)` - This optional function is called when initializing the store.  You can, for example, use the `store.setState` method here to asynchronously update the state of the store.  If this `init` method exists, the `preReduction` and `postReduction` methods will not be called until `setReady(true)` is called.

- `preReduction (String storeKey, Object state, Object action)` - Called immediately before some `action` is dispatched throughout the stores `reducer(s)`.

- `postReduction (String storeKey, Object state, Object action)` - Called immediately after some `action` is dispatched throughout the stores `reducer(s)`.


## Example replicator

See [`redux-replicate-localforage`](https://github.com/loggur/redux-replicate-localforage), a replicator that persists the state of your store(s) locally.


## Example using [`react-redux-provide`](https://github.com/loggur/react-redux-provide)

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { unshiftEnhancer } from 'react-redux-provide';
import replicate from 'redux-replicate';
import localforageReplicator from 'redux-replicate-localforage';
import { coolMap } from './providers/index';
import { App } from './components/index';

unshiftEnhancer({ coolMap }, replicate('coolMap', localforageReplicator()));

ReactDOM.render(<App/>, document.getElementById('root'));
```


## Example using `compose`

```js
import { createStore, combineReducers, compose } from 'redux';
import replicate from 'redux-replicate';
import localforageReplicator from 'redux-replicate-localforage';
import reducers from './reducers';

const initialState = {
  wow: 'such storage',
  very: 'cool'
};

const storeKey = 'superCoolStorageUnit';
const replication = replicate(storeKey, localforageReplicator());
const create = compose(replication)(createStore);
const store = create(combineReducers(reducers), initialState);
```
