var $     = require('jquery');
var URI   = require('URIjs/src/URI');
var async = require('async');

// var endpoint = 'https://' + chrome.i18n.getMessage('app_short_name') + '.herokuapp.com/v1';
var endpoint = 'http://localhost:5000/v1';

function get_user(api, callback) {
    var user;
    async.detectSeries([
        function(callback) {
            chrome.storage.sync.get(api + '_user', function(obj) {
                callback(null, obj[api + '_user']);
            });
        },
        function(callback) {
            chrome.identity.getProfileUserInfo(function(user) {
                callback(chrome.runtime.lastError, user.id);
            });
        }
    ], function(fn, callback) {
        fn(function(err, result) {
            if (err || !result) {
                return callback(false);
            }
            user = result;
            callback(true);
        });
    }, function() {
        callback(null, user);
    });
}

async.parallel({
    reddit: function(callback) {
        get_user('reddit', function(err, user) {
            if (err) {
                return callback(err);
            }
            callback(null, require('YoCardsAPICalls/reddit')({ key: 'fNtoQI4_wDq21w', user: user }));
        });
    }
}, function(err, client_side_calls) {
    if (err) {
        return console.error(err);
    }
    chrome.runtime.onMessage.addListener(function(request, sender, _sendMessage) {
        var callback = function(err, val) {
            _sendMessage([err, val]);
        };
        request = $.extend({}, request);
        var api  = request.api;
        var type = request.type;
        delete request.api;
        delete request.type;

        if (client_side_calls[api] && client_side_calls[api][type]) {
            client_side_calls[api][type](request, function(err, result) {
                callback(err || (!result && { status: 404 }), result);
            });
        } else if (type === 'auth') {
            async.waterfall([
                function(callback) {
                    chrome.identity.launchWebAuthFlow({ url: endpoint + '/' + api + '/authenticate', interactive: true }, function(redirect_url) {
                        if (chrome.runtime.lastError) {
                            return callback($.extend({ status: 401 }, chrome.runtime.lastError));
                        }
                        callback(null, URI(redirect_url).search(true).user);
                    });
                },
                function(token, callback) {
                    var obj = {};
                    obj[api + '_user'] = token;
                    chrome.storage.sync.set(obj, function() {
                        callback(chrome.runtime.lastError);
                    });
                }
            ], callback);
        } else {
            async.waterfall([
                async.apply(get_user, api),
                function(user, callback) {
                    $.ajax({ url:     endpoint + '/' + api + '/' + type,
                             data:    request,
                             headers: { user: user } })
                        .done(function(data) {
                            callback(null, data);
                        })
                        .fail(function(err) {
                            callback(err);
                        });
                }
            ], callback);
        }
        return true;
    });
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(tab.id, { code: 'window.top.postMessage({ msg: \'activate\', url: \'' + tab.url + '\' }, \'*\');' });
});
