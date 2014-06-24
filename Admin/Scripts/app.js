var app = angular.module('main', ['ngTable','ui.bootstrap']).
    controller('DemoCtrl', function ($scope, $filter, ngTableParams, $http, $modal) {

        $scope.alerts = [
        ];

        //Initialize variables
        var data = [];
        $scope.editId = -1;
        $scope.hoverId = -1;
        $scope.temp_user = {};
        $scope.index = -1;

        $scope.loadData = function () {
            $http.get('../api/users', {
                params: { time: Date.now() }
            }).success(function (data_response, status) {
                data = data_response;
                $scope.data = data_response;
                $scope.tableParams.reload();
            })
        };
        
        $scope.tableParams = new ngTableParams({
            page: 1,
            count: 10,
            sorting: {
                id:'asc'
            }
        },{
            total: data.length,
            getData: function ($defer, params) {
                var filteredData = params.filter() ? $filter('filter')(data, params.filter()) : data;
                var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : data;
                this.total = orderedData.length;
                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });

        $scope.loadData(); 

        $scope.setHoverId =  function(pid) {
            $scope.hoverId = pid;
        };

        $scope.addAlert = function (type, message) {
            $scope.alerts.push({ 'type': type, 'msg': message });
        };

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };


        $scope.openEditModal = function (index, mode, id) {
            $scope.index = index;
            if (mode == 'edit') {
                $http.get('/api/Users/' + id)
                .success(function (data, status) {
                    $scope.temp_user = data;
                    $scope.hoverId = -1;
                    var modalInstance = $modal.open({
                        templateUrl: '/admin/EditRow',
                        controller: ModalInstanceCtrl,
                        resolve: {
                            user: function () {
                                return $scope.temp_user;
                            },
                            mode: function () {
                                return mode;
                            }
                        }
                    });
                    modalInstance.result.then(function (message) {
                        //Close Function
                        $scope.addAlert("success", "Profile information successfully updated");
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].id == id) {
                                data[i] = angular.copy(message);
                            }
                        }
                        $scope.tableParams.reload();
                    }, function (message) {
                        //Cancel Function (or Esc keypress)
                    });
                }).error(function (data, status) {
                    $scope.addAlert("danger", "Uh-oh! Something went wrong. Please try again");
                });
            } else if (mode == 'new') {
                $scope.temp_user = {};
                $scope.hoverId = -1;
                var modalInstance = $modal.open({
                    templateUrl: '/admin/EditRow',
                    controller: ModalInstanceCtrl,
                    resolve: {
                        user: function () {
                            return $scope.temp_user;
                        },
                        mode: function () {
                            return mode;
                        }
                    }
                });
                modalInstance.result.then(function (message) {
                    // Close Function
                    $scope.addAlert("success", "Profile information successfully updated");
                }, function (message) {
                    // Cancel Function (or Esc keypress)
                });

            }
            
        }

        $scope.deleteItem = function (mode, id) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].id == id) {
                    $scope.temp_user = angular.copy(data[i]);
                    break;
                }
            }
            var modalInstance = $modal.open({
                templateUrl: '/admin/DeleteDialog',
                controller: ModalInstanceCtrl,
                resolve: {
                    user: function () {
                        return $scope.temp_user;
                    },
                    mode: function () {
                        return mode;
                    }
                }
            });

            modalInstance.result.then(function (message) {
                //Close Function
                $http.delete('/api/users/' + $scope.temp_user.id)
                .success(function (data, response) {
                    $scope.addAlert("success", "Profile successfully deleted");
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].id == id) {
                            data.splice(i);
                        }
                    }
                    $scope.tableParams.reload();
                }).error(function (data, response) {
                    $scope.addAlert("danger", "Uh-oh! Something went wrong. Please try again");
                });
            }, function (message) {
                //Cancel Function (or Esc keypress)
            });
        };

    });

var ModalInstanceCtrl = function ($scope, $modalInstance, $http, user, mode) {
    $scope.mode = mode;
    $scope.user = user;
    $scope.created = false;
    $scope.delete_ok = function () {
        $modalInstance.close('delete');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.alerts = [];
    $scope.addAlert = function (type, message) {
        $scope.alerts.push({ 'type': type, 'msg': message });
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.resetPassword = function () {
        $http.post('/api/Users/' + $scope.user.id + '/ResetPassword')
        .success(function (data, status) {
            $scope.addAlert("success", "An email to to reset password has been sent to " + $scope.user.email);
        }).error(function (data, status) {
            $scope.addAlert("danger", "Uh-oh! Something went wrong. Please try again");
        });
    }

    $scope.submit = function (isValid) {
        if (mode == 'edit') {
            $http.put('/api/users/' + $scope.user.id, $scope.user)
            .success(function (data, status) {
                $scope.user = data;
                //TODO Disable button during request to prevent double posting
                $modalInstance.close($scope.user);
            }).error(function (data, status) {
                $scope.addAlert("danger", "Uh-oh! Something went wrong. Please try again");
            });
        }
        if (mode == 'new') {
            alert($scope.user.email);
            $http.post('../api/users', $scope.user)
            .success(function (data, response) {
                $scope.user = data;
                //TODO Disable button during request to prevent double posting
                $scope.created = true;
                $modalInstance.close($scope.user);
            }).error(function (data, status) {
                $scope.addAlert("danger", "Uh-oh! Something went wrong. Please try again");
            });
        }
    }
};