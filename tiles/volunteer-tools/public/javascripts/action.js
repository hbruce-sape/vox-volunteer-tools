var userInfo = [];
var whoElseInfo = [];
var metroInfo = [];
var tileContainer;
var tileParent ;

var getJSonData = function(contentURI) {
    return {
        'userInfo' : userInfo,
        'metroInfo' : metroInfo,
        'businessUnitId' : $("#businessUnitId").val(),
        'accountId' : $("#accountId").val(),
        'charitableOrganizationId' : $("#charitableOrganizationId").val(),
        'date' : $("#date").val(),
        'time' : $("#time").val(),
        'causes' : $("#causes").val(),
        'whoElseInfo' : whoElseInfo,
        'whatYouDid' : $("#whatYouDid").val(),
        'contentURI' : contentURI
    };

};

// TODO Clean up using callback methods
var getBlogPostJSON = function() {

    osapi.jive.corev3.places.get({"type":"group", "uri": metroInfo[0].placeURI}).execute(function(response) {
        var metroBlogURI = response.resources.blog.ref;

        var subject = '@numberofvolunteers volunteers from @metro supported @causes';
        subject = subject.replace("@numberofvolunteers", whoElseInfo.length + 1);
        subject = subject.replace("@metro", metroInfo[0].displayName);
        subject = subject.replace("@causes", $("#causes").val());

        var content = "<body><h3>@numberofvolunteers volunteers from @businessunit dedicated @hours hours of their time on @date in @metro for @charitableorganization, an organization that supports @causes</h3><p /><h3>Hall of Fame</h3><ul>@volunteers</ul><p /><h3>What They Did</h3><p>@whattheydid</p></body>";
        content = content.replace("@numberofvolunteers", whoElseInfo.length + 1);
        content = content.replace("@businessunit", $("#businessUnitId").val());
        content = content.replace("@metro", metroInfo[0].displayName);
        content = content.replace("@causes", $("#causes").val());
        content = content.replace("@hours", $("#time").val());
        content = content.replace("@date", $("#date").val());
        content = content.replace("@charitableorganization", $("#charitableOrganizationId").val());

        // TODO Understand why these don't provide readily accessible user links
        var volunteerli = "<li><a class=\"jive-link-profile-small jive_macro jive_macro_user\" href=\"javascript:;\" jivemacro=\"user\" data-type=\"person\" data-objecttype=\"3\" data-id=\"@userid\" ___default_attr=\"@userid\" data-orig-content=\"@username\">@username</a></li>"

        var volunteers = volunteerli.replace(/@username/g, userInfo[0].userDisplayName);
        volunteers = volunteers.replace(/@userid/g, userInfo[0].userId);
        for(i = 0; i < whoElseInfo.length; i++){

            var volunteer = volunteerli.replace(/@username/g, whoElseInfo[i].displayName);
            volunteer = volunteer.replace(/@userid/g, whoElseInfo[i].userId);
            volunteers = volunteers.concat(volunteer);
        }
        content = content.replace("@volunteers", volunteers);
        content = content.replace("@whattheydid", $("#whatYouDid").val());


        var blogJson = {
            "type" : "post",
            "subject" : subject,
            "parent" :     metroBlogURI,
            "content" : {
                "type" : "text/html",
                "text" : content
            },
            "author" : {
                "name" : {
                    "formatted" : userInfo[0].userDisplayName
                },
                "type" : "person",
                "displayName" : userInfo[0].userDisplayName,
                "id" : userInfo[0].userId
            }
        };

        osapi.jive.corev3.posts.create(blogJson).execute(function (response){

            osapi.http.post({
                'href' : $("#volunteerForm").attr('action'),
                'body' : getJSonData(response.permalink),
                'headers' : {
                    'Content-Type' : [ 'application/json' ]
                }
            }).execute(function(response) {
                if (response.error) {
                    alertBox('Error', "Not saved!.");
                } else {
                    alertBox('success', "The form has been saved.");
                  setTimeout(function() {
                      jive.tile.close(config, {});
                  }, 1000);

                }
            });            

         });  
    });
 

     
};

