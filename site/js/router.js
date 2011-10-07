timotuominen.Router = Backbone.Router.extend({
    routes: {
        ":fragment": "handler"
    },

    handler: function (fragment) {
        $.ajax("site/sections/"+fragment+".html", {
            success: function (data) {
                $("#loaded-content").html(data);
            }
        });
    }
});