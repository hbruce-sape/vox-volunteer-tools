var jive = require('jive-sdk');
var util = require('util');
var db = require("mongojs").connect(jive.service.options['databaseUrl'], jive.service.options['databaseCollections']);

function saveEffort(req, callback) {

    var effort = {
        "userInfo" : req.body.userInfo,
        "metroInfo" : req.body.metroInfo,
        "businessUnit" : req.body.businessUnitId,
        "accountId" : req.body.accountId,
        "charitableOrganization" : req.body.charitableOrganizationId,
        "effortDate" : req.body.date,
        "effortTime" : req.body.time,
        "causes" : req.body.causes,
        "whoElseInfo" : req.body.whoElseInfo,
        "whatYouDid" : req.body.whatYouDid,
        "contentURI" : req.body.contentURI
    };

    console.log("Volunteer effort to be saved: "+ JSON.stringify(effort, null, 4));

    db.effort.save(effort, function(err, saved) {
        if (err || !saved) {
            console.log("Volunteer effort not saved");
            return callback(err, null);
        } else {
            console.log("Volunteer effort saved");
            return callback(null, null);
        }
    });

}
exports.route = function(req, res) {
    var conf = jive.service.options;

    saveEffort(req, function(err, collection) {
        if (err) {
            console.log(err);
            process.exit(1);
        }
         res.send("Success");
    });

};
