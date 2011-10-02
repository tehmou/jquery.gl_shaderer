glShaderUtils = {
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