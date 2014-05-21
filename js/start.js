var layers = {};

layers.attrib = ' &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

layers.osmfr = new L.tileLayer(
    'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    { attribution: layers.attrib, maxZoom: 22, maxNativeZoom: 20, opacity:0.5 }); 
layers.osm = new L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: layers.attrib, maxZoom: 22,  maxNativeZoom: 18, opacity:0.8 });

/**
 * INIT
 * -----------------------------------------------------------------------------
 */
var map = {};
var storage ;
$(document).ready(function() {
  try {
    storage = window.localStorage ;
  } catch(e) {
    storage = Array();
  }

  map = L.map('map', {
        center: [storage['indoor-lat'] !== undefined ? storage['indoor-lat'] : 50.60986,
                storage['indoor-lng'] !== undefined ? storage['indoor-lng'] : 3.13809],
        zoom: storage['indoor-zoom'] !== undefined ? storage['indoor-zoom'] : 10,
        layers: [layers.osm, api.layer.outlines],
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
      storage['indoor-lat'] = map.getCenter().lat;
      storage['indoor-lng'] = map.getCenter().lng;
      storage['indoor-zoom'] = map.getZoom();
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
