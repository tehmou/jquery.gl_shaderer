if (navigator.userAgent.indexOf("Safari") !== -1) {
    try {
        if (!document.createElement('canvas').getContext('experimental-webgl')) {
            $("#safari-warning").css("display", "block");
        }
    } catch (e) {
        $("#safari-warning").css("display", "block");
    }
}