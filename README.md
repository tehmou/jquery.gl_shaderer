jquery.gl_shaderer
==================

This jQuery plugin was originally made for easily using WebGL fragment shaders on a plain surface with textures.

It creates a canvas element and initialized WebGL on it. It takes shaders, textures and renderable vertices as parameters, but has defaults for everything except for fragment shaders.

A simple usage would be to try out a single black and white fragment shader with one texture:

    ...
    <head>
        <script type="text/javascript" src="lib/jquery-1.6.1.js"></script>
        <script type="text/javascript" src="jquery.gl_shaderer.js"></script>

        <script type="shader-fs" id="fs-bw">
            #ifdef GL_ES
            precision highp float;
            #endif

            varying vec2 xyPos;
            uniform vec2 resolution;
            uniform sampler2D tex0;

            void main(void) {
                vec4 o = texture2D(tex0, xyPos);
                float average = (o.r+o.g+o.b)/3.0;
                vec3 bw = vec3(average);
                gl_FragColor = vec4(bw, 1.0);
            }
        </script>

        <script type="text/javascript">
            $(function () {
                $(document.body).gl_shaderer({
                    adjustViewportToFitFirstTexture: true,
                    textureUrls: ["images/IMG_2273.JPG"],
                    fragmentShaders: [$("#fs-bw").text()]
                });
            });
        </script>
    ...


The default vertex shader provides the texture position in variable "xyPos" and gl_shaderer gives the uniform "resolution". Textures are loaded into tex0, tex1, ..., unless texturePrefix is overridden.

Default vertex shader (can be found inline in jquery.gl_shaderer.js):

    attribute vec3 position;

    // Our variable for passing the position to the fragment shaders.
    varying vec2 xyPos;

    void main(void) {
        xyPos = vec2(position.s*.5+.5,.5-position.t*.5);
        gl_Position = vec4(position.x, position.y, 0.0, 1.0);
    }


All of the default are as follows:

        viewportWidth: 640,
        viewportHeight: 480,
        adjustViewportToFitFirstTexture: false,
        uniforms: {},
        texturePrefix: "tex",
        useResolutionUniform: true,
        resolutionUniformName: "resolution",
        usePositionAttribute: true,
        positionAttributeName: "position",
        textureUrls: null,
        images: null,
        vertexShaderUrls: null,
        vertexShaders: [gl_shaderer.defaultVS],
        fragmentShaderUrls: null,
        fragmentShaders: [],