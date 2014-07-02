(function($, _) {
    jive.tile.onOpen(function(currentConfig, options) {
        var tileDefinitions = options.definitions;

        var $list = $('#list').sortable({ axis: 'y', placeholder: 'ui-state-highlight' });

        function addPerson(person) {
            var $li = $('<li class="listItem clearfix" style="background: #f2f8ff url(/resources/embeddedexperiences/tiles/images/dragHandles.png) no-repeat 5px 7px;" />');
            $li.data('item', person);
            $('<img class="jive-ext-icon-16 icn" height="16" width="16" />').attr('src', person.thumbnailUrl).appendTo($li);
            $('<span class="j-personName"/>').html(person.displayName).appendTo($li);
            $('<a class="j-delete js-delete" href="#">Delete</a>').appendTo($li);
            $li.appendTo($list);

            refreshList();
        }

        $('#addToList').bind('click', function(e) {
            e.preventDefault();

            osapi.jive.corev3.search.requestPicker({
                excludeContent: true,
                excludePlaces:  true,
                excludePeople:  false,
                success: function(entity) {
                    addPerson(entity);
                },
                error: function(err) { /* Don't need to do anything */ }
            });
            refreshList();
        });

        // Save button
        $('.js-button-done').bind('click', function() {
            onSave($('#volunteerForm'));
        });

        function onSave() {
            osapi.http.post({
                "href" : "{{{host}}}/volunteer-tools/effort",
                "body" : getJSonData(),
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
        }
        
        var getJSonData = function() {
            var identifiers = jive.tile.getIdentifiers();
            var userId = identifiers['viewer'];
            return {
                'userId' : userId,
                'metroId' : $("#metroId").val(),
                'businessUnitId' : $("#businessUnitId").val(),
                'accountId' : $("#accountId").val(),
                'charitableOrganizationId' : $("#charitableOrganizationId").val(),
                'date' : $("#date").val(),
                'time' : $("#time").val(),
                'causes' : $("#causes").val(),
                'whoElseVolunteerId' : $("#whoElseVolunteerId").val(),
                'whatYouDid' : $("#whatYoudid").val()
            };

        };

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
                    "message" : "The form has been saved."
                });
            }, 2000);
        }

        gadgets.window.adjustHeight();
        gadgets.window.adjustWidth(800);

    });

})(jQuery, window._);