define([], function () {
    //Default configuration settings for the applciation. This is where you'll define things like a bing maps key, 
    //default web map, default app color theme and more. These values can be overwritten by template configuration settings
    //and url parameters.
    var defaults = {
        "appid": "",
        "webmap": "0b78192dd64f46f78829b2bf4e767f34", // "0eece0d5de2140e9a44d8050f943fd18", "de5ae0c2040c49d38e9ea0637454ac73"
        "oauthappid": null, //"AFTKRmv16wj14N3z",
        //Group templates must support a group url parameter. This will contain the id of the group. 
        //group: "",
        //Enter the url to the proxy if needed by the applcation. See the 'Using the proxy page' help topic for details
        //http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
        "proxyurl": "",
        //Example of a template specific property. If your template had several color schemes
        //you could define the default here and setup configuration settings to allow users to choose a different
        //color theme.  
        "theme": "blue",
        "bingmapskey": "", //Enter the url to your organizations bing maps key if you want to use bing basemaps
        "sharinghost": location.protocol + "//" + "www.arcgis.com", //Defaults to arcgis.com. Set this value to your portal or organization host name. 

        

        "routeLengthLabelUnits": "Feet",
        /* one of 	UNIT_STATUTE_MILE, 
        UNIT_FOOT, 
        UNIT_KILOMETER, 
        UNIT_METER, 
        UNIT_NAUTICAL_MILE, 
        UNIT_US_NAUTICAL_MILE, 
        UNIT_DEGREE */
        "bufferEsriUnits": "UNIT_FOOT",
        "bufferWKID": "102100",
        "bufferDistance": 500,
        "facilitySearchDistance": 20000,

        "geometryUrl": "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",

        "gpUrl": "http://localhost:6080/arcgis/rest/services/WebTrace_Final/GPServer/Trace",
        "gpOutput": "SystemValve"
        
    };
    return defaults;
});