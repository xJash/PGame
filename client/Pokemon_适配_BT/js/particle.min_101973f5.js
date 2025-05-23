var __reflect = this && this.__reflect || function(t, e, i) {
        t.__class__ = e, i ? i.push(e) : i = [e], t.__types__ = t.__types__ ? i.concat(t.__types__) : i
    },
    __extends = this && this.__extends || function(t, e) {
        function i() {
            this.constructor = t
        }
        for (var a in e) e.hasOwnProperty(a) && (t[a] = e[a]);
        i.prototype = e.prototype, t.prototype = new i
    },
    particle;
! function(t) {
    var e = function() {
        function t() {
            this.matrix = new egret.Matrix, this.reset()
        }
        return t.prototype.reset = function() {
            this.x = 0, this.y = 0, this.scale = 1, this.rotation = 0, this.alpha = 1, this.currentTime = 0, this.totalTime = 1e3
        }, t.prototype.$getMatrix = function(t, e) {
            var i = this.matrix;
            if (i.identity(), this.rotation % 360) var a = this.rotation,
                r = egret.NumberUtils.cos(a),
                s = egret.NumberUtils.sin(a);
            else r = 1, s = 0;
            return i.append(r * this.scale, s * this.scale, -s * this.scale, r * this.scale, this.x, this.y), (t || e) && (i.tx -= t * i.a + e * i.c, i.ty -= t * i.b + e * i.d), i
        }, t
    }();
    t.Particle = e, __reflect(e.prototype, "particle.Particle")
}(particle || (particle = {}));
var particle;
! function(t) {
    var e = function(e) {
        function i(t, i) {
            var a = e.call(this) || this;
            return a._pool = [], a.frameTime = 0, a.particles = [], a._emitterX = 0, a._emitterY = 0, a.emissionTime = -1, a.maxParticles = 200, a.numParticles = 0, a.particleClass = null, a.$particleConfig = null, a.particleMeasureRect = new egret.Rectangle, a.transformForMeasure = new egret.Matrix, a.bitmapNodeList = [], egret.nativeRender ? (a.initConfig(i, 0, 0), a.changeTexture(t)) : (a.emissionRate = i, a.texture = t, a.$renderNode = new egret.sys.GroupNode, a.$renderNode.cleanBeforeRender = function() {}), a
        }
        return __extends(i, e), i.prototype.createNativeDisplayObject = function() {
            this.$nativeDisplayObject = new egret_native.NativeDisplayObject(10)
        }, i.prototype.initConfig = function(t, e, i) {
            this.$particleConfig = [t, e, i, 0, 200], this.emissionRate = t, this._emitterX = e, this._emitterY = i
        }, i.prototype.getParticle = function() {
            var e;
            return e = this._pool.length ? this._pool.pop() : this.particleClass ? new this.particleClass : new t.Particle
        }, i.prototype.removeParticle = function(t) {
            var e = this.particles.indexOf(t);
            return -1 != e ? (t.reset(), this.particles.splice(e, 1), this._pool.push(t), this.numParticles--, this.bitmapNodeList.length > this.numParticles && (this.bitmapNodeList.length = this.numParticles, this.$renderNode.drawData.length = this.numParticles), !0) : !1
        }, i.prototype.initParticle = function(t) {
            t.x = this.emitterX, t.y = this.emitterY, t.currentTime = 0, t.totalTime = 1e3
        }, i.prototype.updateRelativeBounds = function(t) {
            t ? (null == this.relativeContentBounds && (this.relativeContentBounds = new egret.Rectangle), this.relativeContentBounds.copyFrom(t), this.relativeContentBounds.x += this.emitterX, this.relativeContentBounds.y += this.emitterY) : this.relativeContentBounds = null, this.mask = this.relativeContentBounds
        }, Object.defineProperty(i.prototype, "emitterBounds", {
            get: function() {
                return this._emitterBounds
            },
            set: function(t) {
                this._emitterBounds = t, this.updateRelativeBounds(t), egret.nativeRender && this.onPropertyChanges()
            },
            enumerable: !0,
            configurable: !0
        }), i.prototype.onPropertyChanges = function() {
            this.$nativeDisplayObject.setCustomData(this.$particleConfig)
        }, Object.defineProperty(i.prototype, "emitterX", {
            get: function() {
                return this._emitterX
            },
            set: function(t) {
                this._emitterX = t, this.updateRelativeBounds(this.emitterBounds), egret.nativeRender && this.onPropertyChanges()
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(i.prototype, "emitterY", {
            get: function() {
                return this._emitterY
            },
            set: function(t) {
                this._emitterY = t, this.updateRelativeBounds(this.emitterBounds), egret.nativeRender && this.onPropertyChanges()
            },
            enumerable: !0,
            configurable: !0
        }), i.prototype.start = function(t) {
            void 0 === t && (t = -1), 0 != this.emissionRate && (this.emissionTime = t, egret.nativeRender ? (this.$particleConfig[3] = t, this.$nativeDisplayObject.setCustomData(this.$particleConfig)) : (this.timeStamp = egret.getTimer(), egret.startTick(this.update, this)))
        }, i.prototype.stop = function(t) {
            return void 0 === t && (t = !1), egret.nativeRender ? void this.$nativeDisplayObject.setStopToParticle(t) : (this.emissionTime = 0, void(t && (this.clear(), egret.stopTick(this.update, this))))
        }, i.prototype.update = function(t) {
            var e = t - this.timeStamp;
            if (this.timeStamp = t, -1 == this.emissionTime || this.emissionTime > 0) {
                for (this.frameTime += e; this.frameTime > 0;) this.numParticles < this.maxParticles && this.addOneParticle(), this.frameTime -= this.emissionRate; - 1 != this.emissionTime && (this.emissionTime -= e, this.emissionTime < 0 && (this.emissionTime = 0))
            }
            for (var i, a = 0; a < this.numParticles;) i = this.particles[a], i.currentTime < i.totalTime ? (this.advanceParticle(i, e), i.currentTime += e, a++) : this.removeParticle(i);
            return this.$renderDirty = !0, 0 == this.numParticles && 0 == this.emissionTime && (egret.stopTick(this.update, this), this.dispatchEventWith(egret.Event.COMPLETE)), !1
        }, i.prototype.$measureContentBounds = function(t) {
            if (this.relativeContentBounds) return void t.copyFrom(this.relativeContentBounds);
            if (this.numParticles > 0) {
                for (var e, i = this.texture, a = Math.round(i.$getScaleBitmapWidth()), r = Math.round(i.$getScaleBitmapHeight()), s = egret.Rectangle.create(), n = 0; n < this.numParticles; n++) {
                    e = this.particles[n], this.transformForMeasure.identity(), this.appendTransform(this.transformForMeasure, e.x, e.y, e.scale, e.scale, e.rotation, 0, 0, a / 2, r / 2), this.particleMeasureRect.setEmpty(), this.particleMeasureRect.width = a, this.particleMeasureRect.height = r;
                    var o = Region.create();
                    if (o.updateRegion(this.particleMeasureRect, this.transformForMeasure), 0 == n) s.setTo(o.minX, o.minY, o.maxX - o.minX, o.maxY - o.minY);
                    else {
                        var h = Math.min(s.x, o.minX),
                            l = Math.min(s.y, o.minY),
                            c = Math.max(s.right, o.maxX),
                            p = Math.max(s.bottom, o.maxY);
                        s.setTo(h, l, c - h, p - l)
                    }
                    Region.release(o)
                }
                this.lastRect = s, t.setTo(s.x, s.y, s.width, s.height), egret.Rectangle.release(s)
            } else this.lastRect && (s = this.lastRect, t.setTo(s.x, s.y, s.width, s.height), egret.Rectangle.release(s), this.lastRect = null)
        }, i.prototype.setCurrentParticles = function(t) {
            if (!egret.nativeRender)
                for (var e = this.numParticles; t > e && this.numParticles < this.maxParticles; e++) this.addOneParticle()
        }, i.prototype.changeTexture = function(t) {
            this.texture != t && (this.texture = t, egret.nativeRender ? this.$nativeDisplayObject.setBitmapDataToParticle(t) : (this.bitmapNodeList.length = 0, this.$renderNode.drawData.length = 0))
        }, i.prototype.clear = function() {
            for (; this.particles.length;) this.removeParticle(this.particles[0]);
            this.numParticles = 0, this.$renderNode.drawData.length = 0, this.bitmapNodeList.length = 0, this.$renderDirty = !0
        }, i.prototype.addOneParticle = function() {
            var t = this.getParticle();
            this.initParticle(t), t.totalTime > 0 && (this.particles.push(t), this.numParticles++)
        }, i.prototype.advanceParticle = function(t, e) {
            t.y -= e / 6
        }, i.prototype.$updateRenderNode = function() {
            if (!egret.nativeRender && this.numParticles > 0)
                for (var t, e = this.texture, i = Math.round(e.$getScaleBitmapWidth()), a = Math.round(e.$getScaleBitmapHeight()), r = e.$offsetX, s = e.$offsetY, n = e.$bitmapX, o = e.$bitmapY, h = e.$bitmapWidth, l = e.$bitmapHeight, c = 0; c < this.numParticles; c++) {
                    t = this.particles[c];
                    var p;
                    this.bitmapNodeList[c] || (p = new egret.sys.BitmapNode, this.bitmapNodeList[c] = p, this.$renderNode.addNode(this.bitmapNodeList[c]), p.image = e.$bitmapData, p.imageWidth = e.$sourceWidth, p.imageHeight = e.$sourceHeight, p.drawImage(n, o, h, l, r, s, i, a)), p = this.bitmapNodeList[c], p.matrix = t.$getMatrix(i / 2, a / 2), p.blendMode = t.blendMode, p.alpha = t.alpha
                }
        }, i.prototype.appendTransform = function(t, e, i, a, r, s, n, o, h, l) {
            if (s % 360) var c = s,
                p = egret.NumberUtils.cos(c),
                u = egret.NumberUtils.sin(c);
            else p = 1, u = 0;
            return n || o ? (t.append(egret.NumberUtils.cos(o), egret.NumberUtils.sin(o), -egret.NumberUtils.sin(n), egret.NumberUtils.cos(n), e, i), t.append(p * a, u * a, -u * r, p * r, 0, 0)) : t.append(p * a, u * a, -u * r, p * r, e, i), (h || l) && (t.tx -= h * t.a + l * t.c, t.ty -= h * t.b + l * t.d), t
        }, i
    }(egret.DisplayObject);
    t.ParticleSystem = e, __reflect(e.prototype, "particle.ParticleSystem")
}(particle || (particle = {}));
var regionPool = [],
    Region = function() {
        function t() {
            this.minX = 0, this.minY = 0, this.maxX = 0, this.maxY = 0, this.width = 0, this.height = 0, this.area = 0
        }
        return t.release = function(t) {
            regionPool.push(t)
        }, t.create = function() {
            var e = regionPool.pop();
            return e || (e = new t), e
        }, t.prototype.setEmpty = function() {
            this.minX = 0, this.minY = 0, this.maxX = 0, this.maxY = 0, this.width = 0, this.height = 0, this.area = 0
        }, t.prototype.updateRegion = function(t, e) {
            if (0 == t.width || 0 == t.height) return void this.setEmpty();
            var i, a, r, s, n = e,
                o = n.a,
                h = n.b,
                l = n.c,
                c = n.d,
                p = n.tx,
                u = n.ty,
                m = t.x,
                d = t.y,
                g = m + t.width,
                f = d + t.height;
            if (1 == o && 0 == h && 0 == l && 1 == c) i = m + p - 1, a = d + u - 1, r = g + p + 1, s = f + u + 1;
            else {
                var v = o * m + l * d + p,
                    y = h * m + c * d + u,
                    R = o * g + l * d + p,
                    x = h * g + c * d + u,
                    P = o * g + l * f + p,
                    V = h * g + c * f + u,
                    _ = o * m + l * f + p,
                    C = h * m + c * f + u,
                    b = 0;
                v > R && (b = v, v = R, R = b), P > _ && (b = P, P = _, _ = b), i = (P > v ? v : P) - 1, r = (R > _ ? R : _) + 1, y > x && (b = y, y = x, x = b), V > C && (b = V, V = C, C = b), a = (V > y ? y : V) - 1, s = (x > C ? x : C) + 1
            }
            this.minX = i, this.minY = a, this.maxX = r, this.maxY = s, this.width = r - i, this.height = s - a, this.area = this.width * this.height
        }, t
    }();
__reflect(Region.prototype, "Region");
var particle;
! function(t) {
    var e = function(t) {
        function e() {
            return null !== t && t.apply(this, arguments) || this
        }
        return __extends(e, t), e.prototype.reset = function() {
            t.prototype.reset.call(this), this.startX = 0, this.startY = 0, this.velocityX = 0, this.velocityY = 0, this.radialAcceleration = 0, this.tangentialAcceleration = 0, this.rotationDelta = 0, this.scaleDelta = 0
        }, e
    }(t.Particle);
    t.GravityParticle = e, __reflect(e.prototype, "particle.GravityParticle")
}(particle || (particle = {}));
var particle;
! function(t) {
    var e = function(e) {
        function i(i, a) {
            var r = e.call(this, i, 200) || this;
            return r.$init = !1, r.parseConfig(a), r.emissionRate = r.lifespan / r.maxParticles, r.particleClass = t.GravityParticle, r.$init = !0, r
        }
        return __extends(i, e), i.prototype.start = function(t) {
            if (void 0 === t && (t = -1), egret.nativeRender) {
                0 != this.emissionRate && (this.emissionTime = t), this.$particleConfig[2] = t;
                var i = [],
                    a = 0;
                for (var r in this.$particleConfig) i.push(a++), i.push(this.$particleConfig[r]);
                this.$nativeDisplayObject.setCustomData(i)
            } else e.prototype.start.call(this, t)
        }, i.prototype.setCurrentParticles = function(t) {
            if (!(t > this.maxParticles)) {
                var e = [];
                e.push(35), e.push(t), this.$nativeDisplayObject.setCustomData(e)
            }
        }, i.prototype.onPropertyChanges = function() {
            if (0 != this.$init) {
                var t = [];
                t.push(0), this.$particleConfig[0] = this._emitterX, t.push(this._emitterX), t.push(1), this.$particleConfig[1] = this._emitterY, t.push(this._emitterY), this.relativeContentBounds && (t.push(31), this.$particleConfig[31] = this.relativeContentBounds.x, t.push(this.relativeContentBounds.x), t.push(32), this.$particleConfig[32] = this.relativeContentBounds.y, t.push(this.relativeContentBounds.y), t.push(33), this.$particleConfig[33] = this.relativeContentBounds.width, t.push(this.relativeContentBounds.width), t.push(34), this.$particleConfig[34] = this.relativeContentBounds.height, t.push(this.relativeContentBounds.height)), this.$nativeDisplayObject.setCustomData(t)
            }
        }, i.prototype.parseConfig = function(t) {
            function e(t) {
                return "undefined" == typeof t ? 0 : t
            }
            if (egret.nativeRender ? (this._emitterX = e(t.emitter.x), this._emitterY = e(t.emitter.y)) : (this.emitterX = e(t.emitter.x), this.emitterY = e(t.emitter.y)), this.emitterXVariance = e(t.emitterVariance.x), this.emitterYVariance = e(t.emitterVariance.y), this.gravityX = e(t.gravity.x), this.gravityY = e(t.gravity.y), 1 == t.useEmitterRect) {
                var i = new egret.Rectangle;
                i.x = e(t.emitterRect.x), i.y = e(t.emitterRect.y), i.width = e(t.emitterRect.width), i.height = e(t.emitterRect.height), this.emitterBounds = i
            }
            this.maxParticles = e(t.maxParticles), this.speed = e(t.speed), this.speedVariance = e(t.speedVariance), this.lifespan = Math.max(.01, e(t.lifespan)), this.lifespanVariance = e(t.lifespanVariance), this.emitAngle = e(t.emitAngle), this.emitAngleVariance = e(t.emitAngleVariance), this.startSize = e(t.startSize), this.startSizeVariance = e(t.startSizeVariance), this.endSize = e(t.endSize), this.endSizeVariance = e(t.endSizeVariance), this.startRotation = e(t.startRotation), this.startRotationVariance = e(t.startRotationVariance), this.endRotation = e(t.endRotation), this.endRotationVariance = e(t.endRotationVariance), this.radialAcceleration = e(t.radialAcceleration), this.radialAccelerationVariance = e(t.radialAccelerationVariance), this.tangentialAcceleration = e(t.tangentialAcceleration), this.tangentialAccelerationVariance = e(t.tangentialAccelerationVariance), this.startAlpha = e(t.startAlpha), this.startAlphaVariance = e(t.startAlphaVariance), this.endAlpha = e(t.endAlpha), this.endAlphaVariance = e(t.endAlphaVariance), egret.nativeRender ? t.blendMode && (this.particleBlendMode = t.blendMode) : this.particleBlendMode = t.blendMode, this.$particleConfig = {
                0: this.emitterX,
                1: this.emitterY,
                2: -1,
                3: this.maxParticles,
                4: this.emitterXVariance,
                5: this.emitterYVariance,
                6: this.gravityX,
                7: this.gravityY,
                8: this.speed,
                9: this.speedVariance,
                10: this.lifespan,
                11: this.lifespanVariance,
                12: this.emitAngle,
                13: this.emitAngleVariance,
                14: this.startSize,
                15: this.startSizeVariance,
                16: this.endSize,
                17: this.endSizeVariance,
                18: this.startRotation,
                19: this.startRotationVariance,
                20: this.endRotation,
                21: this.endRotationVariance,
                22: this.radialAcceleration,
                23: this.radialAccelerationVariance,
                24: this.tangentialAcceleration,
                25: this.tangentialAccelerationVariance,
                26: this.startAlpha,
                27: this.startAlphaVariance,
                28: this.endAlpha,
                29: this.endAlphaVariance,
                30: this.particleBlendMode,
                31: t.useEmitterRect ? this.relativeContentBounds.x : 0,
                32: t.useEmitterRect ? this.relativeContentBounds.y : 0,
                33: t.useEmitterRect ? this.relativeContentBounds.width : 0,
                34: t.useEmitterRect ? this.relativeContentBounds.height : 0,
                35: 0
            }
        }, i.prototype.initParticle = function(t) {
            var e = t,
                a = i.getValue(this.lifespan, this.lifespanVariance);
            if (e.currentTime = 0, e.totalTime = a > 0 ? a : 0, !(0 >= a)) {
                e.x = i.getValue(this.emitterX, this.emitterXVariance), e.y = i.getValue(this.emitterY, this.emitterYVariance), e.startX = this.emitterX, e.startY = this.emitterY;
                var r = i.getValue(this.emitAngle, this.emitAngleVariance),
                    s = i.getValue(this.speed, this.speedVariance);
                e.velocityX = s * egret.NumberUtils.cos(r), e.velocityY = s * egret.NumberUtils.sin(r), e.radialAcceleration = i.getValue(this.radialAcceleration, this.radialAccelerationVariance), e.tangentialAcceleration = i.getValue(this.tangentialAcceleration, this.tangentialAccelerationVariance);
                var n = i.getValue(this.startSize, this.startSizeVariance);
                .1 > n && (n = .1);
                var o = i.getValue(this.endSize, this.endSizeVariance);
                .1 > o && (o = .1);
                var h = this.texture.textureWidth;
                e.scale = n / h, e.scaleDelta = (o - n) / a / h;
                var l = i.getValue(this.startRotation, this.startRotationVariance),
                    c = i.getValue(this.endRotation, this.endRotationVariance);
                e.rotation = l, e.rotationDelta = (c - l) / a;
                var p = i.getValue(this.startAlpha, this.startAlphaVariance),
                    u = i.getValue(this.endAlpha, this.endAlphaVariance);
                e.alpha = p, e.alphaDelta = (u - p) / a, e.blendMode = this.particleBlendMode
            }
        }, i.getValue = function(t, e) {
            return t + e * (2 * Math.random() - 1)
        }, i.prototype.advanceParticle = function(t, e) {
            var i = t;
            e /= 1e3;
            var a = i.totalTime - i.currentTime;
            e = a > e ? e : a, i.currentTime += e;
            var r = i.x - i.startX,
                s = i.y - i.startY,
                n = Math.sqrt(r * r + s * s);
            .01 > n && (n = .01);
            var o = r / n,
                h = s / n,
                l = o,
                c = h;
            o *= i.radialAcceleration, h *= i.radialAcceleration;
            var p = l;
            l = -c * i.tangentialAcceleration, c = p * i.tangentialAcceleration, i.velocityX += e * (this.gravityX + o + l), i.velocityY += e * (this.gravityY + h + c), i.x += i.velocityX * e, i.y += i.velocityY * e, i.scale += i.scaleDelta * e * 1e3, i.scale < 0 && (i.scale = 0), i.rotation += i.rotationDelta * e * 1e3, i.alpha += i.alphaDelta * e * 1e3
        }, i
    }(t.ParticleSystem);
    t.GravityParticleSystem = e, __reflect(e.prototype, "particle.GravityParticleSystem")
}(particle || (particle = {}));