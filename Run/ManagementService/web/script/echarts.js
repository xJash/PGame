(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.echarts = factory();
    }
}(this, function () {var require, define;
(function () {
    var mods = {};

    define = function (id, deps, factory) {
        mods[id] = {
            id: id,
            deps: deps,
            factory: factory,
            defined: 0,
            exports: {},
            require: createRequire(id)
        };
    };

    require = createRequire('');

    function normalize(id, baseId) {
        if (!baseId) {
            return id;
        }

        if (id.indexOf('.') === 0) {
            var basePath = baseId.split('/');
            var namePath = id.split('/');
            var baseLen = basePath.length - 1;
            var nameLen = namePath.length;
            var cutBaseTerms = 0;
            var cutNameTerms = 0;

            pathLoop: for (var i = 0; i < nameLen; i++) {
                switch (namePath[i]) {
                    case '..':
                        if (cutBaseTerms < baseLen) {
                            cutBaseTerms++;
                            cutNameTerms++;
                        }
                        else {
                            break pathLoop;
                        }
                        break;
                    case '.':
                        cutNameTerms++;
                        break;
                    default:
                        break pathLoop;
                }
            }

            basePath.length = baseLen - cutBaseTerms;
            namePath = namePath.slice(cutNameTerms);

            return basePath.concat(namePath).join('/');
        }

        return id;
    }

    function createRequire(baseId) {
        var cacheMods = {};

        function localRequire(id, callback) {
            if (typeof id === 'string') {
                var exports = cacheMods[id];
                if (!exports) {
                    exports = getModExports(normalize(id, baseId));
                    cacheMods[id] = exports;
                }

                return exports;
            }
            else if (id instanceof Array) {
                callback = callback || function () {};
                callback.apply(this, getModsExports(id, callback, baseId));
            }
        };

        return localRequire;
    }

    function getModsExports(ids, factory, baseId) {
        var es = [];
        var mod = mods[baseId];

        for (var i = 0, l = Math.min(ids.length, factory.length); i < l; i++) {
            var id = normalize(ids[i], baseId);
            var arg;
            switch (id) {
                case 'require':
                    arg = (mod && mod.require) || require;
                    break;
                case 'exports':
                    arg = mod.exports;
                    break;
                case 'module':
                    arg = mod;
                    break;
                default:
                    arg = getModExports(id);
            }
            es.push(arg);
        }

        return es;
    }

    function getModExports(id) {
        var mod = mods[id];
        if (!mod) {
            throw new Error('No ' + id);
        }

        if (!mod.defined) {
            var factory = mod.factory;
            var factoryReturn = factory.apply(
                this,
                getModsExports(mod.deps || [], factory, id)
            );
            if (typeof factoryReturn !== 'undefined') {
                mod.exports = factoryReturn;
            }
            mod.defined = 1;
        }

        return mod.exports;
    }
}());
define('echarts/echarts', ['require', 'zrender/core/env', './model/Global', './ExtensionAPI', './CoordinateSystem', './model/OptionManager', './model/Component', './model/Series', './view/Component', './view/Chart', './util/graphic', './util/model', './util/throttle', 'zrender', 'zrender/core/util', 'zrender/tool/color', 'zrender/mixin/Eventful', 'zrender/core/timsort', './visual/seriesColor', './preprocessor/backwardCompat', './loading/default', './data/List', './model/Model', './util/number', './util/format', 'zrender/core/matrix', 'zrender/core/vector'], function (require) {
    var env = require('zrender/core/env');
    var GlobalModel = require('./model/Global');
    var ExtensionAPI = require('./ExtensionAPI');
    var CoordinateSystemManager = require('./CoordinateSystem');
    var OptionManager = require('./model/OptionManager');
    var ComponentModel = require('./model/Component');
    var SeriesModel = require('./model/Series');
    var ComponentView = require('./view/Component');
    var ChartView = require('./view/Chart');
    var graphic = require('./util/graphic');
    var modelUtil = require('./util/model');
    var throttle = require('./util/throttle');
    var zrender = require('zrender');
    var zrUtil = require('zrender/core/util');
    var colorTool = require('zrender/tool/color');
    var Eventful = require('zrender/mixin/Eventful');
    var timsort = require('zrender/core/timsort');
    var each = zrUtil.each;
    var parseClassType = ComponentModel.parseClassType;
    var PRIORITY_PROCESSOR_FILTER = 1000;
    var PRIORITY_PROCESSOR_STATISTIC = 5000;
    var PRIORITY_VISUAL_LAYOUT = 1000;
    var PRIORITY_VISUAL_GLOBAL = 2000;
    var PRIORITY_VISUAL_CHART = 3000;
    var PRIORITY_VISUAL_COMPONENT = 4000;
    // FIXME
    // necessary?
    var PRIORITY_VISUAL_BRUSH = 5000;
    // Main process have three entries: `setOption`, `dispatchAction` and `resize`,
    // where they must not be invoked nestedly, except the only case: invoke
    // dispatchAction with updateMethod "none" in main process.
    // This flag is used to carry out this rule.
    // All events will be triggered out side main process (i.e. when !this[IN_MAIN_PROCESS]).
    var IN_MAIN_PROCESS = '__flagInMainProcess';
    var HAS_GRADIENT_OR_PATTERN_BG = '__hasGradientOrPatternBg';
    var OPTION_UPDATED = '__optionUpdated';
    var ACTION_REG = /^[a-zA-Z0-9_]+$/;
    function createRegisterEventWithLowercaseName(method) {
        return function (eventName, handler, context) {
            // Event name is all lowercase
            eventName = eventName && eventName.toLowerCase();
            Eventful.prototype[method].call(this, eventName, handler, context);
        };
    }
    /**
     * @module echarts~MessageCenter
     */
    function MessageCenter() {
        Eventful.call(this);
    }
    MessageCenter.prototype.on = createRegisterEventWithLowercaseName('on');
    MessageCenter.prototype.off = createRegisterEventWithLowercaseName('off');
    MessageCenter.prototype.one = createRegisterEventWithLowercaseName('one');
    zrUtil.mixin(MessageCenter, Eventful);
    /**
     * @module echarts~ECharts
     */
    function ECharts(dom, theme, opts) {
        opts = opts || {};
        // Get theme by name
        if (typeof theme === 'string') {
            theme = themeStorage[theme];
        }
        /**
         * @type {string}
         */
        this.id;
        /**
         * Group id
         * @type {string}
         */
        this.group;
        /**
         * @type {HTMLDomElement}
         * @private
         */
        this._dom = dom;
        /**
         * @type {module:zrender/ZRender}
         * @private
         */
        var zr = this._zr = zrender.init(dom, {
                renderer: opts.renderer || 'canvas',
                devicePixelRatio: opts.devicePixelRatio,
                width: opts.width,
                height: opts.height
            });
        /**
         * Expect 60 pfs.
         * @type {Function}
         * @private
         */
        this._throttledZrFlush = throttle.throttle(zrUtil.bind(zr.flush, zr), 17);
        /**
         * @type {Object}
         * @private
         */
        this._theme = zrUtil.clone(theme);
        /**
         * @type {Array.<module:echarts/view/Chart>}
         * @private
         */
        this._chartsViews = [];
        /**
         * @type {Object.<string, module:echarts/view/Chart>}
         * @private
         */
        this._chartsMap = {};
        /**
         * @type {Array.<module:echarts/view/Component>}
         * @private
         */
        this._componentsViews = [];
        /**
         * @type {Object.<string, module:echarts/view/Component>}
         * @private
         */
        this._componentsMap = {};
        /**
         * @type {module:echarts/ExtensionAPI}
         * @private
         */
        this._api = new ExtensionAPI(this);
        /**
         * @type {module:echarts/CoordinateSystem}
         * @private
         */
        this._coordSysMgr = new CoordinateSystemManager();
        Eventful.call(this);
        /**
         * @type {module:echarts~MessageCenter}
         * @private
         */
        this._messageCenter = new MessageCenter();
        // Init mouse events
        this._initEvents();
        // In case some people write `window.onresize = chart.resize`
        this.resize = zrUtil.bind(this.resize, this);
        // Can't dispatch action during rendering procedure
        this._pendingActions = [];
        // Sort on demand
        function prioritySortFunc(a, b) {
            return a.prio - b.prio;
        }
        timsort(visualFuncs, prioritySortFunc);
        timsort(dataProcessorFuncs, prioritySortFunc);
        zr.animation.on('frame', this._onframe, this);
    }
    var echartsProto = ECharts.prototype;
    echartsProto._onframe = function () {
        // Lazy update
        if (this[OPTION_UPDATED]) {
            var silent = this[OPTION_UPDATED].silent;
            this[IN_MAIN_PROCESS] = true;
            updateMethods.prepareAndUpdate.call(this);
            this[IN_MAIN_PROCESS] = false;
            this[OPTION_UPDATED] = false;
            flushPendingActions.call(this, silent);
            triggerUpdatedEvent.call(this, silent);
        }
    };
    /**
     * @return {HTMLDomElement}
     */
    echartsProto.getDom = function () {
        return this._dom;
    };
    /**
     * @return {module:zrender~ZRender}
     */
    echartsProto.getZr = function () {
        return this._zr;
    };
    /**
     * Usage:
     * chart.setOption(option, notMerge, lazyUpdate);
     * chart.setOption(option, {
     *     notMerge: ...,
     *     lazyUpdate: ...,
     *     silent: ...
     * });
     *
     * @param {Object} option
     * @param {Object|boolean} [opts] opts or notMerge.
     * @param {boolean} [opts.notMerge=false]
     * @param {boolean} [opts.lazyUpdate=false] Useful when setOption frequently.
     */
    echartsProto.setOption = function (option, notMerge, lazyUpdate) {
        if (true) {
            zrUtil.assert(!this[IN_MAIN_PROCESS], '`setOption` should not be called during main process.');
        }
        var silent;
        if (zrUtil.isObject(notMerge)) {
            lazyUpdate = notMerge.lazyUpdate;
            silent = notMerge.silent;
            notMerge = notMerge.notMerge;
        }
        this[IN_MAIN_PROCESS] = true;
        if (!this._model || notMerge) {
            var optionManager = new OptionManager(this._api);
            var theme = this._theme;
            var ecModel = this._model = new GlobalModel(null, null, theme, optionManager);
            ecModel.init(null, null, theme, optionManager);
        }
        // FIXME
        // ugly
        this.__lastOnlyGraphic = !!(option && option.graphic);
        zrUtil.each(option, function (o, mainType) {
            mainType !== 'graphic' && (this.__lastOnlyGraphic = false);
        }, this);
        this._model.setOption(option, optionPreprocessorFuncs);
        if (lazyUpdate) {
            this[OPTION_UPDATED] = { silent: silent };
            this[IN_MAIN_PROCESS] = false;
        } else {
            updateMethods.prepareAndUpdate.call(this);
            // Ensure zr refresh sychronously, and then pixel in canvas can be
            // fetched after `setOption`.
            this._zr.flush();
            this[OPTION_UPDATED] = false;
            this[IN_MAIN_PROCESS] = false;
            flushPendingActions.call(this, silent);
            triggerUpdatedEvent.call(this, silent);
        }
    };
    /**
     * @DEPRECATED
     */
    echartsProto.setTheme = function () {
        console.log('ECharts#setTheme() is DEPRECATED in ECharts 3.0');
    };
    /**
     * @return {module:echarts/model/Global}
     */
    echartsProto.getModel = function () {
        return this._model;
    };
    /**
     * @return {Object}
     */
    echartsProto.getOption = function () {
        return this._model && this._model.getOption();
    };
    /**
     * @return {number}
     */
    echartsProto.getWidth = function () {
        return this._zr.getWidth();
    };
    /**
     * @return {number}
     */
    echartsProto.getHeight = function () {
        return this._zr.getHeight();
    };
    /**
     * Get canvas which has all thing rendered
     * @param {Object} opts
     * @param {string} [opts.backgroundColor]
     */
    echartsProto.getRenderedCanvas = function (opts) {
        if (!env.canvasSupported) {
            return;
        }
        opts = opts || {};
        opts.pixelRatio = opts.pixelRatio || 1;
        opts.backgroundColor = opts.backgroundColor || this._model.get('backgroundColor');
        var zr = this._zr;
        var list = zr.storage.getDisplayList();
        // Stop animations
        zrUtil.each(list, function (el) {
            el.stopAnimation(true);
        });
        return zr.painter.getRenderedCanvas(opts);
    };
    /**
     * @return {string}
     * @param {Object} opts
     * @param {string} [opts.type='png']
     * @param {string} [opts.pixelRatio=1]
     * @param {string} [opts.backgroundColor]
     * @param {string} [opts.excludeComponents]
     */
    echartsProto.getDataURL = function (opts) {
        opts = opts || {};
        var excludeComponents = opts.excludeComponents;
        var ecModel = this._model;
        var excludesComponentViews = [];
        var self = this;
        each(excludeComponents, function (componentType) {
            ecModel.eachComponent({ mainType: componentType }, function (component) {
                var view = self._componentsMap[component.__viewId];
                if (!view.group.ignore) {
                    excludesComponentViews.push(view);
                    view.group.ignore = true;
                }
            });
        });
        var url = this.getRenderedCanvas(opts).toDataURL('image/' + (opts && opts.type || 'png'));
        each(excludesComponentViews, function (view) {
            view.group.ignore = false;
        });
        return url;
    };
    /**
     * @return {string}
     * @param {Object} opts
     * @param {string} [opts.type='png']
     * @param {string} [opts.pixelRatio=1]
     * @param {string} [opts.backgroundColor]
     */
    echartsProto.getConnectedDataURL = function (opts) {
        if (!env.canvasSupported) {
            return;
        }
        var groupId = this.group;
        var mathMin = Math.min;
        var mathMax = Math.max;
        var MAX_NUMBER = Infinity;
        if (connectedGroups[groupId]) {
            var left = MAX_NUMBER;
            var top = MAX_NUMBER;
            var right = -MAX_NUMBER;
            var bottom = -MAX_NUMBER;
            var canvasList = [];
            var dpr = opts && opts.pixelRatio || 1;
            zrUtil.each(instances, function (chart, id) {
                if (chart.group === groupId) {
                    var canvas = chart.getRenderedCanvas(zrUtil.clone(opts));
                    var boundingRect = chart.getDom().getBoundingClientRect();
                    left = mathMin(boundingRect.left, left);
                    top = mathMin(boundingRect.top, top);
                    right = mathMax(boundingRect.right, right);
                    bottom = mathMax(boundingRect.bottom, bottom);
                    canvasList.push({
                        dom: canvas,
                        left: boundingRect.left,
                        top: boundingRect.top
                    });
                }
            });
            left *= dpr;
            top *= dpr;
            right *= dpr;
            bottom *= dpr;
            var width = right - left;
            var height = bottom - top;
            var targetCanvas = zrUtil.createCanvas();
            targetCanvas.width = width;
            targetCanvas.height = height;
            var zr = zrender.init(targetCanvas);
            each(canvasList, function (item) {
                var img = new graphic.Image({
                        style: {
                            x: item.left * dpr - left,
                            y: item.top * dpr - top,
                            image: item.dom
                        }
                    });
                zr.add(img);
            });
            zr.refreshImmediately();
            return targetCanvas.toDataURL('image/' + (opts && opts.type || 'png'));
        } else {
            return this.getDataURL(opts);
        }
    };
    /**
     * Convert from logical coordinate system to pixel coordinate system.
     * See CoordinateSystem#convertToPixel.
     * @param {string|Object} finder
     *        If string, e.g., 'geo', means {geoIndex: 0}.
     *        If Object, could contain some of these properties below:
     *        {
     *            seriesIndex / seriesId / seriesName,
     *            geoIndex / geoId, geoName,
     *            bmapIndex / bmapId / bmapName,
     *            xAxisIndex / xAxisId / xAxisName,
     *            yAxisIndex / yAxisId / yAxisName,
     *            gridIndex / gridId / gridName,
     *            ... (can be extended)
     *        }
     * @param {Array|number} value
     * @return {Array|number} result
     */
    echartsProto.convertToPixel = zrUtil.curry(doConvertPixel, 'convertToPixel');
    /**
     * Convert from pixel coordinate system to logical coordinate system.
     * See CoordinateSystem#convertFromPixel.
     * @param {string|Object} finder
     *        If string, e.g., 'geo', means {geoIndex: 0}.
     *        If Object, could contain some of these properties below:
     *        {
     *            seriesIndex / seriesId / seriesName,
     *            geoIndex / geoId / geoName,
     *            bmapIndex / bmapId / bmapName,
     *            xAxisIndex / xAxisId / xAxisName,
     *            yAxisIndex / yAxisId / yAxisName
     *            gridIndex / gridId / gridName,
     *            ... (can be extended)
     *        }
     * @param {Array|number} value
     * @return {Array|number} result
     */
    echartsProto.convertFromPixel = zrUtil.curry(doConvertPixel, 'convertFromPixel');
    function doConvertPixel(methodName, finder, value) {
        var ecModel = this._model;
        var coordSysList = this._coordSysMgr.getCoordinateSystems();
        var result;
        finder = modelUtil.parseFinder(ecModel, finder);
        for (var i = 0; i < coordSysList.length; i++) {
            var coordSys = coordSysList[i];
            if (coordSys[methodName] && (result = coordSys[methodName](ecModel, finder, value)) != null) {
                return result;
            }
        }
        if (true) {
            console.warn('No coordinate system that supports ' + methodName + ' found by the given finder.');
        }
    }
    /**
     * Is the specified coordinate systems or components contain the given pixel point.
     * @param {string|Object} finder
     *        If string, e.g., 'geo', means {geoIndex: 0}.
     *        If Object, could contain some of these properties below:
     *        {
     *            seriesIndex / seriesId / seriesName,
     *            geoIndex / geoId / geoName,
     *            bmapIndex / bmapId / bmapName,
     *            xAxisIndex / xAxisId / xAxisName,
     *            yAxisIndex / yAxisId / yAxisName
     *            gridIndex / gridId / gridName,
     *            ... (can be extended)
     *        }
     * @param {Array|number} value
     * @return {boolean} result
     */
    echartsProto.containPixel = function (finder, value) {
        var ecModel = this._model;
        var result;
        finder = modelUtil.parseFinder(ecModel, finder);
        zrUtil.each(finder, function (models, key) {
            key.indexOf('Models') >= 0 && zrUtil.each(models, function (model) {
                var coordSys = model.coordinateSystem;
                if (coordSys && coordSys.containPoint) {
                    result |= !!coordSys.containPoint(value);
                } else if (key === 'seriesModels') {
                    var view = this._chartsMap[model.__viewId];
                    if (view && view.containPoint) {
                        result |= view.containPoint(value, model);
                    } else {
                        if (true) {
                            console.warn(key + ': ' + (view ? 'The found component do not support containPoint.' : 'No view mapping to the found component.'));
                        }
                    }
                } else {
                    if (true) {
                        console.warn(key + ': containPoint is not supported');
                    }
                }
            }, this);
        }, this);
        return !!result;
    };
    /**
     * Get visual from series or data.
     * @param {string|Object} finder
     *        If string, e.g., 'series', means {seriesIndex: 0}.
     *        If Object, could contain some of these properties below:
     *        {
     *            seriesIndex / seriesId / seriesName,
     *            dataIndex / dataIndexInside
     *        }
     *        If dataIndex is not specified, series visual will be fetched,
     *        but not data item visual.
     *        If all of seriesIndex, seriesId, seriesName are not specified,
     *        visual will be fetched from first series.
     * @param {string} visualType 'color', 'symbol', 'symbolSize'
     */
    echartsProto.getVisual = function (finder, visualType) {
        var ecModel = this._model;
        finder = modelUtil.parseFinder(ecModel, finder, { defaultMainType: 'series' });
        var seriesModel = finder.seriesModel;
        if (true) {
            if (!seriesModel) {
                console.warn('There is no specified seires model');
            }
        }
        var data = seriesModel.getData();
        var dataIndexInside = finder.hasOwnProperty('dataIndexInside') ? finder.dataIndexInside : finder.hasOwnProperty('dataIndex') ? data.indexOfRawIndex(finder.dataIndex) : null;
        return dataIndexInside != null ? data.getItemVisual(dataIndexInside, visualType) : data.getVisual(visualType);
    };
    var updateMethods = {
            update: function (payload) {
                // console.time && console.time('update');
                var ecModel = this._model;
                var api = this._api;
                var coordSysMgr = this._coordSysMgr;
                var zr = this._zr;
                // update before setOption
                if (!ecModel) {
                    return;
                }
                // Fixme First time update ?
                ecModel.restoreData();
                // TODO
                // Save total ecModel here for undo/redo (after restoring data and before processing data).
                // Undo (restoration of total ecModel) can be carried out in 'action' or outside API call.
                // Create new coordinate system each update
                // In LineView may save the old coordinate system and use it to get the orignal point
                coordSysMgr.create(this._model, this._api);
                processData.call(this, ecModel, api);
                stackSeriesData.call(this, ecModel);
                coordSysMgr.update(ecModel, api);
                doVisualEncoding.call(this, ecModel, payload);
                doRender.call(this, ecModel, payload);
                // Set background
                var backgroundColor = ecModel.get('backgroundColor') || 'transparent';
                var painter = zr.painter;
                // TODO all use clearColor ?
                if (painter.isSingleCanvas && painter.isSingleCanvas()) {
                    zr.configLayer(0, { clearColor: backgroundColor });
                } else {
                    // In IE8
                    if (!env.canvasSupported) {
                        var colorArr = colorTool.parse(backgroundColor);
                        backgroundColor = colorTool.stringify(colorArr, 'rgb');
                        if (colorArr[3] === 0) {
                            backgroundColor = 'transparent';
                        }
                    }
                    if (backgroundColor.colorStops || backgroundColor.image) {
                        // Gradient background
                        // FIXME Fixed layer？
                        zr.configLayer(0, { clearColor: backgroundColor });
                        this[HAS_GRADIENT_OR_PATTERN_BG] = true;
                        this._dom.style.background = 'transparent';
                    } else {
                        if (this[HAS_GRADIENT_OR_PATTERN_BG]) {
                            zr.configLayer(0, { clearColor: null });
                        }
                        this[HAS_GRADIENT_OR_PATTERN_BG] = false;
                        this._dom.style.background = backgroundColor;
                    }
                }    // console.time && console.timeEnd('update');
            },
            updateView: function (payload) {
                var ecModel = this._model;
                // update before setOption
                if (!ecModel) {
                    return;
                }
                ecModel.eachSeries(function (seriesModel) {
                    seriesModel.getData().clearAllVisual();
                });
                doVisualEncoding.call(this, ecModel, payload);
                invokeUpdateMethod.call(this, 'updateView', ecModel, payload);
            },
            updateVisual: function (payload) {
                var ecModel = this._model;
                // update before setOption
                if (!ecModel) {
                    return;
                }
                ecModel.eachSeries(function (seriesModel) {
                    seriesModel.getData().clearAllVisual();
                });
                doVisualEncoding.call(this, ecModel, payload, true);
                invokeUpdateMethod.call(this, 'updateVisual', ecModel, payload);
            },
            updateLayout: function (payload) {
                var ecModel = this._model;
                // update before setOption
                if (!ecModel) {
                    return;
                }
                doLayout.call(this, ecModel, payload);
                invokeUpdateMethod.call(this, 'updateLayout', ecModel, payload);
            },
            prepareAndUpdate: function (payload) {
                var ecModel = this._model;
                prepareView.call(this, 'component', ecModel);
                prepareView.call(this, 'chart', ecModel);
                // FIXME
                // ugly
                if (this.__lastOnlyGraphic) {
                    each(this._componentsViews, function (componentView) {
                        var componentModel = componentView.__model;
                        if (componentModel && componentModel.mainType === 'graphic') {
                            componentView.render(componentModel, ecModel, this._api, payload);
                            updateZ(componentModel, componentView);
                        }
                    }, this);
                    this.__lastOnlyGraphic = false;
                } else {
                    updateMethods.update.call(this, payload);
                }
            }
        };
    /**
     * @private
     */
    function updateDirectly(ecIns, method, payload, mainType, subType) {
        var ecModel = ecIns._model;
        var query = {};
        query[mainType + 'Id'] = payload[mainType + 'Id'];
        query[mainType + 'Index'] = payload[mainType + 'Index'];
        query[mainType + 'Name'] = payload[mainType + 'Name'];
        var condition = {
                mainType: mainType,
                query: query
            };
        subType && (condition.subType = subType);
        // subType may be '' by parseClassType;
        // If dispatchAction before setOption, do nothing.
        ecModel && ecModel.eachComponent(condition, function (model, index) {
            var view = ecIns[mainType === 'series' ? '_chartsMap' : '_componentsMap'][model.__viewId];
            if (view && view.__alive) {
                view[method](model, ecModel, ecIns._api, payload);
            }
        }, ecIns);
    }
    /**
     * Resize the chart
     * @param {Object} opts
     * @param {number} [opts.width] Can be 'auto' (the same as null/undefined)
     * @param {number} [opts.height] Can be 'auto' (the same as null/undefined)
     * @param {boolean} [opts.silent=false]
     */
    echartsProto.resize = function (opts) {
        if (true) {
            zrUtil.assert(!this[IN_MAIN_PROCESS], '`resize` should not be called during main process.');
        }
        this[IN_MAIN_PROCESS] = true;
        this._zr.resize(opts);
        var optionChanged = this._model && this._model.resetOption('media');
        var updateMethod = optionChanged ? 'prepareAndUpdate' : 'update';
        updateMethods[updateMethod].call(this);
        // Resize loading effect
        this._loadingFX && this._loadingFX.resize();
        this[IN_MAIN_PROCESS] = false;
        var silent = opts && opts.silent;
        flushPendingActions.call(this, silent);
        triggerUpdatedEvent.call(this, silent);
    };
    /**
     * Show loading effect
     * @param  {string} [name='default']
     * @param  {Object} [cfg]
     */
    echartsProto.showLoading = function (name, cfg) {
        if (zrUtil.isObject(name)) {
            cfg = name;
            name = '';
        }
        name = name || 'default';
        this.hideLoading();
        if (!loadingEffects[name]) {
            if (true) {
                console.warn('Loading effects ' + name + ' not exists.');
            }
            return;
        }
        var el = loadingEffects[name](this._api, cfg);
        var zr = this._zr;
        this._loadingFX = el;
        zr.add(el);
    };
    /**
     * Hide loading effect
     */
    echartsProto.hideLoading = function () {
        this._loadingFX && this._zr.remove(this._loadingFX);
        this._loadingFX = null;
    };
    /**
     * @param {Object} eventObj
     * @return {Object}
     */
    echartsProto.makeActionFromEvent = function (eventObj) {
        var payload = zrUtil.extend({}, eventObj);
        payload.type = eventActionMap[eventObj.type];
        return payload;
    };
    /**
     * @pubilc
     * @param {Object} payload
     * @param {string} [payload.type] Action type
     * @param {Object|boolean} [opt] If pass boolean, means opt.silent
     * @param {boolean} [opt.silent=false] Whether trigger events.
     * @param {boolean} [opt.flush=undefined]
     *                  true: Flush immediately, and then pixel in canvas can be fetched
     *                      immediately. Caution: it might affect performance.
     *                  false: Not not flush.
     *                  undefined: Auto decide whether perform flush.
     */
    echartsProto.dispatchAction = function (payload, opt) {
        if (!zrUtil.isObject(opt)) {
            opt = { silent: !!opt };
        }
        if (!actions[payload.type]) {
            return;
        }
        // if (__DEV__) {
        //     zrUtil.assert(
        //         !this[IN_MAIN_PROCESS],
        //         '`dispatchAction` should not be called during main process.'
        //         + 'unless updateMathod is "none".'
        //     );
        // }
        // May dispatchAction in rendering procedure
        if (this[IN_MAIN_PROCESS]) {
            this._pendingActions.push(payload);
            return;
        }
        doDispatchAction.call(this, payload, opt.silent);
        if (opt.flush) {
            this._zr.flush(true);
        } else if (opt.flush !== false && env.browser.weChat) {
            // In WeChat embeded browser, `requestAnimationFrame` and `setInterval`
            // hang when sliding page (on touch event), which cause that zr does not
            // refresh util user interaction finished, which is not expected.
            // But `dispatchAction` may be called too frequently when pan on touch
            // screen, which impacts performance if do not throttle them.
            this._throttledZrFlush();
        }
        flushPendingActions.call(this, opt.silent);
        triggerUpdatedEvent.call(this, opt.silent);
    };
    function doDispatchAction(payload, silent) {
        var payloadType = payload.type;
        var actionWrap = actions[payloadType];
        var actionInfo = actionWrap.actionInfo;
        var cptType = (actionInfo.update || 'update').split(':');
        var updateMethod = cptType.pop();
        cptType = cptType[0] && parseClassType(cptType[0]);
        this[IN_MAIN_PROCESS] = true;
        var payloads = [payload];
        var batched = false;
        // Batch action
        if (payload.batch) {
            batched = true;
            payloads = zrUtil.map(payload.batch, function (item) {
                item = zrUtil.defaults(zrUtil.extend({}, item), payload);
                item.batch = null;
                return item;
            });
        }
        var eventObjBatch = [];
        var eventObj;
        var isHighDown = payloadType === 'highlight' || payloadType === 'downplay';
        for (var i = 0; i < payloads.length; i++) {
            var batchItem = payloads[i];
            // Action can specify the event by return it.
            eventObj = actionWrap.action(batchItem, this._model);
            // Emit event outside
            eventObj = eventObj || zrUtil.extend({}, batchItem);
            // Convert type to eventType
            eventObj.type = actionInfo.event || eventObj.type;
            eventObjBatch.push(eventObj);
            // light update does not perform data process, layout and visual.
            if (isHighDown) {
                // method, payload, mainType, subType
                updateDirectly(this, updateMethod, batchItem, 'series');
            } else if (cptType) {
                updateDirectly(this, updateMethod, batchItem, cptType.main, cptType.sub);
            }
        }
        if (updateMethod !== 'none' && !isHighDown && !cptType) {
            // Still dirty
            if (this[OPTION_UPDATED]) {
                // FIXME Pass payload ?
                updateMethods.prepareAndUpdate.call(this, payload);
                this[OPTION_UPDATED] = false;
            } else {
                updateMethods[updateMethod].call(this, payload);
            }
        }
        // Follow the rule of action batch
        if (batched) {
            eventObj = {
                type: actionInfo.event || payloadType,
                batch: eventObjBatch
            };
        } else {
            eventObj = eventObjBatch[0];
        }
        this[IN_MAIN_PROCESS] = false;
        !silent && this._messageCenter.trigger(eventObj.type, eventObj);
    }
    function flushPendingActions(silent) {
        var pendingActions = this._pendingActions;
        while (pendingActions.length) {
            var payload = pendingActions.shift();
            doDispatchAction.call(this, payload, silent);
        }
    }
    function triggerUpdatedEvent(silent) {
        !silent && this.trigger('updated');
    }
    /**
     * Register event
     * @method
     */
    echartsProto.on = createRegisterEventWithLowercaseName('on');
    echartsProto.off = createRegisterEventWithLowercaseName('off');
    echartsProto.one = createRegisterEventWithLowercaseName('one');
    /**
     * @param {string} methodName
     * @private
     */
    function invokeUpdateMethod(methodName, ecModel, payload) {
        var api = this._api;
        // Update all components
        each(this._componentsViews, function (component) {
            var componentModel = component.__model;
            component[methodName](componentModel, ecModel, api, payload);
            updateZ(componentModel, component);
        }, this);
        // Upate all charts
        ecModel.eachSeries(function (seriesModel, idx) {
            var chart = this._chartsMap[seriesModel.__viewId];
            chart[methodName](seriesModel, ecModel, api, payload);
            updateZ(seriesModel, chart);
            updateProgressiveAndBlend(seriesModel, chart);
        }, this);
        // If use hover layer
        updateHoverLayerStatus(this._zr, ecModel);
    }
    /**
     * Prepare view instances of charts and components
     * @param  {module:echarts/model/Global} ecModel
     * @private
     */
    function prepareView(type, ecModel) {
        var isComponent = type === 'component';
        var viewList = isComponent ? this._componentsViews : this._chartsViews;
        var viewMap = isComponent ? this._componentsMap : this._chartsMap;
        var zr = this._zr;
        for (var i = 0; i < viewList.length; i++) {
            viewList[i].__alive = false;
        }
        ecModel[isComponent ? 'eachComponent' : 'eachSeries'](function (componentType, model) {
            if (isComponent) {
                if (componentType === 'series') {
                    return;
                }
            } else {
                model = componentType;
            }
            // Consider: id same and type changed.
            var viewId = model.id + '_' + model.type;
            var view = viewMap[viewId];
            if (!view) {
                var classType = parseClassType(model.type);
                var Clazz = isComponent ? ComponentView.getClass(classType.main, classType.sub) : ChartView.getClass(classType.sub);
                if (Clazz) {
                    view = new Clazz();
                    view.init(ecModel, this._api);
                    viewMap[viewId] = view;
                    viewList.push(view);
                    zr.add(view.group);
                } else {
                    // Error
                    return;
                }
            }
            model.__viewId = viewId;
            view.__alive = true;
            view.__id = viewId;
            view.__model = model;
        }, this);
        for (var i = 0; i < viewList.length;) {
            var view = viewList[i];
            if (!view.__alive) {
                zr.remove(view.group);
                view.dispose(ecModel, this._api);
                viewList.splice(i, 1);
                delete viewMap[view.__id];
            } else {
                i++;
            }
        }
    }
    /**
     * Processor data in each series
     *
     * @param {module:echarts/model/Global} ecModel
     * @private
     */
    function processData(ecModel, api) {
        each(dataProcessorFuncs, function (process) {
            process.func(ecModel, api);
        });
    }
    /**
     * @private
     */
    function stackSeriesData(ecModel) {
        var stackedDataMap = {};
        ecModel.eachSeries(function (series) {
            var stack = series.get('stack');
            var data = series.getData();
            if (stack && data.type === 'list') {
                var previousStack = stackedDataMap[stack];
                if (previousStack) {
                    data.stackedOn = previousStack;
                }
                stackedDataMap[stack] = data;
            }
        });
    }
    /**
     * Layout before each chart render there series, special visual encoding stage
     *
     * @param {module:echarts/model/Global} ecModel
     * @private
     */
    function doLayout(ecModel, payload) {
        var api = this._api;
        each(visualFuncs, function (visual) {
            if (visual.isLayout) {
                visual.func(ecModel, api, payload);
            }
        });
    }
    /**
     * Encode visual infomation from data after data processing
     *
     * @param {module:echarts/model/Global} ecModel
     * @param {object} layout
     * @param {boolean} [excludesLayout]
     * @private
     */
    function doVisualEncoding(ecModel, payload, excludesLayout) {
        var api = this._api;
        ecModel.clearColorPalette();
        ecModel.eachSeries(function (seriesModel) {
            seriesModel.clearColorPalette();
        });
        each(visualFuncs, function (visual) {
            (!excludesLayout || !visual.isLayout) && visual.func(ecModel, api, payload);
        });
    }
    /**
     * Render each chart and component
     * @private
     */
    function doRender(ecModel, payload) {
        var api = this._api;
        // Render all components
        each(this._componentsViews, function (componentView) {
            var componentModel = componentView.__model;
            componentView.render(componentModel, ecModel, api, payload);
            updateZ(componentModel, componentView);
        }, this);
        each(this._chartsViews, function (chart) {
            chart.__alive = false;
        }, this);
        // Render all charts
        ecModel.eachSeries(function (seriesModel, idx) {
            var chartView = this._chartsMap[seriesModel.__viewId];
            chartView.__alive = true;
            chartView.render(seriesModel, ecModel, api, payload);
            chartView.group.silent = !!seriesModel.get('silent');
            updateZ(seriesModel, chartView);
            updateProgressiveAndBlend(seriesModel, chartView);
        }, this);
        // If use hover layer
        updateHoverLayerStatus(this._zr, ecModel);
        // Remove groups of unrendered charts
        each(this._chartsViews, function (chart) {
            if (!chart.__alive) {
                chart.remove(ecModel, api);
            }
        }, this);
    }
    var MOUSE_EVENT_NAMES = [
            'click',
            'dblclick',
            'mouseover',
            'mouseout',
            'mousemove',
            'mousedown',
            'mouseup',
            'globalout',
            'contextmenu'
        ];
    /**
     * @private
     */
    echartsProto._initEvents = function () {
        each(MOUSE_EVENT_NAMES, function (eveName) {
            this._zr.on(eveName, function (e) {
                var ecModel = this.getModel();
                var el = e.target;
                var params;
                // no e.target when 'globalout'.
                if (eveName === 'globalout') {
                    params = {};
                } else if (el && el.dataIndex != null) {
                    var dataModel = el.dataModel || ecModel.getSeriesByIndex(el.seriesIndex);
                    params = dataModel && dataModel.getDataParams(el.dataIndex, el.dataType) || {};
                }    // If element has custom eventData of components
                else if (el && el.eventData) {
                    params = zrUtil.extend({}, el.eventData);
                }
                if (params) {
                    params.event = e;
                    params.type = eveName;
                    this.trigger(eveName, params);
                }
            }, this);
        }, this);
        each(eventActionMap, function (actionType, eventType) {
            this._messageCenter.on(eventType, function (event) {
                this.trigger(eventType, event);
            }, this);
        }, this);
    };
    /**
     * @return {boolean}
     */
    echartsProto.isDisposed = function () {
        return this._disposed;
    };
    /**
     * Clear
     */
    echartsProto.clear = function () {
        this.setOption({ series: [] }, true);
    };
    /**
     * Dispose instance
     */
    echartsProto.dispose = function () {
        if (this._disposed) {
            if (true) {
                console.warn('Instance ' + this.id + ' has been disposed');
            }
            return;
        }
        this._disposed = true;
        var api = this._api;
        var ecModel = this._model;
        each(this._componentsViews, function (component) {
            component.dispose(ecModel, api);
        });
        each(this._chartsViews, function (chart) {
            chart.dispose(ecModel, api);
        });
        // Dispose after all views disposed
        this._zr.dispose();
        delete instances[this.id];
    };
    zrUtil.mixin(ECharts, Eventful);
    function updateHoverLayerStatus(zr, ecModel) {
        var storage = zr.storage;
        var elCount = 0;
        storage.traverse(function (el) {
            if (!el.isGroup) {
                elCount++;
            }
        });
        if (elCount > ecModel.get('hoverLayerThreshold') && !env.node) {
            storage.traverse(function (el) {
                if (!el.isGroup) {
                    el.useHoverLayer = true;
                }
            });
        }
    }
    /**
     * Update chart progressive and blend.
     * @param {module:echarts/model/Series|module:echarts/model/Component} model
     * @param {module:echarts/view/Component|module:echarts/view/Chart} view
     */
    function updateProgressiveAndBlend(seriesModel, chartView) {
        // Progressive configuration
        var elCount = 0;
        chartView.group.traverse(function (el) {
            if (el.type !== 'group' && !el.ignore) {
                elCount++;
            }
        });
        var frameDrawNum = +seriesModel.get('progressive');
        var needProgressive = elCount > seriesModel.get('progressiveThreshold') && frameDrawNum && !env.node;
        if (needProgressive) {
            chartView.group.traverse(function (el) {
                // FIXME marker and other components
                if (!el.isGroup) {
                    el.progressive = needProgressive ? Math.floor(elCount++ / frameDrawNum) : -1;
                    if (needProgressive) {
                        el.stopAnimation(true);
                    }
                }
            });
        }
        // Blend configration
        var blendMode = seriesModel.get('blendMode') || null;
        if (true) {
            if (!env.canvasSupported && blendMode && blendMode !== 'source-over') {
                console.warn('Only canvas support blendMode');
            }
        }
        chartView.group.traverse(function (el) {
            // FIXME marker and other components
            if (!el.isGroup) {
                el.setStyle('blend', blendMode);
            }
        });
    }
    /**
     * @param {module:echarts/model/Series|module:echarts/model/Component} model
     * @param {module:echarts/view/Component|module:echarts/view/Chart} view
     */
    function updateZ(model, view) {
        var z = model.get('z');
        var zlevel = model.get('zlevel');
        // Set z and zlevel
        view.group.traverse(function (el) {
            if (el.type !== 'group') {
                z != null && (el.z = z);
                zlevel != null && (el.zlevel = zlevel);
            }
        });
    }
    /**
     * @type {Array.<Function>}
     * @inner
     */
    var actions = [];
    /**
     * Map eventType to actionType
     * @type {Object}
     */
    var eventActionMap = {};
    /**
     * Data processor functions of each stage
     * @type {Array.<Object.<string, Function>>}
     * @inner
     */
    var dataProcessorFuncs = [];
    /**
     * @type {Array.<Function>}
     * @inner
     */
    var optionPreprocessorFuncs = [];
    /**
     * Visual encoding functions of each stage
     * @type {Array.<Object.<string, Function>>}
     * @inner
     */
    var visualFuncs = [];
    /**
     * Theme storage
     * @type {Object.<key, Object>}
     */
    var themeStorage = {};
    /**
     * Loading effects
     */
    var loadingEffects = {};
    var instances = {};
    var connectedGroups = {};
    var idBase = new Date() - 0;
    var groupIdBase = new Date() - 0;
    var DOM_ATTRIBUTE_KEY = '_echarts_instance_';
    /**
     * @alias module:echarts
     */
    var echarts = {
            version: '3.4.0',
            dependencies: { zrender: '3.3.0' }
        };
    function enableConnect(chart) {
        var STATUS_PENDING = 0;
        var STATUS_UPDATING = 1;
        var STATUS_UPDATED = 2;
        var STATUS_KEY = '__connectUpdateStatus';
        function updateConnectedChartsStatus(charts, status) {
            for (var i = 0; i < charts.length; i++) {
                var otherChart = charts[i];
                otherChart[STATUS_KEY] = status;
            }
        }
        zrUtil.each(eventActionMap, function (actionType, eventType) {
            chart._messageCenter.on(eventType, function (event) {
                if (connectedGroups[chart.group] && chart[STATUS_KEY] !== STATUS_PENDING) {
                    var action = chart.makeActionFromEvent(event);
                    var otherCharts = [];
                    zrUtil.each(instances, function (otherChart) {
                        if (otherChart !== chart && otherChart.group === chart.group) {
                            otherCharts.push(otherChart);
                        }
                    });
                    updateConnectedChartsStatus(otherCharts, STATUS_PENDING);
                    each(otherCharts, function (otherChart) {
                        if (otherChart[STATUS_KEY] !== STATUS_UPDATING) {
                            otherChart.dispatchAction(action);
                        }
                    });
                    updateConnectedChartsStatus(otherCharts, STATUS_UPDATED);
                }
            });
        });
    }
    /**
     * @param {HTMLDomElement} dom
     * @param {Object} [theme]
     * @param {Object} opts
     * @param {number} [opts.devicePixelRatio] Use window.devicePixelRatio by default
     * @param {string} [opts.renderer] Currently only 'canvas' is supported.
     * @param {number} [opts.width] Use clientWidth of the input `dom` by default.
     *                              Can be 'auto' (the same as null/undefined)
     * @param {number} [opts.height] Use clientHeight of the input `dom` by default.
     *                               Can be 'auto' (the same as null/undefined)
     */
    echarts.init = function (dom, theme, opts) {
        if (true) {
            // Check version
            if (zrender.version.replace('.', '') - 0 < echarts.dependencies.zrender.replace('.', '') - 0) {
                throw new Error('ZRender ' + zrender.version + ' is too old for ECharts ' + echarts.version + '. Current version need ZRender ' + echarts.dependencies.zrender + '+');
            }
            if (!dom) {
                throw new Error('Initialize failed: invalid dom.');
            }
            if (zrUtil.isDom(dom) && dom.nodeName.toUpperCase() !== 'CANVAS' && (!dom.clientWidth || !dom.clientHeight)) {
                console.warn('Can\'t get dom width or height');
            }
        }
        var chart = new ECharts(dom, theme, opts);
        chart.id = 'ec_' + idBase++;
        instances[chart.id] = chart;
        dom.setAttribute && dom.setAttribute(DOM_ATTRIBUTE_KEY, chart.id);
        enableConnect(chart);
        return chart;
    };
    /**
     * @return {string|Array.<module:echarts~ECharts>} groupId
     */
    echarts.connect = function (groupId) {
        // Is array of charts
        if (zrUtil.isArray(groupId)) {
            var charts = groupId;
            groupId = null;
            // If any chart has group
            zrUtil.each(charts, function (chart) {
                if (chart.group != null) {
                    groupId = chart.group;
                }
            });
            groupId = groupId || 'g_' + groupIdBase++;
            zrUtil.each(charts, function (chart) {
                chart.group = groupId;
            });
        }
        connectedGroups[groupId] = true;
        return groupId;
    };
    /**
     * @return {string} groupId
     */
    echarts.disConnect = function (groupId) {
        connectedGroups[groupId] = false;
    };
    /**
     * Dispose a chart instance
     * @param  {module:echarts~ECharts|HTMLDomElement|string} chart
     */
    echarts.dispose = function (chart) {
        if (zrUtil.isDom(chart)) {
            chart = echarts.getInstanceByDom(chart);
        } else if (typeof chart === 'string') {
            chart = instances[chart];
        }
        if (chart instanceof ECharts && !chart.isDisposed()) {
            chart.dispose();
        }
    };
    /**
     * @param  {HTMLDomElement} dom
     * @return {echarts~ECharts}
     */
    echarts.getInstanceByDom = function (dom) {
        var key = dom.getAttribute(DOM_ATTRIBUTE_KEY);
        return instances[key];
    };
    /**
     * @param {string} key
     * @return {echarts~ECharts}
     */
    echarts.getInstanceById = function (key) {
        return instances[key];
    };
    /**
     * Register theme
     */
    echarts.registerTheme = function (name, theme) {
        themeStorage[name] = theme;
    };
    /**
     * Register option preprocessor
     * @param {Function} preprocessorFunc
     */
    echarts.registerPreprocessor = function (preprocessorFunc) {
        optionPreprocessorFuncs.push(preprocessorFunc);
    };
    /**
     * @param {number} [priority=1000]
     * @param {Function} processorFunc
     */
    echarts.registerProcessor = function (priority, processorFunc) {
        if (typeof priority === 'function') {
            processorFunc = priority;
            priority = PRIORITY_PROCESSOR_FILTER;
        }
        if (true) {
            if (isNaN(priority)) {
                throw new Error('Unkown processor priority');
            }
        }
        dataProcessorFuncs.push({
            prio: priority,
            func: processorFunc
        });
    };
    /**
     * Usage:
     * registerAction('someAction', 'someEvent', function () { ... });
     * registerAction('someAction', function () { ... });
     * registerAction(
     *     {type: 'someAction', event: 'someEvent', update: 'updateView'},
     *     function () { ... }
     * );
     *
     * @param {(string|Object)} actionInfo
     * @param {string} actionInfo.type
     * @param {string} [actionInfo.event]
     * @param {string} [actionInfo.update]
     * @param {string} [eventName]
     * @param {Function} action
     */
    echarts.registerAction = function (actionInfo, eventName, action) {
        if (typeof eventName === 'function') {
            action = eventName;
            eventName = '';
        }
        var actionType = zrUtil.isObject(actionInfo) ? actionInfo.type : [
                actionInfo,
                actionInfo = { event: eventName }
            ][0];
        // Event name is all lowercase
        actionInfo.event = (actionInfo.event || actionType).toLowerCase();
        eventName = actionInfo.event;
        // Validate action type and event name.
        zrUtil.assert(ACTION_REG.test(actionType) && ACTION_REG.test(eventName));
        if (!actions[actionType]) {
            actions[actionType] = {
                action: action,
                actionInfo: actionInfo
            };
        }
        eventActionMap[eventName] = actionType;
    };
    /**
     * @param {string} type
     * @param {*} CoordinateSystem
     */
    echarts.registerCoordinateSystem = function (type, CoordinateSystem) {
        CoordinateSystemManager.register(type, CoordinateSystem);
    };
    /**
     * Layout is a special stage of visual encoding
     * Most visual encoding like color are common for different chart
     * But each chart has it's own layout algorithm
     *
     * @param {number} [priority=1000]
     * @param {Function} layoutFunc
     */
    echarts.registerLayout = function (priority, layoutFunc) {
        if (typeof priority === 'function') {
            layoutFunc = priority;
            priority = PRIORITY_VISUAL_LAYOUT;
        }
        if (true) {
            if (isNaN(priority)) {
                throw new Error('Unkown layout priority');
            }
        }
        visualFuncs.push({
            prio: priority,
            func: layoutFunc,
            isLayout: true
        });
    };
    /**
     * @param {number} [priority=3000]
     * @param {Function} visualFunc
     */
    echarts.registerVisual = function (priority, visualFunc) {
        if (typeof priority === 'function') {
            visualFunc = priority;
            priority = PRIORITY_VISUAL_CHART;
        }
        if (true) {
            if (isNaN(priority)) {
                throw new Error('Unkown visual priority');
            }
        }
        visualFuncs.push({
            prio: priority,
            func: visualFunc
        });
    };
    /**
     * @param {string} name
     */
    echarts.registerLoading = function (name, loadingFx) {
        loadingEffects[name] = loadingFx;
    };
    /**
     * @param {Object} opts
     * @param {string} [superClass]
     */
    echarts.extendComponentModel = function (opts) {
        // var Clazz = ComponentModel;
        // if (superClass) {
        //     var classType = parseClassType(superClass);
        //     Clazz = ComponentModel.getClass(classType.main, classType.sub, true);
        // }
        return ComponentModel.extend(opts);
    };
    /**
     * @param {Object} opts
     * @param {string} [superClass]
     */
    echarts.extendComponentView = function (opts) {
        // var Clazz = ComponentView;
        // if (superClass) {
        //     var classType = parseClassType(superClass);
        //     Clazz = ComponentView.getClass(classType.main, classType.sub, true);
        // }
        return ComponentView.extend(opts);
    };
    /**
     * @param {Object} opts
     * @param {string} [superClass]
     */
    echarts.extendSeriesModel = function (opts) {
        // var Clazz = SeriesModel;
        // if (superClass) {
        //     superClass = 'series.' + superClass.replace('series.', '');
        //     var classType = parseClassType(superClass);
        //     Clazz = ComponentModel.getClass(classType.main, classType.sub, true);
        // }
        return SeriesModel.extend(opts);
    };
    /**
     * @param {Object} opts
     * @param {string} [superClass]
     */
    echarts.extendChartView = function (opts) {
        // var Clazz = ChartView;
        // if (superClass) {
        //     superClass = superClass.replace('series.', '');
        //     var classType = parseClassType(superClass);
        //     Clazz = ChartView.getClass(classType.main, true);
        // }
        return ChartView.extend(opts);
    };
    /**
     * ZRender need a canvas context to do measureText.
     * But in node environment canvas may be created by node-canvas.
     * So we need to specify how to create a canvas instead of using document.createElement('canvas')
     *
     * Be careful of using it in the browser.
     *
     * @param {Function} creator
     * @example
     *     var Canvas = require('canvas');
     *     var echarts = require('echarts');
     *     echarts.setCanvasCreator(function () {
     *         // Small size is enough.
     *         return new Canvas(32, 32);
     *     });
     */
    echarts.setCanvasCreator = function (creator) {
        zrUtil.createCanvas = creator;
    };
    echarts.registerVisual(PRIORITY_VISUAL_GLOBAL, require('./visual/seriesColor'));
    echarts.registerPreprocessor(require('./preprocessor/backwardCompat'));
    echarts.registerLoading('default', require('./loading/default'));
    // Default action
    echarts.registerAction({
        type: 'highlight',
        event: 'highlight',
        update: 'highlight'
    }, zrUtil.noop);
    echarts.registerAction({
        type: 'downplay',
        event: 'downplay',
        update: 'downplay'
    }, zrUtil.noop);
    // --------
    // Exports
    // --------
    //
    echarts.List = require('./data/List');
    echarts.Model = require('./model/Model');
    echarts.graphic = require('./util/graphic');
    echarts.number = require('./util/number');
    echarts.format = require('./util/format');
    echarts.throttle = throttle.throttle;
    echarts.matrix = require('zrender/core/matrix');
    echarts.vector = require('zrender/core/vector');
    echarts.color = require('zrender/tool/color');
    echarts.util = {};
    each([
        'map',
        'each',
        'filter',
        'indexOf',
        'inherits',
        'reduce',
        'filter',
        'bind',
        'curry',
        'isArray',
        'isString',
        'isObject',
        'isFunction',
        'extend',
        'defaults',
        'clone'
    ], function (name) {
        echarts.util[name] = zrUtil[name];
    });
    // PRIORITY
    echarts.PRIORITY = {
        PROCESSOR: {
            FILTER: PRIORITY_PROCESSOR_FILTER,
            STATISTIC: PRIORITY_PROCESSOR_STATISTIC
        },
        VISUAL: {
            LAYOUT: PRIORITY_VISUAL_LAYOUT,
            GLOBAL: PRIORITY_VISUAL_GLOBAL,
            CHART: PRIORITY_VISUAL_CHART,
            COMPONENT: PRIORITY_VISUAL_COMPONENT,
            BRUSH: PRIORITY_VISUAL_BRUSH
        }
    };
    return echarts;
});
define('echarts/chart/bar', ['require', 'zrender/core/util', '../coord/cartesian/Grid', './bar/BarSeries', './bar/BarView', '../layout/barGrid', '../echarts', '../component/grid'], function (require) {
    var zrUtil = require('zrender/core/util');
    require('../coord/cartesian/Grid');
    require('./bar/BarSeries');
    require('./bar/BarView');
    var barLayoutGrid = require('../layout/barGrid');
    var echarts = require('../echarts');
    echarts.registerLayout(zrUtil.curry(barLayoutGrid, 'bar'));
    // Visual coding for legend
    echarts.registerVisual(function (ecModel) {
        ecModel.eachSeriesByType('bar', function (seriesModel) {
            var data = seriesModel.getData();
            data.setVisual('legendSymbol', 'roundRect');
        });
    });
    // In case developer forget to include grid component
    require('../component/grid');
});
define('echarts/chart/line', ['require', 'zrender/core/util', '../echarts', './line/LineSeries', './line/LineView', '../visual/symbol', '../layout/points', '../processor/dataSample', '../component/grid'], function (require) {
    var zrUtil = require('zrender/core/util');
    var echarts = require('../echarts');
    var PRIORITY = echarts.PRIORITY;
    require('./line/LineSeries');
    require('./line/LineView');
    echarts.registerVisual(zrUtil.curry(require('../visual/symbol'), 'line', 'circle', 'line'));
    echarts.registerLayout(zrUtil.curry(require('../layout/points'), 'line'));
    // Down sample after filter
    echarts.registerProcessor(PRIORITY.PROCESSOR.STATISTIC, zrUtil.curry(require('../processor/dataSample'), 'line'));
    // In case developer forget to include grid component
    require('../component/grid');
});
define('echarts/chart/gauge', ['require', './gauge/GaugeSeries', './gauge/GaugeView'], function (require) {
    require('./gauge/GaugeSeries');
    require('./gauge/GaugeView');
});
define('echarts/component/grid', ['require', '../util/graphic', 'zrender/core/util', '../echarts', '../coord/cartesian/Grid', './axis'], function (require) {
    'use strict';
    var graphic = require('../util/graphic');
    var zrUtil = require('zrender/core/util');
    var echarts = require('../echarts');
    require('../coord/cartesian/Grid');
    require('./axis');
    // Grid view
    echarts.extendComponentView({
        type: 'grid',
        render: function (gridModel, ecModel) {
            this.group.removeAll();
            if (gridModel.get('show')) {
                this.group.add(new graphic.Rect({
                    shape: gridModel.coordinateSystem.getRect(),
                    style: zrUtil.defaults({ fill: gridModel.get('backgroundColor') }, gridModel.getItemStyle()),
                    silent: true,
                    z2: -1
                }));
            }
        }
    });
    echarts.registerPreprocessor(function (option) {
        // Only create grid when need
        if (option.xAxis && option.yAxis && !option.grid) {
            option.grid = {};
        }
    });
});
define('echarts/component/title', ['require', '../echarts', '../util/graphic', '../util/layout'], function (require) {
    'use strict';
    var echarts = require('../echarts');
    var graphic = require('../util/graphic');
    var layout = require('../util/layout');
    // Model
    echarts.extendComponentModel({
        type: 'title',
        layoutMode: {
            type: 'box',
            ignoreSize: true
        },
        defaultOption: {
            zlevel: 0,
            z: 6,
            show: true,
            text: '',
            target: 'blank',
            subtext: '',
            subtarget: 'blank',
            left: 0,
            top: 0,
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: '#ccc',
            borderWidth: 0,
            padding: 5,
            itemGap: 10,
            textStyle: {
                fontSize: 18,
                fontWeight: 'bolder',
                color: '#333'
            },
            subtextStyle: { color: '#aaa' }
        }
    });
    // View
    echarts.extendComponentView({
        type: 'title',
        render: function (titleModel, ecModel, api) {
            this.group.removeAll();
            if (!titleModel.get('show')) {
                return;
            }
            var group = this.group;
            var textStyleModel = titleModel.getModel('textStyle');
            var subtextStyleModel = titleModel.getModel('subtextStyle');
            var textAlign = titleModel.get('textAlign');
            var textBaseline = titleModel.get('textBaseline');
            var textEl = new graphic.Text({
                    style: {
                        text: titleModel.get('text'),
                        textFont: textStyleModel.getFont(),
                        fill: textStyleModel.getTextColor()
                    },
                    z2: 10
                });
            var textRect = textEl.getBoundingRect();
            var subText = titleModel.get('subtext');
            var subTextEl = new graphic.Text({
                    style: {
                        text: subText,
                        textFont: subtextStyleModel.getFont(),
                        fill: subtextStyleModel.getTextColor(),
                        y: textRect.height + titleModel.get('itemGap'),
                        textBaseline: 'top'
                    },
                    z2: 10
                });
            var link = titleModel.get('link');
            var sublink = titleModel.get('sublink');
            textEl.silent = !link;
            subTextEl.silent = !sublink;
            if (link) {
                textEl.on('click', function () {
                    window.open(link, '_' + titleModel.get('target'));
                });
            }
            if (sublink) {
                subTextEl.on('click', function () {
                    window.open(sublink, '_' + titleModel.get('subtarget'));
                });
            }
            group.add(textEl);
            subText && group.add(subTextEl);
            // If no subText, but add subTextEl, there will be an empty line.
            var groupRect = group.getBoundingRect();
            var layoutOption = titleModel.getBoxLayoutParams();
            layoutOption.width = groupRect.width;
            layoutOption.height = groupRect.height;
            var layoutRect = layout.getLayoutRect(layoutOption, {
                    width: api.getWidth(),
                    height: api.getHeight()
                }, titleModel.get('padding'));
            // Adjust text align based on position
            if (!textAlign) {
                // Align left if title is on the left. center and right is same
                textAlign = titleModel.get('left') || titleModel.get('right');
                if (textAlign === 'middle') {
                    textAlign = 'center';
                }
                // Adjust layout by text align
                if (textAlign === 'right') {
                    layoutRect.x += layoutRect.width;
                } else if (textAlign === 'center') {
                    layoutRect.x += layoutRect.width / 2;
                }
            }
            if (!textBaseline) {
                textBaseline = titleModel.get('top') || titleModel.get('bottom');
                if (textBaseline === 'center') {
                    textBaseline = 'middle';
                }
                if (textBaseline === 'bottom') {
                    layoutRect.y += layoutRect.height;
                } else if (textBaseline === 'middle') {
                    layoutRect.y += layoutRect.height / 2;
                }
                textBaseline = textBaseline || 'top';
            }
            group.attr('position', [
                layoutRect.x,
                layoutRect.y
            ]);
            var alignStyle = {
                    textAlign: textAlign,
                    textVerticalAlign: textBaseline
                };
            textEl.setStyle(alignStyle);
            subTextEl.setStyle(alignStyle);
            // Render background
            // Get groupRect again because textAlign has been changed
            groupRect = group.getBoundingRect();
            var padding = layoutRect.margin;
            var style = titleModel.getItemStyle([
                    'color',
                    'opacity'
                ]);
            style.fill = titleModel.get('backgroundColor');
            var rect = new graphic.Rect({
                    shape: {
                        x: groupRect.x - padding[3],
                        y: groupRect.y - padding[0],
                        width: groupRect.width + padding[1] + padding[3],
                        height: groupRect.height + padding[0] + padding[2]
                    },
                    style: style,
                    silent: true
                });
            graphic.subPixelOptimizeRect(rect);
            group.add(rect);
        }
    });
});
define('echarts/component/legend', ['require', './legend/LegendModel', './legend/legendAction', './legend/LegendView', '../echarts', './legend/legendFilter'], function (require) {
    require('./legend/LegendModel');
    require('./legend/legendAction');
    require('./legend/LegendView');
    var echarts = require('../echarts');
    // Series Filter
    echarts.registerProcessor(require('./legend/legendFilter'));
});
define('echarts/component/tooltip', ['require', './tooltip/TooltipModel', './tooltip/TooltipView', '../echarts'], function (require) {
    require('./tooltip/TooltipModel');
    require('./tooltip/TooltipView');
    // Show tip action
    /**
     * @action
     * @property {string} type
     * @property {number} seriesIndex
     * @property {number} dataIndex
     * @property {number} [x]
     * @property {number} [y]
     */
    require('../echarts').registerAction({
        type: 'showTip',
        event: 'showTip',
        update: 'tooltip:manuallyShowTip'
    }, function () {
    });
    // Hide tip action
    require('../echarts').registerAction({
        type: 'hideTip',
        event: 'hideTip',
        update: 'tooltip:manuallyHideTip'
    }, function () {
    });
});
define('echarts/component/markPoint', ['require', './marker/MarkPointModel', './marker/MarkPointView', '../echarts'], function (require) {
    require('./marker/MarkPointModel');
    require('./marker/MarkPointView');
    require('../echarts').registerPreprocessor(function (opt) {
        // Make sure markPoint component is enabled
        opt.markPoint = opt.markPoint || {};
    });
});
define('echarts/scale/Time', ['require', 'zrender/core/util', '../util/number', '../util/format', './Interval'], function (require) {
    var zrUtil = require('zrender/core/util');
    var numberUtil = require('../util/number');
    var formatUtil = require('../util/format');
    var IntervalScale = require('./Interval');
    var intervalScaleProto = IntervalScale.prototype;
    var mathCeil = Math.ceil;
    var mathFloor = Math.floor;
    var ONE_SECOND = 1000;
    var ONE_MINUTE = ONE_SECOND * 60;
    var ONE_HOUR = ONE_MINUTE * 60;
    var ONE_DAY = ONE_HOUR * 24;
    // FIXME 公用？
    var bisect = function (a, x, lo, hi) {
        while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (a[mid][2] < x) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    };
    /**
     * @alias module:echarts/coord/scale/Time
     * @constructor
     */
    var TimeScale = IntervalScale.extend({
            type: 'time',
            getLabel: function (val) {
                var stepLvl = this._stepLvl;
                var date = new Date(val);
                return formatUtil.formatTime(stepLvl[0], date);
            },
            niceExtent: function (approxTickNum, fixMin, fixMax) {
                var extent = this._extent;
                // If extent start and end are same, expand them
                if (extent[0] === extent[1]) {
                    // Expand extent
                    extent[0] -= ONE_DAY;
                    extent[1] += ONE_DAY;
                }
                // If there are no data and extent are [Infinity, -Infinity]
                if (extent[1] === -Infinity && extent[0] === Infinity) {
                    var d = new Date();
                    extent[1] = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    extent[0] = extent[1] - ONE_DAY;
                }
                this.niceTicks(approxTickNum);
                // var extent = this._extent;
                var interval = this._interval;
                if (!fixMin) {
                    extent[0] = numberUtil.round(mathFloor(extent[0] / interval) * interval);
                }
                if (!fixMax) {
                    extent[1] = numberUtil.round(mathCeil(extent[1] / interval) * interval);
                }
            },
            niceTicks: function (approxTickNum) {
                approxTickNum = approxTickNum || 10;
                var extent = this._extent;
                var span = extent[1] - extent[0];
                var approxInterval = span / approxTickNum;
                var scaleLevelsLen = scaleLevels.length;
                var idx = bisect(scaleLevels, approxInterval, 0, scaleLevelsLen);
                var level = scaleLevels[Math.min(idx, scaleLevelsLen - 1)];
                var interval = level[2];
                // Same with interval scale if span is much larger than 1 year
                if (level[0] === 'year') {
                    var yearSpan = span / interval;
                    // From "Nice Numbers for Graph Labels" of Graphic Gems
                    // var niceYearSpan = numberUtil.nice(yearSpan, false);
                    var yearStep = numberUtil.nice(yearSpan / approxTickNum, true);
                    interval *= yearStep;
                }
                var niceExtent = [
                        mathCeil(extent[0] / interval) * interval,
                        mathFloor(extent[1] / interval) * interval
                    ];
                this._stepLvl = level;
                // Interval will be used in getTicks
                this._interval = interval;
                this._niceExtent = niceExtent;
            },
            parse: function (val) {
                // val might be float.
                return +numberUtil.parseDate(val);
            }
        });
    zrUtil.each([
        'contain',
        'normalize'
    ], function (methodName) {
        TimeScale.prototype[methodName] = function (val) {
            return intervalScaleProto[methodName].call(this, this.parse(val));
        };
    });
    // Steps from d3
    var scaleLevels = [
            [
                'hh:mm:ss',
                1,
                ONE_SECOND
            ],
            [
                'hh:mm:ss',
                5,
                ONE_SECOND * 5
            ],
            [
                'hh:mm:ss',
                10,
                ONE_SECOND * 10
            ],
            [
                'hh:mm:ss',
                15,
                ONE_SECOND * 15
            ],
            [
                'hh:mm:ss',
                30,
                ONE_SECOND * 30
            ],
            [
                'hh:mm\nMM-dd',
                1,
                ONE_MINUTE
            ],
            [
                'hh:mm\nMM-dd',
                5,
                ONE_MINUTE * 5
            ],
            [
                'hh:mm\nMM-dd',
                10,
                ONE_MINUTE * 10
            ],
            [
                'hh:mm\nMM-dd',
                15,
                ONE_MINUTE * 15
            ],
            [
                'hh:mm\nMM-dd',
                30,
                ONE_MINUTE * 30
            ],
            [
                'hh:mm\nMM-dd',
                1,
                ONE_HOUR
            ],
            [
                'hh:mm\nMM-dd',
                2,
                ONE_HOUR * 2
            ],
            [
                'hh:mm\nMM-dd',
                6,
                ONE_HOUR * 6
            ],
            [
                'hh:mm\nMM-dd',
                12,
                ONE_HOUR * 12
            ],
            [
                'MM-dd\nyyyy',
                1,
                ONE_DAY
            ],
            [
                'week',
                7,
                ONE_DAY * 7
            ],
            [
                'month',
                1,
                ONE_DAY * 31
            ],
            [
                'quarter',
                3,
                ONE_DAY * 380 / 4
            ],
            [
                'half-year',
                6,
                ONE_DAY * 380 / 2
            ],
            [
                'year',
                1,
                ONE_DAY * 380
            ]
        ];
    /**
     * @return {module:echarts/scale/Time}
     */
    TimeScale.create = function () {
        return new TimeScale();
    };
    return TimeScale;
});
define('echarts/scale/Log', ['require', 'zrender/core/util', './Scale', '../util/number', './Interval'], function (require) {
    var zrUtil = require('zrender/core/util');
    var Scale = require('./Scale');
    var numberUtil = require('../util/number');
    // Use some method of IntervalScale
    var IntervalScale = require('./Interval');
    var scaleProto = Scale.prototype;
    var intervalScaleProto = IntervalScale.prototype;
    var getPrecisionSafe = numberUtil.getPrecisionSafe;
    var roundingErrorFix = numberUtil.round;
    var mathFloor = Math.floor;
    var mathCeil = Math.ceil;
    var mathPow = Math.pow;
    var mathLog = Math.log;
    var LogScale = Scale.extend({
            type: 'log',
            base: 10,
            $constructor: function () {
                Scale.apply(this, arguments);
                this._originalScale = new IntervalScale();
            },
            getTicks: function () {
                var originalScale = this._originalScale;
                var extent = this._extent;
                var originalExtent = originalScale.getExtent();
                return zrUtil.map(intervalScaleProto.getTicks.call(this), function (val) {
                    var powVal = numberUtil.round(mathPow(this.base, val));
                    // Fix #4158
                    powVal = val === extent[0] && originalScale.__fixMin ? fixRoundingError(powVal, originalExtent[0]) : powVal;
                    powVal = val === extent[1] && originalScale.__fixMax ? fixRoundingError(powVal, originalExtent[1]) : powVal;
                    return powVal;
                }, this);
            },
            getLabel: intervalScaleProto.getLabel,
            scale: function (val) {
                val = scaleProto.scale.call(this, val);
                return mathPow(this.base, val);
            },
            setExtent: function (start, end) {
                var base = this.base;
                start = mathLog(start) / mathLog(base);
                end = mathLog(end) / mathLog(base);
                intervalScaleProto.setExtent.call(this, start, end);
            },
            getExtent: function () {
                var base = this.base;
                var extent = scaleProto.getExtent.call(this);
                extent[0] = mathPow(base, extent[0]);
                extent[1] = mathPow(base, extent[1]);
                // Fix #4158
                var originalScale = this._originalScale;
                var originalExtent = originalScale.getExtent();
                originalScale.__fixMin && (extent[0] = fixRoundingError(extent[0], originalExtent[0]));
                originalScale.__fixMax && (extent[1] = fixRoundingError(extent[1], originalExtent[1]));
                return extent;
            },
            unionExtent: function (extent) {
                this._originalScale.unionExtent(extent);
                var base = this.base;
                extent[0] = mathLog(extent[0]) / mathLog(base);
                extent[1] = mathLog(extent[1]) / mathLog(base);
                scaleProto.unionExtent.call(this, extent);
            },
            unionExtentFromData: function (data, dim) {
                this.unionExtent(data.getDataExtent(dim, true, function (val) {
                    return val > 0;
                }));
            },
            niceTicks: function (approxTickNum) {
                approxTickNum = approxTickNum || 10;
                var extent = this._extent;
                var span = extent[1] - extent[0];
                if (span === Infinity || span <= 0) {
                    return;
                }
                var interval = numberUtil.quantity(span);
                var err = approxTickNum / span * interval;
                // Filter ticks to get closer to the desired count.
                if (err <= 0.5) {
                    interval *= 10;
                }
                // Interval should be integer
                while (!isNaN(interval) && Math.abs(interval) < 1 && Math.abs(interval) > 0) {
                    interval *= 10;
                }
                var niceExtent = [
                        numberUtil.round(mathCeil(extent[0] / interval) * interval),
                        numberUtil.round(mathFloor(extent[1] / interval) * interval)
                    ];
                this._interval = interval;
                this._niceExtent = niceExtent;
            },
            niceExtent: function (splitNumber, fixMin, fixMax) {
                intervalScaleProto.niceExtent.call(this, splitNumber, fixMin, fixMax);
                var originalScale = this._originalScale;
                originalScale.__fixMin = fixMin;
                originalScale.__fixMax = fixMax;
            }
        });
    zrUtil.each([
        'contain',
        'normalize'
    ], function (methodName) {
        LogScale.prototype[methodName] = function (val) {
            val = mathLog(val) / mathLog(this.base);
            return scaleProto[methodName].call(this, val);
        };
    });
    LogScale.create = function () {
        return new LogScale();
    };
    function fixRoundingError(val, originalVal) {
        return roundingErrorFix(val, getPrecisionSafe(originalVal));
    }
    return LogScale;
});
define('zrender/core/env', [], function () {
    var env = {};
    if (typeof navigator === 'undefined') {
        // In node
        env = {
            browser: {},
            os: {},
            node: true,
            canvasSupported: true
        };
    } else {
        env = detect(navigator.userAgent);
    }
    return env;
    // Zepto.js
    // (c) 2010-2013 Thomas Fuchs
    // Zepto.js may be freely distributed under the MIT license.
    function detect(ua) {
        var os = {};
        var browser = {};
        // var webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/);
        // var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
        // var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
        // var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
        // var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
        // var webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/);
        // var touchpad = webos && ua.match(/TouchPad/);
        // var kindle = ua.match(/Kindle\/([\d.]+)/);
        // var silk = ua.match(/Silk\/([\d._]+)/);
        // var blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/);
        // var bb10 = ua.match(/(BB10).*Version\/([\d.]+)/);
        // var rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/);
        // var playbook = ua.match(/PlayBook/);
        // var chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/);
        var firefox = ua.match(/Firefox\/([\d.]+)/);
        // var safari = webkit && ua.match(/Mobile\//) && !chrome;
        // var webview = ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/) && !chrome;
        var ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/.+?rv:(([\d.]+))/);
        var edge = ua.match(/Edge\/([\d.]+)/);
        // IE 12 and 12+
        var weChat = /micromessenger/i.test(ua);
        // Todo: clean this up with a better OS/browser seperation:
        // - discern (more) between multiple browsers on android
        // - decide if kindle fire in silk mode is android or not
        // - Firefox on Android doesn't specify the Android version
        // - possibly devide in os, device and browser hashes
        // if (browser.webkit = !!webkit) browser.version = webkit[1];
        // if (android) os.android = true, os.version = android[2];
        // if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.');
        // if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.');
        // if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
        // if (webos) os.webos = true, os.version = webos[2];
        // if (touchpad) os.touchpad = true;
        // if (blackberry) os.blackberry = true, os.version = blackberry[2];
        // if (bb10) os.bb10 = true, os.version = bb10[2];
        // if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2];
        // if (playbook) browser.playbook = true;
        // if (kindle) os.kindle = true, os.version = kindle[1];
        // if (silk) browser.silk = true, browser.version = silk[1];
        // if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true;
        // if (chrome) browser.chrome = true, browser.version = chrome[1];
        if (firefox) {
            browser.firefox = true;
            browser.version = firefox[1];
        }
        // if (safari && (ua.match(/Safari/) || !!os.ios)) browser.safari = true;
        // if (webview) browser.webview = true;
        if (ie) {
            browser.ie = true;
            browser.version = ie[1];
        }
        if (edge) {
            browser.edge = true;
            browser.version = edge[1];
        }
        // It is difficult to detect WeChat in Win Phone precisely, because ua can
        // not be set on win phone. So we do not consider Win Phone.
        if (weChat) {
            browser.weChat = true;
        }
        // os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) ||
        //     (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)));
        // os.phone  = !!(!os.tablet && !os.ipod && (android || iphone || webos ||
        //     (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
        //     (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))));
        return {
            browser: browser,
            os: os,
            node: false,
            canvasSupported: document.createElement('canvas').getContext ? true : false,
            touchEventsSupported: 'ontouchstart' in window && !browser.ie && !browser.edge,
            pointerEventsSupported: 'onpointerdown' in window && (browser.edge || browser.ie && browser.version >= 11)
        };
    }
});
define('echarts/model/Global', ['require', 'zrender/core/util', '../util/model', './Model', './Component', './globalDefault', './mixin/colorPalette'], function (require) {
    /**
     * Caution: If the mechanism should be changed some day, these cases
     * should be considered:
     *
     * (1) In `merge option` mode, if using the same option to call `setOption`
     * many times, the result should be the same (try our best to ensure that).
     * (2) In `merge option` mode, if a component has no id/name specified, it
     * will be merged by index, and the result sequence of the components is
     * consistent to the original sequence.
     * (3) `reset` feature (in toolbox). Find detailed info in comments about
     * `mergeOption` in module:echarts/model/OptionManager.
     */
    var zrUtil = require('zrender/core/util');
    var modelUtil = require('../util/model');
    var Model = require('./Model');
    var each = zrUtil.each;
    var filter = zrUtil.filter;
    var map = zrUtil.map;
    var isArray = zrUtil.isArray;
    var indexOf = zrUtil.indexOf;
    var isObject = zrUtil.isObject;
    var ComponentModel = require('./Component');
    var globalDefault = require('./globalDefault');
    var OPTION_INNER_KEY = ' _ec_inner';
    /**
     * @alias module:echarts/model/Global
     *
     * @param {Object} option
     * @param {module:echarts/model/Model} parentModel
     * @param {Object} theme
     */
    var GlobalModel = Model.extend({
            constructor: GlobalModel,
            init: function (option, parentModel, theme, optionManager) {
                theme = theme || {};
                this.option = null;
                // Mark as not initialized.
                /**
             * @type {module:echarts/model/Model}
             * @private
             */
                this._theme = new Model(theme);
                /**
             * @type {module:echarts/model/OptionManager}
             */
                this._optionManager = optionManager;
            },
            setOption: function (option, optionPreprocessorFuncs) {
                zrUtil.assert(!(OPTION_INNER_KEY in option), 'please use chart.getOption()');
                this._optionManager.setOption(option, optionPreprocessorFuncs);
                this.resetOption();
            },
            resetOption: function (type) {
                var optionChanged = false;
                var optionManager = this._optionManager;
                if (!type || type === 'recreate') {
                    var baseOption = optionManager.mountOption(type === 'recreate');
                    if (!this.option || type === 'recreate') {
                        initBase.call(this, baseOption);
                    } else {
                        this.restoreData();
                        this.mergeOption(baseOption);
                    }
                    optionChanged = true;
                }
                if (type === 'timeline' || type === 'media') {
                    this.restoreData();
                }
                if (!type || type === 'recreate' || type === 'timeline') {
                    var timelineOption = optionManager.getTimelineOption(this);
                    timelineOption && (this.mergeOption(timelineOption), optionChanged = true);
                }
                if (!type || type === 'recreate' || type === 'media') {
                    var mediaOptions = optionManager.getMediaOption(this, this._api);
                    if (mediaOptions.length) {
                        each(mediaOptions, function (mediaOption) {
                            this.mergeOption(mediaOption, optionChanged = true);
                        }, this);
                    }
                }
                return optionChanged;
            },
            mergeOption: function (newOption) {
                var option = this.option;
                var componentsMap = this._componentsMap;
                var newCptTypes = [];
                // 如果不存在对应的 component model 则直接 merge
                each(newOption, function (componentOption, mainType) {
                    if (componentOption == null) {
                        return;
                    }
                    if (!ComponentModel.hasClass(mainType)) {
                        option[mainType] = option[mainType] == null ? zrUtil.clone(componentOption) : zrUtil.merge(option[mainType], componentOption, true);
                    } else {
                        newCptTypes.push(mainType);
                    }
                });
                // FIXME OPTION 同步是否要改回原来的
                ComponentModel.topologicalTravel(newCptTypes, ComponentModel.getAllClassMainTypes(), visitComponent, this);
                this._seriesIndices = this._seriesIndices || [];
                function visitComponent(mainType, dependencies) {
                    var newCptOptionList = modelUtil.normalizeToArray(newOption[mainType]);
                    var mapResult = modelUtil.mappingToExists(componentsMap[mainType], newCptOptionList);
                    modelUtil.makeIdAndName(mapResult);
                    // Set mainType and complete subType.
                    each(mapResult, function (item, index) {
                        var opt = item.option;
                        if (isObject(opt)) {
                            item.keyInfo.mainType = mainType;
                            item.keyInfo.subType = determineSubType(mainType, opt, item.exist);
                        }
                    });
                    var dependentModels = getComponentsByTypes(componentsMap, dependencies);
                    option[mainType] = [];
                    componentsMap[mainType] = [];
                    each(mapResult, function (resultItem, index) {
                        var componentModel = resultItem.exist;
                        var newCptOption = resultItem.option;
                        zrUtil.assert(isObject(newCptOption) || componentModel, 'Empty component definition');
                        // Consider where is no new option and should be merged using {},
                        // see removeEdgeAndAdd in topologicalTravel and
                        // ComponentModel.getAllClassMainTypes.
                        if (!newCptOption) {
                            componentModel.mergeOption({}, this);
                            componentModel.optionUpdated({}, false);
                        } else {
                            var ComponentModelClass = ComponentModel.getClass(mainType, resultItem.keyInfo.subType, true);
                            if (componentModel && componentModel instanceof ComponentModelClass) {
                                componentModel.name = resultItem.keyInfo.name;
                                componentModel.mergeOption(newCptOption, this);
                                componentModel.optionUpdated(newCptOption, false);
                            } else {
                                // PENDING Global as parent ?
                                var extraOpt = zrUtil.extend({
                                        dependentModels: dependentModels,
                                        componentIndex: index
                                    }, resultItem.keyInfo);
                                componentModel = new ComponentModelClass(newCptOption, this, this, extraOpt);
                                zrUtil.extend(componentModel, extraOpt);
                                componentModel.init(newCptOption, this, this, extraOpt);
                                // Call optionUpdated after init.
                                // newCptOption has been used as componentModel.option
                                // and may be merged with theme and default, so pass null
                                // to avoid confusion.
                                componentModel.optionUpdated(null, true);
                            }
                        }
                        componentsMap[mainType][index] = componentModel;
                        option[mainType][index] = componentModel.option;
                    }, this);
                    // Backup series for filtering.
                    if (mainType === 'series') {
                        this._seriesIndices = createSeriesIndices(componentsMap.series);
                    }
                }
            },
            getOption: function () {
                var option = zrUtil.clone(this.option);
                each(option, function (opts, mainType) {
                    if (ComponentModel.hasClass(mainType)) {
                        var opts = modelUtil.normalizeToArray(opts);
                        for (var i = opts.length - 1; i >= 0; i--) {
                            // Remove options with inner id.
                            if (modelUtil.isIdInner(opts[i])) {
                                opts.splice(i, 1);
                            }
                        }
                        option[mainType] = opts;
                    }
                });
                delete option[OPTION_INNER_KEY];
                return option;
            },
            getTheme: function () {
                return this._theme;
            },
            getComponent: function (mainType, idx) {
                var list = this._componentsMap[mainType];
                if (list) {
                    return list[idx || 0];
                }
            },
            queryComponents: function (condition) {
                var mainType = condition.mainType;
                if (!mainType) {
                    return [];
                }
                var index = condition.index;
                var id = condition.id;
                var name = condition.name;
                var cpts = this._componentsMap[mainType];
                if (!cpts || !cpts.length) {
                    return [];
                }
                var result;
                if (index != null) {
                    if (!isArray(index)) {
                        index = [index];
                    }
                    result = filter(map(index, function (idx) {
                        return cpts[idx];
                    }), function (val) {
                        return !!val;
                    });
                } else if (id != null) {
                    var isIdArray = isArray(id);
                    result = filter(cpts, function (cpt) {
                        return isIdArray && indexOf(id, cpt.id) >= 0 || !isIdArray && cpt.id === id;
                    });
                } else if (name != null) {
                    var isNameArray = isArray(name);
                    result = filter(cpts, function (cpt) {
                        return isNameArray && indexOf(name, cpt.name) >= 0 || !isNameArray && cpt.name === name;
                    });
                } else {
                    // Return all components with mainType
                    result = cpts;
                }
                return filterBySubType(result, condition);
            },
            findComponents: function (condition) {
                var query = condition.query;
                var mainType = condition.mainType;
                var queryCond = getQueryCond(query);
                var result = queryCond ? this.queryComponents(queryCond) : this._componentsMap[mainType];
                return doFilter(filterBySubType(result, condition));
                function getQueryCond(q) {
                    var indexAttr = mainType + 'Index';
                    var idAttr = mainType + 'Id';
                    var nameAttr = mainType + 'Name';
                    return q && (q[indexAttr] != null || q[idAttr] != null || q[nameAttr] != null) ? {
                        mainType: mainType,
                        index: q[indexAttr],
                        id: q[idAttr],
                        name: q[nameAttr]
                    } : null;
                }
                function doFilter(res) {
                    return condition.filter ? filter(res, condition.filter) : res;
                }
            },
            eachComponent: function (mainType, cb, context) {
                var componentsMap = this._componentsMap;
                if (typeof mainType === 'function') {
                    context = cb;
                    cb = mainType;
                    each(componentsMap, function (components, componentType) {
                        each(components, function (component, index) {
                            cb.call(context, componentType, component, index);
                        });
                    });
                } else if (zrUtil.isString(mainType)) {
                    each(componentsMap[mainType], cb, context);
                } else if (isObject(mainType)) {
                    var queryResult = this.findComponents(mainType);
                    each(queryResult, cb, context);
                }
            },
            getSeriesByName: function (name) {
                var series = this._componentsMap.series;
                return filter(series, function (oneSeries) {
                    return oneSeries.name === name;
                });
            },
            getSeriesByIndex: function (seriesIndex) {
                return this._componentsMap.series[seriesIndex];
            },
            getSeriesByType: function (subType) {
                var series = this._componentsMap.series;
                return filter(series, function (oneSeries) {
                    return oneSeries.subType === subType;
                });
            },
            getSeries: function () {
                return this._componentsMap.series.slice();
            },
            eachSeries: function (cb, context) {
                assertSeriesInitialized(this);
                each(this._seriesIndices, function (rawSeriesIndex) {
                    var series = this._componentsMap.series[rawSeriesIndex];
                    cb.call(context, series, rawSeriesIndex);
                }, this);
            },
            eachRawSeries: function (cb, context) {
                each(this._componentsMap.series, cb, context);
            },
            eachSeriesByType: function (subType, cb, context) {
                assertSeriesInitialized(this);
                each(this._seriesIndices, function (rawSeriesIndex) {
                    var series = this._componentsMap.series[rawSeriesIndex];
                    if (series.subType === subType) {
                        cb.call(context, series, rawSeriesIndex);
                    }
                }, this);
            },
            eachRawSeriesByType: function (subType, cb, context) {
                return each(this.getSeriesByType(subType), cb, context);
            },
            isSeriesFiltered: function (seriesModel) {
                assertSeriesInitialized(this);
                return zrUtil.indexOf(this._seriesIndices, seriesModel.componentIndex) < 0;
            },
            filterSeries: function (cb, context) {
                assertSeriesInitialized(this);
                var filteredSeries = filter(this._componentsMap.series, cb, context);
                this._seriesIndices = createSeriesIndices(filteredSeries);
            },
            restoreData: function () {
                var componentsMap = this._componentsMap;
                this._seriesIndices = createSeriesIndices(componentsMap.series);
                var componentTypes = [];
                each(componentsMap, function (components, componentType) {
                    componentTypes.push(componentType);
                });
                ComponentModel.topologicalTravel(componentTypes, ComponentModel.getAllClassMainTypes(), function (componentType, dependencies) {
                    each(componentsMap[componentType], function (component) {
                        component.restoreData();
                    });
                });
            }
        });
    /**
     * @inner
     */
    function mergeTheme(option, theme) {
        zrUtil.each(theme, function (themeItem, name) {
            // 如果有 component model 则把具体的 merge 逻辑交给该 model 处理
            if (!ComponentModel.hasClass(name)) {
                if (typeof themeItem === 'object') {
                    option[name] = !option[name] ? zrUtil.clone(themeItem) : zrUtil.merge(option[name], themeItem, false);
                } else {
                    if (option[name] == null) {
                        option[name] = themeItem;
                    }
                }
            }
        });
    }
    function initBase(baseOption) {
        baseOption = baseOption;
        // Using OPTION_INNER_KEY to mark that this option can not be used outside,
        // i.e. `chart.setOption(chart.getModel().option);` is forbiden.
        this.option = {};
        this.option[OPTION_INNER_KEY] = 1;
        /**
         * @type {Object.<string, Array.<module:echarts/model/Model>>}
         * @private
         */
        this._componentsMap = {};
        /**
         * Mapping between filtered series list and raw series list.
         * key: filtered series indices, value: raw series indices.
         * @type {Array.<nubmer>}
         * @private
         */
        this._seriesIndices = null;
        mergeTheme(baseOption, this._theme.option);
        // TODO Needs clone when merging to the unexisted property
        zrUtil.merge(baseOption, globalDefault, false);
        this.mergeOption(baseOption);
    }
    /**
     * @inner
     * @param {Array.<string>|string} types model types
     * @return {Object} key: {string} type, value: {Array.<Object>} models
     */
    function getComponentsByTypes(componentsMap, types) {
        if (!zrUtil.isArray(types)) {
            types = types ? [types] : [];
        }
        var ret = {};
        each(types, function (type) {
            ret[type] = (componentsMap[type] || []).slice();
        });
        return ret;
    }
    /**
     * @inner
     */
    function determineSubType(mainType, newCptOption, existComponent) {
        var subType = newCptOption.type ? newCptOption.type : existComponent ? existComponent.subType : ComponentModel.determineSubType(mainType, newCptOption);
        // tooltip, markline, markpoint may always has no subType
        return subType;
    }
    /**
     * @inner
     */
    function createSeriesIndices(seriesModels) {
        return map(seriesModels, function (series) {
            return series.componentIndex;
        }) || [];
    }
    /**
     * @inner
     */
    function filterBySubType(components, condition) {
        // Using hasOwnProperty for restrict. Consider
        // subType is undefined in user payload.
        return condition.hasOwnProperty('subType') ? filter(components, function (cpt) {
            return cpt.subType === condition.subType;
        }) : components;
    }
    /**
     * @inner
     */
    function assertSeriesInitialized(ecModel) {
        // Components that use _seriesIndices should depends on series component,
        // which make sure that their initialization is after series.
        if (true) {
            if (!ecModel._seriesIndices) {
                throw new Error('Series has not been initialized yet.');
            }
        }
    }
    zrUtil.mixin(GlobalModel, require('./mixin/colorPalette'));
    return GlobalModel;
});
define('echarts/ExtensionAPI', ['require', 'zrender/core/util'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var echartsAPIList = [
            'getDom',
            'getZr',
            'getWidth',
            'getHeight',
            'dispatchAction',
            'isDisposed',
            'on',
            'off',
            'getDataURL',
            'getConnectedDataURL',
            'getModel',
            'getOption'
        ];
    function ExtensionAPI(chartInstance) {
        zrUtil.each(echartsAPIList, function (name) {
            this[name] = zrUtil.bind(chartInstance[name], chartInstance);
        }, this);
    }
    return ExtensionAPI;
});
define('echarts/CoordinateSystem', ['require', 'zrender/core/util'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    /**
     * Interface of Coordinate System Class
     *
     * create:
     *     @param {module:echarts/model/Global} ecModel
     *     @param {module:echarts/ExtensionAPI} api
     *     @return {Object} coordinate system instance
     *
     * update:
     *     @param {module:echarts/model/Global} ecModel
     *     @param {module:echarts/ExtensionAPI} api
     *
     * convertToPixel:
     * convertFromPixel:
     *     These two methods is also responsible for determine whether this
     *     coodinate system is applicable to the given `finder`.
     *     Each coordinate system will be tried, util one returns none
     *     null/undefined value.
     *     @param {module:echarts/model/Global} ecModel
     *     @param {Object} finder
     *     @param {Array|number} value
     *     @return {Array|number} convert result.
     *
     * containPoint:
     *     @param {Array.<number>} point In pixel coordinate system.
     *     @return {boolean}
     */
    var coordinateSystemCreators = {};
    function CoordinateSystemManager() {
        this._coordinateSystems = [];
    }
    CoordinateSystemManager.prototype = {
        constructor: CoordinateSystemManager,
        create: function (ecModel, api) {
            var coordinateSystems = [];
            zrUtil.each(coordinateSystemCreators, function (creater, type) {
                var list = creater.create(ecModel, api);
                coordinateSystems = coordinateSystems.concat(list || []);
            });
            this._coordinateSystems = coordinateSystems;
        },
        update: function (ecModel, api) {
            zrUtil.each(this._coordinateSystems, function (coordSys) {
                // FIXME MUST have
                coordSys.update && coordSys.update(ecModel, api);
            });
        },
        getCoordinateSystems: function () {
            return this._coordinateSystems.slice();
        }
    };
    CoordinateSystemManager.register = function (type, coordinateSystemCreator) {
        coordinateSystemCreators[type] = coordinateSystemCreator;
    };
    CoordinateSystemManager.get = function (type) {
        return coordinateSystemCreators[type];
    };
    return CoordinateSystemManager;
});
define('echarts/model/OptionManager', ['require', 'zrender/core/util', '../util/model', './Component'], function (require) {
    var zrUtil = require('zrender/core/util');
    var modelUtil = require('../util/model');
    var ComponentModel = require('./Component');
    var each = zrUtil.each;
    var clone = zrUtil.clone;
    var map = zrUtil.map;
    var merge = zrUtil.merge;
    var QUERY_REG = /^(min|max)?(.+)$/;
    /**
     * TERM EXPLANATIONS:
     *
     * [option]:
     *
     *     An object that contains definitions of components. For example:
     *     var option = {
     *         title: {...},
     *         legend: {...},
     *         visualMap: {...},
     *         series: [
     *             {data: [...]},
     *             {data: [...]},
     *             ...
     *         ]
     *     };
     *
     * [rawOption]:
     *
     *     An object input to echarts.setOption. 'rawOption' may be an
     *     'option', or may be an object contains multi-options. For example:
     *     var option = {
     *         baseOption: {
     *             title: {...},
     *             legend: {...},
     *             series: [
     *                 {data: [...]},
     *                 {data: [...]},
     *                 ...
     *             ]
     *         },
     *         timeline: {...},
     *         options: [
     *             {title: {...}, series: {data: [...]}},
     *             {title: {...}, series: {data: [...]}},
     *             ...
     *         ],
     *         media: [
     *             {
     *                 query: {maxWidth: 320},
     *                 option: {series: {x: 20}, visualMap: {show: false}}
     *             },
     *             {
     *                 query: {minWidth: 320, maxWidth: 720},
     *                 option: {series: {x: 500}, visualMap: {show: true}}
     *             },
     *             {
     *                 option: {series: {x: 1200}, visualMap: {show: true}}
     *             }
     *         ]
     *     };
     *
     * @alias module:echarts/model/OptionManager
     * @param {module:echarts/ExtensionAPI} api
     */
    function OptionManager(api) {
        /**
         * @private
         * @type {module:echarts/ExtensionAPI}
         */
        this._api = api;
        /**
         * @private
         * @type {Array.<number>}
         */
        this._timelineOptions = [];
        /**
         * @private
         * @type {Array.<Object>}
         */
        this._mediaList = [];
        /**
         * @private
         * @type {Object}
         */
        this._mediaDefault;
        /**
         * -1, means default.
         * empty means no media.
         * @private
         * @type {Array.<number>}
         */
        this._currentMediaIndices = [];
        /**
         * @private
         * @type {Object}
         */
        this._optionBackup;
        /**
         * @private
         * @type {Object}
         */
        this._newBaseOption;
    }
    // timeline.notMerge is not supported in ec3. Firstly there is rearly
    // case that notMerge is needed. Secondly supporting 'notMerge' requires
    // rawOption cloned and backuped when timeline changed, which does no
    // good to performance. What's more, that both timeline and setOption
    // method supply 'notMerge' brings complex and some problems.
    // Consider this case:
    // (step1) chart.setOption({timeline: {notMerge: false}, ...}, false);
    // (step2) chart.setOption({timeline: {notMerge: true}, ...}, false);
    OptionManager.prototype = {
        constructor: OptionManager,
        setOption: function (rawOption, optionPreprocessorFuncs) {
            rawOption = clone(rawOption, true);
            // FIXME
            // 如果 timeline options 或者 media 中设置了某个属性，而baseOption中没有设置，则进行警告。
            var oldOptionBackup = this._optionBackup;
            var newParsedOption = parseRawOption.call(this, rawOption, optionPreprocessorFuncs, !oldOptionBackup);
            this._newBaseOption = newParsedOption.baseOption;
            // For setOption at second time (using merge mode);
            if (oldOptionBackup) {
                // Only baseOption can be merged.
                mergeOption(oldOptionBackup.baseOption, newParsedOption.baseOption);
                // For simplicity, timeline options and media options do not support merge,
                // that is, if you `setOption` twice and both has timeline options, the latter
                // timeline opitons will not be merged to the formers, but just substitude them.
                if (newParsedOption.timelineOptions.length) {
                    oldOptionBackup.timelineOptions = newParsedOption.timelineOptions;
                }
                if (newParsedOption.mediaList.length) {
                    oldOptionBackup.mediaList = newParsedOption.mediaList;
                }
                if (newParsedOption.mediaDefault) {
                    oldOptionBackup.mediaDefault = newParsedOption.mediaDefault;
                }
            } else {
                this._optionBackup = newParsedOption;
            }
        },
        mountOption: function (isRecreate) {
            var optionBackup = this._optionBackup;
            // TODO
            // 如果没有reset功能则不clone。
            this._timelineOptions = map(optionBackup.timelineOptions, clone);
            this._mediaList = map(optionBackup.mediaList, clone);
            this._mediaDefault = clone(optionBackup.mediaDefault);
            this._currentMediaIndices = [];
            return clone(isRecreate ? optionBackup.baseOption : this._newBaseOption);
        },
        getTimelineOption: function (ecModel) {
            var option;
            var timelineOptions = this._timelineOptions;
            if (timelineOptions.length) {
                // getTimelineOption can only be called after ecModel inited,
                // so we can get currentIndex from timelineModel.
                var timelineModel = ecModel.getComponent('timeline');
                if (timelineModel) {
                    option = clone(timelineOptions[timelineModel.getCurrentIndex()], true);
                }
            }
            return option;
        },
        getMediaOption: function (ecModel) {
            var ecWidth = this._api.getWidth();
            var ecHeight = this._api.getHeight();
            var mediaList = this._mediaList;
            var mediaDefault = this._mediaDefault;
            var indices = [];
            var result = [];
            // No media defined.
            if (!mediaList.length && !mediaDefault) {
                return result;
            }
            // Multi media may be applied, the latter defined media has higher priority.
            for (var i = 0, len = mediaList.length; i < len; i++) {
                if (applyMediaQuery(mediaList[i].query, ecWidth, ecHeight)) {
                    indices.push(i);
                }
            }
            // FIXME
            // 是否mediaDefault应该强制用户设置，否则可能修改不能回归。
            if (!indices.length && mediaDefault) {
                indices = [-1];
            }
            if (indices.length && !indicesEquals(indices, this._currentMediaIndices)) {
                result = map(indices, function (index) {
                    return clone(index === -1 ? mediaDefault.option : mediaList[index].option);
                });
            }
            // Otherwise return nothing.
            this._currentMediaIndices = indices;
            return result;
        }
    };
    function parseRawOption(rawOption, optionPreprocessorFuncs, isNew) {
        var timelineOptions = [];
        var mediaList = [];
        var mediaDefault;
        var baseOption;
        // Compatible with ec2.
        var timelineOpt = rawOption.timeline;
        if (rawOption.baseOption) {
            baseOption = rawOption.baseOption;
        }
        // For timeline
        if (timelineOpt || rawOption.options) {
            baseOption = baseOption || {};
            timelineOptions = (rawOption.options || []).slice();
        }
        // For media query
        if (rawOption.media) {
            baseOption = baseOption || {};
            var media = rawOption.media;
            each(media, function (singleMedia) {
                if (singleMedia && singleMedia.option) {
                    if (singleMedia.query) {
                        mediaList.push(singleMedia);
                    } else if (!mediaDefault) {
                        // Use the first media default.
                        mediaDefault = singleMedia;
                    }
                }
            });
        }
        // For normal option
        if (!baseOption) {
            baseOption = rawOption;
        }
        // Set timelineOpt to baseOption in ec3,
        // which is convenient for merge option.
        if (!baseOption.timeline) {
            baseOption.timeline = timelineOpt;
        }
        // Preprocess.
        each([baseOption].concat(timelineOptions).concat(zrUtil.map(mediaList, function (media) {
            return media.option;
        })), function (option) {
            each(optionPreprocessorFuncs, function (preProcess) {
                preProcess(option, isNew);
            });
        });
        return {
            baseOption: baseOption,
            timelineOptions: timelineOptions,
            mediaDefault: mediaDefault,
            mediaList: mediaList
        };
    }
    /**
     * @see <http://www.w3.org/TR/css3-mediaqueries/#media1>
     * Support: width, height, aspectRatio
     * Can use max or min as prefix.
     */
    function applyMediaQuery(query, ecWidth, ecHeight) {
        var realMap = {
                width: ecWidth,
                height: ecHeight,
                aspectratio: ecWidth / ecHeight
            };
        var applicatable = true;
        zrUtil.each(query, function (value, attr) {
            var matched = attr.match(QUERY_REG);
            if (!matched || !matched[1] || !matched[2]) {
                return;
            }
            var operator = matched[1];
            var realAttr = matched[2].toLowerCase();
            if (!compare(realMap[realAttr], value, operator)) {
                applicatable = false;
            }
        });
        return applicatable;
    }
    function compare(real, expect, operator) {
        if (operator === 'min') {
            return real >= expect;
        } else if (operator === 'max') {
            return real <= expect;
        } else {
            // Equals
            return real === expect;
        }
    }
    function indicesEquals(indices1, indices2) {
        // indices is always order by asc and has only finite number.
        return indices1.join(',') === indices2.join(',');
    }
    /**
     * Consider case:
     * `chart.setOption(opt1);`
     * Then user do some interaction like dataZoom, dataView changing.
     * `chart.setOption(opt2);`
     * Then user press 'reset button' in toolbox.
     *
     * After doing that all of the interaction effects should be reset, the
     * chart should be the same as the result of invoke
     * `chart.setOption(opt1); chart.setOption(opt2);`.
     *
     * Although it is not able ensure that
     * `chart.setOption(opt1); chart.setOption(opt2);` is equivalents to
     * `chart.setOption(merge(opt1, opt2));` exactly,
     * this might be the only simple way to implement that feature.
     *
     * MEMO: We've considered some other approaches:
     * 1. Each model handle its self restoration but not uniform treatment.
     *     (Too complex in logic and error-prone)
     * 2. Use a shadow ecModel. (Performace expensive)
     */
    function mergeOption(oldOption, newOption) {
        newOption = newOption || {};
        each(newOption, function (newCptOpt, mainType) {
            if (newCptOpt == null) {
                return;
            }
            var oldCptOpt = oldOption[mainType];
            if (!ComponentModel.hasClass(mainType)) {
                oldOption[mainType] = merge(oldCptOpt, newCptOpt, true);
            } else {
                newCptOpt = modelUtil.normalizeToArray(newCptOpt);
                oldCptOpt = modelUtil.normalizeToArray(oldCptOpt);
                var mapResult = modelUtil.mappingToExists(oldCptOpt, newCptOpt);
                oldOption[mainType] = map(mapResult, function (item) {
                    return item.option && item.exist ? merge(item.exist, item.option, true) : item.exist || item.option;
                });
            }
        });
    }
    return OptionManager;
});
define('echarts/model/Component', ['require', './Model', 'zrender/core/util', '../util/component', '../util/clazz', '../util/layout', './mixin/boxLayout'], function (require) {
    var Model = require('./Model');
    var zrUtil = require('zrender/core/util');
    var arrayPush = Array.prototype.push;
    var componentUtil = require('../util/component');
    var clazzUtil = require('../util/clazz');
    var layout = require('../util/layout');
    /**
     * @alias module:echarts/model/Component
     * @constructor
     * @param {Object} option
     * @param {module:echarts/model/Model} parentModel
     * @param {module:echarts/model/Model} ecModel
     */
    var ComponentModel = Model.extend({
            type: 'component',
            id: '',
            name: '',
            mainType: '',
            subType: '',
            componentIndex: 0,
            defaultOption: null,
            ecModel: null,
            dependentModels: [],
            uid: null,
            layoutMode: null,
            $constructor: function (option, parentModel, ecModel, extraOpt) {
                Model.call(this, option, parentModel, ecModel, extraOpt);
                this.uid = componentUtil.getUID('componentModel');
            },
            init: function (option, parentModel, ecModel, extraOpt) {
                this.mergeDefaultAndTheme(option, ecModel);
            },
            mergeDefaultAndTheme: function (option, ecModel) {
                var layoutMode = this.layoutMode;
                var inputPositionParams = layoutMode ? layout.getLayoutParams(option) : {};
                var themeModel = ecModel.getTheme();
                zrUtil.merge(option, themeModel.get(this.mainType));
                zrUtil.merge(option, this.getDefaultOption());
                if (layoutMode) {
                    layout.mergeLayoutParam(option, inputPositionParams, layoutMode);
                }
            },
            mergeOption: function (option, extraOpt) {
                zrUtil.merge(this.option, option, true);
                var layoutMode = this.layoutMode;
                if (layoutMode) {
                    layout.mergeLayoutParam(this.option, option, layoutMode);
                }
            },
            optionUpdated: function (newCptOption, isInit) {
            },
            getDefaultOption: function () {
                if (!clazzUtil.hasOwn(this, '__defaultOption')) {
                    var optList = [];
                    var Class = this.constructor;
                    while (Class) {
                        var opt = Class.prototype.defaultOption;
                        opt && optList.push(opt);
                        Class = Class.superClass;
                    }
                    var defaultOption = {};
                    for (var i = optList.length - 1; i >= 0; i--) {
                        defaultOption = zrUtil.merge(defaultOption, optList[i], true);
                    }
                    clazzUtil.set(this, '__defaultOption', defaultOption);
                }
                return clazzUtil.get(this, '__defaultOption');
            },
            getReferringComponents: function (mainType) {
                return this.ecModel.queryComponents({
                    mainType: mainType,
                    index: this.get(mainType + 'Index', true),
                    id: this.get(mainType + 'Id', true)
                });
            }
        });
    // Reset ComponentModel.extend, add preConstruct.
    // clazzUtil.enableClassExtend(
    //     ComponentModel,
    //     function (option, parentModel, ecModel, extraOpt) {
    //         // Set dependentModels, componentIndex, name, id, mainType, subType.
    //         zrUtil.extend(this, extraOpt);
    //         this.uid = componentUtil.getUID('componentModel');
    //         // this.setReadOnly([
    //         //     'type', 'id', 'uid', 'name', 'mainType', 'subType',
    //         //     'dependentModels', 'componentIndex'
    //         // ]);
    //     }
    // );
    // Add capability of registerClass, getClass, hasClass, registerSubTypeDefaulter and so on.
    clazzUtil.enableClassManagement(ComponentModel, { registerWhenExtend: true });
    componentUtil.enableSubTypeDefaulter(ComponentModel);
    // Add capability of ComponentModel.topologicalTravel.
    componentUtil.enableTopologicalTravel(ComponentModel, getDependencies);
    function getDependencies(componentType) {
        var deps = [];
        zrUtil.each(ComponentModel.getClassesByMainType(componentType), function (Clazz) {
            arrayPush.apply(deps, Clazz.prototype.dependencies || []);
        });
        // Ensure main type
        return zrUtil.map(deps, function (type) {
            return clazzUtil.parseClassType(type).main;
        });
    }
    zrUtil.mixin(ComponentModel, require('./mixin/boxLayout'));
    return ComponentModel;
});
define('echarts/model/Series', ['require', 'zrender/core/util', '../util/format', '../util/clazz', '../util/model', './Component', './mixin/colorPalette', 'zrender/core/env', '../util/layout'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var formatUtil = require('../util/format');
    var classUtil = require('../util/clazz');
    var modelUtil = require('../util/model');
    var ComponentModel = require('./Component');
    var colorPaletteMixin = require('./mixin/colorPalette');
    var env = require('zrender/core/env');
    var layout = require('../util/layout');
    var set = classUtil.set;
    var get = classUtil.get;
    var encodeHTML = formatUtil.encodeHTML;
    var addCommas = formatUtil.addCommas;
    var SeriesModel = ComponentModel.extend({
            type: 'series.__base__',
            seriesIndex: 0,
            coordinateSystem: null,
            defaultOption: null,
            legendDataProvider: null,
            visualColorAccessPath: 'itemStyle.normal.color',
            layoutMode: null,
            init: function (option, parentModel, ecModel, extraOpt) {
                /**
             * @type {number}
             * @readOnly
             */
                this.seriesIndex = this.componentIndex;
                this.mergeDefaultAndTheme(option, ecModel);
                /**
             * @type {module:echarts/data/List|module:echarts/data/Tree|module:echarts/data/Graph}
             * @private
             */
                set(this, 'dataBeforeProcessed', this.getInitialData(option, ecModel));
                // If we reverse the order (make data firstly, and then make
                // dataBeforeProcessed by cloneShallow), cloneShallow will
                // cause data.graph.data !== data when using
                // module:echarts/data/Graph or module:echarts/data/Tree.
                // See module:echarts/data/helper/linkList
                this.restoreData();
            },
            mergeDefaultAndTheme: function (option, ecModel) {
                var layoutMode = this.layoutMode;
                var inputPositionParams = layoutMode ? layout.getLayoutParams(option) : {};
                zrUtil.merge(option, ecModel.getTheme().get(this.subType));
                zrUtil.merge(option, this.getDefaultOption());
                // Default label emphasis `position` and `show`
                // FIXME Set label in mergeOption
                modelUtil.defaultEmphasis(option.label, modelUtil.LABEL_OPTIONS);
                this.fillDataTextStyle(option.data);
                if (layoutMode) {
                    layout.mergeLayoutParam(option, inputPositionParams, layoutMode);
                }
            },
            mergeOption: function (newSeriesOption, ecModel) {
                newSeriesOption = zrUtil.merge(this.option, newSeriesOption, true);
                this.fillDataTextStyle(newSeriesOption.data);
                var layoutMode = this.layoutMode;
                if (layoutMode) {
                    layout.mergeLayoutParam(this.option, newSeriesOption, layoutMode);
                }
                var data = this.getInitialData(newSeriesOption, ecModel);
                // TODO Merge data?
                if (data) {
                    set(this, 'data', data);
                    set(this, 'dataBeforeProcessed', data.cloneShallow());
                }
            },
            fillDataTextStyle: function (data) {
                // Default data label emphasis `position` and `show`
                // FIXME Tree structure data ?
                // FIXME Performance ?
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i] && data[i].label) {
                            modelUtil.defaultEmphasis(data[i].label, modelUtil.LABEL_OPTIONS);
                        }
                    }
                }
            },
            getInitialData: function () {
            },
            getData: function (dataType) {
                var data = get(this, 'data');
                return dataType == null ? data : data.getLinkedData(dataType);
            },
            setData: function (data) {
                set(this, 'data', data);
            },
            getRawData: function () {
                return get(this, 'dataBeforeProcessed');
            },
            coordDimToDataDim: function (coordDim) {
                return [coordDim];
            },
            dataDimToCoordDim: function (dataDim) {
                return dataDim;
            },
            getBaseAxis: function () {
                var coordSys = this.coordinateSystem;
                return coordSys && coordSys.getBaseAxis && coordSys.getBaseAxis();
            },
            formatTooltip: function (dataIndex, multipleSeries, dataType) {
                function formatArrayValue(value) {
                    var result = [];
                    zrUtil.each(value, function (val, idx) {
                        var dimInfo = data.getDimensionInfo(idx);
                        var dimType = dimInfo && dimInfo.type;
                        var valStr;
                        if (dimType === 'ordinal') {
                            valStr = val + '';
                        } else if (dimType === 'time') {
                            valStr = multipleSeries ? '' : formatUtil.formatTime('yyyy/MM/dd hh:mm:ss', val);
                        } else {
                            valStr = addCommas(val);
                        }
                        valStr && result.push(valStr);
                    });
                    return result.join(', ');
                }
                var data = get(this, 'data');
                var value = this.getRawValue(dataIndex);
                var formattedValue = encodeHTML(zrUtil.isArray(value) ? formatArrayValue(value) : addCommas(value));
                var name = data.getName(dataIndex);
                var color = data.getItemVisual(dataIndex, 'color');
                if (zrUtil.isObject(color) && color.colorStops) {
                    color = (color.colorStops[0] || {}).color;
                }
                color = color || 'transparent';
                var colorEl = '<span style="display:inline-block;margin-right:5px;' + 'border-radius:10px;width:9px;height:9px;background-color:' + encodeHTML(color) + '"></span>';
                var seriesName = this.name;
                // FIXME
                if (seriesName === ' -') {
                    // Not show '-'
                    seriesName = '';
                }
                return !multipleSeries ? (seriesName && encodeHTML(seriesName) + '<br />') + colorEl + (name ? encodeHTML(name) + ' : ' + formattedValue : formattedValue) : colorEl + encodeHTML(this.name) + ' : ' + formattedValue;
            },
            isAnimationEnabled: function () {
                if (env.node) {
                    return false;
                }
                var animationEnabled = this.getShallow('animation');
                if (animationEnabled) {
                    if (this.getData().count() > this.getShallow('animationThreshold')) {
                        animationEnabled = false;
                    }
                }
                return animationEnabled;
            },
            restoreData: function () {
                set(this, 'data', get(this, 'dataBeforeProcessed').cloneShallow());
            },
            getColorFromPalette: function (name, scope) {
                var ecModel = this.ecModel;
                // PENDING
                var color = colorPaletteMixin.getColorFromPalette.call(this, name, scope);
                if (!color) {
                    color = ecModel.getColorFromPalette(name, scope);
                }
                return color;
            },
            getAxisTooltipDataIndex: null,
            getTooltipPosition: null
        });
    zrUtil.mixin(SeriesModel, modelUtil.dataFormatMixin);
    zrUtil.mixin(SeriesModel, colorPaletteMixin);
    return SeriesModel;
});
define('echarts/view/Component', ['require', 'zrender/container/Group', '../util/component', '../util/clazz'], function (require) {
    var Group = require('zrender/container/Group');
    var componentUtil = require('../util/component');
    var clazzUtil = require('../util/clazz');
    var Component = function () {
        /**
         * @type {module:zrender/container/Group}
         * @readOnly
         */
        this.group = new Group();
        /**
         * @type {string}
         * @readOnly
         */
        this.uid = componentUtil.getUID('viewComponent');
    };
    Component.prototype = {
        constructor: Component,
        init: function (ecModel, api) {
        },
        render: function (componentModel, ecModel, api, payload) {
        },
        dispose: function () {
        }
    };
    var componentProto = Component.prototype;
    componentProto.updateView = componentProto.updateLayout = componentProto.updateVisual = function (seriesModel, ecModel, api, payload) {
    };
    // Enable Component.extend.
    clazzUtil.enableClassExtend(Component);
    // Enable capability of registerClass, getClass, hasClass, registerSubTypeDefaulter and so on.
    clazzUtil.enableClassManagement(Component, { registerWhenExtend: true });
    return Component;
});
define('echarts/view/Chart', ['require', 'zrender/container/Group', '../util/component', '../util/clazz', '../util/model', 'zrender/core/util'], function (require) {
    var Group = require('zrender/container/Group');
    var componentUtil = require('../util/component');
    var clazzUtil = require('../util/clazz');
    var modelUtil = require('../util/model');
    var zrUtil = require('zrender/core/util');
    function Chart() {
        /**
         * @type {module:zrender/container/Group}
         * @readOnly
         */
        this.group = new Group();
        /**
         * @type {string}
         * @readOnly
         */
        this.uid = componentUtil.getUID('viewChart');
    }
    Chart.prototype = {
        type: 'chart',
        init: function (ecModel, api) {
        },
        render: function (seriesModel, ecModel, api, payload) {
        },
        highlight: function (seriesModel, ecModel, api, payload) {
            toggleHighlight(seriesModel.getData(), payload, 'emphasis');
        },
        downplay: function (seriesModel, ecModel, api, payload) {
            toggleHighlight(seriesModel.getData(), payload, 'normal');
        },
        remove: function (ecModel, api) {
            this.group.removeAll();
        },
        dispose: function () {
        }    /**
         * The view contains the given point.
         * @interface
         * @param {Array.<number>} point
         * @return {boolean}
         */
             // containPoint: function () {}
    };
    var chartProto = Chart.prototype;
    chartProto.updateView = chartProto.updateLayout = chartProto.updateVisual = function (seriesModel, ecModel, api, payload) {
        this.render(seriesModel, ecModel, api, payload);
    };
    /**
     * Set state of single element
     * @param  {module:zrender/Element} el
     * @param  {string} state
     */
    function elSetState(el, state) {
        if (el) {
            el.trigger(state);
            if (el.type === 'group') {
                for (var i = 0; i < el.childCount(); i++) {
                    elSetState(el.childAt(i), state);
                }
            }
        }
    }
    /**
     * @param  {module:echarts/data/List} data
     * @param  {Object} payload
     * @param  {string} state 'normal'|'emphasis'
     * @inner
     */
    function toggleHighlight(data, payload, state) {
        var dataIndex = modelUtil.queryDataIndex(data, payload);
        if (dataIndex != null) {
            zrUtil.each(modelUtil.normalizeToArray(dataIndex), function (dataIdx) {
                elSetState(data.getItemGraphicEl(dataIdx), state);
            });
        } else {
            data.eachItemGraphicEl(function (el) {
                elSetState(el, state);
            });
        }
    }
    // Enable Chart.extend.
    clazzUtil.enableClassExtend(Chart, ['dispose']);
    // Add capability of registerClass, getClass, hasClass, registerSubTypeDefaulter and so on.
    clazzUtil.enableClassManagement(Chart, { registerWhenExtend: true });
    return Chart;
});
define('echarts/util/graphic', ['require', 'zrender/core/util', 'zrender/tool/path', 'zrender/graphic/Path', 'zrender/tool/color', 'zrender/core/matrix', 'zrender/core/vector', 'zrender/container/Group', 'zrender/graphic/Image', 'zrender/graphic/Text', 'zrender/graphic/shape/Circle', 'zrender/graphic/shape/Sector', 'zrender/graphic/shape/Ring', 'zrender/graphic/shape/Polygon', 'zrender/graphic/shape/Polyline', 'zrender/graphic/shape/Rect', 'zrender/graphic/shape/Line', 'zrender/graphic/shape/BezierCurve', 'zrender/graphic/shape/Arc', 'zrender/graphic/CompoundPath', 'zrender/graphic/LinearGradient', 'zrender/graphic/RadialGradient', 'zrender/core/BoundingRect'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var pathTool = require('zrender/tool/path');
    var round = Math.round;
    var Path = require('zrender/graphic/Path');
    var colorTool = require('zrender/tool/color');
    var matrix = require('zrender/core/matrix');
    var vector = require('zrender/core/vector');
    var graphic = {};
    graphic.Group = require('zrender/container/Group');
    graphic.Image = require('zrender/graphic/Image');
    graphic.Text = require('zrender/graphic/Text');
    graphic.Circle = require('zrender/graphic/shape/Circle');
    graphic.Sector = require('zrender/graphic/shape/Sector');
    graphic.Ring = require('zrender/graphic/shape/Ring');
    graphic.Polygon = require('zrender/graphic/shape/Polygon');
    graphic.Polyline = require('zrender/graphic/shape/Polyline');
    graphic.Rect = require('zrender/graphic/shape/Rect');
    graphic.Line = require('zrender/graphic/shape/Line');
    graphic.BezierCurve = require('zrender/graphic/shape/BezierCurve');
    graphic.Arc = require('zrender/graphic/shape/Arc');
    graphic.CompoundPath = require('zrender/graphic/CompoundPath');
    graphic.LinearGradient = require('zrender/graphic/LinearGradient');
    graphic.RadialGradient = require('zrender/graphic/RadialGradient');
    graphic.BoundingRect = require('zrender/core/BoundingRect');
    /**
     * Extend shape with parameters
     */
    graphic.extendShape = function (opts) {
        return Path.extend(opts);
    };
    /**
     * Extend path
     */
    graphic.extendPath = function (pathData, opts) {
        return pathTool.extendFromString(pathData, opts);
    };
    /**
     * Create a path element from path data string
     * @param {string} pathData
     * @param {Object} opts
     * @param {module:zrender/core/BoundingRect} rect
     * @param {string} [layout=cover] 'center' or 'cover'
     */
    graphic.makePath = function (pathData, opts, rect, layout) {
        var path = pathTool.createFromString(pathData, opts);
        var boundingRect = path.getBoundingRect();
        if (rect) {
            var aspect = boundingRect.width / boundingRect.height;
            if (layout === 'center') {
                // Set rect to center, keep width / height ratio.
                var width = rect.height * aspect;
                var height;
                if (width <= rect.width) {
                    height = rect.height;
                } else {
                    width = rect.width;
                    height = width / aspect;
                }
                var cx = rect.x + rect.width / 2;
                var cy = rect.y + rect.height / 2;
                rect.x = cx - width / 2;
                rect.y = cy - height / 2;
                rect.width = width;
                rect.height = height;
            }
            graphic.resizePath(path, rect);
        }
        return path;
    };
    graphic.mergePath = pathTool.mergePath, graphic.resizePath = function (path, rect) {
        if (!path.applyTransform) {
            return;
        }
        var pathRect = path.getBoundingRect();
        var m = pathRect.calculateTransform(rect);
        path.applyTransform(m);
    };
    /**
     * Sub pixel optimize line for canvas
     *
     * @param {Object} param
     * @param {Object} [param.shape]
     * @param {number} [param.shape.x1]
     * @param {number} [param.shape.y1]
     * @param {number} [param.shape.x2]
     * @param {number} [param.shape.y2]
     * @param {Object} [param.style]
     * @param {number} [param.style.lineWidth]
     * @return {Object} Modified param
     */
    graphic.subPixelOptimizeLine = function (param) {
        var subPixelOptimize = graphic.subPixelOptimize;
        var shape = param.shape;
        var lineWidth = param.style.lineWidth;
        if (round(shape.x1 * 2) === round(shape.x2 * 2)) {
            shape.x1 = shape.x2 = subPixelOptimize(shape.x1, lineWidth, true);
        }
        if (round(shape.y1 * 2) === round(shape.y2 * 2)) {
            shape.y1 = shape.y2 = subPixelOptimize(shape.y1, lineWidth, true);
        }
        return param;
    };
    /**
     * Sub pixel optimize rect for canvas
     *
     * @param {Object} param
     * @param {Object} [param.shape]
     * @param {number} [param.shape.x]
     * @param {number} [param.shape.y]
     * @param {number} [param.shape.width]
     * @param {number} [param.shape.height]
     * @param {Object} [param.style]
     * @param {number} [param.style.lineWidth]
     * @return {Object} Modified param
     */
    graphic.subPixelOptimizeRect = function (param) {
        var subPixelOptimize = graphic.subPixelOptimize;
        var shape = param.shape;
        var lineWidth = param.style.lineWidth;
        var originX = shape.x;
        var originY = shape.y;
        var originWidth = shape.width;
        var originHeight = shape.height;
        shape.x = subPixelOptimize(shape.x, lineWidth, true);
        shape.y = subPixelOptimize(shape.y, lineWidth, true);
        shape.width = Math.max(subPixelOptimize(originX + originWidth, lineWidth, false) - shape.x, originWidth === 0 ? 0 : 1);
        shape.height = Math.max(subPixelOptimize(originY + originHeight, lineWidth, false) - shape.y, originHeight === 0 ? 0 : 1);
        return param;
    };
    /**
     * Sub pixel optimize for canvas
     *
     * @param {number} position Coordinate, such as x, y
     * @param {number} lineWidth Should be nonnegative integer.
     * @param {boolean=} positiveOrNegative Default false (negative).
     * @return {number} Optimized position.
     */
    graphic.subPixelOptimize = function (position, lineWidth, positiveOrNegative) {
        // Assure that (position + lineWidth / 2) is near integer edge,
        // otherwise line will be fuzzy in canvas.
        var doubledPosition = round(position * 2);
        return (doubledPosition + round(lineWidth)) % 2 === 0 ? doubledPosition / 2 : (doubledPosition + (positiveOrNegative ? 1 : -1)) / 2;
    };
    function hasFillOrStroke(fillOrStroke) {
        return fillOrStroke != null && fillOrStroke != 'none';
    }
    function liftColor(color) {
        return typeof color === 'string' ? colorTool.lift(color, -0.1) : color;
    }
    /**
     * @private
     */
    function cacheElementStl(el) {
        if (el.__hoverStlDirty) {
            var stroke = el.style.stroke;
            var fill = el.style.fill;
            // Create hoverStyle on mouseover
            var hoverStyle = el.__hoverStl;
            hoverStyle.fill = hoverStyle.fill || (hasFillOrStroke(fill) ? liftColor(fill) : null);
            hoverStyle.stroke = hoverStyle.stroke || (hasFillOrStroke(stroke) ? liftColor(stroke) : null);
            var normalStyle = {};
            for (var name in hoverStyle) {
                if (hoverStyle.hasOwnProperty(name)) {
                    normalStyle[name] = el.style[name];
                }
            }
            el.__normalStl = normalStyle;
            el.__hoverStlDirty = false;
        }
    }
    /**
     * @private
     */
    function doSingleEnterHover(el) {
        if (el.__isHover) {
            return;
        }
        cacheElementStl(el);
        if (el.useHoverLayer) {
            el.__zr && el.__zr.addHover(el, el.__hoverStl);
        } else {
            el.setStyle(el.__hoverStl);
            el.z2 += 1;
        }
        el.__isHover = true;
    }
    /**
     * @inner
     */
    function doSingleLeaveHover(el) {
        if (!el.__isHover) {
            return;
        }
        var normalStl = el.__normalStl;
        if (el.useHoverLayer) {
            el.__zr && el.__zr.removeHover(el);
        } else {
            normalStl && el.setStyle(normalStl);
            el.z2 -= 1;
        }
        el.__isHover = false;
    }
    /**
     * @inner
     */
    function doEnterHover(el) {
        el.type === 'group' ? el.traverse(function (child) {
            if (child.type !== 'group') {
                doSingleEnterHover(child);
            }
        }) : doSingleEnterHover(el);
    }
    function doLeaveHover(el) {
        el.type === 'group' ? el.traverse(function (child) {
            if (child.type !== 'group') {
                doSingleLeaveHover(child);
            }
        }) : doSingleLeaveHover(el);
    }
    /**
     * @inner
     */
    function setElementHoverStl(el, hoverStl) {
        // If element has sepcified hoverStyle, then use it instead of given hoverStyle
        // Often used when item group has a label element and it's hoverStyle is different
        el.__hoverStl = el.hoverStyle || hoverStl || {};
        el.__hoverStlDirty = true;
        if (el.__isHover) {
            cacheElementStl(el);
        }
    }
    /**
     * @inner
     */
    function onElementMouseOver(e) {
        if (this.__hoverSilentOnTouch && e.zrByTouch) {
            return;
        }
        // Only if element is not in emphasis status
        !this.__isEmphasis && doEnterHover(this);
    }
    /**
     * @inner
     */
    function onElementMouseOut(e) {
        if (this.__hoverSilentOnTouch && e.zrByTouch) {
            return;
        }
        // Only if element is not in emphasis status
        !this.__isEmphasis && doLeaveHover(this);
    }
    /**
     * @inner
     */
    function enterEmphasis() {
        this.__isEmphasis = true;
        doEnterHover(this);
    }
    /**
     * @inner
     */
    function leaveEmphasis() {
        this.__isEmphasis = false;
        doLeaveHover(this);
    }
    /**
     * Set hover style of element
     * @param {module:zrender/Element} el
     * @param {Object} [hoverStyle]
     * @param {Object} [opt]
     * @param {boolean} [opt.hoverSilentOnTouch=false]
     *        In touch device, mouseover event will be trigger on touchstart event
     *        (see module:zrender/dom/HandlerProxy). By this mechanism, we can
     *        conviniently use hoverStyle when tap on touch screen without additional
     *        code for compatibility.
     *        But if the chart/component has select feature, which usually also use
     *        hoverStyle, there might be conflict between 'select-highlight' and
     *        'hover-highlight' especially when roam is enabled (see geo for example).
     *        In this case, hoverSilentOnTouch should be used to disable hover-highlight
     *        on touch device.
     */
    graphic.setHoverStyle = function (el, hoverStyle, opt) {
        el.__hoverSilentOnTouch = opt && opt.hoverSilentOnTouch;
        el.type === 'group' ? el.traverse(function (child) {
            if (child.type !== 'group') {
                setElementHoverStl(child, hoverStyle);
            }
        }) : setElementHoverStl(el, hoverStyle);
        // Duplicated function will be auto-ignored, see Eventful.js.
        el.on('mouseover', onElementMouseOver).on('mouseout', onElementMouseOut);
        // Emphasis, normal can be triggered manually
        el.on('emphasis', enterEmphasis).on('normal', leaveEmphasis);
    };
    /**
     * Set text option in the style
     * @param {Object} textStyle
     * @param {module:echarts/model/Model} labelModel
     * @param {string} color
     */
    graphic.setText = function (textStyle, labelModel, color) {
        var labelPosition = labelModel.getShallow('position') || 'inside';
        var labelOffset = labelModel.getShallow('offset');
        var labelColor = labelPosition.indexOf('inside') >= 0 ? 'white' : color;
        var textStyleModel = labelModel.getModel('textStyle');
        zrUtil.extend(textStyle, {
            textDistance: labelModel.getShallow('distance') || 5,
            textFont: textStyleModel.getFont(),
            textPosition: labelPosition,
            textOffset: labelOffset,
            textFill: textStyleModel.getTextColor() || labelColor
        });
    };
    function animateOrSetProps(isUpdate, el, props, animatableModel, dataIndex, cb) {
        if (typeof dataIndex === 'function') {
            cb = dataIndex;
            dataIndex = null;
        }
        // Do not check 'animation' property directly here. Consider this case:
        // animation model is an `itemModel`, whose does not have `isAnimationEnabled`
        // but its parent model (`seriesModel`) does.
        var animationEnabled = animatableModel && animatableModel.isAnimationEnabled();
        if (animationEnabled) {
            var postfix = isUpdate ? 'Update' : '';
            var duration = animatableModel.getShallow('animationDuration' + postfix);
            var animationEasing = animatableModel.getShallow('animationEasing' + postfix);
            var animationDelay = animatableModel.getShallow('animationDelay' + postfix);
            if (typeof animationDelay === 'function') {
                animationDelay = animationDelay(dataIndex, animatableModel.getAnimationDelayParams ? animatableModel.getAnimationDelayParams(el, dataIndex) : null);
            }
            if (typeof duration === 'function') {
                duration = duration(dataIndex);
            }
            duration > 0 ? el.animateTo(props, duration, animationDelay || 0, animationEasing, cb) : (el.attr(props), cb && cb());
        } else {
            el.attr(props);
            cb && cb();
        }
    }
    /**
     * Update graphic element properties with or without animation according to the configuration in series
     * @param {module:zrender/Element} el
     * @param {Object} props
     * @param {module:echarts/model/Model} [animatableModel]
     * @param {number} [dataIndex]
     * @param {Function} [cb]
     * @example
     *     graphic.updateProps(el, {
     *         position: [100, 100]
     *     }, seriesModel, dataIndex, function () { console.log('Animation done!'); });
     *     // Or
     *     graphic.updateProps(el, {
     *         position: [100, 100]
     *     }, seriesModel, function () { console.log('Animation done!'); });
     */
    graphic.updateProps = function (el, props, animatableModel, dataIndex, cb) {
        animateOrSetProps(true, el, props, animatableModel, dataIndex, cb);
    };
    /**
     * Init graphic element properties with or without animation according to the configuration in series
     * @param {module:zrender/Element} el
     * @param {Object} props
     * @param {module:echarts/model/Model} [animatableModel]
     * @param {number} [dataIndex]
     * @param {Function} cb
     */
    graphic.initProps = function (el, props, animatableModel, dataIndex, cb) {
        animateOrSetProps(false, el, props, animatableModel, dataIndex, cb);
    };
    /**
     * Get transform matrix of target (param target),
     * in coordinate of its ancestor (param ancestor)
     *
     * @param {module:zrender/mixin/Transformable} target
     * @param {module:zrender/mixin/Transformable} [ancestor]
     */
    graphic.getTransform = function (target, ancestor) {
        var mat = matrix.identity([]);
        while (target && target !== ancestor) {
            matrix.mul(mat, target.getLocalTransform(), mat);
            target = target.parent;
        }
        return mat;
    };
    /**
     * Apply transform to an vertex.
     * @param {Array.<number>} vertex [x, y]
     * @param {Array.<number>} transform Transform matrix: like [1, 0, 0, 1, 0, 0]
     * @param {boolean=} invert Whether use invert matrix.
     * @return {Array.<number>} [x, y]
     */
    graphic.applyTransform = function (vertex, transform, invert) {
        if (invert) {
            transform = matrix.invert([], transform);
        }
        return vector.applyTransform([], vertex, transform);
    };
    /**
     * @param {string} direction 'left' 'right' 'top' 'bottom'
     * @param {Array.<number>} transform Transform matrix: like [1, 0, 0, 1, 0, 0]
     * @param {boolean=} invert Whether use invert matrix.
     * @return {string} Transformed direction. 'left' 'right' 'top' 'bottom'
     */
    graphic.transformDirection = function (direction, transform, invert) {
        // Pick a base, ensure that transform result will not be (0, 0).
        var hBase = transform[4] === 0 || transform[5] === 0 || transform[0] === 0 ? 1 : Math.abs(2 * transform[4] / transform[0]);
        var vBase = transform[4] === 0 || transform[5] === 0 || transform[2] === 0 ? 1 : Math.abs(2 * transform[4] / transform[2]);
        var vertex = [
                direction === 'left' ? -hBase : direction === 'right' ? hBase : 0,
                direction === 'top' ? -vBase : direction === 'bottom' ? vBase : 0
            ];
        vertex = graphic.applyTransform(vertex, transform, invert);
        return Math.abs(vertex[0]) > Math.abs(vertex[1]) ? vertex[0] > 0 ? 'right' : 'left' : vertex[1] > 0 ? 'bottom' : 'top';
    };
    /**
     * Apply group transition animation from g1 to g2
     */
    graphic.groupTransition = function (g1, g2, animatableModel, cb) {
        if (!g1 || !g2) {
            return;
        }
        function getElMap(g) {
            var elMap = {};
            g.traverse(function (el) {
                if (!el.isGroup && el.anid) {
                    elMap[el.anid] = el;
                }
            });
            return elMap;
        }
        function getAnimatableProps(el) {
            var obj = {
                    position: vector.clone(el.position),
                    rotation: el.rotation
                };
            if (el.shape) {
                obj.shape = zrUtil.extend({}, el.shape);
            }
            return obj;
        }
        var elMap1 = getElMap(g1);
        g2.traverse(function (el) {
            if (!el.isGroup && el.anid) {
                var oldEl = elMap1[el.anid];
                if (oldEl) {
                    var newProp = getAnimatableProps(el);
                    el.attr(getAnimatableProps(oldEl));
                    graphic.updateProps(el, newProp, animatableModel, el.dataIndex);
                }    // else {
                     //     if (el.previousProps) {
                     //         graphic.updateProps
                     //     }
                     // }
            }
        });
    };
    return graphic;
});
define('echarts/util/model', ['require', './format', './number', '../model/Model', 'zrender/core/util'], function (require) {
    var formatUtil = require('./format');
    var nubmerUtil = require('./number');
    var Model = require('../model/Model');
    var zrUtil = require('zrender/core/util');
    var each = zrUtil.each;
    var isObject = zrUtil.isObject;
    var modelUtil = {};
    /**
     * If value is not array, then translate it to array.
     * @param  {*} value
     * @return {Array} [value] or value
     */
    modelUtil.normalizeToArray = function (value) {
        return value instanceof Array ? value : value == null ? [] : [value];
    };
    /**
     * Sync default option between normal and emphasis like `position` and `show`
     * In case some one will write code like
     *     label: {
     *         normal: {
     *             show: false,
     *             position: 'outside',
     *             textStyle: {
     *                 fontSize: 18
     *             }
     *         },
     *         emphasis: {
     *             show: true
     *         }
     *     }
     * @param {Object} opt
     * @param {Array.<string>} subOpts
     */
    modelUtil.defaultEmphasis = function (opt, subOpts) {
        if (opt) {
            var emphasisOpt = opt.emphasis = opt.emphasis || {};
            var normalOpt = opt.normal = opt.normal || {};
            // Default emphasis option from normal
            each(subOpts, function (subOptName) {
                var val = zrUtil.retrieve(emphasisOpt[subOptName], normalOpt[subOptName]);
                if (val != null) {
                    emphasisOpt[subOptName] = val;
                }
            });
        }
    };
    modelUtil.LABEL_OPTIONS = [
        'position',
        'offset',
        'show',
        'textStyle',
        'distance',
        'formatter'
    ];
    /**
     * data could be [12, 2323, {value: 223}, [1221, 23], {value: [2, 23]}]
     * This helper method retieves value from data.
     * @param {string|number|Date|Array|Object} dataItem
     * @return {number|string|Date|Array.<number|string|Date>}
     */
    modelUtil.getDataItemValue = function (dataItem) {
        // Performance sensitive.
        return dataItem && (dataItem.value == null ? dataItem : dataItem.value);
    };
    /**
     * data could be [12, 2323, {value: 223}, [1221, 23], {value: [2, 23]}]
     * This helper method determine if dataItem has extra option besides value
     * @param {string|number|Date|Array|Object} dataItem
     */
    modelUtil.isDataItemOption = function (dataItem) {
        return isObject(dataItem) && !(dataItem instanceof Array);    // // markLine data can be array
                                                                      // && !(dataItem[0] && isObject(dataItem[0]) && !(dataItem[0] instanceof Array));
    };
    /**
     * This helper method convert value in data.
     * @param {string|number|Date} value
     * @param {Object|string} [dimInfo] If string (like 'x'), dimType defaults 'number'.
     */
    modelUtil.converDataValue = function (value, dimInfo) {
        // Performance sensitive.
        var dimType = dimInfo && dimInfo.type;
        if (dimType === 'ordinal') {
            return value;
        }
        if (dimType === 'time' && !isFinite(value) && value != null && value !== '-') {
            value = +nubmerUtil.parseDate(value);
        }
        // dimType defaults 'number'.
        // If dimType is not ordinal and value is null or undefined or NaN or '-',
        // parse to NaN.
        return value == null || value === '' ? NaN : +value;    // If string (like '-'), using '+' parse to NaN
    };
    /**
     * Create a model proxy to be used in tooltip for edge data, markLine data, markPoint data.
     * @param {module:echarts/data/List} data
     * @param {Object} opt
     * @param {string} [opt.seriesIndex]
     * @param {Object} [opt.name]
     * @param {Object} [opt.mainType]
     * @param {Object} [opt.subType]
     */
    modelUtil.createDataFormatModel = function (data, opt) {
        var model = new Model();
        zrUtil.mixin(model, modelUtil.dataFormatMixin);
        model.seriesIndex = opt.seriesIndex;
        model.name = opt.name || '';
        model.mainType = opt.mainType;
        model.subType = opt.subType;
        model.getData = function () {
            return data;
        };
        return model;
    };
    // PENDING A little ugly
    modelUtil.dataFormatMixin = {
        getDataParams: function (dataIndex, dataType) {
            var data = this.getData(dataType);
            var seriesIndex = this.seriesIndex;
            var seriesName = this.name;
            var rawValue = this.getRawValue(dataIndex, dataType);
            var rawDataIndex = data.getRawIndex(dataIndex);
            var name = data.getName(dataIndex, true);
            var itemOpt = data.getRawDataItem(dataIndex);
            return {
                componentType: this.mainType,
                componentSubType: this.subType,
                seriesType: this.mainType === 'series' ? this.subType : null,
                seriesIndex: seriesIndex,
                seriesName: seriesName,
                name: name,
                dataIndex: rawDataIndex,
                data: itemOpt,
                dataType: dataType,
                value: rawValue,
                color: data.getItemVisual(dataIndex, 'color'),
                $vars: [
                    'seriesName',
                    'name',
                    'value'
                ]
            };
        },
        getFormattedLabel: function (dataIndex, status, dataType, dimIndex) {
            status = status || 'normal';
            var data = this.getData(dataType);
            var itemModel = data.getItemModel(dataIndex);
            var params = this.getDataParams(dataIndex, dataType);
            if (dimIndex != null && params.value instanceof Array) {
                params.value = params.value[dimIndex];
            }
            var formatter = itemModel.get([
                    'label',
                    status,
                    'formatter'
                ]);
            if (typeof formatter === 'function') {
                params.status = status;
                return formatter(params);
            } else if (typeof formatter === 'string') {
                return formatUtil.formatTpl(formatter, params);
            }
        },
        getRawValue: function (idx, dataType) {
            var data = this.getData(dataType);
            var dataItem = data.getRawDataItem(idx);
            if (dataItem != null) {
                return isObject(dataItem) && !(dataItem instanceof Array) ? dataItem.value : dataItem;
            }
        },
        formatTooltip: zrUtil.noop
    };
    /**
     * Mapping to exists for merge.
     *
     * @public
     * @param {Array.<Object>|Array.<module:echarts/model/Component>} exists
     * @param {Object|Array.<Object>} newCptOptions
     * @return {Array.<Object>} Result, like [{exist: ..., option: ...}, {}],
     *                          index of which is the same as exists.
     */
    modelUtil.mappingToExists = function (exists, newCptOptions) {
        // Mapping by the order by original option (but not order of
        // new option) in merge mode. Because we should ensure
        // some specified index (like xAxisIndex) is consistent with
        // original option, which is easy to understand, espatially in
        // media query. And in most case, merge option is used to
        // update partial option but not be expected to change order.
        newCptOptions = (newCptOptions || []).slice();
        var result = zrUtil.map(exists || [], function (obj, index) {
                return { exist: obj };
            });
        // Mapping by id or name if specified.
        each(newCptOptions, function (cptOption, index) {
            if (!isObject(cptOption)) {
                return;
            }
            // id has highest priority.
            for (var i = 0; i < result.length; i++) {
                if (!result[i].option && cptOption.id != null && result[i].exist.id === cptOption.id + '') {
                    result[i].option = cptOption;
                    newCptOptions[index] = null;
                    return;
                }
            }
            for (var i = 0; i < result.length; i++) {
                var exist = result[i].exist;
                if (!result[i].option && (exist.id == null || cptOption.id == null) && cptOption.name != null && !modelUtil.isIdInner(cptOption) && !modelUtil.isIdInner(exist) && exist.name === cptOption.name + '') {
                    result[i].option = cptOption;
                    newCptOptions[index] = null;
                    return;
                }
            }
        });
        // Otherwise mapping by index.
        each(newCptOptions, function (cptOption, index) {
            if (!isObject(cptOption)) {
                return;
            }
            var i = 0;
            for (; i < result.length; i++) {
                var exist = result[i].exist;
                if (!result[i].option && !modelUtil.isIdInner(exist) && cptOption.id == null) {
                    result[i].option = cptOption;
                    break;
                }
            }
            if (i >= result.length) {
                result.push({ option: cptOption });
            }
        });
        return result;
    };
    /**
     * Make id and name for mapping result (result of mappingToExists)
     * into `keyInfo` field.
     *
     * @public
     * @param {Array.<Object>} Result, like [{exist: ..., option: ...}, {}],
     *                          which order is the same as exists.
     * @return {Array.<Object>} The input.
     */
    modelUtil.makeIdAndName = function (mapResult) {
        // We use this id to hash component models and view instances
        // in echarts. id can be specified by user, or auto generated.
        // The id generation rule ensures new view instance are able
        // to mapped to old instance when setOption are called in
        // no-merge mode. So we generate model id by name and plus
        // type in view id.
        // name can be duplicated among components, which is convenient
        // to specify multi components (like series) by one name.
        // Ensure that each id is distinct.
        var idMap = {};
        each(mapResult, function (item, index) {
            var existCpt = item.exist;
            existCpt && (idMap[existCpt.id] = item);
        });
        each(mapResult, function (item, index) {
            var opt = item.option;
            zrUtil.assert(!opt || opt.id == null || !idMap[opt.id] || idMap[opt.id] === item, 'id duplicates: ' + (opt && opt.id));
            opt && opt.id != null && (idMap[opt.id] = item);
            !item.keyInfo && (item.keyInfo = {});
        });
        // Make name and id.
        each(mapResult, function (item, index) {
            var existCpt = item.exist;
            var opt = item.option;
            var keyInfo = item.keyInfo;
            if (!isObject(opt)) {
                return;
            }
            // name can be overwitten. Consider case: axis.name = '20km'.
            // But id generated by name will not be changed, which affect
            // only in that case: setOption with 'not merge mode' and view
            // instance will be recreated, which can be accepted.
            keyInfo.name = opt.name != null ? opt.name + '' : existCpt ? existCpt.name : ' -';
            if (existCpt) {
                keyInfo.id = existCpt.id;
            } else if (opt.id != null) {
                keyInfo.id = opt.id + '';
            } else {
                // Consider this situatoin:
                //  optionA: [{name: 'a'}, {name: 'a'}, {..}]
                //  optionB [{..}, {name: 'a'}, {name: 'a'}]
                // Series with the same name between optionA and optionB
                // should be mapped.
                var idNum = 0;
                do {
                    keyInfo.id = ' ' + keyInfo.name + ' ' + idNum++;
                } while (idMap[keyInfo.id]);
            }
            idMap[keyInfo.id] = item;
        });
    };
    /**
     * @public
     * @param {Object} cptOption
     * @return {boolean}
     */
    modelUtil.isIdInner = function (cptOption) {
        return isObject(cptOption) && cptOption.id && (cptOption.id + '').indexOf(' _ec_ ') === 0;
    };
    /**
     * A helper for removing duplicate items between batchA and batchB,
     * and in themselves, and categorize by series.
     *
     * @param {Array.<Object>} batchA Like: [{seriesId: 2, dataIndex: [32, 4, 5]}, ...]
     * @param {Array.<Object>} batchB Like: [{seriesId: 2, dataIndex: [32, 4, 5]}, ...]
     * @return {Array.<Array.<Object>, Array.<Object>>} result: [resultBatchA, resultBatchB]
     */
    modelUtil.compressBatches = function (batchA, batchB) {
        var mapA = {};
        var mapB = {};
        makeMap(batchA || [], mapA);
        makeMap(batchB || [], mapB, mapA);
        return [
            mapToArray(mapA),
            mapToArray(mapB)
        ];
        function makeMap(sourceBatch, map, otherMap) {
            for (var i = 0, len = sourceBatch.length; i < len; i++) {
                var seriesId = sourceBatch[i].seriesId;
                var dataIndices = modelUtil.normalizeToArray(sourceBatch[i].dataIndex);
                var otherDataIndices = otherMap && otherMap[seriesId];
                for (var j = 0, lenj = dataIndices.length; j < lenj; j++) {
                    var dataIndex = dataIndices[j];
                    if (otherDataIndices && otherDataIndices[dataIndex]) {
                        otherDataIndices[dataIndex] = null;
                    } else {
                        (map[seriesId] || (map[seriesId] = {}))[dataIndex] = 1;
                    }
                }
            }
        }
        function mapToArray(map, isData) {
            var result = [];
            for (var i in map) {
                if (map.hasOwnProperty(i) && map[i] != null) {
                    if (isData) {
                        result.push(+i);
                    } else {
                        var dataIndices = mapToArray(map[i], true);
                        dataIndices.length && result.push({
                            seriesId: i,
                            dataIndex: dataIndices
                        });
                    }
                }
            }
            return result;
        }
    };
    /**
     * @param {module:echarts/data/List} data
     * @param {Object} payload Contains dataIndex (means rawIndex) / dataIndexInside / name
     *                         each of which can be Array or primary type.
     * @return {number|Array.<number>} dataIndex If not found, return undefined/null.
     */
    modelUtil.queryDataIndex = function (data, payload) {
        if (payload.dataIndexInside != null) {
            return payload.dataIndexInside;
        } else if (payload.dataIndex != null) {
            return zrUtil.isArray(payload.dataIndex) ? zrUtil.map(payload.dataIndex, function (value) {
                return data.indexOfRawIndex(value);
            }) : data.indexOfRawIndex(payload.dataIndex);
        } else if (payload.name != null) {
            return zrUtil.isArray(payload.name) ? zrUtil.map(payload.name, function (value) {
                return data.indexOfName(value);
            }) : data.indexOfName(payload.name);
        }
    };
    /**
     * @param {module:echarts/model/Global} ecModel
     * @param {string|Object} finder
     *        If string, e.g., 'geo', means {geoIndex: 0}.
     *        If Object, could contain some of these properties below:
     *        {
     *            seriesIndex, seriesId, seriesName,
     *            geoIndex, geoId, goeName,
     *            bmapIndex, bmapId, bmapName,
     *            xAxisIndex, xAxisId, xAxisName,
     *            yAxisIndex, yAxisId, yAxisName,
     *            gridIndex, gridId, gridName,
     *            ... (can be extended)
     *        }
     *        Each properties can be number|string|Array.<number>|Array.<string>
     *        For example, a finder could be
     *        {
     *            seriesIndex: 3,
     *            geoId: ['aa', 'cc'],
     *            gridName: ['xx', 'rr']
     *        }
     * @param {Object} [opt]
     * @param {string} [opt.defaultMainType]
     * @return {Object} result like:
     *        {
     *            seriesModels: [seriesModel1, seriesModel2],
     *            seriesModel: seriesModel1, // The first model
     *            geoModels: [geoModel1, geoModel2],
     *            geoModel: geoModel1, // The first model
     *            ...
     *        }
     */
    modelUtil.parseFinder = function (ecModel, finder, opt) {
        if (zrUtil.isString(finder)) {
            var obj = {};
            obj[finder + 'Index'] = 0;
            finder = obj;
        }
        var defaultMainType = opt && opt.defaultMainType;
        if (defaultMainType && !has(finder, defaultMainType + 'Index') && !has(finder, defaultMainType + 'Id') && !has(finder, defaultMainType + 'Name')) {
            finder[defaultMainType + 'Index'] = 0;
        }
        var result = {};
        each(finder, function (value, key) {
            var value = finder[key];
            // Exclude 'dataIndex' and other illgal keys.
            if (key === 'dataIndex' || key === 'dataIndexInside') {
                result[key] = value;
                return;
            }
            var parsedKey = key.match(/^(\w+)(Index|Id|Name)$/) || [];
            var mainType = parsedKey[1];
            var queryType = parsedKey[2];
            if (!mainType || !queryType) {
                return;
            }
            var queryParam = { mainType: mainType };
            queryParam[queryType.toLowerCase()] = value;
            var models = ecModel.queryComponents(queryParam);
            result[mainType + 'Models'] = models;
            result[mainType + 'Model'] = models[0];
        });
        return result;
    };
    function has(obj, prop) {
        return obj && obj.hasOwnProperty(prop);
    }
    return modelUtil;
});
define('echarts/util/throttle', [], function () {
    var lib = {};
    var ORIGIN_METHOD = ' __throttleOriginMethod';
    var RATE = ' __throttleRate';
    var THROTTLE_TYPE = ' __throttleType';
    /**
     * @public
     * @param {(Function)} fn
     * @param {number} [delay=0] Unit: ms.
     * @param {boolean} [debounce=false]
     *        true: If call interval less than `delay`, only the last call works.
     *        false: If call interval less than `delay, call works on fixed rate.
     * @return {(Function)} throttled fn.
     */
    lib.throttle = function (fn, delay, debounce) {
        var currCall;
        var lastCall = 0;
        var lastExec = 0;
        var timer = null;
        var diff;
        var scope;
        var args;
        delay = delay || 0;
        function exec() {
            lastExec = new Date().getTime();
            timer = null;
            fn.apply(scope, args || []);
        }
        var cb = function () {
            currCall = new Date().getTime();
            scope = this;
            args = arguments;
            diff = currCall - (debounce ? lastCall : lastExec) - delay;
            clearTimeout(timer);
            if (debounce) {
                timer = setTimeout(exec, delay);
            } else {
                if (diff >= 0) {
                    exec();
                } else {
                    timer = setTimeout(exec, -diff);
                }
            }
            lastCall = currCall;
        };
        /**
         * Clear throttle.
         * @public
         */
        cb.clear = function () {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        };
        return cb;
    };
    /**
     * Create throttle method or update throttle rate.
     *
     * @example
     * ComponentView.prototype.render = function () {
     *     ...
     *     throttle.createOrUpdate(
     *         this,
     *         '_dispatchAction',
     *         this.model.get('throttle'),
     *         'fixRate'
     *     );
     * };
     * ComponentView.prototype.remove = function () {
     *     throttle.clear(this, '_dispatchAction');
     * };
     * ComponentView.prototype.dispose = function () {
     *     throttle.clear(this, '_dispatchAction');
     * };
     *
     * @public
     * @param {Object} obj
     * @param {string} fnAttr
     * @param {number} [rate]
     * @param {string} [throttleType='fixRate'] 'fixRate' or 'debounce'
     * @return {Function} throttled function.
     */
    lib.createOrUpdate = function (obj, fnAttr, rate, throttleType) {
        var fn = obj[fnAttr];
        if (!fn) {
            return;
        }
        var originFn = fn[ORIGIN_METHOD] || fn;
        var lastThrottleType = fn[THROTTLE_TYPE];
        var lastRate = fn[RATE];
        if (lastRate !== rate || lastThrottleType !== throttleType) {
            if (rate == null || !throttleType) {
                return obj[fnAttr] = originFn;
            }
            fn = obj[fnAttr] = lib.throttle(originFn, rate, throttleType === 'debounce');
            fn[ORIGIN_METHOD] = originFn;
            fn[THROTTLE_TYPE] = throttleType;
            fn[RATE] = rate;
        }
        return fn;
    };
    /**
     * Clear throttle. Example see throttle.createOrUpdate.
     *
     * @public
     * @param {Object} obj
     * @param {string} fnAttr
     */
    lib.clear = function (obj, fnAttr) {
        var fn = obj[fnAttr];
        if (fn && fn[ORIGIN_METHOD]) {
            obj[fnAttr] = fn[ORIGIN_METHOD];
        }
    };
    return lib;
});
define('zrender/zrender', ['require', './core/guid', './core/env', './core/util', './Handler', './Storage', './animation/Animation', './dom/HandlerProxy', './Painter'], function (require) {
    var guid = require('./core/guid');
    var env = require('./core/env');
    var zrUtil = require('./core/util');
    var Handler = require('./Handler');
    var Storage = require('./Storage');
    var Animation = require('./animation/Animation');
    var HandlerProxy = require('./dom/HandlerProxy');
    var useVML = !env.canvasSupported;
    var painterCtors = { canvas: require('./Painter') };
    var instances = {};
    // ZRender实例map索引
    var zrender = {};
    /**
     * @type {string}
     */
    zrender.version = '3.3.0';
    /**
     * Initializing a zrender instance
     * @param {HTMLElement} dom
     * @param {Object} opts
     * @param {string} [opts.renderer='canvas'] 'canvas' or 'svg'
     * @param {number} [opts.devicePixelRatio]
     * @param {number|string} [opts.width] Can be 'auto' (the same as null/undefined)
     * @param {number|string} [opts.height] Can be 'auto' (the same as null/undefined)
     * @return {module:zrender/ZRender}
     */
    zrender.init = function (dom, opts) {
        var zr = new ZRender(guid(), dom, opts);
        instances[zr.id] = zr;
        return zr;
    };
    /**
     * Dispose zrender instance
     * @param {module:zrender/ZRender} zr
     */
    zrender.dispose = function (zr) {
        if (zr) {
            zr.dispose();
        } else {
            for (var key in instances) {
                if (instances.hasOwnProperty(key)) {
                    instances[key].dispose();
                }
            }
            instances = {};
        }
        return zrender;
    };
    /**
     * Get zrender instance by id
     * @param {string} id zrender instance id
     * @return {module:zrender/ZRender}
     */
    zrender.getInstance = function (id) {
        return instances[id];
    };
    zrender.registerPainter = function (name, Ctor) {
        painterCtors[name] = Ctor;
    };
    function delInstance(id) {
        delete instances[id];
    }
    /**
     * @module zrender/ZRender
     */
    /**
     * @constructor
     * @alias module:zrender/ZRender
     * @param {string} id
     * @param {HTMLDomElement} dom
     * @param {Object} opts
     * @param {string} [opts.renderer='canvas'] 'canvas' or 'svg'
     * @param {number} [opts.devicePixelRatio]
     * @param {number} [opts.width] Can be 'auto' (the same as null/undefined)
     * @param {number} [opts.height] Can be 'auto' (the same as null/undefined)
     */
    var ZRender = function (id, dom, opts) {
        opts = opts || {};
        /**
         * @type {HTMLDomElement}
         */
        this.dom = dom;
        /**
         * @type {string}
         */
        this.id = id;
        var self = this;
        var storage = new Storage();
        var rendererType = opts.renderer;
        if (useVML) {
            if (!painterCtors.vml) {
                throw new Error('You need to require \'zrender/vml/vml\' to support IE8');
            }
            rendererType = 'vml';
        } else if (!rendererType || !painterCtors[rendererType]) {
            rendererType = 'canvas';
        }
        var painter = new painterCtors[rendererType](dom, storage, opts);
        this.storage = storage;
        this.painter = painter;
        var handerProxy = !env.node ? new HandlerProxy(painter.getViewportRoot()) : null;
        this.handler = new Handler(storage, painter, handerProxy, painter.root);
        /**
         * @type {module:zrender/animation/Animation}
         */
        this.animation = new Animation({ stage: { update: zrUtil.bind(this.flush, this) } });
        this.animation.start();
        /**
         * @type {boolean}
         * @private
         */
        this._needsRefresh;
        // 修改 storage.delFromMap, 每次删除元素之前删除动画
        // FIXME 有点ugly
        var oldDelFromMap = storage.delFromMap;
        var oldAddToMap = storage.addToMap;
        storage.delFromMap = function (elId) {
            var el = storage.get(elId);
            oldDelFromMap.call(storage, elId);
            el && el.removeSelfFromZr(self);
        };
        storage.addToMap = function (el) {
            oldAddToMap.call(storage, el);
            el.addSelfToZr(self);
        };
    };
    ZRender.prototype = {
        constructor: ZRender,
        getId: function () {
            return this.id;
        },
        add: function (el) {
            this.storage.addRoot(el);
            this._needsRefresh = true;
        },
        remove: function (el) {
            this.storage.delRoot(el);
            this._needsRefresh = true;
        },
        configLayer: function (zLevel, config) {
            this.painter.configLayer(zLevel, config);
            this._needsRefresh = true;
        },
        refreshImmediately: function () {
            // Clear needsRefresh ahead to avoid something wrong happens in refresh
            // Or it will cause zrender refreshes again and again.
            this._needsRefresh = false;
            this.painter.refresh();
            /**
             * Avoid trigger zr.refresh in Element#beforeUpdate hook
             */
            this._needsRefresh = false;
        },
        refresh: function () {
            this._needsRefresh = true;
        },
        flush: function () {
            if (this._needsRefresh) {
                this.refreshImmediately();
            }
            if (this._needsRefreshHover) {
                this.refreshHoverImmediately();
            }
        },
        addHover: function (el, style) {
            if (this.painter.addHover) {
                this.painter.addHover(el, style);
                this.refreshHover();
            }
        },
        removeHover: function (el) {
            if (this.painter.removeHover) {
                this.painter.removeHover(el);
                this.refreshHover();
            }
        },
        clearHover: function () {
            if (this.painter.clearHover) {
                this.painter.clearHover();
                this.refreshHover();
            }
        },
        refreshHover: function () {
            this._needsRefreshHover = true;
        },
        refreshHoverImmediately: function () {
            this._needsRefreshHover = false;
            this.painter.refreshHover && this.painter.refreshHover();
        },
        resize: function (opts) {
            opts = opts || {};
            this.painter.resize(opts.width, opts.height);
            this.handler.resize();
        },
        clearAnimation: function () {
            this.animation.clear();
        },
        getWidth: function () {
            return this.painter.getWidth();
        },
        getHeight: function () {
            return this.painter.getHeight();
        },
        pathToImage: function (e, width, height) {
            var id = guid();
            return this.painter.pathToImage(id, e, width, height);
        },
        setCursorStyle: function (cursorStyle) {
            this.handler.setCursorStyle(cursorStyle);
        },
        on: function (eventName, eventHandler, context) {
            this.handler.on(eventName, eventHandler, context);
        },
        off: function (eventName, eventHandler) {
            this.handler.off(eventName, eventHandler);
        },
        trigger: function (eventName, event) {
            this.handler.trigger(eventName, event);
        },
        clear: function () {
            this.storage.delRoot();
            this.painter.clear();
        },
        dispose: function () {
            this.animation.stop();
            this.clear();
            this.storage.dispose();
            this.painter.dispose();
            this.handler.dispose();
            this.animation = this.storage = this.painter = this.handler = null;
            delInstance(this.id);
        }
    };
    return zrender;
});
define('zrender/core/util', ['require'], function (require) {
    // 用于处理merge时无法遍历Date等对象的问题
    var BUILTIN_OBJECT = {
            '[object Function]': 1,
            '[object RegExp]': 1,
            '[object Date]': 1,
            '[object Error]': 1,
            '[object CanvasGradient]': 1,
            '[object CanvasPattern]': 1,
            '[object Image]': 1,
            '[object Canvas]': 1
        };
    var TYPED_ARRAY = {
            '[object Int8Array]': 1,
            '[object Uint8Array]': 1,
            '[object Uint8ClampedArray]': 1,
            '[object Int16Array]': 1,
            '[object Uint16Array]': 1,
            '[object Int32Array]': 1,
            '[object Uint32Array]': 1,
            '[object Float32Array]': 1,
            '[object Float64Array]': 1
        };
    var objToString = Object.prototype.toString;
    var arrayProto = Array.prototype;
    var nativeForEach = arrayProto.forEach;
    var nativeFilter = arrayProto.filter;
    var nativeSlice = arrayProto.slice;
    var nativeMap = arrayProto.map;
    var nativeReduce = arrayProto.reduce;
    /**
     * Those data types can be cloned:
     *     Plain object, Array, TypedArray, number, string, null, undefined.
     * Those data types will be assgined using the orginal data:
     *     BUILTIN_OBJECT
     * Instance of user defined class will be cloned to a plain object, without
     * properties in prototype.
     * Other data types is not supported (not sure what will happen).
     *
     * Caution: do not support clone Date, for performance consideration.
     * (There might be a large number of date in `series.data`).
     * So date should not be modified in and out of echarts.
     *
     * @param {*} source
     * @return {*} new
     */
    function clone(source) {
        if (source == null || typeof source != 'object') {
            return source;
        }
        var result = source;
        var typeStr = objToString.call(source);
        if (typeStr === '[object Array]') {
            result = [];
            for (var i = 0, len = source.length; i < len; i++) {
                result[i] = clone(source[i]);
            }
        } else if (TYPED_ARRAY[typeStr]) {
            result = source.constructor.from(source);
        } else if (!BUILTIN_OBJECT[typeStr] && !isDom(source)) {
            result = {};
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    result[key] = clone(source[key]);
                }
            }
        }
        return result;
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {*} target
     * @param {*} source
     * @param {boolean} [overwrite=false]
     */
    function merge(target, source, overwrite) {
        // We should escapse that source is string
        // and enter for ... in ...
        if (!isObject(source) || !isObject(target)) {
            return overwrite ? clone(source) : target;
        }
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                var targetProp = target[key];
                var sourceProp = source[key];
                if (isObject(sourceProp) && isObject(targetProp) && !isArray(sourceProp) && !isArray(targetProp) && !isDom(sourceProp) && !isDom(targetProp) && !isBuildInObject(sourceProp) && !isBuildInObject(targetProp)) {
                    // 如果需要递归覆盖，就递归调用merge
                    merge(targetProp, sourceProp, overwrite);
                } else if (overwrite || !(key in target)) {
                    // 否则只处理overwrite为true，或者在目标对象中没有此属性的情况
                    // NOTE，在 target[key] 不存在的时候也是直接覆盖
                    target[key] = clone(source[key], true);
                }
            }
        }
        return target;
    }
    /**
     * @param {Array} targetAndSources The first item is target, and the rests are source.
     * @param {boolean} [overwrite=false]
     * @return {*} target
     */
    function mergeAll(targetAndSources, overwrite) {
        var result = targetAndSources[0];
        for (var i = 1, len = targetAndSources.length; i < len; i++) {
            result = merge(result, targetAndSources[i], overwrite);
        }
        return result;
    }
    /**
     * @param {*} target
     * @param {*} source
     * @memberOf module:zrender/core/util
     */
    function extend(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
        return target;
    }
    /**
     * @param {*} target
     * @param {*} source
     * @param {boolen} [overlay=false]
     * @memberOf module:zrender/core/util
     */
    function defaults(target, source, overlay) {
        for (var key in source) {
            if (source.hasOwnProperty(key) && (overlay ? source[key] != null : target[key] == null)) {
                target[key] = source[key];
            }
        }
        return target;
    }
    function createCanvas() {
        return document.createElement('canvas');
    }
    // FIXME
    var _ctx;
    function getContext() {
        if (!_ctx) {
            // Use util.createCanvas instead of createCanvas
            // because createCanvas may be overwritten in different environment
            _ctx = util.createCanvas().getContext('2d');
        }
        return _ctx;
    }
    /**
     * 查询数组中元素的index
     * @memberOf module:zrender/core/util
     */
    function indexOf(array, value) {
        if (array) {
            if (array.indexOf) {
                return array.indexOf(value);
            }
            for (var i = 0, len = array.length; i < len; i++) {
                if (array[i] === value) {
                    return i;
                }
            }
        }
        return -1;
    }
    /**
     * 构造类继承关系
     *
     * @memberOf module:zrender/core/util
     * @param {Function} clazz 源类
     * @param {Function} baseClazz 基类
     */
    function inherits(clazz, baseClazz) {
        var clazzPrototype = clazz.prototype;
        function F() {
        }
        F.prototype = baseClazz.prototype;
        clazz.prototype = new F();
        for (var prop in clazzPrototype) {
            clazz.prototype[prop] = clazzPrototype[prop];
        }
        clazz.prototype.constructor = clazz;
        clazz.superClass = baseClazz;
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {Object|Function} target
     * @param {Object|Function} sorce
     * @param {boolean} overlay
     */
    function mixin(target, source, overlay) {
        target = 'prototype' in target ? target.prototype : target;
        source = 'prototype' in source ? source.prototype : source;
        defaults(target, source, overlay);
    }
    /**
     * @param {Array|TypedArray} data
     */
    function isArrayLike(data) {
        if (!data) {
            return;
        }
        if (typeof data == 'string') {
            return false;
        }
        return typeof data.length == 'number';
    }
    /**
     * 数组或对象遍历
     * @memberOf module:zrender/core/util
     * @param {Object|Array} obj
     * @param {Function} cb
     * @param {*} [context]
     */
    function each(obj, cb, context) {
        if (!(obj && cb)) {
            return;
        }
        if (obj.forEach && obj.forEach === nativeForEach) {
            obj.forEach(cb, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, len = obj.length; i < len; i++) {
                cb.call(context, obj[i], i, obj);
            }
        } else {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cb.call(context, obj[key], key, obj);
                }
            }
        }
    }
    /**
     * 数组映射
     * @memberOf module:zrender/core/util
     * @param {Array} obj
     * @param {Function} cb
     * @param {*} [context]
     * @return {Array}
     */
    function map(obj, cb, context) {
        if (!(obj && cb)) {
            return;
        }
        if (obj.map && obj.map === nativeMap) {
            return obj.map(cb, context);
        } else {
            var result = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                result.push(cb.call(context, obj[i], i, obj));
            }
            return result;
        }
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {Array} obj
     * @param {Function} cb
     * @param {Object} [memo]
     * @param {*} [context]
     * @return {Array}
     */
    function reduce(obj, cb, memo, context) {
        if (!(obj && cb)) {
            return;
        }
        if (obj.reduce && obj.reduce === nativeReduce) {
            return obj.reduce(cb, memo, context);
        } else {
            for (var i = 0, len = obj.length; i < len; i++) {
                memo = cb.call(context, memo, obj[i], i, obj);
            }
            return memo;
        }
    }
    /**
     * 数组过滤
     * @memberOf module:zrender/core/util
     * @param {Array} obj
     * @param {Function} cb
     * @param {*} [context]
     * @return {Array}
     */
    function filter(obj, cb, context) {
        if (!(obj && cb)) {
            return;
        }
        if (obj.filter && obj.filter === nativeFilter) {
            return obj.filter(cb, context);
        } else {
            var result = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                if (cb.call(context, obj[i], i, obj)) {
                    result.push(obj[i]);
                }
            }
            return result;
        }
    }
    /**
     * 数组项查找
     * @memberOf module:zrender/core/util
     * @param {Array} obj
     * @param {Function} cb
     * @param {*} [context]
     * @return {Array}
     */
    function find(obj, cb, context) {
        if (!(obj && cb)) {
            return;
        }
        for (var i = 0, len = obj.length; i < len; i++) {
            if (cb.call(context, obj[i], i, obj)) {
                return obj[i];
            }
        }
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {Function} func
     * @param {*} context
     * @return {Function}
     */
    function bind(func, context) {
        var args = nativeSlice.call(arguments, 2);
        return function () {
            return func.apply(context, args.concat(nativeSlice.call(arguments)));
        };
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {Function} func
     * @return {Function}
     */
    function curry(func) {
        var args = nativeSlice.call(arguments, 1);
        return function () {
            return func.apply(this, args.concat(nativeSlice.call(arguments)));
        };
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {*} value
     * @return {boolean}
     */
    function isArray(value) {
        return objToString.call(value) === '[object Array]';
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {*} value
     * @return {boolean}
     */
    function isFunction(value) {
        return typeof value === 'function';
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {*} value
     * @return {boolean}
     */
    function isString(value) {
        return objToString.call(value) === '[object String]';
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {*} value
     * @return {boolean}
     */
    function isObject(value) {
        // Avoid a V8 JIT bug in Chrome 19-20.
        // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
        var type = typeof value;
        return type === 'function' || !!value && type == 'object';
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {*} value
     * @return {boolean}
     */
    function isBuildInObject(value) {
        return !!BUILTIN_OBJECT[objToString.call(value)];
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {*} value
     * @return {boolean}
     */
    function isDom(value) {
        return typeof value === 'object' && typeof value.nodeType === 'number' && typeof value.ownerDocument === 'object';
    }
    /**
     * Whether is exactly NaN. Notice isNaN('a') returns true.
     * @param {*} value
     * @return {boolean}
     */
    function eqNaN(value) {
        return value !== value;
    }
    /**
     * If value1 is not null, then return value1, otherwise judget rest of values.
     * @memberOf module:zrender/core/util
     * @return {*} Final value
     */
    function retrieve(values) {
        for (var i = 0, len = arguments.length; i < len; i++) {
            if (arguments[i] != null) {
                return arguments[i];
            }
        }
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {Array} arr
     * @param {number} startIndex
     * @param {number} endIndex
     * @return {Array}
     */
    function slice() {
        return Function.call.apply(nativeSlice, arguments);
    }
    /**
     * @memberOf module:zrender/core/util
     * @param {boolean} condition
     * @param {string} message
     */
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    var util = {
            inherits: inherits,
            mixin: mixin,
            clone: clone,
            merge: merge,
            mergeAll: mergeAll,
            extend: extend,
            defaults: defaults,
            getContext: getContext,
            createCanvas: createCanvas,
            indexOf: indexOf,
            slice: slice,
            find: find,
            isArrayLike: isArrayLike,
            each: each,
            map: map,
            reduce: reduce,
            filter: filter,
            bind: bind,
            curry: curry,
            isArray: isArray,
            isString: isString,
            isObject: isObject,
            isFunction: isFunction,
            isBuildInObject: isBuildInObject,
            isDom: isDom,
            eqNaN: eqNaN,
            retrieve: retrieve,
            assert: assert,
            noop: function () {
            }
        };
    return util;
});
define('zrender/tool/color', ['require'], function (require) {
    var kCSSColorTable = {
            'transparent': [
                0,
                0,
                0,
                0
            ],
            'aliceblue': [
                240,
                248,
                255,
                1
            ],
            'antiquewhite': [
                250,
                235,
                215,
                1
            ],
            'aqua': [
                0,
                255,
                255,
                1
            ],
            'aquamarine': [
                127,
                255,
                212,
                1
            ],
            'azure': [
                240,
                255,
                255,
                1
            ],
            'beige': [
                245,
                245,
                220,
                1
            ],
            'bisque': [
                255,
                228,
                196,
                1
            ],
            'black': [
                0,
                0,
                0,
                1
            ],
            'blanchedalmond': [
                255,
                235,
                205,
                1
            ],
            'blue': [
                0,
                0,
                255,
                1
            ],
            'blueviolet': [
                138,
                43,
                226,
                1
            ],
            'brown': [
                165,
                42,
                42,
                1
            ],
            'burlywood': [
                222,
                184,
                135,
                1
            ],
            'cadetblue': [
                95,
                158,
                160,
                1
            ],
            'chartreuse': [
                127,
                255,
                0,
                1
            ],
            'chocolate': [
                210,
                105,
                30,
                1
            ],
            'coral': [
                255,
                127,
                80,
                1
            ],
            'cornflowerblue': [
                100,
                149,
                237,
                1
            ],
            'cornsilk': [
                255,
                248,
                220,
                1
            ],
            'crimson': [
                220,
                20,
                60,
                1
            ],
            'cyan': [
                0,
                255,
                255,
                1
            ],
            'darkblue': [
                0,
                0,
                139,
                1
            ],
            'darkcyan': [
                0,
                139,
                139,
                1
            ],
            'darkgoldenrod': [
                184,
                134,
                11,
                1
            ],
            'darkgray': [
                169,
                169,
                169,
                1
            ],
            'darkgreen': [
                0,
                100,
                0,
                1
            ],
            'darkgrey': [
                169,
                169,
                169,
                1
            ],
            'darkkhaki': [
                189,
                183,
                107,
                1
            ],
            'darkmagenta': [
                139,
                0,
                139,
                1
            ],
            'darkolivegreen': [
                85,
                107,
                47,
                1
            ],
            'darkorange': [
                255,
                140,
                0,
                1
            ],
            'darkorchid': [
                153,
                50,
                204,
                1
            ],
            'darkred': [
                139,
                0,
                0,
                1
            ],
            'darksalmon': [
                233,
                150,
                122,
                1
            ],
            'darkseagreen': [
                143,
                188,
                143,
                1
            ],
            'darkslateblue': [
                72,
                61,
                139,
                1
            ],
            'darkslategray': [
                47,
                79,
                79,
                1
            ],
            'darkslategrey': [
                47,
                79,
                79,
                1
            ],
            'darkturquoise': [
                0,
                206,
                209,
                1
            ],
            'darkviolet': [
                148,
                0,
                211,
                1
            ],
            'deeppink': [
                255,
                20,
                147,
                1
            ],
            'deepskyblue': [
                0,
                191,
                255,
                1
            ],
            'dimgray': [
                105,
                105,
                105,
                1
            ],
            'dimgrey': [
                105,
                105,
                105,
                1
            ],
            'dodgerblue': [
                30,
                144,
                255,
                1
            ],
            'firebrick': [
                178,
                34,
                34,
                1
            ],
            'floralwhite': [
                255,
                250,
                240,
                1
            ],
            'forestgreen': [
                34,
                139,
                34,
                1
            ],
            'fuchsia': [
                255,
                0,
                255,
                1
            ],
            'gainsboro': [
                220,
                220,
                220,
                1
            ],
            'ghostwhite': [
                248,
                248,
                255,
                1
            ],
            'gold': [
                255,
                215,
                0,
                1
            ],
            'goldenrod': [
                218,
                165,
                32,
                1
            ],
            'gray': [
                128,
                128,
                128,
                1
            ],
            'green': [
                0,
                128,
                0,
                1
            ],
            'greenyellow': [
                173,
                255,
                47,
                1
            ],
            'grey': [
                128,
                128,
                128,
                1
            ],
            'honeydew': [
                240,
                255,
                240,
                1
            ],
            'hotpink': [
                255,
                105,
                180,
                1
            ],
            'indianred': [
                205,
                92,
                92,
                1
            ],
            'indigo': [
                75,
                0,
                130,
                1
            ],
            'ivory': [
                255,
                255,
                240,
                1
            ],
            'khaki': [
                240,
                230,
                140,
                1
            ],
            'lavender': [
                230,
                230,
                250,
                1
            ],
            'lavenderblush': [
                255,
                240,
                245,
                1
            ],
            'lawngreen': [
                124,
                252,
                0,
                1
            ],
            'lemonchiffon': [
                255,
                250,
                205,
                1
            ],
            'lightblue': [
                173,
                216,
                230,
                1
            ],
            'lightcoral': [
                240,
                128,
                128,
                1
            ],
            'lightcyan': [
                224,
                255,
                255,
                1
            ],
            'lightgoldenrodyellow': [
                250,
                250,
                210,
                1
            ],
            'lightgray': [
                211,
                211,
                211,
                1
            ],
            'lightgreen': [
                144,
                238,
                144,
                1
            ],
            'lightgrey': [
                211,
                211,
                211,
                1
            ],
            'lightpink': [
                255,
                182,
                193,
                1
            ],
            'lightsalmon': [
                255,
                160,
                122,
                1
            ],
            'lightseagreen': [
                32,
                178,
                170,
                1
            ],
            'lightskyblue': [
                135,
                206,
                250,
                1
            ],
            'lightslategray': [
                119,
                136,
                153,
                1
            ],
            'lightslategrey': [
                119,
                136,
                153,
                1
            ],
            'lightsteelblue': [
                176,
                196,
                222,
                1
            ],
            'lightyellow': [
                255,
                255,
                224,
                1
            ],
            'lime': [
                0,
                255,
                0,
                1
            ],
            'limegreen': [
                50,
                205,
                50,
                1
            ],
            'linen': [
                250,
                240,
                230,
                1
            ],
            'magenta': [
                255,
                0,
                255,
                1
            ],
            'maroon': [
                128,
                0,
                0,
                1
            ],
            'mediumaquamarine': [
                102,
                205,
                170,
                1
            ],
            'mediumblue': [
                0,
                0,
                205,
                1
            ],
            'mediumorchid': [
                186,
                85,
                211,
                1
            ],
            'mediumpurple': [
                147,
                112,
                219,
                1
            ],
            'mediumseagreen': [
                60,
                179,
                113,
                1
            ],
            'mediumslateblue': [
                123,
                104,
                238,
                1
            ],
            'mediumspringgreen': [
                0,
                250,
                154,
                1
            ],
            'mediumturquoise': [
                72,
                209,
                204,
                1
            ],
            'mediumvioletred': [
                199,
                21,
                133,
                1
            ],
            'midnightblue': [
                25,
                25,
                112,
                1
            ],
            'mintcream': [
                245,
                255,
                250,
                1
            ],
            'mistyrose': [
                255,
                228,
                225,
                1
            ],
            'moccasin': [
                255,
                228,
                181,
                1
            ],
            'navajowhite': [
                255,
                222,
                173,
                1
            ],
            'navy': [
                0,
                0,
                128,
                1
            ],
            'oldlace': [
                253,
                245,
                230,
                1
            ],
            'olive': [
                128,
                128,
                0,
                1
            ],
            'olivedrab': [
                107,
                142,
                35,
                1
            ],
            'orange': [
                255,
                165,
                0,
                1
            ],
            'orangered': [
                255,
                69,
                0,
                1
            ],
            'orchid': [
                218,
                112,
                214,
                1
            ],
            'palegoldenrod': [
                238,
                232,
                170,
                1
            ],
            'palegreen': [
                152,
                251,
                152,
                1
            ],
            'paleturquoise': [
                175,
                238,
                238,
                1
            ],
            'palevioletred': [
                219,
                112,
                147,
                1
            ],
            'papayawhip': [
                255,
                239,
                213,
                1
            ],
            'peachpuff': [
                255,
                218,
                185,
                1
            ],
            'peru': [
                205,
                133,
                63,
                1
            ],
            'pink': [
                255,
                192,
                203,
                1
            ],
            'plum': [
                221,
                160,
                221,
                1
            ],
            'powderblue': [
                176,
                224,
                230,
                1
            ],
            'purple': [
                128,
                0,
                128,
                1
            ],
            'red': [
                255,
                0,
                0,
                1
            ],
            'rosybrown': [
                188,
                143,
                143,
                1
            ],
            'royalblue': [
                65,
                105,
                225,
                1
            ],
            'saddlebrown': [
                139,
                69,
                19,
                1
            ],
            'salmon': [
                250,
                128,
                114,
                1
            ],
            'sandybrown': [
                244,
                164,
                96,
                1
            ],
            'seagreen': [
                46,
                139,
                87,
                1
            ],
            'seashell': [
                255,
                245,
                238,
                1
            ],
            'sienna': [
                160,
                82,
                45,
                1
            ],
            'silver': [
                192,
                192,
                192,
                1
            ],
            'skyblue': [
                135,
                206,
                235,
                1
            ],
            'slateblue': [
                106,
                90,
                205,
                1
            ],
            'slategray': [
                112,
                128,
                144,
                1
            ],
            'slategrey': [
                112,
                128,
                144,
                1
            ],
            'snow': [
                255,
                250,
                250,
                1
            ],
            'springgreen': [
                0,
                255,
                127,
                1
            ],
            'steelblue': [
                70,
                130,
                180,
                1
            ],
            'tan': [
                210,
                180,
                140,
                1
            ],
            'teal': [
                0,
                128,
                128,
                1
            ],
            'thistle': [
                216,
                191,
                216,
                1
            ],
            'tomato': [
                255,
                99,
                71,
                1
            ],
            'turquoise': [
                64,
                224,
                208,
                1
            ],
            'violet': [
                238,
                130,
                238,
                1
            ],
            'wheat': [
                245,
                222,
                179,
                1
            ],
            'white': [
                255,
                255,
                255,
                1
            ],
            'whitesmoke': [
                245,
                245,
                245,
                1
            ],
            'yellow': [
                255,
                255,
                0,
                1
            ],
            'yellowgreen': [
                154,
                205,
                50,
                1
            ]
        };
    function clampCssByte(i) {
        // Clamp to integer 0 .. 255.
        i = Math.round(i);
        // Seems to be what Chrome does (vs truncation).
        return i < 0 ? 0 : i > 255 ? 255 : i;
    }
    function clampCssAngle(i) {
        // Clamp to integer 0 .. 360.
        i = Math.round(i);
        // Seems to be what Chrome does (vs truncation).
        return i < 0 ? 0 : i > 360 ? 360 : i;
    }
    function clampCssFloat(f) {
        // Clamp to float 0.0 .. 1.0.
        return f < 0 ? 0 : f > 1 ? 1 : f;
    }
    function parseCssInt(str) {
        // int or percentage.
        if (str.length && str.charAt(str.length - 1) === '%') {
            return clampCssByte(parseFloat(str) / 100 * 255);
        }
        return clampCssByte(parseInt(str, 10));
    }
    function parseCssFloat(str) {
        // float or percentage.
        if (str.length && str.charAt(str.length - 1) === '%') {
            return clampCssFloat(parseFloat(str) / 100);
        }
        return clampCssFloat(parseFloat(str));
    }
    function cssHueToRgb(m1, m2, h) {
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
        if (h * 6 < 1) {
            return m1 + (m2 - m1) * h * 6;
        }
        if (h * 2 < 1) {
            return m2;
        }
        if (h * 3 < 2) {
            return m1 + (m2 - m1) * (2 / 3 - h) * 6;
        }
        return m1;
    }
    function lerp(a, b, p) {
        return a + (b - a) * p;
    }
    /**
     * @param {string} colorStr
     * @return {Array.<number>}
     * @memberOf module:zrender/util/color
     */
    function parse(colorStr) {
        if (!colorStr) {
            return;
        }
        // colorStr may be not string
        colorStr = colorStr + '';
        // Remove all whitespace, not compliant, but should just be more accepting.
        var str = colorStr.replace(/ /g, '').toLowerCase();
        // Color keywords (and transparent) lookup.
        if (str in kCSSColorTable) {
            return kCSSColorTable[str].slice();    // dup.
        }
        // #abc and #abc123 syntax.
        if (str.charAt(0) === '#') {
            if (str.length === 4) {
                var iv = parseInt(str.substr(1), 16);
                // TODO(deanm): Stricter parsing.
                if (!(iv >= 0 && iv <= 4095)) {
                    return;    // Covers NaN.
                }
                return [
                    (iv & 3840) >> 4 | (iv & 3840) >> 8,
                    iv & 240 | (iv & 240) >> 4,
                    iv & 15 | (iv & 15) << 4,
                    1
                ];
            } else if (str.length === 7) {
                var iv = parseInt(str.substr(1), 16);
                // TODO(deanm): Stricter parsing.
                if (!(iv >= 0 && iv <= 16777215)) {
                    return;    // Covers NaN.
                }
                return [
                    (iv & 16711680) >> 16,
                    (iv & 65280) >> 8,
                    iv & 255,
                    1
                ];
            }
            return;
        }
        var op = str.indexOf('('), ep = str.indexOf(')');
        if (op !== -1 && ep + 1 === str.length) {
            var fname = str.substr(0, op);
            var params = str.substr(op + 1, ep - (op + 1)).split(',');
            var alpha = 1;
            // To allow case fallthrough.
            switch (fname) {
            case 'rgba':
                if (params.length !== 4) {
                    return;
                }
                alpha = parseCssFloat(params.pop());
            // jshint ignore:line
            // Fall through.
            case 'rgb':
                if (params.length !== 3) {
                    return;
                }
                return [
                    parseCssInt(params[0]),
                    parseCssInt(params[1]),
                    parseCssInt(params[2]),
                    alpha
                ];
            case 'hsla':
                if (params.length !== 4) {
                    return;
                }
                params[3] = parseCssFloat(params[3]);
                return hsla2rgba(params);
            case 'hsl':
                if (params.length !== 3) {
                    return;
                }
                return hsla2rgba(params);
            default:
                return;
            }
        }
        return;
    }
    /**
     * @param {Array.<number>} hsla
     * @return {Array.<number>} rgba
     */
    function hsla2rgba(hsla) {
        var h = (parseFloat(hsla[0]) % 360 + 360) % 360 / 360;
        // 0 .. 1
        // NOTE(deanm): According to the CSS spec s/l should only be
        // percentages, but we don't bother and let float or percentage.
        var s = parseCssFloat(hsla[1]);
        var l = parseCssFloat(hsla[2]);
        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;
        var rgba = [
                clampCssByte(cssHueToRgb(m1, m2, h + 1 / 3) * 255),
                clampCssByte(cssHueToRgb(m1, m2, h) * 255),
                clampCssByte(cssHueToRgb(m1, m2, h - 1 / 3) * 255)
            ];
        if (hsla.length === 4) {
            rgba[3] = hsla[3];
        }
        return rgba;
    }
    /**
     * @param {Array.<number>} rgba
     * @return {Array.<number>} hsla
     */
    function rgba2hsla(rgba) {
        if (!rgba) {
            return;
        }
        // RGB from 0 to 255
        var R = rgba[0] / 255;
        var G = rgba[1] / 255;
        var B = rgba[2] / 255;
        var vMin = Math.min(R, G, B);
        // Min. value of RGB
        var vMax = Math.max(R, G, B);
        // Max. value of RGB
        var delta = vMax - vMin;
        // Delta RGB value
        var L = (vMax + vMin) / 2;
        var H;
        var S;
        // HSL results from 0 to 1
        if (delta === 0) {
            H = 0;
            S = 0;
        } else {
            if (L < 0.5) {
                S = delta / (vMax + vMin);
            } else {
                S = delta / (2 - vMax - vMin);
            }
            var deltaR = ((vMax - R) / 6 + delta / 2) / delta;
            var deltaG = ((vMax - G) / 6 + delta / 2) / delta;
            var deltaB = ((vMax - B) / 6 + delta / 2) / delta;
            if (R === vMax) {
                H = deltaB - deltaG;
            } else if (G === vMax) {
                H = 1 / 3 + deltaR - deltaB;
            } else if (B === vMax) {
                H = 2 / 3 + deltaG - deltaR;
            }
            if (H < 0) {
                H += 1;
            }
            if (H > 1) {
                H -= 1;
            }
        }
        var hsla = [
                H * 360,
                S,
                L
            ];
        if (rgba[3] != null) {
            hsla.push(rgba[3]);
        }
        return hsla;
    }
    /**
     * @param {string} color
     * @param {number} level
     * @return {string}
     * @memberOf module:zrender/util/color
     */
    function lift(color, level) {
        var colorArr = parse(color);
        if (colorArr) {
            for (var i = 0; i < 3; i++) {
                if (level < 0) {
                    colorArr[i] = colorArr[i] * (1 - level) | 0;
                } else {
                    colorArr[i] = (255 - colorArr[i]) * level + colorArr[i] | 0;
                }
            }
            return stringify(colorArr, colorArr.length === 4 ? 'rgba' : 'rgb');
        }
    }
    /**
     * @param {string} color
     * @return {string}
     * @memberOf module:zrender/util/color
     */
    function toHex(color, level) {
        var colorArr = parse(color);
        if (colorArr) {
            return ((1 << 24) + (colorArr[0] << 16) + (colorArr[1] << 8) + +colorArr[2]).toString(16).slice(1);
        }
    }
    /**
     * Map value to color. Faster than mapToColor methods because color is represented by rgba array
     * @param {number} normalizedValue A float between 0 and 1.
     * @param {Array.<Array.<number>>} colors List of rgba color array
     * @param {Array.<number>} [out] Mapped gba color array
     * @return {Array.<number>}
     */
    function fastMapToColor(normalizedValue, colors, out) {
        if (!(colors && colors.length) || !(normalizedValue >= 0 && normalizedValue <= 1)) {
            return;
        }
        out = out || [
            0,
            0,
            0,
            0
        ];
        var value = normalizedValue * (colors.length - 1);
        var leftIndex = Math.floor(value);
        var rightIndex = Math.ceil(value);
        var leftColor = colors[leftIndex];
        var rightColor = colors[rightIndex];
        var dv = value - leftIndex;
        out[0] = clampCssByte(lerp(leftColor[0], rightColor[0], dv));
        out[1] = clampCssByte(lerp(leftColor[1], rightColor[1], dv));
        out[2] = clampCssByte(lerp(leftColor[2], rightColor[2], dv));
        out[3] = clampCssByte(lerp(leftColor[3], rightColor[3], dv));
        return out;
    }
    /**
     * @param {number} normalizedValue A float between 0 and 1.
     * @param {Array.<string>} colors Color list.
     * @param {boolean=} fullOutput Default false.
     * @return {(string|Object)} Result color. If fullOutput,
     *                           return {color: ..., leftIndex: ..., rightIndex: ..., value: ...},
     * @memberOf module:zrender/util/color
     */
    function mapToColor(normalizedValue, colors, fullOutput) {
        if (!(colors && colors.length) || !(normalizedValue >= 0 && normalizedValue <= 1)) {
            return;
        }
        var value = normalizedValue * (colors.length - 1);
        var leftIndex = Math.floor(value);
        var rightIndex = Math.ceil(value);
        var leftColor = parse(colors[leftIndex]);
        var rightColor = parse(colors[rightIndex]);
        var dv = value - leftIndex;
        var color = stringify([
                clampCssByte(lerp(leftColor[0], rightColor[0], dv)),
                clampCssByte(lerp(leftColor[1], rightColor[1], dv)),
                clampCssByte(lerp(leftColor[2], rightColor[2], dv)),
                clampCssFloat(lerp(leftColor[3], rightColor[3], dv))
            ], 'rgba');
        return fullOutput ? {
            color: color,
            leftIndex: leftIndex,
            rightIndex: rightIndex,
            value: value
        } : color;
    }
    /**
     * @param {string} color
     * @param {number=} h 0 ~ 360, ignore when null.
     * @param {number=} s 0 ~ 1, ignore when null.
     * @param {number=} l 0 ~ 1, ignore when null.
     * @return {string} Color string in rgba format.
     * @memberOf module:zrender/util/color
     */
    function modifyHSL(color, h, s, l) {
        color = parse(color);
        if (color) {
            color = rgba2hsla(color);
            h != null && (color[0] = clampCssAngle(h));
            s != null && (color[1] = parseCssFloat(s));
            l != null && (color[2] = parseCssFloat(l));
            return stringify(hsla2rgba(color), 'rgba');
        }
    }
    /**
     * @param {string} color
     * @param {number=} alpha 0 ~ 1
     * @return {string} Color string in rgba format.
     * @memberOf module:zrender/util/color
     */
    function modifyAlpha(color, alpha) {
        color = parse(color);
        if (color && alpha != null) {
            color[3] = clampCssFloat(alpha);
            return stringify(color, 'rgba');
        }
    }
    /**
     * @param {Array.<string>} colors Color list.
     * @param {string} type 'rgba', 'hsva', ...
     * @return {string} Result color.
     */
    function stringify(arrColor, type) {
        var colorStr = arrColor[0] + ',' + arrColor[1] + ',' + arrColor[2];
        if (type === 'rgba' || type === 'hsva' || type === 'hsla') {
            colorStr += ',' + arrColor[3];
        }
        return type + '(' + colorStr + ')';
    }
    return {
        parse: parse,
        lift: lift,
        toHex: toHex,
        fastMapToColor: fastMapToColor,
        mapToColor: mapToColor,
        modifyHSL: modifyHSL,
        modifyAlpha: modifyAlpha,
        stringify: stringify
    };
});
define('zrender/mixin/Eventful', ['require'], function (require) {
    var arrySlice = Array.prototype.slice;
    /**
     * 事件分发器
     * @alias module:zrender/mixin/Eventful
     * @constructor
     */
    var Eventful = function () {
        this._$handlers = {};
    };
    Eventful.prototype = {
        constructor: Eventful,
        one: function (event, handler, context) {
            var _h = this._$handlers;
            if (!handler || !event) {
                return this;
            }
            if (!_h[event]) {
                _h[event] = [];
            }
            for (var i = 0; i < _h[event].length; i++) {
                if (_h[event][i].h === handler) {
                    return this;
                }
            }
            _h[event].push({
                h: handler,
                one: true,
                ctx: context || this
            });
            return this;
        },
        on: function (event, handler, context) {
            var _h = this._$handlers;
            if (!handler || !event) {
                return this;
            }
            if (!_h[event]) {
                _h[event] = [];
            }
            for (var i = 0; i < _h[event].length; i++) {
                if (_h[event][i].h === handler) {
                    return this;
                }
            }
            _h[event].push({
                h: handler,
                one: false,
                ctx: context || this
            });
            return this;
        },
        isSilent: function (event) {
            var _h = this._$handlers;
            return _h[event] && _h[event].length;
        },
        off: function (event, handler) {
            var _h = this._$handlers;
            if (!event) {
                this._$handlers = {};
                return this;
            }
            if (handler) {
                if (_h[event]) {
                    var newList = [];
                    for (var i = 0, l = _h[event].length; i < l; i++) {
                        if (_h[event][i]['h'] != handler) {
                            newList.push(_h[event][i]);
                        }
                    }
                    _h[event] = newList;
                }
                if (_h[event] && _h[event].length === 0) {
                    delete _h[event];
                }
            } else {
                delete _h[event];
            }
            return this;
        },
        trigger: function (type) {
            if (this._$handlers[type]) {
                var args = arguments;
                var argLen = args.length;
                if (argLen > 3) {
                    args = arrySlice.call(args, 1);
                }
                var _h = this._$handlers[type];
                var len = _h.length;
                for (var i = 0; i < len;) {
                    // Optimize advise from backbone
                    switch (argLen) {
                    case 1:
                        _h[i]['h'].call(_h[i]['ctx']);
                        break;
                    case 2:
                        _h[i]['h'].call(_h[i]['ctx'], args[1]);
                        break;
                    case 3:
                        _h[i]['h'].call(_h[i]['ctx'], args[1], args[2]);
                        break;
                    default:
                        // have more than 2 given arguments
                        _h[i]['h'].apply(_h[i]['ctx'], args);
                        break;
                    }
                    if (_h[i]['one']) {
                        _h.splice(i, 1);
                        len--;
                    } else {
                        i++;
                    }
                }
            }
            return this;
        },
        triggerWithContext: function (type) {
            if (this._$handlers[type]) {
                var args = arguments;
                var argLen = args.length;
                if (argLen > 4) {
                    args = arrySlice.call(args, 1, args.length - 1);
                }
                var ctx = args[args.length - 1];
                var _h = this._$handlers[type];
                var len = _h.length;
                for (var i = 0; i < len;) {
                    // Optimize advise from backbone
                    switch (argLen) {
                    case 1:
                        _h[i]['h'].call(ctx);
                        break;
                    case 2:
                        _h[i]['h'].call(ctx, args[1]);
                        break;
                    case 3:
                        _h[i]['h'].call(ctx, args[1], args[2]);
                        break;
                    default:
                        // have more than 2 given arguments
                        _h[i]['h'].apply(ctx, args);
                        break;
                    }
                    if (_h[i]['one']) {
                        _h.splice(i, 1);
                        len--;
                    } else {
                        i++;
                    }
                }
            }
            return this;
        }
    };
    // 对象可以通过 onxxxx 绑定事件
    /**
     * @event module:zrender/mixin/Eventful#onclick
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmouseover
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmouseout
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmousemove
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmousewheel
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmousedown
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#onmouseup
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondrag
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragstart
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragend
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragenter
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragleave
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondragover
     * @type {Function}
     * @default null
     */
    /**
     * @event module:zrender/mixin/Eventful#ondrop
     * @type {Function}
     * @default null
     */
    return Eventful;
});
define('zrender/core/timsort', [], function () {
    var DEFAULT_MIN_MERGE = 32;
    var DEFAULT_MIN_GALLOPING = 7;
    var DEFAULT_TMP_STORAGE_LENGTH = 256;
    function minRunLength(n) {
        var r = 0;
        while (n >= DEFAULT_MIN_MERGE) {
            r |= n & 1;
            n >>= 1;
        }
        return n + r;
    }
    function makeAscendingRun(array, lo, hi, compare) {
        var runHi = lo + 1;
        if (runHi === hi) {
            return 1;
        }
        if (compare(array[runHi++], array[lo]) < 0) {
            while (runHi < hi && compare(array[runHi], array[runHi - 1]) < 0) {
                runHi++;
            }
            reverseRun(array, lo, runHi);
        } else {
            while (runHi < hi && compare(array[runHi], array[runHi - 1]) >= 0) {
                runHi++;
            }
        }
        return runHi - lo;
    }
    function reverseRun(array, lo, hi) {
        hi--;
        while (lo < hi) {
            var t = array[lo];
            array[lo++] = array[hi];
            array[hi--] = t;
        }
    }
    function binaryInsertionSort(array, lo, hi, start, compare) {
        if (start === lo) {
            start++;
        }
        for (; start < hi; start++) {
            var pivot = array[start];
            var left = lo;
            var right = start;
            var mid;
            while (left < right) {
                mid = left + right >>> 1;
                if (compare(pivot, array[mid]) < 0) {
                    right = mid;
                } else {
                    left = mid + 1;
                }
            }
            var n = start - left;
            switch (n) {
            case 3:
                array[left + 3] = array[left + 2];
            case 2:
                array[left + 2] = array[left + 1];
            case 1:
                array[left + 1] = array[left];
                break;
            default:
                while (n > 0) {
                    array[left + n] = array[left + n - 1];
                    n--;
                }
            }
            array[left] = pivot;
        }
    }
    function gallopLeft(value, array, start, length, hint, compare) {
        var lastOffset = 0;
        var maxOffset = 0;
        var offset = 1;
        if (compare(value, array[start + hint]) > 0) {
            maxOffset = length - hint;
            while (offset < maxOffset && compare(value, array[start + hint + offset]) > 0) {
                lastOffset = offset;
                offset = (offset << 1) + 1;
                if (offset <= 0) {
                    offset = maxOffset;
                }
            }
            if (offset > maxOffset) {
                offset = maxOffset;
            }
            lastOffset += hint;
            offset += hint;
        } else {
            maxOffset = hint + 1;
            while (offset < maxOffset && compare(value, array[start + hint - offset]) <= 0) {
                lastOffset = offset;
                offset = (offset << 1) + 1;
                if (offset <= 0) {
                    offset = maxOffset;
                }
            }
            if (offset > maxOffset) {
                offset = maxOffset;
            }
            var tmp = lastOffset;
            lastOffset = hint - offset;
            offset = hint - tmp;
        }
        lastOffset++;
        while (lastOffset < offset) {
            var m = lastOffset + (offset - lastOffset >>> 1);
            if (compare(value, array[start + m]) > 0) {
                lastOffset = m + 1;
            } else {
                offset = m;
            }
        }
        return offset;
    }
    function gallopRight(value, array, start, length, hint, compare) {
        var lastOffset = 0;
        var maxOffset = 0;
        var offset = 1;
        if (compare(value, array[start + hint]) < 0) {
            maxOffset = hint + 1;
            while (offset < maxOffset && compare(value, array[start + hint - offset]) < 0) {
                lastOffset = offset;
                offset = (offset << 1) + 1;
                if (offset <= 0) {
                    offset = maxOffset;
                }
            }
            if (offset > maxOffset) {
                offset = maxOffset;
            }
            var tmp = lastOffset;
            lastOffset = hint - offset;
            offset = hint - tmp;
        } else {
            maxOffset = length - hint;
            while (offset < maxOffset && compare(value, array[start + hint + offset]) >= 0) {
                lastOffset = offset;
                offset = (offset << 1) + 1;
                if (offset <= 0) {
                    offset = maxOffset;
                }
            }
            if (offset > maxOffset) {
                offset = maxOffset;
            }
            lastOffset += hint;
            offset += hint;
        }
        lastOffset++;
        while (lastOffset < offset) {
            var m = lastOffset + (offset - lastOffset >>> 1);
            if (compare(value, array[start + m]) < 0) {
                offset = m;
            } else {
                lastOffset = m + 1;
            }
        }
        return offset;
    }
    function TimSort(array, compare) {
        var minGallop = DEFAULT_MIN_GALLOPING;
        var length = 0;
        var tmpStorageLength = DEFAULT_TMP_STORAGE_LENGTH;
        var stackLength = 0;
        var runStart;
        var runLength;
        var stackSize = 0;
        length = array.length;
        if (length < 2 * DEFAULT_TMP_STORAGE_LENGTH) {
            tmpStorageLength = length >>> 1;
        }
        var tmp = [];
        stackLength = length < 120 ? 5 : length < 1542 ? 10 : length < 119151 ? 19 : 40;
        runStart = [];
        runLength = [];
        function pushRun(_runStart, _runLength) {
            runStart[stackSize] = _runStart;
            runLength[stackSize] = _runLength;
            stackSize += 1;
        }
        function mergeRuns() {
            while (stackSize > 1) {
                var n = stackSize - 2;
                if (n >= 1 && runLength[n - 1] <= runLength[n] + runLength[n + 1] || n >= 2 && runLength[n - 2] <= runLength[n] + runLength[n - 1]) {
                    if (runLength[n - 1] < runLength[n + 1]) {
                        n--;
                    }
                } else if (runLength[n] > runLength[n + 1]) {
                    break;
                }
                mergeAt(n);
            }
        }
        function forceMergeRuns() {
            while (stackSize > 1) {
                var n = stackSize - 2;
                if (n > 0 && runLength[n - 1] < runLength[n + 1]) {
                    n--;
                }
                mergeAt(n);
            }
        }
        function mergeAt(i) {
            var start1 = runStart[i];
            var length1 = runLength[i];
            var start2 = runStart[i + 1];
            var length2 = runLength[i + 1];
            runLength[i] = length1 + length2;
            if (i === stackSize - 3) {
                runStart[i + 1] = runStart[i + 2];
                runLength[i + 1] = runLength[i + 2];
            }
            stackSize--;
            var k = gallopRight(array[start2], array, start1, length1, 0, compare);
            start1 += k;
            length1 -= k;
            if (length1 === 0) {
                return;
            }
            length2 = gallopLeft(array[start1 + length1 - 1], array, start2, length2, length2 - 1, compare);
            if (length2 === 0) {
                return;
            }
            if (length1 <= length2) {
                mergeLow(start1, length1, start2, length2);
            } else {
                mergeHigh(start1, length1, start2, length2);
            }
        }
        function mergeLow(start1, length1, start2, length2) {
            var i = 0;
            for (i = 0; i < length1; i++) {
                tmp[i] = array[start1 + i];
            }
            var cursor1 = 0;
            var cursor2 = start2;
            var dest = start1;
            array[dest++] = array[cursor2++];
            if (--length2 === 0) {
                for (i = 0; i < length1; i++) {
                    array[dest + i] = tmp[cursor1 + i];
                }
                return;
            }
            if (length1 === 1) {
                for (i = 0; i < length2; i++) {
                    array[dest + i] = array[cursor2 + i];
                }
                array[dest + length2] = tmp[cursor1];
                return;
            }
            var _minGallop = minGallop;
            var count1, count2, exit;
            while (1) {
                count1 = 0;
                count2 = 0;
                exit = false;
                do {
                    if (compare(array[cursor2], tmp[cursor1]) < 0) {
                        array[dest++] = array[cursor2++];
                        count2++;
                        count1 = 0;
                        if (--length2 === 0) {
                            exit = true;
                            break;
                        }
                    } else {
                        array[dest++] = tmp[cursor1++];
                        count1++;
                        count2 = 0;
                        if (--length1 === 1) {
                            exit = true;
                            break;
                        }
                    }
                } while ((count1 | count2) < _minGallop);
                if (exit) {
                    break;
                }
                do {
                    count1 = gallopRight(array[cursor2], tmp, cursor1, length1, 0, compare);
                    if (count1 !== 0) {
                        for (i = 0; i < count1; i++) {
                            array[dest + i] = tmp[cursor1 + i];
                        }
                        dest += count1;
                        cursor1 += count1;
                        length1 -= count1;
                        if (length1 <= 1) {
                            exit = true;
                            break;
                        }
                    }
                    array[dest++] = array[cursor2++];
                    if (--length2 === 0) {
                        exit = true;
                        break;
                    }
                    count2 = gallopLeft(tmp[cursor1], array, cursor2, length2, 0, compare);
                    if (count2 !== 0) {
                        for (i = 0; i < count2; i++) {
                            array[dest + i] = array[cursor2 + i];
                        }
                        dest += count2;
                        cursor2 += count2;
                        length2 -= count2;
                        if (length2 === 0) {
                            exit = true;
                            break;
                        }
                    }
                    array[dest++] = tmp[cursor1++];
                    if (--length1 === 1) {
                        exit = true;
                        break;
                    }
                    _minGallop--;
                } while (count1 >= DEFAULT_MIN_GALLOPING || count2 >= DEFAULT_MIN_GALLOPING);
                if (exit) {
                    break;
                }
                if (_minGallop < 0) {
                    _minGallop = 0;
                }
                _minGallop += 2;
            }
            minGallop = _minGallop;
            minGallop < 1 && (minGallop = 1);
            if (length1 === 1) {
                for (i = 0; i < length2; i++) {
                    array[dest + i] = array[cursor2 + i];
                }
                array[dest + length2] = tmp[cursor1];
            } else if (length1 === 0) {
                throw new Error();    // throw new Error('mergeLow preconditions were not respected');
            } else {
                for (i = 0; i < length1; i++) {
                    array[dest + i] = tmp[cursor1 + i];
                }
            }
        }
        function mergeHigh(start1, length1, start2, length2) {
            var i = 0;
            for (i = 0; i < length2; i++) {
                tmp[i] = array[start2 + i];
            }
            var cursor1 = start1 + length1 - 1;
            var cursor2 = length2 - 1;
            var dest = start2 + length2 - 1;
            var customCursor = 0;
            var customDest = 0;
            array[dest--] = array[cursor1--];
            if (--length1 === 0) {
                customCursor = dest - (length2 - 1);
                for (i = 0; i < length2; i++) {
                    array[customCursor + i] = tmp[i];
                }
                return;
            }
            if (length2 === 1) {
                dest -= length1;
                cursor1 -= length1;
                customDest = dest + 1;
                customCursor = cursor1 + 1;
                for (i = length1 - 1; i >= 0; i--) {
                    array[customDest + i] = array[customCursor + i];
                }
                array[dest] = tmp[cursor2];
                return;
            }
            var _minGallop = minGallop;
            while (true) {
                var count1 = 0;
                var count2 = 0;
                var exit = false;
                do {
                    if (compare(tmp[cursor2], array[cursor1]) < 0) {
                        array[dest--] = array[cursor1--];
                        count1++;
                        count2 = 0;
                        if (--length1 === 0) {
                            exit = true;
                            break;
                        }
                    } else {
                        array[dest--] = tmp[cursor2--];
                        count2++;
                        count1 = 0;
                        if (--length2 === 1) {
                            exit = true;
                            break;
                        }
                    }
                } while ((count1 | count2) < _minGallop);
                if (exit) {
                    break;
                }
                do {
                    count1 = length1 - gallopRight(tmp[cursor2], array, start1, length1, length1 - 1, compare);
                    if (count1 !== 0) {
                        dest -= count1;
                        cursor1 -= count1;
                        length1 -= count1;
                        customDest = dest + 1;
                        customCursor = cursor1 + 1;
                        for (i = count1 - 1; i >= 0; i--) {
                            array[customDest + i] = array[customCursor + i];
                        }
                        if (length1 === 0) {
                            exit = true;
                            break;
                        }
                    }
                    array[dest--] = tmp[cursor2--];
                    if (--length2 === 1) {
                        exit = true;
                        break;
                    }
                    count2 = length2 - gallopLeft(array[cursor1], tmp, 0, length2, length2 - 1, compare);
                    if (count2 !== 0) {
                        dest -= count2;
                        cursor2 -= count2;
                        length2 -= count2;
                        customDest = dest + 1;
                        customCursor = cursor2 + 1;
                        for (i = 0; i < count2; i++) {
                            array[customDest + i] = tmp[customCursor + i];
                        }
                        if (length2 <= 1) {
                            exit = true;
                            break;
                        }
                    }
                    array[dest--] = array[cursor1--];
                    if (--length1 === 0) {
                        exit = true;
                        break;
                    }
                    _minGallop--;
                } while (count1 >= DEFAULT_MIN_GALLOPING || count2 >= DEFAULT_MIN_GALLOPING);
                if (exit) {
                    break;
                }
                if (_minGallop < 0) {
                    _minGallop = 0;
                }
                _minGallop += 2;
            }
            minGallop = _minGallop;
            if (minGallop < 1) {
                minGallop = 1;
            }
            if (length2 === 1) {
                dest -= length1;
                cursor1 -= length1;
                customDest = dest + 1;
                customCursor = cursor1 + 1;
                for (i = length1 - 1; i >= 0; i--) {
                    array[customDest + i] = array[customCursor + i];
                }
                array[dest] = tmp[cursor2];
            } else if (length2 === 0) {
                throw new Error();    // throw new Error('mergeHigh preconditions were not respected');
            } else {
                customCursor = dest - (length2 - 1);
                for (i = 0; i < length2; i++) {
                    array[customCursor + i] = tmp[i];
                }
            }
        }
        this.mergeRuns = mergeRuns;
        this.forceMergeRuns = forceMergeRuns;
        this.pushRun = pushRun;
    }
    function sort(array, compare, lo, hi) {
        if (!lo) {
            lo = 0;
        }
        if (!hi) {
            hi = array.length;
        }
        var remaining = hi - lo;
        if (remaining < 2) {
            return;
        }
        var runLength = 0;
        if (remaining < DEFAULT_MIN_MERGE) {
            runLength = makeAscendingRun(array, lo, hi, compare);
            binaryInsertionSort(array, lo, hi, lo + runLength, compare);
            return;
        }
        var ts = new TimSort(array, compare);
        var minRun = minRunLength(remaining);
        do {
            runLength = makeAscendingRun(array, lo, hi, compare);
            if (runLength < minRun) {
                var force = remaining;
                if (force > minRun) {
                    force = minRun;
                }
                binaryInsertionSort(array, lo, lo + force, lo + runLength, compare);
                runLength = force;
            }
            ts.pushRun(lo, runLength);
            ts.mergeRuns();
            remaining -= runLength;
            lo += runLength;
        } while (remaining !== 0);
        ts.forceMergeRuns();
    }
    return sort;
});
define('echarts/visual/seriesColor', ['require', 'zrender/graphic/Gradient'], function (require) {
    var Gradient = require('zrender/graphic/Gradient');
    return function (ecModel) {
        function encodeColor(seriesModel) {
            var colorAccessPath = (seriesModel.visualColorAccessPath || 'itemStyle.normal.color').split('.');
            var data = seriesModel.getData();
            var color = seriesModel.get(colorAccessPath) || seriesModel.getColorFromPalette(seriesModel.get('name'));
            // Default color
            // FIXME Set color function or use the platte color
            data.setVisual('color', color);
            // Only visible series has each data be visual encoded
            if (!ecModel.isSeriesFiltered(seriesModel)) {
                if (typeof color === 'function' && !(color instanceof Gradient)) {
                    data.each(function (idx) {
                        data.setItemVisual(idx, 'color', color(seriesModel.getDataParams(idx)));
                    });
                }
                // itemStyle in each data item
                data.each(function (idx) {
                    var itemModel = data.getItemModel(idx);
                    var color = itemModel.get(colorAccessPath, true);
                    if (color != null) {
                        data.setItemVisual(idx, 'color', color);
                    }
                });
            }
        }
        ecModel.eachRawSeries(encodeColor);
    };
});
define('echarts/preprocessor/backwardCompat', ['require', 'zrender/core/util', './helper/compatStyle'], function (require) {
    var zrUtil = require('zrender/core/util');
    var compatStyle = require('./helper/compatStyle');
    function get(opt, path) {
        path = path.split(',');
        var obj = opt;
        for (var i = 0; i < path.length; i++) {
            obj = obj && obj[path[i]];
            if (obj == null) {
                break;
            }
        }
        return obj;
    }
    function set(opt, path, val, overwrite) {
        path = path.split(',');
        var obj = opt;
        var key;
        for (var i = 0; i < path.length - 1; i++) {
            key = path[i];
            if (obj[key] == null) {
                obj[key] = {};
            }
            obj = obj[key];
        }
        if (overwrite || obj[path[i]] == null) {
            obj[path[i]] = val;
        }
    }
    function compatLayoutProperties(option) {
        each(LAYOUT_PROPERTIES, function (prop) {
            if (prop[0] in option && !(prop[1] in option)) {
                option[prop[1]] = option[prop[0]];
            }
        });
    }
    var LAYOUT_PROPERTIES = [
            [
                'x',
                'left'
            ],
            [
                'y',
                'top'
            ],
            [
                'x2',
                'right'
            ],
            [
                'y2',
                'bottom'
            ]
        ];
    var COMPATITABLE_COMPONENTS = [
            'grid',
            'geo',
            'parallel',
            'legend',
            'toolbox',
            'title',
            'visualMap',
            'dataZoom',
            'timeline'
        ];
    var COMPATITABLE_SERIES = [
            'bar',
            'boxplot',
            'candlestick',
            'chord',
            'effectScatter',
            'funnel',
            'gauge',
            'lines',
            'graph',
            'heatmap',
            'line',
            'map',
            'parallel',
            'pie',
            'radar',
            'sankey',
            'scatter',
            'treemap'
        ];
    var each = zrUtil.each;
    return function (option) {
        each(option.series, function (seriesOpt) {
            if (!zrUtil.isObject(seriesOpt)) {
                return;
            }
            var seriesType = seriesOpt.type;
            compatStyle(seriesOpt);
            if (seriesType === 'pie' || seriesType === 'gauge') {
                if (seriesOpt.clockWise != null) {
                    seriesOpt.clockwise = seriesOpt.clockWise;
                }
            }
            if (seriesType === 'gauge') {
                var pointerColor = get(seriesOpt, 'pointer.color');
                pointerColor != null && set(seriesOpt, 'itemStyle.normal.color', pointerColor);
            }
            for (var i = 0; i < COMPATITABLE_SERIES.length; i++) {
                if (COMPATITABLE_SERIES[i] === seriesOpt.type) {
                    compatLayoutProperties(seriesOpt);
                    break;
                }
            }
        });
        // dataRange has changed to visualMap
        if (option.dataRange) {
            option.visualMap = option.dataRange;
        }
        each(COMPATITABLE_COMPONENTS, function (componentName) {
            var options = option[componentName];
            if (options) {
                if (!zrUtil.isArray(options)) {
                    options = [options];
                }
                each(options, function (option) {
                    compatLayoutProperties(option);
                });
            }
        });
    };
});
define('echarts/loading/default', ['require', '../util/graphic', 'zrender/core/util'], function (require) {
    var graphic = require('../util/graphic');
    var zrUtil = require('zrender/core/util');
    var PI = Math.PI;
    /**
     * @param {module:echarts/ExtensionAPI} api
     * @param {Object} [opts]
     * @param {string} [opts.text]
     * @param {string} [opts.color]
     * @param {string} [opts.textColor]
     * @return {module:zrender/Element}
     */
    return function (api, opts) {
        opts = opts || {};
        zrUtil.defaults(opts, {
            text: 'loading',
            color: '#c23531',
            textColor: '#000',
            maskColor: 'rgba(255, 255, 255, 0.8)',
            zlevel: 0
        });
        var mask = new graphic.Rect({
                style: { fill: opts.maskColor },
                zlevel: opts.zlevel,
                z: 10000
            });
        var arc = new graphic.Arc({
                shape: {
                    startAngle: -PI / 2,
                    endAngle: -PI / 2 + 0.1,
                    r: 10
                },
                style: {
                    stroke: opts.color,
                    lineCap: 'round',
                    lineWidth: 5
                },
                zlevel: opts.zlevel,
                z: 10001
            });
        var labelRect = new graphic.Rect({
                style: {
                    fill: 'none',
                    text: opts.text,
                    textPosition: 'right',
                    textDistance: 10,
                    textFill: opts.textColor
                },
                zlevel: opts.zlevel,
                z: 10001
            });
        arc.animateShape(true).when(1000, { endAngle: PI * 3 / 2 }).start('circularInOut');
        arc.animateShape(true).when(1000, { startAngle: PI * 3 / 2 }).delay(300).start('circularInOut');
        var group = new graphic.Group();
        group.add(arc);
        group.add(labelRect);
        group.add(mask);
        // Inject resize
        group.resize = function () {
            var cx = api.getWidth() / 2;
            var cy = api.getHeight() / 2;
            arc.setShape({
                cx: cx,
                cy: cy
            });
            var r = arc.shape.r;
            labelRect.setShape({
                x: cx - r,
                y: cy - r,
                width: r * 2,
                height: r * 2
            });
            mask.setShape({
                x: 0,
                y: 0,
                width: api.getWidth(),
                height: api.getHeight()
            });
        };
        group.resize();
        return group;
    };
});
define('echarts/data/List', ['require', '../model/Model', './DataDiffer', 'zrender/core/util', '../util/model'], function (require) {
    var UNDEFINED = 'undefined';
    var globalObj = typeof window === 'undefined' ? global : window;
    var Float64Array = typeof globalObj.Float64Array === UNDEFINED ? Array : globalObj.Float64Array;
    var Int32Array = typeof globalObj.Int32Array === UNDEFINED ? Array : globalObj.Int32Array;
    var dataCtors = {
            'float': Float64Array,
            'int': Int32Array,
            'ordinal': Array,
            'number': Array,
            'time': Array
        };
    var Model = require('../model/Model');
    var DataDiffer = require('./DataDiffer');
    var zrUtil = require('zrender/core/util');
    var modelUtil = require('../util/model');
    var isObject = zrUtil.isObject;
    var TRANSFERABLE_PROPERTIES = [
            'stackedOn',
            'hasItemOption',
            '_nameList',
            '_idList',
            '_rawData'
        ];
    var transferProperties = function (a, b) {
        zrUtil.each(TRANSFERABLE_PROPERTIES.concat(b.__wrappedMethods || []), function (propName) {
            if (b.hasOwnProperty(propName)) {
                a[propName] = b[propName];
            }
        });
        a.__wrappedMethods = b.__wrappedMethods;
    };
    /**
     * @constructor
     * @alias module:echarts/data/List
     *
     * @param {Array.<string>} dimensions
     *        Dimensions should be concrete names like x, y, z, lng, lat, angle, radius
     * @param {module:echarts/model/Model} hostModel
     */
    var List = function (dimensions, hostModel) {
        dimensions = dimensions || [
            'x',
            'y'
        ];
        var dimensionInfos = {};
        var dimensionNames = [];
        for (var i = 0; i < dimensions.length; i++) {
            var dimensionName;
            var dimensionInfo = {};
            if (typeof dimensions[i] === 'string') {
                dimensionName = dimensions[i];
                dimensionInfo = {
                    name: dimensionName,
                    stackable: false,
                    type: 'number'
                };
            } else {
                dimensionInfo = dimensions[i];
                dimensionName = dimensionInfo.name;
                dimensionInfo.type = dimensionInfo.type || 'number';
            }
            dimensionNames.push(dimensionName);
            dimensionInfos[dimensionName] = dimensionInfo;
        }
        /**
         * @readOnly
         * @type {Array.<string>}
         */
        this.dimensions = dimensionNames;
        /**
         * Infomation of each data dimension, like data type.
         * @type {Object}
         */
        this._dimensionInfos = dimensionInfos;
        /**
         * @type {module:echarts/model/Model}
         */
        this.hostModel = hostModel;
        /**
         * @type {module:echarts/model/Model}
         */
        this.dataType;
        /**
         * Indices stores the indices of data subset after filtered.
         * This data subset will be used in chart.
         * @type {Array.<number>}
         * @readOnly
         */
        this.indices = [];
        /**
         * Data storage
         * @type {Object.<key, TypedArray|Array>}
         * @private
         */
        this._storage = {};
        /**
         * @type {Array.<string>}
         */
        this._nameList = [];
        /**
         * @type {Array.<string>}
         */
        this._idList = [];
        /**
         * Models of data option is stored sparse for optimizing memory cost
         * @type {Array.<module:echarts/model/Model>}
         * @private
         */
        this._optionModels = [];
        /**
         * @param {module:echarts/data/List}
         */
        this.stackedOn = null;
        /**
         * Global visual properties after visual coding
         * @type {Object}
         * @private
         */
        this._visual = {};
        /**
         * Globel layout properties.
         * @type {Object}
         * @private
         */
        this._layout = {};
        /**
         * Item visual properties after visual coding
         * @type {Array.<Object>}
         * @private
         */
        this._itemVisuals = [];
        /**
         * Item layout properties after layout
         * @type {Array.<Object>}
         * @private
         */
        this._itemLayouts = [];
        /**
         * Graphic elemnents
         * @type {Array.<module:zrender/Element>}
         * @private
         */
        this._graphicEls = [];
        /**
         * @type {Array.<Array|Object>}
         * @private
         */
        this._rawData;
        /**
         * @type {Object}
         * @private
         */
        this._extent;
    };
    var listProto = List.prototype;
    listProto.type = 'list';
    /**
     * If each data item has it's own option
     * @type {boolean}
     */
    listProto.hasItemOption = true;
    /**
     * Get dimension name
     * @param {string|number} dim
     *        Dimension can be concrete names like x, y, z, lng, lat, angle, radius
     *        Or a ordinal number. For example getDimensionInfo(0) will return 'x' or 'lng' or 'radius'
     * @return {string} Concrete dim name.
     */
    listProto.getDimension = function (dim) {
        if (!isNaN(dim)) {
            dim = this.dimensions[dim] || dim;
        }
        return dim;
    };
    /**
     * Get type and stackable info of particular dimension
     * @param {string|number} dim
     *        Dimension can be concrete names like x, y, z, lng, lat, angle, radius
     *        Or a ordinal number. For example getDimensionInfo(0) will return 'x' or 'lng' or 'radius'
     */
    listProto.getDimensionInfo = function (dim) {
        return zrUtil.clone(this._dimensionInfos[this.getDimension(dim)]);
    };
    /**
     * Initialize from data
     * @param {Array.<Object|number|Array>} data
     * @param {Array.<string>} [nameList]
     * @param {Function} [dimValueGetter] (dataItem, dimName, dataIndex, dimIndex) => number
     */
    listProto.initData = function (data, nameList, dimValueGetter) {
        data = data || [];
        if (true) {
            if (!zrUtil.isArray(data)) {
                throw new Error('Invalid data.');
            }
        }
        this._rawData = data;
        // Clear
        var storage = this._storage = {};
        var indices = this.indices = [];
        var dimensions = this.dimensions;
        var size = data.length;
        var dimensionInfoMap = this._dimensionInfos;
        var idList = [];
        var nameRepeatCount = {};
        nameList = nameList || [];
        // Init storage
        for (var i = 0; i < dimensions.length; i++) {
            var dimInfo = dimensionInfoMap[dimensions[i]];
            var DataCtor = dataCtors[dimInfo.type];
            storage[dimensions[i]] = new DataCtor(size);
        }
        var self = this;
        if (!dimValueGetter) {
            self.hasItemOption = false;
        }
        // Default dim value getter
        dimValueGetter = dimValueGetter || function (dataItem, dimName, dataIndex, dimIndex) {
            var value = modelUtil.getDataItemValue(dataItem);
            // If any dataItem is like { value: 10 }
            if (modelUtil.isDataItemOption(dataItem)) {
                self.hasItemOption = true;
            }
            return modelUtil.converDataValue(value instanceof Array ? value[dimIndex] : value, dimensionInfoMap[dimName]);
        };
        for (var idx = 0; idx < data.length; idx++) {
            var dataItem = data[idx];
            // Each data item is value
            // [1, 2]
            // 2
            // Bar chart, line chart which uses category axis
            // only gives the 'y' value. 'x' value is the indices of cateogry
            // Use a tempValue to normalize the value to be a (x, y) value
            // Store the data by dimensions
            for (var k = 0; k < dimensions.length; k++) {
                var dim = dimensions[k];
                var dimStorage = storage[dim];
                // PENDING NULL is empty or zero
                dimStorage[idx] = dimValueGetter(dataItem, dim, idx, k);
            }
            indices.push(idx);
        }
        // Use the name in option and create id
        for (var i = 0; i < data.length; i++) {
            if (!nameList[i]) {
                if (data[i] && data[i].name != null) {
                    nameList[i] = data[i].name;
                }
            }
            var name = nameList[i] || '';
            // Try using the id in option
            var id = data[i] && data[i].id;
            if (!id && name) {
                // Use name as id and add counter to avoid same name
                nameRepeatCount[name] = nameRepeatCount[name] || 0;
                id = name;
                if (nameRepeatCount[name] > 0) {
                    id += '__ec__' + nameRepeatCount[name];
                }
                nameRepeatCount[name]++;
            }
            id && (idList[i] = id);
        }
        this._nameList = nameList;
        this._idList = idList;
    };
    /**
     * @return {number}
     */
    listProto.count = function () {
        return this.indices.length;
    };
    /**
     * Get value. Return NaN if idx is out of range.
     * @param {string} dim Dim must be concrete name.
     * @param {number} idx
     * @param {boolean} stack
     * @return {number}
     */
    listProto.get = function (dim, idx, stack) {
        var storage = this._storage;
        var dataIndex = this.indices[idx];
        // If value not exists
        if (dataIndex == null) {
            return NaN;
        }
        var value = storage[dim] && storage[dim][dataIndex];
        // FIXME ordinal data type is not stackable
        if (stack) {
            var dimensionInfo = this._dimensionInfos[dim];
            if (dimensionInfo && dimensionInfo.stackable) {
                var stackedOn = this.stackedOn;
                while (stackedOn) {
                    // Get no stacked data of stacked on
                    var stackedValue = stackedOn.get(dim, idx);
                    // Considering positive stack, negative stack and empty data
                    if (value >= 0 && stackedValue > 0 || value <= 0 && stackedValue < 0) {
                        value += stackedValue;
                    }
                    stackedOn = stackedOn.stackedOn;
                }
            }
        }
        return value;
    };
    /**
     * Get value for multi dimensions.
     * @param {Array.<string>} [dimensions] If ignored, using all dimensions.
     * @param {number} idx
     * @param {boolean} stack
     * @return {number}
     */
    listProto.getValues = function (dimensions, idx, stack) {
        var values = [];
        if (!zrUtil.isArray(dimensions)) {
            stack = idx;
            idx = dimensions;
            dimensions = this.dimensions;
        }
        for (var i = 0, len = dimensions.length; i < len; i++) {
            values.push(this.get(dimensions[i], idx, stack));
        }
        return values;
    };
    /**
     * If value is NaN. Inlcuding '-'
     * @param {string} dim
     * @param {number} idx
     * @return {number}
     */
    listProto.hasValue = function (idx) {
        var dimensions = this.dimensions;
        var dimensionInfos = this._dimensionInfos;
        for (var i = 0, len = dimensions.length; i < len; i++) {
            if (dimensionInfos[dimensions[i]].type !== 'ordinal' && isNaN(this.get(dimensions[i], idx))) {
                return false;
            }
        }
        return true;
    };
    /**
     * Get extent of data in one dimension
     * @param {string} dim
     * @param {boolean} stack
     * @param {Function} filter
     */
    listProto.getDataExtent = function (dim, stack, filter) {
        dim = this.getDimension(dim);
        var dimData = this._storage[dim];
        var dimInfo = this.getDimensionInfo(dim);
        stack = dimInfo && dimInfo.stackable && stack;
        var dimExtent = (this._extent || (this._extent = {}))[dim + !!stack];
        var value;
        if (dimExtent) {
            return dimExtent;
        }
        // var dimInfo = this._dimensionInfos[dim];
        if (dimData) {
            var min = Infinity;
            var max = -Infinity;
            // var isOrdinal = dimInfo.type === 'ordinal';
            for (var i = 0, len = this.count(); i < len; i++) {
                value = this.get(dim, i, stack);
                // FIXME
                // if (isOrdinal && typeof value === 'string') {
                //     value = zrUtil.indexOf(dimData, value);
                // }
                if (!filter || filter(value, dim, i)) {
                    value < min && (min = value);
                    value > max && (max = value);
                }
            }
            return this._extent[dim + !!stack] = [
                min,
                max
            ];
        } else {
            return [
                Infinity,
                -Infinity
            ];
        }
    };
    /**
     * Get sum of data in one dimension
     * @param {string} dim
     * @param {boolean} stack
     */
    listProto.getSum = function (dim, stack) {
        var dimData = this._storage[dim];
        var sum = 0;
        if (dimData) {
            for (var i = 0, len = this.count(); i < len; i++) {
                var value = this.get(dim, i, stack);
                if (!isNaN(value)) {
                    sum += value;
                }
            }
        }
        return sum;
    };
    /**
     * Retreive the index with given value
     * @param {number} idx
     * @param {number} value
     * @return {number}
     */
    // FIXME Precision of float value
    listProto.indexOf = function (dim, value) {
        var storage = this._storage;
        var dimData = storage[dim];
        var indices = this.indices;
        if (dimData) {
            for (var i = 0, len = indices.length; i < len; i++) {
                var rawIndex = indices[i];
                if (dimData[rawIndex] === value) {
                    return i;
                }
            }
        }
        return -1;
    };
    /**
     * Retreive the index with given name
     * @param {number} idx
     * @param {number} name
     * @return {number}
     */
    listProto.indexOfName = function (name) {
        var indices = this.indices;
        var nameList = this._nameList;
        for (var i = 0, len = indices.length; i < len; i++) {
            var rawIndex = indices[i];
            if (nameList[rawIndex] === name) {
                return i;
            }
        }
        return -1;
    };
    /**
     * Retreive the index with given raw data index
     * @param {number} idx
     * @param {number} name
     * @return {number}
     */
    listProto.indexOfRawIndex = function (rawIndex) {
        // Indices are ascending
        var indices = this.indices;
        // If rawIndex === dataIndex
        var rawDataIndex = indices[rawIndex];
        if (rawDataIndex != null && rawDataIndex === rawIndex) {
            return rawIndex;
        }
        var left = 0;
        var right = indices.length - 1;
        while (left <= right) {
            var mid = (left + right) / 2 | 0;
            if (indices[mid] < rawIndex) {
                left = mid + 1;
            } else if (indices[mid] > rawIndex) {
                right = mid - 1;
            } else {
                return mid;
            }
        }
        return -1;
    };
    /**
     * Retreive the index of nearest value
     * @param {string} dim
     * @param {number} value
     * @param {boolean} stack If given value is after stacked
     * @param {number} [maxDistance=Infinity]
     * @return {number}
     */
    listProto.indexOfNearest = function (dim, value, stack, maxDistance) {
        var storage = this._storage;
        var dimData = storage[dim];
        if (maxDistance == null) {
            maxDistance = Infinity;
        }
        var nearestIdx = -1;
        if (dimData) {
            var minDist = Number.MAX_VALUE;
            for (var i = 0, len = this.count(); i < len; i++) {
                var diff = value - this.get(dim, i, stack);
                var dist = Math.abs(diff);
                if (diff <= maxDistance && (dist < minDist || dist === minDist && diff > 0)) {
                    minDist = dist;
                    nearestIdx = i;
                }
            }
        }
        return nearestIdx;
    };
    /**
     * Get raw data index
     * @param {number} idx
     * @return {number}
     */
    listProto.getRawIndex = function (idx) {
        var rawIdx = this.indices[idx];
        return rawIdx == null ? -1 : rawIdx;
    };
    /**
     * Get raw data item
     * @param {number} idx
     * @return {number}
     */
    listProto.getRawDataItem = function (idx) {
        return this._rawData[this.getRawIndex(idx)];
    };
    /**
     * @param {number} idx
     * @param {boolean} [notDefaultIdx=false]
     * @return {string}
     */
    listProto.getName = function (idx) {
        return this._nameList[this.indices[idx]] || '';
    };
    /**
     * @param {number} idx
     * @param {boolean} [notDefaultIdx=false]
     * @return {string}
     */
    listProto.getId = function (idx) {
        return this._idList[this.indices[idx]] || this.getRawIndex(idx) + '';
    };
    function normalizeDimensions(dimensions) {
        if (!zrUtil.isArray(dimensions)) {
            dimensions = [dimensions];
        }
        return dimensions;
    }
    /**
     * Data iteration
     * @param {string|Array.<string>}
     * @param {Function} cb
     * @param {boolean} [stack=false]
     * @param {*} [context=this]
     *
     * @example
     *  list.each('x', function (x, idx) {});
     *  list.each(['x', 'y'], function (x, y, idx) {});
     *  list.each(function (idx) {})
     */
    listProto.each = function (dims, cb, stack, context) {
        if (typeof dims === 'function') {
            context = stack;
            stack = cb;
            cb = dims;
            dims = [];
        }
        dims = zrUtil.map(normalizeDimensions(dims), this.getDimension, this);
        var value = [];
        var dimSize = dims.length;
        var indices = this.indices;
        context = context || this;
        for (var i = 0; i < indices.length; i++) {
            // Simple optimization
            switch (dimSize) {
            case 0:
                cb.call(context, i);
                break;
            case 1:
                cb.call(context, this.get(dims[0], i, stack), i);
                break;
            case 2:
                cb.call(context, this.get(dims[0], i, stack), this.get(dims[1], i, stack), i);
                break;
            default:
                for (var k = 0; k < dimSize; k++) {
                    value[k] = this.get(dims[k], i, stack);
                }
                // Index
                value[k] = i;
                cb.apply(context, value);
            }
        }
    };
    /**
     * Data filter
     * @param {string|Array.<string>}
     * @param {Function} cb
     * @param {boolean} [stack=false]
     * @param {*} [context=this]
     */
    listProto.filterSelf = function (dimensions, cb, stack, context) {
        if (typeof dimensions === 'function') {
            context = stack;
            stack = cb;
            cb = dimensions;
            dimensions = [];
        }
        dimensions = zrUtil.map(normalizeDimensions(dimensions), this.getDimension, this);
        var newIndices = [];
        var value = [];
        var dimSize = dimensions.length;
        var indices = this.indices;
        context = context || this;
        for (var i = 0; i < indices.length; i++) {
            var keep;
            // Simple optimization
            if (dimSize === 1) {
                keep = cb.call(context, this.get(dimensions[0], i, stack), i);
            } else {
                for (var k = 0; k < dimSize; k++) {
                    value[k] = this.get(dimensions[k], i, stack);
                }
                value[k] = i;
                keep = cb.apply(context, value);
            }
            if (keep) {
                newIndices.push(indices[i]);
            }
        }
        this.indices = newIndices;
        // Reset data extent
        this._extent = {};
        return this;
    };
    /**
     * Data mapping to a plain array
     * @param {string|Array.<string>} [dimensions]
     * @param {Function} cb
     * @param {boolean} [stack=false]
     * @param {*} [context=this]
     * @return {Array}
     */
    listProto.mapArray = function (dimensions, cb, stack, context) {
        if (typeof dimensions === 'function') {
            context = stack;
            stack = cb;
            cb = dimensions;
            dimensions = [];
        }
        var result = [];
        this.each(dimensions, function () {
            result.push(cb && cb.apply(this, arguments));
        }, stack, context);
        return result;
    };
    function cloneListForMapAndSample(original, excludeDimensions) {
        var allDimensions = original.dimensions;
        var list = new List(zrUtil.map(allDimensions, original.getDimensionInfo, original), original.hostModel);
        // FIXME If needs stackedOn, value may already been stacked
        transferProperties(list, original);
        var storage = list._storage = {};
        var originalStorage = original._storage;
        // Init storage
        for (var i = 0; i < allDimensions.length; i++) {
            var dim = allDimensions[i];
            var dimStore = originalStorage[dim];
            if (zrUtil.indexOf(excludeDimensions, dim) >= 0) {
                storage[dim] = new dimStore.constructor(originalStorage[dim].length);
            } else {
                // Direct reference for other dimensions
                storage[dim] = originalStorage[dim];
            }
        }
        return list;
    }
    /**
     * Data mapping to a new List with given dimensions
     * @param {string|Array.<string>} dimensions
     * @param {Function} cb
     * @param {boolean} [stack=false]
     * @param {*} [context=this]
     * @return {Array}
     */
    listProto.map = function (dimensions, cb, stack, context) {
        dimensions = zrUtil.map(normalizeDimensions(dimensions), this.getDimension, this);
        var list = cloneListForMapAndSample(this, dimensions);
        // Following properties are all immutable.
        // So we can reference to the same value
        var indices = list.indices = this.indices;
        var storage = list._storage;
        var tmpRetValue = [];
        this.each(dimensions, function () {
            var idx = arguments[arguments.length - 1];
            var retValue = cb && cb.apply(this, arguments);
            if (retValue != null) {
                // a number
                if (typeof retValue === 'number') {
                    tmpRetValue[0] = retValue;
                    retValue = tmpRetValue;
                }
                for (var i = 0; i < retValue.length; i++) {
                    var dim = dimensions[i];
                    var dimStore = storage[dim];
                    var rawIdx = indices[idx];
                    if (dimStore) {
                        dimStore[rawIdx] = retValue[i];
                    }
                }
            }
        }, stack, context);
        return list;
    };
    /**
     * Large data down sampling on given dimension
     * @param {string} dimension
     * @param {number} rate
     * @param {Function} sampleValue
     * @param {Function} sampleIndex Sample index for name and id
     */
    listProto.downSample = function (dimension, rate, sampleValue, sampleIndex) {
        var list = cloneListForMapAndSample(this, [dimension]);
        var storage = this._storage;
        var targetStorage = list._storage;
        var originalIndices = this.indices;
        var indices = list.indices = [];
        var frameValues = [];
        var frameIndices = [];
        var frameSize = Math.floor(1 / rate);
        var dimStore = targetStorage[dimension];
        var len = this.count();
        // Copy data from original data
        for (var i = 0; i < storage[dimension].length; i++) {
            targetStorage[dimension][i] = storage[dimension][i];
        }
        for (var i = 0; i < len; i += frameSize) {
            // Last frame
            if (frameSize > len - i) {
                frameSize = len - i;
                frameValues.length = frameSize;
            }
            for (var k = 0; k < frameSize; k++) {
                var idx = originalIndices[i + k];
                frameValues[k] = dimStore[idx];
                frameIndices[k] = idx;
            }
            var value = sampleValue(frameValues);
            var idx = frameIndices[sampleIndex(frameValues, value) || 0];
            // Only write value on the filtered data
            dimStore[idx] = value;
            indices.push(idx);
        }
        return list;
    };
    /**
     * Get model of one data item.
     *
     * @param {number} idx
     */
    // FIXME Model proxy ?
    listProto.getItemModel = function (idx) {
        var hostModel = this.hostModel;
        idx = this.indices[idx];
        return new Model(this._rawData[idx], hostModel, hostModel && hostModel.ecModel);
    };
    /**
     * Create a data differ
     * @param {module:echarts/data/List} otherList
     * @return {module:echarts/data/DataDiffer}
     */
    listProto.diff = function (otherList) {
        var idList = this._idList;
        var otherIdList = otherList && otherList._idList;
        var val;
        // Use prefix to avoid index to be the same as otherIdList[idx],
        // which will cause weird udpate animation.
        var prefix = 'e  ';
        return new DataDiffer(otherList ? otherList.indices : [], this.indices, function (idx) {
            return (val = otherIdList[idx]) != null ? val : prefix + idx;
        }, function (idx) {
            return (val = idList[idx]) != null ? val : prefix + idx;
        });
    };
    /**
     * Get visual property.
     * @param {string} key
     */
    listProto.getVisual = function (key) {
        var visual = this._visual;
        return visual && visual[key];
    };
    /**
     * Set visual property
     * @param {string|Object} key
     * @param {*} [value]
     *
     * @example
     *  setVisual('color', color);
     *  setVisual({
     *      'color': color
     *  });
     */
    listProto.setVisual = function (key, val) {
        if (isObject(key)) {
            for (var name in key) {
                if (key.hasOwnProperty(name)) {
                    this.setVisual(name, key[name]);
                }
            }
            return;
        }
        this._visual = this._visual || {};
        this._visual[key] = val;
    };
    /**
     * Set layout property.
     * @param {string} key
     * @param {*} [val]
     */
    listProto.setLayout = function (key, val) {
        if (isObject(key)) {
            for (var name in key) {
                if (key.hasOwnProperty(name)) {
                    this.setLayout(name, key[name]);
                }
            }
            return;
        }
        this._layout[key] = val;
    };
    /**
     * Get layout property.
     * @param  {string} key.
     * @return {*}
     */
    listProto.getLayout = function (key) {
        return this._layout[key];
    };
    /**
     * Get layout of single data item
     * @param {number} idx
     */
    listProto.getItemLayout = function (idx) {
        return this._itemLayouts[idx];
    };
    /**
     * Set layout of single data item
     * @param {number} idx
     * @param {Object} layout
     * @param {boolean=} [merge=false]
     */
    listProto.setItemLayout = function (idx, layout, merge) {
        this._itemLayouts[idx] = merge ? zrUtil.extend(this._itemLayouts[idx] || {}, layout) : layout;
    };
    /**
     * Clear all layout of single data item
     */
    listProto.clearItemLayouts = function () {
        this._itemLayouts.length = 0;
    };
    /**
     * Get visual property of single data item
     * @param {number} idx
     * @param {string} key
     * @param {boolean} ignoreParent
     */
    listProto.getItemVisual = function (idx, key, ignoreParent) {
        var itemVisual = this._itemVisuals[idx];
        var val = itemVisual && itemVisual[key];
        if (val == null && !ignoreParent) {
            // Use global visual property
            return this.getVisual(key);
        }
        return val;
    };
    /**
     * Set visual property of single data item
     *
     * @param {number} idx
     * @param {string|Object} key
     * @param {*} [value]
     *
     * @example
     *  setItemVisual(0, 'color', color);
     *  setItemVisual(0, {
     *      'color': color
     *  });
     */
    listProto.setItemVisual = function (idx, key, value) {
        var itemVisual = this._itemVisuals[idx] || {};
        this._itemVisuals[idx] = itemVisual;
        if (isObject(key)) {
            for (var name in key) {
                if (key.hasOwnProperty(name)) {
                    itemVisual[name] = key[name];
                }
            }
            return;
        }
        itemVisual[key] = value;
    };
    /**
     * Clear itemVisuals and list visual.
     */
    listProto.clearAllVisual = function () {
        this._visual = {};
        this._itemVisuals = [];
    };
    var setItemDataAndSeriesIndex = function (child) {
        child.seriesIndex = this.seriesIndex;
        child.dataIndex = this.dataIndex;
        child.dataType = this.dataType;
    };
    /**
     * Set graphic element relative to data. It can be set as null
     * @param {number} idx
     * @param {module:zrender/Element} [el]
     */
    listProto.setItemGraphicEl = function (idx, el) {
        var hostModel = this.hostModel;
        if (el) {
            // Add data index and series index for indexing the data by element
            // Useful in tooltip
            el.dataIndex = idx;
            el.dataType = this.dataType;
            el.seriesIndex = hostModel && hostModel.seriesIndex;
            if (el.type === 'group') {
                el.traverse(setItemDataAndSeriesIndex, el);
            }
        }
        this._graphicEls[idx] = el;
    };
    /**
     * @param {number} idx
     * @return {module:zrender/Element}
     */
    listProto.getItemGraphicEl = function (idx) {
        return this._graphicEls[idx];
    };
    /**
     * @param {Function} cb
     * @param {*} context
     */
    listProto.eachItemGraphicEl = function (cb, context) {
        zrUtil.each(this._graphicEls, function (el, idx) {
            if (el) {
                cb && cb.call(context, el, idx);
            }
        });
    };
    /**
     * Shallow clone a new list except visual and layout properties, and graph elements.
     * New list only change the indices.
     */
    listProto.cloneShallow = function () {
        var dimensionInfoList = zrUtil.map(this.dimensions, this.getDimensionInfo, this);
        var list = new List(dimensionInfoList, this.hostModel);
        // FIXME
        list._storage = this._storage;
        transferProperties(list, this);
        // Clone will not change the data extent and indices
        list.indices = this.indices.slice();
        if (this._extent) {
            list._extent = zrUtil.extend({}, this._extent);
        }
        return list;
    };
    /**
     * Wrap some method to add more feature
     * @param {string} methodName
     * @param {Function} injectFunction
     */
    listProto.wrapMethod = function (methodName, injectFunction) {
        var originalMethod = this[methodName];
        if (typeof originalMethod !== 'function') {
            return;
        }
        this.__wrappedMethods = this.__wrappedMethods || [];
        this.__wrappedMethods.push(methodName);
        this[methodName] = function () {
            var res = originalMethod.apply(this, arguments);
            return injectFunction.apply(this, [res].concat(zrUtil.slice(arguments)));
        };
    };
    // Methods that create a new list based on this list should be listed here.
    // Notice that those method should `RETURN` the new list.
    listProto.TRANSFERABLE_METHODS = [
        'cloneShallow',
        'downSample',
        'map'
    ];
    // Methods that change indices of this list should be listed here.
    listProto.CHANGABLE_METHODS = ['filterSelf'];
    return List;
});
define('echarts/model/Model', ['require', 'zrender/core/util', '../util/clazz', 'zrender/core/env', './mixin/lineStyle', './mixin/areaStyle', './mixin/textStyle', './mixin/itemStyle'], function (require) {
    var zrUtil = require('zrender/core/util');
    var clazzUtil = require('../util/clazz');
    var env = require('zrender/core/env');
    /**
     * @alias module:echarts/model/Model
     * @constructor
     * @param {Object} option
     * @param {module:echarts/model/Model} [parentModel]
     * @param {module:echarts/model/Global} [ecModel]
     */
    function Model(option, parentModel, ecModel) {
        /**
         * @type {module:echarts/model/Model}
         * @readOnly
         */
        this.parentModel = parentModel;
        /**
         * @type {module:echarts/model/Global}
         * @readOnly
         */
        this.ecModel = ecModel;
        /**
         * @type {Object}
         * @protected
         */
        this.option = option;    // Simple optimization
                                 // if (this.init) {
                                 //     if (arguments.length <= 4) {
                                 //         this.init(option, parentModel, ecModel, extraOpt);
                                 //     }
                                 //     else {
                                 //         this.init.apply(this, arguments);
                                 //     }
                                 // }
    }
    Model.prototype = {
        constructor: Model,
        init: null,
        mergeOption: function (option) {
            zrUtil.merge(this.option, option, true);
        },
        get: function (path, ignoreParent) {
            if (path == null) {
                return this.option;
            }
            return doGet(this.option, this.parsePath(path), !ignoreParent && getParent(this, path));
        },
        getShallow: function (key, ignoreParent) {
            var option = this.option;
            var val = option == null ? option : option[key];
            var parentModel = !ignoreParent && getParent(this, key);
            if (val == null && parentModel) {
                val = parentModel.getShallow(key);
            }
            return val;
        },
        getModel: function (path, parentModel) {
            var obj = path == null ? this.option : doGet(this.option, path = this.parsePath(path));
            var thisParentModel;
            parentModel = parentModel || (thisParentModel = getParent(this, path)) && thisParentModel.getModel(path);
            return new Model(obj, parentModel, this.ecModel);
        },
        isEmpty: function () {
            return this.option == null;
        },
        restoreData: function () {
        },
        clone: function () {
            var Ctor = this.constructor;
            return new Ctor(zrUtil.clone(this.option));
        },
        setReadOnly: function (properties) {
            clazzUtil.setReadOnly(this, properties);
        },
        parsePath: function (path) {
            if (typeof path === 'string') {
                path = path.split('.');
            }
            return path;
        },
        customizeGetParent: function (getParentMethod) {
            clazzUtil.set(this, 'getParent', getParentMethod);
        },
        isAnimationEnabled: function () {
            if (!env.node) {
                if (this.option.animation != null) {
                    return !!this.option.animation;
                } else if (this.parentModel) {
                    return this.parentModel.isAnimationEnabled();
                }
            }
        }
    };
    function doGet(obj, pathArr, parentModel) {
        for (var i = 0; i < pathArr.length; i++) {
            // Ignore empty
            if (!pathArr[i]) {
                continue;
            }
            // obj could be number/string/... (like 0)
            obj = obj && typeof obj === 'object' ? obj[pathArr[i]] : null;
            if (obj == null) {
                break;
            }
        }
        if (obj == null && parentModel) {
            obj = parentModel.get(pathArr);
        }
        return obj;
    }
    function getParent(model, path) {
        var getParentMethod = clazzUtil.get(model, 'getParent');
        return getParentMethod ? getParentMethod.call(model, path) : model.parentModel;
    }
    // Enable Model.extend.
    clazzUtil.enableClassExtend(Model);
    var mixin = zrUtil.mixin;
    mixin(Model, require('./mixin/lineStyle'));
    mixin(Model, require('./mixin/areaStyle'));
    mixin(Model, require('./mixin/textStyle'));
    mixin(Model, require('./mixin/itemStyle'));
    return Model;
});
define('echarts/util/number', ['require'], function (require) {
    var number = {};
    var RADIAN_EPSILON = 0.0001;
    function _trim(str) {
        return str.replace(/^\s+/, '').replace(/\s+$/, '');
    }
    /**
     * Linear mapping a value from domain to range
     * @memberOf module:echarts/util/number
     * @param  {(number|Array.<number>)} val
     * @param  {Array.<number>} domain Domain extent domain[0] can be bigger than domain[1]
     * @param  {Array.<number>} range  Range extent range[0] can be bigger than range[1]
     * @param  {boolean} clamp
     * @return {(number|Array.<number>}
     */
    number.linearMap = function (val, domain, range, clamp) {
        var subDomain = domain[1] - domain[0];
        var subRange = range[1] - range[0];
        if (subDomain === 0) {
            return subRange === 0 ? range[0] : (range[0] + range[1]) / 2;
        }
        // Avoid accuracy problem in edge, such as
        // 146.39 - 62.83 === 83.55999999999999.
        // See echarts/test/ut/spec/util/number.js#linearMap#accuracyError
        // It is a little verbose for efficiency considering this method
        // is a hotspot.
        if (clamp) {
            if (subDomain > 0) {
                if (val <= domain[0]) {
                    return range[0];
                } else if (val >= domain[1]) {
                    return range[1];
                }
            } else {
                if (val >= domain[0]) {
                    return range[0];
                } else if (val <= domain[1]) {
                    return range[1];
                }
            }
        } else {
            if (val === domain[0]) {
                return range[0];
            }
            if (val === domain[1]) {
                return range[1];
            }
        }
        return (val - domain[0]) / subDomain * subRange + range[0];
    };
    /**
     * Convert a percent string to absolute number.
     * Returns NaN if percent is not a valid string or number
     * @memberOf module:echarts/util/number
     * @param {string|number} percent
     * @param {number} all
     * @return {number}
     */
    number.parsePercent = function (percent, all) {
        switch (percent) {
        case 'center':
        case 'middle':
            percent = '50%';
            break;
        case 'left':
        case 'top':
            percent = '0%';
            break;
        case 'right':
        case 'bottom':
            percent = '100%';
            break;
        }
        if (typeof percent === 'string') {
            if (_trim(percent).match(/%$/)) {
                return parseFloat(percent) / 100 * all;
            }
            return parseFloat(percent);
        }
        return percent == null ? NaN : +percent;
    };
    /**
     * Fix rounding error of float numbers
     * @param {number} x
     * @return {number}
     */
    number.round = function (x, precision) {
        if (precision == null) {
            precision = 10;
        }
        // Avoid range error
        precision = Math.min(Math.max(0, precision), 20);
        return +(+x).toFixed(precision);
    };
    number.asc = function (arr) {
        arr.sort(function (a, b) {
            return a - b;
        });
        return arr;
    };
    /**
     * Get precision
     * @param {number} val
     */
    number.getPrecision = function (val) {
        val = +val;
        if (isNaN(val)) {
            return 0;
        }
        // It is much faster than methods converting number to string as follows
        //      var tmp = val.toString();
        //      return tmp.length - 1 - tmp.indexOf('.');
        // especially when precision is low
        var e = 1;
        var count = 0;
        while (Math.round(val * e) / e !== val) {
            e *= 10;
            count++;
        }
        return count;
    };
    number.getPrecisionSafe = function (val) {
        var str = val.toString();
        var dotIndex = str.indexOf('.');
        if (dotIndex < 0) {
            return 0;
        }
        return str.length - 1 - dotIndex;
    };
    /**
     * Minimal dicernible data precisioin according to a single pixel.
     * @param {Array.<number>} dataExtent
     * @param {Array.<number>} pixelExtent
     * @return {number} precision
     */
    number.getPixelPrecision = function (dataExtent, pixelExtent) {
        var log = Math.log;
        var LN10 = Math.LN10;
        var dataQuantity = Math.floor(log(dataExtent[1] - dataExtent[0]) / LN10);
        var sizeQuantity = Math.round(log(Math.abs(pixelExtent[1] - pixelExtent[0])) / LN10);
        // toFixed() digits argument must be between 0 and 20.
        var precision = Math.min(Math.max(-dataQuantity + sizeQuantity, 0), 20);
        return !isFinite(precision) ? 20 : precision;
    };
    // Number.MAX_SAFE_INTEGER, ie do not support.
    number.MAX_SAFE_INTEGER = 9007199254740991;
    /**
     * To 0 - 2 * PI, considering negative radian.
     * @param {number} radian
     * @return {number}
     */
    number.remRadian = function (radian) {
        var pi2 = Math.PI * 2;
        return (radian % pi2 + pi2) % pi2;
    };
    /**
     * @param {type} radian
     * @return {boolean}
     */
    number.isRadianAroundZero = function (val) {
        return val > -RADIAN_EPSILON && val < RADIAN_EPSILON;
    };
    /**
     * @param {string|Date|number} value
     * @return {Date} date
     */
    number.parseDate = function (value) {
        if (value instanceof Date) {
            return value;
        } else if (typeof value === 'string') {
            // Treat as ISO format. See issue #3623
            var ret = new Date(value);
            if (isNaN(+ret)) {
                // FIXME new Date('1970-01-01') is UTC, new Date('1970/01/01') is local
                ret = new Date(new Date(value.replace(/-/g, '/')) - new Date('1970/01/01'));
            }
            return ret;
        }
        return new Date(Math.round(value));
    };
    /**
     * Quantity of a number. e.g. 0.1, 1, 10, 100
     * @param  {number} val
     * @return {number}
     */
    number.quantity = function (val) {
        return Math.pow(10, Math.floor(Math.log(val) / Math.LN10));
    };
    // "Nice Numbers for Graph Labels" of Graphic Gems
    /**
     * find a “nice” number approximately equal to x. Round the number if round = true, take ceiling if round = false
     * The primary observation is that the “nicest” numbers in decimal are 1, 2, and 5, and all power-of-ten multiples of these numbers.
     * @param  {number} val
     * @param  {boolean} round
     * @return {number}
     */
    number.nice = function (val, round) {
        var exp10 = number.quantity(val);
        var f = val / exp10;
        // between 1 and 10
        var nf;
        if (round) {
            if (f < 1.5) {
                nf = 1;
            } else if (f < 2.5) {
                nf = 2;
            } else if (f < 4) {
                nf = 3;
            } else if (f < 7) {
                nf = 5;
            } else {
                nf = 10;
            }
        } else {
            if (f < 1) {
                nf = 1;
            } else if (f < 2) {
                nf = 2;
            } else if (f < 3) {
                nf = 3;
            } else if (f < 5) {
                nf = 5;
            } else {
                nf = 10;
            }
        }
        return nf * exp10;
    };
    /**
     * Order intervals asc, and split them when overlap.
     * expect(numberUtil.reformIntervals([
     *     {interval: [18, 62], close: [1, 1]},
     *     {interval: [-Infinity, -70], close: [0, 0]},
     *     {interval: [-70, -26], close: [1, 1]},
     *     {interval: [-26, 18], close: [1, 1]},
     *     {interval: [62, 150], close: [1, 1]},
     *     {interval: [106, 150], close: [1, 1]},
     *     {interval: [150, Infinity], close: [0, 0]}
     * ])).toEqual([
     *     {interval: [-Infinity, -70], close: [0, 0]},
     *     {interval: [-70, -26], close: [1, 1]},
     *     {interval: [-26, 18], close: [0, 1]},
     *     {interval: [18, 62], close: [0, 1]},
     *     {interval: [62, 150], close: [0, 1]},
     *     {interval: [150, Infinity], close: [0, 0]}
     * ]);
     * @param {Array.<Object>} list, where `close` mean open or close
     *        of the interval, and Infinity can be used.
     * @return {Array.<Object>} The origin list, which has been reformed.
     */
    number.reformIntervals = function (list) {
        list.sort(function (a, b) {
            return littleThan(a, b, 0) ? -1 : 1;
        });
        var curr = -Infinity;
        var currClose = 1;
        for (var i = 0; i < list.length;) {
            var interval = list[i].interval;
            var close = list[i].close;
            for (var lg = 0; lg < 2; lg++) {
                if (interval[lg] <= curr) {
                    interval[lg] = curr;
                    close[lg] = !lg ? 1 - currClose : 1;
                }
                curr = interval[lg];
                currClose = close[lg];
            }
            if (interval[0] === interval[1] && close[0] * close[1] !== 1) {
                list.splice(i, 1);
            } else {
                i++;
            }
        }
        return list;
        function littleThan(a, b, lg) {
            return a.interval[lg] < b.interval[lg] || a.interval[lg] === b.interval[lg] && (a.close[lg] - b.close[lg] === (!lg ? 1 : -1) || !lg && littleThan(a, b, 1));
        }
    };
    /**
     * parseFloat NaNs numeric-cast false positives (null|true|false|"")
     * ...but misinterprets leading-number strings, particularly hex literals ("0x...")
     * subtraction forces infinities to NaN
     * @param {*} v
     * @return {boolean}
     */
    number.isNumeric = function (v) {
        return v - parseFloat(v) >= 0;
    };
    return number;
});
define('echarts/util/format', ['require', 'zrender/core/util', './number', 'zrender/contain/text'], function (require) {
    var zrUtil = require('zrender/core/util');
    var numberUtil = require('./number');
    var textContain = require('zrender/contain/text');
    var formatUtil = {};
    /**
     * 每三位默认加,格式化
     * @type {string|number} x
     */
    formatUtil.addCommas = function (x) {
        if (isNaN(x)) {
            return '-';
        }
        x = (x + '').split('.');
        return x[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,') + (x.length > 1 ? '.' + x[1] : '');
    };
    /**
     * @param {string} str
     * @param {boolean} [upperCaseFirst=false]
     * @return {string} str
     */
    formatUtil.toCamelCase = function (str, upperCaseFirst) {
        str = (str || '').toLowerCase().replace(/-(.)/g, function (match, group1) {
            return group1.toUpperCase();
        });
        if (upperCaseFirst && str) {
            str = str.charAt(0).toUpperCase() + str.slice(1);
        }
        return str;
    };
    /**
     * Normalize css liked array configuration
     * e.g.
     *  3 => [3, 3, 3, 3]
     *  [4, 2] => [4, 2, 4, 2]
     *  [4, 3, 2] => [4, 3, 2, 3]
     * @param {number|Array.<number>} val
     */
    formatUtil.normalizeCssArray = function (val) {
        var len = val.length;
        if (typeof val === 'number') {
            return [
                val,
                val,
                val,
                val
            ];
        } else if (len === 2) {
            // vertical | horizontal
            return [
                val[0],
                val[1],
                val[0],
                val[1]
            ];
        } else if (len === 3) {
            // top | horizontal | bottom
            return [
                val[0],
                val[1],
                val[2],
                val[1]
            ];
        }
        return val;
    };
    var encodeHTML = formatUtil.encodeHTML = function (source) {
            return String(source).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        };
    var TPL_VAR_ALIAS = [
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g'
        ];
    var wrapVar = function (varName, seriesIdx) {
        return '{' + varName + (seriesIdx == null ? '' : seriesIdx) + '}';
    };
    /**
     * Template formatter
     * @param {string} tpl
     * @param {Array.<Object>|Object} paramsList
     * @param {boolean} [encode=false]
     * @return {string}
     */
    formatUtil.formatTpl = function (tpl, paramsList, encode) {
        if (!zrUtil.isArray(paramsList)) {
            paramsList = [paramsList];
        }
        var seriesLen = paramsList.length;
        if (!seriesLen) {
            return '';
        }
        var $vars = paramsList[0].$vars || [];
        for (var i = 0; i < $vars.length; i++) {
            var alias = TPL_VAR_ALIAS[i];
            var val = wrapVar(alias, 0);
            tpl = tpl.replace(wrapVar(alias), encode ? encodeHTML(val) : val);
        }
        for (var seriesIdx = 0; seriesIdx < seriesLen; seriesIdx++) {
            for (var k = 0; k < $vars.length; k++) {
                var val = paramsList[seriesIdx][$vars[k]];
                tpl = tpl.replace(wrapVar(TPL_VAR_ALIAS[k], seriesIdx), encode ? encodeHTML(val) : val);
            }
        }
        return tpl;
    };
    /**
     * @param {string} str
     * @return {string}
     * @inner
     */
    var s2d = function (str) {
        return str < 10 ? '0' + str : str;
    };
    /**
     * ISO Date format
     * @param {string} tpl
     * @param {number} value
     * @inner
     */
    formatUtil.formatTime = function (tpl, value) {
        if (tpl === 'week' || tpl === 'month' || tpl === 'quarter' || tpl === 'half-year' || tpl === 'year') {
            tpl = 'MM-dd\nyyyy';
        }
        var date = numberUtil.parseDate(value);
        var y = date.getFullYear();
        var M = date.getMonth() + 1;
        var d = date.getDate();
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        tpl = tpl.replace('MM', s2d(M)).toLowerCase().replace('yyyy', y).replace('yy', y % 100).replace('dd', s2d(d)).replace('d', d).replace('hh', s2d(h)).replace('h', h).replace('mm', s2d(m)).replace('m', m).replace('ss', s2d(s)).replace('s', s);
        return tpl;
    };
    /**
     * Capital first
     * @param {string} str
     * @return {string}
     */
    formatUtil.capitalFirst = function (str) {
        return str ? str.charAt(0).toUpperCase() + str.substr(1) : str;
    };
    formatUtil.truncateText = textContain.truncateText;
    return formatUtil;
});
define('zrender/core/matrix', [], function () {
    var ArrayCtor = typeof Float32Array === 'undefined' ? Array : Float32Array;
    /**
     * 3x2矩阵操作类
     * @exports zrender/tool/matrix
     */
    var matrix = {
            create: function () {
                var out = new ArrayCtor(6);
                matrix.identity(out);
                return out;
            },
            identity: function (out) {
                out[0] = 1;
                out[1] = 0;
                out[2] = 0;
                out[3] = 1;
                out[4] = 0;
                out[5] = 0;
                return out;
            },
            copy: function (out, m) {
                out[0] = m[0];
                out[1] = m[1];
                out[2] = m[2];
                out[3] = m[3];
                out[4] = m[4];
                out[5] = m[5];
                return out;
            },
            mul: function (out, m1, m2) {
                // Consider matrix.mul(m, m2, m);
                // where out is the same as m2.
                // So use temp variable to escape error.
                var out0 = m1[0] * m2[0] + m1[2] * m2[1];
                var out1 = m1[1] * m2[0] + m1[3] * m2[1];
                var out2 = m1[0] * m2[2] + m1[2] * m2[3];
                var out3 = m1[1] * m2[2] + m1[3] * m2[3];
                var out4 = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
                var out5 = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];
                out[0] = out0;
                out[1] = out1;
                out[2] = out2;
                out[3] = out3;
                out[4] = out4;
                out[5] = out5;
                return out;
            },
            translate: function (out, a, v) {
                out[0] = a[0];
                out[1] = a[1];
                out[2] = a[2];
                out[3] = a[3];
                out[4] = a[4] + v[0];
                out[5] = a[5] + v[1];
                return out;
            },
            rotate: function (out, a, rad) {
                var aa = a[0];
                var ac = a[2];
                var atx = a[4];
                var ab = a[1];
                var ad = a[3];
                var aty = a[5];
                var st = Math.sin(rad);
                var ct = Math.cos(rad);
                out[0] = aa * ct + ab * st;
                out[1] = -aa * st + ab * ct;
                out[2] = ac * ct + ad * st;
                out[3] = -ac * st + ct * ad;
                out[4] = ct * atx + st * aty;
                out[5] = ct * aty - st * atx;
                return out;
            },
            scale: function (out, a, v) {
                var vx = v[0];
                var vy = v[1];
                out[0] = a[0] * vx;
                out[1] = a[1] * vy;
                out[2] = a[2] * vx;
                out[3] = a[3] * vy;
                out[4] = a[4] * vx;
                out[5] = a[5] * vy;
                return out;
            },
            invert: function (out, a) {
                var aa = a[0];
                var ac = a[2];
                var atx = a[4];
                var ab = a[1];
                var ad = a[3];
                var aty = a[5];
                var det = aa * ad - ab * ac;
                if (!det) {
                    return null;
                }
                det = 1 / det;
                out[0] = ad * det;
                out[1] = -ab * det;
                out[2] = -ac * det;
                out[3] = aa * det;
                out[4] = (ac * aty - ad * atx) * det;
                out[5] = (ab * atx - aa * aty) * det;
                return out;
            }
        };
    return matrix;
});
define('zrender/core/vector', [], function () {
    var ArrayCtor = typeof Float32Array === 'undefined' ? Array : Float32Array;
    /**
     * @typedef {Float32Array|Array.<number>} Vector2
     */
    /**
     * 二维向量类
     * @exports zrender/tool/vector
     */
    var vector = {
            create: function (x, y) {
                var out = new ArrayCtor(2);
                if (x == null) {
                    x = 0;
                }
                if (y == null) {
                    y = 0;
                }
                out[0] = x;
                out[1] = y;
                return out;
            },
            copy: function (out, v) {
                out[0] = v[0];
                out[1] = v[1];
                return out;
            },
            clone: function (v) {
                var out = new ArrayCtor(2);
                out[0] = v[0];
                out[1] = v[1];
                return out;
            },
            set: function (out, a, b) {
                out[0] = a;
                out[1] = b;
                return out;
            },
            add: function (out, v1, v2) {
                out[0] = v1[0] + v2[0];
                out[1] = v1[1] + v2[1];
                return out;
            },
            scaleAndAdd: function (out, v1, v2, a) {
                out[0] = v1[0] + v2[0] * a;
                out[1] = v1[1] + v2[1] * a;
                return out;
            },
            sub: function (out, v1, v2) {
                out[0] = v1[0] - v2[0];
                out[1] = v1[1] - v2[1];
                return out;
            },
            len: function (v) {
                return Math.sqrt(this.lenSquare(v));
            },
            lenSquare: function (v) {
                return v[0] * v[0] + v[1] * v[1];
            },
            mul: function (out, v1, v2) {
                out[0] = v1[0] * v2[0];
                out[1] = v1[1] * v2[1];
                return out;
            },
            div: function (out, v1, v2) {
                out[0] = v1[0] / v2[0];
                out[1] = v1[1] / v2[1];
                return out;
            },
            dot: function (v1, v2) {
                return v1[0] * v2[0] + v1[1] * v2[1];
            },
            scale: function (out, v, s) {
                out[0] = v[0] * s;
                out[1] = v[1] * s;
                return out;
            },
            normalize: function (out, v) {
                var d = vector.len(v);
                if (d === 0) {
                    out[0] = 0;
                    out[1] = 0;
                } else {
                    out[0] = v[0] / d;
                    out[1] = v[1] / d;
                }
                return out;
            },
            distance: function (v1, v2) {
                return Math.sqrt((v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]));
            },
            distanceSquare: function (v1, v2) {
                return (v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]);
            },
            negate: function (out, v) {
                out[0] = -v[0];
                out[1] = -v[1];
                return out;
            },
            lerp: function (out, v1, v2, t) {
                out[0] = v1[0] + t * (v2[0] - v1[0]);
                out[1] = v1[1] + t * (v2[1] - v1[1]);
                return out;
            },
            applyTransform: function (out, v, m) {
                var x = v[0];
                var y = v[1];
                out[0] = m[0] * x + m[2] * y + m[4];
                out[1] = m[1] * x + m[3] * y + m[5];
                return out;
            },
            min: function (out, v1, v2) {
                out[0] = Math.min(v1[0], v2[0]);
                out[1] = Math.min(v1[1], v2[1]);
                return out;
            },
            max: function (out, v1, v2) {
                out[0] = Math.max(v1[0], v2[0]);
                out[1] = Math.max(v1[1], v2[1]);
                return out;
            }
        };
    vector.length = vector.len;
    vector.lengthSquare = vector.lenSquare;
    vector.dist = vector.distance;
    vector.distSquare = vector.distanceSquare;
    return vector;
});
define('echarts/coord/cartesian/Grid', ['require', 'exports', '../../util/layout', '../../coord/axisHelper', 'zrender/core/util', './Cartesian2D', './Axis2D', './GridModel', '../../CoordinateSystem'], function (require, factory) {
    var layout = require('../../util/layout');
    var axisHelper = require('../../coord/axisHelper');
    var zrUtil = require('zrender/core/util');
    var Cartesian2D = require('./Cartesian2D');
    var Axis2D = require('./Axis2D');
    var each = zrUtil.each;
    var ifAxisCrossZero = axisHelper.ifAxisCrossZero;
    var niceScaleExtent = axisHelper.niceScaleExtent;
    // 依赖 GridModel, AxisModel 做预处理
    require('./GridModel');
    /**
     * Check if the axis is used in the specified grid
     * @inner
     */
    function isAxisUsedInTheGrid(axisModel, gridModel, ecModel) {
        return axisModel.getCoordSysModel() === gridModel;
    }
    function getLabelUnionRect(axis) {
        var axisModel = axis.model;
        var labels = axisModel.getFormattedLabels();
        var textStyleModel = axisModel.getModel('axisLabel.textStyle');
        var rect;
        var step = 1;
        var labelCount = labels.length;
        if (labelCount > 40) {
            // Simple optimization for large amount of labels
            step = Math.ceil(labelCount / 40);
        }
        for (var i = 0; i < labelCount; i += step) {
            if (!axis.isLabelIgnored(i)) {
                var singleRect = textStyleModel.getTextRect(labels[i]);
                // FIXME consider label rotate
                rect ? rect.union(singleRect) : rect = singleRect;
            }
        }
        return rect;
    }
    function Grid(gridModel, ecModel, api) {
        /**
         * @type {Object.<string, module:echarts/coord/cartesian/Cartesian2D>}
         * @private
         */
        this._coordsMap = {};
        /**
         * @type {Array.<module:echarts/coord/cartesian/Cartesian>}
         * @private
         */
        this._coordsList = [];
        /**
         * @type {Object.<string, module:echarts/coord/cartesian/Axis2D>}
         * @private
         */
        this._axesMap = {};
        /**
         * @type {Array.<module:echarts/coord/cartesian/Axis2D>}
         * @private
         */
        this._axesList = [];
        this._initCartesian(gridModel, ecModel, api);
        this._model = gridModel;
    }
    var gridProto = Grid.prototype;
    gridProto.type = 'grid';
    gridProto.getRect = function () {
        return this._rect;
    };
    gridProto.update = function (ecModel, api) {
        var axesMap = this._axesMap;
        this._updateScale(ecModel, this._model);
        function ifAxisCanNotOnZero(otherAxisDim) {
            var axes = axesMap[otherAxisDim];
            for (var idx in axes) {
                if (axes.hasOwnProperty(idx)) {
                    var axis = axes[idx];
                    if (axis && (axis.type === 'category' || !ifAxisCrossZero(axis))) {
                        return true;
                    }
                }
            }
            return false;
        }
        each(axesMap.x, function (xAxis) {
            niceScaleExtent(xAxis, xAxis.model);
        });
        each(axesMap.y, function (yAxis) {
            niceScaleExtent(yAxis, yAxis.model);
        });
        // Fix configuration
        each(axesMap.x, function (xAxis) {
            // onZero can not be enabled in these two situations
            // 1. When any other axis is a category axis
            // 2. When any other axis not across 0 point
            if (ifAxisCanNotOnZero('y')) {
                xAxis.onZero = false;
            }
        });
        each(axesMap.y, function (yAxis) {
            if (ifAxisCanNotOnZero('x')) {
                yAxis.onZero = false;
            }
        });
        // Resize again if containLabel is enabled
        // FIXME It may cause getting wrong grid size in data processing stage
        this.resize(this._model, api);
    };
    /**
     * Resize the grid
     * @param {module:echarts/coord/cartesian/GridModel} gridModel
     * @param {module:echarts/ExtensionAPI} api
     */
    gridProto.resize = function (gridModel, api) {
        var gridRect = layout.getLayoutRect(gridModel.getBoxLayoutParams(), {
                width: api.getWidth(),
                height: api.getHeight()
            });
        this._rect = gridRect;
        var axesList = this._axesList;
        adjustAxes();
        // Minus label size
        if (gridModel.get('containLabel')) {
            each(axesList, function (axis) {
                if (!axis.model.get('axisLabel.inside')) {
                    var labelUnionRect = getLabelUnionRect(axis);
                    if (labelUnionRect) {
                        var dim = axis.isHorizontal() ? 'height' : 'width';
                        var margin = axis.model.get('axisLabel.margin');
                        gridRect[dim] -= labelUnionRect[dim] + margin;
                        if (axis.position === 'top') {
                            gridRect.y += labelUnionRect.height + margin;
                        } else if (axis.position === 'left') {
                            gridRect.x += labelUnionRect.width + margin;
                        }
                    }
                }
            });
            adjustAxes();
        }
        function adjustAxes() {
            each(axesList, function (axis) {
                var isHorizontal = axis.isHorizontal();
                var extent = isHorizontal ? [
                        0,
                        gridRect.width
                    ] : [
                        0,
                        gridRect.height
                    ];
                var idx = axis.inverse ? 1 : 0;
                axis.setExtent(extent[idx], extent[1 - idx]);
                updateAxisTransfrom(axis, isHorizontal ? gridRect.x : gridRect.y);
            });
        }
    };
    /**
     * @param {string} axisType
     * @param {ndumber} [axisIndex]
     */
    gridProto.getAxis = function (axisType, axisIndex) {
        var axesMapOnDim = this._axesMap[axisType];
        if (axesMapOnDim != null) {
            if (axisIndex == null) {
                // Find first axis
                for (var name in axesMapOnDim) {
                    if (axesMapOnDim.hasOwnProperty(name)) {
                        return axesMapOnDim[name];
                    }
                }
            }
            return axesMapOnDim[axisIndex];
        }
    };
    gridProto.getCartesian = function (xAxisIndex, yAxisIndex) {
        if (xAxisIndex != null && yAxisIndex != null) {
            var key = 'x' + xAxisIndex + 'y' + yAxisIndex;
            return this._coordsMap[key];
        } else {
            // When only xAxisIndex or yAxisIndex given, find its first cartesian.
            for (var i = 0, coordList = this._coordsList; i < coordList.length; i++) {
                if (coordList[i].getAxis('x').index === xAxisIndex || coordList[i].getAxis('y').index === yAxisIndex) {
                    return coordList[i];
                }
            }
        }
    };
    /**
     * @implements
     * see {module:echarts/CoodinateSystem}
     */
    gridProto.convertToPixel = function (ecModel, finder, value) {
        var target = this._findConvertTarget(ecModel, finder);
        return target.cartesian ? target.cartesian.dataToPoint(value) : target.axis ? target.axis.toGlobalCoord(target.axis.dataToCoord(value)) : null;
    };
    /**
     * @implements
     * see {module:echarts/CoodinateSystem}
     */
    gridProto.convertFromPixel = function (ecModel, finder, value) {
        var target = this._findConvertTarget(ecModel, finder);
        return target.cartesian ? target.cartesian.pointToData(value) : target.axis ? target.axis.coordToData(target.axis.toLocalCoord(value)) : null;
    };
    /**
     * @inner
     */
    gridProto._findConvertTarget = function (ecModel, finder) {
        var seriesModel = finder.seriesModel;
        var xAxisModel = finder.xAxisModel || seriesModel && seriesModel.getReferringComponents('xAxis')[0];
        var yAxisModel = finder.yAxisModel || seriesModel && seriesModel.getReferringComponents('yAxis')[0];
        var gridModel = finder.gridModel;
        var coordsList = this._coordsList;
        var cartesian;
        var axis;
        if (seriesModel) {
            cartesian = seriesModel.coordinateSystem;
            zrUtil.indexOf(coordsList, cartesian) < 0 && (cartesian = null);
        } else if (xAxisModel && yAxisModel) {
            cartesian = this.getCartesian(xAxisModel.componentIndex, yAxisModel.componentIndex);
        } else if (xAxisModel) {
            axis = this.getAxis('x', xAxisModel.componentIndex);
        } else if (yAxisModel) {
            axis = this.getAxis('y', yAxisModel.componentIndex);
        }    // Lowest priority.
        else if (gridModel) {
            var grid = gridModel.coordinateSystem;
            if (grid === this) {
                cartesian = this._coordsList[0];
            }
        }
        return {
            cartesian: cartesian,
            axis: axis
        };
    };
    /**
     * @implements
     * see {module:echarts/CoodinateSystem}
     */
    gridProto.containPoint = function (point) {
        var coord = this._coordsList[0];
        if (coord) {
            return coord.containPoint(point);
        }
    };
    /**
     * Initialize cartesian coordinate systems
     * @private
     */
    gridProto._initCartesian = function (gridModel, ecModel, api) {
        var axisPositionUsed = {
                left: false,
                right: false,
                top: false,
                bottom: false
            };
        var axesMap = {
                x: {},
                y: {}
            };
        var axesCount = {
                x: 0,
                y: 0
            };
        /// Create axis
        ecModel.eachComponent('xAxis', createAxisCreator('x'), this);
        ecModel.eachComponent('yAxis', createAxisCreator('y'), this);
        if (!axesCount.x || !axesCount.y) {
            // Roll back when there no either x or y axis
            this._axesMap = {};
            this._axesList = [];
            return;
        }
        this._axesMap = axesMap;
        /// Create cartesian2d
        each(axesMap.x, function (xAxis, xAxisIndex) {
            each(axesMap.y, function (yAxis, yAxisIndex) {
                var key = 'x' + xAxisIndex + 'y' + yAxisIndex;
                var cartesian = new Cartesian2D(key);
                cartesian.grid = this;
                this._coordsMap[key] = cartesian;
                this._coordsList.push(cartesian);
                cartesian.addAxis(xAxis);
                cartesian.addAxis(yAxis);
            }, this);
        }, this);
        function createAxisCreator(axisType) {
            return function (axisModel, idx) {
                if (!isAxisUsedInTheGrid(axisModel, gridModel, ecModel)) {
                    return;
                }
                var axisPosition = axisModel.get('position');
                if (axisType === 'x') {
                    // Fix position
                    if (axisPosition !== 'top' && axisPosition !== 'bottom') {
                        // Default bottom of X
                        axisPosition = 'bottom';
                        if (axisPositionUsed[axisPosition]) {
                            axisPosition = axisPosition === 'top' ? 'bottom' : 'top';
                        }
                    }
                } else {
                    // Fix position
                    if (axisPosition !== 'left' && axisPosition !== 'right') {
                        // Default left of Y
                        axisPosition = 'left';
                        if (axisPositionUsed[axisPosition]) {
                            axisPosition = axisPosition === 'left' ? 'right' : 'left';
                        }
                    }
                }
                axisPositionUsed[axisPosition] = true;
                var axis = new Axis2D(axisType, axisHelper.createScaleByModel(axisModel), [
                        0,
                        0
                    ], axisModel.get('type'), axisPosition);
                var isCategory = axis.type === 'category';
                axis.onBand = isCategory && axisModel.get('boundaryGap');
                axis.inverse = axisModel.get('inverse');
                axis.onZero = axisModel.get('axisLine.onZero');
                // Inject axis into axisModel
                axisModel.axis = axis;
                // Inject axisModel into axis
                axis.model = axisModel;
                // Inject grid info axis
                axis.grid = this;
                // Index of axis, can be used as key
                axis.index = idx;
                this._axesList.push(axis);
                axesMap[axisType][idx] = axis;
                axesCount[axisType]++;
            };
        }
    };
    /**
     * Update cartesian properties from series
     * @param  {module:echarts/model/Option} option
     * @private
     */
    gridProto._updateScale = function (ecModel, gridModel) {
        // Reset scale
        zrUtil.each(this._axesList, function (axis) {
            axis.scale.setExtent(Infinity, -Infinity);
        });
        ecModel.eachSeries(function (seriesModel) {
            if (isCartesian2D(seriesModel)) {
                var axesModels = findAxesModels(seriesModel, ecModel);
                var xAxisModel = axesModels[0];
                var yAxisModel = axesModels[1];
                if (!isAxisUsedInTheGrid(xAxisModel, gridModel, ecModel) || !isAxisUsedInTheGrid(yAxisModel, gridModel, ecModel)) {
                    return;
                }
                var cartesian = this.getCartesian(xAxisModel.componentIndex, yAxisModel.componentIndex);
                var data = seriesModel.getData();
                var xAxis = cartesian.getAxis('x');
                var yAxis = cartesian.getAxis('y');
                if (data.type === 'list') {
                    unionExtent(data, xAxis, seriesModel);
                    unionExtent(data, yAxis, seriesModel);
                }
            }
        }, this);
        function unionExtent(data, axis, seriesModel) {
            each(seriesModel.coordDimToDataDim(axis.dim), function (dim) {
                axis.scale.unionExtentFromData(data, dim);
            });
        }
    };
    /**
     * @inner
     */
    function updateAxisTransfrom(axis, coordBase) {
        var axisExtent = axis.getExtent();
        var axisExtentSum = axisExtent[0] + axisExtent[1];
        // Fast transform
        axis.toGlobalCoord = axis.dim === 'x' ? function (coord) {
            return coord + coordBase;
        } : function (coord) {
            return axisExtentSum - coord + coordBase;
        };
        axis.toLocalCoord = axis.dim === 'x' ? function (coord) {
            return coord - coordBase;
        } : function (coord) {
            return axisExtentSum - coord + coordBase;
        };
    }
    var axesTypes = [
            'xAxis',
            'yAxis'
        ];
    /**
     * @inner
     */
    function findAxesModels(seriesModel, ecModel) {
        return zrUtil.map(axesTypes, function (axisType) {
            var axisModel = seriesModel.getReferringComponents(axisType)[0];
            if (true) {
                if (!axisModel) {
                    throw new Error(axisType + ' "' + zrUtil.retrieve(seriesModel.get(axisType + 'Index'), seriesModel.get(axisType + 'Id'), 0) + '" not found');
                }
            }
            return axisModel;
        });
    }
    /**
     * @inner
     */
    function isCartesian2D(seriesModel) {
        return seriesModel.get('coordinateSystem') === 'cartesian2d';
    }
    Grid.create = function (ecModel, api) {
        var grids = [];
        ecModel.eachComponent('grid', function (gridModel, idx) {
            var grid = new Grid(gridModel, ecModel, api);
            grid.name = 'grid_' + idx;
            grid.resize(gridModel, api);
            gridModel.coordinateSystem = grid;
            grids.push(grid);
        });
        // Inject the coordinateSystems into seriesModel
        ecModel.eachSeries(function (seriesModel) {
            if (!isCartesian2D(seriesModel)) {
                return;
            }
            var axesModels = findAxesModels(seriesModel, ecModel);
            var xAxisModel = axesModels[0];
            var yAxisModel = axesModels[1];
            var gridModel = xAxisModel.getCoordSysModel();
            if (true) {
                if (!gridModel) {
                    throw new Error('Grid "' + zrUtil.retrieve(xAxisModel.get('gridIndex'), xAxisModel.get('gridId'), 0) + '" not found');
                }
                if (xAxisModel.getCoordSysModel() !== yAxisModel.getCoordSysModel()) {
                    throw new Error('xAxis and yAxis must use the same grid');
                }
            }
            var grid = gridModel.coordinateSystem;
            seriesModel.coordinateSystem = grid.getCartesian(xAxisModel.componentIndex, yAxisModel.componentIndex);
        });
        return grids;
    };
    // For deciding which dimensions to use when creating list data
    Grid.dimensions = Cartesian2D.prototype.dimensions;
    require('../../CoordinateSystem').register('cartesian2d', Grid);
    return Grid;
});
define('echarts/chart/bar/BarSeries', ['require', './BaseBarSeries'], function (require) {
    return require('./BaseBarSeries').extend({
        type: 'series.bar',
        dependencies: [
            'grid',
            'polar'
        ],
        brushSelector: 'rect'
    });
});
define('echarts/chart/bar/BarView', ['require', 'zrender/core/util', '../../util/graphic', './helper', '../../model/Model', './barItemStyle', '../../echarts'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var graphic = require('../../util/graphic');
    var helper = require('./helper');
    var BAR_BORDER_WIDTH_QUERY = [
            'itemStyle',
            'normal',
            'barBorderWidth'
        ];
    // FIXME
    // Just for compatible with ec2.
    zrUtil.extend(require('../../model/Model').prototype, require('./barItemStyle'));
    var BarView = require('../../echarts').extendChartView({
            type: 'bar',
            render: function (seriesModel, ecModel, api) {
                var coordinateSystemType = seriesModel.get('coordinateSystem');
                if (coordinateSystemType === 'cartesian2d') {
                    this._renderOnCartesian(seriesModel, ecModel, api);
                }
                return this.group;
            },
            dispose: zrUtil.noop,
            _renderOnCartesian: function (seriesModel, ecModel, api) {
                var group = this.group;
                var data = seriesModel.getData();
                var oldData = this._data;
                var cartesian = seriesModel.coordinateSystem;
                var baseAxis = cartesian.getBaseAxis();
                var isHorizontal = baseAxis.isHorizontal();
                var animationModel = seriesModel.isAnimationEnabled() ? seriesModel : null;
                data.diff(oldData).add(function (dataIndex) {
                    if (!data.hasValue(dataIndex)) {
                        return;
                    }
                    var itemModel = data.getItemModel(dataIndex);
                    var layout = getRectItemLayout(data, dataIndex, itemModel);
                    var el = createRect(data, dataIndex, itemModel, layout, isHorizontal, animationModel);
                    data.setItemGraphicEl(dataIndex, el);
                    group.add(el);
                    updateStyle(el, data, dataIndex, itemModel, layout, seriesModel, isHorizontal);
                }).update(function (newIndex, oldIndex) {
                    var el = oldData.getItemGraphicEl(oldIndex);
                    if (!data.hasValue(newIndex)) {
                        group.remove(el);
                        return;
                    }
                    var itemModel = data.getItemModel(newIndex);
                    var layout = getRectItemLayout(data, newIndex, itemModel);
                    if (el) {
                        graphic.updateProps(el, { shape: layout }, animationModel, newIndex);
                    } else {
                        el = createRect(data, newIndex, itemModel, layout, isHorizontal, animationModel, true);
                    }
                    data.setItemGraphicEl(newIndex, el);
                    // Add back
                    group.add(el);
                    updateStyle(el, data, newIndex, itemModel, layout, seriesModel, isHorizontal);
                }).remove(function (dataIndex) {
                    var el = oldData.getItemGraphicEl(dataIndex);
                    el && removeRect(dataIndex, animationModel, el);
                }).execute();
                this._data = data;
            },
            remove: function (ecModel, api) {
                var group = this.group;
                var data = this._data;
                if (ecModel.get('animation')) {
                    if (data) {
                        data.eachItemGraphicEl(function (el) {
                            removeRect(el.dataIndex, ecModel, el);
                        });
                    }
                } else {
                    group.removeAll();
                }
            }
        });
    function createRect(data, dataIndex, itemModel, layout, isHorizontal, animationModel, isUpdate) {
        var rect = new graphic.Rect({ shape: zrUtil.extend({}, layout) });
        // Animation
        if (animationModel) {
            var rectShape = rect.shape;
            var animateProperty = isHorizontal ? 'height' : 'width';
            var animateTarget = {};
            rectShape[animateProperty] = 0;
            animateTarget[animateProperty] = layout[animateProperty];
            graphic[isUpdate ? 'updateProps' : 'initProps'](rect, { shape: animateTarget }, animationModel, dataIndex);
        }
        return rect;
    }
    function removeRect(dataIndex, animationModel, el) {
        // Not show text when animating
        el.style.text = '';
        graphic.updateProps(el, { shape: { width: 0 } }, animationModel, dataIndex, function () {
            el.parent && el.parent.remove(el);
        });
    }
    function getRectItemLayout(data, dataIndex, itemModel) {
        var layout = data.getItemLayout(dataIndex);
        var fixedLineWidth = getLineWidth(itemModel, layout);
        // fix layout with lineWidth
        var signX = layout.width > 0 ? 1 : -1;
        var signY = layout.height > 0 ? 1 : -1;
        return {
            x: layout.x + signX * fixedLineWidth / 2,
            y: layout.y + signY * fixedLineWidth / 2,
            width: layout.width - signX * fixedLineWidth,
            height: layout.height - signY * fixedLineWidth
        };
    }
    function updateStyle(el, data, dataIndex, itemModel, layout, seriesModel, isHorizontal) {
        var color = data.getItemVisual(dataIndex, 'color');
        var opacity = data.getItemVisual(dataIndex, 'opacity');
        var itemStyleModel = itemModel.getModel('itemStyle.normal');
        var hoverStyle = itemModel.getModel('itemStyle.emphasis').getBarItemStyle();
        el.setShape('r', itemStyleModel.get('barBorderRadius') || 0);
        el.useStyle(zrUtil.defaults({
            fill: color,
            opacity: opacity
        }, itemStyleModel.getBarItemStyle()));
        var labelPositionOutside = isHorizontal ? layout.height > 0 ? 'bottom' : 'top' : layout.width > 0 ? 'left' : 'right';
        helper.setLabel(el.style, hoverStyle, itemModel, color, seriesModel, dataIndex, labelPositionOutside);
        graphic.setHoverStyle(el, hoverStyle);
    }
    // In case width or height are too small.
    function getLineWidth(itemModel, rawLayout) {
        var lineWidth = itemModel.get(BAR_BORDER_WIDTH_QUERY) || 0;
        return Math.min(lineWidth, Math.abs(rawLayout.width), Math.abs(rawLayout.height));
    }
    return BarView;
});
define('echarts/layout/barGrid', ['require', 'zrender/core/util', '../util/number'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var numberUtil = require('../util/number');
    var parsePercent = numberUtil.parsePercent;
    function getSeriesStackId(seriesModel) {
        return seriesModel.get('stack') || '__ec_stack_' + seriesModel.seriesIndex;
    }
    function getAxisKey(axis) {
        return axis.dim + axis.index;
    }
    function calBarWidthAndOffset(barSeries, api) {
        // Columns info on each category axis. Key is cartesian name
        var columnsMap = {};
        zrUtil.each(barSeries, function (seriesModel, idx) {
            var data = seriesModel.getData();
            var cartesian = seriesModel.coordinateSystem;
            var baseAxis = cartesian.getBaseAxis();
            var axisExtent = baseAxis.getExtent();
            var bandWidth = baseAxis.type === 'category' ? baseAxis.getBandWidth() : Math.abs(axisExtent[1] - axisExtent[0]) / data.count();
            var columnsOnAxis = columnsMap[getAxisKey(baseAxis)] || {
                    bandWidth: bandWidth,
                    remainedWidth: bandWidth,
                    autoWidthCount: 0,
                    categoryGap: '20%',
                    gap: '30%',
                    stacks: {}
                };
            var stacks = columnsOnAxis.stacks;
            columnsMap[getAxisKey(baseAxis)] = columnsOnAxis;
            var stackId = getSeriesStackId(seriesModel);
            if (!stacks[stackId]) {
                columnsOnAxis.autoWidthCount++;
            }
            stacks[stackId] = stacks[stackId] || {
                width: 0,
                maxWidth: 0
            };
            var barWidth = parsePercent(seriesModel.get('barWidth'), bandWidth);
            var barMaxWidth = parsePercent(seriesModel.get('barMaxWidth'), bandWidth);
            var barGap = seriesModel.get('barGap');
            var barCategoryGap = seriesModel.get('barCategoryGap');
            // Caution: In a single coordinate system, these barGrid attributes
            // will be shared by series. Consider that they have default values,
            // only the attributes set on the last series will work.
            // Do not change this fact unless there will be a break change.
            // TODO
            if (barWidth && !stacks[stackId].width) {
                barWidth = Math.min(columnsOnAxis.remainedWidth, barWidth);
                stacks[stackId].width = barWidth;
                columnsOnAxis.remainedWidth -= barWidth;
            }
            barMaxWidth && (stacks[stackId].maxWidth = barMaxWidth);
            barGap != null && (columnsOnAxis.gap = barGap);
            barCategoryGap != null && (columnsOnAxis.categoryGap = barCategoryGap);
        });
        var result = {};
        zrUtil.each(columnsMap, function (columnsOnAxis, coordSysName) {
            result[coordSysName] = {};
            var stacks = columnsOnAxis.stacks;
            var bandWidth = columnsOnAxis.bandWidth;
            var categoryGap = parsePercent(columnsOnAxis.categoryGap, bandWidth);
            var barGapPercent = parsePercent(columnsOnAxis.gap, 1);
            var remainedWidth = columnsOnAxis.remainedWidth;
            var autoWidthCount = columnsOnAxis.autoWidthCount;
            var autoWidth = (remainedWidth - categoryGap) / (autoWidthCount + (autoWidthCount - 1) * barGapPercent);
            autoWidth = Math.max(autoWidth, 0);
            // Find if any auto calculated bar exceeded maxBarWidth
            zrUtil.each(stacks, function (column, stack) {
                var maxWidth = column.maxWidth;
                if (!column.width && maxWidth && maxWidth < autoWidth) {
                    maxWidth = Math.min(maxWidth, remainedWidth);
                    remainedWidth -= maxWidth;
                    column.width = maxWidth;
                    autoWidthCount--;
                }
            });
            // Recalculate width again
            autoWidth = (remainedWidth - categoryGap) / (autoWidthCount + (autoWidthCount - 1) * barGapPercent);
            autoWidth = Math.max(autoWidth, 0);
            var widthSum = 0;
            var lastColumn;
            zrUtil.each(stacks, function (column, idx) {
                if (!column.width) {
                    column.width = autoWidth;
                }
                lastColumn = column;
                widthSum += column.width * (1 + barGapPercent);
            });
            if (lastColumn) {
                widthSum -= lastColumn.width * barGapPercent;
            }
            var offset = -widthSum / 2;
            zrUtil.each(stacks, function (column, stackId) {
                result[coordSysName][stackId] = result[coordSysName][stackId] || {
                    offset: offset,
                    width: column.width
                };
                offset += column.width * (1 + barGapPercent);
            });
        });
        return result;
    }
    /**
     * @param {string} seriesType
     * @param {module:echarts/model/Global} ecModel
     * @param {module:echarts/ExtensionAPI} api
     */
    function barLayoutGrid(seriesType, ecModel, api) {
        var barWidthAndOffset = calBarWidthAndOffset(zrUtil.filter(ecModel.getSeriesByType(seriesType), function (seriesModel) {
                return !ecModel.isSeriesFiltered(seriesModel) && seriesModel.coordinateSystem && seriesModel.coordinateSystem.type === 'cartesian2d';
            }));
        var lastStackCoords = {};
        var lastStackCoordsOrigin = {};
        ecModel.eachSeriesByType(seriesType, function (seriesModel) {
            var data = seriesModel.getData();
            var cartesian = seriesModel.coordinateSystem;
            var baseAxis = cartesian.getBaseAxis();
            var stackId = getSeriesStackId(seriesModel);
            var columnLayoutInfo = barWidthAndOffset[getAxisKey(baseAxis)][stackId];
            var columnOffset = columnLayoutInfo.offset;
            var columnWidth = columnLayoutInfo.width;
            var valueAxis = cartesian.getOtherAxis(baseAxis);
            var barMinHeight = seriesModel.get('barMinHeight') || 0;
            var valueAxisStart = baseAxis.onZero ? valueAxis.toGlobalCoord(valueAxis.dataToCoord(0)) : valueAxis.getGlobalExtent()[0];
            var coords = cartesian.dataToPoints(data, true);
            lastStackCoords[stackId] = lastStackCoords[stackId] || [];
            lastStackCoordsOrigin[stackId] = lastStackCoordsOrigin[stackId] || [];
            // Fix #4243
            data.setLayout({
                offset: columnOffset,
                size: columnWidth
            });
            data.each(valueAxis.dim, function (value, idx) {
                if (isNaN(value)) {
                    return;
                }
                if (!lastStackCoords[stackId][idx]) {
                    lastStackCoords[stackId][idx] = {
                        p: valueAxisStart,
                        n: valueAxisStart
                    };
                    lastStackCoordsOrigin[stackId][idx] = {
                        p: valueAxisStart,
                        n: valueAxisStart
                    };
                }
                var sign = value >= 0 ? 'p' : 'n';
                var coord = coords[idx];
                var lastCoord = lastStackCoords[stackId][idx][sign];
                var lastCoordOrigin = lastStackCoordsOrigin[stackId][idx][sign];
                var x;
                var y;
                var width;
                var height;
                if (valueAxis.isHorizontal()) {
                    x = lastCoord;
                    y = coord[1] + columnOffset;
                    width = coord[0] - lastCoordOrigin;
                    height = columnWidth;
                    lastStackCoordsOrigin[stackId][idx][sign] += width;
                    if (Math.abs(width) < barMinHeight) {
                        width = (width < 0 ? -1 : 1) * barMinHeight;
                    }
                    lastStackCoords[stackId][idx][sign] += width;
                } else {
                    x = coord[0] + columnOffset;
                    y = lastCoord;
                    width = columnWidth;
                    height = coord[1] - lastCoordOrigin;
                    lastStackCoordsOrigin[stackId][idx][sign] += height;
                    if (Math.abs(height) < barMinHeight) {
                        // Include zero to has a positive bar
                        height = (height <= 0 ? -1 : 1) * barMinHeight;
                    }
                    lastStackCoords[stackId][idx][sign] += height;
                }
                data.setItemLayout(idx, {
                    x: x,
                    y: y,
                    width: width,
                    height: height
                });
            }, true);
        }, this);
    }
    return barLayoutGrid;
});
define('echarts/chart/line/LineSeries', ['require', '../helper/createListFromArray', '../../model/Series'], function (require) {
    'use strict';
    var createListFromArray = require('../helper/createListFromArray');
    var SeriesModel = require('../../model/Series');
    return SeriesModel.extend({
        type: 'series.line',
        dependencies: [
            'grid',
            'polar'
        ],
        getInitialData: function (option, ecModel) {
            if (true) {
                var coordSys = option.coordinateSystem;
                if (coordSys !== 'polar' && coordSys !== 'cartesian2d') {
                    throw new Error('Line not support coordinateSystem besides cartesian and polar');
                }
            }
            return createListFromArray(option.data, this, ecModel);
        },
        defaultOption: {
            zlevel: 0,
            z: 2,
            coordinateSystem: 'cartesian2d',
            legendHoverLink: true,
            hoverAnimation: true,
            clipOverflow: true,
            label: { normal: { position: 'top' } },
            lineStyle: {
                normal: {
                    width: 2,
                    type: 'solid'
                }
            },
            step: false,
            smooth: false,
            smoothMonotone: null,
            symbol: 'emptyCircle',
            symbolSize: 4,
            symbolRotate: null,
            showSymbol: true,
            showAllSymbol: false,
            connectNulls: false,
            sampling: 'none',
            animationEasing: 'linear',
            progressive: 0,
            hoverLayerThreshold: Infinity
        }
    });
});
define('echarts/chart/line/LineView', ['require', 'zrender/core/util', '../helper/SymbolDraw', '../helper/Symbol', './lineAnimationDiff', '../../util/graphic', '../../util/model', './poly', '../../view/Chart'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var SymbolDraw = require('../helper/SymbolDraw');
    var Symbol = require('../helper/Symbol');
    var lineAnimationDiff = require('./lineAnimationDiff');
    var graphic = require('../../util/graphic');
    var modelUtil = require('../../util/model');
    var polyHelper = require('./poly');
    var ChartView = require('../../view/Chart');
    function isPointsSame(points1, points2) {
        if (points1.length !== points2.length) {
            return;
        }
        for (var i = 0; i < points1.length; i++) {
            var p1 = points1[i];
            var p2 = points2[i];
            if (p1[0] !== p2[0] || p1[1] !== p2[1]) {
                return;
            }
        }
        return true;
    }
    function getSmooth(smooth) {
        return typeof smooth === 'number' ? smooth : smooth ? 0.3 : 0;
    }
    function getAxisExtentWithGap(axis) {
        var extent = axis.getGlobalExtent();
        if (axis.onBand) {
            // Remove extra 1px to avoid line miter in clipped edge
            var halfBandWidth = axis.getBandWidth() / 2 - 1;
            var dir = extent[1] > extent[0] ? 1 : -1;
            extent[0] += dir * halfBandWidth;
            extent[1] -= dir * halfBandWidth;
        }
        return extent;
    }
    function sign(val) {
        return val >= 0 ? 1 : -1;
    }
    /**
     * @param {module:echarts/coord/cartesian/Cartesian2D|module:echarts/coord/polar/Polar} coordSys
     * @param {module:echarts/data/List} data
     * @param {Array.<Array.<number>>} points
     * @private
     */
    function getStackedOnPoints(coordSys, data) {
        var baseAxis = coordSys.getBaseAxis();
        var valueAxis = coordSys.getOtherAxis(baseAxis);
        var valueStart = baseAxis.onZero ? 0 : valueAxis.scale.getExtent()[0];
        var valueDim = valueAxis.dim;
        var baseDataOffset = valueDim === 'x' || valueDim === 'radius' ? 1 : 0;
        return data.mapArray([valueDim], function (val, idx) {
            var stackedOnSameSign;
            var stackedOn = data.stackedOn;
            // Find first stacked value with same sign
            while (stackedOn && sign(stackedOn.get(valueDim, idx)) === sign(val)) {
                stackedOnSameSign = stackedOn;
                break;
            }
            var stackedData = [];
            stackedData[baseDataOffset] = data.get(baseAxis.dim, idx);
            stackedData[1 - baseDataOffset] = stackedOnSameSign ? stackedOnSameSign.get(valueDim, idx, true) : valueStart;
            return coordSys.dataToPoint(stackedData);
        }, true);
    }
    function createGridClipShape(cartesian, hasAnimation, seriesModel) {
        var xExtent = getAxisExtentWithGap(cartesian.getAxis('x'));
        var yExtent = getAxisExtentWithGap(cartesian.getAxis('y'));
        var isHorizontal = cartesian.getBaseAxis().isHorizontal();
        var x = Math.min(xExtent[0], xExtent[1]);
        var y = Math.min(yExtent[0], yExtent[1]);
        var width = Math.max(xExtent[0], xExtent[1]) - x;
        var height = Math.max(yExtent[0], yExtent[1]) - y;
        var lineWidth = seriesModel.get('lineStyle.normal.width') || 2;
        // Expand clip shape to avoid clipping when line value exceeds axis
        var expandSize = seriesModel.get('clipOverflow') ? lineWidth / 2 : Math.max(width, height);
        if (isHorizontal) {
            y -= expandSize;
            height += expandSize * 2;
        } else {
            x -= expandSize;
            width += expandSize * 2;
        }
        var clipPath = new graphic.Rect({
                shape: {
                    x: x,
                    y: y,
                    width: width,
                    height: height
                }
            });
        if (hasAnimation) {
            clipPath.shape[isHorizontal ? 'width' : 'height'] = 0;
            graphic.initProps(clipPath, {
                shape: {
                    width: width,
                    height: height
                }
            }, seriesModel);
        }
        return clipPath;
    }
    function createPolarClipShape(polar, hasAnimation, seriesModel) {
        var angleAxis = polar.getAngleAxis();
        var radiusAxis = polar.getRadiusAxis();
        var radiusExtent = radiusAxis.getExtent();
        var angleExtent = angleAxis.getExtent();
        var RADIAN = Math.PI / 180;
        var clipPath = new graphic.Sector({
                shape: {
                    cx: polar.cx,
                    cy: polar.cy,
                    r0: radiusExtent[0],
                    r: radiusExtent[1],
                    startAngle: -angleExtent[0] * RADIAN,
                    endAngle: -angleExtent[1] * RADIAN,
                    clockwise: angleAxis.inverse
                }
            });
        if (hasAnimation) {
            clipPath.shape.endAngle = -angleExtent[0] * RADIAN;
            graphic.initProps(clipPath, { shape: { endAngle: -angleExtent[1] * RADIAN } }, seriesModel);
        }
        return clipPath;
    }
    function createClipShape(coordSys, hasAnimation, seriesModel) {
        return coordSys.type === 'polar' ? createPolarClipShape(coordSys, hasAnimation, seriesModel) : createGridClipShape(coordSys, hasAnimation, seriesModel);
    }
    function turnPointsIntoStep(points, coordSys, stepTurnAt) {
        var baseAxis = coordSys.getBaseAxis();
        var baseIndex = baseAxis.dim === 'x' || baseAxis.dim === 'radius' ? 0 : 1;
        var stepPoints = [];
        for (var i = 0; i < points.length - 1; i++) {
            var nextPt = points[i + 1];
            var pt = points[i];
            stepPoints.push(pt);
            var stepPt = [];
            switch (stepTurnAt) {
            case 'end':
                stepPt[baseIndex] = nextPt[baseIndex];
                stepPt[1 - baseIndex] = pt[1 - baseIndex];
                // default is start
                stepPoints.push(stepPt);
                break;
            case 'middle':
                // default is start
                var middle = (pt[baseIndex] + nextPt[baseIndex]) / 2;
                var stepPt2 = [];
                stepPt[baseIndex] = stepPt2[baseIndex] = middle;
                stepPt[1 - baseIndex] = pt[1 - baseIndex];
                stepPt2[1 - baseIndex] = nextPt[1 - baseIndex];
                stepPoints.push(stepPt);
                stepPoints.push(stepPt2);
                break;
            default:
                stepPt[baseIndex] = pt[baseIndex];
                stepPt[1 - baseIndex] = nextPt[1 - baseIndex];
                // default is start
                stepPoints.push(stepPt);
            }
        }
        // Last points
        points[i] && stepPoints.push(points[i]);
        return stepPoints;
    }
    function getVisualGradient(data, coordSys) {
        var visualMetaList = data.getVisual('visualMeta');
        if (!visualMetaList || !visualMetaList.length || !data.count()) {
            // When data.count() is 0, gradient range can not be calculated.
            return;
        }
        var visualMeta;
        for (var i = visualMetaList.length - 1; i >= 0; i--) {
            // Can only be x or y
            if (visualMetaList[i].dimension < 2) {
                visualMeta = visualMetaList[i];
                break;
            }
        }
        if (!visualMeta || coordSys.type !== 'cartesian2d') {
            if (true) {
                console.warn('Visual map on line style only support x or y dimension.');
            }
            return;
        }
        // If the area to be rendered is bigger than area defined by LinearGradient,
        // the canvas spec prescribes that the color of the first stop and the last
        // stop should be used. But if two stops are added at offset 0, in effect
        // browsers use the color of the second stop to render area outside
        // LinearGradient. So we can only infinitesimally extend area defined in
        // LinearGradient to render `outerColors`.
        var dimension = visualMeta.dimension;
        var dimName = data.dimensions[dimension];
        var axis = coordSys.getAxis(dimName);
        // dataToCoor mapping may not be linear, but must be monotonic.
        var colorStops = zrUtil.map(visualMeta.stops, function (stop) {
                return {
                    coord: axis.toGlobalCoord(axis.dataToCoord(stop.value)),
                    color: stop.color
                };
            });
        var stopLen = colorStops.length;
        var outerColors = visualMeta.outerColors.slice();
        if (stopLen && colorStops[0].coord > colorStops[stopLen - 1].coord) {
            colorStops.reverse();
            outerColors.reverse();
        }
        var tinyExtent = 10;
        // Arbitrary value: 10px
        var minCoord = colorStops[0].coord - tinyExtent;
        var maxCoord = colorStops[stopLen - 1].coord + tinyExtent;
        var coordSpan = maxCoord - minCoord;
        if (coordSpan < 0.001) {
            return 'transparent';
        }
        zrUtil.each(colorStops, function (stop) {
            stop.offset = (stop.coord - minCoord) / coordSpan;
        });
        colorStops.push({
            offset: stopLen ? colorStops[stopLen - 1].offset : 0.5,
            color: outerColors[1] || 'transparent'
        });
        colorStops.unshift({
            offset: stopLen ? colorStops[0].offset : 0.5,
            color: outerColors[0] || 'transparent'
        });
        // zrUtil.each(colorStops, function (colorStop) {
        //     // Make sure each offset has rounded px to avoid not sharp edge
        //     colorStop.offset = (Math.round(colorStop.offset * (end - start) + start) - start) / (end - start);
        // });
        var gradient = new graphic.LinearGradient(0, 0, 0, 0, colorStops, true);
        gradient[dimName] = minCoord;
        gradient[dimName + '2'] = maxCoord;
        return gradient;
    }
    return ChartView.extend({
        type: 'line',
        init: function () {
            var lineGroup = new graphic.Group();
            var symbolDraw = new SymbolDraw();
            this.group.add(symbolDraw.group);
            this._symbolDraw = symbolDraw;
            this._lineGroup = lineGroup;
        },
        render: function (seriesModel, ecModel, api) {
            var coordSys = seriesModel.coordinateSystem;
            var group = this.group;
            var data = seriesModel.getData();
            var lineStyleModel = seriesModel.getModel('lineStyle.normal');
            var areaStyleModel = seriesModel.getModel('areaStyle.normal');
            var points = data.mapArray(data.getItemLayout, true);
            var isCoordSysPolar = coordSys.type === 'polar';
            var prevCoordSys = this._coordSys;
            var symbolDraw = this._symbolDraw;
            var polyline = this._polyline;
            var polygon = this._polygon;
            var lineGroup = this._lineGroup;
            var hasAnimation = seriesModel.get('animation');
            var isAreaChart = !areaStyleModel.isEmpty();
            var stackedOnPoints = getStackedOnPoints(coordSys, data);
            var showSymbol = seriesModel.get('showSymbol');
            var isSymbolIgnore = showSymbol && !isCoordSysPolar && !seriesModel.get('showAllSymbol') && this._getSymbolIgnoreFunc(data, coordSys);
            // Remove temporary symbols
            var oldData = this._data;
            oldData && oldData.eachItemGraphicEl(function (el, idx) {
                if (el.__temp) {
                    group.remove(el);
                    oldData.setItemGraphicEl(idx, null);
                }
            });
            // Remove previous created symbols if showSymbol changed to false
            if (!showSymbol) {
                symbolDraw.remove();
            }
            group.add(lineGroup);
            // FIXME step not support polar
            var step = !isCoordSysPolar && seriesModel.get('step');
            // Initialization animation or coordinate system changed
            if (!(polyline && prevCoordSys.type === coordSys.type && step === this._step)) {
                showSymbol && symbolDraw.updateData(data, isSymbolIgnore);
                if (step) {
                    // TODO If stacked series is not step
                    points = turnPointsIntoStep(points, coordSys, step);
                    stackedOnPoints = turnPointsIntoStep(stackedOnPoints, coordSys, step);
                }
                polyline = this._newPolyline(points, coordSys, hasAnimation);
                if (isAreaChart) {
                    polygon = this._newPolygon(points, stackedOnPoints, coordSys, hasAnimation);
                }
                lineGroup.setClipPath(createClipShape(coordSys, true, seriesModel));
            } else {
                if (isAreaChart && !polygon) {
                    // If areaStyle is added
                    polygon = this._newPolygon(points, stackedOnPoints, coordSys, hasAnimation);
                } else if (polygon && !isAreaChart) {
                    // If areaStyle is removed
                    lineGroup.remove(polygon);
                    polygon = this._polygon = null;
                }
                // Update clipPath
                lineGroup.setClipPath(createClipShape(coordSys, false, seriesModel));
                // Always update, or it is wrong in the case turning on legend
                // because points are not changed
                showSymbol && symbolDraw.updateData(data, isSymbolIgnore);
                // Stop symbol animation and sync with line points
                // FIXME performance?
                data.eachItemGraphicEl(function (el) {
                    el.stopAnimation(true);
                });
                // In the case data zoom triggerred refreshing frequently
                // Data may not change if line has a category axis. So it should animate nothing
                if (!isPointsSame(this._stackedOnPoints, stackedOnPoints) || !isPointsSame(this._points, points)) {
                    if (hasAnimation) {
                        this._updateAnimation(data, stackedOnPoints, coordSys, api, step);
                    } else {
                        // Not do it in update with animation
                        if (step) {
                            // TODO If stacked series is not step
                            points = turnPointsIntoStep(points, coordSys, step);
                            stackedOnPoints = turnPointsIntoStep(stackedOnPoints, coordSys, step);
                        }
                        polyline.setShape({ points: points });
                        polygon && polygon.setShape({
                            points: points,
                            stackedOnPoints: stackedOnPoints
                        });
                    }
                }
            }
            var visualColor = getVisualGradient(data, coordSys) || data.getVisual('color');
            polyline.useStyle(zrUtil.defaults(lineStyleModel.getLineStyle(), {
                fill: 'none',
                stroke: visualColor,
                lineJoin: 'bevel'
            }));
            var smooth = seriesModel.get('smooth');
            smooth = getSmooth(seriesModel.get('smooth'));
            polyline.setShape({
                smooth: smooth,
                smoothMonotone: seriesModel.get('smoothMonotone'),
                connectNulls: seriesModel.get('connectNulls')
            });
            if (polygon) {
                var stackedOn = data.stackedOn;
                var stackedOnSmooth = 0;
                polygon.useStyle(zrUtil.defaults(areaStyleModel.getAreaStyle(), {
                    fill: visualColor,
                    opacity: 0.7,
                    lineJoin: 'bevel'
                }));
                if (stackedOn) {
                    var stackedOnSeries = stackedOn.hostModel;
                    stackedOnSmooth = getSmooth(stackedOnSeries.get('smooth'));
                }
                polygon.setShape({
                    smooth: smooth,
                    stackedOnSmooth: stackedOnSmooth,
                    smoothMonotone: seriesModel.get('smoothMonotone'),
                    connectNulls: seriesModel.get('connectNulls')
                });
            }
            this._data = data;
            // Save the coordinate system for transition animation when data changed
            this._coordSys = coordSys;
            this._stackedOnPoints = stackedOnPoints;
            this._points = points;
            this._step = step;
        },
        dispose: function () {
        },
        highlight: function (seriesModel, ecModel, api, payload) {
            var data = seriesModel.getData();
            var dataIndex = modelUtil.queryDataIndex(data, payload);
            if (!(dataIndex instanceof Array) && dataIndex != null && dataIndex >= 0) {
                var symbol = data.getItemGraphicEl(dataIndex);
                if (!symbol) {
                    // Create a temporary symbol if it is not exists
                    var pt = data.getItemLayout(dataIndex);
                    if (!pt) {
                        // Null data
                        return;
                    }
                    symbol = new Symbol(data, dataIndex);
                    symbol.position = pt;
                    symbol.setZ(seriesModel.get('zlevel'), seriesModel.get('z'));
                    symbol.ignore = isNaN(pt[0]) || isNaN(pt[1]);
                    symbol.__temp = true;
                    data.setItemGraphicEl(dataIndex, symbol);
                    // Stop scale animation
                    symbol.stopSymbolAnimation(true);
                    this.group.add(symbol);
                }
                symbol.highlight();
            } else {
                // Highlight whole series
                ChartView.prototype.highlight.call(this, seriesModel, ecModel, api, payload);
            }
        },
        downplay: function (seriesModel, ecModel, api, payload) {
            var data = seriesModel.getData();
            var dataIndex = modelUtil.queryDataIndex(data, payload);
            if (dataIndex != null && dataIndex >= 0) {
                var symbol = data.getItemGraphicEl(dataIndex);
                if (symbol) {
                    if (symbol.__temp) {
                        data.setItemGraphicEl(dataIndex, null);
                        this.group.remove(symbol);
                    } else {
                        symbol.downplay();
                    }
                }
            } else {
                // Downplay whole series
                ChartView.prototype.downplay.call(this, seriesModel, ecModel, api, payload);
            }
        },
        _newPolyline: function (points) {
            var polyline = this._polyline;
            // Remove previous created polyline
            if (polyline) {
                this._lineGroup.remove(polyline);
            }
            polyline = new polyHelper.Polyline({
                shape: { points: points },
                silent: true,
                z2: 10
            });
            this._lineGroup.add(polyline);
            this._polyline = polyline;
            return polyline;
        },
        _newPolygon: function (points, stackedOnPoints) {
            var polygon = this._polygon;
            // Remove previous created polygon
            if (polygon) {
                this._lineGroup.remove(polygon);
            }
            polygon = new polyHelper.Polygon({
                shape: {
                    points: points,
                    stackedOnPoints: stackedOnPoints
                },
                silent: true
            });
            this._lineGroup.add(polygon);
            this._polygon = polygon;
            return polygon;
        },
        _getSymbolIgnoreFunc: function (data, coordSys) {
            var categoryAxis = coordSys.getAxesByScale('ordinal')[0];
            // `getLabelInterval` is provided by echarts/component/axis
            if (categoryAxis && categoryAxis.isLabelIgnored) {
                return zrUtil.bind(categoryAxis.isLabelIgnored, categoryAxis);
            }
        },
        _updateAnimation: function (data, stackedOnPoints, coordSys, api, step) {
            var polyline = this._polyline;
            var polygon = this._polygon;
            var seriesModel = data.hostModel;
            var diff = lineAnimationDiff(this._data, data, this._stackedOnPoints, stackedOnPoints, this._coordSys, coordSys);
            var current = diff.current;
            var stackedOnCurrent = diff.stackedOnCurrent;
            var next = diff.next;
            var stackedOnNext = diff.stackedOnNext;
            if (step) {
                // TODO If stacked series is not step
                current = turnPointsIntoStep(diff.current, coordSys, step);
                stackedOnCurrent = turnPointsIntoStep(diff.stackedOnCurrent, coordSys, step);
                next = turnPointsIntoStep(diff.next, coordSys, step);
                stackedOnNext = turnPointsIntoStep(diff.stackedOnNext, coordSys, step);
            }
            // `diff.current` is subset of `current` (which should be ensured by
            // turnPointsIntoStep), so points in `__points` can be updated when
            // points in `current` are update during animation.
            polyline.shape.__points = diff.current;
            polyline.shape.points = current;
            graphic.updateProps(polyline, { shape: { points: next } }, seriesModel);
            if (polygon) {
                polygon.setShape({
                    points: current,
                    stackedOnPoints: stackedOnCurrent
                });
                graphic.updateProps(polygon, {
                    shape: {
                        points: next,
                        stackedOnPoints: stackedOnNext
                    }
                }, seriesModel);
            }
            var updatedDataInfo = [];
            var diffStatus = diff.status;
            for (var i = 0; i < diffStatus.length; i++) {
                var cmd = diffStatus[i].cmd;
                if (cmd === '=') {
                    var el = data.getItemGraphicEl(diffStatus[i].idx1);
                    if (el) {
                        updatedDataInfo.push({
                            el: el,
                            ptIdx: i
                        });
                    }
                }
            }
            if (polyline.animators && polyline.animators.length) {
                polyline.animators[0].during(function () {
                    for (var i = 0; i < updatedDataInfo.length; i++) {
                        var el = updatedDataInfo[i].el;
                        el.attr('position', polyline.shape.__points[updatedDataInfo[i].ptIdx]);
                    }
                });
            }
        },
        remove: function (ecModel) {
            var group = this.group;
            var oldData = this._data;
            this._lineGroup.removeAll();
            this._symbolDraw.remove(true);
            // Remove temporary created elements when highlighting
            oldData && oldData.eachItemGraphicEl(function (el, idx) {
                if (el.__temp) {
                    group.remove(el);
                    oldData.setItemGraphicEl(idx, null);
                }
            });
            this._polyline = this._polygon = this._coordSys = this._points = this._stackedOnPoints = this._data = null;
        }
    });
});
define('echarts/visual/symbol', ['require'], function (require) {
    return function (seriesType, defaultSymbolType, legendSymbol, ecModel, api) {
        // Encoding visual for all series include which is filtered for legend drawing
        ecModel.eachRawSeriesByType(seriesType, function (seriesModel) {
            var data = seriesModel.getData();
            var symbolType = seriesModel.get('symbol') || defaultSymbolType;
            var symbolSize = seriesModel.get('symbolSize');
            data.setVisual({
                legendSymbol: legendSymbol || symbolType,
                symbol: symbolType,
                symbolSize: symbolSize
            });
            // Only visible series has each data be visual encoded
            if (!ecModel.isSeriesFiltered(seriesModel)) {
                if (typeof symbolSize === 'function') {
                    data.each(function (idx) {
                        var rawValue = seriesModel.getRawValue(idx);
                        // FIXME
                        var params = seriesModel.getDataParams(idx);
                        data.setItemVisual(idx, 'symbolSize', symbolSize(rawValue, params));
                    });
                }
                data.each(function (idx) {
                    var itemModel = data.getItemModel(idx);
                    var itemSymbolType = itemModel.getShallow('symbol', true);
                    var itemSymbolSize = itemModel.getShallow('symbolSize', true);
                    // If has item symbol
                    if (itemSymbolType != null) {
                        data.setItemVisual(idx, 'symbol', itemSymbolType);
                    }
                    if (itemSymbolSize != null) {
                        // PENDING Transform symbolSize ?
                        data.setItemVisual(idx, 'symbolSize', itemSymbolSize);
                    }
                });
            }
        });
    };
});
define('echarts/layout/points', ['require'], function (require) {
    return function (seriesType, ecModel) {
        ecModel.eachSeriesByType(seriesType, function (seriesModel) {
            var data = seriesModel.getData();
            var coordSys = seriesModel.coordinateSystem;
            if (coordSys) {
                var dims = coordSys.dimensions;
                if (coordSys.type === 'singleAxis') {
                    data.each(dims[0], function (x, idx) {
                        // Also {Array.<number>}, not undefined to avoid if...else... statement
                        data.setItemLayout(idx, isNaN(x) ? [
                            NaN,
                            NaN
                        ] : coordSys.dataToPoint(x));
                    });
                } else {
                    data.each(dims, function (x, y, idx) {
                        // Also {Array.<number>}, not undefined to avoid if...else... statement
                        data.setItemLayout(idx, isNaN(x) || isNaN(y) ? [
                            NaN,
                            NaN
                        ] : coordSys.dataToPoint([
                            x,
                            y
                        ]));
                    }, true);
                }
            }
        });
    };
});
define('echarts/processor/dataSample', [], function () {
    var samplers = {
            average: function (frame) {
                var sum = 0;
                var count = 0;
                for (var i = 0; i < frame.length; i++) {
                    if (!isNaN(frame[i])) {
                        sum += frame[i];
                        count++;
                    }
                }
                // Return NaN if count is 0
                return count === 0 ? NaN : sum / count;
            },
            sum: function (frame) {
                var sum = 0;
                for (var i = 0; i < frame.length; i++) {
                    // Ignore NaN
                    sum += frame[i] || 0;
                }
                return sum;
            },
            max: function (frame) {
                var max = -Infinity;
                for (var i = 0; i < frame.length; i++) {
                    frame[i] > max && (max = frame[i]);
                }
                return max;
            },
            min: function (frame) {
                var min = Infinity;
                for (var i = 0; i < frame.length; i++) {
                    frame[i] < min && (min = frame[i]);
                }
                return min;
            },
            nearest: function (frame) {
                return frame[0];
            }
        };
    var indexSampler = function (frame, value) {
        return Math.round(frame.length / 2);
    };
    return function (seriesType, ecModel, api) {
        ecModel.eachSeriesByType(seriesType, function (seriesModel) {
            var data = seriesModel.getData();
            var sampling = seriesModel.get('sampling');
            var coordSys = seriesModel.coordinateSystem;
            // Only cartesian2d support down sampling
            if (coordSys.type === 'cartesian2d' && sampling) {
                var baseAxis = coordSys.getBaseAxis();
                var valueAxis = coordSys.getOtherAxis(baseAxis);
                var extent = baseAxis.getExtent();
                // Coordinste system has been resized
                var size = extent[1] - extent[0];
                var rate = Math.round(data.count() / size);
                if (rate > 1) {
                    var sampler;
                    if (typeof sampling === 'string') {
                        sampler = samplers[sampling];
                    } else if (typeof sampling === 'function') {
                        sampler = sampling;
                    }
                    if (sampler) {
                        data = data.downSample(valueAxis.dim, 1 / rate, sampler, indexSampler);
                        seriesModel.setData(data);
                    }
                }
            }
        }, this);
    };
});
define('echarts/chart/gauge/GaugeSeries', ['require', '../../data/List', '../../model/Series', 'zrender/core/util'], function (require) {
    var List = require('../../data/List');
    var SeriesModel = require('../../model/Series');
    var zrUtil = require('zrender/core/util');
    var GaugeSeries = SeriesModel.extend({
            type: 'series.gauge',
            getInitialData: function (option, ecModel) {
                var list = new List(['value'], this);
                var dataOpt = option.data || [];
                if (!zrUtil.isArray(dataOpt)) {
                    dataOpt = [dataOpt];
                }
                // Only use the first data item
                list.initData(dataOpt);
                return list;
            },
            defaultOption: {
                zlevel: 0,
                z: 2,
                center: [
                    '50%',
                    '50%'
                ],
                legendHoverLink: true,
                radius: '75%',
                startAngle: 225,
                endAngle: -45,
                clockwise: true,
                min: 0,
                max: 100,
                splitNumber: 10,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: [
                            [
                                0.2,
                                '#91c7ae'
                            ],
                            [
                                0.8,
                                '#63869e'
                            ],
                            [
                                1,
                                '#c23531'
                            ]
                        ],
                        width: 30
                    }
                },
                splitLine: {
                    show: true,
                    length: 30,
                    lineStyle: {
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                axisTick: {
                    show: true,
                    splitNumber: 5,
                    length: 8,
                    lineStyle: {
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {
                    show: true,
                    distance: 5,
                    textStyle: { color: 'auto' }
                },
                pointer: {
                    show: true,
                    length: '80%',
                    width: 8
                },
                itemStyle: { normal: { color: 'auto' } },
                title: {
                    show: true,
                    offsetCenter: [
                        0,
                        '-40%'
                    ],
                    textStyle: {
                        color: '#333',
                        fontSize: 15
                    }
                },
                detail: {
                    show: true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: [
                        0,
                        '40%'
                    ],
                    textStyle: {
                        color: 'auto',
                        fontSize: 30
                    }
                }
            }
        });
    return GaugeSeries;
});
define('echarts/chart/gauge/GaugeView', ['require', './PointerPath', '../../util/graphic', '../../util/number', '../../view/Chart'], function (require) {
    var PointerPath = require('./PointerPath');
    var graphic = require('../../util/graphic');
    var numberUtil = require('../../util/number');
    var parsePercent = numberUtil.parsePercent;
    function parsePosition(seriesModel, api) {
        var center = seriesModel.get('center');
        var width = api.getWidth();
        var height = api.getHeight();
        var size = Math.min(width, height);
        var cx = parsePercent(center[0], api.getWidth());
        var cy = parsePercent(center[1], api.getHeight());
        var r = parsePercent(seriesModel.get('radius'), size / 2);
        return {
            cx: cx,
            cy: cy,
            r: r
        };
    }
    function formatLabel(label, labelFormatter) {
        if (labelFormatter) {
            if (typeof labelFormatter === 'string') {
                label = labelFormatter.replace('{value}', label != null ? label : '');
            } else if (typeof labelFormatter === 'function') {
                label = labelFormatter(label);
            }
        }
        return label;
    }
    var PI2 = Math.PI * 2;
    var GaugeView = require('../../view/Chart').extend({
            type: 'gauge',
            render: function (seriesModel, ecModel, api) {
                this.group.removeAll();
                var colorList = seriesModel.get('axisLine.lineStyle.color');
                var posInfo = parsePosition(seriesModel, api);
                this._renderMain(seriesModel, ecModel, api, colorList, posInfo);
            },
            dispose: function () {
            },
            _renderMain: function (seriesModel, ecModel, api, colorList, posInfo) {
                var group = this.group;
                var axisLineModel = seriesModel.getModel('axisLine');
                var lineStyleModel = axisLineModel.getModel('lineStyle');
                var clockwise = seriesModel.get('clockwise');
                var startAngle = -seriesModel.get('startAngle') / 180 * Math.PI;
                var endAngle = -seriesModel.get('endAngle') / 180 * Math.PI;
                var angleRangeSpan = (endAngle - startAngle) % PI2;
                var prevEndAngle = startAngle;
                var axisLineWidth = lineStyleModel.get('width');
                for (var i = 0; i < colorList.length; i++) {
                    // Clamp
                    var percent = Math.min(Math.max(colorList[i][0], 0), 1);
                    var endAngle = startAngle + angleRangeSpan * percent;
                    var sector = new graphic.Sector({
                            shape: {
                                startAngle: prevEndAngle,
                                endAngle: endAngle,
                                cx: posInfo.cx,
                                cy: posInfo.cy,
                                clockwise: clockwise,
                                r0: posInfo.r - axisLineWidth,
                                r: posInfo.r
                            },
                            silent: true
                        });
                    sector.setStyle({ fill: colorList[i][1] });
                    sector.setStyle(lineStyleModel.getLineStyle([
                        'color',
                        'borderWidth',
                        'borderColor'
                    ]));
                    group.add(sector);
                    prevEndAngle = endAngle;
                }
                var getColor = function (percent) {
                    // Less than 0
                    if (percent <= 0) {
                        return colorList[0][1];
                    }
                    for (var i = 0; i < colorList.length; i++) {
                        if (colorList[i][0] >= percent && (i === 0 ? 0 : colorList[i - 1][0]) < percent) {
                            return colorList[i][1];
                        }
                    }
                    // More than 1
                    return colorList[i - 1][1];
                };
                if (!clockwise) {
                    var tmp = startAngle;
                    startAngle = endAngle;
                    endAngle = tmp;
                }
                this._renderTicks(seriesModel, ecModel, api, getColor, posInfo, startAngle, endAngle, clockwise);
                this._renderPointer(seriesModel, ecModel, api, getColor, posInfo, startAngle, endAngle, clockwise);
                this._renderTitle(seriesModel, ecModel, api, getColor, posInfo);
                this._renderDetail(seriesModel, ecModel, api, getColor, posInfo);
            },
            _renderTicks: function (seriesModel, ecModel, api, getColor, posInfo, startAngle, endAngle, clockwise) {
                var group = this.group;
                var cx = posInfo.cx;
                var cy = posInfo.cy;
                var r = posInfo.r;
                var minVal = +seriesModel.get('min');
                var maxVal = +seriesModel.get('max');
                var splitLineModel = seriesModel.getModel('splitLine');
                var tickModel = seriesModel.getModel('axisTick');
                var labelModel = seriesModel.getModel('axisLabel');
                var splitNumber = seriesModel.get('splitNumber');
                var subSplitNumber = tickModel.get('splitNumber');
                var splitLineLen = parsePercent(splitLineModel.get('length'), r);
                var tickLen = parsePercent(tickModel.get('length'), r);
                var angle = startAngle;
                var step = (endAngle - startAngle) / splitNumber;
                var subStep = step / subSplitNumber;
                var splitLineStyle = splitLineModel.getModel('lineStyle').getLineStyle();
                var tickLineStyle = tickModel.getModel('lineStyle').getLineStyle();
                var textStyleModel = labelModel.getModel('textStyle');
                for (var i = 0; i <= splitNumber; i++) {
                    var unitX = Math.cos(angle);
                    var unitY = Math.sin(angle);
                    // Split line
                    if (splitLineModel.get('show')) {
                        var splitLine = new graphic.Line({
                                shape: {
                                    x1: unitX * r + cx,
                                    y1: unitY * r + cy,
                                    x2: unitX * (r - splitLineLen) + cx,
                                    y2: unitY * (r - splitLineLen) + cy
                                },
                                style: splitLineStyle,
                                silent: true
                            });
                        if (splitLineStyle.stroke === 'auto') {
                            splitLine.setStyle({ stroke: getColor(i / splitNumber) });
                        }
                        group.add(splitLine);
                    }
                    // Label
                    if (labelModel.get('show')) {
                        var label = formatLabel(numberUtil.round(i / splitNumber * (maxVal - minVal) + minVal), labelModel.get('formatter'));
                        var distance = labelModel.get('distance');
                        var text = new graphic.Text({
                                style: {
                                    text: label,
                                    x: unitX * (r - splitLineLen - distance) + cx,
                                    y: unitY * (r - splitLineLen - distance) + cy,
                                    fill: textStyleModel.getTextColor(),
                                    textFont: textStyleModel.getFont(),
                                    textVerticalAlign: unitY < -0.4 ? 'top' : unitY > 0.4 ? 'bottom' : 'middle',
                                    textAlign: unitX < -0.4 ? 'left' : unitX > 0.4 ? 'right' : 'center'
                                },
                                silent: true
                            });
                        if (text.style.fill === 'auto') {
                            text.setStyle({ fill: getColor(i / splitNumber) });
                        }
                        group.add(text);
                    }
                    // Axis tick
                    if (tickModel.get('show') && i !== splitNumber) {
                        for (var j = 0; j <= subSplitNumber; j++) {
                            var unitX = Math.cos(angle);
                            var unitY = Math.sin(angle);
                            var tickLine = new graphic.Line({
                                    shape: {
                                        x1: unitX * r + cx,
                                        y1: unitY * r + cy,
                                        x2: unitX * (r - tickLen) + cx,
                                        y2: unitY * (r - tickLen) + cy
                                    },
                                    silent: true,
                                    style: tickLineStyle
                                });
                            if (tickLineStyle.stroke === 'auto') {
                                tickLine.setStyle({ stroke: getColor((i + j / subSplitNumber) / splitNumber) });
                            }
                            group.add(tickLine);
                            angle += subStep;
                        }
                        angle -= subStep;
                    } else {
                        angle += step;
                    }
                }
            },
            _renderPointer: function (seriesModel, ecModel, api, getColor, posInfo, startAngle, endAngle, clockwise) {
                var group = this.group;
                var oldData = this._data;
                if (!seriesModel.get('pointer.show')) {
                    // Remove old element
                    oldData.eachItemGraphicEl(function (el) {
                        group.remove(el);
                    });
                    return;
                }
                var valueExtent = [
                        +seriesModel.get('min'),
                        +seriesModel.get('max')
                    ];
                var angleExtent = [
                        startAngle,
                        endAngle
                    ];
                var data = seriesModel.getData();
                data.diff(oldData).add(function (idx) {
                    var pointer = new PointerPath({ shape: { angle: startAngle } });
                    graphic.updateProps(pointer, { shape: { angle: numberUtil.linearMap(data.get('value', idx), valueExtent, angleExtent, true) } }, seriesModel);
                    group.add(pointer);
                    data.setItemGraphicEl(idx, pointer);
                }).update(function (newIdx, oldIdx) {
                    var pointer = oldData.getItemGraphicEl(oldIdx);
                    graphic.updateProps(pointer, { shape: { angle: numberUtil.linearMap(data.get('value', newIdx), valueExtent, angleExtent, true) } }, seriesModel);
                    group.add(pointer);
                    data.setItemGraphicEl(newIdx, pointer);
                }).remove(function (idx) {
                    var pointer = oldData.getItemGraphicEl(idx);
                    group.remove(pointer);
                }).execute();
                data.eachItemGraphicEl(function (pointer, idx) {
                    var itemModel = data.getItemModel(idx);
                    var pointerModel = itemModel.getModel('pointer');
                    pointer.setShape({
                        x: posInfo.cx,
                        y: posInfo.cy,
                        width: parsePercent(pointerModel.get('width'), posInfo.r),
                        r: parsePercent(pointerModel.get('length'), posInfo.r)
                    });
                    pointer.useStyle(itemModel.getModel('itemStyle.normal').getItemStyle());
                    if (pointer.style.fill === 'auto') {
                        pointer.setStyle('fill', getColor((data.get('value', idx) - valueExtent[0]) / (valueExtent[1] - valueExtent[0])));
                    }
                    graphic.setHoverStyle(pointer, itemModel.getModel('itemStyle.emphasis').getItemStyle());
                });
                this._data = data;
            },
            _renderTitle: function (seriesModel, ecModel, api, getColor, posInfo) {
                var titleModel = seriesModel.getModel('title');
                if (titleModel.get('show')) {
                    var textStyleModel = titleModel.getModel('textStyle');
                    var offsetCenter = titleModel.get('offsetCenter');
                    var x = posInfo.cx + parsePercent(offsetCenter[0], posInfo.r);
                    var y = posInfo.cy + parsePercent(offsetCenter[1], posInfo.r);
                    var text = new graphic.Text({
                            style: {
                                x: x,
                                y: y,
                                text: seriesModel.getData().getName(0),
                                fill: textStyleModel.getTextColor(),
                                textFont: textStyleModel.getFont(),
                                textAlign: 'center',
                                textVerticalAlign: 'middle'
                            }
                        });
                    this.group.add(text);
                }
            },
            _renderDetail: function (seriesModel, ecModel, api, getColor, posInfo) {
                var detailModel = seriesModel.getModel('detail');
                var minVal = +seriesModel.get('min');
                var maxVal = +seriesModel.get('max');
                if (detailModel.get('show')) {
                    var textStyleModel = detailModel.getModel('textStyle');
                    var offsetCenter = detailModel.get('offsetCenter');
                    var x = posInfo.cx + parsePercent(offsetCenter[0], posInfo.r);
                    var y = posInfo.cy + parsePercent(offsetCenter[1], posInfo.r);
                    var width = parsePercent(detailModel.get('width'), posInfo.r);
                    var height = parsePercent(detailModel.get('height'), posInfo.r);
                    var value = seriesModel.getData().get('value', 0);
                    var rect = new graphic.Rect({
                            shape: {
                                x: x - width / 2,
                                y: y - height / 2,
                                width: width,
                                height: height
                            },
                            style: {
                                text: formatLabel(value, detailModel.get('formatter')),
                                fill: detailModel.get('backgroundColor'),
                                textFill: textStyleModel.getTextColor(),
                                textFont: textStyleModel.getFont()
                            }
                        });
                    if (rect.style.textFill === 'auto') {
                        rect.setStyle('textFill', getColor(numberUtil.linearMap(value, [
                            minVal,
                            maxVal
                        ], [
                            0,
                            1
                        ], true)));
                    }
                    rect.setStyle(detailModel.getItemStyle(['color']));
                    this.group.add(rect);
                }
            }
        });
    return GaugeView;
});
define('echarts/component/axis', ['require', '../coord/cartesian/AxisModel', './axis/AxisView'], function (require) {
    'use strict';
    require('../coord/cartesian/AxisModel');
    require('./axis/AxisView');
});
define('echarts/util/layout', ['require', 'zrender/core/util', 'zrender/core/BoundingRect', './number', './format'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var BoundingRect = require('zrender/core/BoundingRect');
    var numberUtil = require('./number');
    var formatUtil = require('./format');
    var parsePercent = numberUtil.parsePercent;
    var each = zrUtil.each;
    var layout = {};
    var LOCATION_PARAMS = layout.LOCATION_PARAMS = [
            'left',
            'right',
            'top',
            'bottom',
            'width',
            'height'
        ];
    function boxLayout(orient, group, gap, maxWidth, maxHeight) {
        var x = 0;
        var y = 0;
        if (maxWidth == null) {
            maxWidth = Infinity;
        }
        if (maxHeight == null) {
            maxHeight = Infinity;
        }
        var currentLineMaxSize = 0;
        group.eachChild(function (child, idx) {
            var position = child.position;
            var rect = child.getBoundingRect();
            var nextChild = group.childAt(idx + 1);
            var nextChildRect = nextChild && nextChild.getBoundingRect();
            var nextX;
            var nextY;
            if (orient === 'horizontal') {
                var moveX = rect.width + (nextChildRect ? -nextChildRect.x + rect.x : 0);
                nextX = x + moveX;
                // Wrap when width exceeds maxWidth or meet a `newline` group
                if (nextX > maxWidth || child.newline) {
                    x = 0;
                    nextX = moveX;
                    y += currentLineMaxSize + gap;
                    currentLineMaxSize = rect.height;
                } else {
                    currentLineMaxSize = Math.max(currentLineMaxSize, rect.height);
                }
            } else {
                var moveY = rect.height + (nextChildRect ? -nextChildRect.y + rect.y : 0);
                nextY = y + moveY;
                // Wrap when width exceeds maxHeight or meet a `newline` group
                if (nextY > maxHeight || child.newline) {
                    x += currentLineMaxSize + gap;
                    y = 0;
                    nextY = moveY;
                    currentLineMaxSize = rect.width;
                } else {
                    currentLineMaxSize = Math.max(currentLineMaxSize, rect.width);
                }
            }
            if (child.newline) {
                return;
            }
            position[0] = x;
            position[1] = y;
            orient === 'horizontal' ? x = nextX + gap : y = nextY + gap;
        });
    }
    /**
     * VBox or HBox layouting
     * @param {string} orient
     * @param {module:zrender/container/Group} group
     * @param {number} gap
     * @param {number} [width=Infinity]
     * @param {number} [height=Infinity]
     */
    layout.box = boxLayout;
    /**
     * VBox layouting
     * @param {module:zrender/container/Group} group
     * @param {number} gap
     * @param {number} [width=Infinity]
     * @param {number} [height=Infinity]
     */
    layout.vbox = zrUtil.curry(boxLayout, 'vertical');
    /**
     * HBox layouting
     * @param {module:zrender/container/Group} group
     * @param {number} gap
     * @param {number} [width=Infinity]
     * @param {number} [height=Infinity]
     */
    layout.hbox = zrUtil.curry(boxLayout, 'horizontal');
    /**
     * If x or x2 is not specified or 'center' 'left' 'right',
     * the width would be as long as possible.
     * If y or y2 is not specified or 'middle' 'top' 'bottom',
     * the height would be as long as possible.
     *
     * @param {Object} positionInfo
     * @param {number|string} [positionInfo.x]
     * @param {number|string} [positionInfo.y]
     * @param {number|string} [positionInfo.x2]
     * @param {number|string} [positionInfo.y2]
     * @param {Object} containerRect
     * @param {string|number} margin
     * @return {Object} {width, height}
     */
    layout.getAvailableSize = function (positionInfo, containerRect, margin) {
        var containerWidth = containerRect.width;
        var containerHeight = containerRect.height;
        var x = parsePercent(positionInfo.x, containerWidth);
        var y = parsePercent(positionInfo.y, containerHeight);
        var x2 = parsePercent(positionInfo.x2, containerWidth);
        var y2 = parsePercent(positionInfo.y2, containerHeight);
        (isNaN(x) || isNaN(parseFloat(positionInfo.x))) && (x = 0);
        (isNaN(x2) || isNaN(parseFloat(positionInfo.x2))) && (x2 = containerWidth);
        (isNaN(y) || isNaN(parseFloat(positionInfo.y))) && (y = 0);
        (isNaN(y2) || isNaN(parseFloat(positionInfo.y2))) && (y2 = containerHeight);
        margin = formatUtil.normalizeCssArray(margin || 0);
        return {
            width: Math.max(x2 - x - margin[1] - margin[3], 0),
            height: Math.max(y2 - y - margin[0] - margin[2], 0)
        };
    };
    /**
     * Parse position info.
     *
     * @param {Object} positionInfo
     * @param {number|string} [positionInfo.left]
     * @param {number|string} [positionInfo.top]
     * @param {number|string} [positionInfo.right]
     * @param {number|string} [positionInfo.bottom]
     * @param {number|string} [positionInfo.width]
     * @param {number|string} [positionInfo.height]
     * @param {number|string} [positionInfo.aspect] Aspect is width / height
     * @param {Object} containerRect
     * @param {string|number} [margin]
     *
     * @return {module:zrender/core/BoundingRect}
     */
    layout.getLayoutRect = function (positionInfo, containerRect, margin) {
        margin = formatUtil.normalizeCssArray(margin || 0);
        var containerWidth = containerRect.width;
        var containerHeight = containerRect.height;
        var left = parsePercent(positionInfo.left, containerWidth);
        var top = parsePercent(positionInfo.top, containerHeight);
        var right = parsePercent(positionInfo.right, containerWidth);
        var bottom = parsePercent(positionInfo.bottom, containerHeight);
        var width = parsePercent(positionInfo.width, containerWidth);
        var height = parsePercent(positionInfo.height, containerHeight);
        var verticalMargin = margin[2] + margin[0];
        var horizontalMargin = margin[1] + margin[3];
        var aspect = positionInfo.aspect;
        // If width is not specified, calculate width from left and right
        if (isNaN(width)) {
            width = containerWidth - right - horizontalMargin - left;
        }
        if (isNaN(height)) {
            height = containerHeight - bottom - verticalMargin - top;
        }
        // If width and height are not given
        // 1. Graph should not exceeds the container
        // 2. Aspect must be keeped
        // 3. Graph should take the space as more as possible
        if (isNaN(width) && isNaN(height)) {
            if (aspect > containerWidth / containerHeight) {
                width = containerWidth * 0.8;
            } else {
                height = containerHeight * 0.8;
            }
        }
        if (aspect != null) {
            // Calculate width or height with given aspect
            if (isNaN(width)) {
                width = aspect * height;
            }
            if (isNaN(height)) {
                height = width / aspect;
            }
        }
        // If left is not specified, calculate left from right and width
        if (isNaN(left)) {
            left = containerWidth - right - width - horizontalMargin;
        }
        if (isNaN(top)) {
            top = containerHeight - bottom - height - verticalMargin;
        }
        // Align left and top
        switch (positionInfo.left || positionInfo.right) {
        case 'center':
            left = containerWidth / 2 - width / 2 - margin[3];
            break;
        case 'right':
            left = containerWidth - width - horizontalMargin;
            break;
        }
        switch (positionInfo.top || positionInfo.bottom) {
        case 'middle':
        case 'center':
            top = containerHeight / 2 - height / 2 - margin[0];
            break;
        case 'bottom':
            top = containerHeight - height - verticalMargin;
            break;
        }
        // If something is wrong and left, top, width, height are calculated as NaN
        left = left || 0;
        top = top || 0;
        if (isNaN(width)) {
            // Width may be NaN if only one value is given except width
            width = containerWidth - left - (right || 0);
        }
        if (isNaN(height)) {
            // Height may be NaN if only one value is given except height
            height = containerHeight - top - (bottom || 0);
        }
        var rect = new BoundingRect(left + margin[3], top + margin[0], width, height);
        rect.margin = margin;
        return rect;
    };
    /**
     * Position a zr element in viewport
     *  Group position is specified by either
     *  {left, top}, {right, bottom}
     *  If all properties exists, right and bottom will be igonred.
     *
     * Logic:
     *     1. Scale (against origin point in parent coord)
     *     2. Rotate (against origin point in parent coord)
     *     3. Traslate (with el.position by this method)
     * So this method only fixes the last step 'Traslate', which does not affect
     * scaling and rotating.
     *
     * If be called repeatly with the same input el, the same result will be gotten.
     *
     * @param {module:zrender/Element} el Should have `getBoundingRect` method.
     * @param {Object} positionInfo
     * @param {number|string} [positionInfo.left]
     * @param {number|string} [positionInfo.top]
     * @param {number|string} [positionInfo.right]
     * @param {number|string} [positionInfo.bottom]
     * @param {Object} containerRect
     * @param {string|number} margin
     * @param {Object} [opt]
     * @param {Array.<number>} [opt.hv=[1,1]] Only horizontal or only vertical.
     * @param {Array.<number>} [opt.boundingMode='all']
     *        Specify how to calculate boundingRect when locating.
     *        'all': Position the boundingRect that is transformed and uioned
     *               both itself and its descendants.
     *               This mode simplies confine the elements in the bounding
     *               of their container (e.g., using 'right: 0').
     *        'raw': Position the boundingRect that is not transformed and only itself.
     *               This mode is useful when you want a element can overflow its
     *               container. (Consider a rotated circle needs to be located in a corner.)
     *               In this mode positionInfo.width/height can only be number.
     */
    layout.positionElement = function (el, positionInfo, containerRect, margin, opt) {
        var h = !opt || !opt.hv || opt.hv[0];
        var v = !opt || !opt.hv || opt.hv[1];
        var boundingMode = opt && opt.boundingMode || 'all';
        if (!h && !v) {
            return;
        }
        var rect;
        if (boundingMode === 'raw') {
            rect = el.type === 'group' ? new BoundingRect(0, 0, +positionInfo.width || 0, +positionInfo.height || 0) : el.getBoundingRect();
        } else {
            rect = el.getBoundingRect();
            if (el.needLocalTransform()) {
                var transform = el.getLocalTransform();
                // Notice: raw rect may be inner object of el,
                // which should not be modified.
                rect = rect.clone();
                rect.applyTransform(transform);
            }
        }
        positionInfo = layout.getLayoutRect(zrUtil.defaults({
            width: rect.width,
            height: rect.height
        }, positionInfo), containerRect, margin);
        // Because 'tranlate' is the last step in transform
        // (see zrender/core/Transformable#getLocalTransfrom),
        // we can just only modify el.position to get final result.
        var elPos = el.position;
        var dx = h ? positionInfo.x - rect.x : 0;
        var dy = v ? positionInfo.y - rect.y : 0;
        el.attr('position', boundingMode === 'raw' ? [
            dx,
            dy
        ] : [
            elPos[0] + dx,
            elPos[1] + dy
        ]);
    };
    /**
     * Consider Case:
     * When defulat option has {left: 0, width: 100}, and we set {right: 0}
     * through setOption or media query, using normal zrUtil.merge will cause
     * {right: 0} does not take effect.
     *
     * @example
     * ComponentModel.extend({
     *     init: function () {
     *         ...
     *         var inputPositionParams = layout.getLayoutParams(option);
     *         this.mergeOption(inputPositionParams);
     *     },
     *     mergeOption: function (newOption) {
     *         newOption && zrUtil.merge(thisOption, newOption, true);
     *         layout.mergeLayoutParam(thisOption, newOption);
     *     }
     * });
     *
     * @param {Object} targetOption
     * @param {Object} newOption
     * @param {Object|string} [opt]
     * @param {boolean} [opt.ignoreSize=false] Some component must has width and height.
     */
    layout.mergeLayoutParam = function (targetOption, newOption, opt) {
        !zrUtil.isObject(opt) && (opt = {});
        var hNames = [
                'width',
                'left',
                'right'
            ];
        // Order by priority.
        var vNames = [
                'height',
                'top',
                'bottom'
            ];
        // Order by priority.
        var hResult = merge(hNames);
        var vResult = merge(vNames);
        copy(hNames, targetOption, hResult);
        copy(vNames, targetOption, vResult);
        function merge(names) {
            var newParams = {};
            var newValueCount = 0;
            var merged = {};
            var mergedValueCount = 0;
            var enoughParamNumber = opt.ignoreSize ? 1 : 2;
            each(names, function (name) {
                merged[name] = targetOption[name];
            });
            each(names, function (name) {
                // Consider case: newOption.width is null, which is
                // set by user for removing width setting.
                hasProp(newOption, name) && (newParams[name] = merged[name] = newOption[name]);
                hasValue(newParams, name) && newValueCount++;
                hasValue(merged, name) && mergedValueCount++;
            });
            // Case: newOption: {width: ..., right: ...},
            // or targetOption: {right: ...} and newOption: {width: ...},
            // There is no conflict when merged only has params count
            // little than enoughParamNumber.
            if (mergedValueCount === enoughParamNumber || !newValueCount) {
                return merged;
            }    // Case: newOption: {width: ..., right: ...},
                 // Than we can make sure user only want those two, and ignore
                 // all origin params in targetOption.
            else if (newValueCount >= enoughParamNumber) {
                return newParams;
            } else {
                // Chose another param from targetOption by priority.
                // When 'ignoreSize', enoughParamNumber is 1 and those will not happen.
                for (var i = 0; i < names.length; i++) {
                    var name = names[i];
                    if (!hasProp(newParams, name) && hasProp(targetOption, name)) {
                        newParams[name] = targetOption[name];
                        break;
                    }
                }
                return newParams;
            }
        }
        function hasProp(obj, name) {
            return obj.hasOwnProperty(name);
        }
        function hasValue(obj, name) {
            return obj[name] != null && obj[name] !== 'auto';
        }
        function copy(names, target, source) {
            each(names, function (name) {
                target[name] = source[name];
            });
        }
    };
    /**
     * Retrieve 'left', 'right', 'top', 'bottom', 'width', 'height' from object.
     * @param {Object} source
     * @return {Object} Result contains those props.
     */
    layout.getLayoutParams = function (source) {
        return layout.copyLayoutParams({}, source);
    };
    /**
     * Retrieve 'left', 'right', 'top', 'bottom', 'width', 'height' from object.
     * @param {Object} source
     * @return {Object} Result contains those props.
     */
    layout.copyLayoutParams = function (target, source) {
        source && target && each(LOCATION_PARAMS, function (name) {
            source.hasOwnProperty(name) && (target[name] = source[name]);
        });
        return target;
    };
    return layout;
});
define('echarts/component/legend/LegendModel', ['require', 'zrender/core/util', '../../model/Model', '../../echarts'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var Model = require('../../model/Model');
    var LegendModel = require('../../echarts').extendComponentModel({
            type: 'legend',
            dependencies: ['series'],
            layoutMode: {
                type: 'box',
                ignoreSize: true
            },
            init: function (option, parentModel, ecModel) {
                this.mergeDefaultAndTheme(option, ecModel);
                option.selected = option.selected || {};
            },
            mergeOption: function (option) {
                LegendModel.superCall(this, 'mergeOption', option);
            },
            optionUpdated: function () {
                this._updateData(this.ecModel);
                var legendData = this._data;
                // If selectedMode is single, try to select one
                if (legendData[0] && this.get('selectedMode') === 'single') {
                    var hasSelected = false;
                    // If has any selected in option.selected
                    for (var i = 0; i < legendData.length; i++) {
                        var name = legendData[i].get('name');
                        if (this.isSelected(name)) {
                            // Force to unselect others
                            this.select(name);
                            hasSelected = true;
                            break;
                        }
                    }
                    // Try select the first if selectedMode is single
                    !hasSelected && this.select(legendData[0].get('name'));
                }
            },
            _updateData: function (ecModel) {
                var legendData = zrUtil.map(this.get('data') || [], function (dataItem) {
                        // Can be string or number
                        if (typeof dataItem === 'string' || typeof dataItem === 'number') {
                            dataItem = { name: dataItem };
                        }
                        return new Model(dataItem, this, this.ecModel);
                    }, this);
                this._data = legendData;
                var availableNames = zrUtil.map(ecModel.getSeries(), function (series) {
                        return series.name;
                    });
                ecModel.eachSeries(function (seriesModel) {
                    if (seriesModel.legendDataProvider) {
                        var data = seriesModel.legendDataProvider();
                        availableNames = availableNames.concat(data.mapArray(data.getName));
                    }
                });
                /**
             * @type {Array.<string>}
             * @private
             */
                this._availableNames = availableNames;
            },
            getData: function () {
                return this._data;
            },
            select: function (name) {
                var selected = this.option.selected;
                var selectedMode = this.get('selectedMode');
                if (selectedMode === 'single') {
                    var data = this._data;
                    zrUtil.each(data, function (dataItem) {
                        selected[dataItem.get('name')] = false;
                    });
                }
                selected[name] = true;
            },
            unSelect: function (name) {
                if (this.get('selectedMode') !== 'single') {
                    this.option.selected[name] = false;
                }
            },
            toggleSelected: function (name) {
                var selected = this.option.selected;
                // Default is true
                if (!selected.hasOwnProperty(name)) {
                    selected[name] = true;
                }
                this[selected[name] ? 'unSelect' : 'select'](name);
            },
            isSelected: function (name) {
                var selected = this.option.selected;
                return !(selected.hasOwnProperty(name) && !selected[name]) && zrUtil.indexOf(this._availableNames, name) >= 0;
            },
            defaultOption: {
                zlevel: 0,
                z: 4,
                show: true,
                orient: 'horizontal',
                left: 'center',
                top: 'top',
                align: 'auto',
                backgroundColor: 'rgba(0,0,0,0)',
                borderColor: '#ccc',
                borderWidth: 0,
                padding: 5,
                itemGap: 10,
                itemWidth: 25,
                itemHeight: 14,
                inactiveColor: '#ccc',
                textStyle: { color: '#333' },
                selectedMode: true,
                tooltip: { show: false }
            }
        });
    return LegendModel;
});
define('echarts/component/legend/legendAction', ['require', '../../echarts', 'zrender/core/util'], function (require) {
    var echarts = require('../../echarts');
    var zrUtil = require('zrender/core/util');
    function legendSelectActionHandler(methodName, payload, ecModel) {
        var selectedMap = {};
        var isToggleSelect = methodName === 'toggleSelected';
        var isSelected;
        // Update all legend components
        ecModel.eachComponent('legend', function (legendModel) {
            if (isToggleSelect && isSelected != null) {
                // Force other legend has same selected status
                // Or the first is toggled to true and other are toggled to false
                // In the case one legend has some item unSelected in option. And if other legend
                // doesn't has the item, they will assume it is selected.
                legendModel[isSelected ? 'select' : 'unSelect'](payload.name);
            } else {
                legendModel[methodName](payload.name);
                isSelected = legendModel.isSelected(payload.name);
            }
            var legendData = legendModel.getData();
            zrUtil.each(legendData, function (model) {
                var name = model.get('name');
                // Wrap element
                if (name === '\n' || name === '') {
                    return;
                }
                var isItemSelected = legendModel.isSelected(name);
                if (name in selectedMap) {
                    // Unselected if any legend is unselected
                    selectedMap[name] = selectedMap[name] && isItemSelected;
                } else {
                    selectedMap[name] = isItemSelected;
                }
            });
        });
        // Return the event explicitly
        return {
            name: payload.name,
            selected: selectedMap
        };
    }
    /**
     * @event legendToggleSelect
     * @type {Object}
     * @property {string} type 'legendToggleSelect'
     * @property {string} [from]
     * @property {string} name Series name or data item name
     */
    echarts.registerAction('legendToggleSelect', 'legendselectchanged', zrUtil.curry(legendSelectActionHandler, 'toggleSelected'));
    /**
     * @event legendSelect
     * @type {Object}
     * @property {string} type 'legendSelect'
     * @property {string} name Series name or data item name
     */
    echarts.registerAction('legendSelect', 'legendselected', zrUtil.curry(legendSelectActionHandler, 'select'));
    /**
     * @event legendUnSelect
     * @type {Object}
     * @property {string} type 'legendUnSelect'
     * @property {string} name Series name or data item name
     */
    echarts.registerAction('legendUnSelect', 'legendunselected', zrUtil.curry(legendSelectActionHandler, 'unSelect'));
});
define('echarts/component/legend/LegendView', ['require', 'zrender/core/util', '../../util/symbol', '../../util/graphic', '../helper/listComponent', '../../echarts'], function (require) {
    var zrUtil = require('zrender/core/util');
    var symbolCreator = require('../../util/symbol');
    var graphic = require('../../util/graphic');
    var listComponentHelper = require('../helper/listComponent');
    var curry = zrUtil.curry;
    function dispatchSelectAction(name, api) {
        api.dispatchAction({
            type: 'legendToggleSelect',
            name: name
        });
    }
    function dispatchHighlightAction(seriesModel, dataName, api) {
        // If element hover will move to a hoverLayer.
        var el = api.getZr().storage.getDisplayList()[0];
        if (!(el && el.useHoverLayer)) {
            seriesModel.get('legendHoverLink') && api.dispatchAction({
                type: 'highlight',
                seriesName: seriesModel.name,
                name: dataName
            });
        }
    }
    function dispatchDownplayAction(seriesModel, dataName, api) {
        // If element hover will move to a hoverLayer.
        var el = api.getZr().storage.getDisplayList()[0];
        if (!(el && el.useHoverLayer)) {
            seriesModel.get('legendHoverLink') && api.dispatchAction({
                type: 'downplay',
                seriesName: seriesModel.name,
                name: dataName
            });
        }
    }
    return require('../../echarts').extendComponentView({
        type: 'legend',
        init: function () {
            this._symbolTypeStore = {};
        },
        render: function (legendModel, ecModel, api) {
            var group = this.group;
            group.removeAll();
            if (!legendModel.get('show')) {
                return;
            }
            var selectMode = legendModel.get('selectedMode');
            var itemAlign = legendModel.get('align');
            if (itemAlign === 'auto') {
                itemAlign = legendModel.get('left') === 'right' && legendModel.get('orient') === 'vertical' ? 'right' : 'left';
            }
            var legendDrawedMap = {};
            zrUtil.each(legendModel.getData(), function (itemModel) {
                var name = itemModel.get('name');
                // Use empty string or \n as a newline string
                if (name === '' || name === '\n') {
                    group.add(new graphic.Group({ newline: true }));
                    return;
                }
                var seriesModel = ecModel.getSeriesByName(name)[0];
                if (legendDrawedMap[name]) {
                    // Have been drawed
                    return;
                }
                // Series legend
                if (seriesModel) {
                    var data = seriesModel.getData();
                    var color = data.getVisual('color');
                    // If color is a callback function
                    if (typeof color === 'function') {
                        // Use the first data
                        color = color(seriesModel.getDataParams(0));
                    }
                    // Using rect symbol defaultly
                    var legendSymbolType = data.getVisual('legendSymbol') || 'roundRect';
                    var symbolType = data.getVisual('symbol');
                    var itemGroup = this._createItem(name, itemModel, legendModel, legendSymbolType, symbolType, itemAlign, color, selectMode);
                    itemGroup.on('click', curry(dispatchSelectAction, name, api)).on('mouseover', curry(dispatchHighlightAction, seriesModel, null, api)).on('mouseout', curry(dispatchDownplayAction, seriesModel, null, api));
                    legendDrawedMap[name] = true;
                } else {
                    // Data legend of pie, funnel
                    ecModel.eachRawSeries(function (seriesModel) {
                        // In case multiple series has same data name
                        if (legendDrawedMap[name]) {
                            return;
                        }
                        if (seriesModel.legendDataProvider) {
                            var data = seriesModel.legendDataProvider();
                            var idx = data.indexOfName(name);
                            if (idx < 0) {
                                return;
                            }
                            var color = data.getItemVisual(idx, 'color');
                            var legendSymbolType = 'roundRect';
                            var itemGroup = this._createItem(name, itemModel, legendModel, legendSymbolType, null, itemAlign, color, selectMode);
                            itemGroup.on('click', curry(dispatchSelectAction, name, api)).on('mouseover', curry(dispatchHighlightAction, seriesModel, name, api)).on('mouseout', curry(dispatchDownplayAction, seriesModel, name, api));
                            legendDrawedMap[name] = true;
                        }
                    }, this);
                }
                if (true) {
                    if (!legendDrawedMap[name]) {
                        console.warn(name + ' series not exists. Legend data should be same with series name or data name.');
                    }
                }
            }, this);
            listComponentHelper.layout(group, legendModel, api);
            // Render background after group is layout
            // FIXME
            listComponentHelper.addBackground(group, legendModel);
        },
        _createItem: function (name, itemModel, legendModel, legendSymbolType, symbolType, itemAlign, color, selectMode) {
            var itemWidth = legendModel.get('itemWidth');
            var itemHeight = legendModel.get('itemHeight');
            var inactiveColor = legendModel.get('inactiveColor');
            var isSelected = legendModel.isSelected(name);
            var itemGroup = new graphic.Group();
            var textStyleModel = itemModel.getModel('textStyle');
            var itemIcon = itemModel.get('icon');
            var tooltipModel = itemModel.getModel('tooltip');
            var legendGlobalTooltipModel = tooltipModel.parentModel;
            // Use user given icon first
            legendSymbolType = itemIcon || legendSymbolType;
            itemGroup.add(symbolCreator.createSymbol(legendSymbolType, 0, 0, itemWidth, itemHeight, isSelected ? color : inactiveColor));
            // Compose symbols
            // PENDING
            if (!itemIcon && symbolType && (symbolType !== legendSymbolType || symbolType == 'none')) {
                var size = itemHeight * 0.8;
                if (symbolType === 'none') {
                    symbolType = 'circle';
                }
                // Put symbol in the center
                itemGroup.add(symbolCreator.createSymbol(symbolType, (itemWidth - size) / 2, (itemHeight - size) / 2, size, size, isSelected ? color : inactiveColor));
            }
            // Text
            var textX = itemAlign === 'left' ? itemWidth + 5 : -5;
            var textAlign = itemAlign;
            var formatter = legendModel.get('formatter');
            var content = name;
            if (typeof formatter === 'string' && formatter) {
                content = formatter.replace('{name}', name != null ? name : '');
            } else if (typeof formatter === 'function') {
                content = formatter(name);
            }
            var text = new graphic.Text({
                    style: {
                        text: content,
                        x: textX,
                        y: itemHeight / 2,
                        fill: isSelected ? textStyleModel.getTextColor() : inactiveColor,
                        textFont: textStyleModel.getFont(),
                        textAlign: textAlign,
                        textVerticalAlign: 'middle'
                    }
                });
            itemGroup.add(text);
            // Add a invisible rect to increase the area of mouse hover
            var hitRect = new graphic.Rect({
                    shape: itemGroup.getBoundingRect(),
                    invisible: true,
                    tooltip: tooltipModel.get('show') ? zrUtil.extend({
                        content: name,
                        formatter: legendGlobalTooltipModel.get('formatter', true) || function () {
                            return name;
                        },
                        formatterParams: {
                            componentType: 'legend',
                            legendIndex: legendModel.componentIndex,
                            name: name,
                            $vars: ['name']
                        }
                    }, tooltipModel.option) : null
                });
            itemGroup.add(hitRect);
            itemGroup.eachChild(function (child) {
                child.silent = true;
            });
            hitRect.silent = !selectMode;
            this.group.add(itemGroup);
            graphic.setHoverStyle(itemGroup);
            return itemGroup;
        }
    });
});
define('echarts/component/legend/legendFilter', [], function () {
    return function (ecModel) {
        var legendModels = ecModel.findComponents({ mainType: 'legend' });
        if (legendModels && legendModels.length) {
            ecModel.filterSeries(function (series) {
                // If in any legend component the status is not selected.
                // Because in legend series is assumed selected when it is not in the legend data.
                for (var i = 0; i < legendModels.length; i++) {
                    if (!legendModels[i].isSelected(series.name)) {
                        return false;
                    }
                }
                return true;
            });
        }
    };
});
define('echarts/component/tooltip/TooltipModel', ['require', '../../echarts'], function (require) {
    require('../../echarts').extendComponentModel({
        type: 'tooltip',
        defaultOption: {
            zlevel: 0,
            z: 8,
            show: true,
            showContent: true,
            trigger: 'item',
            triggerOn: 'mousemove',
            alwaysShowContent: false,
            confine: false,
            showDelay: 0,
            hideDelay: 100,
            transitionDuration: 0.4,
            enterable: false,
            backgroundColor: 'rgba(50,50,50,0.7)',
            borderColor: '#333',
            borderRadius: 4,
            borderWidth: 0,
            padding: 5,
            extraCssText: '',
            axisPointer: {
                type: 'line',
                axis: 'auto',
                animation: true,
                animationDurationUpdate: 200,
                animationEasingUpdate: 'exponentialOut',
                lineStyle: {
                    color: '#555',
                    width: 1,
                    type: 'solid'
                },
                crossStyle: {
                    color: '#555',
                    width: 1,
                    type: 'dashed',
                    textStyle: {}
                },
                shadowStyle: { color: 'rgba(150,150,150,0.3)' }
            },
            textStyle: {
                color: '#fff',
                fontSize: 14
            }
        }
    });
});
define('echarts/component/tooltip/TooltipView', ['require', './TooltipContent', '../../util/graphic', 'zrender/core/util', '../../util/format', '../../util/number', '../../util/model', 'zrender/core/env', '../../model/Model', '../../echarts'], function (require) {
    var TooltipContent = require('./TooltipContent');
    var graphic = require('../../util/graphic');
    var zrUtil = require('zrender/core/util');
    var formatUtil = require('../../util/format');
    var numberUtil = require('../../util/number');
    var modelUtil = require('../../util/model');
    var parsePercent = numberUtil.parsePercent;
    var env = require('zrender/core/env');
    var Model = require('../../model/Model');
    function dataEqual(a, b) {
        if (!a || !b) {
            return false;
        }
        var round = numberUtil.round;
        return round(a[0]) === round(b[0]) && round(a[1]) === round(b[1]);
    }
    /**
     * @inner
     */
    function makeLineShape(x1, y1, x2, y2) {
        return {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        };
    }
    /**
     * @inner
     */
    function makeRectShape(x, y, width, height) {
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }
    /**
     * @inner
     */
    function makeSectorShape(cx, cy, r0, r, startAngle, endAngle) {
        return {
            cx: cx,
            cy: cy,
            r0: r0,
            r: r,
            startAngle: startAngle,
            endAngle: endAngle,
            clockwise: true
        };
    }
    function refixTooltipPosition(x, y, el, viewWidth, viewHeight) {
        var width = el.clientWidth;
        var height = el.clientHeight;
        var gap = 20;
        if (x + width + gap > viewWidth) {
            x -= width + gap;
        } else {
            x += gap;
        }
        if (y + height + gap > viewHeight) {
            y -= height + gap;
        } else {
            y += gap;
        }
        return [
            x,
            y
        ];
    }
    function confineTooltipPosition(x, y, el, viewWidth, viewHeight) {
        var width = el.clientWidth;
        var height = el.clientHeight;
        x = Math.min(x + width, viewWidth) - width;
        y = Math.min(y + height, viewHeight) - height;
        x = Math.max(x, 0);
        y = Math.max(y, 0);
        return [
            x,
            y
        ];
    }
    function calcTooltipPosition(position, rect, dom) {
        var domWidth = dom.clientWidth;
        var domHeight = dom.clientHeight;
        var gap = 5;
        var x = 0;
        var y = 0;
        var rectWidth = rect.width;
        var rectHeight = rect.height;
        switch (position) {
        case 'inside':
            x = rect.x + rectWidth / 2 - domWidth / 2;
            y = rect.y + rectHeight / 2 - domHeight / 2;
            break;
        case 'top':
            x = rect.x + rectWidth / 2 - domWidth / 2;
            y = rect.y - domHeight - gap;
            break;
        case 'bottom':
            x = rect.x + rectWidth / 2 - domWidth / 2;
            y = rect.y + rectHeight + gap;
            break;
        case 'left':
            x = rect.x - domWidth - gap;
            y = rect.y + rectHeight / 2 - domHeight / 2;
            break;
        case 'right':
            x = rect.x + rectWidth + gap;
            y = rect.y + rectHeight / 2 - domHeight / 2;
        }
        return [
            x,
            y
        ];
    }
    /**
     * @param  {string|Function|Array.<number>} positionExpr
     * @param  {number} x Mouse x
     * @param  {number} y Mouse y
     * @param  {boolean} confine Whether confine tooltip content in view rect.
     * @param  {module:echarts/component/tooltip/TooltipContent} content
     * @param  {Object|<Array.<Object>} params
     * @param  {module:zrender/Element} el target element
     * @param  {module:echarts/ExtensionAPI} api
     * @return {Array.<number>}
     */
    function updatePosition(positionExpr, x, y, confine, content, params, el, api) {
        var viewWidth = api.getWidth();
        var viewHeight = api.getHeight();
        var rect = el && el.getBoundingRect().clone();
        el && rect.applyTransform(el.transform);
        if (typeof positionExpr === 'function') {
            // Callback of position can be an array or a string specify the position
            positionExpr = positionExpr([
                x,
                y
            ], params, content.el, rect);
        }
        if (zrUtil.isArray(positionExpr)) {
            x = parsePercent(positionExpr[0], viewWidth);
            y = parsePercent(positionExpr[1], viewHeight);
        }    // Specify tooltip position by string 'top' 'bottom' 'left' 'right' around graphic element
        else if (typeof positionExpr === 'string' && el) {
            var pos = calcTooltipPosition(positionExpr, rect, content.el);
            x = pos[0];
            y = pos[1];
        } else {
            var pos = refixTooltipPosition(x, y, content.el, viewWidth, viewHeight);
            x = pos[0];
            y = pos[1];
        }
        if (confine) {
            var pos = confineTooltipPosition(x, y, content.el, viewWidth, viewHeight);
            x = pos[0];
            y = pos[1];
        }
        content.moveTo(x, y);
    }
    function ifSeriesSupportAxisTrigger(seriesModel) {
        var coordSys = seriesModel.coordinateSystem;
        var trigger = seriesModel.get('tooltip.trigger', true);
        // Ignore series use item tooltip trigger and series coordinate system is not cartesian or
        return !(!coordSys || coordSys.type !== 'cartesian2d' && coordSys.type !== 'polar' && coordSys.type !== 'singleAxis' || trigger === 'item');
    }
    require('../../echarts').extendComponentView({
        type: 'tooltip',
        _axisPointers: {},
        init: function (ecModel, api) {
            if (env.node) {
                return;
            }
            var tooltipContent = new TooltipContent(api.getDom(), api);
            this._tooltipContent = tooltipContent;
        },
        render: function (tooltipModel, ecModel, api) {
            if (env.node) {
                return;
            }
            // Reset
            this.group.removeAll();
            /**
             * @type {Object}
             * @private
             */
            this._axisPointers = {};
            /**
             * @private
             * @type {module:echarts/component/tooltip/TooltipModel}
             */
            this._tooltipModel = tooltipModel;
            /**
             * @private
             * @type {module:echarts/model/Global}
             */
            this._ecModel = ecModel;
            /**
             * @private
             * @type {module:echarts/ExtensionAPI}
             */
            this._api = api;
            /**
             * @type {Object}
             * @private
             */
            this._lastHover = {};
            var tooltipContent = this._tooltipContent;
            tooltipContent.update();
            tooltipContent.enterable = tooltipModel.get('enterable');
            this._alwaysShowContent = tooltipModel.get('alwaysShowContent');
            /**
             * @type {Object.<string, Array>}
             */
            this._seriesGroupByAxis = this._prepareAxisTriggerData(tooltipModel, ecModel);
            var crossText = this._crossText;
            if (crossText) {
                this.group.add(crossText);
            }
            var triggerOn = tooltipModel.get('triggerOn');
            // Try to keep the tooltip show when refreshing
            if (this._lastX != null && this._lastY != null && triggerOn !== 'none') {
                var self = this;
                clearTimeout(this._refreshUpdateTimeout);
                this._refreshUpdateTimeout = setTimeout(function () {
                    // Show tip next tick after other charts are rendered
                    // In case highlight action has wrong result
                    // FIXME
                    self.manuallyShowTip(tooltipModel, ecModel, api, {
                        x: self._lastX,
                        y: self._lastY
                    });
                });
            }
            var zr = this._api.getZr();
            zr.off('click', this._tryShow);
            zr.off('mousemove', this._mousemove);
            zr.off('mouseout', this._hide);
            zr.off('globalout', this._hide);
            if (triggerOn === 'click') {
                zr.on('click', this._tryShow, this);
            } else if (triggerOn === 'mousemove') {
                zr.on('mousemove', this._mousemove, this);
                zr.on('mouseout', this._hide, this);
                zr.on('globalout', this._hide, this);
            }    // else triggerOn is 'none', which enable user
                 // to control tooltip totally using API.
        },
        _mousemove: function (e) {
            var showDelay = this._tooltipModel.get('showDelay');
            var self = this;
            clearTimeout(this._showTimeout);
            if (showDelay > 0) {
                this._showTimeout = setTimeout(function () {
                    self._tryShow(e);
                }, showDelay);
            } else {
                this._tryShow(e);
            }
        },
        manuallyShowTip: function (tooltipModel, ecModel, api, payload) {
            // From self
            if (payload.from === this.uid) {
                return;
            }
            var ecModel = this._ecModel;
            var seriesIndex = payload.seriesIndex;
            var seriesModel = ecModel.getSeriesByIndex(seriesIndex);
            var api = this._api;
            var isTriggerAxis = this._tooltipModel.get('trigger') === 'axis';
            function seriesHaveDataOnIndex(_series) {
                var data = _series.getData();
                var dataIndex = modelUtil.queryDataIndex(data, payload);
                // Have single dataIndex
                if (dataIndex != null && !zrUtil.isArray(dataIndex) && data.hasValue(dataIndex)) {
                    return true;
                }
            }
            if (payload.x == null || payload.y == null) {
                if (isTriggerAxis) {
                    // Find another series.
                    if (seriesModel && !seriesHaveDataOnIndex(seriesModel)) {
                        seriesModel = null;
                    }
                    if (!seriesModel) {
                        // Find the first series can use axis trigger And data is not null
                        ecModel.eachSeries(function (_series) {
                            if (ifSeriesSupportAxisTrigger(_series) && !seriesModel) {
                                if (seriesHaveDataOnIndex(_series)) {
                                    seriesModel = _series;
                                }
                            }
                        });
                    }
                } else {
                    // Use the first series by default.
                    seriesModel = seriesModel || ecModel.getSeriesByIndex(0);
                }
                if (seriesModel) {
                    var data = seriesModel.getData();
                    var dataIndex = modelUtil.queryDataIndex(data, payload);
                    if (dataIndex == null || zrUtil.isArray(dataIndex)) {
                        return;
                    }
                    var el = data.getItemGraphicEl(dataIndex);
                    var cx;
                    var cy;
                    // Try to get the point in coordinate system
                    var coordSys = seriesModel.coordinateSystem;
                    if (seriesModel.getTooltipPosition) {
                        var point = seriesModel.getTooltipPosition(dataIndex) || [];
                        cx = point[0];
                        cy = point[1];
                    } else if (coordSys && coordSys.dataToPoint) {
                        var point = coordSys.dataToPoint(data.getValues(zrUtil.map(coordSys.dimensions, function (dim) {
                                return seriesModel.coordDimToDataDim(dim)[0];
                            }), dataIndex, true));
                        cx = point && point[0];
                        cy = point && point[1];
                    } else if (el) {
                        // Use graphic bounding rect
                        var rect = el.getBoundingRect().clone();
                        rect.applyTransform(el.transform);
                        cx = rect.x + rect.width / 2;
                        cy = rect.y + rect.height / 2;
                    }
                    if (cx != null && cy != null) {
                        this._tryShow({
                            offsetX: cx,
                            offsetY: cy,
                            position: payload.position,
                            target: el,
                            event: {}
                        });
                    }
                }
            } else {
                var el = api.getZr().handler.findHover(payload.x, payload.y);
                this._tryShow({
                    offsetX: payload.x,
                    offsetY: payload.y,
                    position: payload.position,
                    target: el,
                    event: {}
                });
            }
        },
        manuallyHideTip: function (tooltipModel, ecModel, api, payload) {
            if (payload.from === this.uid) {
                return;
            }
            this._hide();
        },
        _prepareAxisTriggerData: function (tooltipModel, ecModel) {
            // Prepare data for axis trigger
            var seriesGroupByAxis = {};
            ecModel.eachSeries(function (seriesModel) {
                if (ifSeriesSupportAxisTrigger(seriesModel)) {
                    var coordSys = seriesModel.coordinateSystem;
                    var baseAxis;
                    var key;
                    // Only cartesian2d, polar and single support axis trigger
                    if (coordSys.type === 'cartesian2d') {
                        // FIXME `axisPointer.axis` is not baseAxis
                        baseAxis = coordSys.getBaseAxis();
                        key = baseAxis.dim + baseAxis.index;
                    } else if (coordSys.type === 'singleAxis') {
                        baseAxis = coordSys.getAxis();
                        key = baseAxis.dim + baseAxis.type;
                    } else {
                        baseAxis = coordSys.getBaseAxis();
                        key = baseAxis.dim + coordSys.name;
                    }
                    seriesGroupByAxis[key] = seriesGroupByAxis[key] || {
                        coordSys: [],
                        series: []
                    };
                    seriesGroupByAxis[key].coordSys.push(coordSys);
                    seriesGroupByAxis[key].series.push(seriesModel);
                }
            }, this);
            return seriesGroupByAxis;
        },
        _tryShow: function (e) {
            var el = e.target;
            var tooltipModel = this._tooltipModel;
            var globalTrigger = tooltipModel.get('trigger');
            var ecModel = this._ecModel;
            var api = this._api;
            if (!tooltipModel) {
                return;
            }
            // Save mouse x, mouse y. So we can try to keep showing the tip if chart is refreshed
            this._lastX = e.offsetX;
            this._lastY = e.offsetY;
            // Always show item tooltip if mouse is on the element with dataIndex
            if (el && el.dataIndex != null) {
                // Use dataModel in element if possible
                // Used when mouseover on a element like markPoint or edge
                // In which case, the data is not main data in series.
                var dataModel = el.dataModel || ecModel.getSeriesByIndex(el.seriesIndex);
                var dataIndex = el.dataIndex;
                var data = dataModel.getData();
                var itemModel = data.getItemModel(dataIndex);
                // Series or single data may use item trigger when global is axis trigger
                if ((itemModel.get('tooltip.trigger') || globalTrigger) === 'axis') {
                    this._showAxisTooltip(tooltipModel, ecModel, e);
                } else {
                    // Reset ticket
                    this._ticket = '';
                    // If either single data or series use item trigger
                    this._hideAxisPointer();
                    // Reset last hover and dispatch downplay action
                    this._resetLastHover();
                    this._showItemTooltipContent(dataModel, dataIndex, el.dataType, e);
                }
                api.dispatchAction({
                    type: 'showTip',
                    from: this.uid,
                    dataIndexInside: dataIndex,
                    dataIndex: data.getRawIndex(dataIndex),
                    seriesIndex: el.seriesIndex
                });
            }    // Tooltip provided directly. Like legend
            else if (el && el.tooltip) {
                var tooltipOpt = el.tooltip;
                if (typeof tooltipOpt === 'string') {
                    var content = tooltipOpt;
                    tooltipOpt = {
                        content: content,
                        formatter: content
                    };
                }
                var subTooltipModel = new Model(tooltipOpt, tooltipModel);
                var defaultHtml = subTooltipModel.get('content');
                var asyncTicket = Math.random();
                this._showTooltipContent(subTooltipModel, defaultHtml, subTooltipModel.get('formatterParams') || {}, asyncTicket, e.offsetX, e.offsetY, e.position, el, api);
            } else {
                if (globalTrigger === 'item') {
                    this._hide();
                } else {
                    // Try show axis tooltip
                    this._showAxisTooltip(tooltipModel, ecModel, e);
                }
                // Action of cross pointer
                // other pointer types will trigger action in _dispatchAndShowSeriesTooltipContent method
                if (tooltipModel.get('axisPointer.type') === 'cross') {
                    api.dispatchAction({
                        type: 'showTip',
                        from: this.uid,
                        x: e.offsetX,
                        y: e.offsetY
                    });
                }
            }
        },
        _showAxisTooltip: function (tooltipModel, ecModel, e) {
            var axisPointerModel = tooltipModel.getModel('axisPointer');
            var axisPointerType = axisPointerModel.get('type');
            if (axisPointerType === 'cross') {
                var el = e.target;
                if (el && el.dataIndex != null) {
                    var seriesModel = ecModel.getSeriesByIndex(el.seriesIndex);
                    var dataIndex = el.dataIndex;
                    this._showItemTooltipContent(seriesModel, dataIndex, el.dataType, e);
                }
            }
            this._showAxisPointer();
            var allNotShow = true;
            zrUtil.each(this._seriesGroupByAxis, function (seriesCoordSysSameAxis) {
                // Try show the axis pointer
                var allCoordSys = seriesCoordSysSameAxis.coordSys;
                var coordSys = allCoordSys[0];
                // If mouse position is not in the grid or polar
                var point = [
                        e.offsetX,
                        e.offsetY
                    ];
                if (!coordSys.containPoint(point)) {
                    // Hide axis pointer
                    this._hideAxisPointer(coordSys.name);
                    return;
                }
                allNotShow = false;
                // Make sure point is discrete on cateogry axis
                var dimensions = coordSys.dimensions;
                var value = coordSys.pointToData(point, true);
                point = coordSys.dataToPoint(value);
                var baseAxis = coordSys.getBaseAxis();
                var axisType = axisPointerModel.get('axis');
                if (axisType === 'auto') {
                    axisType = baseAxis.dim;
                }
                if (baseAxis.isBlank() || zrUtil.eqNaN(point[0]) || zrUtil.eqNaN(point[1])) {
                    this._hideAxisPointer(coordSys.name);
                    return;
                }
                var contentNotChange = false;
                var lastHover = this._lastHover;
                if (axisPointerType === 'cross') {
                    // If hover data not changed
                    // Possible when two axes are all category
                    if (dataEqual(lastHover.data, value)) {
                        contentNotChange = true;
                    }
                    lastHover.data = value;
                } else {
                    var valIndex = zrUtil.indexOf(dimensions, axisType);
                    // If hover data not changed on the axis dimension
                    if (lastHover.data === value[valIndex]) {
                        contentNotChange = true;
                    }
                    lastHover.data = value[valIndex];
                }
                var enableAnimation = tooltipModel.get('animation');
                if (coordSys.type === 'cartesian2d' && !contentNotChange) {
                    this._showCartesianPointer(axisPointerModel, coordSys, axisType, point, enableAnimation);
                } else if (coordSys.type === 'polar' && !contentNotChange) {
                    this._showPolarPointer(axisPointerModel, coordSys, axisType, point, enableAnimation);
                } else if (coordSys.type === 'singleAxis' && !contentNotChange) {
                    this._showSinglePointer(axisPointerModel, coordSys, axisType, point, enableAnimation);
                }
                if (axisPointerType !== 'cross') {
                    this._dispatchAndShowSeriesTooltipContent(coordSys, seriesCoordSysSameAxis.series, point, value, contentNotChange, e.position);
                }
            }, this);
            if (!this._tooltipModel.get('show')) {
                this._hideAxisPointer();
            }
            if (allNotShow) {
                this._hide();
            }
        },
        _showCartesianPointer: function (axisPointerModel, cartesian, axisType, point, enableAnimation) {
            var self = this;
            var axisPointerType = axisPointerModel.get('type');
            var baseAxis = cartesian.getBaseAxis();
            var moveAnimation = enableAnimation && axisPointerType !== 'cross' && baseAxis.type === 'category' && baseAxis.getBandWidth() > 20;
            if (axisPointerType === 'cross') {
                moveGridLine('x', point, cartesian.getAxis('y').getGlobalExtent());
                moveGridLine('y', point, cartesian.getAxis('x').getGlobalExtent());
                this._updateCrossText(cartesian, point, axisPointerModel);
            } else {
                var otherAxis = cartesian.getAxis(axisType === 'x' ? 'y' : 'x');
                var otherExtent = otherAxis.getGlobalExtent();
                if (cartesian.type === 'cartesian2d') {
                    (axisPointerType === 'line' ? moveGridLine : moveGridShadow)(axisType, point, otherExtent);
                }
            }
            /**
             * @inner
             */
            function moveGridLine(axisType, point, otherExtent) {
                var targetShape = axisType === 'x' ? makeLineShape(point[0], otherExtent[0], point[0], otherExtent[1]) : makeLineShape(otherExtent[0], point[1], otherExtent[1], point[1]);
                var pointerEl = self._getPointerElement(cartesian, axisPointerModel, axisType, targetShape);
                graphic.subPixelOptimizeLine({
                    shape: targetShape,
                    style: pointerEl.style
                });
                moveAnimation ? graphic.updateProps(pointerEl, { shape: targetShape }, axisPointerModel) : pointerEl.attr({ shape: targetShape });
            }
            /**
             * @inner
             */
            function moveGridShadow(axisType, point, otherExtent) {
                var axis = cartesian.getAxis(axisType);
                var bandWidth = axis.getBandWidth();
                var span = otherExtent[1] - otherExtent[0];
                var targetShape = axisType === 'x' ? makeRectShape(point[0] - bandWidth / 2, otherExtent[0], bandWidth, span) : makeRectShape(otherExtent[0], point[1] - bandWidth / 2, span, bandWidth);
                var pointerEl = self._getPointerElement(cartesian, axisPointerModel, axisType, targetShape);
                moveAnimation ? graphic.updateProps(pointerEl, { shape: targetShape }, axisPointerModel) : pointerEl.attr({ shape: targetShape });
            }
        },
        _showSinglePointer: function (axisPointerModel, single, axisType, point, enableAnimation) {
            var self = this;
            var axisPointerType = axisPointerModel.get('type');
            var moveAnimation = enableAnimation && axisPointerType !== 'cross' && single.getBaseAxis().type === 'category';
            var rect = single.getRect();
            var otherExtent = [
                    rect.y,
                    rect.y + rect.height
                ];
            moveSingleLine(axisType, point, otherExtent);
            /**
             * @inner
             */
            function moveSingleLine(axisType, point, otherExtent) {
                var axis = single.getAxis();
                var orient = axis.orient;
                var targetShape = orient === 'horizontal' ? makeLineShape(point[0], otherExtent[0], point[0], otherExtent[1]) : makeLineShape(otherExtent[0], point[1], otherExtent[1], point[1]);
                var pointerEl = self._getPointerElement(single, axisPointerModel, axisType, targetShape);
                moveAnimation ? graphic.updateProps(pointerEl, { shape: targetShape }, axisPointerModel) : pointerEl.attr({ shape: targetShape });
            }
        },
        _showPolarPointer: function (axisPointerModel, polar, axisType, point, enableAnimation) {
            var self = this;
            var axisPointerType = axisPointerModel.get('type');
            var angleAxis = polar.getAngleAxis();
            var radiusAxis = polar.getRadiusAxis();
            var moveAnimation = enableAnimation && axisPointerType !== 'cross' && polar.getBaseAxis().type === 'category';
            if (axisPointerType === 'cross') {
                movePolarLine('angle', point, radiusAxis.getExtent());
                movePolarLine('radius', point, angleAxis.getExtent());
                this._updateCrossText(polar, point, axisPointerModel);
            } else {
                var otherAxis = polar.getAxis(axisType === 'radius' ? 'angle' : 'radius');
                var otherExtent = otherAxis.getExtent();
                (axisPointerType === 'line' ? movePolarLine : movePolarShadow)(axisType, point, otherExtent);
            }
            /**
             * @inner
             */
            function movePolarLine(axisType, point, otherExtent) {
                var mouseCoord = polar.pointToCoord(point);
                var targetShape;
                if (axisType === 'angle') {
                    var p1 = polar.coordToPoint([
                            otherExtent[0],
                            mouseCoord[1]
                        ]);
                    var p2 = polar.coordToPoint([
                            otherExtent[1],
                            mouseCoord[1]
                        ]);
                    targetShape = makeLineShape(p1[0], p1[1], p2[0], p2[1]);
                } else {
                    targetShape = {
                        cx: polar.cx,
                        cy: polar.cy,
                        r: mouseCoord[0]
                    };
                }
                var pointerEl = self._getPointerElement(polar, axisPointerModel, axisType, targetShape);
                moveAnimation ? graphic.updateProps(pointerEl, { shape: targetShape }, axisPointerModel) : pointerEl.attr({ shape: targetShape });
            }
            /**
             * @inner
             */
            function movePolarShadow(axisType, point, otherExtent) {
                var axis = polar.getAxis(axisType);
                var bandWidth = axis.getBandWidth();
                var mouseCoord = polar.pointToCoord(point);
                var targetShape;
                var radian = Math.PI / 180;
                if (axisType === 'angle') {
                    targetShape = makeSectorShape(polar.cx, polar.cy, otherExtent[0], otherExtent[1], (-mouseCoord[1] - bandWidth / 2) * radian, (-mouseCoord[1] + bandWidth / 2) * radian);
                } else {
                    targetShape = makeSectorShape(polar.cx, polar.cy, mouseCoord[0] - bandWidth / 2, mouseCoord[0] + bandWidth / 2, 0, Math.PI * 2);
                }
                var pointerEl = self._getPointerElement(polar, axisPointerModel, axisType, targetShape);
                moveAnimation ? graphic.updateProps(pointerEl, { shape: targetShape }, axisPointerModel) : pointerEl.attr({ shape: targetShape });
            }
        },
        _updateCrossText: function (coordSys, point, axisPointerModel) {
            var crossStyleModel = axisPointerModel.getModel('crossStyle');
            var textStyleModel = crossStyleModel.getModel('textStyle');
            var tooltipModel = this._tooltipModel;
            var text = this._crossText;
            if (!text) {
                text = this._crossText = new graphic.Text({
                    style: {
                        textAlign: 'left',
                        textVerticalAlign: 'bottom'
                    }
                });
                this.group.add(text);
            }
            var value = coordSys.pointToData(point);
            var dims = coordSys.dimensions;
            value = zrUtil.map(value, function (val, idx) {
                var axis = coordSys.getAxis(dims[idx]);
                if (axis.type === 'category' || axis.type === 'time') {
                    val = axis.scale.getLabel(val);
                } else {
                    val = formatUtil.addCommas(val.toFixed(axis.getPixelPrecision()));
                }
                return val;
            });
            text.setStyle({
                fill: textStyleModel.getTextColor() || crossStyleModel.get('color'),
                textFont: textStyleModel.getFont(),
                text: value.join(', '),
                x: point[0] + 5,
                y: point[1] - 5
            });
            text.z = tooltipModel.get('z');
            text.zlevel = tooltipModel.get('zlevel');
        },
        _getPointerElement: function (coordSys, pointerModel, axisType, initShape) {
            var tooltipModel = this._tooltipModel;
            var z = tooltipModel.get('z');
            var zlevel = tooltipModel.get('zlevel');
            var axisPointers = this._axisPointers;
            var coordSysName = coordSys.name;
            axisPointers[coordSysName] = axisPointers[coordSysName] || {};
            if (axisPointers[coordSysName][axisType]) {
                return axisPointers[coordSysName][axisType];
            }
            // Create if not exists
            var pointerType = pointerModel.get('type');
            var styleModel = pointerModel.getModel(pointerType + 'Style');
            var isShadow = pointerType === 'shadow';
            var style = styleModel[isShadow ? 'getAreaStyle' : 'getLineStyle']();
            var elementType = coordSys.type === 'polar' ? isShadow ? 'Sector' : axisType === 'radius' ? 'Circle' : 'Line' : isShadow ? 'Rect' : 'Line';
            isShadow ? style.stroke = null : style.fill = null;
            var el = axisPointers[coordSysName][axisType] = new graphic[elementType]({
                    style: style,
                    z: z,
                    zlevel: zlevel,
                    silent: true,
                    shape: initShape
                });
            this.group.add(el);
            return el;
        },
        _dispatchAndShowSeriesTooltipContent: function (coordSys, seriesList, point, value, contentNotChange, positionExpr) {
            var rootTooltipModel = this._tooltipModel;
            var baseAxis = coordSys.getBaseAxis();
            var baseDimIndex = {
                    x: 1,
                    radius: 1,
                    single: 1
                }[baseAxis.dim] ? 0 : 1;
            if (!seriesList.length) {
                return;
            }
            var payloadBatch = zrUtil.map(seriesList, function (series) {
                    return {
                        seriesIndex: series.seriesIndex,
                        dataIndexInside: series.getAxisTooltipDataIndex ? series.getAxisTooltipDataIndex(series.coordDimToDataDim(baseAxis.dim), value, baseAxis) : series.getData().indexOfNearest(series.coordDimToDataDim(baseAxis.dim)[0], value[baseDimIndex], false, baseAxis.type === 'category' ? 0.5 : null)
                    };
                });
            var sampleSeriesIndex;
            zrUtil.each(payloadBatch, function (payload, idx) {
                if (seriesList[idx].getData().hasValue(payload.dataIndexInside)) {
                    sampleSeriesIndex = idx;
                }
            });
            // Fallback to 0.
            sampleSeriesIndex = sampleSeriesIndex || 0;
            var lastHover = this._lastHover;
            var api = this._api;
            // Dispatch downplay action
            if (lastHover.payloadBatch && !contentNotChange) {
                api.dispatchAction({
                    type: 'downplay',
                    batch: lastHover.payloadBatch
                });
            }
            // Dispatch highlight action
            if (!contentNotChange) {
                api.dispatchAction({
                    type: 'highlight',
                    batch: payloadBatch
                });
                lastHover.payloadBatch = payloadBatch;
            }
            // Dispatch showTip action
            var dataIndex = payloadBatch[sampleSeriesIndex].dataIndexInside;
            api.dispatchAction({
                type: 'showTip',
                dataIndexInside: dataIndex,
                dataIndex: seriesList[sampleSeriesIndex].getData().getRawIndex(dataIndex),
                seriesIndex: payloadBatch[sampleSeriesIndex].seriesIndex,
                from: this.uid
            });
            if (baseAxis && rootTooltipModel.get('showContent') && rootTooltipModel.get('show')) {
                var paramsList = zrUtil.map(seriesList, function (series, index) {
                        return series.getDataParams(payloadBatch[index].dataIndexInside);
                    });
                if (!contentNotChange) {
                    // Update html content
                    var firstDataIndex = payloadBatch[sampleSeriesIndex].dataIndexInside;
                    // Default tooltip content
                    // FIXME
                    // (1) shold be the first data which has name?
                    // (2) themeRiver, firstDataIndex is array, and first line is unnecessary.
                    var firstLine = baseAxis.type === 'time' ? baseAxis.scale.getLabel(value[baseDimIndex]) : seriesList[sampleSeriesIndex].getData().getName(firstDataIndex);
                    var defaultHtml = (firstLine ? formatUtil.encodeHTML(firstLine) + '<br />' : '') + zrUtil.map(seriesList, function (series, index) {
                            return series.formatTooltip(payloadBatch[index].dataIndexInside, true);
                        }).join('<br />');
                    var asyncTicket = 'axis_' + coordSys.name + '_' + firstDataIndex;
                    this._showTooltipContent(rootTooltipModel, defaultHtml, paramsList, asyncTicket, point[0], point[1], positionExpr, null, api);
                } else {
                    updatePosition(positionExpr || rootTooltipModel.get('position'), point[0], point[1], rootTooltipModel.get('confine'), this._tooltipContent, paramsList, null, api);
                }
            }
        },
        _showItemTooltipContent: function (seriesModel, dataIndex, dataType, e) {
            // FIXME Graph data
            var api = this._api;
            var data = seriesModel.getData(dataType);
            var itemModel = data.getItemModel(dataIndex);
            var tooltipOpt = itemModel.get('tooltip', true);
            if (typeof tooltipOpt === 'string') {
                // In each data item tooltip can be simply write:
                // {
                //  value: 10,
                //  tooltip: 'Something you need to know'
                // }
                var tooltipContent = tooltipOpt;
                tooltipOpt = { formatter: tooltipContent };
            }
            var rootTooltipModel = this._tooltipModel;
            var seriesTooltipModel = seriesModel.getModel('tooltip', rootTooltipModel);
            var tooltipModel = new Model(tooltipOpt, seriesTooltipModel, seriesTooltipModel.ecModel);
            var params = seriesModel.getDataParams(dataIndex, dataType);
            var defaultHtml = seriesModel.formatTooltip(dataIndex, false, dataType);
            var asyncTicket = 'item_' + seriesModel.name + '_' + dataIndex;
            this._showTooltipContent(tooltipModel, defaultHtml, params, asyncTicket, e.offsetX, e.offsetY, e.position, e.target, api);
        },
        _showTooltipContent: function (tooltipModel, defaultHtml, params, asyncTicket, x, y, positionExpr, target, api) {
            // Reset ticket
            this._ticket = '';
            if (tooltipModel.get('showContent') && tooltipModel.get('show')) {
                var tooltipContent = this._tooltipContent;
                var confine = tooltipModel.get('confine');
                var formatter = tooltipModel.get('formatter');
                positionExpr = positionExpr || tooltipModel.get('position');
                var html = defaultHtml;
                if (formatter) {
                    if (typeof formatter === 'string') {
                        html = formatUtil.formatTpl(formatter, params, true);
                    } else if (typeof formatter === 'function') {
                        var self = this;
                        var ticket = asyncTicket;
                        var callback = function (cbTicket, html) {
                            if (cbTicket === self._ticket) {
                                tooltipContent.setContent(html);
                                updatePosition(positionExpr, x, y, confine, tooltipContent, params, target, api);
                            }
                        };
                        self._ticket = ticket;
                        html = formatter(params, ticket, callback);
                    }
                }
                tooltipContent.show(tooltipModel);
                tooltipContent.setContent(html);
                updatePosition(positionExpr, x, y, confine, tooltipContent, params, target, api);
            }
        },
        _showAxisPointer: function (coordSysName) {
            if (coordSysName) {
                var axisPointers = this._axisPointers[coordSysName];
                axisPointers && zrUtil.each(axisPointers, function (el) {
                    el.show();
                });
            } else {
                this.group.eachChild(function (child) {
                    child.show();
                });
                this.group.show();
            }
        },
        _resetLastHover: function () {
            var lastHover = this._lastHover;
            if (lastHover.payloadBatch) {
                this._api.dispatchAction({
                    type: 'downplay',
                    batch: lastHover.payloadBatch
                });
            }
            // Reset lastHover
            this._lastHover = {};
        },
        _hideAxisPointer: function (coordSysName) {
            if (coordSysName) {
                var axisPointers = this._axisPointers[coordSysName];
                axisPointers && zrUtil.each(axisPointers, function (el) {
                    el.hide();
                });
            } else {
                if (this.group.children().length) {
                    this.group.hide();
                }
            }
        },
        _hide: function () {
            clearTimeout(this._showTimeout);
            this._hideAxisPointer();
            this._resetLastHover();
            if (!this._alwaysShowContent) {
                this._tooltipContent.hideLater(this._tooltipModel.get('hideDelay'));
            }
            this._api.dispatchAction({
                type: 'hideTip',
                from: this.uid
            });
            this._lastX = this._lastY = null;
        },
        dispose: function (ecModel, api) {
            if (env.node) {
                return;
            }
            var zr = api.getZr();
            this._tooltipContent.hide();
            zr.off('click', this._tryShow);
            zr.off('mousemove', this._mousemove);
            zr.off('mouseout', this._hide);
            zr.off('globalout', this._hide);
        }
    });
});
define('echarts/component/marker/MarkPointModel', ['require', './MarkerModel'], function (require) {
    return require('./MarkerModel').extend({
        type: 'markPoint',
        defaultOption: {
            zlevel: 0,
            z: 5,
            symbol: 'pin',
            symbolSize: 50,
            tooltip: { trigger: 'item' },
            label: {
                normal: {
                    show: true,
                    position: 'inside'
                },
                emphasis: { show: true }
            },
            itemStyle: { normal: { borderWidth: 2 } }
        }
    });
});
define('echarts/component/marker/MarkPointView', ['require', '../../chart/helper/SymbolDraw', 'zrender/core/util', '../../util/number', '../../data/List', './markerHelper', './MarkerView'], function (require) {
    var SymbolDraw = require('../../chart/helper/SymbolDraw');
    var zrUtil = require('zrender/core/util');
    var numberUtil = require('../../util/number');
    var List = require('../../data/List');
    var markerHelper = require('./markerHelper');
    function updateMarkerLayout(mpData, seriesModel, api) {
        var coordSys = seriesModel.coordinateSystem;
        mpData.each(function (idx) {
            var itemModel = mpData.getItemModel(idx);
            var point;
            var xPx = numberUtil.parsePercent(itemModel.get('x'), api.getWidth());
            var yPx = numberUtil.parsePercent(itemModel.get('y'), api.getHeight());
            if (!isNaN(xPx) && !isNaN(yPx)) {
                point = [
                    xPx,
                    yPx
                ];
            }    // Chart like bar may have there own marker positioning logic
            else if (seriesModel.getMarkerPosition) {
                // Use the getMarkerPoisition
                point = seriesModel.getMarkerPosition(mpData.getValues(mpData.dimensions, idx));
            } else if (coordSys) {
                var x = mpData.get(coordSys.dimensions[0], idx);
                var y = mpData.get(coordSys.dimensions[1], idx);
                point = coordSys.dataToPoint([
                    x,
                    y
                ]);
            }
            // Use x, y if has any
            if (!isNaN(xPx)) {
                point[0] = xPx;
            }
            if (!isNaN(yPx)) {
                point[1] = yPx;
            }
            mpData.setItemLayout(idx, point);
        });
    }
    require('./MarkerView').extend({
        type: 'markPoint',
        updateLayout: function (markPointModel, ecModel, api) {
            ecModel.eachSeries(function (seriesModel) {
                var mpModel = seriesModel.markPointModel;
                if (mpModel) {
                    updateMarkerLayout(mpModel.getData(), seriesModel, api);
                    this.markerGroupMap[seriesModel.name].updateLayout(mpModel);
                }
            }, this);
        },
        renderSeries: function (seriesModel, mpModel, ecModel, api) {
            var coordSys = seriesModel.coordinateSystem;
            var seriesName = seriesModel.name;
            var seriesData = seriesModel.getData();
            var symbolDrawMap = this.markerGroupMap;
            var symbolDraw = symbolDrawMap[seriesName];
            if (!symbolDraw) {
                symbolDraw = symbolDrawMap[seriesName] = new SymbolDraw();
            }
            var mpData = createList(coordSys, seriesModel, mpModel);
            // FIXME
            mpModel.setData(mpData);
            updateMarkerLayout(mpModel.getData(), seriesModel, api);
            mpData.each(function (idx) {
                var itemModel = mpData.getItemModel(idx);
                var symbolSize = itemModel.getShallow('symbolSize');
                if (typeof symbolSize === 'function') {
                    // FIXME 这里不兼容 ECharts 2.x，2.x 貌似参数是整个数据？
                    symbolSize = symbolSize(mpModel.getRawValue(idx), mpModel.getDataParams(idx));
                }
                mpData.setItemVisual(idx, {
                    symbolSize: symbolSize,
                    color: itemModel.get('itemStyle.normal.color') || seriesData.getVisual('color'),
                    symbol: itemModel.getShallow('symbol')
                });
            });
            // TODO Text are wrong
            symbolDraw.updateData(mpData);
            this.group.add(symbolDraw.group);
            // Set host model for tooltip
            // FIXME
            mpData.eachItemGraphicEl(function (el) {
                el.traverse(function (child) {
                    child.dataModel = mpModel;
                });
            });
            symbolDraw.__keep = true;
            symbolDraw.group.silent = mpModel.get('silent') || seriesModel.get('silent');
        }
    });
    /**
     * @inner
     * @param {module:echarts/coord/*} [coordSys]
     * @param {module:echarts/model/Series} seriesModel
     * @param {module:echarts/model/Model} mpModel
     */
    function createList(coordSys, seriesModel, mpModel) {
        var coordDimsInfos;
        if (coordSys) {
            coordDimsInfos = zrUtil.map(coordSys && coordSys.dimensions, function (coordDim) {
                var info = seriesModel.getData().getDimensionInfo(seriesModel.coordDimToDataDim(coordDim)[0]) || {};
                // In map series data don't have lng and lat dimension. Fallback to same with coordSys
                info.name = coordDim;
                return info;
            });
        } else {
            coordDimsInfos = [{
                    name: 'value',
                    type: 'float'
                }];
        }
        var mpData = new List(coordDimsInfos, mpModel);
        var dataOpt = zrUtil.map(mpModel.get('data'), zrUtil.curry(markerHelper.dataTransform, seriesModel));
        if (coordSys) {
            dataOpt = zrUtil.filter(dataOpt, zrUtil.curry(markerHelper.dataFilter, coordSys));
        }
        mpData.initData(dataOpt, null, coordSys ? markerHelper.dimValueGetter : function (item) {
            return item.value;
        });
        return mpData;
    }
});
define('echarts/scale/Interval', ['require', '../util/number', '../util/format', './Scale'], function (require) {
    var numberUtil = require('../util/number');
    var formatUtil = require('../util/format');
    var Scale = require('./Scale');
    var mathFloor = Math.floor;
    var mathCeil = Math.ceil;
    var getPrecisionSafe = numberUtil.getPrecisionSafe;
    var roundingErrorFix = numberUtil.round;
    /**
     * @alias module:echarts/coord/scale/Interval
     * @constructor
     */
    var IntervalScale = Scale.extend({
            type: 'interval',
            _interval: 0,
            setExtent: function (start, end) {
                var thisExtent = this._extent;
                //start,end may be a Number like '25',so...
                if (!isNaN(start)) {
                    thisExtent[0] = parseFloat(start);
                }
                if (!isNaN(end)) {
                    thisExtent[1] = parseFloat(end);
                }
            },
            unionExtent: function (other) {
                var extent = this._extent;
                other[0] < extent[0] && (extent[0] = other[0]);
                other[1] > extent[1] && (extent[1] = other[1]);
                // unionExtent may called by it's sub classes
                IntervalScale.prototype.setExtent.call(this, extent[0], extent[1]);
            },
            getInterval: function () {
                if (!this._interval) {
                    this.niceTicks();
                }
                return this._interval;
            },
            setInterval: function (interval) {
                this._interval = interval;
                // Dropped auto calculated niceExtent and use user setted extent
                // We assume user wan't to set both interval, min, max to get a better result
                this._niceExtent = this._extent.slice();
            },
            getTicks: function () {
                if (!this._interval) {
                    this.niceTicks();
                }
                var interval = this._interval;
                var extent = this._extent;
                var ticks = [];
                // Consider this case: using dataZoom toolbox, zoom and zoom.
                var safeLimit = 10000;
                if (interval) {
                    var niceExtent = this._niceExtent;
                    var precision = getPrecisionSafe(interval) + 2;
                    if (extent[0] < niceExtent[0]) {
                        ticks.push(extent[0]);
                    }
                    var tick = niceExtent[0];
                    while (tick <= niceExtent[1]) {
                        ticks.push(tick);
                        // Avoid rounding error
                        tick = roundingErrorFix(tick + interval, precision);
                        if (ticks.length > safeLimit) {
                            return [];
                        }
                    }
                    // Consider this case: the last item of ticks is smaller
                    // than niceExtent[1] and niceExtent[1] === extent[1].
                    if (extent[1] > (ticks.length ? ticks[ticks.length - 1] : niceExtent[1])) {
                        ticks.push(extent[1]);
                    }
                }
                return ticks;
            },
            getTicksLabels: function () {
                var labels = [];
                var ticks = this.getTicks();
                for (var i = 0; i < ticks.length; i++) {
                    labels.push(this.getLabel(ticks[i]));
                }
                return labels;
            },
            getLabel: function (data) {
                return formatUtil.addCommas(data);
            },
            niceTicks: function (splitNumber) {
                splitNumber = splitNumber || 5;
                var extent = this._extent;
                var span = extent[1] - extent[0];
                if (!isFinite(span)) {
                    return;
                }
                // User may set axis min 0 and data are all negative
                // FIXME If it needs to reverse ?
                if (span < 0) {
                    span = -span;
                    extent.reverse();
                }
                // From "Nice Numbers for Graph Labels" of Graphic Gems
                // var niceSpan = numberUtil.nice(span, false);
                var step = roundingErrorFix(numberUtil.nice(span / splitNumber, true), Math.max(getPrecisionSafe(extent[0]), getPrecisionSafe(extent[1])) + 2);
                var precision = getPrecisionSafe(step) + 2;
                // Niced extent inside original extent
                var niceExtent = [
                        roundingErrorFix(mathCeil(extent[0] / step) * step, precision),
                        roundingErrorFix(mathFloor(extent[1] / step) * step, precision)
                    ];
                this._interval = step;
                this._niceExtent = niceExtent;
            },
            niceExtent: function (splitNumber, fixMin, fixMax) {
                var extent = this._extent;
                // If extent start and end are same, expand them
                if (extent[0] === extent[1]) {
                    if (extent[0] !== 0) {
                        // Expand extent
                        var expandSize = extent[0];
                        // In the fowllowing case
                        //      Axis has been fixed max 100
                        //      Plus data are all 100 and axis extent are [100, 100].
                        // Extend to the both side will cause expanded max is larger than fixed max.
                        // So only expand to the smaller side.
                        if (!fixMax) {
                            extent[1] += expandSize / 2;
                            extent[0] -= expandSize / 2;
                        } else {
                            extent[0] -= expandSize / 2;
                        }
                    } else {
                        extent[1] = 1;
                    }
                }
                var span = extent[1] - extent[0];
                // If there are no data and extent are [Infinity, -Infinity]
                if (!isFinite(span)) {
                    extent[0] = 0;
                    extent[1] = 1;
                }
                this.niceTicks(splitNumber);
                // var extent = this._extent;
                var interval = this._interval;
                if (!fixMin) {
                    extent[0] = roundingErrorFix(mathFloor(extent[0] / interval) * interval);
                }
                if (!fixMax) {
                    extent[1] = roundingErrorFix(mathCeil(extent[1] / interval) * interval);
                }
            }
        });
    /**
     * @return {module:echarts/scale/Time}
     */
    IntervalScale.create = function () {
        return new IntervalScale();
    };
    return IntervalScale;
});
define('echarts/scale/Scale', ['require', '../util/clazz'], function (require) {
    var clazzUtil = require('../util/clazz');
    function Scale() {
        /**
         * Extent
         * @type {Array.<number>}
         * @protected
         */
        this._extent = [
            Infinity,
            -Infinity
        ];
        /**
         * Step is calculated in adjustExtent
         * @type {Array.<number>}
         * @protected
         */
        this._interval = 0;
        this.init && this.init.apply(this, arguments);
    }
    var scaleProto = Scale.prototype;
    /**
     * Parse input val to valid inner number.
     * @param {*} val
     * @return {number}
     */
    scaleProto.parse = function (val) {
        // Notice: This would be a trap here, If the implementation
        // of this method depends on extent, and this method is used
        // before extent set (like in dataZoom), it would be wrong.
        // Nevertheless, parse does not depend on extent generally.
        return val;
    };
    scaleProto.contain = function (val) {
        var extent = this._extent;
        return val >= extent[0] && val <= extent[1];
    };
    /**
     * Normalize value to linear [0, 1], return 0.5 if extent span is 0
     * @param {number} val
     * @return {number}
     */
    scaleProto.normalize = function (val) {
        var extent = this._extent;
        if (extent[1] === extent[0]) {
            return 0.5;
        }
        return (val - extent[0]) / (extent[1] - extent[0]);
    };
    /**
     * Scale normalized value
     * @param {number} val
     * @return {number}
     */
    scaleProto.scale = function (val) {
        var extent = this._extent;
        return val * (extent[1] - extent[0]) + extent[0];
    };
    /**
     * Set extent from data
     * @param {Array.<number>} other
     */
    scaleProto.unionExtent = function (other) {
        var extent = this._extent;
        other[0] < extent[0] && (extent[0] = other[0]);
        other[1] > extent[1] && (extent[1] = other[1]);    // not setExtent because in log axis it may transformed to power
                                                           // this.setExtent(extent[0], extent[1]);
    };
    /**
     * Set extent from data
     * @param {module:echarts/data/List} data
     * @param {string} dim
     */
    scaleProto.unionExtentFromData = function (data, dim) {
        this.unionExtent(data.getDataExtent(dim, true));
    };
    /**
     * Get extent
     * @return {Array.<number>}
     */
    scaleProto.getExtent = function () {
        return this._extent.slice();
    };
    /**
     * Set extent
     * @param {number} start
     * @param {number} end
     */
    scaleProto.setExtent = function (start, end) {
        var thisExtent = this._extent;
        if (!isNaN(start)) {
            thisExtent[0] = start;
        }
        if (!isNaN(end)) {
            thisExtent[1] = end;
        }
    };
    /**
     * @return {Array.<string>}
     */
    scaleProto.getTicksLabels = function () {
        var labels = [];
        var ticks = this.getTicks();
        for (var i = 0; i < ticks.length; i++) {
            labels.push(this.getLabel(ticks[i]));
        }
        return labels;
    };
    clazzUtil.enableClassExtend(Scale);
    clazzUtil.enableClassManagement(Scale, { registerWhenExtend: true });
    return Scale;
});
define('echarts/model/globalDefault', [], function () {
    var platform = '';
    // Navigator not exists in node
    if (typeof navigator !== 'undefined') {
        platform = navigator.platform || '';
    }
    return {
        color: [
            '#c23531',
            '#2f4554',
            '#61a0a8',
            '#d48265',
            '#91c7ae',
            '#749f83',
            '#ca8622',
            '#bda29a',
            '#6e7074',
            '#546570',
            '#c4ccd3'
        ],
        textStyle: {
            fontFamily: platform.match(/^Win/) ? 'Microsoft YaHei' : 'sans-serif',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 'normal'
        },
        blendMode: null,
        animation: true,
        animationDuration: 1000,
        animationDurationUpdate: 300,
        animationEasing: 'exponentialOut',
        animationEasingUpdate: 'cubicOut',
        animationThreshold: 2000,
        progressiveThreshold: 3000,
        progressive: 400,
        hoverLayerThreshold: 3000
    };
});
define('echarts/model/mixin/colorPalette', ['require', '../../util/clazz'], function (require) {
    var classUtil = require('../../util/clazz');
    var set = classUtil.set;
    var get = classUtil.get;
    return {
        clearColorPalette: function () {
            set(this, 'colorIdx', 0);
            set(this, 'colorNameMap', {});
        },
        getColorFromPalette: function (name, scope) {
            scope = scope || this;
            var colorIdx = get(scope, 'colorIdx') || 0;
            var colorNameMap = get(scope, 'colorNameMap') || set(scope, 'colorNameMap', {});
            if (colorNameMap[name]) {
                return colorNameMap[name];
            }
            var colorPalette = this.get('color', true) || [];
            if (!colorPalette.length) {
                return;
            }
            var color = colorPalette[colorIdx];
            if (name) {
                colorNameMap[name] = color;
            }
            set(scope, 'colorIdx', (colorIdx + 1) % colorPalette.length);
            return color;
        }
    };
});
define('zrender/tool/path', ['require', '../graphic/Path', '../core/PathProxy', './transformPath', '../core/matrix'], function (require) {
    var Path = require('../graphic/Path');
    var PathProxy = require('../core/PathProxy');
    var transformPath = require('./transformPath');
    var matrix = require('../core/matrix');
    // command chars
    var cc = [
            'm',
            'M',
            'l',
            'L',
            'v',
            'V',
            'h',
            'H',
            'z',
            'Z',
            'c',
            'C',
            'q',
            'Q',
            't',
            'T',
            's',
            'S',
            'a',
            'A'
        ];
    var mathSqrt = Math.sqrt;
    var mathSin = Math.sin;
    var mathCos = Math.cos;
    var PI = Math.PI;
    var vMag = function (v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    };
    var vRatio = function (u, v) {
        return (u[0] * v[0] + u[1] * v[1]) / (vMag(u) * vMag(v));
    };
    var vAngle = function (u, v) {
        return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(vRatio(u, v));
    };
    function processArc(x1, y1, x2, y2, fa, fs, rx, ry, psiDeg, cmd, path) {
        var psi = psiDeg * (PI / 180);
        var xp = mathCos(psi) * (x1 - x2) / 2 + mathSin(psi) * (y1 - y2) / 2;
        var yp = -1 * mathSin(psi) * (x1 - x2) / 2 + mathCos(psi) * (y1 - y2) / 2;
        var lambda = xp * xp / (rx * rx) + yp * yp / (ry * ry);
        if (lambda > 1) {
            rx *= mathSqrt(lambda);
            ry *= mathSqrt(lambda);
        }
        var f = (fa === fs ? -1 : 1) * mathSqrt((rx * rx * (ry * ry) - rx * rx * (yp * yp) - ry * ry * (xp * xp)) / (rx * rx * (yp * yp) + ry * ry * (xp * xp))) || 0;
        var cxp = f * rx * yp / ry;
        var cyp = f * -ry * xp / rx;
        var cx = (x1 + x2) / 2 + mathCos(psi) * cxp - mathSin(psi) * cyp;
        var cy = (y1 + y2) / 2 + mathSin(psi) * cxp + mathCos(psi) * cyp;
        var theta = vAngle([
                1,
                0
            ], [
                (xp - cxp) / rx,
                (yp - cyp) / ry
            ]);
        var u = [
                (xp - cxp) / rx,
                (yp - cyp) / ry
            ];
        var v = [
                (-1 * xp - cxp) / rx,
                (-1 * yp - cyp) / ry
            ];
        var dTheta = vAngle(u, v);
        if (vRatio(u, v) <= -1) {
            dTheta = PI;
        }
        if (vRatio(u, v) >= 1) {
            dTheta = 0;
        }
        if (fs === 0 && dTheta > 0) {
            dTheta = dTheta - 2 * PI;
        }
        if (fs === 1 && dTheta < 0) {
            dTheta = dTheta + 2 * PI;
        }
        path.addData(cmd, cx, cy, rx, ry, theta, dTheta, psi, fs);
    }
    function createPathProxyFromString(data) {
        if (!data) {
            return [];
        }
        // command string
        var cs = data.replace(/-/g, ' -').replace(/  /g, ' ').replace(/ /g, ',').replace(/,,/g, ',');
        var n;
        // create pipes so that we can split the data
        for (n = 0; n < cc.length; n++) {
            cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
        }
        // create array
        var arr = cs.split('|');
        // init context point
        var cpx = 0;
        var cpy = 0;
        var path = new PathProxy();
        var CMD = PathProxy.CMD;
        var prevCmd;
        for (n = 1; n < arr.length; n++) {
            var str = arr[n];
            var c = str.charAt(0);
            var off = 0;
            var p = str.slice(1).replace(/e,-/g, 'e-').split(',');
            var cmd;
            if (p.length > 0 && p[0] === '') {
                p.shift();
            }
            for (var i = 0; i < p.length; i++) {
                p[i] = parseFloat(p[i]);
            }
            while (off < p.length && !isNaN(p[off])) {
                if (isNaN(p[0])) {
                    break;
                }
                var ctlPtx;
                var ctlPty;
                var rx;
                var ry;
                var psi;
                var fa;
                var fs;
                var x1 = cpx;
                var y1 = cpy;
                // convert l, H, h, V, and v to L
                switch (c) {
                case 'l':
                    cpx += p[off++];
                    cpy += p[off++];
                    cmd = CMD.L;
                    path.addData(cmd, cpx, cpy);
                    break;
                case 'L':
                    cpx = p[off++];
                    cpy = p[off++];
                    cmd = CMD.L;
                    path.addData(cmd, cpx, cpy);
                    break;
                case 'm':
                    cpx += p[off++];
                    cpy += p[off++];
                    cmd = CMD.M;
                    path.addData(cmd, cpx, cpy);
                    c = 'l';
                    break;
                case 'M':
                    cpx = p[off++];
                    cpy = p[off++];
                    cmd = CMD.M;
                    path.addData(cmd, cpx, cpy);
                    c = 'L';
                    break;
                case 'h':
                    cpx += p[off++];
                    cmd = CMD.L;
                    path.addData(cmd, cpx, cpy);
                    break;
                case 'H':
                    cpx = p[off++];
                    cmd = CMD.L;
                    path.addData(cmd, cpx, cpy);
                    break;
                case 'v':
                    cpy += p[off++];
                    cmd = CMD.L;
                    path.addData(cmd, cpx, cpy);
                    break;
                case 'V':
                    cpy = p[off++];
                    cmd = CMD.L;
                    path.addData(cmd, cpx, cpy);
                    break;
                case 'C':
                    cmd = CMD.C;
                    path.addData(cmd, p[off++], p[off++], p[off++], p[off++], p[off++], p[off++]);
                    cpx = p[off - 2];
                    cpy = p[off - 1];
                    break;
                case 'c':
                    cmd = CMD.C;
                    path.addData(cmd, p[off++] + cpx, p[off++] + cpy, p[off++] + cpx, p[off++] + cpy, p[off++] + cpx, p[off++] + cpy);
                    cpx += p[off - 2];
                    cpy += p[off - 1];
                    break;
                case 'S':
                    ctlPtx = cpx;
                    ctlPty = cpy;
                    var len = path.len();
                    var pathData = path.data;
                    if (prevCmd === CMD.C) {
                        ctlPtx += cpx - pathData[len - 4];
                        ctlPty += cpy - pathData[len - 3];
                    }
                    cmd = CMD.C;
                    x1 = p[off++];
                    y1 = p[off++];
                    cpx = p[off++];
                    cpy = p[off++];
                    path.addData(cmd, ctlPtx, ctlPty, x1, y1, cpx, cpy);
                    break;
                case 's':
                    ctlPtx = cpx;
                    ctlPty = cpy;
                    var len = path.len();
                    var pathData = path.data;
                    if (prevCmd === CMD.C) {
                        ctlPtx += cpx - pathData[len - 4];
                        ctlPty += cpy - pathData[len - 3];
                    }
                    cmd = CMD.C;
                    x1 = cpx + p[off++];
                    y1 = cpy + p[off++];
                    cpx += p[off++];
                    cpy += p[off++];
                    path.addData(cmd, ctlPtx, ctlPty, x1, y1, cpx, cpy);
                    break;
                case 'Q':
                    x1 = p[off++];
                    y1 = p[off++];
                    cpx = p[off++];
                    cpy = p[off++];
                    cmd = CMD.Q;
                    path.addData(cmd, x1, y1, cpx, cpy);
                    break;
                case 'q':
                    x1 = p[off++] + cpx;
                    y1 = p[off++] + cpy;
                    cpx += p[off++];
                    cpy += p[off++];
                    cmd = CMD.Q;
                    path.addData(cmd, x1, y1, cpx, cpy);
                    break;
                case 'T':
                    ctlPtx = cpx;
                    ctlPty = cpy;
                    var len = path.len();
                    var pathData = path.data;
                    if (prevCmd === CMD.Q) {
                        ctlPtx += cpx - pathData[len - 4];
                        ctlPty += cpy - pathData[len - 3];
                    }
                    cpx = p[off++];
                    cpy = p[off++];
                    cmd = CMD.Q;
                    path.addData(cmd, ctlPtx, ctlPty, cpx, cpy);
                    break;
                case 't':
                    ctlPtx = cpx;
                    ctlPty = cpy;
                    var len = path.len();
                    var pathData = path.data;
                    if (prevCmd === CMD.Q) {
                        ctlPtx += cpx - pathData[len - 4];
                        ctlPty += cpy - pathData[len - 3];
                    }
                    cpx += p[off++];
                    cpy += p[off++];
                    cmd = CMD.Q;
                    path.addData(cmd, ctlPtx, ctlPty, cpx, cpy);
                    break;
                case 'A':
                    rx = p[off++];
                    ry = p[off++];
                    psi = p[off++];
                    fa = p[off++];
                    fs = p[off++];
                    x1 = cpx, y1 = cpy;
                    cpx = p[off++];
                    cpy = p[off++];
                    cmd = CMD.A;
                    processArc(x1, y1, cpx, cpy, fa, fs, rx, ry, psi, cmd, path);
                    break;
                case 'a':
                    rx = p[off++];
                    ry = p[off++];
                    psi = p[off++];
                    fa = p[off++];
                    fs = p[off++];
                    x1 = cpx, y1 = cpy;
                    cpx += p[off++];
                    cpy += p[off++];
                    cmd = CMD.A;
                    processArc(x1, y1, cpx, cpy, fa, fs, rx, ry, psi, cmd, path);
                    break;
                }
            }
            if (c === 'z' || c === 'Z') {
                cmd = CMD.Z;
                path.addData(cmd);
            }
            prevCmd = cmd;
        }
        path.toStatic();
        return path;
    }
    // TODO Optimize double memory cost problem
    function createPathOptions(str, opts) {
        var pathProxy = createPathProxyFromString(str);
        var transform;
        opts = opts || {};
        opts.buildPath = function (path) {
            path.setData(pathProxy.data);
            transform && transformPath(path, transform);
            // Svg and vml renderer don't have context
            var ctx = path.getContext();
            if (ctx) {
                path.rebuildPath(ctx);
            }
        };
        opts.applyTransform = function (m) {
            if (!transform) {
                transform = matrix.create();
            }
            matrix.mul(transform, m, transform);
            this.dirty(true);
        };
        return opts;
    }
    return {
        createFromString: function (str, opts) {
            return new Path(createPathOptions(str, opts));
        },
        extendFromString: function (str, opts) {
            return Path.extend(createPathOptions(str, opts));
        },
        mergePath: function (pathEls, opts) {
            var pathList = [];
            var len = pathEls.length;
            for (var i = 0; i < len; i++) {
                var pathEl = pathEls[i];
                if (pathEl.__dirty) {
                    pathEl.buildPath(pathEl.path, pathEl.shape, true);
                }
                pathList.push(pathEl.path);
            }
            var pathBundle = new Path(opts);
            pathBundle.buildPath = function (path) {
                path.appendPath(pathList);
                // Svg and vml renderer don't have context
                var ctx = path.getContext();
                if (ctx) {
                    path.rebuildPath(ctx);
                }
            };
            return pathBundle;
        }
    };
});
define('zrender/graphic/Path', ['require', './Displayable', '../core/util', '../core/PathProxy', '../contain/path', './Pattern'], function (require) {
    var Displayable = require('./Displayable');
    var zrUtil = require('../core/util');
    var PathProxy = require('../core/PathProxy');
    var pathContain = require('../contain/path');
    var Pattern = require('./Pattern');
    var getCanvasPattern = Pattern.prototype.getCanvasPattern;
    var abs = Math.abs;
    /**
     * @alias module:zrender/graphic/Path
     * @extends module:zrender/graphic/Displayable
     * @constructor
     * @param {Object} opts
     */
    function Path(opts) {
        Displayable.call(this, opts);
        /**
         * @type {module:zrender/core/PathProxy}
         * @readOnly
         */
        this.path = new PathProxy();
    }
    Path.prototype = {
        constructor: Path,
        type: 'path',
        __dirtyPath: true,
        strokeContainThreshold: 5,
        brush: function (ctx, prevEl) {
            var style = this.style;
            var path = this.path;
            var hasStroke = style.hasStroke();
            var hasFill = style.hasFill();
            var fill = style.fill;
            var stroke = style.stroke;
            var hasFillGradient = hasFill && !!fill.colorStops;
            var hasStrokeGradient = hasStroke && !!stroke.colorStops;
            var hasFillPattern = hasFill && !!fill.image;
            var hasStrokePattern = hasStroke && !!stroke.image;
            style.bind(ctx, this, prevEl);
            this.setTransform(ctx);
            if (this.__dirty) {
                var rect = this.getBoundingRect();
                // Update gradient because bounding rect may changed
                if (hasFillGradient) {
                    this._fillGradient = style.getGradient(ctx, fill, rect);
                }
                if (hasStrokeGradient) {
                    this._strokeGradient = style.getGradient(ctx, stroke, rect);
                }
            }
            // Use the gradient or pattern
            if (hasFillGradient) {
                // PENDING If may have affect the state
                ctx.fillStyle = this._fillGradient;
            } else if (hasFillPattern) {
                ctx.fillStyle = getCanvasPattern.call(fill, ctx);
            }
            if (hasStrokeGradient) {
                ctx.strokeStyle = this._strokeGradient;
            } else if (hasStrokePattern) {
                ctx.strokeStyle = getCanvasPattern.call(stroke, ctx);
            }
            var lineDash = style.lineDash;
            var lineDashOffset = style.lineDashOffset;
            var ctxLineDash = !!ctx.setLineDash;
            // Update path sx, sy
            var scale = this.getGlobalScale();
            path.setScale(scale[0], scale[1]);
            // Proxy context
            // Rebuild path in following 2 cases
            // 1. Path is dirty
            // 2. Path needs javascript implemented lineDash stroking.
            //    In this case, lineDash information will not be saved in PathProxy
            if (this.__dirtyPath || lineDash && !ctxLineDash && hasStroke) {
                path = this.path.beginPath(ctx);
                // Setting line dash before build path
                if (lineDash && !ctxLineDash) {
                    path.setLineDash(lineDash);
                    path.setLineDashOffset(lineDashOffset);
                }
                this.buildPath(path, this.shape, false);
                // Clear path dirty flag
                this.__dirtyPath = false;
            } else {
                // Replay path building
                ctx.beginPath();
                this.path.rebuildPath(ctx);
            }
            hasFill && path.fill(ctx);
            if (lineDash && ctxLineDash) {
                ctx.setLineDash(lineDash);
                ctx.lineDashOffset = lineDashOffset;
            }
            hasStroke && path.stroke(ctx);
            if (lineDash && ctxLineDash) {
                // PENDING
                // Remove lineDash
                ctx.setLineDash([]);
            }
            this.restoreTransform(ctx);
            // Draw rect text
            if (style.text != null) {
                // var rect = this.getBoundingRect();
                this.drawRectText(ctx, this.getBoundingRect());
            }
        },
        buildPath: function (ctx, shapeCfg, inBundle) {
        },
        getBoundingRect: function () {
            var rect = this._rect;
            var style = this.style;
            var needsUpdateRect = !rect;
            if (needsUpdateRect) {
                var path = this.path;
                if (this.__dirtyPath) {
                    path.beginPath();
                    this.buildPath(path, this.shape, false);
                }
                rect = path.getBoundingRect();
            }
            this._rect = rect;
            if (style.hasStroke()) {
                // Needs update rect with stroke lineWidth when
                // 1. Element changes scale or lineWidth
                // 2. Shape is changed
                var rectWithStroke = this._rectWithStroke || (this._rectWithStroke = rect.clone());
                if (this.__dirty || needsUpdateRect) {
                    rectWithStroke.copy(rect);
                    // FIXME Must after updateTransform
                    var w = style.lineWidth;
                    // PENDING, Min line width is needed when line is horizontal or vertical
                    var lineScale = style.strokeNoScale ? this.getLineScale() : 1;
                    // Only add extra hover lineWidth when there are no fill
                    if (!style.hasFill()) {
                        w = Math.max(w, this.strokeContainThreshold || 4);
                    }
                    // Consider line width
                    // Line scale can't be 0;
                    if (lineScale > 1e-10) {
                        rectWithStroke.width += w / lineScale;
                        rectWithStroke.height += w / lineScale;
                        rectWithStroke.x -= w / lineScale / 2;
                        rectWithStroke.y -= w / lineScale / 2;
                    }
                }
                // Return rect with stroke
                return rectWithStroke;
            }
            return rect;
        },
        contain: function (x, y) {
            var localPos = this.transformCoordToLocal(x, y);
            var rect = this.getBoundingRect();
            var style = this.style;
            x = localPos[0];
            y = localPos[1];
            if (rect.contain(x, y)) {
                var pathData = this.path.data;
                if (style.hasStroke()) {
                    var lineWidth = style.lineWidth;
                    var lineScale = style.strokeNoScale ? this.getLineScale() : 1;
                    // Line scale can't be 0;
                    if (lineScale > 1e-10) {
                        // Only add extra hover lineWidth when there are no fill
                        if (!style.hasFill()) {
                            lineWidth = Math.max(lineWidth, this.strokeContainThreshold);
                        }
                        if (pathContain.containStroke(pathData, lineWidth / lineScale, x, y)) {
                            return true;
                        }
                    }
                }
                if (style.hasFill()) {
                    return pathContain.contain(pathData, x, y);
                }
            }
            return false;
        },
        dirty: function (dirtyPath) {
            if (dirtyPath == null) {
                dirtyPath = true;
            }
            // Only mark dirty, not mark clean
            if (dirtyPath) {
                this.__dirtyPath = dirtyPath;
                this._rect = null;
            }
            this.__dirty = true;
            this.__zr && this.__zr.refresh();
            // Used as a clipping path
            if (this.__clipTarget) {
                this.__clipTarget.dirty();
            }
        },
        animateShape: function (loop) {
            return this.animate('shape', loop);
        },
        attrKV: function (key, value) {
            // FIXME
            if (key === 'shape') {
                this.setShape(value);
                this.__dirtyPath = true;
                this._rect = null;
            } else {
                Displayable.prototype.attrKV.call(this, key, value);
            }
        },
        setShape: function (key, value) {
            var shape = this.shape;
            // Path from string may not have shape
            if (shape) {
                if (zrUtil.isObject(key)) {
                    for (var name in key) {
                        if (key.hasOwnProperty(name)) {
                            shape[name] = key[name];
                        }
                    }
                } else {
                    shape[key] = value;
                }
                this.dirty(true);
            }
            return this;
        },
        getLineScale: function () {
            var m = this.transform;
            // Get the line scale.
            // Determinant of `m` means how much the area is enlarged by the
            // transformation. So its square root can be used as a scale factor
            // for width.
            return m && abs(m[0] - 1) > 1e-10 && abs(m[3] - 1) > 1e-10 ? Math.sqrt(abs(m[0] * m[3] - m[2] * m[1])) : 1;
        }
    };
    /**
     * 扩展一个 Path element, 比如星形，圆等。
     * Extend a path element
     * @param {Object} props
     * @param {string} props.type Path type
     * @param {Function} props.init Initialize
     * @param {Function} props.buildPath Overwrite buildPath method
     * @param {Object} [props.style] Extended default style config
     * @param {Object} [props.shape] Extended default shape config
     */
    Path.extend = function (defaults) {
        var Sub = function (opts) {
            Path.call(this, opts);
            if (defaults.style) {
                // Extend default style
                this.style.extendFrom(defaults.style, false);
            }
            // Extend default shape
            var defaultShape = defaults.shape;
            if (defaultShape) {
                this.shape = this.shape || {};
                var thisShape = this.shape;
                for (var name in defaultShape) {
                    if (!thisShape.hasOwnProperty(name) && defaultShape.hasOwnProperty(name)) {
                        thisShape[name] = defaultShape[name];
                    }
                }
            }
            defaults.init && defaults.init.call(this, opts);
        };
        zrUtil.inherits(Sub, Path);
        // FIXME 不能 extend position, rotation 等引用对象
        for (var name in defaults) {
            // Extending prototype values and methods
            if (name !== 'style' && name !== 'shape') {
                Sub.prototype[name] = defaults[name];
            }
        }
        return Sub;
    };
    zrUtil.inherits(Path, Displayable);
    return Path;
});
define('zrender/container/Group', ['require', '../core/util', '../Element', '../core/BoundingRect'], function (require) {
    var zrUtil = require('../core/util');
    var Element = require('../Element');
    var BoundingRect = require('../core/BoundingRect');
    /**
     * @alias module:zrender/graphic/Group
     * @constructor
     * @extends module:zrender/mixin/Transformable
     * @extends module:zrender/mixin/Eventful
     */
    var Group = function (opts) {
        opts = opts || {};
        Element.call(this, opts);
        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                this[key] = opts[key];
            }
        }
        this._children = [];
        this.__storage = null;
        this.__dirty = true;
    };
    Group.prototype = {
        constructor: Group,
        isGroup: true,
        type: 'group',
        silent: false,
        children: function () {
            return this._children.slice();
        },
        childAt: function (idx) {
            return this._children[idx];
        },
        childOfName: function (name) {
            var children = this._children;
            for (var i = 0; i < children.length; i++) {
                if (children[i].name === name) {
                    return children[i];
                }
            }
        },
        childCount: function () {
            return this._children.length;
        },
        add: function (child) {
            if (child && child !== this && child.parent !== this) {
                this._children.push(child);
                this._doAdd(child);
            }
            return this;
        },
        addBefore: function (child, nextSibling) {
            if (child && child !== this && child.parent !== this && nextSibling && nextSibling.parent === this) {
                var children = this._children;
                var idx = children.indexOf(nextSibling);
                if (idx >= 0) {
                    children.splice(idx, 0, child);
                    this._doAdd(child);
                }
            }
            return this;
        },
        _doAdd: function (child) {
            if (child.parent) {
                child.parent.remove(child);
            }
            child.parent = this;
            var storage = this.__storage;
            var zr = this.__zr;
            if (storage && storage !== child.__storage) {
                storage.addToMap(child);
                if (child instanceof Group) {
                    child.addChildrenToStorage(storage);
                }
            }
            zr && zr.refresh();
        },
        remove: function (child) {
            var zr = this.__zr;
            var storage = this.__storage;
            var children = this._children;
            var idx = zrUtil.indexOf(children, child);
            if (idx < 0) {
                return this;
            }
            children.splice(idx, 1);
            child.parent = null;
            if (storage) {
                storage.delFromMap(child.id);
                if (child instanceof Group) {
                    child.delChildrenFromStorage(storage);
                }
            }
            zr && zr.refresh();
            return this;
        },
        removeAll: function () {
            var children = this._children;
            var storage = this.__storage;
            var child;
            var i;
            for (i = 0; i < children.length; i++) {
                child = children[i];
                if (storage) {
                    storage.delFromMap(child.id);
                    if (child instanceof Group) {
                        child.delChildrenFromStorage(storage);
                    }
                }
                child.parent = null;
            }
            children.length = 0;
            return this;
        },
        eachChild: function (cb, context) {
            var children = this._children;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                cb.call(context, child, i);
            }
            return this;
        },
        traverse: function (cb, context) {
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                cb.call(context, child);
                if (child.type === 'group') {
                    child.traverse(cb, context);
                }
            }
            return this;
        },
        addChildrenToStorage: function (storage) {
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                storage.addToMap(child);
                if (child instanceof Group) {
                    child.addChildrenToStorage(storage);
                }
            }
        },
        delChildrenFromStorage: function (storage) {
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                storage.delFromMap(child.id);
                if (child instanceof Group) {
                    child.delChildrenFromStorage(storage);
                }
            }
        },
        dirty: function () {
            this.__dirty = true;
            this.__zr && this.__zr.refresh();
            return this;
        },
        getBoundingRect: function (includeChildren) {
            // TODO Caching
            var rect = null;
            var tmpRect = new BoundingRect(0, 0, 0, 0);
            var children = includeChildren || this._children;
            var tmpMat = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.ignore || child.invisible) {
                    continue;
                }
                var childRect = child.getBoundingRect();
                var transform = child.getLocalTransform(tmpMat);
                // TODO
                // The boundingRect cacluated by transforming original
                // rect may be bigger than the actual bundingRect when rotation
                // is used. (Consider a circle rotated aginst its center, where
                // the actual boundingRect should be the same as that not be
                // rotated.) But we can not find better approach to calculate
                // actual boundingRect yet, considering performance.
                if (transform) {
                    tmpRect.copy(childRect);
                    tmpRect.applyTransform(transform);
                    rect = rect || tmpRect.clone();
                    rect.union(tmpRect);
                } else {
                    rect = rect || childRect.clone();
                    rect.union(childRect);
                }
            }
            return rect || tmpRect;
        }
    };
    zrUtil.inherits(Group, Element);
    return Group;
});
define('zrender/graphic/Image', ['require', './Displayable', '../core/BoundingRect', '../core/util', '../core/LRU'], function (require) {
    var Displayable = require('./Displayable');
    var BoundingRect = require('../core/BoundingRect');
    var zrUtil = require('../core/util');
    var LRU = require('../core/LRU');
    var globalImageCache = new LRU(50);
    /**
     * @alias zrender/graphic/Image
     * @extends module:zrender/graphic/Displayable
     * @constructor
     * @param {Object} opts
     */
    function ZImage(opts) {
        Displayable.call(this, opts);
    }
    ZImage.prototype = {
        constructor: ZImage,
        type: 'image',
        brush: function (ctx, prevEl) {
            var style = this.style;
            var src = style.image;
            var image;
            // Must bind each time
            style.bind(ctx, this, prevEl);
            // style.image is a url string
            if (typeof src === 'string') {
                image = this._image;
            }    // style.image is an HTMLImageElement or HTMLCanvasElement or Canvas
            else {
                image = src;
            }
            // FIXME Case create many images with src
            if (!image && src) {
                // Try get from global image cache
                var cachedImgObj = globalImageCache.get(src);
                if (!cachedImgObj) {
                    // Create a new image
                    image = new Image();
                    image.onload = function () {
                        image.onload = null;
                        for (var i = 0; i < cachedImgObj.pending.length; i++) {
                            cachedImgObj.pending[i].dirty();
                        }
                    };
                    cachedImgObj = {
                        image: image,
                        pending: [this]
                    };
                    image.src = src;
                    globalImageCache.put(src, cachedImgObj);
                    this._image = image;
                    return;
                } else {
                    image = cachedImgObj.image;
                    this._image = image;
                    // Image is not complete finish, add to pending list
                    if (!image.width || !image.height) {
                        cachedImgObj.pending.push(this);
                        return;
                    }
                }
            }
            if (image) {
                // 图片已经加载完成
                // if (image.nodeName.toUpperCase() == 'IMG') {
                //     if (!image.complete) {
                //         return;
                //     }
                // }
                // Else is canvas
                var width = style.width || image.width;
                var height = style.height || image.height;
                var x = style.x || 0;
                var y = style.y || 0;
                // 图片加载失败
                if (!image.width || !image.height) {
                    return;
                }
                // 设置transform
                this.setTransform(ctx);
                if (style.sWidth && style.sHeight) {
                    var sx = style.sx || 0;
                    var sy = style.sy || 0;
                    ctx.drawImage(image, sx, sy, style.sWidth, style.sHeight, x, y, width, height);
                } else if (style.sx && style.sy) {
                    var sx = style.sx;
                    var sy = style.sy;
                    var sWidth = width - sx;
                    var sHeight = height - sy;
                    ctx.drawImage(image, sx, sy, sWidth, sHeight, x, y, width, height);
                } else {
                    ctx.drawImage(image, x, y, width, height);
                }
                // 如果没设置宽和高的话自动根据图片宽高设置
                if (style.width == null) {
                    style.width = width;
                }
                if (style.height == null) {
                    style.height = height;
                }
                this.restoreTransform(ctx);
                // Draw rect text
                if (style.text != null) {
                    this.drawRectText(ctx, this.getBoundingRect());
                }
            }
        },
        getBoundingRect: function () {
            var style = this.style;
            if (!this._rect) {
                this._rect = new BoundingRect(style.x || 0, style.y || 0, style.width || 0, style.height || 0);
            }
            return this._rect;
        }
    };
    zrUtil.inherits(ZImage, Displayable);
    return ZImage;
});
define('zrender/graphic/Text', ['require', './Displayable', '../core/util', '../contain/text'], function (require) {
    var Displayable = require('./Displayable');
    var zrUtil = require('../core/util');
    var textContain = require('../contain/text');
    /**
     * @alias zrender/graphic/Text
     * @extends module:zrender/graphic/Displayable
     * @constructor
     * @param {Object} opts
     */
    var Text = function (opts) {
        Displayable.call(this, opts);
    };
    Text.prototype = {
        constructor: Text,
        type: 'text',
        brush: function (ctx, prevEl) {
            var style = this.style;
            var x = style.x || 0;
            var y = style.y || 0;
            // Convert to string
            var text = style.text;
            // Convert to string
            text != null && (text += '');
            // Always bind style
            style.bind(ctx, this, prevEl);
            if (text) {
                this.setTransform(ctx);
                var textBaseline;
                var textAlign = style.textAlign;
                var font = style.textFont || style.font;
                if (style.textVerticalAlign) {
                    var rect = textContain.getBoundingRect(text, font, style.textAlign, 'top');
                    // Ignore textBaseline
                    textBaseline = 'middle';
                    switch (style.textVerticalAlign) {
                    case 'middle':
                        y -= rect.height / 2 - rect.lineHeight / 2;
                        break;
                    case 'bottom':
                        y -= rect.height - rect.lineHeight / 2;
                        break;
                    default:
                        y += rect.lineHeight / 2;
                    }
                } else {
                    textBaseline = style.textBaseline;
                }
                // TODO Invalid font
                ctx.font = font || '12px sans-serif';
                ctx.textAlign = textAlign || 'left';
                // Use canvas default left textAlign. Giving invalid value will cause state not change
                if (ctx.textAlign !== textAlign) {
                    ctx.textAlign = 'left';
                }
                ctx.textBaseline = textBaseline || 'alphabetic';
                // Use canvas default alphabetic baseline
                if (ctx.textBaseline !== textBaseline) {
                    ctx.textBaseline = 'alphabetic';
                }
                var lineHeight = textContain.measureText('国', ctx.font).width;
                var textLines = text.split('\n');
                for (var i = 0; i < textLines.length; i++) {
                    style.hasFill() && ctx.fillText(textLines[i], x, y);
                    style.hasStroke() && ctx.strokeText(textLines[i], x, y);
                    y += lineHeight;
                }
                this.restoreTransform(ctx);
            }
        },
        getBoundingRect: function () {
            if (!this._rect) {
                var style = this.style;
                var textVerticalAlign = style.textVerticalAlign;
                var rect = textContain.getBoundingRect(style.text + '', style.textFont || style.font, style.textAlign, textVerticalAlign ? 'top' : style.textBaseline);
                switch (textVerticalAlign) {
                case 'middle':
                    rect.y -= rect.height / 2;
                    break;
                case 'bottom':
                    rect.y -= rect.height;
                    break;
                }
                rect.x += style.x || 0;
                rect.y += style.y || 0;
                this._rect = rect;
            }
            return this._rect;
        }
    };
    zrUtil.inherits(Text, Displayable);
    return Text;
});
define('zrender/graphic/shape/Circle', ['require', '../Path'], function (require) {
    'use strict';
    return require('../Path').extend({
        type: 'circle',
        shape: {
            cx: 0,
            cy: 0,
            r: 0
        },
        buildPath: function (ctx, shape, inBundle) {
            // Better stroking in ShapeBundle
            // Always do it may have performence issue ( fill may be 2x more cost)
            if (inBundle) {
                ctx.moveTo(shape.cx + shape.r, shape.cy);
            }
            // Better stroking in ShapeBundle
            // ctx.moveTo(shape.cx + shape.r, shape.cy);
            ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2, true);
        }
    });
});
define('zrender/graphic/shape/Sector', ['require', '../../core/env', '../Path'], function (require) {
    var env = require('../../core/env');
    var Path = require('../Path');
    var shadowTemp = [
            [
                'shadowBlur',
                0
            ],
            [
                'shadowColor',
                '#000'
            ],
            [
                'shadowOffsetX',
                0
            ],
            [
                'shadowOffsetY',
                0
            ]
        ];
    return Path.extend({
        type: 'sector',
        shape: {
            cx: 0,
            cy: 0,
            r0: 0,
            r: 0,
            startAngle: 0,
            endAngle: Math.PI * 2,
            clockwise: true
        },
        brush: env.browser.ie && env.browser.version >= 11 ? function () {
            var clipPaths = this.__clipPaths;
            var style = this.style;
            var modified;
            if (clipPaths) {
                for (var i = 0; i < clipPaths.length; i++) {
                    var shape = clipPaths[i] && clipPaths[i].shape;
                    if (shape && shape.startAngle === shape.endAngle) {
                        for (var j = 0; j < shadowTemp.length; j++) {
                            shadowTemp[j][2] = style[shadowTemp[j][0]];
                            style[shadowTemp[j][0]] = shadowTemp[j][1];
                        }
                        modified = true;
                        break;
                    }
                }
            }
            Path.prototype.brush.apply(this, arguments);
            if (modified) {
                for (var j = 0; j < shadowTemp.length; j++) {
                    style[shadowTemp[j][0]] = shadowTemp[j][2];
                }
            }
        } : Path.prototype.brush,
        buildPath: function (ctx, shape) {
            var x = shape.cx;
            var y = shape.cy;
            var r0 = Math.max(shape.r0 || 0, 0);
            var r = Math.max(shape.r, 0);
            var startAngle = shape.startAngle;
            var endAngle = shape.endAngle;
            var clockwise = shape.clockwise;
            var unitX = Math.cos(startAngle);
            var unitY = Math.sin(startAngle);
            ctx.moveTo(unitX * r0 + x, unitY * r0 + y);
            ctx.lineTo(unitX * r + x, unitY * r + y);
            ctx.arc(x, y, r, startAngle, endAngle, !clockwise);
            ctx.lineTo(Math.cos(endAngle) * r0 + x, Math.sin(endAngle) * r0 + y);
            if (r0 !== 0) {
                ctx.arc(x, y, r0, endAngle, startAngle, clockwise);
            }
            ctx.closePath();
        }
    });
});
define('zrender/graphic/shape/Ring', ['require', '../Path'], function (require) {
    return require('../Path').extend({
        type: 'ring',
        shape: {
            cx: 0,
            cy: 0,
            r: 0,
            r0: 0
        },
        buildPath: function (ctx, shape) {
            var x = shape.cx;
            var y = shape.cy;
            var PI2 = Math.PI * 2;
            ctx.moveTo(x + shape.r, y);
            ctx.arc(x, y, shape.r, 0, PI2, false);
            ctx.moveTo(x + shape.r0, y);
            ctx.arc(x, y, shape.r0, 0, PI2, true);
        }
    });
});
define('zrender/graphic/shape/Polygon', ['require', '../helper/poly', '../Path'], function (require) {
    var polyHelper = require('../helper/poly');
    return require('../Path').extend({
        type: 'polygon',
        shape: {
            points: null,
            smooth: false,
            smoothConstraint: null
        },
        buildPath: function (ctx, shape) {
            polyHelper.buildPath(ctx, shape, true);
        }
    });
});
define('zrender/graphic/shape/Polyline', ['require', '../helper/poly', '../Path'], function (require) {
    var polyHelper = require('../helper/poly');
    return require('../Path').extend({
        type: 'polyline',
        shape: {
            points: null,
            smooth: false,
            smoothConstraint: null
        },
        style: {
            stroke: '#000',
            fill: null
        },
        buildPath: function (ctx, shape) {
            polyHelper.buildPath(ctx, shape, false);
        }
    });
});
define('zrender/graphic/shape/Rect', ['require', '../helper/roundRect', '../Path'], function (require) {
    var roundRectHelper = require('../helper/roundRect');
    return require('../Path').extend({
        type: 'rect',
        shape: {
            r: 0,
            x: 0,
            y: 0,
            width: 0,
            height: 0
        },
        buildPath: function (ctx, shape) {
            var x = shape.x;
            var y = shape.y;
            var width = shape.width;
            var height = shape.height;
            if (!shape.r) {
                ctx.rect(x, y, width, height);
            } else {
                roundRectHelper.buildPath(ctx, shape);
            }
            ctx.closePath();
            return;
        }
    });
});
define('zrender/graphic/shape/Line', ['require', '../Path'], function (require) {
    return require('../Path').extend({
        type: 'line',
        shape: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            percent: 1
        },
        style: {
            stroke: '#000',
            fill: null
        },
        buildPath: function (ctx, shape) {
            var x1 = shape.x1;
            var y1 = shape.y1;
            var x2 = shape.x2;
            var y2 = shape.y2;
            var percent = shape.percent;
            if (percent === 0) {
                return;
            }
            ctx.moveTo(x1, y1);
            if (percent < 1) {
                x2 = x1 * (1 - percent) + x2 * percent;
                y2 = y1 * (1 - percent) + y2 * percent;
            }
            ctx.lineTo(x2, y2);
        },
        pointAt: function (p) {
            var shape = this.shape;
            return [
                shape.x1 * (1 - p) + shape.x2 * p,
                shape.y1 * (1 - p) + shape.y2 * p
            ];
        }
    });
});
define('zrender/graphic/shape/BezierCurve', ['require', '../../core/curve', '../../core/vector', '../Path'], function (require) {
    'use strict';
    var curveTool = require('../../core/curve');
    var vec2 = require('../../core/vector');
    var quadraticSubdivide = curveTool.quadraticSubdivide;
    var cubicSubdivide = curveTool.cubicSubdivide;
    var quadraticAt = curveTool.quadraticAt;
    var cubicAt = curveTool.cubicAt;
    var quadraticDerivativeAt = curveTool.quadraticDerivativeAt;
    var cubicDerivativeAt = curveTool.cubicDerivativeAt;
    var out = [];
    function someVectorAt(shape, t, isTangent) {
        var cpx2 = shape.cpx2;
        var cpy2 = shape.cpy2;
        if (cpx2 === null || cpy2 === null) {
            return [
                (isTangent ? cubicDerivativeAt : cubicAt)(shape.x1, shape.cpx1, shape.cpx2, shape.x2, t),
                (isTangent ? cubicDerivativeAt : cubicAt)(shape.y1, shape.cpy1, shape.cpy2, shape.y2, t)
            ];
        } else {
            return [
                (isTangent ? quadraticDerivativeAt : quadraticAt)(shape.x1, shape.cpx1, shape.x2, t),
                (isTangent ? quadraticDerivativeAt : quadraticAt)(shape.y1, shape.cpy1, shape.y2, t)
            ];
        }
    }
    return require('../Path').extend({
        type: 'bezier-curve',
        shape: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            cpx1: 0,
            cpy1: 0,
            percent: 1
        },
        style: {
            stroke: '#000',
            fill: null
        },
        buildPath: function (ctx, shape) {
            var x1 = shape.x1;
            var y1 = shape.y1;
            var x2 = shape.x2;
            var y2 = shape.y2;
            var cpx1 = shape.cpx1;
            var cpy1 = shape.cpy1;
            var cpx2 = shape.cpx2;
            var cpy2 = shape.cpy2;
            var percent = shape.percent;
            if (percent === 0) {
                return;
            }
            ctx.moveTo(x1, y1);
            if (cpx2 == null || cpy2 == null) {
                if (percent < 1) {
                    quadraticSubdivide(x1, cpx1, x2, percent, out);
                    cpx1 = out[1];
                    x2 = out[2];
                    quadraticSubdivide(y1, cpy1, y2, percent, out);
                    cpy1 = out[1];
                    y2 = out[2];
                }
                ctx.quadraticCurveTo(cpx1, cpy1, x2, y2);
            } else {
                if (percent < 1) {
                    cubicSubdivide(x1, cpx1, cpx2, x2, percent, out);
                    cpx1 = out[1];
                    cpx2 = out[2];
                    x2 = out[3];
                    cubicSubdivide(y1, cpy1, cpy2, y2, percent, out);
                    cpy1 = out[1];
                    cpy2 = out[2];
                    y2 = out[3];
                }
                ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
            }
        },
        pointAt: function (t) {
            return someVectorAt(this.shape, t, false);
        },
        tangentAt: function (t) {
            var p = someVectorAt(this.shape, t, true);
            return vec2.normalize(p, p);
        }
    });
});
define('zrender/graphic/shape/Arc', ['require', '../Path'], function (require) {
    return require('../Path').extend({
        type: 'arc',
        shape: {
            cx: 0,
            cy: 0,
            r: 0,
            startAngle: 0,
            endAngle: Math.PI * 2,
            clockwise: true
        },
        style: {
            stroke: '#000',
            fill: null
        },
        buildPath: function (ctx, shape) {
            var x = shape.cx;
            var y = shape.cy;
            var r = Math.max(shape.r, 0);
            var startAngle = shape.startAngle;
            var endAngle = shape.endAngle;
            var clockwise = shape.clockwise;
            var unitX = Math.cos(startAngle);
            var unitY = Math.sin(startAngle);
            ctx.moveTo(unitX * r + x, unitY * r + y);
            ctx.arc(x, y, r, startAngle, endAngle, !clockwise);
        }
    });
});
define('zrender/graphic/CompoundPath', ['require', './Path'], function (require) {
    var Path = require('./Path');
    return Path.extend({
        type: 'compound',
        shape: { paths: null },
        _updatePathDirty: function () {
            var dirtyPath = this.__dirtyPath;
            var paths = this.shape.paths;
            for (var i = 0; i < paths.length; i++) {
                // Mark as dirty if any subpath is dirty
                dirtyPath = dirtyPath || paths[i].__dirtyPath;
            }
            this.__dirtyPath = dirtyPath;
            this.__dirty = this.__dirty || dirtyPath;
        },
        beforeBrush: function () {
            this._updatePathDirty();
            var paths = this.shape.paths || [];
            var scale = this.getGlobalScale();
            // Update path scale
            for (var i = 0; i < paths.length; i++) {
                paths[i].path.setScale(scale[0], scale[1]);
            }
        },
        buildPath: function (ctx, shape) {
            var paths = shape.paths || [];
            for (var i = 0; i < paths.length; i++) {
                paths[i].buildPath(ctx, paths[i].shape, true);
            }
        },
        afterBrush: function () {
            var paths = this.shape.paths;
            for (var i = 0; i < paths.length; i++) {
                paths[i].__dirtyPath = false;
            }
        },
        getBoundingRect: function () {
            this._updatePathDirty();
            return Path.prototype.getBoundingRect.call(this);
        }
    });
});
define('zrender/graphic/LinearGradient', ['require', '../core/util', './Gradient'], function (require) {
    'use strict';
    var zrUtil = require('../core/util');
    var Gradient = require('./Gradient');
    /**
     * x, y, x2, y2 are all percent from 0 to 1
     * @param {number} [x=0]
     * @param {number} [y=0]
     * @param {number} [x2=1]
     * @param {number} [y2=0]
     * @param {Array.<Object>} colorStops
     * @param {boolean} [globalCoord=false]
     */
    var LinearGradient = function (x, y, x2, y2, colorStops, globalCoord) {
        this.x = x == null ? 0 : x;
        this.y = y == null ? 0 : y;
        this.x2 = x2 == null ? 1 : x2;
        this.y2 = y2 == null ? 0 : y2;
        // Can be cloned
        this.type = 'linear';
        // If use global coord
        this.global = globalCoord || false;
        Gradient.call(this, colorStops);
    };
    LinearGradient.prototype = { constructor: LinearGradient };
    zrUtil.inherits(LinearGradient, Gradient);
    return LinearGradient;
});
define('zrender/graphic/RadialGradient', ['require', '../core/util', './Gradient'], function (require) {
    'use strict';
    var zrUtil = require('../core/util');
    var Gradient = require('./Gradient');
    /**
     * x, y, r are all percent from 0 to 1
     * @param {number} [x=0.5]
     * @param {number} [y=0.5]
     * @param {number} [r=0.5]
     * @param {Array.<Object>} [colorStops]
     * @param {boolean} [globalCoord=false]
     */
    var RadialGradient = function (x, y, r, colorStops, globalCoord) {
        this.x = x == null ? 0.5 : x;
        this.y = y == null ? 0.5 : y;
        this.r = r == null ? 0.5 : r;
        // Can be cloned
        this.type = 'radial';
        // If use global coord
        this.global = globalCoord || false;
        Gradient.call(this, colorStops);
    };
    RadialGradient.prototype = { constructor: RadialGradient };
    zrUtil.inherits(RadialGradient, Gradient);
    return RadialGradient;
});
define('zrender/core/BoundingRect', ['require', './vector', './matrix'], function (require) {
    'use strict';
    var vec2 = require('./vector');
    var matrix = require('./matrix');
    var v2ApplyTransform = vec2.applyTransform;
    var mathMin = Math.min;
    var mathMax = Math.max;
    /**
     * @alias module:echarts/core/BoundingRect
     */
    function BoundingRect(x, y, width, height) {
        if (width < 0) {
            x = x + width;
            width = -width;
        }
        if (height < 0) {
            y = y + height;
            height = -height;
        }
        /**
         * @type {number}
         */
        this.x = x;
        /**
         * @type {number}
         */
        this.y = y;
        /**
         * @type {number}
         */
        this.width = width;
        /**
         * @type {number}
         */
        this.height = height;
    }
    BoundingRect.prototype = {
        constructor: BoundingRect,
        union: function (other) {
            var x = mathMin(other.x, this.x);
            var y = mathMin(other.y, this.y);
            this.width = mathMax(other.x + other.width, this.x + this.width) - x;
            this.height = mathMax(other.y + other.height, this.y + this.height) - y;
            this.x = x;
            this.y = y;
        },
        applyTransform: function () {
            var lt = [];
            var rb = [];
            var lb = [];
            var rt = [];
            return function (m) {
                // In case usage like this
                // el.getBoundingRect().applyTransform(el.transform)
                // And element has no transform
                if (!m) {
                    return;
                }
                lt[0] = lb[0] = this.x;
                lt[1] = rt[1] = this.y;
                rb[0] = rt[0] = this.x + this.width;
                rb[1] = lb[1] = this.y + this.height;
                v2ApplyTransform(lt, lt, m);
                v2ApplyTransform(rb, rb, m);
                v2ApplyTransform(lb, lb, m);
                v2ApplyTransform(rt, rt, m);
                this.x = mathMin(lt[0], rb[0], lb[0], rt[0]);
                this.y = mathMin(lt[1], rb[1], lb[1], rt[1]);
                var maxX = mathMax(lt[0], rb[0], lb[0], rt[0]);
                var maxY = mathMax(lt[1], rb[1], lb[1], rt[1]);
                this.width = maxX - this.x;
                this.height = maxY - this.y;
            };
        }(),
        calculateTransform: function (b) {
            var a = this;
            var sx = b.width / a.width;
            var sy = b.height / a.height;
            var m = matrix.create();
            // 矩阵右乘
            matrix.translate(m, m, [
                -a.x,
                -a.y
            ]);
            matrix.scale(m, m, [
                sx,
                sy
            ]);
            matrix.translate(m, m, [
                b.x,
                b.y
            ]);
            return m;
        },
        intersect: function (b) {
            if (!b) {
                return false;
            }
            if (!(b instanceof BoundingRect)) {
                // Normalize negative width/height.
                b = BoundingRect.create(b);
            }
            var a = this;
            var ax0 = a.x;
            var ax1 = a.x + a.width;
            var ay0 = a.y;
            var ay1 = a.y + a.height;
            var bx0 = b.x;
            var bx1 = b.x + b.width;
            var by0 = b.y;
            var by1 = b.y + b.height;
            return !(ax1 < bx0 || bx1 < ax0 || ay1 < by0 || by1 < ay0);
        },
        contain: function (x, y) {
            var rect = this;
            return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
        },
        clone: function () {
            return new BoundingRect(this.x, this.y, this.width, this.height);
        },
        copy: function (other) {
            this.x = other.x;
            this.y = other.y;
            this.width = other.width;
            this.height = other.height;
        },
        plain: function () {
            return {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
        }
    };
    /**
     * @param {Object|module:zrender/core/BoundingRect} rect
     * @param {number} rect.x
     * @param {number} rect.y
     * @param {number} rect.width
     * @param {number} rect.height
     * @return {module:zrender/core/BoundingRect}
     */
    BoundingRect.create = function (rect) {
        return new BoundingRect(rect.x, rect.y, rect.width, rect.height);
    };
    return BoundingRect;
});
define('zrender/contain/text', ['require', '../core/util', '../core/BoundingRect'], function (require) {
    var textWidthCache = {};
    var textWidthCacheCounter = 0;
    var TEXT_CACHE_MAX = 5000;
    var util = require('../core/util');
    var BoundingRect = require('../core/BoundingRect');
    var retrieve = util.retrieve;
    function getTextWidth(text, textFont) {
        var key = text + ':' + textFont;
        if (textWidthCache[key]) {
            return textWidthCache[key];
        }
        var textLines = (text + '').split('\n');
        var width = 0;
        for (var i = 0, l = textLines.length; i < l; i++) {
            // measureText 可以被覆盖以兼容不支持 Canvas 的环境
            width = Math.max(textContain.measureText(textLines[i], textFont).width, width);
        }
        if (textWidthCacheCounter > TEXT_CACHE_MAX) {
            textWidthCacheCounter = 0;
            textWidthCache = {};
        }
        textWidthCacheCounter++;
        textWidthCache[key] = width;
        return width;
    }
    function getTextRect(text, textFont, textAlign, textBaseline) {
        var textLineLen = ((text || '') + '').split('\n').length;
        var width = getTextWidth(text, textFont);
        // FIXME 高度计算比较粗暴
        var lineHeight = getTextWidth('国', textFont);
        var height = textLineLen * lineHeight;
        var rect = new BoundingRect(0, 0, width, height);
        // Text has a special line height property
        rect.lineHeight = lineHeight;
        switch (textBaseline) {
        case 'bottom':
        case 'alphabetic':
            rect.y -= lineHeight;
            break;
        case 'middle':
            rect.y -= lineHeight / 2;
            break;    // case 'hanging':
                      // case 'top':
        }
        // FIXME Right to left language
        switch (textAlign) {
        case 'end':
        case 'right':
            rect.x -= rect.width;
            break;
        case 'center':
            rect.x -= rect.width / 2;
            break;    // case 'start':
                      // case 'left':
        }
        return rect;
    }
    function adjustTextPositionOnRect(textPosition, rect, textRect, distance) {
        var x = rect.x;
        var y = rect.y;
        var height = rect.height;
        var width = rect.width;
        var textHeight = textRect.height;
        var halfHeight = height / 2 - textHeight / 2;
        var textAlign = 'left';
        switch (textPosition) {
        case 'left':
            x -= distance;
            y += halfHeight;
            textAlign = 'right';
            break;
        case 'right':
            x += distance + width;
            y += halfHeight;
            textAlign = 'left';
            break;
        case 'top':
            x += width / 2;
            y -= distance + textHeight;
            textAlign = 'center';
            break;
        case 'bottom':
            x += width / 2;
            y += height + distance;
            textAlign = 'center';
            break;
        case 'inside':
            x += width / 2;
            y += halfHeight;
            textAlign = 'center';
            break;
        case 'insideLeft':
            x += distance;
            y += halfHeight;
            textAlign = 'left';
            break;
        case 'insideRight':
            x += width - distance;
            y += halfHeight;
            textAlign = 'right';
            break;
        case 'insideTop':
            x += width / 2;
            y += distance;
            textAlign = 'center';
            break;
        case 'insideBottom':
            x += width / 2;
            y += height - textHeight - distance;
            textAlign = 'center';
            break;
        case 'insideTopLeft':
            x += distance;
            y += distance;
            textAlign = 'left';
            break;
        case 'insideTopRight':
            x += width - distance;
            y += distance;
            textAlign = 'right';
            break;
        case 'insideBottomLeft':
            x += distance;
            y += height - textHeight - distance;
            break;
        case 'insideBottomRight':
            x += width - distance;
            y += height - textHeight - distance;
            textAlign = 'right';
            break;
        }
        return {
            x: x,
            y: y,
            textAlign: textAlign,
            textBaseline: 'top'
        };
    }
    /**
     * Show ellipsis if overflow.
     *
     * @param  {string} text
     * @param  {string} containerWidth
     * @param  {string} textFont
     * @param  {number} [ellipsis='...']
     * @param  {Object} [options]
     * @param  {number} [options.maxIterations=3]
     * @param  {number} [options.minChar=0] If truncate result are less
     *                  then minChar, ellipsis will not show, which is
     *                  better for user hint in some cases.
     * @param  {number} [options.placeholder=''] When all truncated, use the placeholder.
     * @return {string}
     */
    function truncateText(text, containerWidth, textFont, ellipsis, options) {
        if (!containerWidth) {
            return '';
        }
        options = options || {};
        ellipsis = retrieve(ellipsis, '...');
        var maxIterations = retrieve(options.maxIterations, 2);
        var minChar = retrieve(options.minChar, 0);
        // FIXME
        // Other languages?
        var cnCharWidth = getTextWidth('国', textFont);
        // FIXME
        // Consider proportional font?
        var ascCharWidth = getTextWidth('a', textFont);
        var placeholder = retrieve(options.placeholder, '');
        // Example 1: minChar: 3, text: 'asdfzxcv', truncate result: 'asdf', but not: 'a...'.
        // Example 2: minChar: 3, text: '维度', truncate result: '维', but not: '...'.
        var contentWidth = containerWidth = Math.max(0, containerWidth - 1);
        // Reserve some gap.
        for (var i = 0; i < minChar && contentWidth >= ascCharWidth; i++) {
            contentWidth -= ascCharWidth;
        }
        var ellipsisWidth = getTextWidth(ellipsis);
        if (ellipsisWidth > contentWidth) {
            ellipsis = '';
            ellipsisWidth = 0;
        }
        contentWidth = containerWidth - ellipsisWidth;
        var textLines = (text + '').split('\n');
        for (var i = 0, len = textLines.length; i < len; i++) {
            var textLine = textLines[i];
            var lineWidth = getTextWidth(textLine, textFont);
            if (lineWidth <= containerWidth) {
                continue;
            }
            for (var j = 0;; j++) {
                if (lineWidth <= contentWidth || j >= maxIterations) {
                    textLine += ellipsis;
                    break;
                }
                var subLength = j === 0 ? estimateLength(textLine, contentWidth, ascCharWidth, cnCharWidth) : lineWidth > 0 ? Math.floor(textLine.length * contentWidth / lineWidth) : 0;
                textLine = textLine.substr(0, subLength);
                lineWidth = getTextWidth(textLine, textFont);
            }
            if (textLine === '') {
                textLine = placeholder;
            }
            textLines[i] = textLine;
        }
        return textLines.join('\n');
    }
    function estimateLength(text, contentWidth, ascCharWidth, cnCharWidth) {
        var width = 0;
        var i = 0;
        for (var len = text.length; i < len && width < contentWidth; i++) {
            var charCode = text.charCodeAt(i);
            width += 0 <= charCode && charCode <= 127 ? ascCharWidth : cnCharWidth;
        }
        return i;
    }
    var textContain = {
            getWidth: getTextWidth,
            getBoundingRect: getTextRect,
            adjustTextPositionOnRect: adjustTextPositionOnRect,
            truncateText: truncateText,
            measureText: function (text, textFont) {
                var ctx = util.getContext();
                ctx.font = textFont || '12px sans-serif';
                return ctx.measureText(text);
            }
        };
    return textContain;
});
define('echarts/coord/axisHelper', ['require', '../scale/Ordinal', '../scale/Interval', '../scale/Time', '../scale/Log', '../scale/Scale', '../util/number', 'zrender/core/util', 'zrender/contain/text'], function (require) {
    var OrdinalScale = require('../scale/Ordinal');
    var IntervalScale = require('../scale/Interval');
    require('../scale/Time');
    require('../scale/Log');
    var Scale = require('../scale/Scale');
    var numberUtil = require('../util/number');
    var zrUtil = require('zrender/core/util');
    var textContain = require('zrender/contain/text');
    var axisHelper = {};
    /**
     * Get axis scale extent before niced.
     * Item of returned array can only be number (including Infinity and NaN).
     */
    axisHelper.getScaleExtent = function (axis, model) {
        var scale = axis.scale;
        var scaleType = scale.type;
        var min = model.getMin();
        var max = model.getMax();
        var fixMin = min != null;
        var fixMax = max != null;
        var originalExtent = scale.getExtent();
        var axisDataLen;
        var boundaryGap;
        var span;
        if (scaleType === 'ordinal') {
            axisDataLen = (model.get('data') || []).length;
        } else {
            boundaryGap = model.get('boundaryGap');
            if (!zrUtil.isArray(boundaryGap)) {
                boundaryGap = [
                    boundaryGap || 0,
                    boundaryGap || 0
                ];
            }
            boundaryGap[0] = numberUtil.parsePercent(boundaryGap[0], 1);
            boundaryGap[1] = numberUtil.parsePercent(boundaryGap[1], 1);
            span = originalExtent[1] - originalExtent[0];
        }
        if (min == null) {
            min = scaleType === 'ordinal' ? axisDataLen ? 0 : NaN : originalExtent[0] - boundaryGap[0] * span;
        }
        if (max == null) {
            max = scaleType === 'ordinal' ? axisDataLen ? axisDataLen - 1 : NaN : originalExtent[1] + boundaryGap[1] * span;
        }
        if (min === 'dataMin') {
            min = originalExtent[0];
        }
        if (max === 'dataMax') {
            max = originalExtent[1];
        }
        (min == null || !isFinite(min)) && (min = NaN);
        (max == null || !isFinite(max)) && (max = NaN);
        axis.setBlank(zrUtil.eqNaN(min) || zrUtil.eqNaN(max));
        // Evaluate if axis needs cross zero
        if (model.getNeedCrossZero()) {
            // Axis is over zero and min is not set
            if (min > 0 && max > 0 && !fixMin) {
                min = 0;
            }
            // Axis is under zero and max is not set
            if (min < 0 && max < 0 && !fixMax) {
                max = 0;
            }
        }
        return [
            min,
            max
        ];
    };
    axisHelper.niceScaleExtent = function (axis, model) {
        var scale = axis.scale;
        var extent = axisHelper.getScaleExtent(axis, model);
        var fixMin = model.getMin() != null;
        var fixMax = model.getMax() != null;
        var splitNumber = model.get('splitNumber');
        if (scale.type === 'log') {
            scale.base = model.get('logBase');
        }
        scale.setExtent(extent[0], extent[1]);
        scale.niceExtent(splitNumber, fixMin, fixMax);
        // Use minInterval to constraint the calculated interval.
        // If calculated interval is less than minInterval. increase the interval quantity until
        // it is larger than minInterval.
        // For example:
        //  minInterval is 1, calculated interval is 0.2, so increase it to be 1. In this way we can get
        //  an integer axis.
        var minInterval = model.get('minInterval');
        if (isFinite(minInterval) && !fixMin && !fixMax && scale.type === 'interval') {
            var interval = scale.getInterval();
            var intervalScale = Math.max(Math.abs(interval), minInterval) / interval;
            // while (interval < minInterval) {
            //     var quantity = numberUtil.quantity(interval);
            //     interval = quantity * 10;
            //     scaleQuantity *= 10;
            // }
            extent = scale.getExtent();
            var origin = (extent[1] + extent[0]) / 2;
            scale.setExtent(intervalScale * (extent[0] - origin) + origin, intervalScale * (extent[1] - origin) + origin);
            scale.niceExtent(splitNumber);
        }
        // If some one specified the min, max. And the default calculated interval
        // is not good enough. He can specify the interval. It is often appeared
        // in angle axis with angle 0 - 360. Interval calculated in interval scale is hard
        // to be 60.
        // FIXME
        var interval = model.get('interval');
        if (interval != null) {
            scale.setInterval && scale.setInterval(interval);
        }
    };
    /**
     * @param {module:echarts/model/Model} model
     * @param {string} [axisType] Default retrieve from model.type
     * @return {module:echarts/scale/*}
     */
    axisHelper.createScaleByModel = function (model, axisType) {
        axisType = axisType || model.get('type');
        if (axisType) {
            switch (axisType) {
            // Buildin scale
            case 'category':
                return new OrdinalScale(model.getCategories(), [
                    Infinity,
                    -Infinity
                ]);
            case 'value':
                return new IntervalScale();
            // Extended scale, like time and log
            default:
                return (Scale.getClass(axisType) || IntervalScale).create(model);
            }
        }
    };
    /**
     * Check if the axis corss 0
     */
    axisHelper.ifAxisCrossZero = function (axis) {
        var dataExtent = axis.scale.getExtent();
        var min = dataExtent[0];
        var max = dataExtent[1];
        return !(min > 0 && max > 0 || min < 0 && max < 0);
    };
    /**
     * @param {Array.<number>} tickCoords In axis self coordinate.
     * @param {Array.<string>} labels
     * @param {string} font
     * @param {boolean} isAxisHorizontal
     * @return {number}
     */
    axisHelper.getAxisLabelInterval = function (tickCoords, labels, font, isAxisHorizontal) {
        // FIXME
        // 不同角的axis和label，不只是horizontal和vertical.
        var textSpaceTakenRect;
        var autoLabelInterval = 0;
        var accumulatedLabelInterval = 0;
        var step = 1;
        if (labels.length > 40) {
            // Simple optimization for large amount of labels
            step = Math.floor(labels.length / 40);
        }
        for (var i = 0; i < tickCoords.length; i += step) {
            var tickCoord = tickCoords[i];
            var rect = textContain.getBoundingRect(labels[i], font, 'center', 'top');
            rect[isAxisHorizontal ? 'x' : 'y'] += tickCoord;
            // FIXME Magic number 1.5
            rect[isAxisHorizontal ? 'width' : 'height'] *= 1.3;
            if (!textSpaceTakenRect) {
                textSpaceTakenRect = rect.clone();
            }    // There is no space for current label;
            else if (textSpaceTakenRect.intersect(rect)) {
                accumulatedLabelInterval++;
                autoLabelInterval = Math.max(autoLabelInterval, accumulatedLabelInterval);
            } else {
                textSpaceTakenRect.union(rect);
                // Reset
                accumulatedLabelInterval = 0;
            }
        }
        if (autoLabelInterval === 0 && step > 1) {
            return step;
        }
        return (autoLabelInterval + 1) * step - 1;
    };
    /**
     * @param {Object} axis
     * @param {Function} labelFormatter
     * @return {Array.<string>}
     */
    axisHelper.getFormattedLabels = function (axis, labelFormatter) {
        var scale = axis.scale;
        var labels = scale.getTicksLabels();
        var ticks = scale.getTicks();
        if (typeof labelFormatter === 'string') {
            labelFormatter = function (tpl) {
                return function (val) {
                    return tpl.replace('{value}', val != null ? val : '');
                };
            }(labelFormatter);
            // Consider empty array
            return zrUtil.map(labels, labelFormatter);
        } else if (typeof labelFormatter === 'function') {
            return zrUtil.map(ticks, function (tick, idx) {
                return labelFormatter(axis.type === 'category' ? scale.getLabel(tick) : tick, idx);
            }, this);
        } else {
            return labels;
        }
    };
    return axisHelper;
});
define('echarts/coord/cartesian/Cartesian2D', ['require', 'zrender/core/util', './Cartesian'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var Cartesian = require('./Cartesian');
    function Cartesian2D(name) {
        Cartesian.call(this, name);
    }
    Cartesian2D.prototype = {
        constructor: Cartesian2D,
        type: 'cartesian2d',
        dimensions: [
            'x',
            'y'
        ],
        getBaseAxis: function () {
            return this.getAxesByScale('ordinal')[0] || this.getAxesByScale('time')[0] || this.getAxis('x');
        },
        containPoint: function (point) {
            var axisX = this.getAxis('x');
            var axisY = this.getAxis('y');
            return axisX.contain(axisX.toLocalCoord(point[0])) && axisY.contain(axisY.toLocalCoord(point[1]));
        },
        containData: function (data) {
            return this.getAxis('x').containData(data[0]) && this.getAxis('y').containData(data[1]);
        },
        dataToPoints: function (data, stack) {
            return data.mapArray([
                'x',
                'y'
            ], function (x, y) {
                return this.dataToPoint([
                    x,
                    y
                ]);
            }, stack, this);
        },
        dataToPoint: function (data, clamp) {
            var xAxis = this.getAxis('x');
            var yAxis = this.getAxis('y');
            return [
                xAxis.toGlobalCoord(xAxis.dataToCoord(data[0], clamp)),
                yAxis.toGlobalCoord(yAxis.dataToCoord(data[1], clamp))
            ];
        },
        pointToData: function (point, clamp) {
            var xAxis = this.getAxis('x');
            var yAxis = this.getAxis('y');
            return [
                xAxis.coordToData(xAxis.toLocalCoord(point[0]), clamp),
                yAxis.coordToData(yAxis.toLocalCoord(point[1]), clamp)
            ];
        },
        getOtherAxis: function (axis) {
            return this.getAxis(axis.dim === 'x' ? 'y' : 'x');
        }
    };
    zrUtil.inherits(Cartesian2D, Cartesian);
    return Cartesian2D;
});
define('echarts/coord/cartesian/Axis2D', ['require', 'zrender/core/util', '../Axis', './axisLabelInterval'], function (require) {
    var zrUtil = require('zrender/core/util');
    var Axis = require('../Axis');
    var axisLabelInterval = require('./axisLabelInterval');
    /**
     * Extend axis 2d
     * @constructor module:echarts/coord/cartesian/Axis2D
     * @extends {module:echarts/coord/cartesian/Axis}
     * @param {string} dim
     * @param {*} scale
     * @param {Array.<number>} coordExtent
     * @param {string} axisType
     * @param {string} position
     */
    var Axis2D = function (dim, scale, coordExtent, axisType, position) {
        Axis.call(this, dim, scale, coordExtent);
        /**
         * Axis type
         *  - 'category'
         *  - 'value'
         *  - 'time'
         *  - 'log'
         * @type {string}
         */
        this.type = axisType || 'value';
        /**
         * Axis position
         *  - 'top'
         *  - 'bottom'
         *  - 'left'
         *  - 'right'
         */
        this.position = position || 'bottom';
    };
    Axis2D.prototype = {
        constructor: Axis2D,
        index: 0,
        onZero: false,
        model: null,
        isHorizontal: function () {
            var position = this.position;
            return position === 'top' || position === 'bottom';
        },
        getGlobalExtent: function () {
            var ret = this.getExtent();
            ret[0] = this.toGlobalCoord(ret[0]);
            ret[1] = this.toGlobalCoord(ret[1]);
            return ret;
        },
        getLabelInterval: function () {
            var labelInterval = this._labelInterval;
            if (!labelInterval) {
                labelInterval = this._labelInterval = axisLabelInterval(this);
            }
            return labelInterval;
        },
        isLabelIgnored: function (idx) {
            if (this.type === 'category') {
                var labelInterval = this.getLabelInterval();
                return typeof labelInterval === 'function' && !labelInterval(idx, this.scale.getLabel(idx)) || idx % (labelInterval + 1);
            }
        },
        toLocalCoord: null,
        toGlobalCoord: null
    };
    zrUtil.inherits(Axis2D, Axis);
    return Axis2D;
});
define('echarts/coord/cartesian/GridModel', ['require', './AxisModel', '../../model/Component'], function (require) {
    'use strict';
    require('./AxisModel');
    var ComponentModel = require('../../model/Component');
    return ComponentModel.extend({
        type: 'grid',
        dependencies: [
            'xAxis',
            'yAxis'
        ],
        layoutMode: 'box',
        coordinateSystem: null,
        defaultOption: {
            show: false,
            zlevel: 0,
            z: 0,
            left: '10%',
            top: 60,
            right: '10%',
            bottom: 60,
            containLabel: false,
            backgroundColor: 'rgba(0,0,0,0)',
            borderWidth: 1,
            borderColor: '#ccc'
        }
    });
});
define('echarts/data/DataDiffer', ['require'], function (require) {
    'use strict';
    function defaultKeyGetter(item) {
        return item;
    }
    function DataDiffer(oldArr, newArr, oldKeyGetter, newKeyGetter) {
        this._old = oldArr;
        this._new = newArr;
        this._oldKeyGetter = oldKeyGetter || defaultKeyGetter;
        this._newKeyGetter = newKeyGetter || defaultKeyGetter;
    }
    DataDiffer.prototype = {
        constructor: DataDiffer,
        add: function (func) {
            this._add = func;
            return this;
        },
        update: function (func) {
            this._update = func;
            return this;
        },
        remove: function (func) {
            this._remove = func;
            return this;
        },
        execute: function () {
            var oldArr = this._old;
            var newArr = this._new;
            var oldKeyGetter = this._oldKeyGetter;
            var newKeyGetter = this._newKeyGetter;
            var oldDataIndexMap = {};
            var newDataIndexMap = {};
            var oldDataKeyArr = [];
            var newDataKeyArr = [];
            var i;
            initIndexMap(oldArr, oldDataIndexMap, oldDataKeyArr, oldKeyGetter);
            initIndexMap(newArr, newDataIndexMap, newDataKeyArr, newKeyGetter);
            // Travel by inverted order to make sure order consistency
            // when duplicate keys exists (consider newDataIndex.pop() below).
            // For performance consideration, these code below do not look neat.
            for (i = 0; i < oldArr.length; i++) {
                var key = oldDataKeyArr[i];
                var idx = newDataIndexMap[key];
                // idx can never be empty array here. see 'set null' logic below.
                if (idx != null) {
                    // Consider there is duplicate key (for example, use dataItem.name as key).
                    // We should make sure every item in newArr and oldArr can be visited.
                    var len = idx.length;
                    if (len) {
                        len === 1 && (newDataIndexMap[key] = null);
                        idx = idx.unshift();
                    } else {
                        newDataIndexMap[key] = null;
                    }
                    this._update && this._update(idx, i);
                } else {
                    this._remove && this._remove(i);
                }
            }
            for (var i = 0; i < newDataKeyArr.length; i++) {
                var key = newDataKeyArr[i];
                if (newDataIndexMap.hasOwnProperty(key)) {
                    var idx = newDataIndexMap[key];
                    if (idx == null) {
                        continue;
                    }
                    // idx can never be empty array here. see 'set null' logic above.
                    if (!idx.length) {
                        this._add && this._add(idx);
                    } else {
                        for (var j = 0, len = idx.length; j < len; j++) {
                            this._add && this._add(idx[j]);
                        }
                    }
                }
            }
        }
    };
    function initIndexMap(arr, map, keyArr, keyGetter) {
        for (var i = 0; i < arr.length; i++) {
            var key = keyGetter(arr[i], i);
            var existence = map[key];
            if (existence == null) {
                keyArr.push(key);
                map[key] = i;
            } else {
                if (!existence.length) {
                    map[key] = existence = [existence];
                }
                existence.push(i);
            }
        }
    }
    return DataDiffer;
});
define('echarts/util/clazz', ['require', 'zrender/core/util'], function (require) {
    var zrUtil = require('zrender/core/util');
    var clazz = {};
    var TYPE_DELIMITER = '.';
    var IS_CONTAINER = '___EC__COMPONENT__CONTAINER___';
    var MEMBER_PRIFIX = ' ec_ ';
    /**
     * Hide private class member.
     * The same behavior as `host[name] = value;` (can be right-value)
     * @public
     */
    clazz.set = function (host, name, value) {
        return host[MEMBER_PRIFIX + name] = value;
    };
    /**
     * Hide private class member.
     * The same behavior as `host[name];`
     * @public
     */
    clazz.get = function (host, name) {
        return host[MEMBER_PRIFIX + name];
    };
    /**
     * For hidden private class member.
     * The same behavior as `host.hasOwnProperty(name);`
     * @public
     */
    clazz.hasOwn = function (host, name) {
        return host.hasOwnProperty(MEMBER_PRIFIX + name);
    };
    /**
     * @public
     */
    var parseClassType = clazz.parseClassType = function (componentType) {
            var ret = {
                    main: '',
                    sub: ''
                };
            if (componentType) {
                componentType = componentType.split(TYPE_DELIMITER);
                ret.main = componentType[0] || '';
                ret.sub = componentType[1] || '';
            }
            return ret;
        };
    /**
     * @public
     */
    function checkClassType(componentType) {
        zrUtil.assert(/^[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)?$/.test(componentType), 'componentType "' + componentType + '" illegal');
    }
    /**
     * @public
     */
    clazz.enableClassExtend = function (RootClass, mandatoryMethods) {
        RootClass.$constructor = RootClass;
        RootClass.extend = function (proto) {
            if (true) {
                zrUtil.each(mandatoryMethods, function (method) {
                    if (!proto[method]) {
                        console.warn('Method `' + method + '` should be implemented' + (proto.type ? ' in ' + proto.type : '') + '.');
                    }
                });
            }
            var superClass = this;
            var ExtendedClass = function () {
                if (!proto.$constructor) {
                    superClass.apply(this, arguments);
                } else {
                    proto.$constructor.apply(this, arguments);
                }
            };
            zrUtil.extend(ExtendedClass.prototype, proto);
            ExtendedClass.extend = this.extend;
            ExtendedClass.superCall = superCall;
            ExtendedClass.superApply = superApply;
            zrUtil.inherits(ExtendedClass, this);
            ExtendedClass.superClass = superClass;
            return ExtendedClass;
        };
    };
    // superCall should have class info, which can not be fetch from 'this'.
    // Consider this case:
    // class A has method f,
    // class B inherits class A, overrides method f, f call superApply('f'),
    // class C inherits class B, do not overrides method f,
    // then when method of class C is called, dead loop occured.
    function superCall(context, methodName) {
        var args = zrUtil.slice(arguments, 2);
        return this.superClass.prototype[methodName].apply(context, args);
    }
    function superApply(context, methodName, args) {
        return this.superClass.prototype[methodName].apply(context, args);
    }
    /**
     * @param {Object} entity
     * @param {Object} options
     * @param {boolean} [options.registerWhenExtend]
     * @public
     */
    clazz.enableClassManagement = function (entity, options) {
        options = options || {};
        /**
         * Component model classes
         * key: componentType,
         * value:
         *     componentClass, when componentType is 'xxx'
         *     or Object.<subKey, componentClass>, when componentType is 'xxx.yy'
         * @type {Object}
         */
        var storage = {};
        entity.registerClass = function (Clazz, componentType) {
            if (componentType) {
                checkClassType(componentType);
                componentType = parseClassType(componentType);
                if (!componentType.sub) {
                    if (true) {
                        if (storage[componentType.main]) {
                            console.warn(componentType.main + ' exists.');
                        }
                    }
                    storage[componentType.main] = Clazz;
                } else if (componentType.sub !== IS_CONTAINER) {
                    var container = makeContainer(componentType);
                    container[componentType.sub] = Clazz;
                }
            }
            return Clazz;
        };
        entity.getClass = function (componentMainType, subType, throwWhenNotFound) {
            var Clazz = storage[componentMainType];
            if (Clazz && Clazz[IS_CONTAINER]) {
                Clazz = subType ? Clazz[subType] : null;
            }
            if (throwWhenNotFound && !Clazz) {
                throw new Error(!subType ? componentMainType + '.' + 'type should be specified.' : 'Component ' + componentMainType + '.' + (subType || '') + ' not exists. Load it first.');
            }
            return Clazz;
        };
        entity.getClassesByMainType = function (componentType) {
            componentType = parseClassType(componentType);
            var result = [];
            var obj = storage[componentType.main];
            if (obj && obj[IS_CONTAINER]) {
                zrUtil.each(obj, function (o, type) {
                    type !== IS_CONTAINER && result.push(o);
                });
            } else {
                result.push(obj);
            }
            return result;
        };
        entity.hasClass = function (componentType) {
            // Just consider componentType.main.
            componentType = parseClassType(componentType);
            return !!storage[componentType.main];
        };
        /**
         * @return {Array.<string>} Like ['aa', 'bb'], but can not be ['aa.xx']
         */
        entity.getAllClassMainTypes = function () {
            var types = [];
            zrUtil.each(storage, function (obj, type) {
                types.push(type);
            });
            return types;
        };
        /**
         * If a main type is container and has sub types
         * @param  {string}  mainType
         * @return {boolean}
         */
        entity.hasSubTypes = function (componentType) {
            componentType = parseClassType(componentType);
            var obj = storage[componentType.main];
            return obj && obj[IS_CONTAINER];
        };
        entity.parseClassType = parseClassType;
        function makeContainer(componentType) {
            var container = storage[componentType.main];
            if (!container || !container[IS_CONTAINER]) {
                container = storage[componentType.main] = {};
                container[IS_CONTAINER] = true;
            }
            return container;
        }
        if (options.registerWhenExtend) {
            var originalExtend = entity.extend;
            if (originalExtend) {
                entity.extend = function (proto) {
                    var ExtendedClass = originalExtend.call(this, proto);
                    return entity.registerClass(ExtendedClass, proto.type);
                };
            }
        }
        return entity;
    };
    /**
     * @param {string|Array.<string>} properties
     */
    clazz.setReadOnly = function (obj, properties) {
    };
    return clazz;
});
define('echarts/model/mixin/lineStyle', ['require', './makeStyleMapper'], function (require) {
    var getLineStyle = require('./makeStyleMapper')([
            [
                'lineWidth',
                'width'
            ],
            [
                'stroke',
                'color'
            ],
            ['opacity'],
            ['shadowBlur'],
            ['shadowOffsetX'],
            ['shadowOffsetY'],
            ['shadowColor']
        ]);
    return {
        getLineStyle: function (excludes) {
            var style = getLineStyle.call(this, excludes);
            var lineDash = this.getLineDash(style.lineWidth);
            lineDash && (style.lineDash = lineDash);
            return style;
        },
        getLineDash: function (lineWidth) {
            if (lineWidth == null) {
                lineWidth = 1;
            }
            var lineType = this.get('type');
            var dotSize = Math.max(lineWidth, 2);
            var dashSize = lineWidth * 4;
            return lineType === 'solid' || lineType == null ? null : lineType === 'dashed' ? [
                dashSize,
                dashSize
            ] : [
                dotSize,
                dotSize
            ];
        }
    };
});
define('echarts/model/mixin/areaStyle', ['require', './makeStyleMapper'], function (require) {
    return {
        getAreaStyle: require('./makeStyleMapper')([
            [
                'fill',
                'color'
            ],
            ['shadowBlur'],
            ['shadowOffsetX'],
            ['shadowOffsetY'],
            ['opacity'],
            ['shadowColor']
        ])
    };
});
define('echarts/model/mixin/textStyle', ['require', 'zrender/contain/text'], function (require) {
    var textContain = require('zrender/contain/text');
    function getShallow(model, path) {
        return model && model.getShallow(path);
    }
    return {
        getTextColor: function () {
            var ecModel = this.ecModel;
            return this.getShallow('color') || ecModel && ecModel.get('textStyle.color');
        },
        getFont: function () {
            var ecModel = this.ecModel;
            var gTextStyleModel = ecModel && ecModel.getModel('textStyle');
            return [
                this.getShallow('fontStyle') || getShallow(gTextStyleModel, 'fontStyle'),
                this.getShallow('fontWeight') || getShallow(gTextStyleModel, 'fontWeight'),
                (this.getShallow('fontSize') || getShallow(gTextStyleModel, 'fontSize') || 12) + 'px',
                this.getShallow('fontFamily') || getShallow(gTextStyleModel, 'fontFamily') || 'sans-serif'
            ].join(' ');
        },
        getTextRect: function (text) {
            return textContain.getBoundingRect(text, this.getFont(), this.getShallow('align'), this.getShallow('baseline'));
        },
        truncateText: function (text, containerWidth, ellipsis, options) {
            return textContain.truncateText(text, containerWidth, this.getFont(), ellipsis, options);
        }
    };
});
define('echarts/model/mixin/itemStyle', ['require', './makeStyleMapper'], function (require) {
    var getItemStyle = require('./makeStyleMapper')([
            [
                'fill',
                'color'
            ],
            [
                'stroke',
                'borderColor'
            ],
            [
                'lineWidth',
                'borderWidth'
            ],
            ['opacity'],
            ['shadowBlur'],
            ['shadowOffsetX'],
            ['shadowOffsetY'],
            ['shadowColor'],
            ['textPosition'],
            ['textAlign']
        ]);
    return {
        getItemStyle: function (excludes) {
            var style = getItemStyle.call(this, excludes);
            var lineDash = this.getBorderLineDash();
            lineDash && (style.lineDash = lineDash);
            return style;
        },
        getBorderLineDash: function () {
            var lineType = this.get('borderType');
            return lineType === 'solid' || lineType == null ? null : lineType === 'dashed' ? [
                5,
                5
            ] : [
                1,
                1
            ];
        }
    };
});
define('echarts/component/marker/MarkerModel', ['require', '../../util/model', 'zrender/core/util', 'zrender/core/env', '../../util/format', '../../echarts'], function (require) {
    var modelUtil = require('../../util/model');
    var zrUtil = require('zrender/core/util');
    var env = require('zrender/core/env');
    var formatUtil = require('../../util/format');
    var addCommas = formatUtil.addCommas;
    var encodeHTML = formatUtil.encodeHTML;
    function fillLabel(opt) {
        modelUtil.defaultEmphasis(opt.label, modelUtil.LABEL_OPTIONS);
    }
    var MarkerModel = require('../../echarts').extendComponentModel({
            type: 'marker',
            dependencies: [
                'series',
                'grid',
                'polar',
                'geo'
            ],
            init: function (option, parentModel, ecModel, extraOpt) {
                if (true) {
                    if (this.type === 'marker') {
                        throw new Error('Marker component is abstract component. Use markLine, markPoint, markArea instead.');
                    }
                }
                this.mergeDefaultAndTheme(option, ecModel);
                this.mergeOption(option, ecModel, extraOpt.createdBySelf, true);
            },
            isAnimationEnabled: function () {
                if (env.node) {
                    return false;
                }
                var hostSeries = this.__hostSeries;
                return this.getShallow('animation') && hostSeries && hostSeries.isAnimationEnabled();
            },
            mergeOption: function (newOpt, ecModel, createdBySelf, isInit) {
                var MarkerModel = this.constructor;
                var modelPropName = this.mainType + 'Model';
                if (!createdBySelf) {
                    ecModel.eachSeries(function (seriesModel) {
                        var markerOpt = seriesModel.get(this.mainType);
                        var markerModel = seriesModel[modelPropName];
                        if (!markerOpt || !markerOpt.data) {
                            seriesModel[modelPropName] = null;
                            return;
                        }
                        if (!markerModel) {
                            if (isInit) {
                                // Default label emphasis `position` and `show`
                                fillLabel(markerOpt);
                            }
                            zrUtil.each(markerOpt.data, function (item) {
                                // FIXME Overwrite fillLabel method ?
                                if (item instanceof Array) {
                                    fillLabel(item[0]);
                                    fillLabel(item[1]);
                                } else {
                                    fillLabel(item);
                                }
                            });
                            markerModel = new MarkerModel(markerOpt, this, ecModel);
                            zrUtil.extend(markerModel, {
                                mainType: this.mainType,
                                seriesIndex: seriesModel.seriesIndex,
                                name: seriesModel.name,
                                createdBySelf: true
                            });
                            markerModel.__hostSeries = seriesModel;
                        } else {
                            markerModel.mergeOption(markerOpt, ecModel, true);
                        }
                        seriesModel[modelPropName] = markerModel;
                    }, this);
                }
            },
            formatTooltip: function (dataIndex) {
                var data = this.getData();
                var value = this.getRawValue(dataIndex);
                var formattedValue = zrUtil.isArray(value) ? zrUtil.map(value, addCommas).join(', ') : addCommas(value);
                var name = data.getName(dataIndex);
                var html = encodeHTML(this.name);
                if (value != null || name) {
                    html += '<br />';
                }
                if (name) {
                    html += encodeHTML(name);
                    if (value != null) {
                        html += ' : ';
                    }
                }
                if (value != null) {
                    html += encodeHTML(formattedValue);
                }
                return html;
            },
            getData: function () {
                return this._data;
            },
            setData: function (data) {
                this._data = data;
            }
        });
    zrUtil.mixin(MarkerModel, modelUtil.dataFormatMixin);
    return MarkerModel;
});
define('zrender/core/PathProxy', ['require', './curve', './vector', './bbox', './BoundingRect', '../config'], function (require) {
    'use strict';
    var curve = require('./curve');
    var vec2 = require('./vector');
    var bbox = require('./bbox');
    var BoundingRect = require('./BoundingRect');
    var dpr = require('../config').devicePixelRatio;
    var CMD = {
            M: 1,
            L: 2,
            C: 3,
            Q: 4,
            A: 5,
            Z: 6,
            R: 7
        };
    var min = [];
    var max = [];
    var min2 = [];
    var max2 = [];
    var mathMin = Math.min;
    var mathMax = Math.max;
    var mathCos = Math.cos;
    var mathSin = Math.sin;
    var mathSqrt = Math.sqrt;
    var mathAbs = Math.abs;
    var hasTypedArray = typeof Float32Array != 'undefined';
    /**
     * @alias module:zrender/core/PathProxy
     * @constructor
     */
    var PathProxy = function () {
        /**
         * Path data. Stored as flat array
         * @type {Array.<Object>}
         */
        this.data = [];
        this._len = 0;
        this._ctx = null;
        this._xi = 0;
        this._yi = 0;
        this._x0 = 0;
        this._y0 = 0;
        // Unit x, Unit y. Provide for avoiding drawing that too short line segment
        this._ux = 0;
        this._uy = 0;
    };
    /**
     * 快速计算Path包围盒（并不是最小包围盒）
     * @return {Object}
     */
    PathProxy.prototype = {
        constructor: PathProxy,
        _lineDash: null,
        _dashOffset: 0,
        _dashIdx: 0,
        _dashSum: 0,
        setScale: function (sx, sy) {
            this._ux = mathAbs(1 / dpr / sx) || 0;
            this._uy = mathAbs(1 / dpr / sy) || 0;
        },
        getContext: function () {
            return this._ctx;
        },
        beginPath: function (ctx) {
            this._ctx = ctx;
            ctx && ctx.beginPath();
            ctx && (this.dpr = ctx.dpr);
            // Reset
            this._len = 0;
            if (this._lineDash) {
                this._lineDash = null;
                this._dashOffset = 0;
            }
            return this;
        },
        moveTo: function (x, y) {
            this.addData(CMD.M, x, y);
            this._ctx && this._ctx.moveTo(x, y);
            // x0, y0, xi, yi 是记录在 _dashedXXXXTo 方法中使用
            // xi, yi 记录当前点, x0, y0 在 closePath 的时候回到起始点。
            // 有可能在 beginPath 之后直接调用 lineTo，这时候 x0, y0 需要
            // 在 lineTo 方法中记录，这里先不考虑这种情况，dashed line 也只在 IE10- 中不支持
            this._x0 = x;
            this._y0 = y;
            this._xi = x;
            this._yi = y;
            return this;
        },
        lineTo: function (x, y) {
            var exceedUnit = mathAbs(x - this._xi) > this._ux || mathAbs(y - this._yi) > this._uy || this._len < 5;
            this.addData(CMD.L, x, y);
            if (this._ctx && exceedUnit) {
                this._needsDash() ? this._dashedLineTo(x, y) : this._ctx.lineTo(x, y);
            }
            if (exceedUnit) {
                this._xi = x;
                this._yi = y;
            }
            return this;
        },
        bezierCurveTo: function (x1, y1, x2, y2, x3, y3) {
            this.addData(CMD.C, x1, y1, x2, y2, x3, y3);
            if (this._ctx) {
                this._needsDash() ? this._dashedBezierTo(x1, y1, x2, y2, x3, y3) : this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
            }
            this._xi = x3;
            this._yi = y3;
            return this;
        },
        quadraticCurveTo: function (x1, y1, x2, y2) {
            this.addData(CMD.Q, x1, y1, x2, y2);
            if (this._ctx) {
                this._needsDash() ? this._dashedQuadraticTo(x1, y1, x2, y2) : this._ctx.quadraticCurveTo(x1, y1, x2, y2);
            }
            this._xi = x2;
            this._yi = y2;
            return this;
        },
        arc: function (cx, cy, r, startAngle, endAngle, anticlockwise) {
            this.addData(CMD.A, cx, cy, r, r, startAngle, endAngle - startAngle, 0, anticlockwise ? 0 : 1);
            this._ctx && this._ctx.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
            this._xi = mathCos(endAngle) * r + cx;
            this._yi = mathSin(endAngle) * r + cx;
            return this;
        },
        arcTo: function (x1, y1, x2, y2, radius) {
            if (this._ctx) {
                this._ctx.arcTo(x1, y1, x2, y2, radius);
            }
            return this;
        },
        rect: function (x, y, w, h) {
            this._ctx && this._ctx.rect(x, y, w, h);
            this.addData(CMD.R, x, y, w, h);
            return this;
        },
        closePath: function () {
            this.addData(CMD.Z);
            var ctx = this._ctx;
            var x0 = this._x0;
            var y0 = this._y0;
            if (ctx) {
                this._needsDash() && this._dashedLineTo(x0, y0);
                ctx.closePath();
            }
            this._xi = x0;
            this._yi = y0;
            return this;
        },
        fill: function (ctx) {
            ctx && ctx.fill();
            this.toStatic();
        },
        stroke: function (ctx) {
            ctx && ctx.stroke();
            this.toStatic();
        },
        setLineDash: function (lineDash) {
            if (lineDash instanceof Array) {
                this._lineDash = lineDash;
                this._dashIdx = 0;
                var lineDashSum = 0;
                for (var i = 0; i < lineDash.length; i++) {
                    lineDashSum += lineDash[i];
                }
                this._dashSum = lineDashSum;
            }
            return this;
        },
        setLineDashOffset: function (offset) {
            this._dashOffset = offset;
            return this;
        },
        len: function () {
            return this._len;
        },
        setData: function (data) {
            var len = data.length;
            if (!(this.data && this.data.length == len) && hasTypedArray) {
                this.data = new Float32Array(len);
            }
            for (var i = 0; i < len; i++) {
                this.data[i] = data[i];
            }
            this._len = len;
        },
        appendPath: function (path) {
            if (!(path instanceof Array)) {
                path = [path];
            }
            var len = path.length;
            var appendSize = 0;
            var offset = this._len;
            for (var i = 0; i < len; i++) {
                appendSize += path[i].len();
            }
            if (hasTypedArray && this.data instanceof Float32Array) {
                this.data = new Float32Array(offset + appendSize);
            }
            for (var i = 0; i < len; i++) {
                var appendPathData = path[i].data;
                for (var k = 0; k < appendPathData.length; k++) {
                    this.data[offset++] = appendPathData[k];
                }
            }
            this._len = offset;
        },
        addData: function (cmd) {
            var data = this.data;
            if (this._len + arguments.length > data.length) {
                // 因为之前的数组已经转换成静态的 Float32Array
                // 所以不够用时需要扩展一个新的动态数组
                this._expandData();
                data = this.data;
            }
            for (var i = 0; i < arguments.length; i++) {
                data[this._len++] = arguments[i];
            }
            this._prevCmd = cmd;
        },
        _expandData: function () {
            // Only if data is Float32Array
            if (!(this.data instanceof Array)) {
                var newData = [];
                for (var i = 0; i < this._len; i++) {
                    newData[i] = this.data[i];
                }
                this.data = newData;
            }
        },
        _needsDash: function () {
            return this._lineDash;
        },
        _dashedLineTo: function (x1, y1) {
            var dashSum = this._dashSum;
            var offset = this._dashOffset;
            var lineDash = this._lineDash;
            var ctx = this._ctx;
            var x0 = this._xi;
            var y0 = this._yi;
            var dx = x1 - x0;
            var dy = y1 - y0;
            var dist = mathSqrt(dx * dx + dy * dy);
            var x = x0;
            var y = y0;
            var dash;
            var nDash = lineDash.length;
            var idx;
            dx /= dist;
            dy /= dist;
            if (offset < 0) {
                // Convert to positive offset
                offset = dashSum + offset;
            }
            offset %= dashSum;
            x -= offset * dx;
            y -= offset * dy;
            while (dx > 0 && x <= x1 || dx < 0 && x >= x1 || dx == 0 && (dy > 0 && y <= y1 || dy < 0 && y >= y1)) {
                idx = this._dashIdx;
                dash = lineDash[idx];
                x += dx * dash;
                y += dy * dash;
                this._dashIdx = (idx + 1) % nDash;
                // Skip positive offset
                if (dx > 0 && x < x0 || dx < 0 && x > x0 || dy > 0 && y < y0 || dy < 0 && y > y0) {
                    continue;
                }
                ctx[idx % 2 ? 'moveTo' : 'lineTo'](dx >= 0 ? mathMin(x, x1) : mathMax(x, x1), dy >= 0 ? mathMin(y, y1) : mathMax(y, y1));
            }
            // Offset for next lineTo
            dx = x - x1;
            dy = y - y1;
            this._dashOffset = -mathSqrt(dx * dx + dy * dy);
        },
        _dashedBezierTo: function (x1, y1, x2, y2, x3, y3) {
            var dashSum = this._dashSum;
            var offset = this._dashOffset;
            var lineDash = this._lineDash;
            var ctx = this._ctx;
            var x0 = this._xi;
            var y0 = this._yi;
            var t;
            var dx;
            var dy;
            var cubicAt = curve.cubicAt;
            var bezierLen = 0;
            var idx = this._dashIdx;
            var nDash = lineDash.length;
            var x;
            var y;
            var tmpLen = 0;
            if (offset < 0) {
                // Convert to positive offset
                offset = dashSum + offset;
            }
            offset %= dashSum;
            // Bezier approx length
            for (t = 0; t < 1; t += 0.1) {
                dx = cubicAt(x0, x1, x2, x3, t + 0.1) - cubicAt(x0, x1, x2, x3, t);
                dy = cubicAt(y0, y1, y2, y3, t + 0.1) - cubicAt(y0, y1, y2, y3, t);
                bezierLen += mathSqrt(dx * dx + dy * dy);
            }
            // Find idx after add offset
            for (; idx < nDash; idx++) {
                tmpLen += lineDash[idx];
                if (tmpLen > offset) {
                    break;
                }
            }
            t = (tmpLen - offset) / bezierLen;
            while (t <= 1) {
                x = cubicAt(x0, x1, x2, x3, t);
                y = cubicAt(y0, y1, y2, y3, t);
                // Use line to approximate dashed bezier
                // Bad result if dash is long
                idx % 2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                t += lineDash[idx] / bezierLen;
                idx = (idx + 1) % nDash;
            }
            // Finish the last segment and calculate the new offset
            idx % 2 !== 0 && ctx.lineTo(x3, y3);
            dx = x3 - x;
            dy = y3 - y;
            this._dashOffset = -mathSqrt(dx * dx + dy * dy);
        },
        _dashedQuadraticTo: function (x1, y1, x2, y2) {
            // Convert quadratic to cubic using degree elevation
            var x3 = x2;
            var y3 = y2;
            x2 = (x2 + 2 * x1) / 3;
            y2 = (y2 + 2 * y1) / 3;
            x1 = (this._xi + 2 * x1) / 3;
            y1 = (this._yi + 2 * y1) / 3;
            this._dashedBezierTo(x1, y1, x2, y2, x3, y3);
        },
        toStatic: function () {
            var data = this.data;
            if (data instanceof Array) {
                data.length = this._len;
                if (hasTypedArray) {
                    this.data = new Float32Array(data);
                }
            }
        },
        getBoundingRect: function () {
            min[0] = min[1] = min2[0] = min2[1] = Number.MAX_VALUE;
            max[0] = max[1] = max2[0] = max2[1] = -Number.MAX_VALUE;
            var data = this.data;
            var xi = 0;
            var yi = 0;
            var x0 = 0;
            var y0 = 0;
            for (var i = 0; i < data.length;) {
                var cmd = data[i++];
                if (i == 1) {
                    // 如果第一个命令是 L, C, Q
                    // 则 previous point 同绘制命令的第一个 point
                    //
                    // 第一个命令为 Arc 的情况下会在后面特殊处理
                    xi = data[i];
                    yi = data[i + 1];
                    x0 = xi;
                    y0 = yi;
                }
                switch (cmd) {
                case CMD.M:
                    // moveTo 命令重新创建一个新的 subpath, 并且更新新的起点
                    // 在 closePath 的时候使用
                    x0 = data[i++];
                    y0 = data[i++];
                    xi = x0;
                    yi = y0;
                    min2[0] = x0;
                    min2[1] = y0;
                    max2[0] = x0;
                    max2[1] = y0;
                    break;
                case CMD.L:
                    bbox.fromLine(xi, yi, data[i], data[i + 1], min2, max2);
                    xi = data[i++];
                    yi = data[i++];
                    break;
                case CMD.C:
                    bbox.fromCubic(xi, yi, data[i++], data[i++], data[i++], data[i++], data[i], data[i + 1], min2, max2);
                    xi = data[i++];
                    yi = data[i++];
                    break;
                case CMD.Q:
                    bbox.fromQuadratic(xi, yi, data[i++], data[i++], data[i], data[i + 1], min2, max2);
                    xi = data[i++];
                    yi = data[i++];
                    break;
                case CMD.A:
                    // TODO Arc 判断的开销比较大
                    var cx = data[i++];
                    var cy = data[i++];
                    var rx = data[i++];
                    var ry = data[i++];
                    var startAngle = data[i++];
                    var endAngle = data[i++] + startAngle;
                    // TODO Arc 旋转
                    var psi = data[i++];
                    var anticlockwise = 1 - data[i++];
                    if (i == 1) {
                        // 直接使用 arc 命令
                        // 第一个命令起点还未定义
                        x0 = mathCos(startAngle) * rx + cx;
                        y0 = mathSin(startAngle) * ry + cy;
                    }
                    bbox.fromArc(cx, cy, rx, ry, startAngle, endAngle, anticlockwise, min2, max2);
                    xi = mathCos(endAngle) * rx + cx;
                    yi = mathSin(endAngle) * ry + cy;
                    break;
                case CMD.R:
                    x0 = xi = data[i++];
                    y0 = yi = data[i++];
                    var width = data[i++];
                    var height = data[i++];
                    // Use fromLine
                    bbox.fromLine(x0, y0, x0 + width, y0 + height, min2, max2);
                    break;
                case CMD.Z:
                    xi = x0;
                    yi = y0;
                    break;
                }
                // Union
                vec2.min(min, min, min2);
                vec2.max(max, max, max2);
            }
            // No data
            if (i === 0) {
                min[0] = min[1] = max[0] = max[1] = 0;
            }
            return new BoundingRect(min[0], min[1], max[0] - min[0], max[1] - min[1]);
        },
        rebuildPath: function (ctx) {
            var d = this.data;
            var x0, y0;
            var xi, yi;
            var x, y;
            var ux = this._ux;
            var uy = this._uy;
            var len = this._len;
            for (var i = 0; i < len;) {
                var cmd = d[i++];
                if (i == 1) {
                    // 如果第一个命令是 L, C, Q
                    // 则 previous point 同绘制命令的第一个 point
                    //
                    // 第一个命令为 Arc 的情况下会在后面特殊处理
                    xi = d[i];
                    yi = d[i + 1];
                    x0 = xi;
                    y0 = yi;
                }
                switch (cmd) {
                case CMD.M:
                    x0 = xi = d[i++];
                    y0 = yi = d[i++];
                    ctx.moveTo(xi, yi);
                    break;
                case CMD.L:
                    x = d[i++];
                    y = d[i++];
                    // Not draw too small seg between
                    if (mathAbs(x - xi) > ux || mathAbs(y - yi) > uy || i === len - 1) {
                        ctx.lineTo(x, y);
                        xi = x;
                        yi = y;
                    }
                    break;
                case CMD.C:
                    ctx.bezierCurveTo(d[i++], d[i++], d[i++], d[i++], d[i++], d[i++]);
                    xi = d[i - 2];
                    yi = d[i - 1];
                    break;
                case CMD.Q:
                    ctx.quadraticCurveTo(d[i++], d[i++], d[i++], d[i++]);
                    xi = d[i - 2];
                    yi = d[i - 1];
                    break;
                case CMD.A:
                    var cx = d[i++];
                    var cy = d[i++];
                    var rx = d[i++];
                    var ry = d[i++];
                    var theta = d[i++];
                    var dTheta = d[i++];
                    var psi = d[i++];
                    var fs = d[i++];
                    var r = rx > ry ? rx : ry;
                    var scaleX = rx > ry ? 1 : rx / ry;
                    var scaleY = rx > ry ? ry / rx : 1;
                    var isEllipse = Math.abs(rx - ry) > 0.001;
                    var endAngle = theta + dTheta;
                    if (isEllipse) {
                        ctx.translate(cx, cy);
                        ctx.rotate(psi);
                        ctx.scale(scaleX, scaleY);
                        ctx.arc(0, 0, r, theta, endAngle, 1 - fs);
                        ctx.scale(1 / scaleX, 1 / scaleY);
                        ctx.rotate(-psi);
                        ctx.translate(-cx, -cy);
                    } else {
                        ctx.arc(cx, cy, r, theta, endAngle, 1 - fs);
                    }
                    if (i == 1) {
                        // 直接使用 arc 命令
                        // 第一个命令起点还未定义
                        x0 = mathCos(theta) * rx + cx;
                        y0 = mathSin(theta) * ry + cy;
                    }
                    xi = mathCos(endAngle) * rx + cx;
                    yi = mathSin(endAngle) * ry + cy;
                    break;
                case CMD.R:
                    x0 = xi = d[i];
                    y0 = yi = d[i + 1];
                    ctx.rect(d[i++], d[i++], d[i++], d[i++]);
                    break;
                case CMD.Z:
                    ctx.closePath();
                    xi = x0;
                    yi = y0;
                }
            }
        }
    };
    PathProxy.CMD = CMD;
    return PathProxy;
});
define('zrender/tool/transformPath', ['require', '../core/PathProxy', '../core/vector'], function (require) {
    var CMD = require('../core/PathProxy').CMD;
    var vec2 = require('../core/vector');
    var v2ApplyTransform = vec2.applyTransform;
    var points = [
            [],
            [],
            []
        ];
    var mathSqrt = Math.sqrt;
    var mathAtan2 = Math.atan2;
    function transformPath(path, m) {
        var data = path.data;
        var cmd;
        var nPoint;
        var i;
        var j;
        var k;
        var p;
        var M = CMD.M;
        var C = CMD.C;
        var L = CMD.L;
        var R = CMD.R;
        var A = CMD.A;
        var Q = CMD.Q;
        for (i = 0, j = 0; i < data.length;) {
            cmd = data[i++];
            j = i;
            nPoint = 0;
            switch (cmd) {
            case M:
                nPoint = 1;
                break;
            case L:
                nPoint = 1;
                break;
            case C:
                nPoint = 3;
                break;
            case Q:
                nPoint = 2;
                break;
            case A:
                var x = m[4];
                var y = m[5];
                var sx = mathSqrt(m[0] * m[0] + m[1] * m[1]);
                var sy = mathSqrt(m[2] * m[2] + m[3] * m[3]);
                var angle = mathAtan2(-m[1] / sy, m[0] / sx);
                // cx
                data[i++] += x;
                // cy
                data[i++] += y;
                // Scale rx and ry
                // FIXME Assume psi is 0 here
                data[i++] *= sx;
                data[i++] *= sy;
                // Start angle
                data[i++] += angle;
                // end angle
                data[i++] += angle;
                // FIXME psi
                i += 2;
                j = i;
                break;
            case R:
                // x0, y0
                p[0] = data[i++];
                p[1] = data[i++];
                v2ApplyTransform(p, p, m);
                data[j++] = p[0];
                data[j++] = p[1];
                // x1, y1
                p[0] += data[i++];
                p[1] += data[i++];
                v2ApplyTransform(p, p, m);
                data[j++] = p[0];
                data[j++] = p[1];
            }
            for (k = 0; k < nPoint; k++) {
                var p = points[k];
                p[0] = data[i++];
                p[1] = data[i++];
                v2ApplyTransform(p, p, m);
                // Write back
                data[j++] = p[0];
                data[j++] = p[1];
            }
        }
    }
    return transformPath;
});
define('zrender/graphic/Displayable', ['require', '../core/util', './Style', '../Element', './mixin/RectText'], function (require) {
    var zrUtil = require('../core/util');
    var Style = require('./Style');
    var Element = require('../Element');
    var RectText = require('./mixin/RectText');
    // var Stateful = require('./mixin/Stateful');
    /**
     * @alias module:zrender/graphic/Displayable
     * @extends module:zrender/Element
     * @extends module:zrender/graphic/mixin/RectText
     */
    function Displayable(opts) {
        opts = opts || {};
        Element.call(this, opts);
        // Extend properties
        for (var name in opts) {
            if (opts.hasOwnProperty(name) && name !== 'style') {
                this[name] = opts[name];
            }
        }
        /**
         * @type {module:zrender/graphic/Style}
         */
        this.style = new Style(opts.style);
        this._rect = null;
        // Shapes for cascade clipping.
        this.__clipPaths = [];    // FIXME Stateful must be mixined after style is setted
                                  // Stateful.call(this, opts);
    }
    Displayable.prototype = {
        constructor: Displayable,
        type: 'displayable',
        __dirty: true,
        invisible: false,
        z: 0,
        z2: 0,
        zlevel: 0,
        draggable: false,
        dragging: false,
        silent: false,
        culling: false,
        cursor: 'pointer',
        rectHover: false,
        progressive: -1,
        beforeBrush: function (ctx) {
        },
        afterBrush: function (ctx) {
        },
        brush: function (ctx, prevEl) {
        },
        getBoundingRect: function () {
        },
        contain: function (x, y) {
            return this.rectContain(x, y);
        },
        traverse: function (cb, context) {
            cb.call(context, this);
        },
        rectContain: function (x, y) {
            var coord = this.transformCoordToLocal(x, y);
            var rect = this.getBoundingRect();
            return rect.contain(coord[0], coord[1]);
        },
        dirty: function () {
            this.__dirty = true;
            this._rect = null;
            this.__zr && this.__zr.refresh();
        },
        animateStyle: function (loop) {
            return this.animate('style', loop);
        },
        attrKV: function (key, value) {
            if (key !== 'style') {
                Element.prototype.attrKV.call(this, key, value);
            } else {
                this.style.set(value);
            }
        },
        setStyle: function (key, value) {
            this.style.set(key, value);
            this.dirty(false);
            return this;
        },
        useStyle: function (obj) {
            this.style = new Style(obj);
            this.dirty(false);
            return this;
        }
    };
    zrUtil.inherits(Displayable, Element);
    zrUtil.mixin(Displayable, RectText);
    // zrUtil.mixin(Displayable, Stateful);
    return Displayable;
});
define('zrender/contain/path', ['require', '../core/PathProxy', './line', './cubic', './quadratic', './arc', './util', '../core/curve', './windingLine'], function (require) {
    'use strict';
    var CMD = require('../core/PathProxy').CMD;
    var line = require('./line');
    var cubic = require('./cubic');
    var quadratic = require('./quadratic');
    var arc = require('./arc');
    var normalizeRadian = require('./util').normalizeRadian;
    var curve = require('../core/curve');
    var windingLine = require('./windingLine');
    var containStroke = line.containStroke;
    var PI2 = Math.PI * 2;
    var EPSILON = 0.0001;
    function isAroundEqual(a, b) {
        return Math.abs(a - b) < EPSILON;
    }
    // 临时数组
    var roots = [
            -1,
            -1,
            -1
        ];
    var extrema = [
            -1,
            -1
        ];
    function swapExtrema() {
        var tmp = extrema[0];
        extrema[0] = extrema[1];
        extrema[1] = tmp;
    }
    function windingCubic(x0, y0, x1, y1, x2, y2, x3, y3, x, y) {
        // Quick reject
        if (y > y0 && y > y1 && y > y2 && y > y3 || y < y0 && y < y1 && y < y2 && y < y3) {
            return 0;
        }
        var nRoots = curve.cubicRootAt(y0, y1, y2, y3, y, roots);
        if (nRoots === 0) {
            return 0;
        } else {
            var w = 0;
            var nExtrema = -1;
            var y0_, y1_;
            for (var i = 0; i < nRoots; i++) {
                var t = roots[i];
                // Avoid winding error when intersection point is the connect point of two line of polygon
                var unit = t === 0 || t === 1 ? 0.5 : 1;
                var x_ = curve.cubicAt(x0, x1, x2, x3, t);
                if (x_ < x) {
                    // Quick reject
                    continue;
                }
                if (nExtrema < 0) {
                    nExtrema = curve.cubicExtrema(y0, y1, y2, y3, extrema);
                    if (extrema[1] < extrema[0] && nExtrema > 1) {
                        swapExtrema();
                    }
                    y0_ = curve.cubicAt(y0, y1, y2, y3, extrema[0]);
                    if (nExtrema > 1) {
                        y1_ = curve.cubicAt(y0, y1, y2, y3, extrema[1]);
                    }
                }
                if (nExtrema == 2) {
                    // 分成三段单调函数
                    if (t < extrema[0]) {
                        w += y0_ < y0 ? unit : -unit;
                    } else if (t < extrema[1]) {
                        w += y1_ < y0_ ? unit : -unit;
                    } else {
                        w += y3 < y1_ ? unit : -unit;
                    }
                } else {
                    // 分成两段单调函数
                    if (t < extrema[0]) {
                        w += y0_ < y0 ? unit : -unit;
                    } else {
                        w += y3 < y0_ ? unit : -unit;
                    }
                }
            }
            return w;
        }
    }
    function windingQuadratic(x0, y0, x1, y1, x2, y2, x, y) {
        // Quick reject
        if (y > y0 && y > y1 && y > y2 || y < y0 && y < y1 && y < y2) {
            return 0;
        }
        var nRoots = curve.quadraticRootAt(y0, y1, y2, y, roots);
        if (nRoots === 0) {
            return 0;
        } else {
            var t = curve.quadraticExtremum(y0, y1, y2);
            if (t >= 0 && t <= 1) {
                var w = 0;
                var y_ = curve.quadraticAt(y0, y1, y2, t);
                for (var i = 0; i < nRoots; i++) {
                    // Remove one endpoint.
                    var unit = roots[i] === 0 || roots[i] === 1 ? 0.5 : 1;
                    var x_ = curve.quadraticAt(x0, x1, x2, roots[i]);
                    if (x_ < x) {
                        // Quick reject
                        continue;
                    }
                    if (roots[i] < t) {
                        w += y_ < y0 ? unit : -unit;
                    } else {
                        w += y2 < y_ ? unit : -unit;
                    }
                }
                return w;
            } else {
                // Remove one endpoint.
                var unit = roots[0] === 0 || roots[0] === 1 ? 0.5 : 1;
                var x_ = curve.quadraticAt(x0, x1, x2, roots[0]);
                if (x_ < x) {
                    // Quick reject
                    return 0;
                }
                return y2 < y0 ? unit : -unit;
            }
        }
    }
    // TODO
    // Arc 旋转
    function windingArc(cx, cy, r, startAngle, endAngle, anticlockwise, x, y) {
        y -= cy;
        if (y > r || y < -r) {
            return 0;
        }
        var tmp = Math.sqrt(r * r - y * y);
        roots[0] = -tmp;
        roots[1] = tmp;
        var diff = Math.abs(startAngle - endAngle);
        if (diff < 0.0001) {
            return 0;
        }
        if (diff % PI2 < 0.0001) {
            // Is a circle
            startAngle = 0;
            endAngle = PI2;
            var dir = anticlockwise ? 1 : -1;
            if (x >= roots[0] + cx && x <= roots[1] + cx) {
                return dir;
            } else {
                return 0;
            }
        }
        if (anticlockwise) {
            var tmp = startAngle;
            startAngle = normalizeRadian(endAngle);
            endAngle = normalizeRadian(tmp);
        } else {
            startAngle = normalizeRadian(startAngle);
            endAngle = normalizeRadian(endAngle);
        }
        if (startAngle > endAngle) {
            endAngle += PI2;
        }
        var w = 0;
        for (var i = 0; i < 2; i++) {
            var x_ = roots[i];
            if (x_ + cx > x) {
                var angle = Math.atan2(y, x_);
                var dir = anticlockwise ? 1 : -1;
                if (angle < 0) {
                    angle = PI2 + angle;
                }
                if (angle >= startAngle && angle <= endAngle || angle + PI2 >= startAngle && angle + PI2 <= endAngle) {
                    if (angle > Math.PI / 2 && angle < Math.PI * 1.5) {
                        dir = -dir;
                    }
                    w += dir;
                }
            }
        }
        return w;
    }
    function containPath(data, lineWidth, isStroke, x, y) {
        var w = 0;
        var xi = 0;
        var yi = 0;
        var x0 = 0;
        var y0 = 0;
        for (var i = 0; i < data.length;) {
            var cmd = data[i++];
            // Begin a new subpath
            if (cmd === CMD.M && i > 1) {
                // Close previous subpath
                if (!isStroke) {
                    w += windingLine(xi, yi, x0, y0, x, y);
                }    // 如果被任何一个 subpath 包含
                     // if (w !== 0) {
                     //     return true;
                     // }
            }
            if (i == 1) {
                // 如果第一个命令是 L, C, Q
                // 则 previous point 同绘制命令的第一个 point
                //
                // 第一个命令为 Arc 的情况下会在后面特殊处理
                xi = data[i];
                yi = data[i + 1];
                x0 = xi;
                y0 = yi;
            }
            switch (cmd) {
            case CMD.M:
                // moveTo 命令重新创建一个新的 subpath, 并且更新新的起点
                // 在 closePath 的时候使用
                x0 = data[i++];
                y0 = data[i++];
                xi = x0;
                yi = y0;
                break;
            case CMD.L:
                if (isStroke) {
                    if (containStroke(xi, yi, data[i], data[i + 1], lineWidth, x, y)) {
                        return true;
                    }
                } else {
                    // NOTE 在第一个命令为 L, C, Q 的时候会计算出 NaN
                    w += windingLine(xi, yi, data[i], data[i + 1], x, y) || 0;
                }
                xi = data[i++];
                yi = data[i++];
                break;
            case CMD.C:
                if (isStroke) {
                    if (cubic.containStroke(xi, yi, data[i++], data[i++], data[i++], data[i++], data[i], data[i + 1], lineWidth, x, y)) {
                        return true;
                    }
                } else {
                    w += windingCubic(xi, yi, data[i++], data[i++], data[i++], data[i++], data[i], data[i + 1], x, y) || 0;
                }
                xi = data[i++];
                yi = data[i++];
                break;
            case CMD.Q:
                if (isStroke) {
                    if (quadratic.containStroke(xi, yi, data[i++], data[i++], data[i], data[i + 1], lineWidth, x, y)) {
                        return true;
                    }
                } else {
                    w += windingQuadratic(xi, yi, data[i++], data[i++], data[i], data[i + 1], x, y) || 0;
                }
                xi = data[i++];
                yi = data[i++];
                break;
            case CMD.A:
                // TODO Arc 判断的开销比较大
                var cx = data[i++];
                var cy = data[i++];
                var rx = data[i++];
                var ry = data[i++];
                var theta = data[i++];
                var dTheta = data[i++];
                // TODO Arc 旋转
                var psi = data[i++];
                var anticlockwise = 1 - data[i++];
                var x1 = Math.cos(theta) * rx + cx;
                var y1 = Math.sin(theta) * ry + cy;
                // 不是直接使用 arc 命令
                if (i > 1) {
                    w += windingLine(xi, yi, x1, y1, x, y);
                } else {
                    // 第一个命令起点还未定义
                    x0 = x1;
                    y0 = y1;
                }
                // zr 使用scale来模拟椭圆, 这里也对x做一定的缩放
                var _x = (x - cx) * ry / rx + cx;
                if (isStroke) {
                    if (arc.containStroke(cx, cy, ry, theta, theta + dTheta, anticlockwise, lineWidth, _x, y)) {
                        return true;
                    }
                } else {
                    w += windingArc(cx, cy, ry, theta, theta + dTheta, anticlockwise, _x, y);
                }
                xi = Math.cos(theta + dTheta) * rx + cx;
                yi = Math.sin(theta + dTheta) * ry + cy;
                break;
            case CMD.R:
                x0 = xi = data[i++];
                y0 = yi = data[i++];
                var width = data[i++];
                var height = data[i++];
                var x1 = x0 + width;
                var y1 = y0 + height;
                if (isStroke) {
                    if (containStroke(x0, y0, x1, y0, lineWidth, x, y) || containStroke(x1, y0, x1, y1, lineWidth, x, y) || containStroke(x1, y1, x0, y1, lineWidth, x, y) || containStroke(x0, y1, x0, y0, lineWidth, x, y)) {
                        return true;
                    }
                } else {
                    // FIXME Clockwise ?
                    w += windingLine(x1, y0, x1, y1, x, y);
                    w += windingLine(x0, y1, x0, y0, x, y);
                }
                break;
            case CMD.Z:
                if (isStroke) {
                    if (containStroke(xi, yi, x0, y0, lineWidth, x, y)) {
                        return true;
                    }
                } else {
                    // Close a subpath
                    w += windingLine(xi, yi, x0, y0, x, y);    // 如果被任何一个 subpath 包含
                                                               // FIXME subpaths may overlap
                                                               // if (w !== 0) {
                                                               //     return true;
                                                               // }
                }
                xi = x0;
                yi = y0;
                break;
            }
        }
        if (!isStroke && !isAroundEqual(yi, y0)) {
            w += windingLine(xi, yi, x0, y0, x, y) || 0;
        }
        return w !== 0;
    }
    return {
        contain: function (pathData, x, y) {
            return containPath(pathData, 0, false, x, y);
        },
        containStroke: function (pathData, lineWidth, x, y) {
            return containPath(pathData, lineWidth, true, x, y);
        }
    };
});
define('zrender/graphic/Pattern', ['require'], function (require) {
    var Pattern = function (image, repeat) {
        this.image = image;
        this.repeat = repeat;
        // Can be cloned
        this.type = 'pattern';
    };
    Pattern.prototype.getCanvasPattern = function (ctx) {
        return this._canvasPattern || (this._canvasPattern = ctx.createPattern(this.image, this.repeat));
    };
    return Pattern;
});
define('echarts/scale/Ordinal', ['require', 'zrender/core/util', './Scale'], function (require) {
    var zrUtil = require('zrender/core/util');
    var Scale = require('./Scale');
    var scaleProto = Scale.prototype;
    var OrdinalScale = Scale.extend({
            type: 'ordinal',
            init: function (data, extent) {
                this._data = data;
                this._extent = extent || [
                    0,
                    data.length - 1
                ];
            },
            parse: function (val) {
                return typeof val === 'string' ? zrUtil.indexOf(this._data, val) : Math.round(val);
            },
            contain: function (rank) {
                rank = this.parse(rank);
                return scaleProto.contain.call(this, rank) && this._data[rank] != null;
            },
            normalize: function (val) {
                return scaleProto.normalize.call(this, this.parse(val));
            },
            scale: function (val) {
                return Math.round(scaleProto.scale.call(this, val));
            },
            getTicks: function () {
                var ticks = [];
                var extent = this._extent;
                var rank = extent[0];
                while (rank <= extent[1]) {
                    ticks.push(rank);
                    rank++;
                }
                return ticks;
            },
            getLabel: function (n) {
                return this._data[n];
            },
            count: function () {
                return this._extent[1] - this._extent[0] + 1;
            },
            unionExtentFromData: function (data, dim) {
                this.unionExtent(data.getDataExtent(dim, false));
            },
            niceTicks: zrUtil.noop,
            niceExtent: zrUtil.noop
        });
    /**
     * @return {module:echarts/scale/Time}
     */
    OrdinalScale.create = function () {
        return new OrdinalScale();
    };
    return OrdinalScale;
});
define('echarts/model/mixin/makeStyleMapper', ['require', 'zrender/core/util'], function (require) {
    var zrUtil = require('zrender/core/util');
    return function (properties) {
        // Normalize
        for (var i = 0; i < properties.length; i++) {
            if (!properties[i][1]) {
                properties[i][1] = properties[i][0];
            }
        }
        return function (excludes) {
            var style = {};
            for (var i = 0; i < properties.length; i++) {
                var propName = properties[i][1];
                if (excludes && zrUtil.indexOf(excludes, propName) >= 0) {
                    continue;
                }
                var val = this.getShallow(propName);
                if (val != null) {
                    style[properties[i][0]] = val;
                }
            }
            return style;
        };
    };
});
define('zrender/graphic/Style', ['require'], function (require) {
    var STYLE_COMMON_PROPS = [
            [
                'shadowBlur',
                0
            ],
            [
                'shadowOffsetX',
                0
            ],
            [
                'shadowOffsetY',
                0
            ],
            [
                'shadowColor',
                '#000'
            ],
            [
                'lineCap',
                'butt'
            ],
            [
                'lineJoin',
                'miter'
            ],
            [
                'miterLimit',
                10
            ]
        ];
    // var SHADOW_PROPS = STYLE_COMMON_PROPS.slice(0, 4);
    // var LINE_PROPS = STYLE_COMMON_PROPS.slice(4);
    var Style = function (opts) {
        this.extendFrom(opts);
    };
    function createLinearGradient(ctx, obj, rect) {
        // var size =
        var x = obj.x;
        var x2 = obj.x2;
        var y = obj.y;
        var y2 = obj.y2;
        if (!obj.global) {
            x = x * rect.width + rect.x;
            x2 = x2 * rect.width + rect.x;
            y = y * rect.height + rect.y;
            y2 = y2 * rect.height + rect.y;
        }
        var canvasGradient = ctx.createLinearGradient(x, y, x2, y2);
        return canvasGradient;
    }
    function createRadialGradient(ctx, obj, rect) {
        var width = rect.width;
        var height = rect.height;
        var min = Math.min(width, height);
        var x = obj.x;
        var y = obj.y;
        var r = obj.r;
        if (!obj.global) {
            x = x * width + rect.x;
            y = y * height + rect.y;
            r = r * min;
        }
        var canvasGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        return canvasGradient;
    }
    Style.prototype = {
        constructor: Style,
        fill: '#000000',
        stroke: null,
        opacity: 1,
        lineDash: null,
        lineDashOffset: 0,
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        lineWidth: 1,
        strokeNoScale: false,
        text: null,
        textFill: '#000',
        textStroke: null,
        textPosition: 'inside',
        textOffset: null,
        textBaseline: null,
        textAlign: null,
        textVerticalAlign: null,
        textDistance: 5,
        textShadowBlur: 0,
        textShadowOffsetX: 0,
        textShadowOffsetY: 0,
        textTransform: false,
        textRotation: 0,
        blend: null,
        bind: function (ctx, el, prevEl) {
            var style = this;
            var prevStyle = prevEl && prevEl.style;
            var firstDraw = !prevStyle;
            for (var i = 0; i < STYLE_COMMON_PROPS.length; i++) {
                var prop = STYLE_COMMON_PROPS[i];
                var styleName = prop[0];
                if (firstDraw || style[styleName] !== prevStyle[styleName]) {
                    // FIXME Invalid property value will cause style leak from previous element.
                    ctx[styleName] = style[styleName] || prop[1];
                }
            }
            if (firstDraw || style.fill !== prevStyle.fill) {
                ctx.fillStyle = style.fill;
            }
            if (firstDraw || style.stroke !== prevStyle.stroke) {
                ctx.strokeStyle = style.stroke;
            }
            if (firstDraw || style.opacity !== prevStyle.opacity) {
                ctx.globalAlpha = style.opacity == null ? 1 : style.opacity;
            }
            if (firstDraw || style.blend !== prevStyle.blend) {
                ctx.globalCompositeOperation = style.blend || 'source-over';
            }
            if (this.hasStroke()) {
                var lineWidth = style.lineWidth;
                ctx.lineWidth = lineWidth / (this.strokeNoScale && el && el.getLineScale ? el.getLineScale() : 1);
            }
        },
        hasFill: function () {
            var fill = this.fill;
            return fill != null && fill !== 'none';
        },
        hasStroke: function () {
            var stroke = this.stroke;
            return stroke != null && stroke !== 'none' && this.lineWidth > 0;
        },
        extendFrom: function (otherStyle, overwrite) {
            if (otherStyle) {
                var target = this;
                for (var name in otherStyle) {
                    if (otherStyle.hasOwnProperty(name) && (overwrite || !target.hasOwnProperty(name))) {
                        target[name] = otherStyle[name];
                    }
                }
            }
        },
        set: function (obj, value) {
            if (typeof obj === 'string') {
                this[obj] = value;
            } else {
                this.extendFrom(obj, true);
            }
        },
        clone: function () {
            var newStyle = new this.constructor();
            newStyle.extendFrom(this, true);
            return newStyle;
        },
        getGradient: function (ctx, obj, rect) {
            var method = obj.type === 'radial' ? createRadialGradient : createLinearGradient;
            var canvasGradient = method(ctx, obj, rect);
            var colorStops = obj.colorStops;
            for (var i = 0; i < colorStops.length; i++) {
                canvasGradient.addColorStop(colorStops[i].offset, colorStops[i].color);
            }
            return canvasGradient;
        }
    };
    var styleProto = Style.prototype;
    for (var i = 0; i < STYLE_COMMON_PROPS.length; i++) {
        var prop = STYLE_COMMON_PROPS[i];
        if (!(prop[0] in styleProto)) {
            styleProto[prop[0]] = prop[1];
        }
    }
    // Provide for others
    Style.getGradient = styleProto.getGradient;
    return Style;
});
define('zrender/Element', ['require', './core/guid', './mixin/Eventful', './mixin/Transformable', './mixin/Animatable', './core/util'], function (require) {
    'use strict';
    var guid = require('./core/guid');
    var Eventful = require('./mixin/Eventful');
    var Transformable = require('./mixin/Transformable');
    var Animatable = require('./mixin/Animatable');
    var zrUtil = require('./core/util');
    /**
     * @alias module:zrender/Element
     * @constructor
     * @extends {module:zrender/mixin/Animatable}
     * @extends {module:zrender/mixin/Transformable}
     * @extends {module:zrender/mixin/Eventful}
     */
    var Element = function (opts) {
        Transformable.call(this, opts);
        Eventful.call(this, opts);
        Animatable.call(this, opts);
        /**
         * 画布元素ID
         * @type {string}
         */
        this.id = opts.id || guid();
    };
    Element.prototype = {
        type: 'element',
        name: '',
        __zr: null,
        ignore: false,
        clipPath: null,
        drift: function (dx, dy) {
            switch (this.draggable) {
            case 'horizontal':
                dy = 0;
                break;
            case 'vertical':
                dx = 0;
                break;
            }
            var m = this.transform;
            if (!m) {
                m = this.transform = [
                    1,
                    0,
                    0,
                    1,
                    0,
                    0
                ];
            }
            m[4] += dx;
            m[5] += dy;
            this.decomposeTransform();
            this.dirty(false);
        },
        beforeUpdate: function () {
        },
        afterUpdate: function () {
        },
        update: function () {
            this.updateTransform();
        },
        traverse: function (cb, context) {
        },
        attrKV: function (key, value) {
            if (key === 'position' || key === 'scale' || key === 'origin') {
                // Copy the array
                if (value) {
                    var target = this[key];
                    if (!target) {
                        target = this[key] = [];
                    }
                    target[0] = value[0];
                    target[1] = value[1];
                }
            } else {
                this[key] = value;
            }
        },
        hide: function () {
            this.ignore = true;
            this.__zr && this.__zr.refresh();
        },
        show: function () {
            this.ignore = false;
            this.__zr && this.__zr.refresh();
        },
        attr: function (key, value) {
            if (typeof key === 'string') {
                this.attrKV(key, value);
            } else if (zrUtil.isObject(key)) {
                for (var name in key) {
                    if (key.hasOwnProperty(name)) {
                        this.attrKV(name, key[name]);
                    }
                }
            }
            this.dirty(false);
            return this;
        },
        setClipPath: function (clipPath) {
            var zr = this.__zr;
            if (zr) {
                clipPath.addSelfToZr(zr);
            }
            // Remove previous clip path
            if (this.clipPath && this.clipPath !== clipPath) {
                this.removeClipPath();
            }
            this.clipPath = clipPath;
            clipPath.__zr = zr;
            clipPath.__clipTarget = this;
            this.dirty(false);
        },
        removeClipPath: function () {
            var clipPath = this.clipPath;
            if (clipPath) {
                if (clipPath.__zr) {
                    clipPath.removeSelfFromZr(clipPath.__zr);
                }
                clipPath.__zr = null;
                clipPath.__clipTarget = null;
                this.clipPath = null;
                this.dirty(false);
            }
        },
        addSelfToZr: function (zr) {
            this.__zr = zr;
            // 添加动画
            var animators = this.animators;
            if (animators) {
                for (var i = 0; i < animators.length; i++) {
                    zr.animation.addAnimator(animators[i]);
                }
            }
            if (this.clipPath) {
                this.clipPath.addSelfToZr(zr);
            }
        },
        removeSelfFromZr: function (zr) {
            this.__zr = null;
            // 移除动画
            var animators = this.animators;
            if (animators) {
                for (var i = 0; i < animators.length; i++) {
                    zr.animation.removeAnimator(animators[i]);
                }
            }
            if (this.clipPath) {
                this.clipPath.removeSelfFromZr(zr);
            }
        }
    };
    zrUtil.mixin(Element, Animatable);
    zrUtil.mixin(Element, Transformable);
    zrUtil.mixin(Element, Eventful);
    return Element;
});
define('zrender/graphic/mixin/RectText', ['require', '../../contain/text', '../../core/BoundingRect'], function (require) {
    var textContain = require('../../contain/text');
    var BoundingRect = require('../../core/BoundingRect');
    var tmpRect = new BoundingRect();
    var RectText = function () {
    };
    function parsePercent(value, maxValue) {
        if (typeof value === 'string') {
            if (value.lastIndexOf('%') >= 0) {
                return parseFloat(value) / 100 * maxValue;
            }
            return parseFloat(value);
        }
        return value;
    }
    RectText.prototype = {
        constructor: RectText,
        drawRectText: function (ctx, rect, textRect) {
            var style = this.style;
            var text = style.text;
            // Convert to string
            text != null && (text += '');
            if (!text) {
                return;
            }
            // FIXME
            ctx.save();
            var x;
            var y;
            var textPosition = style.textPosition;
            var textOffset = style.textOffset;
            var distance = style.textDistance;
            var align = style.textAlign;
            var font = style.textFont || style.font;
            var baseline = style.textBaseline;
            var verticalAlign = style.textVerticalAlign;
            textRect = textRect || textContain.getBoundingRect(text, font, align, baseline);
            // Transform rect to view space
            var transform = this.transform;
            if (!style.textTransform) {
                if (transform) {
                    tmpRect.copy(rect);
                    tmpRect.applyTransform(transform);
                    rect = tmpRect;
                }
            } else {
                this.setTransform(ctx);
            }
            // Text position represented by coord
            if (textPosition instanceof Array) {
                // Percent
                x = rect.x + parsePercent(textPosition[0], rect.width);
                y = rect.y + parsePercent(textPosition[1], rect.height);
                align = align || 'left';
                baseline = baseline || 'top';
                if (verticalAlign) {
                    switch (verticalAlign) {
                    case 'middle':
                        y -= textRect.height / 2 - textRect.lineHeight / 2;
                        break;
                    case 'bottom':
                        y -= textRect.height - textRect.lineHeight / 2;
                        break;
                    default:
                        y += textRect.lineHeight / 2;
                    }
                    // Force bseline to be middle
                    baseline = 'middle';
                }
            } else {
                var res = textContain.adjustTextPositionOnRect(textPosition, rect, textRect, distance);
                x = res.x;
                y = res.y;
                // Default align and baseline when has textPosition
                align = align || res.textAlign;
                baseline = baseline || res.textBaseline;
            }
            if (textOffset) {
                x += textOffset[0];
                y += textOffset[1];
            }
            // Use canvas default left textAlign. Giving invalid value will cause state not change
            ctx.textAlign = align || 'left';
            // Use canvas default alphabetic baseline
            ctx.textBaseline = baseline || 'alphabetic';
            var textFill = style.textFill;
            var textStroke = style.textStroke;
            textFill && (ctx.fillStyle = textFill);
            textStroke && (ctx.strokeStyle = textStroke);
            // TODO Invalid font
            ctx.font = font || '12px sans-serif';
            // Text shadow
            // Always set shadowBlur and shadowOffset to avoid leak from displayable
            ctx.shadowBlur = style.textShadowBlur;
            ctx.shadowColor = style.textShadowColor || 'transparent';
            ctx.shadowOffsetX = style.textShadowOffsetX;
            ctx.shadowOffsetY = style.textShadowOffsetY;
            var textLines = text.split('\n');
            if (style.textRotation) {
                transform && ctx.translate(transform[4], transform[5]);
                ctx.rotate(style.textRotation);
                transform && ctx.translate(-transform[4], -transform[5]);
            }
            for (var i = 0; i < textLines.length; i++) {
                textFill && ctx.fillText(textLines[i], x, y);
                textStroke && ctx.strokeText(textLines[i], x, y);
                y += textRect.lineHeight;
            }
            ctx.restore();
        }
    };
    return RectText;
});
define('echarts/coord/cartesian/Cartesian', ['require', 'zrender/core/util'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    function dimAxisMapper(dim) {
        return this._axes[dim];
    }
    /**
     * @alias module:echarts/coord/Cartesian
     * @constructor
     */
    var Cartesian = function (name) {
        this._axes = {};
        this._dimList = [];
        /**
         * @type {string}
         */
        this.name = name || '';
    };
    Cartesian.prototype = {
        constructor: Cartesian,
        type: 'cartesian',
        getAxis: function (dim) {
            return this._axes[dim];
        },
        getAxes: function () {
            return zrUtil.map(this._dimList, dimAxisMapper, this);
        },
        getAxesByScale: function (scaleType) {
            scaleType = scaleType.toLowerCase();
            return zrUtil.filter(this.getAxes(), function (axis) {
                return axis.scale.type === scaleType;
            });
        },
        addAxis: function (axis) {
            var dim = axis.dim;
            this._axes[dim] = axis;
            this._dimList.push(dim);
        },
        dataToCoord: function (val) {
            return this._dataCoordConvert(val, 'dataToCoord');
        },
        coordToData: function (val) {
            return this._dataCoordConvert(val, 'coordToData');
        },
        _dataCoordConvert: function (input, method) {
            var dimList = this._dimList;
            var output = input instanceof Array ? [] : {};
            for (var i = 0; i < dimList.length; i++) {
                var dim = dimList[i];
                var axis = this._axes[dim];
                output[dim] = axis[method](input[dim]);
            }
            return output;
        }
    };
    return Cartesian;
});
define('echarts/util/component', ['require', 'zrender/core/util', './clazz'], function (require) {
    var zrUtil = require('zrender/core/util');
    var clazz = require('./clazz');
    var parseClassType = clazz.parseClassType;
    var base = 0;
    var componentUtil = {};
    var DELIMITER = '_';
    /**
     * @public
     * @param {string} type
     * @return {string}
     */
    componentUtil.getUID = function (type) {
        // Considering the case of crossing js context,
        // use Math.random to make id as unique as possible.
        return [
            type || '',
            base++,
            Math.random()
        ].join(DELIMITER);
    };
    /**
     * @inner
     */
    componentUtil.enableSubTypeDefaulter = function (entity) {
        var subTypeDefaulters = {};
        entity.registerSubTypeDefaulter = function (componentType, defaulter) {
            componentType = parseClassType(componentType);
            subTypeDefaulters[componentType.main] = defaulter;
        };
        entity.determineSubType = function (componentType, option) {
            var type = option.type;
            if (!type) {
                var componentTypeMain = parseClassType(componentType).main;
                if (entity.hasSubTypes(componentType) && subTypeDefaulters[componentTypeMain]) {
                    type = subTypeDefaulters[componentTypeMain](option);
                }
            }
            return type;
        };
        return entity;
    };
    /**
     * Topological travel on Activity Network (Activity On Vertices).
     * Dependencies is defined in Model.prototype.dependencies, like ['xAxis', 'yAxis'].
     *
     * If 'xAxis' or 'yAxis' is absent in componentTypeList, just ignore it in topology.
     *
     * If there is circle dependencey, Error will be thrown.
     *
     */
    componentUtil.enableTopologicalTravel = function (entity, dependencyGetter) {
        /**
         * @public
         * @param {Array.<string>} targetNameList Target Component type list.
         *                                           Can be ['aa', 'bb', 'aa.xx']
         * @param {Array.<string>} fullNameList By which we can build dependency graph.
         * @param {Function} callback Params: componentType, dependencies.
         * @param {Object} context Scope of callback.
         */
        entity.topologicalTravel = function (targetNameList, fullNameList, callback, context) {
            if (!targetNameList.length) {
                return;
            }
            var result = makeDepndencyGraph(fullNameList);
            var graph = result.graph;
            var stack = result.noEntryList;
            var targetNameSet = {};
            zrUtil.each(targetNameList, function (name) {
                targetNameSet[name] = true;
            });
            while (stack.length) {
                var currComponentType = stack.pop();
                var currVertex = graph[currComponentType];
                var isInTargetNameSet = !!targetNameSet[currComponentType];
                if (isInTargetNameSet) {
                    callback.call(context, currComponentType, currVertex.originalDeps.slice());
                    delete targetNameSet[currComponentType];
                }
                zrUtil.each(currVertex.successor, isInTargetNameSet ? removeEdgeAndAdd : removeEdge);
            }
            zrUtil.each(targetNameSet, function () {
                throw new Error('Circle dependency may exists');
            });
            function removeEdge(succComponentType) {
                graph[succComponentType].entryCount--;
                if (graph[succComponentType].entryCount === 0) {
                    stack.push(succComponentType);
                }
            }
            // Consider this case: legend depends on series, and we call
            // chart.setOption({series: [...]}), where only series is in option.
            // If we do not have 'removeEdgeAndAdd', legendModel.mergeOption will
            // not be called, but only sereis.mergeOption is called. Thus legend
            // have no chance to update its local record about series (like which
            // name of series is available in legend).
            function removeEdgeAndAdd(succComponentType) {
                targetNameSet[succComponentType] = true;
                removeEdge(succComponentType);
            }
        };
        /**
         * DepndencyGraph: {Object}
         * key: conponentType,
         * value: {
         *     successor: [conponentTypes...],
         *     originalDeps: [conponentTypes...],
         *     entryCount: {number}
         * }
         */
        function makeDepndencyGraph(fullNameList) {
            var graph = {};
            var noEntryList = [];
            zrUtil.each(fullNameList, function (name) {
                var thisItem = createDependencyGraphItem(graph, name);
                var originalDeps = thisItem.originalDeps = dependencyGetter(name);
                var availableDeps = getAvailableDependencies(originalDeps, fullNameList);
                thisItem.entryCount = availableDeps.length;
                if (thisItem.entryCount === 0) {
                    noEntryList.push(name);
                }
                zrUtil.each(availableDeps, function (dependentName) {
                    if (zrUtil.indexOf(thisItem.predecessor, dependentName) < 0) {
                        thisItem.predecessor.push(dependentName);
                    }
                    var thatItem = createDependencyGraphItem(graph, dependentName);
                    if (zrUtil.indexOf(thatItem.successor, dependentName) < 0) {
                        thatItem.successor.push(name);
                    }
                });
            });
            return {
                graph: graph,
                noEntryList: noEntryList
            };
        }
        function createDependencyGraphItem(graph, name) {
            if (!graph[name]) {
                graph[name] = {
                    predecessor: [],
                    successor: []
                };
            }
            return graph[name];
        }
        function getAvailableDependencies(originalDeps, fullNameList) {
            var availableDeps = [];
            zrUtil.each(originalDeps, function (dep) {
                zrUtil.indexOf(fullNameList, dep) >= 0 && availableDeps.push(dep);
            });
            return availableDeps;
        }
    };
    return componentUtil;
});
define('echarts/model/mixin/boxLayout', ['require'], function (require) {
    return {
        getBoxLayoutParams: function () {
            return {
                left: this.get('left'),
                top: this.get('top'),
                right: this.get('right'),
                bottom: this.get('bottom'),
                width: this.get('width'),
                height: this.get('height')
            };
        }
    };
});
define('zrender/core/guid', [], function () {
    var idStart = 2311;
    return function () {
        return idStart++;
    };
});
define('zrender/mixin/Transformable', ['require', '../core/matrix', '../core/vector'], function (require) {
    'use strict';
    var matrix = require('../core/matrix');
    var vector = require('../core/vector');
    var mIdentity = matrix.identity;
    var EPSILON = 0.00005;
    function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
    }
    /**
     * @alias module:zrender/mixin/Transformable
     * @constructor
     */
    var Transformable = function (opts) {
        opts = opts || {};
        // If there are no given position, rotation, scale
        if (!opts.position) {
            /**
             * 平移
             * @type {Array.<number>}
             * @default [0, 0]
             */
            this.position = [
                0,
                0
            ];
        }
        if (opts.rotation == null) {
            /**
             * 旋转
             * @type {Array.<number>}
             * @default 0
             */
            this.rotation = 0;
        }
        if (!opts.scale) {
            /**
             * 缩放
             * @type {Array.<number>}
             * @default [1, 1]
             */
            this.scale = [
                1,
                1
            ];
        }
        /**
         * 旋转和缩放的原点
         * @type {Array.<number>}
         * @default null
         */
        this.origin = this.origin || null;
    };
    var transformableProto = Transformable.prototype;
    transformableProto.transform = null;
    /**
     * 判断是否需要有坐标变换
     * 如果有坐标变换, 则从position, rotation, scale以及父节点的transform计算出自身的transform矩阵
     */
    transformableProto.needLocalTransform = function () {
        return isNotAroundZero(this.rotation) || isNotAroundZero(this.position[0]) || isNotAroundZero(this.position[1]) || isNotAroundZero(this.scale[0] - 1) || isNotAroundZero(this.scale[1] - 1);
    };
    transformableProto.updateTransform = function () {
        var parent = this.parent;
        var parentHasTransform = parent && parent.transform;
        var needLocalTransform = this.needLocalTransform();
        var m = this.transform;
        if (!(needLocalTransform || parentHasTransform)) {
            m && mIdentity(m);
            return;
        }
        m = m || matrix.create();
        if (needLocalTransform) {
            this.getLocalTransform(m);
        } else {
            mIdentity(m);
        }
        // 应用父节点变换
        if (parentHasTransform) {
            if (needLocalTransform) {
                matrix.mul(m, parent.transform, m);
            } else {
                matrix.copy(m, parent.transform);
            }
        }
        // 保存这个变换矩阵
        this.transform = m;
        this.invTransform = this.invTransform || matrix.create();
        matrix.invert(this.invTransform, m);
    };
    transformableProto.getLocalTransform = function (m) {
        m = m || [];
        mIdentity(m);
        var origin = this.origin;
        var scale = this.scale;
        var rotation = this.rotation;
        var position = this.position;
        if (origin) {
            // Translate to origin
            m[4] -= origin[0];
            m[5] -= origin[1];
        }
        matrix.scale(m, m, scale);
        if (rotation) {
            matrix.rotate(m, m, rotation);
        }
        if (origin) {
            // Translate back from origin
            m[4] += origin[0];
            m[5] += origin[1];
        }
        m[4] += position[0];
        m[5] += position[1];
        return m;
    };
    /**
     * 将自己的transform应用到context上
     * @param {Context2D} ctx
     */
    transformableProto.setTransform = function (ctx) {
        var m = this.transform;
        var dpr = ctx.dpr || 1;
        if (m) {
            ctx.setTransform(dpr * m[0], dpr * m[1], dpr * m[2], dpr * m[3], dpr * m[4], dpr * m[5]);
        } else {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    };
    transformableProto.restoreTransform = function (ctx) {
        var m = this.transform;
        var dpr = ctx.dpr || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    var tmpTransform = [];
    /**
     * 分解`transform`矩阵到`position`, `rotation`, `scale`
     */
    transformableProto.decomposeTransform = function () {
        if (!this.transform) {
            return;
        }
        var parent = this.parent;
        var m = this.transform;
        if (parent && parent.transform) {
            // Get local transform and decompose them to position, scale, rotation
            matrix.mul(tmpTransform, parent.invTransform, m);
            m = tmpTransform;
        }
        var sx = m[0] * m[0] + m[1] * m[1];
        var sy = m[2] * m[2] + m[3] * m[3];
        var position = this.position;
        var scale = this.scale;
        if (isNotAroundZero(sx - 1)) {
            sx = Math.sqrt(sx);
        }
        if (isNotAroundZero(sy - 1)) {
            sy = Math.sqrt(sy);
        }
        if (m[0] < 0) {
            sx = -sx;
        }
        if (m[3] < 0) {
            sy = -sy;
        }
        position[0] = m[4];
        position[1] = m[5];
        scale[0] = sx;
        scale[1] = sy;
        this.rotation = Math.atan2(-m[1] / sy, m[0] / sx);
    };
    /**
     * Get global scale
     * @return {Array.<number>}
     */
    transformableProto.getGlobalScale = function () {
        var m = this.transform;
        if (!m) {
            return [
                1,
                1
            ];
        }
        var sx = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
        var sy = Math.sqrt(m[2] * m[2] + m[3] * m[3]);
        if (m[0] < 0) {
            sx = -sx;
        }
        if (m[3] < 0) {
            sy = -sy;
        }
        return [
            sx,
            sy
        ];
    };
    /**
     * 变换坐标位置到 shape 的局部坐标空间
     * @method
     * @param {number} x
     * @param {number} y
     * @return {Array.<number>}
     */
    transformableProto.transformCoordToLocal = function (x, y) {
        var v2 = [
                x,
                y
            ];
        var invTransform = this.invTransform;
        if (invTransform) {
            vector.applyTransform(v2, v2, invTransform);
        }
        return v2;
    };
    /**
     * 变换局部坐标位置到全局坐标空间
     * @method
     * @param {number} x
     * @param {number} y
     * @return {Array.<number>}
     */
    transformableProto.transformCoordToGlobal = function (x, y) {
        var v2 = [
                x,
                y
            ];
        var transform = this.transform;
        if (transform) {
            vector.applyTransform(v2, v2, transform);
        }
        return v2;
    };
    return Transformable;
});
define('zrender/mixin/Animatable', ['require', '../animation/Animator', '../core/util', '../core/log'], function (require) {
    'use strict';
    var Animator = require('../animation/Animator');
    var util = require('../core/util');
    var isString = util.isString;
    var isFunction = util.isFunction;
    var isObject = util.isObject;
    var log = require('../core/log');
    /**
     * @alias modue:zrender/mixin/Animatable
     * @constructor
     */
    var Animatable = function () {
        /**
         * @type {Array.<module:zrender/animation/Animator>}
         * @readOnly
         */
        this.animators = [];
    };
    Animatable.prototype = {
        constructor: Animatable,
        animate: function (path, loop) {
            var target;
            var animatingShape = false;
            var el = this;
            var zr = this.__zr;
            if (path) {
                var pathSplitted = path.split('.');
                var prop = el;
                // If animating shape
                animatingShape = pathSplitted[0] === 'shape';
                for (var i = 0, l = pathSplitted.length; i < l; i++) {
                    if (!prop) {
                        continue;
                    }
                    prop = prop[pathSplitted[i]];
                }
                if (prop) {
                    target = prop;
                }
            } else {
                target = el;
            }
            if (!target) {
                log('Property "' + path + '" is not existed in element ' + el.id);
                return;
            }
            var animators = el.animators;
            var animator = new Animator(target, loop);
            animator.during(function (target) {
                el.dirty(animatingShape);
            }).done(function () {
                // FIXME Animator will not be removed if use `Animator#stop` to stop animation
                animators.splice(util.indexOf(animators, animator), 1);
            });
            animators.push(animator);
            // If animate after added to the zrender
            if (zr) {
                zr.animation.addAnimator(animator);
            }
            return animator;
        },
        stopAnimation: function (forwardToLast) {
            var animators = this.animators;
            var len = animators.length;
            for (var i = 0; i < len; i++) {
                animators[i].stop(forwardToLast);
            }
            animators.length = 0;
            return this;
        },
        animateTo: function (target, time, delay, easing, callback) {
            // animateTo(target, time, easing, callback);
            if (isString(delay)) {
                callback = easing;
                easing = delay;
                delay = 0;
            }    // animateTo(target, time, delay, callback);
            else if (isFunction(easing)) {
                callback = easing;
                easing = 'linear';
                delay = 0;
            }    // animateTo(target, time, callback);
            else if (isFunction(delay)) {
                callback = delay;
                delay = 0;
            }    // animateTo(target, callback)
            else if (isFunction(time)) {
                callback = time;
                time = 500;
            }    // animateTo(target)
            else if (!time) {
                time = 500;
            }
            // Stop all previous animations
            this.stopAnimation();
            this._animateToShallow('', this, target, time, delay, easing, callback);
            // Animators may be removed immediately after start
            // if there is nothing to animate
            var animators = this.animators.slice();
            var count = animators.length;
            function done() {
                count--;
                if (!count) {
                    callback && callback();
                }
            }
            // No animators. This should be checked before animators[i].start(),
            // because 'done' may be executed immediately if no need to animate.
            if (!count) {
                callback && callback();
            }
            // Start after all animators created
            // Incase any animator is done immediately when all animation properties are not changed
            for (var i = 0; i < animators.length; i++) {
                animators[i].done(done).start(easing);
            }
        },
        _animateToShallow: function (path, source, target, time, delay) {
            var objShallow = {};
            var propertyCount = 0;
            for (var name in target) {
                if (!target.hasOwnProperty(name)) {
                    continue;
                }
                if (source[name] != null) {
                    if (isObject(target[name]) && !util.isArrayLike(target[name])) {
                        this._animateToShallow(path ? path + '.' + name : name, source[name], target[name], time, delay);
                    } else {
                        objShallow[name] = target[name];
                        propertyCount++;
                    }
                } else if (target[name] != null) {
                    // Attr directly if not has property
                    // FIXME, if some property not needed for element ?
                    if (!path) {
                        this.attr(name, target[name]);
                    } else {
                        // Shape or style
                        var props = {};
                        props[path] = {};
                        props[path][name] = target[name];
                        this.attr(props);
                    }
                }
            }
            if (propertyCount > 0) {
                this.animate(path, false).when(time == null ? 500 : time, objShallow).delay(delay || 0);
            }
            return this;
        }
    };
    return Animatable;
});
define('echarts/coord/Axis', ['require', '../util/number', 'zrender/core/util'], function (require) {
    var numberUtil = require('../util/number');
    var linearMap = numberUtil.linearMap;
    var zrUtil = require('zrender/core/util');
    function fixExtentWithBands(extent, nTick) {
        var size = extent[1] - extent[0];
        var len = nTick;
        var margin = size / len / 2;
        extent[0] += margin;
        extent[1] -= margin;
    }
    var normalizedExtent = [
            0,
            1
        ];
    /**
     * @name module:echarts/coord/CartesianAxis
     * @constructor
     */
    var Axis = function (dim, scale, extent) {
        /**
         * Axis dimension. Such as 'x', 'y', 'z', 'angle', 'radius'
         * @type {string}
         */
        this.dim = dim;
        /**
         * Axis scale
         * @type {module:echarts/coord/scale/*}
         */
        this.scale = scale;
        /**
         * @type {Array.<number>}
         * @private
         */
        this._extent = extent || [
            0,
            0
        ];
        /**
         * @type {boolean}
         */
        this.inverse = false;
        /**
         * Usually true when axis has a ordinal scale
         * @type {boolean}
         */
        this.onBand = false;
    };
    Axis.prototype = {
        constructor: Axis,
        contain: function (coord) {
            var extent = this._extent;
            var min = Math.min(extent[0], extent[1]);
            var max = Math.max(extent[0], extent[1]);
            return coord >= min && coord <= max;
        },
        containData: function (data) {
            return this.contain(this.dataToCoord(data));
        },
        getExtent: function () {
            var ret = this._extent.slice();
            return ret;
        },
        getPixelPrecision: function (dataExtent) {
            return numberUtil.getPixelPrecision(dataExtent || this.scale.getExtent(), this._extent);
        },
        setExtent: function (start, end) {
            var extent = this._extent;
            extent[0] = start;
            extent[1] = end;
        },
        dataToCoord: function (data, clamp) {
            var extent = this._extent;
            var scale = this.scale;
            data = scale.normalize(data);
            if (this.onBand && scale.type === 'ordinal') {
                extent = extent.slice();
                fixExtentWithBands(extent, scale.count());
            }
            return linearMap(data, normalizedExtent, extent, clamp);
        },
        coordToData: function (coord, clamp) {
            var extent = this._extent;
            var scale = this.scale;
            if (this.onBand && scale.type === 'ordinal') {
                extent = extent.slice();
                fixExtentWithBands(extent, scale.count());
            }
            var t = linearMap(coord, extent, normalizedExtent, clamp);
            return this.scale.scale(t);
        },
        getTicksCoords: function (alignWithLabel) {
            if (this.onBand && !alignWithLabel) {
                var bands = this.getBands();
                var coords = [];
                for (var i = 0; i < bands.length; i++) {
                    coords.push(bands[i][0]);
                }
                if (bands[i - 1]) {
                    coords.push(bands[i - 1][1]);
                }
                return coords;
            } else {
                return zrUtil.map(this.scale.getTicks(), this.dataToCoord, this);
            }
        },
        getLabelsCoords: function () {
            return zrUtil.map(this.scale.getTicks(), this.dataToCoord, this);
        },
        getBands: function () {
            var extent = this.getExtent();
            var bands = [];
            var len = this.scale.count();
            var start = extent[0];
            var end = extent[1];
            var span = end - start;
            for (var i = 0; i < len; i++) {
                bands.push([
                    span * i / len + start,
                    span * (i + 1) / len + start
                ]);
            }
            return bands;
        },
        getBandWidth: function () {
            var axisExtent = this._extent;
            var dataExtent = this.scale.getExtent();
            var len = dataExtent[1] - dataExtent[0] + (this.onBand ? 1 : 0);
            // Fix #2728, avoid NaN when only one data.
            len === 0 && (len = 1);
            var size = Math.abs(axisExtent[1] - axisExtent[0]);
            return Math.abs(size) / len;
        },
        isBlank: function () {
            return this._isBlank;
        },
        setBlank: function (isBlank) {
            this._isBlank = isBlank;
        }
    };
    return Axis;
});
define('echarts/coord/cartesian/axisLabelInterval', ['require', 'zrender/core/util', '../axisHelper'], function (require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var axisHelper = require('../axisHelper');
    return function (axis) {
        var axisModel = axis.model;
        var labelModel = axisModel.getModel('axisLabel');
        var labelInterval = labelModel.get('interval');
        if (!(axis.type === 'category' && labelInterval === 'auto')) {
            return labelInterval === 'auto' ? 0 : labelInterval;
        }
        return axisHelper.getAxisLabelInterval(zrUtil.map(axis.scale.getTicks(), axis.dataToCoord, axis), axisModel.getFormattedLabels(), labelModel.getModel('textStyle').getFont(), axis.isHorizontal());
    };
});
define('echarts/chart/gauge/PointerPath', ['require', 'zrender/graphic/Path'], function (require) {
    return require('zrender/graphic/Path').extend({
        type: 'echartsGaugePointer',
        shape: {
            angle: 0,
            width: 10,
            r: 10,
            x: 0,
            y: 0
        },
        buildPath: function (ctx, shape) {
            var mathCos = Math.cos;
            var mathSin = Math.sin;
            var r = shape.r;
            var width = shape.width;
            var angle = shape.angle;
            var x = shape.x - mathCos(angle) * width * (width >= r / 3 ? 1 : 2);
            var y = shape.y - mathSin(angle) * width * (width >= r / 3 ? 1 : 2);
            angle = shape.angle - Math.PI / 2;
            ctx.moveTo(x, y);
            ctx.lineTo(shape.x + mathCos(angle) * width, shape.y + mathSin(angle) * width);
            ctx.lineTo(shape.x + mathCos(shape.angle) * r, shape.y + mathSin(shape.angle) * r);
            ctx.lineTo(shape.x - mathCos(angle) * width, shape.y - mathSin(angle) * width);
            ctx.lineTo(x, y);
            return;
        }
    });
});
define('zrender/animation/Animator', ['require', './Clip', '../tool/color', '../core/util'], function (require) {
    var Clip = require('./Clip');
    var color = require('../tool/color');
    var util = require('../core/util');
    var isArrayLike = util.isArrayLike;
    var arraySlice = Array.prototype.slice;
    function defaultGetter(target, key) {
        return target[key];
    }
    function defaultSetter(target, key, value) {
        target[key] = value;
    }
    /**
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} percent
     * @return {number}
     */
    function interpolateNumber(p0, p1, percent) {
        return (p1 - p0) * percent + p0;
    }
    /**
     * @param  {string} p0
     * @param  {string} p1
     * @param  {number} percent
     * @return {string}
     */
    function interpolateString(p0, p1, percent) {
        return percent > 0.5 ? p1 : p0;
    }
    /**
     * @param  {Array} p0
     * @param  {Array} p1
     * @param  {number} percent
     * @param  {Array} out
     * @param  {number} arrDim
     */
    function interpolateArray(p0, p1, percent, out, arrDim) {
        var len = p0.length;
        if (arrDim == 1) {
            for (var i = 0; i < len; i++) {
                out[i] = interpolateNumber(p0[i], p1[i], percent);
            }
        } else {
            var len2 = p0[0].length;
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < len2; j++) {
                    out[i][j] = interpolateNumber(p0[i][j], p1[i][j], percent);
                }
            }
        }
    }
    // arr0 is source array, arr1 is target array.
    // Do some preprocess to avoid error happened when interpolating from arr0 to arr1
    function fillArr(arr0, arr1, arrDim) {
        var arr0Len = arr0.length;
        var arr1Len = arr1.length;
        if (arr0Len !== arr1Len) {
            // FIXME Not work for TypedArray
            var isPreviousLarger = arr0Len > arr1Len;
            if (isPreviousLarger) {
                // Cut the previous
                arr0.length = arr1Len;
            } else {
                // Fill the previous
                for (var i = arr0Len; i < arr1Len; i++) {
                    arr0.push(arrDim === 1 ? arr1[i] : arraySlice.call(arr1[i]));
                }
            }
        }
        // Handling NaN value
        var len2 = arr0[0] && arr0[0].length;
        for (var i = 0; i < arr0.length; i++) {
            if (arrDim === 1) {
                if (isNaN(arr0[i])) {
                    arr0[i] = arr1[i];
                }
            } else {
                for (var j = 0; j < len2; j++) {
                    if (isNaN(arr0[i][j])) {
                        arr0[i][j] = arr1[i][j];
                    }
                }
            }
        }
    }
    /**
     * @param  {Array} arr0
     * @param  {Array} arr1
     * @param  {number} arrDim
     * @return {boolean}
     */
    function isArraySame(arr0, arr1, arrDim) {
        if (arr0 === arr1) {
            return true;
        }
        var len = arr0.length;
        if (len !== arr1.length) {
            return false;
        }
        if (arrDim === 1) {
            for (var i = 0; i < len; i++) {
                if (arr0[i] !== arr1[i]) {
                    return false;
                }
            }
        } else {
            var len2 = arr0[0].length;
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < len2; j++) {
                    if (arr0[i][j] !== arr1[i][j]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    /**
     * Catmull Rom interpolate array
     * @param  {Array} p0
     * @param  {Array} p1
     * @param  {Array} p2
     * @param  {Array} p3
     * @param  {number} t
     * @param  {number} t2
     * @param  {number} t3
     * @param  {Array} out
     * @param  {number} arrDim
     */
    function catmullRomInterpolateArray(p0, p1, p2, p3, t, t2, t3, out, arrDim) {
        var len = p0.length;
        if (arrDim == 1) {
            for (var i = 0; i < len; i++) {
                out[i] = catmullRomInterpolate(p0[i], p1[i], p2[i], p3[i], t, t2, t3);
            }
        } else {
            var len2 = p0[0].length;
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < len2; j++) {
                    out[i][j] = catmullRomInterpolate(p0[i][j], p1[i][j], p2[i][j], p3[i][j], t, t2, t3);
                }
            }
        }
    }
    /**
     * Catmull Rom interpolate number
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @param  {number} t2
     * @param  {number} t3
     * @return {number}
     */
    function catmullRomInterpolate(p0, p1, p2, p3, t, t2, t3) {
        var v0 = (p2 - p0) * 0.5;
        var v1 = (p3 - p1) * 0.5;
        return (2 * (p1 - p2) + v0 + v1) * t3 + (-3 * (p1 - p2) - 2 * v0 - v1) * t2 + v0 * t + p1;
    }
    function cloneValue(value) {
        if (isArrayLike(value)) {
            var len = value.length;
            if (isArrayLike(value[0])) {
                var ret = [];
                for (var i = 0; i < len; i++) {
                    ret.push(arraySlice.call(value[i]));
                }
                return ret;
            }
            return arraySlice.call(value);
        }
        return value;
    }
    function rgba2String(rgba) {
        rgba[0] = Math.floor(rgba[0]);
        rgba[1] = Math.floor(rgba[1]);
        rgba[2] = Math.floor(rgba[2]);
        return 'rgba(' + rgba.join(',') + ')';
    }
    function createTrackClip(animator, easing, oneTrackDone, keyframes, propName) {
        var getter = animator._getter;
        var setter = animator._setter;
        var useSpline = easing === 'spline';
        var trackLen = keyframes.length;
        if (!trackLen) {
            return;
        }
        // Guess data type
        var firstVal = keyframes[0].value;
        var isValueArray = isArrayLike(firstVal);
        var isValueColor = false;
        var isValueString = false;
        // For vertices morphing
        var arrDim = isValueArray && isArrayLike(firstVal[0]) ? 2 : 1;
        var trackMaxTime;
        // Sort keyframe as ascending
        keyframes.sort(function (a, b) {
            return a.time - b.time;
        });
        trackMaxTime = keyframes[trackLen - 1].time;
        // Percents of each keyframe
        var kfPercents = [];
        // Value of each keyframe
        var kfValues = [];
        var prevValue = keyframes[0].value;
        var isAllValueEqual = true;
        for (var i = 0; i < trackLen; i++) {
            kfPercents.push(keyframes[i].time / trackMaxTime);
            // Assume value is a color when it is a string
            var value = keyframes[i].value;
            // Check if value is equal, deep check if value is array
            if (!(isValueArray && isArraySame(value, prevValue, arrDim) || !isValueArray && value === prevValue)) {
                isAllValueEqual = false;
            }
            prevValue = value;
            // Try converting a string to a color array
            if (typeof value == 'string') {
                var colorArray = color.parse(value);
                if (colorArray) {
                    value = colorArray;
                    isValueColor = true;
                } else {
                    isValueString = true;
                }
            }
            kfValues.push(value);
        }
        if (isAllValueEqual) {
            return;
        }
        var lastValue = kfValues[trackLen - 1];
        // Polyfill array and NaN value
        for (var i = 0; i < trackLen - 1; i++) {
            if (isValueArray) {
                fillArr(kfValues[i], lastValue, arrDim);
            } else {
                if (isNaN(kfValues[i]) && !isNaN(lastValue) && !isValueString && !isValueColor) {
                    kfValues[i] = lastValue;
                }
            }
        }
        isValueArray && fillArr(getter(animator._target, propName), lastValue, arrDim);
        // Cache the key of last frame to speed up when
        // animation playback is sequency
        var lastFrame = 0;
        var lastFramePercent = 0;
        var start;
        var w;
        var p0;
        var p1;
        var p2;
        var p3;
        if (isValueColor) {
            var rgba = [
                    0,
                    0,
                    0,
                    0
                ];
        }
        var onframe = function (target, percent) {
            // Find the range keyframes
            // kf1-----kf2---------current--------kf3
            // find kf2 and kf3 and do interpolation
            var frame;
            // In the easing function like elasticOut, percent may less than 0
            if (percent < 0) {
                frame = 0;
            } else if (percent < lastFramePercent) {
                // Start from next key
                // PENDING start from lastFrame ?
                start = Math.min(lastFrame + 1, trackLen - 1);
                for (frame = start; frame >= 0; frame--) {
                    if (kfPercents[frame] <= percent) {
                        break;
                    }
                }
                // PENDING really need to do this ?
                frame = Math.min(frame, trackLen - 2);
            } else {
                for (frame = lastFrame; frame < trackLen; frame++) {
                    if (kfPercents[frame] > percent) {
                        break;
                    }
                }
                frame = Math.min(frame - 1, trackLen - 2);
            }
            lastFrame = frame;
            lastFramePercent = percent;
            var range = kfPercents[frame + 1] - kfPercents[frame];
            if (range === 0) {
                return;
            } else {
                w = (percent - kfPercents[frame]) / range;
            }
            if (useSpline) {
                p1 = kfValues[frame];
                p0 = kfValues[frame === 0 ? frame : frame - 1];
                p2 = kfValues[frame > trackLen - 2 ? trackLen - 1 : frame + 1];
                p3 = kfValues[frame > trackLen - 3 ? trackLen - 1 : frame + 2];
                if (isValueArray) {
                    catmullRomInterpolateArray(p0, p1, p2, p3, w, w * w, w * w * w, getter(target, propName), arrDim);
                } else {
                    var value;
                    if (isValueColor) {
                        value = catmullRomInterpolateArray(p0, p1, p2, p3, w, w * w, w * w * w, rgba, 1);
                        value = rgba2String(rgba);
                    } else if (isValueString) {
                        // String is step(0.5)
                        return interpolateString(p1, p2, w);
                    } else {
                        value = catmullRomInterpolate(p0, p1, p2, p3, w, w * w, w * w * w);
                    }
                    setter(target, propName, value);
                }
            } else {
                if (isValueArray) {
                    interpolateArray(kfValues[frame], kfValues[frame + 1], w, getter(target, propName), arrDim);
                } else {
                    var value;
                    if (isValueColor) {
                        interpolateArray(kfValues[frame], kfValues[frame + 1], w, rgba, 1);
                        value = rgba2String(rgba);
                    } else if (isValueString) {
                        // String is step(0.5)
                        return interpolateString(kfValues[frame], kfValues[frame + 1], w);
                    } else {
                        value = interpolateNumber(kfValues[frame], kfValues[frame + 1], w);
                    }
                    setter(target, propName, value);
                }
            }
        };
        var clip = new Clip({
                target: animator._target,
                life: trackMaxTime,
                loop: animator._loop,
                delay: animator._delay,
                onframe: onframe,
                ondestroy: oneTrackDone
            });
        if (easing && easing !== 'spline') {
            clip.easing = easing;
        }
        return clip;
    }
    /**
     * @alias module:zrender/animation/Animator
     * @constructor
     * @param {Object} target
     * @param {boolean} loop
     * @param {Function} getter
     * @param {Function} setter
     */
    var Animator = function (target, loop, getter, setter) {
        this._tracks = {};
        this._target = target;
        this._loop = loop || false;
        this._getter = getter || defaultGetter;
        this._setter = setter || defaultSetter;
        this._clipCount = 0;
        this._delay = 0;
        this._doneList = [];
        this._onframeList = [];
        this._clipList = [];
    };
    Animator.prototype = {
        when: function (time, props) {
            var tracks = this._tracks;
            for (var propName in props) {
                if (!props.hasOwnProperty(propName)) {
                    continue;
                }
                if (!tracks[propName]) {
                    tracks[propName] = [];
                    // Invalid value
                    var value = this._getter(this._target, propName);
                    if (value == null) {
                        // zrLog('Invalid property ' + propName);
                        continue;
                    }
                    // If time is 0
                    //  Then props is given initialize value
                    // Else
                    //  Initialize value from current prop value
                    if (time !== 0) {
                        tracks[propName].push({
                            time: 0,
                            value: cloneValue(value)
                        });
                    }
                }
                tracks[propName].push({
                    time: time,
                    value: props[propName]
                });
            }
            return this;
        },
        during: function (callback) {
            this._onframeList.push(callback);
            return this;
        },
        _doneCallback: function () {
            // Clear all tracks
            this._tracks = {};
            // Clear all clips
            this._clipList.length = 0;
            var doneList = this._doneList;
            var len = doneList.length;
            for (var i = 0; i < len; i++) {
                doneList[i].call(this);
            }
        },
        start: function (easing) {
            var self = this;
            var clipCount = 0;
            var oneTrackDone = function () {
                clipCount--;
                if (!clipCount) {
                    self._doneCallback();
                }
            };
            var lastClip;
            for (var propName in this._tracks) {
                if (!this._tracks.hasOwnProperty(propName)) {
                    continue;
                }
                var clip = createTrackClip(this, easing, oneTrackDone, this._tracks[propName], propName);
                if (clip) {
                    this._clipList.push(clip);
                    clipCount++;
                    // If start after added to animation
                    if (this.animation) {
                        this.animation.addClip(clip);
                    }
                    lastClip = clip;
                }
            }
            // Add during callback on the last clip
            if (lastClip) {
                var oldOnFrame = lastClip.onframe;
                lastClip.onframe = function (target, percent) {
                    oldOnFrame(target, percent);
                    for (var i = 0; i < self._onframeList.length; i++) {
                        self._onframeList[i](target, percent);
                    }
                };
            }
            if (!clipCount) {
                this._doneCallback();
            }
            return this;
        },
        stop: function (forwardToLast) {
            var clipList = this._clipList;
            var animation = this.animation;
            for (var i = 0; i < clipList.length; i++) {
                var clip = clipList[i];
                if (forwardToLast) {
                    // Move to last frame before stop
                    clip.onframe(this._target, 1);
                }
                animation && animation.removeClip(clip);
            }
            clipList.length = 0;
        },
        delay: function (time) {
            this._delay = time;
            return this;
        },
        done: function (cb) {
            if (cb) {
                this._doneList.push(cb);
            }
            return this;
        },
        getClips: function () {
            return this._clipList;
        }
    };
    return Animator;
});
define('zrender/core/log', ['require', '../config'], function (require) {
    var config = require('../config');
    /**
         * @exports zrender/tool/log
         * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
         */
    return function () {
        if (config.debugMode === 0) {
            return;
        } else if (config.debugMode == 1) {
            for (var k in arguments) {
                throw new Error(arguments[k]);
            }
        } else if (config.debugMode > 1) {
            for (var k in arguments) {
                console.log(arguments[k]);
            }
        }
    };    /* for debug
        return function(mes) {
            document.getElementById('wrong-message').innerHTML =
                mes + ' ' + (new Date() - 0)
                + '<br/>'
                + document.getElementById('wrong-message').innerHTML;
        };
        */
});
define('echarts/coord/cartesian/AxisModel', ['require', '../../model/Component', 'zrender/core/util', '../axisModelCreator', '../axisModelCommonMixin'], function (require) {
    'use strict';
    var ComponentModel = require('../../model/Component');
    var zrUtil = require('zrender/core/util');
    var axisModelCreator = require('../axisModelCreator');
    var AxisModel = ComponentModel.extend({
            type: 'cartesian2dAxis',
            axis: null,
            init: function () {
                AxisModel.superApply(this, 'init', arguments);
                this.resetRange();
            },
            mergeOption: function () {
                AxisModel.superApply(this, 'mergeOption', arguments);
                this.resetRange();
            },
            restoreData: function () {
                AxisModel.superApply(this, 'restoreData', arguments);
                this.resetRange();
            },
            getCoordSysModel: function () {
                return this.ecModel.queryComponents({
                    mainType: 'grid',
                    index: this.option.gridIndex,
                    id: this.option.gridId
                })[0];
            }
        });
    function getAxisType(axisDim, option) {
        // Default axis with data is category axis
        return option.type || (option.data ? 'category' : 'value');
    }
    zrUtil.merge(AxisModel.prototype, require('../axisModelCommonMixin'));
    var extraOption = { offset: 0 };
    axisModelCreator('x', AxisModel, getAxisType, extraOption);
    axisModelCreator('y', AxisModel, getAxisType, extraOption);
    return AxisModel;
});
define('zrender/animation/Clip', ['require', './easing'], function (require) {
    var easingFuncs = require('./easing');
    function Clip(options) {
        this._target = options.target;
        // 生命周期
        this._life = options.life || 1000;
        // 延时
        this._delay = options.delay || 0;
        // 开始时间
        // this._startTime = new Date().getTime() + this._delay;// 单位毫秒
        this._initialized = false;
        // 是否循环
        this.loop = options.loop == null ? false : options.loop;
        this.gap = options.gap || 0;
        this.easing = options.easing || 'Linear';
        this.onframe = options.onframe;
        this.ondestroy = options.ondestroy;
        this.onrestart = options.onrestart;
    }
    Clip.prototype = {
        constructor: Clip,
        step: function (globalTime) {
            // Set startTime on first step, or _startTime may has milleseconds different between clips
            // PENDING
            if (!this._initialized) {
                this._startTime = globalTime + this._delay;
                this._initialized = true;
            }
            var percent = (globalTime - this._startTime) / this._life;
            // 还没开始
            if (percent < 0) {
                return;
            }
            percent = Math.min(percent, 1);
            var easing = this.easing;
            var easingFunc = typeof easing == 'string' ? easingFuncs[easing] : easing;
            var schedule = typeof easingFunc === 'function' ? easingFunc(percent) : percent;
            this.fire('frame', schedule);
            // 结束
            if (percent == 1) {
                if (this.loop) {
                    this.restart(globalTime);
                    // 重新开始周期
                    // 抛出而不是直接调用事件直到 stage.update 后再统一调用这些事件
                    return 'restart';
                }
                // 动画完成将这个控制器标识为待删除
                // 在Animation.update中进行批量删除
                this._needsRemove = true;
                return 'destroy';
            }
            return null;
        },
        restart: function (globalTime) {
            var remainder = (globalTime - this._startTime) % this._life;
            this._startTime = globalTime - remainder + this.gap;
            this._needsRemove = false;
        },
        fire: function (eventType, arg) {
            eventType = 'on' + eventType;
            if (this[eventType]) {
                this[eventType](this._target, arg);
            }
        }
    };
    return Clip;
});
define('echarts/coord/axisModelCreator', ['require', './axisDefault', 'zrender/core/util', '../model/Component', '../util/layout'], function (require) {
    var axisDefault = require('./axisDefault');
    var zrUtil = require('zrender/core/util');
    var ComponentModel = require('../model/Component');
    var layout = require('../util/layout');
    // FIXME axisType is fixed ?
    var AXIS_TYPES = [
            'value',
            'category',
            'time',
            'log'
        ];
    /**
     * Generate sub axis model class
     * @param {string} axisName 'x' 'y' 'radius' 'angle' 'parallel'
     * @param {module:echarts/model/Component} BaseAxisModelClass
     * @param {Function} axisTypeDefaulter
     * @param {Object} [extraDefaultOption]
     */
    return function (axisName, BaseAxisModelClass, axisTypeDefaulter, extraDefaultOption) {
        zrUtil.each(AXIS_TYPES, function (axisType) {
            BaseAxisModelClass.extend({
                type: axisName + 'Axis.' + axisType,
                mergeDefaultAndTheme: function (option, ecModel) {
                    var layoutMode = this.layoutMode;
                    var inputPositionParams = layoutMode ? layout.getLayoutParams(option) : {};
                    var themeModel = ecModel.getTheme();
                    zrUtil.merge(option, themeModel.get(axisType + 'Axis'));
                    zrUtil.merge(option, this.getDefaultOption());
                    option.type = axisTypeDefaulter(axisName, option);
                    if (layoutMode) {
                        layout.mergeLayoutParam(option, inputPositionParams, layoutMode);
                    }
                },
                defaultOption: zrUtil.mergeAll([
                    {},
                    axisDefault[axisType + 'Axis'],
                    extraDefaultOption
                ], true)
            });
        });
        ComponentModel.registerSubTypeDefaulter(axisName + 'Axis', zrUtil.curry(axisTypeDefaulter, axisName));
    };
});
define('echarts/coord/axisModelCommonMixin', ['require', 'zrender/core/util', './axisHelper'], function (require) {
    var zrUtil = require('zrender/core/util');
    var axisHelper = require('./axisHelper');
    function getName(obj) {
        if (zrUtil.isObject(obj) && obj.value != null) {
            return obj.value;
        } else {
            return obj;
        }
    }
    return {
        getFormattedLabels: function () {
            return axisHelper.getFormattedLabels(this.axis, this.get('axisLabel.formatter'));
        },
        getCategories: function () {
            return this.get('type') === 'category' && zrUtil.map(this.get('data'), getName);
        },
        getMin: function (origin) {
            var option = this.option;
            var min = !origin && option.rangeStart != null ? option.rangeStart : option.min;
            if (min != null && min !== 'dataMin' && !zrUtil.eqNaN(min)) {
                min = this.axis.scale.parse(min);
            }
            return min;
        },
        getMax: function (origin) {
            var option = this.option;
            var max = !origin && option.rangeEnd != null ? option.rangeEnd : option.max;
            if (max != null && max !== 'dataMax' && !zrUtil.eqNaN(max)) {
                max = this.axis.scale.parse(max);
            }
            return max;
        },
        getNeedCrossZero: function () {
            var option = this.option;
            return option.rangeStart != null || option.rangeEnd != null ? false : !option.scale;
        },
        getCoordSysModel: zrUtil.noop,
        setRange: function (rangeStart, rangeEnd) {
            this.option.rangeStart = rangeStart;
            this.option.rangeEnd = rangeEnd;
        },
        resetRange: function () {
            // rangeStart and rangeEnd is readonly.
            this.option.rangeStart = this.option.rangeEnd = null;
        }
    };
});
define('zrender/animation/easing', [], function () {
    var easing = {
            linear: function (k) {
                return k;
            },
            quadraticIn: function (k) {
                return k * k;
            },
            quadraticOut: function (k) {
                return k * (2 - k);
            },
            quadraticInOut: function (k) {
                if ((k *= 2) < 1) {
                    return 0.5 * k * k;
                }
                return -0.5 * (--k * (k - 2) - 1);
            },
            cubicIn: function (k) {
                return k * k * k;
            },
            cubicOut: function (k) {
                return --k * k * k + 1;
            },
            cubicInOut: function (k) {
                if ((k *= 2) < 1) {
                    return 0.5 * k * k * k;
                }
                return 0.5 * ((k -= 2) * k * k + 2);
            },
            quarticIn: function (k) {
                return k * k * k * k;
            },
            quarticOut: function (k) {
                return 1 - --k * k * k * k;
            },
            quarticInOut: function (k) {
                if ((k *= 2) < 1) {
                    return 0.5 * k * k * k * k;
                }
                return -0.5 * ((k -= 2) * k * k * k - 2);
            },
            quinticIn: function (k) {
                return k * k * k * k * k;
            },
            quinticOut: function (k) {
                return --k * k * k * k * k + 1;
            },
            quinticInOut: function (k) {
                if ((k *= 2) < 1) {
                    return 0.5 * k * k * k * k * k;
                }
                return 0.5 * ((k -= 2) * k * k * k * k + 2);
            },
            sinusoidalIn: function (k) {
                return 1 - Math.cos(k * Math.PI / 2);
            },
            sinusoidalOut: function (k) {
                return Math.sin(k * Math.PI / 2);
            },
            sinusoidalInOut: function (k) {
                return 0.5 * (1 - Math.cos(Math.PI * k));
            },
            exponentialIn: function (k) {
                return k === 0 ? 0 : Math.pow(1024, k - 1);
            },
            exponentialOut: function (k) {
                return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
            },
            exponentialInOut: function (k) {
                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }
                if ((k *= 2) < 1) {
                    return 0.5 * Math.pow(1024, k - 1);
                }
                return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
            },
            circularIn: function (k) {
                return 1 - Math.sqrt(1 - k * k);
            },
            circularOut: function (k) {
                return Math.sqrt(1 - --k * k);
            },
            circularInOut: function (k) {
                if ((k *= 2) < 1) {
                    return -0.5 * (Math.sqrt(1 - k * k) - 1);
                }
                return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
            },
            elasticIn: function (k) {
                var s;
                var a = 0.1;
                var p = 0.4;
                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else {
                    s = p * Math.asin(1 / a) / (2 * Math.PI);
                }
                return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
            },
            elasticOut: function (k) {
                var s;
                var a = 0.1;
                var p = 0.4;
                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else {
                    s = p * Math.asin(1 / a) / (2 * Math.PI);
                }
                return a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1;
            },
            elasticInOut: function (k) {
                var s;
                var a = 0.1;
                var p = 0.4;
                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else {
                    s = p * Math.asin(1 / a) / (2 * Math.PI);
                }
                if ((k *= 2) < 1) {
                    return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
                }
                return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
            },
            backIn: function (k) {
                var s = 1.70158;
                return k * k * ((s + 1) * k - s);
            },
            backOut: function (k) {
                var s = 1.70158;
                return --k * k * ((s + 1) * k + s) + 1;
            },
            backInOut: function (k) {
                var s = 1.70158 * 1.525;
                if ((k *= 2) < 1) {
                    return 0.5 * (k * k * ((s + 1) * k - s));
                }
                return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
            },
            bounceIn: function (k) {
                return 1 - easing.bounceOut(1 - k);
            },
            bounceOut: function (k) {
                if (k < 1 / 2.75) {
                    return 7.5625 * k * k;
                } else if (k < 2 / 2.75) {
                    return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
                } else if (k < 2.5 / 2.75) {
                    return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
                } else {
                    return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
                }
            },
            bounceInOut: function (k) {
                if (k < 0.5) {
                    return easing.bounceIn(k * 2) * 0.5;
                }
                return easing.bounceOut(k * 2 - 1) * 0.5 + 0.5;
            }
        };
    return easing;
});
define('echarts/coord/axisDefault', ['require', 'zrender/core/util'], function (require) {
    var zrUtil = require('zrender/core/util');
    var defaultOption = {
            show: true,
            zlevel: 0,
            z: 0,
            inverse: false,
            name: '',
            nameLocation: 'end',
            nameRotate: null,
            nameTruncate: {
                maxWidth: null,
                ellipsis: '...',
                placeholder: '.'
            },
            nameTextStyle: {},
            nameGap: 15,
            silent: false,
            triggerEvent: false,
            tooltip: { show: false },
            axisLine: {
                show: true,
                onZero: true,
                lineStyle: {
                    color: '#333',
                    width: 1,
                    type: 'solid'
                }
            },
            axisTick: {
                show: true,
                inside: false,
                length: 5,
                lineStyle: { width: 1 }
            },
            axisLabel: {
                show: true,
                inside: false,
                rotate: 0,
                margin: 8,
                textStyle: { fontSize: 12 }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: ['#ccc'],
                    width: 1,
                    type: 'solid'
                }
            },
            splitArea: {
                show: false,
                areaStyle: {
                    color: [
                        'rgba(250,250,250,0.3)',
                        'rgba(200,200,200,0.3)'
                    ]
                }
            }
        };
    var categoryAxis = zrUtil.merge({
            boundaryGap: true,
            splitLine: { show: false },
            axisTick: {
                alignWithLabel: false,
                interval: 'auto'
            },
            axisLabel: { interval: 'auto' }
        }, defaultOption);
    var valueAxis = zrUtil.merge({
            boundaryGap: [
                0,
                0
            ],
            splitNumber: 5
        }, defaultOption);
    // FIXME
    var timeAxis = zrUtil.defaults({
            scale: true,
            min: 'dataMin',
            max: 'dataMax'
        }, valueAxis);
    var logAxis = zrUtil.defaults({ logBase: 10 }, valueAxis);
    logAxis.scale = true;
    return {
        categoryAxis: categoryAxis,
        valueAxis: valueAxis,
        timeAxis: timeAxis,
        logAxis: logAxis
    };
});
define('zrender/config', [], function () {
    var dpr = 1;
    // If in browser environment
    if (typeof window !== 'undefined') {
        dpr = Math.max(window.devicePixelRatio || 1, 1);
    }
    /**
     * config默认配置项
     * @exports zrender/config
     * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
     */
    var config = {
            debugMode: 0,
            devicePixelRatio: dpr
        };
    return config;
});
define('echarts/chart/bar/BaseBarSeries', ['require', '../../model/Series', '../helper/createListFromArray'], function (require) {
    'use strict';
    var SeriesModel = require('../../model/Series');
    var createListFromArray = require('../helper/createListFromArray');
    return SeriesModel.extend({
        type: 'series.__base_bar__',
        getInitialData: function (option, ecModel) {
            if (true) {
                var coordSys = option.coordinateSystem;
                if (coordSys !== 'cartesian2d') {
                    throw new Error('Bar only support cartesian2d coordinateSystem');
                }
            }
            return createListFromArray(option.data, this, ecModel);
        },
        getMarkerPosition: function (value) {
            var coordSys = this.coordinateSystem;
            if (coordSys) {
                // PENDING if clamp ?
                var pt = coordSys.dataToPoint(value, true);
                var data = this.getData();
                var offset = data.getLayout('offset');
                var size = data.getLayout('size');
                var offsetIndex = coordSys.getBaseAxis().isHorizontal() ? 0 : 1;
                pt[offsetIndex] += offset + size / 2;
                return pt;
            }
            return [
                NaN,
                NaN
            ];
        },
        defaultOption: {
            zlevel: 0,
            z: 2,
            coordinateSystem: 'cartesian2d',
            legendHoverLink: true,
            barMinHeight: 0,
            itemStyle: {
                normal: {},
                emphasis: {}
            }
        }
    });
});
define('zrender/core/curve', ['require', './vector'], function (require) {
    'use strict';
    var vec2 = require('./vector');
    var v2Create = vec2.create;
    var v2DistSquare = vec2.distSquare;
    var mathPow = Math.pow;
    var mathSqrt = Math.sqrt;
    var EPSILON = 1e-8;
    var EPSILON_NUMERIC = 0.0001;
    var THREE_SQRT = mathSqrt(3);
    var ONE_THIRD = 1 / 3;
    // 临时变量
    var _v0 = v2Create();
    var _v1 = v2Create();
    var _v2 = v2Create();
    // var _v3 = vec2.create();
    function isAroundZero(val) {
        return val > -EPSILON && val < EPSILON;
    }
    function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
    }
    /**
     * 计算三次贝塞尔值
     * @memberOf module:zrender/core/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @return {number}
     */
    function cubicAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return onet * onet * (onet * p0 + 3 * t * p1) + t * t * (t * p3 + 3 * onet * p2);
    }
    /**
     * 计算三次贝塞尔导数值
     * @memberOf module:zrender/core/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @return {number}
     */
    function cubicDerivativeAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return 3 * (((p1 - p0) * onet + 2 * (p2 - p1) * t) * onet + (p3 - p2) * t * t);
    }
    /**
     * 计算三次贝塞尔方程根，使用盛金公式
     * @memberOf module:zrender/core/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} val
     * @param  {Array.<number>} roots
     * @return {number} 有效根数目
     */
    function cubicRootAt(p0, p1, p2, p3, val, roots) {
        // Evaluate roots of cubic functions
        var a = p3 + 3 * (p1 - p2) - p0;
        var b = 3 * (p2 - p1 * 2 + p0);
        var c = 3 * (p1 - p0);
        var d = p0 - val;
        var A = b * b - 3 * a * c;
        var B = b * c - 9 * a * d;
        var C = c * c - 3 * b * d;
        var n = 0;
        if (isAroundZero(A) && isAroundZero(B)) {
            if (isAroundZero(b)) {
                roots[0] = 0;
            } else {
                var t1 = -c / b;
                //t1, t2, t3, b is not zero
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
        } else {
            var disc = B * B - 4 * A * C;
            if (isAroundZero(disc)) {
                var K = B / A;
                var t1 = -b / a + K;
                // t1, a is not zero
                var t2 = -K / 2;
                // t2, t3
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
            } else if (disc > 0) {
                var discSqrt = mathSqrt(disc);
                var Y1 = A * b + 1.5 * a * (-B + discSqrt);
                var Y2 = A * b + 1.5 * a * (-B - discSqrt);
                if (Y1 < 0) {
                    Y1 = -mathPow(-Y1, ONE_THIRD);
                } else {
                    Y1 = mathPow(Y1, ONE_THIRD);
                }
                if (Y2 < 0) {
                    Y2 = -mathPow(-Y2, ONE_THIRD);
                } else {
                    Y2 = mathPow(Y2, ONE_THIRD);
                }
                var t1 = (-b - (Y1 + Y2)) / (3 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            } else {
                var T = (2 * A * b - 3 * a * B) / (2 * mathSqrt(A * A * A));
                var theta = Math.acos(T) / 3;
                var ASqrt = mathSqrt(A);
                var tmp = Math.cos(theta);
                var t1 = (-b - 2 * ASqrt * tmp) / (3 * a);
                var t2 = (-b + ASqrt * (tmp + THREE_SQRT * Math.sin(theta))) / (3 * a);
                var t3 = (-b + ASqrt * (tmp - THREE_SQRT * Math.sin(theta))) / (3 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
                if (t3 >= 0 && t3 <= 1) {
                    roots[n++] = t3;
                }
            }
        }
        return n;
    }
    /**
     * 计算三次贝塞尔方程极限值的位置
     * @memberOf module:zrender/core/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {Array.<number>} extrema
     * @return {number} 有效数目
     */
    function cubicExtrema(p0, p1, p2, p3, extrema) {
        var b = 6 * p2 - 12 * p1 + 6 * p0;
        var a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2;
        var c = 3 * p1 - 3 * p0;
        var n = 0;
        if (isAroundZero(a)) {
            if (isNotAroundZero(b)) {
                var t1 = -c / b;
                if (t1 >= 0 && t1 <= 1) {
                    extrema[n++] = t1;
                }
            }
        } else {
            var disc = b * b - 4 * a * c;
            if (isAroundZero(disc)) {
                extrema[0] = -b / (2 * a);
            } else if (disc > 0) {
                var discSqrt = mathSqrt(disc);
                var t1 = (-b + discSqrt) / (2 * a);
                var t2 = (-b - discSqrt) / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    extrema[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    extrema[n++] = t2;
                }
            }
        }
        return n;
    }
    /**
     * 细分三次贝塞尔曲线
     * @memberOf module:zrender/core/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @param  {Array.<number>} out
     */
    function cubicSubdivide(p0, p1, p2, p3, t, out) {
        var p01 = (p1 - p0) * t + p0;
        var p12 = (p2 - p1) * t + p1;
        var p23 = (p3 - p2) * t + p2;
        var p012 = (p12 - p01) * t + p01;
        var p123 = (p23 - p12) * t + p12;
        var p0123 = (p123 - p012) * t + p012;
        // Seg0
        out[0] = p0;
        out[1] = p01;
        out[2] = p012;
        out[3] = p0123;
        // Seg1
        out[4] = p0123;
        out[5] = p123;
        out[6] = p23;
        out[7] = p3;
    }
    /**
     * 投射点到三次贝塞尔曲线上，返回投射距离。
     * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x3
     * @param {number} y3
     * @param {number} x
     * @param {number} y
     * @param {Array.<number>} [out] 投射点
     * @return {number}
     */
    function cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, out) {
        // http://pomax.github.io/bezierinfo/#projections
        var t;
        var interval = 0.005;
        var d = Infinity;
        var prev;
        var next;
        var d1;
        var d2;
        _v0[0] = x;
        _v0[1] = y;
        // 先粗略估计一下可能的最小距离的 t 值
        // PENDING
        for (var _t = 0; _t < 1; _t += 0.05) {
            _v1[0] = cubicAt(x0, x1, x2, x3, _t);
            _v1[1] = cubicAt(y0, y1, y2, y3, _t);
            d1 = v2DistSquare(_v0, _v1);
            if (d1 < d) {
                t = _t;
                d = d1;
            }
        }
        d = Infinity;
        // At most 32 iteration
        for (var i = 0; i < 32; i++) {
            if (interval < EPSILON_NUMERIC) {
                break;
            }
            prev = t - interval;
            next = t + interval;
            // t - interval
            _v1[0] = cubicAt(x0, x1, x2, x3, prev);
            _v1[1] = cubicAt(y0, y1, y2, y3, prev);
            d1 = v2DistSquare(_v1, _v0);
            if (prev >= 0 && d1 < d) {
                t = prev;
                d = d1;
            } else {
                // t + interval
                _v2[0] = cubicAt(x0, x1, x2, x3, next);
                _v2[1] = cubicAt(y0, y1, y2, y3, next);
                d2 = v2DistSquare(_v2, _v0);
                if (next <= 1 && d2 < d) {
                    t = next;
                    d = d2;
                } else {
                    interval *= 0.5;
                }
            }
        }
        // t
        if (out) {
            out[0] = cubicAt(x0, x1, x2, x3, t);
            out[1] = cubicAt(y0, y1, y2, y3, t);
        }
        // console.log(interval, i);
        return mathSqrt(d);
    }
    /**
     * 计算二次方贝塞尔值
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @return {number}
     */
    function quadraticAt(p0, p1, p2, t) {
        var onet = 1 - t;
        return onet * (onet * p0 + 2 * t * p1) + t * t * p2;
    }
    /**
     * 计算二次方贝塞尔导数值
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @return {number}
     */
    function quadraticDerivativeAt(p0, p1, p2, t) {
        return 2 * ((1 - t) * (p1 - p0) + t * (p2 - p1));
    }
    /**
     * 计算二次方贝塞尔方程根
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @param  {Array.<number>} roots
     * @return {number} 有效根数目
     */
    function quadraticRootAt(p0, p1, p2, val, roots) {
        var a = p0 - 2 * p1 + p2;
        var b = 2 * (p1 - p0);
        var c = p0 - val;
        var n = 0;
        if (isAroundZero(a)) {
            if (isNotAroundZero(b)) {
                var t1 = -c / b;
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
        } else {
            var disc = b * b - 4 * a * c;
            if (isAroundZero(disc)) {
                var t1 = -b / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            } else if (disc > 0) {
                var discSqrt = mathSqrt(disc);
                var t1 = (-b + discSqrt) / (2 * a);
                var t2 = (-b - discSqrt) / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
            }
        }
        return n;
    }
    /**
     * 计算二次贝塞尔方程极限值
     * @memberOf module:zrender/core/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @return {number}
     */
    function quadraticExtremum(p0, p1, p2) {
        var divider = p0 + p2 - 2 * p1;
        if (divider === 0) {
            // p1 is center of p0 and p2
            return 0.5;
        } else {
            return (p0 - p1) / divider;
        }
    }
    /**
     * 细分二次贝塞尔曲线
     * @memberOf module:zrender/core/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @param  {Array.<number>} out
     */
    function quadraticSubdivide(p0, p1, p2, t, out) {
        var p01 = (p1 - p0) * t + p0;
        var p12 = (p2 - p1) * t + p1;
        var p012 = (p12 - p01) * t + p01;
        // Seg0
        out[0] = p0;
        out[1] = p01;
        out[2] = p012;
        // Seg1
        out[3] = p012;
        out[4] = p12;
        out[5] = p2;
    }
    /**
     * 投射点到二次贝塞尔曲线上，返回投射距离。
     * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x
     * @param {number} y
     * @param {Array.<number>} out 投射点
     * @return {number}
     */
    function quadraticProjectPoint(x0, y0, x1, y1, x2, y2, x, y, out) {
        // http://pomax.github.io/bezierinfo/#projections
        var t;
        var interval = 0.005;
        var d = Infinity;
        _v0[0] = x;
        _v0[1] = y;
        // 先粗略估计一下可能的最小距离的 t 值
        // PENDING
        for (var _t = 0; _t < 1; _t += 0.05) {
            _v1[0] = quadraticAt(x0, x1, x2, _t);
            _v1[1] = quadraticAt(y0, y1, y2, _t);
            var d1 = v2DistSquare(_v0, _v1);
            if (d1 < d) {
                t = _t;
                d = d1;
            }
        }
        d = Infinity;
        // At most 32 iteration
        for (var i = 0; i < 32; i++) {
            if (interval < EPSILON_NUMERIC) {
                break;
            }
            var prev = t - interval;
            var next = t + interval;
            // t - interval
            _v1[0] = quadraticAt(x0, x1, x2, prev);
            _v1[1] = quadraticAt(y0, y1, y2, prev);
            var d1 = v2DistSquare(_v1, _v0);
            if (prev >= 0 && d1 < d) {
                t = prev;
                d = d1;
            } else {
                // t + interval
                _v2[0] = quadraticAt(x0, x1, x2, next);
                _v2[1] = quadraticAt(y0, y1, y2, next);
                var d2 = v2DistSquare(_v2, _v0);
                if (next <= 1 && d2 < d) {
                    t = next;
                    d = d2;
                } else {
                    interval *= 0.5;
                }
            }
        }
        // t
        if (out) {
            out[0] = quadraticAt(x0, x1, x2, t);
            out[1] = quadraticAt(y0, y1, y2, t);
        }
        // console.log(interval, i);
        return mathSqrt(d);
    }
    return {
        cubicAt: cubicAt,
        cubicDerivativeAt: cubicDerivativeAt,
        cubicRootAt: cubicRootAt,
        cubicExtrema: cubicExtrema,
        cubicSubdivide: cubicSubdivide,
        cubicProjectPoint: cubicProjectPoint,
        quadraticAt: quadraticAt,
        quadraticDerivativeAt: quadraticDerivativeAt,
        quadraticRootAt: quadraticRootAt,
        quadraticExtremum: quadraticExtremum,
        quadraticSubdivide: quadraticSubdivide,
        quadraticProjectPoint: quadraticProjectPoint
    };
});
define('zrender/core/bbox', ['require', './vector', './curve'], function (require) {
    var vec2 = require('./vector');
    var curve = require('./curve');
    var bbox = {};
    var mathMin = Math.min;
    var mathMax = Math.max;
    var mathSin = Math.sin;
    var mathCos = Math.cos;
    var start = vec2.create();
    var end = vec2.create();
    var extremity = vec2.create();
    var PI2 = Math.PI * 2;
    /**
     * 从顶点数组中计算出最小包围盒，写入`min`和`max`中
     * @module zrender/core/bbox
     * @param {Array<Object>} points 顶点数组
     * @param {number} min
     * @param {number} max
     */
    bbox.fromPoints = function (points, min, max) {
        if (points.length === 0) {
            return;
        }
        var p = points[0];
        var left = p[0];
        var right = p[0];
        var top = p[1];
        var bottom = p[1];
        var i;
        for (i = 1; i < points.length; i++) {
            p = points[i];
            left = mathMin(left, p[0]);
            right = mathMax(right, p[0]);
            top = mathMin(top, p[1]);
            bottom = mathMax(bottom, p[1]);
        }
        min[0] = left;
        min[1] = top;
        max[0] = right;
        max[1] = bottom;
    };
    /**
     * @memberOf module:zrender/core/bbox
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {Array.<number>} min
     * @param {Array.<number>} max
     */
    bbox.fromLine = function (x0, y0, x1, y1, min, max) {
        min[0] = mathMin(x0, x1);
        min[1] = mathMin(y0, y1);
        max[0] = mathMax(x0, x1);
        max[1] = mathMax(y0, y1);
    };
    var xDim = [];
    var yDim = [];
    /**
     * 从三阶贝塞尔曲线(p0, p1, p2, p3)中计算出最小包围盒，写入`min`和`max`中
     * @memberOf module:zrender/core/bbox
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x3
     * @param {number} y3
     * @param {Array.<number>} min
     * @param {Array.<number>} max
     */
    bbox.fromCubic = function (x0, y0, x1, y1, x2, y2, x3, y3, min, max) {
        var cubicExtrema = curve.cubicExtrema;
        var cubicAt = curve.cubicAt;
        var i;
        var n = cubicExtrema(x0, x1, x2, x3, xDim);
        min[0] = Infinity;
        min[1] = Infinity;
        max[0] = -Infinity;
        max[1] = -Infinity;
        for (i = 0; i < n; i++) {
            var x = cubicAt(x0, x1, x2, x3, xDim[i]);
            min[0] = mathMin(x, min[0]);
            max[0] = mathMax(x, max[0]);
        }
        n = cubicExtrema(y0, y1, y2, y3, yDim);
        for (i = 0; i < n; i++) {
            var y = cubicAt(y0, y1, y2, y3, yDim[i]);
            min[1] = mathMin(y, min[1]);
            max[1] = mathMax(y, max[1]);
        }
        min[0] = mathMin(x0, min[0]);
        max[0] = mathMax(x0, max[0]);
        min[0] = mathMin(x3, min[0]);
        max[0] = mathMax(x3, max[0]);
        min[1] = mathMin(y0, min[1]);
        max[1] = mathMax(y0, max[1]);
        min[1] = mathMin(y3, min[1]);
        max[1] = mathMax(y3, max[1]);
    };
    /**
     * 从二阶贝塞尔曲线(p0, p1, p2)中计算出最小包围盒，写入`min`和`max`中
     * @memberOf module:zrender/core/bbox
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {Array.<number>} min
     * @param {Array.<number>} max
     */
    bbox.fromQuadratic = function (x0, y0, x1, y1, x2, y2, min, max) {
        var quadraticExtremum = curve.quadraticExtremum;
        var quadraticAt = curve.quadraticAt;
        // Find extremities, where derivative in x dim or y dim is zero
        var tx = mathMax(mathMin(quadraticExtremum(x0, x1, x2), 1), 0);
        var ty = mathMax(mathMin(quadraticExtremum(y0, y1, y2), 1), 0);
        var x = quadraticAt(x0, x1, x2, tx);
        var y = quadraticAt(y0, y1, y2, ty);
        min[0] = mathMin(x0, x2, x);
        min[1] = mathMin(y0, y2, y);
        max[0] = mathMax(x0, x2, x);
        max[1] = mathMax(y0, y2, y);
    };
    /**
     * 从圆弧中计算出最小包围盒，写入`min`和`max`中
     * @method
     * @memberOf module:zrender/core/bbox
     * @param {number} x
     * @param {number} y
     * @param {number} rx
     * @param {number} ry
     * @param {number} startAngle
     * @param {number} endAngle
     * @param {number} anticlockwise
     * @param {Array.<number>} min
     * @param {Array.<number>} max
     */
    bbox.fromArc = function (x, y, rx, ry, startAngle, endAngle, anticlockwise, min, max) {
        var vec2Min = vec2.min;
        var vec2Max = vec2.max;
        var diff = Math.abs(startAngle - endAngle);
        if (diff % PI2 < 0.0001 && diff > 0.0001) {
            // Is a circle
            min[0] = x - rx;
            min[1] = y - ry;
            max[0] = x + rx;
            max[1] = y + ry;
            return;
        }
        start[0] = mathCos(startAngle) * rx + x;
        start[1] = mathSin(startAngle) * ry + y;
        end[0] = mathCos(endAngle) * rx + x;
        end[1] = mathSin(endAngle) * ry + y;
        vec2Min(min, start, end);
        vec2Max(max, start, end);
        // Thresh to [0, Math.PI * 2]
        startAngle = startAngle % PI2;
        if (startAngle < 0) {
            startAngle = startAngle + PI2;
        }
        endAngle = endAngle % PI2;
        if (endAngle < 0) {
            endAngle = endAngle + PI2;
        }
        if (startAngle > endAngle && !anticlockwise) {
            endAngle += PI2;
        } else if (startAngle < endAngle && anticlockwise) {
            startAngle += PI2;
        }
        if (anticlockwise) {
            var tmp = endAngle;
            endAngle = startAngle;
            startAngle = tmp;
        }
        // var number = 0;
        // var step = (anticlockwise ? -Math.PI : Math.PI) / 2;
        for (var angle = 0; angle < endAngle; angle += Math.PI / 2) {
            if (angle > startAngle) {
                extremity[0] = mathCos(angle) * rx + x;
                extremity[1] = mathSin(angle) * ry + y;
                vec2Min(min, extremity, min);
                vec2Max(max, extremity, max);
            }
        }
    };
    return bbox;
});
define('echarts/chart/helper/createListFromArray', ['require', '../../data/List', '../../data/helper/completeDimensions', 'zrender/core/util', '../../util/model', '../../CoordinateSystem'], function (require) {
    'use strict';
    var List = require('../../data/List');
    var completeDimensions = require('../../data/helper/completeDimensions');
    var zrUtil = require('zrender/core/util');
    var modelUtil = require('../../util/model');
    var CoordinateSystem = require('../../CoordinateSystem');
    var getDataItemValue = modelUtil.getDataItemValue;
    var converDataValue = modelUtil.converDataValue;
    function firstDataNotNull(data) {
        var i = 0;
        while (i < data.length && data[i] == null) {
            i++;
        }
        return data[i];
    }
    function ifNeedCompleteOrdinalData(data) {
        var sampleItem = firstDataNotNull(data);
        return sampleItem != null && !zrUtil.isArray(getDataItemValue(sampleItem));
    }
    /**
     * Helper function to create a list from option data
     */
    function createListFromArray(data, seriesModel, ecModel) {
        // If data is undefined
        data = data || [];
        if (true) {
            if (!zrUtil.isArray(data)) {
                throw new Error('Invalid data.');
            }
        }
        var coordSysName = seriesModel.get('coordinateSystem');
        var creator = creators[coordSysName];
        var registeredCoordSys = CoordinateSystem.get(coordSysName);
        // FIXME
        var axesInfo = creator && creator(data, seriesModel, ecModel);
        var dimensions = axesInfo && axesInfo.dimensions;
        if (!dimensions) {
            // Get dimensions from registered coordinate system
            dimensions = registeredCoordSys && registeredCoordSys.dimensions || [
                'x',
                'y'
            ];
            dimensions = completeDimensions(dimensions, data, dimensions.concat(['value']));
        }
        var categoryIndex = axesInfo ? axesInfo.categoryIndex : -1;
        var list = new List(dimensions, seriesModel);
        var nameList = createNameList(axesInfo, data);
        var categories = {};
        var dimValueGetter = categoryIndex >= 0 && ifNeedCompleteOrdinalData(data) ? function (itemOpt, dimName, dataIndex, dimIndex) {
                // If any dataItem is like { value: 10 }
                if (modelUtil.isDataItemOption(itemOpt)) {
                    list.hasItemOption = true;
                }
                // Use dataIndex as ordinal value in categoryAxis
                return dimIndex === categoryIndex ? dataIndex : converDataValue(getDataItemValue(itemOpt), dimensions[dimIndex]);
            } : function (itemOpt, dimName, dataIndex, dimIndex) {
                var value = getDataItemValue(itemOpt);
                var val = converDataValue(value && value[dimIndex], dimensions[dimIndex]);
                // If any dataItem is like { value: 10 }
                if (modelUtil.isDataItemOption(itemOpt)) {
                    list.hasItemOption = true;
                }
                var categoryAxesModels = axesInfo && axesInfo.categoryAxesModels;
                if (categoryAxesModels && categoryAxesModels[dimName]) {
                    // If given value is a category string
                    if (typeof val === 'string') {
                        // Lazy get categories
                        categories[dimName] = categories[dimName] || categoryAxesModels[dimName].getCategories();
                        val = zrUtil.indexOf(categories[dimName], val);
                        if (val < 0 && !isNaN(val)) {
                            // In case some one write '1', '2' istead of 1, 2
                            val = +val;
                        }
                    }
                }
                return val;
            };
        list.hasItemOption = false;
        list.initData(data, nameList, dimValueGetter);
        return list;
    }
    function isStackable(axisType) {
        return axisType !== 'category' && axisType !== 'time';
    }
    function getDimTypeByAxis(axisType) {
        return axisType === 'category' ? 'ordinal' : axisType === 'time' ? 'time' : 'float';
    }
    /**
     * Creaters for each coord system.
     */
    var creators = {
            cartesian2d: function (data, seriesModel, ecModel) {
                var axesModels = zrUtil.map([
                        'xAxis',
                        'yAxis'
                    ], function (name) {
                        return ecModel.queryComponents({
                            mainType: name,
                            index: seriesModel.get(name + 'Index'),
                            id: seriesModel.get(name + 'Id')
                        })[0];
                    });
                var xAxisModel = axesModels[0];
                var yAxisModel = axesModels[1];
                if (true) {
                    if (!xAxisModel) {
                        throw new Error('xAxis "' + zrUtil.retrieve(seriesModel.get('xAxisIndex'), seriesModel.get('xAxisId'), 0) + '" not found');
                    }
                    if (!yAxisModel) {
                        throw new Error('yAxis "' + zrUtil.retrieve(seriesModel.get('xAxisIndex'), seriesModel.get('yAxisId'), 0) + '" not found');
                    }
                }
                var xAxisType = xAxisModel.get('type');
                var yAxisType = yAxisModel.get('type');
                var dimensions = [
                        {
                            name: 'x',
                            type: getDimTypeByAxis(xAxisType),
                            stackable: isStackable(xAxisType)
                        },
                        {
                            name: 'y',
                            type: getDimTypeByAxis(yAxisType),
                            stackable: isStackable(yAxisType)
                        }
                    ];
                var isXAxisCateogry = xAxisType === 'category';
                var isYAxisCategory = yAxisType === 'category';
                completeDimensions(dimensions, data, [
                    'x',
                    'y',
                    'z'
                ]);
                var categoryAxesModels = {};
                if (isXAxisCateogry) {
                    categoryAxesModels.x = xAxisModel;
                }
                if (isYAxisCategory) {
                    categoryAxesModels.y = yAxisModel;
                }
                return {
                    dimensions: dimensions,
                    categoryIndex: isXAxisCateogry ? 0 : isYAxisCategory ? 1 : -1,
                    categoryAxesModels: categoryAxesModels
                };
            },
            singleAxis: function (data, seriesModel, ecModel) {
                var singleAxisModel = ecModel.queryComponents({
                        mainType: 'singleAxis',
                        index: seriesModel.get('singleAxisIndex'),
                        id: seriesModel.get('singleAxisId')
                    })[0];
                if (true) {
                    if (!singleAxisModel) {
                        throw new Error('singleAxis should be specified.');
                    }
                }
                var singleAxisType = singleAxisModel.get('type');
                var isCategory = singleAxisType === 'category';
                var dimensions = [{
                            name: 'single',
                            type: getDimTypeByAxis(singleAxisType),
                            stackable: isStackable(singleAxisType)
                        }];
                completeDimensions(dimensions, data);
                var categoryAxesModels = {};
                if (isCategory) {
                    categoryAxesModels.single = singleAxisModel;
                }
                return {
                    dimensions: dimensions,
                    categoryIndex: isCategory ? 0 : -1,
                    categoryAxesModels: categoryAxesModels
                };
            },
            polar: function (data, seriesModel, ecModel) {
                var polarModel = ecModel.queryComponents({
                        mainType: 'polar',
                        index: seriesModel.get('polarIndex'),
                        id: seriesModel.get('polarId')
                    })[0];
                var angleAxisModel = polarModel.findAxisModel('angleAxis');
                var radiusAxisModel = polarModel.findAxisModel('radiusAxis');
                if (true) {
                    if (!angleAxisModel) {
                        throw new Error('angleAxis option not found');
                    }
                    if (!radiusAxisModel) {
                        throw new Error('radiusAxis option not found');
                    }
                }
                var radiusAxisType = radiusAxisModel.get('type');
                var angleAxisType = angleAxisModel.get('type');
                var dimensions = [
                        {
                            name: 'radius',
                            type: getDimTypeByAxis(radiusAxisType),
                            stackable: isStackable(radiusAxisType)
                        },
                        {
                            name: 'angle',
                            type: getDimTypeByAxis(angleAxisType),
                            stackable: isStackable(angleAxisType)
                        }
                    ];
                var isAngleAxisCateogry = angleAxisType === 'category';
                var isRadiusAxisCateogry = radiusAxisType === 'category';
                completeDimensions(dimensions, data, [
                    'radius',
                    'angle',
                    'value'
                ]);
                var categoryAxesModels = {};
                if (isRadiusAxisCateogry) {
                    categoryAxesModels.radius = radiusAxisModel;
                }
                if (isAngleAxisCateogry) {
                    categoryAxesModels.angle = angleAxisModel;
                }
                return {
                    dimensions: dimensions,
                    categoryIndex: isAngleAxisCateogry ? 1 : isRadiusAxisCateogry ? 0 : -1,
                    categoryAxesModels: categoryAxesModels
                };
            },
            geo: function (data, seriesModel, ecModel) {
                // TODO Region
                // 多个散点图系列在同一个地区的时候
                return {
                    dimensions: completeDimensions([
                        { name: 'lng' },
                        { name: 'lat' }
                    ], data, [
                        'lng',
                        'lat',
                        'value'
                    ])
                };
            }
        };
    function createNameList(result, data) {
        var nameList = [];
        var categoryDim = result && result.dimensions[result.categoryIndex];
        var categoryAxisModel;
        if (categoryDim) {
            categoryAxisModel = result.categoryAxesModels[categoryDim.name];
        }
        if (categoryAxisModel) {
            // FIXME Two category axis
            var categories = categoryAxisModel.getCategories();
            if (categories) {
                var dataLen = data.length;
                // Ordered data is given explicitly like
                // [[3, 0.2], [1, 0.3], [2, 0.15]]
                // or given scatter data,
                // pick the category
                if (zrUtil.isArray(data[0]) && data[0].length > 1) {
                    nameList = [];
                    for (var i = 0; i < dataLen; i++) {
                        nameList[i] = categories[data[i][result.categoryIndex || 0]];
                    }
                } else {
                    nameList = categories.slice(0);
                }
            }
        }
        return nameList;
    }
    return createListFromArray;
});
define('zrender/contain/line', [], function () {
    return {
        containStroke: function (x0, y0, x1, y1, lineWidth, x, y) {
            if (lineWidth === 0) {
                return false;
            }
            var _l = lineWidth;
            var _a = 0;
            var _b = x0;
            // Quick reject
            if (y > y0 + _l && y > y1 + _l || y < y0 - _l && y < y1 - _l || x > x0 + _l && x > x1 + _l || x < x0 - _l && x < x1 - _l) {
                return false;
            }
            if (x0 !== x1) {
                _a = (y0 - y1) / (x0 - x1);
                _b = (x0 * y1 - x1 * y0) / (x0 - x1);
            } else {
                return Math.abs(x - x0) <= _l / 2;
            }
            var tmp = _a * x - y + _b;
            var _s = tmp * tmp / (_a * _a + 1);
            return _s <= _l / 2 * _l / 2;
        }
    };
});
define('zrender/contain/cubic', ['require', '../core/curve'], function (require) {
    var curve = require('../core/curve');
    return {
        containStroke: function (x0, y0, x1, y1, x2, y2, x3, y3, lineWidth, x, y) {
            if (lineWidth === 0) {
                return false;
            }
            var _l = lineWidth;
            // Quick reject
            if (y > y0 + _l && y > y1 + _l && y > y2 + _l && y > y3 + _l || y < y0 - _l && y < y1 - _l && y < y2 - _l && y < y3 - _l || x > x0 + _l && x > x1 + _l && x > x2 + _l && x > x3 + _l || x < x0 - _l && x < x1 - _l && x < x2 - _l && x < x3 - _l) {
                return false;
            }
            var d = curve.cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, null);
            return d <= _l / 2;
        }
    };
});
define('zrender/contain/quadratic', ['require', '../core/curve'], function (require) {
    var curve = require('../core/curve');
    return {
        containStroke: function (x0, y0, x1, y1, x2, y2, lineWidth, x, y) {
            if (lineWidth === 0) {
                return false;
            }
            var _l = lineWidth;
            // Quick reject
            if (y > y0 + _l && y > y1 + _l && y > y2 + _l || y < y0 - _l && y < y1 - _l && y < y2 - _l || x > x0 + _l && x > x1 + _l && x > x2 + _l || x < x0 - _l && x < x1 - _l && x < x2 - _l) {
                return false;
            }
            var d = curve.quadraticProjectPoint(x0, y0, x1, y1, x2, y2, x, y, null);
            return d <= _l / 2;
        }
    };
});
define('zrender/contain/arc', ['require', './util'], function (require) {
    var normalizeRadian = require('./util').normalizeRadian;
    var PI2 = Math.PI * 2;
    return {
        containStroke: function (cx, cy, r, startAngle, endAngle, anticlockwise, lineWidth, x, y) {
            if (lineWidth === 0) {
                return false;
            }
            var _l = lineWidth;
            x -= cx;
            y -= cy;
            var d = Math.sqrt(x * x + y * y);
            if (d - _l > r || d + _l < r) {
                return false;
            }
            if (Math.abs(startAngle - endAngle) % PI2 < 0.0001) {
                // Is a circle
                return true;
            }
            if (anticlockwise) {
                var tmp = startAngle;
                startAngle = normalizeRadian(endAngle);
                endAngle = normalizeRadian(tmp);
            } else {
                startAngle = normalizeRadian(startAngle);
                endAngle = normalizeRadian(endAngle);
            }
            if (startAngle > endAngle) {
                endAngle += PI2;
            }
            var angle = Math.atan2(y, x);
            if (angle < 0) {
                angle += PI2;
            }
            return angle >= startAngle && angle <= endAngle || angle + PI2 >= startAngle && angle + PI2 <= endAngle;
        }
    };
});
define('zrender/contain/util', ['require'], function (require) {
    var PI2 = Math.PI * 2;
    return {
        normalizeRadian: function (angle) {
            angle %= PI2;
            if (angle < 0) {
                angle += PI2;
            }
            return angle;
        }
    };
});
define('zrender/contain/windingLine', [], function () {
    return function windingLine(x0, y0, x1, y1, x, y) {
        if (y > y0 && y > y1 || y < y0 && y < y1) {
            return 0;
        }
        // Ignore horizontal line
        if (y1 === y0) {
            return 0;
        }
        var dir = y1 < y0 ? 1 : -1;
        var t = (y - y0) / (y1 - y0);
        // Avoid winding error when intersection point is the connect point of two line of polygon
        if (t === 1 || t === 0) {
            dir = y1 < y0 ? 0.5 : -0.5;
        }
        var x_ = t * (x1 - x0) + x0;
        return x_ > x ? dir : 0;
    };
});
define('echarts/data/helper/completeDimensions', ['require', 'zrender/core/util'], function (require) {
    var zrUtil = require('zrender/core/util');
    /**
     * Complete the dimensions array guessed from the data structure.
     * @param  {Array.<string>} dimensions      Necessary dimensions, like ['x', 'y']
     * @param  {Array} data                     Data list. [[1, 2, 3], [2, 3, 4]]
     * @param  {Array.<string>} [defaultNames]    Default names to fill not necessary dimensions, like ['value']
     * @param  {string} [extraPrefix]             Prefix of name when filling the left dimensions.
     * @return {Array.<string>}
     */
    function completeDimensions(dimensions, data, defaultNames, extraPrefix) {
        if (!data) {
            return dimensions;
        }
        var value0 = retrieveValue(data[0]);
        var dimSize = zrUtil.isArray(value0) && value0.length || 1;
        defaultNames = defaultNames || [];
        extraPrefix = extraPrefix || 'extra';
        for (var i = 0; i < dimSize; i++) {
            if (!dimensions[i]) {
                var name = defaultNames[i] || extraPrefix + (i - defaultNames.length);
                dimensions[i] = guessOrdinal(data, i) ? {
                    type: 'ordinal',
                    name: name
                } : name;
            }
        }
        return dimensions;
    }
    // The rule should not be complex, otherwise user might not
    // be able to known where the data is wrong.
    var guessOrdinal = completeDimensions.guessOrdinal = function (data, dimIndex) {
            for (var i = 0, len = data.length; i < len; i++) {
                var value = retrieveValue(data[i]);
                if (!zrUtil.isArray(value)) {
                    return false;
                }
                var value = value[dimIndex];
                if (value != null && isFinite(value)) {
                    return false;
                } else if (zrUtil.isString(value) && value !== '-') {
                    return true;
                }
            }
            return false;
        };
    function retrieveValue(o) {
        return zrUtil.isArray(o) ? o : zrUtil.isObject(o) ? o.value : o;
    }
    return completeDimensions;
});
define('zrender/core/LRU', ['require'], function (require) {
    /**
     * Simple double linked list. Compared with array, it has O(1) remove operation.
     * @constructor
     */
    var LinkedList = function () {
        /**
         * @type {module:zrender/core/LRU~Entry}
         */
        this.head = null;
        /**
         * @type {module:zrender/core/LRU~Entry}
         */
        this.tail = null;
        this._len = 0;
    };
    var linkedListProto = LinkedList.prototype;
    /**
     * Insert a new value at the tail
     * @param  {} val
     * @return {module:zrender/core/LRU~Entry}
     */
    linkedListProto.insert = function (val) {
        var entry = new Entry(val);
        this.insertEntry(entry);
        return entry;
    };
    /**
     * Insert an entry at the tail
     * @param  {module:zrender/core/LRU~Entry} entry
     */
    linkedListProto.insertEntry = function (entry) {
        if (!this.head) {
            this.head = this.tail = entry;
        } else {
            this.tail.next = entry;
            entry.prev = this.tail;
            this.tail = entry;
        }
        this._len++;
    };
    /**
     * Remove entry.
     * @param  {module:zrender/core/LRU~Entry} entry
     */
    linkedListProto.remove = function (entry) {
        var prev = entry.prev;
        var next = entry.next;
        if (prev) {
            prev.next = next;
        } else {
            // Is head
            this.head = next;
        }
        if (next) {
            next.prev = prev;
        } else {
            // Is tail
            this.tail = prev;
        }
        entry.next = entry.prev = null;
        this._len--;
    };
    /**
     * @return {number}
     */
    linkedListProto.len = function () {
        return this._len;
    };
    /**
     * @constructor
     * @param {} val
     */
    var Entry = function (val) {
        /**
         * @type {}
         */
        this.value = val;
        /**
         * @type {module:zrender/core/LRU~Entry}
         */
        this.next;
        /**
         * @type {module:zrender/core/LRU~Entry}
         */
        this.prev;
    };
    /**
     * LRU Cache
     * @constructor
     * @alias module:zrender/core/LRU
     */
    var LRU = function (maxSize) {
        this._list = new LinkedList();
        this._map = {};
        this._maxSize = maxSize || 10;
    };
    var LRUProto = LRU.prototype;
    /**
     * @param  {string} key
     * @param  {} value
     */
    LRUProto.put = function (key, value) {
        var list = this._list;
        var map = this._map;
        if (map[key] == null) {
            var len = list.len();
            if (len >= this._maxSize && len > 0) {
                // Remove the least recently used
                var leastUsedEntry = list.head;
                list.remove(leastUsedEntry);
                delete map[leastUsedEntry.key];
            }
            var entry = list.insert(value);
            entry.key = key;
            map[key] = entry;
        }
    };
    /**
     * @param  {string} key
     * @return {}
     */
    LRUProto.get = function (key) {
        var entry = this._map[key];
        var list = this._list;
        if (entry != null) {
            // Put the latest used entry in the tail
            if (entry !== list.tail) {
                list.remove(entry);
                list.insertEntry(entry);
            }
            return entry.value;
        }
    };
    /**
     * Clear the cache
     */
    LRUProto.clear = function () {
        this._list.clear();
        this._map = {};
    };
    return LRU;
});
define('echarts/chart/bar/helper', ['require', 'zrender/core/util', '../../util/graphic'], function (require) {
    var zrUtil = require('zrender/core/util');
    var graphic = require('../../util/graphic');
    var helper = {};
    helper.setLabel = function (normalStyle, hoverStyle, itemModel, color, seriesModel, dataIndex, labelPositionOutside) {
        var labelModel = itemModel.getModel('label.normal');
        var hoverLabelModel = itemModel.getModel('label.emphasis');
        if (labelModel.get('show')) {
            setLabel(normalStyle, labelModel, color, zrUtil.retrieve(seriesModel.getFormattedLabel(dataIndex, 'normal'), seriesModel.getRawValue(dataIndex)), labelPositionOutside);
        } else {
            normalStyle.text = '';
        }
        if (hoverLabelModel.get('show')) {
            setLabel(hoverStyle, hoverLabelModel, color, zrUtil.retrieve(seriesModel.getFormattedLabel(dataIndex, 'emphasis'), seriesModel.getRawValue(dataIndex)), labelPositionOutside);
        } else {
            hoverStyle.text = '';
        }
    };
    function setLabel(style, model, color, labelText, labelPositionOutside) {
        graphic.setText(style, model, color);
        style.text = labelText;
        if (style.textPosition === 'outside') {
            style.textPosition = labelPositionOutside;
        }
    }
    return helper;
});
define('echarts/chart/bar/barItemStyle', ['require', '../../model/mixin/makeStyleMapper'], function (require) {
    var getBarItemStyle = require('../../model/mixin/makeStyleMapper')([
            [
                'fill',
                'color'
            ],
            [
                'stroke',
                'borderColor'
            ],
            [
                'lineWidth',
                'borderWidth'
            ],
            [
                'stroke',
                'barBorderColor'
            ],
            [
                'lineWidth',
                'barBorderWidth'
            ],
            ['opacity'],
            ['shadowBlur'],
            ['shadowOffsetX'],
            ['shadowOffsetY'],
            ['shadowColor']
        ]);
    return {
        getBarItemStyle: function (excludes) {
            var style = getBarItemStyle.call(this, excludes);
            if (this.getBorderLineDash) {
                var lineDash = this.getBorderLineDash();
                lineDash && (style.lineDash = lineDash);
            }
            return style;
        }
    };
});
define('zrender/graphic/helper/poly', ['require', './smoothSpline', './smoothBezier'], function (require) {
    var smoothSpline = require('./smoothSpline');
    var smoothBezier = require('./smoothBezier');
    return {
        buildPath: function (ctx, shape, closePath) {
            var points = shape.points;
            var smooth = shape.smooth;
            if (points && points.length >= 2) {
                if (smooth && smooth !== 'spline') {
                    var controlPoints = smoothBezier(points, smooth, closePath, shape.smoothConstraint);
                    ctx.moveTo(points[0][0], points[0][1]);
                    var len = points.length;
                    for (var i = 0; i < (closePath ? len : len - 1); i++) {
                        var cp1 = controlPoints[i * 2];
                        var cp2 = controlPoints[i * 2 + 1];
                        var p = points[(i + 1) % len];
                        ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], p[0], p[1]);
                    }
                } else {
                    if (smooth === 'spline') {
                        points = smoothSpline(points, closePath);
                    }
                    ctx.moveTo(points[0][0], points[0][1]);
                    for (var i = 1, l = points.length; i < l; i++) {
                        ctx.lineTo(points[i][0], points[i][1]);
                    }
                }
                closePath && ctx.closePath();
            }
        }
    };
});
define('zrender/graphic/helper/smoothSpline', ['require', '../../core/vector'], function (require) {
    var vec2 = require('../../core/vector');
    /**
     * @inner
     */
    function interpolate(p0, p1, p2, p3, t, t2, t3) {
        var v0 = (p2 - p0) * 0.5;
        var v1 = (p3 - p1) * 0.5;
        return (2 * (p1 - p2) + v0 + v1) * t3 + (-3 * (p1 - p2) - 2 * v0 - v1) * t2 + v0 * t + p1;
    }
    /**
     * @alias module:zrender/shape/util/smoothSpline
     * @param {Array} points 线段顶点数组
     * @param {boolean} isLoop
     * @return {Array}
     */
    return function (points, isLoop) {
        var len = points.length;
        var ret = [];
        var distance = 0;
        for (var i = 1; i < len; i++) {
            distance += vec2.distance(points[i - 1], points[i]);
        }
        var segs = distance / 2;
        segs = segs < len ? len : segs;
        for (var i = 0; i < segs; i++) {
            var pos = i / (segs - 1) * (isLoop ? len : len - 1);
            var idx = Math.floor(pos);
            var w = pos - idx;
            var p0;
            var p1 = points[idx % len];
            var p2;
            var p3;
            if (!isLoop) {
                p0 = points[idx === 0 ? idx : idx - 1];
                p2 = points[idx > len - 2 ? len - 1 : idx + 1];
                p3 = points[idx > len - 3 ? len - 1 : idx + 2];
            } else {
                p0 = points[(idx - 1 + len) % len];
                p2 = points[(idx + 1) % len];
                p3 = points[(idx + 2) % len];
            }
            var w2 = w * w;
            var w3 = w * w2;
            ret.push([
                interpolate(p0[0], p1[0], p2[0], p3[0], w, w2, w3),
                interpolate(p0[1], p1[1], p2[1], p3[1], w, w2, w3)
            ]);
        }
        return ret;
    };
});
define('zrender/graphic/helper/smoothBezier', ['require', '../../core/vector'], function (require) {
    var vec2 = require('../../core/vector');
    var v2Min = vec2.min;
    var v2Max = vec2.max;
    var v2Scale = vec2.scale;
    var v2Distance = vec2.distance;
    var v2Add = vec2.add;
    /**
     * 贝塞尔平滑曲线
     * @alias module:zrender/shape/util/smoothBezier
     * @param {Array} points 线段顶点数组
     * @param {number} smooth 平滑等级, 0-1
     * @param {boolean} isLoop
     * @param {Array} constraint 将计算出来的控制点约束在一个包围盒内
     *                           比如 [[0, 0], [100, 100]], 这个包围盒会与
     *                           整个折线的包围盒做一个并集用来约束控制点。
     * @param {Array} 计算出来的控制点数组
     */
    return function (points, smooth, isLoop, constraint) {
        var cps = [];
        var v = [];
        var v1 = [];
        var v2 = [];
        var prevPoint;
        var nextPoint;
        var min, max;
        if (constraint) {
            min = [
                Infinity,
                Infinity
            ];
            max = [
                -Infinity,
                -Infinity
            ];
            for (var i = 0, len = points.length; i < len; i++) {
                v2Min(min, min, points[i]);
                v2Max(max, max, points[i]);
            }
            // 与指定的包围盒做并集
            v2Min(min, min, constraint[0]);
            v2Max(max, max, constraint[1]);
        }
        for (var i = 0, len = points.length; i < len; i++) {
            var point = points[i];
            if (isLoop) {
                prevPoint = points[i ? i - 1 : len - 1];
                nextPoint = points[(i + 1) % len];
            } else {
                if (i === 0 || i === len - 1) {
                    cps.push(vec2.clone(points[i]));
                    continue;
                } else {
                    prevPoint = points[i - 1];
                    nextPoint = points[i + 1];
                }
            }
            vec2.sub(v, nextPoint, prevPoint);
            // use degree to scale the handle length
            v2Scale(v, v, smooth);
            var d0 = v2Distance(point, prevPoint);
            var d1 = v2Distance(point, nextPoint);
            var sum = d0 + d1;
            if (sum !== 0) {
                d0 /= sum;
                d1 /= sum;
            }
            v2Scale(v1, v, -d0);
            v2Scale(v2, v, d1);
            var cp0 = v2Add([], point, v1);
            var cp1 = v2Add([], point, v2);
            if (constraint) {
                v2Max(cp0, cp0, min);
                v2Min(cp0, cp0, max);
                v2Max(cp1, cp1, min);
                v2Min(cp1, cp1, max);
            }
            cps.push(cp0);
            cps.push(cp1);
        }
        if (isLoop) {
            cps.push(cps.shift());
        }
        return cps;
    };
});
define('zrender/graphic/helper/roundRect', ['require'], function (require) {
    return {
        buildPath: function (ctx, shape) {
            var x = shape.x;
            var y = shape.y;
            var width = shape.width;
            var height = shape.height;
            var r = shape.r;
            var r1;
            var r2;
            var r3;
            var r4;
            // Convert width and height to positive for better borderRadius
            if (width < 0) {
                x = x + width;
                width = -width;
            }
            if (height < 0) {
                y = y + height;
                height = -height;
            }
            if (typeof r === 'number') {
                r1 = r2 = r3 = r4 = r;
            } else if (r instanceof Array) {
                if (r.length === 1) {
                    r1 = r2 = r3 = r4 = r[0];
                } else if (r.length === 2) {
                    r1 = r3 = r[0];
                    r2 = r4 = r[1];
                } else if (r.length === 3) {
                    r1 = r[0];
                    r2 = r4 = r[1];
                    r3 = r[2];
                } else {
                    r1 = r[0];
                    r2 = r[1];
                    r3 = r[2];
                    r4 = r[3];
                }
            } else {
                r1 = r2 = r3 = r4 = 0;
            }
            var total;
            if (r1 + r2 > width) {
                total = r1 + r2;
                r1 *= width / total;
                r2 *= width / total;
            }
            if (r3 + r4 > width) {
                total = r3 + r4;
                r3 *= width / total;
                r4 *= width / total;
            }
            if (r2 + r3 > height) {
                total = r2 + r3;
                r2 *= height / total;
                r3 *= height / total;
            }
            if (r1 + r4 > height) {
                total = r1 + r4;
                r1 *= height / total;
                r4 *= height / total;
            }
            ctx.moveTo(x + r1, y);
            ctx.lineTo(x + width - r2, y);
            r2 !== 0 && ctx.quadraticCurveTo(x + width, y, x + width, y + r2);
            ctx.lineTo(x + width, y + height - r3);
            r3 !== 0 && ctx.quadraticCurveTo(x + width, y + height, x + width - r3, y + height);
            ctx.lineTo(x + r4, y + height);
            r4 !== 0 && ctx.quadraticCurveTo(x, y + height, x, y + height - r4);
            ctx.lineTo(x, y + r1);
            r1 !== 0 && ctx.quadraticCurveTo(x, y, x + r1, y);
        }
    };
});
define('zrender/graphic/Gradient', ['require'], function (require) {
    /**
     * @param {Array.<Object>} colorStops
     */
    var Gradient = function (colorStops) {
        this.colorStops = colorStops || [];
    };
    Gradient.prototype = {
        constructor: Gradient,
        addColorStop: function (offset, color) {
            this.colorStops.push({
                offset: offset,
                color: color
            });
        }
    };
    return Gradient;
});
define('zrender/Handler', ['require', './core/util', './mixin/Draggable', './mixin/Eventful'], function (require) {
    'use strict';
    var util = require('./core/util');
    var Draggable = require('./mixin/Draggable');
    var Eventful = require('./mixin/Eventful');
    function makeEventPacket(eveType, target, event) {
        return {
            type: eveType,
            event: event,
            target: target,
            cancelBubble: false,
            offsetX: event.zrX,
            offsetY: event.zrY,
            gestureEvent: event.gestureEvent,
            pinchX: event.pinchX,
            pinchY: event.pinchY,
            pinchScale: event.pinchScale,
            wheelDelta: event.zrDelta,
            zrByTouch: event.zrByTouch
        };
    }
    function EmptyProxy() {
    }
    EmptyProxy.prototype.dispose = function () {
    };
    var handlerNames = [
            'click',
            'dblclick',
            'mousewheel',
            'mouseout',
            'mouseup',
            'mousedown',
            'mousemove',
            'contextmenu'
        ];
    /**
     * @alias module:zrender/Handler
     * @constructor
     * @extends module:zrender/mixin/Eventful
     * @param {module:zrender/Storage} storage Storage instance.
     * @param {module:zrender/Painter} painter Painter instance.
     * @param {module:zrender/dom/HandlerProxy} proxy HandlerProxy instance.
     * @param {HTMLElement} painterRoot painter.root (not painter.getViewportRoot()).
     */
    var Handler = function (storage, painter, proxy, painterRoot) {
        Eventful.call(this);
        this.storage = storage;
        this.painter = painter;
        this.painterRoot = painterRoot;
        proxy = proxy || new EmptyProxy();
        /**
         * Proxy of event. can be Dom, WebGLSurface, etc.
         */
        this.proxy = proxy;
        // Attach handler
        proxy.handler = this;
        /**
         * @private
         * @type {boolean}
         */
        this._hovered;
        /**
         * @private
         * @type {Date}
         */
        this._lastTouchMoment;
        /**
         * @private
         * @type {number}
         */
        this._lastX;
        /**
         * @private
         * @type {number}
         */
        this._lastY;
        Draggable.call(this);
        util.each(handlerNames, function (name) {
            proxy.on && proxy.on(name, this[name], this);
        }, this);
    };
    Handler.prototype = {
        constructor: Handler,
        mousemove: function (event) {
            var x = event.zrX;
            var y = event.zrY;
            var hovered = this.findHover(x, y, null);
            var lastHovered = this._hovered;
            var proxy = this.proxy;
            this._hovered = hovered;
            proxy.setCursor && proxy.setCursor(hovered ? hovered.cursor : 'default');
            // Mouse out on previous hovered element
            if (lastHovered && hovered !== lastHovered && lastHovered.__zr) {
                this.dispatchToElement(lastHovered, 'mouseout', event);
            }
            // Mouse moving on one element
            this.dispatchToElement(hovered, 'mousemove', event);
            // Mouse over on a new element
            if (hovered && hovered !== lastHovered) {
                this.dispatchToElement(hovered, 'mouseover', event);
            }
        },
        mouseout: function (event) {
            this.dispatchToElement(this._hovered, 'mouseout', event);
            // There might be some doms created by upper layer application
            // at the same level of painter.getViewportRoot() (e.g., tooltip
            // dom created by echarts), where 'globalout' event should not
            // be triggered when mouse enters these doms. (But 'mouseout'
            // should be triggered at the original hovered element as usual).
            var element = event.toElement || event.relatedTarget;
            var innerDom;
            do {
                element = element && element.parentNode;
            } while (element && element.nodeType != 9 && !(innerDom = element === this.painterRoot));
            !innerDom && this.trigger('globalout', { event: event });
        },
        resize: function (event) {
            this._hovered = null;
        },
        dispatch: function (eventName, eventArgs) {
            var handler = this[eventName];
            handler && handler.call(this, eventArgs);
        },
        dispose: function () {
            this.proxy.dispose();
            this.storage = this.proxy = this.painter = null;
        },
        setCursorStyle: function (cursorStyle) {
            var proxy = this.proxy;
            proxy.setCursor && proxy.setCursor(cursorStyle);
        },
        dispatchToElement: function (targetEl, eventName, event) {
            var eventHandler = 'on' + eventName;
            var eventPacket = makeEventPacket(eventName, targetEl, event);
            var el = targetEl;
            while (el) {
                el[eventHandler] && (eventPacket.cancelBubble = el[eventHandler].call(el, eventPacket));
                el.trigger(eventName, eventPacket);
                el = el.parent;
                if (eventPacket.cancelBubble) {
                    break;
                }
            }
            if (!eventPacket.cancelBubble) {
                // 冒泡到顶级 zrender 对象
                this.trigger(eventName, eventPacket);
                // 分发事件到用户自定义层
                // 用户有可能在全局 click 事件中 dispose，所以需要判断下 painter 是否存在
                this.painter && this.painter.eachOtherLayer(function (layer) {
                    if (typeof layer[eventHandler] == 'function') {
                        layer[eventHandler].call(layer, eventPacket);
                    }
                    if (layer.trigger) {
                        layer.trigger(eventName, eventPacket);
                    }
                });
            }
        },
        findHover: function (x, y, exclude) {
            var list = this.storage.getDisplayList();
            for (var i = list.length - 1; i >= 0; i--) {
                if (!list[i].silent && list[i] !== exclude && !list[i].ignore && isHover(list[i], x, y)) {
                    return list[i];
                }
            }
        }
    };
    // Common handlers
    util.each([
        'click',
        'mousedown',
        'mouseup',
        'mousewheel',
        'dblclick',
        'contextmenu'
    ], function (name) {
        Handler.prototype[name] = function (event) {
            // Find hover again to avoid click event is dispatched manually. Or click is triggered without mouseover
            var hovered = this.findHover(event.zrX, event.zrY, null);
            if (name === 'mousedown') {
                this._downel = hovered;
                // In case click triggered before mouseup
                this._upel = hovered;
            } else if (name === 'mosueup') {
                this._upel = hovered;
            } else if (name === 'click') {
                if (this._downel !== this._upel) {
                    return;
                }
            }
            this.dispatchToElement(hovered, name, event);
        };
    });
    function isHover(displayable, x, y) {
        if (displayable[displayable.rectHover ? 'rectContain' : 'contain'](x, y)) {
            var el = displayable;
            while (el) {
                // If ancestor is silent or clipped by ancestor
                if (el.silent || el.clipPath && !el.clipPath.contain(x, y)) {
                    return false;
                }
                el = el.parent;
            }
            return true;
        }
        return false;
    }
    util.mixin(Handler, Eventful);
    util.mixin(Handler, Draggable);
    return Handler;
});
define('zrender/Storage', ['require', './core/util', './core/env', './container/Group', './core/timsort'], function (require) {
    'use strict';
    var util = require('./core/util');
    var env = require('./core/env');
    var Group = require('./container/Group');
    // Use timsort because in most case elements are partially sorted
    // https://jsfiddle.net/pissang/jr4x7mdm/8/
    var timsort = require('./core/timsort');
    function shapeCompareFunc(a, b) {
        if (a.zlevel === b.zlevel) {
            if (a.z === b.z) {
                // if (a.z2 === b.z2) {
                //     // FIXME Slow has renderidx compare
                //     // http://stackoverflow.com/questions/20883421/sorting-in-javascript-should-every-compare-function-have-a-return-0-statement
                //     // https://github.com/v8/v8/blob/47cce544a31ed5577ffe2963f67acb4144ee0232/src/js/array.js#L1012
                //     return a.__renderidx - b.__renderidx;
                // }
                return a.z2 - b.z2;
            }
            return a.z - b.z;
        }
        return a.zlevel - b.zlevel;
    }
    /**
     * 内容仓库 (M)
     * @alias module:zrender/Storage
     * @constructor
     */
    var Storage = function () {
        // 所有常规形状，id索引的map
        this._elements = {};
        this._roots = [];
        this._displayList = [];
        this._displayListLen = 0;
    };
    Storage.prototype = {
        constructor: Storage,
        traverse: function (cb, context) {
            for (var i = 0; i < this._roots.length; i++) {
                this._roots[i].traverse(cb, context);
            }
        },
        getDisplayList: function (update, includeIgnore) {
            includeIgnore = includeIgnore || false;
            if (update) {
                this.updateDisplayList(includeIgnore);
            }
            return this._displayList;
        },
        updateDisplayList: function (includeIgnore) {
            this._displayListLen = 0;
            var roots = this._roots;
            var displayList = this._displayList;
            for (var i = 0, len = roots.length; i < len; i++) {
                this._updateAndAddDisplayable(roots[i], null, includeIgnore);
            }
            displayList.length = this._displayListLen;
            // for (var i = 0, len = displayList.length; i < len; i++) {
            //     displayList[i].__renderidx = i;
            // }
            // displayList.sort(shapeCompareFunc);
            env.canvasSupported && timsort(displayList, shapeCompareFunc);
        },
        _updateAndAddDisplayable: function (el, clipPaths, includeIgnore) {
            if (el.ignore && !includeIgnore) {
                return;
            }
            el.beforeUpdate();
            if (el.__dirty) {
                el.update();
            }
            el.afterUpdate();
            var userSetClipPath = el.clipPath;
            if (userSetClipPath) {
                // FIXME 效率影响
                if (clipPaths) {
                    clipPaths = clipPaths.slice();
                } else {
                    clipPaths = [];
                }
                var currentClipPath = userSetClipPath;
                var parentClipPath = el;
                // Recursively add clip path
                while (currentClipPath) {
                    // clipPath 的变换是基于使用这个 clipPath 的元素
                    currentClipPath.parent = parentClipPath;
                    currentClipPath.updateTransform();
                    clipPaths.push(currentClipPath);
                    parentClipPath = currentClipPath;
                    currentClipPath = currentClipPath.clipPath;
                }
            }
            if (el.isGroup) {
                var children = el._children;
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    // Force to mark as dirty if group is dirty
                    // FIXME __dirtyPath ?
                    if (el.__dirty) {
                        child.__dirty = true;
                    }
                    this._updateAndAddDisplayable(child, clipPaths, includeIgnore);
                }
                // Mark group clean here
                el.__dirty = false;
            } else {
                el.__clipPaths = clipPaths;
                this._displayList[this._displayListLen++] = el;
            }
        },
        addRoot: function (el) {
            // Element has been added
            if (this._elements[el.id]) {
                return;
            }
            if (el instanceof Group) {
                el.addChildrenToStorage(this);
            }
            this.addToMap(el);
            this._roots.push(el);
        },
        delRoot: function (elId) {
            if (elId == null) {
                // 不指定elId清空
                for (var i = 0; i < this._roots.length; i++) {
                    var root = this._roots[i];
                    if (root instanceof Group) {
                        root.delChildrenFromStorage(this);
                    }
                }
                this._elements = {};
                this._roots = [];
                this._displayList = [];
                this._displayListLen = 0;
                return;
            }
            if (elId instanceof Array) {
                for (var i = 0, l = elId.length; i < l; i++) {
                    this.delRoot(elId[i]);
                }
                return;
            }
            var el;
            if (typeof elId == 'string') {
                el = this._elements[elId];
            } else {
                el = elId;
            }
            var idx = util.indexOf(this._roots, el);
            if (idx >= 0) {
                this.delFromMap(el.id);
                this._roots.splice(idx, 1);
                if (el instanceof Group) {
                    el.delChildrenFromStorage(this);
                }
            }
        },
        addToMap: function (el) {
            if (el instanceof Group) {
                el.__storage = this;
            }
            el.dirty(false);
            this._elements[el.id] = el;
            return this;
        },
        get: function (elId) {
            return this._elements[elId];
        },
        delFromMap: function (elId) {
            var elements = this._elements;
            var el = elements[elId];
            if (el) {
                delete elements[elId];
                if (el instanceof Group) {
                    el.__storage = null;
                }
            }
            return this;
        },
        dispose: function () {
            this._elements = this._renderList = this._roots = null;
        },
        displayableSortFunc: shapeCompareFunc
    };
    return Storage;
});
define('zrender/animation/Animation', ['require', '../core/util', '../core/event', './requestAnimationFrame', './Animator'], function (require) {
    'use strict';
    var util = require('../core/util');
    var Dispatcher = require('../core/event').Dispatcher;
    var requestAnimationFrame = require('./requestAnimationFrame');
    var Animator = require('./Animator');
    /**
     * @typedef {Object} IZRenderStage
     * @property {Function} update
     */
    /**
     * @alias module:zrender/animation/Animation
     * @constructor
     * @param {Object} [options]
     * @param {Function} [options.onframe]
     * @param {IZRenderStage} [options.stage]
     * @example
     *     var animation = new Animation();
     *     var obj = {
     *         x: 100,
     *         y: 100
     *     };
     *     animation.animate(node.position)
     *         .when(1000, {
     *             x: 500,
     *             y: 500
     *         })
     *         .when(2000, {
     *             x: 100,
     *             y: 100
     *         })
     *         .start('spline');
     */
    var Animation = function (options) {
        options = options || {};
        this.stage = options.stage || {};
        this.onframe = options.onframe || function () {
        };
        // private properties
        this._clips = [];
        this._running = false;
        this._time;
        this._pausedTime;
        this._pauseStart;
        this._paused = false;
        Dispatcher.call(this);
    };
    Animation.prototype = {
        constructor: Animation,
        addClip: function (clip) {
            this._clips.push(clip);
        },
        addAnimator: function (animator) {
            animator.animation = this;
            var clips = animator.getClips();
            for (var i = 0; i < clips.length; i++) {
                this.addClip(clips[i]);
            }
        },
        removeClip: function (clip) {
            var idx = util.indexOf(this._clips, clip);
            if (idx >= 0) {
                this._clips.splice(idx, 1);
            }
        },
        removeAnimator: function (animator) {
            var clips = animator.getClips();
            for (var i = 0; i < clips.length; i++) {
                this.removeClip(clips[i]);
            }
            animator.animation = null;
        },
        _update: function () {
            var time = new Date().getTime() - this._pausedTime;
            var delta = time - this._time;
            var clips = this._clips;
            var len = clips.length;
            var deferredEvents = [];
            var deferredClips = [];
            for (var i = 0; i < len; i++) {
                var clip = clips[i];
                var e = clip.step(time);
                // Throw out the events need to be called after
                // stage.update, like destroy
                if (e) {
                    deferredEvents.push(e);
                    deferredClips.push(clip);
                }
            }
            // Remove the finished clip
            for (var i = 0; i < len;) {
                if (clips[i]._needsRemove) {
                    clips[i] = clips[len - 1];
                    clips.pop();
                    len--;
                } else {
                    i++;
                }
            }
            len = deferredEvents.length;
            for (var i = 0; i < len; i++) {
                deferredClips[i].fire(deferredEvents[i]);
            }
            this._time = time;
            this.onframe(delta);
            this.trigger('frame', delta);
            if (this.stage.update) {
                this.stage.update();
            }
        },
        _startLoop: function () {
            var self = this;
            this._running = true;
            function step() {
                if (self._running) {
                    requestAnimationFrame(step);
                    !self._paused && self._update();
                }
            }
            requestAnimationFrame(step);
        },
        start: function () {
            this._time = new Date().getTime();
            this._pausedTime = 0;
            this._startLoop();
        },
        stop: function () {
            this._running = false;
        },
        pause: function () {
            if (!this._paused) {
                this._pauseStart = new Date().getTime();
                this._paused = true;
            }
        },
        resume: function () {
            if (this._paused) {
                this._pausedTime += new Date().getTime() - this._pauseStart;
                this._paused = false;
            }
        },
        clear: function () {
            this._clips = [];
        },
        animate: function (target, options) {
            options = options || {};
            var animator = new Animator(target, options.loop, options.getter, options.setter);
            this.addAnimator(animator);
            return animator;
        }
    };
    util.mixin(Animation, Dispatcher);
    return Animation;
});
define('zrender/dom/HandlerProxy', ['require', '../core/event', '../core/util', '../mixin/Eventful', '../core/env', '../core/GestureMgr'], function (require) {
    var eventTool = require('../core/event');
    var zrUtil = require('../core/util');
    var Eventful = require('../mixin/Eventful');
    var env = require('../core/env');
    var GestureMgr = require('../core/GestureMgr');
    var addEventListener = eventTool.addEventListener;
    var removeEventListener = eventTool.removeEventListener;
    var normalizeEvent = eventTool.normalizeEvent;
    var TOUCH_CLICK_DELAY = 300;
    var mouseHandlerNames = [
            'click',
            'dblclick',
            'mousewheel',
            'mouseout',
            'mouseup',
            'mousedown',
            'mousemove',
            'contextmenu'
        ];
    var touchHandlerNames = [
            'touchstart',
            'touchend',
            'touchmove'
        ];
    var pointerEventNames = {
            pointerdown: 1,
            pointerup: 1,
            pointermove: 1,
            pointerout: 1
        };
    var pointerHandlerNames = zrUtil.map(mouseHandlerNames, function (name) {
            var nm = name.replace('mouse', 'pointer');
            return pointerEventNames[nm] ? nm : name;
        });
    function eventNameFix(name) {
        return name === 'mousewheel' && env.browser.firefox ? 'DOMMouseScroll' : name;
    }
    function processGesture(proxy, event, stage) {
        var gestureMgr = proxy._gestureMgr;
        stage === 'start' && gestureMgr.clear();
        var gestureInfo = gestureMgr.recognize(event, proxy.handler.findHover(event.zrX, event.zrY, null), proxy.dom);
        stage === 'end' && gestureMgr.clear();
        // Do not do any preventDefault here. Upper application do that if necessary.
        if (gestureInfo) {
            var type = gestureInfo.type;
            event.gestureEvent = type;
            proxy.handler.dispatchToElement(gestureInfo.target, type, gestureInfo.event);
        }
    }
    // function onMSGestureChange(proxy, event) {
    //     if (event.translationX || event.translationY) {
    //         // mousemove is carried by MSGesture to reduce the sensitivity.
    //         proxy.handler.dispatchToElement(event.target, 'mousemove', event);
    //     }
    //     if (event.scale !== 1) {
    //         event.pinchX = event.offsetX;
    //         event.pinchY = event.offsetY;
    //         event.pinchScale = event.scale;
    //         proxy.handler.dispatchToElement(event.target, 'pinch', event);
    //     }
    // }
    /**
     * Prevent mouse event from being dispatched after Touch Events action
     * @see <https://github.com/deltakosh/handjs/blob/master/src/hand.base.js>
     * 1. Mobile browsers dispatch mouse events 300ms after touchend.
     * 2. Chrome for Android dispatch mousedown for long-touch about 650ms
     * Result: Blocking Mouse Events for 700ms.
     */
    function setTouchTimer(instance) {
        instance._touching = true;
        clearTimeout(instance._touchTimer);
        instance._touchTimer = setTimeout(function () {
            instance._touching = false;
        }, 700);
    }
    var domHandlers = {
            mousemove: function (event) {
                event = normalizeEvent(this.dom, event);
                this.trigger('mousemove', event);
            },
            mouseout: function (event) {
                event = normalizeEvent(this.dom, event);
                var element = event.toElement || event.relatedTarget;
                if (element != this.dom) {
                    while (element && element.nodeType != 9) {
                        // 忽略包含在root中的dom引起的mouseOut
                        if (element === this.dom) {
                            return;
                        }
                        element = element.parentNode;
                    }
                }
                this.trigger('mouseout', event);
            },
            touchstart: function (event) {
                // Default mouse behaviour should not be disabled here.
                // For example, page may needs to be slided.
                event = normalizeEvent(this.dom, event);
                // Mark touch, which is useful in distinguish touch and
                // mouse event in upper applicatoin.
                event.zrByTouch = true;
                this._lastTouchMoment = new Date();
                processGesture(this, event, 'start');
                // In touch device, trigger `mousemove`(`mouseover`) should
                // be triggered, and must before `mousedown` triggered.
                domHandlers.mousemove.call(this, event);
                domHandlers.mousedown.call(this, event);
                setTouchTimer(this);
            },
            touchmove: function (event) {
                event = normalizeEvent(this.dom, event);
                // Mark touch, which is useful in distinguish touch and
                // mouse event in upper applicatoin.
                event.zrByTouch = true;
                processGesture(this, event, 'change');
                // Mouse move should always be triggered no matter whether
                // there is gestrue event, because mouse move and pinch may
                // be used at the same time.
                domHandlers.mousemove.call(this, event);
                setTouchTimer(this);
            },
            touchend: function (event) {
                event = normalizeEvent(this.dom, event);
                // Mark touch, which is useful in distinguish touch and
                // mouse event in upper applicatoin.
                event.zrByTouch = true;
                processGesture(this, event, 'end');
                domHandlers.mouseup.call(this, event);
                // Do not trigger `mouseout` here, in spite of `mousemove`(`mouseover`) is
                // triggered in `touchstart`. This seems to be illogical, but by this mechanism,
                // we can conveniently implement "hover style" in both PC and touch device just
                // by listening to `mouseover` to add "hover style" and listening to `mouseout`
                // to remove "hover style" on an element, without any additional code for
                // compatibility. (`mouseout` will not be triggered in `touchend`, so "hover
                // style" will remain for user view)
                // click event should always be triggered no matter whether
                // there is gestrue event. System click can not be prevented.
                if (+new Date() - this._lastTouchMoment < TOUCH_CLICK_DELAY) {
                    domHandlers.click.call(this, event);
                }
                setTouchTimer(this);
            },
            pointerdown: function (event) {
                domHandlers.mousedown.call(this, event);    // if (useMSGuesture(this, event)) {
                                                            //     this._msGesture.addPointer(event.pointerId);
                                                            // }
            },
            pointermove: function (event) {
                // FIXME
                // pointermove is so sensitive that it always triggered when
                // tap(click) on touch screen, which affect some judgement in
                // upper application. So, we dont support mousemove on MS touch
                // device yet.
                if (!isPointerFromTouch(event)) {
                    domHandlers.mousemove.call(this, event);
                }
            },
            pointerup: function (event) {
                domHandlers.mouseup.call(this, event);
            },
            pointerout: function (event) {
                // pointerout will be triggered when tap on touch screen
                // (IE11+/Edge on MS Surface) after click event triggered,
                // which is inconsistent with the mousout behavior we defined
                // in touchend. So we unify them.
                // (check domHandlers.touchend for detailed explanation)
                if (!isPointerFromTouch(event)) {
                    domHandlers.mouseout.call(this, event);
                }
            }
        };
    function isPointerFromTouch(event) {
        var pointerType = event.pointerType;
        return pointerType === 'pen' || pointerType === 'touch';
    }
    // function useMSGuesture(handlerProxy, event) {
    //     return isPointerFromTouch(event) && !!handlerProxy._msGesture;
    // }
    // Common handlers
    zrUtil.each([
        'click',
        'mousedown',
        'mouseup',
        'mousewheel',
        'dblclick',
        'contextmenu'
    ], function (name) {
        domHandlers[name] = function (event) {
            event = normalizeEvent(this.dom, event);
            this.trigger(name, event);
        };
    });
    /**
     * 为控制类实例初始化dom 事件处理函数
     *
     * @inner
     * @param {module:zrender/Handler} instance 控制类实例
     */
    function initDomHandler(instance) {
        zrUtil.each(touchHandlerNames, function (name) {
            instance._handlers[name] = zrUtil.bind(domHandlers[name], instance);
        });
        zrUtil.each(pointerHandlerNames, function (name) {
            instance._handlers[name] = zrUtil.bind(domHandlers[name], instance);
        });
        zrUtil.each(mouseHandlerNames, function (name) {
            instance._handlers[name] = makeMouseHandler(domHandlers[name], instance);
        });
        function makeMouseHandler(fn, instance) {
            return function () {
                if (instance._touching) {
                    return;
                }
                return fn.apply(instance, arguments);
            };
        }
    }
    function HandlerDomProxy(dom) {
        Eventful.call(this);
        this.dom = dom;
        /**
         * @private
         * @type {boolean}
         */
        this._touching = false;
        /**
         * @private
         * @type {number}
         */
        this._touchTimer;
        /**
         * @private
         * @type {module:zrender/core/GestureMgr}
         */
        this._gestureMgr = new GestureMgr();
        this._handlers = {};
        initDomHandler(this);
        if (env.pointerEventsSupported) {
            // Only IE11+/Edge
            // 1. On devices that both enable touch and mouse (e.g., MS Surface and lenovo X240),
            // IE11+/Edge do not trigger touch event, but trigger pointer event and mouse event
            // at the same time.
            // 2. On MS Surface, it probablely only trigger mousedown but no mouseup when tap on
            // screen, which do not occurs in pointer event.
            // So we use pointer event to both detect touch gesture and mouse behavior.
            mountHandlers(pointerHandlerNames, this);    // FIXME
                                                         // Note: MS Gesture require CSS touch-action set. But touch-action is not reliable,
                                                         // which does not prevent defuault behavior occasionally (which may cause view port
                                                         // zoomed in but use can not zoom it back). And event.preventDefault() does not work.
                                                         // So we have to not to use MSGesture and not to support touchmove and pinch on MS
                                                         // touch screen. And we only support click behavior on MS touch screen now.
                                                         // MS Gesture Event is only supported on IE11+/Edge and on Windows 8+.
                                                         // We dont support touch on IE on win7.
                                                         // See <https://msdn.microsoft.com/en-us/library/dn433243(v=vs.85).aspx>
                                                         // if (typeof MSGesture === 'function') {
                                                         //     (this._msGesture = new MSGesture()).target = dom; // jshint ignore:line
                                                         //     dom.addEventListener('MSGestureChange', onMSGestureChange);
                                                         // }
        } else {
            if (env.touchEventsSupported) {
                mountHandlers(touchHandlerNames, this);    // Handler of 'mouseout' event is needed in touch mode, which will be mounted below.
                                                           // addEventListener(root, 'mouseout', this._mouseoutHandler);
            }
            // 1. Considering some devices that both enable touch and mouse event (like on MS Surface
            // and lenovo X240, @see #2350), we make mouse event be always listened, otherwise
            // mouse event can not be handle in those devices.
            // 2. On MS Surface, Chrome will trigger both touch event and mouse event. How to prevent
            // mouseevent after touch event triggered, see `setTouchTimer`.
            mountHandlers(mouseHandlerNames, this);
        }
        function mountHandlers(handlerNames, instance) {
            zrUtil.each(handlerNames, function (name) {
                addEventListener(dom, eventNameFix(name), instance._handlers[name]);
            }, instance);
        }
    }
    var handlerDomProxyProto = HandlerDomProxy.prototype;
    handlerDomProxyProto.dispose = function () {
        var handlerNames = mouseHandlerNames.concat(touchHandlerNames);
        for (var i = 0; i < handlerNames.length; i++) {
            var name = handlerNames[i];
            removeEventListener(this.dom, eventNameFix(name), this._handlers[name]);
        }
    };
    handlerDomProxyProto.setCursor = function (cursorStyle) {
        this.dom.style.cursor = cursorStyle || 'default';
    };
    zrUtil.mixin(HandlerDomProxy, Eventful);
    return HandlerDomProxy;
});
define('zrender/Painter', ['require', './config', './core/util', './core/log', './core/BoundingRect', './core/timsort', './Layer', './animation/requestAnimationFrame', './graphic/Image'], function (require) {
    'use strict';
    var config = require('./config');
    var util = require('./core/util');
    var log = require('./core/log');
    var BoundingRect = require('./core/BoundingRect');
    var timsort = require('./core/timsort');
    var Layer = require('./Layer');
    var requestAnimationFrame = require('./animation/requestAnimationFrame');
    // PENDIGN
    // Layer exceeds MAX_PROGRESSIVE_LAYER_NUMBER may have some problem when flush directly second time.
    //
    // Maximum progressive layer. When exceeding this number. All elements will be drawed in the last layer.
    var MAX_PROGRESSIVE_LAYER_NUMBER = 5;
    function parseInt10(val) {
        return parseInt(val, 10);
    }
    function isLayerValid(layer) {
        if (!layer) {
            return false;
        }
        if (layer.isBuildin) {
            return true;
        }
        if (typeof layer.resize !== 'function' || typeof layer.refresh !== 'function') {
            return false;
        }
        return true;
    }
    function preProcessLayer(layer) {
        layer.__unusedCount++;
    }
    function postProcessLayer(layer) {
        if (layer.__unusedCount == 1) {
            layer.clear();
        }
    }
    var tmpRect = new BoundingRect(0, 0, 0, 0);
    var viewRect = new BoundingRect(0, 0, 0, 0);
    function isDisplayableCulled(el, width, height) {
        tmpRect.copy(el.getBoundingRect());
        if (el.transform) {
            tmpRect.applyTransform(el.transform);
        }
        viewRect.width = width;
        viewRect.height = height;
        return !tmpRect.intersect(viewRect);
    }
    function isClipPathChanged(clipPaths, prevClipPaths) {
        if (clipPaths == prevClipPaths) {
            // Can both be null or undefined
            return false;
        }
        if (!clipPaths || !prevClipPaths || clipPaths.length !== prevClipPaths.length) {
            return true;
        }
        for (var i = 0; i < clipPaths.length; i++) {
            if (clipPaths[i] !== prevClipPaths[i]) {
                return true;
            }
        }
    }
    function doClip(clipPaths, ctx) {
        for (var i = 0; i < clipPaths.length; i++) {
            var clipPath = clipPaths[i];
            var path = clipPath.path;
            clipPath.setTransform(ctx);
            path.beginPath(ctx);
            clipPath.buildPath(path, clipPath.shape);
            ctx.clip();
            // Transform back
            clipPath.restoreTransform(ctx);
        }
    }
    function createRoot(width, height) {
        var domRoot = document.createElement('div');
        // domRoot.onselectstart = returnFalse; // 避免页面选中的尴尬
        domRoot.style.cssText = [
            'position:relative',
            'overflow:hidden',
            'width:' + width + 'px',
            'height:' + height + 'px',
            'padding:0',
            'margin:0',
            'border-width:0'
        ].join(';') + ';';
        return domRoot;
    }
    /**
     * @alias module:zrender/Painter
     * @constructor
     * @param {HTMLElement} root 绘图容器
     * @param {module:zrender/Storage} storage
     * @param {Ojbect} opts
     */
    var Painter = function (root, storage, opts) {
        // In node environment using node-canvas
        var singleCanvas = !root.nodeName || root.nodeName.toUpperCase() === 'CANVAS';
        this._opts = opts = util.extend({}, opts || {});
        /**
         * @type {number}
         */
        this.dpr = opts.devicePixelRatio || config.devicePixelRatio;
        /**
         * @type {boolean}
         * @private
         */
        this._singleCanvas = singleCanvas;
        /**
         * 绘图容器
         * @type {HTMLElement}
         */
        this.root = root;
        var rootStyle = root.style;
        if (rootStyle) {
            rootStyle['-webkit-tap-highlight-color'] = 'transparent';
            rootStyle['-webkit-user-select'] = rootStyle['user-select'] = rootStyle['-webkit-touch-callout'] = 'none';
            root.innerHTML = '';
        }
        /**
         * @type {module:zrender/Storage}
         */
        this.storage = storage;
        /**
         * @type {Array.<number>}
         * @private
         */
        var zlevelList = this._zlevelList = [];
        /**
         * @type {Object.<string, module:zrender/Layer>}
         * @private
         */
        var layers = this._layers = {};
        /**
         * @type {Object.<string, Object>}
         * @type {private}
         */
        this._layerConfig = {};
        if (!singleCanvas) {
            this._width = this._getSize(0);
            this._height = this._getSize(1);
            var domRoot = this._domRoot = createRoot(this._width, this._height);
            root.appendChild(domRoot);
        } else {
            // Use canvas width and height directly
            var width = root.width;
            var height = root.height;
            this._width = width;
            this._height = height;
            // Create layer if only one given canvas
            // Device pixel ratio is fixed to 1 because given canvas has its specified width and height
            var mainLayer = new Layer(root, this, 1);
            mainLayer.initContext();
            // FIXME Use canvas width and height
            // mainLayer.resize(width, height);
            layers[0] = mainLayer;
            zlevelList.push(0);
            this._domRoot = root;
        }
        this.pathToImage = this._createPathToImage();
        // Layers for progressive rendering
        this._progressiveLayers = [];
        /**
         * @type {module:zrender/Layer}
         * @private
         */
        this._hoverlayer;
        this._hoverElements = [];
    };
    Painter.prototype = {
        constructor: Painter,
        isSingleCanvas: function () {
            return this._singleCanvas;
        },
        getViewportRoot: function () {
            return this._domRoot;
        },
        refresh: function (paintAll) {
            var list = this.storage.getDisplayList(true);
            var zlevelList = this._zlevelList;
            this._paintList(list, paintAll);
            // Paint custum layers
            for (var i = 0; i < zlevelList.length; i++) {
                var z = zlevelList[i];
                var layer = this._layers[z];
                if (!layer.isBuildin && layer.refresh) {
                    layer.refresh();
                }
            }
            this.refreshHover();
            if (this._progressiveLayers.length) {
                this._startProgessive();
            }
            return this;
        },
        addHover: function (el, hoverStyle) {
            if (el.__hoverMir) {
                return;
            }
            var elMirror = new el.constructor({
                    style: el.style,
                    shape: el.shape
                });
            elMirror.__from = el;
            el.__hoverMir = elMirror;
            elMirror.setStyle(hoverStyle);
            this._hoverElements.push(elMirror);
        },
        removeHover: function (el) {
            var elMirror = el.__hoverMir;
            var hoverElements = this._hoverElements;
            var idx = util.indexOf(hoverElements, elMirror);
            if (idx >= 0) {
                hoverElements.splice(idx, 1);
            }
            el.__hoverMir = null;
        },
        clearHover: function (el) {
            var hoverElements = this._hoverElements;
            for (var i = 0; i < hoverElements.length; i++) {
                var from = hoverElements[i].__from;
                if (from) {
                    from.__hoverMir = null;
                }
            }
            hoverElements.length = 0;
        },
        refreshHover: function () {
            var hoverElements = this._hoverElements;
            var len = hoverElements.length;
            var hoverLayer = this._hoverlayer;
            hoverLayer && hoverLayer.clear();
            if (!len) {
                return;
            }
            timsort(hoverElements, this.storage.displayableSortFunc);
            // Use a extream large zlevel
            // FIXME?
            if (!hoverLayer) {
                hoverLayer = this._hoverlayer = this.getLayer(100000);
            }
            var scope = {};
            hoverLayer.ctx.save();
            for (var i = 0; i < len;) {
                var el = hoverElements[i];
                var originalEl = el.__from;
                // Original el is removed
                // PENDING
                if (!(originalEl && originalEl.__zr)) {
                    hoverElements.splice(i, 1);
                    originalEl.__hoverMir = null;
                    len--;
                    continue;
                }
                i++;
                // Use transform
                // FIXME style and shape ?
                if (!originalEl.invisible) {
                    el.transform = originalEl.transform;
                    el.invTransform = originalEl.invTransform;
                    el.__clipPaths = originalEl.__clipPaths;
                    // el.
                    this._doPaintEl(el, hoverLayer, true, scope);
                }
            }
            hoverLayer.ctx.restore();
        },
        _startProgessive: function () {
            var self = this;
            if (!self._furtherProgressive) {
                return;
            }
            // Use a token to stop progress steps triggered by
            // previous zr.refresh calling.
            var token = self._progressiveToken = +new Date();
            self._progress++;
            requestAnimationFrame(step);
            function step() {
                // In case refreshed or disposed
                if (token === self._progressiveToken && self.storage) {
                    self._doPaintList(self.storage.getDisplayList());
                    if (self._furtherProgressive) {
                        self._progress++;
                        requestAnimationFrame(step);
                    } else {
                        self._progressiveToken = -1;
                    }
                }
            }
        },
        _clearProgressive: function () {
            this._progressiveToken = -1;
            this._progress = 0;
            util.each(this._progressiveLayers, function (layer) {
                layer.__dirty && layer.clear();
            });
        },
        _paintList: function (list, paintAll) {
            if (paintAll == null) {
                paintAll = false;
            }
            this._updateLayerStatus(list);
            this._clearProgressive();
            this.eachBuildinLayer(preProcessLayer);
            this._doPaintList(list, paintAll);
            this.eachBuildinLayer(postProcessLayer);
        },
        _doPaintList: function (list, paintAll) {
            var currentLayer;
            var currentZLevel;
            var ctx;
            // var invTransform = [];
            var scope;
            var progressiveLayerIdx = 0;
            var currentProgressiveLayer;
            var width = this._width;
            var height = this._height;
            var layerProgress;
            var frame = this._progress;
            function flushProgressiveLayer(layer) {
                var dpr = ctx.dpr || 1;
                ctx.save();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                // Avoid layer don't clear in next progressive frame
                currentLayer.__dirty = true;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.drawImage(layer.dom, 0, 0, width * dpr, height * dpr);
                ctx.restore();
            }
            for (var i = 0, l = list.length; i < l; i++) {
                var el = list[i];
                var elZLevel = this._singleCanvas ? 0 : el.zlevel;
                var elFrame = el.__frame;
                // Flush at current context
                // PENDING
                if (elFrame < 0 && currentProgressiveLayer) {
                    flushProgressiveLayer(currentProgressiveLayer);
                    currentProgressiveLayer = null;
                }
                // Change draw layer
                if (currentZLevel !== elZLevel) {
                    if (ctx) {
                        ctx.restore();
                    }
                    // Reset scope
                    scope = {};
                    // Only 0 zlevel if only has one canvas
                    currentZLevel = elZLevel;
                    currentLayer = this.getLayer(currentZLevel);
                    if (!currentLayer.isBuildin) {
                        log('ZLevel ' + currentZLevel + ' has been used by unkown layer ' + currentLayer.id);
                    }
                    ctx = currentLayer.ctx;
                    ctx.save();
                    // Reset the count
                    currentLayer.__unusedCount = 0;
                    if (currentLayer.__dirty || paintAll) {
                        currentLayer.clear();
                    }
                }
                if (!(currentLayer.__dirty || paintAll)) {
                    continue;
                }
                if (elFrame >= 0) {
                    // Progressive layer changed
                    if (!currentProgressiveLayer) {
                        currentProgressiveLayer = this._progressiveLayers[Math.min(progressiveLayerIdx++, MAX_PROGRESSIVE_LAYER_NUMBER - 1)];
                        currentProgressiveLayer.ctx.save();
                        currentProgressiveLayer.renderScope = {};
                        if (currentProgressiveLayer && currentProgressiveLayer.__progress > currentProgressiveLayer.__maxProgress) {
                            // flushProgressiveLayer(currentProgressiveLayer);
                            // Quick jump all progressive elements
                            // All progressive element are not dirty, jump over and flush directly
                            i = currentProgressiveLayer.__nextIdxNotProg - 1;
                            // currentProgressiveLayer = null;
                            continue;
                        }
                        layerProgress = currentProgressiveLayer.__progress;
                        if (!currentProgressiveLayer.__dirty) {
                            // Keep rendering
                            frame = layerProgress;
                        }
                        currentProgressiveLayer.__progress = frame + 1;
                    }
                    if (elFrame === frame) {
                        this._doPaintEl(el, currentProgressiveLayer, true, currentProgressiveLayer.renderScope);
                    }
                } else {
                    this._doPaintEl(el, currentLayer, paintAll, scope);
                }
                el.__dirty = false;
            }
            if (currentProgressiveLayer) {
                flushProgressiveLayer(currentProgressiveLayer);
            }
            // Restore the lastLayer ctx
            ctx && ctx.restore();
            // If still has clipping state
            // if (scope.prevElClipPaths) {
            //     ctx.restore();
            // }
            this._furtherProgressive = false;
            util.each(this._progressiveLayers, function (layer) {
                if (layer.__maxProgress >= layer.__progress) {
                    this._furtherProgressive = true;
                }
            }, this);
        },
        _doPaintEl: function (el, currentLayer, forcePaint, scope) {
            var ctx = currentLayer.ctx;
            var m = el.transform;
            if ((currentLayer.__dirty || forcePaint) && !el.invisible && el.style.opacity !== 0 && !(m && !m[0] && !m[3]) && !(el.culling && isDisplayableCulled(el, this._width, this._height))) {
                var clipPaths = el.__clipPaths;
                // Optimize when clipping on group with several elements
                if (scope.prevClipLayer !== currentLayer || isClipPathChanged(clipPaths, scope.prevElClipPaths)) {
                    // If has previous clipping state, restore from it
                    if (scope.prevElClipPaths) {
                        scope.prevClipLayer.ctx.restore();
                        scope.prevClipLayer = scope.prevElClipPaths = null;
                        // Reset prevEl since context has been restored
                        scope.prevEl = null;
                    }
                    // New clipping state
                    if (clipPaths) {
                        ctx.save();
                        doClip(clipPaths, ctx);
                        scope.prevClipLayer = currentLayer;
                        scope.prevElClipPaths = clipPaths;
                    }
                }
                el.beforeBrush && el.beforeBrush(ctx);
                el.brush(ctx, scope.prevEl || null);
                scope.prevEl = el;
                el.afterBrush && el.afterBrush(ctx);
            }
        },
        getLayer: function (zlevel) {
            if (this._singleCanvas) {
                return this._layers[0];
            }
            var layer = this._layers[zlevel];
            if (!layer) {
                // Create a new layer
                layer = new Layer('zr_' + zlevel, this, this.dpr);
                layer.isBuildin = true;
                if (this._layerConfig[zlevel]) {
                    util.merge(layer, this._layerConfig[zlevel], true);
                }
                this.insertLayer(zlevel, layer);
                // Context is created after dom inserted to document
                // Or excanvas will get 0px clientWidth and clientHeight
                layer.initContext();
            }
            return layer;
        },
        insertLayer: function (zlevel, layer) {
            var layersMap = this._layers;
            var zlevelList = this._zlevelList;
            var len = zlevelList.length;
            var prevLayer = null;
            var i = -1;
            var domRoot = this._domRoot;
            if (layersMap[zlevel]) {
                log('ZLevel ' + zlevel + ' has been used already');
                return;
            }
            // Check if is a valid layer
            if (!isLayerValid(layer)) {
                log('Layer of zlevel ' + zlevel + ' is not valid');
                return;
            }
            if (len > 0 && zlevel > zlevelList[0]) {
                for (i = 0; i < len - 1; i++) {
                    if (zlevelList[i] < zlevel && zlevelList[i + 1] > zlevel) {
                        break;
                    }
                }
                prevLayer = layersMap[zlevelList[i]];
            }
            zlevelList.splice(i + 1, 0, zlevel);
            if (prevLayer) {
                var prevDom = prevLayer.dom;
                if (prevDom.nextSibling) {
                    domRoot.insertBefore(layer.dom, prevDom.nextSibling);
                } else {
                    domRoot.appendChild(layer.dom);
                }
            } else {
                if (domRoot.firstChild) {
                    domRoot.insertBefore(layer.dom, domRoot.firstChild);
                } else {
                    domRoot.appendChild(layer.dom);
                }
            }
            layersMap[zlevel] = layer;
        },
        eachLayer: function (cb, context) {
            var zlevelList = this._zlevelList;
            var z;
            var i;
            for (i = 0; i < zlevelList.length; i++) {
                z = zlevelList[i];
                cb.call(context, this._layers[z], z);
            }
        },
        eachBuildinLayer: function (cb, context) {
            var zlevelList = this._zlevelList;
            var layer;
            var z;
            var i;
            for (i = 0; i < zlevelList.length; i++) {
                z = zlevelList[i];
                layer = this._layers[z];
                if (layer.isBuildin) {
                    cb.call(context, layer, z);
                }
            }
        },
        eachOtherLayer: function (cb, context) {
            var zlevelList = this._zlevelList;
            var layer;
            var z;
            var i;
            for (i = 0; i < zlevelList.length; i++) {
                z = zlevelList[i];
                layer = this._layers[z];
                if (!layer.isBuildin) {
                    cb.call(context, layer, z);
                }
            }
        },
        getLayers: function () {
            return this._layers;
        },
        _updateLayerStatus: function (list) {
            var layers = this._layers;
            var progressiveLayers = this._progressiveLayers;
            var elCountsLastFrame = {};
            var progressiveElCountsLastFrame = {};
            this.eachBuildinLayer(function (layer, z) {
                elCountsLastFrame[z] = layer.elCount;
                layer.elCount = 0;
                layer.__dirty = false;
            });
            util.each(progressiveLayers, function (layer, idx) {
                progressiveElCountsLastFrame[idx] = layer.elCount;
                layer.elCount = 0;
                layer.__dirty = false;
            });
            var progressiveLayerCount = 0;
            var currentProgressiveLayer;
            var lastProgressiveKey;
            var frameCount = 0;
            for (var i = 0, l = list.length; i < l; i++) {
                var el = list[i];
                var zlevel = this._singleCanvas ? 0 : el.zlevel;
                var layer = layers[zlevel];
                var elProgress = el.progressive;
                if (layer) {
                    layer.elCount++;
                    layer.__dirty = layer.__dirty || el.__dirty;
                }
                /////// Update progressive
                if (elProgress >= 0) {
                    // Fix wrong progressive sequence problem.
                    if (lastProgressiveKey !== elProgress) {
                        lastProgressiveKey = elProgress;
                        frameCount++;
                    }
                    var elFrame = el.__frame = frameCount - 1;
                    if (!currentProgressiveLayer) {
                        var idx = Math.min(progressiveLayerCount, MAX_PROGRESSIVE_LAYER_NUMBER - 1);
                        currentProgressiveLayer = progressiveLayers[idx];
                        if (!currentProgressiveLayer) {
                            currentProgressiveLayer = progressiveLayers[idx] = new Layer('progressive', this, this.dpr);
                            currentProgressiveLayer.initContext();
                        }
                        currentProgressiveLayer.__maxProgress = 0;
                    }
                    currentProgressiveLayer.__dirty = currentProgressiveLayer.__dirty || el.__dirty;
                    currentProgressiveLayer.elCount++;
                    currentProgressiveLayer.__maxProgress = Math.max(currentProgressiveLayer.__maxProgress, elFrame);
                    if (currentProgressiveLayer.__maxProgress >= currentProgressiveLayer.__progress) {
                        // Should keep rendering this  layer because progressive rendering is not finished yet
                        layer.__dirty = true;
                    }
                } else {
                    el.__frame = -1;
                    if (currentProgressiveLayer) {
                        currentProgressiveLayer.__nextIdxNotProg = i;
                        progressiveLayerCount++;
                        currentProgressiveLayer = null;
                    }
                }
            }
            if (currentProgressiveLayer) {
                progressiveLayerCount++;
                currentProgressiveLayer.__nextIdxNotProg = i;
            }
            // 层中的元素数量有发生变化
            this.eachBuildinLayer(function (layer, z) {
                if (elCountsLastFrame[z] !== layer.elCount) {
                    layer.__dirty = true;
                }
            });
            progressiveLayers.length = Math.min(progressiveLayerCount, MAX_PROGRESSIVE_LAYER_NUMBER);
            util.each(progressiveLayers, function (layer, idx) {
                if (progressiveElCountsLastFrame[idx] !== layer.elCount) {
                    el.__dirty = true;
                }
                if (layer.__dirty) {
                    layer.__progress = 0;
                }
            });
        },
        clear: function () {
            this.eachBuildinLayer(this._clearLayer);
            return this;
        },
        _clearLayer: function (layer) {
            layer.clear();
        },
        configLayer: function (zlevel, config) {
            if (config) {
                var layerConfig = this._layerConfig;
                if (!layerConfig[zlevel]) {
                    layerConfig[zlevel] = config;
                } else {
                    util.merge(layerConfig[zlevel], config, true);
                }
                var layer = this._layers[zlevel];
                if (layer) {
                    util.merge(layer, layerConfig[zlevel], true);
                }
            }
        },
        delLayer: function (zlevel) {
            var layers = this._layers;
            var zlevelList = this._zlevelList;
            var layer = layers[zlevel];
            if (!layer) {
                return;
            }
            layer.dom.parentNode.removeChild(layer.dom);
            delete layers[zlevel];
            zlevelList.splice(util.indexOf(zlevelList, zlevel), 1);
        },
        resize: function (width, height) {
            var domRoot = this._domRoot;
            // FIXME Why ?
            domRoot.style.display = 'none';
            // Save input w/h
            var opts = this._opts;
            width != null && (opts.width = width);
            height != null && (opts.height = height);
            width = this._getSize(0);
            height = this._getSize(1);
            domRoot.style.display = '';
            // 优化没有实际改变的resize
            if (this._width != width || height != this._height) {
                domRoot.style.width = width + 'px';
                domRoot.style.height = height + 'px';
                for (var id in this._layers) {
                    if (this._layers.hasOwnProperty(id)) {
                        this._layers[id].resize(width, height);
                    }
                }
                util.each(this._progressiveLayers, function (layer) {
                    layer.resize(width, height);
                });
                this.refresh(true);
            }
            this._width = width;
            this._height = height;
            return this;
        },
        clearLayer: function (zlevel) {
            var layer = this._layers[zlevel];
            if (layer) {
                layer.clear();
            }
        },
        dispose: function () {
            this.root.innerHTML = '';
            this.root = this.storage = this._domRoot = this._layers = null;
        },
        getRenderedCanvas: function (opts) {
            opts = opts || {};
            if (this._singleCanvas) {
                return this._layers[0].dom;
            }
            var imageLayer = new Layer('image', this, opts.pixelRatio || this.dpr);
            imageLayer.initContext();
            imageLayer.clearColor = opts.backgroundColor;
            imageLayer.clear();
            var displayList = this.storage.getDisplayList(true);
            var scope = {};
            for (var i = 0; i < displayList.length; i++) {
                var el = displayList[i];
                this._doPaintEl(el, imageLayer, true, scope);
            }
            return imageLayer.dom;
        },
        getWidth: function () {
            return this._width;
        },
        getHeight: function () {
            return this._height;
        },
        _getSize: function (whIdx) {
            var opts = this._opts;
            var wh = [
                    'width',
                    'height'
                ][whIdx];
            var cwh = [
                    'clientWidth',
                    'clientHeight'
                ][whIdx];
            var plt = [
                    'paddingLeft',
                    'paddingTop'
                ][whIdx];
            var prb = [
                    'paddingRight',
                    'paddingBottom'
                ][whIdx];
            if (opts[wh] != null && opts[wh] !== 'auto') {
                return parseFloat(opts[wh]);
            }
            var root = this.root;
            var stl = document.defaultView.getComputedStyle(root);
            return (root[cwh] || parseInt10(stl[wh]) || parseInt10(root.style[wh])) - (parseInt10(stl[plt]) || 0) - (parseInt10(stl[prb]) || 0) | 0;
        },
        _pathToImage: function (id, path, width, height, dpr) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.clearRect(0, 0, width * dpr, height * dpr);
            var pathTransform = {
                    position: path.position,
                    rotation: path.rotation,
                    scale: path.scale
                };
            path.position = [
                0,
                0,
                0
            ];
            path.rotation = 0;
            path.scale = [
                1,
                1
            ];
            if (path) {
                path.brush(ctx);
            }
            var ImageShape = require('./graphic/Image');
            var imgShape = new ImageShape({
                    id: id,
                    style: {
                        x: 0,
                        y: 0,
                        image: canvas
                    }
                });
            if (pathTransform.position != null) {
                imgShape.position = path.position = pathTransform.position;
            }
            if (pathTransform.rotation != null) {
                imgShape.rotation = path.rotation = pathTransform.rotation;
            }
            if (pathTransform.scale != null) {
                imgShape.scale = path.scale = pathTransform.scale;
            }
            return imgShape;
        },
        _createPathToImage: function () {
            var me = this;
            return function (id, e, width, height) {
                return me._pathToImage(id, e, width, height, me.dpr);
            };
        }
    };
    return Painter;
});
define('zrender/mixin/Draggable', ['require'], function (require) {
    function Draggable() {
        this.on('mousedown', this._dragStart, this);
        this.on('mousemove', this._drag, this);
        this.on('mouseup', this._dragEnd, this);
        this.on('globalout', this._dragEnd, this);    // this._dropTarget = null;
                                                      // this._draggingTarget = null;
                                                      // this._x = 0;
                                                      // this._y = 0;
    }
    Draggable.prototype = {
        constructor: Draggable,
        _dragStart: function (e) {
            var draggingTarget = e.target;
            if (draggingTarget && draggingTarget.draggable) {
                this._draggingTarget = draggingTarget;
                draggingTarget.dragging = true;
                this._x = e.offsetX;
                this._y = e.offsetY;
                this.dispatchToElement(draggingTarget, 'dragstart', e.event);
            }
        },
        _drag: function (e) {
            var draggingTarget = this._draggingTarget;
            if (draggingTarget) {
                var x = e.offsetX;
                var y = e.offsetY;
                var dx = x - this._x;
                var dy = y - this._y;
                this._x = x;
                this._y = y;
                draggingTarget.drift(dx, dy, e);
                this.dispatchToElement(draggingTarget, 'drag', e.event);
                var dropTarget = this.findHover(x, y, draggingTarget);
                var lastDropTarget = this._dropTarget;
                this._dropTarget = dropTarget;
                if (draggingTarget !== dropTarget) {
                    if (lastDropTarget && dropTarget !== lastDropTarget) {
                        this.dispatchToElement(lastDropTarget, 'dragleave', e.event);
                    }
                    if (dropTarget && dropTarget !== lastDropTarget) {
                        this.dispatchToElement(dropTarget, 'dragenter', e.event);
                    }
                }
            }
        },
        _dragEnd: function (e) {
            var draggingTarget = this._draggingTarget;
            if (draggingTarget) {
                draggingTarget.dragging = false;
            }
            this.dispatchToElement(draggingTarget, 'dragend', e.event);
            if (this._dropTarget) {
                this.dispatchToElement(this._dropTarget, 'drop', e.event);
            }
            this._draggingTarget = null;
            this._dropTarget = null;
        }
    };
    return Draggable;
});
define('zrender/core/event', ['require', '../mixin/Eventful', './env'], function (require) {
    'use strict';
    var Eventful = require('../mixin/Eventful');
    var env = require('./env');
    var isDomLevel2 = typeof window !== 'undefined' && !!window.addEventListener;
    function getBoundingClientRect(el) {
        // BlackBerry 5, iOS 3 (original iPhone) don't have getBoundingRect
        return el.getBoundingClientRect ? el.getBoundingClientRect() : {
            left: 0,
            top: 0
        };
    }
    // `calculate` is optional, default false
    function clientToLocal(el, e, out, calculate) {
        out = out || {};
        // According to the W3C Working Draft, offsetX and offsetY should be relative
        // to the padding edge of the target element. The only browser using this convention
        // is IE. Webkit uses the border edge, Opera uses the content edge, and FireFox does
        // not support the properties.
        // (see http://www.jacklmoore.com/notes/mouse-position/)
        // In zr painter.dom, padding edge equals to border edge.
        // FIXME
        // When mousemove event triggered on ec tooltip, target is not zr painter.dom, and
        // offsetX/Y is relative to e.target, where the calculation of zrX/Y via offsetX/Y
        // is too complex. So css-transfrom dont support in this case temporarily.
        if (calculate || !env.canvasSupported) {
            defaultGetZrXY(el, e, out);
        }    // Caution: In FireFox, layerX/layerY Mouse position relative to the closest positioned
             // ancestor element, so we should make sure el is positioned (e.g., not position:static).
             // BTW1, Webkit don't return the same results as FF in non-simple cases (like add
             // zoom-factor, overflow / opacity layers, transforms ...)
             // BTW2, (ev.offsetY || ev.pageY - $(ev.target).offset().top) is not correct in preserve-3d.
             // <https://bugs.jquery.com/ticket/8523#comment:14>
             // BTW3, In ff, offsetX/offsetY is always 0.
        else if (env.browser.firefox && e.layerX != null && e.layerX !== e.offsetX) {
            out.zrX = e.layerX;
            out.zrY = e.layerY;
        }    // For IE6+, chrome, safari, opera. (When will ff support offsetX?)
        else if (e.offsetX != null) {
            out.zrX = e.offsetX;
            out.zrY = e.offsetY;
        }    // For some other device, e.g., IOS safari.
        else {
            defaultGetZrXY(el, e, out);
        }
        return out;
    }
    function defaultGetZrXY(el, e, out) {
        // This well-known method below does not support css transform.
        var box = getBoundingClientRect(el);
        out.zrX = e.clientX - box.left;
        out.zrY = e.clientY - box.top;
    }
    /**
     * 如果存在第三方嵌入的一些dom触发的事件，或touch事件，需要转换一下事件坐标.
     * `calculate` is optional, default false.
     */
    function normalizeEvent(el, e, calculate) {
        e = e || window.event;
        if (e.zrX != null) {
            return e;
        }
        var eventType = e.type;
        var isTouch = eventType && eventType.indexOf('touch') >= 0;
        if (!isTouch) {
            clientToLocal(el, e, e, calculate);
            e.zrDelta = e.wheelDelta ? e.wheelDelta / 120 : -(e.detail || 0) / 3;
        } else {
            var touch = eventType != 'touchend' ? e.targetTouches[0] : e.changedTouches[0];
            touch && clientToLocal(el, touch, e, calculate);
        }
        return e;
    }
    function addEventListener(el, name, handler) {
        if (isDomLevel2) {
            el.addEventListener(name, handler);
        } else {
            el.attachEvent('on' + name, handler);
        }
    }
    function removeEventListener(el, name, handler) {
        if (isDomLevel2) {
            el.removeEventListener(name, handler);
        } else {
            el.detachEvent('on' + name, handler);
        }
    }
    /**
     * preventDefault and stopPropagation.
     * Notice: do not do that in zrender. Upper application
     * do that if necessary.
     *
     * @memberOf module:zrender/core/event
     * @method
     * @param {Event} e : event对象
     */
    var stop = isDomLevel2 ? function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.cancelBubble = true;
        } : function (e) {
            e.returnValue = false;
            e.cancelBubble = true;
        };
    return {
        clientToLocal: clientToLocal,
        normalizeEvent: normalizeEvent,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        stop: stop,
        Dispatcher: Eventful
    };
});
define('zrender/animation/requestAnimationFrame', ['require'], function (require) {
    return typeof window !== 'undefined' && (window.requestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame) || function (func) {
        setTimeout(func, 16);
    };
});
define('zrender/core/GestureMgr', ['require', './event'], function (require) {
    'use strict';
    var eventUtil = require('./event');
    var GestureMgr = function () {
        /**
         * @private
         * @type {Array.<Object>}
         */
        this._track = [];
    };
    GestureMgr.prototype = {
        constructor: GestureMgr,
        recognize: function (event, target, root) {
            this._doTrack(event, target, root);
            return this._recognize(event);
        },
        clear: function () {
            this._track.length = 0;
            return this;
        },
        _doTrack: function (event, target, root) {
            var touches = event.touches;
            if (!touches) {
                return;
            }
            var trackItem = {
                    points: [],
                    touches: [],
                    target: target,
                    event: event
                };
            for (var i = 0, len = touches.length; i < len; i++) {
                var touch = touches[i];
                var pos = eventUtil.clientToLocal(root, touch, {});
                trackItem.points.push([
                    pos.zrX,
                    pos.zrY
                ]);
                trackItem.touches.push(touch);
            }
            this._track.push(trackItem);
        },
        _recognize: function (event) {
            for (var eventName in recognizers) {
                if (recognizers.hasOwnProperty(eventName)) {
                    var gestureInfo = recognizers[eventName](this._track, event);
                    if (gestureInfo) {
                        return gestureInfo;
                    }
                }
            }
        }
    };
    function dist(pointPair) {
        var dx = pointPair[1][0] - pointPair[0][0];
        var dy = pointPair[1][1] - pointPair[0][1];
        return Math.sqrt(dx * dx + dy * dy);
    }
    function center(pointPair) {
        return [
            (pointPair[0][0] + pointPair[1][0]) / 2,
            (pointPair[0][1] + pointPair[1][1]) / 2
        ];
    }
    var recognizers = {
            pinch: function (track, event) {
                var trackLen = track.length;
                if (!trackLen) {
                    return;
                }
                var pinchEnd = (track[trackLen - 1] || {}).points;
                var pinchPre = (track[trackLen - 2] || {}).points || pinchEnd;
                if (pinchPre && pinchPre.length > 1 && pinchEnd && pinchEnd.length > 1) {
                    var pinchScale = dist(pinchEnd) / dist(pinchPre);
                    !isFinite(pinchScale) && (pinchScale = 1);
                    event.pinchScale = pinchScale;
                    var pinchCenter = center(pinchEnd);
                    event.pinchX = pinchCenter[0];
                    event.pinchY = pinchCenter[1];
                    return {
                        type: 'pinch',
                        target: track[0].target,
                        event: event
                    };
                }
            }    // Only pinch currently.
        };
    return GestureMgr;
});
define('zrender/Layer', ['require', './core/util', './config', './graphic/Style', './graphic/Pattern'], function (require) {
    var util = require('./core/util');
    var config = require('./config');
    var Style = require('./graphic/Style');
    var Pattern = require('./graphic/Pattern');
    function returnFalse() {
        return false;
    }
    /**
     * 创建dom
     *
     * @inner
     * @param {string} id dom id 待用
     * @param {string} type dom type，such as canvas, div etc.
     * @param {Painter} painter painter instance
     * @param {number} number
     */
    function createDom(id, type, painter, dpr) {
        var newDom = document.createElement(type);
        var width = painter.getWidth();
        var height = painter.getHeight();
        var newDomStyle = newDom.style;
        // 没append呢，请原谅我这样写，清晰~
        newDomStyle.position = 'absolute';
        newDomStyle.left = 0;
        newDomStyle.top = 0;
        newDomStyle.width = width + 'px';
        newDomStyle.height = height + 'px';
        newDom.width = width * dpr;
        newDom.height = height * dpr;
        // id不作为索引用，避免可能造成的重名，定义为私有属性
        newDom.setAttribute('data-zr-dom-id', id);
        return newDom;
    }
    /**
     * @alias module:zrender/Layer
     * @constructor
     * @extends module:zrender/mixin/Transformable
     * @param {string} id
     * @param {module:zrender/Painter} painter
     * @param {number} [dpr]
     */
    var Layer = function (id, painter, dpr) {
        var dom;
        dpr = dpr || config.devicePixelRatio;
        if (typeof id === 'string') {
            dom = createDom(id, 'canvas', painter, dpr);
        }    // Not using isDom because in node it will return false
        else if (util.isObject(id)) {
            dom = id;
            id = dom.id;
        }
        this.id = id;
        this.dom = dom;
        var domStyle = dom.style;
        if (domStyle) {
            // Not in node
            dom.onselectstart = returnFalse;
            // 避免页面选中的尴尬
            domStyle['-webkit-user-select'] = 'none';
            domStyle['user-select'] = 'none';
            domStyle['-webkit-touch-callout'] = 'none';
            domStyle['-webkit-tap-highlight-color'] = 'rgba(0,0,0,0)';
            domStyle['padding'] = 0;
            domStyle['margin'] = 0;
            domStyle['border-width'] = 0;
        }
        this.domBack = null;
        this.ctxBack = null;
        this.painter = painter;
        this.config = null;
        // Configs
        /**
         * 每次清空画布的颜色
         * @type {string}
         * @default 0
         */
        this.clearColor = 0;
        /**
         * 是否开启动态模糊
         * @type {boolean}
         * @default false
         */
        this.motionBlur = false;
        /**
         * 在开启动态模糊的时候使用，与上一帧混合的alpha值，值越大尾迹越明显
         * @type {number}
         * @default 0.7
         */
        this.lastFrameAlpha = 0.7;
        /**
         * Layer dpr
         * @type {number}
         */
        this.dpr = dpr;
    };
    Layer.prototype = {
        constructor: Layer,
        elCount: 0,
        __dirty: true,
        initContext: function () {
            this.ctx = this.dom.getContext('2d');
            this.ctx.dpr = this.dpr;
        },
        createBackBuffer: function () {
            var dpr = this.dpr;
            this.domBack = createDom('back-' + this.id, 'canvas', this.painter, dpr);
            this.ctxBack = this.domBack.getContext('2d');
            if (dpr != 1) {
                this.ctxBack.scale(dpr, dpr);
            }
        },
        resize: function (width, height) {
            var dpr = this.dpr;
            var dom = this.dom;
            var domStyle = dom.style;
            var domBack = this.domBack;
            domStyle.width = width + 'px';
            domStyle.height = height + 'px';
            dom.width = width * dpr;
            dom.height = height * dpr;
            if (domBack) {
                domBack.width = width * dpr;
                domBack.height = height * dpr;
                if (dpr != 1) {
                    this.ctxBack.scale(dpr, dpr);
                }
            }
        },
        clear: function (clearAll) {
            var dom = this.dom;
            var ctx = this.ctx;
            var width = dom.width;
            var height = dom.height;
            var clearColor = this.clearColor;
            var haveMotionBLur = this.motionBlur && !clearAll;
            var lastFrameAlpha = this.lastFrameAlpha;
            var dpr = this.dpr;
            if (haveMotionBLur) {
                if (!this.domBack) {
                    this.createBackBuffer();
                }
                this.ctxBack.globalCompositeOperation = 'copy';
                this.ctxBack.drawImage(dom, 0, 0, width / dpr, height / dpr);
            }
            ctx.clearRect(0, 0, width, height);
            if (clearColor) {
                var clearColorGradientOrPattern;
                // Gradient
                if (clearColor.colorStops) {
                    // Cache canvas gradient
                    clearColorGradientOrPattern = clearColor.__canvasGradient || Style.getGradient(ctx, clearColor, {
                        x: 0,
                        y: 0,
                        width: width,
                        height: height
                    });
                    clearColor.__canvasGradient = clearColorGradientOrPattern;
                }    // Pattern
                else if (clearColor.image) {
                    clearColorGradientOrPattern = Pattern.prototype.getCanvasPattern.call(clearColor, ctx);
                }
                ctx.save();
                ctx.fillStyle = clearColorGradientOrPattern || clearColor;
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
            if (haveMotionBLur) {
                var domBack = this.domBack;
                ctx.save();
                ctx.globalAlpha = lastFrameAlpha;
                ctx.drawImage(domBack, 0, 0, width, height);
                ctx.restore();
            }
        }
    };
    return Layer;
});
define('echarts/preprocessor/helper/compatStyle', ['require', 'zrender/core/util'], function (require) {
    var zrUtil = require('zrender/core/util');
    var POSSIBLE_STYLES = [
            'areaStyle',
            'lineStyle',
            'nodeStyle',
            'linkStyle',
            'chordStyle',
            'label',
            'labelLine'
        ];
    function compatItemStyle(opt) {
        var itemStyleOpt = opt && opt.itemStyle;
        if (itemStyleOpt) {
            zrUtil.each(POSSIBLE_STYLES, function (styleName) {
                var normalItemStyleOpt = itemStyleOpt.normal;
                var emphasisItemStyleOpt = itemStyleOpt.emphasis;
                if (normalItemStyleOpt && normalItemStyleOpt[styleName]) {
                    opt[styleName] = opt[styleName] || {};
                    if (!opt[styleName].normal) {
                        opt[styleName].normal = normalItemStyleOpt[styleName];
                    } else {
                        zrUtil.merge(opt[styleName].normal, normalItemStyleOpt[styleName]);
                    }
                    normalItemStyleOpt[styleName] = null;
                }
                if (emphasisItemStyleOpt && emphasisItemStyleOpt[styleName]) {
                    opt[styleName] = opt[styleName] || {};
                    if (!opt[styleName].emphasis) {
                        opt[styleName].emphasis = emphasisItemStyleOpt[styleName];
                    } else {
                        zrUtil.merge(opt[styleName].emphasis, emphasisItemStyleOpt[styleName]);
                    }
                    emphasisItemStyleOpt[styleName] = null;
                }
            });
        }
    }
    return function (seriesOpt) {
        if (!seriesOpt) {
            return;
        }
        compatItemStyle(seriesOpt);
        compatItemStyle(seriesOpt.markPoint);
        compatItemStyle(seriesOpt.markLine);
        var data = seriesOpt.data;
        if (data) {
            for (var i = 0; i < data.length; i++) {
                compatItemStyle(data[i]);
            }
            // mark point data
            var markPoint = seriesOpt.markPoint;
            if (markPoint && markPoint.data) {
                var mpData = markPoint.data;
                for (var i = 0; i < mpData.length; i++) {
                    compatItemStyle(mpData[i]);
                }
            }
            // mark line data
            var markLine = seriesOpt.markLine;
            if (markLine && markLine.data) {
                var mlData = markLine.data;
                for (var i = 0; i < mlData.length; i++) {
                    if (zrUtil.isArray(mlData[i])) {
                        compatItemStyle(mlData[i][0]);
                        compatItemStyle(mlData[i][1]);
                    } else {
                        compatItemStyle(mlData[i]);
                    }
                }
            }
        }
    };
});
define('echarts/component/axis/AxisView', ['require', 'zrender/core/util', '../../util/graphic', './AxisBuilder', '../../echarts'], function (require) {
    var zrUtil = require('zrender/core/util');
    var graphic = require('../../util/graphic');
    var AxisBuilder = require('./AxisBuilder');
    var ifIgnoreOnTick = AxisBuilder.ifIgnoreOnTick;
    var getInterval = AxisBuilder.getInterval;
    var axisBuilderAttrs = [
            'axisLine',
            'axisLabel',
            'axisTick',
            'axisName'
        ];
    var selfBuilderAttrs = [
            'splitArea',
            'splitLine'
        ];
    // function getAlignWithLabel(model, axisModel) {
    //     var alignWithLabel = model.get('alignWithLabel');
    //     if (alignWithLabel === 'auto') {
    //         alignWithLabel = axisModel.get('axisTick.alignWithLabel');
    //     }
    //     return alignWithLabel;
    // }
    var AxisView = require('../../echarts').extendComponentView({
            type: 'axis',
            render: function (axisModel, ecModel) {
                this.group.removeAll();
                var oldAxisGroup = this._axisGroup;
                this._axisGroup = new graphic.Group();
                this.group.add(this._axisGroup);
                if (!axisModel.get('show')) {
                    return;
                }
                var gridModel = axisModel.getCoordSysModel();
                var layout = layoutAxis(gridModel, axisModel);
                var axisBuilder = new AxisBuilder(axisModel, layout);
                zrUtil.each(axisBuilderAttrs, axisBuilder.add, axisBuilder);
                this._axisGroup.add(axisBuilder.getGroup());
                zrUtil.each(selfBuilderAttrs, function (name) {
                    if (axisModel.get(name + '.show')) {
                        this['_' + name](axisModel, gridModel, layout.labelInterval);
                    }
                }, this);
                graphic.groupTransition(oldAxisGroup, this._axisGroup, axisModel);
            },
            _splitLine: function (axisModel, gridModel, labelInterval) {
                var axis = axisModel.axis;
                if (axis.isBlank()) {
                    return;
                }
                var splitLineModel = axisModel.getModel('splitLine');
                var lineStyleModel = splitLineModel.getModel('lineStyle');
                var lineColors = lineStyleModel.get('color');
                var lineInterval = getInterval(splitLineModel, labelInterval);
                lineColors = zrUtil.isArray(lineColors) ? lineColors : [lineColors];
                var gridRect = gridModel.coordinateSystem.getRect();
                var isHorizontal = axis.isHorizontal();
                var lineCount = 0;
                var ticksCoords = axis.getTicksCoords();
                var ticks = axis.scale.getTicks();
                var p1 = [];
                var p2 = [];
                // Simple optimization
                // Batching the lines if color are the same
                var lineStyle = lineStyleModel.getLineStyle();
                for (var i = 0; i < ticksCoords.length; i++) {
                    if (ifIgnoreOnTick(axis, i, lineInterval)) {
                        continue;
                    }
                    var tickCoord = axis.toGlobalCoord(ticksCoords[i]);
                    if (isHorizontal) {
                        p1[0] = tickCoord;
                        p1[1] = gridRect.y;
                        p2[0] = tickCoord;
                        p2[1] = gridRect.y + gridRect.height;
                    } else {
                        p1[0] = gridRect.x;
                        p1[1] = tickCoord;
                        p2[0] = gridRect.x + gridRect.width;
                        p2[1] = tickCoord;
                    }
                    var colorIndex = lineCount++ % lineColors.length;
                    this._axisGroup.add(new graphic.Line(graphic.subPixelOptimizeLine({
                        anid: 'line_' + ticks[i],
                        shape: {
                            x1: p1[0],
                            y1: p1[1],
                            x2: p2[0],
                            y2: p2[1]
                        },
                        style: zrUtil.defaults({ stroke: lineColors[colorIndex] }, lineStyle),
                        silent: true
                    })));
                }
            },
            _splitArea: function (axisModel, gridModel, labelInterval) {
                var axis = axisModel.axis;
                if (axis.isBlank()) {
                    return;
                }
                var splitAreaModel = axisModel.getModel('splitArea');
                var areaStyleModel = splitAreaModel.getModel('areaStyle');
                var areaColors = areaStyleModel.get('color');
                var gridRect = gridModel.coordinateSystem.getRect();
                var ticksCoords = axis.getTicksCoords();
                var ticks = axis.scale.getTicks();
                var prevX = axis.toGlobalCoord(ticksCoords[0]);
                var prevY = axis.toGlobalCoord(ticksCoords[0]);
                var count = 0;
                var areaInterval = getInterval(splitAreaModel, labelInterval);
                var areaStyle = areaStyleModel.getAreaStyle();
                areaColors = zrUtil.isArray(areaColors) ? areaColors : [areaColors];
                for (var i = 1; i < ticksCoords.length; i++) {
                    if (ifIgnoreOnTick(axis, i, areaInterval)) {
                        continue;
                    }
                    var tickCoord = axis.toGlobalCoord(ticksCoords[i]);
                    var x;
                    var y;
                    var width;
                    var height;
                    if (axis.isHorizontal()) {
                        x = prevX;
                        y = gridRect.y;
                        width = tickCoord - x;
                        height = gridRect.height;
                    } else {
                        x = gridRect.x;
                        y = prevY;
                        width = gridRect.width;
                        height = tickCoord - y;
                    }
                    var colorIndex = count++ % areaColors.length;
                    this._axisGroup.add(new graphic.Rect({
                        anid: 'area_' + ticks[i],
                        shape: {
                            x: x,
                            y: y,
                            width: width,
                            height: height
                        },
                        style: zrUtil.defaults({ fill: areaColors[colorIndex] }, areaStyle),
                        silent: true
                    }));
                    prevX = x + width;
                    prevY = y + height;
                }
            }
        });
    AxisView.extend({ type: 'xAxis' });
    AxisView.extend({ type: 'yAxis' });
    /**
     * @inner
     */
    function layoutAxis(gridModel, axisModel) {
        var grid = gridModel.coordinateSystem;
        var axis = axisModel.axis;
        var layout = {};
        var rawAxisPosition = axis.position;
        var axisPosition = axis.onZero ? 'onZero' : rawAxisPosition;
        var axisDim = axis.dim;
        // [left, right, top, bottom]
        var rect = grid.getRect();
        var rectBound = [
                rect.x,
                rect.x + rect.width,
                rect.y,
                rect.y + rect.height
            ];
        var axisOffset = axisModel.get('offset') || 0;
        var posMap = {
                x: {
                    top: rectBound[2] - axisOffset,
                    bottom: rectBound[3] + axisOffset
                },
                y: {
                    left: rectBound[0] - axisOffset,
                    right: rectBound[1] + axisOffset
                }
            };
        posMap.x.onZero = Math.max(Math.min(getZero('y'), posMap.x.bottom), posMap.x.top);
        posMap.y.onZero = Math.max(Math.min(getZero('x'), posMap.y.right), posMap.y.left);
        function getZero(dim, val) {
            var theAxis = grid.getAxis(dim);
            return theAxis.toGlobalCoord(theAxis.dataToCoord(0));
        }
        // Axis position
        layout.position = [
            axisDim === 'y' ? posMap.y[axisPosition] : rectBound[0],
            axisDim === 'x' ? posMap.x[axisPosition] : rectBound[3]
        ];
        // Axis rotation
        layout.rotation = Math.PI / 2 * (axisDim === 'x' ? 0 : 1);
        // Tick and label direction, x y is axisDim
        var dirMap = {
                top: -1,
                bottom: 1,
                left: -1,
                right: 1
            };
        layout.labelDirection = layout.tickDirection = layout.nameDirection = dirMap[rawAxisPosition];
        if (axis.onZero) {
            layout.labelOffset = posMap[axisDim][rawAxisPosition] - posMap[axisDim].onZero;
        }
        if (axisModel.getModel('axisTick').get('inside')) {
            layout.tickDirection = -layout.tickDirection;
        }
        if (axisModel.getModel('axisLabel').get('inside')) {
            layout.labelDirection = -layout.labelDirection;
        }
        // Special label rotation
        var labelRotation = axisModel.getModel('axisLabel').get('rotate');
        layout.labelRotation = axisPosition === 'top' ? -labelRotation : labelRotation;
        // label interval when auto mode.
        layout.labelInterval = axis.getLabelInterval();
        // Over splitLine and splitArea
        layout.z2 = 1;
        return layout;
    }
});
define('echarts/chart/helper/SymbolDraw', ['require', '../../util/graphic', './Symbol'], function (require) {
    var graphic = require('../../util/graphic');
    var Symbol = require('./Symbol');
    /**
     * @constructor
     * @alias module:echarts/chart/helper/SymbolDraw
     * @param {module:zrender/graphic/Group} [symbolCtor]
     */
    function SymbolDraw(symbolCtor) {
        this.group = new graphic.Group();
        this._symbolCtor = symbolCtor || Symbol;
    }
    var symbolDrawProto = SymbolDraw.prototype;
    function symbolNeedsDraw(data, idx, isIgnore) {
        var point = data.getItemLayout(idx);
        // Is an object
        // if (point && point.hasOwnProperty('point')) {
        //     point = point.point;
        // }
        return point && !isNaN(point[0]) && !isNaN(point[1]) && !(isIgnore && isIgnore(idx)) && data.getItemVisual(idx, 'symbol') !== 'none';
    }
    /**
     * Update symbols draw by new data
     * @param {module:echarts/data/List} data
     * @param {Array.<boolean>} [isIgnore]
     */
    symbolDrawProto.updateData = function (data, isIgnore) {
        var group = this.group;
        var seriesModel = data.hostModel;
        var oldData = this._data;
        var SymbolCtor = this._symbolCtor;
        var seriesScope = {
                itemStyle: seriesModel.getModel('itemStyle.normal').getItemStyle(['color']),
                hoverItemStyle: seriesModel.getModel('itemStyle.emphasis').getItemStyle(),
                symbolRotate: seriesModel.get('symbolRotate'),
                symbolOffset: seriesModel.get('symbolOffset'),
                hoverAnimation: seriesModel.get('hoverAnimation'),
                labelModel: seriesModel.getModel('label.normal'),
                hoverLabelModel: seriesModel.getModel('label.emphasis')
            };
        data.diff(oldData).add(function (newIdx) {
            var point = data.getItemLayout(newIdx);
            if (symbolNeedsDraw(data, newIdx, isIgnore)) {
                var symbolEl = new SymbolCtor(data, newIdx, seriesScope);
                symbolEl.attr('position', point);
                data.setItemGraphicEl(newIdx, symbolEl);
                group.add(symbolEl);
            }
        }).update(function (newIdx, oldIdx) {
            var symbolEl = oldData.getItemGraphicEl(oldIdx);
            var point = data.getItemLayout(newIdx);
            if (!symbolNeedsDraw(data, newIdx, isIgnore)) {
                group.remove(symbolEl);
                return;
            }
            if (!symbolEl) {
                symbolEl = new SymbolCtor(data, newIdx);
                symbolEl.attr('position', point);
            } else {
                symbolEl.updateData(data, newIdx, seriesScope);
                graphic.updateProps(symbolEl, { position: point }, seriesModel);
            }
            // Add back
            group.add(symbolEl);
            data.setItemGraphicEl(newIdx, symbolEl);
        }).remove(function (oldIdx) {
            var el = oldData.getItemGraphicEl(oldIdx);
            el && el.fadeOut(function () {
                group.remove(el);
            });
        }).execute();
        this._data = data;
    };
    symbolDrawProto.updateLayout = function () {
        var data = this._data;
        if (data) {
            // Not use animation
            data.eachItemGraphicEl(function (el, idx) {
                var point = data.getItemLayout(idx);
                el.attr('position', point);
            });
        }
    };
    symbolDrawProto.remove = function (enableAnimation) {
        var group = this.group;
        var data = this._data;
        if (data) {
            if (enableAnimation) {
                data.eachItemGraphicEl(function (el) {
                    el.fadeOut(function () {
                        group.remove(el);
                    });
                });
            } else {
                group.removeAll();
            }
        }
    };
    return SymbolDraw;
});
define('echarts/chart/helper/Symbol', ['require', 'zrender/core/util', '../../util/symbol', '../../util/graphic', '../../util/number'], function (require) {
    var zrUtil = require('zrender/core/util');
    var symbolUtil = require('../../util/symbol');
    var graphic = require('../../util/graphic');
    var numberUtil = require('../../util/number');
    function getSymbolSize(data, idx) {
        var symbolSize = data.getItemVisual(idx, 'symbolSize');
        return symbolSize instanceof Array ? symbolSize.slice() : [
            +symbolSize,
            +symbolSize
        ];
    }
    function getScale(symbolSize) {
        return [
            symbolSize[0] / 2,
            symbolSize[1] / 2
        ];
    }
    /**
     * @constructor
     * @alias {module:echarts/chart/helper/Symbol}
     * @param {module:echarts/data/List} data
     * @param {number} idx
     * @extends {module:zrender/graphic/Group}
     */
    function Symbol(data, idx, seriesScope) {
        graphic.Group.call(this);
        this.updateData(data, idx, seriesScope);
    }
    var symbolProto = Symbol.prototype;
    function driftSymbol(dx, dy) {
        this.parent.drift(dx, dy);
    }
    symbolProto._createSymbol = function (symbolType, data, idx, symbolSize) {
        // Remove paths created before
        this.removeAll();
        var seriesModel = data.hostModel;
        var color = data.getItemVisual(idx, 'color');
        // var symbolPath = symbolUtil.createSymbol(
        //     symbolType, -0.5, -0.5, 1, 1, color
        // );
        // If width/height are set too small (e.g., set to 1) on ios10
        // and macOS Sierra, a circle stroke become a rect, no matter what
        // the scale is set. So we set width/height as 2. See #4150.
        var symbolPath = symbolUtil.createSymbol(symbolType, -1, -1, 2, 2, color);
        symbolPath.attr({
            z2: 100,
            culling: true,
            scale: [
                0,
                0
            ]
        });
        // Rewrite drift method
        symbolPath.drift = driftSymbol;
        graphic.initProps(symbolPath, { scale: getScale(symbolSize) }, seriesModel, idx);
        this._symbolType = symbolType;
        this.add(symbolPath);
    };
    /**
     * Stop animation
     * @param {boolean} toLastFrame
     */
    symbolProto.stopSymbolAnimation = function (toLastFrame) {
        this.childAt(0).stopAnimation(toLastFrame);
    };
    /**
     * Get symbol path element
     */
    symbolProto.getSymbolPath = function () {
        return this.childAt(0);
    };
    /**
     * Get scale(aka, current symbol size).
     * Including the change caused by animation
     */
    symbolProto.getScale = function () {
        return this.childAt(0).scale;
    };
    /**
     * Highlight symbol
     */
    symbolProto.highlight = function () {
        this.childAt(0).trigger('emphasis');
    };
    /**
     * Downplay symbol
     */
    symbolProto.downplay = function () {
        this.childAt(0).trigger('normal');
    };
    /**
     * @param {number} zlevel
     * @param {number} z
     */
    symbolProto.setZ = function (zlevel, z) {
        var symbolPath = this.childAt(0);
        symbolPath.zlevel = zlevel;
        symbolPath.z = z;
    };
    symbolProto.setDraggable = function (draggable) {
        var symbolPath = this.childAt(0);
        symbolPath.draggable = draggable;
        symbolPath.cursor = draggable ? 'move' : 'pointer';
    };
    /**
     * Update symbol properties
     * @param  {module:echarts/data/List} data
     * @param  {number} idx
     */
    symbolProto.updateData = function (data, idx, seriesScope) {
        this.silent = false;
        var symbolType = data.getItemVisual(idx, 'symbol') || 'circle';
        var seriesModel = data.hostModel;
        var symbolSize = getSymbolSize(data, idx);
        if (symbolType !== this._symbolType) {
            this._createSymbol(symbolType, data, idx, symbolSize);
        } else {
            var symbolPath = this.childAt(0);
            graphic.updateProps(symbolPath, { scale: getScale(symbolSize) }, seriesModel, idx);
        }
        this._updateCommon(data, idx, symbolSize, seriesScope);
        this._seriesModel = seriesModel;
    };
    // Update common properties
    var normalStyleAccessPath = [
            'itemStyle',
            'normal'
        ];
    var emphasisStyleAccessPath = [
            'itemStyle',
            'emphasis'
        ];
    var normalLabelAccessPath = [
            'label',
            'normal'
        ];
    var emphasisLabelAccessPath = [
            'label',
            'emphasis'
        ];
    symbolProto._updateCommon = function (data, idx, symbolSize, seriesScope) {
        var symbolPath = this.childAt(0);
        var seriesModel = data.hostModel;
        var color = data.getItemVisual(idx, 'color');
        // Reset style
        if (symbolPath.type !== 'image') {
            symbolPath.useStyle({ strokeNoScale: true });
        }
        seriesScope = seriesScope || null;
        var itemStyle = seriesScope && seriesScope.itemStyle;
        var hoverItemStyle = seriesScope && seriesScope.hoverItemStyle;
        var symbolRotate = seriesScope && seriesScope.symbolRotate;
        var symbolOffset = seriesScope && seriesScope.symbolOffset;
        var labelModel = seriesScope && seriesScope.labelModel;
        var hoverLabelModel = seriesScope && seriesScope.hoverLabelModel;
        var hoverAnimation = seriesScope && seriesScope.hoverAnimation;
        if (!seriesScope || data.hasItemOption) {
            var itemModel = data.getItemModel(idx);
            // Color must be excluded.
            // Because symbol provide setColor individually to set fill and stroke
            itemStyle = itemModel.getModel(normalStyleAccessPath).getItemStyle(['color']);
            hoverItemStyle = itemModel.getModel(emphasisStyleAccessPath).getItemStyle();
            symbolRotate = itemModel.getShallow('symbolRotate');
            symbolOffset = itemModel.getShallow('symbolOffset');
            labelModel = itemModel.getModel(normalLabelAccessPath);
            hoverLabelModel = itemModel.getModel(emphasisLabelAccessPath);
            hoverAnimation = itemModel.getShallow('hoverAnimation');
        } else {
            hoverItemStyle = zrUtil.extend({}, hoverItemStyle);
        }
        var elStyle = symbolPath.style;
        symbolPath.attr('rotation', (symbolRotate || 0) * Math.PI / 180 || 0);
        if (symbolOffset) {
            symbolPath.attr('position', [
                numberUtil.parsePercent(symbolOffset[0], symbolSize[0]),
                numberUtil.parsePercent(symbolOffset[1], symbolSize[1])
            ]);
        }
        // PENDING setColor before setStyle!!!
        symbolPath.setColor(color);
        symbolPath.setStyle(itemStyle);
        var opacity = data.getItemVisual(idx, 'opacity');
        if (opacity != null) {
            elStyle.opacity = opacity;
        }
        // Get last value dim
        var dimensions = data.dimensions.slice();
        var valueDim;
        var dataType;
        while (dimensions.length && (valueDim = dimensions.pop(), dataType = data.getDimensionInfo(valueDim).type, dataType === 'ordinal' || dataType === 'time')) {
        }
        // jshint ignore:line
        if (valueDim != null && labelModel.getShallow('show')) {
            graphic.setText(elStyle, labelModel, color);
            elStyle.text = zrUtil.retrieve(seriesModel.getFormattedLabel(idx, 'normal'), data.get(valueDim, idx));
        } else {
            elStyle.text = '';
        }
        if (valueDim != null && hoverLabelModel.getShallow('show')) {
            graphic.setText(hoverItemStyle, hoverLabelModel, color);
            hoverItemStyle.text = zrUtil.retrieve(seriesModel.getFormattedLabel(idx, 'emphasis'), data.get(valueDim, idx));
        } else {
            hoverItemStyle.text = '';
        }
        symbolPath.off('mouseover').off('mouseout').off('emphasis').off('normal');
        symbolPath.hoverStyle = hoverItemStyle;
        graphic.setHoverStyle(symbolPath);
        var scale = getScale(symbolSize);
        if (hoverAnimation && seriesModel.isAnimationEnabled()) {
            var onEmphasis = function () {
                var ratio = scale[1] / scale[0];
                this.animateTo({
                    scale: [
                        Math.max(scale[0] * 1.1, scale[0] + 3),
                        Math.max(scale[1] * 1.1, scale[1] + 3 * ratio)
                    ]
                }, 400, 'elasticOut');
            };
            var onNormal = function () {
                this.animateTo({ scale: scale }, 400, 'elasticOut');
            };
            symbolPath.on('mouseover', onEmphasis).on('mouseout', onNormal).on('emphasis', onEmphasis).on('normal', onNormal);
        }
    };
    symbolProto.fadeOut = function (cb) {
        var symbolPath = this.childAt(0);
        // Avoid mistaken hover when fading out
        this.silent = true;
        // Not show text when animating
        symbolPath.style.text = '';
        graphic.updateProps(symbolPath, {
            scale: [
                0,
                0
            ]
        }, this._seriesModel, this.dataIndex, cb);
    };
    zrUtil.inherits(Symbol, graphic.Group);
    return Symbol;
});
define('echarts/chart/line/lineAnimationDiff', ['require'], function (require) {
    // var arrayDiff = require('zrender/core/arrayDiff');
    // 'zrender/core/arrayDiff' has been used before, but it did
    // not do well in performance when roam with fixed dataZoom window.
    function sign(val) {
        return val >= 0 ? 1 : -1;
    }
    function getStackedOnPoint(coordSys, data, idx) {
        var baseAxis = coordSys.getBaseAxis();
        var valueAxis = coordSys.getOtherAxis(baseAxis);
        var valueStart = baseAxis.onZero ? 0 : valueAxis.scale.getExtent()[0];
        var valueDim = valueAxis.dim;
        var baseDataOffset = valueDim === 'x' || valueDim === 'radius' ? 1 : 0;
        var stackedOnSameSign;
        var stackedOn = data.stackedOn;
        var val = data.get(valueDim, idx);
        // Find first stacked value with same sign
        while (stackedOn && sign(stackedOn.get(valueDim, idx)) === sign(val)) {
            stackedOnSameSign = stackedOn;
            break;
        }
        var stackedData = [];
        stackedData[baseDataOffset] = data.get(baseAxis.dim, idx);
        stackedData[1 - baseDataOffset] = stackedOnSameSign ? stackedOnSameSign.get(valueDim, idx, true) : valueStart;
        return coordSys.dataToPoint(stackedData);
    }
    // function convertToIntId(newIdList, oldIdList) {
    //     // Generate int id instead of string id.
    //     // Compare string maybe slow in score function of arrDiff
    //     // Assume id in idList are all unique
    //     var idIndicesMap = {};
    //     var idx = 0;
    //     for (var i = 0; i < newIdList.length; i++) {
    //         idIndicesMap[newIdList[i]] = idx;
    //         newIdList[i] = idx++;
    //     }
    //     for (var i = 0; i < oldIdList.length; i++) {
    //         var oldId = oldIdList[i];
    //         // Same with newIdList
    //         if (idIndicesMap[oldId]) {
    //             oldIdList[i] = idIndicesMap[oldId];
    //         }
    //         else {
    //             oldIdList[i] = idx++;
    //         }
    //     }
    // }
    function diffData(oldData, newData) {
        var diffResult = [];
        newData.diff(oldData).add(function (idx) {
            diffResult.push({
                cmd: '+',
                idx: idx
            });
        }).update(function (newIdx, oldIdx) {
            diffResult.push({
                cmd: '=',
                idx: oldIdx,
                idx1: newIdx
            });
        }).remove(function (idx) {
            diffResult.push({
                cmd: '-',
                idx: idx
            });
        }).execute();
        return diffResult;
    }
    return function (oldData, newData, oldStackedOnPoints, newStackedOnPoints, oldCoordSys, newCoordSys) {
        var diff = diffData(oldData, newData);
        // var newIdList = newData.mapArray(newData.getId);
        // var oldIdList = oldData.mapArray(oldData.getId);
        // convertToIntId(newIdList, oldIdList);
        // // FIXME One data ?
        // diff = arrayDiff(oldIdList, newIdList);
        var currPoints = [];
        var nextPoints = [];
        // Points for stacking base line
        var currStackedPoints = [];
        var nextStackedPoints = [];
        var status = [];
        var sortedIndices = [];
        var rawIndices = [];
        var dims = newCoordSys.dimensions;
        for (var i = 0; i < diff.length; i++) {
            var diffItem = diff[i];
            var pointAdded = true;
            // FIXME, animation is not so perfect when dataZoom window moves fast
            // Which is in case remvoing or add more than one data in the tail or head
            switch (diffItem.cmd) {
            case '=':
                var currentPt = oldData.getItemLayout(diffItem.idx);
                var nextPt = newData.getItemLayout(diffItem.idx1);
                // If previous data is NaN, use next point directly
                if (isNaN(currentPt[0]) || isNaN(currentPt[1])) {
                    currentPt = nextPt.slice();
                }
                currPoints.push(currentPt);
                nextPoints.push(nextPt);
                currStackedPoints.push(oldStackedOnPoints[diffItem.idx]);
                nextStackedPoints.push(newStackedOnPoints[diffItem.idx1]);
                rawIndices.push(newData.getRawIndex(diffItem.idx1));
                break;
            case '+':
                var idx = diffItem.idx;
                currPoints.push(oldCoordSys.dataToPoint([
                    newData.get(dims[0], idx, true),
                    newData.get(dims[1], idx, true)
                ]));
                nextPoints.push(newData.getItemLayout(idx).slice());
                currStackedPoints.push(getStackedOnPoint(oldCoordSys, newData, idx));
                nextStackedPoints.push(newStackedOnPoints[idx]);
                rawIndices.push(newData.getRawIndex(idx));
                break;
            case '-':
                var idx = diffItem.idx;
                var rawIndex = oldData.getRawIndex(idx);
                // Data is replaced. In the case of dynamic data queue
                // FIXME FIXME FIXME
                if (rawIndex !== idx) {
                    currPoints.push(oldData.getItemLayout(idx));
                    nextPoints.push(newCoordSys.dataToPoint([
                        oldData.get(dims[0], idx, true),
                        oldData.get(dims[1], idx, true)
                    ]));
                    currStackedPoints.push(oldStackedOnPoints[idx]);
                    nextStackedPoints.push(getStackedOnPoint(newCoordSys, oldData, idx));
                    rawIndices.push(rawIndex);
                } else {
                    pointAdded = false;
                }
            }
            // Original indices
            if (pointAdded) {
                status.push(diffItem);
                sortedIndices.push(sortedIndices.length);
            }
        }
        // Diff result may be crossed if all items are changed
        // Sort by data index
        sortedIndices.sort(function (a, b) {
            return rawIndices[a] - rawIndices[b];
        });
        var sortedCurrPoints = [];
        var sortedNextPoints = [];
        var sortedCurrStackedPoints = [];
        var sortedNextStackedPoints = [];
        var sortedStatus = [];
        for (var i = 0; i < sortedIndices.length; i++) {
            var idx = sortedIndices[i];
            sortedCurrPoints[i] = currPoints[idx];
            sortedNextPoints[i] = nextPoints[idx];
            sortedCurrStackedPoints[i] = currStackedPoints[idx];
            sortedNextStackedPoints[i] = nextStackedPoints[idx];
            sortedStatus[i] = status[idx];
        }
        return {
            current: sortedCurrPoints,
            next: sortedNextPoints,
            stackedOnCurrent: sortedCurrStackedPoints,
            stackedOnNext: sortedNextStackedPoints,
            status: sortedStatus
        };
    };
});
define('echarts/chart/line/poly', ['require', 'zrender/graphic/Path', 'zrender/core/vector'], function (require) {
    var Path = require('zrender/graphic/Path');
    var vec2 = require('zrender/core/vector');
    var vec2Min = vec2.min;
    var vec2Max = vec2.max;
    var scaleAndAdd = vec2.scaleAndAdd;
    var v2Copy = vec2.copy;
    // Temporary variable
    var v = [];
    var cp0 = [];
    var cp1 = [];
    function isPointNull(p) {
        return isNaN(p[0]) || isNaN(p[1]);
    }
    function drawSegment(ctx, points, start, segLen, allLen, dir, smoothMin, smoothMax, smooth, smoothMonotone, connectNulls) {
        var prevIdx = 0;
        var idx = start;
        for (var k = 0; k < segLen; k++) {
            var p = points[idx];
            if (idx >= allLen || idx < 0) {
                break;
            }
            if (isPointNull(p)) {
                if (connectNulls) {
                    idx += dir;
                    continue;
                }
                break;
            }
            if (idx === start) {
                ctx[dir > 0 ? 'moveTo' : 'lineTo'](p[0], p[1]);
                v2Copy(cp0, p);
            } else {
                if (smooth > 0) {
                    var nextIdx = idx + dir;
                    var nextP = points[nextIdx];
                    if (connectNulls) {
                        // Find next point not null
                        while (nextP && isPointNull(points[nextIdx])) {
                            nextIdx += dir;
                            nextP = points[nextIdx];
                        }
                    }
                    var ratioNextSeg = 0.5;
                    var prevP = points[prevIdx];
                    var nextP = points[nextIdx];
                    // Last point
                    if (!nextP || isPointNull(nextP)) {
                        v2Copy(cp1, p);
                    } else {
                        // If next data is null in not connect case
                        if (isPointNull(nextP) && !connectNulls) {
                            nextP = p;
                        }
                        vec2.sub(v, nextP, prevP);
                        var lenPrevSeg;
                        var lenNextSeg;
                        if (smoothMonotone === 'x' || smoothMonotone === 'y') {
                            var dim = smoothMonotone === 'x' ? 0 : 1;
                            lenPrevSeg = Math.abs(p[dim] - prevP[dim]);
                            lenNextSeg = Math.abs(p[dim] - nextP[dim]);
                        } else {
                            lenPrevSeg = vec2.dist(p, prevP);
                            lenNextSeg = vec2.dist(p, nextP);
                        }
                        // Use ratio of seg length
                        ratioNextSeg = lenNextSeg / (lenNextSeg + lenPrevSeg);
                        scaleAndAdd(cp1, p, v, -smooth * (1 - ratioNextSeg));
                    }
                    // Smooth constraint
                    vec2Min(cp0, cp0, smoothMax);
                    vec2Max(cp0, cp0, smoothMin);
                    vec2Min(cp1, cp1, smoothMax);
                    vec2Max(cp1, cp1, smoothMin);
                    ctx.bezierCurveTo(cp0[0], cp0[1], cp1[0], cp1[1], p[0], p[1]);
                    // cp0 of next segment
                    scaleAndAdd(cp0, p, v, smooth * ratioNextSeg);
                } else {
                    ctx.lineTo(p[0], p[1]);
                }
            }
            prevIdx = idx;
            idx += dir;
        }
        return k;
    }
    function getBoundingBox(points, smoothConstraint) {
        var ptMin = [
                Infinity,
                Infinity
            ];
        var ptMax = [
                -Infinity,
                -Infinity
            ];
        if (smoothConstraint) {
            for (var i = 0; i < points.length; i++) {
                var pt = points[i];
                if (pt[0] < ptMin[0]) {
                    ptMin[0] = pt[0];
                }
                if (pt[1] < ptMin[1]) {
                    ptMin[1] = pt[1];
                }
                if (pt[0] > ptMax[0]) {
                    ptMax[0] = pt[0];
                }
                if (pt[1] > ptMax[1]) {
                    ptMax[1] = pt[1];
                }
            }
        }
        return {
            min: smoothConstraint ? ptMin : ptMax,
            max: smoothConstraint ? ptMax : ptMin
        };
    }
    return {
        Polyline: Path.extend({
            type: 'ec-polyline',
            shape: {
                points: [],
                smooth: 0,
                smoothConstraint: true,
                smoothMonotone: null,
                connectNulls: false
            },
            style: {
                fill: null,
                stroke: '#000'
            },
            buildPath: function (ctx, shape) {
                var points = shape.points;
                var i = 0;
                var len = points.length;
                var result = getBoundingBox(points, shape.smoothConstraint);
                if (shape.connectNulls) {
                    // Must remove first and last null values avoid draw error in polygon
                    for (; len > 0; len--) {
                        if (!isPointNull(points[len - 1])) {
                            break;
                        }
                    }
                    for (; i < len; i++) {
                        if (!isPointNull(points[i])) {
                            break;
                        }
                    }
                }
                while (i < len) {
                    i += drawSegment(ctx, points, i, len, len, 1, result.min, result.max, shape.smooth, shape.smoothMonotone, shape.connectNulls) + 1;
                }
            }
        }),
        Polygon: Path.extend({
            type: 'ec-polygon',
            shape: {
                points: [],
                stackedOnPoints: [],
                smooth: 0,
                stackedOnSmooth: 0,
                smoothConstraint: true,
                smoothMonotone: null,
                connectNulls: false
            },
            buildPath: function (ctx, shape) {
                var points = shape.points;
                var stackedOnPoints = shape.stackedOnPoints;
                var i = 0;
                var len = points.length;
                var smoothMonotone = shape.smoothMonotone;
                var bbox = getBoundingBox(points, shape.smoothConstraint);
                var stackedOnBBox = getBoundingBox(stackedOnPoints, shape.smoothConstraint);
                if (shape.connectNulls) {
                    // Must remove first and last null values avoid draw error in polygon
                    for (; len > 0; len--) {
                        if (!isPointNull(points[len - 1])) {
                            break;
                        }
                    }
                    for (; i < len; i++) {
                        if (!isPointNull(points[i])) {
                            break;
                        }
                    }
                }
                while (i < len) {
                    var k = drawSegment(ctx, points, i, len, len, 1, bbox.min, bbox.max, shape.smooth, smoothMonotone, shape.connectNulls);
                    drawSegment(ctx, stackedOnPoints, i + k - 1, k, len, -1, stackedOnBBox.min, stackedOnBBox.max, shape.stackedOnSmooth, smoothMonotone, shape.connectNulls);
                    i += k + 1;
                    ctx.closePath();
                }
            }
        })
    };
});
define('echarts/util/symbol', ['require', './graphic', 'zrender/core/BoundingRect'], function (require) {
    'use strict';
    var graphic = require('./graphic');
    var BoundingRect = require('zrender/core/BoundingRect');
    /**
     * Triangle shape
     * @inner
     */
    var Triangle = graphic.extendShape({
            type: 'triangle',
            shape: {
                cx: 0,
                cy: 0,
                width: 0,
                height: 0
            },
            buildPath: function (path, shape) {
                var cx = shape.cx;
                var cy = shape.cy;
                var width = shape.width / 2;
                var height = shape.height / 2;
                path.moveTo(cx, cy - height);
                path.lineTo(cx + width, cy + height);
                path.lineTo(cx - width, cy + height);
                path.closePath();
            }
        });
    /**
     * Diamond shape
     * @inner
     */
    var Diamond = graphic.extendShape({
            type: 'diamond',
            shape: {
                cx: 0,
                cy: 0,
                width: 0,
                height: 0
            },
            buildPath: function (path, shape) {
                var cx = shape.cx;
                var cy = shape.cy;
                var width = shape.width / 2;
                var height = shape.height / 2;
                path.moveTo(cx, cy - height);
                path.lineTo(cx + width, cy);
                path.lineTo(cx, cy + height);
                path.lineTo(cx - width, cy);
                path.closePath();
            }
        });
    /**
     * Pin shape
     * @inner
     */
    var Pin = graphic.extendShape({
            type: 'pin',
            shape: {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            buildPath: function (path, shape) {
                var x = shape.x;
                var y = shape.y;
                var w = shape.width / 5 * 3;
                // Height must be larger than width
                var h = Math.max(w, shape.height);
                var r = w / 2;
                // Dist on y with tangent point and circle center
                var dy = r * r / (h - r);
                var cy = y - h + r + dy;
                var angle = Math.asin(dy / r);
                // Dist on x with tangent point and circle center
                var dx = Math.cos(angle) * r;
                var tanX = Math.sin(angle);
                var tanY = Math.cos(angle);
                path.arc(x, cy, r, Math.PI - angle, Math.PI * 2 + angle);
                var cpLen = r * 0.6;
                var cpLen2 = r * 0.7;
                path.bezierCurveTo(x + dx - tanX * cpLen, cy + dy + tanY * cpLen, x, y - cpLen2, x, y);
                path.bezierCurveTo(x, y - cpLen2, x - dx + tanX * cpLen, cy + dy + tanY * cpLen, x - dx, cy + dy);
                path.closePath();
            }
        });
    /**
     * Arrow shape
     * @inner
     */
    var Arrow = graphic.extendShape({
            type: 'arrow',
            shape: {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            buildPath: function (ctx, shape) {
                var height = shape.height;
                var width = shape.width;
                var x = shape.x;
                var y = shape.y;
                var dx = width / 3 * 2;
                ctx.moveTo(x, y);
                ctx.lineTo(x + dx, y + height);
                ctx.lineTo(x, y + height / 4 * 3);
                ctx.lineTo(x - dx, y + height);
                ctx.lineTo(x, y);
                ctx.closePath();
            }
        });
    /**
     * Map of path contructors
     * @type {Object.<string, module:zrender/graphic/Path>}
     */
    var symbolCtors = {
            line: graphic.Line,
            rect: graphic.Rect,
            roundRect: graphic.Rect,
            square: graphic.Rect,
            circle: graphic.Circle,
            diamond: Diamond,
            pin: Pin,
            arrow: Arrow,
            triangle: Triangle
        };
    var symbolShapeMakers = {
            line: function (x, y, w, h, shape) {
                // FIXME
                shape.x1 = x;
                shape.y1 = y + h / 2;
                shape.x2 = x + w;
                shape.y2 = y + h / 2;
            },
            rect: function (x, y, w, h, shape) {
                shape.x = x;
                shape.y = y;
                shape.width = w;
                shape.height = h;
            },
            roundRect: function (x, y, w, h, shape) {
                shape.x = x;
                shape.y = y;
                shape.width = w;
                shape.height = h;
                shape.r = Math.min(w, h) / 4;
            },
            square: function (x, y, w, h, shape) {
                var size = Math.min(w, h);
                shape.x = x;
                shape.y = y;
                shape.width = size;
                shape.height = size;
            },
            circle: function (x, y, w, h, shape) {
                // Put circle in the center of square
                shape.cx = x + w / 2;
                shape.cy = y + h / 2;
                shape.r = Math.min(w, h) / 2;
            },
            diamond: function (x, y, w, h, shape) {
                shape.cx = x + w / 2;
                shape.cy = y + h / 2;
                shape.width = w;
                shape.height = h;
            },
            pin: function (x, y, w, h, shape) {
                shape.x = x + w / 2;
                shape.y = y + h / 2;
                shape.width = w;
                shape.height = h;
            },
            arrow: function (x, y, w, h, shape) {
                shape.x = x + w / 2;
                shape.y = y + h / 2;
                shape.width = w;
                shape.height = h;
            },
            triangle: function (x, y, w, h, shape) {
                shape.cx = x + w / 2;
                shape.cy = y + h / 2;
                shape.width = w;
                shape.height = h;
            }
        };
    var symbolBuildProxies = {};
    for (var name in symbolCtors) {
        if (symbolCtors.hasOwnProperty(name)) {
            symbolBuildProxies[name] = new symbolCtors[name]();
        }
    }
    var Symbol = graphic.extendShape({
            type: 'symbol',
            shape: {
                symbolType: '',
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            beforeBrush: function () {
                var style = this.style;
                var shape = this.shape;
                // FIXME
                if (shape.symbolType === 'pin' && style.textPosition === 'inside') {
                    style.textPosition = [
                        '50%',
                        '40%'
                    ];
                    style.textAlign = 'center';
                    style.textVerticalAlign = 'middle';
                }
            },
            buildPath: function (ctx, shape, inBundle) {
                var symbolType = shape.symbolType;
                var proxySymbol = symbolBuildProxies[symbolType];
                if (shape.symbolType !== 'none') {
                    if (!proxySymbol) {
                        // Default rect
                        symbolType = 'rect';
                        proxySymbol = symbolBuildProxies[symbolType];
                    }
                    symbolShapeMakers[symbolType](shape.x, shape.y, shape.width, shape.height, proxySymbol.shape);
                    proxySymbol.buildPath(ctx, proxySymbol.shape, inBundle);
                }
            }
        });
    // Provide setColor helper method to avoid determine if set the fill or stroke outside
    var symbolPathSetColor = function (color) {
        if (this.type !== 'image') {
            var symbolStyle = this.style;
            var symbolShape = this.shape;
            if (symbolShape && symbolShape.symbolType === 'line') {
                symbolStyle.stroke = color;
            } else if (this.__isEmptyBrush) {
                symbolStyle.stroke = color;
                symbolStyle.fill = '#fff';
            } else {
                // FIXME 判断图形默认是填充还是描边，使用 onlyStroke ?
                symbolStyle.fill && (symbolStyle.fill = color);
                symbolStyle.stroke && (symbolStyle.stroke = color);
            }
            this.dirty(false);
        }
    };
    var symbolUtil = {
            createSymbol: function (symbolType, x, y, w, h, color) {
                var isEmpty = symbolType.indexOf('empty') === 0;
                if (isEmpty) {
                    symbolType = symbolType.substr(5, 1).toLowerCase() + symbolType.substr(6);
                }
                var symbolPath;
                if (symbolType.indexOf('image://') === 0) {
                    symbolPath = new graphic.Image({
                        style: {
                            image: symbolType.slice(8),
                            x: x,
                            y: y,
                            width: w,
                            height: h
                        }
                    });
                } else if (symbolType.indexOf('path://') === 0) {
                    symbolPath = graphic.makePath(symbolType.slice(7), {}, new BoundingRect(x, y, w, h));
                } else {
                    symbolPath = new Symbol({
                        shape: {
                            symbolType: symbolType,
                            x: x,
                            y: y,
                            width: w,
                            height: h
                        }
                    });
                }
                symbolPath.__isEmptyBrush = isEmpty;
                symbolPath.setColor = symbolPathSetColor;
                symbolPath.setColor(color);
                return symbolPath;
            }
        };
    return symbolUtil;
});
define('echarts/component/helper/listComponent', ['require', '../../util/layout', '../../util/format', '../../util/graphic'], function (require) {
    // List layout
    var layout = require('../../util/layout');
    var formatUtil = require('../../util/format');
    var graphic = require('../../util/graphic');
    function positionGroup(group, model, api) {
        layout.positionElement(group, model.getBoxLayoutParams(), {
            width: api.getWidth(),
            height: api.getHeight()
        }, model.get('padding'));
    }
    return {
        layout: function (group, componentModel, api) {
            var rect = layout.getLayoutRect(componentModel.getBoxLayoutParams(), {
                    width: api.getWidth(),
                    height: api.getHeight()
                }, componentModel.get('padding'));
            layout.box(componentModel.get('orient'), group, componentModel.get('itemGap'), rect.width, rect.height);
            positionGroup(group, componentModel, api);
        },
        addBackground: function (group, componentModel) {
            var padding = formatUtil.normalizeCssArray(componentModel.get('padding'));
            var boundingRect = group.getBoundingRect();
            var style = componentModel.getItemStyle([
                    'color',
                    'opacity'
                ]);
            style.fill = componentModel.get('backgroundColor');
            var rect = new graphic.Rect({
                    shape: {
                        x: boundingRect.x - padding[3],
                        y: boundingRect.y - padding[0],
                        width: boundingRect.width + padding[1] + padding[3],
                        height: boundingRect.height + padding[0] + padding[2]
                    },
                    style: style,
                    silent: true,
                    z2: -1
                });
            graphic.subPixelOptimizeRect(rect);
            group.add(rect);
        }
    };
});
define('echarts/component/tooltip/TooltipContent', ['require', 'zrender/core/util', 'zrender/tool/color', 'zrender/core/event', '../../util/format', 'zrender/core/env'], function (require) {
    var zrUtil = require('zrender/core/util');
    var zrColor = require('zrender/tool/color');
    var eventUtil = require('zrender/core/event');
    var formatUtil = require('../../util/format');
    var each = zrUtil.each;
    var toCamelCase = formatUtil.toCamelCase;
    var env = require('zrender/core/env');
    var vendors = [
            '',
            '-webkit-',
            '-moz-',
            '-o-'
        ];
    var gCssText = 'position:absolute;display:block;border-style:solid;white-space:nowrap;z-index:9999999;';
    /**
     * @param {number} duration
     * @return {string}
     * @inner
     */
    function assembleTransition(duration) {
        var transitionCurve = 'cubic-bezier(0.23, 1, 0.32, 1)';
        var transitionText = 'left ' + duration + 's ' + transitionCurve + ',' + 'top ' + duration + 's ' + transitionCurve;
        return zrUtil.map(vendors, function (vendorPrefix) {
            return vendorPrefix + 'transition:' + transitionText;
        }).join(';');
    }
    /**
     * @param {Object} textStyle
     * @return {string}
     * @inner
     */
    function assembleFont(textStyleModel) {
        var cssText = [];
        var fontSize = textStyleModel.get('fontSize');
        var color = textStyleModel.getTextColor();
        color && cssText.push('color:' + color);
        cssText.push('font:' + textStyleModel.getFont());
        fontSize && cssText.push('line-height:' + Math.round(fontSize * 3 / 2) + 'px');
        each([
            'decoration',
            'align'
        ], function (name) {
            var val = textStyleModel.get(name);
            val && cssText.push('text-' + name + ':' + val);
        });
        return cssText.join(';');
    }
    /**
     * @param {Object} tooltipModel
     * @return {string}
     * @inner
     */
    function assembleCssText(tooltipModel) {
        tooltipModel = tooltipModel;
        var cssText = [];
        var transitionDuration = tooltipModel.get('transitionDuration');
        var backgroundColor = tooltipModel.get('backgroundColor');
        var textStyleModel = tooltipModel.getModel('textStyle');
        var padding = tooltipModel.get('padding');
        // Animation transition
        transitionDuration && cssText.push(assembleTransition(transitionDuration));
        if (backgroundColor) {
            if (env.canvasSupported) {
                cssText.push('background-Color:' + backgroundColor);
            } else {
                // for ie
                cssText.push('background-Color:#' + zrColor.toHex(backgroundColor));
                cssText.push('filter:alpha(opacity=70)');
            }
        }
        // Border style
        each([
            'width',
            'color',
            'radius'
        ], function (name) {
            var borderName = 'border-' + name;
            var camelCase = toCamelCase(borderName);
            var val = tooltipModel.get(camelCase);
            val != null && cssText.push(borderName + ':' + val + (name === 'color' ? '' : 'px'));
        });
        // Text style
        cssText.push(assembleFont(textStyleModel));
        // Padding
        if (padding != null) {
            cssText.push('padding:' + formatUtil.normalizeCssArray(padding).join('px ') + 'px');
        }
        return cssText.join(';') + ';';
    }
    /**
     * @alias module:echarts/component/tooltip/TooltipContent
     * @constructor
     */
    function TooltipContent(container, api) {
        var el = document.createElement('div');
        var zr = api.getZr();
        this.el = el;
        this._x = api.getWidth() / 2;
        this._y = api.getHeight() / 2;
        container.appendChild(el);
        this._container = container;
        this._show = false;
        /**
         * @private
         */
        this._hideTimeout;
        var self = this;
        el.onmouseenter = function () {
            // clear the timeout in hideLater and keep showing tooltip
            if (self.enterable) {
                clearTimeout(self._hideTimeout);
                self._show = true;
            }
            self._inContent = true;
        };
        el.onmousemove = function (e) {
            e = e || window.event;
            if (!self.enterable) {
                // Try trigger zrender event to avoid mouse
                // in and out shape too frequently
                var handler = zr.handler;
                eventUtil.normalizeEvent(container, e, true);
                handler.dispatch('mousemove', e);
            }
        };
        el.onmouseleave = function () {
            if (self.enterable) {
                if (self._show) {
                    self.hideLater(self._hideDelay);
                }
            }
            self._inContent = false;
        };
    }
    TooltipContent.prototype = {
        constructor: TooltipContent,
        enterable: true,
        update: function () {
            var container = this._container;
            var stl = container.currentStyle || document.defaultView.getComputedStyle(container);
            var domStyle = container.style;
            if (domStyle.position !== 'absolute' && stl.position !== 'absolute') {
                domStyle.position = 'relative';
            }    // Hide the tooltip
                 // PENDING
                 // this.hide();
        },
        show: function (tooltipModel) {
            clearTimeout(this._hideTimeout);
            var el = this.el;
            el.style.cssText = gCssText + assembleCssText(tooltipModel) + ';left:' + this._x + 'px;top:' + this._y + 'px;' + (tooltipModel.get('extraCssText') || '');
            el.style.display = el.innerHTML ? 'block' : 'none';
            this._show = true;
        },
        setContent: function (content) {
            var el = this.el;
            el.innerHTML = content;
            el.style.display = content ? 'block' : 'none';
        },
        moveTo: function (x, y) {
            var style = this.el.style;
            style.left = x + 'px';
            style.top = y + 'px';
            this._x = x;
            this._y = y;
        },
        hide: function () {
            this.el.style.display = 'none';
            this._show = false;
        },
        hideLater: function (time) {
            if (this._show && !(this._inContent && this.enterable)) {
                if (time) {
                    this._hideDelay = time;
                    // Set show false to avoid invoke hideLater mutiple times
                    this._show = false;
                    this._hideTimeout = setTimeout(zrUtil.bind(this.hide, this), time);
                } else {
                    this.hide();
                }
            }
        },
        isShow: function () {
            return this._show;
        }
    };
    return TooltipContent;
});
define('echarts/component/marker/markerHelper', ['require', 'zrender/core/util', '../../util/number'], function (require) {
    var zrUtil = require('zrender/core/util');
    var numberUtil = require('../../util/number');
    var indexOf = zrUtil.indexOf;
    function hasXOrY(item) {
        return !(isNaN(parseFloat(item.x)) && isNaN(parseFloat(item.y)));
    }
    function hasXAndY(item) {
        return !isNaN(parseFloat(item.x)) && !isNaN(parseFloat(item.y));
    }
    function getPrecision(data, valueAxisDim, dataIndex) {
        var precision = -1;
        do {
            precision = Math.max(numberUtil.getPrecision(data.get(valueAxisDim, dataIndex)), precision);
            data = data.stackedOn;
        } while (data);
        return precision;
    }
    function markerTypeCalculatorWithExtent(mlType, data, otherDataDim, targetDataDim, otherCoordIndex, targetCoordIndex) {
        var coordArr = [];
        var value = numCalculate(data, targetDataDim, mlType);
        var dataIndex = data.indexOfNearest(targetDataDim, value, true);
        coordArr[otherCoordIndex] = data.get(otherDataDim, dataIndex, true);
        coordArr[targetCoordIndex] = data.get(targetDataDim, dataIndex, true);
        var precision = getPrecision(data, targetDataDim, dataIndex);
        if (precision >= 0) {
            coordArr[targetCoordIndex] = +coordArr[targetCoordIndex].toFixed(precision);
        }
        return coordArr;
    }
    var curry = zrUtil.curry;
    // TODO Specified percent
    var markerTypeCalculator = {
            min: curry(markerTypeCalculatorWithExtent, 'min'),
            max: curry(markerTypeCalculatorWithExtent, 'max'),
            average: curry(markerTypeCalculatorWithExtent, 'average')
        };
    /**
     * Transform markPoint data item to format used in List by do the following
     * 1. Calculate statistic like `max`, `min`, `average`
     * 2. Convert `item.xAxis`, `item.yAxis` to `item.coord` array
     * @param  {module:echarts/model/Series} seriesModel
     * @param  {module:echarts/coord/*} [coordSys]
     * @param  {Object} item
     * @return {Object}
     */
    var dataTransform = function (seriesModel, item) {
        var data = seriesModel.getData();
        var coordSys = seriesModel.coordinateSystem;
        // 1. If not specify the position with pixel directly
        // 2. If `coord` is not a data array. Which uses `xAxis`,
        // `yAxis` to specify the coord on each dimension
        // parseFloat first because item.x and item.y can be percent string like '20%'
        if (item && !hasXAndY(item) && !zrUtil.isArray(item.coord) && coordSys) {
            var dims = coordSys.dimensions;
            var axisInfo = getAxisInfo(item, data, coordSys, seriesModel);
            // Clone the option
            // Transform the properties xAxis, yAxis, radiusAxis, angleAxis, geoCoord to value
            item = zrUtil.clone(item);
            if (item.type && markerTypeCalculator[item.type] && axisInfo.baseAxis && axisInfo.valueAxis) {
                var otherCoordIndex = indexOf(dims, axisInfo.baseAxis.dim);
                var targetCoordIndex = indexOf(dims, axisInfo.valueAxis.dim);
                item.coord = markerTypeCalculator[item.type](data, axisInfo.baseDataDim, axisInfo.valueDataDim, otherCoordIndex, targetCoordIndex);
                // Force to use the value of calculated value.
                item.value = item.coord[targetCoordIndex];
            } else {
                // FIXME Only has one of xAxis and yAxis.
                var coord = [
                        item.xAxis != null ? item.xAxis : item.radiusAxis,
                        item.yAxis != null ? item.yAxis : item.angleAxis
                    ];
                // Each coord support max, min, average
                for (var i = 0; i < 2; i++) {
                    if (markerTypeCalculator[coord[i]]) {
                        var dataDim = seriesModel.coordDimToDataDim(dims[i])[0];
                        coord[i] = numCalculate(data, dataDim, coord[i]);
                    }
                }
                item.coord = coord;
            }
        }
        return item;
    };
    var getAxisInfo = function (item, data, coordSys, seriesModel) {
        var ret = {};
        if (item.valueIndex != null || item.valueDim != null) {
            ret.valueDataDim = item.valueIndex != null ? data.getDimension(item.valueIndex) : item.valueDim;
            ret.valueAxis = coordSys.getAxis(seriesModel.dataDimToCoordDim(ret.valueDataDim));
            ret.baseAxis = coordSys.getOtherAxis(ret.valueAxis);
            ret.baseDataDim = seriesModel.coordDimToDataDim(ret.baseAxis.dim)[0];
        } else {
            ret.baseAxis = seriesModel.getBaseAxis();
            ret.valueAxis = coordSys.getOtherAxis(ret.baseAxis);
            ret.baseDataDim = seriesModel.coordDimToDataDim(ret.baseAxis.dim)[0];
            ret.valueDataDim = seriesModel.coordDimToDataDim(ret.valueAxis.dim)[0];
        }
        return ret;
    };
    /**
     * Filter data which is out of coordinateSystem range
     * [dataFilter description]
     * @param  {module:echarts/coord/*} [coordSys]
     * @param  {Object} item
     * @return {boolean}
     */
    var dataFilter = function (coordSys, item) {
        // Alwalys return true if there is no coordSys
        return coordSys && coordSys.containData && item.coord && !hasXOrY(item) ? coordSys.containData(item.coord) : true;
    };
    var dimValueGetter = function (item, dimName, dataIndex, dimIndex) {
        // x, y, radius, angle
        if (dimIndex < 2) {
            return item.coord && item.coord[dimIndex];
        }
        return item.value;
    };
    var numCalculate = function (data, valueDataDim, type) {
        if (type === 'average') {
            var sum = 0;
            var count = 0;
            data.each(valueDataDim, function (val, idx) {
                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            }, true);
            return sum / count;
        } else {
            return data.getDataExtent(valueDataDim, true)[type === 'max' ? 1 : 0];
        }
    };
    return {
        dataTransform: dataTransform,
        dataFilter: dataFilter,
        dimValueGetter: dimValueGetter,
        getAxisInfo: getAxisInfo,
        numCalculate: numCalculate
    };
});
define('echarts/component/marker/MarkerView', ['require', '../../echarts'], function (require) {
    return require('../../echarts').extendComponentView({
        type: 'marker',
        init: function () {
            /**
             * Markline grouped by series
             * @private
             * @type {Object}
             */
            this.markerGroupMap = {};
        },
        render: function (markerModel, ecModel, api) {
            var markerGroupMap = this.markerGroupMap;
            for (var name in markerGroupMap) {
                if (markerGroupMap.hasOwnProperty(name)) {
                    markerGroupMap[name].__keep = false;
                }
            }
            var markerModelKey = this.type + 'Model';
            ecModel.eachSeries(function (seriesModel) {
                var markerModel = seriesModel[markerModelKey];
                markerModel && this.renderSeries(seriesModel, markerModel, ecModel, api);
            }, this);
            for (var name in markerGroupMap) {
                if (markerGroupMap.hasOwnProperty(name) && !markerGroupMap[name].__keep) {
                    this.group.remove(markerGroupMap[name].group);
                }
            }
        },
        renderSeries: function () {
        }
    });
});
define('echarts/component/axis/AxisBuilder', ['require', 'zrender/core/util', '../../util/format', '../../util/graphic', '../../model/Model', '../../util/number', 'zrender/core/vector'], function (require) {
    var zrUtil = require('zrender/core/util');
    var formatUtil = require('../../util/format');
    var graphic = require('../../util/graphic');
    var Model = require('../../model/Model');
    var numberUtil = require('../../util/number');
    var remRadian = numberUtil.remRadian;
    var isRadianAroundZero = numberUtil.isRadianAroundZero;
    var vec2 = require('zrender/core/vector');
    var v2ApplyTransform = vec2.applyTransform;
    var retrieve = zrUtil.retrieve;
    var PI = Math.PI;
    function makeAxisEventDataBase(axisModel) {
        var eventData = { componentType: axisModel.mainType };
        eventData[axisModel.mainType + 'Index'] = axisModel.componentIndex;
        return eventData;
    }
    /**
     * A final axis is translated and rotated from a "standard axis".
     * So opt.position and opt.rotation is required.
     *
     * A standard axis is and axis from [0, 0] to [0, axisExtent[1]],
     * for example: (0, 0) ------------> (0, 50)
     *
     * nameDirection or tickDirection or labelDirection is 1 means tick
     * or label is below the standard axis, whereas is -1 means above
     * the standard axis. labelOffset means offset between label and axis,
     * which is useful when 'onZero', where axisLabel is in the grid and
     * label in outside grid.
     *
     * Tips: like always,
     * positive rotation represents anticlockwise, and negative rotation
     * represents clockwise.
     * The direction of position coordinate is the same as the direction
     * of screen coordinate.
     *
     * Do not need to consider axis 'inverse', which is auto processed by
     * axis extent.
     *
     * @param {module:zrender/container/Group} group
     * @param {Object} axisModel
     * @param {Object} opt Standard axis parameters.
     * @param {Array.<number>} opt.position [x, y]
     * @param {number} opt.rotation by radian
     * @param {number} [opt.nameDirection=1] 1 or -1 Used when nameLocation is 'middle'.
     * @param {number} [opt.tickDirection=1] 1 or -1
     * @param {number} [opt.labelDirection=1] 1 or -1
     * @param {number} [opt.labelOffset=0] Usefull when onZero.
     * @param {string} [opt.axisLabelShow] default get from axisModel.
     * @param {string} [opt.axisName] default get from axisModel.
     * @param {number} [opt.axisNameAvailableWidth]
     * @param {number} [opt.labelRotation] by degree, default get from axisModel.
     * @param {number} [opt.labelInterval] Default label interval when label
     *                                     interval from model is null or 'auto'.
     * @param {number} [opt.strokeContainThreshold] Default label interval when label
     */
    var AxisBuilder = function (axisModel, opt) {
        /**
         * @readOnly
         */
        this.opt = opt;
        /**
         * @readOnly
         */
        this.axisModel = axisModel;
        // Default value
        zrUtil.defaults(opt, {
            labelOffset: 0,
            nameDirection: 1,
            tickDirection: 1,
            labelDirection: 1,
            silent: true
        });
        /**
         * @readOnly
         */
        this.group = new graphic.Group();
        // FIXME Not use a seperate text group?
        var dumbGroup = new graphic.Group({
                position: opt.position.slice(),
                rotation: opt.rotation
            });
        // this.group.add(dumbGroup);
        // this._dumbGroup = dumbGroup;
        dumbGroup.updateTransform();
        this._transform = dumbGroup.transform;
        this._dumbGroup = dumbGroup;
    };
    AxisBuilder.prototype = {
        constructor: AxisBuilder,
        hasBuilder: function (name) {
            return !!builders[name];
        },
        add: function (name) {
            builders[name].call(this);
        },
        getGroup: function () {
            return this.group;
        }
    };
    var builders = {
            axisLine: function () {
                var opt = this.opt;
                var axisModel = this.axisModel;
                if (!axisModel.get('axisLine.show')) {
                    return;
                }
                var extent = this.axisModel.axis.getExtent();
                var matrix = this._transform;
                var pt1 = [
                        extent[0],
                        0
                    ];
                var pt2 = [
                        extent[1],
                        0
                    ];
                if (matrix) {
                    v2ApplyTransform(pt1, pt1, matrix);
                    v2ApplyTransform(pt2, pt2, matrix);
                }
                this.group.add(new graphic.Line(graphic.subPixelOptimizeLine({
                    anid: 'line',
                    shape: {
                        x1: pt1[0],
                        y1: pt1[1],
                        x2: pt2[0],
                        y2: pt2[1]
                    },
                    style: zrUtil.extend({ lineCap: 'round' }, axisModel.getModel('axisLine.lineStyle').getLineStyle()),
                    strokeContainThreshold: opt.strokeContainThreshold || 5,
                    silent: true,
                    z2: 1
                })));
            },
            axisTick: function () {
                var axisModel = this.axisModel;
                var axis = axisModel.axis;
                if (!axisModel.get('axisTick.show') || axis.isBlank()) {
                    return;
                }
                var tickModel = axisModel.getModel('axisTick');
                var opt = this.opt;
                var lineStyleModel = tickModel.getModel('lineStyle');
                var tickLen = tickModel.get('length');
                var tickInterval = getInterval(tickModel, opt.labelInterval);
                var ticksCoords = axis.getTicksCoords(tickModel.get('alignWithLabel'));
                var ticks = axis.scale.getTicks();
                var pt1 = [];
                var pt2 = [];
                var matrix = this._transform;
                for (var i = 0; i < ticksCoords.length; i++) {
                    // Only ordinal scale support tick interval
                    if (ifIgnoreOnTick(axis, i, tickInterval)) {
                        continue;
                    }
                    var tickCoord = ticksCoords[i];
                    pt1[0] = tickCoord;
                    pt1[1] = 0;
                    pt2[0] = tickCoord;
                    pt2[1] = opt.tickDirection * tickLen;
                    if (matrix) {
                        v2ApplyTransform(pt1, pt1, matrix);
                        v2ApplyTransform(pt2, pt2, matrix);
                    }
                    // Tick line, Not use group transform to have better line draw
                    this.group.add(new graphic.Line(graphic.subPixelOptimizeLine({
                        anid: 'tick_' + ticks[i],
                        shape: {
                            x1: pt1[0],
                            y1: pt1[1],
                            x2: pt2[0],
                            y2: pt2[1]
                        },
                        style: zrUtil.defaults(lineStyleModel.getLineStyle(), { stroke: axisModel.get('axisLine.lineStyle.color') }),
                        z2: 2,
                        silent: true
                    })));
                }
            },
            axisLabel: function () {
                var opt = this.opt;
                var axisModel = this.axisModel;
                var axis = axisModel.axis;
                var show = retrieve(opt.axisLabelShow, axisModel.get('axisLabel.show'));
                if (!show || axis.isBlank()) {
                    return;
                }
                var labelModel = axisModel.getModel('axisLabel');
                var textStyleModel = labelModel.getModel('textStyle');
                var labelMargin = labelModel.get('margin');
                var ticks = axis.scale.getTicks();
                var labels = axisModel.getFormattedLabels();
                // Special label rotate.
                var labelRotation = retrieve(opt.labelRotation, labelModel.get('rotate')) || 0;
                // To radian.
                labelRotation = labelRotation * PI / 180;
                var labelLayout = innerTextLayout(opt, labelRotation, opt.labelDirection);
                var categoryData = axisModel.get('data');
                var textEls = [];
                var silent = isSilent(axisModel);
                var triggerEvent = axisModel.get('triggerEvent');
                zrUtil.each(ticks, function (tickVal, index) {
                    if (ifIgnoreOnTick(axis, index, opt.labelInterval)) {
                        return;
                    }
                    var itemTextStyleModel = textStyleModel;
                    if (categoryData && categoryData[tickVal] && categoryData[tickVal].textStyle) {
                        itemTextStyleModel = new Model(categoryData[tickVal].textStyle, textStyleModel, axisModel.ecModel);
                    }
                    var textColor = itemTextStyleModel.getTextColor() || axisModel.get('axisLine.lineStyle.color');
                    var tickCoord = axis.dataToCoord(tickVal);
                    var pos = [
                            tickCoord,
                            opt.labelOffset + opt.labelDirection * labelMargin
                        ];
                    var labelBeforeFormat = axis.scale.getLabel(tickVal);
                    var textEl = new graphic.Text({
                            anid: 'label_' + tickVal,
                            style: {
                                text: labels[index],
                                textAlign: itemTextStyleModel.get('align', true) || labelLayout.textAlign,
                                textVerticalAlign: itemTextStyleModel.get('baseline', true) || labelLayout.verticalAlign,
                                textFont: itemTextStyleModel.getFont(),
                                fill: typeof textColor === 'function' ? textColor(labelBeforeFormat) : textColor
                            },
                            position: pos,
                            rotation: labelLayout.rotation,
                            silent: silent,
                            z2: 10
                        });
                    // Pack data for mouse event
                    if (triggerEvent) {
                        textEl.eventData = makeAxisEventDataBase(axisModel);
                        textEl.eventData.targetType = 'axisLabel';
                        textEl.eventData.value = labelBeforeFormat;
                    }
                    // FIXME
                    this._dumbGroup.add(textEl);
                    textEl.updateTransform();
                    textEls.push(textEl);
                    this.group.add(textEl);
                    textEl.decomposeTransform();
                }, this);
                function isTwoLabelOverlapped(current, next) {
                    var firstRect = current && current.getBoundingRect().clone();
                    var nextRect = next && next.getBoundingRect().clone();
                    if (firstRect && nextRect) {
                        firstRect.applyTransform(current.getLocalTransform());
                        nextRect.applyTransform(next.getLocalTransform());
                        return firstRect.intersect(nextRect);
                    }
                }
                // If min or max are user set, we need to check
                // If the tick on min(max) are overlap on their neighbour tick
                // If they are overlapped, we need to hide the min(max) tick label
                if (axisModel.getMin() != null) {
                    var firstLabel = textEls[0];
                    var nextLabel = textEls[1];
                    if (isTwoLabelOverlapped(firstLabel, nextLabel)) {
                        firstLabel.ignore = true;
                    }
                }
                if (axisModel.getMax() != null) {
                    var lastLabel = textEls[textEls.length - 1];
                    var prevLabel = textEls[textEls.length - 2];
                    if (isTwoLabelOverlapped(prevLabel, lastLabel)) {
                        lastLabel.ignore = true;
                    }
                }
            },
            axisName: function () {
                var opt = this.opt;
                var axisModel = this.axisModel;
                var name = retrieve(opt.axisName, axisModel.get('name'));
                if (!name) {
                    return;
                }
                var nameLocation = axisModel.get('nameLocation');
                var nameDirection = opt.nameDirection;
                var textStyleModel = axisModel.getModel('nameTextStyle');
                var gap = axisModel.get('nameGap') || 0;
                var extent = this.axisModel.axis.getExtent();
                var gapSignal = extent[0] > extent[1] ? -1 : 1;
                var pos = [
                        nameLocation === 'start' ? extent[0] - gapSignal * gap : nameLocation === 'end' ? extent[1] + gapSignal * gap : (extent[0] + extent[1]) / 2,
                        nameLocation === 'middle' ? opt.labelOffset + nameDirection * gap : 0
                    ];
                var labelLayout;
                var nameRotation = axisModel.get('nameRotate');
                if (nameRotation != null) {
                    nameRotation = nameRotation * PI / 180;    // To radian.
                }
                var axisNameAvailableWidth;
                if (nameLocation === 'middle') {
                    labelLayout = innerTextLayout(opt, nameRotation != null ? nameRotation : opt.rotation, nameDirection);
                } else {
                    labelLayout = endTextLayout(opt, nameLocation, nameRotation || 0, extent);
                    axisNameAvailableWidth = opt.axisNameAvailableWidth;
                    if (axisNameAvailableWidth != null) {
                        axisNameAvailableWidth = Math.abs(axisNameAvailableWidth / Math.sin(labelLayout.rotation));
                        !isFinite(axisNameAvailableWidth) && (axisNameAvailableWidth = null);
                    }
                }
                var textFont = textStyleModel.getFont();
                var truncateOpt = axisModel.get('nameTruncate', true) || {};
                var ellipsis = truncateOpt.ellipsis;
                var maxWidth = retrieve(truncateOpt.maxWidth, axisNameAvailableWidth);
                var truncatedText = ellipsis != null && maxWidth != null ? formatUtil.truncateText(name, maxWidth, textFont, ellipsis, {
                        minChar: 2,
                        placeholder: truncateOpt.placeholder
                    }) : name;
                var tooltipOpt = axisModel.get('tooltip', true);
                var mainType = axisModel.mainType;
                var formatterParams = {
                        componentType: mainType,
                        name: name,
                        $vars: ['name']
                    };
                formatterParams[mainType + 'Index'] = axisModel.componentIndex;
                var textEl = new graphic.Text({
                        anid: 'name',
                        __fullText: name,
                        __truncatedText: truncatedText,
                        style: {
                            text: truncatedText,
                            textFont: textFont,
                            fill: textStyleModel.getTextColor() || axisModel.get('axisLine.lineStyle.color'),
                            textAlign: labelLayout.textAlign,
                            textVerticalAlign: labelLayout.verticalAlign
                        },
                        position: pos,
                        rotation: labelLayout.rotation,
                        silent: isSilent(axisModel),
                        z2: 1,
                        tooltip: tooltipOpt && tooltipOpt.show ? zrUtil.extend({
                            content: name,
                            formatter: function () {
                                return name;
                            },
                            formatterParams: formatterParams
                        }, tooltipOpt) : null
                    });
                if (axisModel.get('triggerEvent')) {
                    textEl.eventData = makeAxisEventDataBase(axisModel);
                    textEl.eventData.targetType = 'axisName';
                    textEl.eventData.name = name;
                }
                // FIXME
                this._dumbGroup.add(textEl);
                textEl.updateTransform();
                this.group.add(textEl);
                textEl.decomposeTransform();
            }
        };
    /**
     * @inner
     */
    function innerTextLayout(opt, textRotation, direction) {
        var rotationDiff = remRadian(textRotation - opt.rotation);
        var textAlign;
        var verticalAlign;
        if (isRadianAroundZero(rotationDiff)) {
            // Label is parallel with axis line.
            verticalAlign = direction > 0 ? 'top' : 'bottom';
            textAlign = 'center';
        } else if (isRadianAroundZero(rotationDiff - PI)) {
            // Label is inverse parallel with axis line.
            verticalAlign = direction > 0 ? 'bottom' : 'top';
            textAlign = 'center';
        } else {
            verticalAlign = 'middle';
            if (rotationDiff > 0 && rotationDiff < PI) {
                textAlign = direction > 0 ? 'right' : 'left';
            } else {
                textAlign = direction > 0 ? 'left' : 'right';
            }
        }
        return {
            rotation: rotationDiff,
            textAlign: textAlign,
            verticalAlign: verticalAlign
        };
    }
    /**
     * @inner
     */
    function endTextLayout(opt, textPosition, textRotate, extent) {
        var rotationDiff = remRadian(textRotate - opt.rotation);
        var textAlign;
        var verticalAlign;
        var inverse = extent[0] > extent[1];
        var onLeft = textPosition === 'start' && !inverse || textPosition !== 'start' && inverse;
        if (isRadianAroundZero(rotationDiff - PI / 2)) {
            verticalAlign = onLeft ? 'bottom' : 'top';
            textAlign = 'center';
        } else if (isRadianAroundZero(rotationDiff - PI * 1.5)) {
            verticalAlign = onLeft ? 'top' : 'bottom';
            textAlign = 'center';
        } else {
            verticalAlign = 'middle';
            if (rotationDiff < PI * 1.5 && rotationDiff > PI / 2) {
                textAlign = onLeft ? 'left' : 'right';
            } else {
                textAlign = onLeft ? 'right' : 'left';
            }
        }
        return {
            rotation: rotationDiff,
            textAlign: textAlign,
            verticalAlign: verticalAlign
        };
    }
    /**
     * @inner
     */
    function isSilent(axisModel) {
        var tooltipOpt = axisModel.get('tooltip');
        return axisModel.get('silent') || !(axisModel.get('triggerEvent') || tooltipOpt && tooltipOpt.show);
    }
    /**
     * @static
     */
    var ifIgnoreOnTick = AxisBuilder.ifIgnoreOnTick = function (axis, i, interval) {
            var rawTick;
            var scale = axis.scale;
            return scale.type === 'ordinal' && (typeof interval === 'function' ? (rawTick = scale.getTicks()[i], !interval(rawTick, scale.getLabel(rawTick))) : i % (interval + 1));
        };
    /**
     * @static
     */
    var getInterval = AxisBuilder.getInterval = function (model, labelInterval) {
            var interval = model.get('interval');
            if (interval == null || interval == 'auto') {
                interval = labelInterval;
            }
            return interval;
        };
    return AxisBuilder;
});
define('zrender', ['zrender/zrender'], function (zrender) { return zrender;});
define('echarts', ['echarts/echarts'], function (echarts) { return echarts;});
var echarts = require('echarts');

echarts.graphic = require('echarts/util/graphic');
echarts.number = require('echarts/util/number');
echarts.format = require('echarts/util/format');


require('echarts/chart/bar');

require('echarts/chart/line');

require('echarts/chart/gauge');


require('echarts/component/grid');

require('echarts/component/title');

require('echarts/component/legend');

require('echarts/component/tooltip');

require('echarts/component/markPoint');




return echarts;
}));