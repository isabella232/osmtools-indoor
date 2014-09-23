# OpenStreetMap Indoor Mapping browser.

A javascript application to display rooms in a building.

### Status

This a fork from [clement-lagrange/osmtools-indoor](https://github.com/clement-lagrange/osmtools-indoor) in order to expand it specifically for education buildings representation.

The main objective is to have a self-contained, client application to display building's insides from OpenStreetMap.

This version is not optimized and would need a code refactoring. You are welcome if you wish to participate or send a pull request.
### Advantages

1. Supports another OSM data representation :
 * In level relations, room or other building parts can use the role `building:part` instead of `buildingpart`.
 * Ways representing rooms can be tagged as `room=yes`, `room=amphitheatre` or `room=class` instead of using the tag `buildingpart=room`.
 * Vertical passage elements  such as stairs and elevators can be tagged using more standard OSM representation : `highway=stairway` and `highway=elevator`.
2. New colors to display different types of rooms
3. Toilets will display a different icon for men and women depend on the tag `access=men|women`
4. New public domain icons from [the Noun Project](http://thenounproject.com/)

### How to use?

The main instance is available at [antoine-g.github.io/osmtools-indoor/](http://antoine-g.github.io/osmtools-indoor/).

The "hash" URL syntax is supported, so you can use something like `#lat=50.6201&lon=3.5596&z=11`, to display the map at a specific center and zoom.

But you can also link to a specific room, with this syntax : `#lat=50.60953&lon=3.13794&z=21&room=217`. The zoom level is optionnal and default to 18. The value of the `room` parameter will be searched for in the `ref=` tags of `buildingpart=room` 500 meters around the specified location. If several are found, the closest will be chosen.

For example, check http://clement-lagrange.github.io/osmtools-indoor/#lat=50.60956&lon=3.13786&z=21&room=219 .

The URL is updated while browsing, and external updates are passed to the map.

### How it works?

Displayed data are taken 'live' from OSM database is using [Overpass API](http://wiki.openstreetmap.org/wiki/Overpass_API). It's working worldwide.

It uses [Leaflet](http://leafletjs.com/), an excellent map display library, quite a lot.

### How to map a building?

In order to render building outline on the map, relation of building should have a way (role `outer`) with tags building=`yes` and `level=0`. The relation itself should have tag `type=building` and contain subrelations representing building's levels.

Relation of level should have tag `type=level` and contain ways - rooms. Each room should be a member of proper level with role `buildingpart` and should contain tag `buildingpart=room`.

For more information please take a look at OSM [wiki page](http://wiki.openstreetmap.org/wiki/IndoorOSM#The_Model_.2F_Tagging_Schema).

### License

    Copyright (C) 2012-2013 Yarl (yarl@o2.pl)
    Copyright (C) 2014 LIFL (www.lifl.fr)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
