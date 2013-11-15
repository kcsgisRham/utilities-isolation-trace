define([
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esri/arcgis/utils",
    "esri/IdentityManager",
    "dojo/on",
    "esri/dijit/Geocoder",
    "dojo/_base/array",
    "esri/graphic",
    "esri/toolbars/draw",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/layers/GraphicsLayer",
    "esri/renderers/SimpleRenderer",
    "esri/InfoTemplate",
    "esri/dijit/LocateButton",
    "esri/geometry",
    "dojo/html",
    "dijit/form/Select",
    "esri/tasks/Geoprocessor",
    "esri/tasks/FeatureSet",
     "esri/layers/FeatureLayer",
     "esri/symbols/TextSymbol",
     "esri/geometry/Multipoint"

],
function (
    ready,
    declare,
    lang,
    arcgisUtils,
    IdentityManager,
    on,
    Geocoder,
    array,
    Graphic,
    Draw,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    GraphicsLayer,
    SimpleRenderer,
    InfoTemplate,
    LocateButton,
    Geometry,
    html,
    Select,
    Geoprocessor,
    FeatureSet,
    FeatureLayer,
    TextSymbol,
    Multipoint
) {
    return declare("", null, {
        config: {},
        constructor: function (config) {
            //config will contain application and user defined info for the template such as i18n strings, the web map id
            // and application id
            // any url parameters and any application specific configuration information. 
            this.config = config;
            ready(lang.hitch(this, function () {
                this._initPage();
                this._createWebMap();
            }));
        },
        _mapLoaded: function () {
            // Map is ready
            this._initMap();
            console.log('Map Initilized');

            console.log('map loaded');
            this._createLocatorButton();
            console.log('Locator Created');
            this._createGeocoder();
            console.log('Geocder Created');
            this._initGraphic();
            console.log('Graphics Created');
            this._createToolbar();
            console.log('Toolbar Created');
          

            console.log('Init Code Completed');
            dojo.style("loader", "display", "none");
            console.log('Loader Hidden');

        },
        _initPage: function () {

            var control;
            this.acticeFlag = false;
            this.acticeBarrier = false;
            document.title = this.config.i18n.page.title;
            html.set(dojo.byId("titleblock"), this.config.i18n.ui.title);
            html.set(dojo.byId("titleValves"), this.config.i18n.ui.valveCount);



            dojo.connect(dojo.byId('flagButton'), 'onclick', lang.hitch(this, function () {
                this.geoLocate.clear();
                this.acticeFlag = !this.acticeFlag;
                if (this.acticeFlag == true) {
                    document.getElementById("flagButton").className = "flagButtonPressed";
                    this.toolbar.activate(Draw.POINT);

                    document.getElementById("barrierButton").className = "barrierButtonNotPressed";

                    this.acticeBarrier = false;
                    

                }
                else {
                    document.getElementById("flagButton").className = "flagButtonNotPressed";
                    this.toolbar.deactivate();
                }

            }));

            dojo.connect(dojo.byId('barrierButton'), 'onclick', lang.hitch(this, function () {
                this.geoLocate.clear();
                this.acticeBarrier = !this.acticeBarrier;
                if (this.acticeBarrier == true) {

                    document.getElementById("barrierButton").className = "barrierButtonPressed";
                    this.toolbar.activate(Draw.POINT);

                    document.getElementById("flagButton").className = "flagButtonNotPressed";

                    this.acticeFlag = false;


                }
                else {
                    document.getElementById("barrierButton").className = "barrierButtonNotPressed";
                    this.toolbar.deactivate();

                }


            }));

            dojo.connect(dojo.byId('executeButton'), 'onclick', lang.hitch(this, function () {
                
                document.getElementById("flagButton").className = "flagButtonNotPressed";
                document.getElementById("barrierButton").className = "barrierButtonNotPressed";
                this.toolbar.deactivate();

                    this.acticeBarrier = false;
                    this.acticeFlag = false;

                    this._executeTrace();
                
            }));


            dojo.connect(dojo.byId('clearButton'), 'onclick', lang.hitch(this, function () {
                   // document.getElementById("barrierButton").className = "barrierButtonNotPressed";
                   // document.getElementById("flagButton").className = "flagButtonNotPressed";
                    this.acticeFlag = false;
                    this.acticeBarrier = false;
                    this.geoLocate.clear();
                    this.map.graphics.clear();
                    this.resultLayer.clear();
                    this.flagLayer.clear();
                    this.barrierLayer.clear(); 
                    dojo.byId('infoSignal').innerHTML = "0";

            }));


        },
        _createLocatorButton: function () {
            this.geoLocate = new LocateButton({
                map: this.map,
                pointerGraphic: new Graphic()
            }, "LocateButton");

            this.geoLocate.on("locate", lang.hitch(this, function (location) { }));

            this.geoLocate.startup();
        },
        _createGeocoder: function () {

            this.geocoder = new Geocoder({
                autoComplete: true,
                theme: "simpleGeocoder",
                arcgisGeocoder: {
                    placeholder: this.config.i18n.geocoder.defaultText,
                    searchExtent: this.map.extent

                },
                map: this.map
            }, dojo.byId('searchDiv'));

            this.geocoder.on("select", lang.hitch(this, function (result) {
                console.log(result); 
            }));
            // address search startup
            this.geocoder.startup();


        },
        _createToolbar: function () {
            this.toolbar = new Draw(this.map);
            this.toolbar.on("draw-end", lang.hitch(this, this._drawEnd));
            esri.bundle.toolbars.draw.addPoint = this.config.i18n.map.mouseToolTip;
            this.toolbar.deactivate();

        },
        _initGraphic: function () {
            this.flagSymbol = new SimpleMarkerSymbol().setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z").setSize(30).setColor(new dojo.Color([0, 0, 255]));
            this.flagSymbol.xoffset = 2;
            this.flagSymbol.yoffset = 15; 
            this.barrierSymbol = new SimpleMarkerSymbol().setPath("M23.963,20.834L17.5,9.64c-0.825-1.429-2.175-1.429-3,0L8.037,20.834c-0.825,1.429-0.15,2.598,1.5,2.598h12.926C24.113,23.432,24.788,22.263,23.963,20.834z").setSize(25).setColor(new dojo.Color([255, 0,0]));
            this.valveSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.CIRCLE).setSize(24).setColor(new dojo.Color([0, 255, 255, 0.5])).setOutline(new SimpleLineSymbol().setStyle(SimpleLineSymbol.SOLID).setColor(new dojo.Color([0, 255, 255])).setWidth(5));
            this.valveSymbol.xoffset = 3;
            this.valveSymbol.yoffset = -4;

            this.flagRend = new SimpleRenderer(this.flagSymbol);
            this.barrierRend = new SimpleRenderer(this.barrierSymbol);
            this.valveRend = new SimpleRenderer(this.valveSymbol);
        },
        _drawEnd: function (evt) {
            this._addToMap(evt.geometry);
        },
        _addToMap: function (point) {
            this.map.infoWindow.hide();
            //array.forEach(this.map.graphicsLayerIds, function (layID) {
            //    var lay = this.map.getLayer(layID);
            //    lay.clear();

            //    if (typeof lay.clearSelection == 'function') {
            //        lay.clearSelection();
            //    }

            //}, this);

            //array.forEach(this.map.layerIds, function (layID) {
            //    var lay = this.map.getLayer(layID);
            //    if (typeof lay.clearSelection == 'function') {
            //        lay.clearSelection();
            //    }

            //}, this);

            this.flagLayer.setRenderer(this.barrierRend); 
            this.barrierLayer.setRenderer(this.barrierRend);

            if (document.getElementById("flagButton").className == "flagButtonPressed") {
            
                this.flagLayer.setRenderer(this.flagRend);

                this.flag = new Graphic(point, this.flagSymbol, null, null);
                this.flagLayer.add(this.flag);

            }
            else if (document.getElementById("barrierButton").className == "barrierButtonPressed") {

                this.barrier = new Graphic(point, this.barrierSymbol, null, null);;
                this.barrierLayer.add(this.barrier);
            }
            
        },
        _executeTrace: function () {

            if (this.flagLayer.graphics == null)
                return;


            if (this.flagLayer.graphics.length == 0)
                return;
            if (document.getElementById("executeButton").className == "executeButtonProcess")
                return;

            document.getElementById("executeButton").className = "executeButtonProcess";
            
            this.gp.setOutSpatialReference(this.map.spatialReference);
            
            var flagFeature = new FeatureSet();
            var barrierFeature = new FeatureSet();

            flagFeature.features = this.flagLayer.graphics;

            barrierFeature.features=this.barrierLayer.graphics; 

            if (this.barrier == undefined) {
                var params = { "Flags": flagFeature };
                var gpDeferred = this.gp.submitJob(params, lang.hitch(this, this._traceResults), lang.hitch(this, this._traceCallback), lang.hitch(this, this._errFeatures));

                gpDeferred.addErrback(function (error) {
                    console.log(error);
                    document.getElementById("executeButton").className = "executeButton";

                });
            }
            else {

                var params = { "Flags": flagFeature, "Barriers": barrierFeature };

                var gpDeferred = this.gp.submitJob(params, lang.hitch(this, this._traceResults), lang.hitch(this, this._traceCallback), lang.hitch(this, this._errFeatures));

           
            }
        },
        _traceCallback: function (jobInfo) {
            console.log(jobInfo.jobStatus);
            dojo.style("loader", "display", "block");
            dojo.byId('infoSignal').innerHTML = "--- "
        },
        _traceResults: function (jobInfo) {
            console.log(jobInfo.results);
            this.resultLayer.clear();

            var parts = this.config.gpOutput.split(",");
            if (parts.length > 0) {
                array.forEach(parts, function (results) {

                    this.gp.getResultData(jobInfo.jobId, results, lang.hitch(this, this._addFeatures), lang.hitch(this, this._errFeatures));

                },this);
            }
            
        },
        _errFeatures: function (error) {
            console.log(error);
            alert(error);
            dojo.style("loader", "display", "none");
            document.getElementById("executeButton").className = "executeButton";

        },
        _addFeatures: function (result, messages) {
            console.log(result);
            var multiPoint = new Multipoint(this.map.spatialReference);
            var valvefeatures = result.value.features;
            for (var f = 0, fl = valvefeatures.length; f < fl; f++) {
                var feature = valvefeatures[f];
                feature.setSymbol(this.valveSymbol);
                this.resultLayer.add(feature);
                multiPoint.addPoint(feature.geometry);

                //if (typeof feature.getDojoShape == 'function') {
                //    feature.getDojoShape().moveToFront();
                //}
            }
            var ext = multiPoint.getExtent();
            if (ext) {
                this.map.setExtent(ext.expand(1.5));
            }
            var displayText = valvefeatures.length;
            var textSymbol = new TextSymbol(displayText);
            dojo.byId('infoSignal').innerHTML = displayText;
            dojo.style("loader", "display", "none");
            document.getElementById("executeButton").className = "executeButton";


        },

        _initMap: function () {
            console.log("InitMap");
           this.gp = new esri.tasks.Geoprocessor(this.config.gpUrl);

           //this.flagFeature = new FeatureSet();
           // this.barrierFeature = new FeatureSet();

            this.flagLayer = new GraphicsLayer();
            this.barrierLayer = new GraphicsLayer();
            this.resultLayer = new GraphicsLayer();
            this.flagLayer.name = "Flag Layer";
            this.barrierLayer.name = "Barrier Layer";
            this.resultLayer.name = "Results Layer";
            this.resultLayer.setRenderer(this.valveRend);

            this.map.addLayers([this.flagLayer, this.barrierLayer, this.resultLayer]); 


        },
        //create a map based on the input web map id
        _createWebMap: function () {
            //dojo.style("loader", "display", "block");

            arcgisUtils.createMap(this.config.webmap, "mapDiv", {
                mapOptions: {
                    //Optionally define additional map config here for example you can 
                    //turn the slider off, display info windows, disable wraparound 180, slider position and more. 
                },
                bingMapsKey: this.config.bingMapsKey
            }).then(lang.hitch(this, function (response) {
                //Once the map is created we get access to the response which provides important info 
                //such as the map, operational layers, popup info and more. This object will also contain
                //any custom options you defined for the template. In this example that is the 'theme' property.
                //Here' we'll use it to update the application to match the specified color theme.  
                console.log(this.config);
                this.layers = response.itemInfo.itemData.operationalLayers;


                this.map = response.map;
                if (this.map.loaded) {
                    // do something with the map
                    this._mapLoaded();
                } else {
                    on.once(this.map, "load", lang.hitch(this, function () {
                        // do something with the map
                        this._mapLoaded();
                    }));
                }
            }), lang.hitch(this, function (error) {
                //an error occurred - notify the user. In this example we pull the string from the 
                //resource.js file located in the nls folder because we've set the application up 
                //for localization. If you don't need to support mulitple languages you can hardcode the 
                //strings here and comment out the call in index.html to get the localization strings. 
                if (this.config && this.config.i18n) {
                    alert(this.config.i18n.map.error + ": " + error.message);
                } else {
                    alert("Unable to create map: " + error.message);
                }
            }));
        }

    });
});