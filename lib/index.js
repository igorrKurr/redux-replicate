'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = replicate;
function arrayToMap(array) {
  var map = {};

  if (Array.isArray(array)) {
    array.forEach(function (item) {
      map[item] = true;
    });
  }

  return map;
}

/**
 * Creates a Redux store enhancer designed to replicate actions and states.
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
function replicate(_ref) {
  var key = _ref.key;
  var reducerKeys = _ref.reducerKeys;
  var _ref$queryable = _ref.queryable;
  var queryable = _ref$queryable === undefined ? false : _ref$queryable;
  var replicator = _ref.replicator;
  var clientState = _ref.clientState;

  if (!Array.isArray(replicator)) {
    replicator = [replicator];
  }

  // TODO: clean this up a bit; it probably looks like one big blob of code
  // but it's actually pretty straightforward!
  return function (next) {
    return function (reducer, initialState, enhancer) {
      var store = null;
      var nextState = null;
      var replicators = replicator.map(function (item) {
        return Object.assign({}, item);
      });

      function getInitialState() {
        var initialState = reducerKeys ? {} : null;
        var setInitialState = false;
        var semaphore = replicators.length;

        function clear() {
          if (--semaphore === 0) {
            if (setInitialState) {
              store.setState(initialState);
            }

            if (--store.initializingReplication === 0) {
              while (store.readyCallbacks.length) {
                store.readyCallbacks.shift()(key, store);
              }
            }
          }
        }

        if (reducerKeys) {
          var initialReducerKeys = reducerKeys;

          if (reducerKeys === true) {
            reducerKeys = Object.keys(store.getState());
            initialReducerKeys = reducerKeys;
          }

          // here we want the client to get only the undefined initial states
          if (clientState) {
            initialReducerKeys = [];

            if (Array.isArray(reducerKeys)) {
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = reducerKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var reducerKey = _step.value;

                  if (typeof clientState[reducerKey] === 'undefined') {
                    initialReducerKeys.push(reducerKey);
                  }
                }
              } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                  }
                } finally {
                  if (_didIteratorError) {
                    throw _iteratorError;
                  }
                }
              }
            } else {
              // if reducerKeys is an object, truthy values indicate keys that
              // can be overridden by the client
              for (var _reducerKey in reducerKeys) {
                if (reducerKeys[_reducerKey] && typeof clientState[_reducerKey] === 'undefined') {
                  initialReducerKeys.push(_reducerKey);
                }
              }

              reducerKeys = Object.keys(reducerKeys);
            }
          }

          queryable = arrayToMap(queryable === true ? reducerKeys : queryable);
          semaphore = semaphore * initialReducerKeys.length;

          if (semaphore) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = replicators[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _replicator = _step2.value;

                if (_replicator.getInitialState) {
                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                    var _loop = function _loop() {
                      var reducerKey = _step3.value;

                      _replicator.getInitialState({ key: key, reducerKey: reducerKey }, function (state) {
                        if (typeof state !== 'undefined') {
                          initialState[reducerKey] = state;
                          setInitialState = true;
                        }

                        clear();
                      });
                    };

                    for (var _iterator3 = initialReducerKeys[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      _loop();
                    }
                  } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                      }
                    } finally {
                      if (_didIteratorError3) {
                        throw _iteratorError3;
                      }
                    }
                  }
                } else {
                  var _iteratorNormalCompletion4 = true;
                  var _didIteratorError4 = false;
                  var _iteratorError4 = undefined;

                  try {
                    for (var _iterator4 = initialReducerKeys[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      var _reducerKey2 = _step4.value;

                      clear();
                    }
                  } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                      }
                    } finally {
                      if (_didIteratorError4) {
                        throw _iteratorError4;
                      }
                    }
                  }
                }
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }
          } else {
            semaphore = 1;
            clear();
          }
        } else {
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = replicators[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var _replicator2 = _step5.value;

              if (_replicator2.getInitialState) {
                _replicator2.getInitialState({ key: key }, function (state) {
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
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
      }

      function mergeNextState(state) {
        var mocked = arguments.length <= 1 || arguments[1] === undefined ? store.initializedReplication : arguments[1];

        if (reducerKeys) {
          state = _extends({}, state, nextState);
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
        var actualNextState = nextState ? reducer(mergeNextState(state), action) : reducer(state, action);

        if (store && store.initializedReplication) {
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = replicators[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var _replicator3 = _step6.value;

              if (_replicator3.onStateChange) {
                if (reducerKeys) {
                  var _iteratorNormalCompletion7 = true;
                  var _didIteratorError7 = false;
                  var _iteratorError7 = undefined;

                  try {
                    for (var _iterator7 = reducerKeys[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                      var reducerKey = _step7.value;

                      if (state[reducerKey] !== actualNextState[reducerKey]) {
                        _replicator3.onStateChange({ key: key, reducerKey: reducerKey, queryable: queryable[reducerKey] }, state[reducerKey], actualNextState[reducerKey], action, store);
                      }
                    }
                  } catch (err) {
                    _didIteratorError7 = true;
                    _iteratorError7 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion7 && _iterator7.return) {
                        _iterator7.return();
                      }
                    } finally {
                      if (_didIteratorError7) {
                        throw _iteratorError7;
                      }
                    }
                  }
                } else if (state !== actualNextState) {
                  _replicator3.onStateChange({ key: key, queryable: queryable }, state, actualNextState, action, store);
                }
              }

              if (_replicator3.postReduction) {
                _replicator3.postReduction(key, state, actualNextState, action, store);
              }
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        }

        return actualNextState;
      }

      store = next(replicatedReducer, initialState, enhancer);

      if (!store.onReady) {
        store.readyCallbacks = [];
        store.onReady = function (readyCallback) {
          store.readyCallbacks.push(readyCallback);
        };
      }

      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = replicators[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _replicator4 = _step8.value;

          if (_replicator4.onReady) {
            store.onReady(_replicator4.onReady);
          }
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }

      if (store.initializingReplication) {
        store.initializingReplication++;
      } else {
        store.initializingReplication = 1;
      }

      store.initializedReplication = false;
      store.onReady(function () {
        store.initializedReplication = true;
      });

      if (!store.setState) {
        store.setState = function (state) {
          nextState = state;
          store.replaceReducer(replicatedReducer);
        };
      }

      getInitialState();

      return store;
    };
  };
}