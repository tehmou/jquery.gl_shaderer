(function ($) {

    var gl_shadered = function (options) {
        return this.each(function () {
            // Extend options with itself to restore all overridden values.
            $.extend(options, { el: this }, gl_shadered.renderer, $.extend({}, options));
            options.init();
            options.render();
        });
    };

    gl_shadered.renderer = ({
        
        uniforms: {},
        texturePrefix: "tex",
        useResolutionUniform: true,
        resolutionUniformName: "resolution",
        usePositionAttribute: true,
        positionAttributeName: "position",
        renderOnTextureLoad: true,

        gl: null,
        shader: null,
        textures: [],
        viewportWidth: 0,
        viewportHeight: 0,

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
            var $el = $(this.el);
            this.el.width = $el.width();
            this.el.height = $el.height();
            this.viewportWidth = this.el.width;
            this.viewportHeight = this.el.height;
        },
        createGL: function () {
            this.gl = this.el.getContext("experimental-webgl");
            this.gl.enable(this.gl.TEXTURE_2D);
            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        },
        createShaderProgram: function () {
            this.shader = gl_shadered.glShaderUtils.createShader(this.gl, this.fragmentShaders[0], this.vertexShaders[0]);
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
            for (var i = 0; i < this.textureUrls.length; i++) {
                this.textures[i] = gl_shadered.glTextureUtils.loadImageTexture(this.gl, this.textureUrls[i], this.renderOnTextureLoad && this.render);
            }
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
        createShader: function (gl, fragmentShaderCode, vertexShaderCode) {
            var tmpProgram = gl.createProgram(), vs, fs;
            try {
                vs = this.compileShader(gl, vertexShaderCode, gl.VERTEX_SHADER);
                fs = this.compileShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER);
            } catch (e) {
                gl.deleteProgram( tmpProgram );
                throw e;
            }
            gl.attachShader(tmpProgram, vs);
            gl.attachShader(tmpProgram, fs);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            gl.linkProgram(tmpProgram);
            return tmpProgram;
        },
        compileShader: function (gl, code, type) {
            var s = gl.createShader(type);
            gl.shaderSource(s, code);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            {
                throw "SHADER ERROR: " + gl.getShaderInfoLog(s);
            }
            return s;
        }
    };

    gl_shadered.glTextureUtils = {
        loadImageTexture: function (gl, url, callback)
        {
            var that = this;
            var texture = gl.createTexture();
            var image = new Image();
            image.onload = function() {
                that.createGLTexture.apply(that, [gl, image, texture]);
                if (callback) { callback(); }
            };
            image.src = url;
            return texture;
        },
        createGLTexture: function (gl, image, texture) {
            gl.enable(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    };

    $.fn.gl_shadered = gl_shadered;

})(jQuery);