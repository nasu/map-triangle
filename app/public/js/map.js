var mapStyles = [
    {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
    {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
    {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{color: '#263c3f'}]
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{color: '#6b9a76'}]
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{color: '#38414e'}]
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{color: '#212a37'}]
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{color: '#9ca5b3'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{color: '#746855'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{color: '#1f2835'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{color: '#f3d19c'}]
    },
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{color: '#2f3948'}]
    },
    {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{color: '#17263c'}]
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{color: '#515c6d'}]
    },
    {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{color: '#17263c'}]
    }
];

var map,infoWindow,placeService;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: {lat:35.681167, lng:139.767052}, // Tokyo station,
        zoom:12,
        styles:mapStyles,
        //clickableIcons:false,
        //mapTypeId: google.maps.MapTypeId.ROADMAP,
    });
    infoWindow = new google.maps.InfoWindow({map: map});
    placeService = new google.maps.places.PlacesService(map);
    var s1 = document.getElementById("station_1");
    var s2 = document.getElementById("station_2");
    var s3 = document.getElementById("station_3");
    s1.value = "吉祥寺";
    s2.value = "渋谷";
    s3.value = "新宿";
};

function search() {
    var s1 = document.getElementById("station_1").value;
    var s2 = document.getElementById("station_2").value;
    var s3 = document.getElementById("station_3").value;
    treSearch(s1,s2,s3);
}
function treSearch(q1,q2,q3) {
    Promise.all([searchStationByTextPromise(q1),searchStationByTextPromise(q2),searchStationByTextPromise(q3)])
    .then(function(values) {
        var line = new google.maps.Polyline({
            path: [...values,values[0]],
            strokeWeight:3,
            strokeColor: "#eeffcc",
            strokeOpacity: 0.5,
        });
        line.setMap(map);
        return values;
    })
    .then(function(values) {
        var circumcenter = calcCircumcenter(values);
        searchNearestStationPromise(circumcenter);
        return values;
    })
    .then(function(values) {
        var minTotalDistance = calcMinTotalDistance(values);
        searchNearestStationPromise(minTotalDistance);
        return values;
    });
}
function searchNearestStationPromise(latlng) {
    return new Promise(function(resolve,reject) {
        placeService.nearbySearch(
            {
                location: latlng,
                type: ['train_station'],
                rankBy: google.maps.places.RankBy.DISTANCE,
            },
            function(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    // I expect results find one at least and the first result is the heighest rank.
                    //TODO : 外に追い出す
                    createStationMarker(results[0]);
                    resolve(results[0].geometry.location);
                    console.log(results[0]);
                }
                reject();
            }
        );
    });
}
function searchStationByTextPromise(query) {
    return new Promise(function(resolve,reject) {
        placeService.textSearch(
            {
                //location: latlng,
                //radius: 20000, // 20km from Tokyo
                type: ['train_station'],
                query:query,
            },
            function(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    // I expect results find one at least and the first result is the heighest rank.
                    //createStationMarker(results[0]);
                    resolve(results[0].geometry.location);
                }
                reject();
            }
        );
    });
}
function calcCircumcenter(vs) {
    // https://oshiete.goo.ne.jp/qa/7112206.html からパクった。あってるか検証必要
    var x = (((vs[0].lng() - vs[2].lng()) * (Math.pow(vs[0].lng(),2) - Math.pow(vs[1].lng(),2) + Math.pow(vs[0].lat(),2) - Math.pow(vs[1].lat(),2))) - ((vs[0].lng()-vs[1].lng()) * (Math.pow(vs[0].lng(),2) - Math.pow(vs[2].lng(),2) + Math.pow(vs[0].lat(),2) - Math.pow(vs[2].lat(),2)))) / ((2 * (vs[0].lng() - vs[2].lng()) * (vs[0].lat() - vs[1].lat())) - (2 * (vs[0].lng() - vs[1].lng()) * (vs[0].lat() - vs[2].lat())))
    var y = (((vs[0].lat() - vs[2].lat()) * (Math.pow(vs[0].lat(),2) - Math.pow(vs[1].lat(),2) + Math.pow(vs[0].lng(),2) - Math.pow(vs[1].lng(),2))) - ((vs[0].lat()-vs[1].lat()) * (Math.pow(vs[0].lat(),2) - Math.pow(vs[2].lat(),2) + Math.pow(vs[0].lng(),2) - Math.pow(vs[2].lng(),2)))) / ((2 * (vs[0].lat() - vs[2].lat()) * (vs[0].lng() - vs[1].lng())) - (2 * (vs[0].lat() - vs[1].lat()) * (vs[0].lng() - vs[2].lng())))
    var latlng = new google.maps.LatLng({lat:x, lng:y});
    map.setCenter(latlng);
    createMarker(latlng, {
        icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
        animation: google.maps.Animation.DROP,
        label: {text: "どこからも等距離", color: "white"},
    }, {
        content: "どこからも等距離の位置",
    });
    return latlng;
}
function calcMinTotalDistance(vs) {
    var ax = vs[0].lng(),
        ay = vs[0].lat(),
        bx = vs[1].lng(),
        by = vs[1].lat(),
        cx = vs[2].lng(),
        cy = vs[2].lat();
    var ab = Math.sqrt(Math.pow(ax-bx,2) + Math.pow(ay-by,2));
    var bc = Math.sqrt(Math.pow(bx-cx,2) + Math.pow(by-cy,2));
    var ca = Math.sqrt(Math.pow(cx-ax,2) + Math.pow(cy-ay,2));
    var aRad = Math.acos((Math.pow(bc,2)+Math.pow(ca,2)-Math.pow(ab,2))/(2*bc*ca));
    var bRad = Math.acos((Math.pow(ca,2)+Math.pow(ab,2)-Math.pow(bc,2))/(2*ca*ab));
    var cRad = Math.acos((Math.pow(ab,2)+Math.pow(bc,2)-Math.pow(ca,2))/(2*ab*bc));
    var aDeg = aRad * 180 / Math.PI;
    var bDeg = bRad * 180 / Math.PI;
    var cDeg = cRad * 180 / Math.PI;
    console.log(aDeg,bDeg,cDeg);
    if (aDeg > 120) return vs[0];
    if (bDeg > 120) return vs[1];
    if (cDeg > 120) return vs[2];

    var ab1 = calcLastEqTriangleLatLng(vs[0],vs[1],true);
    var bc1 = calcLastEqTriangleLatLng(vs[1],vs[2],true);
    var ca1 = calcLastEqTriangleLatLng(vs[2],vs[0],true);
    var ab2 = calcLastEqTriangleLatLng(vs[0],vs[1],false);
    var bc2 = calcLastEqTriangleLatLng(vs[1],vs[2],false);
    var ca2 = calcLastEqTriangleLatLng(vs[2],vs[0],false);
    var ab = (Math.pow(ab1.lng()-cx)+Math.pow(ab1.lat()-cy) < Math.pow(ab2.lng()-cx)+Math.pow(ab2.lat()-cy)) ? ab1 : ab2;
    var bc = (Math.pow(bc1.lng()-ax)+Math.pow(bc1.lat()-ay) < Math.pow(bc2.lng()-ax)+Math.pow(bc2.lat()-ay)) ? bc1 : bc2;
    var ca = (Math.pow(ca1.lng()-bx)+Math.pow(ca1.lat()-by) < Math.pow(ca2.lng()-bx)+Math.pow(ca2.lat()-by)) ? ca1 : ca2;
    createMarker(ab1,{label:{text:"AB",color:"white"}});
    createMarker(bc1,{label:{text:"BC",color:"white"}});
    createMarker(ca1,{label:{text:"CA",color:"white"}});
    return ab;
}
function calcLastEqTriangleLatLng(a,b,sign) {
    var ax = a.lng(),
        ay = a.lat(),
        bx = b.lng(),
        by = b.lat();
    var mx = (ax+bx)/2,
        my = (ay+by)/2;
    var axd = ax-mx,
        ayd = ay-my,
        bxd = bx-mx,
        byd = by-my;
    var r = Math.sqrt(Math.pow(axd,2)+Math.pow(ayd,2));
    var t = Math.atan2(ayd, axd);
    if (sign) {
        t += Math.PI/2;
    } else {
        t -= Math.PI/2;
    }
    var cxd = Math.cos(t) * r * Math.sqrt(3),
        cyd = Math.sin(t) * r * Math.sqrt(3);
    var cx = cxd+mx,
        cy = cyd+my;
    return new google.maps.LatLng({lat:cy, lng:cx});
}
function createStationMarker(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
    });
    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.setContent(place.name);
        infoWindow.open(map,this);
    });
}
function createMarker(latlng, markerOpts, infoWindowOpts) {
    markerOpts = markerOpts || {};
    infoWindowOpts = infoWindowOpts || {};
    markerOpts.map = map;
    markerOpts.position = latlng;
    var marker = new google.maps.Marker(markerOpts)
    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.setContent(infoWindowOpts.content);
        infoWindow.open(map,this);
    });
}
