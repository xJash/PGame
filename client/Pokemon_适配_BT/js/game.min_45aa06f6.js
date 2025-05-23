var __reflect = this && this.__reflect || function (t, e, r) {
    t.__class__ = e, r ? r.push(e) : r = [e], t.__types__ = t.__types__ ? r.concat(t.__types__) : r
},
    __extends = this && this.__extends || function (t, e) {
        function r() {
            this.constructor = t
        }
        for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]);
        r.prototype = e.prototype, t.prototype = new r
    },
    egret;
! function (t) {
    var e = function () {
        function t() { }
        return t.BINARY = "binary", t.TEXT = "text", t.VARIABLES = "variables", t.TEXTURE = "texture", t.SOUND = "sound", t
    }();
    t.URLLoaderDataFormat = e, __reflect(e.prototype, "egret.URLLoaderDataFormat")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (t) {
        function e(e, r, i) {
            var o = t.call(this) || this;
            return o._name = e, o._frame = 0 | r, i && (o._end = 0 | i), o
        }
        return __extends(e, t), Object.defineProperty(e.prototype, "name", {
            get: function () {
                return this._name
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(e.prototype, "frame", {
            get: function () {
                return this._frame
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(e.prototype, "end", {
            get: function () {
                return this._end
            },
            enumerable: !0,
            configurable: !0
        }), e.prototype.clone = function () {
            return new e(this._name, this._frame, this._end)
        }, e
    }(t.EventDispatcher);
    t.FrameLabel = e, __reflect(e.prototype, "egret.FrameLabel")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (e) {
        function r() {
            var t = e.call(this) || this;
            return t.$mcData = null, t.numFrames = 1, t.frames = [], t.labels = null, t.events = [], t.frameRate = 0, t.textureData = null, t.spriteSheet = null, t
        }
        return __extends(r, e), r.prototype.$init = function (t, e, r) {
            this.textureData = e, this.spriteSheet = r, this.setMCData(t)
        }, r.prototype.getKeyFrameData = function (t) {
            var e = this.frames[t - 1];
            return e.frame && (e = this.frames[e.frame - 1]), e
        }, r.prototype.getTextureByFrame = function (t) {
            var e = this.getKeyFrameData(t);
            if (e.res) {
                var r = this.getTextureByResName(e.res);
                return r
            }
            return null
        }, r.prototype.$getOffsetByFrame = function (t, e) {
            var r = this.getKeyFrameData(t);
            r.res && e.setTo(0 | r.x, 0 | r.y)
        }, r.prototype.getTextureByResName = function (t) {
            if (null == this.spriteSheet) return null;
            var e = this.spriteSheet.getTexture(t);
            if (!e) {
                var r = this.textureData[t];
                e = this.spriteSheet.createTexture(t, r.x, r.y, r.w, r.h)
            }
            return e
        }, r.prototype.$isDataValid = function () {
            return this.frames.length > 0
        }, r.prototype.$isTextureValid = function () {
            return null != this.textureData && null != this.spriteSheet
        }, r.prototype.$fillMCData = function (t) {
            this.frameRate = t.frameRate || 24, this.fillFramesData(t.frames), this.fillFrameLabelsData(t.labels), this.fillFrameEventsData(t.events)
        }, r.prototype.fillFramesData = function (t) {
            for (var e, r = this.frames, i = t ? t.length : 0, o = 0; i > o; o++) {
                var n = t[o];
                if (r.push(n), n.duration) {
                    var s = parseInt(n.duration);
                    if (s > 1) {
                        e = r.length;
                        for (var a = 1; s > a; a++) r.push({
                            frame: e
                        })
                    }
                }
            }
            this.numFrames = r.length
        }, r.prototype.fillFrameLabelsData = function (e) {
            if (e) {
                var r = e.length;
                if (r > 0) {
                    this.labels = [];
                    for (var i = 0; r > i; i++) {
                        var o = e[i];
                        this.labels.push(new t.FrameLabel(o.name, o.frame, o.end))
                    }
                }
            }
        }, r.prototype.fillFrameEventsData = function (t) {
            if (t) {
                var e = t.length;
                if (e > 0) {
                    this.events = [];
                    for (var r = 0; e > r; r++) {
                        var i = t[r];
                        this.events[i.frame] = i.name
                    }
                }
            }
        }, Object.defineProperty(r.prototype, "mcData", {
            get: function () {
                return this.$mcData
            },
            set: function (t) {
                this.setMCData(t)
            },
            enumerable: !0,
            configurable: !0
        }), r.prototype.setMCData = function (t) {
            this.$mcData != t && (this.$mcData = t, t && this.$fillMCData(t))
        }, r
    }(t.HashObject);
    t.MovieClipData = e, __reflect(e.prototype, "egret.MovieClipData")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (e) {
        function r(t, r) {
            var i = e.call(this) || this;
            return i.enableCache = !0, i.$mcDataCache = {}, i.$mcDataSet = t, i.setTexture(r), i
        }
        return __extends(r, e), r.prototype.clearCache = function () {
            this.$mcDataCache = {}
        }, r.prototype.generateMovieClipData = function (e) {
            if (void 0 === e && (e = ""), "" == e && this.$mcDataSet)
                for (e in this.$mcDataSet.mc) break;
            if ("" == e) return null;
            var r = this.findFromCache(e, this.$mcDataCache);
            return r || (r = new t.MovieClipData, this.fillData(e, r, this.$mcDataCache)), r
        }, r.prototype.findFromCache = function (t, e) {
            return this.enableCache && e[t] ? e[t] : null
        }, r.prototype.fillData = function (t, e, r) {
            if (this.$mcDataSet) {
                var i = this.$mcDataSet.mc[t];
                i && (e.$init(i, this.$mcDataSet.res, this.$spriteSheet), this.enableCache && (r[t] = e))
            }
        }, Object.defineProperty(r.prototype, "mcDataSet", {
            get: function () {
                return this.$mcDataSet
            },
            set: function (t) {
                this.$mcDataSet = t
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "texture", {
            set: function (t) {
                this.setTexture(t)
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "spriteSheet", {
            get: function () {
                return this.$spriteSheet
            },
            enumerable: !0,
            configurable: !0
        }), r.prototype.setTexture = function (e) {
            this.$spriteSheet = e ? new t.SpriteSheet(e) : null
        }, r
    }(t.EventDispatcher);
    t.MovieClipDataFactory = e, __reflect(e.prototype, "egret.MovieClipDataFactory")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (e) {
        function r(t, r, i, o) {
            void 0 === r && (r = !1), void 0 === i && (i = !1), void 0 === o && (o = null);
            var n = e.call(this, t, r, i) || this;
            return n.frameLabel = null, n.frameLabel = o, n
        }
        return __extends(r, e), r.dispatchMovieClipEvent = function (e, i, o) {
            void 0 === o && (o = null);
            var n = t.Event.create(r, i);
            n.frameLabel = o;
            var s = e.dispatchEvent(n);
            return t.Event.release(n), s
        }, r.FRAME_LABEL = "frame_label", r
    }(t.Event);
    t.MovieClipEvent = e, __reflect(e.prototype, "egret.MovieClipEvent")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function () {
        function e() {
            t.$error(1014)
        }
        return e.get = function (t) {
            return -1 > t && (t = -1), t > 1 && (t = 1),
                function (e) {
                    return 0 == t ? e : 0 > t ? e * (e * -t + 1 + t) : e * ((2 - e) * t + (1 - t))
                }
        }, e.getPowOut = function (t) {
            return function (e) {
                return 1 - Math.pow(1 - e, t)
            }
        }, e.quintOut = e.getPowOut(5), e.quartOut = e.getPowOut(4), e
    }();
    t.ScrollEase = e, __reflect(e.prototype, "egret.ScrollEase");
    var r = function (e) {
        function r(t, r, i) {
            var o = e.call(this) || this;
            return o._target = null, o._useTicks = !1, o.ignoreGlobalPause = !1, o.loop = !1, o.pluginData = null, o._steps = null, o._actions = null, o.paused = !1, o.duration = 0, o._prevPos = -1, o.position = null, o._prevPosition = 0, o._stepPosition = 0, o.passive = !1, o.initialize(t, r, i), o
        }
        return __extends(r, e), r.get = function (t, e, i, o) {
            return void 0 === e && (e = null), void 0 === i && (i = null), void 0 === o && (o = !1), o && r.removeTweens(t), new r(t, e, i)
        }, r.removeTweens = function (t) {
            if (t.tween_count) {
                for (var e = r._tweens, i = e.length - 1; i >= 0; i--) e[i]._target == t && (e[i].paused = !0, e.splice(i, 1));
                t.tween_count = 0
            }
        }, r.tick = function (t, e) {
            void 0 === e && (e = !1);
            var i = t - r._lastTime;
            r._lastTime = t;
            for (var o = r._tweens.concat(), n = o.length - 1; n >= 0; n--) {
                var s = o[n];
                e && !s.ignoreGlobalPause || s.paused || s.tick(s._useTicks ? 1 : i)
            }
            return !1
        }, r._register = function (e, i) {
            var o = e._target,
                n = r._tweens;
            if (i) o && (o.tween_count = o.tween_count > 0 ? o.tween_count + 1 : 1), n.push(e), r._inited || (r._lastTime = t.getTimer(), t.ticker.$startTick(r.tick, null), r._inited = !0);
            else {
                o && o.tween_count--;
                for (var s = n.length; s--;)
                    if (n[s] == e) return void n.splice(s, 1)
            }
        }, r.prototype.initialize = function (t, e, i) {
            this._target = t, e && (this._useTicks = e.useTicks, this.ignoreGlobalPause = e.ignoreGlobalPause, this.loop = e.loop, e.onChange && this.addEventListener("change", e.onChange, e.onChangeObj), e.override && r.removeTweens(t)), this.pluginData = i || {}, this._curQueueProps = {}, this._initQueueProps = {}, this._steps = [], this._actions = [], e && e.paused ? this.paused = !0 : r._register(this, !0), e && null != e.position && this.setPosition(e.position)
        }, r.prototype.setPosition = function (t, e) {
            void 0 === e && (e = 1), 0 > t && (t = 0);
            var r = t,
                i = !1;
            if (r >= this.duration && (this.loop ? r %= this.duration : (r = this.duration, i = !0)), r == this._prevPos) return i;
            var o = this._prevPos;
            if (this.position = this._prevPos = r, this._prevPosition = t, this._target)
                if (i) this._updateTargetProps(null, 1);
                else if (this._steps.length > 0) {
                    var n = void 0,
                        s = this._steps.length;
                    for (n = 0; s > n && !(this._steps[n].t > r); n++);
                    var a = this._steps[n - 1];
                    this._updateTargetProps(a, (this._stepPosition = r - a.t) / a.d)
                }
            return i && this.setPaused(!0), 0 != e && this._actions.length > 0 && (this._useTicks ? this._runActions(r, r) : 1 == e && o > r ? (o != this.duration && this._runActions(o, this.duration), this._runActions(0, r, !0)) : this._runActions(o, r)), this.dispatchEventWith("change"), i
        }, r.prototype._runActions = function (t, e, r) {
            void 0 === r && (r = !1);
            var i = t,
                o = e,
                n = -1,
                s = this._actions.length,
                a = 1;
            for (t > e && (i = e, o = t, n = s, s = a = -1);
                (n += a) != s;) {
                var c = this._actions[n],
                    l = c.t;
                (l == o || l > i && o > l || r && l == t) && c.f.apply(c.o, c.p)
            }
        }, r.prototype._updateTargetProps = function (t, e) {
            var i, o, n, s, a, c;
            if (t || 1 != e) {
                if (this.passive = !!t.v, this.passive) return;
                t.e && (e = t.e(e, 0, 1, 1)), i = t.p0, o = t.p1
            } else this.passive = !1, i = o = this._curQueueProps;
            for (var l in this._initQueueProps) {
                null == (s = i[l]) && (i[l] = s = this._initQueueProps[l]), null == (a = o[l]) && (o[l] = a = s), n = s == a || 0 == e || 1 == e || "number" != typeof s ? 1 == e ? a : s : s + (a - s) * e;
                var h = !1;
                if (c = r._plugins[l])
                    for (var u = 0, p = c.length; p > u; u++) {
                        var _ = c[u].tween(this, l, n, i, o, e, !!t && i == o, !t);
                        _ == r.IGNORE ? h = !0 : n = _
                    }
                h || (this._target[l] = n)
            }
        }, r.prototype.setPaused = function (t) {
            return this.paused = t, r._register(this, !t), this
        }, r.prototype._cloneProps = function (t) {
            var e = {};
            for (var r in t) e[r] = t[r];
            return e
        }, r.prototype._addStep = function (t) {
            return t.d > 0 && (this._steps.push(t), t.t = this.duration, this.duration += t.d), this
        }, r.prototype._appendQueueProps = function (t) {
            var e, i, o, n, s;
            for (var a in t)
                if (void 0 === this._initQueueProps[a]) {
                    if (i = this._target[a], e = r._plugins[a])
                        for (o = 0, n = e.length; n > o; o++) i = e[o].init(this, a, i);
                    this._initQueueProps[a] = this._curQueueProps[a] = void 0 === i ? null : i
                } else i = this._curQueueProps[a];
            for (var a in t) {
                if (i = this._curQueueProps[a], e = r._plugins[a])
                    for (s = s || {}, o = 0, n = e.length; n > o; o++) e[o].step && e[o].step(this, a, i, t[a], s);
                this._curQueueProps[a] = t[a]
            }
            return s && this._appendQueueProps(s), this._curQueueProps
        }, r.prototype._addAction = function (t) {
            return t.t = this.duration, this._actions.push(t), this
        }, r.prototype.to = function (t, e, r) {
            return void 0 === r && (r = void 0), (isNaN(e) || 0 > e) && (e = 0), this._addStep({
                d: e || 0,
                p0: this._cloneProps(this._curQueueProps),
                e: r,
                p1: this._cloneProps(this._appendQueueProps(t))
            })
        }, r.prototype.call = function (t, e, r) {
            return void 0 === e && (e = void 0), void 0 === r && (r = void 0), this._addAction({
                f: t,
                p: r ? r : [],
                o: e ? e : this._target
            })
        }, r.prototype.tick = function (t) {
            this.paused || this.setPosition(this._prevPosition + t)
        }, r._tweens = [], r.IGNORE = {}, r._plugins = {}, r._inited = !1, r._lastTime = 0, r
    }(t.EventDispatcher);
    t.ScrollTween = r, __reflect(r.prototype, "egret.ScrollTween")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (e) {
        function r(r) {
            void 0 === r && (r = null);
            var i = e.call(this) || this;
            return i.scrollBeginThreshold = 10, i.scrollSpeed = 1, i._content = null, i.delayTouchBeginEvent = null, i.touchBeginTimer = null, i.touchEnabled = !0, i._ScrV_Props_ = new t.ScrollViewProperties, r && i.setContent(r), i
        }
        return __extends(r, e), Object.defineProperty(r.prototype, "bounces", {
            get: function () {
                return this._ScrV_Props_._bounces
            },
            set: function (t) {
                this._ScrV_Props_._bounces = !!t
            },
            enumerable: !0,
            configurable: !0
        }), r.prototype.setContent = function (t) {
            this._content !== t && (this.removeContent(), t && (this._content = t, e.prototype.addChild.call(this, t), this._addEvents()))
        }, r.prototype.removeContent = function () {
            this._content && (this._removeEvents(), e.prototype.removeChildAt.call(this, 0)), this._content = null
        }, Object.defineProperty(r.prototype, "verticalScrollPolicy", {
            get: function () {
                return this._ScrV_Props_._verticalScrollPolicy
            },
            set: function (t) {
                t != this._ScrV_Props_._verticalScrollPolicy && (this._ScrV_Props_._verticalScrollPolicy = t)
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "horizontalScrollPolicy", {
            get: function () {
                return this._ScrV_Props_._horizontalScrollPolicy
            },
            set: function (t) {
                t != this._ScrV_Props_._horizontalScrollPolicy && (this._ScrV_Props_._horizontalScrollPolicy = t)
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "scrollLeft", {
            get: function () {
                return this._ScrV_Props_._scrollLeft
            },
            set: function (t) {
                t != this._ScrV_Props_._scrollLeft && (this._ScrV_Props_._scrollLeft = t, this._validatePosition(!1, !0), this._updateContentPosition())
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "scrollTop", {
            get: function () {
                return this._ScrV_Props_._scrollTop
            },
            set: function (t) {
                t != this._ScrV_Props_._scrollTop && (this._ScrV_Props_._scrollTop = t, this._validatePosition(!0, !1), this._updateContentPosition())
            },
            enumerable: !0,
            configurable: !0
        }), r.prototype.setScrollPosition = function (t, e, r) {
            if (void 0 === r && (r = !1), (!r || 0 != t || 0 != e) && (r || this._ScrV_Props_._scrollTop != t || this._ScrV_Props_._scrollLeft != e)) {
                var i = this._ScrV_Props_._scrollTop,
                    o = this._ScrV_Props_._scrollLeft;
                if (r) {
                    var n = this.getMaxScrollLeft(),
                        s = this.getMaxScrollTop();
                    (0 >= i || i >= s) && (t /= 2), (0 >= o || o >= n) && (e /= 2);
                    var a = i + t,
                        c = o + e,
                        l = this._ScrV_Props_._bounces;
                    l || ((0 >= a || a >= s) && (a = Math.max(0, Math.min(a, s))), (0 >= c || c >= n) && (c = Math.max(0, Math.min(c, n)))), this._ScrV_Props_._scrollTop = a, this._ScrV_Props_._scrollLeft = c
                } else this._ScrV_Props_._scrollTop = t, this._ScrV_Props_._scrollLeft = e;
                this._validatePosition(!0, !0), this._updateContentPosition()
            }
        }, r.prototype._validatePosition = function (t, e) {
            if (void 0 === t && (t = !1), void 0 === e && (e = !1), t) {
                var r = this.height,
                    i = this._getContentHeight();
                this._ScrV_Props_._scrollTop = Math.max(this._ScrV_Props_._scrollTop, (0 - r) / 2), this._ScrV_Props_._scrollTop = Math.min(this._ScrV_Props_._scrollTop, i > r ? i - r / 2 : r / 2)
            }
            if (e) {
                var o = this.width,
                    n = this._getContentWidth();
                this._ScrV_Props_._scrollLeft = Math.max(this._ScrV_Props_._scrollLeft, (0 - o) / 2), this._ScrV_Props_._scrollLeft = Math.min(this._ScrV_Props_._scrollLeft, n > o ? n - o / 2 : o / 2)
            }
        }, r.prototype.$setWidth = function (t) {
            this.$explicitWidth != t && (e.prototype.$setWidth.call(this, t), this._updateContentPosition())
        }, r.prototype.$setHeight = function (t) {
            this.$explicitHeight != t && (e.prototype.$setHeight.call(this, t), this._updateContentPosition())
        }, r.prototype._updateContentPosition = function () {
            var e = this.height,
                r = this.width;
            this.scrollRect = new t.Rectangle(Math.round(this._ScrV_Props_._scrollLeft), Math.round(this._ScrV_Props_._scrollTop), r, e), this.dispatchEvent(new t.Event(t.Event.CHANGE))
        }, r.prototype._checkScrollPolicy = function () {
            var t = this._ScrV_Props_._horizontalScrollPolicy,
                e = this.__checkScrollPolicy(t, this._getContentWidth(), this.width);
            this._ScrV_Props_._hCanScroll = e;
            var r = this._ScrV_Props_._verticalScrollPolicy,
                i = this.__checkScrollPolicy(r, this._getContentHeight(), this.height);
            return this._ScrV_Props_._vCanScroll = i, e || i
        }, r.prototype.__checkScrollPolicy = function (t, e, r) {
            return "on" == t ? !0 : "off" == t ? !1 : e > r
        }, r.prototype._addEvents = function () {
            this.addEventListener(t.TouchEvent.TOUCH_BEGIN, this._onTouchBegin, this), this.addEventListener(t.TouchEvent.TOUCH_BEGIN, this._onTouchBeginCapture, this, !0), this.addEventListener(t.TouchEvent.TOUCH_END, this._onTouchEndCapture, this, !0)
        }, r.prototype._removeEvents = function () {
            this.removeEventListener(t.TouchEvent.TOUCH_BEGIN, this._onTouchBegin, this), this.removeEventListener(t.TouchEvent.TOUCH_BEGIN, this._onTouchBeginCapture, this, !0), this.removeEventListener(t.TouchEvent.TOUCH_END, this._onTouchEndCapture, this, !0)
        }, r.prototype._onTouchBegin = function (e) {
            if (!e.$isDefaultPrevented) {
                var r = this._checkScrollPolicy();
                r && (this._ScrV_Props_._touchStartPosition.x = e.stageX, this._ScrV_Props_._touchStartPosition.y = e.stageY, (this._ScrV_Props_._isHTweenPlaying || this._ScrV_Props_._isVTweenPlaying) && this._onScrollFinished(), this._tempStage = this.stage, this._tempStage.addEventListener(t.TouchEvent.TOUCH_MOVE, this._onTouchMove, this), this._tempStage.addEventListener(t.TouchEvent.TOUCH_END, this._onTouchEnd, this), this._tempStage.addEventListener(t.TouchEvent.LEAVE_STAGE, this._onTouchEnd, this), this.addEventListener(t.Event.ENTER_FRAME, this._onEnterFrame, this), this._logTouchEvent(e), e.preventDefault())
            }
        }, r.prototype._onTouchBeginCapture = function (e) {
            var r = this._checkScrollPolicy();
            if (r) {
                for (var i = e.target; i != this;) {
                    if ("_checkScrollPolicy" in i && (r = i._checkScrollPolicy())) return;
                    i = i.parent
                }
                e.stopPropagation();
                var o = this.cloneTouchEvent(e);
                this.delayTouchBeginEvent = o, this.touchBeginTimer || (this.touchBeginTimer = new t.Timer(100, 1), this.touchBeginTimer.addEventListener(t.TimerEvent.TIMER_COMPLETE, this._onTouchBeginTimer, this)), this.touchBeginTimer.start(), this._onTouchBegin(e)
            }
        }, r.prototype._onTouchEndCapture = function (e) {
            var r = this;
            if (this.delayTouchBeginEvent) {
                this._onTouchBeginTimer(), e.stopPropagation();
                var i = this.cloneTouchEvent(e);
                t.callLater(function () {
                    r.stage && r.dispatchPropagationEvent(i)
                }, this)
            }
        }, r.prototype._onTouchBeginTimer = function () {
            this.touchBeginTimer.stop();
            var t = this.delayTouchBeginEvent;
            this.delayTouchBeginEvent = null, this.stage && this.dispatchPropagationEvent(t)
        }, r.prototype.dispatchPropagationEvent = function (e) {
            for (var r = e.$target, i = this.$getPropagationList(r), o = i.length, n = .5 * i.length, s = -1, a = 0; o > a; a++)
                if (i[a] === this._content) {
                    s = a;
                    break
                } i.splice(0, s + 1), n -= s + 1, this.$dispatchPropagationEvent(e, i, n), t.Event.release(e)
        }, r.prototype._onTouchMove = function (t) {
            if (this._ScrV_Props_._lastTouchPosition.x != t.stageX || this._ScrV_Props_._lastTouchPosition.y != t.stageY) {
                if (!this._ScrV_Props_._scrollStarted) {
                    var e = t.stageX - this._ScrV_Props_._touchStartPosition.x,
                        r = t.stageY - this._ScrV_Props_._touchStartPosition.y,
                        i = Math.sqrt(e * e + r * r);
                    if (i < this.scrollBeginThreshold) return void this._logTouchEvent(t)
                }
                this._ScrV_Props_._scrollStarted = !0, this.delayTouchBeginEvent && (this.delayTouchBeginEvent = null, this.touchBeginTimer.stop()), this.touchChildren = !1;
                var o = this._getPointChange(t);
                this.setScrollPosition(o.y, o.x, !0), this._calcVelocitys(t), this._logTouchEvent(t)
            }
        }, r.prototype._onTouchEnd = function (e) {
            this.touchChildren = !0, this._ScrV_Props_._scrollStarted = !1, this._tempStage.removeEventListener(t.TouchEvent.TOUCH_MOVE, this._onTouchMove, this), this._tempStage.removeEventListener(t.TouchEvent.TOUCH_END, this._onTouchEnd, this), this._tempStage.removeEventListener(t.TouchEvent.LEAVE_STAGE, this._onTouchEnd, this), this.removeEventListener(t.Event.ENTER_FRAME, this._onEnterFrame, this), this._moveAfterTouchEnd()
        }, r.prototype._onEnterFrame = function (e) {
            var r = t.getTimer();
            r - this._ScrV_Props_._lastTouchTime > 100 && r - this._ScrV_Props_._lastTouchTime < 300 && this._calcVelocitys(this._ScrV_Props_._lastTouchEvent)
        }, r.prototype._logTouchEvent = function (e) {
            this._ScrV_Props_._lastTouchPosition.x = e.stageX, this._ScrV_Props_._lastTouchPosition.y = e.stageY, this._ScrV_Props_._lastTouchEvent = this.cloneTouchEvent(e), this._ScrV_Props_._lastTouchTime = t.getTimer()
        }, r.prototype._getPointChange = function (t) {
            return {
                x: this._ScrV_Props_._hCanScroll === !1 ? 0 : this._ScrV_Props_._lastTouchPosition.x - t.stageX,
                y: this._ScrV_Props_._vCanScroll === !1 ? 0 : this._ScrV_Props_._lastTouchPosition.y - t.stageY
            }
        }, r.prototype._calcVelocitys = function (e) {
            var r = t.getTimer();
            if (0 == this._ScrV_Props_._lastTouchTime) return void (this._ScrV_Props_._lastTouchTime = r);
            var i = this._getPointChange(e),
                o = r - this._ScrV_Props_._lastTouchTime;
            i.x /= o, i.y /= o, this._ScrV_Props_._velocitys.push(i), this._ScrV_Props_._velocitys.length > 5 && this._ScrV_Props_._velocitys.shift(), this._ScrV_Props_._lastTouchPosition.x = e.stageX, this._ScrV_Props_._lastTouchPosition.y = e.stageY
        }, r.prototype._getContentWidth = function () {
            return this._content.$explicitWidth || this._content.width
        }, r.prototype._getContentHeight = function () {
            return this._content.$explicitHeight || this._content.height
        }, r.prototype.getMaxScrollLeft = function () {
            var t = this._getContentWidth() - this.width;
            return Math.max(0, t)
        }, r.prototype.getMaxScrollTop = function () {
            var t = this._getContentHeight() - this.height;
            return Math.max(0, t)
        }, r.prototype._moveAfterTouchEnd = function () {
            if (0 != this._ScrV_Props_._velocitys.length) {
                for (var t = {
                    x: 0,
                    y: 0
                }, e = 0, i = 0; i < this._ScrV_Props_._velocitys.length; i++) {
                    var o = this._ScrV_Props_._velocitys[i],
                        n = r.weight[i];
                    t.x += o.x * n, t.y += o.y * n, e += n
                }
                this._ScrV_Props_._velocitys.length = 0, this.scrollSpeed <= 0 && (this.scrollSpeed = 1);
                var s = t.x / e * this.scrollSpeed,
                    a = t.y / e * this.scrollSpeed,
                    c = Math.abs(s),
                    l = Math.abs(a),
                    h = this.getMaxScrollLeft(),
                    u = this.getMaxScrollTop(),
                    p = c > .02 ? this.getAnimationDatas(s, this._ScrV_Props_._scrollLeft, h) : {
                        position: this._ScrV_Props_._scrollLeft,
                        duration: 1
                    },
                    _ = l > .02 ? this.getAnimationDatas(a, this._ScrV_Props_._scrollTop, u) : {
                        position: this._ScrV_Props_._scrollTop,
                        duration: 1
                    };
                this.setScrollLeft(p.position, p.duration), this.setScrollTop(_.position, _.duration)
            }
        }, r.prototype.onTweenFinished = function (t) {
            t == this._ScrV_Props_._vScrollTween && (this._ScrV_Props_._isVTweenPlaying = !1), t == this._ScrV_Props_._hScrollTween && (this._ScrV_Props_._isHTweenPlaying = !1), 0 == this._ScrV_Props_._isHTweenPlaying && 0 == this._ScrV_Props_._isVTweenPlaying && this._onScrollFinished()
        }, r.prototype._onScrollStarted = function () { }, r.prototype._onScrollFinished = function () {
            t.ScrollTween.removeTweens(this), this._ScrV_Props_._hScrollTween = null, this._ScrV_Props_._vScrollTween = null, this._ScrV_Props_._isHTweenPlaying = !1, this._ScrV_Props_._isVTweenPlaying = !1, this.dispatchEvent(new t.Event(t.Event.COMPLETE))
        }, r.prototype.setScrollTop = function (e, r) {
            void 0 === r && (r = 0);
            var i = Math.min(this.getMaxScrollTop(), Math.max(e, 0));
            if (0 == r) return void (this.scrollTop = i);
            0 == this._ScrV_Props_._bounces && (e = i);
            var o = t.ScrollTween.get(this).to({
                scrollTop: e
            }, r, t.ScrollEase.quartOut);
            i != e && o.to({
                scrollTop: i
            }, 300, t.ScrollEase.quintOut), this._ScrV_Props_._isVTweenPlaying = !0, this._ScrV_Props_._vScrollTween = o, o.call(this.onTweenFinished, this, [o]), this._ScrV_Props_._isHTweenPlaying || this._onScrollStarted()
        }, r.prototype.setScrollLeft = function (e, r) {
            void 0 === r && (r = 0);
            var i = Math.min(this.getMaxScrollLeft(), Math.max(e, 0));
            if (0 == r) return void (this.scrollLeft = i);
            0 == this._ScrV_Props_._bounces && (e = i);
            var o = t.ScrollTween.get(this).to({
                scrollLeft: e
            }, r, t.ScrollEase.quartOut);
            i != e && o.to({
                scrollLeft: i
            }, 300, t.ScrollEase.quintOut), this._ScrV_Props_._isHTweenPlaying = !0, this._ScrV_Props_._hScrollTween = o, o.call(this.onTweenFinished, this, [o]), this._ScrV_Props_._isVTweenPlaying || this._onScrollStarted()
        }, r.prototype.getAnimationDatas = function (t, e, r) {
            var i = Math.abs(t),
                o = .95,
                n = 0,
                s = .998,
                a = .02,
                c = e + 500 * t;
            if (0 > c || c > r)
                for (c = e; Math.abs(t) != 1 / 0 && Math.abs(t) > a;) c += t, t *= 0 > c || c > r ? s * o : s, n++;
            else n = 500 * -Math.log(a / i);
            var l = {
                position: Math.min(r + 50, Math.max(c, -50)),
                duration: n
            };
            return l
        }, r.prototype.cloneTouchEvent = function (e) {
            var r = new t.TouchEvent(e.type, e.bubbles, e.cancelable);
            return r.touchPointID = e.touchPointID, r.$stageX = e.stageX, r.$stageY = e.stageY, r.touchDown = e.touchDown, r.$isDefaultPrevented = !1, r.$target = e.target, r
        }, r.prototype.throwNotSupportedError = function () {
            t.$error(1023)
        }, r.prototype.addChild = function (t) {
            return this.throwNotSupportedError(), null
        }, r.prototype.addChildAt = function (t, e) {
            return this.throwNotSupportedError(), null
        }, r.prototype.removeChild = function (t) {
            return this.throwNotSupportedError(), null
        }, r.prototype.removeChildAt = function (t) {
            return this.throwNotSupportedError(), null
        }, r.prototype.setChildIndex = function (t, e) {
            this.throwNotSupportedError()
        }, r.prototype.swapChildren = function (t, e) {
            this.throwNotSupportedError()
        }, r.prototype.swapChildrenAt = function (t, e) {
            this.throwNotSupportedError()
        }, r.weight = [1, 1.33, 1.66, 2, 2.33], r
    }(t.DisplayObjectContainer);
    t.ScrollView = e, __reflect(e.prototype, "egret.ScrollView")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function () {
        function e() {
            this._verticalScrollPolicy = "auto", this._horizontalScrollPolicy = "auto", this._scrollLeft = 0, this._scrollTop = 0, this._hCanScroll = !1, this._vCanScroll = !1, this._lastTouchPosition = new t.Point(0, 0), this._touchStartPosition = new t.Point(0, 0), this._scrollStarted = !1, this._lastTouchTime = 0, this._lastTouchEvent = null, this._velocitys = [], this._isHTweenPlaying = !1, this._isVTweenPlaying = !1, this._hScrollTween = null, this._vScrollTween = null, this._bounces = !0
        }
        return e
    }();
    t.ScrollViewProperties = e, __reflect(e.prototype, "egret.ScrollViewProperties")
}(egret || (egret = {}));
var egret;
! function (t) {
    function e(e) {
        var r = e.url;
        return -1 == r.indexOf("?") && e.method == t.URLRequestMethod.GET && e.data && e.data instanceof t.URLVariables && (r = r + "?" + e.data.toString()), r
    }
    var r = function (r) {
        function i(e) {
            void 0 === e && (e = null);
            var i = r.call(this) || this;
            return i.dataFormat = t.URLLoaderDataFormat.TEXT, i.data = null, i._request = null, i._status = -1, e && i.load(e), i
        }
        return __extends(i, r), i.prototype.load = function (r) {
            this._request = r, this.data = null;
            var i = this;
            if (i.dataFormat == t.URLLoaderDataFormat.TEXTURE) return void this.loadTexture(i);
            if (i.dataFormat == t.URLLoaderDataFormat.SOUND) return void this.loadSound(i);
            var o = e(r),
                n = new t.HttpRequest;
            n.open(o, r.method == t.URLRequestMethod.POST ? t.HttpMethod.POST : t.HttpMethod.GET);
            var s;
            if (r.method != t.URLRequestMethod.GET && r.data)
                if (r.data instanceof t.URLVariables) {
                    n.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                    var a = r.data;
                    s = a.toString()
                } else n.setRequestHeader("Content-Type", "multipart/form-data"), s = r.data;
            else;
            for (var c = r.requestHeaders.length, l = 0; c > l; l++) {
                var h = r.requestHeaders[l];
                n.setRequestHeader(h.name, h.value)
            }
            n.addEventListener(t.Event.COMPLETE, function () {
                i.data = n.response, t.Event.dispatchEvent(i, t.Event.COMPLETE)
            }, this), n.addEventListener(t.IOErrorEvent.IO_ERROR, function () {
                t.IOErrorEvent.dispatchIOErrorEvent(i)
            }, this), n.responseType = i.dataFormat == t.URLLoaderDataFormat.BINARY ? t.HttpResponseType.ARRAY_BUFFER : t.HttpResponseType.TEXT, n.send(s)
        }, i.prototype.getResponseType = function (e) {
            switch (e) {
                case t.URLLoaderDataFormat.TEXT:
                case t.URLLoaderDataFormat.VARIABLES:
                    return t.URLLoaderDataFormat.TEXT;
                case t.URLLoaderDataFormat.BINARY:
                    return "arraybuffer";
                default:
                    return e
            }
        }, i.prototype.loadSound = function (e) {
            function r(t) {
                e.dispatchEvent(t)
            }

            function i(t) {
                n(), e.dispatchEvent(t)
            }

            function o(r) {
                n(), e.data = c, window.setTimeout(function () {
                    e.dispatchEventWith(t.Event.COMPLETE)
                }, 0)
            }

            function n() {
                c.removeEventListener(t.Event.COMPLETE, o, s), c.removeEventListener(t.IOErrorEvent.IO_ERROR, i, s), c.removeEventListener(t.ProgressEvent.PROGRESS, r, s)
            }
            var s = this,
                a = e._request.url,
                c = new t.Sound;
            c.addEventListener(t.Event.COMPLETE, o, s), c.addEventListener(t.IOErrorEvent.IO_ERROR, i, s), c.addEventListener(t.ProgressEvent.PROGRESS, r, s), c.load(a)
        }, i.prototype.loadTexture = function (e) {
            function r(t) {
                e.dispatchEvent(t)
            }

            function i(t) {
                n(), e.dispatchEvent(t)
            }

            function o(r) {
                n();
                var i = c.data;
                i.source.setAttribute("bitmapSrc", a);
                var o = new t.Texture;
                o._setBitmapData(i), e.data = o, window.setTimeout(function () {
                    e.dispatchEventWith(t.Event.COMPLETE)
                }, s)
            }

            function n() {
                c.removeEventListener(t.Event.COMPLETE, o, s), c.removeEventListener(t.IOErrorEvent.IO_ERROR, i, s), c.removeEventListener(t.ProgressEvent.PROGRESS, r, s)
            }
            var s = this,
                a = e._request.url,
                c = new t.ImageLoader;
            c.addEventListener(t.Event.COMPLETE, o, s), c.addEventListener(t.IOErrorEvent.IO_ERROR, i, s), c.addEventListener(t.ProgressEvent.PROGRESS, r, s), c.load(a)
        }, i.prototype.__recycle = function () {
            this._request = null, this.data = null
        }, i
    }(t.EventDispatcher);
    t.URLLoader = r, __reflect(r.prototype, "egret.URLLoader")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (e) {
        function r(r) {
            var i = e.call(this) || this;
            return i.$texture = null, i.offsetPoint = t.Point.create(0, 0), i.$movieClipData = null, i.frames = null, i.$totalFrames = 0, i.frameLabels = null, i.$frameLabelStart = 0, i.$frameLabelEnd = 0, i.frameEvents = null, i.frameIntervalTime = 0, i.$eventPool = null, i.$isPlaying = !1, i.isStopped = !0, i.playTimes = 0, i.$currentFrameNum = 0, i.$nextFrameNum = 1, i.displayedKeyFrameNum = 0, i.passedTime = 0, i.$frameRate = 0 / 0, i.lastTime = 0, i.$smoothing = t.Bitmap.defaultSmoothing, i.setMovieClipData(r), t.nativeRender || (i.$renderNode = new t.sys.NormalBitmapNode), i
        }
        return __extends(r, e), r.prototype.createNativeDisplayObject = function () {
            this.$nativeDisplayObject = new egret_native.NativeDisplayObject(11)
        }, Object.defineProperty(r.prototype, "smoothing", {
            get: function () {
                return this.$smoothing
            },
            set: function (t) {
                t != this.$smoothing && (this.$smoothing = t)
            },
            enumerable: !0,
            configurable: !0
        }), r.prototype.$init = function () {
            this.$reset();
            var t = this.$movieClipData;
            t && t.$isDataValid() && (this.frames = t.frames, this.$totalFrames = t.numFrames, this.frameLabels = t.labels, this.frameEvents = t.events, this.$frameRate = t.frameRate, this.frameIntervalTime = 1e3 / this.$frameRate, this._initFrame())
        }, r.prototype.$reset = function () {
            this.frames = null, this.playTimes = 0, this.$isPlaying = !1, this.setIsStopped(!0), this.$currentFrameNum = 0, this.$nextFrameNum = 1, this.displayedKeyFrameNum = 0, this.passedTime = 0, this.$eventPool = []
        }, r.prototype._initFrame = function () {
            this.$movieClipData.$isTextureValid() && (this.advanceFrame(), this.constructFrame())
        }, r.prototype.$updateRenderNode = function () {
            var e = this.$texture;
            if (e) {
                var r = Math.round(this.offsetPoint.x),
                    i = Math.round(this.offsetPoint.y),
                    o = e.$bitmapWidth,
                    n = e.$bitmapHeight,
                    s = e.$getTextureWidth(),
                    a = e.$getTextureHeight(),
                    c = Math.round(e.$getScaleBitmapWidth()),
                    l = Math.round(e.$getScaleBitmapHeight()),
                    h = e.$sourceWidth,
                    u = e.$sourceHeight;
                t.sys.BitmapNode.$updateTextureData(this.$renderNode, e.$bitmapData, e.$bitmapX, e.$bitmapY, o, n, r, i, s, a, c, l, h, u, t.BitmapFillMode.SCALE, this.$smoothing)
            }
        }, r.prototype.$measureContentBounds = function (t) {
            var e = this.$texture;
            if (e) {
                var r = this.offsetPoint.x,
                    i = this.offsetPoint.y,
                    o = e.$getTextureWidth(),
                    n = e.$getTextureHeight();
                t.setTo(r, i, o, n)
            } else t.setEmpty()
        }, r.prototype.$onAddToStage = function (t, r) {
            e.prototype.$onAddToStage.call(this, t, r), this.$isPlaying && this.$totalFrames > 1 && this.setIsStopped(!1)
        }, r.prototype.$onRemoveFromStage = function () {
            e.prototype.$onRemoveFromStage.call(this), this.setIsStopped(!0)
        }, r.prototype.getFrameLabelByName = function (t, e) {
            void 0 === e && (e = !1), e && (t = t.toLowerCase());
            var r = this.frameLabels;
            if (r)
                for (var i = null, o = 0; o < r.length; o++)
                    if (i = r[o], e ? i.name.toLowerCase() == t : i.name == t) return i;
            return null
        }, r.prototype.getFrameStartEnd = function (t) {
            var e = this.frameLabels;
            if (e)
                for (var r = null, i = 0; i < e.length; i++)
                    if (r = e[i], t == r.name) {
                        this.$frameLabelStart = r.frame, this.$frameLabelEnd = r.end;
                        break
                    }
        }, r.prototype.getFrameLabelByFrame = function (t) {
            var e = this.frameLabels;
            if (e)
                for (var r = null, i = 0; i < e.length; i++)
                    if (r = e[i], r.frame == t) return r;
            return null
        }, r.prototype.getFrameLabelForFrame = function (t) {
            var e = null,
                r = null,
                i = this.frameLabels;
            if (i)
                for (var o = 0; o < i.length; o++) {
                    if (r = i[o], r.frame > t) return e;
                    e = r
                }
            return e
        }, r.prototype.play = function (e) {
            void 0 === e && (e = 0), this.lastTime = t.getTimer(), this.passedTime = 0, this.$isPlaying = !0, this.setPlayTimes(e), this.$totalFrames > 1 && this.$stage && this.setIsStopped(!1)
        }, r.prototype.stop = function () {
            this.$isPlaying = !1, this.setIsStopped(!0)
        }, r.prototype.prevFrame = function () {
            this.gotoAndStop(this.$currentFrameNum - 1)
        }, r.prototype.nextFrame = function () {
            this.gotoAndStop(this.$currentFrameNum + 1)
        }, r.prototype.gotoAndPlay = function (e, r) {
            void 0 === r && (r = 0), (0 == arguments.length || arguments.length > 2) && t.$error(1022, "MovieClip.gotoAndPlay()"), "string" == typeof e ? this.getFrameStartEnd(e) : (this.$frameLabelStart = 0, this.$frameLabelEnd = 0), this.play(r), this.gotoFrame(e)
        }, r.prototype.gotoAndStop = function (e) {
            1 != arguments.length && t.$error(1022, "MovieClip.gotoAndStop()"), this.stop(), this.gotoFrame(e)
        }, r.prototype.gotoFrame = function (e) {
            var r;
            "string" == typeof e ? r = this.getFrameLabelByName(e).frame : (r = parseInt(e + "", 10), r != e && t.$error(1022, "Frame Label Not Found")), 1 > r ? r = 1 : r > this.$totalFrames && (r = this.$totalFrames), r != this.$nextFrameNum && (this.$nextFrameNum = r, this.advanceFrame(), this.constructFrame(), this.handlePendingEvent())
        }, r.prototype.advanceTime = function (e) {
            var r = this,
                i = e - r.lastTime;
            r.lastTime = e;
            var o = r.frameIntervalTime,
                n = r.passedTime + i;
            r.passedTime = n % o;
            var s = n / o;
            if (1 > s) return !1;
            for (; s >= 1;) {
                if (s--, r.$nextFrameNum++, r.$nextFrameNum > r.$totalFrames || r.$frameLabelStart > 0 && r.$nextFrameNum > r.$frameLabelEnd)
                    if (-1 == r.playTimes) r.$eventPool.push(t.Event.LOOP_COMPLETE), r.$nextFrameNum = 1;
                    else {
                        if (r.playTimes--, !(r.playTimes > 0)) {
                            r.$nextFrameNum = r.$totalFrames, r.$eventPool.push(t.Event.COMPLETE), r.stop();
                            break
                        }
                        r.$eventPool.push(t.Event.LOOP_COMPLETE), r.$nextFrameNum = 1
                    } r.$currentFrameNum == r.$frameLabelEnd && (r.$nextFrameNum = r.$frameLabelStart), r.advanceFrame()
            }
            return r.constructFrame(), r.handlePendingEvent(), !1
        }, r.prototype.advanceFrame = function () {
            this.$currentFrameNum = this.$nextFrameNum;
            var e = this.frameEvents[this.$nextFrameNum];
            e && "" != e && t.MovieClipEvent.dispatchMovieClipEvent(this, t.MovieClipEvent.FRAME_LABEL, e)
        }, r.prototype.constructFrame = function () {
            var e = this,
                r = e.$currentFrameNum;
            if (e.displayedKeyFrameNum != r) {
                var i = e.$movieClipData.getTextureByFrame(r);
                if (e.$texture = i, e.$movieClipData.$getOffsetByFrame(r, e.offsetPoint), e.displayedKeyFrameNum = r, e.$renderDirty = !0, t.nativeRender) e.$nativeDisplayObject.setDataToBitmapNode(e.$nativeDisplayObject.id, i, [i.$bitmapX, i.$bitmapY, i.$bitmapWidth, i.$bitmapHeight, e.offsetPoint.x, e.offsetPoint.y, i.$getScaleBitmapWidth(), i.$getScaleBitmapHeight(), i.$sourceWidth, i.$sourceHeight]), e.$nativeDisplayObject.setWidth(i.$getTextureWidth() + e.offsetPoint.x), e.$nativeDisplayObject.setHeight(i.$getTextureHeight() + e.offsetPoint.y);
                else {
                    var o = e.$parent;
                    o && !o.$cacheDirty && (o.$cacheDirty = !0, o.$cacheDirtyUp());
                    var n = e.$maskedObject;
                    n && !n.$cacheDirty && (n.$cacheDirty = !0, n.$cacheDirtyUp())
                }
            }
        }, r.prototype.$renderFrame = function () {
            var t = this;
            t.$texture = t.$movieClipData.getTextureByFrame(t.$currentFrameNum), t.$renderDirty = !0;
            var e = t.$parent;
            e && !e.$cacheDirty && (e.$cacheDirty = !0, e.$cacheDirtyUp());
            var r = t.$maskedObject;
            r && !r.$cacheDirty && (r.$cacheDirty = !0, r.$cacheDirtyUp())
        }, r.prototype.handlePendingEvent = function () {
            if (0 != this.$eventPool.length) {
                this.$eventPool.reverse();
                for (var e = this.$eventPool, r = e.length, i = !1, o = !1, n = 0; r > n; n++) {
                    var s = e.pop();
                    s == t.Event.LOOP_COMPLETE ? o = !0 : s == t.Event.COMPLETE ? i = !0 : this.dispatchEventWith(s)
                }
                o && this.dispatchEventWith(t.Event.LOOP_COMPLETE), i && this.dispatchEventWith(t.Event.COMPLETE)
            }
        }, Object.defineProperty(r.prototype, "totalFrames", {
            get: function () {
                return this.$totalFrames
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "currentFrame", {
            get: function () {
                return this.$currentFrameNum
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "currentFrameLabel", {
            get: function () {
                var t = this.getFrameLabelByFrame(this.$currentFrameNum);
                return t && t.name
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "currentLabel", {
            get: function () {
                var t = this.getFrameLabelForFrame(this.$currentFrameNum);
                return t ? t.name : null
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "frameRate", {
            get: function () {
                return this.$frameRate
            },
            set: function (t) {
                t != this.$frameRate && (this.$frameRate = t, this.frameIntervalTime = 1e3 / this.$frameRate)
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "isPlaying", {
            get: function () {
                return this.$isPlaying
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r.prototype, "movieClipData", {
            get: function () {
                return this.$movieClipData
            },
            set: function (t) {
                this.setMovieClipData(t)
            },
            enumerable: !0,
            configurable: !0
        }), r.prototype.setMovieClipData = function (t) {
            this.$movieClipData != t && (this.$movieClipData = t, this.$init())
        }, r.prototype.setPlayTimes = function (t) {
            (0 > t || t >= 1) && (this.playTimes = 0 > t ? -1 : Math.floor(t))
        }, r.prototype.setIsStopped = function (e) {
            this.isStopped != e && (this.isStopped = e, e ? t.ticker.$stopTick(this.advanceTime, this) : (this.playTimes = 0 == this.playTimes ? 1 : this.playTimes, this.lastTime = t.getTimer(), t.ticker.$startTick(this.advanceTime, this)))
        }, r
    }(t.DisplayObject);
    t.MovieClip = e, __reflect(e.prototype, "egret.MovieClip")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (e) {
        function r(r) {
            void 0 === r && (r = null);
            var i = e.call(this) || this;
            return i.data = null, i.method = t.URLRequestMethod.GET, i.url = "", i.requestHeaders = [], i.url = r, i
        }
        return __extends(r, e), r
    }(t.HashObject);
    t.URLRequest = e, __reflect(e.prototype, "egret.URLRequest")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function () {
        function t(t, e) {
            this.name = "", this.value = "", this.name = t, this.value = e
        }
        return t
    }();
    t.URLRequestHeader = e, __reflect(e.prototype, "egret.URLRequestHeader")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function () {
        function t() { }
        return t.GET = "get", t.POST = "post", t
    }();
    t.URLRequestMethod = e, __reflect(e.prototype, "egret.URLRequestMethod")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (t) {
        function e(e) {
            void 0 === e && (e = null);
            var r = t.call(this) || this;
            return r.variables = null, null !== e && r.decode(e), r
        }
        return __extends(e, t), e.prototype.decode = function (t) {
            this.variables || (this.variables = {}), t = t.split("+").join(" ");
            for (var e, r = /[?&]?([^=]+)=([^&]*)/g; e = r.exec(t);) {
                var i = decodeURIComponent(e[1]),
                    o = decodeURIComponent(e[2]);
                if (i in this.variables != 0) {
                    var n = this.variables[i];
                    n instanceof Array ? n.push(o) : this.variables[i] = [n, o]
                } else this.variables[i] = o
            }
        }, e.prototype.toString = function () {
            if (!this.variables) return "";
            var t = this.variables,
                e = [];
            for (var r in t) e.push(this.encodeValue(r, t[r]));
            return e.join("&")
        }, e.prototype.encodeValue = function (t, e) {
            return e instanceof Array ? this.encodeArray(t, e) : encodeURIComponent(t) + "=" + encodeURIComponent(e)
        }, e.prototype.encodeArray = function (t, e) {
            return t ? 0 == e.length ? encodeURIComponent(t) + "=" : e.map(function (e) {
                return encodeURIComponent(t) + "=" + encodeURIComponent(e)
            }).join("&") : ""
        }, e
    }(t.HashObject);
    t.URLVariables = e, __reflect(e.prototype, "egret.URLVariables")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (e) {
        function r() {
            var i = e.call(this) || this;
            return i._timeScale = 1, i._paused = !1, i._callIndex = -1, i._lastTime = 0, i.callBackList = [], null != r.instance, t.ticker.$startTick(i.update, i), i._lastTime = t.getTimer(), i
        }
        return __extends(r, e), r.prototype.update = function (t) {
            var e = t - this._lastTime;
            if (this._lastTime = t, this._paused) return !1;
            var r = e * this._timeScale;
            for (this._callList = this.callBackList.concat(), this._callIndex = 0; this._callIndex < this._callList.length; this._callIndex++) {
                var i = this._callList[this._callIndex];
                i.listener.call(i.thisObject, r)
            }
            return this._callIndex = -1, this._callList = null, !1
        }, r.prototype.register = function (t, e, r) {
            void 0 === r && (r = 0), this.$insertEventBin(this.callBackList, "", t, e, !1, r, !1)
        }, r.prototype.unregister = function (t, e) {
            this.$removeEventBin(this.callBackList, t, e)
        }, r.prototype.setTimeScale = function (t) {
            this._timeScale = t
        }, r.prototype.getTimeScale = function () {
            return this._timeScale
        }, r.prototype.pause = function () {
            this._paused = !0
        }, r.prototype.resume = function () {
            this._paused = !1
        }, r.getInstance = function () {
            return null == r.instance && (r.instance = new r), r.instance
        }, r
    }(t.EventDispatcher);
    t.Ticker = e, __reflect(e.prototype, "egret.Ticker")
}(egret || (egret = {}));
var egret;
! function (t) {
    var e = function (e) {
        function r() {
            return e.call(this) || this
        }
        return __extends(r, e), Object.defineProperty(r.prototype, "stage", {
            get: function () {
                return t.sys.$TempStage
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(r, "instance", {
            get: function () {
                return null == r._instance && (r._instance = new r), r._instance
            },
            enumerable: !0,
            configurable: !0
        }), r.deviceType = null, r.DEVICE_PC = "web", r.DEVICE_MOBILE = "native", r
    }(t.EventDispatcher);
    t.MainContext = e, __reflect(e.prototype, "egret.MainContext")
}(egret || (egret = {})), egret.testDeviceType1 = function () {
    if (!window.navigator) return !0;
    var t = navigator.userAgent.toLowerCase();
    return -1 != t.indexOf("mobile") || -1 != t.indexOf("android")
}, egret.MainContext.deviceType = egret.testDeviceType1() ? egret.MainContext.DEVICE_MOBILE : egret.MainContext.DEVICE_PC, delete egret.testDeviceType1;
var egret;
! function (t) {
    var e = function (e) {
        function r(t) {
            void 0 === t && (t = 300);
            var r = e.call(this) || this;
            return r.objectPool = [], r._length = 0, 1 > t && (t = 1), r.autoDisposeTime = t, r.frameCount = 0, r
        }
        return __extends(r, e), r.$init = function () {
            t.ticker.$startTick(r.onUpdate, r)
        }, r.onUpdate = function (t) {
            for (var e = r._callBackList, i = e.length - 1; i >= 0; i--) e[i].$checkFrame();
            return !1
        }, r.prototype.$checkFrame = function () {
            this.frameCount--, this.frameCount <= 0 && this.dispose()
        }, Object.defineProperty(r.prototype, "length", {
            get: function () {
                return this._length
            },
            enumerable: !0,
            configurable: !0
        }), r.prototype.push = function (t) {
            var e = this.objectPool; - 1 == e.indexOf(t) && (e.push(t), t.__recycle && t.__recycle(), this._length++, 0 == this.frameCount && (this.frameCount = this.autoDisposeTime, r._callBackList.push(this)))
        }, r.prototype.pop = function () {
            return 0 == this._length ? null : (this._length--, this.objectPool.pop())
        }, r.prototype.dispose = function () {
            this._length > 0 && (this.objectPool = [], this._length = 0), this.frameCount = 0;
            var t = r._callBackList,
                e = t.indexOf(this); - 1 != e && t.splice(e, 1)
        }, r._callBackList = [], r
    }(t.HashObject);
    t.Recycler = e, __reflect(e.prototype, "egret.Recycler"), e.$init()
}(egret || (egret = {}));
var egret;
! function (t) {
    function e(e, r, c) {
        for (var l = [], h = 3; h < arguments.length; h++) l[h - 3] = arguments[h];
        var u = {
            listener: e,
            thisObject: r,
            delay: c,
            originDelay: c,
            params: l
        };
        return s++, 1 == s && (a = t.getTimer(), t.ticker.$startTick(i, null)), n++, o[n] = u, n
    }

    function r(e) {
        o[e] && (s--, delete o[e], 0 == s && t.ticker.$stopTick(i, null))
    }

    function i(t) {
        var e = t - a;
        a = t;
        for (var r in o) {
            var i = o[r];
            i.delay -= e, i.delay <= 0 && (i.delay = i.originDelay, i.listener.apply(i.thisObject, i.params))
        }
        return !1
    }
    var o = {},
        n = 0,
        s = 0,
        a = 0;
    t.setInterval = e, t.clearInterval = r
}(egret || (egret = {}));
var egret;
! function (t) {
    function e(e, r, c) {
        for (var l = [], h = 3; h < arguments.length; h++) l[h - 3] = arguments[h];
        var u = {
            listener: e,
            thisObject: r,
            delay: c,
            params: l
        };
        return s++, 1 == s && t.ticker && (a = t.getTimer(), t.ticker.$startTick(i, null)), n++, o[n] = u, n
    }

    function r(e) {
        o[e] && (s--, delete o[e], 0 == s && t.ticker && t.ticker.$stopTick(i, null))
    }

    function i(t) {
        var e = t - a;
        a = t;
        for (var i in o) {
            var n = i,
                s = o[n];
            s.delay -= e, s.delay <= 0 && (s.listener.apply(s.thisObject, s.params), r(n))
        }
        return !1
    }
    var o = {},
        n = 0,
        s = 0,
        a = 0;
    t.setTimeout = e, t.clearTimeout = r
}(egret || (egret = {}));