jive.tile.onOpen(function(config, options) {

            config = JSON.parse(JSON.parse(config));
            console.log("config:", config);
            console.log("options:", options);

            var tileDefinitions = options.definitions;
             
                
                
            var $place = $('#place');
            function addPlace(place) {
                ($place).html(place.name);
                metroInfo.push({
                    "displayName" : place.name,
                    "metroId" : place.id,
                    "placeURI" :place.resources.self.ref
                });
            }
            $('#addPlace').bind('click', function(e) {
                e.preventDefault();

                osapi.jive.corev3.search.requestPicker({
                    excludeContent : true,
                    excludePlaces : false,
                    excludePeople : true,
                    success : function(entity) {

                        addPlace(entity);
                    },
                    error : function(err) { /* Don't need to do anything */
                    }
                });
            });

            var $list = $('#list').sortable({
                axis : 'y',
                placeholder : 'ui-state-highlight'
            });

            function addPerson(person) {
                var $li = $('<li class="listItem clearfix" style="background: #f2f8ff url(/resources/embeddedexperiences/tiles/images/dragHandles.png) no-repeat 5px 7px;" />');
                $li.data('item', person);
                $('<img class="jive-ext-icon-16 icn" height="16" width="16" />')
                        .attr('src', person.thumbnailUrl).appendTo($li);
                $('<span class="j-personName"/>').html(person.displayName)
                        .appendTo($li);
                $('<a class="j-delete js-delete" href="#">Delete</a>')
                        .appendTo($li);
                $li.appendTo($list);
                whoElseInfo.push({
                    "displayName" : person.displayName,
                    "userId" : person.id,
                    "userURI":person.resources.self.ref
                });

                refreshList();
            }

            $('#addToList').bind('click', function(e) {
                e.preventDefault();

                osapi.jive.corev3.search.requestPicker({
                    excludeContent : true,
                    excludePlaces : true,
                    excludePeople : false,
                    success : function(entity) {
                        addPerson(entity);
                    },
                    error : function(err) { /* Don't need to do anything */
                    }
                });
                refreshList();
            });

            function refreshList() {
                if ($list.children().length === 0) {
                    $(
                            '<li class="j-empty js-empty font-color-meta-light">No list items</li>')
                            .css('opacity', 0).appendTo($list).animate({
                                opacity : 1
                            }, 'slow');
                } else if ($list.children(':not(.js-empty)').length > 0) {
                    $list.children('.js-empty').remove();
                }

                window.setTimeout(function() {
                    gadgets.window.adjustHeight();
                }, 100);
            }

            // Listen for delete events
            $list.bind('click', function(e) {
                e.preventDefault();

                if ($(e.target).is('.js-delete')) {
                    $(e.target).closest('li').fadeOut('slow').promise().done(
                            function() {
                                $(this).remove();
                                refreshList();
                            });
                }
            });

            // Save button
            $('.js-button-done').bind('click', function() {
                getBlogPostJSON();

                gadgets.window.adjustWidth();
                gadgets.window.adjustHeight();

            });

            gadgets.window.adjustHeight();
            gadgets.window.adjustWidth(800);
        });

function alertBox(type, message) {
    if (!type) {
        type = 'success';
    }

    var alertBox = $(".alert-area").removeClass().addClass('alert-' + type)
            .text(message).fadeIn();
    gadgets.window.adjustHeight();

    setTimeout(function() {
        alertBox.fadeOut();
        alertBox.removeClass().addClass('alert-area');
        jive.tile.close({
            "message" : "Your volunteer effort has been saved!"
        });
    }, 2000);
}
function init() {
    $( "#date" ).datepicker();
    osapi.jive.corev3.people.getViewer({}).execute(function(response) {
        userInfo.push({
            "userId" : response.id,
            "userDisplayName" : response.displayName,
            "userURI":response.resources.self.ref
        });
    });

}
gadgets.util.registerOnLoadHandler(init);