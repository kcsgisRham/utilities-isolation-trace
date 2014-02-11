/*
 | Copyright 2013 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

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
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/Symbol",
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
     "esri/geometry/Extent",
     "dijit/layout/ContentPane",
     "dijit/form/Button",
     "dojo/dom-construct",
     "dijit/layout/StackContainer",
     "dijit/layout/StackController",
     "dojo/dom-prop",
     "dijit/form/ToggleButton",
     "esri/InfoTemplate",
     "esri/tasks/query",
     "dojox/timing",
     "dojo/has",
     "dojo/_base/sniff"

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
    PictureMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    Symbol,
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
    Extent,
    ContentPane,
    Button,
    domConstruct,
    StackContainer,
    StackController,
    domProp,
    ToggleButton,
    InfoTemplate,
    Query,
    Timing,
    Has) {
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
            this._createInfoWindows();

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
            console.log('Geocoder Created');


            this._createTimer();

            console.log('timer Created');
            this._initCSVDownload();

            console.log('csv download init');

            console.log('Checking for Event Feature');

            if (this._zoomToEvent()) {

                console.log('Load Complete');

                dojo.style("loader", "display", "none");
                console.log('Loader Hidden');

            }


        },
        _createTimer: function () {
            this.timer = new Timing.Timer(this.config.highlighterDetails.timeout);

            this.aniLayer = new GraphicsLayer();
            //  var aniSymbol = new PictureMarkerSymbol("./images/ani/Cyanglow.gif",25,25);
            var aniSymbol = new PictureMarkerSymbol(this.config.highlighterDetails.image, this.config.highlighterDetails.width, this.config.highlighterDetails.height);

            var aniRen = new SimpleRenderer(aniSymbol);


            this.aniLayer.id = "aniLayer";

            this.aniLayer.setRenderer(aniRen);

            this.map.addLayer(this.aniLayer);


            this.timer.onTick = lang.hitch(this, function () {
                this.timer.stop();
                console.info("hightlighter complete");
                this.aniLayer.clear();
            });


        },
        _showHighlight: function (point) {
            this.aniLayer.clear();
            this.timer.stop();
            var highightGraphic = new Graphic(point, null, null, null);
            this.aniLayer.add(highightGraphic);


            this.timer.start();
        },
        _initPage: function () {
            var control;
            document.title = this.config.i18n.page.title;


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
            dojo.connect(dojo.byId("tools.save"), 'onclick', lang.hitch(this, function () {
                this._toggleControls("false");
                this._saveTrace();

            }));
            dojo.connect(dojo.byId("tools.clear"), 'onclick', lang.hitch(this, function () {

                this._reset();
            }));

        },
        _reset: function () {
            this._toggleControls("false");

            this.geoLocate.clear();

            this.map.graphics.clear();

            this.flagLayer.clear();
            this.barrierLayer.clear();
            this.skipLayer.clear();
            this._clearResultLayers();
            this._clearOverview();
            this._clearResultPanel();
            this.timer.stop();
            this.aniLayer.clear();
            this.csvData = "";
            this.overExtent = null;

        },
        _saveComplete: function () {
            this.defCount = this.defCount - 1;
            if (this.defCount <= 0) {

                if (this.csvData != "") {



                    if (Has("ie") >= 10) {
                        var blob = new Blob([this.csvData], {
                            type: "text/csv;charset=utf-8;",
                        });
                        window.navigator.msSaveBlob(blob, this.config.i18n.gp.downloadFileName + ".csv");

                    }
                    else if (Has("chrome") > 14) {
                        var csvContent = "data:text/csv;charset=utf-8," + this.csvData;

                        var encodedUri = encodeURI(csvContent);
                        var link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", this.config.i18n.gp.downloadFileName + ".csv");

                        link.click(); // This will download the data file named "my_data.csv"

                    }
                    else {
                        dojo.byId("reportinput").value = this.csvData;
                        var f = dojo.byId("downloadform");
                        f.submit();
                    }

                    // window.open("data:text/csv;charset=utf-8," + escape(csvContent))
                    //var uriContent = "data:application/octet-stream," + encodeURIComponent(csvContent);
                    //var myWindow = window.open(uriContent, "Nutrient CSV");
                    //myWindow.focus();

                    //var encodedUri = encodeURI(csvContent);
                    //var link = document.createElement("a");
                    //link.setAttribute("href", encodedUri);
                    //link.setAttribute("download", gpParam.saveOptions.name + ".csv");

                    //link.click(); // This will download the data file named "my_data.csv"



                }
                this._reset();
                dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
            }

        },
        _saveTrace: function () {
            dijit.byId("tools.save").set("iconClass", "customBigIcon saveIconProcessing");




            this.defCount = this.config.GPParams.length;


            if (this.resultOverviewLayer != null) {
                if (this.resultOverviewLayer.graphics != null) {
                    if (this.resultOverviewLayer.graphics.length > 0) {
                        this.defCount = this.defCount + 1;
                        this._saveLayer(this.config.overviewDetails);
                    }
                }
            }
            array.forEach(this.config.GPParams, function (GPParam) {

                if (GPParam.results != null && GPParam.saveOptions.type) {
                    if (GPParam.results.features != null) {
                        this._saveLayer(GPParam);

                    }
                    else {
                        this.defCount = this.defCount - 1;

                    }
                }
                else {
                    this.defCount = this.defCount - 1;

                }


            }, this);

            if (this.defCount == 0) {
                dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");

            }
        },
        _saveLayer: function (param) {
            if (param.saveOptions.type.toUpperCase() == "Layer".toUpperCase()) {
                if (param.saveOptions.saveToLayer != null) {

                    var editDeferred = param.saveOptions.saveToLayer.layerObject.applyEdits(param.results.features, null, null);

                    editDeferred.addCallback(lang.hitch(this, this._saveComplete));
                    editDeferred.addErrback(function (error) {
                        this._saveComplete();
                        this.defCount = this.defCount - 1;
                        if (this.defCount == 0) {
                            this._reset();
                            dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
                            

                        }
                        alert(error.message);
                        console.log(error);
                    });
                }
                else {
                    alert(param.paramName + ": " + this.config.i18n.error.saveToLayerMissing);
                    this._saveComplete();
                }
            }

            else if (param.saveOptions.type.toUpperCase() == "csv".toUpperCase()) {

                this._addCSVContent(param);

                this._saveComplete();

            }

            else
            {
                this._saveComplete();
            }
        },
        _zoomToEvent: function () {
            if (this.eventLayer != null) {
                if (this.config.eventDetails.EventID != null) {
                    var query = new Query();
                    query.where = lang.replace(this.config.eventDetails.whereClause, this.config.eventDetails);
                    //query.objectIds = this.config.eventDetails
                    query.outFields = ["*"];

                    this.eventLayer.layerObject.queryFeatures(query, lang.hitch(this, function (featureSet) {

                        if (featureSet.features.length == 1) {
                            this.map.centerAndZoom(featureSet.features[0].geometry, this.config.eventDetails.zoomScale);
                        }

                        console.log('Load Complete');

                        dojo.style("loader", "display", "none");
                        console.log('Loader Hidden');

                    }));
                    return false;

                }
                else {
                    return true;
                }

            }
            else {
                return true;
            }


        },
        _clearOverview: function () {
            if (this.resultOverviewLayer != null) {
                this.resultOverviewLayer.clear();
            }


        },
        _clearResultLayers: function () {
            array.forEach(this.resultLayers, function (resultLayer) {
                resultLayer.clear();
            });

        },
        _clearResultPanel: function () {

            array.forEach(this.cps, function (cp) {
                cp.set("content", "");
            });

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
        _createGeocoderOptions: function () {
            var options, geocoders = lang.clone(this.config.helperServices.geocode);
            // each geocoder
            if (geocoders.length == 0) { return null; }

            array.forEach(geocoders, function (geocoder) {
                if (geocoder.url.indexOf(".arcgis.com/arcgis/rest/services/World/GeocodeServer") > -1) {
                    geocoder.placefinding = true;
                    geocoder.placeholder = this.config.i18n.geocoder.defaultText;
                  
                }
                else {
                    geocoder.suggest = true;
                }
                //geocoder.searchExtent = this.map.extent;
            }, this);

            options = {
                map: this.map,
                autoNavigate: true,
                autoComplete: true,

                minCharacters: 0,
                maxLocations: 5,
                searchDelay: 100,
                arcgisGeocoder: geocoders.splice(0, 1)[0],
                geocoders: geocoders

            };

       
            return options;
        },
        _createGeocoder: function () {
            var gcOpts = this._createGeocoderOptions();
            this.geocoder = new Geocoder(gcOpts, dojo.byId('searchDiv'));
         
            this.geocoder.startup();
           
            
        },
        _extentChanged: function () {
            // each geocoder
          
        },
      
        _showAllResultLayers: function () {
            array.forEach(this.resultLayers, function (layer) {
                layer.setVisibility(true);

            });
        },
        _createStackCont: function () {
            this.sc = new StackContainer({
                class: "resultPane",

                id: "myProgStackContainer"
            }, "stackContainer");

            //  style: "height: 80%; width: 100%;",
            this.cps = [];
            var cp;
            cp = new ContentPane({
                title: this.config.overviewDetails.buttonText,
                name: "summaryCP",
                id: "summaryCP"

            });



            cp.startup();
            cp.on('show', lang.hitch(this, function (ent) {

                this._showAllResultLayers();


            }));

            this.cps.push(cp);
            this.sc.addChild(cp);



            array.forEach(this.config.GPParams, function (GPParam) {


                cp = new ContentPane({
                    title: GPParam.buttonText,
                    name: GPParam.paramName,
                    id: GPParam.paramName + "CP"

                });



                cp.on('show', lang.hitch(this, this._contentPaneShown(GPParam.paramName)));


                var idStart = GPParam.paramName; //message.result.ParamName; //GPParam.paramName;

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
            array.forEach(this.config.GPParams, function (GPParam) {


                // content: this.config.tabContent,
                var cp = new ContentPaneX({
                    title: GPParam.paramName.replace("_", " "),
                    name: GPParam.paramName,
                    id: GPParam.paramName + "CP"

                });



                var idStart = GPParam.paramName; //message.result.ParamName; //GPParam.paramName;
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
        _createInfoWindows: function () {

            this.template = new InfoTemplate();
            this.template.setTitle(this.config.i18n.page.bypass);



            this.template.setContent(lang.hitch(this, this._createSkipButtonForPopup));


        },
        _createSkipButtonForPopup: function (graphic) {

            var btnBypass = null
            if (graphic.bypassed == true) {
                btnBypass = new Button({

                    baseClass: "",
                    iconClass: "resultItemButtonSkipIconSelected resultItemButton",
                    showLabel: false

                }, dojo.create("div"));
            }
            else {
                btnBypass = new Button({

                    baseClass: "",
                    iconClass: "resultItemButtonSkipIcon resultItemButton",
                    showLabel: false

                }, dojo.create("div"));
            }
            btnBypass.startup();
            btnBypass.on("click", lang.hitch(this, this._popupSkip(graphic.resultItem)));
            return btnBypass.domNode;
        },
        _popupSkip: function (resultItem) {
            return function (e) {
                var btn = dijit.byId(resultItem.controlDetails.bypassButtonID);

                if (btn.get("iconClass") == "resultItemButtonSkipIconSelected resultItemButton") {
                    btn.set("iconClass", "resultItemButtonSkipIcon resultItemButton");
                    this.skipLayer.remove(resultItem.controlDetails.skipGraphic);
                    resultItem.controlDetails.selectionGraphic.bypassed = false;

                }
                else {
                    btn.set("iconClass", "resultItemButtonSkipIconSelected resultItemButton");
                    this.skipLayer.add(resultItem.controlDetails.skipGraphic);
                    resultItem.controlDetails.selectionGraphic.bypassed = true;

                }

                // this._skipBtn(graphic.resultItem)
                this.map.infoWindow.hide();
            }



        },
        _populateDataGrid: function (items, selectedGPParam) {
            var gd = dijit.byId(message.result.paramName + "GD");
            if (gd.structure == null) {
                var layout = [[]];
                var flds = selectedGPParam.displayFields.split(",");

                layout[0] = dojo.map(message.result.value.fields, lang.hitch(this, function (result) {
                    //"esriFieldTypeOID" //esriFieldTypeDouble //esriFieldTypeSmallInteger //esriFieldTypeInteger
                    //"esriFieldTypeString"
                    //esriFieldTypeDate


                    if (result.type == "esriFieldTypeDate") {

                        return { 'name': result.alias, 'field': result.name, editable: false, formatter: this._formatDate };
                    }
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
        _populateResultsToggle: function (selectedGPParam) {
            var intResultCount = { "Count": 0, "SkipCount": 0 };


            var cp = dijit.byId(selectedGPParam.paramName + "CP");
            var cpSum = dijit.byId("summaryCP");

            cp.set("content", "");
            var resLayer;
            array.some(this.resultLayers, function (layer) {
                if (layer.id == selectedGPParam.paramName) {
                    resLayer = layer;
                    return false;
                }
            });

            array.forEach(selectedGPParam.results.features, function (resultItem) {
                var process = true;

                //this.multiPoint.addPoint(resultItem.geometry);

                var skipLoc = null;

                if (this.skipLayer.graphics.length > 0) {
                    array.some(this.skipLayer.graphics, function (item) {
                        if (item.GPParam == selectedGPParam.paramName) {
                            if (resultItem.attributes[selectedGPParam.bypassDetails.IDField] == item.attributes[selectedGPParam.bypassDetails.IDField]) {
                                process = false;
                                skipLoc = item;
                                return false;
                            }
                        }
                        //if (resultItem.geometry.x == skipItem.geometry.x && resultItem.geometry.y == skipItem.geometry.y) {
                        //    process = false;
                        //    return false;
                        //}

                    });
                }
                if (skipLoc == null) {
                    skipLoc = new Graphic(resultItem.geometry, null, resultItem.attributes, null);
                }

                var selectGraphic = new Graphic(resultItem.geometry, null, resultItem.attributes, null);


                resLayer.add(selectGraphic);


                var div = domConstruct.create('div', { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "div", class: "resultItem" }, cp.containerNode);


                skipLoc.GPParam = selectedGPParam.paramName;

                var bypassID = selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BypassBtn";
                var zoomToID = selectedGPParam.paramName + ":" + resultItem.attributes.OID + "ZoomToBtn";

                resultItem.controlDetails = {
                    "bypassButtonID": bypassID,
                    "zoomToButtonID": zoomToID,
                    "skipGraphic": skipLoc,
                    "bypassDetails": selectedGPParam.bypassDetails,
                    "selectionGraphic": selectGraphic
                };
                var btncontrolDiv = domConstruct.create('div', { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "controls" }, div);



                var btnZoomDiv = domConstruct.create('div', { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnZoomDiv" }, btncontrolDiv);

                var btnZoom = new Button({
                    id: zoomToID,

                    baseClass: "",
                    iconClass: "resultItemButtonZoomIcon resultItemButton",
                    showLabel: false

                }, btnZoomDiv);
                btnZoom.startup();
                btnZoom.on("click", lang.hitch(this, this._zoomToBtn(resultItem)));

                if (selectedGPParam.bypassDetails.skipable && process) {
                    intResultCount.Count = intResultCount.Count + 1;
                    var btnBypassDiv = domConstruct.create('div', { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnBypassDiv" }, btncontrolDiv);

                    var btnBypass = new Button({
                        id: bypassID,

                        baseClass: "",
                        iconClass: "resultItemButtonSkipIcon resultItemButton",
                        showLabel: false

                    }, btnBypassDiv);

                    btnBypass.startup();
                    btnBypass.on("click", lang.hitch(this, this._skipBtn(resultItem)));
                    resultItem.controlDetails.selectionGraphic.bypassed = false;
                    // selectGraphic.attributes.bypassed = false;

                    selectGraphic.setInfoTemplate(this.template);


                }
                else if (selectedGPParam.bypassDetails.skipable && process == false) {
                    intResultCount.SkipCount = intResultCount.SkipCount + 1;
                    var btnBypassDiv = domConstruct.create('div', { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnBypassDiv" }, btncontrolDiv);

                    var btnBypass = new Button({
                        id: bypassID,

                        baseClass: "",
                        iconClass: "resultItemButtonSkipIconSelected resultItemButton",
                        showLabel: false

                    }, btnBypassDiv);

                    btnBypass.startup();

                    btnBypass.on("click", lang.hitch(this, this._skipBtn(resultItem)));
                    resultItem.controlDetails.selectionGraphic.bypassed = true;
                }
                else {
                    resultItem.controlDetails.selectionGraphic.bypassed = false;
                    intResultCount.Count = intResultCount.Count + 1;
                }
                var lbl = domConstruct.create('label', { class: "resultItemLabel", "for": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnZoomDiv", 'innerHTML': lang.replace(selectedGPParam.displayText, resultItem.attributes) }, btncontrolDiv);
                //dojo.connect(lbl, "onClick", lang.hitch(this, this._zoomToBtn(resultItem)));

                resultItem.controlDetails.selectionGraphic.resultItem = resultItem


            }, this);

            dojo.place("<div class='resultItem'>" + lang.replace(selectedGPParam.summaryText, intResultCount) + "</div>", cpSum.containerNode);

        },
        _skipBtn: function (resultItem) {
            return function (e) {
                var btn = dijit.byId(resultItem.controlDetails.bypassButtonID);

                if (btn.get("iconClass") == "resultItemButtonSkipIconSelected resultItemButton") {
                    btn.set("iconClass", "resultItemButtonSkipIcon resultItemButton");
                    this.skipLayer.remove(resultItem.controlDetails.skipGraphic);
                    resultItem.controlDetails.selectionGraphic.bypassed = false;

                }
                else {
                    btn.set("iconClass", "resultItemButtonSkipIconSelected resultItemButton");
                    this.skipLayer.add(resultItem.controlDetails.skipGraphic);
                    resultItem.controlDetails.selectionGraphic.bypassed = true;

                }


            }
        },
        _zoomToBtn: function (resultItem) {
            return function (e) {

                this.map.centerAt(resultItem.controlDetails.skipGraphic.geometry);

                this._showHighlight(resultItem.controlDetails.skipGraphic.geometry);

            }
        },
        _createToolbar: function () {
            this.toolbar = new Draw(this.map);
            this.toolbar.on("draw-end", lang.hitch(this, this._drawEnd));
            this.toolbar.on("draw-complete", lang.hitch(this, this._drawComplete));

            esri.bundle.toolbars.draw.addPoint = this.config.i18n.map.mouseToolTip;
            this.toolbar.deactivate();

        },
        _drawEnd: function (evt) {
            this._addToMap(evt.geometry);
        },
        _drawComplete: function (evt) {
            this.map.graphics.clear();

        },
        _clearSelected: function (evt) {
            if ((domProp.get(dijit.byId("tools.addFlag"), "iconClass") == "customBigIcon flagIconSelected") || (domProp.get(dijit.byId("tools.addBarrier"), "iconClass") == "customBigIcon barrierIconSelected")) {
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

            var flag = new Graphic(point, null, null, null);
            this.flagLayer.add(flag);

        },
        _addBarrier: function (point) {
            barrier = new Graphic(point, null, null, null);;
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
                params.Barriers = barrierFeature;
            }
            if (this.skipLayer.graphics.length > 0) {
                params.SkipLocations = skipFeature;
            }
          
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
            var cpSum = dijit.byId("summaryCP");

            cpSum.set("content", "");
            this._clearResultLayers();
            this._clearOverview();

            //this.multiPoint = new Multipoint(this.map.spatialReference);
            this.overExtent = null;
            this.resultsCnt = 0;

            if (this.resultOverviewLayer != null) {

                if (this.resultOverviewLayer.id != null) {

                    if (this._verifyParam(message, this.resultOverviewLayer.id)) {
                        this.resultsCnt = this.resultsCnt + 1;
                        this._processGPResults(message, this.resultOverviewLayer.id);
                    }
                    else
                    {
                        console.log("No overview param found or specified");
                    }
                }
            }


            array.forEach(this.config.GPParams, function (GPParam) {
                if (this._verifyParam(message, GPParam.paramName)) {

                    this.resultsCnt = this.resultsCnt + 1;
                    this._processGPResults(message, GPParam.paramName);
                }
                else {
                    console.log(GPParam.paramName + " not found in GP results");
                }
            }, this);


        },
        _verifyParam: function (message, paramName) {
            if (message == null) { return false; }
            if (message.jobInfo == null) { return false; }
            if (message.jobInfo.results == null) { return false; }
            for (var key in message.jobInfo.results) {
                if (paramName == key) {
                    return true;
                }
            }
            return false;

        },
        _processGPResults: function (message, paramName) {
            this.gp.getResultData(message.jobInfo.jobId, paramName).then(lang.hitch(this, function () {
                this.resultsCnt = this.resultsCnt - 1

                if (this.resultsCnt == 0) {

                    dojo.style("loader", "display", "none");
                    dijit.byId("tools.trace").set("iconClass", "customBigIcon traceIcon");
                    var ext = this.overExtent;//this.multiPoint.getExtent();
                    if (ext) {
                        this.map.setExtent(ext.expand(1.5));
                    }
                    this._showAllResultLayers();
                    this.sc.selectChild(this.cps[0]);
                }
            }));

        },
        _errFeatures: function (message) {
            console.log(message.error);
            alert(message.error.message);
            dojo.style("loader", "display", "none");
            dijit.byId("tools.trace").set("iconClass", "customBigIcon traceIcon");

        },
        _addFeatures: function (message) {
            console.log(message.result.paramName);
            var selectedGPParam;

            if (message.result.paramName == this.config.overviewDetails.paramName) {
                var resultFeatures = message.result.value;
                this.config.overviewDetails.results = resultFeatures;
                this._populateOverview(resultFeatures);
            }
            else {
                array.some(this.config.GPParams, function (GPParam) {
                    if (message.result.paramName == GPParam.paramName) {

                        selectedGPParam = GPParam;
                        return false;
                    }
                });
                if (selectedGPParam != null) {
                    var resultFeatures = message.result.value;
                    selectedGPParam.results = resultFeatures;
                    this._populateResultsToggle(selectedGPParam);
                }
            }




        },
        _populateOverview: function (results) {

            array.forEach(results.features, function (feature) {
                this.overExtent = this.overExtent == null ? feature.geometry.getExtent() : this.overExtent.union(feature.geometry.getExtent());
                if (this.config.overviewDetails.visible.toUpperCase() != "FALSE") {
                    var selectGraphic = new Graphic(feature.geometry, null, null, null);
                    this.resultOverviewLayer.add(selectGraphic);
                }
            }, this);



        },
        _formatDate: function (value) {
            var inputDate = new Date(value);
            return dojo.date.locale.format(inputDate, {
                selector: 'date',
                datePattern: 'MM d, y'
            });

        },
        _contentPaneShown: function (paneID) {
            return function () {

                array.forEach(this.resultLayers, function (layer) {
                    if (layer.id == paneID) {
                        layer.setVisibility(true);
                    }
                    else {
                        layer.setVisibility(false);
                    }


                });


            }
        },
        _createGraphicFromJSON: function(json)
        {
            //simplemarkersymbol | picturemarkersymbol | simplelinesymbol | cartographiclinesymbol | simplefillsymbol | picturefillsymbol | textsymbol

            if (json.type == "simplefillsymbol" || json.type == "esriSFS")
            {
               return  new SimpleFillSymbol(json);
            }
            else if (json.type == "simplemarkersymbol" || json.type == "esriSMS") {
                return new SimpleMarkerSymbol(json);
            }
            else if (json.type == "simplemlinesymbol" || json.type == "esriSLS") {
                return new SimpleLineSymbol(json);
            }
            

        },

        _initMap: function () {

            console.log("InitMap");
            var extentChange = on(this.map, "extent-change", lang.hitch(this, function () {
                this._extentChanged();
            }));

            this.map.graphics.on("graphic-add", lang.hitch(this, this._clearSelected));

            this.gp = new esri.tasks.Geoprocessor(this.config.gpUrl);
            this.gp.setOutSpatialReference(this.map.spatialReference);

            on(this.gp, "error", lang.hitch(this, this._errFeatures));

            on(this.gp, "job-complete", lang.hitch(this, this._traceResults));
            on(this.gp, "status-update", lang.hitch(this, this._traceCallback));
            on(this.gp, "get-result-data-complete", lang.hitch(this, this._addFeatures));

            this.resultOverviewLayer = new GraphicsLayer();
            this.resultOverviewLayer.id = this.config.overviewDetails.paramName;
            this.resultOverviewLayer.maxScale = this.config.overviewDetails.MaxScale;
            this.resultOverviewLayer.minScale = this.config.overviewDetails.MinScale;


            var ovrSymbol = null;
            var ovrRen = null;
            if (this.config.overviewDetails.symbol != null) {
              
                ovrSymbol = this._createGraphicFromJSON(this.config.overviewDetails.symbol);

               
                ovrRen = new SimpleRenderer(ovrSymbol);
                this.resultOverviewLayer.setRenderer(ovrRen);
            }
    


            this.map.addLayer(this.resultOverviewLayer);



            if (this.config.overviewDetails.saveOptions.type.toUpperCase() == "Layer".toUpperCase()) {
                array.some(this.layers, lang.hitch(this, function (layer) {

                    if (layer.title == this.config.overviewDetails.saveOptions.name) {
                        this.config.overviewDetails.saveOptions.saveToLayer = layer;
                        console.log(this.config.overviewDetails.saveOptions.name + " " + "Set");
                        return false;
                    }

                }));
            }


            this.resultLayers = []// = new GraphicsLayer();
            array.forEach(this.config.GPParams, lang.hitch(this, function (GPParam) {
                var resLayer = new GraphicsLayer();
                var resSymbol = this._createGraphicFromJSON(GPParam.highlightSymbol);
                var resRen = new SimpleRenderer(resSymbol);


                resLayer.id = GPParam.paramName;

                resLayer.setRenderer(resRen);
                resLayer.maxScale = GPParam.MaxScale;
                resLayer.minScale = GPParam.MinScale;

                this.map.addLayer(resLayer);
                this.resultLayers.push(resLayer);
                if (GPParam.saveOptions != null) {
                    if (GPParam.saveOptions.type.toUpperCase() == "Layer".toUpperCase()) {
                        array.some(this.layers, lang.hitch(this, function (layer) {

                            if (layer.title == GPParam.saveOptions.name) {
                                GPParam.saveOptions.saveToLayer = layer;
                                console.log(GPParam.saveOptions.name + " " + "Set");
                                return false;
                            }

                        }));
                    }
                }
            }));

            if (this.config.eventDetails.layerName != "") {
                array.some(this.layers, lang.hitch(this, function (layer) {

                    if (layer.title == this.config.eventDetails.layerName) {
                        this.eventLayer = layer;
                        console.log("Event Layer found: " + this.config.eventDetails.layerName);
                        return false;
                    }

                }));
            }
            this.flagLayer = new GraphicsLayer();
            this.flagLayer.id = "Flags";

            var flagSymbol = new SimpleMarkerSymbol().setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z").setSize(30).setColor(new dojo.Color([0, 0, 255]));
            flagSymbol.xoffset = 2;
            flagSymbol.yoffset = 15;

            var flagRen = new SimpleRenderer(flagSymbol);
            this.flagLayer.setRenderer(flagRen);



            this.barrierLayer = new GraphicsLayer();
            this.barrierLayer.id = "Barriers";
            var barrierSymbol = new SimpleMarkerSymbol().setPath("m241.78999,288.7684l45.98341,-45.9834l65.03485,0l45.98453,45.9834l0,65.03488l-45.98453,45.98172l-65.03485,0l-45.98341,-45.98172l0,-65.03488z").setSize(25).setColor(new dojo.Color([255, 0, 0]));

            var barRen = new SimpleRenderer(barrierSymbol);
            this.barrierLayer.setRenderer(barRen);


            this.skipLayer = new GraphicsLayer();
            this.skipLayer.id = "Skips";

            var skipSymbol = new SimpleMarkerSymbol().setPath("M29.225,23.567l-3.778-6.542c-1.139-1.972-3.002-5.2-4.141-7.172l-3.778-6.542c-1.14-1.973-3.003-1.973-4.142,0L9.609,9.853c-1.139,1.972-3.003,5.201-4.142,7.172L1.69,23.567c-1.139,1.974-0.207,3.587,2.071,3.587h23.391C29.432,27.154,30.363,25.541,29.225,23.567zM16.536,24.58h-2.241v-2.151h2.241V24.58zM16.428,20.844h-2.023l-0.201-9.204h2.407L16.428,20.844z").setSize(25).setColor(new dojo.Color([255, 255, 0]));

            var skipRen = new SimpleRenderer(skipSymbol);
            this.skipLayer.setRenderer(skipRen);





            this.map.addLayers([this.skipLayer, this.flagLayer, this.barrierLayer]);
        },
        //create a map based on the input web map id
        _addCSVContent: function (gpParam) {
            var featureArray = gpParam.results
            var csvContent = gpParam.saveOptions.name + this.config.csvNewLineChar + this.config.csvNewLineChar;


            var atts = [];
            var dateFlds = []
            array.forEach(featureArray.fields, function (field, index) {

                if (field.type == "esriFieldTypeDate") {
                    dateFlds.push(index);

                }
                atts.push(field["alias"]);
            }
           , this);


            csvContent += atts.join(",") + this.config.csvNewLineChar;
            array.forEach(featureArray.features, function (feature, index) {
                atts = [];
                var idx = 0;

                for (var k in feature.attributes) {

                    if (feature.attributes.hasOwnProperty(k)) {
                        if (dateFlds.indexOf(idx) >= 0) {
                            atts.push('"' + this._formatDate(feature.attributes[k]) + '"');
                        }
                        else {
                            atts.push('"' + feature.attributes[k] + '"');
                        }
                    }
                    idx = idx + 1;
                }


                dataLine = atts.join(",");

                csvContent += dataLine + this.config.csvNewLineChar;
            }, this);

            this.csvData = this.csvData == "" ? csvContent : this.csvData + this.config.csvNewLineChar + this.config.csvNewLineChar + this.config.csvNewLineChar + csvContent;


        },
        _initCSVDownload: function () {
            var url = "webservices/csv.ashx";
            var f = dojo.byId("downloadform");
            f.action = url;
            dojo.byId("filename").value = this.config.i18n.gp.downloadFileName;
            this.config.csvNewLineChar = "\r\n";

            this.csvData = "";

        },

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