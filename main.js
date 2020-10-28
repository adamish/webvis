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

var sizeCanvasToScreen = function() {
	console.log("screen resize");
	var canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
var fullscreen = document.getElementById("fullscreen");
fullscreen.addEventListener('click', function() {
	var canvas = document.getElementById("canvas");
	sizeCanvasToScreen();
    canvas.requestFullscreen();
});

window.addEventListener("resize", sizeCanvasToScreen, false);


var switchVis = document.getElementById("switch-vis");
switchVis.addEventListener('click', function() {
    stage.next();
});

