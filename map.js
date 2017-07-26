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
			var fm = 0; //focus magnitute
			var systems = new Array();
			var network = new Array();
			var claims = new Array();
			var focus = null;
			var exitFocus = false;
			var toggleFree = false;
			// var proximity = new Array();
			var cursorX = cursorY = 0;
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
			// cw = ch = 2.3 * Math.max(Math.abs(minW), Math.abs(maxW), Math.abs(minH), Math.abs(maxH));
			cw = ch = 800;
			resize();
			fm = Math.min(h/50, w/50);
			zoom(0, ox, oy); //zoom out to initial view
			offset(0, 0);
			{ // colour drawing stuff
				// for(var i=0; i<systems.length; i++){
				// 	var one = Math.floor(Math.random() * 256);
				// 	var two = Math.floor(Math.random() * 256);
				// 	var three = Math.floor(Math.random() * 256);
				// 	var col = "rgb("+one+","+two+","+three+")";
				// 	systems[i].colour = col;
				// 	// console.log("star "+systems[i].id+" = "+systems[i].colour);
				// }
				// for(var i=-400; i<400; i++){
				// 	for(var j=-400; j<400; j++){
				// 		var star = new system(null);
				// 		var d = Number.MAX_SAFE_INTEGER;
				// 		for(var k=0; k<systems.length; k++){
				// 			var distance = Math.sqrt(Math.pow(Math.abs((i+400)-(systems[k].x+400)),2)+Math.pow(Math.abs((j+400)-(systems[k].y+400)),2));
				// 			if(distance<d){
				// 				star = systems[k];
				// 				d = distance;
				// 			}
				// 		}
				// 		var col = star.colour.substring(4);
				// 		var vals = col.split(',');
				// 		proximity.push(new vertex(i, j, star));
				// 		// console.log("point "+i+", "+j+" closest to star "+star.id);
				// 	}
				// }
				// loop();
				// var canvas = document.getElementById("map");
				// var img = canvas.toDataURL("image/png");
				// window.location.href = img;
			}
			loop();
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
			$.ajax({ //read systems files
				type: "GET", url: "systems.csv", dataType: "text",
				success: function(file){
					var lines = file.split(/\r\n|\n/);
					var sys = new system(null);
					for(var i=1; i<lines.length; i++) {
						if(lines[i]!="" || lines[i]!=null){
							var inst = lines[i].split(',');
							if(parseInt(inst[0])==1){
								if(sys.name!=null) systems.push(sys);
								var mass = parseInt(inst[5]);
								var klass = inst[6];
								if(klass=="blank"){
									var one = 4 * Math.floor((Math.random() * 4) + 1);
									var two = 4 * Math.floor((Math.random() * 4) + 1);
									// mass = (one+two)/2;
									mass = 10;
								}
								sys = new system(parseInt(inst[0]), inst[1], parseInt(inst[3]),
									parseInt(inst[4]), mass, klass, inst[7].substring(1), parseInt(inst[8]), parseInt(inst[9]), parseInt(inst[10]), parseInt(inst[11]), parseInt(inst[12]), inst[13], inst[14]);
							}
							else if(parseInt(inst[0])>1){
								var inhabited = (inst[2] == 'TRUE');
								var col = inst[7].split(";");
								var atmosphere = "rgb("+col[0]+","+col[1]+","+col[2]+")";
								if(inst[1]!=null){
									sys.planets.push(new planet(parseInt(inst[0]), inst[1], inhabited, parseInt(inst[3]),
									parseInt(inst[4]), parseInt(inst[5]), inst[6], atmosphere, parseInt(inst[8]), parseInt(inst[9]), parseInt(inst[10]), parseInt(inst[11]), parseInt(inst[12]), inst[13], inst[14]));
								}
							}
							else if(parseInt(inst[0])<1){
								if(sys.name!=null) systems.push(sys);
								sys = new system(parseInt(inst[0]), inst[1], parseInt(inst[3]),
									parseInt(inst[4]), parseInt(inst[5]), inst[6], inst[7].substring(1), parseInt(inst[8]), parseInt(inst[9]), parseInt(inst[10]), parseInt(inst[11]), parseInt(inst[12]), inst[13], inst[14]);
							}
						}
					}
					if(sys.name!=null) systems.push(sys);
					setup();
				}
			});
			$.ajax({ //read network files
				type: "GET", url: "network.csv", dataType: "text",
				success: function(file){
					var lines = file.split(/\r\n|\n/);
					for(var i=1; i<lines.length; i++){
						var inst = lines[i].split(',');
						if(inst.length == 3){
							network.push(new edge(parseInt(inst[0]), parseInt(inst[1]), inst[2]));
						}
					}
				}
			});
			$.ajax({ //read claim files
				type: "GET", url: "claims.csv", dataType: "text",
				success: function(file){
					var lines = file.split(/\r\n|\n/);
					for(var i=1; i<lines.length-1; i++){
						// console.log("-> "+lines[i]);
						if(lines[i]!=" " || lines[i]!=null){
							var inst = lines[i].split(',');
							var name = inst[0];
							var colour = "";
							switch(inst[1]){
								case 'green':
									colour = "rgb(0,192,0)";
									break;
								case 'blue':
									colour = "rgb(128,64,255)";
									break;
								case 'yellow':
									colour = "rgb(192,192,0)";
									break;
								case 'cyan':
									colour = "rgb(64,192,255)";
									break;
								case 'red':
									colour = "rgb(255,64,64)";
									break;
								default:
									var col = inst[1].split(";");
									colour = "rgb("+col[0]+","+col[1]+","+col[2]+")";
									break;
							}
							var polygons = new Array();
							for(var j=2; j<inst.length; j++){
								var p = new polygon(new Array());
								var vertices = inst[j].split(";");
								for(var k=0; k<vertices.length; k++){
									var points = vertices[k].split(":");
									p.vertices.push(new vertex(points[0], points[1]));
								}
								polygons.push(p);
							}
							claims.push(new claim(name, colour, polygons));
							// console.log("added new claim "+name);
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
					var dx = ox - (px*2*(l/maxZ));
					var dy = oy - (py*2*(l/maxZ));
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
				if(w>(h*2)){
					ctx.drawImage(document.getElementById('background'), 0, (h/2)-(w/2), w, (h/2)+(w/2));
					ctx.globalAlpha = (1-(z/maxZ))/4 * 2.5;
					ctx.drawImage(document.getElementById('nebula'), 0, (h/2)-(w/2), w, (h/2)+(w/2));
				}
				else {
					ctx.drawImage(document.getElementById('background'), (w/2)-h, 0, (w/2)+h, h);
					ctx.globalAlpha = (1-(z/maxZ))/4 * 2.5;
					ctx.drawImage(document.getElementById('nebula'), (w/2)-h, 0, (w/2)+h, h);
				}
			}
			{ //draw canvas markers
				// drawCirc(0, 0, 1, 0, "rgb(0,0,0)", 1);
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
				// for(var i=0; i<proximity.length; i++){
				// 	drawCirc(proximity[i].x, proximity[i].y, 1,0, proximity[i].star.colour);
				// }
				// drawLine(-cw/2, -ch/2, cw/2, ch/2, 2, "rgb(64,64,64)");
				// drawLine(cw/2, -ch/2, -cw/2, ch/2, 2, "rgb(64,64,64)");
				// drawLine(-cw/2, 0, cw/2, 0, 2, "rgb(64,64,64)");
				// drawLine(0, -ch/2, 0, ch/2, 2, "rgb(64,64,64)");
			}
			{ //colour drawing stuff
				// drawCirc(0, 0, 1, 0, "rgb(0,0,0)", 1.0);
				// for(var i=0; i<proximity.length; i++){
				// 	drawCirc(proximity[i].x, proximity[i].y, 1, 0, proximity[i].star.colour, 1.0);
				// }
				// for(var i=0; i<systems.length; i++){
				// 	if(systems[i].type==0)
				// 		drawCirc(systems[i].x, systems[i].y, 1, 0, "rgb(0,0,0)", 1.0);
				// 	else drawCirc(systems[i].x, systems[i].y, 1, 0, "rgb(255,255,255)", 1.0);
				// }
			}
			// drawClaims();
			drawNetwork();
			drawSystems();
			drawFocus();
			drawDialogue();
		}

		function drawClaims(){
			for(var i=0; i<claims.length; i++){
				for(var j=0; j<claims[i].polygons.length; j++){
					ctx.globalAlpha = 0.25;
					ctx.fillStyle = claims[i].colour;
					ctx.strokeStyle = claims[i].colour;
					ctx.lineWidth = 1;
					ctx.beginPath();
					for(var k=0; k<claims[i].polygons[j].vertices.length; k++){
						ctx.lineTo(x(claims[i].polygons[j].vertices[k].x), y(claims[i].polygons[j].vertices[k].y));
					}
					ctx.lineTo(x(claims[i].polygons[j].vertices[0].x), y(claims[i].polygons[j].vertices[0].y));
					ctx.fill();
					ctx.globalAlpha = 1.0;
					ctx.stroke();
				}
			}
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
				if(e.type=="dashed"){
					drawLine(a.x, a.y, b.x, b.y, 2, "rgb(128,128,128)", 1, true);
				}
				else if(e.type=="solid"){
					drawLine(a.x, a.y, b.x, b.y, 2, "rgb(128,128,128)", 1, false);
				}
			}
		}
		function drawSystems(){
			for(var i=0; i<systems.length; i++){
				var star = systems[i];
				if(star.hover && star.klass!="black")
					drawImage(star.x, star.y, star.mass*2, 'glow', 1.0);
				drawImage(star.x, star.y, star.mass, star.klass, 1.0, true); //draw star
			}
		}
		function drawDialogue(){
			var object = null;
			for(var i=0; i<systems.length; i++){
				if(systems[i].hover)//if star is hovered over,
					object = systems[i];
				else for(var j=0; j<systems[i].planets.length; j++)
					if(systems[i].planets[j].hover) //if planet is hovered over,
						object = systems[i].planets[j];
				if(object!=null){
					ctx.globalAlpha = 1.0;
					ctx.fillStyle = "rgb(30,30,44)";
					ctx.beginPath();
					ctx.lineTo(cursorX, cursorY);
					ctx.lineTo(cursorX-20, cursorY-20);
					ctx.lineTo(cursorX, cursorY-40);
					ctx.lineTo(cursorX+20, cursorY-20);
					ctx.lineTo(cursorX, cursorY);
					ctx.fill();
					drawRect2(cursorX-150, cursorY-120, cursorX+150, cursorY-20, 0, "rgb(50,50,64)", 1); //draw dialogue box
					drawRect2(cursorX-150, cursorY-120, cursorX-120, cursorY-20, 0, "rgb(40,40,54)", 1); //draw dialogue box
					drawRect2(cursorX-150, cursorY-120, cursorX+150, cursorY-20, 4, "rgb(30,30,44)", 1); //draw dialogue box
					if(object.name=='Unknown' && object.type==1)
						drawText("Star #"+object.id, cursorX-107.5, cursorY-80, 30, "rgb(255,255,255)", 'left');
					else
						drawText(object.name, cursorX-107.5, cursorY-80, 30, "rgb(255,255,255)", 'left');
					if(object.type==1 || object.type==6) drawText("☉", cursorX+130, cursorY-95, 20, "rgb(255,255,255)", 'center');
					else if(object.type==2) drawText("🜨", cursorX+130, cursorY-95, 24, "rgb(255,255,255)", 'center');
					else if(object.type==3) drawText("☽", cursorX+130, cursorY-95, 18, "rgb(255,255,255)", 'center');
					else if(object.type==4) drawText("♅", cursorX+130, cursorY-95, 20, "rgb(255,255,255)", 'center');
					drawLine2(cursorX-107.5, cursorY-70, cursorX+137.5, cursorY-70, 2, "rgb(255,255,255)", 1);
					if(object.inhabited) drawText("⚘", cursorX+130, cursorY-75, 20, "rgb(255,255,255)", 'center');
					if(object.text1!="" || object.text1!=null){
						if(object.text2!="" || object.text2!=null){
							drawText(object.text1, cursorX-107.5, cursorY-40, 16, "rgb(255,255,255)", 'left');
							drawText(object.text2, cursorX-107.5, cursorY-40, 16, "rgb(255,255,255)", 'left');
						}
						else drawText(object.text1, cursorX-107.5, cursorY-40, 16, "rgb(255,255,255)", 'left');
					}
					else drawText("Unclaimed", cursorX-107.5, cursorY-40, 16, "rgb(255,255,255)", 'left');
					if(object.type==1)
						drawText("#"+object.id, cursorX+137.5, cursorY-30, 12, "rgb(255,255,255)", 'right');
					if(object.pl==-1) object.pl = Math.round(Math.random());
					if(object.pl==0) drawText("Pl", cursorX-135, cursorY-100, 16, "rgb(0,0,0)", 'center');
					else drawText("Pl", cursorX-135, cursorY-100, 16, "rgb(255,255,255)", 'center');
					if(object.li==-1) object.li = Math.round(Math.random());
					if(object.li==0) drawText("Li", cursorX-135, cursorY-82.5, 16, "rgb(0,0,0)", 'center');
					else drawText("Li", cursorX-135, cursorY-82.5, 16, "rgb(255,255,255)", 'center');
					if(object.de==-1) object.de = Math.round(Math.random());
					if(object.de==0) drawText("²H", cursorX-135, cursorY-65, 16, "rgb(0,0,0)", 'center');
					else drawText("²H", cursorX-135, cursorY-65, 16, "rgb(255,255,255)", 'center');
					if(object.he==-1) object.he = Math.round(Math.random());
					if(object.he==0) drawText("³He", cursorX-135, cursorY-47.5, 16, "rgb(0,0,0)", 'center');
					else drawText("³He", cursorX-135, cursorY-47.5, 16, "rgb(255,255,255)", 'center');
					if(object.ha==-1) object.ha = Math.round(Math.random());
					if(object.ha==0) drawText("Ha", cursorX-135, cursorY-30, 16, "rgb(0,0,0)", 'center');
					else drawText("Ha", cursorX-135, cursorY-30, 16, "rgb(255,255,255)", 'center');

				}
			}
		}
		function drawFocus(){
			if(focus!=null){
				var x = w/2;
				var y = h/2;
				var alpha = 1.0;
				if(!exitFocus){
					drawRect2(0, 0, w, h, 0, "rgb(0,0,0)", 0.5);
				}
				else{
					alpha = 0.5;
				}
				drawCirc2(w/2, h/2, h/2.25, 0, "rgb(0,0,0)", alpha);
				ctx.save();
				ctx.beginPath();
				ctx.arc(w/2,  h/2, h/2.25, 0, 2 * Math.PI);
				ctx.closePath();
				ctx.clip();
				ctx.globalAlpha = 0.5;
				if(w>(h*2))
					ctx.drawImage(document.getElementById('background'), 0, (h/2)-(w/2), w, (h/2)+(w/2));
				else
					ctx.drawImage(document.getElementById('background'), (w/2)-h, 0, (w/2)+h, h);
				ctx.restore();
				drawCirc2(w/2, h/2, h/2.25, 6, "rgb(255,255,255)", alpha);
				var star = focus;
				if(star.hover && star.klass!="black"){
					drawImage2(x, y, star.mass*fm*2, 'glow', alpha);
				}
				for(var j=0; j<star.planets.length; j++){
					var planet = star.planets[j];
					// ctx.globalAlpha = ((z/maxZ))/2;
					ctx.globalAlpha = 1.0;
					// var radius = ((star.mass/1.75*m+(planet.r*12*(1.22*prm/star.planets[star.planets.length-1].r))));
					var radius = ((star.mass/1.75*fm+(h/5*((planet.r)/star.planets[star.planets.length-1].r))));
					if(planet.inhabited)
						drawCirc2(x, y, radius, 2, "rgb(128,128,128)");
					else if(planet.klass!="asteroid")
						drawCirc2(x, y, radius, 2, "rgb(64,64,64)");
					if(planet.hover){
						drawCirc2(x, y, radius, 2, "rgb(255,255,255)");
					}
				}
				for(var j=0; j<star.planets.length; j++){
					var planet = star.planets[j];
					var radius = ((star.mass/1.75*fm+(h/5*((planet.r)/star.planets[star.planets.length-1].r))));
					if(planet.hover){ //if planet is hovered over
						ctx.shadowBlur = 20; //3*(planet.r*(prm/star.planets[star.planets.length-1].r));
						ctx.shadowColor = planet.atmosphere; //set glow to atmosphere colour
					}
					var px = 0 - radius/1.22 * Math.sin((-planet.th*Math.PI)/180); //calculate x-coordinate of planet
					var py = 0 - radius/1.22 * Math.cos((-planet.th*Math.PI)/180); //calculate y-coordinate of planet
					if(planet.klass=="asteroid")
						drawImage(x, y, (star.mass/1.5+(planet.r*(12.5/star.planets[star.planets.length-1].r))), planet.klass, 1.0); //draw asteroid belt
					else drawImage(px, py, (planet.mass*2), planet.klass, 1.0); //draw non-asteroid planet
					ctx.shadowBlur = 0;
				}
				drawImage2(x, y, star.mass*fm, star.klass, alpha, true); //draw star
			}
		}

		function drawLine(x1, y1, x2, y2, stroke, colour, alpha, dashed){
			if(alpha!=null) ctx.globalAlpha = alpha;
			if(dashed) ctx.setLineDash([3, 3]);
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
			ctx.moveTo(x(x1), y(y1));
			ctx.lineTo(x(x2), y(y2));
			ctx.stroke();
			ctx.globalAlpha = 1.0;
			ctx.setLineDash([]);
		}
		function drawLine2(x1, y1, x2, y2, stroke, colour, alpha){
			if(alpha!=null) ctx.globalAlpha = alpha;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
			ctx.globalAlpha = 1.0;
		}
		function drawRect(x1, y1, x2, y2, stroke, colour, alpha){
			console.log("drawing rectangle");
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
			ctx.globalAlpha = 1.0;
		}
		function drawRect2(x1, y1, x2, y2, stroke, colour, alpha){
			if(alpha!=null) ctx.globalAlpha = alpha;
			ctx.fillStyle = colour;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x1, y2);
			ctx.lineTo(x2, y2);
			ctx.lineTo(x2, y1);
			ctx.lineTo(x1, y1);
			if(stroke==0) ctx.fill();
			else ctx.stroke();
			ctx.globalAlpha = 1.0;
		}
		function drawCirc(x1, y1, r1, stroke, colour, alpha){
			// console.log("drawing circle at "+x1+", "+y1+", with radius "+r1);
			if(alpha!=null) ctx.globalAlpha = alpha;
			ctx.fillStyle = colour;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
    		ctx.arc(x(x1), y(y1), r(r1), 0, 2 * Math.PI);
			if(stroke==0) ctx.fill();
			else ctx.stroke();
			ctx.globalAlpha = 1.0;
		}
		function drawCirc2(x1, y1, r1, stroke, colour, alpha){
			// console.log("drawing circle at "+x1+", "+y1+", with radius "+r1);
			if(alpha!=null) ctx.globalAlpha = alpha;
			ctx.fillStyle = colour;
			ctx.strokeStyle = colour;
			ctx.lineWidth = stroke;
			ctx.beginPath();
    		ctx.arc(x1, y1, r1, 0, 2 * Math.PI);
			if(stroke==0) ctx.fill();
			else ctx.stroke();
			ctx.globalAlpha = 1.0;
		}
		function drawImage(x1, y1, d1, image, alpha, star){
			if(alpha!=null) ctx.globalAlpha = alpha;
			if(star)
				ctx.drawImage(document.getElementById(image), x(x1)-r2(d1/2), y(y1)-r2(d1/2), r2(d1), r2(d1));
			else if(image=="asteroid")
				ctx.drawImage(document.getElementById(image), x(x1-(d1/2)), y(y1-(d1/2)), r2(d1), r2(d1));
			else
				ctx.drawImage(document.getElementById(image), x(x1)-r2(d1/2), y(y1)-r2(d1/2), r2(d1), r2(d1));
			ctx.globalAlpha = 1.0;
		}
		function drawImage2(x1, y1, d1, image, alpha, star){
			if(alpha!=null) ctx.globalAlpha = alpha;
			ctx.drawImage(document.getElementById(image), x1-(d1/2), y1-(d1/2), d1, d1);
			ctx.globalAlpha = 1.0;
		}
		function drawText(text, x1, y1, size, colour, align){
			ctx.globalAlpha = 1.0;
			ctx.fillStyle = colour;
			ctx.font = size+"px Agency FB";
			ctx.textAlign = "center";
			if(align!=null) ctx.textAlign = align;
			ctx.fillText(text, x1, y1);
			ctx.globalAlpha = 1.0;
		}
	}

	class system{
		constructor(type, name, x, y, mass, klass, id, pl, li, de, he, ha, text1, text2){
			this.type = type;
			this.name = name;
			this.inhabited = false;
			this.x = x;
			this.y = y;
			this.mass = mass;
			this.klass = klass;
			this.id = id;
			this.pl = pl;
			this.li = li;
			this.de = de;
			this.he = he;
			this.ha = ha;
			this.text1 = text1;
			this.text2 = text2;
			this.planets = new Array();
			this.hover = false;
			this.colour = "rgb(0,0,0)";
		}
	}
	class planet{
		constructor(type, name, inhabited, r, th,  mass, klass, atmosphere, pl, li, de, he, ha, text1, text2){
			this.type = type;
			this.name = name;
			this.inhabited = inhabited;
			this.r = r;
			this.th = th;
			this.mass = mass;
			this.klass = klass;
			this.atmosphere = atmosphere;
			this.pl = pl;
			this.li = li;
			this.de = de;
			this.he = he;
			this.ha = ha;
			this.text1 = text1;
			this.text2 = text2;
			this.hover = false;
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
		constructor(a, b, type){
			this.a = a;
			this.b = b;
			this.type = type;
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
	class claim{
		constructor(name, colour, polygons){
			this.name = name;
			this.colour = colour;
			this.polygons = polygons;
		}
	}
	class polygon{
		constructor(vertices){
			this.vertices = vertices;
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
			cursorX = e.originalEvent.clientX;
			cursorY = e.originalEvent.clientY;
			if(press && toggleFree && focus==null){
				document.body.style.cursor = '-webkit-grabbing';
				offset(ox + (e.originalEvent.clientX - sx), oy + (e.originalEvent.clientY - sy));
			}
			else document.body.style.cursor = 'default';
			sx = e.originalEvent.clientX;
			sy = e.originalEvent.clientY;
			if(focus==null){
				for(var i=0; i<systems.length; ++i){
					if(Math.sqrt(Math.pow((e.originalEvent.clientX - x(systems[i].x)),2)
					+ Math.pow((e.originalEvent.clientY - y(systems[i].y)),2))
					< 16){
						if(z!=maxZ && systems[i].type!=0)
							document.body.style.cursor = 'zoom-in';
						else if(systems[i].type!=0) document.body.style.cursor = 'zoom-out';
						if(systems[i].type!=0) systems[i].hover = true;
					}
					else{
						systems[i].hover = false;
						// for(var j=0; j<systems[i].planets.length; ++j){
						// 	if(Math.sqrt(Math.pow((e.originalEvent.clientX -
						// 		x(systems[i].x - (((systems[i].mass/1.5+(systems[i].planets[j].r*(prm/systems[i].planets[systems[i].planets.length-1].r)))/(maxZ/minZ)) * (((z/minZ)+2)/3)) * Math.sin((-systems[i].planets[j].th*Math.PI)/180))),2)
						// 		+ Math.pow((e.originalEvent.clientY -
						// 		y(systems[i].y - (((systems[i].mass/1.5+(systems[i].planets[j].r*(prm/systems[i].planets[systems[i].planets.length-1].r)))/(maxZ/minZ)) * (((z/minZ)+2)/3)) * Math.cos((-systems[i].planets[j].th*Math.PI)/180))),2))
						// 	< systems[i].planets[j].mass*r(.03)){
						// 		if(z!=maxZ)
						// 			document.body.style.cursor = 'zoom-in';
						// 		else document.body.style.cursor = 'pointer';
						// 		systems[i].planets[j].hover = true;
						// 	}
						// 	else
						// 		systems[i].planets[j].hover = false;
						// }
					}
				}
			}
			else{
				if(Math.sqrt(Math.pow((sx-(w/2)),2)+Math.pow((sy-(h/2)),2))>(h/2.25)){
					// console.log("outside the circle");
					exitFocus = true;
					document.body.style.cursor = 'alias';
				}
				else exitFocus = false;
				if(Math.sqrt(Math.pow((e.originalEvent.clientX-(w/2)),2) + Math.pow((e.originalEvent.clientY-(h/2)),2)) < focus.mass*(h/100)){
					focus.hover = true;
					document.body.style.cursor = 'pointer';
				}
				else{
					focus.hover = false;
					// for(var j=0; j<focus.planets.length; j++){
					// 	var planet = focus.planets[j];
					// 	var radius = ((focus.mass/1.75*(h/50)+(h/5*((planet.r)/focus.planets[focus.planets.length-1].r))));
					// 	var px = w/2 - radius/1.22 * Math.sin((-planet.th*Math.PI)/180); //calculate x-coordinate of planet
					// 	var py = h/2 - radius/1.22 * Math.cos((-planet.th*Math.PI)/180); //calculate y-coordinate of planet
					// 	console.log("distance from planet "+planet.name+": "+Math.sqrt(Math.pow(e.originalEvent.clientX-px,2) + Math.pow(e.originalEvent.clientY-py,2)));
					// 	if(Math.sqrt(Math.pow(e.originalEvent.clientX-px,2) + Math.pow(e.originalEvent.clientY-py,2)) < planet.mass*(h/300)){
					// 		planet.hover = true;
					// 		document.body.style.cursor = 'pointer';
					// 	}
					// 	else planet.hover = false;
					// }
				}
			}
		})
		.mouseup(function(e){
			if(focus!=null){
				if(Math.sqrt(Math.pow((startX-(w/2)),2)+Math.pow((startY-(h/2)),2))>(h/2.25)
				&& Math.sqrt(Math.pow((sx-(w/2)),2)+Math.pow((sy-(h/2)),2))>(h/2.25)){
					// console.log("outside the circle");
					focus = null;
					exitFocus = false;
				}
				if(focus.hover && focus.name!="Unknown"){
					press = false;
					window.open("http://createthisworld.wikia.com/wiki/"+focus.name);
				}
			}
			if(startX == e.originalEvent.clientX && startY == e.originalEvent.clientY){
				for(var i=0; i<systems.length; ++i){
					if(systems[i].hover){
						focus = systems[i];
						systems[i].hover = false;
						// console.log('focus on star '+systems[i].name);
					}
					for(var j=0; j<systems[i].planets.length; ++j){
						if(systems[i].planets[j].hover){
							press = false;
							window.open("http://createthisworld.wikia.com/wiki/"+systems[i].planets[j].name);
						}
					}
				}
			}
		   	press = false;
		});
		$(window).bind('mousewheel DOMMouseScroll', function(event){
			if(toggleFree){
				sx = event.originalEvent.clientX;
				sy = event.originalEvent.clientY;
				if (event.originalEvent.wheelDelta > 0
					|| event.originalEvent.detail < 0)
					zoom(z + z*0.1, sx-(w/2), sy-(h/2));
				else
					zoom(z - z*0.1, sx-(w/2), sy-(h/2));
				 offset(ox+1, oy+1); offset(ox-1, oy-1);
			}
		});
		window.onresize = function(){ resize(); }
		$('body').css('top', -(document.documentElement.scrollTop) + 'px').addClass('noscroll');
	}

	read();

});
