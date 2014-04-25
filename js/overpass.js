var api = {};
api.layer = {};

api.layer.building = new L.LayerGroup();
api.layer.decoration = new L.LayerGroup();
api.layer.outlines = new L.LayerGroup();    //full outline
api.layer.pins = new L.LayerGroup();        //pin only

api.shells = new Array();       //list of outlines
api.all_outlines = new Array();       //list of outlines
api.building;                   //building

/**
 * API QUERYS
 * -----------------------------------------------------------------------------
 */

api.tagShell = function() {
  var boundary = '';
// Bounding boxes just doesn't work in densely mapped area...
// So except when zoomed, just get the whole world !
  if (map.getZoom() > 13) {
    var b = map.getBounds();
    boundary = '(' + b.getSouthEast().lat + ',' + b.getNorthWest().lng + ',' +
            b.getNorthWest().lat + ',' + b.getSouthEast().lng + ')';
  }
  return 'relation["type"="building"]' + boundary + ';relation(r)["type"="level"];way(r:"shell")->.x; (rel(bw.x);rel(br);node(w.x);.x;);out;';
};

api.tagBuilding = function(id) {
  return text = '(' +
          'relation(' + id + ');>>->.rels;>;' +
          ');' +
          'out;';
};
/**
 * QUERY
 * -----------------------------------------------------------------------------
 */
 
api.tagRoom = function(latitude, longitude, salle){
 return "(way(around:100,"+latitude+","+longitude+")['buildingpart'='room']['ref'='"+salle+"']->.a;.a >;.a <<;);"+
"out body qt;" ;
};

api.geosearch = function(latitude, longitude, salle) {
  
  //Exec Request
  $.ajax({
    url: "http://api.openstreetmap.fr/oapi/interpreter?data=" + encodeURIComponent(api.tagRoom(latitude, longitude, salle)),
    type: 'GET',
    crossDomain: true,
    success: function(data) {
      var result = api.parseRoom(latitude, longitude, salle, data);
      console.log(result);
      if (result)
        api.loadBuilding(result.building, result.level, result.room);
    }
  });
  
};
api.parseRoom = function(latitude, longitude, salle, data){
  var idbuilding;
  var idlevel;
  var idway;
  var nbway = 0;
  //Compter le nombre de chemin
  $(data).find('way').each(function() {
  	nbway = nbway+1;
  });
  
  //S'il existe plusieurs chemins, sélectionner le plus proche
  //...sinon :
  if(nbway > 1){
  
  }else{
     idway = salle;
      $(data).find('relation').each(function() {
       var id = $(this).attr("id")
       $(this).find('tag').each(function() {
         if ( $(this).attr("k") ==  "type") {
           if ($(this).attr("v") == "building")
             idbuilding = id;
           else if ($(this).attr("v") == "level")
             idlevel = id;
         }
       });
      });
/*
 	 //Trouver le idway  
 	 //FIND WAY
 	 $(data).find('way').each(function() {
 	   idway = $(this).attr("ref");
 	 });
  
 	//Trouver le level contenant cet idway
  	//FIND LEVEL
  	$(data).find('relation').each(function() {
    	$(this).find('member').each(function() {
          if ($(this).attr("ref") == idway && $(this).attr("role") == "shell")
          idlevel = $(this).attr("ref");
        });
    });
 	
  	//Trouver le building qui contient ce level
 	//FIND BUILDING
 	$(data).find('relation').each(function() {
 	   $(this).find('member').each(function() {
  	    if ($(this).attr("type") == "relation" && /^level/.test($(this).attr("role"))) 
  	      idbuiliding = buildingId[$(this).attr("ref")];
 	   });
 	});
 */	
  }
  if (idway == null || idlevel == null || idbuilding == null )
    return false;
  else
    return {room: idway, level: idlevel, building: idbuilding }
}

api.layer.reloadBuilding =function(clear) {
  api.layer.removeBuilding(clear);

  map.addLayer(api.layer.building);
  if (map.getZoom() > 19) {
  map.addLayer(api.layer.decoration);
  } else {
    if (map.hasLayer(api.layer.decoration))
      map.removeLayer(api.layer.decoration);
  }
}
api.layer.removeBuilding = function(clear) {
  if (clear == true) {
      api.layer.building.clearLayers();
      api.layer.decoration.clearLayers();
  }
  if (map.hasLayer(api.layer.building)) {
    map.removeLayer(api.layer.building);
  }
  if (map.hasLayer(api.layer.decoration)) {
    map.removeLayer(api.layer.decoration);
  }
}
/**
 * QUERY
 * -----------------------------------------------------------------------------
 */
