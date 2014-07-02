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

var getBlogPostJSON = function() {

    osapi.jive.corev3.places.get({"type":"group", "uri": metroInfo[0].placeURI}).execute(function(response) {
        //alert(JSON.stringify(response.resources.blog.ref));
        var metroBlogURI = response.resources.blog.ref;
        var subject='@numberofvolunteers volunteers from @metro supported @causes';
        subject = subject.replace("@numberofvolunteers", effort.whoElseInfo.length + 1);
        subject = subject.replace("@metro", effort.metroInfo[0].displayName);
        subject = subject.replace("@causes", effort.causes);

//        var whoElse='';
//        for(i=0;i<whoElseInfo.length;i++){
//            if (i > 0 && (i+1)==whoElseInfo.length) {
//                whoElse.concat(" and ");
//            }else if (i > 0){
//                whoElse.concat(",");
//            }
//            whoElse = whoElse.concat(effort.whoElseInfo[i].displayName);
        }

//        subject = subject.concat(whoElse);
//        subject = subject.concat(" spent ".concat($("#time").val()));
//        subject=subject.concat(" hours supporting ").concat($("#causes").val()).concat(" at ".concat($("#charitableOrganizationId").val()));

        var blogJson = {
            "type" : "post",
            "subject" : subject,
            "parent" :     metroBlogURI,
            "content" : {
                "type" : "text/html",
                "text" : $("#whatYouDid").val()
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

        //alert('blog Json :'+ JSON.stringify(blogJson));
        osapi.jive.corev3.posts.create(blogJson).execute(function (response){
            alert(JSON.stringify(response));
            return response.permalink;
            // TODO return URI of created content item
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
                var contentURI = getBlogPostJSON();
//                setTimeout(function() {
//                    jive.tile.close(config, {});
//                }, 1000);
                osapi.http.post({
                    'href' : $("#volunteerForm").attr('action'),
                    'body' : getJSonData(contentURI),
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