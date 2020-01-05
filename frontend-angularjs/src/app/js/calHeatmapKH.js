// KH customized version of angular-cal-heatmap-directive
//original source: https://github.com/shekhargulati/angular-cal-heatmap-directive

"use strict";
export default angular.module("calHeatmapKH", []).directive("calHeatmap", function () {
    function a(a, b) {
        var c = a.config, d = b[0], e = new CalHeatMap;

        //KH: build config here instead of inline to avoid setting invalid defaults, e.g. subDomain=day when domain=day
        var config = {};
        config = {
            itemSelector: d,
            domain: c && c.domain ? c.domain : "month",
            //KH removed default of "day" because this is invalid id domain="day"
            //subDomain: c && c.subDomain ? c.subDomain : "day",
            //subDomainTextFormat: c && c.subDomainTextFormat ? c.subDomainTextFormat : "%d",
            data: c && c.data ? c.data : "",
            start: c && c.start ? c.start : new Date,
            cellSize: c && c.cellSize ? c.cellSize : 25,
            range: c && c.range ? c.range : 3,
            domainGutter: c && c.domainGutter ? c.domainGutter : 10,
            legend: c && c.legend ? c.legend : [2, 4, 6, 8, 10],
            itemName: c && c.itemName ? c.itemName : "item",
            //KH added:
            rowLimit: c && c.rowLimit ? c.rowLimit : "",
        }

        if(c.subDomain){
            config.subDomain = c.subDomain;
        }
        if(c.subDomainTextFormat){
            config.subDomainTextFormat = c.subDomainTextFormat;
        }

        e.init(config);
    }

    return {template: '<div id="cal-heatmap" config="config"></div>', restrict: "E", link: a, scope: {config: "="}}
});
