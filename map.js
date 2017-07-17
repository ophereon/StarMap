$(document).ready(function() {

	var canvas = $('#map')[0];

	if(canvas.getContext){

		{ //global variables
			var ctx = canvas.getContext('2d'); //canvas context
			var w = h = 0; //width and height of window
			var cw = ch = 0; //width and height of canvas
			var ox = oy = 0; //offset x and offset y
			var minZ = maxZ = 0; //minimum and maximum zoom level
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
			offset(0, 0);
			loop();
		}
		function resize(){
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			var rw = (cw)/w; //horizontal ratio = width of canvas / width of window
			var rh = (ch)/h; //horizontal ratio = height of canvas / height of window
			minZ = 1/Math.max(rw, rh); //minimum zoom = highest of these two
			maxZ = minZ * 15;
			draw();
		}
		function loop(){
			window.requestAnimationFrame(loop);
			draw();
		}
		function read(file){
    		var lines = file.split(/\r\n|\n/);
			var headers = lines[0].split(',');
			var sys = new system(null);
			// console.log(lines.length);
			for(var i=1; i<lines.length; i++) {
				// console.log(i+': '+lines[i]);
		        var inst = lines[i].split(',');
		        if(inst.length == headers.length){
					if(parseInt(inst[0])==1){
						if(sys.name!=null) systems.push(sys);
					    var arr = inst[6].split(";");
						// console.log(arr);
						var points = new Array();
						for(var j=0; j<arr.length; j++){
							var temp = arr[j].split(":");
							p = new point(temp[0], temp[1]);
							points.push(p);
						}
					    sys = new system(inst[1], parseInt(inst[2]),
							parseInt(inst[3]), parseInt(inst[4]), inst[5], points);
						// console.log('new system '+inst[1]);
					}
					else if(parseInt(inst[0])==0){
						var col = inst[6].split(":");
						// console.log(col);
						var atmosphere = "rgb("+col[0]+","+col[1]+","+col[2]+")";
						// console.log(inst[1]);
						if(inst[1]!=null)
							sys.planets.push(new planet(inst[1], parseInt(inst[2]),
							parseInt(inst[3]), parseInt(inst[4]), inst[5], atmosphere));
						// console.log('adding planet '+inst[1]+' to system '+sys.name);
					}
					// console.log('system '+sys.name+' has '+sys.planets.length+' planets');
				}
		    }
			if(sys.name!=null) systems.push(sys);
		}

		function zoom(l, px, py){
			if(l != z || l == 0){
				if(l<minZ) z = minZ; //don't go below min zoom level
				else if(l>maxZ) z = maxZ; //don't go above max zoom level
				else{ //if single increment zoom, do this
					console.log('px='+px+', py='+py+' \nox='+ox+', oy='+oy);
					var dx = ox - (px*(l/maxZ));
					var dy = oy - (py*(l/maxZ));
					// var dx = ox - (px*((l-z)/(maxZ*minZ)));
					// var dy = oy - (py*((l-z)/(maxZ*minZ)));
					z = l; //set zoom to new level
					offset(dx, dy);
				}
			}
		}

		function offset(ix, iy){
			ox = ix; //try new x offset
			oy = iy; //try new y offset
			if(x(-cw/2)>0 && x(cw/2)<w)
				ox = 0;
			else{
				while(x(-cw/2)>0)
					ox -= 1;
				while(x(cw/2)<w)
					ox += 1;
			}
			if(y(-ch/2)>0 && y(ch/2)<h)
				oy = 0;
			else{
				while(y(-ch/2)>0)
					oy -= 1;
				while(y(ch/2)<h)
					oy += 1;
			}
			draw();
		}

		function x(ix){ return (ix*z)+ox+(w/2); }
		function y(iy){ return (iy*z)+oy+(h/2); }
		function r(ir){ return (ir*z); }

		function draw(){
			{ //draw map backgrounds
				ctx.clearRect(0, 0, w, h);
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.fillRect(0, 0, w, h);
				ctx.globalAlpha = 0.5;
				if(w>(h*2)){
					ctx.drawImage(document.getElementById('background'),
						0, (h/2)-(w/2), w, (h/2)+(w/2));
					ctx.globalAlpha = (1-(z/maxZ))/2;
					ctx.drawImage(document.getElementById('nebula'),
						0, (h/2)-(w/2), w, (h/2)+(w/2));
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
				for(var i=300; i>0; i=i-25){
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
			// drawCirc(0, 0, 10, 0, "rgb(0,0,0)");
			for(var k=0; k<systems.length; k++){
				var star = systems[k];
				// console.log('drawing '+star.name+' with '+star.planets.length+' planets.');
				var colour = "rgb(0,0,0)";
				switch(star.type){
					case "orange":
						colour = "rgb(255,155,55)";
						break;
					case "white":
						colour = "rgb(255,255,255)";
						break;
				}
				if(star.click){
					ctx.globalAlpha = 1.0;
					drawImage(star.x, star.y, star.mass*2.5, 'glow');
				}
				for(var j=0; j<star.planets.length; j++){
					var planet = star.planets[j];
					// console.log('drawing planet '+planet.name+', '+(j+1)+' of '+star.planets.length);
					ctx.globalAlpha = ((z/maxZ))/2;
					drawCirc(star.x, star.y, ((star.mass/2+planet.r)/(maxZ/minZ))*(z/minZ), 2, "rgb(128,128,128)");
					if(planet.click){
						drawCirc(star.x, star.y, ((star.mass/2+planet.r)/(maxZ/minZ))*(z/minZ), 2, "rgb(255,255,255)");
						ctx.shadowBlur = 3*planet.r;
						ctx.shadowColor = planet.atmosphere;
					}
					ctx.globalAlpha = 1.0;
					var px = star.x - (((star.mass/2+planet.r)/(maxZ/minZ))*(z/minZ)) * Math.sin((-planet.th*Math.PI)/180);
					var py = star.y - (((star.mass/2+planet.r)/(maxZ/minZ))*(z/minZ)) * Math.cos((-planet.th*Math.PI)/180);
					drawImage(px, py, planet.mass*.15, planet.type);
					// console.log('drawing planet at x='+(star.x+px)+', y='+(star.y+py));
					ctx.shadowBlur = 0;
				}
				ctx.globalAlpha = 1.0;
				drawImage(star.x, star.y, star.mass*1.1, star.type);
			}
		}

		function drawLine(x1, y1, x2, y2, stroke, colour){
			ctx.globalAlpha = 1.0;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
			ctx.moveTo(x(x1), y(y1));
			ctx.lineTo(x(x2), y(y2));
			ctx.stroke();
		}
		function drawRect(x1, y1, x2, y2, stroke, colour){
			ctx.globalAlpha = 1.0;
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
			// ctx.globalAlpha = 1.0;
			ctx.fillStyle = colour;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
    		ctx.arc(x(x1), y(y1), r(r1), 0, 2 * Math.PI);
			if(stroke==0) ctx.fill();
			else ctx.stroke();
		}
		function drawImage(x1, y1, r1, image){
			ctx.drawImage(document.getElementById(image), x(x1-(r1/2)), y(y1-(r1/2)), r(r1), r(r1));
			// console.log('drew '+image+' at '+x1+', '+y1+' with radius '+r1);
		}
	}

	class system{
		constructor(name, x, y, mass, type, points){
			this.name = name;
			this.x = x;
			this.y = y;
			this.mass = mass;
			this.type = type;
			this.points = points;
			this.planets = new Array();
			this.click = false;
		}
	}
	class planet{
		constructor(name, r, th,  mass, type, atmosphere){
			this.name = name;
			this.r = r;
			this.th = th;
			this.mass = mass;
			this.type = type;
			this.atmosphere = atmosphere;
			this.click = false;
		}
	}
	class point{
		constructor(x, y){
			this.x = x;
			this.y = y;
		}
	}

	{ //interaction functions
		var press = false;
		var sx = sy = 0;
		var startX = startY = 0;
		$(canvas)
		.mousedown(function(e){
		    press = true;
			startX = sx = e.originalEvent.clientX;
			startY = sy = e.originalEvent.clientY;
		})
		.mousemove(function(e){
			for(var i=0; i<systems.length; ++i){
				if(Math.sqrt(Math.pow((e.originalEvent.clientX - x(systems[i].x)),2)
				+ Math.pow((e.originalEvent.clientY - y(systems[i].y)),2))
				< systems[i].mass*r(1)){
					document.body.style.cursor = 'cursor-url';
					systems[i].click = true;
				}
				else{
					systems[i].click = false;
					for(var j=0; j<systems[i].planets.length; ++j){
						if(Math.sqrt(Math.pow((e.originalEvent.clientX -
							x(systems[i].x - (((systems[i].mass/2+systems[i].planets[j].r)/(maxZ/minZ))*(z/minZ)) * Math.sin((-systems[i].planets[j].th*Math.PI)/180))),2)
							+ Math.pow((e.originalEvent.clientY -
							y(systems[i].y - (((systems[i].mass/2+systems[i].planets[j].r)/(maxZ/minZ))*(z/minZ)) * Math.cos((-systems[i].planets[j].th*Math.PI)/180))),2))
						< systems[i].planets[j].mass*r(.1)){
							document.body.style.cursor = 'cursor-url';
							systems[i].planets[j].click = true;
						}
						else
							systems[i].planets[j].click = false;
					}
				}
			}
			if(press){
				offset(ox + (e.originalEvent.clientX - sx), oy + (e.originalEvent.clientY - sy));
				sx = e.originalEvent.clientX;
				sy = e.originalEvent.clientY;
			}
			console.clear();
			console.log("mx: "+(e.originalEvent.clientX-(w/2))+", my: "+(e.originalEvent.clientY-(h/2)));
			console.log("ox: "+ox+", oy: "+oy);
		})
		.mouseup(function(e){
			console.log()
			if(startX == e.originalEvent.clientX && startY == e.originalEvent.clientY){
				for(var i=0; i<systems.length; ++i){
					if(systems[i].click){
						console.log('z='+z+', maxZ='+maxZ);
						if(z == maxZ){
							console.log('zooming out');
							zoom(0, 0, 0);
							offset(0, 0);
						}
						else{
						// for(var j=z; j<z+0.1; j+=0.1){ //if multi-increment zoom, do this
							zoom(maxZ, systems[i].x, systems[i].y); //set zoom to new level
							var m = 62;
							var px = -systems[i].x*(z/minZ);
							var py = -systems[i].y*(z/minZ);
							var pm = systems[i].mass*m*(z/minZ);
							var nx = ny = 0;
							if(systems[i].x<0) nx = px+pm;
							else if (systems[i].x>0) nx = px-pm;
							else nx = 0;
							if(systems[i].y<0) ny = py+pm;
							else if (systems[i].y>0) ny = py-pm;
							else ny = 0;
							offset(nx, ny);
							// sleep(100);
						}
						// console.log('zooming into system '+systems[i].name);
					}
					for(var j=0; j<systems[i].planets.length; ++j){
						if(systems[i].planets[j].click){
							press = false;
							window.open("http://createthisworld.wikia.com/wiki/"+systems[i].planets[j].name);
						}
					}
				}
			}
		   	press = false;
		});
		$(window).bind('mousewheel DOMMouseScroll', function(event){
		   sx = event.originalEvent.clientX;
		   sy = event.originalEvent.clientY;
		   if (event.originalEvent.wheelDelta > 0
			   || event.originalEvent.detail < 0)
			   zoom(z + z*0.1, sx-(w/2), sy-(h/2));
		   else
			   zoom(z - z*0.1, sx-(w/2), sy-(h/2));
			offset(ox+1, oy+1); offset(ox-1, oy-1);
		});
		window.onresize = function(){ resize(); }
		$('body').css('top', -(document.documentElement.scrollTop) + 'px').addClass('noscroll');
	}

	function sleep(ms){
		var time = new Date().getTime();
		while (time + ms >= new Date().getTime()){}
	}

	setup();

});
