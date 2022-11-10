
var app = require('http').createServer()
//var SerialPort = require('serialport');
var _ = require('underscore');
var io = require('/usr/local/lib/node_modules/socket.io')(app);
r = require('rethinkdb')
var connection = null;
var conn;

var idpartidoactual='';

 
 
 //var port = new SerialPort('/dev/cu.wchusbserial410', function (err) {
						  //if (err) {
						    //return console.log('Error: ', err.message);
						  //}
						//});



app.listen(5152);

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
   
 	
    io.on('connection', function(socket){
    console.log('a user connected sockect');		 		

			 	 	 //io.emit('mostrar',result);
			 	 	   

				 	 socket.on('cargarequipos', function(data){
				 	 		
				 	 			idpartidoactual = data.idpartido;
				 	 			
								//consulta equipo 1
							    r.db("bk").table('jugadores').filter({equipo:data.equipo1}).orderBy("numero").run(conn, function(err, cursor) {
							   		 if (err) throw err;
								    cursor.toArray(function(err, result) {
								        if (err) throw err;
								        	
								        	

										 	 	 io.emit('mostrar',result);

										 	 	 

											

								        //console.log(JSON.stringify(result, null, 2));
								    });
								});


								//consulta equipo 2
							    r.db("bk").table('jugadores').filter({equipo:data.equipo2}).orderBy("numero").run(conn, function(err, cursor) {
							   		 if (err) throw err;
								    cursor.toArray(function(err, result) {
								        if (err) throw err;
								        	
								        	

										 	 	 io.emit('mostrar2',result);

										 	 	 

											

								        //console.log(JSON.stringify(result, null, 2));
								    });
								});
						
					});	



				 	 socket.on('mostrarequipos', function(data){

				 	 	 r.db("bk").table('equipos').run(conn, function(err, cursor) {
					   		 if (err) throw err;
						    cursor.toArray(function(err, result) {
						        if (err) throw err;

						        	
								 		
								 	 	 io.emit('mostrarequiposclient',result);
 

									

						        //console.log(JSON.stringify(result, null, 2));
						    });
						});
						
					});	 


			 	 	
			 	 	 socket.on('guardarjugador', function(data){
				   		 console.log('message: '+data.player+data.team+data.score+data.id);

				   		 

				   		 	r.db("bk").table('jugadores').filter({id:data.idjuga}).run(conn, function(err, cursor) {
									   		 if (err) throw err;
									   		 	var punticos;
									   		 	var pguardados;
									   		 	var cestaano;

									   		 
									   		    cursor.each(function(error, row) {
										           console.log(row.estadisticas.puntos);
										           pguardados = parseInt(row.estadisticas.puntos);
										           cestaano = parseInt(data.cesta);
										           /* esto es para cuando oprimen el boton de quitar cestas no afecten las estadisticas del jugador
										           if(cestaano<0){
										           	cestaano = 0;
										           }
										           */
										           punticos = parseInt(pguardados+cestaano);

										           console.log(punticos+"nojoda");
										           
										        });
											    cursor.toArray(function(err, result) {
											        if (err) throw err;
											       
											        //console.log(JSON.stringify(result, null, 2));
											        r.db('bk').table("jugadores").filter({id:data.idjuga}).update(
														{estadisticas: {puntos:punticos}}
													).run(conn, function(err, cursor) {
														if(err) throw err;
														//console.log(JSON.stringify(null, 2));
													})
											    });


											    console.log(punticos+"losque se guardarron");
											    
										
						    });

						   r.db('bk').table('partidos').filter(r.row("idjugador").eq(data.idjuga).and(r.row("idpartido").eq(data.idmatch))).run(conn, function(err, cursor) {

						  		// r.db("bk").table('partidos').filter({idjugador:data.idjuga}).and({idpartido:data.idmatch}).run(conn, function(err, cursor) {
						   		

						   		if (err) throw err;
							    cursor.toArray(function(err, result) {
							        if (err) throw err;

							        if (result === undefined || result.length == 0) {
									     
									     r.db('bk').table('partidos').insert([

												{
													"idpartido":data.idmatch,
													"mes":data.mes,
													"idjugador":data.idjuga,
													"nombre":data.nameplayer,
													"numero":data.player,
													"equipo":data.team,
													"estadisticas": {
														"puntos":data.score,
														"bloqueos":data.block,
														"asistencias":data.pass
													} 
												}
											
										]).run(conn, function(err, cursor) {
											if(err) throw err;
											//console.log(JSON.stringify(null, 2));
										})
									}

									else{

											
										r.db('bk').table("partidos").filter({idjugador:data.idjuga}).update(
											{estadisticas: {puntos:data.score,bloqueos:data.block,asistencias:data.pass}}
										).run(conn, function(err, cursor) {
											if(err) throw err;
											//console.log(JSON.stringify(null, 2));
										});


									}

							        //console.log(JSON.stringify(result, null, 2));
							    });
							    
							});

						  


				 	 });

				

					socket.on('guardarjugadorestbk', function(data){
						 r.db("bk").table('jugadores').filter({id:data.idjuga}).run(conn, function(err, cursor) {
									   		 if (err) throw err;
									   		 
									   		 	var bkguardados;
									   		 	var bkano;
									   		 	var bk;

									   		    cursor.each(function(error, row) {
										           bkguardados = parseInt(row.estadisticas.bloqueos);
										           bkano = parseInt(data.block);
										           bk = parseInt(bkguardados+bkano);
										           if(bk<0){
										           	bk = 0;
										           }
											    });
											    cursor.toArray(function(err, result) {
											        if (err) throw err;
											        //console.log(JSON.stringify(result, null, 2));
											        r.db('bk').table("jugadores").filter({id:data.idjuga}).update(
														{estadisticas: {bloqueos:bk}}
													).run(conn, function(err, cursor) {
														if(err) throw err;
														//console.log(JSON.stringify(null, 2));
													})
											    });

						});
					});

					socket.on('guardarjugadorestass', function(data){
						 r.db("bk").table('jugadores').filter({id:data.idjuga}).run(conn, function(err, cursor) {
									   		 if (err) throw err;
									   		 
									   		 	var passguardados;
									   		 	var passano;
									   		 	var pass;

									   		    cursor.each(function(error, row) {
									   		       passguardados = parseInt(row.estadisticas.asistencias);
										           passano = parseInt(data.pass);
										           pass = parseInt(passguardados+passano);
										           if(pass<0){
										           	pass = 0;
										           }

											    });
											    cursor.toArray(function(err, result) {
											        if (err) throw err;
											        //console.log(JSON.stringify(result, null, 2));
											        r.db('bk').table("jugadores").filter({id:data.idjuga}).update(
														{estadisticas: {asistencias:pass}}
													).run(conn, function(err, cursor) {
														if(err) throw err;
														//console.log(JSON.stringify(null, 2));
													})
											    });

						});
					});



					socket.on('displaypuntos', function(data){
						io.emit('mostrarpuntos',data);
						console.log('equipo:'+data);
					});

					socket.on('controltime', function(data){
						console.log('aqyu:');
						io.emit('funciocontrol',data);
						
					});

					

					console.log(idpartidoactual);
					var mejores = [];
					var elmejor;
					var reves;


					socket.on('cargarmejores', function(data){
							r.db('bk').table("partidos").filter({idpartido:data.id}).run(conn, function(err, cursor) {
											 if (err) throw err;
											 				



											    cursor.toArray(function(err, result) {
											        if (err) throw err;
											       // console.log(JSON.stringify(result, null, 2)); 

											        elmejor = _.sortBy(result,function (client){ 
													    return client.estadisticas.puntos;
													});

													reves = elmejor.reverse().splice(0, 4);
											       	console.log(JSON.stringify(reves, null, 2)); 
											       	io.emit('viewmejores',reves);
											      	// console.log('coma'+reves);
											    });
											   
											   // mejores = [];
						        								
															
									})
						
					});

					socket.on('switchvistaserver', function(data){
						io.emit('switchvista',data);
						
					});


					socket.on('agregarplayerequipo', function(data){
						
						  r.db('bk').table('jugadores').insert([

												{
													"nombre":data.nombre,
													"numero":data.numero,
													"equipo":data.equipo,
													"estadisticas": {
														"puntos":0,
														"bloqueos":0,
														"asistencias":0
													},
													"fotourl":  "img/foto.jpg"
												}
											
										]).run(conn, function(err, cursor) {
											if(err) throw err;
											//console.log(JSON.stringify(null, 2));
										})
						
					});

				    socket.on('cronometroserver', function(data){

				    	var sec = data.segundos;
				    	var duino = parseInt(data.segundos);
				    	//var sec = parseInt(data.segundos) - 1;

				    	if(data.segundos==0){
				    		sec = 0;
				    	}
					//	io.emit('cronometrocliente',{segundos:sec});
						io.emit('pintarnumero',{ message: '1' });
						//io.emit('pintarnumero',{segundos:sec});

					
							  
							//var outString = String.fromCharCode(sec);
							//port.write(outString);
							
					});

					socket.on('potencia', function (d) {
						console.log(d);
						var numi = 1;
						var outString = String.fromCharCode(numi);

						//io.emit('mensajeservidor', {
						//	mensaje: ""+numi+""
						//});
					});

					

				   
				

				    
			

	});
  	
			    	 
  
})

