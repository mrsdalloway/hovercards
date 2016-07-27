var _               = require('underscore');
var applyMiddleware = require('redux').applyMiddleware;
var combineReducers = require('redux').combineReducers;
var createStore     = require('redux').createStore;
var thunkMiddlware  = require('redux-thunk').default;

var actions = require('./actions.background');
var browser = require('../extension/browser');

createStore = applyMiddleware(thunkMiddlware)(createStore);

module.exports = function(initialState) {
	var store = createStore(combineReducers({
		entities: require('./entities.reducer')
	}), initialState);

	browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		// TODO Have browser mutate this callback for us
		sendResponse = _.wrap(sendResponse, function(func) {
			return func(_.rest(arguments));
		});

		store.dispatch(actions[message.type](message.payload, sender.tab.id)).then(
			_.partial(sendResponse, null),
			sendResponse
		);

		return true;
	});

	return store;
};
