var variableDateApp = angular.module('DateControllers', []);
variableDateApp.controller('VariableRateDateCtrl', function ($scope, $interval) {

    var runningCounter = null;
    $scope.debugMsg = null;
    $scope.iterations = 0; //number of times the interval runs, 0 = continuous
    $scope.date = moment();
    $scope.updateRate = 1; //number of seconds betweeb updates
    $scope.timeInterval = 30; //how many minutes the date advances on each iteration
    $scope.state = "Stopped";

    //progress bar
    $scope.maxValue=10;
    $scope.currentValue=1;
    
    
    
    $scope.start = function () {
        //if already running, do nothing
        if (runningCounter != null) {
            return;
        }
        else {
            $scope.state = "Running";
            var intervalBoundaries = [];
            
            //calc difference in minutes: selectedEndDateTime - selectedStartDateTime
            var startMoment = moment.utc($scope.selectedStartDateTime);
            var endMoment = moment.utc($scope.selectedEndDateTime);
            var totalMinutesInSelectedTimeRange = (endMoment.subtract(startMoment)).minutes();
            $scope.debugMsg = "Minutes: " + totalMinutesInSelectedTimeRange;
            
            // totalMinutesInSelectedTimeRange / $scope.timeInterval
            var numberOfIntervalsInSelectedRange = 
            	Math.ceil(totalMinutesInSelectedTimeRange / $scope.timeInterval);
            $scope.debugMsg = $scope.debugMsg + " / intervals: " + numberOfIntervalsInSelectedRange;
            
            //calc array of interval start and end times between selected start and end
            var tempIntervalCount = 0;
            var currentIntervalStartDate = moment.utc(startMoment);
        	var currentIntervalEndDate = null;
            while(tempIntervalCount < numberOfIntervalsInSelectedRange){
            	//first time through tempIntervalCount=0 so no minutes are added to the start date
            	//time operations modify the original value
            	currentIntervalStartDate.add((tempIntervalCount * $scope.timeInterval), 'minutes');
            	//TODO: need to check time ranges are inclusive and we don't loose anything in a gap
            	currentIntervalEndDate = moment.utc(currentIntervalStartDate);
            	currentIntervalEndDate.add($scope.timeInterval, 'minutes');
            	
            	intervalBoundaries[tempIntervalCount] = {
            			intervalStartDate : currentIntervalStartDate,
            			intervalEndDate : currentIntervalEndDate
            	};
            	
            	tempIntervalCount++;
            }
            
            runningCounter = $interval(function () {
                $scope.date = moment($scope.date).add($scope.timeInterval, 'minutes');
                $scope.currentValue = $scope.currentValue + 1;
                                
                //TODO: within interval, use current interval as index to array of start and end to
                //select range of spots for this interval for display
                
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
