var MapVizServices = angular.module('SpotVizApp.services', [])
    .factory('dateService', function () {

        var serviceImpl = {};

        return {
            //calculates number of intervals of length interval between start and end
            calculateIntervals: function (startDate, endDate, interval) {
                var timePeriods;
                var diff = endDate.diff(startDate);
                console.log('diff: ' + diff);
                
                var dur = moment.duration(diff).asMinutes();
                
                console.log('dur as mins: ' + dur);
                
                timePeriods = Math.floor(dur / interval);
                
                return timePeriods;
            }
        };

        return serviceImpl;
    });

module.exports = MapVizServices;