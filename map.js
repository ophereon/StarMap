$(document).ready(function() {
	var canvas = $('#map')[0];

	if(canvas.getContext){

		{ //global variables
			var ctx = canvas.getContext('2d'); //canvas context
			var w = 0; var h = 0; //width and height of window
			var cw = 0, ch = 0; //width and height of canvas
			var ox = 0, oy = 0; //offset x and offset y
			var maxZ = 20, minZ = 0; //minimum and maximum zoom level
			var z = 0; //current zoom level
			var systems = new Array();
		}

		function setup(){
			$.ajax({ //read data files
        		type: "GET", url: "systems.csv", dataType: "text",
		        success: function(file){ read(file); }
     		});
			cw = 600, ch = 600;
			resize();
			zoom(0, ox, oy); //zoom out to initial view
			offsetX(0);
			offsetY(0);
			loop();
		}
		function resize(){
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			var rw = (cw)/w; //horizontal ratio = width of canvas / width of window
			var rh = (ch)/h; //horizontal ratio = height of canvas / height of window
			minZ = Math.max(rw, rh); //minimum zoom = highest of these two
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
					    sys = new system(inst[1], parseInt(inst[2]),
							parseInt(inst[3]), parseInt(inst[4]), inst[5]);
					}
					else if(parseInt(inst[0])==0){
						sys.stars.push(new star(inst[1], parseInt(inst[2]),
							parseInt(inst[3]), parseInt(inst[4]), inst[5]));
					}
				}
		    }
			if(sys.name!=null) systems.push(sys);
		}
		function loop(){
			window.requestAnimationFrame(loop);
			draw();
		}

		function zoom(l, px, py){
			if(l != z || l == 0){
				if(l<minZ) z = minZ; //don't go below min zoom level
				else if(l>maxZ) z = maxZ; //don't go above max zoom level
				else if(l <= (z + z*0.1) || l >= (z - z*0.1)){ //if single increment zoom, do this
					var dx = ox + (px/2)-(w/2);
					var dy = oy - (py/2)-(h/2);
					z = l; //set zoom to new level
					offsetX(dx);
					offsetY(dy);
				}
				else{
					// for(var i=z; i<level; i+=0.1){ //if multi-increment zoom, do this
					// 	if(level > z)
					// 		z += 0.1; //set zoom to new level
					// 	else
					// 		z -= 0.1;
					// 	offsetX(ox-difX);
					// 	offsetY(oy-difY);
					// }
				}
			}
		}

		function offsetX(inX){
			var old = ox; //memorise old offset
			ox = inX; //change offset
			if(x(-cw/2)>0) ox = old; //if new offset puts the left edge on the
				//screen, change it back (don't let it be altered)
			if(x(cw/2)<w) ox = old; //if new offset puts the right edge on the
				//screen, change it back (don't let it be altered)
		}
		function offsetY(inY){
			var old = oy;
			oy = inY;
			if(y(-ch/2)>0) oy = old;
			if(y(ch/2)<h) oy = old;
		}

		function x(inX){ return (inX*z)+ox+(w/2); } //(((inX+ox)*z)/m)+(c); }
		function y(inY){ return (inY*z)+oy+(h/2); } //(((inY+oy)*z)/m)+(c); }
		function r(inR){ return inR*z; } //((inR)*z)/m; }

		function draw(){
			{ //draw map backgrounds
				ctx.clearRect(0, 0, w, h);
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.fillRect(0, 0, w, h);
				ctx.globalAlpha = 0.5;
				if(w>h*2){
					ctx.drawImage(document.getElementById('background'),
						0, (h/2)-(w/2), w, (h/2)+(w/2));
					ctx.globalAlpha = (1-(z/maxZ))/2;
					ctx.drawImage(document.getElementById('nebula'),
						0, (h/2)-(w/2), w, (h/2)+(w/2)); //x(0), y(0), x(cw), y(ch));
				}
				else {
					ctx.drawImage(document.getElementById('background'),
						(w/2)-h, 0, (w/2)+h, h);
					ctx.globalAlpha = (1-(z/maxZ))/2;
					ctx.drawImage(document.getElementById('nebula'),
						(w/2)-h, 0, (w/2)+h, h);
				}
			}
			{ //draw canvas markers
				ctx.globalAlpha = 1.0;
				for(var i=300; i>10; i=i/3*2){
					drawRect(-i, -i, i, i, 2, "rgb(128,128,128)");
				}
				drawLine(-cw/2, -ch/2, cw/2, ch/2, 2, "rgb(128,128,128)");
				drawLine(cw/2, -ch/2, -cw/2, ch/2, 2, "rgb(128,128,128)");
				drawLine(-cw/2, 0, cw/2, 0, 2, "rgb(128,128,128)");
				drawLine(0, -ch/2, 0, ch/2, 2, "rgb(128,128,128)");
			}
			drawSystems();
		}

		function drawSystems(){
			drawCirc(0, 0, 10, 0, "rgb(0,0,0)");
			for(var i=0; i<systems.length; ++i){
				var colour = "rgb(0,0,0)";
				switch(systems[i].type){
					case "orange":
						colour = "rgb(255,155,55)";
						break;
					case "white":
						colour = "rgb(255,255,255)";
						break;
				}
				drawCirc(systems[i].x, systems[i].y, systems[i].mass*10, 0, colour);
			}
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
		function drawCirc(x1, y1, r1, stroke, colour){
			ctx.fillStyle = colour;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
    		ctx.arc(x(x1), y(y1), r(r1), 0, 2 * Math.PI);
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

	{ //interaction functions
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
		   if (event.originalEvent.wheelDelta > 0
			   || event.originalEvent.detail < 0)
			   zoom(z + z*0.1, startX, startY);
		   else
			   zoom(z - z*0.1, startX, startY);
		});
		window.onresize = function(){ resize(); }
		$('body').css('top', -(document.documentElement.scrollTop) + 'px').addClass('noscroll');
	}

	setup();
});
