glTextureUtils = {
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