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
     "esri/geometry/Multipoint",
     "dijit/layout/TabContainer",
     "dijit/layout/ContentPane",
     "dojox/layout/ContentPane",
     "dijit/form/Button",
     "dojo/dom-construct",
     "dijit/layout/StackContainer",
     "dijit/layout/StackController",
     "dojo/dom-prop",
     "dojox/grid/DataGrid",
     "dojo/data/ItemFileReadStore",
     "dijit/form/ToggleButton"

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
    Multipoint,
    TabContainer,
    ContentPane,
    ContentPaneX,
    Button,
    domConstruct,
    StackContainer,
    StackController,
    domProp,
    dataGrid,
    ItemFileReadStore,
    ToggleButton

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
            this._createToolbar();
            console.log('Toolbar Created');

            //this._createDataGrid();
            //console.log('Grid Created');
            this._createStackCont();
            console.log('Stack Created');

            this._initMap();
            console.log('Map Initilized');
            console.log('map loaded');
            this._createLocatorButton();
            console.log('Locator Created');
            this._createGeocoder();
            console.log('Geocder Created');
            this._initGraphic();
            console.log('Graphics Created');


            console.log('Init Code Completed');
            dojo.style("loader", "display", "none");
            console.log('Loader Hidden');

        },
        _initPage: function () {
            var control;
            this.acticeFlag = false;
            this.acticeBarrier = false;
            document.title = this.config.i18n.page.title;
            //  html.set(dojo.byId("titleblock"), this.config.i18n.ui.title);


            dojo.connect(dojo.byId("tools.addFlag"), 'onclick', lang.hitch(this, function () {
                if (domProp.get(dijit.byId("tools.addFlag"), "iconClass") == "customBigIcon flagIconSelected") {

                    this._toggleControls("false");

                }
                else {
                    this._toggleControls("flag");

                }
            }));
            dojo.connect(dojo.byId("tools.addBarrier"), 'onclick', lang.hitch(this, function () {


                if (domProp.get(dijit.byId("tools.addBarrier"), "iconClass") == "customBigIcon barrierIconSelected") {

                    this._toggleControls("false");

                }
                else {
                    this._toggleControls("barrier");

                }

            }));
            dojo.connect(dojo.byId("tools.trace"), 'onclick', lang.hitch(this, function () {
                this._toggleControls("false");
                this._executeTrace();

            }));
            dojo.connect(dojo.byId("tools.clear"), 'onclick', lang.hitch(this, function () {
                this._toggleControls("false");

                this.geoLocate.clear();

                this.map.graphics.clear();
                this.resultLayer.clear();
                this.flagLayer.clear();
                this.barrierLayer.clear();


            }));

        },
        _toggleControls: function (active) {

            if (this.toolbar == null)
                return;

            if (active == "false") {
                this.toolbar.deactivate();
                dijit.byId("tools.addBarrier").set("iconClass", "customBigIcon barrierIcon");
                dijit.byId("tools.addFlag").set("iconClass", "customBigIcon flagIcon");

            }
            else if (active == "flag") {

                this.toolbar.activate(Draw.POINT);
                dijit.byId("tools.addBarrier").set("iconClass", "customBigIcon barrierIcon");
                dijit.byId("tools.addFlag").set("iconClass", "customBigIcon flagIconSelected");

            }
            else if (active == "barrier") {

                this.toolbar.activate(Draw.POINT);
                dijit.byId("tools.addBarrier").set("iconClass", "customBigIcon barrierIconSelected");
                dijit.byId("tools.addFlag").set("iconClass", "customBigIcon flagIcon");

            }
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
        _createStackCont: function () {
            this.sc = new StackContainer({
                class: "resultPane",

                id: "myProgStackContainer"
            }, "stackContainer");

            //  style: "height: 80%; width: 100%;",
            this.cps = [];
            array.forEach(this.config.appParams, function (appParam) {


                var cp = new ContentPane({
                    title: appParam.GPParam.replace("_", " "),
                    name: appParam.GPParam,
                    id: appParam.GPParam + "CP"

                });



                var idStart = appParam.GPParam; //message.result.ParamName; //appParam.GPParam;

                cp.startup();

                this.cps.push(cp);
                this.sc.addChild(cp);




            }, this);


            this.controller = new StackController({ containerId: "myProgStackContainer" }, "stackControl");

            this.sc.startup();
            this.controller.startup();
            this.sc.resize()

        },
        _createDataGrid: function () {
            this.sc = new StackContainer({
                style: "height: 80%; width: 100%;",
                id: "myProgStackContainer"
            }, "stackContainer");

            this.grds = [];
            this.cps = [];
            array.forEach(this.config.appParams, function (appParam) {


                // content: this.config.tabContent,
                var cp = new ContentPaneX({
                    title: appParam.GPParam.replace("_", " "),
                    name: appParam.GPParam,
                    id: appParam.GPParam + "CP"

                });



                var idStart = appParam.GPParam; //message.result.ParamName; //appParam.GPParam;
                //var cp = dijit.byId(idStart + "CP");



                /*create a new grid*/
                var grid = new dataGrid({
                    id: idStart + "GD",
                    rowSelector: '20px',
                    autowidth: 'true'
                });

                this.grds.push(grid);
                dojo.place(grid.domNode, cp.containerNode, 'first');
                // dojo.connect(grid, "_onFetchComplete", grid, "_resize");

                grid.startup();
                cp.startup();

                this.cps.push(cp);
                this.sc.addChild(cp);




            }, this);


            this.controller = new StackController({ containerId: "myProgStackContainer" }, "stackControl");

            this.sc.startup();
            this.controller.startup();
            this.sc.resize()

        },
        _populateDataGrid: function (items, selectedappParam) {
            var gd = dijit.byId(message.result.paramName + "GD");
            if (gd.structure == null) {
                var layout = [[]];
                var flds = selectedappParam.displayFields.split(",");

                layout[0] = dojo.map(message.result.value.fields, lang.hitch(this, function (result) {
                    //"esriFieldTypeOID" //esriFieldTypeDouble //esriFieldTypeSmallInteger //esriFieldTypeInteger
                    //"esriFieldTypeString"
                    //esriFieldTypeDate

                    // if (flds.indexOf(result.name)>= 0 ) {
                    if (result.type == "esriFieldTypeDate") {

                        return { 'name': result.alias, 'field': result.name, editable: false, formatter: this._formatDate };
                    }//formatter:lang.hitch(this,this._formatDate )
                    else {
                        return { 'name': result.alias, 'field': result.name, editable: false };
                    }
                    //  }



                }));


                gd.setStructure(layout);

            }

            var data = {
                identifier: "OID",
                label: "OID",
                items: items
            };

            store = new ItemFileReadStore({ data: data });



            gd.setStore(store);
            gd.update();
            gd.resize();
            this.sc.resize();
        },
        _populateResultsToggle: function (selectedappParam) {
            var cp = dijit.byId(selectedappParam.GPParam + "CP");
            cp.set("content", "");


            array.forEach(selectedappParam.results, function (resultItem) {
                var process = true;

                if (this.skipLayer.graphics.length > 0)
                {
                   array.some(this.skipLayer.graphics, function (skipItem) {

                        if (resultItem.geometry.x == skipItem.geometry.x && resultItem.geometry.y == skipItem.geometry.y) {
                            process = false;
                            return false;
                        }
                        if (resultItem.attributes.FACILITYID == skipItem.attributes.FACILITYID) {
                            process = false;
                            return false;
                        }
                    });
                }
                if (process) {
                    var graphic = resultItem;
                    graphic.setSymbol(this.selectionSymbol);

                    this.resultLayer.add(graphic);
                    this.multiPoint.addPoint(graphic.geometry);

                    var div = domConstruct.create('div', { "id": selectedappParam.GPParam + ":" + resultItem.attributes.OID + "div", class: "resultItem" }, cp.containerNode);

                    var btnDiv = domConstruct.create('div', { "id": selectedappParam.GPParam + ":" + resultItem.attributes.OID + "BtnDiv" }, div);

                    if (selectedappParam.addSkipButton) {

                        var btn = new Button({
                            id: selectedappParam.GPParam + ":" + resultItem.attributes.OID + "Btn",

                            baseClass: "",
                            iconClass: "resultItemButtonIcon resultItemButton",
                            showLabel: false

                        }, btnDiv);
                        btn.startup();

                        var lbl = domConstruct.create('label', { class: "resultItemLabel", "for": selectedappParam.GPParam + ":" + resultItem.attributes.OID + "Btn", 'innerHTML': lang.replace(selectedappParam.displayText, resultItem.attributes) }, div);
                        resultItem.buttonID = selectedappParam.GPParam + ":" + resultItem.attributes.OID + "Btn";
                        var skipLoc = new Graphic(resultItem.geometry, this.skipSymbol, resultItem.attributes, null);
                        btn.graphic = skipLoc;
                        dojo.connect(btn, "onClick", lang.hitch(this, this._skipBtn(resultItem)));
                    }
                    else {
                        var lbl = domConstruct.create('label', { 'innerHTML': lang.replace(selectedappParam.displayText, resultItem.attributes) }, div);

                    }

                }
            }, this);

            //cp.set("content", message.result.paramName);

            //var replace = /{Count}/gi;
            //var count = resultFeatures.length;
            //var outputText = selectedappParam.displayText.replace(/{Count}/gi, count);


            //var div1 = domConstruct.create('div', { "id": appParam.GPParam + "GDDiv", "style": "height:100%" }, cp.containerNode);

            // var div1 = domConstruct.create('div', { "id": message.result.paramName + "GDDiv", "style": "height:100%;width:100%" }, cp.containerNode);



            //var lbl = domConstruct.create('label', { "for": result.paramName + "Btn", 'innerHTML': outputText }, cp.containerNode);

            //var div1 = domConstruct.create('div', { "id": result.paramName + "Btn" }, cp.containerNode);
            // build more html using domConstruct, like a table etc


            //var btn = new Button({
            //    label: 'Save', "id": result.paramName + "Btn2"

            //}, div1);

            //dojo.connect(btn, "onClick", lang.hitch(this, this._saveBtn(selectedappParam)));


        },
        _skipBtn: function (resultItem) {
            return function (e) {
                var btn = dijit.byId(resultItem.buttonID);

                if (btn.get("iconClass") == "resultItemButtonIconSelected resultItemButton") {
                    btn.set("iconClass", "resultItemButtonIcon resultItemButton");
                    this.skipLayer.remove(btn.graphic);
                }
                else {
                    btn.set("iconClass", "resultItemButtonIconSelected resultItemButton");
                    this.skipLayer.add(btn.graphic);

                }
             
              
            }
        },
        _createTabs: function () {
            this.tc = new TabContainer({ name: "panelResultsTab" }, "panelResultsTab");

            this.cps = [];
            array.forEach(this.config.appParams, function (appParam) {



                var cp1 = new ContentPane({
                    title: appParam.GPParam.replace("_", " "),
                    content: this.config.tabContent,
                    name: appParam.GPParam,
                    id: appParam.GPParam + "CP"

                });


                this.cps.push(cp1);
                this.tc.addChild(cp1);
            }, this);

            this.tc.startup();
            this.tc.resize();

        },
        _createToolbar: function () {
            this.toolbar = new Draw(this.map);
            this.toolbar.on("draw-end", lang.hitch(this, this._drawEnd));
            this.toolbar.on("draw-complete", lang.hitch(this, this._drawComplete));

            esri.bundle.toolbars.draw.addPoint = this.config.i18n.map.mouseToolTip;
            this.toolbar.deactivate();

        },
        _initGraphic: function () {


            this.flagSymbol = new SimpleMarkerSymbol().setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z").setSize(30).setColor(new dojo.Color([0, 0, 255]));
            this.flagSymbol.xoffset = 4;
            this.flagSymbol.yoffset = 15;

            this.barrierSymbol = new SimpleMarkerSymbol().setPath("m241.78999,288.7684l45.98341,-45.9834l65.03485,0l45.98453,45.9834l0,65.03488l-45.98453,45.98172l-65.03485,0l-45.98341,-45.98172l0,-65.03488z").setSize(25).setColor(new dojo.Color([255, 0, 0]));
            this.selectionSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.CIRCLE).setSize(24).setColor(new dojo.Color([0, 255, 255, 0.5])).setOutline(new SimpleLineSymbol().setStyle(SimpleLineSymbol.SOLID).setColor(new dojo.Color([0, 255, 255])).setWidth(5));

            this.skipSymbol = new SimpleMarkerSymbol().setPath("M29.225,23.567l-3.778-6.542c-1.139-1.972-3.002-5.2-4.141-7.172l-3.778-6.542c-1.14-1.973-3.003-1.973-4.142,0L9.609,9.853c-1.139,1.972-3.003,5.201-4.142,7.172L1.69,23.567c-1.139,1.974-0.207,3.587,2.071,3.587h23.391C29.432,27.154,30.363,25.541,29.225,23.567zM16.536,24.58h-2.241v-2.151h2.241V24.58zM16.428,20.844h-2.023l-0.201-9.204h2.407L16.428,20.844z").setSize(25).setColor(new dojo.Color([255, 255, 0]));

            //this.skipSymbol.xoffset = 2;
            //this.skipSymbol.yoffset = 15;



            this.flagRen = new SimpleRenderer(this.flagSymbol);
            this.barrierRen = new SimpleRenderer(this.barrierSymbol);
            this.selectionRen = new SimpleRenderer(this.selectionSymbol);
            this.skipRen = new SimpleRenderer(this.selectionSymbol);
        },
        _drawEnd: function (evt) {
            this._addToMap(evt.geometry);
        },
        _drawComplete: function (evt) {
            this.map.graphics.clear();

        },
        _clearSelected: function (evt) {
            if ((domProp.get(dijit.byId("tools.addFlag"), "iconClass") == "customBigIcon flagIconSelected") || (domProp.get(dijit.byId("tools.addBarrier"), "iconClass") == "customBigIcon barrierIconSelected"))

            {     
                this.map.graphics.clear();
            }


       

        },
        _addToMap: function (point) {
            this.map.infoWindow.hide();
           
            if (domProp.get(dijit.byId("tools.addFlag"), "iconClass") == "customBigIcon flagIconSelected") {


                this._addFlag(point);

            }
            else if (domProp.get(dijit.byId("tools.addBarrier"), "iconClass") == "customBigIcon barrierIconSelected") {

                this._addBarrier(point);

            }
            else {
                return;

            }

        },
        _addFlag: function (point) {

            var flag = new Graphic(point, this.flagSymbol, null, null);
            this.flagLayer.add(flag);

        },
  
       
        _addBarrier: function (point) {
            barrier = new Graphic(point, this.barrierSymbol, null, null);;
            this.barrierLayer.add(barrier);

        },
        _executeTrace: function () {
          
            if (this.flagLayer.graphics == null)
                return;


            if (this.flagLayer.graphics.length == 0)
                return;

            if (domProp.get(dijit.byId("tools.trace"), "iconClass") == "customBigIcon traceIconProcessing")
                return;

            dijit.byId("tools.trace").set("iconClass", "customBigIcon traceIconProcessing");


            var flagFeature = new FeatureSet();
            var barrierFeature = new FeatureSet();
            var skipFeature = new FeatureSet();

            flagFeature.features = this.flagLayer.graphics;
            barrierFeature.features = this.barrierLayer.graphics;
            skipFeature.features = this.skipLayer.graphics;

            var params = { "Flags": flagFeature };
            if (this.barrierLayer.graphics.length > 0) {
                params.Barriers = barrierFeature ;
            }
            if (this.skipLayer.graphics.length > 0) {
                params.SkipLocations = skipFeature ;
            }
            //, "Barriers": barrierFeature, "SkipLocations": skipFeature 

            //if (this.barrierLayer.graphics.length == undefined) {
            //    var params = { "Flags": flagFeature, "Barriers": barrierFeature, "SkipLocations": skipFeature};

            //}
            //else {
            //    barrierFeature.features = this.barrierLayer.graphics;

            //    var params = { "Flags": flagFeature, "Barriers": barrierFeature };

            //}
            this.gp.submitJob(params);

        },
        _traceCallback: function (message) {
            console.log(message.jobInfo.jobStatus);
        },
        _traceResults: function (message) {
            if (message.jobInfo.jobStatus == "esriJobFailed") {
                console.log(message.jobInfo.jobStatus);
                alert(this.config.i18n.gp.failed);
                dojo.style("loader", "display", "none");
                dijit.byId("tools.trace").set("iconClass", "customBigIcon traceIcon");
                return;

            }
            console.log(message.jobInfo.results);
            this.resultLayer.clear();
            this.multiPoint = new Multipoint(this.map.spatialReference);
            this.resultsCnt = 0;


            array.forEach(this.config.appParams, function (appParam) {

                this.resultsCnt = this.resultsCnt + 1;

                this.gp.getResultData(message.jobInfo.jobId, appParam.GPParam).then(lang.hitch(this, function () {
                    this.resultsCnt = this.resultsCnt - 1

                    if (this.resultsCnt == 0) {

                        dojo.style("loader", "display", "none");
                        dijit.byId("tools.trace").set("iconClass", "customBigIcon traceIcon");
                        var ext = this.multiPoint.getExtent();
                        if (ext) {
                            this.map.setExtent(ext.expand(1.5));
                        }
                    }
                }));


            }, this);


        },
        _errFeatures: function (message) {
            console.log(message.error);
            alert(message.error.message);
            dojo.style("loader", "display", "none");
            dijit.byId("tools.trace").set("iconClass", "customBigIcon traceIcon");

        },
        _addFeatures: function (message) {
            console.log(message.result.paramName);
            var selectedappParam;

            array.some(this.config.appParams, function (appParam) {
                if (message.result.paramName == appParam.GPParam) {

                    selectedappParam = appParam;
                    return false;
                }
            });

            var resultFeatures = message.result.value.features;
            selectedappParam.results = resultFeatures;
            //this._addResultsToMap(resultFeatures);
            this._populateResultsToggle(selectedappParam);

            //for (var f = 0, fl = resultFeatures.length; f < fl; f++) {



            //}






        },
        //_addResultsToMap: function (resultFeatures) {
        //    return items = dojo.map(resultFeatures, lang.hitch(this, function (result) {

        //        var graphic = result;
        //        graphic.setSymbol(this.selectionSymbol);

        //        this.resultLayer.add(graphic);
        //        this.multiPoint.addPoint(graphic.geometry);


        //        return result.attributes;
        //    }));
        //},
        _formatDate: function (value) {
            var inputDate = new Date(value);
            return dojo.date.locale.format(inputDate, {
                selector: 'date',
                datePattern: 'MM d, y'
            });

        },

        _saveBtn: function (buttonInfo) {
            return function (e) {

                buttonInfo.saveToLayer.applyEdits(buttonInfo.results, null, null);
            }
        },
        _initMap: function () {
            console.log("InitMap");
            this.map.graphics.on("graphic-add", lang.hitch(this, this._clearSelected));

            this.gp = new esri.tasks.Geoprocessor(this.config.gpUrl);
            this.gp.setOutSpatialReference(this.map.spatialReference);

            on(this.gp, "error", lang.hitch(this, this._errFeatures));

            on(this.gp, "job-complete", lang.hitch(this, this._traceResults));
            on(this.gp, "status-update", lang.hitch(this, this._traceCallback));
            on(this.gp, "get-result-data-complete", lang.hitch(this, this._addFeatures));



            this.flagLayer = new GraphicsLayer();
            this.barrierLayer = new GraphicsLayer();
            this.resultLayer = new GraphicsLayer();
            this.skipLayer = new GraphicsLayer();

            this.flagLayer.name = "Flag Layer";
            this.barrierLayer.name = "Barrier Layer";
            this.resultLayer.name = "Results Layer";
            this.skipLayer.name = "Skip Layer";

            this.resultLayer.setRenderer(this.selectionRen);
            this.flagLayer.setRenderer(this.flagRen);
            this.barrierLayer.setRenderer(this.barrierRen);
            this.skipLayer.setRenderer(this.skipRen);

            this.map.addLayers([this.resultLayer,this.skipLayer, this.flagLayer, this.barrierLayer]);

            this.config.appParams = this.config.appParams || [];


            if (this.config.appParams.length == 0) {
                var GPModelParams = this.config.gpOutput.split(",");
                var saveToLayerNames = this.config.gpResultLayers.split(",");

                var displayText = this.config.gpResultText.split(",");


                for (var f = 0, fl = this.GPModelParams.length ; f < fl; f++) {

                    var appParam = {};
                    appParam.GPParam = this.GPModelParams[f];
                    appParam.saveToLayerName = this.saveToLayerNames[f]
                    appParam.displayText = this.displayText[f]


                    array.forEach(this.layers, lang.hitch(this, function (layer) {
                        if (layer.title = traceFeature.saveToLayerName) {
                            appParam.saveToLayer = layer;
                            console.log(traceFeature.saveToLayerName + " " + "Set");
                        }

                    }))


                    this.config.appParams.push(appParam);
                }
            }
            else {
                array.forEach(this.config.appParams, lang.hitch(this, function (appParam) {
                    array.some(this.layers, lang.hitch(this, function (layer) {

                        if (layer.title == appParam.saveToLayerName) {
                            appParam.saveToLayer = layer;
                            console.log(appParam.saveToLayerName + " " + "Set");
                            return false;
                        }

                    }));


                }))

            }



        },
        //create a map based on the input web map id
        _createWebMap: function () {
            dojo.style("loader", "display", "block");

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