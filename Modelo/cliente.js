const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    cedula: { type: String},
    apellido: { type: String, required: true },
    telefono: { type: String },
    direccion: { type: String },
    fechaRegistro: { type: Date, default: Date.now },
    montoTotalDeudas: { type: Number, default: 0 }
  });
  
  
  module.exports = mongoose.model('Cliente', ClienteSchema);
  
  