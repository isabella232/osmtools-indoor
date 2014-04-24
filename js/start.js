var layers = {};

layers.attrib = ' &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

layers.osmfr = new L.tileLayer(
    'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    { attribution: layers.attrib, maxZoom: 22, maxNativeZoom: 20, opacity:0.5 }); 
layers.osm = new L.tileLayer(
    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: layers.attrib, maxZoom: 18, opacity:0.8 });

/**
 * INIT
 * -----------------------------------------------------------------------------
 */
var map = {};
$(document).ready(function() {
    map = L.map('map', {
        center: [localStorage['indoor-lat'] !== undefined ? localStorage['indoor-lat'] : 50.60986,
                localStorage['indoor-lng'] !== undefined ? localStorage['indoor-lng'] : 3.13809],
        zoom: localStorage['indoor-zoom'] !== undefined ? localStorage['indoor-zoom'] : 10,
        layers: [layers.osmfr, api.layer.outlines],
        minZoom: 3,
        attributionControl: true
    });
    L.control.scale().addTo(map);
    map.query = L.control.requery();
    map.query.addTo(map);
    
    new L.Hash(map);
    //$(".leaflet-control-zoom").append( $("#map-loading") );
    
    /*
     * Events
     */
    map.on('moveend', function(e){
      localStorage['indoor-lat'] = map.getCenter().lat;
      localStorage['indoor-lng'] = map.getCenter().lng;
      localStorage['indoor-zoom'] = map.getZoom();
      api.query();
    });
       
    $('#about').popover({
        trigger: 'manual',
        position: 'bottom',
        html : true
    }).click(function(evt) {
        evt.stopPropagation();
        $(this).popover('show');
    });
    $('html').click(function() {
        $('#about, #contact, #show').popover('hide');
    });
    
    /*
     * Start
     */
    map.layer = 1; //1=outdoor, 2=indoor
    api.query();
    
    $('#indoor-escape').click(function() {
      api.loadShell();
      $('#indoor-navigation').hide();
    });
    
/**
 * ONCLICK
 * -----------------------------------------------------------------------------
 */   
    //Exit fullscreen
    $("#grave-window-link").click(function() {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
    });
       
    $("#indoor-categories").change(function() {
        api.building.currentType = $(this).children(":selected").attr("value");
        api.building.drawLevel(api.building.currentLevel);
        //console.log(api.building.currentType);
    });
});
