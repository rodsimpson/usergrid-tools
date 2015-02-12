//
// Licensed to the Apache Software Foundation (ASF) under one or more
// contributor license agreements.  See the NOTICE file distributed with
// this work for additional information regarding copyright ownership.
// The ASF licenses this file to You under the Apache License, Version 2.0
// (the "License"); you may not use this file except in compliance with
// the License.  You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

/**
 * @author rod simpson (rod@apigee.com)
 */

$(document).ready(function () {

    var URL = "http://api.usergrid.com/";
    var org = "yourorgname";
    var app = "sandbox";
    var collectionType = "books";
    var runtests = true;
    var count = 0;
    var limit = 10;
    var batch = 0;

    var ugClient = new Usergrid.Client({
        orgName:org,
        appName:app,
        URL:URL,
        logging: false, //optional - turn on logging, off by default
        buildCurl: false //optional - turn on curl commands, off by default
    });
    
    //call the function to start the process
    $('#start-button').bind('click', function() {
        runtests = true;
        count = 0;
        batch = 0;
        $('#start-button').prop( "disabled", true );
        $('#test-output').html('');
        $('#status').html('Now counting entities...');
        $('#status-count').html('Count: ' + count);
        var URL_in = $('#URL').val();
        if (URL_in.length > 0) {
            URL = URL_in;
            URL = stripTrailingSlash(URL);
        }
        var org_in = $('#org').val();
        if (org_in.length > 0) {
            org = org_in;
        }
        var app_in = $('#app').val();
        if (org_in.length > 0) {
            app = app_in;
        }
        var collectionType_in = $('#collectionType').val();
        if (collectionType_in.length > 0) {
            collectionType = collectionType_in;
        }
        
        var options = {"type":collectionType, qs:{limit:limit}};

        ugClient.URI = URL;
        
        notice('Starting API Test using: ' + URL + org + '/' + app);
        ugCollectionForEachPaging (ugClient, options, f);
    });

    $('#reset-button').bind('click', function() {
        runtests = false;
        count = 0;
        batch = 0;
        $('#start-button').prop( "disabled", false );
        $('#test-output').html('// Test output will be displayed here');
        $('#status').html('Press Start button to begin');
        $('#status-count').html('Count: ' + count);
    });

    $('#show-login-button').bind('click', function() {
        $('#login-form').css( "display", "block" );
    });
    $('#show-token-button').bind('click', function() {
        $('#token-form').css( "display", "block" );
    });
    
    $('#login-submit-button').bind('click', function() {
        var username = $('#username').val();
        var password = $('#password').val();
        ugClient.adminLogin(username, password, function(err) {
            if (err) {
                alert("login failed");
            } else {
                alert("success! Token Acquired and will be used for all future calls.");
                $('#login-form').css( "display", "none" );
            }
        });
    });
    $('#login-cancel-button').bind('click', function() {
        $('#login-form').css( "display", "none" );
    });
    
    $('#token-submit-button').bind('click', function() {
        var token = $('#token').val();
        ugClient.setToken(token);
        $('#token').val('');
        $('#token-form').css( "display", "none" );
        alert("token accepted");
    });
    $('#token-cancel-button').bind('click', function() {
        $('#token-form').css( "display", "none" );
    });
    
    var logSuccess = true;
    var successCount = 0;
    var logError = true;
    var errorCount = 0;
    var logNotice = true;

    function stripTrailingSlash(str) {
        while (str.substr(-1) == '/') {
            if (str.substr(-1) == '/') {
                str = str.substr(0, str.length - 1);
            }
        }
        return str + '/';
    }

    //logging functions
    function success(message){
        successCount++;
        $('#status-passed').html('Passed: ' + successCount);
        if (logSuccess && runtests) {
            console.log('SUCCESS: ' + message);
            var html = $('#test-output').html();
            html += ('SUCCESS: ' + message + '\r\n');
            $('#test-output').html(html);
        }
    }

    function error(message){
        errorCount++
        $('#status-failed').html('Failed: ' + errorCount);
        if (logError && runtests) {
            console.log('ERROR: ' + message);
            var html = $('#test-output').html();
            html += ('ERROR: ' + message + '\r\n');
            $('#test-output').html(html);
        }
    }

    function notice(message){
        if (logNotice && runtests) {
            console.log('NOTICE: ' + message);
            var html = $('#test-output').html();
            html += (message + '\r\n');
            $('#test-output').html(html);
        }
    }

    /*
     * ugCollectionForEachPaging
     *
     * Iterates through all items in a collection within
     * Apigee Edge BaaS.  Uses the Usergrid client object from the usergrid
     * module. Notice - this logic calls {has,get}NextPage().
     *
     * @param ugClient - the authenticated client object
     * @param options - the options for a collection. Pass type and qs.
     * @param f - function called with each UG entity. Accepts a single argument.
     *
     *********************************************/
    function ugCollectionForEachPaging (ugClient, options, f) {
        var results = {count: 0, failCount: 0};
        ugClient.createCollection(options, function (e, response, collection) {
            if (runtests) {
                var e2;
                function doOnePage(collection) {
                    if (runtests) {
                        batch++;
                        $('#status').html('Working on batch number '+batch+ '..');
                        while (collection.hasNextEntity()) {
                            if (runtests) {
                                f(collection.getNextEntity(), results);
                                results.count++;
                            }
                        }
                        if (collection.hasNextPage() && runtests) {
                            collection.getNextPage(function (e) {
                                if (e) {
                                    error('could not get next page of entities');
                                }
                                else {
                                    doOnePage(collection);
                                }
                            });
                        }
                        else {
                            $('#start-button').prop( "disabled", false );
                            $('#status').html('Counting complete.');
                        }
                    }
                }

                if (e) {
                    error('could not make or get collection');
                }
                else {
                    doOnePage(collection);
                }
            }
        });
    }


    var f = function(entity, results){
        count++;
        $('#status-count').html('Count: ' + count);
    }

});