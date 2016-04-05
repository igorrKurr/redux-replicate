# redux-replicate

[![build status](https://img.shields.io/travis/loggur/redux-replicate/master.svg?style=flat-square)](https://travis-ci.org/loggur/redux-replicate) [![npm version](https://img.shields.io/npm/v/redux-replicate.svg?style=flat-square)](https://www.npmjs.com/package/redux-replicate)
[![npm downloads](https://img.shields.io/npm/dm/redux-replicate.svg?style=flat-square)](https://www.npmjs.com/package/redux-replicate)

Creates a [Redux](https://github.com/rackt/redux) store enhancer designed to replicate actions and states.


## Table of contents

1.  [Installation](#installation)
2.  [Why?](#why)
3.  [Usage](#usage)
4.  [Replicators](#replicators)
5.  [Store modifications](#store-modifications)
6.  [Example replicator](#example-replicator)
7.  [Example using `react-redux-provide`](#example-using-react-redux-provide)
8.  [Example using `compose`](#example-using-compose)


## Installation

```
npm install redux-replicate --save
```


## Why?

Many times you'll find yourself manually retrieving data and updating the state(s) of your store(s) based on the result.  This library allows you to do this automatically and in a modular way.

Replication is a key concept when building any stateful application.  When implemented correctly, it allows you to decouple data initialization, storage, and retrieval from your application so that your only concern is rendering its state.  It allows you declaratively connect application state to data sources and create efficient, scalable, and reliable software with minimal effort.

You can:

* Replicate specific state keys to some data source (database, API, etc.) whenever they change.

* Replicate the entire state to some data source (database, API, etc.) whenever anything changes.

* Automatically initialize state from some data source, synchronously or asynchronously.

* Instantly add real-time functionality to keep clients in sync with each other.

* Instantly add or remove any number of data sources (databases, API, sockets, etc.).


If this is new to you, see Wikipedia's [State machine replication](https://en.wikipedia.org/wiki/State_machine_replication) page for more about it!


## Usage

Call the `replicate` function (default export) with the following arguments to create a store enhancer.

### key

Typically a string, but this can be anything.  It's passed to your replicators so they know where and/or how to replicate data.  If you're using `reducerKeys`, each `reducerKey` is combined with this `key` when calling a replicator's `getInitialState` and `onStateChange` methods.  If necessary, you can customize the way the `key` and `reducerKey` are combined (see the [Replicators](#replicators) section below).

### reducerKeys

Optional boolean value or array of strings.  This is helpful (and recommended!) if you're using Redux's `combineReducers` function (or similar) and want to replicate changes to individual keys within the store's state object, rather than the entire state tree.

If an array, it will replicate only the keys within the array.

If `true`, it will replicate all keys.

If either `false` or omitted, it will replicate the entire state object *without* combining the `key` argument with any state keys.

### replicator(s)

Either a single replicator or an array of replicators.  See the [Replicators](#replicators) section below.


## Replicators

Replicators can:

* Initialize the state of the store, synchronously and/or asynchronously.

* Save state changes to data sources.

* Send actions to clients, other servers, etc.

* Be packaged and easily reusable!


A replicator is a plain object of the following shape.

### getKey (Mixed key, String reducerKey)

Optional function to determine the key to be passed to `getInitialState` and `onStateChange`.  Only called when using `reducerKeys`.

Defaults to:

```js
function getKey(key, reducerKey) {
  return `${key}/${reducerKey}`;
}
```

### getInitialState (String key, Function setState)

Optional function to set the store's initial state, synchronously or asynchronously.

If using `reducerKeys`, this function is called once per `reducerKey`.

If not using `reducerKeys`, this function is called only once.

The `setState` function must be called for the store to finish initializing, regardless of whether or not the state exists within the data source.

Example (from [`redux-replicate-localforage`](https://github.com/loggur/redux-replicate-localforage)):

```js
function getInitialState(key, setState) {
  localforage
    .getItem(key)
    .then(state => {
      setState(parse(state));
    }, error => {
      warn(error);
      setState();
    });
}
```

### onReady (String key, Object store)

Optional function called after initialization.

Example:

```js
function onReady(key, store) {
  socket.on('action', ({ key: receivedKey, action }) => {
    if (equal(receivedKey, key)) {
      store.dispatch(action);
    }
  });
}
```

### onStateChange (String key, Mixed state, Mixed nextState, Object action)

Optional function to replicate the state and/or the action upon state changes.  This is called only after initialization.

If using `reducerKeys`, this function is called once per `reducerKey`.

If not using `reducerKeys`, this function is called only once.

Example (from [`redux-replicate-localforage`](https://github.com/loggur/redux-replicate-localforage)):

```js
function onStateChange(key, state, nextState, action) {
  localforage
    .setItem(key, stringify(nextState))
    .catch(warn);
}
```

### postReduction (String key, Mixed state, Mixed nextState, Object action)

Optional function to replicate the state and/or the action upon any reduction, regardless of whether or not the store's state has changed.  This is called only after initialization.  If you want to replicate actions, this is the place to do it.

This function is only called once per reduction, as the `key` passed to this function is not combined with any `reducerKey`.  A quick `state !== nextState` check here would let you know if any change has taken place, regardless of whether or not you're using `reducerKeys`.

Example:

```js
function postReduction(key, state, nextState, action) {
  if (state !== nextState) {
    socket.emit('action', { key, action });
  }
}
```


## Store modifications

The enhancer adds the following to the `store` object.

### store.setState(Mixed nextState)

You typically shouldn't need to use this, as state changes should almost always occur as a result of `store.dispatch(action)`.  But it may be useful for keeping a store's state synchronized with some data source which doesn't rely on actions.  If using `reducerKeys`, the `nextState` is expected to be an object and is merged into the current state, similar to React's `setState`.  If not using `reducerKeys`, the `nextState` replaces the current state entirely.

### store.onReady(Function readyCallback)

You can use this if you know your replicator(s) asynchronously initialize the store's state and would like to do something immediately after initialization.  The `readyCallback` will receive the `key` and `store` as arguments.

### store.initializedReplication

If for some reason you need to know whether or not `getInitialState` has completed, you can check this boolean property.  It will be `true` after initialization.


## Example replicator

See [`redux-replicate-localforage`](https://github.com/loggur/redux-replicate-localforage), a replicator that persists the state of your store(s) locally.


## Example using [`react-redux-provide`](https://github.com/loggur/react-redux-provide)

Replication and providers work great together!  Providers help you fully reap the benefits of replication.  Below you can see how, with just a few lines of code, we enable real-time chat functionality and replicate the states of entries and comments to RethinkDB.

```js
// src/replication.js

import rethink from 'redux-replicate-rethink';
import socket from 'redux-replicate-socket';
import * as providers from './providers/index';

// replication `key` defaults to each provider instance's key,
// which may be a function of props and context

providers.entry.replication = {
  reducerKeys: ['time', 'author', 'entry', 'tags'],
  replicator: rethink
};

providers.comment.replication = {
  reducerKeys: ['time', 'author', 'comment', 'for'],
  replicator: rethink
};

providers.message.replication = {
  reducerKeys: ['time', 'author', 'message'],
  replicator: socket
};
```


## Example using `compose`

```js
import { createStore, combineReducers, compose } from 'redux';
import replicate from 'redux-replicate';
import localforage from 'redux-replicate-localforage';
import reducers from './reducers';

const initialState = {
  wow: 'such storage',
  very: 'cool'
};

const key = 'superCoolStorageUnit';
const replication = replicate(key, true, localforage);
const create = compose(replication)(createStore);
const store = create(combineReducers(reducers), initialState);
```
