(function () {

	'use strict';

	app.controller('workOrderC', workOrderC);

	function workOrderC($scope, $http, $window, $routeParams, $uibModal, ngAuthSettings, restCall, dashboardFactory, excelWriteService){
		var vm = $scope;	
		vm.WarningMessage = null;
		vm.selectedAssetId = $routeParams.id;
		vm.selectedAsset = null;
		vm.jobPerPage = 50;
		vm.Assets = [];
		vm.workOrders = dashboardFactory.orders("IN_PROGRESS");
		vm.Tags = [];
		vm.selectedTag = null;

		vm.totalSubTotal = 0;
		vm.totalServiceCharge = 0;
		vm.totalPayable = 0;

		vm.downloadExcelWorkOrder = function (tableId) {
			console.log(vm.selectedAsset);
			var filename = "Workorder.xlsx";
			if(vm.selectedAsset){
				filename = "workorder - "+ vm.selectedAsset.UserName + " - " + new Date().toDateString() + ".xlsx";
			}
			excelWriteService.export_table_to_excel(tableId, 'xlsx', filename);
		}

		vm.getAssetsList = function (page) {		
			var getUsersUrl = ngAuthSettings.apiServiceBaseUri + "api/Account/odata?$filter=Type eq 'BIKE_MESSENGER'&$orderby=UserName&page="+ page +"&pageSize=50";
			dashboardFactory.getUserNameList(getUsersUrl).then(function (response) {
				if (page === 0) {
					vm.Assets = [];				
				}
				angular.forEach(response.data, function (value, index) {
					if ($routeParams.id && $routeParams.id === value.Id) {
						vm.selectedAsset = value;
					}
					vm.Assets.push(value);
				})
				if (response.pagination.TotalPages > page) {
					vm.getAssetsList(page + 1);
				}
			}, function (error) {
				console.log(error);
			});
		};
     
		vm.getTagsList = function (page) {
			var getTagsUrl = ngAuthSettings.apiServiceBaseUri + "api/datatag/odata?&page="+ page +"&pageSize=50";
			$http({
				method: "GET",
				url: getTagsUrl
			}).then(function (response) {
				angular.forEach(response.data.data, function (tag, index) {
					vm.Tags.push(tag);					
				});
				if (response.data.pagination.TotalPages > page) {
					vm.getTagsUrl(page + 1);
				}
			}, function (error) {
				console.log(error);
			})
		}

		vm.onSelectTag = function ($item, $model, $label, $event) {
			vm.selectedTag = $item.Value;
			console.log(vm.selectedTag);
		}

		vm.getAssetsList(0);
		vm.getTagsList(0);
		
		vm.printWorkOrder = function () {
			$("#workOrders").print({
	            globalStyles: true,
	            mediaPrint: true,
	            stylesheet: "node_modules/bootstrap/dist/css/bootstrap.css",
	            noPrintSelector: ".no-print",
	            iframe: true,
	            append: null,
	            prepend: null,
	            manuallyCopyFormValues: true,
	            deferred: $.Deferred(),
	            timeout: 750,
	            title: null,
	            doctype: '<!doctype html>'
	    	});		
		}

		vm.activate = function () {		
			if (!vm.selectedTag) {
				vm.WarningMessage = "Please select a Zone first!";
				console.log(vm.WarningMessage);		
			} else {
				vm.WarningMessage = null;
				vm.workOrders.searchParam.pageSize = vm.jobPerPage;
				vm.workOrders.isCompleted = 'IN_PROGRESS';
				vm.workOrders.searchParam.Id = vm.selectedTag;
				console.log(vm.workOrders.searchParam.Id);
				vm.workOrders.loadOrders();
			}
		}


		vm.$watch(function () {
			return vm.workOrders.data
		}, function (newVal, oldVal) {
			if (newVal !== oldVal) {			
				vm.totalSubTotal = 0;
				vm.totalServiceCharge = 0;
				vm.totalPayable = 0;
				var tempOrders = [];
				angular.forEach(newVal, function (job, index) {				
					vm.totalSubTotal += job.data.Order.OrderCart.SubTotal;
					vm.totalServiceCharge += job.data.Order.OrderCart.ServiceCharge;
					vm.totalSubTotal += job.data.Order.OrderCart.SubTotal;
					vm.totalServiceCharge += job.data.Order.OrderCart.ServiceCharge;
					vm.totalPayable += job.data.Order.OrderCart.TotalToPay;

					if (vm.selectedAssetId === job.data.Tasks[2].AssetRef) {
						tempOrders.push(job);
					}					
					newVal.data = tempOrders;
				});
			}
		})

		vm.activate();
	}

})();