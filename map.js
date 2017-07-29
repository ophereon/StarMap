$(document).ready(function() {

	var canvas = $('#map')[0];

	if(canvas.getContext){

		class system{
			constructor(type, name, gate, x, y, mass, klass, id, pl, li, de, he, ha, text1, text2){
				this.type = type;
				this.name = name;
				this.gate = gate;
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
				this.gate = false;
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
		class toggle{
			constructor(x, y, value, icon){
				this.x = x;
				this.y = y;
				this.value = value;
				this.icon = icon;
				this.hover = false;
			}
		}

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
			var showClaims = new toggle(25, 25, false, "showClaims");
			var showGrid = new toggle(25, 65, false, "showGrid");
			var moveFree = new toggle(25, 105, false, "moveFree");
			var cursorX = cursorY = 0;
			var mobile = false;
			// var proximity = new Array();
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
								var gate = (inst[2] == 'TRUE');
								var mass = parseInt(inst[5]);
								var klass = inst[6];
								if(klass=="blank"){
									var one = 4 * Math.floor((Math.random() * 4) + 1);
									var two = 4 * Math.floor((Math.random() * 4) + 1);
									// mass = (one+two)/2;
									mass = 10;
								}
								sys = new system(parseInt(inst[0]), inst[1], gate, parseInt(inst[3]), parseInt(inst[4]), mass, klass, inst[7].substring(1), parseInt(inst[8]), parseInt(inst[9]), parseInt(inst[10]), parseInt(inst[11]), parseInt(inst[12]), inst[13], inst[14]);
							}
							else if(parseInt(inst[0])>1){
								var inhabited = (inst[2] == 'TRUE');
								var col = inst[7].split(";");
								var atmosphere = "rgb("+col[0]+","+col[1]+","+col[2]+")";
								if(inst[1]!=null){
									sys.planets.push(new planet(parseInt(inst[0]), inst[1], inhabited, parseInt(inst[3]), parseInt(inst[4]), parseInt(inst[5]), inst[6], atmosphere, parseInt(inst[8]), parseInt(inst[9]), parseInt(inst[10]), parseInt(inst[11]), parseInt(inst[12]), inst[13], inst[14]));
								}
							}
							else if(parseInt(inst[0])<1){
								if(sys.name!=null) systems.push(sys);
								sys = new system(parseInt(inst[0]), inst[1], false, parseInt(inst[3]),
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
								case 'red':
									colour = "rgb(255,64,64)";
									break;
								case 'green':
									colour = "rgb(0,192,0)";
									break;
								case 'blue':
									colour = "rgb(128,64,255)";
									break;
								case 'cyan':
									colour = "rgb(64,192,255)";
									break;
								case 'magenta':
									colour = "rgb(192,64,192)";
									break;
								case 'yellow':
									colour = "rgb(192,192,0)";
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
			drawBackground();
			// drawColours();
			if(showGrid.value==true)
			 	drawGrid();
			if(showClaims.value==true)
				drawClaims();
			drawNetwork();
			drawSystems();
			drawToggle(showClaims);
			drawToggle(showGrid);
			drawToggle(moveFree);
			drawFocus();
			drawDialogue();
		}

		function drawBackground(){
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
		function drawColours(){
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
		function drawGrid(){
			drawCirc(0, 0, 2, 0, "rgb(0,0,0)", 1);
			drawRect(-cw/2, -cw/2, cw/2, cw/2, 2, "rgb(0,0,0)", 0.24);
			for(var i=cw/2; i>-cw/2; i=i-cw/800){
				drawLine(-cw/2, i, cw/2, i, 2, "rgb(0,0,0)", 0.06);
				drawLine(i, ch/2, i, -ch/2, 2, "rgb(0,0,0)", 0.06);
				// drawRect(-i, -i, i, i, 2, "rgb(64,64,64)");
			}
			for(var i=cw/2; i>-cw/2; i=i-cw/80){
				drawLine(-cw/2, i, cw/2, i, 2, "rgb(0,0,0)", 0.12);
				drawLine(i, ch/2, i, -ch/2, 2, "rgb(0,0,0)", 0.12);
				// drawRect(-i, -i, i, i, 2, "rgb(64,64,64)");
			}
			for(var i=cw/2; i>-cw/2; i=i-cw/8){
				drawLine(-cw/2, i, cw/2, i, 2, "rgb(0,0,0)", 0.24);
				drawLine(i, ch/2, i, -ch/2, 2, "rgb(0,0,0)", 0.24);
				// drawRect(-i, -i, i, i, 2, "rgb(64,64,64)");
			}
			// drawLine(-cw/2, -ch/2, cw/2, ch/2, 2, "rgb(64,64,64)");
			// drawLine(cw/2, -ch/2, -cw/2, ch/2, 2, "rgb(64,64,64)");
			// drawLine(-cw/2, 0, cw/2, 0, 2, "rgb(64,64,64)");
			// drawLine(0, -ch/2, 0, ch/2, 2, "rgb(64,64,64)");
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
		function drawToggle(toggle){
			ctx.shadowBlur = 0;
			if(toggle.hover==true){
				ctx.shadowBlur = 10; //3*(planet.r*(prm/star.planets[star.planets.length-1].r));
				ctx.shadowColor = "rgb(255,255,255)";
			}
			drawCirc2(toggle.x, toggle.y, 15, 0, "rgb(50,50,64)", 1.0);
			drawImage2(toggle.x, toggle.y, 19, toggle.icon+"_b", 1.0);
			ctx.shadowBlur = 0;
			if(toggle.value==true){
				drawCirc2(toggle.x, toggle.y, 15, 2, "rgb(255,255,255)", 1.0);
				drawImage2(toggle.x, toggle.y, 19, toggle.icon+"_w", 1.0);
			}
			else if(toggle.hover==true)
				drawCirc2(toggle.x, toggle.y, 15, 2, "rgb(30,30,44)", 1.0);
			else
				drawCirc2(toggle.x, toggle.y, 15, 2, "rgb(30,30,44)", 1.0);
			ctx.shadowBlur = 0;
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
					var lx = cursorX-150; //right edge
					var rx = cursorX+150; //left edge
					var ty = cursorY-120; //top edge
					if(rx>w){
						rx -= rx-w; //if the right edge is over the page, push it left
						lx = rx-300;
					}
					if(lx<0){
						lx += -lx; //if the left edge is over the page, push it right
						rx = lx+300;
					}
					if(ty<0){
						ty = cursorY+20;
					}
					ctx.globalAlpha = 1.0;
					ctx.fillStyle = "rgb(30,30,44)";
					ctx.beginPath();
					ctx.lineTo(cursorX, cursorY);
					if(ty==cursorY+20){
						ctx.lineTo(cursorX-20, cursorY+20);
						ctx.lineTo(cursorX+20, cursorY+20);
					}
					else{
						ctx.lineTo(cursorX-20, cursorY-20);
						ctx.lineTo(cursorX+20, cursorY-20);
					}
					ctx.lineTo(cursorX, cursorY);
					ctx.fill();
					drawRect2(lx, ty, rx, ty+100, 0, "rgb(50,50,64)", 1); //draw dialogue box
					drawRect2(lx, ty, lx+30, ty+100, 0, "rgb(40,40,54)", 1); //draw dialogue box
					drawRect2(lx, ty, rx, ty+100, 4, "rgb(30,30,44)", 1); //draw dialogue box
					if(object.name=='Unknown' && object.type==1)
						drawText("Star #"+object.id, lx+42.5, ty+40, 30, "rgb(255,255,255)", 'left');
					else
						drawText(object.name, lx+42.5, ty+40, 30, "rgb(255,255,255)", 'left');
					if(object.type==1 || object.type==6) drawText("☉", rx-20, ty+25, 20, "rgb(255,255,255)", 'center');
					else if(object.type==2) drawText("🜨", rx-20, ty+25, 24, "rgb(255,255,255)", 'center');
					else if(object.type==3) drawText("☽", rx-20, ty+25, 18, "rgb(255,255,255)", 'center');
					else if(object.type==4) drawText("♅", rx-20, ty+25, 20, "rgb(255,255,255)", 'center');
					drawLine2(lx+42.5, ty+50, rx-12.5, ty+50, 2, "rgb(255,255,255)", 1);
					if(object.inhabited) drawText("⚘", rx-20, ty+45, 20, "rgb(255,255,255)", 'center');
					else if(object.gate) drawText("☍", rx-20, ty+45, 20, "rgb(255,255,255)", 'center');
					if(object.text1==" " || object.text1=="" || object.text1==null)
						drawText("Unclaimed", lx+42.5, ty+80, 16, "rgb(255,255,255)", 'left');
					else if(object.text1!="" || object.text1!=null)
						drawText(object.text1, lx+42.5, ty+80, 16, "rgb(255,255,255)", 'left');
					if(object.type==1)
						drawText("#"+object.id, rx-12.5, ty+90, 12, "rgb(255,255,255)", 'right');
					if(object.pl==-1) object.pl = Math.round(Math.random());
					if(object.pl==0) drawText("Pl", lx+15, ty+20, 16, "rgb(0,0,0)", 'center');
					else drawText("Pl", lx+15, ty+20, 16, "rgb(255,255,255)", 'center');
					if(object.li==-1) object.li = Math.round(Math.random());
					if(object.li==0) drawText("Li", lx+15, ty+37.5, 16, "rgb(0,0,0)", 'center');
					else drawText("Li", lx+15, ty+37.5, 16, "rgb(255,255,255)", 'center');
					if(object.de==-1) object.de = Math.round(Math.random());
					if(object.de==0) drawText("²H", lx+15, ty+55, 16, "rgb(0,0,0)", 'center');
					else drawText("²H", lx+15, ty+55, 16, "rgb(255,255,255)", 'center');
					if(object.he==-1) object.he = Math.round(Math.random());
					if(object.he==0) drawText("³He", lx+15, ty+72.5, 16, "rgb(0,0,0)", 'center');
					else drawText("³He", lx+15, ty+72.5, 16, "rgb(255,255,255)", 'center');
					if(object.ha==-1) object.ha = Math.round(Math.random());
					if(object.ha==0) drawText("Ha", lx+15, ty+90, 16, "rgb(0,0,0)", 'center');
					else drawText("Ha", lx+15, ty+90, 16, "rgb(255,255,255)", 'center');

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
				drawCirc2(w/2, h/2, fm*22.22, 0, "rgb(0,0,0)", alpha);
				ctx.save();
				ctx.beginPath();
				ctx.arc(w/2,  h/2, fm*22.22, 0, 2 * Math.PI);
				ctx.closePath();
				ctx.clip();
				ctx.globalAlpha = 0.5;
				if(w>(h*2))
					ctx.drawImage(document.getElementById('background'), 0, (h/2)-(w/2), w, (h/2)+(w/2));
				else
					ctx.drawImage(document.getElementById('background'), (w/2)-h, 0, (w/2)+h, h);
				ctx.restore();
				drawCirc2(w/2, h/2, h/2.25, 6, "rgb(30,30,44)", alpha);
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
						drawCirc2(x, y, radius, 2, "rgb(255,255,255)", 0.5);
					else if(planet.klass!="asteroid")
						drawCirc2(x, y, radius, 2, "rgb(255,255,255)", 0.25);
				}
				for(var j=0; j<star.planets.length; j++){
					var planet = star.planets[j];
					var radius = ((star.mass/1.75*fm+(h/5*((planet.r)/star.planets[star.planets.length-1].r))));
					if(planet.hover){
						drawCirc2(x, y, radius, 2, "rgb(255,255,255)", 1.0);
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
					if(planet.klass=="asteroid"){
						drawImage2(x, y, radius*2.125, planet.klass, 1.0); //draw asteroid belt
						// drawCirc2(x, y, radius, 4, 'white', 1.0);
					}
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
			// console.log("drawing rectangle");
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
			// console.log("trying to draw "+image);
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

	{ //interaction functions
		window.addEventListener('touchstart', function(){
  			mobile = true;
		});
		var press = false;
		var sx = sy = 0;
		var startX = startY = 0;
		$(canvas)
		.mousedown(function(e){
			if(moveFree.value==true)
				document.body.style.cursor = '-webkit-grabbing';
		    press = true;
			startX = sx = e.originalEvent.clientX;
			startY = sy = e.originalEvent.clientY;
		})
		.mousemove(function(e){
			cursorX = e.originalEvent.clientX;
			cursorY = e.originalEvent.clientY;
			if(press && moveFree.value==true && focus==null){
				document.body.style.cursor = '-webkit-grabbing';
				offset(ox + (e.originalEvent.clientX - sx), oy + (e.originalEvent.clientY - sy));
			}
			else document.body.style.cursor = 'default';
			sx = e.originalEvent.clientX;
			sy = e.originalEvent.clientY;
			if(focus==null){
				if(!mobile){
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
						}
					}
				}
				//check distance from toggles
				if(Math.sqrt(Math.pow(e.originalEvent.clientX - showClaims.x,2)	+ Math.pow(e.originalEvent.clientY - showClaims.y,2)) < 15)
					showClaims.hover = true;
				else showClaims.hover = false;
				if(Math.sqrt(Math.pow(e.originalEvent.clientX - showGrid.x,2)	+ Math.pow(e.originalEvent.clientY - showGrid.y,2)) < 15)
					showGrid.hover = true;
				else showGrid.hover = false;
				if(Math.sqrt(Math.pow(e.originalEvent.clientX - moveFree.x,2)	+ Math.pow(e.originalEvent.clientY - moveFree.y,2)) < 15)
					moveFree.hover = true;
				else moveFree.hover = false;
			}
			else{
				if(Math.sqrt(Math.pow((sx-(w/2)),2)+Math.pow((sy-(h/2)),2))>(h/2.25)){ //if move outside of focus circle
					exitFocus = true;
					document.body.style.cursor = 'alias';
				}
				else exitFocus = false;
				if(!mobile){
					if(Math.sqrt(Math.pow((e.originalEvent.clientX-(w/2)),2) + Math.pow((e.originalEvent.clientY-(h/2)),2)) < focus.mass*(h/100)){ //if hover over star
						focus.hover = true;
						document.body.style.cursor = 'pointer';
					}
					else{
						focus.hover = false;
						for(var j=0; j<focus.planets.length; j++){
							var planet = focus.planets[j];
							var radius = ((focus.mass/1.75*(h/50)+(h/5*((planet.r)/focus.planets[focus.planets.length-1].r))));
							var px = w/2 - radius * Math.sin((-planet.th*Math.PI)/180); //calculate x-coordinate of planet
							var py = h/2 - radius * Math.cos((-planet.th*Math.PI)/180); //calculate y-coordinate of planet
							// console.log("distance from planet "+planet.name+": "+Math.sqrt(Math.pow(e.originalEvent.clientX-px,2) + Math.pow(e.originalEvent.clientY-py,2)));
							if(Math.sqrt(Math.pow(e.originalEvent.clientX-px,2) + Math.pow(e.originalEvent.clientY-py,2)) < planet.mass*(fm/10)){
								planet.hover = true;
								document.body.style.cursor = 'pointer';
							}
							else planet.hover = false;
						}
					}
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
				if(!mobile && focus.hover && focus.name!="Unknown"){
					press = false;
					window.open("http://createthisworld.wikia.com/wiki/"+focus.name);
				}
			}
			if(startX == e.originalEvent.clientX && startY == e.originalEvent.clientY){
				if(!mobile){
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
				else if(mobile){
					if(focus==null){
						for(var i=0; i<systems.length; ++i){
							if(Math.sqrt(Math.pow((e.originalEvent.clientX - x(systems[i].x)),2)
							+ Math.pow((e.originalEvent.clientY - y(systems[i].y)),2))
							< 16){
								if(systems[i].type!=0){
									if(systems[i].hover==false)
										systems[i].hover = true;
									else{
										systems[i].hover = false;
										focus = systems[i];
									}
								}
							}
							else{
								systems[i].hover = false;
							}
						}
					}
					else{
						if(Math.sqrt(Math.pow((e.originalEvent.clientX-(w/2)),2) + Math.pow((e.originalEvent.clientY-(h/2)),2)) < focus.mass*(h/100)){ //if hover over star
							if(focus.hover==false)
								focus.hover = true;
							else if(focus.name!='Unknown')
								window.open("http://createthisworld.wikia.com/wiki/"+focus.name);
						}
						else{
							focus.hover = false;
							for(var j=0; j<focus.planets.length; j++){
								var planet = focus.planets[j];
								var radius = ((focus.mass/1.75*(h/50)+(h/5*((planet.r)/focus.planets[focus.planets.length-1].r))));
								var px = w/2 - radius * Math.sin((-planet.th*Math.PI)/180); //calculate x-coordinate of planet
								var py = h/2 - radius * Math.cos((-planet.th*Math.PI)/180); //calculate y-coordinate of planet
								if(Math.sqrt(Math.pow(e.originalEvent.clientX-px,2) + Math.pow(e.originalEvent.clientY-py,2)) < planet.mass*(fm/10)){
									if(planet.hover==false)
										planet.hover = true;
									else if(planet.name!='Unknown')
										window.open("http://createthisworld.wikia.com/wiki/"+planet.name);
								}
								else planet.hover = false;
							}
						}
					}
				}
				if(showClaims.hover==true)
					if(showClaims.value==false)
						showClaims.value = true;
					else
						showClaims.value = false;
				if(showGrid.hover==true)
					if(showGrid.value==false)
						showGrid.value = true;
					else
						showGrid.value = false;
				if(moveFree.hover==true)
					if(moveFree.value==false)
						moveFree.value = true;
					else
						moveFree.value = false;
			}
		   	press = false;
		});
		$(window).bind('mousewheel DOMMouseScroll', function(event){
			if(moveFree.value==true){
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
