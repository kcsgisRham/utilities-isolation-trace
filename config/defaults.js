define([], function () {
    //Default configuration settings for the applciation. This is where you'll define things like a bing maps key, 
    //default web map, default app color theme and more. These values can be overwritten by template configuration settings
    //and url parameters.
    var defaults = {
        "appid": "",
        "webmap": "067b19e4be4d4b04a6443a4fd47c86a3",
        "oauthappid": null, //"AFTKRmv16wj14N3z",
        //Group templates must support a group url parameter. This will contain the id of the group. 
        //group: "",
        //Enter the url to the proxy if needed by the applcation. See the 'Using the proxy page' help topic for details
        //http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
        "proxyurl": "http://localhost/proxy/auth_proxy.ashx",
        //Example of a template specific property. If your template had several color schemes
        //you could define the default here and setup configuration settings to allow users to choose a different
        //color theme.  
        "theme": "blue",
        "bingMapsKey": "", //Enter the url to your organizations bing maps key if you want to use bing basemaps
        "sharinghost": location.protocol + "//" + "www.arcgis.com", //Defaults to arcgis.com. Set this value to your portal or organization host name. 

        "geometryUrl": "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",

        "gpUrl": "http://localhost:6080/arcgis/rest/services/IsolationTrace/GPServer/IsolationTrace",
        "tabContent": "----",
        "appParams": [
            {
                "GPParam": "Isolating_Valves",
                "saveToLayerName": "System Valve Trace Results",
                "summaryText": "{Count} Valves Returned in Trace",
                "displayText": "{DIAMETER} inch Valve: {FACILITYID}",
                "highlightSymbol":
                    {

                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [0, 0, 0, 0],
                        "size": 22,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": -2,
                        "outline":
                         {
                             "color": [255, 0, 0, 255],
                             "width": 4
                         }


                    },
                "bypassDetails":
                    {
                        "skipable": true,
                        "IDField": "FACILITYID"
                    }
            },
            {
                "GPParam": "Isolated_Hydrants",
                "saveToLayerName": "Hydrant Trace Results",
                "summaryText": "{Count} hydrants Returned in Trace",
                "displayText": "{FACILITYID} blah blah",
                "highlightSymbol":
                    {

                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [0, 0, 0, 0],
                        "size": 22,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": -2,
                        "outline":
                         {
                             "color": [255, 255, 0, 255],
                             "width": 4
                         }



                    },
                "bypassDetails":
                     {
                         "skipable": false,
                         "IDField": ""
                     }


            },
             {
                 "GPParam": "Isolated_Customers",
                 "saveToLayerName": "Customer Trace Results",
                 "summaryText": "{Count} Customers Returned in Trace",
                 "displayText": "{FACILITYID} blah blah",
                 "highlightSymbol":
                    {

                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [0, 0, 0, 0],
                        "size": 22,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": -2,
                        "outline":
                         {
                             "color": [122, 122, 255, 255],
                             "width": 4
                         }


                    },
                 "bypassDetails":
                      {
                          "skipable": false,
                          "IDField": ""
                      }

             }
        ],
      


    };
    return defaults;
});