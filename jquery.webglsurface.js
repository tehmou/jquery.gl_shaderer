(function ($) {

    var webglsurface = function (options) {
        return this.each(function () {
            $.extend(options, { el: $(this) }, webglsurface.renderer);
            options.init();
        });
    };

    webglsurface.glShaderUtils = {
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

    webglsurface.glTextureUtils = {
        loadImageTexture: function (gl, url)
        {
            var that = this;
            var texture = gl.createTexture();
            var image = new Image();
            image.onload = function() { that.createGLTexture.apply(that, [gl, image, texture]); };
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

    webglsurface.renderer = ({
        shader: null,
        textures: [],

        init: function () {
            this.uniforms = this.uniforms || {};

            this.useResolutionUniform = this.hasOwnProperty("useResolutionUniform") ? this.useResolutionUniform : true;
            this.resolutionUniformName = this.resolutionUniformName || "resolution";
            this.usePositionAttribute = this.hasOwnProperty("usePositionAttribute") ? this.usePositionAttribute : true;
            this.positionAttributeName = this.positionAttributeName || "position";

            var that = this,
                thatRenderLoop = this.renderLoop,
                thatUpdateDimensions = this.updateDimensions;

            this.renderLoop = function () { thatRenderLoop.apply(that, arguments) };
            this.el.resize(function () { thatUpdateDimensions.apply(that, arguments); });

            this.updateDimensions();
            this.createGL();
            this.createProgram();
            this.createPlane();
            this.createTextures();
            this.renderLoop();
        },
        updateDimensions: function () {
            this.el[0].width = this.el.width();
            this.el[0].height = this.el.height();
            this.viewportWidth = this.el[0].width;
            this.viewportHeight = this.el[0].height;
            this.halfW = this.viewportWidth/2.0;
            this.halfH = this.viewportHeight/2.0;
        },
        createGL: function () {
            this.gl = this.el[0].getContext("experimental-webgl");
            this.gl.enable(this.gl.TEXTURE_2D);
            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        },
        createProgram: function () {
            this.shader = webglsurface.glShaderUtils.createShader(this.gl, this.fragmentShaders[0], this.vertexShaders[0]);
            this.gl.useProgram(this.shader);
            this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader, "position"));
           this.resetShaderMatrices();
        },
        resetShaderMatrices: function () {
            var m = mat4.create();
            mat4.identity(m);
            this.setShaderMVMatrix(m);
            this.setShaderPMatrix(m);
        },
        setShaderMVMatrix: function (matrix) {
            this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.shader, "uMVMatrix"), false, matrix);
        },
        setShaderPMatrix: function (matrix) {
            this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.shader, "uPMatrix"), false, matrix);
        },
        createPlane: function () {
            var vertices = new Float32Array([ -1.0,-1.0, 1.0,-1.0, -1.0,1.0, 1.0,-1.0, 1.0,1.0, -1.0,1.0]);
            this.mQuadVBO = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mQuadVBO);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        },
        createTextures: function () {
            this.textures = [];
            for (var i = 0; i < this.textureUrls.length; i++) {
                this.textures[i] = webglsurface.glTextureUtils.loadImageTexture(this.gl, this.textureUrls[i]);
            }
        },
        renderLoop: function () {
            requestAnimationFrame(this.renderLoop);
            this.preRender();
            this.actualRender();
        },
        preRender: function () {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mQuadVBO);
            this.gl.vertexAttribPointer(this.gl.getAttribLocation(this.shader, "position"), 2, this.gl.FLOAT, false, 0, 0);
        },
        actualRender: function () {
            var w = this.viewportWidth;
            var h = this.viewportHeight;
            this.gl.viewport(0, 0, w, h);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            if (!this.shader) {
                return;
            }

            this.gl.useProgram(this.shader);

            if (this.usePositionAttribute) {
                this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader, this.positionAttributeName));
            }

            if (this.useResolutionUniform) {
                this.gl.uniform2f(this.gl.getUniformLocation(this.shader, this.resolutionUniformName), w, h);
            }

            for (var uniformName in this.uniforms) {
                if (!this.uniforms.hasOwnProperty(uniformName)) {
                    continue;
                }
                var uniform = this.uniforms[uniformName];
                this.gl["uniform"+uniform.type](this.gl.getUniformLocation(this.shader, uniformName), uniform.value);
            }

            for (var i = 0; i < this.textures.length; i++) {
                this.gl.activeTexture(this.gl["TEXTURE"+i]);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
                this.gl.uniform1i(this.gl.getUniformLocation(this.shader, "tex"+i), i);
            }

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    });

    $.fn.webglsurface = webglsurface;

})(jQuery);