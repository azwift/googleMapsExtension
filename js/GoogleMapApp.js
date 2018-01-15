      var map = null;
      var request = null;
      var apiK = "AIzaSyB_bqydD71GdAHHnHhJaea2ibYMTpGHGkQ";
      var coords = [];
      var circlesArray = [];
      var distance = 200;
      var markers = [];
      var geometries = {};
      var latitude = 43.4403171; //default
      var longitude = -80.4620874;
      var zoomScale = 14;

      function initMap() {
        var p = new Promise ((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        })
        p.then((position) => {
          latitude  = position.coords.latitude;
          longitude = position.coords.longitude;
          var uluru = {lat: latitude, lng: longitude};
          map = new google.maps.Map(document.getElementById('map'), {
            zoom: zoomScale,
            center: uluru
          });
          google.maps.event.addListenerOnce(map, 'idle', function(){
            // do something only the first time the map is loaded
            registerButtonEvents();
          });
        })
        .catch(() => {
          error();
          var uluru = {lat: latitude, lng: longitude};
          map = new google.maps.Map(document.getElementById('map'), {
            zoom: zoomScale,
            center: uluru
          });
          google.maps.event.addListenerOnce(map, 'idle', function(){
            // do something only the first time the map is loaded
            registerButtonEvents();
          });
        });
        
      }

      function registerButtonEvents(){
        document.getElementById("byPoint").addEventListener("click",activateMapClick);
        document.getElementById("byMultiPoint").addEventListener("click",activateMapDraw);
        document.getElementById("contact").addEventListener("click",showCard);
      }

      function error() {
        console.log("Unable to retrieve your location");
      }

      function activateMapClick(){
        //clean up
        circlesArray.map(((circle) => {
          circle.setMap(null);
        }));
        markers.map((m) => {
          m.marker.setMap(null);
        });
        markers = [];
        circlesArray = [];
        coords = [];
        google.maps.event.clearInstanceListeners(map);
        var resultsContainer = document.getElementsByClassName("resultsContainer")[0];
        var instructionsTool = document.getElementById("instructions");
        instructionsTool.children[0].innerText = "Click on the point of intrigue on the map";
        instructionsTool.children[0].style = "visibility: visible;";

        var listener = map.addListener("click",(e) => {
          google.maps.event.clearInstanceListeners(map);
          var latlng =  + e.latLng.lat() + "," + e.latLng.lng();
          if(typeof(resultsContainer.children[0]) !== "undefined"){
                resultsContainer.children[0].remove();
          }

          instructionsTool.children[0].innerText = "Loading, please wait...";
          //resultsContainer.innerText = "Loading, please wait...";
          var request = {
            location:  new google.maps.LatLng(e.latLng.lat(), e.latLng.lng()),
            radius: distance,
            types: ["store", "food"]
           };
          var service = new google.maps.places.PlacesService(map);
          service.textSearch(request, handleQueryResponse);
        });
      }

      function activateMapDraw(){
        //clean up
        circlesArray.map((circle) => {
          circle.setMap(null);
        });
        markers.map((m) => {
          m.marker.setMap(null);
        });
        markers = [];
        circlesArray = [];
        coords = [];
        google.maps.event.clearInstanceListeners(map);
        var resultsContainer = document.getElementsByClassName("resultsContainer")[0];
        var instructionsTool = document.getElementById("instructions");
        instructionsTool.children[0].innerText = "Click on the map to draw points";
        instructionsTool.children[0].style = "visibility: visible;";
        

        var listener = map.addListener("click",(e) => {
          if(typeof(resultsContainer.children[0]) !== "undefined"){
                 resultsContainer.children[0].remove();
          }
          instructionsTool.children[0].innerText = "Right click to finish drawing points.";
          coords.push({
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
          });
          circlesArray.push(new google.maps.Circle({
              strokeColor: '#FF0000',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#FF0000',
              fillOpacity: 0.35,
              map: map,
              center: {
                  lat: e.latLng.lat(),
                  lng: e.latLng.lng()
              },
              radius: distance
          }));
        });

        var listenerDouble = map.addListener("rightclick",(e) => {
          google.maps.event.clearInstanceListeners(map);
          instructionsTool.children[0].innerText = "Loading, please wait...";
          if(coords.length === 0){
            instructionsTool.children[0].innerText = "No results found";
            instructionsTool.children[0].style = "visibility: visible;";
            setTimeout(() => {
                instructionsTool.children[0].style = "visibility: hidden;";
            }, 2000)
          }
          
          //run a search for each point
          let tempDistance = distance + 20;
          for(var i = 0; i < coords.length; i++){
            var request = {
              location: coords[i] ,
              types: ["store", "food"],
              radius: tempDistance
            };
            var service = new google.maps.places.PlacesService(map);
            service.textSearch(request, handleQueryResponse);
            circlesArray[i].setMap(null); // remove circles from the map
          }
          //cleanup
          circlesArray = [];
          coords = [];
        });
      }

      function handleQueryResponse(response, status){         
          var resultsContainer = document.getElementsByClassName("resultsContainer")[0]; 
          var instructionsTool = document.getElementById("instructions");
          instructionsTool.children[0].style = "visibility: hidden;";
          
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            //console.log(response);
            var list;
            if(typeof(resultsContainer.children[0]) === "undefined"){
              list = document.createElement("ul");
              resultsContainer.innerText = "";
              resultsContainer.append(list);
            }
            else{//append to existing list for multi points
              list = resultsContainer.children[0];
            }
          
            for(var i = 0; i < response.length; i++){
                var item = document.createElement("li");
                var text = document.createElement("p");
                var markButton = document.createElement("button");
                var panButton = document.createElement("button");
                var mapButton = document.createElement("button");

                var name = (typeof(response[i].name) !== "undefined" ? response[i].name : "N/A");
                var rating = (typeof(response[i].rating) !== "undefined" ? response[i].rating : "N/A");
                var formatted_address = (typeof(response[i].formatted_address) !== "undefined" ?
                 response[i].formatted_address : "N/A");
                //create a list item
                markButton.classList.add("buttonMark");
                markButton.classList.add("buttonMarkOff");
                panButton.classList.add("buttonPan");
                mapButton.classList.add("buttonMap");
                markButton.addEventListener("click",handleMarkerAction);
                panButton.addEventListener("click",handlePanAction);
                mapButton.addEventListener("click",handleOpenNewMap);
                item.innerHTML = "<img src="+ response[i].icon + ">";
                text.innerText = name + "\n\n" + formatted_address + "\n\n" + "Rating: " + rating;
                item.append(text);
                item.append(markButton);
                item.append(panButton);
                item.append(mapButton);
                list.append(item);
                //item.setAttribute("data-geometry", response[i].geometry.location);
                item.setAttribute("data-place_id", response[i].place_id);
                geometries[response[i].place_id] = response[i].geometry.location;
                
            }
        }
        else if(typeof(resultsContainer.children[0]) === "undefined"){
              instructionsTool.children[0].innerText = "No results found";
              instructionsTool.children[0].style = "visibility: visible;";
              setTimeout(() => {
                  instructionsTool.children[0].style = "visibility: hidden;";
              }, 2000)
        }
      }

      function handleMarkerAction(buttonEvent){
        buttonEvent.target.classList.remove("buttonMarkOff");
        buttonEvent.target.classList.add("buttonMarkOn");
        buttonEvent.target.removeEventListener("click",handleMarkerAction);

        var liElement = buttonEvent.target.parentElement;
        var place_id = liElement.getAttribute("data-place_id");
        var geometry = geometries[place_id];
        var marker = new google.maps.Marker({
          map: map,
          position: geometry
        });
        var newMarker = {
          marker : marker,
          target : buttonEvent.target
        };
        markers.push(newMarker);
        buttonEvent.target.addEventListener("click", handleMarkerActionOff);
      }

      function handleMarkerActionOff(buttonEvent){
        buttonEvent.target.classList.remove("buttonMarkOn");
        buttonEvent.target.classList.add("buttonMarkOff");
        buttonEvent.target.removeEventListener("click",handleMarkerActionOff);
        
        for (var i = 0; i < markers.length; i++){
          let target = markers[i].target;
          if(target === buttonEvent.target){
            markers[i].marker.setMap(null);
            delete markers[i];
            markers.splice(i,1);
            break;
          }
        }
        buttonEvent.target.addEventListener("click", handleMarkerAction);
      }

      function handlePanAction(buttonEvent){
        var liElement = buttonEvent.target.parentElement;
        var place_id = liElement.getAttribute("data-place_id");
        var geometry = geometries[place_id];

        map.setCenter(geometry);
      }

      function handleOpenNewMap(buttonEvent){
        var liElement = buttonEvent.target.parentElement;
        var place_id = liElement.getAttribute("data-place_id");

        var tempgeometry = geometries[place_id].toString();
        var geometry = tempgeometry.substr(1, tempgeometry.length-2);

        var url = "https://www.google.com/maps/search/?api=1&query=" + geometry.toString() + "&query_place_id=" + place_id;
        window.open(url);
      }
      function showCard() {
        // Get the <span> element that closes the modal
        var modal = document.getElementById("ContactCard");
        modal.style.display = "block";
        var span = document.getElementsByClassName("close")[0];
        span.onclick = function() {
          modal.style.display = "none";
        }
      }
