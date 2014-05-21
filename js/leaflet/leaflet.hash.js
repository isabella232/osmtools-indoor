(function(window) {
    var HAS_HASHCHANGE = (function() {
        var doc_mode = window.documentMode;
        return ('onhashchange' in window) &&
            (doc_mode === undefined || doc_mode > 7);
    })();
    
    L.Hash = function(map) {
        this.onHashChange = L.Util.bind(this.onHashChange, this);
    
        if (map) {
            this.init(map);
        }
    };
    
    L.Hash.prototype = {
        map: null,
        lastHash: null,
    
        parseHash: function(hash) {
            if(hash.indexOf('#') == 0) {
                hash = hash.substr(1);
            }
            var args = hash.split("&");
            for(var i in args) {
              if(args[i].search("lat=") != -1) var lat = parseFloat(args[i].substring(4,args[i].length));
              if(args[i].search("lon=") != -1) var lon = parseFloat(args[i].substring(4,args[i].length));
              if(args[i].search("z=") != -1) var zoom = parseInt(args[i].substring(2,args[i].length));
              if(args[i].search("room=") != -1) var room = args[i].substring(5,args[i].length);
            }
            
            if (isNaN(zoom) ){     	
              zoom = 18;
            }	
            if ( isNaN(lat) || isNaN(lon) ) {
              return false;
            }
            else {
              return {
                center: new L.LatLng(lat, lon),
                zoom: zoom,
                room: room 
              };
            }
        },
    
        formatHash: function(map) {
            var center = map.getCenter(),
                zoom = map.getZoom(),
                precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
                if (api.room != null) 
                	return "#lat=" + center.lat.toFixed(precision) + "&lon=" + center.lng.toFixed(precision) + "&z=" + zoom + "&room="+ api.room ;
                else
           			return "#lat=" + center.lat.toFixed(precision) + "&lon=" + center.lng.toFixed(precision) + "&z=" + zoom;
            /*    
                    + [zoom,
                center.lat.toFixed(precision),
                center.lng.toFixed(precision)
            ].join("/");
             */
        },
    
        init: function(map) {
            this.map = map;
            
            this.map.on("moveend", this.onMapMove, this);
            
            // reset the hash
            this.lastHash = null;
            this.onHashChange();
    
            if (!this.isListening) {
                this.startListening();
            }
        },
    
        remove: function() {
            this.map = null;
            if (this.isListening) {
                this.stopListening();
            }
        },
        
        onMapMove: function(map) {
            // bail if we're moving the map (updating from a hash),
            // or if the map has no zoom set
            
            if (this.movingMap || this.map.getZoom() === 0) {
                return false;
            }
            
            var hash = this.formatHash(this.map);
            if (this.lastHash != hash) {
                location.replace(hash);
                this.lastHash = hash;
            }
        },
    
        movingMap: false,
        update: function() {
            var hash = location.hash;
            if (hash === this.lastHash) {
                // console.info("(no change)");
                return;
            }
            var parsed = this.parseHash(hash);
            if (parsed) {
                // console.log("parsed:", parsed.zoom, parsed.center.toString());
                this.movingMap = true;
                
                if(parsed.room != null && parsed.room != ""){
                	api.room = parsed.room;
                	this.map.setView(parsed.center, parsed.zoom);
                	api.geosearch(parsed.center.lat,parsed.center.lng,parsed.room)
                }else{
                   if (api.room != null) {
                     map.closePopup();
                     api.layer.reloadBuilding(true);
                     api.room = null;
                   }
                   
                   this.map.setView(parsed.center, parsed.zoom);
                }
                this.movingMap = false;
                //alert(parsed.room);
            } else {
                // console.warn("parse error; resetting:", this.map.getCenter(), this.map.getZoom());
                this.onMapMove(this.map);
            }
        },
    
        // defer hash change updates every 100ms
        changeDefer: 100,
        changeTimeout: null,
        onHashChange: function() {
            // throttle calls to update() so that they only happen every
            // `changeDefer` ms
            if (!this.changeTimeout) {
                var that = this;
                this.changeTimeout = setTimeout(function() {
                    that.update();
                    that.changeTimeout = null;
                }, this.changeDefer);
            }
        },
    
        isListening: false,
        hashChangeInterval: null,
        startListening: function() {
            if (HAS_HASHCHANGE) {
                L.DomEvent.addListener(window, "hashchange", this.onHashChange);
            } else {
                clearInterval(this.hashChangeInterval);
                this.hashChangeInterval = setInterval(this.onHashChange, 50);
            }
            this.isListening = true;
        },
    
        stopListening: function() {
            if (HAS_HASHCHANGE) {
                L.DomEvent.removeListener(window, "hashchange", this.onHashChange);
            } else {
                clearInterval(this.hashChangeInterval);
            }
            this.isListening = false;
        }
    };
})(window);
