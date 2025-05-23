var __reflect = this && this.__reflect || function (e, t, r) {
    e.__class__ = t, r ? r.push(t) : r = [t], e.__types__ = e.__types__ ? r.concat(e.__types__) : r
},
    __extends = this && this.__extends || function (e, t) {
        function r() {
            this.constructor = e
        }
        for (var i in t) t.hasOwnProperty(i) && (e[i] = t[i]);
        r.prototype = t.prototype, e.prototype = new r
    },
    egret;
! function (e) {
    var t;
    ! function (t) {
        function r(e) {
            if (window.location) {
                var t = location.search;
                if ("" == t) return "";
                t = t.slice(1);
                for (var r = t.split("&"), i = r.length, n = 0; i > n; n++) {
                    var a = r[n],
                        o = a.split("=");
                    if (o[0] == e) return o[1]
                }
            }
            return ""
        }
        t.getOption = r, e.getOption = r
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function () {
            function e() { }
            return e.call = function (e, t) { }, e.addCallback = function (e, t) { }, e
        }();
        t.WebExternalInterface = r, __reflect(r.prototype, "egret.web.WebExternalInterface", ["egret.ExternalInterface"]);
        var i = navigator.userAgent.toLowerCase();
        i.indexOf("egretnative") < 0 && (e.ExternalInterface = r)
    }(t = e.web || (e.web = {}))
}(egret || (egret = {})),
    function (e) {
        var t;
        ! function (t) {
            function r(t) {
                var r = JSON.parse(t),
                    n = r.functionName,
                    a = i[n];
                if (a) {
                    var o = r.value;
                    a.call(null, o)
                } else e.$warn(1050, n)
            }
            var i = {},
                n = function () {
                    function e() { }
                    return e.call = function (e, t) {
                        var r = {};
                        r.functionName = e, r.value = t, egret_native.sendInfoToPlugin(JSON.stringify(r))
                    }, e.addCallback = function (e, t) {
                        i[e] = t
                    }, e
                }();
            t.NativeExternalInterface = n, __reflect(n.prototype, "egret.web.NativeExternalInterface", ["egret.ExternalInterface"]);
            var a = navigator.userAgent.toLowerCase();
            a.indexOf("egretnative") >= 0 && (e.ExternalInterface = n, egret_native.receivedPluginInfo = r)
        }(t = e.web || (e.web = {}))
    }(egret || (egret = {})),
    function (e) {
        var t;
        ! function (t) {
            var r = {},
                i = function () {
                    function t() { }
                    return t.call = function (e, t) {
                        __global.ExternalInterface.call(e, t)
                    }, t.addCallback = function (e, t) {
                        r[e] = t
                    }, t.invokeCallback = function (t, i) {
                        var n = r[t];
                        n ? n.call(null, i) : e.$warn(1050, t)
                    }, t
                }();
            t.WebViewExternalInterface = i, __reflect(i.prototype, "egret.web.WebViewExternalInterface", ["egret.ExternalInterface"]);
            var n = navigator.userAgent.toLowerCase();
            n.indexOf("egretwebview") >= 0 && (e.ExternalInterface = i)
        }(t = e.web || (e.web = {}))
    }(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (r) {
            function i() {
                var e = r.call(this) || this;
                return e.loaded = !1, e
            }
            return __extends(i, r), Object.defineProperty(i.prototype, "length", {
                get: function () {
                    if (this.originAudio) return this.originAudio.duration;
                    throw new Error("sound not loaded!")
                },
                enumerable: !0,
                configurable: !0
            }), i.prototype.load = function (t) {
                function r() {
                    a(), c.indexOf("firefox") >= 0 && (s.pause(), s.muted = !1), o.loaded = !0, o.dispatchEventWith(e.Event.COMPLETE)
                }

                function n() {
                    a(), o.dispatchEventWith(e.IOErrorEvent.IO_ERROR)
                }

                function a() {
                    s.removeEventListener("canplaythrough", r), s.removeEventListener("error", n)
                }
                var o = this;
                this.url = t;
                var s = new Audio(t);
                s.addEventListener("canplaythrough", r), s.addEventListener("error", n);
                var c = navigator.userAgent.toLowerCase();
                c.indexOf("firefox") >= 0 && (s.autoplay = !0, s.muted = !0), s.load(), this.originAudio = s, i.clearAudios[this.url] && delete i.clearAudios[this.url], i.$recycle(this.url, s)
            }, i.prototype.play = function (r, n) {
                r = +r || 0, n = +n || 0;
                var a = i.$pop(this.url);
                null == a && (a = this.originAudio.cloneNode()), a.autoplay = !0;
                var o = new t.HtmlSoundChannel(a);
                return o.$url = this.url, o.$loops = n, o.$startTime = r, o.$play(), e.sys.$pushSoundChannel(o), o
            }, i.prototype.close = function () {
                0 == this.loaded && this.originAudio && (this.originAudio.src = ""), this.originAudio && (this.originAudio = null), i.$clear(this.url)
            }, i.$clear = function (e) {
                i.clearAudios[e] = !0;
                var t = i.audios[e];
                t && (t.length = 0)
            }, i.$pop = function (e) {
                var t = i.audios[e];
                return t && t.length > 0 ? t.pop() : null
            }, i.$recycle = function (e, t) {
                if (!i.clearAudios[e]) {
                    var r = i.audios[e];
                    null == i.audios[e] && (r = i.audios[e] = []), r.push(t)
                }
            }, i.MUSIC = "music", i.EFFECT = "effect", i.audios = {}, i.clearAudios = {}, i
        }(e.EventDispatcher);
        t.HtmlSound = r, __reflect(r.prototype, "egret.web.HtmlSound", ["egret.Sound"])
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (r) {
            function i(t) {
                var i = r.call(this) || this;
                return i.$startTime = 0, i.audio = null, i.isStopped = !1, i.canPlay = function () {
                    i.audio.removeEventListener("canplay", i.canPlay);
                    try {
                        i.audio.currentTime = i.$startTime
                    } catch (e) { } finally {
                        i.audio.play()
                    }
                }, i.onPlayEnd = function () {
                    return 1 == i.$loops ? (i.stop(), void i.dispatchEventWith(e.Event.SOUND_COMPLETE)) : (i.$loops > 0 && i.$loops--, void i.$play())
                }, i._volume = 1, t.addEventListener("ended", i.onPlayEnd), i.audio = t, i
            }
            return __extends(i, r), i.prototype.$play = function () {
                if (this.isStopped) return void e.$error(1036);
                try {
                    this.audio.volume = this._volume, this.audio.currentTime = this.$startTime
                } catch (t) {
                    return void this.audio.addEventListener("canplay", this.canPlay)
                }
                this.audio.play()
            }, i.prototype.stop = function () {
                if (this.audio) {
                    this.isStopped || e.sys.$popSoundChannel(this), this.isStopped = !0;
                    var r = this.audio;
                    r.removeEventListener("ended", this.onPlayEnd), r.removeEventListener("canplay", this.canPlay), r.volume = 0, this._volume = 0, this.audio = null;
                    var i = this.$url;
                    window.setTimeout(function () {
                        r.pause(), t.HtmlSound.$recycle(i, r)
                    }, 200)
                }
            }, Object.defineProperty(i.prototype, "volume", {
                get: function () {
                    return this._volume
                },
                set: function (t) {
                    return this.isStopped ? void e.$error(1036) : (this._volume = t, void (this.audio && (this.audio.volume = t)))
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(i.prototype, "position", {
                get: function () {
                    return this.audio ? this.audio.currentTime : 0
                },
                enumerable: !0,
                configurable: !0
            }), i
        }(e.EventDispatcher);
        t.HtmlSoundChannel = r, __reflect(r.prototype, "egret.web.HtmlSoundChannel", ["egret.SoundChannel", "egret.IEventDispatcher"])
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function () {
            function e() { }
            return e.decodeAudios = function () {
                if (!(e.decodeArr.length <= 0 || e.isDecoding)) {
                    e.isDecoding = !0;
                    var t = e.decodeArr.shift();
                    e.ctx.decodeAudioData(t.buffer, function (r) {
                        t.self.audioBuffer = r, t.success && t.success(), e.isDecoding = !1, e.decodeAudios()
                    }, function () {
                        alert("sound decode error: " + t.url + "！\nsee http://edn.egret.com/cn/docs/page/156"), t.fail && t.fail(), e.isDecoding = !1, e.decodeAudios()
                    })
                }
            }, e.decodeArr = [], e.isDecoding = !1, e
        }();
        t.WebAudioDecode = r, __reflect(r.prototype, "egret.web.WebAudioDecode");
        var i = function (i) {
            function n() {
                var e = i.call(this) || this;
                return e.loaded = !1, e
            }
            return __extends(n, i), Object.defineProperty(n.prototype, "length", {
                get: function () {
                    if (this.audioBuffer) return this.audioBuffer.duration;
                    throw new Error("sound not loaded!")
                },
                enumerable: !0,
                configurable: !0
            }), n.prototype.load = function (t) {
                function i() {
                    a.loaded = !0, a.dispatchEventWith(e.Event.COMPLETE)
                }

                function n() {
                    a.dispatchEventWith(e.IOErrorEvent.IO_ERROR)
                }
                var a = this;
                this.url = t;
                var o = new XMLHttpRequest;
                o.open("GET", t, !0), o.responseType = "arraybuffer", o.onreadystatechange = function () {
                    if (4 == o.readyState) {
                        var t = o.status >= 400 || 0 == o.status;
                        t ? a.dispatchEventWith(e.IOErrorEvent.IO_ERROR) : (r.decodeArr.push({
                            buffer: o.response,
                            success: i,
                            fail: n,
                            self: a,
                            url: a.url
                        }), r.decodeAudios())
                    }
                }, o.send()
            }, n.prototype.play = function (r, i) {
                r = +r || 0, i = +i || 0;
                var n = new t.WebAudioSoundChannel;
                return n.$url = this.url, n.$loops = i, n.$audioBuffer = this.audioBuffer, n.$startTime = r, n.$play(), e.sys.$pushSoundChannel(n), n
            }, n.prototype.close = function () { }, n.MUSIC = "music", n.EFFECT = "effect", n
        }(e.EventDispatcher);
        t.WebAudioSound = i, __reflect(i.prototype, "egret.web.WebAudioSound", ["egret.Sound"])
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (r) {
            function i() {
                var i = r.call(this) || this;
                return i.$startTime = 0, i.bufferSource = null, i.context = t.WebAudioDecode.ctx, i.isStopped = !1, i._currentTime = 0, i._volume = 1, i.onPlayEnd = function () {
                    return 1 == i.$loops ? (i.stop(), void i.dispatchEventWith(e.Event.SOUND_COMPLETE)) : (i.$loops > 0 && i.$loops--, void i.$play())
                }, i._startTime = 0, i.context.createGain ? i.gain = i.context.createGain() : i.gain = i.context.createGainNode(), i
            }
            return __extends(i, r), i.prototype.$play = function () {
                if (this.isStopped) return void e.$error(1036);
                this.bufferSource && (this.bufferSource.onended = null, this.bufferSource = null);
                var t = this.context,
                    r = this.gain,
                    i = t.createBufferSource();
                this.bufferSource = i, i.buffer = this.$audioBuffer, i.connect(r), r.connect(t.destination), i.onended = this.onPlayEnd, this._startTime = Date.now(), this.gain.gain.value = this._volume, i.start(0, this.$startTime), this._currentTime = 0
            }, i.prototype.stop = function () {
                if (this.bufferSource) {
                    var t = this.bufferSource;
                    t.stop ? t.stop(0) : t.noteOff(0), t.onended = null, t.disconnect(), this.bufferSource = null, this.$audioBuffer = null
                }
                this.isStopped || e.sys.$popSoundChannel(this), this.isStopped = !0
            }, Object.defineProperty(i.prototype, "volume", {
                get: function () {
                    return this._volume
                },
                set: function (t) {
                    return this.isStopped ? void e.$error(1036) : (this._volume = t, void (this.gain.gain.value = t))
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(i.prototype, "position", {
                get: function () {
                    return this.bufferSource ? (Date.now() - this._startTime) / 1e3 + this.$startTime : 0
                },
                enumerable: !0,
                configurable: !0
            }), i
        }(e.EventDispatcher);
        t.WebAudioSoundChannel = r, __reflect(r.prototype, "egret.web.WebAudioSoundChannel", ["egret.SoundChannel", "egret.IEventDispatcher"])
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (t) {
            function r(r, i) {
                void 0 === i && (i = !0);
                var n = t.call(this) || this;
                return n.loaded = !1, n.closed = !1, n.heightSet = 0 / 0, n.widthSet = 0 / 0, n.waiting = !1, n.userPause = !1, n.userPlay = !1, n.isPlayed = !1, n.screenChanged = function (t) {
                    var r = document.fullscreenEnabled || document.webkitIsFullScreen;
                    r || (n.checkFullScreen(!1), e.Capabilities.isMobile || (n._fullscreen = r))
                }, n._fullscreen = !0, n.onVideoLoaded = function () {
                    n.video.removeEventListener("canplay", n.onVideoLoaded);
                    var t = n.video;
                    n.loaded = !0, n.posterData && (n.posterData.width = n.getPlayWidth(), n.posterData.height = n.getPlayHeight()), t.width = t.videoWidth, t.height = t.videoHeight, window.setTimeout(function () {
                        n.dispatchEventWith(e.Event.COMPLETE)
                    }, 200)
                }, n.$renderNode = new e.sys.BitmapNode, n.src = r, n.once(e.Event.ADDED_TO_STAGE, n.loadPoster, n), r && n.load(), n
            }
            return __extends(r, t), r.prototype.load = function (t, r) {
                var i = this;
                if (void 0 === r && (r = !0), t = t || this.src, this.src = t, !this.video || this.video.src != t) {
                    var n;
                    !this.video || e.Capabilities.isMobile ? (n = document.createElement("video"), this.video = n, n.controls = null) : n = this.video, n.src = t, n.setAttribute("autoplay", "autoplay"), n.setAttribute("webkit-playsinline", "true"), n.addEventListener("canplay", this.onVideoLoaded), n.addEventListener("error", function () {
                        return i.onVideoError()
                    }), n.addEventListener("ended", function () {
                        return i.onVideoEnded()
                    });
                    var a = !1;
                    n.addEventListener("canplay", function () {
                        i.waiting = !1, a ? i.userPause ? i.pause() : i.userPlay && i.play() : (a = !0, n.pause())
                    }), n.addEventListener("waiting", function () {
                        i.waiting = !0
                    }), n.load(), this.videoPlay(), n.style.position = "absolute", n.style.top = "0px", n.style.zIndex = "-88888", n.style.left = "0px", n.height = 1, n.width = 1
                }
            }, r.prototype.play = function (t, r) {
                var i = this;
                if (void 0 === r && (r = !1), 0 == this.loaded) return this.load(this.src), void this.once(e.Event.COMPLETE, function (e) {
                    return i.play(t, r)
                }, this);
                this.isPlayed = !0;
                var n = this.video;
                void 0 != t && (n.currentTime = +t || 0), n.loop = !!r, e.Capabilities.isMobile ? n.style.zIndex = "-88888" : n.style.zIndex = "9999", n.style.position = "absolute", n.style.top = "0px", n.style.left = "0px", n.height = n.videoHeight, n.width = n.videoWidth, "Windows PC" != e.Capabilities.os && "Mac OS" != e.Capabilities.os && window.setTimeout(function () {
                    n.width = 0
                }, 1e3), this.checkFullScreen(this._fullscreen)
            }, r.prototype.videoPlay = function () {
                return this.userPause = !1, this.waiting ? void (this.userPlay = !0) : (this.userPlay = !1, void this.video.play())
            }, r.prototype.checkFullScreen = function (t) {
                var r = this.video;
                if (t) null == r.parentElement && (r.removeAttribute("webkit-playsinline"), document.body.appendChild(r)), e.stopTick(this.markDirty, this), this.goFullscreen();
                else if (null != r.parentElement && r.parentElement.removeChild(r), r.setAttribute("webkit-playsinline", "true"), this.setFullScreenMonitor(!1), e.startTick(this.markDirty, this), e.Capabilities.isMobile) return this.video.currentTime = 0, void this.onVideoEnded();
                this.videoPlay()
            }, r.prototype.goFullscreen = function () {
                var t, r = this.video;
                return t = e.web.getPrefixStyleName("requestFullscreen", r), r[t] || (t = e.web.getPrefixStyleName("requestFullScreen", r), r[t]) ? (r.removeAttribute("webkit-playsinline"), r[t](), this.setFullScreenMonitor(!0), !0) : !0
            }, r.prototype.setFullScreenMonitor = function (e) {
                var t = this.video;
                e ? (t.addEventListener("mozfullscreenchange", this.screenChanged), t.addEventListener("webkitfullscreenchange", this.screenChanged), t.addEventListener("mozfullscreenerror", this.screenError), t.addEventListener("webkitfullscreenerror", this.screenError)) : (t.removeEventListener("mozfullscreenchange", this.screenChanged), t.removeEventListener("webkitfullscreenchange", this.screenChanged), t.removeEventListener("mozfullscreenerror", this.screenError), t.removeEventListener("webkitfullscreenerror", this.screenError))
            }, r.prototype.screenError = function () {
                e.$error(3014)
            }, r.prototype.exitFullscreen = function () {
                document.exitFullscreen ? document.exitFullscreen() : document.msExitFullscreen ? document.msExitFullscreen() : document.mozCancelFullScreen ? document.mozCancelFullScreen() : document.oCancelFullScreen ? document.oCancelFullScreen() : document.webkitExitFullscreen && document.webkitExitFullscreen()
            }, r.prototype.onVideoEnded = function () {
                this.pause(), this.isPlayed = !1, this.dispatchEventWith(e.Event.ENDED)
            }, r.prototype.onVideoError = function () {
                this.dispatchEventWith(e.IOErrorEvent.IO_ERROR)
            }, r.prototype.close = function () {
                var e = this;
                this.closed = !0, this.video.removeEventListener("canplay", this.onVideoLoaded), this.video.removeEventListener("error", function () {
                    return e.onVideoError()
                }), this.video.removeEventListener("ended", function () {
                    return e.onVideoEnded()
                }), this.pause(), 0 == this.loaded && this.video && (this.video.src = ""), this.video && this.video.parentElement && (this.video.parentElement.removeChild(this.video), this.video = null), this.loaded = !1
            }, r.prototype.pause = function () {
                return this.userPlay = !1, this.waiting ? void (this.userPause = !0) : (this.userPause = !1, void e.stopTick(this.markDirty, this))
            }, Object.defineProperty(r.prototype, "volume", {
                get: function () {
                    return this.video ? this.video.volume : 1
                },
                set: function (e) {
                    this.video && (this.video.volume = e)
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(r.prototype, "position", {
                get: function () {
                    return this.video ? this.video.currentTime : 0
                },
                set: function (e) {
                    this.video && (this.video.currentTime = e)
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(r.prototype, "fullscreen", {
                get: function () {
                    return this._fullscreen
                },
                set: function (t) {
                    e.Capabilities.isMobile || (this._fullscreen = !!t, this.video && 0 == this.video.paused && this.checkFullScreen(this._fullscreen))
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(r.prototype, "bitmapData", {
                get: function () {
                    return this.video && this.loaded ? (this._bitmapData || (this.video.width = this.video.videoWidth, this.video.height = this.video.videoHeight, this._bitmapData = new e.BitmapData(this.video), this._bitmapData.$deleteSource = !1), this._bitmapData) : null
                },
                enumerable: !0,
                configurable: !0
            }), r.prototype.loadPoster = function () {
                var t = this,
                    r = this.poster;
                if (r) {
                    var i = new e.ImageLoader;
                    i.once(e.Event.COMPLETE, function (e) {
                        i.data;
                        t.posterData = i.data, t.$renderDirty = !0, t.posterData.width = t.getPlayWidth(), t.posterData.height = t.getPlayHeight()
                    }, this), i.load(r)
                }
            }, r.prototype.$measureContentBounds = function (e) {
                var t = this.bitmapData,
                    r = this.posterData;
                t ? e.setTo(0, 0, this.getPlayWidth(), this.getPlayHeight()) : r ? e.setTo(0, 0, this.getPlayWidth(), this.getPlayHeight()) : e.setEmpty()
            }, r.prototype.getPlayWidth = function () {
                return isNaN(this.widthSet) ? this.bitmapData ? this.bitmapData.width : this.posterData ? this.posterData.width : 0 / 0 : this.widthSet
            }, r.prototype.getPlayHeight = function () {
                return isNaN(this.heightSet) ? this.bitmapData ? this.bitmapData.height : this.posterData ? this.posterData.height : 0 / 0 : this.heightSet
            }, r.prototype.$updateRenderNode = function () {
                var t = this.$renderNode,
                    r = this.bitmapData,
                    i = this.posterData,
                    n = this.getPlayWidth(),
                    a = this.getPlayHeight();
                this.isPlayed && !e.Capabilities.isMobile || !i ? this.isPlayed && r && (t.image = r, t.imageWidth = r.width, t.imageHeight = r.height, e.WebGLUtils.deleteWebGLTexture(r.webGLTexture), r.webGLTexture = null, t.drawImage(0, 0, r.width, r.height, 0, 0, n, a)) : (t.image = i, t.imageWidth = n, t.imageHeight = a, t.drawImage(0, 0, i.width, i.height, 0, 0, n, a))
            }, r.prototype.markDirty = function () {
                return this.$renderDirty = !0, !0
            }, r.prototype.$setHeight = function (e) {
                this.heightSet = e, t.prototype.$setHeight.call(this, e)
            }, r.prototype.$setWidth = function (e) {
                this.widthSet = e, t.prototype.$setWidth.call(this, e)
            }, Object.defineProperty(r.prototype, "paused", {
                get: function () {
                    return this.video ? this.video.paused : !0
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(r.prototype, "length", {
                get: function () {
                    if (this.video) return this.video.duration;
                    throw new Error("Video not loaded!")
                },
                enumerable: !0,
                configurable: !0
            }), r
        }(e.DisplayObject);
        t.WebVideo = r, __reflect(r.prototype, "egret.web.WebVideo", ["egret.Video", "egret.DisplayObject"]), e.Video = r
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (t) {
            function r() {
                var e = t.call(this) || this;
                return e._url = "", e._method = "", e
            }
            return __extends(r, t), Object.defineProperty(r.prototype, "response", {
                get: function () {
                    if (!this._xhr) return null;
                    if (void 0 != this._xhr.response) return this._xhr.response;
                    if ("text" == this._responseType) return this._xhr.responseText;
                    if ("arraybuffer" == this._responseType && /msie 9.0/i.test(navigator.userAgent)) {
                        var e = window;
                        return e.convertResponseBodyToText(this._xhr.responseBody)
                    }
                    return "document" == this._responseType ? this._xhr.responseXML : null
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(r.prototype, "responseType", {
                get: function () {
                    return this._responseType
                },
                set: function (e) {
                    this._responseType = e
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(r.prototype, "withCredentials", {
                get: function () {
                    return this._withCredentials
                },
                set: function (e) {
                    this._withCredentials = e
                },
                enumerable: !0,
                configurable: !0
            }), r.prototype.getXHR = function () {
                return window.XMLHttpRequest ? new window.XMLHttpRequest : new ActiveXObject("MSXML2.XMLHTTP")
            }, r.prototype.open = function (e, t) {
                void 0 === t && (t = "GET"), this._url = e, this._method = t, this._xhr && (this._xhr.abort(), this._xhr = null), this._xhr = this.getXHR(), this._xhr.onreadystatechange = this.onReadyStateChange.bind(this), this._xhr.onprogress = this.updateProgress.bind(this), this._xhr.open(this._method, this._url, !0)
            }, r.prototype.send = function (e) {
                if (null != this._responseType && (this._xhr.responseType = this._responseType), null != this._withCredentials && (this._xhr.withCredentials = this._withCredentials), this.headerObj)
                    for (var t in this.headerObj) this._xhr.setRequestHeader(t, this.headerObj[t]);
                this._xhr.send(e)
            }, r.prototype.abort = function () {
                this._xhr && this._xhr.abort()
            }, r.prototype.getAllResponseHeaders = function () {
                if (!this._xhr) return null;
                var e = this._xhr.getAllResponseHeaders();
                return e ? e : ""
            }, r.prototype.setRequestHeader = function (e, t) {
                this.headerObj || (this.headerObj = {}), this.headerObj[e] = t
            }, r.prototype.getResponseHeader = function (e) {
                if (!this._xhr) return null;
                var t = this._xhr.getResponseHeader(e);
                return t ? t : ""
            }, r.prototype.onReadyStateChange = function () {
                var t = this._xhr;
                if (4 == t.readyState) {
                    var r = t.status >= 400 || 0 == t.status,
                        i = (this._url, this);
                    window.setTimeout(function () {
                        r ? i.dispatchEventWith(e.IOErrorEvent.IO_ERROR) : i.dispatchEventWith(e.Event.COMPLETE)
                    }, 0)
                }
            }, r.prototype.updateProgress = function (t) {
                t.lengthComputable && e.ProgressEvent.dispatchProgressEvent(this, e.ProgressEvent.PROGRESS, t.loaded, t.total)
            }, r
        }(e.EventDispatcher);
        t.WebHttpRequest = r, __reflect(r.prototype, "egret.web.WebHttpRequest", ["egret.HttpRequest"]), e.HttpRequest = r
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = window.URL || window.webkitURL,
            i = function (i) {
                function n() {
                    var e = null !== i && i.apply(this, arguments) || this;
                    return e.data = null, e._crossOrigin = null, e._hasCrossOriginSet = !1, e.currentImage = null, e.request = null, e
                }
                return __extends(n, i), Object.defineProperty(n.prototype, "crossOrigin", {
                    get: function () {
                        return this._crossOrigin
                    },
                    set: function (e) {
                        this._hasCrossOriginSet = !0, this._crossOrigin = e
                    },
                    enumerable: !0,
                    configurable: !0
                }), n.prototype.load = function (r) {
                    if (t.Html5Capatibility._canUseBlob && 0 != r.indexOf("wxLocalResource:") && 0 != r.indexOf("data:") && 0 != r.indexOf("http:") && 0 != r.indexOf("https:")) {
                        var i = this.request;
                        i || (i = this.request = new e.web.WebHttpRequest, i.addEventListener(e.Event.COMPLETE, this.onBlobLoaded, this), i.addEventListener(e.IOErrorEvent.IO_ERROR, this.onBlobError, this), i.responseType = "blob"), i.open(r), i.send()
                    } else this.loadImage(r)
                }, n.prototype.onBlobLoaded = function (e) {
                    var t = this.request.response;
                    this.request = void 0, this.loadImage(r.createObjectURL(t))
                }, n.prototype.onBlobError = function (e) {
                    this.dispatchIOError(this.currentURL), this.request = void 0
                }, n.prototype.loadImage = function (e) {
                    var t = new Image;
                    this.data = null, this.currentImage = t, this._hasCrossOriginSet ? this._crossOrigin && (t.crossOrigin = this._crossOrigin) : n.crossOrigin && (t.crossOrigin = n.crossOrigin), t.onload = this.onImageComplete.bind(this), t.onerror = this.onLoadError.bind(this), t.src = e
                }, n.prototype.onImageComplete = function (t) {
                    var r = this.getImage(t);
                    if (r) {
                        this.data = new e.BitmapData(r);
                        var i = this;
                        window.setTimeout(function () {
                            i.dispatchEventWith(e.Event.COMPLETE)
                        }, 0)
                    }
                }, n.prototype.onLoadError = function (e) {
                    var t = this.getImage(e);
                    t && this.dispatchIOError(t.src)
                }, n.prototype.dispatchIOError = function (t) {
                    var r = this;
                    window.setTimeout(function () {
                        r.dispatchEventWith(e.IOErrorEvent.IO_ERROR)
                    }, 0)
                }, n.prototype.getImage = function (t) {
                    var i = t.target,
                        n = i.src;
                    if (0 == n.indexOf("blob:")) try {
                        r.revokeObjectURL(i.src)
                    } catch (a) {
                        e.$warn(1037)
                    }
                    return i.onerror = null, i.onload = null, this.currentImage !== i ? null : (this.currentImage = null, i)
                }, n.crossOrigin = null, n
            }(e.EventDispatcher);
        t.WebImageLoader = i, __reflect(i.prototype, "egret.web.WebImageLoader", ["egret.ImageLoader"]), e.ImageLoader = i
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (t) {
            function r() {
                var e = t.call(this) || this;
                return e._isNeedShow = !1, e.inputElement = null, e.inputDiv = null, e._gscaleX = 0, e._gscaleY = 0, e.textValue = "", e.colorValue = 16777215, e._styleInfoes = {}, e
            }
            return __extends(r, t), r.prototype.$setTextField = function (e) {
                return this.$textfield = e, !0
            }, r.prototype.$addToStage = function () {
                this.htmlInput = e.web.$getTextAdapter(this.$textfield)
            }, r.prototype._initElement = function () {
                var t = this.$textfield.localToGlobal(0, 0),
                    r = t.x,
                    i = t.y,
                    n = this.htmlInput.$scaleX,
                    a = this.htmlInput.$scaleY;
                this.inputDiv.style.left = r * n + "px", this.inputDiv.style.top = i * a + "px", this.$textfield.multiline && this.$textfield.height > this.$textfield.size ? (this.inputDiv.style.top = i * a + "px", this.inputElement.style.top = -this.$textfield.lineSpacing / 2 * a + "px") : (this.inputDiv.style.top = i * a + "px", this.inputElement.style.top = "0px");
                for (var o = this.$textfield, s = 1, c = 1, l = 0; o.parent;) s *= o.scaleX, c *= o.scaleY, l += o.rotation, o = o.parent;
                var h = e.web.getPrefixStyleName("transform");
                this.inputDiv.style[h] = "rotate(" + l + "deg)", this._gscaleX = n * s, this._gscaleY = a * c
            }, r.prototype.$show = function () {
                this.htmlInput.isCurrentStageText(this) ? this.inputElement.onblur = null : (this.inputElement = this.htmlInput.getInputElement(this), this.$textfield.multiline ? this.inputElement.type = "text" : this.inputElement.type = this.$textfield.inputType, this.inputDiv = this.htmlInput._inputDIV), this.htmlInput._needShow = !0, this._isNeedShow = !0, this._initElement()
            }, r.prototype.onBlurHandler = function () {
                this.htmlInput.clearInputElement(), window.scrollTo(0, 0)
            }, r.prototype.executeShow = function () {
                this.inputElement.value = this.$getText(), null == this.inputElement.onblur && (this.inputElement.onblur = this.onBlurHandler.bind(this)), this.$resetStageText(), this.$textfield.maxChars > 0 ? this.inputElement.setAttribute("maxlength", this.$textfield.maxChars) : this.inputElement.removeAttribute("maxlength"), this.inputElement.selectionStart = this.inputElement.value.length, this.inputElement.selectionEnd = this.inputElement.value.length, this.inputElement.focus()
            }, r.prototype.$hide = function () {
                this.htmlInput && this.htmlInput.disconnectStageText(this)
            }, r.prototype.$getText = function () {
                return this.textValue || (this.textValue = ""), this.textValue
            }, r.prototype.$setText = function (e) {
                return this.textValue = e, this.resetText(), !0
            }, r.prototype.resetText = function () {
                this.inputElement && (this.inputElement.value = this.textValue)
            }, r.prototype.$setColor = function (e) {
                return this.colorValue = e, this.resetColor(), !0
            }, r.prototype.resetColor = function () {
                this.inputElement && this.setElementStyle("color", e.toColorString(this.colorValue))
            }, r.prototype.$onBlur = function () { }, r.prototype._onInput = function () {
                var t = this;
                window.setTimeout(function () {
                    t.inputElement && t.inputElement.selectionStart == t.inputElement.selectionEnd && (t.textValue = t.inputElement.value, e.Event.dispatchEvent(t, "updateText", !1))
                }, 0)
            }, r.prototype.setAreaHeight = function () {
                var t = this.$textfield;
                if (t.multiline) {
                    var r = e.TextFieldUtils.$getTextHeight(t);
                    if (t.height <= t.size) this.setElementStyle("height", t.size * this._gscaleY + "px"), this.setElementStyle("padding", "0px"), this.setElementStyle("lineHeight", t.size * this._gscaleY + "px");
                    else if (t.height < r) this.setElementStyle("height", t.height * this._gscaleY + "px"), this.setElementStyle("padding", "0px"), this.setElementStyle("lineHeight", (t.size + t.lineSpacing) * this._gscaleY + "px");
                    else {
                        this.setElementStyle("height", (r + t.lineSpacing) * this._gscaleY + "px");
                        var i = (t.height - r) * this._gscaleY,
                            n = e.TextFieldUtils.$getValign(t),
                            a = i * n,
                            o = i - a;
                        this.setElementStyle("padding", a + "px 0px " + o + "px 0px"), this.setElementStyle("lineHeight", (t.size + t.lineSpacing) * this._gscaleY + "px")
                    }
                }
            }, r.prototype._onClickHandler = function (t) {
                this._isNeedShow && (t.stopImmediatePropagation(), this._isNeedShow = !1, this.executeShow(), this.dispatchEvent(new e.Event("focus")))
            }, r.prototype._onDisconnect = function () {
                this.inputElement = null, this.dispatchEvent(new e.Event("blur"))
            }, r.prototype.setElementStyle = function (e, t) {
                this.inputElement && this._styleInfoes[e] != t && (this.inputElement.style[e] = t)
            }, r.prototype.$removeFromStage = function () {
                this.inputElement && this.htmlInput.disconnectStageText(this)
            }, r.prototype.$resetStageText = function () {
                if (this.inputElement) {
                    var t = this.$textfield;
                    this.setElementStyle("fontFamily", t.fontFamily), this.setElementStyle("fontStyle", t.italic ? "italic" : "normal"), this.setElementStyle("fontWeight", t.bold ? "bold" : "normal"), this.setElementStyle("textAlign", t.textAlign), this.setElementStyle("fontSize", t.size * this._gscaleY + "px"), this.setElementStyle("color", e.toColorString(t.textColor));
                    var r = void 0;
                    if (t.stage ? (r = t.localToGlobal(0, 0).x, r = Math.min(t.width, t.stage.stageWidth - r)) : r = t.width, this.setElementStyle("width", r * this._gscaleX + "px"), this.setElementStyle("verticalAlign", t.verticalAlign), t.multiline) this.setAreaHeight();
                    else if (this.setElementStyle("lineHeight", t.size * this._gscaleY + "px"), t.height < t.size) {
                        this.setElementStyle("height", t.size * this._gscaleY + "px");
                        var i = t.size / 2 * this._gscaleY;
                        this.setElementStyle("padding", "0px 0px " + i + "px 0px")
                    } else {
                        this.setElementStyle("height", t.size * this._gscaleY + "px");
                        var n = (t.height - t.size) * this._gscaleY,
                            a = e.TextFieldUtils.$getValign(t),
                            o = n * a,
                            i = n - o;
                        i < t.size / 2 * this._gscaleY && (i = t.size / 2 * this._gscaleY), this.setElementStyle("padding", o + "px 0px " + i + "px 0px")
                    }
                    this.inputDiv.style.clip = "rect(0px " + t.width * this._gscaleX + "px " + t.height * this._gscaleY + "px 0px)", this.inputDiv.style.height = t.height * this._gscaleY + "px", this.inputDiv.style.width = r * this._gscaleX + "px"
                }
            }, r
        }(e.EventDispatcher);
        t.HTML5StageText = r, __reflect(r.prototype, "egret.web.HTML5StageText", ["egret.StageText"]), e.StageText = r
    }(t = e.web || (e.web = {}))
}(egret || (egret = {})),
    function (e) {
        var t;
        ! function (t) {
            var r = function () {
                function t() {
                    this._needShow = !1, this.$scaleX = 1, this.$scaleY = 1
                }
                return t.prototype.isInputOn = function () {
                    return null != this._stageText
                }, t.prototype.isCurrentStageText = function (e) {
                    return this._stageText == e
                }, t.prototype.initValue = function (e) {
                    e.style.position = "absolute", e.style.left = "0px", e.style.top = "0px", e.style.border = "none", e.style.padding = "0"
                }, t.prototype.$updateSize = function () {
                    if (this.canvas) {
                        this.$scaleX = e.sys.DisplayList.$canvasScaleX, this.$scaleY = e.sys.DisplayList.$canvasScaleY, this.StageDelegateDiv.style.left = this.canvas.style.left, this.StageDelegateDiv.style.top = this.canvas.style.top;
                        var t = e.web.getPrefixStyleName("transform");
                        this.StageDelegateDiv.style[t] = this.canvas.style[t], this.StageDelegateDiv.style[e.web.getPrefixStyleName("transformOrigin")] = "0% 0% 0px"
                    }
                }, t.prototype._initStageDelegateDiv = function (t, r) {
                    this.canvas = r;
                    var i, n = this;
                    i || (i = document.createElement("div"), this.StageDelegateDiv = i, i.id = "StageDelegateDiv", t.appendChild(i), n.initValue(i), n._inputDIV = document.createElement("div"), n.initValue(n._inputDIV), n._inputDIV.style.width = "0px", n._inputDIV.style.height = "0px", n._inputDIV.style.left = "0px", n._inputDIV.style.top = "-100px", n._inputDIV.style[e.web.getPrefixStyleName("transformOrigin")] = "0% 0% 0px", i.appendChild(n._inputDIV), this.canvas.addEventListener("click", function (e) {
                        n._needShow ? (n._needShow = !1, n._stageText._onClickHandler(e), n.show()) : n._inputElement && (n.clearInputElement(), n._inputElement.blur(), n._inputElement = null)
                    }), n.initInputElement(!0), n.initInputElement(!1))
                }, t.prototype.initInputElement = function (e) {
                    var t, r = this;
                    e ? (t = document.createElement("textarea"), t.style.resize = "none", r._multiElement = t, t.id = "egretTextarea") : (t = document.createElement("input"), r._simpleElement = t, t.id = "egretInput"), t.type = "text", r._inputDIV.appendChild(t), t.setAttribute("tabindex", "-1"), t.style.width = "1px", t.style.height = "12px", r.initValue(t), t.style.outline = "thin", t.style.background = "none", t.style.overflow = "hidden", t.style.wordBreak = "break-all", t.style.opacity = 0, t.oninput = function () {
                        r._stageText && r._stageText._onInput()
                    }
                }, t.prototype.show = function () {
                    var t = this,
                        r = t._inputElement;
                    e.$callAsync(function () {
                        r.style.opacity = 1
                    }, t)
                }, t.prototype.disconnectStageText = function (e) {
                    (null == this._stageText || this._stageText == e) && (this.clearInputElement(), this._inputElement && this._inputElement.blur())
                }, t.prototype.clearInputElement = function () {
                    var e = this;
                    if (e._inputElement) {
                        e._inputElement.value = "", e._inputElement.onblur = null, e._inputElement.style.width = "1px", e._inputElement.style.height = "12px", e._inputElement.style.left = "0px", e._inputElement.style.top = "0px", e._inputElement.style.opacity = 0;
                        var t = void 0;
                        t = e._simpleElement == e._inputElement ? e._multiElement : e._simpleElement, t.style.display = "block", e._inputDIV.style.left = "0px", e._inputDIV.style.top = "-100px", e._inputDIV.style.height = "0px", e._inputDIV.style.width = "0px"
                    }
                    e._stageText && (e._stageText._onDisconnect(), e._stageText = null, this.canvas.userTyping = !1)
                }, t.prototype.getInputElement = function (e) {
                    var t = this;
                    t.clearInputElement(), t._stageText = e, this.canvas.userTyping = !0, t._stageText.$textfield.multiline ? t._inputElement = t._multiElement : t._inputElement = t._simpleElement;
                    var r;
                    return r = t._simpleElement == t._inputElement ? t._multiElement : t._simpleElement, r.style.display = "none", t._inputElement
                }, t
            }();
            t.HTMLInput = r, __reflect(r.prototype, "egret.web.HTMLInput")
        }(t = e.web || (e.web = {}))
    }(egret || (egret = {})),
    function (e) {
        var t;
        ! function (e) {
            function t(e) {
                var t = e.stage ? e.stage.$hashCode : 0,
                    r = i[t],
                    o = n[t],
                    s = a[t];
                return o && s && (delete n[t], delete a[t]), r
            }

            function r(e, t, r, o) {
                e._initStageDelegateDiv(r, o), i[t.$hashCode] = e, n[t.$hashCode] = o, a[t.$hashCode] = r
            }
            var i = {},
                n = {},
                a = {};
            e.$getTextAdapter = t, e.$cacheTextAdapter = r
        }(t = e.web || (e.web = {}))
    }(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        function r(e, t, r, a, o) {
            n || i();
            var s = "";
            return o && (s += "italic "), a && (s += "bold "), s += (r || 12) + "px ", s += t || "Arial", n.font = s, n.measureText(e).width
        }

        function i() {
            n = e.sys.canvasHitTestBuffer.context, n.textAlign = "left", n.textBaseline = "middle"
        }
        var n = null;
        e.sys.measureText = r
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) {
        function t(e, t) {
            var r = document.createElement("canvas");
            isNaN(e) || isNaN(t) || (r.width = e, r.height = t);
            var i = r.getContext("2d");
            if (void 0 === i.imageSmoothingEnabled) {
                for (var n, a = ["webkitImageSmoothingEnabled", "mozImageSmoothingEnabled", "msImageSmoothingEnabled"], o = a.length - 1; o >= 0 && (n = a[o], void 0 === i[n]); o--);
                try {
                    Object.defineProperty(i, "imageSmoothingEnabled", {
                        get: function () {
                            return this[n]
                        },
                        set: function (e) {
                            this[n] = e
                        }
                    })
                } catch (s) {
                    i.imageSmoothingEnabled = i[n]
                }
            }
            return r
        }
        var r = function () {
            function e(e, r, i) {
                this.surface = t(e, r), this.context = this.surface.getContext("2d"), this.context && (this.context.$offsetX = 0, this.context.$offsetY = 0)
            }
            return Object.defineProperty(e.prototype, "width", {
                get: function () {
                    return this.surface.width
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(e.prototype, "height", {
                get: function () {
                    return this.surface.height
                },
                enumerable: !0,
                configurable: !0
            }), e.prototype.resize = function (e, t, r) {
                var i = this.surface;
                if (r) {
                    var n = !1;
                    i.width < e && (i.width = e, n = !0), i.height < t && (i.height = t, n = !0), n || (this.context.globalCompositeOperation = "source-over", this.context.setTransform(1, 0, 0, 1, 0, 0), this.context.globalAlpha = 1)
                } else i.width != e && (i.width = e), i.height != t && (i.height = t);
                this.clear()
            }, e.prototype.getPixels = function (e, t, r, i) {
                return void 0 === r && (r = 1), void 0 === i && (i = 1), this.context.getImageData(e, t, r, i).data
            }, e.prototype.toDataURL = function (e, t) {
                return this.surface.toDataURL(e, t)
            }, e.prototype.clear = function () {
                this.context.setTransform(1, 0, 0, 1, 0, 0), this.context.clearRect(0, 0, this.surface.width, this.surface.height)
            }, e.prototype.destroy = function () {
                this.surface.width = this.surface.height = 0
            }, e
        }();
        e.CanvasRenderBuffer = r, __reflect(r.prototype, "egret.web.CanvasRenderBuffer", ["egret.sys.RenderBuffer"])
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (t) {
            function r(r, i) {
                var n = t.call(this) || this;
                return n.onTouchBegin = function (e) {
                    var t = n.getLocation(e);
                    n.touch.onTouchBegin(t.x, t.y, e.identifier)
                }, n.onMouseMove = function (e) {
                    0 == e.buttons ? n.onTouchEnd(e) : n.onTouchMove(e)
                }, n.onTouchMove = function (e) {
                    var t = n.getLocation(e);
                    n.touch.onTouchMove(t.x, t.y, e.identifier)
                }, n.onTouchEnd = function (e) {
                    var t = n.getLocation(e);
                    n.touch.onTouchEnd(t.x, t.y, e.identifier)
                }, n.scaleX = 1, n.scaleY = 1, n.rotation = 0, n.canvas = i, n.touch = new e.sys.TouchHandler(r), n.addListeners(), n
            }
            return __extends(r, t), r.prototype.addListeners = function () {
                var t = this;
                window.navigator.msPointerEnabled ? (this.canvas.addEventListener("MSPointerDown", function (e) {
                    e.identifier = e.pointerId, t.onTouchBegin(e), t.prevent(e)
                }, !1), this.canvas.addEventListener("MSPointerMove", function (e) {
                    e.identifier = e.pointerId, t.onTouchMove(e), t.prevent(e)
                }, !1), this.canvas.addEventListener("MSPointerUp", function (e) {
                    e.identifier = e.pointerId, t.onTouchEnd(e), t.prevent(e)
                }, !1)) : (e.Capabilities.isMobile || this.addMouseListener(), this.addTouchListener())
            }, r.prototype.addMouseListener = function () {
                this.canvas.addEventListener("mousedown", this.onTouchBegin), this.canvas.addEventListener("mousemove", this.onMouseMove), this.canvas.addEventListener("mouseup", this.onTouchEnd)
            }, r.prototype.addTouchListener = function () {
                var e = this;
                this.canvas.addEventListener("touchstart", function (t) {
                    for (var r = t.changedTouches.length, i = 0; r > i; i++) e.onTouchBegin(t.changedTouches[i]);
                    e.prevent(t)
                }, !1), this.canvas.addEventListener("touchmove", function (t) {
                    for (var r = t.changedTouches.length, i = 0; r > i; i++) e.onTouchMove(t.changedTouches[i]);
                    e.prevent(t)
                }, !1), this.canvas.addEventListener("touchend", function (t) {
                    for (var r = t.changedTouches.length, i = 0; r > i; i++) e.onTouchEnd(t.changedTouches[i]);
                    e.prevent(t)
                }, !1), this.canvas.addEventListener("touchcancel", function (t) {
                    for (var r = t.changedTouches.length, i = 0; r > i; i++) e.onTouchEnd(t.changedTouches[i]);
                    e.prevent(t)
                }, !1)
            }, r.prototype.prevent = function (e) {
                e.stopPropagation(), 1 == e.isScroll || this.canvas.userTyping || e.preventDefault()
            }, r.prototype.getLocation = function (t) {
                t.identifier = +t.identifier || 0;
                var r = document.documentElement,
                    i = this.canvas.getBoundingClientRect(),
                    n = i.left + window.pageXOffset - r.clientLeft,
                    a = i.top + window.pageYOffset - r.clientTop,
                    o = t.pageX - n,
                    s = o,
                    c = t.pageY - a,
                    l = c;
                return 90 == this.rotation ? (s = c, l = i.width - o) : -90 == this.rotation && (s = i.height - c, l = o), s /= this.scaleX, l /= this.scaleY, e.$TempPoint.setTo(Math.round(s), Math.round(l))
            }, r.prototype.updateScaleMode = function (e, t, r) {
                this.scaleX = e, this.scaleY = t, this.rotation = r
            }, r.prototype.$updateMaxTouches = function () {
                this.touch.$initMaxTouches()
            }, r
        }(e.HashObject);
        t.WebTouchHandler = r, __reflect(r.prototype, "egret.web.WebTouchHandler")
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) {
        e.WebLifeCycleHandler = function (e) {
            var t = function () {
                document[r] ? e.pause() : e.resume()
            };
            window.addEventListener("focus", e.resume, !1), window.addEventListener("blur", e.pause, !1);
            var r, i;
            "undefined" != typeof document.hidden ? (r = "hidden", i = "visibilitychange") : "undefined" != typeof document.mozHidden ? (r = "mozHidden", i = "mozvisibilitychange") : "undefined" != typeof document.msHidden ? (r = "msHidden", i = "msvisibilitychange") : "undefined" != typeof document.webkitHidden ? (r = "webkitHidden", i = "webkitvisibilitychange") : "undefined" != typeof document.oHidden && (r = "oHidden", i = "ovisibilitychange"), "onpageshow" in window && "onpagehide" in window && (window.addEventListener("pageshow", e.resume, !1), window.addEventListener("pagehide", e.pause, !1)), r && i && document.addEventListener(i, t, !1);
            var n = navigator.userAgent,
                a = /micromessenger/gi.test(n),
                o = /mqq/gi.test(n),
                s = /mobile.*qq/gi.test(n);
            if ((s || a) && (o = !1), o) {
                var c = window.browser || {};
                c.execWebFn = c.execWebFn || {}, c.execWebFn.postX5GamePlayerMessage = function (t) {
                    var r = t.type;
                    "app_enter_background" == r ? e.pause() : "app_enter_foreground" == r && e.resume()
                }, window.browser = c
            }
        }
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        function r(e, t) {
            var r = "";
            if (null != t) r = i(e, t);
            else {
                if (null == o) {
                    var n = document.createElement("div").style;
                    o = i("transform", n)
                }
                r = o
            }
            return "" == r ? e : r + e.charAt(0).toUpperCase() + e.substring(1, e.length)
        }

        function i(e, t) {
            if (e in t) return "";
            e = e.charAt(0).toUpperCase() + e.substring(1, e.length);
            for (var r = ["webkit", "ms", "Moz", "O"], i = 0; i < r.length; i++) {
                var n = r[i] + e;
                if (n in t) return r[i]
            }
            return ""
        }
        var n = function () {
            function e() { }
            return e.WEB_AUDIO = 2, e.HTML5_AUDIO = 3, e
        }();
        t.AudioType = n, __reflect(n.prototype, "egret.web.AudioType");
        var a = function (r) {
            function i() {
                return r.call(this) || this
            }
            return __extends(i, r), i.$init = function () {
                var r = navigator.userAgent.toLowerCase();
                i.ua = r, i._canUseBlob = !1;
                var a = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
                if (a) try {
                    t.WebAudioDecode.ctx = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext)
                } catch (o) {
                    a = !1
                }
                var s, c = i._audioType;
                c == n.WEB_AUDIO && a || c == n.HTML5_AUDIO ? (s = !1, i.setAudioType(c)) : (s = !0, i.setAudioType(n.HTML5_AUDIO)), r.indexOf("android") >= 0 ? s && a && i.setAudioType(n.WEB_AUDIO) : (r.indexOf("iphone") >= 0 || r.indexOf("ipad") >= 0 || r.indexOf("ipod") >= 0) && i.getIOSVersion() >= 7 && (i._canUseBlob = !0, s && a && i.setAudioType(n.WEB_AUDIO));
                var l = window.URL || window.webkitURL;
                l || (i._canUseBlob = !1), r.indexOf("egretnative") >= 0 && (i.setAudioType(n.HTML5_AUDIO), i._canUseBlob = !0), e.Sound = i._AudioClass
            }, i.setAudioType = function (t) {
                switch (i._audioType = t, t) {
                    case n.WEB_AUDIO:
                        i._AudioClass = e.web.WebAudioSound;
                        break;
                    case n.HTML5_AUDIO:
                        i._AudioClass = e.web.HtmlSound
                }
            }, i.getIOSVersion = function () {
                var e = i.ua.toLowerCase().match(/cpu [^\d]*\d.*like mac os x/);
                if (!e || 0 == e.length) return 0;
                var t = e[0];
                return parseInt(t.match(/\d+(_\d)*/)[0]) || 0
            }, i._canUseBlob = !1, i._audioType = 0, i.ua = "", i
        }(e.HashObject);
        t.Html5Capatibility = a, __reflect(a.prototype, "egret.web.Html5Capatibility");
        var o = null;
        t.getPrefixStyleName = r, t.getPrefix = i
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        function r() {
            if (s)
                for (var e = document.querySelectorAll(".egret-player"), t = e.length, r = 0; t > r; r++) {
                    var i = e[r],
                        n = i["egret-player"];
                    n.updateScreenSize()
                }
        }

        function i(r) {
            if (!s) {
                s = !0, r || (r = {});
                var i = navigator.userAgent.toLowerCase();
                if (i.indexOf("egretnative") >= 0 && -1 == i.indexOf("egretwebview") && (e.Capabilities.runtimeType = e.RuntimeType.RUNTIME2), i.indexOf("egretnative") >= 0 && e.nativeRender) egret_native.addModuleCallback(function () {
                    if (t.Html5Capatibility.$init(), "webgl" == r.renderMode) {
                        var i = r.antialias;
                        t.WebGLRenderContext.antialias = !!i
                    }
                    e.sys.CanvasRenderBuffer = t.CanvasRenderBuffer, n(r.renderMode), egret_native.nrSetRenderMode(2);
                    var s;
                    s = r.canvasScaleFactor ? r.canvasScaleFactor : r.calculateCanvasScaleFactor ? r.calculateCanvasScaleFactor(e.sys.canvasHitTestBuffer.context) : window.devicePixelRatio, e.sys.DisplayList.$canvasScaleFactor = s;
                    var l = e.ticker;
                    a(l), r.screenAdapter ? e.sys.screenAdapter = r.screenAdapter : e.sys.screenAdapter || (e.sys.screenAdapter = new e.sys.DefaultScreenAdapter);
                    for (var h = document.querySelectorAll(".egret-player"), u = h.length, d = 0; u > d; d++) {
                        var f = h[d],
                            p = new t.WebPlayer(f, r);
                        f["egret-player"] = p
                    }
                    window.addEventListener("resize", function () {
                        isNaN(c) && (c = window.setTimeout(o, 300))
                    })
                }, null), egret_native.initNativeRender();
                else {
                    if (t.Html5Capatibility._audioType = r.audioType, t.Html5Capatibility.$init(), "webgl" == r.renderMode) {
                        var l = r.antialias;
                        t.WebGLRenderContext.antialias = !!l
                    }
                    e.sys.CanvasRenderBuffer = t.CanvasRenderBuffer, n(r.renderMode);
                    var h = void 0;
                    if (r.canvasScaleFactor) h = r.canvasScaleFactor;
                    else if (r.calculateCanvasScaleFactor) h = r.calculateCanvasScaleFactor(e.sys.canvasHitTestBuffer.context);
                    else {
                        var u = e.sys.canvasHitTestBuffer.context,
                            d = u.backingStorePixelRatio || u.webkitBackingStorePixelRatio || u.mozBackingStorePixelRatio || u.msBackingStorePixelRatio || u.oBackingStorePixelRatio || u.backingStorePixelRatio || 1;
                        h = (window.devicePixelRatio || 1) / d
                    }
                    e.sys.DisplayList.$canvasScaleFactor = h;
                    var f = e.ticker;
                    a(f), r.screenAdapter ? e.sys.screenAdapter = r.screenAdapter : e.sys.screenAdapter || (e.sys.screenAdapter = new e.sys.DefaultScreenAdapter);
                    for (var p = document.querySelectorAll(".egret-player"), v = p.length, g = 0; v > g; g++) {
                        var y = p[g],
                            x = new t.WebPlayer(y, r);
                        y["egret-player"] = x
                    }
                    window.addEventListener("resize", function () {
                        isNaN(c) && (c = window.setTimeout(o, 300))
                    })
                }
            }
        }

        function n(r) {
            "webgl" == r && e.WebGLUtils.checkCanUseWebGL() ? (e.sys.RenderBuffer = t.WebGLRenderBuffer, e.sys.systemRenderer = new t.WebGLRenderer, e.sys.canvasRenderer = new e.CanvasRenderer, e.sys.customHitTestBuffer = new t.WebGLRenderBuffer(3, 3), e.sys.canvasHitTestBuffer = new t.CanvasRenderBuffer(3, 3), e.Capabilities.renderMode = "webgl") : (e.sys.RenderBuffer = t.CanvasRenderBuffer, e.sys.systemRenderer = new e.CanvasRenderer, e.sys.canvasRenderer = e.sys.systemRenderer, e.sys.customHitTestBuffer = new t.CanvasRenderBuffer(3, 3), e.sys.canvasHitTestBuffer = e.sys.customHitTestBuffer, e.Capabilities.renderMode = "canvas")
        }

        function a(e) {
            function t() {
                e.update(), r(t)
            }
            var r = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
            r || (r = function (e) {
                return window.setTimeout(e, 1e3 / 60)
            }), r(t)
        }

        function o() {
            c = 0 / 0, e.updateAllScreens()
        }
        var s = !1;
        window.isNaN = function (e) {
            return e = +e, e !== e
        }, e.runEgret = i, e.updateAllScreens = r;
        var c = 0 / 0
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var language, egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function () {
            function t() { }
            return t.detect = function () {
                var r = e.Capabilities,
                    i = navigator.userAgent.toLowerCase();
                r.isMobile = -1 != i.indexOf("mobile") || -1 != i.indexOf("android"), r.isMobile ? i.indexOf("windows") < 0 && (-1 != i.indexOf("iphone") || -1 != i.indexOf("ipad") || -1 != i.indexOf("ipod")) ? r.os = "iOS" : -1 != i.indexOf("android") && -1 != i.indexOf("linux") ? r.os = "Android" : -1 != i.indexOf("windows") && (r.os = "Windows Phone") : -1 != i.indexOf("windows nt") ? r.os = "Windows PC" : -1 != i.indexOf("mac os") && (r.os = "Mac OS");
                var n = (navigator.language || navigator.browserLanguage).toLowerCase(),
                    a = n.split("-");
                a.length > 1 && (a[1] = a[1].toUpperCase()), r.language = a.join("-"), t.injectUIntFixOnIE9()
            }, t.injectUIntFixOnIE9 = function () {
                if (/msie 9.0/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)) {
                    var e = "<!-- IEBinaryToArray_ByteStr -->\r\n<script type='text/vbscript' language='VBScript'>\r\nFunction IEBinaryToArray_ByteStr(Binary)\r\n   IEBinaryToArray_ByteStr = CStr(Binary)\r\nEnd Function\r\nFunction IEBinaryToArray_ByteStr_Last(Binary)\r\n   Dim lastIndex\r\n   lastIndex = LenB(Binary)\r\n   if lastIndex mod 2 Then\r\n       IEBinaryToArray_ByteStr_Last = Chr( AscB( MidB( Binary, lastIndex, 1 ) ) )\r\n   Else\r\n       IEBinaryToArray_ByteStr_Last = \"\"\r\n   End If\r\nEnd Function\r\n</script>\r\n<!-- convertResponseBodyToText -->\r\n<script>\r\nlet convertResponseBodyToText = function (binary) {\r\n   let byteMapping = {};\r\n   for ( let i = 0; i < 256; i++ ) {\r\n       for ( let j = 0; j < 256; j++ ) {\r\n           byteMapping[ String.fromCharCode( i + j * 256 ) ] =\r\n           String.fromCharCode(i) + String.fromCharCode(j);\r\n       }\r\n   }\r\n   let rawBytes = IEBinaryToArray_ByteStr(binary);\r\n   let lastChr = IEBinaryToArray_ByteStr_Last(binary);\r\n   return rawBytes.replace(/[\\s\\S]/g,                           function( match ) { return byteMapping[match]; }) + lastChr;\r\n};\r\n</script>\r\n";
                    document.write(e)
                }
            }, t
        }();
        t.WebCapability = r, __reflect(r.prototype, "egret.web.WebCapability"), r.detect()
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function () {
            function t(t, r, i, n, a) {
                if (this.showPanle = !0, this.fpsHeight = 0, this.WIDTH = 101, this.HEIGHT = 20, this.bgCanvasColor = "#18304b", this.fpsFrontColor = "#18fefe", this.WIDTH_COST = 50, this.cost1Color = "#18fefe", this.cost3Color = "#ff0000", this.arrFps = [], this.arrCost = [], this.arrLog = [], r || i) {
                    "canvas" == e.Capabilities.renderMode ? this.renderMode = "Canvas" : this.renderMode = "WebGL", this.panelX = void 0 === a.x ? 0 : parseInt(a.x), this.panelY = void 0 === a.y ? 0 : parseInt(a.y), this.fontColor = void 0 === a.textColor ? "#ffffff" : a.textColor.replace("0x", "#"), this.fontSize = void 0 === a.size ? 12 : parseInt(a.size), e.Capabilities.isMobile && (this.fontSize -= 2);
                    var o = document.createElement("div");
                    o.style.position = "absolute", o.style.background = "rgba(0,0,0," + a.bgAlpha + ")", o.style.left = this.panelX + "px", o.style.top = this.panelY + "px", o.style.pointerEvents = "none", document.body.appendChild(o);
                    var s = document.createElement("div");
                    s.style.color = this.fontColor, s.style.fontSize = this.fontSize + "px", s.style.lineHeight = this.fontSize + "px", s.style.margin = "4px 4px 4px 4px", this.container = s, o.appendChild(s), r && this.addFps(), i && this.addLog()
                }
            }
            return t.prototype.addFps = function () {
                var e = document.createElement("div");
                e.style.display = "inline-block", this.containerFps = e, this.container.appendChild(e);
                var t = document.createElement("div");
                t.style.paddingBottom = "2px", this.fps = t, this.containerFps.appendChild(t), t.innerHTML = "0 FPS " + this.renderMode + "<br/>min0 max0 avg0";
                var r = document.createElement("canvas");
                this.containerFps.appendChild(r), r.width = this.WIDTH, r.height = this.HEIGHT, this.canvasFps = r;
                var i = r.getContext("2d");
                this.contextFps = i, i.fillStyle = this.bgCanvasColor, i.fillRect(0, 0, this.WIDTH, this.HEIGHT);
                var n = document.createElement("div");
                this.divDatas = n, this.containerFps.appendChild(n);
                var a = document.createElement("div");
                a.style["float"] = "left", a.innerHTML = "Draw<br/>Cost", n.appendChild(a);
                var o = document.createElement("div");
                o.style.paddingLeft = a.offsetWidth + 20 + "px", n.appendChild(o);
                var s = document.createElement("div");
                this.divDraw = s, s.innerHTML = "0<br/>", o.appendChild(s);
                var c = document.createElement("div");
                this.divCost = c, c.innerHTML = '<font  style="color:' + this.cost1Color + '">0<font/> <font  style="color:' + this.cost3Color + '">0<font/>', o.appendChild(c), r = document.createElement("canvas"), this.canvasCost = r, this.containerFps.appendChild(r), r.width = this.WIDTH, r.height = this.HEIGHT, i = r.getContext("2d"), this.contextCost = i, i.fillStyle = this.bgCanvasColor, i.fillRect(0, 0, this.WIDTH, this.HEIGHT), i.fillStyle = "#000000", i.fillRect(this.WIDTH_COST, 0, 1, this.HEIGHT), this.fpsHeight = this.container.offsetHeight
            }, t.prototype.addLog = function () {
                var e = document.createElement("div");
                e.style.maxWidth = document.body.clientWidth - 8 - this.panelX + "px", e.style.wordWrap = "break-word", this.log = e, this.container.appendChild(e)
            }, t.prototype.update = function (e, t) {
                void 0 === t && (t = !1);
                var r, i, n;
                t ? (r = this.arrFps[this.arrFps.length - 1], i = this.arrCost[this.arrCost.length - 1][0], n = this.arrCost[this.arrCost.length - 1][1]) : (r = e.fps, i = e.costTicker, n = e.costRender, this.lastNumDraw = e.draw, this.arrFps.push(r), this.arrCost.push([i, n]));
                var a = 0,
                    o = this.arrFps.length;
                o > 101 && (o = 101, this.arrFps.shift(), this.arrCost.shift());
                for (var s = this.arrFps[0], c = this.arrFps[0], l = 0; o > l; l++) {
                    var h = this.arrFps[l];
                    a += h, s > h ? s = h : h > c && (c = h)
                }
                var u = this.WIDTH,
                    d = this.HEIGHT,
                    f = this.contextFps;
                f.drawImage(this.canvasFps, 1, 0, u - 1, d, 0, 0, u - 1, d), f.fillStyle = this.bgCanvasColor, f.fillRect(u - 1, 0, 1, d);
                var p = Math.floor(r / 60 * 20);
                1 > p && (p = 1), f.fillStyle = this.fpsFrontColor, f.fillRect(u - 1, 20 - p, 1, p);
                var v = this.WIDTH_COST;
                f = this.contextCost, f.drawImage(this.canvasCost, 1, 0, v - 1, d, 0, 0, v - 1, d), f.drawImage(this.canvasCost, v + 2, 0, v - 1, d, v + 1, 0, v - 1, d);
                var g = Math.floor(i / 2);
                1 > g ? g = 1 : g > 20 && (g = 20);
                var y = Math.floor(n / 2);
                1 > y ? y = 1 : y > 20 && (y = 20), f.fillStyle = this.bgCanvasColor, f.fillRect(v - 1, 0, 1, d), f.fillRect(2 * v, 0, 1, d), f.fillRect(3 * v + 1, 0, 1, d), f.fillStyle = this.cost1Color, f.fillRect(v - 1, 20 - g, 1, g), f.fillStyle = this.cost3Color, f.fillRect(2 * v, 20 - y, 1, y);
                var x = Math.floor(a / o),
                    m = r + " FPS " + this.renderMode;
                this.showPanle && (m += "<br/>min" + s + " max" + c + " avg" + x, this.divDraw.innerHTML = this.lastNumDraw + "<br/>", this.divCost.innerHTML = '<font  style="color:#18fefe">' + i + '<font/> <font  style="color:#ff0000">' + n + "<font/>"), this.fps.innerHTML = m
            }, t.prototype.updateInfo = function (e) {
                this.arrLog.push(e), this.updateLogLayout()
            }, t.prototype.updateWarn = function (e) {
                this.arrLog.push("[Warning]" + e), this.updateLogLayout()
            }, t.prototype.updateError = function (e) {
                this.arrLog.push("[Error]" + e), this.updateLogLayout()
            }, t.prototype.updateLogLayout = function () {
                for (this.log.innerHTML = this.arrLog.join("<br/>"); document.body.clientHeight < this.log.offsetHeight + this.fpsHeight + this.panelY + 2 * this.fontSize;) this.arrLog.shift(), this.log.innerHTML = this.arrLog.join("<br/>")
            }, t
        }();
        t.WebFps = r, __reflect(r.prototype, "egret.web.WebFps", ["egret.FPSDisplay"]), e.FPSDisplay = r
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r;
        ! function (r) {
            function i(e) {
                return window.localStorage.getItem(e)
            }

            function n(t, r) {
                try {
                    return window.localStorage.setItem(t, r), !0
                } catch (i) {
                    return e.$warn(1047, t, r), !1
                }
            }

            function a(e) {
                window.localStorage.removeItem(e)
            }

            function o() {
                window.localStorage.clear()
            }
            t.getItem = i, t.setItem = n, t.removeItem = a, t.clear = o
        }(r = t.web || (t.web = {}))
    }(t = e.localStorage || (e.localStorage = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (r) {
            function i(e, t) {
                var i = r.call(this) || this;
                return i.init(e, t), i.initOrientation(), i
            }
            return __extends(i, r), i.prototype.init = function (r, i) {
                var n = this.readOption(r, i),
                    a = new e.Stage;
                a.$screen = this, a.$scaleMode = n.scaleMode, a.$orientation = n.orientation, a.$maxTouches = n.maxTouches, a.frameRate = n.frameRate, a.textureScaleFactor = n.textureScaleFactor;
                var o = new e.sys.RenderBuffer(void 0, void 0, !0),
                    s = o.surface;
                this.attachCanvas(r, s);
                var c = new t.WebTouchHandler(a, s),
                    l = new e.sys.Player(o, a, n.entryClassName);
                e.lifecycle.stage = a, e.lifecycle.addLifecycleListener(t.WebLifeCycleHandler);
                var h = new t.HTMLInput;
                (n.showFPS || n.showLog) && (e.nativeRender || l.displayFPS(n.showFPS, n.showLog, n.logFilter, n.fpsStyles)), this.playerOption = n, this.container = r, this.canvas = s, this.stage = a, this.player = l, this.webTouchHandler = c, this.webInput = h, e.web.$cacheTextAdapter(h, a, r, s), this.updateScreenSize(), this.updateMaxTouches(), l.start()
            }, i.prototype.initOrientation = function () {
                var t = this;
                window.addEventListener("orientationchange", function () {
                    window.setTimeout(function () {
                        e.StageOrientationEvent.dispatchStageOrientationEvent(t.stage, e.StageOrientationEvent.ORIENTATION_CHANGE)
                    }, 350)
                })
            }, i.prototype.readOption = function (t, r) {
                var i = {};
                i.entryClassName = t.getAttribute("data-entry-class"), i.scaleMode = t.getAttribute("data-scale-mode") || e.StageScaleMode.NO_SCALE, i.frameRate = +t.getAttribute("data-frame-rate") || 30, i.contentWidth = +t.getAttribute("data-content-width") || 480, i.contentHeight = +t.getAttribute("data-content-height") || 800, i.orientation = t.getAttribute("data-orientation") || e.OrientationMode.AUTO, i.maxTouches = +t.getAttribute("data-multi-fingered") || 2, i.textureScaleFactor = +t.getAttribute("texture-scale-factor") || 1, i.showFPS = "true" == t.getAttribute("data-show-fps");
                for (var n = t.getAttribute("data-show-fps-style") || "", a = n.split(","), o = {}, s = 0; s < a.length; s++) {
                    var c = a[s].split(":");
                    o[c[0]] = c[1]
                }
                return i.fpsStyles = o, i.showLog = "true" == t.getAttribute("data-show-log"), i.logFilter = t.getAttribute("data-log-filter"), i
            }, i.prototype.attachCanvas = function (e, t) {
                var r = t.style;
                r.cursor = "inherit", r.position = "absolute", r.top = "0", r.bottom = "0", r.left = "0", r.right = "0", e.appendChild(t), r = e.style, r.overflow = "hidden", r.position = "absolute"
            }, i.prototype.updateScreenSize = function () {
                var t = this.canvas;
                if (!t.userTyping) {
                    var r = this.playerOption,
                        i = this.container.getBoundingClientRect(),
                        n = 0,
                        a = i.width,
                        o = i.height;
                    if (0 != a && 0 != o) {
                        i.top < 0 && (o += i.top, n = -i.top);
                        var s = !1,
                            c = this.stage.$orientation;
                        c != e.OrientationMode.AUTO && (s = c != e.OrientationMode.PORTRAIT && o > a || c == e.OrientationMode.PORTRAIT && a > o);
                        var l = s ? o : a,
                            h = s ? a : o;
                        e.Capabilities.boundingClientWidth = l, e.Capabilities.boundingClientHeight = h;
                        var u = e.sys.screenAdapter.calculateStageSize(this.stage.$scaleMode, l, h, r.contentWidth, r.contentHeight),
                            d = u.stageWidth,
                            f = u.stageHeight,
                            p = u.displayWidth,
                            v = u.displayHeight;
                        t.style[e.web.getPrefixStyleName("transformOrigin")] = "0% 0% 0px", t.width != d && (t.width = d), t.height != f && (t.height = f);
                        var g = 0;
                        s ? c == e.OrientationMode.LANDSCAPE ? (g = 90, t.style.top = n + (o - p) / 2 + "px", t.style.left = (a + v) / 2 + "px") : (g = -90, t.style.top = n + (o + p) / 2 + "px", t.style.left = (a - v) / 2 + "px") : (t.style.top = n + (o - v) / 2 + "px", t.style.left = (a - p) / 2 + "px");
                        var y = p / d,
                            x = v / f,
                            m = y * e.sys.DisplayList.$canvasScaleFactor,
                            b = x * e.sys.DisplayList.$canvasScaleFactor;
                        "canvas" == e.Capabilities.renderMode && (m = Math.ceil(m), b = Math.ceil(b));
                        var w = new e.Matrix;
                        w.scale(y / m, x / b), w.rotate(g * Math.PI / 180);
                        var E = "matrix(" + w.a + "," + w.b + "," + w.c + "," + w.d + "," + w.tx + "," + w.ty + ")";
                        t.style[e.web.getPrefixStyleName("transform")] = E, e.sys.DisplayList.$setCanvasScale(m, b), this.webTouchHandler.updateScaleMode(y, x, g), this.webInput.$updateSize(), this.player.updateStageSize(d, f), e.nativeRender && (t.width = d * m, t.height = f * b)
                    }
                }
            }, i.prototype.setContentSize = function (e, t) {
                var r = this.playerOption;
                r.contentWidth = e, r.contentHeight = t, this.updateScreenSize()
            }, i.prototype.updateMaxTouches = function () {
                this.webTouchHandler.$updateMaxTouches()
            }, i
        }(e.HashObject);
        t.WebPlayer = r, __reflect(r.prototype, "egret.web.WebPlayer", ["egret.sys.Screen"])
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        function r(t, r) {
            s || (s = document.createElement("canvas"), c = s.getContext("2d"));
            var i = t.$getTextureWidth(),
                n = t.$getTextureHeight();
            null == r && (r = e.$TempRectangle, r.x = 0, r.y = 0, r.width = i, r.height = n), r.x = Math.min(r.x, i - 1), r.y = Math.min(r.y, n - 1), r.width = Math.min(r.width, i - r.x), r.height = Math.min(r.height, n - r.y);
            var a = r.width,
                o = r.height,
                l = s;
            if (l.style.width = a + "px", l.style.height = o + "px", s.width = a, s.height = o, "webgl" == e.Capabilities.renderMode) {
                var h = void 0;
                t.$renderBuffer ? h = t : (h = new e.RenderTexture, h.drawToTexture(new e.Bitmap(t)));
                for (var u = h.$renderBuffer.getPixels(r.x, r.y, a, o), d = new ImageData(a, o), f = 0; f < u.length; f++) d.data[f] = u[f];
                return c.putImageData(d, 0, 0), t.$renderBuffer || h.dispose(), l
            }
            var p = t,
                v = Math.round(p.$offsetX),
                g = Math.round(p.$offsetY),
                y = p.$bitmapWidth,
                x = p.$bitmapHeight;
            return c.drawImage(p.$bitmapData.source, p.$bitmapX + r.x / e.$TextureScaleFactor, p.$bitmapY + r.y / e.$TextureScaleFactor, y * r.width / i, x * r.height / n, v, g, r.width, r.height), l
        }

        function i(t, i, n) {
            try {
                var a = r(this, i),
                    o = a.toDataURL(t, n);
                return o
            } catch (s) {
                e.$error(1033)
            }
            return null
        }

        function n(e, t, r, n) {
            var a = i.call(this, e, r, n);
            if (null != a) {
                var o = a.replace(/^data:image[^;]*/, "data:image/octet-stream"),
                    s = document.createElement("a");
                s.download = t, s.href = o;
                var c = document.createEvent("MouseEvents");
                c.initMouseEvent("click", !0, !1, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), s.dispatchEvent(c)
            }
        }

        function a(t, r) {
            return e.$warn(1041, "getPixel32", "getPixels"), this.getPixels(t, r)
        }

        function o(t, i, n, a) {
            if (void 0 === n && (n = 1), void 0 === a && (a = 1), "webgl" == e.Capabilities.renderMode) {
                var o = void 0;
                this.$renderBuffer ? o = this : (o = new e.RenderTexture, o.drawToTexture(new e.Bitmap(this)));
                var s = o.$renderBuffer.getPixels(t, i, n, a);
                return s
            }
            try {
                var l = (r(this), c.getImageData(t, i, n, a).data);
                return l
            } catch (h) {
                e.$error(1039)
            }
        }
        var s, c;
        e.Texture.prototype.toDataURL = i, e.Texture.prototype.saveToFile = n, e.Texture.prototype.getPixel32 = a, e.Texture.prototype.getPixels = o
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        function r(e) {
            for (var t = s.parseFromString(e, "text/xml"), r = t.childNodes.length, n = 0; r > n; n++) {
                var a = t.childNodes[n];
                if (1 == a.nodeType) return i(a, null)
            }
            return null
        }

        function i(e, t) {
            if ("parsererror" == e.localName) throw new Error(e.textContent);
            for (var r = new a(e.localName, t, e.prefix, e.namespaceURI, e.nodeName), n = e.attributes, s = r.attributes, c = n.length, l = 0; c > l; l++) {
                var h = n[l],
                    u = h.name;
                0 != u.indexOf("xmlns:") && (s[u] = h.value, r["$" + u] = h.value)
            }
            var d = e.childNodes;
            c = d.length;
            for (var f = r.children, l = 0; c > l; l++) {
                var p = d[l],
                    v = p.nodeType,
                    g = null;
                if (1 == v) g = i(p, r);
                else if (3 == v) {
                    var y = p.textContent.trim();
                    y && (g = new o(y, r))
                }
                g && f.push(g)
            }
            return r
        }
        var n = function () {
            function e(e, t) {
                this.nodeType = e, this.parent = t
            }
            return e
        }();
        t.XMLNode = n, __reflect(n.prototype, "egret.web.XMLNode");
        var a = function (e) {
            function t(t, r, i, n, a) {
                var o = e.call(this, 1, r) || this;
                return o.attributes = {}, o.children = [], o.localName = t, o.prefix = i, o.namespace = n, o.name = a, o
            }
            return __extends(t, e), t
        }(n);
        t.XML = a, __reflect(a.prototype, "egret.web.XML");
        var o = function (e) {
            function t(t, r) {
                var i = e.call(this, 3, r) || this;
                return i.text = t, i
            }
            return __extends(t, e), t
        }(n);
        t.XMLText = o, __reflect(o.prototype, "egret.web.XMLText");
        var s = new DOMParser;
        e.XML = {
            parse: r
        }
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (t) {
            function r() {
                var r = null !== t && t.apply(this, arguments) || this;
                return r.onChange = function (t) {
                    var i = new e.OrientationEvent(e.Event.CHANGE);
                    i.beta = t.beta, i.gamma = t.gamma, i.alpha = t.alpha, r.dispatchEvent(i)
                }, r
            }
            return __extends(r, t), r.prototype.start = function () {
                window.addEventListener("deviceorientation", this.onChange)
            }, r.prototype.stop = function () {
                window.removeEventListener("deviceorientation", this.onChange)
            }, r
        }(e.EventDispatcher);
        t.WebDeviceOrientation = r, __reflect(r.prototype, "egret.web.WebDeviceOrientation", ["egret.DeviceOrientation"])
    }(t = e.web || (e.web = {}))
}(egret || (egret = {})), egret.DeviceOrientation = egret.web.WebDeviceOrientation;
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (t) {
            function r(r) {
                var i = t.call(this) || this;
                return i.onUpdate = function (t) {
                    var r = new e.GeolocationEvent(e.Event.CHANGE),
                        n = t.coords;
                    r.altitude = n.altitude, r.heading = n.heading, r.accuracy = n.accuracy, r.latitude = n.latitude, r.longitude = n.longitude, r.speed = n.speed, r.altitudeAccuracy = n.altitudeAccuracy, i.dispatchEvent(r)
                }, i.onError = function (t) {
                    var r = e.GeolocationEvent.UNAVAILABLE;
                    t.code == t.PERMISSION_DENIED && (r = e.GeolocationEvent.PERMISSION_DENIED);
                    var n = new e.GeolocationEvent(e.IOErrorEvent.IO_ERROR);
                    n.errorType = r, n.errorMessage = t.message, i.dispatchEvent(n)
                }, i.geolocation = navigator.geolocation, i
            }
            return __extends(r, t), r.prototype.start = function () {
                var t = this.geolocation;
                t ? this.watchId = t.watchPosition(this.onUpdate, this.onError) : this.onError({
                    code: 2,
                    message: e.sys.tr(3004),
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2
                })
            }, r.prototype.stop = function () {
                var e = this.geolocation;
                e.clearWatch(this.watchId)
            }, r
        }(e.EventDispatcher);
        t.WebGeolocation = r, __reflect(r.prototype, "egret.web.WebGeolocation", ["egret.Geolocation"]), e.Geolocation = e.web.WebGeolocation
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (t) {
            function r() {
                var r = null !== t && t.apply(this, arguments) || this;
                return r.onChange = function (t) {
                    var i = new e.MotionEvent(e.Event.CHANGE),
                        n = {
                            x: t.acceleration.x,
                            y: t.acceleration.y,
                            z: t.acceleration.z
                        },
                        a = {
                            x: t.accelerationIncludingGravity.x,
                            y: t.accelerationIncludingGravity.y,
                            z: t.accelerationIncludingGravity.z
                        },
                        o = {
                            alpha: t.rotationRate.alpha,
                            beta: t.rotationRate.beta,
                            gamma: t.rotationRate.gamma
                        };
                    i.acceleration = n, i.accelerationIncludingGravity = a, i.rotationRate = o, r.dispatchEvent(i)
                }, r
            }
            return __extends(r, t), r.prototype.start = function () {
                window.addEventListener("devicemotion", this.onChange)
            }, r.prototype.stop = function () {
                window.removeEventListener("devicemotion", this.onChange)
            }, r
        }(e.EventDispatcher);
        t.WebMotion = r, __reflect(r.prototype, "egret.web.WebMotion", ["egret.Motion"]), e.Motion = e.web.WebMotion
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) { }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) {
        var t = function () {
            function e() {
                this.drawData = [], this.drawDataLen = 0
            }
            return e.prototype.pushDrawRect = function () {
                if (0 == this.drawDataLen || 1 != this.drawData[this.drawDataLen - 1].type) {
                    var e = this.drawData[this.drawDataLen] || {};
                    e.type = 1, e.count = 0, this.drawData[this.drawDataLen] = e, this.drawDataLen++
                }
                this.drawData[this.drawDataLen - 1].count += 2
            }, e.prototype.pushDrawTexture = function (e, t, r, i, n) {
                if (void 0 === t && (t = 2), r) {
                    var a = this.drawData[this.drawDataLen] || {};
                    a.type = 0, a.texture = e, a.filter = r, a.count = t, a.textureWidth = i, a.textureHeight = n, this.drawData[this.drawDataLen] = a, this.drawDataLen++
                } else {
                    if (0 == this.drawDataLen || 0 != this.drawData[this.drawDataLen - 1].type || e != this.drawData[this.drawDataLen - 1].texture || this.drawData[this.drawDataLen - 1].filter) {
                        var a = this.drawData[this.drawDataLen] || {};
                        a.type = 0, a.texture = e, a.count = 0, this.drawData[this.drawDataLen] = a, this.drawDataLen++
                    }
                    this.drawData[this.drawDataLen - 1].count += t
                }
            }, e.prototype.pushChangeSmoothing = function (e, t) {
                e.smoothing = t;
                var r = this.drawData[this.drawDataLen] || {};
                r.type = 10, r.texture = e, r.smoothing = t, this.drawData[this.drawDataLen] = r, this.drawDataLen++
            }, e.prototype.pushPushMask = function (e) {
                void 0 === e && (e = 1);
                var t = this.drawData[this.drawDataLen] || {};
                t.type = 2, t.count = 2 * e, this.drawData[this.drawDataLen] = t, this.drawDataLen++
            }, e.prototype.pushPopMask = function (e) {
                void 0 === e && (e = 1);
                var t = this.drawData[this.drawDataLen] || {};
                t.type = 3, t.count = 2 * e, this.drawData[this.drawDataLen] = t, this.drawDataLen++
            }, e.prototype.pushSetBlend = function (e) {
                for (var t = this.drawDataLen, r = !1, i = t - 1; i >= 0; i--) {
                    var n = this.drawData[i];
                    if (n) {
                        if ((0 == n.type || 1 == n.type) && (r = !0), !r && 4 == n.type) {
                            this.drawData.splice(i, 1), this.drawDataLen--;
                            continue
                        }
                        if (4 == n.type) {
                            if (n.value == e) return;
                            break
                        }
                    }
                }
                var a = this.drawData[this.drawDataLen] || {};
                a.type = 4, a.value = e, this.drawData[this.drawDataLen] = a, this.drawDataLen++
            }, e.prototype.pushResize = function (e, t, r) {
                var i = this.drawData[this.drawDataLen] || {};
                i.type = 5, i.buffer = e, i.width = t, i.height = r, this.drawData[this.drawDataLen] = i, this.drawDataLen++
            }, e.prototype.pushClearColor = function () {
                var e = this.drawData[this.drawDataLen] || {};
                e.type = 6, this.drawData[this.drawDataLen] = e, this.drawDataLen++
            }, e.prototype.pushActivateBuffer = function (e) {
                for (var t = this.drawDataLen, r = !1, i = t - 1; i >= 0; i--) {
                    var n = this.drawData[i];
                    !n || (4 != n.type && 7 != n.type && (r = !0), r || 7 != n.type) || (this.drawData.splice(i, 1), this.drawDataLen--)
                }
                var a = this.drawData[this.drawDataLen] || {};
                a.type = 7, a.buffer = e, a.width = e.rootRenderTarget.width, a.height = e.rootRenderTarget.height, this.drawData[this.drawDataLen] = a, this.drawDataLen++
            }, e.prototype.pushEnableScissor = function (e, t, r, i) {
                var n = this.drawData[this.drawDataLen] || {};
                n.type = 8, n.x = e, n.y = t, n.width = r, n.height = i, this.drawData[this.drawDataLen] = n, this.drawDataLen++
            }, e.prototype.pushDisableScissor = function () {
                var e = this.drawData[this.drawDataLen] || {};
                e.type = 9, this.drawData[this.drawDataLen] = e, this.drawDataLen++
            }, e.prototype.clear = function () {
                for (var e = 0; e < this.drawDataLen; e++) {
                    var t = this.drawData[e];
                    t.type = 0, t.count = 0, t.texture = null, t.filter = null, t.uv = null, t.value = "", t.buffer = null, t.width = 0, t.height = 0
                }
                this.drawDataLen = 0
            }, e
        }();
        e.WebGLDrawCmdManager = t, __reflect(t.prototype, "egret.web.WebGLDrawCmdManager")
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) {
        var t = function () {
            function e() {
                this.size = 2e3, this.vertexMaxSize = 4 * this.size, this.indicesMaxSize = 6 * this.size, this.vertSize = 5, this.vertices = null, this.indices = null, this.indicesForMesh = null, this.vertexIndex = 0, this.indexIndex = 0, this.hasMesh = !1;
                var e = this.vertexMaxSize * this.vertSize,
                    t = this.indicesMaxSize;
                this.vertices = new Float32Array(e), this.indices = new Uint16Array(t), this.indicesForMesh = new Uint16Array(t);
                for (var r = 0, i = 0; t > r; r += 6, i += 4) this.indices[r + 0] = i + 0, this.indices[r + 1] = i + 1, this.indices[r + 2] = i + 2, this.indices[r + 3] = i + 0, this.indices[r + 4] = i + 2, this.indices[r + 5] = i + 3
            }
            return e.prototype.reachMaxSize = function (e, t) {
                return void 0 === e && (e = 4), void 0 === t && (t = 6), this.vertexIndex > this.vertexMaxSize - e || this.indexIndex > this.indicesMaxSize - t
            }, e.prototype.getVertices = function () {
                var e = this.vertices.subarray(0, this.vertexIndex * this.vertSize);
                return e
            }, e.prototype.getIndices = function () {
                return this.indices
            }, e.prototype.getMeshIndices = function () {
                return this.indicesForMesh
            }, e.prototype.changeToMeshIndices = function () {
                if (!this.hasMesh) {
                    for (var e = 0, t = this.indexIndex; t > e; ++e) this.indicesForMesh[e] = this.indices[e];
                    this.hasMesh = !0
                }
            }, e.prototype.isMesh = function () {
                return this.hasMesh
            }, e.prototype.cacheArrays = function (e, t, r, i, n, a, o, s, c, l, h, u, d, f, p) {
                var v = e.globalAlpha,
                    g = e.globalMatrix,
                    y = g.a,
                    x = g.b,
                    m = g.c,
                    b = g.d,
                    w = g.tx,
                    E = g.ty,
                    T = e.$offsetX,
                    _ = e.$offsetY;
                if ((0 != T || 0 != _) && (w = T * y + _ * m + w, E = T * x + _ * b + E), !d) {
                    (0 != a || 0 != o) && (w = a * y + o * m + w, E = a * x + o * b + E);
                    var S = s / i;
                    1 != S && (y = S * y, x = S * x);
                    var L = c / n;
                    1 != L && (m = L * m, b = L * b)
                }
                if (d) {
                    var C = this.vertices,
                        R = this.vertexIndex * this.vertSize,
                        A = 0,
                        D = 0,
                        O = 0,
                        I = 0,
                        M = 0,
                        $ = 0,
                        B = 0;
                    for (A = 0, O = u.length; O > A; A += 2) D = R + 5 * A / 2, $ = d[A], B = d[A + 1], I = u[A], M = u[A + 1], C[D + 0] = y * $ + m * B + w, C[D + 1] = x * $ + b * B + E, p ? (C[D + 2] = (t + (1 - M) * n) / l, C[D + 3] = (r + I * i) / h) : (C[D + 2] = (t + I * i) / l, C[D + 3] = (r + M * n) / h), C[D + 4] = v;
                    if (this.hasMesh)
                        for (var F = 0, P = f.length; P > F; ++F) this.indicesForMesh[this.indexIndex + F] = f[F] + this.vertexIndex;
                    this.vertexIndex += u.length / 2, this.indexIndex += f.length
                } else {
                    var G = l,
                        W = h,
                        N = i,
                        H = n;
                    t /= G, r /= W;
                    var C = this.vertices,
                        R = this.vertexIndex * this.vertSize;
                    if (p) {
                        var U = i;
                        i = n / G, n = U / W, C[R++] = w, C[R++] = E, C[R++] = i + t, C[R++] = r, C[R++] = v, C[R++] = y * N + w, C[R++] = x * N + E, C[R++] = i + t, C[R++] = n + r, C[R++] = v, C[R++] = y * N + m * H + w, C[R++] = b * H + x * N + E, C[R++] = t, C[R++] = n + r, C[R++] = v, C[R++] = m * H + w, C[R++] = b * H + E, C[R++] = t, C[R++] = r, C[R++] = v
                    } else i /= G, n /= W, C[R++] = w, C[R++] = E, C[R++] = t, C[R++] = r, C[R++] = v, C[R++] = y * N + w, C[R++] = x * N + E, C[R++] = i + t, C[R++] = r, C[R++] = v, C[R++] = y * N + m * H + w, C[R++] = b * H + x * N + E, C[R++] = i + t, C[R++] = n + r, C[R++] = v, C[R++] = m * H + w, C[R++] = b * H + E, C[R++] = t, C[R++] = n + r, C[R++] = v;
                    if (this.hasMesh) {
                        var k = this.indicesForMesh;
                        k[this.indexIndex + 0] = 0 + this.vertexIndex, k[this.indexIndex + 1] = 1 + this.vertexIndex, k[this.indexIndex + 2] = 2 + this.vertexIndex, k[this.indexIndex + 3] = 0 + this.vertexIndex, k[this.indexIndex + 4] = 2 + this.vertexIndex, k[this.indexIndex + 5] = 3 + this.vertexIndex
                    }
                    this.vertexIndex += 4, this.indexIndex += 6
                }
            }, e.prototype.clear = function () {
                this.hasMesh = !1, this.vertexIndex = 0, this.indexIndex = 0
            }, e
        }();
        e.WebGLVertexArrayObject = t, __reflect(t.prototype, "egret.web.WebGLVertexArrayObject")
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (t) {
            function r(e, r, i) {
                var n = t.call(this) || this;
                return n.clearColor = [0, 0, 0, 0], n.useFrameBuffer = !0, n.gl = e, n.width = r || 1, n.height = i || 1, n
            }
            return __extends(r, t), r.prototype.resize = function (e, t) {
                var r = this.gl;
                this.width = e, this.height = t, this.frameBuffer && (r.bindTexture(r.TEXTURE_2D, this.texture), r.texImage2D(r.TEXTURE_2D, 0, r.RGBA, e, t, 0, r.RGBA, r.UNSIGNED_BYTE, null)), this.stencilBuffer && (r.deleteRenderbuffer(this.stencilBuffer), this.stencilBuffer = null)
            }, r.prototype.activate = function () {
                var e = this.gl;
                e.bindFramebuffer(e.FRAMEBUFFER, this.getFrameBuffer())
            }, r.prototype.getFrameBuffer = function () {
                return this.useFrameBuffer ? this.frameBuffer : null
            }, r.prototype.initFrameBuffer = function () {
                if (!this.frameBuffer) {
                    var e = this.gl;
                    this.texture = this.createTexture(), this.frameBuffer = e.createFramebuffer(), e.bindFramebuffer(e.FRAMEBUFFER, this.frameBuffer), e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, this.texture, 0)
                }
            }, r.prototype.createTexture = function () {
                var e = this.gl,
                    t = e.createTexture();
                return t.glContext = e, e.bindTexture(e.TEXTURE_2D, t), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, this.width, this.height, 0, e.RGBA, e.UNSIGNED_BYTE, null), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), t
            }, r.prototype.clear = function (e) {
                var t = this.gl;
                e && this.activate(), t.colorMask(!0, !0, !0, !0), t.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]), t.clear(t.COLOR_BUFFER_BIT)
            }, r.prototype.enabledStencil = function () {
                if (this.frameBuffer && !this.stencilBuffer) {
                    var e = this.gl;
                    e.bindFramebuffer(e.FRAMEBUFFER, this.frameBuffer), this.stencilBuffer = e.createRenderbuffer(), e.bindRenderbuffer(e.RENDERBUFFER, this.stencilBuffer), e.renderbufferStorage(e.RENDERBUFFER, e.DEPTH_STENCIL, this.width, this.height), e.framebufferRenderbuffer(e.FRAMEBUFFER, e.DEPTH_STENCIL_ATTACHMENT, e.RENDERBUFFER, this.stencilBuffer)
                }
            }, r.prototype.dispose = function () {
                e.WebGLUtils.deleteWebGLTexture(this.texture)
            }, r
        }(e.HashObject);
        t.WebGLRenderTarget = r, __reflect(r.prototype, "egret.web.WebGLRenderTarget")
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        function r(e, t) {
            var r = document.createElement("canvas");
            return isNaN(e) || isNaN(t) || (r.width = e, r.height = t), r
        }
        var i = function () {
            function i(i, n) {
                if (this.glID = null, this.projectionX = 0 / 0, this.projectionY = 0 / 0, this.contextLost = !1, this.$scissorState = !1, this.vertSize = 5, this.surface = r(i, n), !e.nativeRender) {
                    this.initWebGL(), this.$bufferStack = [];
                    var a = this.context;
                    this.vertexBuffer = a.createBuffer(), this.indexBuffer = a.createBuffer(), a.bindBuffer(a.ARRAY_BUFFER, this.vertexBuffer), a.bindBuffer(a.ELEMENT_ARRAY_BUFFER, this.indexBuffer), this.drawCmdManager = new t.WebGLDrawCmdManager, this.vao = new t.WebGLVertexArrayObject, this.setGlobalCompositeOperation("source-over")
                }
            }
            return i.getInstance = function (e, t) {
                return this.instance ? this.instance : (this.instance = new i(e, t), this.instance)
            }, i.prototype.pushBuffer = function (e) {
                this.$bufferStack.push(e), e != this.currentBuffer && (this.currentBuffer, this.drawCmdManager.pushActivateBuffer(e)), this.currentBuffer = e
            }, i.prototype.popBuffer = function () {
                if (!(this.$bufferStack.length <= 1)) {
                    var e = this.$bufferStack.pop(),
                        t = this.$bufferStack[this.$bufferStack.length - 1];
                    e != t && this.drawCmdManager.pushActivateBuffer(t), this.currentBuffer = t
                }
            }, i.prototype.activateBuffer = function (e) {
                e.rootRenderTarget.activate(), this.bindIndices || this.uploadIndicesArray(this.vao.getIndices()), e.restoreStencil(), e.restoreScissor(), this.onResize(e.width, e.height)
            }, i.prototype.uploadVerticesArray = function (e) {
                var t = this.context;
                t.bufferData(t.ARRAY_BUFFER, e, t.STREAM_DRAW)
            }, i.prototype.uploadIndicesArray = function (e) {
                var t = this.context;
                t.bufferData(t.ELEMENT_ARRAY_BUFFER, e, t.STATIC_DRAW), this.bindIndices = !0
            }, i.prototype.destroy = function () {
                this.surface.width = this.surface.height = 0
            }, i.prototype.onResize = function (e, t) {
                e = e || this.surface.width, t = t || this.surface.height, this.projectionX = e / 2, this.projectionY = -t / 2, this.context && this.context.viewport(0, 0, e, t)
            }, i.prototype.resize = function (e, t, r) {
                var i = this.surface;
                r ? (i.width < e && (i.width = e), i.height < t && (i.height = t)) : (i.width != e && (i.width = e), i.height != t && (i.height = t)), this.onResize()
            }, i.prototype.initWebGL = function () {
                this.onResize(), this.surface.addEventListener("webglcontextlost", this.handleContextLost.bind(this), !1), this.surface.addEventListener("webglcontextrestored", this.handleContextRestored.bind(this), !1), this.getWebGLContext();
                var e = this.context;
                this.$maxTextureSize = e.getParameter(e.MAX_TEXTURE_SIZE)
            }, i.prototype.handleContextLost = function () {
                this.contextLost = !0
            }, i.prototype.handleContextRestored = function () {
                this.initWebGL(), this.contextLost = !1
            }, i.prototype.getWebGLContext = function () {
                for (var t, r = {
                    antialias: i.antialias,
                    stencil: !0
                }, n = ["webgl", "experimental-webgl"], a = 0; a < n.length; a++) {
                    try {
                        t = this.surface.getContext(n[a], r)
                    } catch (o) { }
                    if (t) break
                }
                t || e.$error(1021), this.setContext(t)
            }, i.prototype.setContext = function (e) {
                this.context = e, e.id = i.glContextId++, this.glID = e.id, e.disable(e.DEPTH_TEST), e.disable(e.CULL_FACE), e.enable(e.BLEND), e.colorMask(!0, !0, !0, !0), e.activeTexture(e.TEXTURE0)
            }, i.prototype.enableStencilTest = function () {
                var e = this.context;
                e.enable(e.STENCIL_TEST)
            }, i.prototype.disableStencilTest = function () {
                var e = this.context;
                e.disable(e.STENCIL_TEST)
            }, i.prototype.enableScissorTest = function (e) {
                var t = this.context;
                t.enable(t.SCISSOR_TEST), t.scissor(e.x, e.y, e.width, e.height)
            }, i.prototype.disableScissorTest = function () {
                var e = this.context;
                e.disable(e.SCISSOR_TEST)
            }, i.prototype.getPixels = function (e, t, r, i, n) {
                var a = this.context;
                a.readPixels(e, t, r, i, a.RGBA, a.UNSIGNED_BYTE, n)
            }, i.prototype.createTexture = function (e) {
                var t = this.context,
                    r = t.createTexture();
                return r ? (r.glContext = t, t.bindTexture(t.TEXTURE_2D, r), t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, t.RGBA, t.UNSIGNED_BYTE, e), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE), r) : void (this.contextLost = !0)
            }, i.prototype.createTextureFromCompressedData = function (e, t, r, i, n) {
                return null
            }, i.prototype.updateTexture = function (e, t) {
                var r = this.context;
                r.bindTexture(r.TEXTURE_2D, e), r.texImage2D(r.TEXTURE_2D, 0, r.RGBA, r.RGBA, r.UNSIGNED_BYTE, t)
            }, i.prototype.getWebGLTexture = function (e) {
                return e.webGLTexture || ("image" == e.format ? e.webGLTexture = this.createTexture(e.source) : "pvr" == e.format && (e.webGLTexture = this.createTextureFromCompressedData(e.source.pvrtcData, e.width, e.height, e.source.mipmapsCount, e.source.format)), e.$deleteSource && e.webGLTexture && (e.source = null), e.webGLTexture.smoothing = !0), e.webGLTexture
            }, i.prototype.clearRect = function (e, t, r, i) {
                if (0 != e || 0 != t || r != this.surface.width || i != this.surface.height) {
                    var n = this.currentBuffer;
                    if (n.$hasScissor) this.setGlobalCompositeOperation("destination-out"), this.drawRect(e, t, r, i), this.setGlobalCompositeOperation("source-over");
                    else {
                        var a = n.globalMatrix;
                        0 == a.b && 0 == a.c ? (e = e * a.a + a.tx, t = t * a.d + a.ty, r *= a.a, i *= a.d, this.enableScissor(e, -t - i + n.height, r, i), this.clear(), this.disableScissor()) : (this.setGlobalCompositeOperation("destination-out"), this.drawRect(e, t, r, i), this.setGlobalCompositeOperation("source-over"))
                    }
                } else this.clear()
            }, i.prototype.setGlobalCompositeOperation = function (e) {
                this.drawCmdManager.pushSetBlend(e)
            }, i.prototype.drawImage = function (e, t, r, i, n, a, o, s, c, l, h, u, d) {
                var f = this.currentBuffer;
                if (!this.contextLost && e && f) {
                    var p, v, g;
                    if (e.texture || e.source && e.source.texture) p = e.texture || e.source.texture, f.saveTransform(), v = f.$offsetX, g = f.$offsetY, f.useOffset(), f.transform(1, 0, 0, -1, 0, c + 2 * o);
                    else {
                        if (!e.source && !e.webGLTexture) return;
                        p = this.getWebGLTexture(e)
                    }
                    p && (this.drawTexture(p, t, r, i, n, a, o, s, c, l, h, void 0, void 0, void 0, void 0, u, d), e.source && e.source.texture && (f.$offsetX = v, f.$offsetY = g, f.restoreTransform()))
                }
            }, i.prototype.drawMesh = function (e, t, r, i, n, a, o, s, c, l, h, u, d, f, p, v, g) {
                var y = this.currentBuffer;
                if (!this.contextLost && e && y) {
                    var x, m, b;
                    if (e.texture || e.source && e.source.texture) x = e.texture || e.source.texture, y.saveTransform(), m = y.$offsetX, b = y.$offsetY, y.useOffset(), y.transform(1, 0, 0, -1, 0, c + 2 * o);
                    else {
                        if (!e.source && !e.webGLTexture) return;
                        x = this.getWebGLTexture(e)
                    }
                    x && (this.drawTexture(x, t, r, i, n, a, o, s, c, l, h, u, d, f, p, v, g), (e.texture || e.source && e.source.texture) && (y.$offsetX = m, y.$offsetY = b, y.restoreTransform()))
                }
            }, i.prototype.drawTexture = function (e, t, r, i, n, a, o, s, c, l, h, u, d, f, p, v, g) {
                var y = this.currentBuffer;
                if (!this.contextLost && e && y) {
                    d && f ? this.vao.reachMaxSize(d.length / 2, f.length) && this.$drawWebGL() : this.vao.reachMaxSize() && this.$drawWebGL(), void 0 != g && e.smoothing != g && this.drawCmdManager.pushChangeSmoothing(e, g), u && this.vao.changeToMeshIndices();
                    var x = f ? f.length / 3 : 2;
                    this.drawCmdManager.pushDrawTexture(e, x, this.$filter, l, h), this.vao.cacheArrays(y, t, r, i, n, a, o, s, c, l, h, u, d, f, v)
                }
            }, i.prototype.drawRect = function (e, t, r, i) {
                var n = this.currentBuffer;
                !this.contextLost && n && (this.vao.reachMaxSize() && this.$drawWebGL(), this.drawCmdManager.pushDrawRect(), this.vao.cacheArrays(n, 0, 0, r, i, e, t, r, i, r, i))
            }, i.prototype.pushMask = function (e, t, r, i) {
                var n = this.currentBuffer;
                !this.contextLost && n && (n.$stencilList.push({
                    x: e,
                    y: t,
                    width: r,
                    height: i
                }), this.vao.reachMaxSize() && this.$drawWebGL(), this.drawCmdManager.pushPushMask(), this.vao.cacheArrays(n, 0, 0, r, i, e, t, r, i, r, i))
            }, i.prototype.popMask = function () {
                var e = this.currentBuffer;
                if (!this.contextLost && e) {
                    var t = e.$stencilList.pop();
                    this.vao.reachMaxSize() && this.$drawWebGL(), this.drawCmdManager.pushPopMask(), this.vao.cacheArrays(e, 0, 0, t.width, t.height, t.x, t.y, t.width, t.height, t.width, t.height)
                }
            }, i.prototype.clear = function () {
                this.drawCmdManager.pushClearColor()
            }, i.prototype.enableScissor = function (e, t, r, i) {
                var n = this.currentBuffer;
                this.drawCmdManager.pushEnableScissor(e, t, r, i), n.$hasScissor = !0
            }, i.prototype.disableScissor = function () {
                var e = this.currentBuffer;
                this.drawCmdManager.pushDisableScissor(), e.$hasScissor = !1
            }, i.prototype.$drawWebGL = function () {
                if (0 != this.drawCmdManager.drawDataLen && !this.contextLost) {
                    this.uploadVerticesArray(this.vao.getVertices()), this.vao.isMesh() && this.uploadIndicesArray(this.vao.getMeshIndices());
                    for (var e = this.drawCmdManager.drawDataLen, t = 0, r = 0; e > r; r++) {
                        var i = this.drawCmdManager.drawData[r];
                        t = this.drawData(i, t), 7 == i.type && (this.activatedBuffer = i.buffer), (0 == i.type || 1 == i.type || 2 == i.type || 3 == i.type) && this.activatedBuffer && this.activatedBuffer.$computeDrawCall && this.activatedBuffer.$drawCalls++
                    }
                    this.vao.isMesh() && this.uploadIndicesArray(this.vao.getIndices()), this.drawCmdManager.clear(), this.vao.clear()
                }
            }, i.prototype.drawData = function (e, r) {
                if (e) {
                    var i, n = this.context,
                        a = e.filter;
                    switch (e.type) {
                        case 0:
                            a ? "custom" === a.type ? i = t.EgretWebGLProgram.getProgram(n, a.$vertexSrc, a.$fragmentSrc, a.$shaderKey) : "colorTransform" === a.type ? i = t.EgretWebGLProgram.getProgram(n, t.EgretShaderLib.default_vert, t.EgretShaderLib.colorTransform_frag, "colorTransform") : "blurX" === a.type ? i = t.EgretWebGLProgram.getProgram(n, t.EgretShaderLib.default_vert, t.EgretShaderLib.blur_frag, "blur") : "blurY" === a.type ? i = t.EgretWebGLProgram.getProgram(n, t.EgretShaderLib.default_vert, t.EgretShaderLib.blur_frag, "blur") : "glow" === a.type && (i = t.EgretWebGLProgram.getProgram(n, t.EgretShaderLib.default_vert, t.EgretShaderLib.glow_frag, "glow")) : i = t.EgretWebGLProgram.getProgram(n, t.EgretShaderLib.default_vert, t.EgretShaderLib.texture_frag, "texture"), this.activeProgram(n, i), this.syncUniforms(i, a, e.textureWidth, e.textureHeight), r += this.drawTextureElements(e, r);
                            break;
                        case 1:
                            i = t.EgretWebGLProgram.getProgram(n, t.EgretShaderLib.default_vert, t.EgretShaderLib.primitive_frag, "primitive"), this.activeProgram(n, i), this.syncUniforms(i, a, e.textureWidth, e.textureHeight), r += this.drawRectElements(e, r);
                            break;
                        case 2:
                            i = t.EgretWebGLProgram.getProgram(n, t.EgretShaderLib.default_vert, t.EgretShaderLib.primitive_frag, "primitive"), this.activeProgram(n, i), this.syncUniforms(i, a, e.textureWidth, e.textureHeight), r += this.drawPushMaskElements(e, r);
                            break;
                        case 3:
                            i = t.EgretWebGLProgram.getProgram(n, t.EgretShaderLib.default_vert, t.EgretShaderLib.primitive_frag, "primitive"), this.activeProgram(n, i), this.syncUniforms(i, a, e.textureWidth, e.textureHeight), r += this.drawPopMaskElements(e, r);
                            break;
                        case 4:
                            this.setBlendMode(e.value);
                            break;
                        case 5:
                            e.buffer.rootRenderTarget.resize(e.width, e.height), this.onResize(e.width, e.height);
                            break;
                        case 6:
                            if (this.activatedBuffer) {
                                var o = this.activatedBuffer.rootRenderTarget;
                                (0 != o.width || 0 != o.height) && o.clear(!0)
                            }
                            break;
                        case 7:
                            this.activateBuffer(e.buffer);
                            break;
                        case 8:
                            var s = this.activatedBuffer;
                            s && (s.rootRenderTarget && s.rootRenderTarget.enabledStencil(), s.enableScissor(e.x, e.y, e.width, e.height));
                            break;
                        case 9:
                            s = this.activatedBuffer, s && s.disableScissor();
                            break;
                        case 10:
                            n.bindTexture(n.TEXTURE_2D, e.texture), e.smoothing ? (n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, n.LINEAR)) : (n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.NEAREST), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, n.NEAREST))
                    }
                    return r
                }
            }, i.prototype.activeProgram = function (e, t) {
                if (t != this.currentProgram) {
                    e.useProgram(t.id);
                    var r = t.attributes;
                    for (var i in r) "aVertexPosition" === i ? (e.vertexAttribPointer(r.aVertexPosition.location, 2, e.FLOAT, !1, 20, 0), e.enableVertexAttribArray(r.aVertexPosition.location)) : "aTextureCoord" === i ? (e.vertexAttribPointer(r.aTextureCoord.location, 2, e.FLOAT, !1, 20, 8), e.enableVertexAttribArray(r.aTextureCoord.location)) : "aColor" === i && (e.vertexAttribPointer(r.aColor.location, 1, e.FLOAT, !1, 20, 16), e.enableVertexAttribArray(r.aColor.location));
                    this.currentProgram = t
                }
            }, i.prototype.syncUniforms = function (e, t, r, i) {
                var n = e.uniforms;
                t && "custom" === t.type;
                for (var a in n)
                    if ("projectionVector" === a) n[a].setValue({
                        x: this.projectionX,
                        y: this.projectionY
                    });
                    else if ("uTextureSize" === a) n[a].setValue({
                        x: r,
                        y: i
                    });
                    else if ("uSampler" === a);
                    else {
                        var o = t.$uniforms[a];
                        void 0 !== o && n[a].setValue(o)
                    }
            }, i.prototype.drawTextureElements = function (e, t) {
                var r = this.context;
                r.bindTexture(r.TEXTURE_2D, e.texture);
                var i = 3 * e.count;
                return r.drawElements(r.TRIANGLES, i, r.UNSIGNED_SHORT, 2 * t), i
            }, i.prototype.drawRectElements = function (e, t) {
                var r = this.context,
                    i = 3 * e.count;
                return r.drawElements(r.TRIANGLES, i, r.UNSIGNED_SHORT, 2 * t), i
            }, i.prototype.drawPushMaskElements = function (e, t) {
                var r = this.context,
                    i = 3 * e.count,
                    n = this.activatedBuffer;
                if (n) {
                    n.rootRenderTarget && n.rootRenderTarget.enabledStencil(), 0 == n.stencilHandleCount && (n.enableStencil(), r.clear(r.STENCIL_BUFFER_BIT));
                    var a = n.stencilHandleCount;
                    n.stencilHandleCount++, r.colorMask(!1, !1, !1, !1), r.stencilFunc(r.EQUAL, a, 255), r.stencilOp(r.KEEP, r.KEEP, r.INCR), r.drawElements(r.TRIANGLES, i, r.UNSIGNED_SHORT, 2 * t), r.stencilFunc(r.EQUAL, a + 1, 255), r.colorMask(!0, !0, !0, !0), r.stencilOp(r.KEEP, r.KEEP, r.KEEP)
                }
                return i
            }, i.prototype.drawPopMaskElements = function (e, t) {
                var r = this.context,
                    i = 3 * e.count,
                    n = this.activatedBuffer;
                if (n)
                    if (n.stencilHandleCount--, 0 == n.stencilHandleCount) n.disableStencil();
                    else {
                        var a = n.stencilHandleCount;
                        r.colorMask(!1, !1, !1, !1), r.stencilFunc(r.EQUAL, a + 1, 255), r.stencilOp(r.KEEP, r.KEEP, r.DECR), r.drawElements(r.TRIANGLES, i, r.UNSIGNED_SHORT, 2 * t), r.stencilFunc(r.EQUAL, a, 255), r.colorMask(!0, !0, !0, !0), r.stencilOp(r.KEEP, r.KEEP, r.KEEP)
                    } return i
            }, i.prototype.setBlendMode = function (e) {
                var t = this.context,
                    r = i.blendModesForGL[e];
                r && t.blendFunc(r[0], r[1])
            }, i.prototype.drawTargetWidthFilters = function (e, r) {
                var i, n = r,
                    a = e.length;
                if (a > 1)
                    for (var o = 0; a - 1 > o; o++) {
                        var s = e[o],
                            c = r.rootRenderTarget.width,
                            l = r.rootRenderTarget.height;
                        i = t.WebGLRenderBuffer.create(c, l), i.setTransform(1, 0, 0, 1, 0, 0), i.globalAlpha = 1, this.drawToRenderTarget(s, r, i), r != n && t.WebGLRenderBuffer.release(r), r = i
                    }
                var h = e[a - 1];
                this.drawToRenderTarget(h, r, this.currentBuffer), r != n && t.WebGLRenderBuffer.release(r)
            }, i.prototype.drawToRenderTarget = function (e, r, i) {
                if (!this.contextLost) {
                    this.vao.reachMaxSize() && this.$drawWebGL(), this.pushBuffer(i);
                    var n, a = r,
                        o = r.rootRenderTarget.width,
                        s = r.rootRenderTarget.height;
                    if ("blur" == e.type) {
                        var c = e.blurXFilter,
                            l = e.blurYFilter;
                        0 != c.blurX && 0 != l.blurY ? (n = t.WebGLRenderBuffer.create(o, s), n.setTransform(1, 0, 0, 1, 0, 0), n.globalAlpha = 1, this.drawToRenderTarget(e.blurXFilter, r, n), r != a && t.WebGLRenderBuffer.release(r), r = n, e = l) : e = 0 === c.blurX ? l : c
                    }
                    i.saveTransform(), i.transform(1, 0, 0, -1, 0, s), this.vao.cacheArrays(i, 0, 0, o, s, 0, 0, o, s, o, s), i.restoreTransform(), this.drawCmdManager.pushDrawTexture(r.rootRenderTarget.texture, 2, e, o, s), r != a && t.WebGLRenderBuffer.release(r), this.popBuffer()
                }
            }, i.initBlendMode = function () {
                i.blendModesForGL = {}, i.blendModesForGL["source-over"] = [1, 771], i.blendModesForGL.lighter = [1, 1], i.blendModesForGL["lighter-in"] = [770, 771], i.blendModesForGL["destination-out"] = [0, 771], i.blendModesForGL["destination-in"] = [0, 770]
            }, i.glContextId = 0, i.blendModesForGL = null, i
        }();
        t.WebGLRenderContext = i, __reflect(i.prototype, "egret.web.WebGLRenderContext"), i.initBlendMode()
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = function (r) {
            function n(i, n, a) {
                var o = r.call(this) || this;
                if (o.globalAlpha = 1, o.stencilState = !1, o.$stencilList = [], o.stencilHandleCount = 0, o.$scissorState = !1, o.scissorRect = new e.Rectangle, o.$hasScissor = !1, o.$drawCalls = 0, o.$computeDrawCall = !1, o.globalMatrix = new e.Matrix, o.savedGlobalMatrix = new e.Matrix, o.$offsetX = 0, o.$offsetY = 0, o.context = t.WebGLRenderContext.getInstance(i, n), e.nativeRender) return a ? o.surface = o.context.surface : o.surface = new egret_native.NativeRenderSurface(o, i, n, a), o.rootRenderTarget = null, o;
                if (o.rootRenderTarget = new t.WebGLRenderTarget(o.context.context, 3, 3), i && n && o.resize(i, n), o.root = a, o.root) o.context.pushBuffer(o), o.surface = o.context.surface, o.$computeDrawCall = !0;
                else {
                    var s = o.context.activatedBuffer;
                    s && s.rootRenderTarget.activate(), o.rootRenderTarget.initFrameBuffer(), o.surface = o.rootRenderTarget
                }
                return o
            }
            return __extends(n, r), n.prototype.enableStencil = function () {
                this.stencilState || (this.context.enableStencilTest(), this.stencilState = !0)
            }, n.prototype.disableStencil = function () {
                this.stencilState && (this.context.disableStencilTest(), this.stencilState = !1)
            }, n.prototype.restoreStencil = function () {
                this.stencilState ? this.context.enableStencilTest() : this.context.disableStencilTest()
            }, n.prototype.enableScissor = function (e, t, r, i) {
                this.$scissorState || (this.$scissorState = !0, this.scissorRect.setTo(e, t, r, i), this.context.enableScissorTest(this.scissorRect))
            }, n.prototype.disableScissor = function () {
                this.$scissorState && (this.$scissorState = !1, this.scissorRect.setEmpty(), this.context.disableScissorTest())
            }, n.prototype.restoreScissor = function () {
                this.$scissorState ? this.context.enableScissorTest(this.scissorRect) : this.context.disableScissorTest()
            }, Object.defineProperty(n.prototype, "width", {
                get: function () {
                    return e.nativeRender ? this.surface.width : this.rootRenderTarget.width
                },
                enumerable: !0,
                configurable: !0
            }), Object.defineProperty(n.prototype, "height", {
                get: function () {
                    return e.nativeRender ? this.surface.height : this.rootRenderTarget.height
                },
                enumerable: !0,
                configurable: !0
            }), n.prototype.resize = function (t, r, i) {
                return t = t || 1, r = r || 1, e.nativeRender ? void this.surface.resize(t, r) : (this.context.pushBuffer(this), (t != this.rootRenderTarget.width || r != this.rootRenderTarget.height) && (this.context.drawCmdManager.pushResize(this, t, r), this.rootRenderTarget.width = t, this.rootRenderTarget.height = r), this.root && this.context.resize(t, r, i), this.context.clear(), void this.context.popBuffer())
            }, n.prototype.getPixels = function (t, r, i, n) {
                void 0 === i && (i = 1), void 0 === n && (n = 1);
                var a = new Uint8Array(4 * i * n);
                if (e.nativeRender) egret_native.activateBuffer(this), egret_native.nrGetPixels(t, r, i, n, a), egret_native.activateBuffer(null);
                else {
                    var o = this.rootRenderTarget.useFrameBuffer;
                    this.rootRenderTarget.useFrameBuffer = !0, this.rootRenderTarget.activate(), this.context.getPixels(t, r, i, n, a), this.rootRenderTarget.useFrameBuffer = o, this.rootRenderTarget.activate()
                }
                for (var s = new Uint8Array(4 * i * n), c = 0; n > c; c++)
                    for (var l = 0; i > l; l++) {
                        var h = 4 * (i * (n - c - 1) + l),
                            u = 4 * (i * c + l),
                            d = a[u + 3];
                        s[h] = Math.round(a[u] / d * 255), s[h + 1] = Math.round(a[u + 1] / d * 255), s[h + 2] = Math.round(a[u + 2] / d * 255), s[h + 3] = a[u + 3]
                    }
                return s
            }, n.prototype.toDataURL = function (e, t) {
                return this.context.surface.toDataURL(e, t)
            }, n.prototype.destroy = function () {
                this.context.destroy()
            }, n.prototype.onRenderFinish = function () {
                this.$drawCalls = 0
            }, n.prototype.drawFrameBufferToSurface = function (e, t, r, i, n, a, o, s, c) {
                void 0 === c && (c = !1), this.rootRenderTarget.useFrameBuffer = !1, this.rootRenderTarget.activate(), this.context.disableStencilTest(), this.context.disableScissorTest(), this.setTransform(1, 0, 0, 1, 0, 0), this.globalAlpha = 1, this.context.setGlobalCompositeOperation("source-over"), c && this.context.clear(), this.context.drawImage(this.rootRenderTarget, e, t, r, i, n, a, o, s, r, i, !1), this.context.$drawWebGL(), this.rootRenderTarget.useFrameBuffer = !0, this.rootRenderTarget.activate(), this.restoreStencil(), this.restoreScissor()
            }, n.prototype.drawSurfaceToFrameBuffer = function (e, t, r, i, n, a, o, s, c) {
                void 0 === c && (c = !1), this.rootRenderTarget.useFrameBuffer = !0, this.rootRenderTarget.activate(), this.context.disableStencilTest(), this.context.disableScissorTest(), this.setTransform(1, 0, 0, 1, 0, 0), this.globalAlpha = 1, this.context.setGlobalCompositeOperation("source-over"), c && this.context.clear(), this.context.drawImage(this.context.surface, e, t, r, i, n, a, o, s, r, i, !1), this.context.$drawWebGL(), this.rootRenderTarget.useFrameBuffer = !1, this.rootRenderTarget.activate(), this.restoreStencil(), this.restoreScissor()
            }, n.prototype.clear = function () {
                this.context.pushBuffer(this), this.context.clear(), this.context.popBuffer()
            }, n.prototype.setTransform = function (e, t, r, i, n, a) {
                var o = this.globalMatrix;
                o.a = e, o.b = t, o.c = r, o.d = i, o.tx = n, o.ty = a
            }, n.prototype.transform = function (e, t, r, i, n, a) {
                var o = this.globalMatrix,
                    s = o.a,
                    c = o.b,
                    l = o.c,
                    h = o.d;
                (1 != e || 0 != t || 0 != r || 1 != i) && (o.a = e * s + t * l, o.b = e * c + t * h, o.c = r * s + i * l, o.d = r * c + i * h), o.tx = n * s + a * l + o.tx, o.ty = n * c + a * h + o.ty
            }, n.prototype.useOffset = function () {
                var e = this;
                (0 != e.$offsetX || 0 != e.$offsetY) && (e.globalMatrix.append(1, 0, 0, 1, e.$offsetX, e.$offsetY), e.$offsetX = e.$offsetY = 0)
            }, n.prototype.saveTransform = function () {
                var e = this.globalMatrix,
                    t = this.savedGlobalMatrix;
                t.a = e.a, t.b = e.b, t.c = e.c, t.d = e.d, t.tx = e.tx, t.ty = e.ty
            }, n.prototype.restoreTransform = function () {
                var e = this.globalMatrix,
                    t = this.savedGlobalMatrix;
                e.a = t.a, e.b = t.b, e.c = t.c, e.d = t.d, e.tx = t.tx, e.ty = t.ty
            }, n.create = function (e, t) {
                var r = i.pop();
                if (r) {
                    r.resize(e, t);
                    var a = r.globalMatrix;
                    a.a = 1, a.b = 0, a.c = 0, a.d = 1, a.tx = 0, a.ty = 0, r.globalAlpha = 1, r.$offsetX = 0, r.$offsetY = 0
                } else r = new n(e, t), r.$computeDrawCall = !1;
                return r
            }, n.release = function (e) {
                i.push(e)
            }, n.autoClear = !0, n
        }(e.HashObject);
        t.WebGLRenderBuffer = r, __reflect(r.prototype, "egret.web.WebGLRenderBuffer", ["egret.sys.RenderBuffer"]);
        var i = []
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (t) {
        var r = ["source-over", "lighter", "destination-out"],
            i = "source-over",
            n = [],
            a = function () {
                function a() {
                    this.nestLevel = 0
                }
                return a.prototype.render = function (t, r, i, a) {
                    this.nestLevel++;
                    var o = r,
                        s = o.context;
                    s.pushBuffer(o), o.transform(i.a, i.b, i.c, i.d, 0, 0), this.drawDisplayObject(t, o, i.tx, i.ty, !0), s.$drawWebGL();
                    var c = o.$drawCalls;
                    o.onRenderFinish(), s.popBuffer();
                    var l = e.Matrix.create();
                    if (i.$invertInto(l), o.transform(l.a, l.b, l.c, l.d, 0, 0), e.Matrix.release(l), this.nestLevel--, 0 === this.nestLevel) {
                        n.length > 6 && (n.length = 6);
                        for (var h = n.length, u = 0; h > u; u++) n[u].resize(0, 0)
                    }
                    return c
                }, a.prototype.drawDisplayObject = function (t, r, i, n, a) {
                    var o, s = 0,
                        c = t.$displayList;
                    if (c && !a ? ((t.$cacheDirty || t.$renderDirty || c.$canvasScaleX != e.sys.DisplayList.$canvasScaleX || c.$canvasScaleY != e.sys.DisplayList.$canvasScaleY) && (s += c.drawToSurface()), o = c.$renderNode) : o = t.$renderDirty ? t.$getRenderNode() : t.$renderNode, t.$cacheDirty = !1, o) {
                        switch (s++, r.$offsetX = i, r.$offsetY = n, o.type) {
                            case 1:
                                this.renderBitmap(o, r);
                                break;
                            case 2:
                                this.renderText(o, r);
                                break;
                            case 3:
                                this.renderGraphics(o, r);
                                break;
                            case 4:
                                this.renderGroup(o, r);
                                break;
                            case 5:
                                this.renderMesh(o, r);
                                break;
                            case 6:
                                this.renderNormalBitmap(o, r)
                        }
                        r.$offsetX = 0, r.$offsetY = 0
                    }
                    if (c && !a) return s;
                    var l = t.$children;
                    if (l)
                        for (var h = l.length, u = 0; h > u; u++) {
                            var d = l[u],
                                f = void 0,
                                p = void 0,
                                v = void 0;
                            1 != d.$alpha && (v = r.globalAlpha, r.globalAlpha *= d.$alpha);
                            var g = void 0;
                            if (d.$useTranslate) {
                                var y = d.$getMatrix();
                                f = i + d.$x, p = n + d.$y;
                                var x = r.globalMatrix;
                                g = e.Matrix.create(), g.a = x.a, g.b = x.b, g.c = x.c, g.d = x.d, g.tx = x.tx, g.ty = x.ty, r.transform(y.a, y.b, y.c, y.d, f, p), f = -d.$anchorOffsetX, p = -d.$anchorOffsetY
                            } else f = i + d.$x - d.$anchorOffsetX, p = n + d.$y - d.$anchorOffsetY;
                            switch (d.$renderMode) {
                                case 1:
                                    break;
                                case 2:
                                    s += this.drawWithFilter(d, r, f, p);
                                    break;
                                case 3:
                                    s += this.drawWithClip(d, r, f, p);
                                    break;
                                case 4:
                                    s += this.drawWithScrollRect(d, r, f, p);
                                    break;
                                default:
                                    s += this.drawDisplayObject(d, r, f, p)
                            }
                            if (v && (r.globalAlpha = v), g) {
                                var y = r.globalMatrix;
                                y.a = g.a, y.b = g.b, y.c = g.c, y.d = g.d, y.tx = g.tx, y.ty = g.ty, e.Matrix.release(g)
                            }
                        }
                    return s
                }, a.prototype.drawWithFilter = function (t, a, o, s) {
                    var c = 0;
                    if (t.$children && 0 == t.$children.length && (!t.$renderNode || 0 == t.$renderNode.$getRenderCount())) return c;
                    var l, h = t.$filters,
                        u = 0 !== t.$blendMode;
                    u && (l = r[t.$blendMode], l || (l = i));
                    var d = t.$getOriginalBounds(),
                        f = d.x,
                        p = d.y,
                        v = d.width,
                        g = d.height;
                    if (0 >= v || 0 >= g) return c;
                    if (!t.mask && 1 == h.length && ("colorTransform" == h[0].type || "custom" === h[0].type && 0 === h[0].padding)) {
                        var y = this.getRenderCount(t);
                        if (!t.$children || 1 == y) return u && a.context.setGlobalCompositeOperation(l), a.context.$filter = h[0], c += t.$mask ? this.drawWithClip(t, a, o, s) : t.$scrollRect || t.$maskRect ? this.drawWithScrollRect(t, a, o, s) : this.drawDisplayObject(t, a, o, s), a.context.$filter = null, u && a.context.setGlobalCompositeOperation(i), c
                    }
                    var x = this.createRenderBuffer(v, g);
                    if (x.context.pushBuffer(x), c += t.$mask ? this.drawWithClip(t, x, -f, -p) : t.$scrollRect || t.$maskRect ? this.drawWithScrollRect(t, x, -f, -p) : this.drawDisplayObject(t, x, -f, -p), x.context.popBuffer(), c > 0) {
                        u && a.context.setGlobalCompositeOperation(l), c++, a.$offsetX = o + f, a.$offsetY = s + p;
                        var m = e.Matrix.create(),
                            b = a.globalMatrix;
                        m.a = b.a, m.b = b.b, m.c = b.c, m.d = b.d, m.tx = b.tx, m.ty = b.ty, a.useOffset(), a.context.drawTargetWidthFilters(h, x), b.a = m.a, b.b = m.b, b.c = m.c, b.d = m.d, b.tx = m.tx, b.ty = m.ty, e.Matrix.release(m), u && a.context.setGlobalCompositeOperation(i)
                    }
                    return n.push(x), c
                }, a.prototype.getRenderCount = function (e) {
                    var t = 0,
                        r = e.$getRenderNode();
                    if (r && (t += r.$getRenderCount()), e.$children)
                        for (var i = 0, n = e.$children; i < n.length; i++) {
                            var a = n[i],
                                o = a.$filters;
                            if (o && o.length > 0) return 2;
                            if (a.$children) t += this.getRenderCount(a);
                            else {
                                var s = a.$getRenderNode();
                                s && (t += s.$getRenderCount())
                            }
                        }
                    return t
                }, a.prototype.drawWithClip = function (t, a, o, s) {
                    var c, l = 0,
                        h = 0 !== t.$blendMode;
                    h && (c = r[t.$blendMode], c || (c = i));
                    var u = t.$scrollRect ? t.$scrollRect : t.$maskRect,
                        d = t.$mask;
                    if (d) {
                        var f = d.$getMatrix();
                        if (0 == f.a && 0 == f.b || 0 == f.c && 0 == f.d) return l
                    }
                    if (d || t.$children && 0 != t.$children.length) {
                        var p = t.$getOriginalBounds(),
                            v = p.x,
                            g = p.y,
                            y = p.width,
                            x = p.height,
                            m = this.createRenderBuffer(y, x);
                        if (m.context.pushBuffer(m), l += this.drawDisplayObject(t, m, -v, -g), d) {
                            var b = this.createRenderBuffer(y, x);
                            b.context.pushBuffer(b);
                            var w = e.Matrix.create();
                            w.copyFrom(d.$getConcatenatedMatrix()), d.$getConcatenatedMatrixAt(t, w), w.translate(-v, -g), b.setTransform(w.a, w.b, w.c, w.d, w.tx, w.ty), e.Matrix.release(w), l += this.drawDisplayObject(d, b, 0, 0), b.context.popBuffer(), m.context.setGlobalCompositeOperation("destination-in"), m.setTransform(1, 0, 0, -1, 0, b.height);
                            var E = b.rootRenderTarget.width,
                                T = b.rootRenderTarget.height;
                            m.context.drawTexture(b.rootRenderTarget.texture, 0, 0, E, T, 0, 0, E, T, E, T), m.setTransform(1, 0, 0, 1, 0, 0), m.context.setGlobalCompositeOperation("source-over"), b.setTransform(1, 0, 0, 1, 0, 0), n.push(b)
                        }
                        if (m.context.setGlobalCompositeOperation(i), m.context.popBuffer(), l > 0) {
                            l++, h && a.context.setGlobalCompositeOperation(c), u && a.context.pushMask(u.x + o, u.y + s, u.width, u.height);
                            var _ = e.Matrix.create(),
                                S = a.globalMatrix;
                            _.a = S.a, _.b = S.b, _.c = S.c, _.d = S.d, _.tx = S.tx, _.ty = S.ty, S.append(1, 0, 0, -1, o + v, s + g + m.height);
                            var L = m.rootRenderTarget.width,
                                C = m.rootRenderTarget.height;
                            a.context.drawTexture(m.rootRenderTarget.texture, 0, 0, L, C, 0, 0, L, C, L, C), u && m.context.popMask(), h && a.context.setGlobalCompositeOperation(i);
                            var R = a.globalMatrix;
                            R.a = _.a, R.b = _.b, R.c = _.c, R.d = _.d, R.tx = _.tx, R.ty = _.ty, e.Matrix.release(_)
                        }
                        return n.push(m), l
                    }
                    return u && a.context.pushMask(u.x + o, u.y + s, u.width, u.height), h && a.context.setGlobalCompositeOperation(c), l += this.drawDisplayObject(t, a, o, s), h && a.context.setGlobalCompositeOperation(i), u && a.context.popMask(), l
                }, a.prototype.drawWithScrollRect = function (e, t, r, i) {
                    var n = 0,
                        a = e.$scrollRect ? e.$scrollRect : e.$maskRect;
                    if (a.isEmpty()) return n;
                    e.$scrollRect && (r -= a.x, i -= a.y);
                    var o = t.globalMatrix,
                        s = t.context,
                        c = !1;
                    if (t.$hasScissor || 0 != o.b || 0 != o.c) t.context.pushMask(a.x + r, a.y + i, a.width, a.height);
                    else {
                        var l = o.a,
                            h = o.d,
                            u = o.tx,
                            d = o.ty,
                            f = a.x + r,
                            p = a.y + i,
                            v = f + a.width,
                            g = p + a.height,
                            y = void 0,
                            x = void 0,
                            m = void 0,
                            b = void 0;
                        if (1 == l && 1 == h) y = f + u, x = p + d, m = v + u, b = g + d;
                        else {
                            var w = l * f + u,
                                E = h * p + d,
                                T = l * v + u,
                                _ = h * p + d,
                                S = l * v + u,
                                L = h * g + d,
                                C = l * f + u,
                                R = h * g + d,
                                A = 0;
                            w > T && (A = w, w = T, T = A), S > C && (A = S, S = C, C = A), y = S > w ? w : S, m = T > C ? T : C, E > _ && (A = E, E = _, _ = A), L > R && (A = L, L = R, R = A), x = L > E ? E : L, b = _ > R ? _ : R
                        }
                        s.enableScissor(y, -b + t.height, m - y, b - x), c = !0
                    }
                    return n += this.drawDisplayObject(e, t, r, i), c ? s.disableScissor() : s.popMask(), n
                }, a.prototype.drawNodeToBuffer = function (e, t, r, i) {
                    var n = t;
                    n.context.pushBuffer(n), n.setTransform(r.a, r.b, r.c, r.d, r.tx, r.ty), this.renderNode(e, t, 0, 0, i), n.context.$drawWebGL(), n.onRenderFinish(), n.context.popBuffer()
                }, a.prototype.drawDisplayToBuffer = function (e, t, r) {
                    t.context.pushBuffer(t), r && t.setTransform(r.a, r.b, r.c, r.d, r.tx, r.ty);
                    var i;
                    i = e.$renderDirty ? e.$getRenderNode() : e.$renderNode;
                    var n = 0;
                    if (i) switch (n++, i.type) {
                        case 1:
                            this.renderBitmap(i, t);
                            break;
                        case 2:
                            this.renderText(i, t);
                            break;
                        case 3:
                            this.renderGraphics(i, t);
                            break;
                        case 4:
                            this.renderGroup(i, t);
                            break;
                        case 5:
                            this.renderMesh(i, t);
                            break;
                        case 6:
                            this.renderNormalBitmap(i, t)
                    }
                    var a = e.$children;
                    if (a)
                        for (var o = a.length, s = 0; o > s; s++) {
                            var c = a[s];
                            switch (c.$renderMode) {
                                case 1:
                                    break;
                                case 2:
                                    n += this.drawWithFilter(c, t, 0, 0);
                                    break;
                                case 3:
                                    n += this.drawWithClip(c, t, 0, 0);
                                    break;
                                case 4:
                                    n += this.drawWithScrollRect(c, t, 0, 0);
                                    break;
                                default:
                                    n += this.drawDisplayObject(c, t, 0, 0)
                            }
                        }
                    return t.context.$drawWebGL(), t.onRenderFinish(), t.context.popBuffer(), n
                }, a.prototype.renderNode = function (e, t, r, i, n) {
                    switch (t.$offsetX = r, t.$offsetY = i, e.type) {
                        case 1:
                            this.renderBitmap(e, t);
                            break;
                        case 2:
                            this.renderText(e, t);
                            break;
                        case 3:
                            this.renderGraphics(e, t, n);
                            break;
                        case 4:
                            this.renderGroup(e, t);
                            break;
                        case 5:
                            this.renderMesh(e, t);
                            break;
                        case 6:
                            this.renderNormalBitmap(e, t)
                    }
                }, a.prototype.renderNormalBitmap = function (e, t) {
                    var r = e.image;
                    r && t.context.drawImage(r, e.sourceX, e.sourceY, e.sourceW, e.sourceH, e.drawX, e.drawY, e.drawW, e.drawH, e.imageWidth, e.imageHeight, e.rotated, e.smoothing)
                }, a.prototype.renderBitmap = function (t, n) {
                    var a = t.image;
                    if (a) {
                        var o, s, c, l = t.drawData,
                            h = l.length,
                            u = 0,
                            d = t.matrix,
                            f = t.blendMode,
                            p = t.alpha;
                        if (d) {
                            o = e.Matrix.create();
                            var v = n.globalMatrix;
                            o.a = v.a, o.b = v.b, o.c = v.c, o.d = v.d, o.tx = v.tx, o.ty = v.ty, s = n.$offsetX, c = n.$offsetY, n.useOffset(), n.transform(d.a, d.b, d.c, d.d, d.tx, d.ty)
                        }
                        f && n.context.setGlobalCompositeOperation(r[f]);
                        var g;
                        if (p == p && (g = n.globalAlpha, n.globalAlpha *= p), t.filter) {
                            for (n.context.$filter = t.filter; h > u;) n.context.drawImage(a, l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], t.imageWidth, t.imageHeight, t.rotated, t.smoothing);
                            n.context.$filter = null
                        } else
                            for (; h > u;) n.context.drawImage(a, l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], t.imageWidth, t.imageHeight, t.rotated, t.smoothing);
                        if (f && n.context.setGlobalCompositeOperation(i), p == p && (n.globalAlpha = g), d) {
                            var y = n.globalMatrix;
                            y.a = o.a, y.b = o.b, y.c = o.c, y.d = o.d, y.tx = o.tx, y.ty = o.ty, n.$offsetX = s, n.$offsetY = c, e.Matrix.release(o)
                        }
                    }
                }, a.prototype.renderMesh = function (t, n) {
                    var a, o, s, c = t.image,
                        l = t.drawData,
                        h = l.length,
                        u = 0,
                        d = t.matrix,
                        f = t.blendMode,
                        p = t.alpha;
                    if (d) {
                        a = e.Matrix.create();
                        var v = n.globalMatrix;
                        a.a = v.a, a.b = v.b, a.c = v.c, a.d = v.d, a.tx = v.tx, a.ty = v.ty, o = n.$offsetX, s = n.$offsetY, n.useOffset(), n.transform(d.a, d.b, d.c, d.d, d.tx, d.ty)
                    }
                    f && n.context.setGlobalCompositeOperation(r[f]);
                    var g;
                    if (p == p && (g = n.globalAlpha, n.globalAlpha *= p), t.filter) {
                        for (n.context.$filter = t.filter; h > u;) n.context.drawMesh(c, l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], t.imageWidth, t.imageHeight, t.uvs, t.vertices, t.indices, t.bounds, t.rotated, t.smoothing);
                        n.context.$filter = null
                    } else
                        for (; h > u;) n.context.drawMesh(c, l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], l[u++], t.imageWidth, t.imageHeight, t.uvs, t.vertices, t.indices, t.bounds, t.rotated, t.smoothing);
                    if (f && n.context.setGlobalCompositeOperation(i), p == p && (n.globalAlpha = g), d) {
                        var y = n.globalMatrix;
                        y.a = a.a, y.b = a.b, y.c = a.c, y.d = a.d, y.tx = a.tx, y.ty = a.ty, n.$offsetX = o, n.$offsetY = s, e.Matrix.release(a)
                    }
                }, a.prototype.renderText = function (r, i) {
                    var n = r.width - r.x,
                        a = r.height - r.y;
                    if (!(0 >= n || 0 >= a) && n && a && 0 != r.drawData.length) {
                        var o = e.sys.DisplayList.$canvasScaleX,
                            s = e.sys.DisplayList.$canvasScaleY,
                            c = i.context.$maxTextureSize;
                        n * o > c && (o *= c / (n * o)), a * s > c && (s *= c / (a * s)), n *= o, a *= s;
                        var l = r.x * o,
                            h = r.y * s;
                        if ((r.$canvasScaleX != o || r.$canvasScaleY != s) && (r.$canvasScaleX = o, r.$canvasScaleY = s, r.dirtyRender = !0), this.canvasRenderBuffer && this.canvasRenderBuffer.context ? r.dirtyRender && this.canvasRenderBuffer.resize(n, a) : (this.canvasRenderer = new e.CanvasRenderer, this.canvasRenderBuffer = new t.CanvasRenderBuffer(n, a)), this.canvasRenderBuffer.context) {
                            if ((1 != o || 1 != s) && this.canvasRenderBuffer.context.setTransform(o, 0, 0, s, 0, 0), l || h ? (r.dirtyRender && this.canvasRenderBuffer.context.setTransform(o, 0, 0, s, -l, -h), i.transform(1, 0, 0, 1, l / o, h / s)) : (1 != o || 1 != s) && this.canvasRenderBuffer.context.setTransform(o, 0, 0, s, 0, 0), r.dirtyRender) {
                                var u = this.canvasRenderBuffer.surface;
                                this.canvasRenderer.renderText(r, this.canvasRenderBuffer.context);
                                var d = r.$texture;
                                d ? i.context.updateTexture(d, u) : (d = i.context.createTexture(u), r.$texture = d), r.$textureWidth = u.width, r.$textureHeight = u.height
                            }
                            var f = r.$textureWidth,
                                p = r.$textureHeight;
                            i.context.drawTexture(r.$texture, 0, 0, f, p, 0, 0, f / o, p / s, f, p), (l || h) && (r.dirtyRender && this.canvasRenderBuffer.context.setTransform(o, 0, 0, s, 0, 0), i.transform(1, 0, 0, 1, -l / o, -h / s)), r.dirtyRender = !1
                        }
                    }
                }, a.prototype.renderGraphics = function (r, i, n) {
                    var a = r.width,
                        o = r.height;
                    if (!(0 >= a || 0 >= o) && a && o && 0 != r.drawData.length) {
                        var s = e.sys.DisplayList.$canvasScaleX,
                            c = e.sys.DisplayList.$canvasScaleY;
                        (1 > a * s || 1 > o * c) && (s = c = 1), (r.$canvasScaleX != s || r.$canvasScaleY != c) && (r.$canvasScaleX = s, r.$canvasScaleY = c, r.dirtyRender = !0), a *= s, o *= c;
                        var l = Math.ceil(a),
                            h = Math.ceil(o);
                        if (s *= l / a, c *= h / o, a = l, o = h, this.canvasRenderBuffer && this.canvasRenderBuffer.context ? (r.dirtyRender || n) && this.canvasRenderBuffer.resize(a, o) : (this.canvasRenderer = new e.CanvasRenderer, this.canvasRenderBuffer = new t.CanvasRenderBuffer(a, o)), this.canvasRenderBuffer.context) {
                            (1 != s || 1 != c) && this.canvasRenderBuffer.context.setTransform(s, 0, 0, c, 0, 0), (r.x || r.y) && ((r.dirtyRender || n) && this.canvasRenderBuffer.context.translate(-r.x, -r.y), i.transform(1, 0, 0, 1, r.x, r.y));
                            var u = this.canvasRenderBuffer.surface;
                            if (n) {
                                this.canvasRenderer.renderGraphics(r, this.canvasRenderBuffer.context, !0), e.WebGLUtils.deleteWebGLTexture(u);
                                var d = i.context.getWebGLTexture(u);
                                i.context.drawTexture(d, 0, 0, a, o, 0, 0, a, o, u.width, u.height)
                            } else {
                                if (r.dirtyRender) {
                                    this.canvasRenderer.renderGraphics(r, this.canvasRenderBuffer.context);
                                    var d = r.$texture;
                                    d ? i.context.updateTexture(d, u) : (d = i.context.createTexture(u), r.$texture = d), r.$textureWidth = u.width, r.$textureHeight = u.height
                                }
                                var f = r.$textureWidth,
                                    p = r.$textureHeight;
                                i.context.drawTexture(r.$texture, 0, 0, f, p, 0, 0, f / s, p / c, f, p)
                            } (r.x || r.y) && ((r.dirtyRender || n) && this.canvasRenderBuffer.context.translate(r.x, r.y), i.transform(1, 0, 0, 1, -r.x, -r.y)), n || (r.dirtyRender = !1)
                        }
                    }
                }, a.prototype.renderGroup = function (t, r) {
                    var i, n, a, o = t.matrix;
                    if (o) {
                        i = e.Matrix.create();
                        var s = r.globalMatrix;
                        i.a = s.a, i.b = s.b, i.c = s.c, i.d = s.d, i.tx = s.tx, i.ty = s.ty, n = r.$offsetX, a = r.$offsetY, r.useOffset(), r.transform(o.a, o.b, o.c, o.d, o.tx, o.ty)
                    }
                    for (var c = t.drawData, l = c.length, h = 0; l > h; h++) {
                        var u = c[h];
                        this.renderNode(u, r, r.$offsetX, r.$offsetY)
                    }
                    if (o) {
                        var d = r.globalMatrix;
                        d.a = i.a, d.b = i.b, d.c = i.c, d.d = i.d, d.tx = i.tx, d.ty = i.ty, r.$offsetX = n, r.$offsetY = a, e.Matrix.release(i)
                    }
                }, a.prototype.createRenderBuffer = function (e, r) {
                    var i = n.pop();
                    return i ? i.resize(e, r) : (i = new t.WebGLRenderBuffer(e, r), i.$computeDrawCall = !1), i
                }, a
            }();
        t.WebGLRenderer = a, __reflect(a.prototype, "egret.web.WebGLRenderer", ["egret.sys.SystemRenderer"])
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) {
        var t;
        ! function (e) {
            e[e.FLOAT_VEC2 = 35664] = "FLOAT_VEC2", e[e.FLOAT_VEC3 = 35665] = "FLOAT_VEC3", e[e.FLOAT_VEC4 = 35666] = "FLOAT_VEC4", e[e.FLOAT = 5126] = "FLOAT", e[e.BYTE = 65535] = "BYTE", e[e.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", e[e.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT"
        }(t = e.WEBGL_ATTRIBUTE_TYPE || (e.WEBGL_ATTRIBUTE_TYPE = {}));
        var r = function () {
            function e(e, t, r) {
                this.gl = e, this.name = r.name, this.type = r.type, this.size = r.size, this.location = e.getAttribLocation(t, this.name), this.count = 0, this.initCount(e), this.format = e.FLOAT, this.initFormat(e)
            }
            return e.prototype.initCount = function (e) {
                var r = this.type;
                switch (r) {
                    case t.FLOAT:
                    case t.BYTE:
                    case t.UNSIGNED_BYTE:
                    case t.UNSIGNED_SHORT:
                        this.count = 1;
                        break;
                    case t.FLOAT_VEC2:
                        this.count = 2;
                        break;
                    case t.FLOAT_VEC3:
                        this.count = 3;
                        break;
                    case t.FLOAT_VEC4:
                        this.count = 4
                }
            }, e.prototype.initFormat = function (e) {
                var r = this.type;
                switch (r) {
                    case t.FLOAT:
                    case t.FLOAT_VEC2:
                    case t.FLOAT_VEC3:
                    case t.FLOAT_VEC4:
                        this.format = e.FLOAT;
                        break;
                    case t.UNSIGNED_BYTE:
                        this.format = e.UNSIGNED_BYTE;
                        break;
                    case t.UNSIGNED_SHORT:
                        this.format = e.UNSIGNED_SHORT;
                        break;
                    case t.BYTE:
                        this.format = e.BYTE
                }
            }, e
        }();
        e.EgretWebGLAttribute = r, __reflect(r.prototype, "egret.web.EgretWebGLAttribute")
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) {
        function t(e, t, r) {
            var i = e.createShader(t);
            e.shaderSource(i, r), e.compileShader(i);
            var n = e.getShaderParameter(i, e.COMPILE_STATUS);
            return n || (console.log("shader not compiled!"), console.log(e.getShaderInfoLog(i))), i
        }

        function r(e, t, r) {
            var i = e.createProgram();
            return e.attachShader(i, t), e.attachShader(i, r), e.linkProgram(i), i
        }

        function i(t, r) {
            for (var i = {}, n = t.getProgramParameter(r, t.ACTIVE_ATTRIBUTES), a = 0; n > a; a++) {
                var o = t.getActiveAttrib(r, a),
                    s = o.name,
                    c = new e.EgretWebGLAttribute(t, r, o);
                i[s] = c
            }
            return i
        }

        function n(t, r) {
            for (var i = {}, n = t.getProgramParameter(r, t.ACTIVE_UNIFORMS), a = 0; n > a; a++) {
                var o = t.getActiveUniform(r, a),
                    s = o.name,
                    c = new e.EgretWebGLUniform(t, r, o);
                i[s] = c
            }
            return i
        }
        var a = function () {
            function e(e, a, o) {
                this.vshaderSource = a, this.fshaderSource = o, this.vertexShader = t(e, e.VERTEX_SHADER, this.vshaderSource), this.fragmentShader = t(e, e.FRAGMENT_SHADER, this.fshaderSource), this.id = r(e, this.vertexShader, this.fragmentShader), this.uniforms = n(e, this.id), this.attributes = i(e, this.id)
            }
            return e.getProgram = function (t, r, i, n) {
                return this.programCache[n] || (this.programCache[n] = new e(t, r, i)), this.programCache[n]
            }, e.deleteProgram = function (e, t, r, i) { }, e.programCache = {}, e
        }();
        e.EgretWebGLProgram = a, __reflect(a.prototype, "egret.web.EgretWebGLProgram")
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) {
        var t;
        ! function (e) {
            e[e.FLOAT_VEC2 = 35664] = "FLOAT_VEC2", e[e.FLOAT_VEC3 = 35665] = "FLOAT_VEC3", e[e.FLOAT_VEC4 = 35666] = "FLOAT_VEC4", e[e.INT_VEC2 = 35667] = "INT_VEC2", e[e.INT_VEC3 = 35668] = "INT_VEC3", e[e.INT_VEC4 = 35669] = "INT_VEC4", e[e.BOOL = 35670] = "BOOL", e[e.BOOL_VEC2 = 35671] = "BOOL_VEC2", e[e.BOOL_VEC3 = 35672] = "BOOL_VEC3", e[e.BOOL_VEC4 = 35673] = "BOOL_VEC4", e[e.FLOAT_MAT2 = 35674] = "FLOAT_MAT2", e[e.FLOAT_MAT3 = 35675] = "FLOAT_MAT3", e[e.FLOAT_MAT4 = 35676] = "FLOAT_MAT4", e[e.SAMPLER_2D = 35678] = "SAMPLER_2D", e[e.SAMPLER_CUBE = 35680] = "SAMPLER_CUBE", e[e.BYTE = 65535] = "BYTE", e[e.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", e[e.SHORT = 5122] = "SHORT", e[e.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", e[e.INT = 5124] = "INT", e[e.UNSIGNED_INT = 5125] = "UNSIGNED_INT", e[e.FLOAT = 5126] = "FLOAT"
        }(t = e.WEBGL_UNIFORM_TYPE || (e.WEBGL_UNIFORM_TYPE = {}));
        var r = function () {
            function e(e, t, r) {
                this.gl = e, this.name = r.name, this.type = r.type, this.size = r.size, this.location = e.getUniformLocation(t, this.name), this.setDefaultValue(), this.generateSetValue(), this.generateUpload()
            }
            return e.prototype.setDefaultValue = function () {
                var e = this.type;
                switch (e) {
                    case t.FLOAT:
                    case t.SAMPLER_2D:
                    case t.SAMPLER_CUBE:
                    case t.BOOL:
                    case t.INT:
                        this.value = 0;
                        break;
                    case t.FLOAT_VEC2:
                    case t.BOOL_VEC2:
                    case t.INT_VEC2:
                        this.value = [0, 0];
                        break;
                    case t.FLOAT_VEC3:
                    case t.BOOL_VEC3:
                    case t.INT_VEC3:
                        this.value = [0, 0, 0];
                        break;
                    case t.FLOAT_VEC4:
                    case t.BOOL_VEC4:
                    case t.INT_VEC4:
                        this.value = [0, 0, 0, 0];
                        break;
                    case t.FLOAT_MAT2:
                        this.value = new Float32Array([1, 0, 0, 1]);
                        break;
                    case t.FLOAT_MAT3:
                        this.value = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
                        break;
                    case t.FLOAT_MAT4:
                        this.value = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
                }
            }, e.prototype.generateSetValue = function () {
                var e = this.type;
                switch (e) {
                    case t.FLOAT:
                    case t.SAMPLER_2D:
                    case t.SAMPLER_CUBE:
                    case t.BOOL:
                    case t.INT:
                        this.setValue = function (e) {
                            var t = this.value !== e;
                            this.value = e, t && this.upload()
                        };
                        break;
                    case t.FLOAT_VEC2:
                    case t.BOOL_VEC2:
                    case t.INT_VEC2:
                        this.setValue = function (e) {
                            var t = this.value[0] !== e.x || this.value[1] !== e.y;
                            this.value[0] = e.x, this.value[1] = e.y, t && this.upload()
                        };
                        break;
                    case t.FLOAT_VEC3:
                    case t.BOOL_VEC3:
                    case t.INT_VEC3:
                        this.setValue = function (e) {
                            this.value[0] = e.x, this.value[1] = e.y, this.value[2] = e.z, this.upload()
                        };
                        break;
                    case t.FLOAT_VEC4:
                    case t.BOOL_VEC4:
                    case t.INT_VEC4:
                        this.setValue = function (e) {
                            this.value[0] = e.x, this.value[1] = e.y, this.value[2] = e.z, this.value[3] = e.w, this.upload()
                        };
                        break;
                    case t.FLOAT_MAT2:
                    case t.FLOAT_MAT3:
                    case t.FLOAT_MAT4:
                        this.setValue = function (e) {
                            this.value.set(e), this.upload()
                        }
                }
            }, e.prototype.generateUpload = function () {
                var e = this.gl,
                    r = this.type,
                    i = this.location;
                switch (r) {
                    case t.FLOAT:
                        this.upload = function () {
                            var t = this.value;
                            e.uniform1f(i, t)
                        };
                        break;
                    case t.FLOAT_VEC2:
                        this.upload = function () {
                            var t = this.value;
                            e.uniform2f(i, t[0], t[1])
                        };
                        break;
                    case t.FLOAT_VEC3:
                        this.upload = function () {
                            var t = this.value;
                            e.uniform3f(i, t[0], t[1], t[2])
                        };
                        break;
                    case t.FLOAT_VEC4:
                        this.upload = function () {
                            var t = this.value;
                            e.uniform4f(i, t[0], t[1], t[2], t[3])
                        };
                        break;
                    case t.SAMPLER_2D:
                    case t.SAMPLER_CUBE:
                    case t.BOOL:
                    case t.INT:
                        this.upload = function () {
                            var t = this.value;
                            e.uniform1i(i, t)
                        };
                        break;
                    case t.BOOL_VEC2:
                    case t.INT_VEC2:
                        this.upload = function () {
                            var t = this.value;
                            e.uniform2i(i, t[0], t[1])
                        };
                        break;
                    case t.BOOL_VEC3:
                    case t.INT_VEC3:
                        this.upload = function () {
                            var t = this.value;
                            e.uniform3i(i, t[0], t[1], t[2])
                        };
                        break;
                    case t.BOOL_VEC4:
                    case t.INT_VEC4:
                        this.upload = function () {
                            var t = this.value;
                            e.uniform4i(i, t[0], t[1], t[2], t[3])
                        };
                        break;
                    case t.FLOAT_MAT2:
                        this.upload = function () {
                            var t = this.value;
                            e.uniformMatrix2fv(i, !1, t)
                        };
                        break;
                    case t.FLOAT_MAT3:
                        this.upload = function () {
                            var t = this.value;
                            e.uniformMatrix3fv(i, !1, t)
                        };
                        break;
                    case t.FLOAT_MAT4:
                        this.upload = function () {
                            var t = this.value;
                            e.uniformMatrix4fv(i, !1, t)
                        }
                }
            }, e
        }();
        e.EgretWebGLUniform = r, __reflect(r.prototype, "egret.web.EgretWebGLUniform")
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));
var egret;
! function (e) {
    var t;
    ! function (e) {
        var t = function () {
            function e() { }
            return e.blur_frag = "precision mediump float;\nuniform vec2 blur;\nuniform sampler2D uSampler;\nvarying vec2 vTextureCoord;\nuniform vec2 uTextureSize;\nvoid main()\n{\n    const int sampleRadius = 5;\n    const int samples = sampleRadius * 2 + 1;\n    vec2 blurUv = blur / uTextureSize;\n    vec4 color = vec4(0, 0, 0, 0);\n    vec2 uv = vec2(0.0, 0.0);\n    blurUv /= float(sampleRadius);\n    for (int i = -sampleRadius; i <= sampleRadius; i++) {\n        uv.x = vTextureCoord.x + float(i) * blurUv.x;\n        uv.y = vTextureCoord.y + float(i) * blurUv.y;\n        color += texture2D(uSampler, uv);\n    }\n    color /= float(samples);\n    gl_FragColor = color;\n}", e.colorTransform_frag = "precision mediump float;\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nuniform mat4 matrix;\nuniform vec4 colorAdd;\nuniform sampler2D uSampler;\nvoid main(void) {\n    vec4 texColor = texture2D(uSampler, vTextureCoord);\n    if(texColor.a > 0.) {\n        texColor = vec4(texColor.rgb / texColor.a, texColor.a);\n    }\n    vec4 locColor = clamp(texColor * matrix + colorAdd, 0., 1.);\n    gl_FragColor = vColor * vec4(locColor.rgb * locColor.a, locColor.a);\n}", e.default_vert = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec2 aColor;\nuniform vec2 projectionVector;\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nconst vec2 center = vec2(-1.0, 1.0);\nvoid main(void) {\n   gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n   vTextureCoord = aTextureCoord;\n   vColor = vec4(aColor.x, aColor.x, aColor.x, aColor.x);\n}", e.glow_frag = "precision highp float;\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform float dist;\nuniform float angle;\nuniform vec4 color;\nuniform float alpha;\nuniform float blurX;\nuniform float blurY;\nuniform float strength;\nuniform float inner;\nuniform float knockout;\nuniform float hideObject;\nuniform vec2 uTextureSize;\nfloat random(vec2 scale)\n{\n    return fract(sin(dot(gl_FragCoord.xy, scale)) * 43758.5453);\n}\nvoid main(void) {\n    vec2 px = vec2(1.0 / uTextureSize.x, 1.0 / uTextureSize.y);\n    const float linearSamplingTimes = 7.0;\n    const float circleSamplingTimes = 12.0;\n    vec4 ownColor = texture2D(uSampler, vTextureCoord);\n    vec4 curColor;\n    float totalAlpha = 0.0;\n    float maxTotalAlpha = 0.0;\n    float curDistanceX = 0.0;\n    float curDistanceY = 0.0;\n    float offsetX = dist * cos(angle) * px.x;\n    float offsetY = dist * sin(angle) * px.y;\n    const float PI = 3.14159265358979323846264;\n    float cosAngle;\n    float sinAngle;\n    float offset = PI * 2.0 / circleSamplingTimes * random(vec2(12.9898, 78.233));\n    float stepX = blurX * px.x / linearSamplingTimes;\n    float stepY = blurY * px.y / linearSamplingTimes;\n    for (float a = 0.0; a <= PI * 2.0; a += PI * 2.0 / circleSamplingTimes) {\n        cosAngle = cos(a + offset);\n        sinAngle = sin(a + offset);\n        for (float i = 1.0; i <= linearSamplingTimes; i++) {\n            curDistanceX = i * stepX * cosAngle;\n            curDistanceY = i * stepY * sinAngle;\n            \n            curColor = texture2D(uSampler, vec2(vTextureCoord.x + curDistanceX - offsetX, vTextureCoord.y + curDistanceY + offsetY));\n            totalAlpha += (linearSamplingTimes - i) * curColor.a;\n            maxTotalAlpha += (linearSamplingTimes - i);\n        }\n    }\n    ownColor.a = max(ownColor.a, 0.0001);\n    ownColor.rgb = ownColor.rgb / ownColor.a;\n    float outerGlowAlpha = (totalAlpha / maxTotalAlpha) * strength * alpha * (1. - inner) * max(min(hideObject, knockout), 1. - ownColor.a);\n    float innerGlowAlpha = ((maxTotalAlpha - totalAlpha) / maxTotalAlpha) * strength * alpha * inner * ownColor.a;\n    ownColor.a = max(ownColor.a * knockout * (1. - hideObject), 0.0001);\n    vec3 mix1 = mix(ownColor.rgb, color.rgb, innerGlowAlpha / (innerGlowAlpha + ownColor.a));\n    vec3 mix2 = mix(mix1, color.rgb, outerGlowAlpha / (innerGlowAlpha + ownColor.a + outerGlowAlpha));\n    float resultAlpha = min(ownColor.a + outerGlowAlpha + innerGlowAlpha, 1.);\n    gl_FragColor = vec4(mix2 * resultAlpha, resultAlpha);\n}", e.primitive_frag = "precision lowp float;\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvoid main(void) {\n    gl_FragColor = vColor;\n}", e.texture_frag = "precision lowp float;\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nuniform sampler2D uSampler;\nvoid main(void) {\n    gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor;\n}", e
        }();
        e.EgretShaderLib = t, __reflect(t.prototype, "egret.web.EgretShaderLib")
    }(t = e.web || (e.web = {}))
}(egret || (egret = {}));