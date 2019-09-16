const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/RB2', {useNewUrlParser: true});
const clientes = require("./models/clientes")
const math = require('mathjs')



async function inicio(){
    const listacoolers = ['Propio', 'Can Cooler', 'Small Open Front', 'Refuel Cooler', 'Baby Cooler', 'Equipo de la competencia', 'Mega Glass Door', 'Slim Cooler', 'Fast Lane Open', 'Slim Fast Lane']
    const listavisibility = ['Colgante', 'Cartoon', 'Carrileras', 'Parasite 4Pack', 'Sticker de lata', 'Lata Aluminio', 'Two Cans', 'Dispensador Lata', 'Marca Precio', 'Sticky shlef', 'Parasite SC', 'Rack']

    let clientes_todo = await clientes.find({ "distribuye": { $exists: true } })
    let registrados = clientes_todo.length
    let vende_redbull = 0
    let presencia = [0,0,0,0]
    let tipos = [0,0,0,0,0,0,0,0]
    let coolers = new Array(listacoolers.length).fill(0);
    let visibility = new Array(listavisibility.length).fill(0);
    let moda = [[],[],[],[],[]]
    let moda_cantidad = [0,0,0,0,0]
    for(let i=0;i<=clientes_todo.length-1;i++){
        clientes_todo[i].distribuye?vende_redbull++:null
        clientes_todo[i].productos[1].P_precio>0?presencia[0]++:null
        clientes_todo[i].productos[2].P_precio>0?presencia[1]++:null
        clientes_todo[i].productos[3].P_precio>0?presencia[2]++:null
        clientes_todo[i].productos[4].P_precio>0?presencia[3]++:null
        switch(clientes_todo[i].tipo){
            case 'Licoreria':
                tipos[0]++
            break;
            case 'Micromercado':
                tipos[1]++
            break;
            case 'Tienda de Barrio':
                tipos[2]++
            break;
            case 'Kiosko':
                tipos[3]++
            break;
            case 'Famacia':
                tipos[4]++
            break;
            case 'Otro Impulso':
                tipos[5]++
            break;
            case 'Mayorista':
                tipos[6]++
            break;
            case 'Minorista':
                tipos[7]++
            break;
        }
        for(let j=0;j<=4;j++){
            if(clientes_todo[i].productos[j].P_precio > 0){
                moda[j].push( clientes_todo[i].productos[j].P_precio )
            }
        }
        clientes_todo[i].materiales[0].L_material.map((item)=>(
            coolers[listacoolers.indexOf(item)]++
            ))
        clientes_todo[i].materiales[1].L_material.map((item)=>(
            visibility[listavisibility.indexOf(item)]++
            ))
    }
    moda_cantidad=[math.mode(moda[0])[0],math.mode(moda[1])[0],math.mode(moda[2])[0],math.mode(moda[3])[0],math.mode(moda[4])[0]]
    return(
        {
            registrados:registrados,
            vende_redbull:vende_redbull,
            presencia:presencia,
            tipos:tipos,
            coolers:coolers,
            visibility:visibility,
            moda_cantidad:moda_cantidad
        }
    )
}

module.exports = inicio