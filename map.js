$(document).ready(function() {
	var canvas = $('#map')[0];
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	$("#zoom").on("input", function(){
		zoom(parseInt($(this).val()));
	});

	var press = false;
	var startX = 0;
	var startY = 0;
	$(canvas)
	.mousedown(function(e){
        press = true;
		startX = e.originalEvent.clientX;
		startY = e.originalEvent.clientY;
    })
    .mousemove(function(e){
        if(press){
			offsetX(ox + (e.originalEvent.clientX - startX));
			offsetY(oy + (e.originalEvent.clientY - startY));
			startX = e.originalEvent.clientX;
			startY = e.originalEvent.clientY;
		}
     })
    .mouseup(function(){
        press = false;
    });
	$(window).bind('mousewheel DOMMouseScroll', function(event){
	    if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
	        zoom(z + 0.1);
	    }
	    else {
	        zoom(z - 0.1);
	    }
	});

	if(canvas.getContext){
		var ctw = canvas.getContext('2d');

		var w = 0;
		var h = 0;
		var z = 1;
		var ox = 0;
		var oy = 0;

		function setup(){
			resize();
			zoom(1);
			offsetX(0);
			offsetY(0);
			loop();
		}

		function resize(){
			ctw.clearRect(0, 0, w, h);
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			ctw.strokeStyle = "rgb(0,0,0)";
			ctw.lineWidth = 1;
			ctw.lineCap = "round";
			draw();
		}

		function zoom(level){
			if(level<1) z = 1;
			else if(level>10) z = 10;
			else z = level;
			// console.log("l: " + level);
		}

		function offsetX(inX){
			ox = inX;
			// console.log("x: " + x);
		}

		function offsetY(inY){
			oy = inY;
			// console.log("y: " + y);
		}

		function loop(){
			window.requestAnimationFrame(loop);
			draw();
		}

		function x(inX){
			return ((inX*z)+ox)+(w/2);
		}
		function y(inY){
			return ((inY*z)+oy)+(h/2);
		}

		function draw(){
			ctw.clearRect(0, 0, w, h);
			ctw.beginPath();
			ctw.moveTo(x(-50), y(-50));
			ctw.lineTo(x(50), y(50));
			ctw.stroke();
		}
	}

	setup();
});
