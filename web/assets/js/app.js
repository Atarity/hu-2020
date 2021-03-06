var app = {

    init: function() {

        app.btn.get();
        app.ui.bind();

    },

    ui: {

        currentScreen: null,

        screen: function(name) {

            $('.screen').hide();
            $('.screen[data-name="'+name+'"]').fadeIn();

            this.currentScreen = name;

        },

        bind: function() {

            $('.btn-form form').submit(function() {

                var data = $(this).serializeObject();

                app.btn.config(app.btn.currentId, data, function() {

                    app.ui.screen("main");
                    app.btn.get();

                });

                return false;

            });

            $('span.back').click(function() {

                if (app.ui.currentScreen == "map") {
                    app.ui.screen("config");
                } else {
                    app.ui.screen("main");
                }

            });

            $('.coord-picker').click(function() {

                app.map.clear();
                
                var coords = {};

                var wrap   = $('.btn-form');
                coords.lat = $('input[name*="lat"]', wrap).val();
                coords.lng = $('input[name*="long"]', wrap).val();

                if (coords.lat && coords.lng) {

                    app.map.marker(coords, true);
                    app.map.obj.setCenter(coords);

                } else {


                    app.map.geolocation(function(coord) {

                        var coords = {
                            lat: coord.latitude, 
                            lng: coord.longitude
                        };

                        app.map.marker(coords, true);
                        app.map.obj.setCenter(coords);

                    });

                }

                app.ui.screen("map");
                app.map.obj.getViewPort().resize();

            });

            $('.btn-form select').change(function() {

                var url = $('.btn-form input[name="urlCustom"]').parent();
                if ($(this).val() == "") {

                    $(url).show();

                } else {

                    $(url).hide();

                }

            });

            $('#map').css({
                width: $(window).width() + "px",
                height: $(window).height() + "px",
            });

            setTimeout(function() {

                $('.logo span:eq(0)').text('K');
                $('.logo span:eq(1)').text('N');
                $('.logo span:eq(2)').text('PK');
                $('.logo span:eq(3)').text('🔵');

                $('.logo').addClass('animated rubberBand');

            }, 1500);

            app.map.init($('#map')[0]);

        },

    },

    btn: {

        currentId: null,
        currentModel: null,

        get: function() {

            console.log('get btns');

            app.api.query('objects', null, function(data) {

                app.objects = data;

                var ul = $('.btn-list ul');
                $(ul).html('');

                for(n in data) {

                    var obj     = data[n];
                    var battery = parseInt( (obj.hasOwnProperty("state") && obj.state.hasOwnProperty("bat-charge")) ? obj.state['bat-charge'] : 0);
                    var status  = battery ? "online" : "offline";

                    if (obj.hasOwnProperty("state") && obj.state.hasOwnProperty("online")) {

                        status  = obj.state.online ? "online" : "offline";

                    }

                    $(ul).append('<li data-battery="'+battery+'" data-status="'+status+'" data-n="'+n+'" data-id="'+obj._id+'"><span>' + obj.name + '</span></li>');  

                }

                $(ul).addClass('animated slideInDown');

                $(ul).find('li').click(function() {

                    var n   = $(this).data("n");
                    var obj = app.objects[n];

                    app.btn.show(obj);

                });

            });

        },

        show: function(obj) {

            app.btn.currentId    = obj._id;
            app.btn.currentModel = obj.model;

            var wrap    = $('.btn-form');
            var battery = parseInt( (obj.hasOwnProperty("state") && obj.state.hasOwnProperty("bat-charge")) ? obj.state['bat-charge'] : 0);

            $('input[name="name"]', wrap).val(obj.name);
            $('.battery input', wrap).val(battery + '%');
            $('.battery span', wrap).css({width: battery + '%'});

            if (obj.hasOwnProperty("state") && obj.state.hasOwnProperty("lat")) {
                $('input[name*="lat"]', wrap).val(obj.state.lat);
            }

            if (obj.hasOwnProperty("state") && obj.state.hasOwnProperty("long")) {
                $('input[name*="long"]', wrap).val(obj.state.long);
            }
            
            var urlTpl = "";
            if (obj.hasOwnProperty("state") && obj.state.hasOwnProperty("url-template")) {
                urlTpl = obj.state["url-template"];
            }

            $('select[name*="url"]')
            .val(urlTpl)
            .trigger('change');

            app.ui.screen("config");

        },

        config: function(id, data, callback) {

            console.log('btn config, id ' + id);
            console.log(data);

            var params    = data.params;
            var urlCustom = data.urlCustom;

            if (params.payload.url == "") {
                params.payload.url = urlCustom;
            }

            var payload = JSON.stringify(params.payload);

            delete data.params;
            delete data.urlCustom;


            app.api.query('objects/'+id, data, callback); 
            app.api.query('models/'+app.btn.currentModel+'/nodes/configure', {
                params: {payload: payload}
            }, function() {

                app.api.query('objects/'+id+'/commands/configure', {"url": ""});

            }); 

        },

    },

    map: {

        apikey: 'RHEptRRO0kG--dJq3mF3JTqVVHtDUBZFvGW0uoWq4UM',
        lng: 'ru-RU',        
        center: { lng: 53.2323987, lat: 56.8618626},
        inited: false,

        init: function(el) {

            this.platform = new H.service.Platform({
                'apikey': this.apikey
            });

            this.defaultLayers = this.platform.createDefaultLayers();

            this.obj = new H.Map(el,
            this.defaultLayers.vector.normal.map,
            {
                zoom: 12,
                center: this.center,
                pixelRatio: window.devicePixelRatio || 1
            });

            window.addEventListener('resize', () => this.obj.getViewPort().resize());

            this.behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(this.obj));
            this.ui       = H.ui.UI.createDefault(this.obj, this.defaultLayers, this.lng);

        },

        marker: function(coords, draggable) {

            console.log('marker add');
            console.log(coords);

            draggable = draggable || false;

            marker = new H.map.Marker(coords, {
                volatility: true
            });

            if (draggable) {

                marker.draggable = true;
                behavior = app.map.behavior;

                app.map.obj.addEventListener('dragstart', function(ev) {
                    var target = ev.target,
                        pointer = ev.currentPointer;
                    if (target instanceof H.map.Marker) {
                      var targetPosition = app.map.obj.geoToScreen(target.getGeometry());
                      target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y);
                      behavior.disable();
                    }
                }, false);


                app.map.obj.addEventListener('dragend', function(ev) {
                    
                    var target = ev.target;
                    if (target instanceof H.map.Marker) {
                      behavior.enable();
                    }

                    if (target && target.hasOwnProperty("b") && target.b.hasOwnProperty("lat")) {

                        var wrap = $('.btn-form');
                        $('input[name*="latitude"]', wrap).val(target.b.lat.toFixed(3));
                        $('input[name*="longitude"]', wrap).val(target.b.lng.toFixed(3));

                    }

                }, false);

                app.map.obj.addEventListener('drag', function(ev) {
                    var target = ev.target,
                        pointer = ev.currentPointer;
                    if (target instanceof H.map.Marker) {
                      target.setGeometry(app.map.obj.screenToGeo(pointer.viewportX - target['offset'].x, pointer.viewportY - target['offset'].y));
                    }
                }, false);

            }

            this.obj.addObject(marker);

        },

        clear: function() {
            app.map.obj.removeObjects( app.map.obj.getObjects());
        },

        geolocation: function(callback) {

            console.log("navigator.geolocation");

            if(navigator.geolocation) {
                
                navigator.geolocation.getCurrentPosition(position => {
                        
                    callback.call(this, position.coords);

                });

            } else {
                


            }

        }

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