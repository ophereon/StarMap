$(document).ready(function() {
	var canvas = $('#map')[0];
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	$("#zoom").on("input", function(){
		zoom(parseInt($(this).val()), 0, 0);
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
		startX = event.originalEvent.clientX;
		startY = event.originalEvent.clientY;
	    if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
	        zoom(z + 0.1, startX, startY);
	    }
	    else {
	        zoom(z - 0.1, startX, startY);
	    }
	});
	window.onresize = function(){ resize(); }
	$('body').css('top', -(document.documentElement.scrollTop) + 'px').addClass('noscroll');

	if(canvas.getContext){
		var ctx = canvas.getContext('2d');

		var cw = 1000;
		var ch = 1000;
		var m = 1;

		var w = 0;
		var h = 0;
		var z = 1;
		var ox = 0;
		var oy = 0;

		function setup(){
			resize();
			zoom(1, 0, 0);
			offsetX(0);
			offsetY(0);
			loop();
		}

		function resize(){
			ctx.clearRect(0, 0, w, h);
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			var difW = cw/w;
			var difH = ch/h;
			m = Math.max(difW, difH);
			draw();
		}

		function zoom(level, posX, posY){
			if(level<1) z = 1;
			else if(level>10) z = 10;
			else{
				var difX = (ox+(posX/z)) - ((ox+(posX/level)));
				var difY = (oy+(posY/z)) - ((oy+(posY/level)));
				z = level;
				offsetX(ox-difX);
				offsetY(oy-difY);
			}
			// console.log("l: " + level);
		}

		function offsetX(inX){
			// console.log(inX);
			if(inX<-(w-(w/z))) ox = -(w-(w/z));
			else if(inX>0) ox = 0;
			else ox = inX;
			if(cw*z<w) ox += (w-(cw*z))/2;
		}
		function offsetY(inY){
			// console.log(inY);
			if(inY<-(ch-(ch/z))) oy = -(ch-(ch/z));
			else if(inY>0) oy = 0;
			else oy = inY;
			if(ch*z<h) oy += (h-(ch*z))/2;
		}

		function loop(){
			window.requestAnimationFrame(loop);
			draw();
		}

				// function x(inX){ return (((ox+(w/z))/2)+(inX*z)); }
				// function y(inY){ return (((oy+(h/z))/2)+(inY*z)); }
		function x(inX){ return ((inX+ox)*z)/m; }
		function y(inY){ return ((inY+oy)*z)/m; }

		function draw(){
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillRect(0, 0, w, h);
			// ctx.drawImage(document.getElementById('background'), 0, 0, w, h);
			// };
			// drawRect(0, 0, 10, 10, "rgb(255,255,255)");

			for(var i=0; i<=10; ++i) {
				drawLine(i*(cw/10), 0, i*(cw/10), ch, "rgb(50,50,50)");
			}
			for(var i=0; i<=10; ++i) {
				drawLine(0, i*(ch/10), cw, i*(ch/10), "rgb(50,50,50)");
			}
			// drawLine(-50, -50, 50, 50, "rgb(128,128,128)");
		}

		function drawRect(x1, y1, x2, y2, colour){
			ctx.fillStyle = colour;
			ctx.fillRect(x(x1), y(y1), x(x2), y(y2));
		}

		function drawLine(x1, y1, x2, y2, colour){
			ctx.strokeStyle = colour;
			ctx.lineWidth = 1;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(x(x1), y(y1));
			ctx.lineTo(x(x2), y(y2));
			ctx.stroke();
		}
	}

	setup();
});
