var jive = require("jive-sdk");
var q = require('q');
var db = require("mongojs").connect(jive.service.options['databaseUrl'], jive.service.options['databaseCollections']);
var volunteerConfig = 'volunteerConfig';

function findAllEfforts(metroId, callback) {
    console.log("findAllEfforts ");
    // TODO sort by date effort logged, requires saving in post.js
    var options = {
        "limit": 5
    }
    db.effort.find({ "metroInfo.metroId" : metroId}, options, function(err, efforts) {
        if (err || !efforts || efforts.length == 0) {
            console.log("No efforts found for metroId " + metroId);
            return callback(err, null);
        }

        else {
            return callback(null, efforts);
        }
    });

}
function getFirstLine(effort) {
//    var firstline = "@user@whoelse";
//    firstline = firstline.replace("@user", effort.userInfo[0].userDisplayName);
//    if (effort.whoElseInfo) {
//        var whoElse = "";
//        for (i = 0; i < effort.whoElseInfo.length; i++) {
//            if (i > 0) {
//                whoElse.concat(",");
//            }
//            whoElse = whoElse.concat(effort.whoElseInfo[i].displayName);
//        }
//        firstline = firstline.replace("@whoelse", " and ".concat(whoElse));
//    } else {
//        firstline = firstline.replace("@whoelse", "");
//    }

    var firstline = "@user and @numberofothers other volunteer(s)";
    firstline = firstline.replace("@user", effort.userInfo[0].userDisplayName);
    firstline = firstline.replace("@numberofothers", effort.whoElseInfo.length);
    firstline = firstline.substring(0, 39);
    return firstline;
}
function getSecondLine(effort) {
    var secondline = "Supported @causes";
//    var secondline = "Supported @causes@where";
    secondline = secondline.replace("@causes", effort.causes);
//    if (effort.whoElseVolunteerId) {
//        secondline = secondline.replace("@where", " at "
//                .concat(effort.charitableOrganization));
//    } else {
//        secondline = secondline.replace("@where", "");
//    }
    secondline = secondline.substring(0, 39);
    return secondline;

}
function getJSONContentFromData(collection) {
    var jsonArr = [];
    if (collection) {
        collection
                .forEach(function(effort) {
                    var firstline = getFirstLine(effort);
                    var secondline = getSecondLine(effort);
                    jsonArr
                            .push({
                                // TODO Lookup user name once correct userID
                                // saved and/or userID displayed by Jive Tile
                                "text" : firstline,
                                "linkDescription" : "From "
                                        .concat(effort.metroInfo[0].displayName),
                                // TODO Lookup group name once correct placeID
                                // saved and/or containerID/Type displayed by
                                // Jive Tile
                                "linkMoreDescription" : secondline,
                                "action" : {
                                    "text" : "Comment, Share & Like",
                                    "url" : effort.contentURI
                                },
                                "icon" : "https://community.jivesoftware.com/servlet/JiveServlet/showImage/102-99994-1-1023036/j.png",
                                "userID" : effort.userInfo[0].userId
//                                "containerID" : "2001",
//                                "containerType" : "14"
                            });
                });

    } else {
        jsonArr
                .push({
                    "text" : "No recent volunteer efforts found!",
                    "icon" : "https://community.jivesoftware.com/servlet/JiveServlet/showImage/102-99994-1-1023036/j.png",
                });

    }
    var arr = JSON.parse(JSON.stringify(jsonArr));
    return arr;

}
function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance',
            instance.id);

    function getFormattedData(metroConfig, callback) {
        console.log("Retrieving volunteer efforts for Metro: " + metroConfig.displayName);

        findAllEfforts(metroConfig.metroId, function(err, collection) {
            var item = "";
            var item1 = "";
            if (err) {
                console.log(err);
                process.exit(1);
            } else {
                var arr = getJSONContentFromData(collection);
                var title = "Volunteer Efforts For ".concat(metroConfig.displayName);
                return callback({
                    data : {
                        "title" : title,
                        "contents" : arr,
                        "action" : {
                            "text" : "Log Your Volunteer Effort!",
                            "context" : {
                                "metroId" : metroConfig.metroId
                            }
                        },
                        "config" : {
                            "listStyle" : "peopleList"
                        }
                    }
                });

            }
        });

    }

    if (instance.config.metroConfig) {
        getFormattedData(instance.config.metroConfig, function(jsonData) {
            if (jsonData) {
                console.log("Pushing volunteer efforts: " + JSON.stringify(jsonData, null, 4));
                return jive.tiles.pushData(instance, jsonData);
            }
        });

    }
}

/**
 * Iterates through the tile instances registered in the service, and pushes an
 * update to it
 */
var pushData = function() {
    var deferred = q.defer();
    jive.tiles.findByDefinitionName('volunteer-tools').then(
            function(instances) {
                if (instances) {
                    q.all(instances.map(processTileInstance)).then(function() {
                        deferred.resolve(); // success
                    }, function() {
                        deferred.reject(); // failure
                    });
                } else {
                    jive.logger.debug("No jive instances to push to");
                    deferred.resolve();
                }
            });
    return deferred.promise;
};

/**
 * Schedules the tile update task to automatically fire every 10 seconds
 */
exports.task = [ {
    'interval' : 10000,
    'handler' : pushData
} ];

exports.eventHandlers = [ {
    'event' : jive.constants.globalEventNames.NEW_INSTANCE,
    'handler' : processTileInstance
}, {
    'event' : jive.constants.globalEventNames.INSTANCE_UPDATED,
    'handler' : processTileInstance
} ];
