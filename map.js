$(document).ready(function() {
	var canvas = $('#map')[0];

	if(canvas.getContext){
		var ctx = canvas.getContext('2d'); //canvas context
		var w = canvas.width = window.innerWidth;
		var h = canvas.height = window.innterHeight;
		var cw = 600;
		var ch = 600;
		var ox = 0, oy = 0; //offset x and offset y
		var z = 1; //zoom level
		var minZ = 0;
		var maxZ = 20; //max-zoom
		var systems = new Array();

		function setup(){
			resize();
			zoom(1, 0, 0);
			offsetX(0);
			offsetY(0);
			$.ajax({
        		type: "GET", url: "systems.csv", dataType: "text",
		        success: function(file){ read(file); }
     		});
			loop();
		}
		function resize(){
			ctx.clearRect(0, 0, w, h);
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			var rw = (cw*2)/w;
			var rh = (ch*2)/h;
			minZ = Math.max(rw, rh);
			zoom(minZ, ox, oy);
			draw();
		}
		function read(file){
    		var lines = file.split(/\r\n|\n/);
			var headers = lines[0].split(',');
			var sys = new system(null);
			for(var i=1; i<lines.length; i++) {
		        var inst = lines[i].split(',');
		        if(inst.length == headers.length){
					if(parseInt(inst[0])==1){
						if(sys.name!=null) systems.push(sys);
					    sys = new system(inst[1], parseInt(inst[2]), parseInt(inst[3]), parseInt(inst[4]), inst[5]);
					}
					else if(parseInt(inst[0])==0){
						sys.stars.push(new star(inst[1], parseInt(inst[2]), parseInt(inst[3]), parseInt(inst[4]), inst[5]));
					}
				}
		    }
			if(sys.name!=null) systems.push(sys);
		}
		function loop(){
			window.requestAnimationFrame(loop);
			draw();
		}

		function zoom(level, posX, posY){
			if(level<minZ) z = minZ; //don't go below zoom level 1
			else if(level>maxZ) z = maxZ; //don't go above max zoom level
			else{
				// var difX = (ox+(posX/z)) - ((ox+(posX/level))); //Δx = offset(x) + pos(x)/currentZoom - offset(x) - pos(x)/newZoom
				// var difY = (oy+(posY/z)) - ((oy+(posY/level))); //Δy = offset(y) + pos(y)/currentZoom - offset(y) - pos(y)/newZoom
				z = level; //set zoom to new level
				// offsetX(ox-difX);
				// offsetY(oy-difY);
			}
		}
		function offsetX(inX){
			// if(inX<-(w-(w/z))) ox = -(w-(w/z));
			// else if(inX>0) ox = 0;
			// else ox = inX;
			// if(cw*z<w) ox += (w-(cw*z))/2;
			ox = inX;
		}
		function offsetY(inY){
			// if(inY<-(ch-(ch/z))) oy = -(ch-(ch/z));
			// else if(inY>0) oy = 0;
			// else oy = inY;
			// if(ch*z<h) oy += (h-(ch*z))/2;
			oy = inY;
		}
		function x(inX){ return (inX*z)+ox+(w/2); } //(((inX+ox)*z)/m)+(c);
		function y(inY){ return (inY*z)+oy+(h/2); } //(((inY+oy)*z)/m)+(c); }
		function r(inR){ return inR*z; } //((inR)*z)/m; }

		function draw(){
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillRect(0, 0, w, h);
			ctx.globalAlpha = 1.0;
			drawRect(-300, -300, 300, 300, 2, "rgb(255,0,0)");
			drawLine(-300, -300, 300, 300, 2, "rgb(0,255,0)");
			drawLine(300, -300, -300, 300, 2, "rgb(0,0,255)");
		}

		function drawLine(x1, y1, x2, y2, stroke, colour){
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
			ctx.moveTo(x(x1), y(y1));
			ctx.lineTo(x(x2), y(y2));
			ctx.stroke();
		}
		function drawRect(x1, y1, x2, y2, stroke, colour){
			ctx.fillStyle = colour;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
			ctx.moveTo(x(x1), y(y1));
			ctx.lineTo(x(x1), y(y2));
			ctx.lineTo(x(x2), y(y2));
			ctx.lineTo(x(x2), y(y1));
			ctx.lineTo(x(x1), y(y1));
			if(stroke==0) ctx.fill();
			else ctx.stroke();
		}
	}

	class system{
		constructor(name, x, y, mass, type){
			this.name = name;
			this.x = x;
			this.y = y;
			this.mass = mass;
			this.type = type;
			this.stars = new Array();
		}
	}
	class star{
		constructor(name, r, th,  mass, type){
			this.name = name;
			this.r = r;
			this.th = th;
			this.mass = mass;
			this.type = type;
		}
	}

	{
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
				// offsetX(ox + (e.originalEvent.clientX - startX)/z);
				// offsetY(oy + (e.originalEvent.clientY - startY)/z);
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
			   zoom(z + z*0.1, startX, startY);
		   }
		   else {
			   zoom(z - z*0.1, startX, startY);
		   }
		});
		window.onresize = function(){ resize(); }
		$('body').css('top', -(document.documentElement.scrollTop) + 'px').addClass('noscroll');
	}

	setup();
});
