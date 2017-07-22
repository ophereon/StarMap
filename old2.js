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
			var prm = 12.5; //planet radius magnitute
			var systems = new Array();
			var network = new Array();
			var medians = new Array();
			var midpoints = new Array();
			var proximity = new Array();
		}

	 	function setup(){
			var minW = maxW = 0;
			var minH = maxH = 0;
			for(var i=0; i<systems.length; i++){
				if(systems[i].x < minW) minW = systems[i].x;
				if(systems[i].x > maxW) maxW = systems[i].x;
				if(systems[i].y < minH) minH = systems[i].y;
				if(systems[i].y > minH) minH = systems[i].y;
			}
			cw = ch = 2.3 * Math.max(Math.abs(minW), Math.abs(maxW), Math.abs(minH), Math.abs(maxH));
			resize();
			zoom(0, ox, oy); //zoom out to initial view
			offset(0, 0);
			for(var j=0; j<systems.length; j++){
				// console.log("analysing star "+systems[j].id);
				for(var k=0; k<systems.length; k++){
					var d = Math.sqrt(Math.pow(Math.abs(systems[j].x-systems[k].x),2)+Math.pow(Math.abs(systems[j].y-systems[k].y),2));
					if(d<65 && d>0){
						// console.log("found one close by to "+systems[j].id+": star "+systems[k].id);
						var v = new vertex((systems[j].x+systems[k].x)/2, (systems[j].y+systems[k].y)/2);
						midpoints.push(v);
						var m = -1 / ((systems[k].y-systems[j].y)/(systems[k].x-systems[j].x));
						// console.log(systems[k].y+", "+systems[j].y+", "+systems[k].x+", "+systems[j].x);
						var b = v.y - (m * v.x);
						var q = 5 / (Math.sqrt(Math.pow(m,2)+1));
						// console.log("f(x) = m*v+b\tv.x: "+v.x+", v.y: "+v.y+", m: "+m+", b: "+b);
						medians.push(new line(systems[j].x, systems[j].y, systems[k].x, systems[k].y));
						medians.push(new line(v.x-q, (m*(v.x-q))+b, v.x+q, (m*(v.x+q))+b));
						// console.log("new line from "+(v.x-10)+", "+((m*-10)+b)+" to "+(v.x+10)+", "+((m*10)+b));
					}
				}
			}
			for(var i=0; i<systems.length; i++){
				var one = Math.floor(Math.random() * 256);
				var two = Math.floor(Math.random() * 256);
				var three = Math.floor(Math.random() * 256);
				var col = "rgb("+one+","+two+","+three+")";
				systems[i].colour = col;
				// console.log("star "+systems[i].id+" = "+systems[i].colour);
			}
			console.log("P3\n800\n800\n255\n");
			for(var i=-400; i<400; i++){
				for(var j=-400; j<400; j++){
					var star = new system(null);
					var d = Number.MAX_SAFE_INTEGER;
					for(var k=0; k<systems.length; k++){
						var distance = Math.sqrt(Math.pow(Math.abs((i+400)-(systems[k].x+400)),2)+Math.pow(Math.abs((j+400)-(systems[k].y+400)),2));
						if(distance<d){
							star = systems[k];
							d = distance;
						}
					}
					var col = star.colour.substring(4);
					var vals = col.split(',');
					console.log(vals[0]+" "+vals[1]+" "+vals[2].substring(0, vals[2].length - 1));
					proximity.push(new vertex(i, j, star));
					// console.log("point "+i+", "+j+" closest to star "+star.id);
				}
			}
			// z=1;
			loop();
			// zoom(4, 0, 0);
			var canvas = document.getElementById("map");
			var img = canvas.toDataURL("image/png");
			// with the value in IMG you can write it out as a new Image like so:
			window.location.href = img;
		}
		function resize(){
			w = canvas.width = window.innerWidth;
			h = canvas.height = window.innerHeight;
			var rw = (cw)/w; //horizontal ratio = width of canvas / width of window
			var rh = (ch)/h; //horizontal ratio = height of canvas / height of window
			minZ = 1/Math.max(rw, rh); //minimum zoom = highest of these two
			maxZ = minZ * 40;
			draw();
		}
		function loop(){
			window.requestAnimationFrame(loop);
			draw();
		}
		function read(){
			$.ajax({ //read data files
				type: "GET", url: "systems.csv", dataType: "text",
				success: function(file){
					var lines = file.split(/\r\n|\n/);
					var headers = lines[0].split(',');
					var sys = new system(null);
					for(var i=1; i<lines.length; i++) {
						var inst = lines[i].split(',');
						if(inst.length == headers.length){
							if(parseInt(inst[0])==0){
								if(sys.name!=null) systems.push(sys);
								var arr = inst[6].split(";");
								var coordinates = new Array();
								for(var j=0; j<arr.length; j++){
									var temp = arr[j].split(":");
									v = new vertex(temp[0], temp[1]);
									coordinates.push(v);
								}
								var mass = parseInt(inst[4]);
								var type = inst[5];
								if(type=="black"){
									var one = 4 * Math.floor((Math.random() * 4) + 1);
									var two = 4 * Math.floor((Math.random() * 4) + 1);
									mass = (one+two)/2;
									/*switch(mass) {
										case 20: //red supergiant
										case 15:
											type = white;
											break;
										case 3:
											type = binary
											break;
										case 2:
											type = ternary
											break;
										case 1:
											type = vampire
											break;
										default:
											type = orange;
									}*/
								}
								sys = new system(inst[1], parseInt(inst[2]),
									parseInt(inst[3]), mass, type, coordinates, inst[7].substring(1));
							}
							else if(parseInt(inst[0])>=1){
								var col = inst[6].split(":");
								var atmosphere = "rgb("+col[0]+","+col[1]+","+col[2]+")";
								var inhabited;
								if(inst[0]==1)
									inhabited = true;
								else inhabited = false;
								if(inst[1]!=null)
									sys.planets.push(new planet(inst[1], parseInt(inst[2]),
									parseInt(inst[3]), parseInt(inst[4]), inst[5], inhabited, atmosphere));
							}
						}
					}
					if(sys.name!=null) systems.push(sys);
					setup();
				}
			});
			$.ajax({ //read data files
				type: "GET", url: "connections.csv", dataType: "text",
				success: function(file){
					var lines = file.split(/\r\n|\n/);
					for(var i=0; i<lines.length; i++){
						// console.log(lines[i]);
						var inst = lines[i].split(',');
						if(inst.length == 2){
							network.push(new edge(parseInt(inst[0]), parseInt(inst[1])));
							// console.log("new stellar bridge between star systems "+inst[0]+" and "+inst[1]);
						}
					}
				}
			});
		}

		function zoom(l, px, py){
			if(l != z || l == 0){
				if(l<minZ) z = minZ; //don't go below min zoom level
				else if(l>maxZ) z = maxZ; //don't go above max zoom level
				else{ //if single increment zoom, do this
					// console.log('px='+px+', py='+py+' \nox='+ox+', oy='+oy);
					var dx = ox - (px*(l/maxZ));
					var dy = oy - (py*(l/maxZ));
					// var dx = ox - (px*((l-z)/(maxZ*minZ)));
					// var dy = oy - (py*((l-z)/(maxZ*minZ)));
					// var dx = ox - (px*((l-z)*maxZ));
					// var dy = oy - (py*((l-z)*maxZ));
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
		function r2(ir){ return (ir*(((z/minZ)+2)/2)); }

		function draw(){
			{ //draw map backgrounds
				ctx.clearRect(0, 0, w, h);
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.fillRect(0, 0, w, h);
				ctx.globalAlpha = 0.5;
				// if(w>(h*2)){
				// 	ctx.drawImage(document.getElementById('background'),
				// 		0, (h/2)-(w/2), w, (h/2)+(w/2));
				// 	ctx.globalAlpha = (1-(z/maxZ))/2;
				// 	ctx.drawImage(document.getElementById('nebula'),
				// 		0, (h/2)-(w/2), w, (h/2)+(w/2));
				// }
				// else {
				// 	ctx.drawImage(document.getElementById('background'),
				// 		(w/2)-h, 0, (w/2)+h, h);
				// 	ctx.globalAlpha = (1-(z/maxZ))/2;
				// 	ctx.drawImage(document.getElementById('nebula'),
				// 		(w/2)-h, 0, (w/2)+h, h);
				// }
			}
			{ //draw canvas markers
				// drawRect(-cw/2, -cw/2, cw/2, cw/2, 2, "rgb(64,64,64)");
				// for(var i=cw/2; i>-cw/2; i=i-cw/800){
				// 	drawLine(-cw/2, i, cw/2, i, 2, "rgb(0,0,0)", 0.06);
				// 	drawLine(i, ch/2, i, -ch/2, 2, "rgb(0,0,0)", 0.06);
				// 	// drawRect(-i, -i, i, i, 2, "rgb(64,64,64)");
				// }
				// for(var i=cw/2; i>-cw/2; i=i-cw/80){
				// 	drawLine(-cw/2, i, cw/2, i, 2, "rgb(0,0,0)", 0.12);
				// 	drawLine(i, ch/2, i, -ch/2, 2, "rgb(0,0,0)", 0.12);
				// 	// drawRect(-i, -i, i, i, 2, "rgb(64,64,64)");
				// }
				// for(var i=cw/2; i>-cw/2; i=i-cw/8){
				// 	drawLine(-cw/2, i, cw/2, i, 2, "rgb(0,0,0)", 0.24);
				// 	drawLine(i, ch/2, i, -ch/2, 2, "rgb(0,0,0)", 0.24);
				// 	// drawRect(-i, -i, i, i, 2, "rgb(64,64,64)");
				// }
				for(var i=0; i<proximity.length; i++){
					drawCirc(proximity[i].x, proximity[i].y, 1, 0, proximity[i].star.colour, 1.0);
				}
				for(var i=0; i<systems.length; i++){
					var star = systems[i];
					drawCirc(star.x, star.y, 1, 0, "rgb(0,0,0)", 1.0);
				}

				// drawLine(-cw/2, -ch/2, cw/2, ch/2, 2, "rgb(64,64,64)");
				// drawLine(cw/2, -ch/2, -cw/2, ch/2, 2, "rgb(64,64,64)");
				// drawLine(-cw/2, 0, cw/2, 0, 2, "rgb(64,64,64)");
				// drawLine(0, -ch/2, 0, ch/2, 2, "rgb(64,64,64)");
			}
			// drawNetwork();
			// drawSystems();
			// for(var k=0; k<medians.length; k++){
			// 	drawLine(medians[k].x1, medians[k].y1, medians[k].x2, medians[k].y2, 2, "rgb(64,64,64)", 0.5);
				// console.log("drawing line from "+medians[k].x1+", "+medians[k].y1+" to "+medians[k].x2+", "+medians[k].y2);
			// }
			// for(var k=0; k<midpoints.length; k++){
				// drawCirc(midpoints[k].x, midpoints[k].y, 3, 0, "rgb(64,64,64)");
			// }
		}

		function drawNetwork(){
			for(var i=0; i<network.length; ++i){
				var e = network[i];
				var a = b = new system(null);
				for(var j=0; j<systems.length; ++j){
					if(e.a == systems[j].id)
						a = systems[j];
					else if(e.b == systems[j].id)
						b = systems[j];
				}
				drawLine(a.x, a.y, b.x, b.y, 2, "rgb(64,64,64)", 0.5);
			}
		}

		function drawSystems(){
			drawCirc(0, 0, 1, 0, "rgb(0,0,0)", 1);
			for(var i=0; i<systems.length; i++){
				var star = systems[i];
				// console.log('drawing '+star.name+' with '+star.planets.length+' planet(s).');
				if(star.click){
					ctx.globalAlpha = 1.0;
					drawImage(star.x, star.y, star.mass*2, 'glow');
				}
				// ((star.mass/2+(planet.r*(prm/star.planets[star.planets.length-1].r)))/(maxZ/minZ))*(z/minZ)
				// drawCirc(star.x, star.y, r2((15)/(maxZ/minZ)), 2, "rgb(255,0,0)");
				for(var j=0; j<star.planets.length; j++){
					var planet = star.planets[j];
					// console.log('drawing planet '+planet.name+', '+(j+1)+' of '+star.planets.length);
					ctx.globalAlpha = ((z/maxZ))/2;
					if(planet.inhabited)
						drawCirc(star.x, star.y, ((star.mass/1.5+(planet.r*(prm/star.planets[star.planets.length-1].r)))/(maxZ/minZ))*(((z/minZ)+2)/3), 2, "rgb(128,128,128)");
					else if(planet.type!="asteroid") drawCirc(star.x, star.y, ((star.mass/1.5+(planet.r*(prm/star.planets[star.planets.length-1].r)))/(maxZ/minZ))*(((z/minZ)+2)/3), 2, "rgb(64,64,64)");
					if(planet.click){
						drawCirc(star.x, star.y, ((star.mass/1.5+(planet.r*(prm/star.planets[star.planets.length-1].r)))/(maxZ/minZ))*(((z/minZ)+2)/3), 2, "rgb(255,255,255)");
					}
				}
				for(var j=0; j<star.planets.length; j++){
					var planet = star.planets[j];
					if(planet.click){
						ctx.shadowBlur = 20; //3*(planet.r*(prm/star.planets[star.planets.length-1].r));
						ctx.shadowColor = planet.atmosphere;
					}
					ctx.globalAlpha = 1.0;
					var px = star.x - (((star.mass/1.5+(planet.r*(prm/star.planets[star.planets.length-1].r)))/(maxZ/minZ)) * (((z/minZ)+2)/3)) * Math.sin((-planet.th*Math.PI)/180);
					var py = star.y - (((star.mass/1.5+(planet.r*(prm/star.planets[star.planets.length-1].r)))/(maxZ/minZ)) * (((z/minZ)+2)/3)) * Math.cos((-planet.th*Math.PI)/180);
					if(planet.type=="asteroid")
						drawImage(star.x, star.y, (((star.mass/1.5+(2.9*planet.r*(prm/star.planets[star.planets.length-1].r)))/(maxZ/minZ)) * (z/maxZ)), planet.type);
					else drawImage(px, py, (planet.mass*.15)*(z/maxZ), planet.type);
					// console.log('drawing planet at x='+(star.x+px)+', y='+(star.y+py));
					ctx.shadowBlur = 0;
				}
				ctx.globalAlpha = 1.0;
				drawImage(star.x, star.y, star.mass, star.type, true);
			}
		}

		function drawLine(x1, y1, x2, y2, stroke, colour, alpha){
			if(alpha!=null) ctx.globalAlpha = alpha;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
			ctx.moveTo(x(x1), y(y1));
			ctx.lineTo(x(x2), y(y2));
			ctx.stroke();
		}
		function drawRect(x1, y1, x2, y2, stroke, colour, alpha){
			if(alpha!=null) ctx.globalAlpha = alpha;
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
		function drawCirc(x1, y1, r1, stroke, colour, alpha){
			if(alpha!=null) ctx.globalAlpha = alpha;
			ctx.fillStyle = colour;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
    		ctx.arc(x(x1), y(y1), r(r1), 0, 2 * Math.PI);
			if(stroke==0) ctx.fill();
			else ctx.stroke();
		}
		function drawImage(x1, y1, r1, image, star, alpha){
			if(alpha!=null) ctx.globalAlpha = alpha;
			if(star)
				ctx.drawImage(document.getElementById(image), x(x1)-r2(r1/2), y(y1)-r2(r1/2), r2(r1), r2(r1));
			else if(image=="asteroid")
				ctx.drawImage(document.getElementById(image), x(x1-(r1/2)), y(y1-(r1/2)), r2(r1), r2(r1));
			else
				ctx.drawImage(document.getElementById(image), x(x1)-r2(r1/2), y(y1)-r2(r1/2), r2(r1), r2(r1));
			// console.log('drew '+image+' at '+x1+', '+y1+' with radius '+r1);
		}
	}

	class system{
		constructor(name, x, y, mass, type, coordinates, id){
			this.name = name;
			this.x = x;
			this.y = y;
			this.mass = mass;
			this.type = type;
			this.coordinates = coordinates;
			this.id = id;
			this.planets = new Array();
			this.click = false;
			this.colour = "rgb(0,0,0)";
		}
	}
	class planet{
		constructor(name, r, th,  mass, type, inhabited, atmosphere){
			this.name = name;
			this.r = r;
			this.th = th;
			this.mass = mass;
			this.type = type;
			this.inhabited = inhabited;
			this.atmosphere = atmosphere;
			this.click = false;
		}
	}
	class vertex{
		constructor(x, y, star){
			this.x = x;
			this.y = y;
			this.star = star;
		}
	}
	class edge{
		constructor(a, b){
			this.a = a;
			this.b = b;
		}
	}
	class line{
		constructor(x1, y1, x2, y2){
			this.x1 = x1;
			this.y1 = y1;
			this.x2 = x2;
			this.y2 = y2;
		}
	}

	{ //interaction functions
		var press = false;
		var sx = sy = 0;
		var startX = startY = 0;
		$(canvas)
		.mousedown(function(e){
			document.body.style.cursor = '-webkit-grabbing';
		    press = true;
			startX = sx = e.originalEvent.clientX;
			startY = sy = e.originalEvent.clientY;
		})
		.mousemove(function(e){
			if(press){
				document.body.style.cursor = '-webkit-grabbing';
				offset(ox + (e.originalEvent.clientX - sx), oy + (e.originalEvent.clientY - sy));
				sx = e.originalEvent.clientX;
				sy = e.originalEvent.clientY;
			}
			else document.body.style.cursor = '-webkit-grab';
			// console.clear();
			// console.log("mx: "+(e.originalEvent.clientX-(w/2))+", my: "+(e.originalEvent.clientY-(h/2)));
			// console.log("ox: "+ox+", oy: "+oy);
			// console.log("z: "+z);
			for(var i=0; i<systems.length; ++i){
				if(Math.sqrt(Math.pow((e.originalEvent.clientX - x(systems[i].x)),2)
				+ Math.pow((e.originalEvent.clientY - y(systems[i].y)),2))
				< systems[i].mass*r(.45)){
					if(z!=maxZ)
						document.body.style.cursor = 'zoom-in';
					else document.body.style.cursor = 'zoom-out';
					systems[i].click = true;
					console.log("star: "+systems[i].id);
				}
				else{
					systems[i].click = false;
					for(var j=0; j<systems[i].planets.length; ++j){
						if(Math.sqrt(Math.pow((e.originalEvent.clientX -
							x(systems[i].x - (((systems[i].mass/2+(systems[i].planets[j].r*(prm/systems[i].planets[systems[i].planets.length-1].r)))/(maxZ/minZ))*(z/minZ)) * Math.sin((-systems[i].planets[j].th*Math.PI)/180))),2)
							+ Math.pow((e.originalEvent.clientY -
							y(systems[i].y - (((systems[i].mass/2+(systems[i].planets[j].r*(prm/systems[i].planets[systems[i].planets.length-1].r)))/(maxZ/minZ))*(z/minZ)) * Math.cos((-systems[i].planets[j].th*Math.PI)/180))),2))
						< systems[i].planets[j].mass*r(.1)){
							if(z!=maxZ)
								document.body.style.cursor = 'zoom-in';
							else document.body.style.cursor = 'pointer';
							systems[i].planets[j].click = true;
						}
						else
							systems[i].planets[j].click = false;
					}
				}
			}
		})
		.mouseup(function(e){
			if(startX == e.originalEvent.clientX && startY == e.originalEvent.clientY){
				for(var i=0; i<systems.length; ++i){
					if(systems[i].click){
						// console.log('z='+z+', maxZ='+maxZ);
						if(z == maxZ){
							// console.log("zooming out");
							while(z>minZ){
								setTimeout(zoom(z-z*0.01, 0, 0), 1);
								// zoom(0, 0, 0);
								draw();
							}
							// offset(0, 0);
						}
						else{
							while(z<maxZ){
								setTimeout(zoom(z+z*0.01, x(systems[i].x), y(systems[i].y)), 1);
								draw();
							}
						}
						// for(var j=z; j<z+0.1; j+=0.1){ //if multi-increment zoom, do this
						// 	zoom(maxZ, systems[i].x, systems[i].y); //set zoom to new level
						// 	var m = 62;
						// 	var px = -systems[i].x*(z/minZ);
						// 	var py = -systems[i].y*(z/minZ);
						// 	var pm = systems[i].mass*m*(z/minZ);
						// 	var nx = ny = 0;
						// 	if(systems[i].x<0) nx = px+pm;
						// 	else if (systems[i].x>0) nx = px-pm;
						// 	else nx = 0;
						// 	if(systems[i].y<0) ny = py+pm;
						// 	else if (systems[i].y>0) ny = py-pm;
						// 	else ny = 0;
						// 	// offset(nx, ny);
						// 	offset(0, 0);
						// 	offset(-x(systems[i].x), -y(systems[i].y));
						// 	// sleep(100);
						// }
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

	read();

});
