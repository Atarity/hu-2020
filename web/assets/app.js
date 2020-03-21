var app = {

    init: function() {

        this.map.init($('#map')[0]);

    },

    btn: {

        config: function(id, data) {

            console.log('btn config, id ' + id);
            
            app.api.query('objects/'+id, data, function(data) {

                console.log(data);

            }); 

        }   

    },

    map: {

        apikey: 'RHEptRRO0kG--dJq3mF3JTqVVHtDUBZFvGW0uoWq4UM',
        lng: 'ru-RU',        
        center: { lng: 53.2323987, lat: 56.8618626},

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

        getObjects: function() {

            app.api.query("objects", null, function(data) {

                for(n in data) {

                    var obj = data[n];

                    if (obj.hasOwnProperty("state")) {

                        var s = obj.state;
                        if (s.hasOwnProperty("lat")) {

                            app.map.marker({
                                lat: s.lat,
                                lng: s.lon
                            });

                        }

                    }   

                }

            });

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