api.query = function() {
  if (map.layer === 1) {
    $('.leaflet-control-requery-info').html(translate('Click to load buildings'));
    if (map.getZoom() < 16) {
      //full outline
      map.removeLayer(api.layer.outlines);
      map.addLayer(api.layer.pins);
    } else {
      //pin only
      map.removeLayer(api.layer.pins);
      map.addLayer(api.layer.outlines);
    }
  } else if (map.layer === 2) {
    if (map.getZoom() < 16) {
      //pin only
      api.layer.removeBuilding();
      map.removeLayer(api.layer.outlines);
      map.addLayer(api.layer.pins);
    } else {
      //outline
      map.removeLayer(api.layer.pins);
      map.addLayer(api.layer.outlines);
      api.layer.reloadBuilding();
      for (var i in api.building.getLevel(api.building.currentLevel).pois)
        api.building.getLevel(api.building.currentLevel).pois[i].draw();
    }
  }
};

api.loadShell = function() {
  map.query.startAnimation();
  $('.leaflet-control-requery').fadeIn('fast');
  $('.leaflet-control-requery-info').fadeIn('fast');
  //$('#map-loading').css('display', 'block');
  //$('#map-zoominfo').css('display', 'none');

  map.layer = 1;
  api.layer.removeBuilding(true);
  map.closePopup();

  $.ajax({
    url: "http://api.openstreetmap.fr/oapi/interpreter?data=" + encodeURIComponent(api.tagShell()),
    type: 'GET',
    crossDomain: true,
    success: function(data) {
      api.parseShell(data);
      map.query.stopAnimation();
      //$('#map-loading')[0].style.display = 'none';
    }
  });
};

api.loadBuilding = function(id, idLevel, idRoom) {
  map.query.startAnimation();
  $('.leaflet-control-requery-info').fadeOut('fast');
  map.layer = 2;
  if (!map.hasLayer(api.layer.building)) {
    api.layer.building.clearLayers();
    map.addLayer(api.layer.building);
  }
  if(api.building != null && id == parseInt(api.building.id)) {
    api.loadLevelPopup(idLevel,idRoom );	  
  }
  else { 
api.layer.reloadBuilding(true);
  $.ajax({
    url: "http://api.openstreetmap.fr/oapi/interpreter?data=" + encodeURIComponent(api.tagBuilding(id)),
    type: 'GET',
    crossDomain: true,
    success: function(data) {
      //if (map.hasLayer(api.layer.outlines))
        //map.removeLayer(api.layer.outlines);
		
      if (api.all_outlines.length == 0)
        api.parseShell(data);
      api.parseBuilding(data);
      api.loadLevelPopup(idLevel,idRoom );	  
      api.layer.reloadBuilding();
      map.query.stopAnimation();
      $('.leaflet-control-requery').fadeOut('fast');
      $('.leaflet-control-requery-info').fadeOut('fast');
    }
  });
 }
}

api.loadLevelPopup = function(idLevel, idRoom){
	if(idLevel != null && idRoom != null){
      	if (map.getZoom() < 18 )
      		map.setZoom(18);
      	if (api.building.currentLevel != null && api.idToNumLevel(idLevel) == api.building.currentLevel) 
      			  	api.building.popup(idLevel,idRoom);
        else {
        	api.building.drawLevel(api.idToNumLevel(idLevel));
        	api.building.popup(idLevel,idRoom);	
        }	
      } 
}

//fonction de conversion de l'id du level en num (0,1 ...)
api.idToNumLevel = function(idLevel){
	return api.building.levels[idLevel].level ;
}



/**
 * CONTAINS
 * -----------------------------------------------------------------------------
 */
function containsId(array, object) {
  for (var i in array)
    if (array[i] == object)
      return true;
  return false;
}

/**
 * PARSING SHELL
 * -----------------------------------------------------------------------------
 */
