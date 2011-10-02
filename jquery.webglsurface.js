(function ($) {

    var glShaderUtils = {
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

    var glTextureUtils = {
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

    var renderer = ({
        image2Url: "images/IMG_2235.JPG",
        image1Url: "images/IMG_2273.JPG",
        image3Url: "images/burn3.png",
        fragmentShaders: [$("#shader-fs").html()],
        vertexShaders: [$("#shader-vs").html()],
        shader: null,

        init: function () {
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
            this.shader = glShaderUtils.createShader(this.gl, this.fragmentShaders[0], this.vertexShaders[0]);
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
            this.texture1 = glTextureUtils.loadImageTexture(this.gl, this.image1Url);
            this.texture2 = glTextureUtils.loadImageTexture(this.gl, this.image2Url);
            this.texture3 = glTextureUtils.loadImageTexture(this.gl, this.image3Url);
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

            if (!this.shader || !this.texture1 || !this.texture2) {
                return;
            }

            this.gl.useProgram(this.shader);
            this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader, "position"));

            this.gl.uniform2f(this.gl.getUniformLocation(this.shader, "resolution"), w, h);
            this.gl.uniform1f(this.gl.getUniformLocation(this.shader, "ratio"), this.ratio);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture1);
            this.gl.uniform1i(this.gl.getUniformLocation(this.shader, "tex0"), 0);

            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture2);
            this.gl.uniform1i(this.gl.getUniformLocation(this.shader, "tex1"), 1);

            this.gl.activeTexture(this.gl.TEXTURE2);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture3);
            this.gl.uniform1i(this.gl.getUniformLocation(this.shader, "tex2"), 2);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    });

    $.fn.webglsurface = function (options) {
        return this.each(function () {
            $.extend(options, { el: $(this) }, renderer);
            options.init();
        });
    };

})(jQuery);