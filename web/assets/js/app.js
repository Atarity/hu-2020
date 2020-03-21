var app = {

    init: function() {

        app.btn.get();
        app.ui.bind();

    },

    ui: {

        screen: function(name) {

            $('.screen').hide();
            $('.screen[data-name="'+name+'"]').fadeIn();

        },

        bind: function() {

            $('.btn-form form').submit(function() {

                var data = $(this).serializeObject();

                app.btn.config(app.btn.currentId, data, function() {

                    app.ui.screen("main");
                    app.btn.get();

                });

            });

            $('span.back').click(function() {

                app.ui.screen("main");

            });

            $('.coord-picker').click(function() {

                app.ui.screen("map");

                if (!app.map.inited) {

                    $('#map').css({
                        width: $(window).width() + "px",
                        height: $(window).height() + "px",
                    });

                    app.map.inited = true;
                    app.map.init($('#map')[0]);
                }

            });

            
        },

    },

    btn: {

        currentId: null,

        get: function() {

            console.log('get btns');

            app.api.query('objects', null, function(data) {

                app.objects = data;

                var ul = $('.btn-list ul');
                $(ul).html('');

                for(n in data) {

                    var obj = data[n];
                    $(ul).append('<li class="animated fadeInLeft" data-battery="100%" data-status="online" data-n="'+n+'" data-id="'+obj._id+'"><span>' + obj.name + '</span></li>');  

                }

                $(ul).find('li').click(function() {

                    var n   = $(this).data("n");
                    var obj = app.objects[n];

                    app.btn.show(obj);

                });

            });

        },

        show: function(obj) {

            app.btn.currentId = obj._id;

            var wrap = $('.btn-form');

            $('input[name="name"]', wrap).val(obj.name);

            app.ui.screen("config");

        },

        config: function(id, data) {

            console.log('btn config, id ' + id);

            app.api.query('objects/'+id, data, function(data) {

                console.log(data);

            }); 

        },

    },

    map: {

        apikey: 'RHEptRRO0kG--dJq3mF3JTqVVHtDUBZFvGW0uoWq4UM',
        lng: 'ru-RU',        
        center: { lng: 53.2323987, lat: 56.8618626},
        inited: false,

        icons: {
            main: new H.map.Icon('<svg width="80" height="25" xmlns="http://www.w3.org/2000/svg"><rect stroke="white" fill="#1b468d" x="1" y="1" width="80" height="25" /><text x="40" y="18" font-size="12pt" font-family="Arial" font-weight="bold" text-anchor="middle" fill="white">кнопка ●</text></svg>')
        },

        init: function(el) {

            this.platform = new H.service.Platform({
                'apikey': this.apikey
            });

            this.defaultLayers = this.platform.createDefaultLayers();

            this.obj = new H.Map(el,
            this.defaultLayers.vector.normal.map,
            {
                zoom: 15,
                center: this.center
            });

            this.ui = H.ui.UI.createDefault(this.obj, this.defaultLayers, this.lng);

        },

        marker: function(coords, icon) {

            console.log(coords);

            icon   = icon || {icon: this.icons.main};
            marker = new H.map.Marker(coords, icon);

            this.obj.addObject(marker);

        },

    },

    api: {

        query: function(endpoint, data, callback) {

            data = data || null;
            callback = callback || function() {};

            var param = {
                method: 'POST',
                url: 'api.php',
                dataType: "json",
                data: {endpoint: endpoint},
            };

            if (data) { param.data.data = data; }

            $.ajax(param).done(callback);

        }

    }

}


$(document).ready(function() {  app.init(); });

!function(e,i){if("function"==typeof define&&define.amd)define(["exports","jquery"],function(e,r){return i(e,r)});else if("undefined"!=typeof exports){var r=require("jquery");i(exports,r)}else i(e,e.jQuery||e.Zepto||e.ender||e.$)}(this,function(e,i){function r(e,r){function n(e,i,r){return e[i]=r,e}function a(e,i){for(var r,a=e.match(t.key);void 0!==(r=a.pop());)if(t.push.test(r)){var u=s(e.replace(/\[\]$/,""));i=n([],u,i)}else t.fixed.test(r)?i=n([],r,i):t.named.test(r)&&(i=n({},r,i));return i}function s(e){return void 0===h[e]&&(h[e]=0),h[e]++}function u(e){switch(i('[name="'+e.name+'"]',r).attr("type")){case"checkbox":return"on"===e.value?!0:e.value;default:return e.value}}function f(i){if(!t.validate.test(i.name))return this;var r=a(i.name,u(i));return l=e.extend(!0,l,r),this}function d(i){if(!e.isArray(i))throw new Error("formSerializer.addPairs expects an Array");for(var r=0,t=i.length;t>r;r++)this.addPair(i[r]);return this}function o(){return l}function c(){return JSON.stringify(o())}var l={},h={};this.addPair=f,this.addPairs=d,this.serialize=o,this.serializeJSON=c}var t={validate:/^[a-z_][a-z0-9_]*(?:\[(?:\d*|[a-z0-9_]+)\])*$/i,key:/[a-z0-9_]+|(?=\[\])/gi,push:/^$/,fixed:/^\d+$/,named:/^[a-z0-9_]+$/i};return r.patterns=t,r.serializeObject=function(){return new r(i,this).addPairs(this.serializeArray()).serialize()},r.serializeJSON=function(){return new r(i,this).addPairs(this.serializeArray()).serializeJSON()},"undefined"!=typeof i.fn&&(i.fn.serializeObject=r.serializeObject,i.fn.serializeJSON=r.serializeJSON),e.FormSerializer=r,r});