api.parseShell = function(data) {
  var nodes = new Array();
  var outlines = new Array();
  var buildingId = new Array();
  var names = new Array();

  $(data).find('node').each(function() {
    nodes[$(this).attr("id")] = new L.LatLng($(this).attr("lat"), $(this).attr("lon"));
  });

  $(data).find('way').each(function() {
    var coords = new Array();
    $(this).find('nd').each(function() {
      coords.push(nodes[$(this).attr("ref")]);
    });
	
    outlines[$(this).attr("id")] = new building.outline(coords);
  });

  $(data).find('relation').each(function() {
    var shell, name;
    var relationId = $(this).attr("id");
    $(this).find('member').each(function() {
      if ($(this).attr("type") == "relation" && /^level/.test($(this).attr("role"))) 
        buildingId[$(this).attr("ref")] = relationId;
      if ($(this).attr("type") == "way" && $(this).attr("role") == "shell")
        shell = $(this).attr("ref");
    });
    $(this).find('tag').each(function() {
      if ($(this).attr("k") == "name")
        name = $(this).attr("v");
        names[relationId] = name;
    });

    if (shell != null && outlines[shell] != null) {
      outlines[shell].relationId = $(this).attr("id") ;
      outlines[shell].name = name;
      if (!containsId(api.shells, shell)) {
        api.shells.push(shell);
        outlines[shell].draw();
      }
    }
  });
  
  api.shells.forEach(function(sid){
    var o = outlines[sid];
    if (typeof buildingId[o.relationId] != 'undefined') {
      o.relationId = buildingId[o.relationId];
      o.name = names[o.relationId];
    } ;

    if (typeof o.relationId !== 'undefined'){
    if (typeof api.all_outlines[o.relationId] === 'undefined')
       api.all_outlines[o.relationId] = new Array() ;
    api.all_outlines[o.relationId].push(o);
}
    o.draw();
  });
}

/**
 * PARSING BUILDING
 * -----------------------------------------------------------------------------
 */
