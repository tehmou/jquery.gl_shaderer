(function ($) {

    var gl_shadered = function (options) {
        return this.each(function () {
            var $this = $(this),
                canvas = options.el;
            try {
                // Create canvas if one was not specified in options.
                if (!canvas) {
                    canvas = $("<canvas></canvas>")[0];
                    $this.append(canvas);
                }
                // Extend options with itself to restore all overridden values.
                $.extend(options, { el: canvas }, gl_shadered.renderer, $.extend({}, options));
                options.init();
                options.render();
            } catch (e) {
                $(canvas).remove();
                $this.append("<pre>" + e + "</pre>")
            }
        });
    };

    gl_shadered.defaultVS = "" +
            "attribute vec3 position;\n" +
            "\n" +
            "// Our variable for passing the position to the fragment shaders.\n" +
            "varying vec2 xyPos;\n" +
            "\n" +
            "void main(void) {\n" +
            "    xyPos = vec2(position.s*.5+.5,.5-position.t*.5);\n" +
            "    gl_Position = vec4(position.x, position.y, 0.0, 1.0);\n" +
            "}";

    gl_shadered.renderer = ({

        viewportWidth: 640,
        viewportHeight: 480,
        uniforms: {},
        texturePrefix: "tex",
        useResolutionUniform: true,
        resolutionUniformName: "resolution",
        usePositionAttribute: true,
        positionAttributeName: "position",
        vertexShaders: [gl_shadered.defaultVS],
        fragmentShaders: [],

        gl: null,
        shader: null,
        textures: [],

        init: function () {
            this.bindRender();
            this.updateDimensions();
            this.createGL();
            this.createShaderProgram();
            if (!this.vertices) {
                this.createPlane();
            }
            this.createVertexBuffer();
            this.createTextures();
        },
        bindRender: function () {
            var that = this, thisRender = this.render;
            this.render = function () { thisRender.apply(that, arguments); };
        },
        updateDimensions: function () {
            this.el.width = this.viewportWidth;
            this.el.height = this.viewportHeight;
        },
        createGL: function () {
            this.gl = this.el.getContext("experimental-webgl");
            if (!this.gl) {
                throw "WebGL not available";
            }
            this.gl.enable(this.gl.TEXTURE_2D);
            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        },
        createShaderProgram: function () {
            var shader = gl_shadered.glShaderUtils.createProgram(this.gl,  this.vertexShaders, this.fragmentShaders);
            this.attachShaderProgram(shader)
        },
        attachShaderProgram: function (shader) {
            this.shader = shader;
            this.gl.useProgram(this.shader);
            this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader, "position"));
        },
        createPlane: function () {
            this.vertices = new Float32Array([ -1.0,-1.0, 1.0,-1.0, -1.0,1.0, 1.0,-1.0, 1.0,1.0, -1.0,1.0]);
        },
        createVertexBuffer: function () {
            this.vertexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);
        },
        createTextures: function () {
            this.textures = [];
            for (var i = 0; i < this.images.length; i++) {
                this.textures[i] = this.createTexture(this.images[i]);
            }
        },
        createTexture: function (image) {
            var gl = this.gl, texture = gl.createTexture();
            gl.enable(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
            return texture;
        },
        render: function () {
            this.preRender();
            this.actualRender();
        },
        preRender: function () {
            this.setupViewport();
            this.setupShader();
        },
        setupViewport: function () {
            this.gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        },
        setupShader: function () {
            if (this.shader) {
                this.gl.useProgram(this.shader);
                this.setupAttributes();
                this.setupUniforms();
                this.setupTextures();
            }
        },
        setupAttributes: function () {
            if (this.usePositionAttribute) {
                this.gl.vertexAttribPointer(this.gl.getAttribLocation(this.shader, this.positionAttributeName), 2, this.gl.FLOAT, false, 0, 0);
            }
            if (this.useResolutionUniform) {
                this.gl.uniform2f(this.gl.getUniformLocation(this.shader, this.resolutionUniformName), this.viewportWidth, this.viewportHeight);
            }
        },
        setupUniforms: function () {
            for (var uniformName in this.uniforms) {
                if (!this.uniforms.hasOwnProperty(uniformName)) {
                    continue;
                }
                var uniform = this.uniforms[uniformName];
                this.gl["uniform"+uniform.type](this.gl.getUniformLocation(this.shader, uniformName), uniform.value);
            }
        },
        setupTextures: function () {
            for (var i = 0; i < this.textures.length; i++) {
                this.gl.activeTexture(this.gl["TEXTURE"+i]);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
                this.gl.uniform1i(this.gl.getUniformLocation(this.shader, this.texturePrefix+i), i);
            }
        },
        actualRender: function () {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length/2);
        }
    });

    gl_shadered.glShaderUtils = {
        createProgram: function (gl, vertexShaderCodes, fragmentShaderCodes) {
            var i, tmpProgram = gl.createProgram(), vertexShaders = [], fragmentShaders = [];
            try {
                for (i = 0; i < vertexShaderCodes.length; i++) {
                    vertexShaders.push(this.compileShader(gl, vertexShaderCodes[i], gl.VERTEX_SHADER));
                }
                for (i = 0; i < fragmentShaderCodes.length; i++) {
                    fragmentShaders.push(this.compileShader(gl, fragmentShaderCodes[i], gl.FRAGMENT_SHADER));
                }
            } catch (e) {
                gl.deleteProgram( tmpProgram );
                throw e;
            }
            for (i = 0; i < vertexShaders.length; i++) {
                var vs = vertexShaders[i];
                gl.attachShader(tmpProgram, vs);
                gl.deleteShader(vs);
            }
            for (i = 0; i < fragmentShaders.length; i++) {
                var fs = fragmentShaders[i];
                gl.attachShader(tmpProgram, fs);
                gl.deleteShader(fs);
            }
            gl.linkProgram(tmpProgram);
            return tmpProgram;
        },
        compileShader: function (gl, code, type) {
            var s = gl.createShader(type);
            gl.shaderSource(s, code);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                throw "SHADER ERROR: " + gl.getShaderInfoLog(s);
            }
            return s;
        }
    };

    gl_shadered.loadImages = function (urls, callback) {
        var images = [], imagesToLoad = urls.length;
        for (var i = 0; i < urls.length; i++) {
            (function () {
                var index = i, image = new Image();
                image.onload = function() {
                    images[index] = image;
                    if (--imagesToLoad <= 0) {
                        callback(images)
                    }
                };
                image.src = urls[i];
            })();
        }
    };

    $.fn.gl_shadered = gl_shadered;

})(jQuery);