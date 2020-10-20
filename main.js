var stage = new Stage();
var input = new Input();
input.init(function() {
    stage.init(document.getElementById("canvas"), input);
});


var rotateX = document.getElementById("rotateX");
rotateX.addEventListener('input', function() {
    stage.setRotateX(rotateX.value);
});
var rotateY = document.getElementById("rotateY");
rotateY.addEventListener('input', function() {
    stage.setRotateY(rotateY.value);
});
var rotateZ = document.getElementById("rotateZ");
rotateZ.addEventListener('input', function() {
    stage.setRotateZ(rotateZ.value);
});
var fullscreen = document.getElementById("fullscreen");
fullscreen.addEventListener('click', function() {
    document.getElementById("canvas").requestFullscreen();
});

var switchVis = document.getElementById("switch-vis");
switchVis.addEventListener('click', function() {
    stage.next();
});