api.parseBuilding = function(data) {
  var nodes = new Array();
  var ways = new Array();
  var ways_rel = new Array();
  var relations = new Array();

  //NODES
  $(data).find('node').each(function() {
    var i = $(this).attr("id");
    nodes[i] = new L.LatLng($(this).attr("lat"), $(this).attr("lon"));

    //extra tags for doors and pois
    $(this).find('tag').each(function() {
      var key = $(this).attr("k").toLowerCase();
      var value = $(this).attr("v");
      if (key == "door")
        nodes[i].door = value;
      if (key == "entrance")
        nodes[i].entrance = value;
      if (key == "name")
        nodes[i].name = value;
      if (key == "amenity" || key == "information")
        nodes[i].poi = value;
    });
  });

  //WAYS (ROOMS)
  $(data).find('way').each(function() {
    var coords = new Array();
    $(this).find('nd').each(function() {
      coords.push(nodes[$(this).attr("ref")]);
    });

    var way = new building.room($(this).attr("id"), coords);
    way.category = "All";

    $(this).find('tag').each(function() {
      var key = $(this).attr("k").toLowerCase();
      var value = $(this).attr("v");
      if (key == "name")
        way.name = value;
      if (key == "access")
        way.access = value;
      if (key == "ref")
        way.ref = value;
      //(way.name === undefined) ? way.name = '['+value+']' : way.name = '['+value+'] '+way.name;

      if (key == "buildingpart")
        way.type = value;

      if (key == "shop" && value.match(/(bag|boutique|clothes|cosmetics|jewelry|perfumery|shoes)/))
        way.category = "Fashion";
      if (key == "shop" && value.match(/(antiques|art|bathroom_furnishing|bed|carpet|curtain|doityourself|furniture|hardware|interior_decoration|kitchen|pet)/))
        way.category = "Home";
      if (key == "shop" && value.match(/(computer|electronics|hifi|mobile_phone|photo)/))
        way.category = "Electronics";
      if ((key == "amenity" && value.match(/(pharmacy|clinic|fitness_center)/)) || (key == "shop" && value.match(/(baby_goods|beauty|chemist|hairdresser|massage|optician|organic|tattoo)/)))
        way.category = "Health";
      if (key == "shop" && value.match(/(supermarket|alcohol|bakery|beverages|butcher|convenience|deli|herbalist)/))
        way.category = "Food";
      if ((key == "amenity" && value.match(/(bureau_de_change|post_office)/)) || (key == "shop" && value.match(/(books|dry_cleaning|gift)/)) || (key == "service"))
        way.category = "Service";
      if (key == "amenity" && value.match(/(cafe|confectionery|fast_food|food_court|ice_cream|pub|restaurant)/))
        way.category = "Gastronomy";
      if (key == "shop" && value.match(/(bicycle|dive|outdoor|sports)/))
        way.category = "Sport";
      if ((key == "amenity" && value.match(/(arts_centre|cinema|theatre)/)) || (key == "leisure" && value.match(/(sports_centre)/)))
        way.category = "Entertainment";
		
	  // if(key =="amenity" && value.match(/(toilets)/))
		// way.category = "WC" ;
	  // if(key =="buildingpart" && value.match(/(verticalpassage)/))
		// way.category = "Stairs" ;
		
	  if(key =="buildingpart:verticalpassage" && value.match(/(elevator)/))
		way.type = value;
		
      if (key == "shop" && way.shop == null)
        way.shop = value;
      if (key == "amenity" && way.shop == null)
        way.shop = value;
      if (key == "leisure" && way.shop == null)
        way.shop = value;

      // key contact:[email|fax|phone|website]
      if (key.match(/^contact:/))
        way.contact[key.split(':')[1]] = value;

      //contact data without contact: prefix
      if (key == "email")
        way.contact.email = value;
      if (key == "fax")
        way.contact.fax = value;
      if (key == "phone")
        way.contact.phone = value;
      if (key == "website")
        way.contact.website = value;
      if (key == "opening_hours")
        way.opening_hours = value;

    });
    ways[$(this).attr("id")] = way;
  });

  //RELATIONS (ROOMS)
  $(data).find('relation').each(function() {
    var type;

    $(this).find('tag').each(function() {
      var key = $(this).attr("k").toLowerCase();
      var value = $(this).attr("v");
      if (key == "type")
        type = value;
    });

    if (type == 'multipolygon') {
      var outers = new Array();
      var inners = new Array();

      $(this).find('member').each(function() {
        if ($(this).attr("type") == "way" && $(this).attr("role") == "outer")
          outers.push(ways[$(this).attr("ref")]);
        if ($(this).attr("type") == "way" && $(this).attr("role") == "inner")
          inners.push(ways[$(this).attr("ref")]);
      });

      var coors_o = new Array();
      var coors_i = new Array();
      for (var i in outers)
        coors_o = coors_o.concat(outers[i].coords);
      for (var i in inners)
        coors_i = coors_i.concat(inners[i].coords);

      var way = new building.room($(this).attr("id"), coors_o);
      way.category = "Other";
      way.inner = coors_i;

      $(this).find('tag').each(function() {
        var key = $(this).attr("k").toLowerCase();
        var value = $(this).attr("v");
        if (key == "buildingpart")
          way.type = value;
      });

      ways_rel[$(this).attr("id")] = way;
    }
  });

  //RELATIONS (LEVELS)
  $(data).find('relation').each(function() {
    var type, level = "??";

    $(this).find('tag').each(function() {
      var key = $(this).attr("k").toLowerCase();
      var value = $(this).attr("v");
      if (key == "type")
        type = value;
      if (key == "level")
        level = value;
    });

    if (type == "level") {
      var rooms = new Array();
      var pois = new Array();
      $(this).find('member').each(function() {
        if ($(this).attr("type") == "way" && $(this).attr("role") == "buildingpart")
          rooms.push(ways[$(this).attr("ref")]);
        if ($(this).attr("type") == "relation" && $(this).attr("role") == "buildingpart")
          rooms.push(ways_rel[$(this).attr("ref")]);
        if ($(this).attr("type") == "node" && $(this).attr("role") == "poi") {
          var ref = $(this).attr("ref");
          pois.push(new building.poi(ref, nodes[ref], nodes[ref].poi, nodes[ref].name));
        }

      });
      var id = $(this).attr("id");
      relations[id] = new building.level($(this).attr("id"), level, rooms);
      relations[id].pois = pois;
    }
  });

  //RELATIONS (BUILDING)
  $(data).find('relation').each(function() {
    var type, name;

    $(this).find('tag').each(function() {
      var key = $(this).attr("k").toLowerCase();
      var value = $(this).attr("v");
      if (key == "type")
        type = value;
      if (key == "name")
        name = value;
    });

    if (type == "building") {
      var levels = new Array();
      var shell;

      $(this).find('member').each(function() {
        var type = $(this).attr("type");
        var role = $(this).attr("role");
        if (type == "relation")
          levels.push(relations[$(this).attr("ref")]);
        if (type == "way" && role == "shell")
          shell = $(this).attr("ref");
      });

      api.building = new building.building($(this).attr("id"), name, relations);
      api.building.shell = shell;
    }
  });

  //finish
  if (api.building != undefined) {
    api.building.drawLevelSwitcher();
    if (api.building.drawLevel()) {


      //$('#indoor-map').attr({"class": 'span10'});
      $('#indoor-navigation').show();
      $('.tools').show();

      //map.invalidateSize();
      $("#indoor-levels-0").button('toggle');
    }
  } else {
    alert("Something went wrong (no building found)!");
    //api.loadShell();
  }
}
