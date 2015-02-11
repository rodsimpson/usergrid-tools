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
    
    //call the function to start the process
    $('#start-button').bind('click', function() {
        runtests = true;
        $('#start-button').prop( "disabled", true );
        $('#test-output').html('');
        $('#status').html('Test is now running');
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
        
        var options = {"type":collectionType, qs:{limit:100}};

        var ugClient = new Usergrid.Client({
            orgName:org,
            appName:app,
            URL:URL,
            logging: false, //optional - turn on logging, off by default
            buildCurl: false //optional - turn on curl commands, off by default
        });
        
        notice('Starting API Test using: ' + URL + org + '/' + app);
        ugCollectionForEachPaging (ugClient, options, f, doneCB);
    });

    $('#reset-button').bind('click', function() {
        runtests = false;
        count = 0;
        $('#start-button').prop( "disabled", false );
        $('#test-output').html('// Test output will be displayed here');
        $('#status').html('Press Start button to begin');
        $('#status-count').html('Count: ' + count);
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
     * @param doneCb - called in case of error or success.
     *
     *********************************************/
    function ugCollectionForEachPaging (ugClient, options, f, doneCb) {
        var results = {count: 0, failCount: 0};
        if ( ! options.type) {
            doneCb(new Error('missing type property in the options argument'), null);
        }
        ugClient.createCollection(options, function (e, response, collection) {
            if (runtests) {
                var e2;
                function doOnePage(collection, cb) {
                    if (runtests) {
                        success("Got a page of entities");
                        while (collection.hasNextEntity()) {
                            if (runtests) {
                                f(collection.getNextEntity(), results);
                                results.count++;
                            }
                        }
                        if (collection.hasNextPage() && runtests) {
                            collection.getNextPage(function (e) {
                                if (e) {
                                    e2 = new Error('could not get next page of entities');
                                    e2.wrappedError = e;
                                    cb(e2, results);
                                }
                                else {
                                    doOnePage(collection, cb);
                                }
                            });
                        }
                        else {
                            $('#start-button').prop( "disabled", false );
                            cb(null, results);
                        }
                    }
                }

                if (e) {
                    e2 = new Error('could not make or get collection');
                    e2.wrappedError = e;
                    doneCb(e2, null);
                }
                else {
                    doOnePage(collection, doneCb);
                }
            }
        });
    }

    var doneCB = function(error, results){
        try {
            console.log("error = " + error);
        } catch (e) {}
        try {
            console.log("total = " + results.count);
        } catch (e) {}
    }

    var f = function(entity, results){
        count++;
        $('#status-count').html('Count: ' + count);
    }

});