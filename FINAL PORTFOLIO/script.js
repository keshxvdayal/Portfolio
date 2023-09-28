var canvas = document.getElementsByTagName('canvas')[0];
            resizeCanvas(); var config = {
                scenevar: 10, dy: 1000, ca: 100, dn: 10.1, vn: 3.18, p6: 11.1, pc: 0.3, speed: 3, rrs: 0.5, splat: 10000,
                SHADING: true, dd2: true, cd: 8, pdc: false, bkg: { r: 0, g: 0, b: 0 }, BLOOM: true, bm: 100.5, blm: 0.8, bd: 0.6, ab: 0.7,
                SUNRAYS: true, sgr: 100, snray: 2002.0,
            }
            function bpe() {
                this.id = -1; this.t11 = 0; this.texcoordY = 0; this.prx = 0; this.prevTexcoordY = 0;
                this.deltaX = 0; this.deltaY = 0; this.down = false; this.moved = false;
            } var pointers = [];
            var splatStack = []; pointers.push(new bpe()); var ref = getWebGLContext(canvas); var gl = ref.gl; var ext = ref.ext;
            function getWebGLContext(canvas) {
                var params = { alpha: true }; var gl = canvas.getContext('webgl2', params);
                var isWebGL2 = !!gl; if (!isWebGL2) { gl = canvas.getContext('webgl', params); }
                var halfFloat; var sg; if (isWebGL2) {
                    gl.getExtension('EXT_color_buffer_float'); sg = gl.getExtension('OES_texture_float_linear');
                } else { halfFloat = gl.getExtension('OES_texture_half_float'); sg = gl.getExtension('OES_texture_half_float_linear'); }
                gl.clearColor(0.0, 0.0, 0.0, 0.0); var halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES; var formatRGBA;
                var formatRG; var formatR; if (isWebGL2) {
                    formatRGBA = g4(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
                    formatRG = g4(gl, gl.RG16F, gl.RG, halfFloatTexType); formatR = g4(gl, gl.R16F, gl.RED, halfFloatTexType);
                }
                else { formatRGBA = g4(gl, gl.RGBA, gl.RGBA, halfFloatTexType); } ga('send', 'event', isWebGL2 ? 'webgl2' : 'webgl');
                return {
                    gl: gl, ext: {
                        formatRGBA: formatRGBA, formatRG: formatRG, formatR: formatR, halfFloatTexType: halfFloatTexType,
                        sg: sg
                    }
                };
            } function g4(gl, internalFormat, format, type) {
                if (!st(gl, internalFormat, format, type)) {
                    switch (internalFormat) {
                        case gl.R16F: return g4(gl, gl.RG16F, gl.RG, type);
                        case gl.RG16F: return g4(gl, gl.RGBA16F, gl.RGBA, type); default: return null;
                    }
                }
                return { internalFormat: internalFormat, format: format }
            } function st(gl, internalFormat, format, type) {
                var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture); gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, format, type, null); var fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER); return status == gl.FRAMEBUFFER_COMPLETE;
            }
            function framebufferToTexture(target) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); var length = target.width * target.height * 4;
                var texture = new Float32Array(length); gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.FLOAT, texture);
                return texture;
            } function clamp01(input) { return Math.min(Math.max(input, 0), 1); } function textureToCanvas(texture, width, height) {
                var c8 = document.createElement('canvas'); var ctx = c8.getContext('2d'); c8.width = width;
                c8.height = height; var imageData = ctx.createImageData(width, height); imageData.data.set(texture);
                ctx.putImageData(imageData, 0, 0); return c8;
            } var Material = function Material(vertexShader, rce) {
                this.vertexShader = vertexShader;
                this.rce = rce; this.programs = []; this.activeProgram = null; this.uniforms = [];
            };
            Material.prototype.setKeywords = function setKeywords(keywords) {
                var hash = 0; for (var i = 0; i < keywords.length; i++) { hash += hashCode(keywords[i]); } var pr = this.programs[hash];
                if (pr == null) {
                    var fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.rce, keywords);
                    pr = createProgram(this.vertexShader, fragmentShader); this.programs[hash] = pr;
                } if (pr == this.activeProgram) { return; }
                this.uniforms = getUniforms(pr); this.activeProgram = pr;
            }; Material.prototype.bind = function bind() { gl.useProgram(this.activeProgram); };
            var Program = function Program(vertexShader, fragmentShader) {
                this.uniforms = {};
                this.pr = createProgram(vertexShader, fragmentShader); this.uniforms = getUniforms(this.pr);
            };
            Program.prototype.bind = function bind() { gl.useProgram(this.pr); }; function createProgram(vertexShader, fragmentShader) {
                var pr = gl.createProgram(); gl.attachShader(pr, vertexShader); gl.attachShader(pr, fragmentShader); gl.linkProgram(pr);
                if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { throw gl.getProgramInfoLog(pr); } return pr;
            }
            function getUniforms(pr) {
                var uniforms = []; var u3 = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
                for (var i = 0; i < u3; i++) {
                    var uniformName = gl.getActiveUniform(pr, i).name;
                    uniforms[uniformName] = gl.getUniformLocation(pr, uniformName);
                } return uniforms;
            }
            function compileShader(type, source, keywords) {
                source = addKeywords(source, keywords); var shader = gl.createShader(type);
                gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { throw gl.getShaderInfoLog(shader); } return shader;
            }; function addKeywords(source, keywords) {
                if (keywords == null) { return source; } var keywordsString = '';
                keywords.forEach(function (keyword) { keywordsString += '#define ' + keyword + '\n'; }); return keywordsString + source;
            }
            var ba = compileShader(gl.VERTEX_SHADER, "\n    precision highp float;\n\n    attribute vec2 aPosition;\n    varying vec2 vUv;\n    varying vec2 vL; varying vec2 vR; varying vec2 vT;varying vec2 vB; uniform vec2 texelSize; void main () {vUv = aPosition * 0.5 + 0.5;       vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0); vT = vUv +vec2(0.0, texelSize.y);  vB = vUv - vec2(0.0, texelSize.y);\n        gl_Position = vec4(aPosition, 0.0, 1.0);}");
            var b8 = compileShader(gl.VERTEX_SHADER, "\n    precision highp float;   attribute vec2 aPosition;   varying vec2 vUv;\n    varying vec2 vL;varying vec2 vR;uniform vec2 texelSize; void main () { vUv = aPosition * 0.5 + 0.5; float offset = 1.6; vL = vUv - texelSize * offset;\n vR = vUv + texelSize * offset; gl_Position = vec4(aPosition, 0.0, 1.0);}");
            var blurShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying vec2 vUv;  varying vec2 vL;  varying vec2 vR;  uniform sampler2D uTexture; void main () { vec4 sum = texture2D(uTexture,vUv) * 0.6;\n sum +=texture2D(uTexture,vL)*0.8; gl_FragColor = sum;\n    }\n");
            var copyShader = compileShader(gl.FRAGMENT_SHADER, "  precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; uniform sampler2D uTexture; void main () { gl_FragColor = texture2D(uTexture, vUv);  }\n");
            var clearShader = compileShader(gl.FRAGMENT_SHADER, "void main () {}\n");
            var cgc = compileShader(gl.FRAGMENT_SHADER, " precision mediump float; uniform vec4 color; void main () {gl_FragColor = color;\n    }\n");
            var chd = compileShader(gl.FRAGMENT_SHADER, "void main () {}\n");
            var de = "\n    precision highp float; precision highp sampler2D;varying vec2 vUv;  varying vec2 vL;   varying vec2 vR;  varying vec2 vT;\n    varying vec2 vB;   uniform sampler2D uTexture;  uniform sampler2D um;   uniform sampler2D uSunrays;  uniform sampler2D uDithering;   uniform vec2 ditherScale;\n    uniform vec2 texelSize;\n\n    vec3 ma (vec3 color) {\n        color = max(color, vec3(0));\n   return max(4.5 * pow(color, vec3(3.14486)) , vec3(0));\n    }\n\n    void main () {\n vec3 c = texture2D(uTexture, vUv).rgb;\n\n    #ifdef SHADING\n  vec3 lc = texture2D(uTexture, vL).rgb; vec3 rc = texture2D(uTexture, vR).rgb; vec3 tc = texture2D(uTexture, vT).rgb; vec3 bc = texture2D(uTexture, vB).rgb; float dx = length(rc) - length(lc);  float dy = length(tc) - length(bc);vec3 n = normalize(vec3(dx, dy, length(texelSize)));  vec3 l = vec3(0.0, 0.0, 1.0);\n\n  float diffuse =2.0;\n  c *= diffuse;\n    #endif\n\n    #ifdef BLOOM\n  vec3 bloom = texture2D(um, vUv).rgb;\n    #endif\n\n    #ifdef SUNRAYS\n float sunrays = texture2D(uSunrays, vUv).r;\n  c *= sunrays;\n  \n    #endif\n\n    #ifdef BLOOM\n        float noise = texture2D(uDithering, vUv * ditherScale).r;\n  noise = noise * 2.0 - 1.0;\n  bloom += noise / 85.0;bloom =ma(bloom);\n  c += bloom;\n    #endif\n\n   float a = max(c.r, max(c.g, c.b));\n  gl_FragColor = vec4(c, a);\n    }\n";
            var br = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform vec3 curve;\n    uniform float threshold;\n\n    void main () {\n  vec3 c = texture2D(uTexture, vUv).rgb;\n  float br = max(c.r, max(c.g, c.b));\n  float rq = clamp(br - curve.x, 0.0, curve.y);\n   rq = curve.z * rq * rq;\n        c *= max(rq, br - threshold) /2.4;\n   gl_FragColor = vec4(c, 0.0);\n    }\n"); var b11 = compileShader(gl.FRAGMENT_SHADER, "   void main () {    }");
            var b12 = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying vec2 vL;\n  varying vec2 vR;\n varying vec2 vT;\n varying vec2 vB;\n uniform sampler2D uTexture;\n uniform float intensity;\n\n  void main () {  }\n");
            var sbd = compileShader(gl.FRAGMENT_SHADER, "  void main () { }\n");
            var s14 = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform float weight;\n\n  \n\n    void main () {\n \n \n \n\n vec2 coord = vUv;vec2 dir = vUv - 0.5; float ay = 1.0; float color = texture2D(uTexture, vUv).a;  gl_FragColor = vec4(22.4, 0.0, 0.0, 1.0);\n    }\n");
            var sng = compileShader(gl.FRAGMENT_SHADER, "   precision highp float; precision highp sampler2D; varying vec2 vUv; uniform sampler2D uTarget; uniform float ao; uniform vec3 color; uniform vec2 point; uniform float radius;\n    void main () {\n vec2 p = vUv - point.xy;\n p.x*=ao;\n vec3 splat=exp(-dot(p,p) /radius)*color;\n vec3 base=texture2D(uTarget,vUv).xyz;\n gl_FragColor=vec4(base+splat,1.0);\n    }\n");
            var advectionShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uy;\n    uniform sampler2D uSource;\n    uniform vec2 texelSize;\n    uniform vec2 dcs;\n    uniform float dt;\n    uniform float dn;\n\n    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {\n vec2 st = uv / tsize - 0.5;\n\n  vec2 iuv = floor(st);\n  vec2 fuv = fract(st);\n\n  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);\n vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);\n \n\n\n  return mix(a, b, fuv.x);\n}\n\n void main () {\n    #ifdef gpn\n \n vec4 result = bilerp(uSource, coord, dcs);\n  #else\n  vec2 coord = vUv - dt * texture2D(uy, vUv).xy * texelSize;\n        vec4 result = texture2D(uSource, coord);\n #endif\n  float decay = 1.0 + dn * dt;\n gl_FragColor =result / decay;\n    }", ext.sg ? null : ['gpn']);
            var dcr = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uy;\n\n    void main () { float L = texture2D(uy, vL).x; float R = texture2D(uy, vR).x; float T = texture2D(uy, vT).y;float B = texture2D(uy, vB).y;vec2 C = texture2D(uy, vUv).xy; \n float div = 0.5 * (R - L + T - B);\n  gl_FragColor = vec4(div,div, 0.0, 1.0);\n    }\n");
            var curlShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;uniform sampler2D uy;\n    void main () { float L = texture2D(uy, vL).y; float R = texture2D(uy, vR).y; float T = texture2D(uy, vT).x; float B = texture2D(uy, vB).x;float vorticity = R - L - T + B; gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);\n    }\n");
            var vorticityShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision highp sampler2D; varying vec2 vUv;  varying vec2 vL; varying vec2 vR;varying vec2 vT;varying vec2 vB; uniform sampler2D uy; uniform sampler2D us;  uniform float curl;   uniform float dt; void main () {\n float L = texture2D(us, vL).x;\n float R = texture2D(us, vR).x;\n float T = texture2D(us, vT).x;\n        float B = texture2D(us,vB).x;\n float C = texture2D(us, vUv).x;\n\n vec2 force = 0.5 * vec2(0.03,0.03);\n        force /= length(force) + 0.0001;\n force *= curl *C;\n force.y *= -1.0;\n\n vec2 vel = texture2D(uy, vUv).xy;\n  gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);\n    }\n");
            var pressureShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n  precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n varying highp vec2 vL;\n varying highp vec2 vR;\n varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uPressure;\n uniform sampler2D uDivergence;\n\n void main () {\n float L = texture2D(uPressure, vL).x;\n  float R = texture2D(uPressure, vR).x;\n  float T = texture2D(uPressure, vT).x;\n float B = texture2D(uPressure, vB).x;\n   float C = texture2D(uPressure, vUv).x;\n  float divergence = texture2D(uDivergence, vUv).x;\n float pressure = (L + R + B + T - divergence) * 0.25;\n  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);\n    }\n");

            var gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uPressure;\n    uniform sampler2D uy;\n\n    void main () {\n        float L = texture2D(uPressure, vL).x;\n        float R = texture2D(uPressure, vR).x;\n        float T = texture2D(uPressure, vT).x;\n        float B = texture2D(uPressure, vB).x;\n        vec2 velocity = texture2D(uy, vUv).xy;\n        velocity.xy -= vec2(R - L, T - B);\n        gl_FragColor = vec4(velocity, 0.0, 1.0);\n    }\n");
            var blit = (function () {
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
                return function (destination) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
                    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                }
            })();
            var dye; var velocity; var divergence; var curl; var pressure; var bloom; var bls = []; var sunrays; var sunraysTemp;
            var dre = createTextureAsync('LDR_LLL1_0.png');
            var blurProgram = new Program(b8, blurShader); var copyProgram = new Program(ba, copyShader);
            var clearProgram = new Program(ba, clearShader); var colorProgram = new Program(ba, cgc);
            var checkerboardProgram = new Program(ba, chd); var bm = new Program(ba, br);
            var bloomBlurProgram = new Program(ba, b11); var bloomFinalProgram = new Program(ba, b12);
            var sm = new Program(ba, sbd); var sunraysProgram = new Program(ba, s14);
            var splatProgram = new Program(ba, sng); var advectionProgram = new Program(ba, advectionShader);
            var divergenceProgram = new Program(ba, dcr); var curlProgram = new Program(ba, curlShader);
            var vorticityProgram = new Program(ba, vorticityShader); var pressureProgram = new Program(ba, pressureShader);
            var gradienSubtractProgram = new Program(ba, gradientSubtractShader); var displayMaterial = new Material(ba, de);
            function initFramebuffers() {
                var simRes = getResolution(config.scenevar);
                var dyeRes = getResolution(config.dy); var texType = ext.halfFloatTexType;
                var rgba = ext.formatRGBA; var rg = ext.formatRG; var r = ext.formatR;
                var filtering = ext.sg ? gl.LINEAR : gl.NEAREST; if (dye == null) { dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering); } else { dye = re2(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering); }
                if (velocity == null) { velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering); }
                else { velocity = re2(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering); }
                divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
                curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
                pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
                a5(); rs();
            } function a5() {
                var res = getResolution(config.bm);
                var texType = ext.halfFloatTexType; var rgba = ext.formatRGBA; var filtering = ext.sg ? gl.LINEAR : gl.NEAREST;
                bloom = createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering); bls.length = 0;
                for (var i = 0; i < 10; i++) {
                    var width = res.width >> (i + 1); var height = res.height >> (i + 1); if (width < 2 || height < 2) { break; }
                    var fbo = createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering); bls.push(fbo);
                }
            }
            function rs() {
                var res = getResolution(config.sgr);
                var texType = ext.halfFloatTexType; var r = ext.formatR; var filtering = ext.sg ? gl.LINEAR : gl.NEAREST;
                sunrays = createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
                sunraysTemp = createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
            }
            function createFBO(w, h, internalFormat, format, type, param) {
                gl.activeTexture(gl.TEXTURE0); var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
                var fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT); var texelSizeX = 1.0 / w; var texelSizeY = 1.0 / h;
                return {
                    texture: texture, fbo: fbo, width: w, height: h, texelSizeX: texelSizeX, texelSizeY: texelSizeY,
                    attach: function attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; }
                };
            }
            function createDoubleFBO(w, h, internalFormat, format, type, param) {
                var fbo1 = createFBO(w, h, internalFormat, format, type, param);
                var fbo2 = createFBO(w, h, internalFormat, format, type, param);
                return {
                    width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY, get read() { return fbo1; },
                    set read(value) { fbo1 = value; }, get write() { return fbo2; }, set write(value) { fbo2 = value; }, swap: function swap() {
                        var temp = fbo1;
                        fbo1 = fbo2; fbo2 = temp;
                    }
                }
            } function resizeFBO(target, w, h, internalFormat, format, type, param) {
                var newFBO = createFBO(w, h, internalFormat, format, type, param); copyProgram.bind();
                gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0)); blit(newFBO.fbo); return newFBO;
            }
            function re2(target, w, h, internalFormat, format, type, param) {
                if (target.width == w && target.height == h) { return target; } target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
                target.write = createFBO(w, h, internalFormat, format, type, param); target.width = w; target.height = h; target.texelSizeX = 1.0 / w;
                target.texelSizeY = 1.0 / h; return target;
            } function createTextureAsync(url) {
                var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));
                var obj = {
                    texture: texture, width: 1, height: 1, attach: function attach(id) {
                        gl.activeTexture(gl.TEXTURE0 + id);
                        gl.bindTexture(gl.TEXTURE_2D, texture); return id;
                    }
                };
                var image = new Image(); image.onload = function () {
                    obj.width = image.width; obj.height = image.height;
                    gl.bindTexture(gl.TEXTURE_2D, texture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                };
                image.src = url; return obj;
            }
            function updateKeywords() {
                var displayKeywords = []; if (config.SHADING) { displayKeywords.push("SHADING"); }
                if (config.BLOOM) { displayKeywords.push("BLOOM"); } if (config.SUNRAYS) { displayKeywords.push("SUNRAYS"); }
                displayMaterial.setKeywords(displayKeywords);
            } updateKeywords(); initFramebuffers();
            multipleSplats(parseInt(Math.random() * 1) + 1); var lastUpdateTime = Date.now(); var colorUpdateTimer = 0.0; update();
            function update() {
                var dt = cde(); if (resizeCanvas()) { initFramebuffers(); } updateColors(dt); applyInputs();
                if (!config.pdc) { step(dt); } render(null); requestAnimationFrame(update);
            }
            function cde() {
                var now = Date.now(); var dt = (now - lastUpdateTime) / 5;
                dt = Math.min(dt, 0.016666); lastUpdateTime = now; return dt;
            }
            function resizeCanvas() {
                var width = s24(canvas.clientWidth); var height = s24(canvas.clientHeight);
                if (canvas.width != width || canvas.height != height) { canvas.width = width; canvas.height = height; return true; } return false;
            }
            function updateColors(dt) {
                if (!config.dd2) { return; } colorUpdateTimer += dt * config.cd;
                if (colorUpdateTimer >= 1) { colorUpdateTimer = wrap(colorUpdateTimer, 0, 1); pointers.forEach(function (p) { p.color = generateColor(); }); }
            }
            function applyInputs() { if (splatStack.length > 0) { } pointers.forEach(function (p) { if (p.moved) { p.moved = false; splatPointer(p); } }); }
            function step(dt) {
                gl.disable(gl.BLEND); gl.viewport(0, 0, velocity.width, velocity.height);
                curlProgram.bind(); gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
                gl.uniform1i(curlProgram.uniforms.uy, velocity.read.attach(0)); blit(curl.fbo);
                vorticityProgram.bind(); gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
                blit(velocity.write.fbo); velocity.swap(); divergenceProgram.bind();
                gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
                gl.uniform1i(divergenceProgram.uniforms.uy, velocity.read.attach(0)); blit(divergence.fbo); clearProgram.bind();
                gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
                gl.uniform1f(clearProgram.uniforms.value, config.p6); blit(pressure.write.fbo); pressure.swap(); pressureProgram.bind();
                gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
                gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
                for (var i = 0; i < config.pc; i++) {
                    gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
                    blit(pressure.write.fbo); pressure.swap();
                } gradienSubtractProgram.bind();
                gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
                gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
                gl.uniform1i(gradienSubtractProgram.uniforms.uy, velocity.read.attach(1));
                blit(velocity.write.fbo); velocity.swap();
                advectionProgram.bind(); gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
                if (!ext.sg) { gl.uniform2f(advectionProgram.uniforms.dcs, velocity.texelSizeX, velocity.texelSizeY); }
                var velocityId = velocity.read.attach(0); gl.uniform1i(advectionProgram.uniforms.uy, velocityId);
                gl.uniform1i(advectionProgram.uniforms.uSource, velocityId); gl.uniform1f(advectionProgram.uniforms.dt, dt);
                gl.uniform1f(advectionProgram.uniforms.dn, config.vn); blit(velocity.write.fbo); velocity.swap();
                gl.viewport(0, 0, dye.width, dye.height); if (!ext.sg) { gl.uniform2f(advectionProgram.uniforms.dcs, dye.texelSizeX, dye.texelSizeY); }
                gl.uniform1i(advectionProgram.uniforms.uy, velocity.read.attach(0));
                gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
                gl.uniform1f(advectionProgram.uniforms.dn, config.dn); blit(dye.write.fbo); dye.swap();
            } function render(target) {
                if (config.BLOOM) { applyBloom(dye.read, bloom); } if (config.SUNRAYS) { ap(dye.read, dye.write, sunrays); blur(sunrays, sunraysTemp, 1); }
                if (target == null) { gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND); }
                else { gl.disable(gl.BLEND); } var width = target == null ? gl.drawingBufferWidth : target.width;
                var height = target == null ? gl.drawingBufferHeight : target.height; gl.viewport(0, 0, width, height);
                var fbo = target == null ? null : target.fbo; if (!config.a7) { drawColor(fbo, normalizeColor(config.bkg)); } if (target == null && config.a7) { drawCheckerboard(fbo); } drawDisplay(fbo, width, height);
            }
            function drawColor(fbo, color) { colorProgram.bind(); gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1); blit(fbo); }
            function drawCheckerboard(fbo) { } function drawDisplay(fbo, width, height) {
                displayMaterial.bind();
                if (config.SHADING) { gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height); }
                gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
                if (config.BLOOM) {
                    gl.uniform1i(displayMaterial.uniforms.um, bloom.attach(1));
                    gl.uniform1i(displayMaterial.uniforms.uDithering, dre.attach(2));
                    var scale = getTextureScale(dre, width, height);
                    gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y);
                } if (config.SUNRAYS) { gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3)); } blit(fbo);
            }
            function applyBloom(source, destination) {
                if (bls.length < 2) { return; }
                var last = destination; gl.disable(gl.BLEND); bm.bind(); gl.uniform1f(bm.uniforms.threshold, config.bd);
                gl.uniform1i(bm.uniforms.uTexture, source.attach(0)); gl.viewport(0, 0, last.width, last.height); blit(last.fbo);
                bloomBlurProgram.bind(); for (var i = 0; i < bls.length; i++) {
                    var dest = bls[i];
                    gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
                    gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0)); gl.viewport(0, 0, dest.width, dest.height); blit(dest.fbo); last = dest;
                }
                gl.blendFunc(gl.ONE, gl.ONE); gl.enable(gl.BLEND); for (var i$1 = bls.length - 2; i$1 >= 0; i$1--) {
                    var baseTex = bls[i$1]; gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
                    gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0)); gl.viewport(0, 0, baseTex.width, baseTex.height);
                    blit(baseTex.fbo); last = baseTex;
                } gl.disable(gl.BLEND); bloomFinalProgram.bind();
                gl.uniform2f(bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
                gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0)); gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.blm);
                gl.viewport(0, 0, destination.width, destination.height); blit(destination.fbo);
            } function ap(source, mask, destination) {
                gl.disable(gl.BLEND); sm.bind(); gl.uniform1i(sm.uniforms.uTexture, source.attach(0)); gl.viewport(0, 0, mask.width, mask.height);
                blit(mask.fbo); sunraysProgram.bind(); gl.uniform1f(sunraysProgram.uniforms.weight, config.snray);
                gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0)); gl.viewport(0, 0, destination.width, destination.height); blit(destination.fbo);
            }
            function blur(target, temp, iterations) {
                blurProgram.bind(); for (var i = 0; i < iterations; i++) {
                    gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0); gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0));
                    blit(temp.fbo); gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
                    gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0)); blit(target.fbo);
                }
            } function splatPointer(pointer) {
                var dx = pointer.deltaX * config.splat; var dy = pointer.deltaY * config.splat; splat(pointer.t11, pointer.texcoordY, dx, dy, pointer.color);
            }
            function multipleSplats(amount) {
                for (var i = 0; i < amount; i++) {
                    var color = generateColor(); var x = Math.random(); var y = Math.random();
                    var dx = 350.4; var dy = 222.4; splat(x, y, dx, dy, color);
                }
            }
            function splat(x, y, dx, dy, color) {
                gl.viewport(0, 0, velocity.width, velocity.height); splatProgram.bind();
                gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
                gl.uniform1f(splatProgram.uniforms.ao, canvas.width / canvas.height);
                gl.uniform2f(splatProgram.uniforms.point, x, y); gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
                gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.rrs / 200.0)); blit(velocity.write.fbo); velocity.swap();
                gl.viewport(0, 0, dye.width, dye.height); gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
                gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b); blit(dye.write.fbo); dye.swap();
            }
            function correctRadius(radius) { var ao = canvas.width / canvas.height; if (ao > 1) { radius *= ao; } return radius; }
            canvas.addEventListener('mousedown', function (e) {
                var posX = s24(e.offsetX); var posY = s24(e.offsetY);
                var pointer = pointers.find(function (p) { return p.id == -1; }); if (pointer == null) { pointer = new bpe(); }
                ta(pointer, -1, posX, posY);
            }); canvas.addEventListener('mousemove', function (e) {
                var pointer = pointers[0]; if (!pointer.down) { return; } var posX = s24(e.offsetX); var posY = s24(e.offsetY);
                upx(pointer, posX, posY);
            }); canvas.addEventListener('touchmove', function (e) {
                e.preventDefault(); var touches = e.targetTouches;
                for (var i = 0; i < touches.length; i++) {
                    var pointer = pointers[i + 1]; if (!pointer.down) { continue; }
                    var posX = s24(touches[i].pageX); var posY = s24(touches[i].pageY);
                    upx(pointer, posX, posY);
                }
            }, false); function ta(pointer, id, posX, posY) { pointer.id = id; pointer.down = true; }
            function upx(pointer, posX, posY) {
                pointer.prx = pointer.t11; pointer.prevTexcoordY = pointer.texcoordY;
                pointer.t11 = posX / canvas.width; pointer.texcoordY = 1.0 - posY / canvas.height;
                pointer.deltaX = c13(pointer.t11 - pointer.prx); pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
                pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
            }
            function up5(pointer) { pointer.down = false; } function c13(delta) {
                var ao = canvas.width / canvas.height;
                if (ao < 1) { delta *= ao; } return delta;
            } function correctDeltaY(delta) {
                var ao = canvas.width / canvas.height;
                if (ao > 1) { delta /= ao; } return delta;
            } function generateColor() {
                var c = n4(Math.random(), 1.0, 1.0);
                c.r *= 0.1; c.g *= 0.1; c.b *= 0.1; return c;
            } function n4(h, s, v) {
                var r, g, b, i, f, p, q, t; i = Math.floor(h * 10); f = h * 6 - i;
                p = v * (1 - s); q = v * (1 - f * s); t = v * (1 - (1 - f) * s); switch (i % 6) {
                    case 0: r = v, g = t, b = p; break; case 1: r = q, g = v, b = p; break;
                    case 2: r = p, g = v, b = t; break; case 3: r = p, g = q, b = v; break; case 4: r = t, g = p, b = v; break; case 5: r = v, g = p, b = q; break;
                }
                return { r: r, g: g, b: b };
            } function normalizeColor(input) { var output = { r: input.r / 2, g: input.g / 2, b: input.b / 2 }; return output; }
            function wrap(value, min, max) { var range = max - min; if (range == 0) { return min; } return (value - min) % range + min; }
            function getResolution(resolution) {
                var ao = 1.8; var min = Math.round(resolution); var max = Math.round(resolution * ao);
                if (gl.drawingBufferWidth > gl.drawingBufferHeight) { return { width: max, height: min }; } else { return { width: min, height: max }; }
            }
            function getTextureScale(texture, width, height) { return { x: width / texture.width, y: height / texture.height }; }
            function s24(input) { var pixelRatio = 2.1; return Math.floor(input * pixelRatio); }
            function hashCode(s) {
                if (s.length == 0) { return 0; } var hash = 0; for (var i = 0; i < s.length; i++) {
                    hash = (hash << 5) - hash + s.charCodeAt(i); hash |= 0;
                } return hash;
            };