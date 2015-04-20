describe('Date service', function () {
    var dateService;

    beforeAll(function () {
        var $injector = angular.injector(['SpotVizApp.services']);
        dateService = $injector.get('dateService');
    });

    it('Should be 2 itervals of 15 between 2015-01-01T19:00 and 2015-01-01T19:31 (fractional interval)', function () {

        var start = moment('2015-01-01 19:00').utc();
        var end = moment('2015-01-01 19:31').utc();
        var result = dateService.calculateIntervals(start, end, 15);

        expect(result).toBe(2);
    });

    it('Should be 2 itervals of 15 between 2015-01-01T19:00 and 2015-01-01T19:30 (whole interval)', function () {

        var start = moment('2015-01-01 19:00').utc();
        var end = moment('2015-01-01 19:30').utc();
        var result = dateService.calculateIntervals(start, end, 15);

        expect(result).toBe(2);
    });
    
    it('Should be 1 itervals of 15 between 2015-01-01T19:00 and 2015-01-01T19:29 (almost 2 intervals)', function () {

        var start = moment('2015-01-01 19:00').utc();
        var end = moment('2015-01-01 19:29').utc();
        var result = dateService.calculateIntervals(start, end, 15);

        expect(result).toBe(1);
    });    
    
    it('Should be 1 itervals of 30 between 2015-01-01T19:00 and 2015-01-01T19:30 )', function () {

        var start = moment('2015-01-01 19:00').utc();
        var end = moment('2015-01-01 19:30').utc();
        var result = dateService.calculateIntervals(start, end, 30);

        expect(result).toBe(1);
    }); 

    it('Should be 48 itervals of 30 between 2015-01-0T19:00 and 2015-01-02T19:00 )', function () {

        var start = moment('2015-01-01 19:00').utc();
        var end = moment('2015-01-02 19:00').utc();
        var result = dateService.calculateIntervals(start, end, 30);

        expect(result).toBe(48);
    }); 
});
