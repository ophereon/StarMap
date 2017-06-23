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
		console.clear();
		console.log("px: "+e.originalEvent.clientX+", py: "+e.originalEvent.clientY);
		console.log("cx: "+x(e.originalEvent.clientX)+", cy: "+y(e.originalEvent.clientY));
		console.log("gx: "+gx+", gy: "+gy);
     })
    .mouseup(function(){
        press = false;
    });
	$(window).bind('mousewheel DOMMouseScroll', function(event){
		startX = event.originalEvent.clientX;
		startY = event.originalEvent.clientY;
	    if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
	        zoom(z + z*0.1, startX, startY);
	    }
	    else {
	        zoom(z - z*0.1, startX, startY);
	    }
	});
	window.onresize = function(){ resize(); }
	$('body').css('top', -(document.documentElement.scrollTop) + 'px').addClass('noscroll');

	if(canvas.getContext){
		var ctx = canvas.getContext('2d'); //canvas context
		var cw = 1000, ch = 1000; //canvas size
		var w = 0, h = 0; //width and height of window
		var ox = 0, oy = 0; //offset x and offset y
		var z = 1; //zoom level
		var m = 1; //multiplier
		var mz = 20; //max-zoom
		var gx = 0; //
		var gy = 0; //

		function setup(){
			resize();
			zoom(1, 0, 0);
			offsetX(0);
			offsetY(0);
			gx = x(0)-((w-cw)/2);
			gy = y(0)-((h-ch)/2);
			loop();
		}
		function resize(){
			ctx.clearRect(0, 0, w, h);
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			var dw = cw/w;
			var dh = ch/h;
			m = Math.max(dw, dh);
			draw();
		}
		function loop(){
			window.requestAnimationFrame(loop);
			draw();
		}

		function zoom(level, posX, posY){
			if(level<1) z = 1;
			else if(level>mz) z = mz;
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
			if(inX<-(w-(w/z))) ox = -(w-(w/z));
			else if(inX>0) ox = 0;
			else ox = inX;
			if(cw*z<w) ox += (w-(cw*z))/2;
		}
		function offsetY(inY){
			if(inY<-(ch-(ch/z))) oy = -(ch-(ch/z));
			else if(inY>0) oy = 0;
			else oy = inY;
			if(ch*z<h) oy += (h-(ch*z))/2;
		}
		function x(inX){ return ((inX+ox)*z)/m; }
		function y(inY){ return ((inY+oy)*z)/m; }
		function x2(inX){ return ((inX+ox)*((z/2)+0.5))/m; }
		function y2(inY){ return ((inY+oy)*((z/2)+0.5))/m; }

		function draw(){
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillRect(0, 0, w, h);
			ctx.globalAlpha = 0.5;
			ctx.drawImage(document.getElementById('background'), (w/2)-h, 0, (w/2)+h, h);
			ctx.globalAlpha = (1-(z/mz))/2;
			ctx.drawImage(document.getElementById('nebula'), (w/2)-h, 0, (w/2)+h, h);//x(0)-gx, y(0)-gy, x(cw)+gx, y(ch)+gy);
			ctx.globalAlpha = 1.0;
			for(var i=0; i<=60; ++i) drawLine(i*(cw/60), 0, i*(cw/60), ch, "rgb(50,50,50)");
			for(var i=0; i<=60; ++i) drawLine(0, i*(ch/60), cw, i*(ch/60), "rgb(50,50,50)");
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
