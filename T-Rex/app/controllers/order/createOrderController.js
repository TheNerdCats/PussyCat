'use strict';

app.controller('createOrderController', ['$scope', '$window', '$mdpDatePicker', 'host', 'UrlPath', 'restCall', '$rootScope', '$mdToast', '$routeParams', 'orderFactory', 'mapFactory', createOrderController]);

createOrderController.$inject = ['$rootScope', '$log'];

function createOrderController($scope, $window, $mdpDatePicker, host, UrlPath, restCall, $rootScope, $mdToast, $routeParams, orderFactory, mapFactory){

	var vm = this;

	vm.OrderType = ["Delivery"];
	vm.VehiclePreference = ["CNG","SEDAN"];
	vm.LocalAreas = ['Bailey Road',
		            'Banani',
		            'Banani DOHS',
		            'Baridhara',
		            'Baridhara DOHS',
		            'Basabo',
		            'Bashundhara',
		            'Cantonment',
		            'Chowdhurypara',
		            'Dhanmondi',
		            'Elephant Road',
		            'Eskaton',
		            'Goran',
		            'Green road',
		            'Gulshan 1',
		            'Gulshan 2',
		            'Hatirpul Residential Area',
		            'Indira Road',
		            'Kakrail',
		            'Katabon',
		            'Khilgaon',
		            'Khilgaon-taltola',
		            'Lalmatia',
		            'Malibagh',
		            'Mirpur',
		            'Mirpur-1',
		            'Mirpur-10',
		            'Mirpur-11',
		            'Mirpur-12',
		            'Mirpur-13',
		            'Mirpur-14',
		            'Mirpur-2',
		            'Mirpur-6',
		            'Mirpur-7',
		            'Mirpur-Pallabi',
		            'Mohakhali',
		            'Mohakhali DOHS',
		            'Mohammadpur',
		            'Motijheel',
		            'Narinda',
		            'Niketan',
		            'Nikunjo - 2',
		            'Paltan',
		            'Panthapath',
		            'Paribagh',
		            'Segunbagicha',
		            'Shantinagar',
		            'Shipahibag bazar',
		            'Shyamoli',
		            'Siddeshwari',
		            'Sonargaon Road',
		            'Tikatuli',
		            'Tnt colony',
		            'Uttara',
		            'Wari'];


	vm.PaymentMethod = [];
	vm.placesResults = [];

	vm.SelectedTo = "";
	vm.SelectedTo = "";

	vm.isOrderSelected = true;
	vm.RideOrderSelected = false;
	vm.DeliveryOrderSelected = true;
	vm.ordersIsBeingCreated = false;
	vm.FromLabel = "From";
	vm.ToLabel = "To";

	vm.selectedItem = {};
	vm.autocompleteUserNames = [];
	vm.searchText = "";

	vm.id = $routeParams.id;
		
	vm.isPutOrder = false;
	vm.jobId = "";
	vm.HRID = "";

	if(vm.id == "new"){
		vm.newOrder = {
			From: {
				Point: {
					type: "Point",
					coordinates: [
					]
				},
				Address: "asdasdasdasd",
				PostalCode: "",
				Floor: "",
				HouseNumber: "",
				Locality : "",
				AdressLine1: "",
				AddressLine2: "",
				Country: "",
				City: "Dhaka",
				State: "",
				Provider: "Default"
			},
			To: {
				Point: {
					type: "Point",
					coordinates: [
					]
				},
				Address: "",
				PostalCode: "",
				Floor: "",
				HouseNumber: "",
				Locality : "",
				AddressLine1: "",
				AddressLine2: "",
				Country: "",
				City: "Dhaka",
				State: "",
				Provider: "Default"
			},
			OrderCart:{
				PackageList : [
					{
						"Item": "",
						"Quantity": 0,
						"Price": 0,
						"VAT": 0,
						"Total": 0,
						"VATAmount": 0,
						"TotalPlusVAT": 0,
						"Weight": 0
					}
				],
				TotalVATAmount: 0,
				SubTotal: 0,
				ServiceCharge: 0,
				TotalWeight: 0,
				TotalToPay: 0
			},
			Name: "",
			Type: "",
			Description : "",
			NoteToDeliveryMan: "",
			PayloadType: "default",
			UserId: "",
			OrderLocation: null,
			ETA: null,
			ETAMinutes: 0,
			PaymentMethod: null
		};
	} else {		
		var jobUrl = host + "/api/job/" + vm.id;
		var successCallback = function(response){

			vm.newOrder = response.data.Order;
			vm.jobId = response.data.Id;
			vm.HRID = response.data.HRID;
			vm.isPutOrder = true;			
			console.log(vm.newOrder);
			// $scope.$apply();
		}
		var errorCallback = function(responese){
			console.log(responese);
			alert("No Job Found!!!");
		}
		restCall("GET", jobUrl, null, successCallback, errorCallback);
	}



	vm.ETATimePicker = function(ev) {
    	$mdpTimePicker($scope.currentTime, {
        targetEvent: ev
      }).then(function(selectedDate) {
        vm.newOrder.ETA = selectedDate;
      });;
    }

	vm.CreateNewUser = CreateNewUser;
	vm.searchTextChange = searchTextChange;
	vm.selectedItemChange = selectedItemChange;
	vm.querySearch = querySearch;

	vm.createNewOrder = createNewOrder;
	vm.orderTypeSelected = orderTypeSelected;

	vm.currentMarkerLocation = {lat:0,lng:0};
	mapFactory.createMap(23.790888, 90.391430, 'orderCreateMap', 14);
	vm.searchAddress = searchAddress;
	mapFactory.mapContextMenuForCreateOrder(setFromLocationCallback, setToLocationCallback);


	loadPaymentMethods();

	vm.AddItem = AddItem;
	vm.RemoveItem = RemoveItem;

	vm.itemChange = itemChange;


	function AddItem() {
		var newItem = {
    		"Item": "",
			"Quantity": 0,
			"Price": 0,
			"VAT": 0,
			"Total": 0,
			"VATAmount": 0,
			"TotalPlusVAT": 0,
			"Weight": 0
    	};

		vm.newOrder.OrderCart.PackageList.push(newItem);
		$scope.$apply();
	}


	function itemChange(index) {
		var item = vm.newOrder.OrderCart.PackageList[index];
		item.Total = Math.round(item.Quantity * item.Price);
		item.VATAmount = Math.round(item.Quantity*item.Price*(1 + item.VAT / 100) - item.Quantity*item.Price);
		item.TotalPlusVAT = Math.round(item.Quantity*item.Price*(1 + item.VAT / 100));

		vm.newOrder.OrderCart.SubTotal = 0;
		vm.newOrder.OrderCart.TotalVATAmount = 0;
		vm.newOrder.OrderCart.TotalWeight = 0;
		vm.newOrder.OrderCart.TotalToPay = 0;

		angular.forEach(vm.newOrder.OrderCart.PackageList, function (value, key) {
			vm.newOrder.OrderCart.SubTotal += value.Total;
			vm.newOrder.OrderCart.TotalVATAmount += value.VATAmount;
			vm.newOrder.OrderCart.TotalWeight += value.Weight;
			vm.newOrder.OrderCart.TotalToPay += value.TotalPlusVAT;
		});

		// vm.newOrder.OrderCart.TotalToPay += vm.newOrder.OrderCart.ServiceCharge;
		vm.newOrder.OrderCart.TotalToPay = 0;

	}

	function RemoveItem(itemIndex) {
		console.log(itemIndex);
		vm.newOrder.OrderCart.PackageList.splice(itemIndex, 1);
		$scope.$apply();
	}

	function CreateNewUser() {
		$window.location.href = '#/asset/create';
	}

	function searchTextChange(item) {
		// vm.newOrder.UserId = item.Id;
		console.log(vm.selectedItem);
		console.log(item);
	}

	function selectedItemChange(item) {
		// console.log("Item changed to " + item.UserName);
		// console.log("selectedItem : ")
		console.log(vm.selectedItem)
		console.log(item);
		vm.newOrder.UserId = item.Id;
		console.log(vm.newOrder.UserId);
	}

	function querySearch(query) {
		loadUserNames(query);
		var results = query ? vm.autocompleteUserNames.filter( createFilterFor(query)) : vm.autocompleteUserNames, deferred;
		return results;
	}

	function loadUserNames(query){
		function successCallback(response) {
			vm.autocompleteUserNames = response.data.data;
			console.log(vm.autocompleteUserNames)
		}
		function errorCallback(error) {
			console.log(error);
		}

		var getUsersUrl = host + "api/account/odata?" + "$filter=startswith(UserName,'"+ query +"') eq true and Type eq 'USER' or Type eq 'ENTERPRISE'" + "&envelope=" + true + "&page=" + 0 + "&pageSize=" + 20;
		console.log(getUsersUrl)
		restCall('GET', getUsersUrl, null, successCallback, errorCallback)
		console.log("loadUserNames")
	};

	function loadPaymentMethods() {
		// function successCallback(response) {
		// 	var paymentMethod = response.data;
		// 	angular.forEach(paymentMethod, function (value, key) {
		// 		 vm.PaymentMethod.push(value.Key);
		// 	})

		// 	console.log(vm.PaymentMethod)
		// }
		// function errorCallback(error) {
		// 	console.log(error);
		// }
		// restCall('GET', host + "/api/Payment", null, successCallback, errorCallback)
		vm.PaymentMethod.push("CashOnDelivery");
	};


	function createFilterFor(query) {
		// var lowercaseQuery = angular.lowercase(query);
		return function filterFn(state) {
			return(state.UserName.indexOf(query) === 0)
		};
	}

	function createNewOrder() {
		// TODO: This is the code for showing a Toast when you dont have coordinates
		// Would move this to a service someday
		console.log(vm.newOrder);
		// If you have a coordinates of both From and To, then it creates an order
		vm.ordersIsBeingCreated = true;
		// orderFactory.createNewOrder(vm.newOrder, vm.ordersIsBeingCreated);
		var successCallback = function (response) {
			console.log("success : ");
			vm.ordersIsBeingCreated = false;
			if (vm.isPutOrder) {
				alert("order successfully updated!");
				$window.location.href = '#/job/' + vm.HRID;
			} else {
				alert("order successfully updated!");
				$window.location.href = '#/job/' + response.data.HRID;
			}
			
		};

		var errorCallback = function error(error) {
			console.log("error : ");
			console.log(error);
			vm.ordersIsBeingCreated = false;

			var errorMsg = error.data.Message || "Server error";
			var i = 0;
	        if (error.data.ModelState) {
	            errorMsg += "\n";
	            if (error.data.ModelState["model.From.AddressLine1"]) {
	                var err = error.data.ModelState["model.From.AddressLine1"][0];
	                errorMsg += ++i + ". " + "Pickup Address is required" + "\n";
	            }
	            if (error.data.ModelState["model.To.AddressLine1"]) {
	                var err = error.data.ModelState["model.To.AddressLine1"][0];
	                errorMsg += ++i + ". " + "Delivery Address is required" + "\n";
	            }
	            if (error.data.ModelState["model.OrderCart.PackageList[0].Item"]) {
	                var err = error.data.ModelState["model.OrderCart.PackageList[0].Item"][0];
	                errorMsg += ++i + ". " + err + "\n";
	            }
	            if (error.data.ModelState["model.OrderCart.PackageList[0].Quantity"]) {
	                var err = error.data.ModelState["model.OrderCart.PackageList[0].Quantity"][0];
	                errorMsg += ++i + ". " + err + "\n";
	            }
	            if (error.data.ModelState["model.OrderCart.PackageList[0].Weight"]) {
	                var err = error.data.ModelState["model.OrderCart.PackageList[0].Weight"][0];
	                errorMsg += ++i + ". " + err + "\n";
	            }
	            if (error.data.ModelState["model.PaymentMethod"]) {
	                var err = error.data.ModelState["model.PaymentMethod"][0];
	                errorMsg += ++i + ". " + err + "\n";
	            }
	        }
	        alert(errorMsg);
		};

		if (vm.isPutOrder) {
			var requestMethod = "PUT";
			var orderUrl = host + "api/job/"+ vm.jobId +"/order";
			console.log(vm.jobId);
			vm.newOrder.OrderCart.TotalVATAmount = 0,
			vm.newOrder.OrderCart.SubTotal = 0,
			vm.newOrder.OrderCart.TotalToPay = 0
			console.log(vm.newOrder);
			restCall(requestMethod, orderUrl, vm.newOrder, successCallback, errorCallback);
		} else {
			var requestMethod = "POST";
			var orderUrl = host + "api/Order/";
			restCall(requestMethod, orderUrl, vm.newOrder, successCallback, errorCallback);
		}
	}

	function orderTypeSelected(type) {
		vm.isOrderSelected = true;
		if (type == "Ride") {
			vm.RideOrderSelected = true;
			vm.DeliveryOrderSelected = false;

			vm.FromLabel = "User's Location";
			vm.ToLabel = "User's Destination";
		} else if ("Delivery") {
			vm.RideOrderSelected = false;
			vm.DeliveryOrderSelected = true;

			vm.FromLabel = "Pick Up Location";
			vm.ToLabel = "Delivery Location";
		}
	};

	function getCurrentMarkerLocationCallback(lat, lng) {
		vm.currentMarkerLocation.lat = lat;
		vm.currentMarkerLocation.lng = lng;
		console.log(lat + " " + lng)
	}

	// You should initialize the search box after creating the map, right?
	function searchAddress() {
		mapFactory.searchBox(vm.toSearchText, getCurrentMarkerLocationCallback);
	};


	function setFromLocationCallback(lat, lng) {
		console.log(lat + " " + lng)
		vm.currentMarkerLocation.lat = lat;
		vm.currentMarkerLocation.lng = lng;

		vm.newOrder.From.Point.coordinates = [];
		vm.newOrder.From.Point.coordinates.push(lng);
		vm.newOrder.From.Point.coordinates.push(lat);

		mapFactory.getAddress(lat, lng, function (address, latLng) {
			vm.newOrder.From.AddressLine1 = address;
		});

		$scope.$apply();
	}

	function setToLocationCallback(lat, lng) {
		console.log(lat + " " + lng)
		vm.currentMarkerLocation.lat = lat;
		vm.currentMarkerLocation.lng = lng;

		vm.newOrder.To.Point.coordinates = [];
		vm.newOrder.To.Point.coordinates.push(lng);
		vm.newOrder.To.Point.coordinates.push(lat);

		mapFactory.getAddress(lat, lng, function (address, latLng) {
			vm.newOrder.To.AddressLine1 = address;
		});
		$scope.$apply();
	}
};