var callback;
(function() {
    jive.tile.onOpen(function(config, options) {
        gadgets.window.adjustHeight();
        
        //TODO  remove this .this is heck .. setting selected metro as currently loaded group/space id .
//       jive.tile.getContainer(function(container) {
//           $('#selectedValue').val(container.id);
//           alert($('#selectedValue').val());
//           $('#selectedValue').text(container.displayName);
//          });
         
         //end - heck 

        // TODO - select previously configured Metro

        if (typeof config === "string") {
            config = JSON.parse(config);
        }
         var json = config || {
                "metroConfig":{"metroId":$("#metroId").val(),"displayName":$("#metroId").title}
            };

        //TODO static data and function just for testing . Need to use above commented code .
        $("#btn_submit").click(function() {
            config["metroConfig"] = {"metroId":$("#metroId").val(),"displayName":$("#metroId option:selected").html()};
            jive.tile.close(config, {});
            gadgets.window.adjustHeight(300);
        });
        
    });
})();
