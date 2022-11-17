var app = require("http").createServer();
//var SerialPort = require('serialport');
var _ = require("underscore");
var io = require("socket.io")(app, { cors: { origin: "http://54.159.18.9" } });
r = require("rethinkdb");
var connection = null;
var conn;

var idpartidoactual = "";

app.listen(5152);

//var port = new SerialPort('/dev/cu.wchusbserial410', function (err) {
//if (err) {
//return console.log('Error: ', err.message);
//}
//});

r.connect({ host: "localhost", port: 28015 }, function (err, conn) {
  if (err) throw err;
  connection = conn;

  let gameid = (Math.random() + 1).toString(36).slice(2, 18);

  function salarandom() {
    let gameid = (Math.random() + 1).toString(36).slice(2, 18);
    return gameid;
  }

  io.sockets.on("connection", function (socket) {
    let sesionid = socket.id;

    let salita = salarandom();

    //socket.join('emili');
    console.log(salita + "SESIONIDDD");

    console.log("a user connected sockect");

    //io.emit('mostrar',result);

    // se unen a la misma sala
    socket.on("crearsala", function (data) {
      //io.sockets.join('emili');

      socket.join(data.id);
      console.log(data.id + "_la creacion de la sala");
      // console.log(salita+'SALA DESDE SERVER');
      //io.in(data.id).emit('obtenersala', data.id);

      //io.emit('obtenersala',result);
    });

    socket.on("cargarequipos", function (data) {
      idpartidoactual = data.idpartido;

      //consulta equipo 1
      r.db("bk")
        .table("jugadores")
        .filter({ equipo: data.equipo1 })
        .orderBy("numero")
        .run(conn, function (err, cursor) {
          if (err) throw err;
          cursor.toArray(function (err, result) {
            if (err) throw err;

            //io.in(sesionid).emit('mostrar', result);
            //io.emit('mostrar',result);
            io.in(data.idroom).emit("mostrar", result);

            //console.log(JSON.stringify(result, null, 2));
          });
        });

      //consulta equipo 2
      r.db("bk")
        .table("jugadores")
        .filter({ equipo: data.equipo2 })
        .orderBy("numero")
        .run(conn, function (err, cursor) {
          if (err) throw err;
          cursor.toArray(function (err, result) {
            if (err) throw err;

            // io.in(sesionid).emit('mostrar2', result);
            io.in(data.idroom).emit("mostrar2", result);

            //console.log(JSON.stringify(result, null, 2));
          });
        });

      io.emit("livegames", {
        equipo1: data.equipo1,
        equipo2: data.equipo2,
        idgame: data.idpartido,
        idroom: data.idroom,
      });
    });

    socket.on("mostrarequipos", function (sala) {
      // el cliente se une a la sala con el id creado anteriormente
      //socket.join(gameid);

      console.log(sala + "MANOOOOO");

      r.db("bk")
        .table("equipos")
        .run(conn, function (err, cursor) {
          if (err) throw err;
          cursor.toArray(function (err, result) {
            if (err) throw err;

            io.in(sala).emit("mostrarequiposclient", result);
            //  io.in(sesionid).emit('mostrarequiposclient', result);

            //console.log(JSON.stringify(result, null, 2));
          });
        });
    });

    socket.on("guardarjugador", function (data) {
      console.log(
        "message: " +
          data.player +
          data.team +
          data.score +
          data.id +
          "IDROOM" +
          data.idroom
      );

      r.db("bk")
        .table("jugadores")
        .filter({ id: data.idjuga })
        .run(conn, function (err, cursor) {
          if (err) throw err;
          var punticos;
          var pguardados;
          var cestaano;

          cursor.each(function (error, row) {
            console.log(row.estadisticas.puntos);
            pguardados = parseInt(row.estadisticas.puntos);
            cestaano = parseInt(data.cesta);
            /* esto es para cuando oprimen el boton de quitar cestas no afecten las estadisticas del jugador
										           if(cestaano<0){
										           	cestaano = 0;
										           }
										           */
            punticos = parseInt(pguardados + cestaano);

            console.log(punticos + "nojoda");
          });
          cursor.toArray(function (err, result) {
            if (err) throw err;

            //console.log(JSON.stringify(result, null, 2));
            r.db("bk")
              .table("jugadores")
              .filter({ id: data.idjuga })
              .update({ estadisticas: { puntos: punticos } })
              .run(conn, function (err, cursor) {
                if (err) throw err;
                //console.log(JSON.stringify(null, 2));
              });
          });

          console.log(punticos + "losque se guardarron");
        });

      r.db("bk")
        .table("partidos")
        .filter(
          r
            .row("idjugador")
            .eq(data.idjuga)
            .and(r.row("idpartido").eq(data.idmatch))
        )
        .run(conn, function (err, cursor) {
          // r.db("bk").table('partidos').filter({idjugador:data.idjuga}).and({idpartido:data.idmatch}).run(conn, function(err, cursor) {

          if (err) throw err;
          cursor.toArray(function (err, result) {
            if (err) throw err;

            if (result === undefined || result.length == 0) {
              r.db("bk")
                .table("partidos")
                .insert([
                  {
                    idpartido: data.idmatch,
                    mes: data.mes,
                    idjugador: data.idjuga,
                    nombre: data.nameplayer,
                    numero: data.player,
                    equipo: data.team,
                    estadisticas: {
                      puntos: data.score,
                      bloqueos: data.block,
                      asistencias: data.pass,
                    },
                  },
                ])
                .run(conn, function (err, cursor) {
                  if (err) throw err;
                  //console.log(JSON.stringify(null, 2));
                });
            } else {
              r.db("bk")
                .table("partidos")
                .filter({ idjugador: data.idjuga })
                .update({
                  estadisticas: {
                    puntos: data.score,
                    bloqueos: data.block,
                    asistencias: data.pass,
                  },
                })
                .run(conn, function (err, cursor) {
                  if (err) throw err;
                  //console.log(JSON.stringify(null, 2));
                });
            }

            const listat = {
              idpartido: data.idmatch,
              mes: data.mes,
              idjugador: data.idjuga,
              nombre: data.nameplayer,
              numero: data.player,
              equipo: data.team,
              estadisticas: {
                cestas: data.cesta,
                puntos: data.score,
                bloqueos: data.block,
                asistencias: data.pass,
              },
            };

            io.in(data.idroom).emit("statsprint", listat);

            //console.log(JSON.stringify(result, null, 2));
          });
        });
    });

    socket.on("guardarjugadorestbk", function (data) {
      r.db("bk")
        .table("jugadores")
        .filter({ id: data.idjuga })
        .run(conn, function (err, cursor) {
          if (err) throw err;

          var bkguardados;
          var bkano;
          var bk;

          cursor.each(function (error, row) {
            bkguardados = parseInt(row.estadisticas.bloqueos);
            bkano = parseInt(data.block);
            bk = parseInt(bkguardados + bkano);
            if (bk < 0) {
              bk = 0;
            }
          });
          cursor.toArray(function (err, result) {
            if (err) throw err;
            //console.log(JSON.stringify(result, null, 2));
            r.db("bk")
              .table("jugadores")
              .filter({ id: data.idjuga })
              .update({ estadisticas: { bloqueos: bk } })
              .run(conn, function (err, cursor) {
                if (err) throw err;
                //console.log(JSON.stringify(null, 2));
              });
          });
        });
    });

    socket.on("guardarjugadorestass", function (data) {
      r.db("bk")
        .table("jugadores")
        .filter({ id: data.idjuga })
        .run(conn, function (err, cursor) {
          if (err) throw err;

          var passguardados;
          var passano;
          var pass;

          cursor.each(function (error, row) {
            passguardados = parseInt(row.estadisticas.asistencias);
            passano = parseInt(data.pass);
            pass = parseInt(passguardados + passano);
            if (pass < 0) {
              pass = 0;
            }
          });
          cursor.toArray(function (err, result) {
            if (err) throw err;
            //console.log(JSON.stringify(result, null, 2));
            r.db("bk")
              .table("jugadores")
              .filter({ id: data.idjuga })
              .update({ estadisticas: { asistencias: pass } })
              .run(conn, function (err, cursor) {
                if (err) throw err;
                //console.log(JSN.srinifynul, 2));
              });
          });
        });
    });

    socket.on("displaypuntos", function (data) {
      //socket.join(data.sala);
      console.log("/////");
      console.log(data.sala + "datos de salitassss");
      //io.in(data.sala).emit('mostrarpuntos', data);
      //io.in(data.sala).emit('mostrarpuntos', data);
      io.sockets.in(data.sala).emit("mostrarpuntos", data);
      //io.emit('mostrarpuntos',data);
      console.log("equipo:" + data);
    });

    socket.on("controltime", function (data) {
      console.log("aqyu:");

      if (data.funcion == "reset") {
        io.emit("startled", data);
      }
      if (data.funcion == "reset14") {
        io.emit("startled14", data);
      }
      if (data.funcion == "pausar") {
        io.emit("pararled", data);
      }
      if (data.funcion == "start") {
        io.emit("playled", data);
      }
      //io.emit('funciocontrol',data);
    });

    socket.on("controltime2", function (data) {
      console.log("aqyu:");

      io.emit("funciocontrol", data);

      if (data.funcion == "pausar") {
        io.emit("pararled", data);
      }
    });

    console.log(idpartidoactual);
    var mejores = [];
    var elmejor;
    var reves;

    socket.on("cargarmejores", function (data) {
      r.db("bk")
        .table("partidos")
        .filter({ idpartido: data.id })
        .run(conn, function (err, cursor) {
          if (err) throw err;

          cursor.toArray(function (err, result) {
            if (err) throw err;
            // console.log(JSON.stringify(result, null, 2));

            elmejor = _.sortBy(result, function (client) {
              return client.estadisticas.puntos;
            });

            reves = elmejor.reverse().splice(0, 4);
            console.log(JSON.stringify(reves, null, 2));
            io.emit("viewmejores", reves);
            // console.log('coma'+reves);
          });

          // mejores = [];
        });
    });

    socket.on("switchvistaserver", function (data) {
      io.emit("switchvista", data);
    });

    socket.on("agregarplayerequipo", function (data) {
      r.db("bk")
        .table("jugadores")
        .insert([
          {
            nombre: data.nombre,
            numero: data.numero,
            equipo: data.equipo,
            estadisticas: {
              puntos: 0,
              bloqueos: 0,
              asistencias: 0,
            },
            fotourl: "img/foto.jpg",
          },
        ])
        .run(conn, function (err, cursor) {
          if (err) throw err;
          //console.log(JSON.stringify(null, 2));
        });
    });

    socket.on("cronometroserver", function (data) {
      var sec = data.segundos;
      console.log(data);
      //var sec = parseInt(data.segundos) - 1;

      if (data.segundos == 0) {
        sec = 0;
      }
      //io.emit('cronometrocliente',{segundos:sec});

      var numi = 1;
      var outString = String.fromCharCode(numi);

      //var outString = String.fromCharCode(sec);
      //port.write(outString);
    });

    socket.on("potencia", function (d) {
      console.log(d);
      //io.emit('cronometrocliente',{segundos:d.status});
    });

    socket.on("nuevo", function (d) {
      console.log(d.daticos);
      var numi = 1;
    });

    socket.on("disconnect", function () {
      console.log("a user disconnected sockect");
    });
  });
});
