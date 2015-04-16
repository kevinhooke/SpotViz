var variableDateApp = angular.module('DateControllers', []);
variableDateApp.controller('VariableRateDateCtrl', function ($scope, $interval) {

    var runningCounter = null;
    $scope.iterations = 0; //number of times the interval runs, 0 = continuous
    $scope.date = moment();
    $scope.updateRate = 1; //number of seconds betweeb updates
    $scope.timeInterval = 30; //how many minutes the date advances on each iteration
    $scope.state = "Stopped";

    $scope.start = function () {
        //if already running, do nothing
        if (runningCounter != null) {
            return;
        }
        else {
            $scope.state = "Running";

            runningCounter = $interval(function () {
                $scope.date = moment($scope.date).add($scope.timeInterval, 'minutes');
            }, 1000 * $scope.updateRate, $scope.iterations);
        }
    }


    $scope.stop = function () {
        if ($interval.cancel(runningCounter) ){
            $scope.state = "Stopped";
            runningCounter = null;
        }

    }

    $scope.cancel = function () {
        if ($interval.cancel(runningCounter)){
            runningCounter = null;
        }

    }

    $scope.changeRate = function () {
        $scope.cancel();
        runningCounter = $interval(function () {
            $scope.date = moment($scope.date).add($scope.timeInterval, 'minutes');
        }, 1000 * $scope.updateRate, $scope.iterations);
    };
});
