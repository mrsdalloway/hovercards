var angular      = require('angular');
var network_urls = require('YoCardsApiCalls/network-urls');


module.exports = angular.module(chrome.i18n.getMessage('app_short_name') + 'EntryComponents', [require('./service-components')])
    .controller('EntryController', ['$scope', '$timeout', '$q', 'apiService', function($scope, $timeout, $q, apiService) {
        window.addEventListener('message', function(event) {
            var request = event.data;
            // TODO Determine if this is our request and not someone else's
            switch(request.msg) {
                case 'load':
                    $scope.$apply(function() {
                        $scope.entry = null;
                        $scope.data  = {};
                    });
                    $timeout(function() {
                        var identity = network_urls.identify(request.url);
                        if (!identity) {
                            $scope.entry = (function() {
                                var entry = {};

                                var got_something;
                                var last_err;
                                $q.all([{ api: 'reddit', type: 'url', id: request.url }].map(function(request) {
                                    return apiService.get(request)
                                        .$promise
                                        .then(function(thing) {
                                            got_something = true;
                                            switch (thing.type) {
                                                case 'content':
                                                    entry.content = entry.content || thing;
                                                    break;
                                                case 'discussion':
                                                    entry.discussions = $scope.entry.discussions || [];
                                                    entry.discussions.push(thing);
                                                    break;
                                                case 'account':
                                                    entry.accounts = $scope.entry.accounts || [];
                                                    entry.accounts.push(thing);
                                                    break;
                                            }
                                        })
                                        .catch(function(err) {
                                            last_err = err;
                                            return null;
                                        });
                                }))
                                .then(function() {
                                    if (got_something) {
                                        return;
                                    }
                                    entry.$err = last_err || { 'bad-input': true };
                                });

                                return entry;
                            }());
                            return;
                        }
                        $scope.entry = { type: identity.type };
                        switch ($scope.entry.type) {
                            case 'content':
                                $scope.entry.content = identity;
                                break;
                            case 'discussion':
                                $scope.entry.discussions = [identity];
                                $scope.entry.discussion = identity;
                                break;
                            case 'account':
                                $scope.entry.accounts = [identity];
                                break;
                        }
                    }, 100);
                    break;
                case 'hide':
                    $scope.$apply(function() {
                        $scope.entry = null;
                    });
                    break;
            }
        }, false);
    }])
    .name;
