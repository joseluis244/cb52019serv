const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/RB2', {useNewUrlParser: true});
const clientes = require("./models/clientes")
const usuarios = require('./models/usuarios')
const passport = require('passport')
const session = require('express-session')
const LocalStrategy = require('passport-local').Strategy
const inicio = require('./test')


passport.use(new LocalStrategy(
    function (username, password, done) {
        usuarios.findOne({ username: username, password:password,"estado": { $gte: 2.0 }}, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrecto' });
            }
            return done(null, user);
        });
    }
));


app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({ secret: "cats" }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    usuarios.findById(id, function (err, user) {
        done(err, user);
    });
});

// parse application/json
//app.use(bodyParser.json())

app.get('/app/',(req,res)=>{
    if(!req.user){
        clientes.find({ "distribuye": { $exists: true } },{ "_id": 1, "nombre": 1, "direccion": 1, "ultima_visita": 1},(err,clientes)=>{
            res.send(clientes)
        })
    }
    else{
        if(req.user.tipo === 'adm'){
            clientes.find({ "distribuye": { $exists: true } },{ "_id": 1, "nombre": 1, "direccion": 1, "ultima_visita": 1},(err,clientes)=>{
                res.send(clientes)
            })
        }
        else{
            clientes.find({ "distribuye": { $exists: true },"ciudad": req.user.ciudad },{ "_id": 1, "nombre": 1, "direccion": 1, "ultima_visita": 1},(err,clientes)=>{
                res.send(clientes)
            })
        }
    }
    console.log(req.user)
})

app.get('/app/dash',async (req,res)=>{
    let dash = await inicio()
    res.json(dash)
})

app.get('/app/auth',async (req,res)=>{
    if(!req.user){
        res.send({auth:false})
    }
    else{
        res.send({auth:true})
    }
})

app.get('/app/gpserror/:id', async (req,res)=>{
    clientes.findById(req.params.id,{GPS:1,_id:0},(err,cli)=>{
        res.send(cli)
    })
})

app.get('/app/corregirencuesta/:id', async (req,res)=>{
    let cli = await clientes.findById(req.params.id)
    res.json(cli)
})

app.put('/app/actualizarcontacto', async (req,res)=>{
    console.log(req.body)
    await clientes.updateOne({_id:req.body.id},{"contacto.0.C_nombre":req.body.nombre,"contacto.0.C_dato":req.body.telefono})
})

app.post('/app/cliente',(req,res)=>{
    clientes.findById(req.body.id,(err,cliente)=>{
        res.send(cliente)
    })
})

app.post('/app/encuesta',async (req,res)=>{
    console.log(req.body.id)
    console.log('guardando '+new Date())
    let Ndb = {
        "materiales.0.L_material":req.body.coolers,
        "materiales.1.L_material":req.body.visibility,
        "productos.0.P_precio":req.body.precios[0],
        "productos.1.P_precio":req.body.precios[1],
        "productos.2.P_precio":req.body.precios[2],
        "productos.3.P_precio":req.body.precios[3],
        "productos.4.P_precio":req.body.precios[4],
        distribuidor:req.body.distribuidor,
        comentario:req.body.comentarios,
        distribuye:req.body.vende,
        frio:req.body.frio,
        ultima_visita:req.body.fecha
    }
    console.log(Ndb)
    await clientes.updateOne({_id:req.body.id},{$set:Ndb})
    let vitacora = {
        GPS:req.body.GPS,
        fecha:req.body.fecha,
        distribuye:req.body.vende,
        distribuidor:req.body.distribuidor,
        materiales:[
            {N_material:'Cooler',L_material:req.body.coolers},
            {N_material:'Visibility',L_material:req.body.visibility}
        ],
        productos:[
            {P_nombre:"Red Bull",P_precio:req.body.precios[0]},
            {P_nombre:"Rush",P_precio:req.body.precios[1]},
            {P_nombre:"Ciclon 500 ML",P_precio:req.body.precios[2]},
            {P_nombre:"Black",P_precio:req.body.precios[3]},
            {P_nombre:"Monster",P_precio:req.body.precios[4]},
        ],
        comentario:req.body.comentarios
    }
    await clientes.updateOne({_id:req.body.id},{$push:{vitacora:vitacora}})
    res.send({estado:'listo'})
})


app.post('/app/corregir',async (req,res)=>{
    console.log('corregido '+new Date())
    let Ndb = {
        "materiales.0.L_material":req.body.coolers,
        "materiales.1.L_material":req.body.visibility,
        "productos.0.P_precio":req.body.precios[0],
        "productos.1.P_precio":req.body.precios[1],
        "productos.2.P_precio":req.body.precios[2],
        "productos.3.P_precio":req.body.precios[3],
        "productos.4.P_precio":req.body.precios[4],
        distribuidor:req.body.distribuidor,
        comentario:req.body.comentarios,
        distribuye:req.body.vende,
        frio:req.body.frio
    }
    await clientes.updateOne({_id:req.body.id},Ndb)
    let cli2 = await clientes.findOne({_id:req.body.id},{vitacora:1,_id:0})
    let nueva_vit = cli2.vitacora

        nueva_vit[nueva_vit.length-1].distribuye = req.body.vende
        nueva_vit[nueva_vit.length-1].distribuidor=req.body.distribuidor
        nueva_vit[nueva_vit.length-1].materiales=[
            {N_material:'Cooler',L_material:req.body.coolers},
            {N_material:'Visibility',L_material:req.body.visibility}
        ]
        nueva_vit[nueva_vit.length-1].productos=[
            {P_nombre:"Red Bull",P_precio:req.body.precios[0]},
            {P_nombre:"Rush",P_precio:req.body.precios[1]},
            {P_nombre:"Ciclon 500 ML",P_precio:req.body.precios[2]},
            {P_nombre:"Black",P_precio:req.body.precios[3]},
            {P_nombre:"Monster",P_precio:req.body.precios[4]},
        ]
        nueva_vit[nueva_vit.length-1].comentario=req.body.comentarios



    await clientes.updateOne({_id:req.body.id},{"vitacora":nueva_vit})
    res.send({estado:'listo'})
})


app.post('/app/nuevoregistro',async (req,res)=>{
    console.log(req.body)
    let ncli = new clientes({GPS:req.body.GPS,cli_id:req.body.datos.cli_id,nombre:req.body.datos.nombre,ciudad:req.body.datos.ciudad,direccion:req.body.datos.direccion,tipo:req.body.datos.tipo,contacto:req.body.contacto})
    ncli.save()
    res.send({id:ncli._id})
})

app.get('/app/bien',(req,res)=>{
    console.log(req.user)
    res.send({login:true})
})
app.get('/app/mal',(req,res)=>{
    console.log('mal')
    res.send({login:false})
})

app.post('/app/login',
  passport.authenticate('local', { successRedirect: '/app/bien',
                                   failureRedirect: '/app/mal'})
);

app.listen(4000);